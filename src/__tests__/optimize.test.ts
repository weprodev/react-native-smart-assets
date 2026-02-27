import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { runOptimize, formatBytes, formatSavings } from '../cli/optimize';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'optimize-test-'));
}

function writeFile(dir: string, name: string, bytes: number): string {
  const filePath = path.join(dir, name);
  // Write a buffer of the requested size filled with 0xFF (not compressible
  // by sharp, but that's fine — we only need the file to exist and have a
  // known original size for the analysis-only / error paths).
  fs.writeFileSync(filePath, Buffer.alloc(bytes, 0xff));
  return filePath;
}

// ─── formatBytes ─────────────────────────────────────────────────────────────

describe('formatBytes', () => {
  it('formats bytes as-is', () => {
    expect(formatBytes(512)).toBe('512B');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1KB');
    expect(formatBytes(240 * 1024)).toBe('240KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(1.2 * 1024 * 1024)).toBe('1.2MB');
  });
});

// ─── formatSavings ───────────────────────────────────────────────────────────

describe('formatSavings', () => {
  it('formats 80% savings', () => {
    expect(formatSavings(200_000, 40_000)).toBe('-80%');
  });

  it('formats 0% savings', () => {
    expect(formatSavings(100_000, 100_000)).toBe('-0%');
  });

  it('rounds to nearest integer', () => {
    // 1/3 saved ≈ 33%
    expect(formatSavings(3, 2)).toBe('-33%');
  });
});

// ─── runOptimize — analysis-only (no sharp) ───────────────────────────────────
//
// sharp isn't installed in the test environment, so every run goes through
// the analysis-only path. That's the exact path we need to test for the
// warning / size-check logic.

describe('runOptimize (analysis-only — sharp not installed)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns sharpAvailable=false when sharp is not installed', async () => {
    const result = await runOptimize({ assetsDir: tmpDir });
    expect(result.sharpAvailable).toBe(false);
  });

  it('returns empty result when there are no compressible files', async () => {
    // Put a non-image file in the dir
    fs.writeFileSync(path.join(tmpDir, 'registry.ts'), 'export default {}');
    const result = await runOptimize({ assetsDir: tmpDir });
    expect(result.files).toHaveLength(0);
  });

  it('discovers PNG and JPEG files', async () => {
    writeFile(tmpDir, 'logo.png', 1024);
    writeFile(tmpDir, 'hero.jpg', 2048);
    writeFile(tmpDir, 'icon.jpeg', 512);
    writeFile(tmpDir, 'README.md', 256); // should be ignored

    const result = await runOptimize({ assetsDir: tmpDir });
    expect(result.files).toHaveLength(3);

    const labels = result.files.map((f) => f.label).sort();
    expect(labels).toEqual(['hero.jpg', 'icon.jpeg', 'logo.png']);
  });

  it('flags files that exceed maxSize as oversized', async () => {
    const THRESHOLD = 10_000;
    writeFile(tmpDir, 'big.png', THRESHOLD + 1);
    writeFile(tmpDir, 'small.jpg', THRESHOLD - 1);

    const result = await runOptimize({
      assetsDir: tmpDir,
      maxSize: THRESHOLD,
    });

    const big = result.files.find((f) => f.label === 'big.png')!;
    const small = result.files.find((f) => f.label === 'small.jpg')!;

    expect(big.oversized).toBe(true);
    expect(small.oversized).toBe(false);
    expect(result.warnCount).toBe(1);
  });

  it('does not flag files under maxSize', async () => {
    writeFile(tmpDir, 'tiny.png', 100);
    const result = await runOptimize({ assetsDir: tmpDir, maxSize: 1_000 });
    expect(result.files[0]?.oversized).toBe(false);
    expect(result.warnCount).toBe(0);
  });

  it('sets analysisOnly=true for every file when sharp absent', async () => {
    writeFile(tmpDir, 'a.png', 512);
    writeFile(tmpDir, 'b.jpg', 512);
    const result = await runOptimize({ assetsDir: tmpDir });
    expect(result.files.every((f) => f.analysisOnly)).toBe(true);
  });

  it('sets compressed=false in analysis-only mode', async () => {
    writeFile(tmpDir, 'a.png', 1024);
    const result = await runOptimize({ assetsDir: tmpDir });
    expect(result.files[0]?.compressed).toBe(false);
    expect(result.compressedCount).toBe(0);
    expect(result.bytesSaved).toBe(0);
  });

  it('reports correct originalSize', async () => {
    const SIZE = 4_321;
    writeFile(tmpDir, 'test.png', SIZE);
    const result = await runOptimize({ assetsDir: tmpDir });
    expect(result.files[0]?.originalSize).toBe(SIZE);
  });

  it('walks sub-directories recursively', async () => {
    const subDir = path.join(tmpDir, 'icons');
    fs.mkdirSync(subDir);
    writeFile(subDir, 'home.png', 256);
    writeFile(tmpDir, 'background.jpg', 256);

    const result = await runOptimize({ assetsDir: tmpDir });
    expect(result.files).toHaveLength(2);

    const labels = result.files.map((f) => f.label).sort();
    expect(labels).toContain(path.join('icons', 'home.png'));
    expect(labels).toContain('background.jpg');
  });

  it('defaults maxSize to 512 KB (524288 bytes)', async () => {
    // Just under 512 KB: should NOT be oversized
    writeFile(tmpDir, 'ok.png', 524_287);
    // Just over 512 KB: SHOULD be oversized
    writeFile(tmpDir, 'toobig.png', 524_289);

    const result = await runOptimize({ assetsDir: tmpDir });
    const ok = result.files.find((f) => f.label === 'ok.png')!;
    const tooBig = result.files.find((f) => f.label === 'toobig.png')!;

    expect(ok.oversized).toBe(false);
    expect(tooBig.oversized).toBe(true);
  });
});
