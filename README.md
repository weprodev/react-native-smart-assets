# react-native-smart-assets

A smart, type-safe asset management system for React Native that automatically generates type definitions and provides a simple, intuitive API for loading images and SVG icons.

## Features

- 🎯 **Type-Safe**: Automatically generates TypeScript definitions for all your assets
- 🚀 **Zero Configuration**: Works out of the box with sensible defaults
- 📦 **Asset Registry**: Automatic scanning and registration of assets
- 🎨 **SVG Support**: Native SVG icon rendering with tinting and sizing
- 🔄 **Variants**: Support for density variants (@2x, @3x), dark mode, and platform-specific assets
- 🌐 **Remote Assets**: Load remote images with caching and fallback support
- ⚡ **Preloading**: Preload critical assets with progress tracking
- 🔍 **CLI Tools**: Generate, validate, and get statistics about your assets
- 👀 **Watch Mode**: Auto-regenerate types when assets change

## Installation

```sh
npm install react-native-smart-assets
# or
yarn add react-native-smart-assets
```

## Quick Start

### 1. Create Assets Directory

Create an `assets` directory in your project root and add your images and icons:

```
assets/
  ├── images/
  │   ├── logo.png
  │   └── background.jpg
  └── icons/
      ├── home.svg
      └── user.svg
```

### 2. Generate Asset Registry

Run the CLI tool to generate type-safe asset definitions:

```sh
npx react-native-smart-assets generate
```

This creates an `assets/index.ts` file with all your assets registered and typed.

### 3. Initialize Asset Registry

In your app entry point (e.g., `App.tsx` or `index.js`):

```tsx
import { setAssetRegistry } from 'react-native-smart-assets';
import * as Assets from './assets';

setAssetRegistry(Assets.ASSETS, Assets.ASSET_METADATA);
```

The `ASSET_METADATA` parameter is optional but recommended as it provides additional information about your assets (type, category, etc.) that can be used for better asset handling and type checking.

### 4. Use the Asset Component

```tsx
import { Asset } from 'react-native-smart-assets';

function MyComponent() {
  return (
    <>
      <Asset name="images/logo" size={100} />
      <Asset 
        name="icons/home" 
        size={24} 
        tintColor="#000" 
      />
      <Asset 
        name="images/background" 
        size={{ width: 300, height: 200 }} 
        resizeMode="cover"
      />
    </>
  );
}
```

## Complete Example

Here's a complete example demonstrating all the key features:

```tsx
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import {
  setAssetRegistry,
  Asset,
  useAsset,
  useAssetPreloader,
  preloadRemoteAsset,
  isRemoteUrl,
} from 'react-native-smart-assets';
import * as Assets from './assets';
import type { AssetName } from './assets';

// Initialize the asset registry
setAssetRegistry(Assets.ASSETS, Assets.ASSET_METADATA);

const REMOTE_ASSET_URLS = [
  'https://picsum.photos/200/200?random=1',
  'https://picsum.photos/200/200?random=2',
];

export default function App() {
  const [selectedAsset, setSelectedAsset] = useState<AssetName>('icon');
  const assetInfo = useAsset(selectedAsset);
  const { preload, progress, isLoading, error } = useAssetPreloader();

  // Preload assets on mount
  useEffect(() => {
    preload();
  }, [preload]);

  const handlePreloadSelected = () => {
    preload([selectedAsset]);
  };

  const handlePreloadRemoteAssets = async () => {
    try {
      await Promise.allSettled(
        REMOTE_ASSET_URLS.map((url) => preloadRemoteAsset(url, 10000))
      );
    } catch (err) {
      console.error('Failed to preload remote assets:', err);
    }
  };

  return (
    <ScrollView>
      {/* Local Asset Selection */}
      <View>
        <Text>Select Asset:</Text>
        {Assets.getAllAssetNames().map((name) => (
          <TouchableOpacity
            key={name}
            onPress={() => setSelectedAsset(name)}
          >
            <Text>{name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Display Selected Asset */}
      <View>
        <Asset<AssetName> name={selectedAsset} size={64} />
        <Text>Asset: {selectedAsset}</Text>
        <Text>Exists: {assetInfo.exists ? 'Yes' : 'No'}</Text>
        <Text>Is SVG: {assetInfo.isSvg ? 'Yes' : 'No'}</Text>
      </View>

      {/* Preloader Controls */}
      <View>
        <TouchableOpacity
          onPress={handlePreloadSelected}
          disabled={isLoading}
        >
          <Text>Preload Selected</Text>
        </TouchableOpacity>
        
        <Text>
          Progress: {progress.loaded} / {progress.total} ({progress.percentage}%)
        </Text>
        
        {isLoading && <Text>Loading...</Text>}
        {error && <Text>Error: {error.message}</Text>}
      </View>

      {/* Remote Assets */}
      <View>
        <Text>Remote Assets:</Text>
        {REMOTE_ASSET_URLS.map((url) => (
          <View key={url}>
            <Asset name={url} size={48} />
            <Text>{isRemoteUrl(url) ? 'Remote' : 'Local'}</Text>
          </View>
        ))}
        
        <TouchableOpacity onPress={handlePreloadRemoteAssets}>
          <Text>Preload Remote Assets</Text>
        </TouchableOpacity>
      </View>

      {/* Asset Grid */}
      <View>
        {Assets.getAllAssetNames().map((name) => (
          <View key={name}>
            <Asset<AssetName> name={name} size={48} />
            <Text>{name}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
```

## Usage

### Asset Component

The `<Asset />` component is the main way to render your assets:

```tsx
<Asset
  name="images/logo"           // Asset name (type-safe)
  size={24}                    // Size as number (square) or { width, height }
  style={styles.customStyle}   // Additional styles
  tintColor="#FF0000"          // Tint color (for SVG icons)
  resizeMode="contain"         // Image resize mode
  variant="dark"               // Variant (default, dark, light)
  testID="logo"                // Test ID for testing
/>
```

### Size Presets

Use predefined size constants:

```tsx
import { Asset, AssetSizes } from 'react-native-smart-assets';

<Asset name="icons/home" size={AssetSizes.medium} />
<Asset name="icons/user" size={AssetSizes.large} />
```

Available presets: `xs`, `sm`, `md`, `lg`, `xl`, `xxl`, `small`, `medium`, `large`, `xlarge`

### Remote Assets

Load remote images directly:

```tsx
<Asset 
  name="https://example.com/image.png" 
  size={200} 
/>
```

### Asset Preloading

Preload critical assets on app start:

```tsx
import { useAssetPreloader } from 'react-native-smart-assets';

function App() {
  const { preload, progress, isLoading } = useAssetPreloader([
    'images/logo',
    'images/background',
  ]);

  useEffect(() => {
    preload();
  }, []);

  if (isLoading) {
    return <Text>Loading assets: {progress.percentage}%</Text>;
  }

  return <YourApp />;
}
```

### Hooks

#### `useAsset(name: string)`

Get asset information:

```tsx
import { useAsset } from 'react-native-smart-assets';

function MyComponent() {
  const { asset, exists, isSvg } = useAsset('images/logo');
  
  if (!exists) {
    return <Text>Asset not found</Text>;
  }
  
  return <Asset name="images/logo" size={100} />;
}
```

## CLI Commands

### Generate Asset Registry

```sh
npx react-native-smart-assets generate
```

Options:
- `--assets-dir <path>`: Custom assets directory (default: `assets`)
- `--output-dir <path>`: Custom output directory (default: `assets`)
- `--format <format>`: Output format: `typescript` or `javascript` (default: `typescript`)

### Validate Assets

```sh
npx react-native-smart-assets validate
```

Checks for:
- Missing files
- Invalid file formats
- Duplicate asset names
- Missing variants

### Get Statistics

```sh
npx react-native-smart-assets stats
```

Shows:
- Total asset count
- Images vs SVG breakdown
- Assets with variants
- Category distribution

### Watch Mode

```sh
npx react-native-smart-assets watch
```

Automatically regenerates the asset registry when files change.

## Configuration

Create an `assets.config.js` file in your project root:

```js
module.exports = {
  assetsDir: 'assets',
  outputDir: 'assets',
  format: 'typescript',
};
```

## Asset Variants

### Density Variants

React Native automatically picks the right density variant:

```
assets/
  ├── icon.png      (1x)
  ├── icon@2x.png   (2x)
  └── icon@3x.png   (3x)
```

### Dark Mode Variants

Use `-dark` suffix for dark mode assets:

```
assets/
  ├── icon.svg
  └── icon-dark.svg
```

### Platform Variants

Use platform-specific extensions:

```
assets/
  ├── icon.ios.png
  └── icon.android.png
```

## API Reference

### Components

#### `Asset`

Main component for rendering assets.

**Props:**
- `name: string` - Asset name (type-safe from generated types)
- `size?: number | { width: number; height: number }` - Asset size
- `style?: StyleProp<ImageStyle>` - Additional styles
- `tintColor?: string` - Tint color (for SVG icons)
- `resizeMode?: ImageResizeMode` - Image resize mode
- `variant?: 'default' | 'dark' | 'light'` - Asset variant
- `testID?: string` - Test identifier

### Hooks

#### `useAsset(name: string)`

Returns asset information.

**Returns:**
- `asset: any` - The asset object
- `exists: boolean` - Whether the asset exists
- `isSvg: boolean` - Whether the asset is an SVG

#### `useAssetPreloader(assetNames?: string[])`

Preloads assets with progress tracking.

**Returns:**
- `preload: (names?: string[]) => Promise<void>` - Preload function
- `progress: { loaded: number; total: number; percentage: number }` - Progress info
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error if any

### Utilities

#### `setAssetRegistry(registry: AssetRegistry, metadata?: AssetMetadataMap)`

Initialize the asset registry with generated assets.

**Parameters:**
- `registry: AssetRegistry` - The asset registry object (typically `Assets.ASSETS`)
- `metadata?: AssetMetadataMap` - Optional metadata object (typically `Assets.ASSET_METADATA`) containing asset information like type, category, etc.

#### `getAsset(name: string)`

Get an asset by name.

#### `hasAsset(name: string)`

Check if an asset exists.

#### `getAllAssetNames(): string[]`

Get all registered asset names.

#### `AssetSizes`

Predefined size constants.

#### `getSizePreset(preset: AssetSizePreset): number`

Get a size preset value.

#### `getResponsiveSize(baseSize: number, scale?: number): number`

Calculate responsive size.

## TypeScript Support

The generated `assets/index.ts` file includes:

- `AssetName` type with all your asset names
- `ASSETS` constant with all asset imports
- `ASSET_METADATA` with asset information
- Helper functions for type-safe asset access

## Contributing

See the [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT

---

Made with ❤️ for the React Native community
