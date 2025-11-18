import type { AssetRegistry, AssetSource } from '../types';

let assetRegistry: AssetRegistry = {};

export function setAssetRegistry(registry: AssetRegistry): void {
  assetRegistry = registry;
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
  return name.endsWith('.svg') || name.toLowerCase().includes('.svg');
}

export function isImageAsset(name: string): boolean {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
  const lowerName = name.toLowerCase();
  return imageExtensions.some((ext) => lowerName.endsWith(ext));
}
