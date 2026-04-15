import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS, FONTS } from '../theme';
import { isVoiceInputEnabled, getVoiceMode } from '../lib/settings';
import {
  startVoice, stopVoice, isVoiceActive,
  VOICE_MODE_PTT, VOICE_MODE_CONTINUOUS,
} from '../lib/voice';

const TILES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

export default function NumberInput({ onSubmit, disabled, shakeKey = 0, onMicActivate }) {
  const [value, setValue] = useState('');
  const [shaking, setShaking] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;
  const onMicActivateRef = useRef(onMicActivate);
  onMicActivateRef.current = onMicActivate;

  const voiceEnabled = isVoiceInputEnabled();
  const voiceMode = getVoiceMode();

  useEffect(() => {
    if (shakeKey === 0) return;
    setValue('');
    setShaking(true);
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start(() => setShaking(false));
  }, [shakeKey, shakeAnim]);

  useEffect(() => {
    if (!voiceBusy) { spinAnim.setValue(0); return; }
    const loop = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [voiceBusy, spinAnim]);

  // Ensure the recogniser is stopped whenever the input is disabled (CPU turn,
  // game over) or the component unmounts.
  useEffect(() => {
    if (disabled && voiceOn) {
      stopVoice();
      setVoiceOn(false);
    }
    return () => { if (isVoiceActive()) stopVoice(); };
  }, [disabled]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(() => {
    if (!value || disabled) return;
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      onSubmit(num);
      setValue('');
    }
  }, [value, onSubmit, disabled]);

  const handleTilePress = (digit) => {
    if (disabled || voiceBusy) return;
    setValue(prev => (prev + String(digit)).slice(0, 3));
  };

  const onVoiceNumber = useCallback((num) => {
    onSubmitRef.current(num);
  }, []);

  const handleMicPressIn = async () => {
    if (!voiceEnabled || disabled) return;
    setVoiceBusy(true);
    if (voiceMode === VOICE_MODE_PTT) {
      if (onMicActivateRef.current) onMicActivateRef.current();
      const ok = await startVoice(VOICE_MODE_PTT, onVoiceNumber);
      if (!ok) setVoiceBusy(false);
      else { setVoiceOn(true); setVoiceBusy(false); }
    }
  };

  const handleMicPressOut = async () => {
    if (!voiceEnabled || voiceMode !== VOICE_MODE_PTT) return;
    if (voiceOn) {
      await stopVoice();
      setVoiceOn(false);
    }
    setVoiceBusy(false);
  };

  const handleMicTap = async () => {
    // Continuous mode: toggle.
    if (!voiceEnabled || disabled) return;
    if (voiceOn) {
      await stopVoice();
      setVoiceOn(false);
      return;
    }
    setVoiceBusy(true);
    if (onMicActivateRef.current) onMicActivateRef.current();
    const ok = await startVoice(VOICE_MODE_CONTINUOUS, onVoiceNumber);
    setVoiceBusy(false);
    if (ok) setVoiceOn(true);
  };

  const shakeTranslate = shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const micBg = voiceOn ? COLORS.magenta : COLORS.cyanDim;
  const micLabel = !voiceEnabled
    ? null
    : voiceMode === VOICE_MODE_CONTINUOUS
      ? voiceOn ? 'LISTENING · TAP TO STOP' : 'TAP MIC TO LISTEN'
      : voiceOn ? 'LISTENING · RELEASE TO SUBMIT' : 'HOLD MIC TO SPEAK';

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.display, { transform: [{ translateX: shakeTranslate }] }]}>
        <Text style={styles.displayText}>
          {value || (voiceEnabled ? (voiceMode === VOICE_MODE_CONTINUOUS ? 'TAP / SPEAK' : 'TAP / HOLD MIC') : 'TAP')}
        </Text>
      </Animated.View>

      {micLabel && <Text style={styles.micLabel}>{micLabel}</Text>}

      <View style={styles.grid}>
        {TILES.map((d) => (
          <Pressable
            key={d}
            onPress={() => handleTilePress(d)}
            disabled={disabled || voiceBusy}
            style={({ pressed }) => [styles.tile, (disabled || voiceBusy) && styles.tileDisabled, pressed && styles.tilePressed]}
          >
            <Text style={styles.tileText}>{d}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => setValue('')}
          disabled={disabled || !value || voiceBusy}
          style={({ pressed }) => [styles.clr, (!value || disabled || voiceBusy) && styles.actionDisabled, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.clrText}>CLR</Text>
        </Pressable>

        <Pressable
          onPress={handleSubmit}
          disabled={disabled || !value || voiceBusy}
          style={({ pressed }) => [styles.submit, (!value || disabled || voiceBusy) && styles.actionDisabled, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.submitText}>SUBMIT</Text>
        </Pressable>

        {voiceEnabled && (
          voiceMode === VOICE_MODE_PTT ? (
            <Pressable
              onPressIn={handleMicPressIn}
              onPressOut={handleMicPressOut}
              disabled={disabled}
              style={[styles.mic, { backgroundColor: voiceOn ? 'rgba(255,0,102,0.2)' : 'rgba(0,240,255,0.1)', borderColor: micBg }]}
            >
              {voiceBusy ? (
                <Animated.Text style={[styles.micIcon, { transform: [{ rotate: spin }] }]}>⟳</Animated.Text>
              ) : (
                <Text style={styles.micIcon}>🎤</Text>
              )}
            </Pressable>
          ) : (
            <Pressable
              onPress={handleMicTap}
              disabled={disabled}
              style={[styles.mic, { backgroundColor: voiceOn ? 'rgba(255,0,102,0.2)' : 'rgba(0,240,255,0.1)', borderColor: micBg }]}
            >
              {voiceBusy ? (
                <Animated.Text style={[styles.micIcon, { transform: [{ rotate: spin }] }]}>⟳</Animated.Text>
              ) : (
                <Text style={styles.micIcon}>🎤</Text>
              )}
            </Pressable>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center', gap: 10 },
  display: {
    width: '85%',
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  displayText: { color: COLORS.cyan, fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  micLabel: { color: COLORS.magenta, fontSize: 10, letterSpacing: 2, fontFamily: FONTS.mono, marginTop: -4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, width: '100%', maxWidth: 520 },
  tile: {
    width: '18%',
    aspectRatio: 1.4,
    borderRadius: 10,
    backgroundColor: COLORS.bgAlt,
    borderWidth: 2,
    borderColor: COLORS.cyanDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tilePressed: { backgroundColor: 'rgba(0,240,255,0.15)', transform: [{ scale: 0.94 }] },
  tileDisabled: { opacity: 0.35 },
  tileText: { color: COLORS.cyan, fontSize: 22, fontWeight: '900' },

  actions: { flexDirection: 'row', gap: 8, width: '100%', maxWidth: 520, alignItems: 'stretch' },
  clr: {
    flex: 1, height: 48, borderRadius: 10, backgroundColor: 'rgba(255,0,102,0.06)',
    borderWidth: 1, borderColor: COLORS.magentaDim, alignItems: 'center', justifyContent: 'center',
  },
  clrText: { color: COLORS.magenta, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  submit: {
    flex: 2, height: 48, borderRadius: 10, backgroundColor: 'rgba(0,240,255,0.1)',
    borderWidth: 2, borderColor: COLORS.cyan, alignItems: 'center', justifyContent: 'center',
  },
  submitText: { color: COLORS.cyan, fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  actionDisabled: { opacity: 0.35 },

  mic: {
    width: 48, height: 48, borderRadius: 10, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  micIcon: { fontSize: 22, color: COLORS.cyan },
});
