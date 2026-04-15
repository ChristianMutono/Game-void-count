import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createGameState,
  validateCounterMove,
  applyCounterMove,
  generateCPUMove,
  applyCPUMove,
  DIFFICULTIES,
  getNextRequiredCounter,
  getPoolMax,
} from '@void-count/core';
import { sounds, getMusicVolume, isMuted, registerAudio, unregisterAudio } from '../lib/sounds';
import CRTOverlay from '../components/game/CRTOverlay';
import TimerBar from '../components/game/TimerBar';
import NumberInput from '../components/game/NumberInput';
import GameHUD from '../components/game/GameHUD';
import LossScreen from '../components/game/LossScreen';
import Leaderboard from '../components/game/Leaderboard';
import { isDebugMode } from '../components/game/SettingsModal';
import { Volume2, VolumeX } from 'lucide-react';

// Dynamic CPU response ranges [minMs, maxMs]. Tiers key off the counter's
// highest submitted number (the current "score") so the controller presses
// harder as the round matures. See PRD §3.3.
const CPU_RESPONSE_TIERS = {
  easy:    [[120, 250, 1000], [70, 500, 2000], [30, 500, 2500], [-1, 500, 3000]],
  normal:  [[120, 500, 1500], [50, 500, 2000], [10, 500, 2500], [-1, 500, 3000]],
  hard:    [[120, 250, 1000], [50, 500, 1500], [10, 500, 2000], [-1, 500, 3000]],
  extreme: [[120, 250, 1000], [50, 250, 1500], [10, 500, 2000], [-1, 500, 3000]],
};
function getCpuResponseRange(difficulty, score) {
  const tiers = CPU_RESPONSE_TIERS[difficulty] || CPU_RESPONSE_TIERS.normal;
  for (const [threshold, min, max] of tiers) {
    if (score > threshold) return [min, max];
  }
  return [500, 3000];
}

export default function Game() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode') || 'single';
  const difficulty = params.get('difficulty') || 'normal';
  const diff = DIFFICULTIES[difficulty] || DIFFICULTIES.normal;

  const [gameState, setGameState] = useState(() => createGameState(mode, difficulty));
  const [timerKey, setTimerKey] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [cpuThinking, setCpuThinking] = useState(false);
  const [flashColor, setFlashColor] = useState(null);
  const [timerPct, setTimerPct] = useState(1);
  const [inputShakeKey, setInputShakeKey] = useState(0);
  const [debugMode] = useState(() => isDebugMode());
  const [musicMuted, setMusicMuted] = useState(false);
  const [micGrace, setMicGrace] = useState(false);
  const [cpuShuffleNumber, setCpuShuffleNumber] = useState(null);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const cpuPreppedRef = useRef(false);
  const bgMusicRef = useRef(null);
  const micGraceTimeoutRef = useRef(null);
  const micGraceStartRef = useRef(0);
  const micGraceAvailableRef = useRef(true);

  // Background music at 70% of set volume, fades in gently
  useEffect(() => {
    if (isMuted() || musicMuted) {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        unregisterAudio(bgMusicRef.current);
        bgMusicRef.current = null;
      }
      return;
    }
    const audio = new Audio('/audio/homescreen_background.mp3');
    audio.loop = true;
    const targetVol = getMusicVolume() * 0.5;
    audio.volume = 0;
    audio.play().catch(() => {});
    registerAudio(audio);
    bgMusicRef.current = audio;
    // Fade in over 2s
    const steps = 40;
    const interval = 2000 / steps;
    let step = 0;
    const fade = setInterval(() => {
      step++;
      if (!bgMusicRef.current || bgMusicRef.current !== audio) { clearInterval(fade); return; }
      audio.volume = Math.min(targetVol, (step / steps) * targetVol);
      if (step >= steps) clearInterval(fade);
    }, interval);
    return () => {
      clearInterval(fade);
      audio.pause();
      audio.currentTime = 0;
      unregisterAudio(audio);
      bgMusicRef.current = null;
    };
  }, [musicMuted]);

  const flashScreen = (color) => {
    setFlashColor(color);
    setTimeout(() => setFlashColor(null), 200);
  };

  const endGame = useCallback((state, failureType) => {
    setGameState({ ...state, gameOver: true, failureType, endTime: Date.now() });
    if (failureType === 'timeout') sounds.timeout();
    else sounds.error();
  }, []);

  const handleTimeout = useCallback(() => {
    if (gameStateRef.current.gameOver) return;
    endGame(gameStateRef.current, 'timeout');
  }, [endGame]);

  const doCPUTurn = useCallback((state) => {
    if (mode !== 'single') return;
    setCpuThinking(true);
    const [minMs, maxMs] = getCpuResponseRange(difficulty, state.highestCounterNumber || 0);
    const delay = minMs + Math.random() * (maxMs - minMs);

    setTimeout(() => {
      const cpuNum = generateCPUMove(state, difficulty);
      const newState = applyCPUMove(state, cpuNum);
      newState.controllerTimeMs = (state.controllerTimeMs || 0) + delay;
      setGameState(newState);
      setCpuThinking(false);
      flashScreen('magenta');
      sounds.cpuMove();
      setTimerKey(k => k + 1);
    }, delay);
  }, [mode, difficulty]);

  const scoreSoFar = gameState.highestCounterNumber || 0;
  const grace77 = (difficulty === 'easy' || difficulty === 'normal') && scoreSoFar >= 77 ? 0.5 : 0;
  const grace100 = scoreSoFar >= 100 ? 0.5 : 0;
  const effectiveTimerDuration = diff.timer + grace77 + grace100;

  const handleMicActivate = useCallback(() => {
    if (!micGraceAvailableRef.current) return;
    if (micGraceTimeoutRef.current) return;
    micGraceAvailableRef.current = false;
    micGraceStartRef.current = Date.now();
    setMicGrace(true);
    micGraceTimeoutRef.current = setTimeout(() => {
      const elapsed = Date.now() - micGraceStartRef.current;
      setMicGrace(false);
      micGraceTimeoutRef.current = null;
      setGameState((s) => ({ ...s, micGraceTimeMs: (s.micGraceTimeMs || 0) + elapsed }));
    }, 1500);
  }, []);

  useEffect(() => () => {
    if (micGraceTimeoutRef.current) clearTimeout(micGraceTimeoutRef.current);
  }, []);

  useEffect(() => {
    const state = gameStateRef.current;
    const score = state.highestCounterNumber || 0;
    const shuffleActive =
      cpuThinking &&
      ((difficulty === 'extreme' && score > 30) ||
       (difficulty === 'hard' && score > 100));
    if (!shuffleActive) {
      setCpuShuffleNumber(null);
      return;
    }
    const poolMax = getPoolMax(difficulty);
    const nextSeq = getNextRequiredCounter(state);
    const maxJump = diff.jump;
    const pool = [];
    for (let n = nextSeq; n <= poolMax && pool.length < maxJump + 1; n++) {
      if (!state.allNumbers.has(n)) pool.push(n);
    }
    if (pool.length === 0) return;
    const pick = () => pool[Math.floor(Math.random() * pool.length)];
    setCpuShuffleNumber(pick());
    const id = setInterval(() => setCpuShuffleNumber(pick()), 35);
    return () => clearInterval(id);
  }, [cpuThinking, difficulty, diff.jump]);

  const handleCounterSubmit = useCallback((number) => {
    const state = gameStateRef.current;
    if (state.gameOver || state.currentTurn !== 'counter') return;
    if (cpuThinking) return;
    if (!state.isStarted && number !== 1) return;

    const validation = validateCounterMove(state, number);
    if (!validation.valid) {
      endGame(state, validation.reason);
      return;
    }

    const isFirstMove = !state.isStarted && number === 1;
    const newState = applyCounterMove(state, number);
    setGameState(newState);
    flashScreen('cyan');
    micGraceAvailableRef.current = true;

    if (isFirstMove) sounds.gameStart();
    else sounds.submit();

    if (mode === 'single') {
      doCPUTurn(newState);
    } else {
      setTimerKey(k => k + 1);
    }
  }, [cpuThinking, mode, endGame, doCPUTurn]);

  const handleControllerSubmit = useCallback((number) => {
    const state = gameStateRef.current;
    if (state.gameOver || state.currentTurn !== 'controller') return;
    if (mode !== 'local') return;
    if (number < 1 || state.allNumbers.has(number)) return;

    // 2P: controller cannot jump more than 9 from next available
    const nextAvail = getNextRequiredCounter(state);
    if (number > nextAvail + 9) {
      setInputShakeKey(k => k + 1);
      sounds.badInput();
      return;
    }

    const newState = applyCPUMove(state, number);
    setGameState(newState);
    flashScreen('magenta');
    sounds.cpuMove();
    setTimerKey(k => k + 1);
  }, [mode]);

  const handleSubmit = useCallback((number) => {
    const state = gameStateRef.current;
    if (state.currentTurn === 'counter') {
      handleCounterSubmit(number);
    } else if (mode === 'local') {
      handleControllerSubmit(number);
    }
  }, [handleCounterSubmit, handleControllerSubmit, mode]);

  const handleRestart = () => {
    setGameState(createGameState(mode, difficulty));
    setTimerKey(k => k + 1);
    setTimerPct(1);
    micGraceAvailableRef.current = true;
    if (micGraceTimeoutRef.current) {
      clearTimeout(micGraceTimeoutRef.current);
      micGraceTimeoutRef.current = null;
    }
    setMicGrace(false);
  };

  const timerRunning = gameState.isStarted && !gameState.gameOver && !cpuThinking && !micGrace &&
    (gameState.currentTurn === 'counter' || mode === 'local');

  const isInputDisabled = gameState.gameOver || cpuThinking ||
    (mode === 'single' && gameState.currentTurn === 'controller');

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col" style={{ minHeight: '100dvh', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <CRTOverlay />

      {flashColor && (
        <div
          className="fixed inset-0 z-30 pointer-events-none transition-opacity duration-200"
          style={{
            background: flashColor === 'cyan'
              ? 'radial-gradient(circle, rgba(0,240,255,0.1) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(255,0,102,0.1) 0%, transparent 70%)'
          }}
        />
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 pt-4 md:pt-3 border-b border-border/50">
        <button
          onClick={() => navigate('/')}
          className="font-orbitron text-sm text-muted-foreground hover:text-cyan transition-colors"
          style={{ WebkitTextStroke: '0.5px black', paintOrder: 'stroke fill' }}
        >
          ← EXIT
        </button>
        <div className="font-orbitron text-sm font-bold text-foreground/60 uppercase tracking-widest">
          {diff.label}
        </div>
        <div className="flex items-center gap-3">
          <div className="font-mono text-sm text-muted-foreground">
            {mode === 'single' ? '1P' : '2P'}
          </div>
          <button
            onClick={() => setMusicMuted(m => !m)}
            title={musicMuted ? 'Unmute music' : 'Mute music'}
            className="w-8 h-8 rounded-full glass-panel border border-border/50
                       flex items-center justify-center text-muted-foreground hover:text-cyan hover:border-cyan/50 transition-all"
          >
            {musicMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 flex flex-col items-center justify-between px-4 py-4 max-w-lg mx-auto w-full">
        <GameHUD gameState={gameState} timerPct={timerPct} mode={mode} debugMode={debugMode} difficulty={difficulty} />

        {!gameState.isStarted && !gameState.gameOver && (
          <div className="text-center my-4">
            <div className="font-orbitron text-xl md:text-2xl font-bold text-yellow glitch-text mb-2"
                 style={{ animation: 'neon-pulse 2s ease-in-out infinite' }}>
              ENTER "1" TO BEGIN
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              The timer starts when you fire the starting gun
            </div>
          </div>
        )}

        {cpuThinking && (
          <div className="text-center my-4">
            {cpuShuffleNumber !== null ? (
              <>
                <div className="font-mono text-[10px] text-magenta/60 uppercase tracking-widest mb-1">
                  Controller scanning…
                </div>
                <div
                  className="font-orbitron font-black text-magenta neon-glow-magenta tabular-nums leading-none"
                  style={{ fontSize: 'clamp(3rem, 10vw, 4.5rem)' }}
                >
                  {cpuShuffleNumber}
                </div>
              </>
            ) : (
              <div className="font-orbitron text-lg text-magenta neon-glow-magenta"
                   style={{ animation: 'neon-pulse 0.5s ease-in-out infinite' }}>
                CONTROLLER THINKING...
              </div>
            )}
          </div>
        )}

        {gameState.isStarted && !gameState.gameOver && (
          <div className="w-full max-w-sm my-3">
            <TimerBar
              key={timerKey}
              duration={effectiveTimerDuration}
              isRunning={timerRunning}
              onTimeout={handleTimeout}
              onTick={setTimerPct}
            />
          </div>
        )}

        <div className="w-full mt-auto pb-6 md:pb-4">
          {mode === 'local' && gameState.isStarted && !gameState.gameOver && (
            <div className={`text-center mb-2 font-orbitron text-sm font-bold ${
              gameState.currentTurn === 'counter' ? 'text-cyan' : 'text-magenta'
            }`}>
              {gameState.currentTurn === 'counter' ? "COUNTER'S TURN" : "CONTROLLER'S TURN"}
            </div>
          )}
          <NumberInput
            onSubmit={handleSubmit}
            disabled={isInputDisabled}
            shakeKey={inputShakeKey}
            onMicActivate={handleMicActivate}
          />
        </div>
      </div>

      {gameState.gameOver && !showLeaderboard && (
        <LossScreen
          gameState={gameState}
          onRestart={handleRestart}
          onHome={() => navigate('/')}
          onShowLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {showLeaderboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95">
          <Leaderboard onClose={() => { setShowLeaderboard(false); navigate('/'); }} />
        </div>
      )}
    </div>
  );
}