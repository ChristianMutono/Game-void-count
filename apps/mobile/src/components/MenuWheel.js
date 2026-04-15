import React, { useRef, useState } from 'react';
import { View, Text, Animated, PanResponder, StyleSheet, Pressable } from 'react-native';
import { COLORS, FONTS } from '../theme';

// A horizontal swipeable wheel. Items snap to centre with spring physics,
// and the centred item gets a highlighted style plus an onSelect handler.
// Simpler than the web version's rotational wheel but hits the same beats —
// horizontal swipe, inertia, snap-to-nearest, confirm-on-tap.
export default function MenuWheel({ items, onSelect, itemWidth = 180 }) {
  const [activeIdx, setActiveIdx] = useState(Math.floor(items.length / 2));
  const offset = useRef(new Animated.Value(0)).current;
  const gestureStart = useRef(0);

  const snapTo = (idx) => {
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    setActiveIdx(clamped);
    Animated.spring(offset, {
      toValue: -clamped * itemWidth,
      tension: 60,
      friction: 9,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4,
      onPanResponderGrant: () => { gestureStart.current = offset._value; },
      onPanResponderMove: (_, g) => { offset.setValue(gestureStart.current + g.dx); },
      onPanResponderRelease: (_, g) => {
        const finalPos = gestureStart.current + g.dx + g.vx * 80;
        const idx = Math.round(-finalPos / itemWidth);
        snapTo(idx);
      },
    })
  ).current;

  return (
    <View style={styles.wrap} {...panResponder.panHandlers}>
      <Animated.View style={[styles.track, { transform: [{ translateX: offset }] }]}>
        {items.map((item, i) => {
          const isActive = i === activeIdx;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                if (isActive) { onSelect && onSelect(item); } else { snapTo(i); }
              }}
              style={[styles.cell, { width: itemWidth }]}
            >
              <View style={[styles.pill, isActive ? { borderColor: item.accent || COLORS.cyan, backgroundColor: `${item.accent || COLORS.cyan}22` } : { borderColor: COLORS.border }]}>
                <Text style={[styles.label, isActive && { color: item.accent || COLORS.cyan }]}>{item.label}</Text>
                {item.sub && <Text style={styles.sub}>{item.sub}</Text>}
              </View>
            </Pressable>
          );
        })}
      </Animated.View>
      <View pointerEvents="none" style={styles.focusFrame}>
        <View style={[styles.focusEdge, { left: 0 }]} />
        <View style={[styles.focusEdge, { right: 0 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 100,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '50%',
    marginLeft: -90, // itemWidth/2 — centred anchor
  },
  cell: { alignItems: 'center' },
  pill: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    minWidth: 160,
  },
  label: { color: COLORS.fg, fontSize: 18, fontWeight: '900', letterSpacing: 3 },
  sub: { color: COLORS.mute, fontSize: 10, marginTop: 4, fontFamily: FONTS.mono },
  focusFrame: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center' },
  focusEdge: { position: 'absolute', top: 20, bottom: 20, width: 20, backgroundColor: 'rgba(5,6,11,0.9)' },
});
