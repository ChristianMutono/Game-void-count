import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { DIFFICULTIES, getLeaderboard } from '@void-count/core';
import { COLORS, FONTS } from '../theme';

const TABS = Object.keys(DIFFICULTIES);

export default function Leaderboard({ visible, onClose }) {
  const [tab, setTab] = useState('normal');
  const [all, setAll] = useState([]);

  useEffect(() => {
    if (visible) setAll(getLeaderboard());
  }, [visible]);

  const entries = all.filter(e => e.difficulty === tab).slice(0, 10);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>RANKINGS</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.tabs}>
            {TABS.map(k => (
              <Pressable key={k} onPress={() => setTab(k)} style={[styles.tab, tab === k && styles.tabActive]}>
                <Text style={[styles.tabText, tab === k && styles.tabTextActive]}>{DIFFICULTIES[k].label}</Text>
              </Pressable>
            ))}
          </View>

          <ScrollView style={styles.list} contentContainerStyle={{ paddingVertical: 4 }}>
            {entries.length === 0 ? (
              <Text style={styles.empty}>No scores yet. Dominate the void.</Text>
            ) : (
              entries.map((e, i) => (
                <View key={`${e.date}-${i}`} style={styles.row}>
                  <Text style={styles.rank}>{String(i + 1).padStart(2, '0')}</Text>
                  <Text style={styles.name} numberOfLines={1}>{e.playerName || 'Player 1'}</Text>
                  <Text style={styles.score}>{e.score}</Text>
                  <Text style={styles.time}>{Number(e.time).toFixed(1)}s</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: COLORS.panel, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, maxHeight: '88%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { color: COLORS.cyan, fontSize: 20, fontWeight: '900', letterSpacing: 3 },
  close: { color: COLORS.mute, fontSize: 20 },
  tabs: { flexDirection: 'row', gap: 4, marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  tabActive: { backgroundColor: 'rgba(0,240,255,0.15)', borderWidth: 1, borderColor: COLORS.cyanDim },
  tabText: { color: COLORS.mute, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  tabTextActive: { color: COLORS.cyan },
  list: { maxHeight: 400 },
  empty: { color: COLORS.mute, fontStyle: 'italic', textAlign: 'center', padding: 20, fontFamily: FONTS.mono, fontSize: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 10,
  },
  rank: { color: COLORS.yellow, fontFamily: FONTS.mono, fontSize: 13, width: 24 },
  name: { color: COLORS.fg, fontSize: 13, fontWeight: '800', flex: 1 },
  score: { color: COLORS.cyan, fontSize: 18, fontWeight: '900', width: 60, textAlign: 'right' },
  time: { color: COLORS.mute, fontFamily: FONTS.mono, fontSize: 11, width: 56, textAlign: 'right' },
});
