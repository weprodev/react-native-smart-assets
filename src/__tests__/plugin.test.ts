/**
 * Tests for the Expo Config Plugin (src/plugin.ts)
 */

import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// ── Mock @expo/config-plugins before importing the plugin ──────────────────

let capturedMod:
  | ((cfg: Record<string, unknown>) => Record<string, unknown>)
  | null = null;

jest.mock('@expo/config-plugins', () => ({
  withDangerousMod: jest.fn(
    (
      config: Record<string, unknown>,
      [, fn]: [string, (c: Record<string, unknown>) => Record<string, unknown>]
    ) => {
      capturedMod = fn;
      return config;
    }
  ),
}));

// ── Mock the generate function ─────────────────────────────────────────────

const mockGenerateAssetRegistry = jest.fn();

jest.mock('../cli/generate', () => ({
  generateAssetRegistry: (...args: unknown[]) =>
    mockGenerateAssetRegistry(...args),
}));

// ── Import plugin AFTER mocks are in place ─────────────────────────────────

const withSmartAssets = require('../plugin').default ?? require('../plugin');

// ── Helpers ────────────────────────────────────────────────────────────────

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'smart-assets-test-'));
}

function makeConfig(projectRoot: string): Record<string, unknown> {
  return {
    modRequest: { projectRoot },
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('withSmartAssets (Expo Config Plugin)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    capturedMod = null;
    mockGenerateAssetRegistry.mockReset();
    mockGenerateAssetRegistry.mockReturnValue({
      success: true,
      assetsCount: 3,
      errors: [],
      warnings: [],
      outputPath: path.join(tmpDir, 'assets', 'index.ts'),
    });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('returns the config unchanged (passes through)', () => {
    const config = { name: 'MyApp', slug: 'my-app' };
    const result = withSmartAssets(config, {});
    // withDangerousMod returns the config back — our mock does just that.
    expect(result).toMatchObject({ name: 'MyApp', slug: 'my-app' });
  });

  test('registers a withDangerousMod hook for "ios"', () => {
    const { withDangerousMod } = require('@expo/config-plugins');
    withSmartAssets({}, {});
    expect(withDangerousMod).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining(['ios', expect.any(Function)])
    );
  });

  test('calls generateAssetRegistry with resolved paths', () => {
    // Create a temporary assets dir so directoryExists passes.
    const assetsDir = path.join(tmpDir, 'src', 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    withSmartAssets({}, { assetsDir: assetsDir, outputDir: assetsDir });

    // Trigger the captured withDangerousMod callback.
    expect(capturedMod).not.toBeNull();
    capturedMod!(makeConfig(tmpDir));

    expect(mockGenerateAssetRegistry).toHaveBeenCalledWith(
      expect.objectContaining({
        assetsDir: assetsDir,
        outputDir: assetsDir,
        format: 'typescript',
      })
    );
  });

  test('logs a warning (not throw) when assetsDir does not exist and failOnError is false', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    withSmartAssets(
      {},
      { assetsDir: '/non/existent/path', failOnError: false }
    );
    expect(capturedMod).not.toBeNull();
    capturedMod!(makeConfig(tmpDir));

    expect(mockGenerateAssetRegistry).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));

    warnSpy.mockRestore();
  });

  test('throws when assetsDir does not exist and failOnError is true', () => {
    withSmartAssets({}, { assetsDir: '/non/existent/path', failOnError: true });
    expect(capturedMod).not.toBeNull();
    expect(() => capturedMod!(makeConfig(tmpDir))).toThrow(
      /Assets directory not found/
    );
  });

  test('propagates generation warnings to console', () => {
    const assetsDir = path.join(tmpDir, 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    mockGenerateAssetRegistry.mockReturnValueOnce({
      success: true,
      assetsCount: 2,
      errors: [],
      warnings: ['icons/logo.png is missing @2x variant'],
      outputPath: path.join(assetsDir, 'index.ts'),
    });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    withSmartAssets({}, { assetsDir, outputDir: assetsDir });
    capturedMod!(makeConfig(tmpDir));

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('@2x variant')
    );

    warnSpy.mockRestore();
  });

  test('logs warning (no throw) on generation failure when failOnError is false', () => {
    const assetsDir = path.join(tmpDir, 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    mockGenerateAssetRegistry.mockReturnValueOnce({
      success: false,
      assetsCount: 0,
      errors: ['Scan failed'],
      warnings: [],
      outputPath: '',
    });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    withSmartAssets(
      {},
      { assetsDir, outputDir: assetsDir, failOnError: false }
    );
    capturedMod!(makeConfig(tmpDir));

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('failed'));

    warnSpy.mockRestore();
  });

  test('throws on generation failure when failOnError is true', () => {
    const assetsDir = path.join(tmpDir, 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    mockGenerateAssetRegistry.mockReturnValueOnce({
      success: false,
      assetsCount: 0,
      errors: ['Scan failed'],
      warnings: [],
      outputPath: '',
    });

    withSmartAssets({}, { assetsDir, outputDir: assetsDir, failOnError: true });
    expect(() => capturedMod!(makeConfig(tmpDir))).toThrow(/Scan failed/);
  });

  test('uses assetsDir as default outputDir', () => {
    const assetsDir = path.join(tmpDir, 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    withSmartAssets({}, { assetsDir });
    capturedMod!(makeConfig(tmpDir));

    expect(mockGenerateAssetRegistry).toHaveBeenCalledWith(
      expect.objectContaining({ outputDir: assetsDir })
    );
  });
});
