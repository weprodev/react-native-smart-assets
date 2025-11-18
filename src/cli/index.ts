#!/usr/bin/env node

import * as path from 'path';
import { generateAssetRegistry } from './generate';
import { scanAssetsDirectory } from './scanner';
import { validateAssets } from './validator';
import type { CliOptions } from './utils';
import {
  resolvePath,
  ensureDirectoryExists,
  directoryExists,
  fileExists,
  readFileContent,
} from './utils';

const DEFAULT_ASSETS_DIR = 'assets';
const DEFAULT_OUTPUT_DIR = 'assets';
const DEFAULT_FORMAT = 'typescript';

function parseArgs(): { command: string; options: CliOptions } {
  const args = process.argv.slice(2);
  const command = args[0] || 'generate';
  const options: CliOptions = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--assets-dir' && args[i + 1]) {
      options.assetsDir = args[++i];
    } else if (arg === '--output-dir' && args[i + 1]) {
      options.outputDir = args[++i];
    } else if (arg === '--watch') {
      options.watch = true;
    } else if (arg === '--format' && args[i + 1]) {
      options.format = args[++i] as 'typescript' | 'javascript';
    } else if (arg === '--config' && args[i + 1]) {
      options.configFile = args[++i];
    }
  }

  return { command, options };
}

function loadConfig(configPath?: string): Partial<CliOptions> {
  if (!configPath) {
    const defaultConfigPath = path.join(process.cwd(), 'assets.config.js');
    if (fileExists(defaultConfigPath)) {
      configPath = defaultConfigPath;
    } else {
      return {};
    }
  }

  if (!fileExists(configPath)) {
    console.warn(`Config file not found: ${configPath}`);
    return {};
  }

  try {
    const configContent = readFileContent(configPath);
    // eslint-disable-next-line no-eval
    const config = eval(`(${configContent})`);
    return config;
  } catch (error) {
    console.error(`Error loading config: ${error}`);
    return {};
  }
}

async function runGenerateCommand(options: CliOptions): Promise<void> {
  const config = loadConfig(options.configFile);
  const mergedOptions = { ...config, ...options };

  const assetsDir = mergedOptions.assetsDir || DEFAULT_ASSETS_DIR;
  const outputDir = mergedOptions.outputDir || DEFAULT_OUTPUT_DIR;
  const format = mergedOptions.format || DEFAULT_FORMAT;

  const resolvedAssetsDir = resolvePath(assetsDir);
  const resolvedOutputDir = resolvePath(outputDir);

  if (!directoryExists(resolvedAssetsDir)) {
    console.error(`Assets directory does not exist: ${resolvedAssetsDir}`);
    process.exit(1);
  }

  ensureDirectoryExists(resolvedOutputDir);

  console.log(`Scanning assets in: ${resolvedAssetsDir}`);
  const result = generateAssetRegistry({
    assetsDir: resolvedAssetsDir,
    outputDir: resolvedOutputDir,
    format,
  });

  if (result.success) {
    console.log(`✓ Generated asset registry with ${result.assetsCount} assets`);
    console.log(`  Output: ${result.outputPath}`);

    if (result.warnings.length > 0) {
      console.warn('\nWarnings:');
      result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
    }
  } else {
    console.error('\nErrors:');
    result.errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }
}

async function runValidateCommand(options: CliOptions): Promise<void> {
  const config = loadConfig(options.configFile);
  const mergedOptions = { ...config, ...options };

  const assetsDir = mergedOptions.assetsDir || DEFAULT_ASSETS_DIR;
  const resolvedAssetsDir = resolvePath(assetsDir);

  if (!directoryExists(resolvedAssetsDir)) {
    console.error(`Assets directory does not exist: ${resolvedAssetsDir}`);
    process.exit(1);
  }

  console.log(`Validating assets in: ${resolvedAssetsDir}`);
  const scanResult = scanAssetsDirectory(resolvedAssetsDir);
  const validationResult = validateAssets(scanResult.assets);

  if (validationResult.valid) {
    console.log('✓ All assets are valid');
  } else {
    console.error('\nValidation errors:');
    validationResult.errors.forEach((error) => console.error(`  - ${error}`));
  }

  if (validationResult.warnings.length > 0) {
    console.warn('\nWarnings:');
    validationResult.warnings.forEach((warning) =>
      console.warn(`  - ${warning}`)
    );
  }

  if (!validationResult.valid) {
    process.exit(1);
  }
}

async function runStatsCommand(options: CliOptions): Promise<void> {
  const config = loadConfig(options.configFile);
  const mergedOptions = { ...config, ...options };

  const assetsDir = mergedOptions.assetsDir || DEFAULT_ASSETS_DIR;
  const resolvedAssetsDir = resolvePath(assetsDir);

  if (!directoryExists(resolvedAssetsDir)) {
    console.error(`Assets directory does not exist: ${resolvedAssetsDir}`);
    process.exit(1);
  }

  console.log(`Scanning assets in: ${resolvedAssetsDir}`);
  const scanResult = scanAssetsDirectory(resolvedAssetsDir);

  const stats = {
    total: scanResult.assets.length,
    images: scanResult.assets.filter((a) => a.type === 'image').length,
    svgs: scanResult.assets.filter((a) => a.type === 'svg').length,
    icons: scanResult.assets.filter((a) => a.category === 'icons').length,
    withVariants: scanResult.assets.filter(
      (a) => a.variants && a.variants.length > 0
    ).length,
  };

  console.log('\nAsset Statistics:');
  console.log(`  Total assets: ${stats.total}`);
  console.log(`  Images: ${stats.images}`);
  console.log(`  SVG icons: ${stats.svgs}`);
  console.log(`  Icons category: ${stats.icons}`);
  console.log(`  Assets with variants: ${stats.withVariants}`);

  if (scanResult.errors.length > 0) {
    console.warn('\nErrors encountered:');
    scanResult.errors.forEach((error) => console.warn(`  - ${error}`));
  }
}

async function runWatchCommand(options: CliOptions): Promise<void> {
  const config = loadConfig(options.configFile);
  const mergedOptions = { ...config, ...options };

  const assetsDir = mergedOptions.assetsDir || DEFAULT_ASSETS_DIR;
  const resolvedAssetsDir = resolvePath(assetsDir);

  if (!directoryExists(resolvedAssetsDir)) {
    console.error(`Assets directory does not exist: ${resolvedAssetsDir}`);
    process.exit(1);
  }

  console.log(`Watching assets directory: ${resolvedAssetsDir}`);
  console.log('Press Ctrl+C to stop watching\n');

  await runGenerateCommand(options);

  let watchTimeout: NodeJS.Timeout | null = null;
  const DEBOUNCE_DELAY = 300;

  try {
    const fsWatch = require('fs');
    fsWatch.watch(
      resolvedAssetsDir,
      { recursive: true },
      (_eventType: string, filename: string) => {
        if (watchTimeout) {
          clearTimeout(watchTimeout);
        }

        watchTimeout = setTimeout(async () => {
          if (filename) {
            console.log(
              `\n[${new Date().toLocaleTimeString()}] File changed: ${filename}`
            );
            try {
              await runGenerateCommand(options);
            } catch (error) {
              console.error('Error during regeneration:', error);
            }
          }
        }, DEBOUNCE_DELAY);
      }
    );

    console.log('Watch mode active. Waiting for file changes...');
  } catch (error) {
    console.error('Error setting up watch mode:', error);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const { command, options } = parseArgs();

  try {
    switch (command) {
      case 'generate':
        await runGenerateCommand(options);
        break;
      case 'validate':
        await runValidateCommand(options);
        break;
      case 'stats':
        await runStatsCommand(options);
        break;
      case 'watch':
        await runWatchCommand(options);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Available commands: generate, validate, stats, watch');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
