export { Asset } from './components/Asset';
export { SvgIcon } from './components/SvgIcon';
export { useAsset } from './hooks/useAsset';
export { useAssetPreloader } from './hooks/useAssetPreloader';
export {
  setAssetRegistry,
  setAssetMetadata,
  getAsset,
  getAssetMetadata,
  hasAsset,
  getAllAssetNames,
} from './utils/assetRegistry';
export { AssetSizes, getSizePreset, getResponsiveSize } from './utils/sizes';
export {
  resolveAssetVariant,
  getDensityVariant,
  extractBaseName,
} from './utils/variants';
export {
  isRemoteUrl,
  preloadRemoteAsset,
  resolveRemoteAsset,
} from './utils/remoteAssets';
export type {
  RemoteAssetConfig,
  ResolvedRemoteAsset,
} from './utils/remoteAssets';
export type {
  AssetProps,
  AssetSize,
  AssetVariant,
  AssetCategory,
  AssetMetadata,
  AssetMetadataMap,
  AssetRegistry,
  AssetName,
  AssetSource,
  ImageProps,
  ImagePropsBase,
  ExpoImageProps,
  RNImageProps,
} from './types';
export type {
  PreloadProgress,
  UseAssetPreloaderResult,
} from './hooks/useAssetPreloader';
