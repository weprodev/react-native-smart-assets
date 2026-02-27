import { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  useColorScheme,
} from 'react-native';
import {
  setAssetRegistry,
  Asset,
  useAsset,
  useAssetPreloader,
  useAssetTheme,
  preloadRemoteAsset,
  isRemoteUrl,
  resolveAssetVariant,
} from '@weprodev/react-native-smart-assets';
import type {
  AssetVariant,
  AssetPlaceholderType,
  ColorScheme,
} from '@weprodev/react-native-smart-assets';
import * as Assets from '../assets';
import type { AssetName } from '../assets';

setAssetRegistry(Assets.ASSETS, Assets.ASSET_METADATA);

const REMOTE_ASSET_URLS = [
  'https://picsum.photos/200/200?random=1',
  'https://picsum.photos/200/200?random=2',
  'https://picsum.photos/200/200?random=3',
  'https://picsum.photos/200/200?random=4',
];

export default function App() {
  const [selectedAsset, setSelectedAsset] = useState<AssetName>('favicon');
  const assetInfo = useAsset(selectedAsset);
  const { preload, progress, isLoading, error } = useAssetPreloader();
  const [selectedRemoteUrl, setSelectedRemoteUrl] = useState<string>(
    REMOTE_ASSET_URLS[0] || ''
  );
  const [remotePreloadProgress, setRemotePreloadProgress] = useState({
    loaded: 0,
    total: 0,
    percentage: 0,
  });
  const [isPreloadingRemote, setIsPreloadingRemote] = useState(false);
  const [remotePreloadError, setRemotePreloadError] = useState<Error | null>(
    null
  );
  const [selectedVariant, setSelectedVariant] =
    useState<AssetVariant>('default');
  const [selectedDensity, setSelectedDensity] = useState<1 | 2 | 3>(1);
  const [selectedPlatform, setSelectedPlatform] = useState<
    'ios' | 'android' | 'web'
  >('web');

  useEffect(() => {
    preload();
  }, [preload]);

  const handlePreloadAll = () => {
    preload();
  };

  const handlePreloadSelected = () => {
    preload([selectedAsset]);
  };

  const handlePreloadRemoteAssets = async () => {
    setIsPreloadingRemote(true);
    setRemotePreloadError(null);
    setRemotePreloadProgress({
      loaded: 0,
      total: REMOTE_ASSET_URLS.length,
      percentage: 0,
    });

    try {
      const preloadPromises = REMOTE_ASSET_URLS.map((url) =>
        preloadRemoteAsset(url, 10000)
      );

      const results = await Promise.allSettled(preloadPromises);
      const loaded = results.filter(
        (r) => r.status === 'fulfilled' && r.value
      ).length;

      setRemotePreloadProgress({
        loaded,
        total: REMOTE_ASSET_URLS.length,
        percentage: Math.round((loaded / REMOTE_ASSET_URLS.length) * 100),
      });
    } catch (err) {
      const preloadError =
        err instanceof Error ? err : new Error('Remote preload failed');
      setRemotePreloadError(preloadError);
    } finally {
      setIsPreloadingRemote(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Smart Assets Example</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>useAsset Hook</Text>
          <View style={styles.assetSelector}>
            {Assets.getAllAssetNames().map((name) => (
              <TouchableOpacity
                key={name}
                style={[
                  styles.assetButton,
                  selectedAsset === name && styles.assetButtonActive,
                ]}
                onPress={() => setSelectedAsset(name)}
              >
                <Text
                  style={[
                    styles.assetButtonText,
                    selectedAsset === name && styles.assetButtonTextActive,
                  ]}
                >
                  {name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.assetInfo}>
            <Asset<AssetName> name={selectedAsset} size={64} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Asset Name:</Text>
              <Text style={styles.infoValue}>{selectedAsset}</Text>
              <Text style={styles.infoLabel}>Exists:</Text>
              <Text style={styles.infoValue}>
                {assetInfo.exists ? 'Yes' : 'No'}
              </Text>
              <Text style={styles.infoLabel}>Is SVG:</Text>
              <Text style={styles.infoValue}>
                {assetInfo.isSvg ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>useAssetPreloader Hook</Text>
          <View style={styles.preloaderControls}>
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handlePreloadAll}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Preload All Assets</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handlePreloadSelected}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Preload Selected</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Progress:</Text>
            <Text style={styles.progressText}>
              {progress.loaded} / {progress.total} ({progress.percentage}%)
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progress.percentage}%` },
                ]}
              />
            </View>
            {isLoading && <Text style={styles.statusText}>Loading...</Text>}
            {error && (
              <Text style={styles.errorText}>Error: {error.message}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remote Assets</Text>
          <View style={styles.remoteAssetSelector}>
            {REMOTE_ASSET_URLS.map((url) => (
              <TouchableOpacity
                key={url}
                style={[
                  styles.assetButton,
                  selectedRemoteUrl === url && styles.assetButtonActive,
                ]}
                onPress={() => setSelectedRemoteUrl(url)}
              >
                <Text
                  style={[
                    styles.assetButtonText,
                    selectedRemoteUrl === url && styles.assetButtonTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {url.length > 30 ? `${url.substring(0, 30)}...` : url}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.assetInfo}>
            <Asset name={selectedRemoteUrl} size={64} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Remote URL:</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {selectedRemoteUrl}
              </Text>
              <Text style={styles.infoLabel}>Is Remote:</Text>
              <Text style={styles.infoValue}>
                {isRemoteUrl(selectedRemoteUrl) ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>

          <View style={styles.preloaderControls}>
            <TouchableOpacity
              style={[
                styles.button,
                isPreloadingRemote && styles.buttonDisabled,
              ]}
              onPress={handlePreloadRemoteAssets}
              disabled={isPreloadingRemote}
            >
              <Text style={styles.buttonText}>Preload Remote Assets</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Progress:</Text>
            <Text style={styles.progressText}>
              {remotePreloadProgress.loaded} / {remotePreloadProgress.total} (
              {remotePreloadProgress.percentage}%)
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${remotePreloadProgress.percentage}%` },
                ]}
              />
            </View>
            {isPreloadingRemote && (
              <Text style={styles.statusText}>Loading...</Text>
            )}
            {remotePreloadError && (
              <Text style={styles.errorText}>
                Error: {remotePreloadError.message}
              </Text>
            )}
          </View>

          <View style={styles.assetsGrid}>
            {REMOTE_ASSET_URLS.map((url) => (
              <View key={url} style={styles.assetCard}>
                <Asset name={url} size={48} />
                <Text style={styles.assetCardText} numberOfLines={2}>
                  Remote
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Variants</Text>
          <Text style={styles.variantDescription}>
            Support for density variants (@2x, @3x), dark mode, and
            platform-specific assets
          </Text>

          <View style={styles.variantControls}>
            <View style={styles.variantGroup}>
              <Text style={styles.variantLabel}>Theme Variant:</Text>
              <View style={styles.variantButtons}>
                {(['default', 'light', 'dark'] as AssetVariant[]).map(
                  (variant) => (
                    <TouchableOpacity
                      key={variant}
                      style={[
                        styles.variantButton,
                        selectedVariant === variant &&
                          styles.variantButtonActive,
                      ]}
                      onPress={() => setSelectedVariant(variant)}
                    >
                      <Text
                        style={[
                          styles.variantButtonText,
                          selectedVariant === variant &&
                            styles.variantButtonTextActive,
                        ]}
                      >
                        {variant}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>

            <View style={styles.variantGroup}>
              <Text style={styles.variantLabel}>Density:</Text>
              <View style={styles.variantButtons}>
                {([1, 2, 3] as const).map((density) => (
                  <TouchableOpacity
                    key={density}
                    style={[
                      styles.variantButton,
                      selectedDensity === density && styles.variantButtonActive,
                    ]}
                    onPress={() => setSelectedDensity(density)}
                  >
                    <Text
                      style={[
                        styles.variantButtonText,
                        selectedDensity === density &&
                          styles.variantButtonTextActive,
                      ]}
                    >
                      {density}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.variantGroup}>
              <Text style={styles.variantLabel}>Platform:</Text>
              <View style={styles.variantButtons}>
                {(['web', 'ios', 'android'] as const).map((platform) => (
                  <TouchableOpacity
                    key={platform}
                    style={[
                      styles.variantButton,
                      selectedPlatform === platform &&
                        styles.variantButtonActive,
                    ]}
                    onPress={() => setSelectedPlatform(platform)}
                  >
                    <Text
                      style={[
                        styles.variantButtonText,
                        selectedPlatform === platform &&
                          styles.variantButtonTextActive,
                      ]}
                    >
                      {platform}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.variantExample}>
            <Text style={styles.variantExampleTitle}>
              Resolved Variant Names:
            </Text>
            {Assets.getAllAssetNames()
              .slice(0, 3)
              .map((baseName) => {
                const resolvedName = resolveAssetVariant(baseName, {
                  variant: selectedVariant,
                  density: selectedDensity,
                  platform: selectedPlatform,
                });
                return (
                  <View key={baseName} style={styles.variantExampleItem}>
                    <Text style={styles.variantExampleBase}>{baseName}</Text>
                    <Text style={styles.variantExampleArrow}>→</Text>
                    <Text style={styles.variantExampleResolved}>
                      {resolvedName}
                    </Text>
                  </View>
                );
              })}
          </View>

          <View style={styles.variantDemo}>
            <Text style={styles.variantDemoTitle}>Asset with Variants:</Text>
            <View style={styles.variantDemoAsset}>
              <Asset<AssetName>
                name={selectedAsset}
                size={64}
                variant={selectedVariant}
              />
              <View style={styles.variantDemoInfo}>
                <Text style={styles.variantDemoLabel}>Base Name:</Text>
                <Text style={styles.variantDemoValue}>{selectedAsset}</Text>
                <Text style={styles.variantDemoLabel}>Variant:</Text>
                <Text style={styles.variantDemoValue}>{selectedVariant}</Text>
                <Text style={styles.variantDemoLabel}>Density:</Text>
                <Text style={styles.variantDemoValue}>{selectedDensity}x</Text>
                <Text style={styles.variantDemoLabel}>Platform:</Text>
                <Text style={styles.variantDemoValue}>{selectedPlatform}</Text>
              </View>
            </View>
          </View>

          <View style={styles.variantInfo}>
            <Text style={styles.variantInfoTitle}>
              Variant Resolution Rules:
            </Text>
            <Text style={styles.variantInfoText}>
              • Theme variants: base-dark, base-light{'\n'}• Density variants:
              base@2x, base@3x{'\n'}• Platform variants: base.ios, base.android
              {'\n'}• Combined: base-dark.ios@2x
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Assets</Text>
          <View style={styles.assetsGrid}>
            {Assets.getAllAssetNames().map((name) => (
              <View key={name} style={styles.assetCard}>
                <Asset<AssetName> name={name} size={48} />
                <Text style={styles.assetCardText}>{name}</Text>
              </View>
            ))}
          </View>
        </View>

        <UseAssetThemeSection />
        <AssetPlaceholderSection />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── useAssetTheme demo ───────────────────────────────────────────────────────

function UseAssetThemeSection() {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<ColorScheme | undefined>(undefined);

  // Pick a real image asset so the result is visible
  const result = useAssetTheme('favicon', { colorScheme: override });
  // Also show the adaptive-icon variant (which doesn't have a -dark in registry
  // so this exercises the graceful fallback path)
  const noVariantResult = useAssetTheme('icon', { colorScheme: override });

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>useAssetTheme Hook</Text>
      <Text style={styles.variantDescription}>
        Automatically swaps to the <Text style={styles.mono}>-dark</Text> asset
        variant when the system (or override) is in dark mode. Falls back
        gracefully when the dark variant isn't registered.
      </Text>

      {/* System info */}
      <View style={styles.themeInfoRow}>
        <Text style={styles.infoLabel}>System scheme:</Text>
        <View
          style={[
            styles.schemeBadge,
            systemScheme === 'dark' ? styles.schemeDark : styles.schemeLight,
          ]}
        >
          <Text style={styles.schemeBadgeText}>
            {systemScheme ?? 'unknown'}
          </Text>
        </View>
      </View>

      {/* Manual override buttons */}
      <Text style={styles.variantLabel}>Force override:</Text>
      <View style={styles.variantButtons}>
        {([undefined, 'light', 'dark'] as const).map((scheme) => (
          <TouchableOpacity
            key={String(scheme)}
            style={[
              styles.variantButton,
              override === scheme && styles.variantButtonActive,
            ]}
            onPress={() => setOverride(scheme)}
          >
            <Text
              style={[
                styles.variantButtonText,
                override === scheme && styles.variantButtonTextActive,
              ]}
            >
              {scheme === undefined ? 'system' : scheme}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results table */}
      <View style={styles.themeResultsTable}>
        <AssetThemeRow label="favicon" result={result} />
        <AssetThemeRow
          label="icon"
          result={noVariantResult}
          note="no -dark registered → falls back"
        />
      </View>
    </View>
  );
}

function AssetThemeRow({
  label,
  result,
  note,
}: {
  label: string;
  result: ReturnType<typeof useAssetTheme>;
  note?: string;
}) {
  return (
    <View style={styles.themeRow}>
      <Asset name={result.name as any} size={40} />
      <View style={styles.themeRowInfo}>
        <Text style={styles.mono}>{label}</Text>
        <Text style={styles.themeRowResolved}>
          → <Text style={styles.mono}>{result.name}</Text>
        </Text>
        <Text style={styles.themeRowMeta}>
          scheme: {result.colorScheme}
          {'  '}| dark variant: {result.isDarkVariant ? '✓' : '✗'}
        </Text>
        {note && <Text style={styles.noteText}>{note}</Text>}
      </View>
    </View>
  );
}

// ─── Asset placeholder demo ───────────────────────────────────────────────────

const PLACEHOLDER_TYPES: AssetPlaceholderType[] = [
  'shimmer',
  'blur',
  'color',
  'none',
];

// A slow remote URL forces the placeholder to be visible long enough to see it
const SLOW_REMOTE_URL = 'https://picsum.photos/300/200?random=99';

function AssetPlaceholderSection() {
  const [placeholderType, setPlaceholderType] =
    useState<AssetPlaceholderType>('shimmer');
  const [imageKey, setImageKey] = useState(0);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Asset Placeholder / Skeleton</Text>
      <Text style={styles.variantDescription}>
        The <Text style={styles.mono}>placeholder</Text> prop shows a visual
        skeleton while the image is loading. Tap{' '}
        <Text style={styles.mono}>Reload</Text> to re-trigger the loading state.
      </Text>

      {/* Type selector */}
      <Text style={styles.variantLabel}>Placeholder type:</Text>
      <View style={[styles.variantButtons, { marginBottom: 20 }]}>
        {PLACEHOLDER_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.variantButton,
              placeholderType === type && styles.variantButtonActive,
            ]}
            onPress={() => setPlaceholderType(type)}
          >
            <Text
              style={[
                styles.variantButtonText,
                placeholderType === type && styles.variantButtonTextActive,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Live demo — keyed so a new key forces a fresh image mount */}
      <View style={styles.placeholderDemoRow}>
        {/* Remote image (loading takes time → placeholder visible) */}
        <View style={styles.placeholderDemoItem}>
          <Text style={styles.placeholderDemoLabel}>Remote image</Text>
          <Asset
            key={`remote-${imageKey}-${placeholderType}`}
            name={`${SLOW_REMOTE_URL}&bust=${imageKey}`}
            size={{ width: 140, height: 100 }}
            placeholder={placeholderType}
            placeholderColor="#DDE3EC"
          />
        </View>

        {/* Local image (loads near-instantly; compare with remote) */}
        <View style={styles.placeholderDemoItem}>
          <Text style={styles.placeholderDemoLabel}>Local image</Text>
          <Asset
            key={`local-${imageKey}-${placeholderType}`}
            name="favicon"
            size={{ width: 140, height: 100 }}
            placeholder={placeholderType}
            placeholderColor="#DDE3EC"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, { marginTop: 12 }]}
        onPress={() => setImageKey((k) => k + 1)}
      >
        <Text style={styles.buttonText}>↺ Reload images</Text>
      </TouchableOpacity>

      {/* Code snippet */}
      <View style={styles.codeBlock}>
        <Text style={styles.codeText}>
          {`<Asset\n  name="images/hero"\n  size={{ width: 300, height: 200 }}\n  placeholder="${placeholderType}"\n  placeholderColor="#DDE3EC"\n/>`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  assetSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  remoteAssetSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  assetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  assetButtonActive: {
    backgroundColor: '#007AFF',
  },
  assetButtonText: {
    fontSize: 12,
    color: '#333',
  },
  assetButtonTextActive: {
    color: '#ffffff',
  },
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  preloaderControls: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  statusText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#ff3b30',
    marginTop: 8,
  },
  assetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  assetCard: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    minWidth: 80,
  },
  assetCardText: {
    fontSize: 10,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  variantDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  variantControls: {
    marginBottom: 24,
  },
  variantGroup: {
    marginBottom: 16,
  },
  variantLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  variantButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  variantButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    minWidth: 60,
    alignItems: 'center',
  },
  variantButtonActive: {
    backgroundColor: '#007AFF',
  },
  variantButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  variantButtonTextActive: {
    color: '#ffffff',
  },
  variantExample: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  variantExampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  variantExampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  variantExampleBase: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  variantExampleArrow: {
    fontSize: 12,
    color: '#999',
  },
  variantExampleResolved: {
    fontSize: 12,
    color: '#007AFF',
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  variantDemo: {
    marginBottom: 16,
  },
  variantDemoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  variantDemoAsset: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  variantDemoInfo: {
    flex: 1,
  },
  variantDemoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  variantDemoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'monospace',
  },
  variantInfo: {
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  variantInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  variantInfoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    fontFamily: 'monospace',
  },

  // ── useAssetTheme styles ────────────────────────────────────────────────────
  themeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  schemeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  schemeLight: {
    backgroundColor: '#FFF9C4',
  },
  schemeDark: {
    backgroundColor: '#263238',
  },
  schemeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  themeResultsTable: {
    marginTop: 16,
    gap: 12,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
  },
  themeRowInfo: {
    flex: 1,
  },
  themeRowResolved: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  themeRowMeta: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  noteText: {
    fontSize: 11,
    color: '#FF9500',
    marginTop: 4,
    fontStyle: 'italic',
  },
  mono: {
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#5C6BC0',
  },

  // ── placeholder styles ──────────────────────────────────────────────────────
  placeholderDemoRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  placeholderDemoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  placeholderDemoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeBlock: {
    marginTop: 16,
    backgroundColor: '#1E1E2E',
    borderRadius: 8,
    padding: 14,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#CDD6F4',
    lineHeight: 20,
  },
});
