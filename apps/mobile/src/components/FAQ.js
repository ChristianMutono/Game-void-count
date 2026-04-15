import React, { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../theme';

const FAQS = [
  {
    q: "Wait, what exactly is the point of this game?",
    a: "You're the Counter. Your one job — your entire reason for existing in this moment — is to say the lowest unused positive integer. That's it. The Controller's job is to make you forget what that number is by jumping ahead and leaving traps. Succeed and you climb. Fail and the void judges you.",
  },
  {
    q: "What counts as a legal Controller move?",
    a: "The Controller can say literally any positive integer that hasn't been said yet. They can sit right next to you (1, 2, 3 — lulling you into a false sense of safety) or leap ahead by 12 and leave a psychic minefield. The only rule: no repeats. Everything else is psychological warfare.",
  },
  {
    q: "How do I actually lose?",
    a: "Four delightful ways: (1) DUPLICATE — you said a number that's already been said. (2) STOLEN — you tried to say the Controller's number. (3) INVALID JUMP — you skipped the lowest available. (4) TIMEOUT — you took too long. The void doesn't wait.",
  },
  {
    q: "Why does the timer turn red and start panicking at me?",
    a: "Because you should be panicking. That's a feature, not a bug. The timer is your anxiety given visual form. When it shakes, that's the universe telling you to go faster.",
  },
  {
    q: "How does voice input work on mobile?",
    a: "Tap or hold the mic (depending on mode in Settings). The phone's native speech recogniser transcribes on-device — no audio leaves the device. Talk however you talk: \"one twelve\", \"one hundred and twelve\", or just \"112\" all resolve to 112. Fast, local, and not pretending to be anything other than what it is. (If you came here from the web version: yes, this is how it was always supposed to feel. The browser tab was a rehearsal.)",
  },
  {
    q: "What's the difference between push-to-talk and continuous?",
    a: "Push-to-talk: hold the mic, speak, release to submit. Safer, uses less battery. Continuous: tap once to start the mic listening, tap again to stop. Faster for rapid rounds but uses more power. Default is push-to-talk; flip it in Settings. Either way, the mic never listens outside of an active round.",
  },
  {
    q: "Does the game get harder the longer I survive?",
    a: "Not by changing the rules — but the Controller's response time tightens as your score climbs. At score >10 it reacts faster, at >50 faster still, and at >120 it can counter-move in a quarter of a second. Simultaneously, your brain is tracking dozens of forbidden numbers. It's mental yoga. Painful, occasionally humiliating mental yoga.",
  },
];

export default function FAQ({ visible, onClose }) {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>FAQ</Text>
              <Text style={styles.sub}>Answers. Probably.</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}><Text style={styles.close}>✕</Text></Pressable>
          </View>

          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
            {FAQS.map((faq, i) => {
              const open = openIdx === i;
              return (
                <Pressable
                  key={i}
                  onPress={() => setOpenIdx(open ? null : i)}
                  style={[styles.item, open && styles.itemOpen]}
                >
                  <View style={styles.itemHeader}>
                    <Text style={styles.idx}>{String(i + 1).padStart(2, '0')}</Text>
                    <Text style={styles.q}>{faq.q}</Text>
                    <Text style={styles.toggle}>{open ? '−' : '+'}</Text>
                  </View>
                  {open && <Text style={styles.a}>{faq.a}</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: COLORS.panel, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: COLORS.border, maxHeight: '88%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: COLORS.cyan, fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  sub: { color: COLORS.mute, fontSize: 11, fontFamily: FONTS.mono, marginTop: 2 },
  close: { color: COLORS.mute, fontSize: 20 },
  item: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  itemOpen: { borderColor: COLORS.cyanDim, backgroundColor: 'rgba(0,240,255,0.05)' },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  idx: { color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 11 },
  q: { flex: 1, color: COLORS.fg, fontSize: 13, fontWeight: '800' },
  toggle: { color: COLORS.mute, fontSize: 18 },
  a: { color: COLORS.mute, marginTop: 8, fontSize: 12, lineHeight: 18, fontFamily: FONTS.mono },
});
