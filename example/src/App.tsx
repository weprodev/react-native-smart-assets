import { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  setAssetRegistry,
  Asset,
  useAsset,
  useAssetPreloader,
} from '@weprodev/react-native-smart-assets';
import * as Assets from '../assets';
import type { AssetName } from '../assets';

setAssetRegistry(Assets.ASSETS, Assets.ASSET_METADATA);

export default function App() {
  const [selectedAsset, setSelectedAsset] = useState<AssetName>('favicon');
  const assetInfo = useAsset(selectedAsset);
  const { preload, progress, isLoading, error } = useAssetPreloader();
  console.log('assetInfo', assetInfo);
  useEffect(() => {
    preload();
  }, [preload]);

  const handlePreloadAll = () => {
    preload();
  };

  const handlePreloadSelected = () => {
    preload([selectedAsset]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
    </ScrollView>
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
});
