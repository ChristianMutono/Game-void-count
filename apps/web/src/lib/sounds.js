let _ctx = null;
let _muted = false;
let _sfxVolume = parseFloat(localStorage.getItem('voidcount_sfx_volume') ?? '0.85');
let _musicVolume = parseFloat(localStorage.getItem('voidcount_music_volume') ?? '0.85');

const _audioRegistry = new Set();
const _pausedByVisibility = new WeakSet();

export function registerAudio(el) {
  if (el) _audioRegistry.add(el);
}
export function unregisterAudio(el) {
  _audioRegistry.delete(el);
  _pausedByVisibility.delete(el);
}

function isTabHidden() {
  return typeof document !== 'undefined' && document.hidden === true;
}

function getCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended' && !isTabHidden()) _ctx.resume();
  return _ctx;
}

let _visibilityBound = false;
export function installVisibilityMute() {
  if (_visibilityBound || typeof document === 'undefined') return;
  _visibilityBound = true;
  const handler = () => {
    if (document.hidden) {
      for (const el of _audioRegistry) {
        if (!el.paused) {
          _pausedByVisibility.add(el);
          try { el.pause(); } catch (_) { /* noop */ }
        }
      }
      if (_ctx && _ctx.state === 'running') {
        _ctx.suspend().catch(() => { /* noop */ });
      }
    } else {
      for (const el of _audioRegistry) {
        if (_pausedByVisibility.has(el)) {
          _pausedByVisibility.delete(el);
          el.play().catch(() => { /* browser may still gate on user gesture */ });
        }
      }
      if (_ctx && _ctx.state === 'suspended') {
        _ctx.resume().catch(() => { /* noop */ });
      }
    }
  };
  document.addEventListener('visibilitychange', handler);
}

// Pre-unlock AudioContext on first user interaction so all sounds work immediately
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    getCtx();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('wheel', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);
  window.addEventListener('wheel', unlockAudio);
}

function tone(freq, dur, type = 'square', vol = 0.12, t0 = 0) {
  if (_muted) return;
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.connect(g); g.connect(c.destination);
    osc.type = type; osc.frequency.value = freq;
    const t = c.currentTime + t0;
    const v = vol * _sfxVolume;
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t); osc.stop(t + dur);
  } catch(e) {}
}

function sweep(freqStart, freqEnd, dur, type = 'square', vol = 0.15, t0 = 0) {
  if (_muted) return;
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.connect(g); g.connect(c.destination);
    osc.type = type;
    const t = c.currentTime + t0;
    osc.frequency.setValueAtTime(freqStart, t);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const v = vol * _sfxVolume;
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t); osc.stop(t + dur);
  } catch(e) {}
}

export const sounds = {
  submit: () => {
    tone(660, 0.06);
    tone(990, 0.08, 'square', 0.1, 0.05);
  },
  cpuMove: () => {
    tone(330, 0.1, 'sawtooth', 0.1);
    tone(220, 0.07, 'sawtooth', 0.08, 0.09);
  },
  error: () => {
    sweep(440, 220, 0.18, 'square', 0.2);
    sweep(220, 100, 0.22, 'square', 0.18, 0.16);
    sweep(100, 40, 0.35, 'sawtooth', 0.15, 0.36);
    tone(55, 0.4, 'sawtooth', 0.08, 0.65);
  },
  timeout: () => {
    sweep(380, 60, 0.5, 'square', 0.18);
    sweep(300, 40, 0.6, 'sawtooth', 0.12, 0.1);
  },
  gameStart: () => {
    [262, 330, 392, 523].forEach((f, i) => tone(f, 0.09, 'square', 0.12, i * 0.08));
  },
  badInput: () => {
    tone(150, 0.08, 'square', 0.25);
    tone(120, 0.1, 'square', 0.2, 0.07);
  },
};

export function getAudioContext() { return getCtx(); }
export function setMuted(v) { _muted = v; }
export function isMuted() { return _muted; }

export function getSfxVolume() { return _sfxVolume; }
export function setSfxVolume(v) {
  _sfxVolume = v;
  localStorage.setItem('voidcount_sfx_volume', String(v));
}

export function getMusicVolume() { return _musicVolume; }
export function setMusicVolume(v) {
  _musicVolume = v;
  localStorage.setItem('voidcount_music_volume', String(v));
}
