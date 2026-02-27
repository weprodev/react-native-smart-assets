import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import type { AssetPlaceholderType } from '../types';

export interface AssetPlaceholderProps {
  type: AssetPlaceholderType;
  /** Background color of the placeholder. @default '#E0E0E0' */
  color?: string;
  style?: ViewStyle;
  testID?: string;
}

// ─── Shimmer ──────────────────────────────────────────────────────────────────

/**
 * Classic scan-line shimmer: a bright stripe sweeps left-to-right over the
 * base color, giving the classic skeleton-loading appearance.
 */
function ShimmerEffect({ color }: { color: string }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (containerWidth === 0) return;

    // Start every sweep from just off the left edge
    translateX.setValue(-containerWidth * 0.6);

    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: containerWidth * 1.6,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [containerWidth, translateX]);

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: color, overflow: 'hidden' },
      ]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && (
        <Animated.View
          style={[styles.shimmerHighlight, { transform: [{ translateX }] }]}
        />
      )}
    </View>
  );
}

// ─── Blur / pulse ─────────────────────────────────────────────────────────────

/**
 * A gentle opacity pulse — suggests hazy, out-of-focus content beneath.
 * Used for the `blur` placeholder type.
 */
function BlurEffect({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: color, opacity }]}
    />
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export function AssetPlaceholder({
  type,
  color = '#E0E0E0',
  style,
  testID,
}: AssetPlaceholderProps): React.ReactElement | null {
  if (type === 'none') {
    return null;
  }

  if (type === 'shimmer') {
    return (
      <View
        style={[StyleSheet.absoluteFill, style, { overflow: 'hidden' }]}
        testID={testID}
        pointerEvents="none"
      >
        <ShimmerEffect color={color} />
      </View>
    );
  }

  if (type === 'blur') {
    return (
      <View
        style={[StyleSheet.absoluteFill, style, { overflow: 'hidden' }]}
        testID={testID}
        pointerEvents="none"
      >
        <BlurEffect color={color} />
      </View>
    );
  }

  // 'color' — static solid background
  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: color }, style]}
      testID={testID}
      pointerEvents="none"
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  shimmerHighlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '55%',
    // Pure white at ~55 % opacity gives the bright band without being jarring
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
});
