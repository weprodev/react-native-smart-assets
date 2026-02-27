/**
 * react-native-smart-assets — Expo Config Plugin
 *
 * Automatically runs the asset registry generator during `expo prebuild`,
 * so the registry is always in sync without manual intervention.
 *
 * Usage in app.config.js / app.config.ts:
 *
 *   export default {
 *     plugins: [
 *       ['react-native-smart-assets/plugin', {
 *         assetsDir: './src/assets',
 *         outputDir: './src/assets',
 *       }]
 *     ]
 *   };
 */

import * as path from 'path';
import * as fs from 'fs';
import { generateAssetRegistry } from './cli/generate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SmartAssetsPluginOptions {
  /**
   * Directory that contains your raw asset files (images, SVGs, …).
   * Relative paths are resolved from the project root (where app.config.js lives).
   * @default './assets'
   */
  assetsDir?: string;

  /**
   * Directory where the generated `index.ts` registry will be written.
   * Relative paths are resolved from the project root.
   * @default Same as `assetsDir`
   */
  outputDir?: string;

  /**
   * Output format for the generated registry file.
   * @default 'typescript'
   */
  format?: 'typescript' | 'javascript';

  /**
   * Set to `true` to fail the prebuild when the generator encounters errors.
   * When `false` (default), errors are logged as warnings so the build continues.
   * @default false
   */
  failOnError?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveProjectPath(projectRoot: string, relativePath: string): string {
  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }
  // Strip a leading './' for cleaner logs, then resolve.
  return path.resolve(projectRoot, relativePath);
}

function directoryExists(dirPath: string): boolean {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Core generation logic (called by the plugin hook)
// ---------------------------------------------------------------------------

function runGenerate(
  projectRoot: string,
  options: SmartAssetsPluginOptions
): void {
  const assetsDir = options.assetsDir ?? './assets';
  const outputDir = options.outputDir ?? assetsDir;
  const format = options.format ?? 'typescript';
  const failOnError = options.failOnError ?? false;

  const resolvedAssetsDir = resolveProjectPath(projectRoot, assetsDir);
  const resolvedOutputDir = resolveProjectPath(projectRoot, outputDir);

  console.log(
    '\n[react-native-smart-assets] Running asset registry generation…'
  );
  console.log(`  assetsDir : ${resolvedAssetsDir}`);
  console.log(`  outputDir : ${resolvedOutputDir}`);

  if (!directoryExists(resolvedAssetsDir)) {
    const msg = `[react-native-smart-assets] Assets directory not found: ${resolvedAssetsDir}`;
    if (failOnError) {
      throw new Error(msg);
    }
    console.warn(`⚠  ${msg}`);
    return;
  }

  ensureDirectoryExists(resolvedOutputDir);

  const result = generateAssetRegistry({
    assetsDir: resolvedAssetsDir,
    outputDir: resolvedOutputDir,
    format,
    baseDir: projectRoot,
  });

  if (result.success) {
    console.log(
      `✓ [react-native-smart-assets] Registry generated — ${result.assetsCount} asset(s)`
    );
    console.log(`  Output: ${result.outputPath}`);

    if (result.warnings.length > 0) {
      console.warn('\n  Warnings:');
      result.warnings.forEach((w) => console.warn(`    ⚠  ${w}`));
    }
  } else {
    const header =
      '[react-native-smart-assets] Asset registry generation failed:';
    if (failOnError) {
      throw new Error(`${header}\n${result.errors.join('\n')}`);
    }
    console.warn(`⚠  ${header}`);
    result.errors.forEach((e) => console.warn(`    - ${e}`));
  }
}

// ---------------------------------------------------------------------------
// Expo Config Plugin
// ---------------------------------------------------------------------------

/**
 * withSmartAssets — Expo config plugin.
 *
 * Hooks into the `prebuild` phase to regenerate the asset registry before
 * the native project is built.  This means you never need to remember to run
 * `npx react-native-smart-assets generate` manually.
 */
function withSmartAssets(
  config: Record<string, unknown>,
  options: SmartAssetsPluginOptions = {}
): Record<string, unknown> {
  // `expo-modules-core` exposes `withDangerousMod` which lets us run arbitrary
  // Node.js code during prebuild for both iOS and Android "phases".
  // We only need to run once (the "pre" phase for iOS is sufficient).
  let withDangerousMod:
    | ((
        config: Record<string, unknown>,
        mod: [string, (c: Record<string, unknown>) => Record<string, unknown>]
      ) => Record<string, unknown>)
    | undefined;

  try {
    ({ withDangerousMod } = require('@expo/config-plugins'));
  } catch {
    console.warn(
      '[react-native-smart-assets] @expo/config-plugins not found. ' +
        'Install it or use Expo SDK ≥ 41 to use the config plugin.'
    );
    return config;
  }

  return withDangerousMod!(config, [
    'ios',
    (cfg) => {
      const projectRoot: string =
        (cfg.modRequest as { projectRoot?: string })?.projectRoot ??
        process.cwd();

      runGenerate(projectRoot, options);

      return cfg;
    },
  ]);
}

export default withSmartAssets;

// CommonJS-compatible export so `require('react-native-smart-assets/plugin')`
// also works without `.default`.
module.exports = withSmartAssets;
module.exports.default = withSmartAssets;
