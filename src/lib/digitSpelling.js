// Digit-spelling mode: uses Google's TensorFlow.js speech-commands '18w'
// model (pre-trained on 17 command words including digits 0–9) to stream-
// recognise individual digit utterances in <150 ms each. The caller
// (NumberInput) accumulates the detected digits into the number input while
// the mic button is held, submitting on release.
//
// This entire module is dynamically imported so TF.js + the model bundle
// are only fetched when a user actually selects this mode in Debug
// Settings — the default Whisper path pays zero bundle cost.

const DIGIT_WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4,
  five: 5, six: 6, seven: 7, eight: 8, nine: 9,
};

let recognizerPromise = null;
let listening = false;
let modelReady = false;
let loadProgress = 0;
const progressListeners = new Set();

function notifyProgress(pct) {
  loadProgress = pct;
  for (const fn of progressListeners) fn(pct);
}

export function onDigitLoadProgress(fn) {
  progressListeners.add(fn);
  fn(loadProgress);
  return () => progressListeners.delete(fn);
}

export function isDigitModelReady() {
  return modelReady;
}

export function loadDigitRecognizer() {
  if (recognizerPromise) return recognizerPromise;
  notifyProgress(0);
  recognizerPromise = (async () => {
    // Dynamic imports so TF.js is only fetched when this mode is selected.
    notifyProgress(10);
    const speechCommands = await import('@tensorflow-models/speech-commands');
    notifyProgress(40);
    const recognizer = speechCommands.create('BROWSER_FFT', '18w');
    await recognizer.ensureModelLoaded();
    notifyProgress(100);
    modelReady = true;
    return recognizer;
  })().catch((err) => {
    recognizerPromise = null;
    modelReady = false;
    throw err;
  });
  return recognizerPromise;
}

export async function startDigitStream(onDigit) {
  const recognizer = await loadDigitRecognizer();
  if (listening) return;

  const labels = recognizer.wordLabels();
  await recognizer.listen(
    (result) => {
      const scores = Array.from(result.scores);
      let maxIdx = 0;
      for (let i = 1; i < scores.length; i++) {
        if (scores[i] > scores[maxIdx]) maxIdx = i;
      }
      const label = labels[maxIdx];
      const confidence = scores[maxIdx];
      if (confidence >= 0.75 && label in DIGIT_WORDS) {
        onDigit(DIGIT_WORDS[label]);
      }
    },
    {
      includeSpectrogram: false,
      invokeCallbackOnNoiseAndUnknown: false,
      probabilityThreshold: 0.75,
      overlapFactor: 0.5,
    }
  );
  listening = true;
}

export async function stopDigitStream() {
  if (!recognizerPromise || !listening) return;
  try {
    const recognizer = await recognizerPromise;
    await recognizer.stopListening();
  } catch (_) { /* noop */ }
  listening = false;
}

export function isDigitListening() {
  return listening;
}
