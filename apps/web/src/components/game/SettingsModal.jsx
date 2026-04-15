import { useState, useEffect } from 'react';
import { X, Trash2, Bug, Volume2, Music, Mic } from 'lucide-react';
import { THEMES, applyTheme } from '../../lib/themes';
import { getPlayerName, setPlayerName, MAX_NAME_LEN } from '@void-count/core';
import { getSfxVolume, setSfxVolume, getMusicVolume, setMusicVolume } from '../../lib/sounds';
import { loadWhisper, getActiveModelKey } from '../../lib/whisper';
import { loadDigitRecognizer } from '../../lib/digitSpelling';

const ASR_OPTIONS = [
  { key: 'whisper-base',   label: 'Whisper Base',        hint: '~74 MB · default · full natural speech' },
  { key: 'distil-whisper', label: 'Distil-Whisper',      hint: '~166 MB · ~6× faster encoder · same UX as Whisper' },
  { key: 'digit-spelling', label: 'Digit-Spelling Mode', hint: '~2 MB · spell digits ("one-two-three" for 123) · sub-second' },
  { key: 'moonshine',      label: 'Moonshine',           hint: '~60 MB · experimental · currently unreliable for digits' },
];
const DEFAULT_ASR_KEY = 'whisper-base';

export function isDebugMode() {
  return localStorage.getItem('voidcount_debug') === 'on';
}

export function isVoiceInputEnabled() {
  return localStorage.getItem('voidcount_voice_input') === 'on';
}

export default function SettingsModal({ onClose, currentTheme, onThemeChange }) {
  const [name, setName] = useState(getPlayerName());
  const [debugMode, setDebugModeState] = useState(isDebugMode());
  const [voiceInput, setVoiceInputState] = useState(isVoiceInputEnabled());
  const [showBetaNotice, setShowBetaNotice] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [sfxVol, setSfxVol] = useState(getSfxVolume());
  const [musicVol, setMusicVol] = useState(getMusicVolume());
  const [asrModel, setAsrModel] = useState(getActiveModelKey());

  useEffect(() => {
    if (!showBetaNotice) return;
    const t = setTimeout(() => setShowBetaNotice(false), 4000);
    return () => clearTimeout(t);
  }, [showBetaNotice]);

  const handleNameChange = (e) => {
    const val = e.target.value.slice(0, MAX_NAME_LEN);
    setName(val);
    setPlayerName(val);
  };

  const handleClearRankings = () => {
    localStorage.removeItem('voidcount_leaderboard');
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  const handleTheme = (id) => {
    applyTheme(id);
    onThemeChange(id);
  };

  const handleDebugToggle = () => {
    const next = !debugMode;
    setDebugModeState(next);
    localStorage.setItem('voidcount_debug', next ? 'on' : 'off');
    if (!next && asrModel !== DEFAULT_ASR_KEY) {
      localStorage.removeItem('voidcount_asr_model');
      setAsrModel(DEFAULT_ASR_KEY);
      if (voiceInput) {
        loadWhisper().catch(() => { /* surfaced inside NumberInput */ });
      }
    }
  };

  const handleVoiceInputToggle = () => {
    const next = !voiceInput;
    setVoiceInputState(next);
    localStorage.setItem('voidcount_voice_input', next ? 'on' : 'off');
    if (next) {
      setShowBetaNotice(true);
      loadWhisper().catch(() => { /* surfaced inside NumberInput */ });
    }
  };

  const handleAsrModelChange = (key) => {
    if (key === asrModel) return;
    setAsrModel(key);
    localStorage.setItem('voidcount_asr_model', key);
    if (voiceInput) {
      const loader = key === 'digit-spelling' ? loadDigitRecognizer : loadWhisper;
      loader().catch(() => { /* surfaced inside NumberInput */ });
    }
  };

  return (
    <div className="relative glass-panel rounded-2xl p-6 w-full max-w-sm flex flex-col gap-5 max-h-[85vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-orbitron text-lg font-bold text-cyan neon-glow-cyan">SETTINGS</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Player Name */}
        <div>
          <label className="font-orbitron text-xs text-muted-foreground uppercase tracking-widest block mb-2">
            Player Name <span className="text-cyan/50">(max {MAX_NAME_LEN} chars)</span>
          </label>
          <input
            type="text"
            maxLength={MAX_NAME_LEN}
            value={name}
            onChange={handleNameChange}
            className="w-full glass-panel rounded-lg px-4 py-2 font-orbitron text-sm text-cyan
                       border border-cyan/30 focus:border-cyan focus:outline-none bg-transparent"
          />
        </div>

        {/* Sound */}
        <div className="flex flex-col gap-3">
          <div className="font-orbitron text-xs text-muted-foreground uppercase tracking-widest">Sound</div>
          <div className="flex items-center gap-3">
            <Volume2 size={14} className="text-cyan flex-shrink-0" />
            <span className="font-mono text-xs text-muted-foreground w-8">SFX</span>
            <input
              type="range" min="0" max="1" step="0.05"
              value={sfxVol}
              onChange={(e) => { const v = parseFloat(e.target.value); setSfxVol(v); setSfxVolume(v); }}
              className="flex-1 accent-cyan h-1"
            />
            <span className="font-mono text-xs text-muted-foreground w-8 text-right">{Math.round(sfxVol * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <Music size={14} className="text-magenta flex-shrink-0" />
            <span className="font-mono text-xs text-muted-foreground w-8">Music</span>
            <input
              type="range" min="0" max="1" step="0.05"
              value={musicVol}
              onChange={(e) => { const v = parseFloat(e.target.value); setMusicVol(v); setMusicVolume(v); }}
              className="flex-1 accent-magenta h-1"
            />
            <span className="font-mono text-xs text-muted-foreground w-8 text-right">{Math.round(musicVol * 100)}%</span>
          </div>
        </div>

        {/* Theme */}
        <div>
          <div className="font-orbitron text-xs text-muted-foreground uppercase tracking-widest mb-2">Theme</div>
          <div className="grid grid-cols-5 gap-2">
            {THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => handleTheme(theme.id)}
                title={theme.label}
                className={`rounded-lg overflow-hidden transition-all h-10 relative
                            ${currentTheme === theme.id ? 'ring-2 ring-white scale-105' : 'opacity-60 hover:opacity-90'}`}
                style={{
                  backgroundColor: theme.preview.bg,
                  boxShadow: currentTheme === theme.id ? `0 0 10px ${theme.preview.accent1}66` : 'none',
                  outline: currentTheme === theme.id ? `2px solid ${theme.preview.accent1}` : 'none',
                  outlineOffset: '2px',
                }}
              >
                <div className="absolute inset-0 opacity-20"
                     style={{
                       backgroundImage: `linear-gradient(${theme.preview.accent1}55 1px, transparent 1px),
                                         linear-gradient(90deg, ${theme.preview.accent1}55 1px, transparent 1px)`,
                       backgroundSize: '6px 6px',
                     }} />
                <div className="absolute bottom-1 left-0 right-0 text-center">
                  <span className="font-orbitron text-[6px] font-bold" style={{ color: theme.preview.accent1 }}>
                    {theme.label.slice(0, 4)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Voice Input (Beta) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic size={14} className="text-muted-foreground" />
            <div>
              <div className="font-orbitron text-xs text-muted-foreground uppercase tracking-widest">Voice Input <span className="text-magenta/70">(Beta)</span></div>
              <div className="font-mono text-xs text-muted-foreground/60 mt-0.5">
                {voiceInput ? 'Mic button visible in-game' : 'Hidden during play'}
              </div>
            </div>
          </div>
          <button
            onClick={handleVoiceInputToggle}
            className={`w-12 h-6 rounded-full transition-all relative ${
              voiceInput ? 'bg-magenta/60' : 'bg-muted'
            }`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
              voiceInput ? 'left-7' : 'left-1'
            }`} />
          </button>
        </div>

        {showBetaNotice && (
          <div className="glass-panel-magenta rounded-lg px-3 py-2 border border-magenta/40 -mt-2">
            <div className="font-mono text-[11px] text-magenta/90 leading-snug">
              Voice input is still in beta — transcription can be finicky with loud or fast speech. Speak clearly and at a measured volume for best results.
            </div>
          </div>
        )}

        {/* Debug Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug size={14} className="text-muted-foreground" />
            <div>
              <div className="font-orbitron text-xs text-muted-foreground uppercase tracking-widest">Debug Mode</div>
              <div className="font-mono text-xs text-muted-foreground/60 mt-0.5">
                {debugMode ? 'Shows history + next number' : 'Hidden during play'}
              </div>
            </div>
          </div>
          <button
            onClick={handleDebugToggle}
            className={`w-12 h-6 rounded-full transition-all relative ${
              debugMode ? 'bg-yellow/60' : 'bg-muted'
            }`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
              debugMode ? 'left-7' : 'left-1'
            }`} />
          </button>
        </div>

        {/* Voice Model (debug-only) */}
        {debugMode && (
          <div className="glass-panel rounded-lg p-3 border border-yellow/30 -mt-2">
            <div className="font-orbitron text-[10px] text-yellow/80 uppercase tracking-widest mb-2">
              Voice Model (Debug)
            </div>
            <div className="flex flex-col gap-2">
              {ASR_OPTIONS.map(opt => (
                <label
                  key={opt.key}
                  className={`flex items-start gap-2 cursor-pointer rounded-md px-2 py-1.5 border transition-all
                    ${asrModel === opt.key
                      ? 'border-yellow/60 bg-yellow/5'
                      : 'border-transparent hover:border-yellow/20 hover:bg-yellow/5'}`}
                >
                  <input
                    type="radio"
                    name="asr-model"
                    value={opt.key}
                    checked={asrModel === opt.key}
                    onChange={() => handleAsrModelChange(opt.key)}
                    className="mt-0.5 accent-yellow"
                  />
                  <div className="flex-1">
                    <div className="font-orbitron text-xs text-foreground/90">{opt.label}</div>
                    <div className="font-mono text-[10px] text-muted-foreground/70 mt-0.5">{opt.hint}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground/50 mt-2 leading-snug">
              Switches take effect on the next mic press. Previously-loaded models stay cached in IndexedDB for instant re-use.
            </div>
          </div>
        )}

        {/* Clear Rankings */}
        <button
          onClick={handleClearRankings}
          className={`flex items-center justify-center gap-2 w-full py-2 rounded-lg font-orbitron text-sm font-bold
                      border transition-all ${cleared
                        ? 'border-cyan/40 text-cyan bg-cyan/10'
                        : 'border-magenta/40 text-magenta hover:bg-magenta/10'}`}
        >
          <Trash2 size={15} />
          {cleared ? 'RANKINGS CLEARED' : 'CLEAR RANKINGS'}
        </button>
    </div>
  );
}
