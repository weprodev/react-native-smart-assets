/**
 * react-native-smart-assets — Babel / Metro Compile-Time Validation Plugin
 *
 * Validates asset names used in <Asset name="…"> JSX props (and
 * `getAsset("…")` / `hasAsset("…")` calls) at **build time**, so typos
 * surface as build errors before the app even launches.
 *
 * ── Error example ──────────────────────────────────────────────────────────
 *   // ❌ Build error: Asset "icons/hom" not found.
 *   //    Did you mean "icons/home"?
 *   <Asset name="icons/hom" size={24} />
 * ───────────────────────────────────────────────────────────────────────────
 *
 * ── Setup (babel.config.js) ────────────────────────────────────────────────
 *   module.exports = {
 *     presets: ['module:@react-native/babel-preset'],
 *     plugins: [
 *       ['react-native-smart-assets/babel-plugin', {
 *         registryPath: './src/assets/index.ts',  // path to generated registry
 *         mode: 'error',   // 'error' | 'warn' | 'off'
 *       }],
 *     ],
 *   };
 * ───────────────────────────────────────────────────────────────────────────
 */

import * as path from 'path';
import * as fs from 'fs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BabelPluginOptions {
  /**
   * Path to the generated asset registry file (`index.ts` / `index.js`).
   * Relative paths are resolved from `process.cwd()` (your project root).
   * @default './assets/index.ts'
   */
  registryPath?: string;

  /**
   * How to report unknown asset names.
   * - `'error'` — throw a build error (hard fail, recommended for CI)
   * - `'warn'`  — print a console warning but keep building
   * - `'off'`   — disable validation entirely
   * @default 'error'
   */
  mode?: 'error' | 'warn' | 'off';

  /**
   * Names of JSX components whose `name` prop should be validated.
   * @default ['Asset']
   */
  assetComponents?: string[];

  /**
   * Names of function calls whose first string argument should be validated.
   * @default ['getAsset', 'hasAsset']
   */
  assetFunctions?: string[];
}

// ---------------------------------------------------------------------------
// Registry loading
// ---------------------------------------------------------------------------

/** Cached registry keyed by the resolved registry path. */
const registryCache = new Map<string, Set<string>>();

/**
 * Extracts known asset names from two patterns in the generated registry file:
 *   1. `export type AssetName = 'icons/home' | 'images/logo' | …`
 *   2. `'icons/home': require(…),`  (fallback — catches JS output too)
 */
function loadKnownAssets(registryPath: string): Set<string> {
  const resolved = path.isAbsolute(registryPath)
    ? registryPath
    : path.resolve(process.cwd(), registryPath);

  if (registryCache.has(resolved)) {
    return registryCache.get(resolved)!;
  }

  const names = new Set<string>();

  if (!fs.existsSync(resolved)) {
    // Registry not found: return empty set; validation will warn about this separately.
    registryCache.set(resolved, names);
    return names;
  }

  try {
    const src = fs.readFileSync(resolved, 'utf-8');

    // ── Strategy 1: union type  ──────────────────────────────────────────
    // export type AssetName = 'icons/home' | 'images/logo' | …;
    const typeMatch = src.match(
      /export\s+type\s+AssetName\s*=\s*((?:'[^']*'\s*\|?\s*)+);/
    );
    if (typeMatch) {
      const raw = typeMatch[1]!;
      for (const m of raw.matchAll(/'([^']+)'/g)) {
        names.add(m[1]!);
      }
    }

    // ── Strategy 2: object keys  ─────────────────────────────────────────
    // 'icons/home': require('./icons/home.png'),
    if (names.size === 0) {
      for (const m of src.matchAll(/^\s*'([^']+)':\s*require\(/gm)) {
        names.add(m[1]!);
      }
    }
  } catch {
    // Silently ignore read errors — validation will simply be skipped.
  }

  registryCache.set(resolved, names);
  return names;
}

// ---------------------------------------------------------------------------
// Levenshtein distance — for "did you mean?" suggestions
// ---------------------------------------------------------------------------

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_j, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1]![j - 1]!
          : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }
  return dp[m]![n]!;
}

function findClosestMatch(
  name: string,
  candidates: Set<string>,
  maxDistance = 3
): string | undefined {
  let best: string | undefined;
  let bestDist = maxDistance + 1;

  for (const candidate of candidates) {
    const dist = levenshtein(name, candidate);
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }

  return best;
}

// ---------------------------------------------------------------------------
// Babel plugin factory
// ---------------------------------------------------------------------------

/**
 * The plugin is a plain function that receives Babel's `api` object and
 * returns a `{ visitor }` descriptor.  We type it loosely so the file
 * compiles without requiring `@babel/core` as a hard dependency.
 */
type BabelAPI = {
  types: {
    isStringLiteral(node: unknown): boolean;
    isJSXAttribute(node: unknown): boolean;
    isJSXIdentifier(node: unknown, opts?: { name: string }): boolean;
    isJSXExpressionContainer(node: unknown): boolean;
    isStringLiteral(node: unknown, opts?: { value: string }): boolean;
  };
};

type BabelNode = {
  type: string;
  value?: string;
  name?: string | BabelNode;
};

type BabelPath = {
  node: BabelNode;
  get(key: string): BabelPath;
  buildCodeFrameError(msg: string): Error;
};

type BabelState = {
  opts?: BabelPluginOptions;
  filename?: string;
};

function smartAssetsBabelPlugin(api: BabelAPI) {
  const t = api.types;

  return {
    name: 'react-native-smart-assets/babel-plugin',

    visitor: {
      // ── JSX attribute:  <Asset name="icons/home" />
      JSXAttribute(nodePath: BabelPath, state: BabelState) {
        const opts = state.opts ?? {};
        const mode = opts.mode ?? 'error';
        if (mode === 'off') return;

        const assetComponents = opts.assetComponents ?? ['Asset'];
        const registryPath = opts.registryPath ?? './assets/index.ts';

        // Only look at the `name` attribute.
        const attrNameNode = nodePath.get('name').node;
        if (!t.isJSXIdentifier(attrNameNode as unknown, { name: 'name' })) {
          return;
        }

        // Resolve parent JSX element name.
        const openingElement = (nodePath as any).parentPath?.node;
        if (!openingElement) return;
        const elementName =
          openingElement.name?.name ?? openingElement.name ?? '';
        if (!assetComponents.includes(elementName as string)) return;

        // Get the string value of the `name` prop.
        const valueNode = nodePath.get('value').node;
        let assetName: string | undefined;

        if (t.isStringLiteral(valueNode as unknown)) {
          assetName = (valueNode as BabelNode).value;
        } else if (t.isJSXExpressionContainer(valueNode as unknown)) {
          const expr = (valueNode as any).expression;
          if (t.isStringLiteral(expr)) {
            assetName = expr.value;
          }
        }

        if (!assetName) return; // Dynamic values — can't validate statically.

        validate(assetName, registryPath, mode, nodePath, state.filename);
      },

      // ── Call expression:  getAsset("icons/home") / hasAsset("icons/home")
      CallExpression(nodePath: BabelPath, state: BabelState) {
        const opts = state.opts ?? {};
        const mode = opts.mode ?? 'error';
        if (mode === 'off') return;

        const assetFunctions = opts.assetFunctions ?? ['getAsset', 'hasAsset'];
        const registryPath = opts.registryPath ?? './assets/index.ts';

        const callee = (nodePath.node as any).callee;
        const fnName: string = callee?.name ?? callee?.property?.name ?? '';

        if (!assetFunctions.includes(fnName)) return;

        const args: BabelNode[] = (nodePath.node as any).arguments ?? [];
        const firstArg = args[0];
        if (!firstArg || !t.isStringLiteral(firstArg as unknown)) return;

        const assetName = firstArg.value;
        if (!assetName) return;

        validate(assetName, registryPath, mode, nodePath, state.filename);
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Validation helper
// ---------------------------------------------------------------------------

function validate(
  assetName: string,
  registryPath: string,
  mode: 'error' | 'warn',
  nodePath: BabelPath,
  filename?: string
): void {
  const knownAssets = loadKnownAssets(registryPath);

  if (knownAssets.size === 0) {
    // Registry not yet generated or empty — skip silently.
    return;
  }

  if (knownAssets.has(assetName)) return; // ✓ valid

  // Build the error message with an optional suggestion.
  const closest = findClosestMatch(assetName, knownAssets);
  const suggestion = closest ? `  Did you mean "${closest}"?` : '';
  const fileHint = filename
    ? ` in ${path.relative(process.cwd(), filename)}`
    : '';

  const message =
    `Asset "${assetName}" not found in the registry${fileHint}.` +
    (suggestion ? `\n${suggestion}` : '') +
    `\n\n  Run "npx react-native-smart-assets generate" to regenerate the registry,` +
    `\n  or check that the asset file exists in your assets directory.\n`;

  if (mode === 'warn') {
    // Babel doesn't expose a native warn-with-source-location API,
    // so we fall through to console.warn with the codeframe if possible.
    try {
      const err = nodePath.buildCodeFrameError(message);
      console.warn(`\n⚠  [react-native-smart-assets]\n${err.message}\n`);
    } catch {
      console.warn(`\n⚠  [react-native-smart-assets] ${message}\n`);
    }
    return;
  }

  // mode === 'error'
  throw nodePath.buildCodeFrameError(`[react-native-smart-assets] ${message}`);
}

export default smartAssetsBabelPlugin;

// CommonJS export so `plugins: ['react-native-smart-assets/babel-plugin']` works.
module.exports = smartAssetsBabelPlugin;
module.exports.default = smartAssetsBabelPlugin;
