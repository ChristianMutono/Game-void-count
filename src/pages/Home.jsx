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
import { getAudioContext, getMusicVolume, isMuted } from '../lib/sounds';
import { Settings, Volume2, VolumeX } from 'lucide-react';

// Electrical fizz/buzz glitch sound
function playGlitchSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 0.55;
    const master = ctx.createGain();
    master.gain.value = 0.25;
    master.connect(ctx.destination);
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
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

// Dynamic difficulty track discovery from /audio/ directory
// Files must be named: {difficulty}_{anything}.mp3
let _difficultyTracks = null;
async function loadDifficultyTracks() {
  if (_difficultyTracks) return _difficultyTracks;
  try {
    const resp = await fetch('/audio/manifest.json');
    const files = await resp.json();
    const tracks = { easy: [], normal: [], hard: [], extreme: [] };
    for (const file of files) {
      for (const prefix of Object.keys(tracks)) {
        if (file.toLowerCase().startsWith(prefix + '_')) {
          tracks[prefix].push('/audio/' + file);
          break;
        }
      }
    }
    _difficultyTracks = tracks;
    return tracks;
  } catch (_) {
    _difficultyTracks = { easy: [], normal: [], hard: [], extreme: [] };
    return _difficultyTracks;
  }
}

let _trackIndices = { easy: 0, normal: 0, hard: 0, extreme: 0 };
let _currentAudio = null;

async function playDifficultyTrack(diffKey) {
  stopDifficultyTrack();
  const tracks = await loadDifficultyTracks();
  const list = tracks[diffKey];
  if (!list || list.length === 0) return;
  const idx = _trackIndices[diffKey] % list.length;
  const audio = new Audio(list[idx]);
  const targetVol = getMusicVolume();
  audio.volume = 0;
  audio.loop = true;
  audio.play().catch(() => {});
  _currentAudio = audio;
  const steps = 20;
  const interval = 400 / steps;
  let step = 0;
  const fade = setInterval(() => {
    step++;
    if (!_currentAudio || _currentAudio !== audio) { clearInterval(fade); return; }
    audio.volume = Math.min(targetVol, (step / steps) * targetVol);
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

function fadeOutDifficultyTrack(durationMs = 1500) {
  if (!_currentAudio) return;
  const audio = _currentAudio;
  const startVol = audio.volume;
  const steps = 30;
  const interval = durationMs / steps;
  let step = 0;
  const fade = setInterval(() => {
    step++;
    if (!audio || audio.paused) { clearInterval(fade); return; }
    audio.volume = Math.max(0, startVol * (1 - step / steps));
    if (step >= steps) {
      clearInterval(fade);
      audio.pause();
      audio.currentTime = 0;
      if (_currentAudio === audio) _currentAudio = null;
    }
  }, interval);
}

// Background music
let _bgMusic = null;
let _bgFadeInterval = null;
function startBgMusic() {
  if (_bgMusic) return;
  const audio = new Audio('/audio/homescreen_background.mp3');
  audio.loop = true;
  audio.volume = getMusicVolume();
  audio.play().catch(() => {});
  _bgMusic = audio;
}
function stopBgMusic() {
  if (_bgFadeInterval) { clearInterval(_bgFadeInterval); _bgFadeInterval = null; }
  if (_bgMusic) {
    _bgMusic.pause();
    _bgMusic.currentTime = 0;
    _bgMusic = null;
  }
}
function updateBgMusicVolume() {
  if (_bgMusic) _bgMusic.volume = getMusicVolume();
}
function fadeBgMusic(targetRatio, durationMs = 400) {
  if (!_bgMusic) return;
  if (_bgFadeInterval) { clearInterval(_bgFadeInterval); _bgFadeInterval = null; }
  const target = getMusicVolume() * targetRatio;
  const startVol = _bgMusic.volume;
  const steps = 20;
  const interval = durationMs / steps;
  let step = 0;
  _bgFadeInterval = setInterval(() => {
    step++;
    if (!_bgMusic) { clearInterval(_bgFadeInterval); _bgFadeInterval = null; return; }
    _bgMusic.volume = startVol + (target - startVol) * (step / steps);
    if (step >= steps) { clearInterval(_bgFadeInterval); _bgFadeInterval = null; }
  }, interval);
}

export default function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(() => loadSavedTheme());
  const [glitching, setGlitching] = useState(false);
  const [musicMuted, setMusicMuted] = useState(() => isMuted());

  // Animation states for overlays
  const [settingsMounted, setSettingsMounted] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [leaderboardMounted, setLeaderboardMounted] = useState(false);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [faqMounted, setFaqMounted] = useState(false);
  const [faqVisible, setFaqVisible] = useState(false);

  // Animation states for mode transition
  const [modeVisible, setModeVisible] = useState(false);
  const [modeMounted, setModeMounted] = useState(false);
  const [fallingAway, setFallingAway] = useState(false);
  const [fallenIndices, setFallenIndices] = useState([]);
  const [screenFading, setScreenFading] = useState(false);
  const glitchTimerRef = useRef(null);

  useEffect(() => { loadSavedTheme(); }, []);

  // Background music
  useEffect(() => {
    if (!musicMuted) startBgMusic();
    else stopBgMusic();
    return () => stopBgMusic();
  }, [musicMuted]);

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

  // Preload track manifest
  useEffect(() => { loadDifficultyTracks(); }, []);

  const toggleMusicMute = () => {
    setMusicMuted(prev => {
      if (!prev) { stopBgMusic(); stopDifficultyTrack(); }
      else startBgMusic();
      return !prev;
    });
  };

  // Overlay open/close helpers
  const openOverlay = (setMounted, setVisible) => {
    setMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  };
  const closeOverlay = (setVisible, setMounted) => {
    setVisible(false);
    setTimeout(() => setMounted(false), 1440);
  };

  const openSettings = () => openOverlay(setSettingsMounted, setSettingsVisible);
  const closeSettings = () => {
    closeOverlay(setSettingsVisible, setSettingsMounted);
    updateBgMusicVolume();
  };
  const openLeaderboard = () => openOverlay(setLeaderboardMounted, setLeaderboardVisible);
  const closeLeaderboard = () => closeOverlay(setLeaderboardVisible, setLeaderboardMounted);
  const openFaq = () => openOverlay(setFaqMounted, setFaqVisible);
  const closeFaq = () => closeOverlay(setFaqVisible, setFaqMounted);

  // Mode transition
  const enterMode = (m) => {
    for (const key in _trackIndices) _trackIndices[key]++;
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
    else if (itemId === 'ranks') openLeaderboard();
    else if (itemId === 'settings') openSettings();
    else if (itemId === 'faq') openFaq();
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const startGame = (difficulty) => {
    stopBgMusic();
    if (!isMobile) {
      stopDifficultyTrack();
      navigate(`/game?mode=${mode}&difficulty=${difficulty}`);
      return;
    }

    setFallingAway(true);
    stopDifficultyTrack();
    playDifficultyTrack(difficulty);

    const diffKeys = Object.keys(DIFFICULTIES);
    const totalButtons = diffKeys.length + 2;
    const staggerDelay = 3500 / totalButtons;

    for (let i = 0; i < totalButtons; i++) {
      setTimeout(() => {
        setFallenIndices(prev => [...prev, i]);
      }, i * staggerDelay);
    }

    setTimeout(() => {
      setScreenFading(true);
    }, 4000);

    // Navigate at 5.5s, music fades out over 2.5s after
    setTimeout(() => {
      fadeOutDifficultyTrack(2500);
      setFallingAway(false);
      setFallenIndices([]);
      setScreenFading(false);
      navigate(`/game?mode=${mode}&difficulty=${difficulty}`);
    }, 5500);
  };

  // Any overlay open?
  const anyOverlayVisible = settingsVisible || leaderboardVisible || faqVisible;

  const mainTransition = 'transform 1.44s cubic-bezier(0.4,0,0.2,1), opacity 1.44s cubic-bezier(0.4,0,0.2,1)';
  const mainStyle = {
    transition: mainTransition,
    transform: anyOverlayVisible ? 'scale(0.88)' : 'scale(1)',
    opacity: anyOverlayVisible ? 0 : 1,
    pointerEvents: anyOverlayVisible ? 'none' : 'auto',
  };

  return (
    <div
      className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-between px-4 md:px-8 py-8"
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(env(safe-area-inset-top), 0.5rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
        ...(screenFading ? { animation: 'fade-to-game 1.5s ease-in forwards' } : {}),
      }}
    >
      <CRTOverlay />

      {/* Background grid */}
      <div className="fixed inset-0 opacity-5 pointer-events-none"
           style={{ zIndex: 0,
             backgroundImage: `linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)`,
             backgroundSize: '40px 40px',
           }} />

      {/* Music mute — top-left on mobile/tablet, top-right on desktop */}
      <button
        onClick={toggleMusicMute}
        className="fixed top-4 left-4 md:left-auto md:right-4 z-20 w-10 h-10 rounded-full glass-panel border border-border/50
                   flex items-center justify-center text-muted-foreground hover:text-cyan hover:border-cyan/50 transition-all"
      >
        {musicMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

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

      {/* All main content */}
      <div className="w-full flex flex-col items-center justify-between flex-1 gap-4" style={mainStyle}>

        {/* Title */}
        <div
          className="relative z-10 text-center flex-shrink-0"
          style={glitching ? { animation: 'glitch-distort 0.75s ease-in-out forwards' } : {}}
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
                  style={fallenIndices.includes(0) ? { animation: 'fall-away 1.8s cubic-bezier(0.55, 0, 1, 0.45) forwards' } : {}}
                >
                  ← Back
                </button>
                <div
                  className="font-orbitron text-sm text-muted-foreground text-center uppercase tracking-widest mb-2"
                  style={fallenIndices.includes(1) ? { animation: 'fall-away 1.8s cubic-bezier(0.55, 0, 1, 0.45) forwards' } : {}}
                >
                  Select Difficulty
                </div>
                {Object.entries(DIFFICULTIES).map(([key, diff], i) => (
                  <DifficultyButton
                    key={key} diffKey={key} diff={diff}
                    onClick={() => startGame(key)}
                    onHoverStart={() => { fadeBgMusic(0.15, 500); playDifficultyTrack(key); }}
                    onHoverEnd={() => { stopDifficultyTrack(); fadeBgMusic(1, 800); }}
                    falling={fallenIndices.includes(i + 2)}
                    disabled={fallingAway}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* How to play */}
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

      {/* Leaderboard overlay */}
      {leaderboardMounted && (
        <OverlayWrapper visible={leaderboardVisible} onClose={closeLeaderboard}>
          <Leaderboard onClose={closeLeaderboard} />
        </OverlayWrapper>
      )}

      {/* FAQ overlay */}
      {faqMounted && (
        <OverlayWrapper visible={faqVisible} onClose={closeFaq}>
          <FAQ onClose={closeFaq} />
        </OverlayWrapper>
      )}

      {/* Settings overlay */}
      {settingsMounted && (
        <OverlayWrapper visible={settingsVisible} onClose={closeSettings} maxWidth="384px">
          <SettingsModal
            onClose={closeSettings}
            currentTheme={currentTheme}
            onThemeChange={setCurrentTheme}
          />
        </OverlayWrapper>
      )}
    </div>
  );
}

function OverlayWrapper({ visible, onClose, maxWidth = '448px', children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        transition: 'opacity 1.44s cubic-bezier(0.4,0,0.2,1)',
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        className="absolute inset-0 bg-obsidian/90"
        onClick={onClose}
        style={{
          transition: 'opacity 1.44s cubic-bezier(0.4,0,0.2,1)',
          opacity: visible ? 1 : 0,
        }}
      />
      <div
        style={{
          transition: 'transform 1.44s cubic-bezier(0.22,1,0.36,1), opacity 1.44s cubic-bezier(0.4,0,0.2,1)',
          transform: visible ? 'scale(1)' : 'scale(0.7)',
          opacity: visible ? 1 : 0,
          position: 'relative', width: '100%', maxWidth,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function DifficultyButton({ diffKey, diff, onClick, onHoverStart, onHoverEnd, falling, disabled }) {
  const colors = {
    easy:    { border: 'border-cyan/30 hover:border-cyan',      text: 'text-cyan',    glow: 'hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]' },
    normal:  { border: 'border-yellow/30 hover:border-yellow',  text: 'text-yellow',  glow: 'hover:shadow-[0_0_20px_rgba(255,230,0,0.15)]' },
    hard:    { border: 'border-magenta/30 hover:border-magenta', text: 'text-magenta', glow: 'hover:shadow-[0_0_20px_rgba(255,0,102,0.15)]' },
    extreme: { border: 'border-red-500/30 hover:border-red-500', text: 'text-red-500', glow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]' },
  };
  const c = colors[diffKey];
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      style={falling ? { animation: 'fall-away 1.8s cubic-bezier(0.55, 0, 1, 0.45) forwards' } : {}}
      className={`glass-panel rounded-lg px-5 py-3 flex items-center justify-center gap-2 border transition-all duration-300 w-48
                  ${c.border} ${c.glow} active:scale-[0.98]`}
    >
      <span className={`font-orbitron text-lg font-bold ${c.text}`}>{diff.label}</span>
      {diffKey === 'hard' && <span className="text-base text-magenta/70">☠</span>}
      {diffKey === 'extreme' && <span className="text-xl text-red-500/70 animate-pulse">☠☠☠</span>}
    </button>
  );
}
