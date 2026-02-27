/**
 * Tests for the Babel/Metro compile-time validation plugin (src/babel-plugin.ts)
 */

import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// ─── ESM-compat require so we always get the function itself ───────────────

const plugin = require('../babel-plugin');
const smartAssetsBabelPlugin =
  typeof plugin === 'function' ? plugin : plugin.default ?? plugin;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'babel-plugin-test-'));
}

/**
 * Writes a minimal registry file that exposes a given list of asset names
 * as the `AssetName` union type.
 */
function writeRegistry(dir: string, assetNames: string[]): string {
  const union = assetNames.map((n) => `'${n}'`).join(' | ');
  const content = `// Auto-generated
export type AssetName = ${union};

export const ASSETS = {
${assetNames.map((n) => `  '${n}': require('./${n}.png'),`).join('\n')}
} as const;
`;
  const registryPath = path.join(dir, 'index.ts');
  fs.writeFileSync(registryPath, content, 'utf-8');
  return registryPath;
}

/**
 * Creates a minimal mock Babel `api` object.
 */
function makeBabelApi() {
  return {
    types: {
      isStringLiteral(node: unknown, opts?: { value?: string }): boolean {
        if (!node || typeof node !== 'object') return false;
        const n = node as Record<string, unknown>;
        if (n.type !== 'StringLiteral') return false;
        if (opts?.value !== undefined) return n.value === opts.value;
        return true;
      },
      isJSXAttribute(node: unknown): boolean {
        return (
          typeof node === 'object' &&
          node !== null &&
          (node as Record<string, unknown>).type === 'JSXAttribute'
        );
      },
      isJSXIdentifier(node: unknown, opts?: { name?: string }): boolean {
        if (!node || typeof node !== 'object') return false;
        const n = node as Record<string, unknown>;
        if (n.type !== 'JSXIdentifier') return false;
        if (opts?.name !== undefined) return n.name === opts.name;
        return true;
      },
      isJSXExpressionContainer(node: unknown): boolean {
        return (
          typeof node === 'object' &&
          node !== null &&
          (node as Record<string, unknown>).type === 'JSXExpressionContainer'
        );
      },
    },
  };
}

/** Builds a minimal nodePath mock for JSXAttribute `name="<value>"`. */
function makeJSXAttrPath(
  componentName: string,
  attrValue: string
): Record<string, unknown> {
  const valueNode = { type: 'StringLiteral', value: attrValue };
  const attrNameNode = { type: 'JSXIdentifier', name: 'name' };

  return {
    node: { type: 'JSXAttribute', name: attrNameNode, value: valueNode },
    parentPath: {
      node: {
        type: 'JSXOpeningElement',
        name: { type: 'JSXIdentifier', name: componentName },
      },
    },
    get(key: string) {
      if (key === 'name') return { node: attrNameNode };
      if (key === 'value') return { node: valueNode };
      return { node: undefined };
    },
    buildCodeFrameError(msg: string) {
      return new Error(msg);
    },
  };
}

/** Builds a minimal nodePath mock for a CallExpression `fn("value")`. */
function makeCallPath(
  fnName: string,
  argValue: string
): Record<string, unknown> {
  const argNode = { type: 'StringLiteral', value: argValue };
  return {
    node: {
      type: 'CallExpression',
      callee: { type: 'Identifier', name: fnName },
      arguments: [argNode],
    },
    get() {
      return { node: undefined };
    },
    buildCodeFrameError(msg: string) {
      return new Error(msg);
    },
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('smartAssetsBabelPlugin', () => {
  let tmpDir: string;
  let registryPath: string;
  const ASSETS = ['icons/home', 'icons/heart', 'images/logo', 'images/banner'];

  beforeEach(() => {
    tmpDir = makeTmpDir();
    registryPath = writeRegistry(tmpDir, ASSETS);
    // Clear the module cache so the registry is reloaded for each test.
    // (The plugin caches per resolved path, so use a fresh registry each run.)
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ── Plugin shape ──────────────────────────────────────────────────────────

  test('returns a visitor object with JSXAttribute and CallExpression', () => {
    const api = makeBabelApi();
    const result = smartAssetsBabelPlugin(api);
    expect(result).toHaveProperty('visitor');
    expect(result.visitor).toHaveProperty('JSXAttribute');
    expect(result.visitor).toHaveProperty('CallExpression');
  });

  // ── JSXAttribute — valid names ────────────────────────────────────────────

  test('does not throw for a valid asset name in JSX prop', () => {
    const api = makeBabelApi();
    const { JSXAttribute } = smartAssetsBabelPlugin(api).visitor;
    const nodePath = makeJSXAttrPath('Asset', 'icons/home');
    const state = { opts: { registryPath, mode: 'error' } };

    expect(() => JSXAttribute(nodePath as unknown, state)).not.toThrow();
  });

  // ── JSXAttribute — invalid names ──────────────────────────────────────────

  test('throws for an unknown asset name in JSX prop (mode: error)', () => {
    const api = makeBabelApi();
    const { JSXAttribute } = smartAssetsBabelPlugin(api).visitor;
    const nodePath = makeJSXAttrPath('Asset', 'icons/hom'); // typo
    const state = { opts: { registryPath, mode: 'error' } };

    expect(() => JSXAttribute(nodePath as unknown, state)).toThrow(
      /icons\/hom.*not found/i
    );
  });

  test('includes a "did you mean" suggestion for a close typo', () => {
    const api = makeBabelApi();
    const { JSXAttribute } = smartAssetsBabelPlugin(api).visitor;
    const nodePath = makeJSXAttrPath('Asset', 'icons/hom'); // distance 1 from "icons/home"
    const state = { opts: { registryPath, mode: 'error' } };

    let errorMessage = '';
    try {
      JSXAttribute(nodePath as unknown, state);
    } catch (e) {
      errorMessage = (e as Error).message;
    }

    expect(errorMessage).toMatch(/icons\/home/);
  });

  test('warns (not throws) for an unknown asset in warn mode', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const api = makeBabelApi();
    const { JSXAttribute } = smartAssetsBabelPlugin(api).visitor;
    const nodePath = makeJSXAttrPath('Asset', 'icons/hom');
    const state = { opts: { registryPath, mode: 'warn' } };

    expect(() => JSXAttribute(nodePath as unknown, state)).not.toThrow();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('icons/hom'));

    warnSpy.mockRestore();
  });

  test('does nothing in off mode', () => {
    const api = makeBabelApi();
    const { JSXAttribute } = smartAssetsBabelPlugin(api).visitor;
    const nodePath = makeJSXAttrPath('Asset', 'totally/wrong');
    const state = { opts: { registryPath, mode: 'off' } };

    expect(() => JSXAttribute(nodePath as unknown, state)).not.toThrow();
  });

  // ── JSXAttribute — non-Asset components ──────────────────────────────────

  test('ignores unknown component names by default', () => {
    const api = makeBabelApi();
    const { JSXAttribute } = smartAssetsBabelPlugin(api).visitor;
    const nodePath = makeJSXAttrPath('Image', 'icons/hom'); // not in assetComponents
    const state = { opts: { registryPath, mode: 'error' } };

    expect(() => JSXAttribute(nodePath as unknown, state)).not.toThrow();
  });

  test('validates custom assetComponents', () => {
    const api = makeBabelApi();
    const { JSXAttribute } = smartAssetsBabelPlugin(api).visitor;
    const nodePath = makeJSXAttrPath('SmartImage', 'icons/hom');
    const state = {
      opts: { registryPath, mode: 'error', assetComponents: ['SmartImage'] },
    };

    expect(() => JSXAttribute(nodePath as unknown, state)).toThrow(
      /icons\/hom.*not found/i
    );
  });

  // ── CallExpression ────────────────────────────────────────────────────────

  test('does not throw for valid asset name in getAsset()', () => {
    const api = makeBabelApi();
    const { CallExpression } = smartAssetsBabelPlugin(api).visitor;
    const nodePath = makeCallPath('getAsset', 'images/logo');
    const state = { opts: { registryPath, mode: 'error' } };

    expect(() => CallExpression(nodePath as unknown, state)).not.toThrow();
  });

  test('throws for unknown asset name in getAsset()', () => {
    const api = makeBabelApi();
    const { CallExpression } = smartAssetsBabelPlugin(api).visitor;
    const nodePath = makeCallPath('getAsset', 'images/typo');
    const state = { opts: { registryPath, mode: 'error' } };

    expect(() => CallExpression(nodePath as unknown, state)).toThrow(
      /images\/typo.*not found/i
    );
  });

  test('throws for unknown asset name in hasAsset()', () => {
    const api = makeBabelApi();
    const { CallExpression } = smartAssetsBabelPlugin(api).visitor;
    const nodePath = makeCallPath('hasAsset', 'images/ghost');
    const state = { opts: { registryPath, mode: 'error' } };

    expect(() => CallExpression(nodePath as unknown, state)).toThrow(
      /images\/ghost.*not found/i
    );
  });

  test('ignores unrelated function calls', () => {
    const api = makeBabelApi();
    const { CallExpression } = smartAssetsBabelPlugin(api).visitor;
    const nodePath = makeCallPath('console.log', 'images/ghost');
    const state = { opts: { registryPath, mode: 'error' } };

    expect(() => CallExpression(nodePath as unknown, state)).not.toThrow();
  });

  // ── Registry edge cases ───────────────────────────────────────────────────

  test('skips validation silently when registry file does not exist', () => {
    const api = makeBabelApi();
    const { JSXAttribute } = smartAssetsBabelPlugin(api).visitor;
    const nodePath = makeJSXAttrPath('Asset', 'icons/ghost');
    const state = {
      opts: { registryPath: '/non/existent/registry.ts', mode: 'error' },
    };

    expect(() => JSXAttribute(nodePath as unknown, state)).not.toThrow();
  });
});
