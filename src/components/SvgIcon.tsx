import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ImageStyle } from 'react-native';
import type { ComponentType } from 'react';
import type { AssetSource } from '../types';

interface SvgIconProps {
  source: AssetSource;
  width?: number;
  height?: number;
  tintColor?: string;
  style?: ImageStyle;
  testID?: string;
}

function isSvgComponent(source: AssetSource): source is ComponentType<{
  width?: number;
  height?: number;
  fill?: string;
  color?: string;
}> {
  return typeof source === 'function';
}

function getSvgComponent(source: AssetSource): ComponentType<{
  width?: number;
  height?: number;
  fill?: string;
  color?: string;
}> | null {
  if (isSvgComponent(source)) {
    return source;
  }

  if (
    typeof source === 'object' &&
    source !== null &&
    'default' in source &&
    typeof (source as { default: unknown }).default === 'function'
  ) {
    return (
      source as {
        default: ComponentType<{
          width?: number;
          height?: number;
          fill?: string;
          color?: string;
        }>;
      }
    ).default;
  }

  return null;
}

export function SvgIcon({
  source,
  width,
  height,
  tintColor,
  style,
  testID,
}: SvgIconProps): React.ReactElement | null {
  const SvgComponent = getSvgComponent(source);

  if (!SvgComponent) {
    if (__DEV__) {
      console.warn('SvgIcon: source is not a valid SVG component', source);
    }
    return null;
  }

  const size = width || height || 24;

  return (
    <View
      style={[
        styles.container,
        { width: width || size, height: height || size },
        style,
      ]}
      testID={testID}
    >
      <SvgComponent
        width={width || size}
        height={height || size}
        fill={tintColor}
        color={tintColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
