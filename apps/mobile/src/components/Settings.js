import React, { useState } from 'react';
import { Modal, View, Text, Pressable, TextInput, StyleSheet, ScrollView } from 'react-native';
import { getPlayerName, setPlayerName, MAX_NAME_LEN, removeItem } from '@void-count/core';
import {
  isVoiceInputEnabled, setVoiceInputEnabled,
  getVoiceMode, setVoiceMode,
  isDebugMode, setDebugMode,
} from '../lib/settings';
import { COLORS, FONTS } from '../theme';

export default function Settings({ visible, onClose }) {
  const [name, setName] = useState(getPlayerName());
  const [voice, setVoice] = useState(isVoiceInputEnabled());
  const [mode, setMode] = useState(getVoiceMode());
  const [debug, setDebug] = useState(isDebugMode());
  const [cleared, setCleared] = useState(false);

  const handleName = (t) => {
    const v = t.slice(0, MAX_NAME_LEN);
    setName(v);
    setPlayerName(v);
  };
  const toggleVoice = () => {
    const next = !voice;
    setVoice(next);
    setVoiceInputEnabled(next);
  };
  const toggleMode = () => {
    const next = mode === 'push-to-talk' ? 'continuous' : 'push-to-talk';
    setMode(next);
    setVoiceMode(next);
  };
  const toggleDebug = () => {
    const next = !debug;
    setDebug(next);
    setDebugMode(next);
  };
  const clearRankings = () => {
    removeItem('voidcount_leaderboard');
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>SETTINGS</Text>
            <Pressable onPress={onClose} hitSlop={12}><Text style={styles.close}>✕</Text></Pressable>
          </View>

          <ScrollView contentContainerStyle={{ gap: 16 }}>
            <Section label="Player Name">
              <TextInput
                value={name}
                onChangeText={handleName}
                maxLength={MAX_NAME_LEN}
                style={styles.input}
                placeholderTextColor={COLORS.muteDim}
              />
            </Section>

            <Section label="Voice Input (Beta)">
              <Toggle on={voice} onToggle={toggleVoice} />
            </Section>

            {voice && (
              <Section label="Voice Mode" help={mode === 'continuous' ? 'Tap mic to start/stop listening' : 'Hold mic to speak, release to submit'}>
                <Pressable style={[styles.modeBtn, { borderColor: mode === 'push-to-talk' ? COLORS.cyan : COLORS.border }]} onPress={() => { setMode('push-to-talk'); setVoiceMode('push-to-talk'); }}>
                  <Text style={[styles.modeText, { color: mode === 'push-to-talk' ? COLORS.cyan : COLORS.mute }]}>PUSH-TO-TALK</Text>
                </Pressable>
                <Pressable style={[styles.modeBtn, { borderColor: mode === 'continuous' ? COLORS.magenta : COLORS.border }]} onPress={() => { setMode('continuous'); setVoiceMode('continuous'); }}>
                  <Text style={[styles.modeText, { color: mode === 'continuous' ? COLORS.magenta : COLORS.mute }]}>CONTINUOUS</Text>
                </Pressable>
              </Section>
            )}

            <Section label="Debug Mode">
              <Toggle on={debug} onToggle={toggleDebug} />
            </Section>

            <Pressable onPress={clearRankings} style={[styles.clearBtn, cleared && styles.clearBtnDone]}>
              <Text style={[styles.clearText, { color: cleared ? COLORS.cyan : COLORS.magenta }]}>
                {cleared ? 'RANKINGS CLEARED' : 'CLEAR RANKINGS'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Section({ label, children, help }) {
  return (
    <View style={sxn.wrap}>
      <Text style={sxn.label}>{label}</Text>
      <View style={sxn.row}>{children}</View>
      {help && <Text style={sxn.help}>{help}</Text>}
    </View>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <Pressable onPress={onToggle} style={[togs.track, on && togs.trackOn]}>
      <View style={[togs.thumb, on && togs.thumbOn]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: COLORS.panel, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: COLORS.border, maxHeight: '88%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { color: COLORS.cyan, fontSize: 20, fontWeight: '900', letterSpacing: 3 },
  close: { color: COLORS.mute, fontSize: 20 },
  input: {
    backgroundColor: 'rgba(0,240,255,0.05)', borderColor: COLORS.cyanDim, borderWidth: 1, borderRadius: 10,
    color: COLORS.cyan, paddingHorizontal: 12, paddingVertical: 8, fontWeight: '900', textAlign: 'center', flex: 1,
  },
  modeBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, flex: 1, alignItems: 'center' },
  modeText: { fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  clearBtn: {
    padding: 12, borderRadius: 10, borderWidth: 1,
    borderColor: COLORS.magentaDim, backgroundColor: 'rgba(255,0,102,0.06)', alignItems: 'center',
  },
  clearBtnDone: { borderColor: COLORS.cyanDim, backgroundColor: 'rgba(0,240,255,0.06)' },
  clearText: { fontSize: 13, fontWeight: '900', letterSpacing: 2 },
});

const sxn = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: COLORS.mute, fontSize: 11, letterSpacing: 2, fontFamily: FONTS.mono },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  help: { color: COLORS.muteDim, fontSize: 11, fontFamily: FONTS.mono, marginTop: 2 },
});

const togs = StyleSheet.create({
  track: { width: 48, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', padding: 2 },
  trackOn: { backgroundColor: 'rgba(255,0,102,0.6)' },
  thumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  thumbOn: { transform: [{ translateX: 24 }] },
});
