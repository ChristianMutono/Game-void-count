import { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { transcribe, loadWhisper, isModelReady, onLoadProgress, getActiveModelKey } from '../../lib/whisper';
import {
  startDigitStream,
  stopDigitStream,
  loadDigitRecognizer,
  isDigitModelReady,
  onDigitLoadProgress,
} from '../../lib/digitSpelling';
import { isVoiceInputEnabled } from './SettingsModal';

const TILES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

const WORD_MAP = {
  zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
  eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,
  seventeen:17,eighteen:18,nineteen:19,twenty:20,
  thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,
  hundred:100,
};

const TENS_WORDS = { twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90 };
const UNITS_WORDS = { one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9 };

function parseSpoken(raw) {
  const text = raw.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return null;

  const asInt = parseInt(text.replace(/\s/g, ''), 10);
  if (!isNaN(asInt) && asInt > 0 && asInt <= 250) return asInt;

  const firstNumMatch = text.match(/\d{1,3}/);
  if (firstNumMatch) {
    const n = parseInt(firstNumMatch[0], 10);
    if (n > 0 && n <= 250) return n;
  }

  const words = text.split(' ');

  let hundreds = 0;
  let rest = words;
  const hundredIdx = words.indexOf('hundred');
  if (hundredIdx !== -1) {
    const prev = words[hundredIdx - 1];
    hundreds = (prev && UNITS_WORDS[prev]) ? UNITS_WORDS[prev] * 100 : 100;
    rest = words.slice(hundredIdx + 1).filter(w => w !== 'and');
  }

  let remainder = 0;
  if (rest.length >= 2 && TENS_WORDS[rest[0]] && UNITS_WORDS[rest[1]]) {
    remainder = TENS_WORDS[rest[0]] + UNITS_WORDS[rest[1]];
  } else if (rest.length >= 1) {
    for (const w of rest) {
      if (w in WORD_MAP) { remainder = WORD_MAP[w]; break; }
    }
  }

  const total = hundreds + remainder;
  if (total > 0 && total <= 250) return total;

  for (const w of words) {
    if (w in WORD_MAP && WORD_MAP[w] > 0) return WORD_MAP[w];
  }
  return null;
}

export default function NumberInput({ onSubmit, disabled, shakeKey = 0, onMicActivate }) {
  const isDigitMode = getActiveModelKey() === 'digit-spelling';
  const [value, setValue] = useState('');
  const [micHeld, setMicHeld] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(isDigitMode ? isDigitModelReady() : isModelReady());
  const [micVolume, setMicVolume] = useState(0);
  const [shaking, setShaking] = useState(false);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const micHeldRef = useRef(false);
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;
  const onMicActivateRef = useRef(onMicActivate);
  onMicActivateRef.current = onMicActivate;

  useEffect(() => {
    if (shakeKey === 0) return;
    setValue('');
    setShaking(true);
    const t = setTimeout(() => setShaking(false), 500);
    return () => clearTimeout(t);
  }, [shakeKey]);

  useEffect(() => {
    const unsub = isDigitMode
      ? onDigitLoadProgress((p) => {
          setModelProgress(p);
          if (p >= 100 && isDigitModelReady()) setModelLoaded(true);
        })
      : onLoadProgress((p) => {
          setModelProgress(p);
          if (p >= 100 && isModelReady()) setModelLoaded(true);
        });
    return unsub;
  }, [isDigitMode]);

  const inputLocked = disabled || micHeld || transcribing || modelLoading;

  useEffect(() => {
    const handleKey = (e) => {
      if (inputLocked) return;
      if (e.key >= '0' && e.key <= '9') {
        setValue(prev => prev + e.key);
      } else if (e.key === 'Backspace') {
        setValue(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        setValue(prev => {
          if (!prev) return prev;
          const num = parseInt(prev, 10);
          if (!isNaN(num) && num > 0) onSubmitRef.current(num);
          return '';
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [inputLocked]);

  const handleSubmit = useCallback(() => {
    if (!value || inputLocked) return;
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) { onSubmit(num); setValue(''); }
  }, [value, onSubmit, inputLocked]);

  const stopStreamAndCtx = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (_) { /* noop */ }
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setMicVolume(0);
  };

  const startRecording = useCallback(async () => {
    if (disabled || micHeldRef.current || transcribing) return;

    if (isDigitMode) {
      if (!isDigitModelReady()) {
        setModelLoading(true);
        try { await loadDigitRecognizer(); }
        catch (err) { console.warn('[digit] load failed:', err); setModelLoading(false); return; }
        setModelLoading(false);
      }
      micHeldRef.current = true;
      setMicHeld(true);
      if (onMicActivateRef.current) onMicActivateRef.current();
      try {
        await startDigitStream((digit) => {
          setValue((prev) => {
            const next = (prev + String(digit)).slice(0, 3);
            return next;
          });
        });
      } catch (err) {
        console.warn('[digit] stream failed:', err);
        micHeldRef.current = false;
        setMicHeld(false);
      }
      return;
    }

    if (!isModelReady() && !modelLoading) {
      setModelLoading(true);
      loadWhisper()
        .then(() => setModelLoading(false))
        .catch((err) => { console.warn('[whisper] load failed:', err); setModelLoading(false); });
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const actx = new AudioCtx();
      audioCtxRef.current = actx;
      const source = actx.createMediaStreamSource(stream);
      const analyser = actx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const tick = () => {
        if (!micHeldRef.current) return;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((s, v) => s + v, 0) / data.length;
        setMicVolume(Math.min(1, avg / 50));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);

      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '');
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start();
      recorderRef.current = recorder;

      micHeldRef.current = true;
      setMicHeld(true);
      if (onMicActivateRef.current) onMicActivateRef.current();
    } catch (e) {
      console.warn('Mic access denied:', e);
      stopStreamAndCtx();
    }
  }, [disabled, transcribing, modelLoading, isDigitMode]);

  const stopRecordingAndTranscribe = useCallback(async () => {
    if (!micHeldRef.current) return;

    if (isDigitMode) {
      micHeldRef.current = false;
      setMicHeld(false);
      await stopDigitStream();
      // Submit whatever digits we accumulated.
      setValue((prev) => {
        if (!prev) return prev;
        const num = parseInt(prev, 10);
        if (!isNaN(num) && num > 0 && num <= 250) onSubmitRef.current(num);
        return '';
      });
      return;
    }

    micHeldRef.current = false;
    setMicHeld(false);

    const recorder = recorderRef.current;
    if (!recorder) { stopStreamAndCtx(); return; }

    const stopped = new Promise((resolve) => { recorder.onstop = () => resolve(); });
    try { recorder.stop(); } catch (_) { /* noop */ }
    await stopped;

    const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
    chunksRef.current = [];
    recorderRef.current = null;
    stopStreamAndCtx();

    if (blob.size < 1000) return;

    setTranscribing(true);
    try {
      const text = await transcribe(blob);
      console.log('[whisper] transcript:', text);
      const num = parseSpoken(text);
      if (num && num > 0) {
        onSubmitRef.current(num);
      }
    } catch (err) {
      console.warn('[whisper] transcribe failed:', err);
    } finally {
      setTranscribing(false);
    }
  }, [isDigitMode]);

  useEffect(() => {
    return () => {
      micHeldRef.current = false;
      if (recorderRef.current) { try { recorderRef.current.stop(); } catch (_) { /* noop */ } }
      stopStreamAndCtx();
    };
  }, []);

  const handleTilePress = (digit) => {
    if (inputLocked) return;
    setValue(prev => prev + String(digit));
  };

  const handleMicDown = (e) => {
    e.preventDefault();
    startRecording();
  };
  const handleMicUp = (e) => {
    e.preventDefault();
    stopRecordingAndTranscribe();
  };

  const hasVoice = typeof window !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window.MediaRecorder !== 'undefined' &&
    isVoiceInputEnabled();

  const micBusy = modelLoading || transcribing;
  const micStatus = modelLoading
    ? `LOADING ${Math.round(modelProgress)}%`
    : transcribing
      ? 'TRANSCRIBING...'
      : micHeld
        ? 'LISTENING...'
        : null;

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className={`glass-panel rounded-xl px-6 py-3 w-full max-w-xs text-center min-h-[56px]
                       flex items-center justify-center ${shaking ? 'shake' : ''}`}>
        <span className="font-orbitron text-3xl md:text-4xl font-bold text-cyan neon-glow-cyan tracking-wider">
          {value || <span className="text-muted-foreground/40 text-lg">{hasVoice ? (isDigitMode ? 'TYPE / TAP / SPELL DIGITS' : 'TYPE / TAP / HOLD MIC') : 'TYPE / TAP'}</span>}
        </span>
      </div>

      {micStatus && (
        <div className="font-mono text-xs text-magenta/80 uppercase tracking-widest -mt-1">
          {micStatus}
        </div>
      )}

      <div className="grid grid-cols-5 gap-2 w-full max-w-md">
        {TILES.map((digit) => (
          <button
            key={digit}
            disabled={inputLocked}
            onClick={() => handleTilePress(digit)}
            className="h-14 hex-button flex items-center justify-center
                       bg-obsidian-light border-2 border-cyan/30 text-cyan font-orbitron text-xl font-bold
                       hover:border-cyan hover:bg-cyan/10 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]
                       active:scale-90 active:bg-cyan/20 transition-all duration-100 disabled:opacity-30"
          >
            {digit}
          </button>
        ))}
      </div>

      <div className="flex gap-3 w-full max-w-md">
        <button
          onClick={() => setValue('')}
          disabled={inputLocked || !value}
          className="flex-1 h-12 rounded-lg bg-muted/50 border border-magenta/30 text-magenta font-orbitron text-sm font-bold
                     hover:bg-magenta/10 hover:border-magenta transition-all disabled:opacity-30"
        >
          CLR
        </button>
        <button
          onClick={handleSubmit}
          disabled={inputLocked || !value}
          className="flex-[2] h-12 rounded-lg bg-cyan/10 border-2 border-cyan text-cyan font-orbitron text-lg font-bold
                     hover:bg-cyan/20 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all
                     active:scale-95 disabled:opacity-30"
        >
          SUBMIT
        </button>

        {hasVoice && (
          <div className="flex items-stretch gap-1">
            {micHeld && (
              <div className="w-3 rounded-full overflow-hidden bg-muted/40 flex flex-col-reverse h-12">
                <div
                  className="rounded-full transition-all duration-75"
                  style={{
                    height: `${Math.round(micVolume * 100)}%`,
                    background: micVolume > 0.7 ? '#ff0066' : micVolume > 0.35 ? '#ffe600' : '#ff44cc',
                    boxShadow: `0 0 6px ${micVolume > 0.5 ? '#ff0066' : '#ff44cc'}`,
                  }}
                />
              </div>
            )}
            <button
              onMouseDown={micBusy ? undefined : handleMicDown}
              onMouseUp={micBusy ? undefined : handleMicUp}
              onMouseLeave={micHeld ? handleMicUp : undefined}
              onTouchStart={micBusy ? undefined : handleMicDown}
              onTouchEnd={micBusy ? undefined : handleMicUp}
              onTouchCancel={handleMicUp}
              onContextMenu={(e) => e.preventDefault()}
              disabled={disabled}
              title={modelLoaded ? 'Hold to speak a number' : 'Hold to load voice model and speak'}
              className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-all select-none
                         ${disabled ? 'opacity-30 pointer-events-none' : ''}
                         ${micBusy ? 'cursor-wait' : ''}
                         ${micHeld
                           ? 'border-magenta text-magenta bg-magenta/20 scale-95'
                           : micBusy
                             ? 'border-yellow text-yellow bg-yellow/10'
                             : 'bg-muted/50 border-cyan/30 text-cyan hover:bg-cyan/10'}`}
            >
              {micBusy ? <Loader2 size={20} className="animate-spin text-yellow" strokeWidth={2.5} /> : <Mic size={20} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
