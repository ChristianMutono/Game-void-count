import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DIFFICULTIES } from '@void-count/core';

// Placeholder game screen. The full game loop, HUD, timer bar, number input,
// and voice integration are to be ported from apps/web/src while sharing
// @void-count/core for rules and taunts. See docs/mobile/03_Technical_Architecture_TAD.md.
export default function GameScreen({ route, navigation }) {
  const { mode = 'single', difficulty = 'normal' } = route?.params || {};
  const diff = DIFFICULTIES[difficulty] || DIFFICULTIES.normal;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <Text style={styles.label}>DIFFICULTY</Text>
        <Text style={styles.difficulty}>{diff.label}</Text>

        <View style={styles.stats}>
          <Stat label="Jump" value={`+${diff.jump}`} />
          <Stat label="Timer" value={`${diff.timer}s`} />
          <Stat label="Mode" value={mode === 'single' ? '1P' : '2P'} />
        </View>

        <Text style={styles.placeholder}>
          Game loop not yet ported. Core rules and taunt system are already shared via @void-count/core.
        </Text>

        <View style={styles.back}>
          <Text onPress={() => navigation.goBack()} style={styles.backText}>← BACK</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#05060b' },
  wrap: { flex: 1, paddingHorizontal: 24, paddingTop: 32, alignItems: 'center' },
  label: { color: '#888', fontSize: 10, letterSpacing: 3 },
  difficulty: { color: '#ff0066', fontSize: 42, fontWeight: '900', marginTop: 4, letterSpacing: 4 },
  stats: { flexDirection: 'row', gap: 24, marginTop: 32 },
  stat: { alignItems: 'center' },
  statLabel: { color: '#666', fontSize: 10, letterSpacing: 2 },
  statValue: { color: '#ffe600', fontSize: 22, fontWeight: '800', marginTop: 4 },
  placeholder: {
    color: '#555',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 48,
    textAlign: 'center',
    maxWidth: 280,
    fontFamily: 'Courier',
  },
  back: { position: 'absolute', top: 16, left: 24 },
  backText: { color: '#888', letterSpacing: 2, fontSize: 12 },
});
