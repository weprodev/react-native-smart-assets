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
- 🌙 **Dark Mode**: `useAssetTheme` automatically switches between `-dark` / `-light` asset variants
- �️ **Placeholders**: Shimmer, blur, and colour skeletons while images load
- 🗜️ **CLI Optimize**: Compress PNG/JPEG assets and warn about oversized files
- �🔍 **CLI Tools**: Generate, validate, and get statistics about your assets
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

### Dark Mode Assets — `useAssetTheme`

Automatically resolves the correct asset variant for the current system color scheme.
Follows the existing `-dark` / `-light` filename convention with **zero manual logic**.

```tsx
import { useAssetTheme } from 'react-native-smart-assets';

function Logo() {
  // Returns 'images/logo-dark' in dark mode, 'images/logo' in light mode.
  // Falls back to 'images/logo' gracefully if the -dark variant isn't registered.
  const { name } = useAssetTheme('images/logo');
  return <Asset name={name} size={100} />;
}
```

**Options:**

```tsx
const { name, colorScheme, isDarkVariant } = useAssetTheme('images/logo', {
  darkSuffix: '-dark',   // default — suffix appended in dark mode
  lightSuffix: '-light', // optional — also switch the asset in light mode
  colorScheme: 'dark',   // optional — force a scheme (e.g. Storybook)
});
```

| Return value | Type | Description |
|---|---|---|
| `name` | `string` | Resolved asset name to pass to `<Asset />` |
| `colorScheme` | `'light' \| 'dark'` | Currently active scheme |
| `isDarkVariant` | `boolean` | Whether the dark variant was found and used |
| `isLightVariant` | `boolean` | Whether the light variant was found and used |

> **Tip:** When the themed variant does not exist in the registry the hook
> silently falls back to the base name, so `<Asset />` shows its own warning.

### Asset Placeholders / Skeletons

Show a visual skeleton while an image loads. No effect on SVG assets.

```tsx
<Asset
  name="images/hero"
  size={{ width: 300, height: 200 }}
  placeholder="shimmer"        // 'shimmer' | 'blur' | 'color' | 'none'
  placeholderColor="#DDE3EC"  // optional base color (default: '#E0E0E0')
/>
```

| Placeholder | Description |
|---|---|
| `shimmer` | Animated bright-band sweep — classic skeleton loading look |
| `blur` | Soft pulsing opacity — suggests hazy content beneath |
| `color` | Static flat background — zero animation overhead |
| `none` | No placeholder (default, preserves existing behaviour) |

The placeholder disappears automatically once `onLoad` or `onError` fires.
Swapping the `name` prop resets the loading state instantly.

You can also use the standalone `<AssetPlaceholder />` component:

```tsx
import { AssetPlaceholder } from 'react-native-smart-assets';

<AssetPlaceholder type="shimmer" color="#DDE3EC" style={styles.skeleton} />
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

### Optimize Assets

Compress PNG and JPEG files directly from the CLI and warn about oversized assets:

```sh
npx react-native-smart-assets optimize
```

Example output:

```
✓ Compressed icons/logo.png:        240KB → 48KB  (-80%)
✓ Compressed images/background.jpg: 1.2MB → 310KB (-74%)
⚠  images/hero.jpg is 2.4MB after compression — recommended max is 512KB

Saved 1.4MB across 2 file(s)
```

Options:
- `--quality <0-100>`: JPEG / PNG quality (default: `80`)
- `--max-size <bytes>`: Warn when an asset exceeds this size (default: `524288` = 512 KB)
- `--dry-run`: Preview savings without writing any files
- `--assets-dir <path>`: Custom assets directory (default: `assets`)

> **Note:** Real compression requires [`sharp`](https://sharp.pixelplumbing.com/).
> Without it the command still runs in **analysis-only** mode and reports
> oversized assets, so it's always safe to run in CI:
>
> ```sh
> npm install --save-dev sharp
> # or
> yarn add --dev sharp
> ```

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

| Prop | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | — | Asset name (type-safe from generated types) |
| `size` | `number \| { width, height }` | — | Asset dimensions |
| `style` | `StyleProp<ImageStyle>` | — | Additional styles |
| `tintColor` | `string` | — | Tint color (SVG only) |
| `resizeMode` | `ImageResizeMode` | `'contain'` | Image resize mode |
| `variant` | `'default' \| 'dark' \| 'light'` | `'default'` | Asset variant |
| `placeholder` | `'shimmer' \| 'blur' \| 'color' \| 'none'` | `'none'` | Loading placeholder style |
| `placeholderColor` | `string` | `'#E0E0E0'` | Placeholder base color |
| `testID` | `string` | — | Test identifier |

#### `AssetPlaceholder`

Standalone skeleton component, useful when you need a placeholder outside of `<Asset />`.

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `type` | `'shimmer' \| 'blur' \| 'color' \| 'none'` | — | Visual style |
| `color` | `string` | `'#E0E0E0'` | Base color |
| `style` | `ViewStyle` | — | Additional styles |
| `testID` | `string` | — | Test identifier |

### Hooks

#### `useAsset(name: string)`

Returns asset information.

**Returns:**
- `asset: any` — The raw asset object
- `exists: boolean` — Whether the asset is registered
- `isSvg: boolean` — Whether the asset is an SVG

#### `useAssetTheme(baseName: string, options?)`

Resolves the correct asset variant for the current system color scheme.

**Options:**
- `colorScheme?: 'light' | 'dark'` — Override the detected scheme
- `darkSuffix?: string` — Suffix for dark variants (default: `'-dark'`)
- `lightSuffix?: string` — Suffix for light variants (default: `undefined`)

**Returns:**
- `name: string` — Resolved asset name (ready to pass to `<Asset />`)
- `colorScheme: 'light' | 'dark'` — Currently active scheme
- `isDarkVariant: boolean` — Whether the dark variant was resolved
- `isLightVariant: boolean` — Whether the light variant was resolved

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
