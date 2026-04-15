import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  DIFFICULTIES, MAX_SCORE,
  createGameState, validateCounterMove, applyCounterMove,
  generateCPUMove, applyCPUMove, getNextRequiredCounter, getPoolMax,
} from '@void-count/core';
import GameHUD from '../components/GameHUD';
import TimerBar from '../components/TimerBar';
import NumberInput from '../components/NumberInput';
import LossScreen from '../components/LossScreen';
import Leaderboard from '../components/Leaderboard';
import CRTOverlay from '../components/CRTOverlay';
import { isDebugMode } from '../lib/settings';
import { stopVoice } from '../lib/voice';
import { COLORS, FONTS } from '../theme';

// Score-tiered CPU response ranges (ported from apps/web/src/pages/Game.jsx).
const CPU_RESPONSE_TIERS = {
  easy:    [[120, 250, 1000], [70, 500, 2000], [30, 500, 2500], [-1, 500, 3000]],
  normal:  [[120, 500, 1500], [50, 500, 2000], [10, 500, 2500], [-1, 500, 3000]],
  hard:    [[120, 250, 1000], [50, 500, 1500], [10, 500, 2000], [-1, 500, 3000]],
  extreme: [[120, 250, 1000], [50, 250, 1500], [10, 500, 2000], [-1, 500, 3000]],
};
function getCpuResponseRange(difficulty, score) {
  const tiers = CPU_RESPONSE_TIERS[difficulty] || CPU_RESPONSE_TIERS.normal;
  for (const [threshold, min, max] of tiers) if (score > threshold) return [min, max];
  return [500, 3000];
}

export default function GameScreen({ route, navigation }) {
  const { mode = 'single', difficulty = 'normal' } = route?.params || {};
  const diff = DIFFICULTIES[difficulty] || DIFFICULTIES.normal;

  const [gameState, setGameState] = useState(() => createGameState(mode, difficulty));
  const [timerKey, setTimerKey] = useState(0);
  const [timerPct, setTimerPct] = useState(1);
  const [cpuThinking, setCpuThinking] = useState(false);
  const [cpuShuffleNumber, setCpuShuffleNumber] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [micGrace, setMicGrace] = useState(false);
  const [debugMode] = useState(() => isDebugMode());
  const [inputShakeKey, setInputShakeKey] = useState(0);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const micGraceTimeoutRef = useRef(null);
  const micGraceStartRef = useRef(0);
  const micGraceAvailableRef = useRef(true);

  // Mute mic + suspend on background per PRD privacy requirement.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') stopVoice();
    });
    return () => sub.remove();
  }, []);

  // Stop mic when the round ends or screen leaves.
  useEffect(() => {
    if (gameState.gameOver) stopVoice();
    return () => { stopVoice(); };
  }, [gameState.gameOver]);

  const endGame = useCallback((state, failureType) => {
    setGameState({ ...state, gameOver: true, failureType, endTime: Date.now() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
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
      setTimerKey(k => k + 1);
    }, delay);
  }, [mode, difficulty]);

  // Shuffle during CPU thinking for extreme > 30 and hard > 100.
  useEffect(() => {
    const state = gameStateRef.current;
    const score = state.highestCounterNumber || 0;
    const active = cpuThinking && (
      (difficulty === 'extreme' && score > 30) ||
      (difficulty === 'hard' && score > 100)
    );
    if (!active) { setCpuShuffleNumber(null); return; }
    const poolMax = getPoolMax(difficulty);
    const nextSeq = getNextRequiredCounter(state);
    const maxJ = diff.jump;
    const pool = [];
    for (let n = nextSeq; n <= poolMax && pool.length < maxJ + 1; n++) {
      if (!state.allNumbers.has(n)) pool.push(n);
    }
    if (!pool.length) return;
    const pick = () => pool[Math.floor(Math.random() * pool.length)];
    setCpuShuffleNumber(pick());
    const id = setInterval(() => setCpuShuffleNumber(pick()), 35);
    return () => clearInterval(id);
  }, [cpuThinking, difficulty, diff.jump]);

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

  useEffect(() => () => { if (micGraceTimeoutRef.current) clearTimeout(micGraceTimeoutRef.current); }, []);

  const handleCounterSubmit = useCallback((number) => {
    const state = gameStateRef.current;
    if (state.gameOver || state.currentTurn !== 'counter') return;
    if (cpuThinking) return;
    if (!state.isStarted && number !== 1) return;

    const validation = validateCounterMove(state, number);
    if (!validation.valid) {
      setInputShakeKey(k => k + 1);
      endGame(state, validation.reason);
      return;
    }

    const isFirstMove = !state.isStarted && number === 1;
    const newState = applyCounterMove(state, number);
    setGameState(newState);
    micGraceAvailableRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (mode === 'single') doCPUTurn(newState);
    else setTimerKey(k => k + 1);
    if (isFirstMove) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [cpuThinking, mode, endGame, doCPUTurn]);

  const handleRestart = () => {
    stopVoice();
    setGameState(createGameState(mode, difficulty));
    setTimerKey(k => k + 1);
    setTimerPct(1);
    micGraceAvailableRef.current = true;
    if (micGraceTimeoutRef.current) { clearTimeout(micGraceTimeoutRef.current); micGraceTimeoutRef.current = null; }
    setMicGrace(false);
  };

  const timerRunning = gameState.isStarted && !gameState.gameOver && !cpuThinking && !micGrace &&
    (gameState.currentTurn === 'counter' || mode === 'local');

  const isInputDisabled = gameState.gameOver || cpuThinking ||
    (mode === 'single' && gameState.currentTurn === 'controller');

  return (
    <SafeAreaView style={styles.safe}>
      <CRTOverlay />
      <View style={styles.top}>
        <Pressable onPress={() => { stopVoice(); navigation.goBack(); }} hitSlop={8}>
          <Text style={styles.topExit}>← EXIT</Text>
        </Pressable>
        <Text style={styles.topDiff}>{diff.label}</Text>
        <Text style={styles.topMode}>{mode === 'single' ? '1P' : '2P'}</Text>
      </View>

      <View style={styles.body}>
        <GameHUD gameState={gameState} timerPct={timerPct} mode={mode} debugMode={debugMode} difficulty={difficulty} />

        {!gameState.isStarted && !gameState.gameOver && (
          <View style={styles.center}>
            <Text style={styles.beginHeader}>ENTER "1" TO BEGIN</Text>
            <Text style={styles.beginSub}>The timer starts when you fire the starting gun</Text>
          </View>
        )}

        {cpuThinking && (
          <View style={styles.center}>
            {cpuShuffleNumber !== null ? (
              <>
                <Text style={styles.scanningLabel}>CONTROLLER SCANNING…</Text>
                <Text style={styles.scanningNumber}>{cpuShuffleNumber}</Text>
              </>
            ) : (
              <Text style={styles.thinking}>CONTROLLER THINKING...</Text>
            )}
          </View>
        )}

        {gameState.isStarted && !gameState.gameOver && (
          <TimerBar
            duration={effectiveTimerDuration}
            isRunning={timerRunning}
            onTimeout={handleTimeout}
            onTick={setTimerPct}
            resetKey={timerKey}
          />
        )}

        <View style={styles.inputWrap}>
          <NumberInput
            onSubmit={handleCounterSubmit}
            disabled={isInputDisabled}
            shakeKey={inputShakeKey}
            onMicActivate={handleMicActivate}
          />
        </View>
      </View>

      <LossScreen
        visible={gameState.gameOver && !showLeaderboard}
        gameState={gameState}
        onRestart={handleRestart}
        onHome={() => navigation.navigate('Home')}
        onShowLeaderboard={() => setShowLeaderboard(true)}
      />
      <Leaderboard
        visible={showLeaderboard}
        onClose={() => { setShowLeaderboard(false); navigation.navigate('Home'); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  top: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  topExit: { color: COLORS.mute, letterSpacing: 2, fontSize: 11 },
  topDiff: { color: COLORS.fg, letterSpacing: 3, fontWeight: '900', fontSize: 13 },
  topMode: { color: COLORS.mute, fontFamily: FONTS.mono, fontSize: 11 },
  body: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'space-between' },
  center: { alignItems: 'center', marginVertical: 12 },
  beginHeader: { color: COLORS.yellow, fontSize: 20, fontWeight: '900', letterSpacing: 3 },
  beginSub: { color: COLORS.mute, fontSize: 10, fontFamily: FONTS.mono, marginTop: 4 },
  thinking: { color: COLORS.magenta, fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  scanningLabel: { color: COLORS.magenta, fontSize: 10, letterSpacing: 3, fontFamily: FONTS.mono },
  scanningNumber: { color: COLORS.magenta, fontSize: 56, fontWeight: '900', marginTop: 4 },
  inputWrap: { marginBottom: 8 },
});
