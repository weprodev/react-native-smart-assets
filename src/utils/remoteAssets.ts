import { Image } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

export interface RemoteAssetConfig {
  url: string;
  cacheKey?: string;
  fallback?: ImageSourcePropType;
  timeout?: number;
}

const assetCache = new Map<string, { uri: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function isRemoteUrl(url: string): boolean {
  return (
    typeof url === 'string' &&
    (url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('//'))
  );
}

export function getCachedRemoteAsset(
  url: string,
  cacheKey?: string
): string | null {
  const key = cacheKey || url;
  const cached = assetCache.get(key);

  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < CACHE_DURATION) {
      return cached.uri;
    }
    assetCache.delete(key);
  }

  return null;
}

export function cacheRemoteAsset(
  url: string,
  resolvedUri: string,
  cacheKey?: string
): void {
  const key = cacheKey || url;
  assetCache.set(key, {
    uri: resolvedUri,
    timestamp: Date.now(),
  });
}

export async function preloadRemoteAsset(
  url: string,
  timeout: number = 10000
): Promise<boolean> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve(false);
    }, timeout);

    Image.prefetch(url)
      .then(() => {
        clearTimeout(timeoutId);
        cacheRemoteAsset(url, url);
        resolve(true);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        resolve(false);
      });
  });
}

export interface ResolvedRemoteAsset {
  uri: string;
  fallback?: ImageSourcePropType;
}

export function resolveRemoteAsset(
  config: RemoteAssetConfig
): ResolvedRemoteAsset {
  const { url, cacheKey, fallback } = config;

  if (!isRemoteUrl(url)) {
    return { uri: url, fallback };
  }

  const cached = getCachedRemoteAsset(url, cacheKey);
  if (cached) {
    return { uri: cached, fallback };
  }

  return { uri: url, fallback };
}
