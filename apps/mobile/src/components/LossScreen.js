import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import {
  getTaunt, getScore, getElapsedTime, saveToLeaderboard,
  getPlayerName, setPlayerName, MAX_NAME_LEN,
} from '@void-count/core';
import { isDebugMode, MR_RAW_NAMES } from '../lib/settings';
import { COLORS, FONTS } from '../theme';

export default function LossScreen({ visible, gameState, onRestart, onHome, onShowLeaderboard }) {
  const [taunt, setTaunt] = useState('');
  const [name, setName] = useState(getPlayerName());
  const savedRef = useRef(false);

  useEffect(() => {
    if (visible && gameState) {
      setTaunt(getTaunt(gameState.failureType, getScore(gameState), gameState.difficulty));
      setName(getPlayerName());
    }
  }, [visible, gameState]);

  // Reset the one-shot save guard whenever a new game-over is surfaced,
  // so a new round can save exactly once even though the component is reused.
  useEffect(() => {
    if (gameState && gameState.gameOver) savedRef.current = false;
  }, [gameState?.gameOver, gameState?.endTime]);

  if (!gameState) return null;
  const score = getScore(gameState);
  const elapsed = getElapsedTime(gameState).toFixed(1);
  const won = gameState.counterWon;

  const handleExit = (cb) => {
    const saved = setPlayerName(name);
    if (!savedRef.current) {
      savedRef.current = true;
      if (!isDebugMode() || MR_RAW_NAMES.includes(saved)) {
        saveToLeaderboard({
          score,
          playerName: saved,
          time: parseFloat(elapsed),
          difficulty: gameState.difficulty,
          mode: gameState.mode,
          failureType: gameState.failureType,
          date: new Date().toISOString(),
        });
      }
    }
    cb && cb();
  };

  const failureLabels = {
    duplicate: 'DUPLICATE DETECTED',
    stolen: 'NUMBER STOLEN',
    invalid_jump: 'INVALID SEQUENCE',
    timeout: 'TIME EXPIRED',
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={[styles.header, { color: won ? COLORS.cyan : COLORS.magenta }]}>
            {won ? 'VOID CONQUERED' : 'SYSTEM FAILURE'}
          </Text>
          <Text style={styles.sub}>{won ? 'MAX_SCORE REACHED' : failureLabels[gameState.failureType] || ''}</Text>

          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>FINAL COUNT</Text>
            <Text style={styles.scoreValue}>{score}</Text>
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statsLabel}>Time</Text>
                <Text style={styles.statsYellow}>{elapsed}s</Text>
              </View>
              <View>
                <Text style={styles.statsLabel}>Diff</Text>
                <Text style={styles.statsCyan}>{(gameState.difficulty || '').toUpperCase()}</Text>
              </View>
            </View>

            <Text style={styles.nameLabel}>Your Name</Text>
            <TextInput
              value={name}
              onChangeText={(t) => setName(t.slice(0, MAX_NAME_LEN))}
              style={styles.nameInput}
              maxLength={MAX_NAME_LEN}
              placeholder="Player 1"
              placeholderTextColor={COLORS.muteDim}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.taunt}>
            <Text style={styles.tauntText}>"{taunt}"</Text>
          </View>

          <View style={styles.buttons}>
            <Pressable style={[styles.btn, styles.btnCyan]} onPress={() => handleExit(onRestart)}>
              <Text style={[styles.btnText, { color: COLORS.cyan }]}>RETRY</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnYellow]} onPress={() => handleExit(onShowLeaderboard)}>
              <Text style={[styles.btnText, { color: COLORS.yellow }]}>RANKS</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnMuted]} onPress={() => handleExit(onHome)}>
              <Text style={[styles.btnText, { color: COLORS.mute }]}>EXIT</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: 14 },
  header: { fontSize: 36, fontWeight: '900', textAlign: 'center', letterSpacing: 3 },
  sub: { fontSize: 12, color: COLORS.yellow, textAlign: 'center', letterSpacing: 3, fontFamily: FONTS.mono },
  scoreCard: {
    backgroundColor: 'rgba(255,0,102,0.08)',
    borderWidth: 1,
    borderColor: COLORS.magentaDim,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
  },
  scoreLabel: { fontSize: 10, color: COLORS.mute, letterSpacing: 3, fontFamily: FONTS.mono },
  scoreValue: { color: COLORS.cyan, fontSize: 72, fontWeight: '900', marginVertical: 6 },
  statsRow: { flexDirection: 'row', gap: 32, marginBottom: 14 },
  statsLabel: { fontSize: 10, color: COLORS.mute, letterSpacing: 2, fontFamily: FONTS.mono },
  statsYellow: { color: COLORS.yellow, fontSize: 14, fontFamily: FONTS.mono, marginTop: 2 },
  statsCyan: { color: COLORS.cyan, fontSize: 14, fontFamily: FONTS.mono, marginTop: 2 },
  nameLabel: { fontSize: 10, color: COLORS.mute, letterSpacing: 2, fontFamily: FONTS.mono, alignSelf: 'flex-start', marginBottom: 4 },
  nameInput: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: COLORS.cyanDim,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.cyan,
    fontWeight: '900',
    textAlign: 'center',
    backgroundColor: 'rgba(0,240,255,0.05)',
  },
  taunt: {
    backgroundColor: COLORS.panel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  tauntText: { color: COLORS.fg, fontSize: 13, fontStyle: 'italic', lineHeight: 19, fontFamily: FONTS.mono },
  buttons: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  btnCyan: { borderColor: COLORS.cyan, backgroundColor: 'rgba(0,240,255,0.1)' },
  btnYellow: { borderColor: COLORS.yellow, backgroundColor: 'rgba(255,230,0,0.1)' },
  btnMuted: { borderColor: COLORS.border, backgroundColor: 'rgba(255,255,255,0.05)' },
  btnText: { fontSize: 13, fontWeight: '900', letterSpacing: 2 },
});
