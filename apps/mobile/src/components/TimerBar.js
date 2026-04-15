import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

export default function TimerBar({ duration, isRunning, onTimeout, onTick, resetKey }) {
  const [pct, setPct] = useState(1);
  const startRef = useRef(null);
  const pausedAtRef = useRef(null);
  const elapsedBeforePauseRef = useRef(0);

  useEffect(() => {
    setPct(1);
    startRef.current = Date.now();
    elapsedBeforePauseRef.current = 0;
    pausedAtRef.current = null;
    if (onTick) onTick(1);
  }, [resetKey, duration]);

  useEffect(() => {
    if (!isRunning) {
      if (startRef.current !== null && pausedAtRef.current === null) {
        pausedAtRef.current = Date.now();
      }
      return;
    }

    if (pausedAtRef.current !== null) {
      elapsedBeforePauseRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }
    if (startRef.current === null) startRef.current = Date.now();

    const id = setInterval(() => {
      const elapsed = (Date.now() - startRef.current - elapsedBeforePauseRef.current) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      const p = remaining / duration;
      setPct(p);
      if (onTick) onTick(p);
      if (remaining <= 0) {
        clearInterval(id);
        if (onTimeout) onTimeout();
      }
    }, 60);

    return () => clearInterval(id);
  }, [isRunning, duration, resetKey]);

  const color = pct > 0.65 ? COLORS.cyan : pct > 0.4 ? COLORS.yellow : COLORS.magenta;
  const visualPct = Math.pow(Math.max(0, pct), 1.35);

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${visualPct * 100}%`, backgroundColor: color, shadowColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', paddingVertical: 4 },
  track: { height: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' },
  fill: {
    height: '100%',
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
});
