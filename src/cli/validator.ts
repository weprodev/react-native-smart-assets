import * as fs from 'fs';
import type { AssetMetadata } from '../types';
import { fileExists, getFileExtension } from './utils';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const VALID_IMAGE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.bmp',
];
const VALID_SVG_EXTENSIONS = ['.svg'];

export function validateAssets(assets: AssetMetadata[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const assetNames = new Map<string, AssetMetadata[]>();

  for (const asset of assets) {
    if (!fileExists(asset.path)) {
      errors.push(`Asset file does not exist: ${asset.path}`);
      continue;
    }

    const ext = getFileExtension(asset.path);
    if (asset.type === 'svg' && !VALID_SVG_EXTENSIONS.includes(ext)) {
      errors.push(
        `SVG asset has invalid extension: ${asset.path} (expected .svg)`
      );
    } else if (
      asset.type === 'image' &&
      !VALID_IMAGE_EXTENSIONS.includes(ext)
    ) {
      errors.push(
        `Image asset has invalid extension: ${asset.path} (expected image format)`
      );
    }

    const existing = assetNames.get(asset.name) || [];
    existing.push(asset);
    assetNames.set(asset.name, existing);

    if (asset.variants && asset.variants.length > 0) {
      validateVariants(asset, assets, errors, warnings);
    }
  }

  for (const [name, duplicates] of assetNames.entries()) {
    if (duplicates.length > 1) {
      warnings.push(
        `Duplicate asset name "${name}" found ${duplicates.length} times`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateVariants(
  asset: AssetMetadata,
  allAssets: AssetMetadata[],
  _errors: string[],
  warnings: string[]
): void {
  const baseName = asset.name
    .replace(/@\d+x$/, '')
    .replace(/-(dark|light)$/, '');
  const variants = asset.variants || [];

  if (variants.includes('@2x') || variants.includes('@3x')) {
    const hasBase = allAssets.some(
      (a) =>
        a.name === baseName &&
        !a.variants?.includes('@2x') &&
        !a.variants?.includes('@3x')
    );

    if (!hasBase) {
      warnings.push(
        `Density variant "${asset.name}" found but base variant may be missing`
      );
    }
  }
}

export function validateAssetFile(filePath: string): boolean {
  if (!fileExists(filePath)) {
    return false;
  }

  const ext = getFileExtension(filePath);
  const isValidExtension =
    VALID_IMAGE_EXTENSIONS.includes(ext) || VALID_SVG_EXTENSIONS.includes(ext);

  if (!isValidExtension) {
    return false;
  }

  try {
    const stats = fs.statSync(filePath);
    return stats.isFile() && stats.size > 0;
  } catch {
    return false;
  }
}
