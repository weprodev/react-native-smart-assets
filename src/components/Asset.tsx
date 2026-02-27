import React, { useState, useCallback } from 'react';
import { Image as RNImage, StyleSheet, View } from 'react-native';
import type { ImageStyle, ImageSourcePropType } from 'react-native';
import type { ComponentType } from 'react';
import type { AssetProps, AssetSize, AssetSource, ImageProps } from '../types';
import { getAsset, isSvgAsset } from '../utils/assetRegistry';
import { SvgIcon } from './SvgIcon';
import { isRemoteUrl, resolveRemoteAsset } from '../utils/remoteAssets';
import { AssetPlaceholder } from './AssetPlaceholder';

let ExpoImage: typeof RNImage | null = null;
try {
  ExpoImage = require('expo-image').Image;
} catch {
  ExpoImage = null;
}

const Image = ExpoImage || RNImage;

function isSvgComponent(source: AssetSource): source is ComponentType<{
  width?: number;
  height?: number;
  fill?: string;
  color?: string;
}> {
  return typeof source === 'function';
}

export function Asset<TAssetName extends string = string>({
  name,
  size,
  style,
  tintColor,
  color,
  resizeMode = 'contain',
  testID,
  placeholder,
  placeholderColor = '#E0E0E0',
}: AssetProps<TAssetName>): React.ReactElement | null {
  // Track which asset name has finished loading.
  // Using `loadedName` (instead of a bool + useEffect) means we get an instant
  // reset whenever `name` changes — no extra render cycles required.
  const [loadedName, setLoadedName] = useState<string | null>(null);

  const handleLoad = useCallback(() => setLoadedName(name), [name]);
  const handleError = useCallback(() => setLoadedName(name), [name]);

  // Whether the placeholder should be visible right now
  const showPlaceholder =
    !!placeholder && placeholder !== 'none' && loadedName !== name;

  // ─── Remote URL ─────────────────────────────────────────────────────────────

  if (isRemoteUrl(name)) {
    const { uri, fallback } = resolveRemoteAsset({
      url: name,
      fallback: undefined,
    });
    const sizeStyle = getSizeStyle(size);

    if (showPlaceholder) {
      return (
        <View style={[sizeStyle, styles.container, style]}>
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            resizeMode={resizeMode}
            onLoad={handleLoad}
            onError={handleError}
            testID={testID}
            {...(ExpoImage
              ? {
                  cachePolicy: 'memory-disk' as const,
                  ...(fallback && { placeholder: fallback }),
                }
              : fallback
              ? { defaultSource: fallback }
              : {})}
          />
          <AssetPlaceholder
            type={placeholder}
            color={placeholderColor}
            testID={testID ? `${testID}-placeholder` : undefined}
          />
        </View>
      );
    }

    const imageProps: ImageProps = {
      source: { uri },
      style: [sizeStyle, style],
      resizeMode: resizeMode,
      testID: testID,
      ...(ExpoImage
        ? {
            cachePolicy: 'memory-disk' as const,
            ...(fallback && { placeholder: fallback }),
          }
        : fallback
        ? { defaultSource: fallback }
        : {}),
    };

    return <Image {...imageProps} />;
  }

  // ─── Registry asset ─────────────────────────────────────────────────────────

  const asset = getAsset(name);

  if (!asset) {
    if (__DEV__) {
      console.warn(`Asset "${name}" not found in registry`);
    }
    return null;
  }

  // ─── SVG — no loading state needed (synchronous render) ─────────────────────

  if (isSvgAsset(name) || isSvgComponent(asset)) {
    const sizeValue =
      typeof size === 'number' ? size : size?.width || size?.height || 24;
    return (
      <SvgIcon
        source={asset}
        width={typeof size === 'object' ? size.width : sizeValue}
        height={typeof size === 'object' ? size.height : sizeValue}
        tintColor={tintColor}
        color={color}
        style={style as ImageStyle}
        testID={testID}
      />
    );
  }

  // ─── Raster image ────────────────────────────────────────────────────────────

  const sizeStyle = getSizeStyle(size);

  if (showPlaceholder) {
    return (
      <View style={[sizeStyle, styles.container, style]}>
        <Image
          source={asset as ImageSourcePropType}
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
          testID={testID}
          {...(ExpoImage && { cachePolicy: 'memory-disk' as const })}
        />
        <AssetPlaceholder
          type={placeholder}
          color={placeholderColor}
          testID={testID ? `${testID}-placeholder` : undefined}
        />
      </View>
    );
  }

  const imageProps: ImageProps = {
    source: asset as ImageSourcePropType,
    style: [sizeStyle, style],
    resizeMode: resizeMode,
    testID: testID,
    ...(ExpoImage && { cachePolicy: 'memory-disk' as const }),
  };

  return <Image {...imageProps} />;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSizeStyle(size?: AssetSize): ImageStyle {
  if (!size) {
    return {};
  }

  if (typeof size === 'number') {
    return {
      width: size,
      height: size,
    };
  }

  return {
    width: size.width,
    height: size.height,
  };
}

const styles = StyleSheet.create({
  container: {
    // Needed so the absolutely-positioned placeholder fills exactly the
    // same bounding box as the image beneath it.
    overflow: 'hidden',
  },
});
