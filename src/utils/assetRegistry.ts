import type { AssetRegistry, AssetSource, AssetMetadataMap } from '../types';

let assetRegistry: AssetRegistry = {};
let assetMetadata: AssetMetadataMap = {};

export function setAssetRegistry(
  registry: AssetRegistry,
  metadata?: AssetMetadataMap
): void {
  assetRegistry = registry;
  if (metadata) {
    assetMetadata = metadata;
  }
}

export function setAssetMetadata(metadata: AssetMetadataMap): void {
  assetMetadata = metadata;
}

export function getAssetMetadata(
  name: string
): AssetMetadataMap[string] | null {
  return assetMetadata[name] || null;
}

export function getAssetRegistry(): AssetRegistry {
  return assetRegistry;
}

export function getAsset(name: string): AssetSource | null {
  const asset = assetRegistry[name];
  if (!asset) {
    console.warn(`Asset "${name}" not found in registry`);
    return null;
  }
  return asset;
}

export function hasAsset(name: string): boolean {
  return name in assetRegistry;
}

export function getAllAssetNames(): string[] {
  return Object.keys(assetRegistry);
}

export function isSvgAsset(name: string): boolean {
  if (name.endsWith('.svg') || name.toLowerCase().includes('.svg')) {
    return true;
  }

  const metadata = getAssetMetadata(name);
  if (metadata && metadata.type === 'svg') {
    return true;
  }

  const asset = getAsset(name);
  if (typeof asset === 'function') {
    return true;
  }

  return false;
}

export function isImageAsset(name: string): boolean {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
  const lowerName = name.toLowerCase();
  return imageExtensions.some((ext) => lowerName.endsWith(ext));
}
