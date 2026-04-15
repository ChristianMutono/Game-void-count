import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getNextRequiredCounter, getScore, getLeaderboard } from '@void-count/core';
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

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.box, { opacity: scoreBoxOpacity }]}>
          <Text style={styles.label}>SCORE</Text>
          <Text style={[styles.number, { color: COLORS.cyan }]}>{score}</Text>
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
            <Text style={[styles.number, { color: COLORS.yellow }]}>{topScore}</Text>
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
