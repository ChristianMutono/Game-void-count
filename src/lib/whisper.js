import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL = 'Xenova/whisper-tiny.en';

let pipelinePromise = null;
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

export function loadWhisper() {
  if (pipelinePromise) return pipelinePromise;
  pipelinePromise = pipeline('automatic-speech-recognition', MODEL, {
    progress_callback: (p) => {
      if (p.status === 'progress' && typeof p.progress === 'number') {
        notifyProgress(p.progress);
      } else if (p.status === 'ready' || p.status === 'done') {
        notifyProgress(100);
      }
    },
  }).then((asr) => {
    modelReady = true;
    notifyProgress(100);
    return asr;
  }).catch((err) => {
    pipelinePromise = null;
    throw err;
  });
  return pipelinePromise;
}

async function blobToMono16kFloat32(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const decodeCtx = new AudioCtx();
  const decoded = await decodeCtx.decodeAudioData(arrayBuffer);
  decodeCtx.close();

  const targetRate = 16000;
  if (decoded.sampleRate === targetRate && decoded.numberOfChannels === 1) {
    return decoded.getChannelData(0);
  }

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
  return rendered.getChannelData(0);
}

export async function transcribe(blob) {
  const asr = await loadWhisper();
  const audio = await blobToMono16kFloat32(blob);
  const result = await asr(audio, {
    chunk_length_s: 5,
    stride_length_s: 0,
    language: 'english',
    task: 'transcribe',
  });
  return (result?.text || '').trim();
}
