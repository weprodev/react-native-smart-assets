# CLI Usage Guide

## Installation

After installing the package locally or via npm, the CLI should be available.

## Using the CLI

### After Local Installation

If you've installed the package locally using one of these methods:

1. **Yarn Workspaces** (already set up in this project):
   ```bash
   yarn prepare  # Build the package first
   yarn example start
   ```

2. **npm/yarn link**:
   ```bash
   # In the package directory
   npm link
   
   # In your project
   npm link react-native-smart-assets
   ```

3. **Local file path**:
   ```json
   {
     "dependencies": {
       "react-native-smart-assets": "file:../path/to/awesome-library"
     }
   }
   ```

### Running the CLI

After installation, you can run:

```bash
# Using npx (recommended)
npx react-native-smart-assets generate

# Or directly if installed globally
react-native-smart-assets generate

# Or using the full path to the built file
node node_modules/react-native-smart-assets/lib/module/cli/index.js generate
```

## Available Commands

### Generate Asset Registry

```bash
npx react-native-smart-assets generate [options]
```

Options:
- `--assets-dir <path>`: Custom assets directory (default: `assets`)
- `--output-dir <path>`: Custom output directory (default: `assets`)
- `--format <format>`: Output format: `typescript` or `javascript` (default: `typescript`)

Example:
```bash
npx react-native-smart-assets generate --assets-dir ./src/assets --output-dir ./src/assets
```

### Validate Assets

```bash
npx react-native-smart-assets validate [options]
```

Checks for:
- Missing files
- Invalid file formats
- Duplicate asset names
- Missing variants

### Get Statistics

```bash
npx react-native-smart-assets stats [options]
```

Shows asset counts, types, and distribution.

### Watch Mode

```bash
npx react-native-smart-assets watch [options]
```

Automatically regenerates the asset registry when files change.

## Troubleshooting

### "Command not found" Error

1. **Make sure the package is built**:
   ```bash
   cd /path/to/awesome-library
   npm run prepare
   ```

2. **If using local installation**, try:
   ```bash
   # Use the full path
   node node_modules/react-native-smart-assets/lib/module/cli/index.js generate
   
   # Or reinstall
   npm install
   ```

3. **If using npx**, make sure the package is in your `node_modules`:
   ```bash
   npm install react-native-smart-assets
   # or
   yarn add react-native-smart-assets
   ```

### Permission Denied Error

Make sure the CLI file is executable:
```bash
chmod +x node_modules/react-native-smart-assets/lib/module/cli/index.js
```

### ES Module Errors

The CLI uses ES modules. Make sure you're using Node.js 14+ and that your project supports ES modules.

## Quick Start Example

```bash
# 1. Create assets directory
mkdir assets
mkdir assets/images
mkdir assets/icons

# 2. Add your assets
# (copy your images and SVG files)

# 3. Generate the registry
npx react-native-smart-assets generate

# 4. Use in your code
import { Asset } from 'react-native-smart-assets';
import { setAssetRegistry } from 'react-native-smart-assets';
import * as Assets from './assets';

setAssetRegistry(Assets.ASSETS);

<Asset name="images/logo" size={100} />
```

