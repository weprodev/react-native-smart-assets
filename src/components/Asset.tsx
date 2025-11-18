import React from 'react';
import { Image as RNImage } from 'react-native';
import type { ImageStyle, ImageSourcePropType } from 'react-native';
import type { ComponentType } from 'react';
import type { AssetProps, AssetSize, AssetSource, ImageProps } from '../types';
import { getAsset, isSvgAsset } from '../utils/assetRegistry';
import { SvgIcon } from './SvgIcon';
import { isRemoteUrl, resolveRemoteAsset } from '../utils/remoteAssets';

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
}: AssetProps<TAssetName>): React.ReactElement | null {
  if (isRemoteUrl(name)) {
    const { uri, fallback } = resolveRemoteAsset({
      url: name,
      fallback: undefined,
    });
    const sizeStyle = getSizeStyle(size);
    const combinedStyle = [sizeStyle, style];

    const imageProps: ImageProps = {
      source: { uri },
      style: combinedStyle,
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

  const asset = getAsset(name);

  if (!asset) {
    if (__DEV__) {
      console.warn(`Asset "${name}" not found in registry`);
    }
    return null;
  }

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

  const sizeStyle = getSizeStyle(size);
  const combinedStyle = [sizeStyle, style];

  const imageProps: ImageProps = {
    source: asset as ImageSourcePropType,
    style: combinedStyle,
    resizeMode: resizeMode,
    testID: testID,
    ...(ExpoImage && { cachePolicy: 'memory-disk' as const }),
  };

  return <Image {...imageProps} />;
}

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
