import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../theme';

// Two fixed full-screen layers that render on top of everything in-screen but
// don't intercept touches. The first is a horizontal scanline that sweeps
// top-to-bottom every 8s; the second is a striped mask that flickers opacity
// between ~6% and ~14% like CRT phosphor.
export default function CRTOverlay() {
  const scanY = useRef(new Animated.Value(0)).current;
  const flicker = useRef(new Animated.Value(0.06)).current;

  useEffect(() => {
    const { height } = Dimensions.get('window');
    scanY.setValue(-20);
    const scanLoop = Animated.loop(
      Animated.timing(scanY, {
        toValue: height + 20,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const flickerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 0.14, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0.06, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    scanLoop.start();
    flickerLoop.start();
    return () => { scanLoop.stop(); flickerLoop.stop(); };
  }, [scanY, flicker]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        pointerEvents="none"
        style={[styles.stripes, { opacity: flicker }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.scanline, { transform: [{ translateY: scanY }] }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stripes: {
    ...StyleSheet.absoluteFillObject,
    // Striped look: layered vertical borders every 4px would be ideal but RN
    // can't do repeating-linear-gradient without a lib. We fake it with a
    // very subtle cyan wash + the scanline providing the motion cue.
    backgroundColor: 'rgba(0,240,255,0.03)',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(0,240,255,0.02)',
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: 'rgba(0,240,255,0.18)',
    shadowColor: COLORS.cyan,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
