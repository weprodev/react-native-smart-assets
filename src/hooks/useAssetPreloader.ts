import { useState, useCallback } from 'react';
import { Image as RNImage } from 'react-native';
import { getAllAssetNames, getAsset } from '../utils/assetRegistry';

interface ExpoImagePrefetchOptions {
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
}

type ExpoImagePrefetch = (
  uri: string,
  options?: ExpoImagePrefetchOptions
) => Promise<boolean>;

let expoImagePrefetch: ExpoImagePrefetch | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const expoImage = require('expo-image');
  expoImagePrefetch = expoImage.prefetch || expoImage.Image?.prefetch;
} catch {
  expoImagePrefetch = null;
}

export interface PreloadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UseAssetPreloaderResult {
  preload: (assetNames?: string[]) => Promise<void>;
  progress: PreloadProgress;
  isLoading: boolean;
  error: Error | null;
}

export function useAssetPreloader(
  assetNames?: string[]
): UseAssetPreloaderResult {
  const [progress, setProgress] = useState<PreloadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const preload = useCallback(
    async (names?: string[]) => {
      const assetsToPreload = names || assetNames || getAllAssetNames();
      const total = assetsToPreload.length;

      if (total === 0) {
        return;
      }

      setIsLoading(true);
      setError(null);
      setProgress({ loaded: 0, total, percentage: 0 });

      try {
        const preloadPromises = assetsToPreload.map((name) => {
          const asset = getAsset(name);
          if (!asset) {
            return Promise.resolve();
          }

          let uri: string;
          if (typeof asset === 'string') {
            uri = asset;
          } else if (
            typeof asset === 'object' &&
            asset !== null &&
            'uri' in asset &&
            typeof asset.uri === 'string'
          ) {
            uri = asset.uri;
          } else {
            const resolved = RNImage.resolveAssetSource(asset as number);
            uri = resolved?.uri || '';
          }

          const prefetchPromise = expoImagePrefetch
            ? expoImagePrefetch(uri, { cachePolicy: 'memory-disk' })
            : RNImage.prefetch(uri);

          return prefetchPromise
            .then(() => {
              setProgress((prev) => {
                const loaded = prev.loaded + 1;
                return {
                  loaded,
                  total,
                  percentage: Math.round((loaded / total) * 100),
                };
              });
            })
            .catch((err) => {
              if (__DEV__) {
                console.warn(`Failed to preload asset "${name}":`, err);
              }
            });
        });

        await Promise.all(preloadPromises);
      } catch (preloadErr) {
        const error =
          preloadErr instanceof Error
            ? preloadErr
            : new Error('Preload failed');
        setError(error);
      } finally {
        setIsLoading(false);
      }
    },
    [assetNames]
  );

  return {
    preload,
    progress,
    isLoading,
    error,
  };
}
