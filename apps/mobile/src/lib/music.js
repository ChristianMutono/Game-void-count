import { Audio } from 'expo-av';
import { getMusicVolume, isMuted } from './sounds';

// Lazy-loaded bundled music. We ship a single ambient loop for the menu and
// one per-difficulty track. When assets/audio/*.mp3 lands those paths
// resolve and playback works; until then, every function is a no-op so
// absence of assets doesn't crash.

let _current = null;
let _preferredId = null;

const ASSETS = {
  homescreen: null, // e.g. require('../../assets/audio/homescreen_background.mp3')
  easy: null,
  normal: null,
  hard: null,
  extreme: null,
};

async function ensureAudioMode() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (_) { /* noop */ }
}

async function loadAndPlay(assetRef, { ratio = 1 } = {}) {
  if (!assetRef) return null;
  await ensureAudioMode();
  const sound = new Audio.Sound();
  try {
    await sound.loadAsync(assetRef, { shouldPlay: true, isLooping: true });
    await sound.setVolumeAsync(getMusicVolume() * ratio);
    return sound;
  } catch (e) {
    console.warn('[music] load failed:', e);
    return null;
  }
}

export async function playTrack(id, ratio = 1) {
  _preferredId = id;
  if (isMuted()) return;
  if (_current && _current.id === id) return;
  await stopTrack();
  const asset = ASSETS[id];
  if (!asset) return;
  const sound = await loadAndPlay(asset, { ratio });
  if (sound) _current = { id, sound };
}

export async function stopTrack() {
  if (!_current) return;
  try { await _current.sound.stopAsync(); } catch (_) { /* noop */ }
  try { await _current.sound.unloadAsync(); } catch (_) { /* noop */ }
  _current = null;
}

export async function suspendMusic() {
  if (!_current) return;
  try { await _current.sound.pauseAsync(); } catch (_) { /* noop */ }
}

export async function resumeMusic() {
  if (!_current || !_preferredId) return;
  try { await _current.sound.playAsync(); } catch (_) { /* noop */ }
}
