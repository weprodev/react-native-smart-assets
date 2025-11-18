import {
  setAssetRegistry,
  getAsset,
  hasAsset,
  getAllAssetNames,
  isSvgAsset,
  isImageAsset,
} from '../utils/assetRegistry';
import {
  resolveAssetVariant,
  getDensityVariant,
  extractBaseName,
} from '../utils/variants';
import { AssetSizes, getSizePreset, getResponsiveSize } from '../utils/sizes';
import {
  isRemoteUrl,
  getCachedRemoteAsset,
  cacheRemoteAsset,
} from '../utils/remoteAssets';

describe('assetRegistry', () => {
  beforeEach(() => {
    setAssetRegistry({});
  });

  it('sets and gets asset registry', () => {
    const registry = { test: { uri: 'test.png' } };
    setAssetRegistry(registry);
    expect(getAsset('test')).toEqual({ uri: 'test.png' });
  });

  it('checks if asset exists', () => {
    setAssetRegistry({ test: { uri: 'test.png' } });
    expect(hasAsset('test')).toBe(true);
    expect(hasAsset('nonexistent')).toBe(false);
  });

  it('gets all asset names', () => {
    setAssetRegistry({
      asset1: {},
      asset2: {},
    });
    const names = getAllAssetNames();
    expect(names).toContain('asset1');
    expect(names).toContain('asset2');
  });

  it('detects SVG assets', () => {
    expect(isSvgAsset('icon.svg')).toBe(true);
    expect(isSvgAsset('icon.SVG')).toBe(true);
    expect(isSvgAsset('icon.png')).toBe(false);
  });

  it('detects image assets', () => {
    expect(isImageAsset('image.png')).toBe(true);
    expect(isImageAsset('image.jpg')).toBe(true);
    expect(isImageAsset('icon.svg')).toBe(false);
  });
});

describe('variants', () => {
  it('resolves asset variants', () => {
    expect(resolveAssetVariant('icon', { variant: 'dark' })).toBe('icon-dark');
    expect(resolveAssetVariant('icon', { density: 2 })).toBe('icon@2x');
    expect(resolveAssetVariant('icon', { density: 3 })).toBe('icon@3x');
  });

  it('gets density variant', () => {
    expect(getDensityVariant('icon', 1)).toBe('icon');
    expect(getDensityVariant('icon', 2)).toBe('icon@2x');
    expect(getDensityVariant('icon', 3)).toBe('icon@3x');
  });

  it('extracts base name', () => {
    expect(extractBaseName('icon@2x.png')).toBe('icon');
    expect(extractBaseName('icon-dark.svg')).toBe('icon');
    expect(extractBaseName('icon.ios.png')).toBe('icon');
  });
});

describe('sizes', () => {
  it('provides size presets', () => {
    expect(AssetSizes.small).toBe(16);
    expect(AssetSizes.medium).toBe(24);
    expect(AssetSizes.large).toBe(32);
  });

  it('gets size preset', () => {
    expect(getSizePreset('small')).toBe(16);
    expect(getSizePreset('large')).toBe(32);
  });

  it('calculates responsive size', () => {
    expect(getResponsiveSize(16, 1.5)).toBe(24);
    expect(getResponsiveSize(24, 2)).toBe(48);
  });
});

describe('remoteAssets', () => {
  it('detects remote URLs', () => {
    expect(isRemoteUrl('https://example.com/image.png')).toBe(true);
    expect(isRemoteUrl('http://example.com/image.png')).toBe(true);
    expect(isRemoteUrl('//example.com/image.png')).toBe(true);
    expect(isRemoteUrl('local-image.png')).toBe(false);
  });

  it('caches remote assets', () => {
    cacheRemoteAsset(
      'https://example.com/image.png',
      'https://example.com/image.png'
    );
    const cached = getCachedRemoteAsset('https://example.com/image.png');
    expect(cached).toBe('https://example.com/image.png');
  });
});
