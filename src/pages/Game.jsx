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
} from '../lib/gameLogic';
import { sounds, getMicDefault, getMusicVolume, isMuted } from '../lib/sounds';
import CRTOverlay from '../components/game/CRTOverlay';
import TimerBar from '../components/game/TimerBar';
import NumberInput from '../components/game/NumberInput';
import GameHUD from '../components/game/GameHUD';
import LossScreen from '../components/game/LossScreen';
import Leaderboard from '../components/game/Leaderboard';
import MuteButton from '../components/game/MuteButton';
import { isDebugMode } from '../components/game/SettingsModal';

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
  const [micOn, setMicOn] = useState(!getMicDefault());

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const cpuPreppedRef = useRef(false);
  const bgMusicRef = useRef(null);

  // Background music at 70% of set volume, fades in gently
  useEffect(() => {
    if (isMuted()) return;
    const audio = new Audio('/audio/homescreen_background.mp3');
    audio.loop = true;
    const targetVol = getMusicVolume() * 0.5;
    audio.volume = 0;
    audio.play().catch(() => {});
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
      bgMusicRef.current = null;
    };
  }, []);

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
    const maxDelay = { easy: 2500, normal: 2000, hard: 1500, extreme: 1500 }[difficulty] || 2500;
    const delay = 500 + Math.random() * maxDelay;

    setTimeout(() => {
      const cpuNum = generateCPUMove(state, difficulty);
      const newState = applyCPUMove(state, cpuNum);
      setGameState(newState);
      setCpuThinking(false);
      flashScreen('magenta');
      sounds.cpuMove();
      setTimerKey(k => k + 1);
    }, delay);
  }, [mode, difficulty]);

  // Effective timer duration: add 0.5s if mic is active for speech processing
  const effectiveTimerDuration = micOn ? diff.timer + 0.5 : diff.timer;

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
  };

  const timerRunning = gameState.isStarted && !gameState.gameOver && !cpuThinking &&
    (gameState.currentTurn === 'counter' || mode === 'local');

  const isInputDisabled = gameState.gameOver || cpuThinking ||
    (mode === 'single' && gameState.currentTurn === 'controller');

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col" style={{ minHeight: '100dvh', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <CRTOverlay />
      <MuteButton />

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
        <div className="font-mono text-sm text-muted-foreground">
          {mode === 'single' ? '1P' : '2P'}
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 flex flex-col items-center justify-between px-4 py-4 max-w-lg mx-auto w-full">
        <GameHUD gameState={gameState} timerPct={timerPct} mode={mode} debugMode={debugMode} />

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
            <div className="font-orbitron text-lg text-magenta neon-glow-magenta"
                 style={{ animation: 'neon-pulse 0.5s ease-in-out infinite' }}>
              CONTROLLER THINKING...
            </div>
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
          />
        </div>
      </div>

      {gameState.gameOver && (
        <LossScreen
          gameState={gameState}
          onRestart={handleRestart}
          onHome={() => navigate('/')}
          onShowLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {showLeaderboard && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  );
}