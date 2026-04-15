import { Platform } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  addSpeechRecognitionListener,
  getSupportedLocales,
} from 'expo-speech-recognition';
import { parseSpoken } from '@void-count/core';

// Mode enum
export const VOICE_MODE_PTT = 'push-to-talk';
export const VOICE_MODE_CONTINUOUS = 'continuous';

let _active = false;
let _mode = VOICE_MODE_PTT;
let _onNumber = () => {};
let _debounce = { num: 0, at: 0 };
const _listeners = [];

function clearListeners() {
  while (_listeners.length) {
    const sub = _listeners.pop();
    try { sub.remove(); } catch (_) { /* noop */ }
  }
}

function handleTranscript(text) {
  const num = parseSpoken(text);
  if (!num || num < 1) return;
  const now = Date.now();
  if (_debounce.num === num && now - _debounce.at < 400) return;
  _debounce = { num, at: now };
  _onNumber(num);
}

async function requestPermissions() {
  try {
    const res = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return res?.granted === true;
  } catch (e) {
    console.warn('[voice] permission request failed:', e);
    return false;
  }
}

export async function isVoiceAvailable() {
  try {
    const locales = await getSupportedLocales();
    return Array.isArray(locales) && locales.length > 0;
  } catch {
    return false;
  }
}

export async function startVoice(mode, onNumber) {
  if (_active) return true;
  const ok = await requestPermissions();
  if (!ok) return false;

  _mode = mode;
  _onNumber = onNumber || (() => {});
  _debounce = { num: 0, at: 0 };

  _listeners.push(
    addSpeechRecognitionListener('result', (event) => {
      const first = event?.results?.[0];
      const transcript = first?.transcript || '';
      const isFinal = event?.isFinal === true;
      // In PTT we wait for final; in continuous we act on each final result.
      if (isFinal && transcript) handleTranscript(transcript);
    })
  );

  _listeners.push(
    addSpeechRecognitionListener('error', (event) => {
      console.warn('[voice] error:', event?.error, event?.message);
    })
  );

  _listeners.push(
    addSpeechRecognitionListener('end', () => {
      // Continuous mode: the native engine closes the session after every
      // final transcript or a ~60s timeout. Immediately re-arm if still active.
      if (_active && _mode === VOICE_MODE_CONTINUOUS) {
        startNativeRecognition();
      }
    })
  );

  try {
    startNativeRecognition();
    _active = true;
    return true;
  } catch (e) {
    console.warn('[voice] start failed:', e);
    clearListeners();
    return false;
  }
}

function startNativeRecognition() {
  ExpoSpeechRecognitionModule.start({
    lang: 'en-US',
    interimResults: false,
    maxAlternatives: 1,
    continuous: _mode === VOICE_MODE_CONTINUOUS,
    requiresOnDeviceRecognition: Platform.OS === 'ios',
    addsPunctuation: false,
    contextualStrings: [
      'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
      'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
      'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
      'hundred',
    ],
  });
}

export async function stopVoice() {
  if (!_active) return;
  _active = false;
  try { await ExpoSpeechRecognitionModule.stop(); } catch (_) { /* noop */ }
  clearListeners();
}

export function isVoiceActive() {
  return _active;
}
