import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DIFFICULTIES } from '@void-count/core';

export default function HomeScreen({ navigation }) {
  const startGame = (difficulty) => {
    navigation.navigate('Game', { mode: 'single', difficulty });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <Text style={styles.title}>VOID COUNT</Text>
        <Text style={styles.subtitle}>Count. Survive. Don't repeat.</Text>

        <View style={styles.list}>
          {Object.entries(DIFFICULTIES).map(([key, diff]) => (
            <Pressable
              key={key}
              onPress={() => startGame(key)}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            >
              <Text style={styles.buttonText}>{diff.label}</Text>
              <Text style={styles.buttonMeta}>
                jump +{diff.jump} · {diff.timer}s
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#05060b' },
  wrap: { flex: 1, paddingHorizontal: 24, paddingTop: 48, alignItems: 'center' },
  title: { fontSize: 48, fontWeight: '900', color: '#00f0ff', letterSpacing: 3 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 8, marginBottom: 48, letterSpacing: 2 },
  list: { width: '100%', gap: 12 },
  button: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#0a0b14',
    borderWidth: 2,
    borderColor: 'rgba(0,240,255,0.3)',
  },
  buttonPressed: { borderColor: '#00f0ff', backgroundColor: 'rgba(0,240,255,0.1)' },
  buttonText: { color: '#00f0ff', fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  buttonMeta: { color: '#888', fontSize: 12, marginTop: 4, fontFamily: 'Courier' },
});
