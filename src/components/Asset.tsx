import React from 'react';
import { Image as RNImage } from 'react-native';
import type { ImageStyle, ImageSourcePropType } from 'react-native';
import type { AssetProps, AssetSize, ImageProps } from '../types';
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

export function Asset({
  name,
  size,
  style,
  tintColor,
  resizeMode = 'contain',
  testID,
}: AssetProps): React.ReactElement | null {
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

  const sizeStyle = getSizeStyle(size);
  const combinedStyle = [sizeStyle, style];

  const isAssetWithUri =
    typeof asset === 'object' &&
    asset !== null &&
    !Array.isArray(asset) &&
    'uri' in asset;

  if (isSvgAsset(name) || isAssetWithUri) {
    const sizeValue =
      typeof size === 'number' ? size : size?.width || size?.height || 24;
    return (
      <SvgIcon
        source={asset}
        width={typeof size === 'object' ? size.width : sizeValue}
        height={typeof size === 'object' ? size.height : sizeValue}
        tintColor={tintColor}
        style={style as ImageStyle}
        testID={testID}
      />
    );
  }

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
