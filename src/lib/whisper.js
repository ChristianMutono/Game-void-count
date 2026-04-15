import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

// Performance: use SIMD + all available cores on the WASM backend. These
// are no-ops on browsers without crossOriginIsolation (threads disabled),
// but the SIMD path and numThreads=1 is still faster than the scalar default.
if (env.backends?.onnx?.wasm) {
  try {
    const cores = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) : 4;
    env.backends.onnx.wasm.numThreads = Math.min(4, cores);
    env.backends.onnx.wasm.simd = true;
  } catch (_) { /* noop */ }
}

async function hasWebGPU() {
  try {
    if (!('gpu' in navigator)) return false;
    const adapter = await navigator.gpu.requestAdapter();
    return !!adapter;
  } catch (_) { return false; }
}

// Swap the active model by setting localStorage.voidcount_asr_model to one of
// the keys below (e.g. in devtools) — default is whisper-base.en. See the
// TAD §7 "Voice tuning" section for full trade-off notes.
const MODELS = {
  'whisper-base':   { id: 'Xenova/whisper-base.en',              family: 'whisper' },
  'distil-whisper': { id: 'Xenova/distil-small.en',              family: 'whisper' },
  'whisper-tiny':   { id: 'Xenova/whisper-tiny.en',              family: 'whisper' },
  'moonshine':      { id: 'onnx-community/moonshine-base-ONNX',  family: 'moonshine' },
  // 'digit-spelling' is handled outside this registry — see src/lib/digitSpelling.js
};
const DEFAULT_MODEL_KEY = 'whisper-base';

function getActiveModel() {
  try {
    const key = localStorage.getItem('voidcount_asr_model');
    if (key && MODELS[key]) return { key, ...MODELS[key] };
  } catch (_) { /* noop */ }
  return { key: DEFAULT_MODEL_KEY, ...MODELS[DEFAULT_MODEL_KEY] };
}

let pipelinePromise = null;
let loadedKey = null;
let modelReady = false;
let loadProgress = 0;
const progressListeners = new Set();

function notifyProgress(pct) {
  loadProgress = pct;
  for (const fn of progressListeners) fn(pct);
}

export function onLoadProgress(fn) {
  progressListeners.add(fn);
  fn(loadProgress);
  return () => progressListeners.delete(fn);
}

export function isModelReady() {
  return modelReady;
}

async function buildPipeline(active) {
  const progress_callback = (p) => {
    if (p.status === 'progress' && typeof p.progress === 'number') {
      notifyProgress(p.progress);
    } else if (p.status === 'ready' || p.status === 'done') {
      notifyProgress(100);
    }
  };
  const baseOpts = { quantized: true, progress_callback };

  if (await hasWebGPU()) {
    try {
      return await pipeline('automatic-speech-recognition', active.id, {
        ...baseOpts,
        device: 'webgpu',
      });
    } catch (err) {
      console.warn('[whisper] WebGPU pipeline failed, falling back to WASM:', err);
    }
  }
  return pipeline('automatic-speech-recognition', active.id, baseOpts);
}

async function prewarm(asr) {
  try {
    const silent = new Float32Array(16000);
    await asr(silent, {
      chunk_length_s: 5,
      stride_length_s: 0,
      language: 'english',
      task: 'transcribe',
      max_new_tokens: 4,
      num_beams: 1,
    });
  } catch (_) { /* noop */ }
}

export function loadWhisper() {
  const active = getActiveModel();
  if (pipelinePromise && loadedKey === active.key) return pipelinePromise;
  modelReady = false;
  loadProgress = 0;
  loadedKey = active.key;
  pipelinePromise = buildPipeline(active).then((asr) => {
    modelReady = true;
    notifyProgress(100);
    // Background pre-warm: JIT-compiles the WASM kernels and allocates the
    // decoder KV-cache buffers so the first real transcription isn't paying
    // that one-time cost inline. Fire-and-forget — user is typically still
    // on the menu while this completes.
    setTimeout(() => prewarm(asr), 100);
    return asr;
  }).catch((err) => {
    pipelinePromise = null;
    loadedKey = null;
    throw err;
  });
  return pipelinePromise;
}

function peakNormalize(float32, target = 0.95) {
  let max = 0;
  for (let i = 0; i < float32.length; i++) {
    const a = Math.abs(float32[i]);
    if (a > max) max = a;
  }
  if (max < 1e-6) return float32;
  const scale = target / max;
  const out = new Float32Array(float32.length);
  for (let i = 0; i < float32.length; i++) out[i] = float32[i] * scale;
  return out;
}

function trimSilence(float32, sampleRate, threshold = 0.02, paddingMs = 50) {
  const windowSize = Math.max(1, Math.floor(sampleRate * 0.02));
  const rmsAt = (i) => {
    const end = Math.min(i + windowSize, float32.length);
    let sum = 0;
    for (let j = i; j < end; j++) sum += float32[j] * float32[j];
    return Math.sqrt(sum / (end - i));
  };

  let start = 0;
  for (let i = 0; i < float32.length; i += windowSize) {
    if (rmsAt(i) > threshold) { start = i; break; }
  }
  let end = float32.length;
  for (let i = float32.length - windowSize; i >= 0; i -= windowSize) {
    if (rmsAt(i) > threshold) { end = Math.min(float32.length, i + windowSize); break; }
  }
  if (end <= start) return float32;

  const pad = Math.floor(sampleRate * (paddingMs / 1000));
  start = Math.max(0, start - pad);
  end = Math.min(float32.length, end + pad);
  return float32.slice(start, end);
}

function ensureMinimumLength(float32, sampleRate, minSeconds = 1.0) {
  const target = Math.floor(sampleRate * minSeconds);
  if (float32.length >= target) return float32;
  const out = new Float32Array(target);
  const offset = Math.floor((target - float32.length) / 2);
  out.set(float32, offset);
  return out;
}

async function blobToMono16kFloat32(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const decodeCtx = new AudioCtx();
  const decoded = await decodeCtx.decodeAudioData(arrayBuffer);
  decodeCtx.close();

  const targetRate = 16000;
  let mono;
  if (decoded.sampleRate === targetRate && decoded.numberOfChannels === 1) {
    mono = decoded.getChannelData(0);
  } else {
    const offline = new OfflineAudioContext(
      1,
      Math.ceil(decoded.duration * targetRate),
      targetRate
    );
    const src = offline.createBufferSource();
    src.buffer = decoded;
    src.connect(offline.destination);
    src.start(0);
    const rendered = await offline.startRendering();
    mono = rendered.getChannelData(0);
  }

  const trimmed = trimSilence(mono, targetRate);
  const normalized = peakNormalize(trimmed);
  return ensureMinimumLength(normalized, targetRate, 1.0);
}

export async function transcribe(blob) {
  const asr = await loadWhisper();
  const audio = await blobToMono16kFloat32(blob);
  const result = await asr(audio, {
    chunk_length_s: 5,
    stride_length_s: 0,
    language: 'english',
    task: 'transcribe',
    // Decoder speedups: numbers 1–250 decode to ≤4 tokens, so we cap far
    // below the 448-token default. Greedy decoding (no beams) halves decoder
    // work again.
    max_new_tokens: 24,
    num_beams: 1,
    no_repeat_ngram_size: 2,
  });
  return (result?.text || '').trim();
}

export function getActiveModelKey() {
  // Read the raw key from storage so callers can distinguish digit-spelling
  // (which has no entry in MODELS and uses a different backend entirely)
  // from the whisper family. Falls back to the default if nothing is set.
  try {
    const stored = localStorage.getItem('voidcount_asr_model');
    if (stored) return stored;
  } catch (_) { /* noop */ }
  return DEFAULT_MODEL_KEY;
}

export const AVAILABLE_MODELS = Object.keys(MODELS);
