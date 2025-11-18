import React from 'react';
import { View, StyleSheet, Image as RNImage } from 'react-native';
import type { ImageStyle, ImageSourcePropType } from 'react-native';
import { parseSvgContent, injectSvgProps } from '../utils/svgParser';
import type { SvgProps } from '../utils/svgParser';
import type { AssetSource, ImageProps } from '../types';

let ExpoImage: typeof RNImage | null = null;
try {
  ExpoImage = require('expo-image').Image;
} catch {
  ExpoImage = null;
}

const Image = ExpoImage || RNImage;

interface SvgIconProps extends SvgProps {
  source: AssetSource;
  style?: ImageStyle;
  testID?: string;
}

function encodeSvgUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function SvgIcon({
  source,
  width,
  height,
  tintColor,
  style,
  testID,
}: SvgIconProps): React.ReactElement {
  const size = width || height || 24;

  if (typeof source === 'string') {
    const svgContent = parseSvgContent(source);
    const modifiedSvg = injectSvgProps(svgContent, {
      width: width || size,
      height: height || size,
      tintColor,
    });

    const imageProps: ImageProps = {
      source: { uri: encodeSvgUri(modifiedSvg) },
      style: [styles.image, { width: width || size, height: height || size }],
      resizeMode: 'contain',
      ...(ExpoImage && { cachePolicy: 'memory-disk' as const }),
    };

    return (
      <View
        style={[
          styles.container,
          { width: width || size, height: height || size },
          style,
        ]}
        testID={testID}
      >
        <Image {...imageProps} />
      </View>
    );
  }

  const imageProps: ImageProps = {
    source: source as ImageSourcePropType,
    style: [{ width: width || size, height: height || size }, style],
    resizeMode: 'contain',
    testID: testID,
    ...(ExpoImage && { cachePolicy: 'memory-disk' as const }),
  };

  return <Image {...imageProps} />;
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    flex: 1,
  },
});
