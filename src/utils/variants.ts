import type { AssetVariant } from '../types';

export interface VariantOptions {
  variant?: AssetVariant;
  platform?: 'ios' | 'android' | 'web';
  density?: 1 | 2 | 3;
}

export function resolveAssetVariant(
  baseName: string,
  options: VariantOptions = {}
): string {
  const { variant, platform, density } = options;
  let resolvedName = baseName;

  if (variant && variant !== 'default') {
    resolvedName = `${baseName}-${variant}`;
  }

  if (platform && platform !== 'web') {
    resolvedName = `${resolvedName}.${platform}`;
  }

  if (density && density > 1) {
    resolvedName = `${resolvedName}@${density}x`;
  }

  return resolvedName;
}

export function getDensityVariant(
  baseName: string,
  density: 1 | 2 | 3
): string {
  if (density === 1) {
    return baseName;
  }
  return `${baseName}@${density}x`;
}

export function extractBaseName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '');
  return withoutExtension
    .replace(/@\d+x$/, '')
    .replace(/\.(ios|android)$/, '')
    .replace(/-dark$/, '')
    .replace(/-light$/, '');
}
