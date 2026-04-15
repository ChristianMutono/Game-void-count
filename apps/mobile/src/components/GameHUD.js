import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getNextRequiredCounter, getScore, getLeaderboard } from '@void-count/core';
import GlitchText from './GlitchText';
import { COLORS, FONTS } from '../theme';

export default function GameHUD({ gameState, timerPct, mode, debugMode, difficulty }) {
  const score = getScore(gameState);
  const nextRequired = getNextRequiredCounter(gameState);
  const isCounterTurn = gameState.currentTurn === 'counter';
  const topScore = (() => {
    const entries = getLeaderboard().filter(e => e.difficulty === gameState.difficulty);
    if (entries.length === 0) return 0;
    return Math.max(...entries.map(e => e.score || 0));
  })();

  const lastControllerNum = gameState.controllerHistory && gameState.controllerHistory.length > 0
    ? gameState.controllerHistory[gameState.controllerHistory.length - 1]
    : undefined;

  const isHardOrExtreme = difficulty === 'hard' || difficulty === 'extreme';
  const scoreBoxOpacity = isHardOrExtreme
    ? 1 - 0.75 * Math.max(0, Math.min(1, (score - 25) / 75))
    : 1;

  const topGlitchOn = isHardOrExtreme && score > 50 && !gameState.gameOver;
  const scoreGlitchOn = difficulty === 'extreme' && score > 50 && !gameState.gameOver;
  const [topBurst, setTopBurst] = useState(false);
  const [scoreBurst, setScoreBurst] = useState(false);

  useEffect(() => {
    if (!topGlitchOn) { setTopBurst(false); return; }
    let active = true, t1, t2;
    const tick = () => {
      if (!active) return;
      const delay = Math.random() * 49000;
      t1 = setTimeout(() => {
        if (!active) return;
        setTopBurst(true);
        t2 = setTimeout(() => { if (!active) return; setTopBurst(false); tick(); }, 700);
      }, delay);
    };
    tick();
    return () => { active = false; clearTimeout(t1); clearTimeout(t2); };
  }, [topGlitchOn]);

  useEffect(() => {
    if (!scoreGlitchOn) { setScoreBurst(false); return; }
    let active = true, t1, t2;
    const tick = () => {
      if (!active) return;
      const delay = Math.random() * 60000;
      t1 = setTimeout(() => {
        if (!active) return;
        setScoreBurst(true);
        t2 = setTimeout(() => { if (!active) return; setScoreBurst(false); tick(); }, 700);
      }, delay);
    };
    tick();
    return () => { active = false; clearTimeout(t1); clearTimeout(t2); };
  }, [scoreGlitchOn]);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.box, { opacity: scoreBoxOpacity }]}>
          <Text style={styles.label}>SCORE</Text>
          <GlitchText
            style={[styles.number, { color: COLORS.cyan }]}
            color={COLORS.cyan}
            offsetColor1={COLORS.magenta}
            offsetColor2={COLORS.cyan}
            burst={scoreBurst}
          >
            {String(score)}
          </GlitchText>
        </View>

        <View style={[styles.box, styles.boxMid, { borderColor: isCounterTurn ? COLORS.cyanDim : COLORS.magentaDim }]}>
          <Text style={styles.label}>TURN</Text>
          <Text style={[styles.turn, { color: isCounterTurn ? COLORS.cyan : COLORS.magenta }]}>
            {isCounterTurn ? 'COUNTER' : 'CTRL'}
          </Text>
        </View>

        {debugMode ? (
          <View style={[styles.box, styles.boxRight]}>
            <Text style={styles.label}>NEXT</Text>
            <Text style={[styles.number, { color: COLORS.yellow }]}>{nextRequired}</Text>
          </View>
        ) : (
          <View style={[styles.box, styles.boxRight, { opacity: scoreBoxOpacity }]}>
            <Text style={styles.label}>TOP</Text>
            <GlitchText
              style={[styles.number, { color: COLORS.yellow }]}
              color={COLORS.yellow}
              offsetColor1={COLORS.magenta}
              offsetColor2={COLORS.cyan}
              burst={topBurst}
            >
              {String(topScore)}
            </GlitchText>
          </View>
        )}
      </View>

      {lastControllerNum !== undefined && (
        <View style={styles.bigCard}>
          <Text style={styles.bigLabel}>CONTROLLER'S LAST — AVOID</Text>
          <Text style={styles.bigNumber}>{lastControllerNum}</Text>
        </View>
      )}

      {debugMode && (
        <View style={styles.debugRow}>
          <View style={[styles.debugPanel, { borderColor: COLORS.cyanDim }]}>
            <Text style={[styles.debugHeader, { color: COLORS.cyan }]}>COUNTER</Text>
            <Text style={styles.debugText} numberOfLines={3}>
              {(gameState.counterHistory || []).join(', ') || '—'}
            </Text>
          </View>
          <View style={[styles.debugPanel, { borderColor: COLORS.magentaDim }]}>
            <Text style={[styles.debugHeader, { color: COLORS.magenta }]}>CONTROLLER</Text>
            <Text style={styles.debugText} numberOfLines={3}>
              {(gameState.controllerHistory || []).join(', ') || '—'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  box: {
    backgroundColor: COLORS.panel,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
  },
  boxMid: { alignItems: 'center', borderWidth: 1 },
  boxRight: { alignItems: 'flex-end' },
  label: { fontSize: 10, color: COLORS.mute, letterSpacing: 2, fontFamily: FONTS.mono },
  number: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  turn: { fontSize: 16, fontWeight: '800', letterSpacing: 2, marginTop: 2 },
  bigCard: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,102,0.08)',
    borderWidth: 1,
    borderColor: COLORS.magentaDim,
  },
  bigLabel: { fontSize: 10, color: COLORS.mute, letterSpacing: 2, fontFamily: FONTS.mono },
  bigNumber: { color: COLORS.magenta, fontSize: 64, fontWeight: '900', marginTop: 4 },
  debugRow: { flexDirection: 'row', gap: 8 },
  debugPanel: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 8, backgroundColor: COLORS.panel },
  debugHeader: { fontSize: 10, letterSpacing: 2, marginBottom: 4 },
  debugText: { fontSize: 11, color: COLORS.fg, fontFamily: FONTS.mono },
});
