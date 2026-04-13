import { useState } from 'react';
import { X, Trash2, Bug } from 'lucide-react';
import { THEMES, applyTheme } from '../../lib/themes';
import { getPlayerName, setPlayerName, MAX_NAME_LEN } from '../../lib/playerName';
import { isMuted, setMuted } from '../../lib/sounds';

export function isDebugMode() {
  return localStorage.getItem('voidcount_debug') === 'on';
}

export default function SettingsModal({ onClose, currentTheme, onThemeChange }) {
  const [name, setName] = useState(getPlayerName());
  const [micDefault, setMicDefaultState] = useState(
    localStorage.getItem('voidcount_mic_default') === 'unmuted' ? false : true
  );
  const [debugMode, setDebugModeState] = useState(isDebugMode());
  const [cleared, setCleared] = useState(false);

  const handleNameChange = (e) => {
    const val = e.target.value.slice(0, MAX_NAME_LEN);
    setName(val);
    setPlayerName(val);
  };

  const handleMicToggle = () => {
    const next = !micDefault;
    setMicDefaultState(next);
    localStorage.setItem('voidcount_mic_default', next ? 'muted' : 'unmuted');
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
  };

  return (
    <div className="relative glass-panel rounded-2xl p-6 w-full max-w-sm flex flex-col gap-5">

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

        {/* Mic Default */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-orbitron text-xs text-muted-foreground uppercase tracking-widest">Mic Default</div>
            <div className="font-mono text-xs text-muted-foreground/60 mt-0.5">
              {micDefault ? 'Starts muted' : 'Starts unmuted'}
            </div>
          </div>
          <button
            onClick={handleMicToggle}
            className={`w-12 h-6 rounded-full transition-all relative ${
              !micDefault ? 'bg-magenta/60' : 'bg-muted'
            }`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
              !micDefault ? 'left-7' : 'left-1'
            }`} />
          </button>
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