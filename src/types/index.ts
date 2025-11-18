import type { ImageStyle, StyleProp, ImageSourcePropType } from 'react-native';

export type ImageResizeMode =
  | 'cover'
  | 'contain'
  | 'stretch'
  | 'repeat'
  | 'center';

export type AssetSize = number | { width: number; height: number };

export type AssetVariant = 'default' | 'dark' | 'light';

export type AssetCategory = 'images' | 'icons' | 'assets';

export type AssetSource = ImageSourcePropType | string | { uri: string };

export interface AssetProps<TAssetName extends string = string> {
  name: TAssetName;
  size?: AssetSize;
  style?: StyleProp<ImageStyle>;
  tintColor?: string;
  resizeMode?: ImageResizeMode;
  category?: AssetCategory;
  variant?: AssetVariant;
  testID?: string;
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
