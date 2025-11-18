import * as path from 'path';
import * as fs from 'fs';

export interface CliOptions {
  assetsDir?: string;
  outputDir?: string;
  watch?: boolean;
  format?: 'typescript' | 'javascript';
  configFile?: string;
}

export function resolvePath(
  filePath: string,
  baseDir: string = process.cwd()
): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  return path.resolve(baseDir, filePath);
}

export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

export function directoryExists(dirPath: string): boolean {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
}

export function readFileContent(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

export function writeFileContent(filePath: string, content: string): void {
  ensureDirectoryExists(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function getFileExtension(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

export function getRelativePath(from: string, to: string): string {
  return normalizePath(path.relative(from, to));
}
