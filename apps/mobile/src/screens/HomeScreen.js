import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DIFFICULTIES } from '@void-count/core';
import CRTOverlay from '../components/CRTOverlay';
import GlitchText from '../components/GlitchText';
import MenuWheel from '../components/MenuWheel';
import Settings from '../components/Settings';
import Leaderboard from '../components/Leaderboard';
import FAQ from '../components/FAQ';
import useTheme from '../hooks/useTheme';
import { FONTS } from '../theme';

export default function HomeScreen({ navigation }) {
  const t = useTheme();
  const [mode, setMode] = useState('single');
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [splashing, setSplashing] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fadeAt = setTimeout(() => {
      Animated.timing(splashOpacity, { toValue: 0, duration: 500, useNativeDriver: true }).start();
    }, 1600);
    const doneAt = setTimeout(() => setSplashing(false), 2100);
    return () => { clearTimeout(fadeAt); clearTimeout(doneAt); };
  }, [splashOpacity]);

  useEffect(() => {
    let cancelled = false;
    function scheduleNext() {
      const delay = 39000 + Math.random() * 20000;
      setTimeout(() => {
        if (cancelled) return;
        setGlitch(true);
        setTimeout(() => { if (!cancelled) setGlitch(false); scheduleNext(); }, 600);
      }, delay);
    }
    scheduleNext();
    return () => { cancelled = true; };
  }, []);

  const startGame = (difficulty) => {
    navigation.navigate('Game', { mode, difficulty });
  };

  const wheelItems = Object.entries(DIFFICULTIES).map(([key, d]) => ({
    id: key,
    label: d.label,
    sub: `jump +${d.jump} · ${d.timer}s`,
    accent: key === 'easy' ? t.cyan : key === 'normal' ? t.yellow : t.magenta,
  }));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <CRTOverlay />

      <View style={styles.wrap}>
        <View style={styles.titleBlock}>
          <GlitchText style={[styles.title, { color: t.cyan }]} color={t.cyan} offsetColor1={t.magenta} offsetColor2={t.cyan} burst={glitch}>
            VOID
          </GlitchText>
          <View style={{ height: 2 }} />
          <GlitchText style={[styles.title, { color: t.magenta, marginTop: -16 }]} color={t.magenta} offsetColor1={t.cyan} offsetColor2={t.magenta} burst={glitch}>
            COUNT
          </GlitchText>
          <Text style={[styles.subtitle, { color: t.mute }]}>Count. Survive. Don't repeat.</Text>
        </View>

        <View style={styles.modes}>
          <Pressable onPress={() => setMode('single')} style={[styles.modeBtn, mode === 'single' && { borderColor: t.cyanDim, backgroundColor: `${t.cyan}1A` }]}>
            <Text style={[styles.modeText, { color: mode === 'single' ? t.cyan : t.mute }]}>1P vs CPU</Text>
          </Pressable>
          <Pressable onPress={() => setMode('local')} style={[styles.modeBtn, mode === 'local' && { borderColor: t.magentaDim, backgroundColor: `${t.magenta}1A` }]}>
            <Text style={[styles.modeText, { color: mode === 'local' ? t.magenta : t.mute }]}>2P LOCAL</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: t.yellow }]}>SELECT DIFFICULTY</Text>
        <MenuWheel items={wheelItems} onSelect={(item) => startGame(item.id)} />
        <Text style={[styles.hint, { color: t.muteDim }]}>Swipe. Tap centre to start.</Text>

        <View style={styles.bottom}>
          <Pressable onPress={() => setShowSettings(true)} style={[styles.iconBtn, { borderColor: t.border }]}>
            <Text style={[styles.iconText, { color: t.mute }]}>⚙ SETTINGS</Text>
          </Pressable>
          <Pressable onPress={() => setShowLeaderboard(true)} style={[styles.iconBtn, { borderColor: t.border }]}>
            <Text style={[styles.iconText, { color: t.mute }]}>🏆 RANKINGS</Text>
          </Pressable>
          <Pressable onPress={() => setShowFaq(true)} style={[styles.iconBtn, { borderColor: t.border }]}>
            <Text style={[styles.iconText, { color: t.mute }]}>? FAQ</Text>
          </Pressable>
        </View>
      </View>

      <Settings visible={showSettings} onClose={() => setShowSettings(false)} />
      <Leaderboard visible={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <FAQ visible={showFaq} onClose={() => setShowFaq(false)} />

      {splashing && (
        <Animated.View
          pointerEvents="none"
          style={[styles.splash, { backgroundColor: t.bg, opacity: splashOpacity }]}
        >
          <GlitchText style={[styles.splashTitle, { color: t.cyan }]} color={t.cyan} offsetColor1={t.magenta} offsetColor2={t.cyan}>
            VOID
          </GlitchText>
          <GlitchText style={[styles.splashTitle, { color: t.magenta, marginTop: -12 }]} color={t.magenta} offsetColor1={t.cyan} offsetColor2={t.magenta}>
            COUNT
          </GlitchText>
          <Text style={[styles.splashSub, { color: t.mute }]}>COUNT OR BE CONSUMED</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  wrap: { flex: 1, paddingHorizontal: 20, paddingTop: 24, alignItems: 'center' },
  titleBlock: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 64, fontWeight: '900', letterSpacing: 4 },
  subtitle: { fontSize: 12, marginTop: 18, letterSpacing: 3, fontFamily: FONTS.mono },
  modes: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modeBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' },
  modeText: { fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  sectionLabel: { fontSize: 10, letterSpacing: 3, fontFamily: FONTS.mono, marginBottom: 12 },
  hint: { fontSize: 10, fontFamily: FONTS.mono, marginTop: 8, letterSpacing: 2 },
  bottom: { flexDirection: 'row', gap: 8, marginTop: 'auto', marginBottom: 16 },
  iconBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  iconText: { fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  splash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  splashTitle: { fontSize: 72, fontWeight: '900', letterSpacing: 5 },
  splashSub: { fontSize: 11, marginTop: 24, letterSpacing: 4, fontFamily: FONTS.mono },
});
