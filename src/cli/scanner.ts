import * as path from 'path';
import * as fs from 'fs';
import type { AssetMetadata, AssetCategory } from '../types';
import {
  resolvePath,
  directoryExists,
  getFileExtension,
  normalizePath,
} from './utils';

export interface ScanResult {
  assets: AssetMetadata[];
  errors: string[];
}

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
const SVG_EXTENSIONS = ['.svg'];

export function scanAssetsDirectory(
  assetsDir: string,
  baseDir: string = process.cwd()
): ScanResult {
  const resolvedDir = resolvePath(assetsDir, baseDir);
  const assets: AssetMetadata[] = [];
  const errors: string[] = [];

  if (!directoryExists(resolvedDir)) {
    errors.push(`Assets directory does not exist: ${resolvedDir}`);
    return { assets, errors };
  }

  function scanDirectory(currentDir: string, relativePath: string = ''): void {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativeFilePath = relativePath
          ? `${relativePath}/${entry.name}`
          : entry.name;

        if (entry.isDirectory()) {
          scanDirectory(fullPath, relativeFilePath);
        } else if (entry.isFile()) {
          const ext = getFileExtension(entry.name);
          const fileName = path.basename(entry.name, ext);
          const assetName = normalizePath(relativeFilePath.replace(ext, ''));

          if (SVG_EXTENSIONS.includes(ext)) {
            assets.push({
              name: assetName,
              path: normalizePath(fullPath),
              type: 'svg',
              category: determineCategory(relativePath),
            });
          } else if (IMAGE_EXTENSIONS.includes(ext)) {
            const baseName = extractBaseName(fileName);
            const variants = detectVariants(fullPath, baseName, ext);

            assets.push({
              name: assetName,
              path: normalizePath(fullPath),
              type: 'image',
              category: determineCategory(relativePath),
              variants: variants.length > 0 ? variants : undefined,
            });
          }
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Error scanning directory ${currentDir}: ${errorMessage}`);
    }
  }

  scanDirectory(resolvedDir);

  return { assets, errors };
}

function determineCategory(relativePath: string): AssetCategory {
  const lowerPath = relativePath.toLowerCase();
  if (lowerPath.includes('icon')) {
    return 'icons';
  }
  if (lowerPath.includes('image')) {
    return 'images';
  }
  return 'assets';
}

function extractBaseName(fileName: string): string {
  return fileName
    .replace(/@\d+x$/, '')
    .replace(/\.(ios|android)$/, '')
    .replace(/-dark$/, '')
    .replace(/-light$/, '');
}

function detectVariants(
  filePath: string,
  _baseName: string,
  _extension: string
): string[] {
  const variants: string[] = [];
  const fileName = path.basename(filePath);

  if (fileName.includes('@2x')) {
    variants.push('@2x');
  }
  if (fileName.includes('@3x')) {
    variants.push('@3x');
  }
  if (fileName.includes('-dark')) {
    variants.push('dark');
  }
  if (fileName.includes('-light')) {
    variants.push('light');
  }
  if (fileName.includes('.ios')) {
    variants.push('ios');
  }
  if (fileName.includes('.android')) {
    variants.push('android');
  }

  return variants;
}
