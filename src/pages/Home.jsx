import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DIFFICULTIES } from '../lib/gameLogic';
import CRTOverlay from '../components/game/CRTOverlay';
import Leaderboard from '../components/game/Leaderboard';
import FAQ from '../components/game/FAQ';
import SettingsModal from '../components/game/SettingsModal';
import WheelThemePicker from '../components/game/WheelThemePicker';
import MenuWheel from '../components/game/MenuWheel';
import { loadSavedTheme } from '../lib/themes';
import { getAudioContext } from '../lib/sounds';
import { Settings } from 'lucide-react';

// Electrical fizz/buzz glitch sound
function playGlitchSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 0.55;
    // Master gain to control overall glitch volume
    const master = ctx.createGain();
    master.gain.value = 0.25;
    master.connect(ctx.destination);
    // Heavy white noise layer
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    // Bandpass filter for electrical buzz character
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1200; bp.Q.value = 0.4;
    const ng = ctx.createGain();
    noise.connect(bp); bp.connect(ng); ng.connect(master);
    ng.gain.setValueAtTime(0.35, now);
    ng.gain.setValueAtTime(0.28, now + 0.04);
    ng.gain.setValueAtTime(0.42, now + 0.09);
    ng.gain.setValueAtTime(0.18, now + 0.18);
    ng.gain.setValueAtTime(0.38, now + 0.22);
    ng.gain.exponentialRampToValueAtTime(0.001, now + dur);
    noise.start(now);
    // Low-freq square buzz underneath
    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.connect(og); og.connect(master);
    osc.type = 'square';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.setValueAtTime(110, now + 0.06);
    osc.frequency.setValueAtTime(55, now + 0.14);
    osc.frequency.setValueAtTime(80, now + 0.28);
    osc.frequency.setValueAtTime(40, now + 0.4);
    og.gain.setValueAtTime(0.22, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.start(now); osc.stop(now + dur);
    // High crackle burst at start
    const len2 = Math.floor(ctx.sampleRate * 0.06);
    const buf2 = ctx.createBuffer(1, len2, ctx.sampleRate);
    const d2 = buf2.getChannelData(0);
    for (let i = 0; i < len2; i++) d2[i] = (Math.random() * 2 - 1) * (1 - i / len2);
    const crackle = ctx.createBufferSource();
    crackle.buffer = buf2;
    const cg = ctx.createGain();
    crackle.connect(cg); cg.connect(master);
    cg.gain.setValueAtTime(0.5, now);
    cg.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    crackle.start(now);
  } catch (_) {}
}

const DIFFICULTY_TRACKS = {
  easy: ['/audio/easy_Baby_Shark.mp3', '/audio/easy_Daisy_Bell.mp3'],
  normal: ['/audio/normal_Sonic_The_Hedgehog_OST_Green_Hill_Zone.mp3', '/audio/normal_Super_Mario_ Bros..mp3'],
  hard: ['/audio/hard_Jaws_OST.mp3', '/audio/hard_MEGALOVANIA.mp3'],
  extreme: ['/audio/extreme_Carmina_Burana_O_Fortuna.mp3'],
};
const HOVER_VOLUME = 0.15;
let _trackIndices = { easy: 0, normal: 0, hard: 0, extreme: 0 };
let _currentAudio = null;

function playDifficultyTrack(diffKey) {
  stopDifficultyTrack();
  const tracks = DIFFICULTY_TRACKS[diffKey];
  if (!tracks || tracks.length === 0) return;
  const idx = _trackIndices[diffKey] % tracks.length;
  _trackIndices[diffKey]++;
  const audio = new Audio(tracks[idx]);
  audio.volume = 0;
  audio.loop = true;
  audio.play().catch(() => {});
  _currentAudio = audio;
  // Fade in over 400ms
  const steps = 20;
  const interval = 400 / steps;
  let step = 0;
  const fade = setInterval(() => {
    step++;
    if (!_currentAudio || _currentAudio !== audio) { clearInterval(fade); return; }
    audio.volume = Math.min(HOVER_VOLUME, (step / steps) * HOVER_VOLUME);
    if (step >= steps) clearInterval(fade);
  }, interval);
}

function stopDifficultyTrack() {
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio.currentTime = 0;
    _currentAudio = null;
  }
}

export default function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => loadSavedTheme());
  const [glitching, setGlitching] = useState(false);
  // Animation states for settings
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settingsMounted, setSettingsMounted] = useState(false);
  // Animation states for mode transition
  const [modeVisible, setModeVisible] = useState(false);
  const [modeMounted, setModeMounted] = useState(false);
  const glitchTimerRef = useRef(null);

  useEffect(() => { loadSavedTheme(); }, []);

  // Random glitch every ~49 seconds (±10s variance)
  useEffect(() => {
    const schedule = () => {
      const delay = 39000 + Math.random() * 20000;
      glitchTimerRef.current = setTimeout(() => {
        setGlitching(true);
        playGlitchSound();
        setTimeout(() => setGlitching(false), 750);
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(glitchTimerRef.current);
  }, []);

  // Settings open/close with animation
  const openSettings = () => {
    setSettingsMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setSettingsVisible(true)));
  };
  const closeSettings = () => {
    setSettingsVisible(false);
    setTimeout(() => setSettingsMounted(false), 1440);
  };

  // Mode transition
  const enterMode = (m) => {
    setMode(m);
    setModeMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setModeVisible(true)));
  };
  const exitMode = () => {
    stopDifficultyTrack();
    setModeVisible(false);
    setTimeout(() => { setMode(null); setModeMounted(false); }, 400);
  };

  const handleMenuActivate = (itemId) => {
    if (itemId === 'single') enterMode('single');
    else if (itemId === 'local') enterMode('local');
    else if (itemId === 'ranks') setShowLeaderboard(true);
    else if (itemId === 'settings') openSettings();
    else if (itemId === 'faq') setShowFAQ(true);
  };

  const startGame = (difficulty) => {
    stopDifficultyTrack();
    navigate(`/game?mode=${mode}&difficulty=${difficulty}`);
  };

  // Main content: shrinks/fades when settings open
  const mainTransition = 'transform 1.44s cubic-bezier(0.4,0,0.2,1), opacity 1.44s cubic-bezier(0.4,0,0.2,1)';
  const mainStyle = {
    transition: mainTransition,
    transform: settingsVisible ? 'scale(0.88)' : 'scale(1)',
    opacity: settingsVisible ? 0 : 1,
    pointerEvents: settingsVisible ? 'none' : 'auto',
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-between px-4 md:px-8 py-8">
      <CRTOverlay />

      {/* Background grid — behind everything */}
      <div className="fixed inset-0 opacity-5 pointer-events-none"
           style={{ zIndex: 0,
             backgroundImage: `linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)`,
             backgroundSize: '40px 40px',
           }} />

      {/* Settings cog — tablet & mobile only */}
      <button
        onClick={openSettings}
        className="md:hidden fixed top-4 right-4 z-20 w-10 h-10 rounded-full glass-panel border border-border/50
                   flex items-center justify-center text-muted-foreground hover:text-cyan hover:border-cyan/50 transition-all"
      >
        <Settings size={18} />
      </button>

      {/* Theme wheel — desktop only, left side */}
      <div className="hidden md:flex fixed left-4 z-10" style={{ top: '50%', transform: 'translateY(-50%)' }}>
        <WheelThemePicker currentTheme={currentTheme} onThemeChange={setCurrentTheme} />
      </div>

      {/* All main content wrapped for settings transition */}
      <div className="w-full flex flex-col items-center justify-between flex-1 gap-4" style={mainStyle}>

        {/* Title — top */}
        <div
          className="relative z-10 text-center flex-shrink-0"
          style={glitching ? {
            animation: 'glitch-distort 0.75s ease-in-out forwards',
          } : {}}
        >
          <h1 className="font-orbitron text-5xl md:text-7xl font-black text-cyan glitch-text tracking-tight leading-none mb-2">
            VOID
          </h1>
          <h1 className="font-orbitron text-5xl md:text-7xl font-black text-magenta glitch-text tracking-tight leading-none mb-4">
            COUNT
          </h1>
          <div className="font-mono text-xs text-muted-foreground tracking-[0.3em] uppercase">
            count or be consumed
          </div>
        </div>

        {/* Center — menu wheel or difficulty picker */}
        <div
          className="relative z-10 w-full max-w-md flex-1 flex flex-col items-center justify-center py-6"
          style={glitching ? { animation: 'glitch-distort 0.75s ease-in-out forwards' } : {}}
        >
          {/* Menu wheel — always mounted but fades out when mode selected */}
          <div style={{
            width: '100%',
            transition: 'transform 0.4s ease, opacity 0.4s ease',
            transform: modeMounted ? 'scale(0.9)' : 'scale(1)',
            opacity: modeMounted ? 0 : 1,
            pointerEvents: modeMounted ? 'none' : 'auto',
            position: modeMounted ? 'absolute' : 'relative',
          }}>
            <MenuWheel onActivate={handleMenuActivate} />
          </div>

          {/* Difficulty picker — fades in when mode selected */}
          {modeMounted && (
            <div style={{
              width: '100%',
              transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.5s ease',
              transform: modeVisible ? 'scale(1)' : 'scale(0.85)',
              opacity: modeVisible ? 1 : 0,
            }}>
              <div className="w-full flex flex-col items-center gap-3">
                <button
                  onClick={exitMode}
                  className="font-mono text-xs text-muted-foreground hover:text-cyan transition-colors mb-2 self-start"
                >
                  ← Back
                </button>
                <div className="font-orbitron text-sm text-muted-foreground text-center uppercase tracking-widest mb-2">
                  Select Difficulty
                </div>
                {Object.entries(DIFFICULTIES).map(([key, diff]) => (
                  <DifficultyButton
                    key={key} diffKey={key} diff={diff}
                    onClick={() => startGame(key)}
                    onHoverStart={() => playDifficultyTrack(key)}
                    onHoverEnd={stopDifficultyTrack}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* How to play — bottom */}
        <div
          className="relative z-10 w-full max-w-md flex-shrink-0"
          style={glitching ? { animation: 'glitch-distort 0.75s ease-in-out forwards' } : {}}
        >
          <div className="glass-panel rounded-xl p-4 w-full">
            <div className="font-orbitron text-xs mb-2 tracking-widest" style={{ color: 'rgba(255,255,255,0.9)' }}>HOW TO PLAY</div>
            <ul className="space-y-1 font-mono text-xs text-muted-foreground leading-relaxed">
              <li>• <span className="text-cyan">Counter</span> must say the lowest unused number</li>
              <li>• <span className="text-magenta">Controller</span> can skip ahead to create traps</li>
              <li>• Don't duplicate, don't steal, don't skip, don't timeout</li>
              <li>• Enter <span className="text-yellow">"1"</span> to fire the starting gun</li>
            </ul>
          </div>
        </div>

      </div>

      <div className="hidden md:block fixed bottom-3 right-4 z-10 font-mono text-[10px] text-muted-foreground/30">
        Developed by Christian Mutono
      </div>

      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
      {showFAQ && <FAQ onClose={() => setShowFAQ(false)} />}

      {/* Settings with grow-from-center animation */}
      {settingsMounted && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            transition: 'opacity 1.44s cubic-bezier(0.4,0,0.2,1)',
            opacity: settingsVisible ? 1 : 0,
          }}
        >
          <div
            className="absolute inset-0 bg-obsidian/90"
            onClick={closeSettings}
            style={{
              transition: 'opacity 1.44s cubic-bezier(0.4,0,0.2,1)',
              opacity: settingsVisible ? 1 : 0,
            }}
          />
          <div
            style={{
              transition: 'transform 1.44s cubic-bezier(0.22,1,0.36,1), opacity 1.44s cubic-bezier(0.4,0,0.2,1)',
              transform: settingsVisible ? 'scale(1)' : 'scale(0.7)',
              opacity: settingsVisible ? 1 : 0,
              position: 'relative', width: '100%', maxWidth: '384px',
            }}
          >
            <SettingsModal
              onClose={closeSettings}
              currentTheme={currentTheme}
              onThemeChange={setCurrentTheme}
              noWrapper
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DifficultyButton({ diffKey, diff, onClick, onHoverStart, onHoverEnd }) {
  const colors = {
    easy:    { border: 'border-cyan/30 hover:border-cyan',      text: 'text-cyan',    glow: 'hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]' },
    normal:  { border: 'border-yellow/30 hover:border-yellow',  text: 'text-yellow',  glow: 'hover:shadow-[0_0_20px_rgba(255,230,0,0.15)]' },
    hard:    { border: 'border-magenta/30 hover:border-magenta', text: 'text-magenta', glow: 'hover:shadow-[0_0_20px_rgba(255,0,102,0.15)]' },
    extreme: { border: 'border-red-500/30 hover:border-red-500', text: 'text-red-500', glow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]' },
  };
  const c = colors[diffKey];
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      className={`glass-panel rounded-lg px-5 py-3 flex items-center justify-center gap-2 border transition-all duration-300 w-48
                  ${c.border} ${c.glow} active:scale-[0.98]`}
    >
      <span className={`font-orbitron text-lg font-bold ${c.text}`}>{diff.label}</span>
      {diffKey === 'hard' && <span className="text-base text-magenta/70">☠</span>}
      {diffKey === 'extreme' && <span className="text-xl text-red-500/70 animate-pulse">☠☠☠</span>}
    </button>
  );
}