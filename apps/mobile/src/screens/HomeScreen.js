import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DIFFICULTIES } from '@void-count/core';
import Settings from '../components/Settings';
import Leaderboard from '../components/Leaderboard';
import { COLORS, FONTS } from '../theme';

export default function HomeScreen({ navigation }) {
  const [mode, setMode] = useState('single');
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const startGame = (difficulty) => {
    navigation.navigate('Game', { mode, difficulty });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <Text style={styles.title}>VOID</Text>
        <Text style={styles.titleMagenta}>COUNT</Text>
        <Text style={styles.subtitle}>Count. Survive. Don't repeat.</Text>

        <View style={styles.modes}>
          <Pressable onPress={() => setMode('single')} style={[styles.modeBtn, mode === 'single' && styles.modeBtnActiveCyan]}>
            <Text style={[styles.modeText, mode === 'single' && { color: COLORS.cyan }]}>1P vs CPU</Text>
          </Pressable>
          <Pressable onPress={() => setMode('local')} style={[styles.modeBtn, mode === 'local' && styles.modeBtnActiveMagenta]}>
            <Text style={[styles.modeText, mode === 'local' && { color: COLORS.magenta }]}>2P LOCAL</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>SELECT DIFFICULTY</Text>

        <ScrollView contentContainerStyle={styles.list}>
          {Object.entries(DIFFICULTIES).map(([key, diff]) => (
            <Pressable
              key={key}
              onPress={() => startGame(key)}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            >
              <Text style={styles.buttonText}>{diff.label}</Text>
              <Text style={styles.buttonMeta}>jump +{diff.jump} · {diff.timer}s timer</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.bottom}>
          <Pressable onPress={() => setShowSettings(true)} style={styles.iconBtn}>
            <Text style={styles.iconText}>⚙ SETTINGS</Text>
          </Pressable>
          <Pressable onPress={() => setShowLeaderboard(true)} style={styles.iconBtn}>
            <Text style={styles.iconText}>🏆 RANKINGS</Text>
          </Pressable>
        </View>
      </View>

      <Settings visible={showSettings} onClose={() => setShowSettings(false)} />
      <Leaderboard visible={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  wrap: { flex: 1, paddingHorizontal: 20, paddingTop: 24, alignItems: 'center' },
  title: { fontSize: 64, fontWeight: '900', color: COLORS.cyan, letterSpacing: 4, textShadowColor: 'rgba(0,240,255,0.4)', textShadowRadius: 12 },
  titleMagenta: { fontSize: 64, fontWeight: '900', color: COLORS.magenta, letterSpacing: 4, marginTop: -16, textShadowColor: 'rgba(255,0,102,0.4)', textShadowRadius: 12 },
  subtitle: { fontSize: 12, color: COLORS.mute, marginTop: 4, marginBottom: 24, letterSpacing: 3, fontFamily: FONTS.mono },
  modes: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modeBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: 'rgba(255,255,255,0.03)' },
  modeBtnActiveCyan: { borderColor: COLORS.cyanDim, backgroundColor: 'rgba(0,240,255,0.1)' },
  modeBtnActiveMagenta: { borderColor: COLORS.magentaDim, backgroundColor: 'rgba(255,0,102,0.1)' },
  modeText: { color: COLORS.mute, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  sectionLabel: { color: COLORS.yellow, fontSize: 10, letterSpacing: 3, fontFamily: FONTS.mono, marginBottom: 8 },
  list: { gap: 10, paddingVertical: 4 },
  button: {
    paddingVertical: 16, paddingHorizontal: 18, borderRadius: 12,
    backgroundColor: COLORS.bgAlt, borderWidth: 2, borderColor: COLORS.cyanDim,
    minWidth: 280,
  },
  buttonPressed: { borderColor: COLORS.cyan, backgroundColor: 'rgba(0,240,255,0.1)' },
  buttonText: { color: COLORS.cyan, fontSize: 18, fontWeight: '900', letterSpacing: 3 },
  buttonMeta: { color: COLORS.mute, fontSize: 11, marginTop: 4, fontFamily: FONTS.mono },
  bottom: { flexDirection: 'row', gap: 8, marginTop: 16 },
  iconBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  iconText: { color: COLORS.mute, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
});
