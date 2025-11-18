import { useMemo } from 'react';
import { getAsset, hasAsset, isSvgAsset } from '../utils/assetRegistry';

export function useAsset(name: string) {
  return useMemo(() => {
    const asset = getAsset(name);
    const exists = hasAsset(name);

    return {
      asset,
      exists,
      isSvg: isSvgAsset(name),
    };
  }, [name]);
}
