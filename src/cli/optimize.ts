import * as fs from 'fs';
import * as path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OptimizeOptions {
  /** Root assets directory to scan. */
  assetsDir: string;
  /** JPEG quality 0–100 (default 80). Has no effect on PNG. */
  quality?: number;
  /**
   * Warn when an asset exceeds this byte-size after compression.
   * Default: 512 KB (524_288 bytes).
   */
  maxSize?: number;
  /** When true, report what would happen but write nothing to disk. */
  dryRun?: boolean;
}

export interface OptimizeFileResult {
  /** Absolute path to the file. */
  filePath: string;
  /** Display name (relative to assetsDir). */
  label: string;
  /** Original file size in bytes. */
  originalSize: number;
  /** Size after compression (equals originalSize on skip/error). */
  compressedSize: number;
  /** True when the file was (or would be) written. */
  compressed: boolean;
  /** True when the file exceeds maxSize *after* compression. */
  oversized: boolean;
  /** Non-null when something went wrong processing this file. */
  error: string | null;
  /** True when sharp wasn't available and we fell back to analysis-only. */
  analysisOnly: boolean;
}

export interface OptimizeResult {
  files: OptimizeFileResult[];
  /** Whether sharp was available for real compression. */
  sharpAvailable: boolean;
  /** Files actually changed (or that would change in dry-run). */
  compressedCount: number;
  /** Files that are larger than maxSize after compression. */
  warnCount: number;
  /** Files that produced an error. */
  errorCount: number;
  /** Total bytes saved (or estimated savings). */
  bytesSaved: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PNG_EXTENSIONS = new Set(['.png']);
const JPEG_EXTENSIONS = new Set(['.jpg', '.jpeg']);
const COMPRESSIBLE_EXTENSIONS = new Set([
  ...PNG_EXTENSIONS,
  ...JPEG_EXTENSIONS,
]);

const DEFAULT_QUALITY = 80;
const DEFAULT_MAX_SIZE = 512 * 1024; // 512 KB

// ─── Sharp loader (optional) ──────────────────────────────────────────────────

// We lazy-require sharp so the library still works in projects that haven't
// installed it. sharp is a native-addon package that must be an explicit dev /
// optional dependency of the consuming project.
type SharpInstance = {
  jpeg(opts: { quality: number }): SharpInstance;
  png(opts: { compressionLevel: number; quality: number }): SharpInstance;
  toBuffer(): Promise<Buffer>;
};

type SharpFn = (input: Buffer) => SharpInstance;

function tryLoadSharp(): SharpFn | null {
  try {
    return require('sharp') as SharpFn;
  } catch {
    return null;
  }
}

// ─── File discovery ───────────────────────────────────────────────────────────

function collectCompressibleFiles(dir: string): string[] {
  const results: string[] = [];

  function walk(current: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (
        entry.isFile() &&
        COMPRESSIBLE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
      ) {
        results.push(fullPath);
      }
    }
  }

  walk(dir);
  return results;
}

// ─── Compression helpers ──────────────────────────────────────────────────────

async function compressFileWithSharp(
  sharp: SharpFn,
  filePath: string,
  quality: number
): Promise<Buffer> {
  const input = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  if (JPEG_EXTENSIONS.has(ext)) {
    return sharp(input).jpeg({ quality }).toBuffer();
  }

  // PNG: map quality (0–100) to compressionLevel (0–9, inverted)
  const compressionLevel = Math.round((1 - quality / 100) * 9);
  return sharp(input).png({ compressionLevel, quality }).toBuffer();
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function runOptimize(
  options: OptimizeOptions
): Promise<OptimizeResult> {
  const quality = options.quality ?? DEFAULT_QUALITY;
  const maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
  const dryRun = options.dryRun ?? false;

  const sharp = tryLoadSharp();
  const sharpAvailable = sharp !== null;

  const filePaths = collectCompressibleFiles(options.assetsDir);

  const fileResults: OptimizeFileResult[] = [];
  let compressedCount = 0;
  let warnCount = 0;
  let errorCount = 0;
  let bytesSaved = 0;

  for (const filePath of filePaths) {
    const label = path.relative(options.assetsDir, filePath);
    let originalSize: number;

    try {
      originalSize = fs.statSync(filePath).size;
    } catch (statErr) {
      fileResults.push({
        filePath,
        label,
        originalSize: 0,
        compressedSize: 0,
        compressed: false,
        oversized: false,
        error: `Cannot read file: ${(statErr as Error).message}`,
        analysisOnly: false,
      });
      errorCount++;
      continue;
    }

    // ── No sharp: analysis-only (report size warnings, no actual compression)
    if (!sharp) {
      const oversized = originalSize > maxSize;
      if (oversized) warnCount++;

      fileResults.push({
        filePath,
        label,
        originalSize,
        compressedSize: originalSize,
        compressed: false,
        oversized,
        error: null,
        analysisOnly: true,
      });
      continue;
    }

    // ── Compress with sharp
    try {
      const outputBuffer = await compressFileWithSharp(
        sharp,
        filePath,
        quality
      );
      const compressedSize = outputBuffer.length;

      // Only keep the result if it's actually smaller
      const worthSaving = compressedSize < originalSize;

      if (worthSaving && !dryRun) {
        fs.writeFileSync(filePath, outputBuffer);
      }

      const saved = worthSaving ? originalSize - compressedSize : 0;
      bytesSaved += saved;

      if (worthSaving) compressedCount++;

      const oversized = compressedSize > maxSize;
      if (oversized) warnCount++;

      fileResults.push({
        filePath,
        label,
        originalSize,
        compressedSize: worthSaving ? compressedSize : originalSize,
        compressed: worthSaving,
        oversized,
        error: null,
        analysisOnly: false,
      });
    } catch (compressErr) {
      errorCount++;
      fileResults.push({
        filePath,
        label,
        originalSize,
        compressedSize: originalSize,
        compressed: false,
        oversized: originalSize > maxSize,
        error: `Compression failed: ${(compressErr as Error).message}`,
        analysisOnly: false,
      });
    }
  }

  return {
    files: fileResults,
    sharpAvailable,
    compressedCount,
    warnCount,
    errorCount,
    bytesSaved,
  };
}

// ─── Formatting helpers (used by the CLI runner) ──────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)}MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)}KB`;
  return `${bytes}B`;
}

export function formatSavings(original: number, compressed: number): string {
  const pct = Math.round(((original - compressed) / original) * 100);
  return `-${pct}%`;
}
