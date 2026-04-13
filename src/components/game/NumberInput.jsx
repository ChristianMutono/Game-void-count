import { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { getMicDefault } from '../../lib/sounds';

const TILES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

// Map spoken words to numbers
const WORD_MAP = {
  zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
  eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,
  seventeen:17,eighteen:18,nineteen:19,twenty:20,
  'twenty one':21,'twenty two':22,'twenty three':23,'twenty four':24,'twenty five':25,
  'twenty six':26,'twenty seven':27,'twenty eight':28,'twenty nine':29,
  thirty:30,'thirty one':31,'thirty two':32,'thirty three':33,'thirty four':34,
  'thirty five':35,'thirty six':36,'thirty seven':37,'thirty eight':38,'thirty nine':39,
  forty:40,'forty one':41,'forty two':42,'forty three':43,'forty four':44,'forty five':45,
  'forty six':46,'forty seven':47,'forty eight':48,'forty nine':49,
  fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,
  hundred:100,'one hundred':100,'two hundred':200,
};

function parseSpoken(raw) {
  const text = raw.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  
  // Try direct integer first
  const asInt = parseInt(text.replace(/\s/g, ''), 10);
  if (!isNaN(asInt) && asInt > 0) return asInt;
  
  // Exact word match
  if (text in WORD_MAP) return WORD_MAP[text];
  
  // Try each word individually
  const words = text.split(/\s+/);
  for (const word of words) {
    if (word in WORD_MAP && WORD_MAP[word] > 0) return WORD_MAP[word];
  }
  
  // Compound: "twenty three" type
  for (const [phrase, val] of Object.entries(WORD_MAP)) {
    if (text.includes(phrase)) return val;
  }
  
  return null;
}

export default function NumberInput({ onSubmit, disabled, shakeKey = 0 }) {
  const [value, setValue] = useState('');
  const [micActive, setMicActive] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [shaking, setShaking] = useState(false);

  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const animFrameRef = useRef(null);
  const recognitionRef = useRef(null);
  const micActiveRef = useRef(false);
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  // Shake feedback
  useEffect(() => {
    if (shakeKey === 0) return;
    setValue('');
    setShaking(true);
    const t = setTimeout(() => setShaking(false), 500);
    return () => clearTimeout(t);
  }, [shakeKey]);

  // Keyboard input
  useEffect(() => {
    const handleKey = (e) => {
      if (disabled) return;
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
  }, [disabled]);

  const handleSubmit = useCallback(() => {
    if (!value || disabled) return;
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) { onSubmit(num); setValue(''); }
  }, [value, onSubmit, disabled]);

  // Volume monitoring via analyser
  const startVolumeMonitor = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = actx;
      const source = actx.createMediaStreamSource(stream);
      const analyser = actx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const tick = () => {
        if (!micActiveRef.current) return;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((s, v) => s + v, 0) / data.length;
        setMicVolume(Math.min(1, avg / 50));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
      return true;
    } catch (e) {
      console.warn('Mic access denied:', e);
      return false;
    }
  };

  const stopVolumeMonitor = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch (e) {} }
    streamRef.current = null; analyserRef.current = null; audioCtxRef.current = null;
    setMicVolume(0);
  };

  // Speech recognition — single-shot, auto-restarts for continuous feel
  const launchRecognition = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      for (let r = 0; r < event.results.length; r++) {
        if (!event.results[r].isFinal) continue;
        const alternatives = Array.from(event.results[r]);
        for (const alt of alternatives) {
          const num = parseSpoken(alt.transcript);
          if (num && num > 0) {
            onSubmitRef.current(num);
            return;
          }
        }
      }
    };

    rec.onend = () => {
      // Auto-restart if mic still active
      if (micActiveRef.current) {
        setTimeout(() => {
          if (micActiveRef.current) launchRecognition();
        }, 80);
      }
    };

    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        micActiveRef.current = false;
        setMicActive(false);
        stopVolumeMonitor();
        return;
      }
      // On other errors, rec.onend will fire and restart
    };

    try { rec.start(); recognitionRef.current = rec; } catch (e) { console.warn('Rec start:', e); }
  };

  const toggleVoice = async () => {
    if (micActive) {
      micActiveRef.current = false;
      setMicActive(false);
      if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch (e) {} recognitionRef.current = null; }
      stopVolumeMonitor();
    } else {
      micActiveRef.current = true;
      setMicActive(true);
      // Start recognition first — it also needs mic access
      launchRecognition();
      // Start volume monitor in parallel (separate stream for UI feedback)
      await startVolumeMonitor();
    }
  };

  useEffect(() => {
    return () => {
      micActiveRef.current = false;
      if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch (e) {} }
      stopVolumeMonitor();
    };
  }, []);

  const handleTilePress = (digit) => {
    if (disabled) return;
    setValue(prev => prev + String(digit));
  };

  const hasVoice = typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Display */}
      <div className={`glass-panel rounded-xl px-6 py-3 w-full max-w-xs text-center min-h-[56px]
                       flex items-center justify-center ${shaking ? 'shake' : ''}`}>
        <span className="font-orbitron text-3xl md:text-4xl font-bold text-cyan neon-glow-cyan tracking-wider">
          {value || <span className="text-muted-foreground/40 text-lg">TYPE / TAP / SPEAK</span>}
        </span>
      </div>

      {/* Number Grid */}
      <div className="grid grid-cols-5 gap-2 w-full max-w-md">
        {TILES.map((digit) => (
          <button
            key={digit}
            disabled={disabled}
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

      {/* Action row */}
      <div className="flex gap-3 w-full max-w-md">
        <button
          onClick={() => setValue('')}
          disabled={disabled || !value}
          className="flex-1 h-12 rounded-lg bg-muted/50 border border-magenta/30 text-magenta font-orbitron text-sm font-bold
                     hover:bg-magenta/10 hover:border-magenta transition-all disabled:opacity-30"
        >
          CLR
        </button>
        <button
          onClick={handleSubmit}
          disabled={disabled || !value}
          className="flex-[2] h-12 rounded-lg bg-cyan/10 border-2 border-cyan text-cyan font-orbitron text-lg font-bold
                     hover:bg-cyan/20 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all
                     active:scale-95 disabled:opacity-30"
        >
          SUBMIT
        </button>

        {hasVoice && (
          <div className="flex items-stretch gap-1">
            {/* Vertical volume meter */}
            {micActive && (
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
              onClick={toggleVoice}
              disabled={disabled}
              title={micActive ? 'Disable mic' : 'Enable mic'}
              className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-all disabled:opacity-30
                         ${micActive ? 'border-magenta text-magenta bg-magenta/10' : 'bg-muted/50 border-cyan/30 text-cyan hover:bg-cyan/10'}`}
            >
              {micActive ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}