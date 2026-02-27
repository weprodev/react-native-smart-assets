import type { ImageStyle, StyleProp, ImageSourcePropType } from 'react-native';
import type { ComponentType } from 'react';

export type ImageResizeMode =
  | 'cover'
  | 'contain'
  | 'stretch'
  | 'repeat'
  | 'center';

export type AssetSize = number | { width: number; height: number };

export type AssetVariant = 'default' | 'dark' | 'light';

export type AssetCategory = 'images' | 'icons' | 'assets';

/**
 * Controls the visual shown while an image asset is loading.
 * - `shimmer` — an animated sweep skeleton (default choice for content-heavy UIs)
 * - `blur`    — a soft pulsing placeholder (suggests hazy content beneath)
 * - `color`   — a static flat color background
 * - `none`    — no placeholder (default behaviour, preserves backwards compat)
 */
export type AssetPlaceholderType = 'shimmer' | 'blur' | 'color' | 'none';

export type AssetSource =
  | ImageSourcePropType
  | string
  | { uri: string }
  | ComponentType<{
      width?: number;
      height?: number;
      fill?: string;
      color?: string;
    }>;

export interface AssetProps<TAssetName extends string = string> {
  name: TAssetName;
  size?: AssetSize;
  style?: StyleProp<ImageStyle>;
  tintColor?: string;
  color?: string;
  resizeMode?: ImageResizeMode;
  category?: AssetCategory;
  variant?: AssetVariant;
  testID?: string;
  /**
   * Show a visual placeholder while the image is loading.
   * Has no effect on SVG assets (they render synchronously).
   * @default 'none'
   */
  placeholder?: AssetPlaceholderType;
  /**
   * Base color used by the placeholder.
   * @default '#E0E0E0'
   */
  placeholderColor?: string;
}

export interface AssetMetadata {
  name: string;
  path: string;
  type: 'image' | 'svg' | 'icon';
  category: AssetCategory;
  variants?: string[];
  dimensions?: { width: number; height: number };
}

export interface AssetRegistry {
  [key: string]: AssetSource;
}

export interface AssetMetadataMap {
  [key: string]: Omit<AssetMetadata, 'path'>;
}

export type AssetName = string;

export interface ImagePropsBase {
  source: ImageSourcePropType | { uri: string };
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
  testID?: string;
}

export interface ExpoImageProps extends ImagePropsBase {
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
  placeholder?: ImageSourcePropType;
}

export interface RNImageProps extends ImagePropsBase {
  defaultSource?: ImageSourcePropType;
}

export type ImageProps = ExpoImageProps | RNImageProps;
