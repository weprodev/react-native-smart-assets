import { Asset, setAssetRegistry, AssetSizes } from '../index';

describe('Main exports', () => {
  it('exports Asset component', () => {
    expect(Asset).toBeDefined();
    expect(typeof Asset).toBe('function');
  });

  it('exports utility functions', () => {
    expect(setAssetRegistry).toBeDefined();
    expect(AssetSizes).toBeDefined();
  });
});
