import React, { useEffect, useRef } from 'react';
import { Text, Animated, Easing, View, StyleSheet } from 'react-native';

// Renders three stacked copies of the same text — cyan offset-left, magenta
// offset-right, main in the foreground. When `burst` flips true, runs a
// short chromatic-aberration skew+translate sequence. Used by the home
// title and by the HUD glitch triggers on hard/extreme.
export default function GlitchText({
  children,
  style,
  color = '#00f0ff',
  offsetColor1 = '#ff0066',
  offsetColor2 = '#00f0ff',
  burst = false,
  burstDurationMs = 600,
}) {
  const skew = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleX = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!burst) return;
    skew.setValue(0); translateX.setValue(0); scaleX.setValue(1);
    const seq = Animated.sequence([
      Animated.timing(skew, { toValue: 1, duration: burstDurationMs * 0.2, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(skew, { toValue: -0.7, duration: burstDurationMs * 0.2, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(skew, { toValue: 0.5, duration: burstDurationMs * 0.2, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(skew, { toValue: 0, duration: burstDurationMs * 0.4, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    const tx = Animated.sequence([
      Animated.timing(translateX, { toValue: 12, duration: burstDurationMs * 0.2, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -16, duration: burstDurationMs * 0.2, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 8, duration: burstDurationMs * 0.2, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: burstDurationMs * 0.4, useNativeDriver: true }),
    ]);
    const sx = Animated.sequence([
      Animated.timing(scaleX, { toValue: 1.1, duration: burstDurationMs * 0.2, useNativeDriver: true }),
      Animated.timing(scaleX, { toValue: 0.9, duration: burstDurationMs * 0.2, useNativeDriver: true }),
      Animated.timing(scaleX, { toValue: 1.05, duration: burstDurationMs * 0.2, useNativeDriver: true }),
      Animated.timing(scaleX, { toValue: 1, duration: burstDurationMs * 0.4, useNativeDriver: true }),
    ]);
    Animated.parallel([seq, tx, sx]).start();
  }, [burst, burstDurationMs, skew, translateX, scaleX]);

  const skewDeg = skew.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '28deg'] });

  const transform = [{ skewX: skewDeg }, { translateX }, { scaleX }];

  return (
    <View style={styles.wrap}>
      <Animated.Text
        style={[styles.offset, style, { color: offsetColor1, left: -2, opacity: 0.75, transform }]}
      >
        {children}
      </Animated.Text>
      <Animated.Text
        style={[styles.offset, style, { color: offsetColor2, left: 2, opacity: 0.75, transform }]}
      >
        {children}
      </Animated.Text>
      <Animated.Text
        style={[style, { color, transform }]}
      >
        {children}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  offset: { position: 'absolute', top: 0, left: 0 },
});
