// React Native doesn't expose a Web Audio-equivalent, so we can't synthesise
// tones at runtime the way the web app does. Instead we fall back to Haptics
// for tactile feedback and leave optional music playback stubbed. When the
// asset pipeline lands this module can be extended with `expo-av` Sound
// objects for pre-rendered SFX files.

import * as Haptics from 'expo-haptics';
import { getItem, setItem } from '@void-count/core';

let _sfxVolume = parseFloat(getItem('voidcount_sfx_volume') ?? '0.85');
let _musicVolume = parseFloat(getItem('voidcount_music_volume') ?? '0.85');
let _muted = false;

export function getSfxVolume() { return _sfxVolume; }
export function setSfxVolume(v) { _sfxVolume = v; setItem('voidcount_sfx_volume', String(v)); }
export function getMusicVolume() { return _musicVolume; }
export function setMusicVolume(v) { _musicVolume = v; setItem('voidcount_music_volume', String(v)); }
export function isMuted() { return _muted; }
export function setMuted(v) { _muted = v; }

function withHaptics(fn) {
  return (...args) => { if (_muted || _sfxVolume === 0) return; fn(...args).catch(() => {}); };
}

export const sounds = {
  submit: withHaptics(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  cpuMove: withHaptics(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  error: withHaptics(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  timeout: withHaptics(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  gameStart: withHaptics(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  badInput: withHaptics(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
};
