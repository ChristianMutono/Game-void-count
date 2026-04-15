import { getItem, setItem } from '@void-count/core';

const K_VOICE_ENABLED = 'voidcount_voice_input';
const K_VOICE_MODE = 'voidcount_voice_mode';
const K_DEBUG = 'voidcount_debug';

export function isVoiceInputEnabled() {
  return getItem(K_VOICE_ENABLED) === 'on';
}
export function setVoiceInputEnabled(on) {
  setItem(K_VOICE_ENABLED, on ? 'on' : 'off');
}

export function getVoiceMode() {
  const v = getItem(K_VOICE_MODE);
  return v === 'continuous' ? 'continuous' : 'push-to-talk';
}
export function setVoiceMode(mode) {
  setItem(K_VOICE_MODE, mode === 'continuous' ? 'continuous' : 'push-to-talk');
}

export function isDebugMode() {
  return getItem(K_DEBUG) === 'on';
}
export function setDebugMode(on) {
  setItem(K_DEBUG, on ? 'on' : 'off');
}

// Mr Raw leaderboard exception (same as web) — match exact strings only.
export const MR_RAW_NAMES = ['Mr Raw', 'Mr. Raw'];
