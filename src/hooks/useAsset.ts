import { useMemo } from 'react';
import { getAsset, hasAsset } from '../utils/assetRegistry';

export function useAsset(name: string) {
  return useMemo(() => {
    const asset = getAsset(name);
    const exists = hasAsset(name);

    return {
      asset,
      exists,
      isSvg: name.endsWith('.svg') || name.toLowerCase().includes('.svg'),
    };
  }, [name]);
}
