# Testing the Package Locally

There are several ways to test this package in your project without publishing to npm:

## Method 1: Using Yarn Workspaces (Recommended for this project)

Since this project uses Yarn workspaces, the `example` folder is already set up to use the local package:

```bash
# From the root directory
yarn install
yarn example start
```

The example app will automatically use the local version of the package.

## Method 2: Using npm/yarn link

### Step 1: Create a link in the package directory
```bash
cd /Users/amanjbohloulzadeh/projects/my-packages/awesome-library
npm link
# or
yarn link
```

### Step 2: Link in your test project
```bash
cd /path/to/your/test-project
npm link react-native-smart-assets
# or
yarn link react-native-smart-assets
```

### Step 3: Unlink when done
```bash
# In your test project
npm unlink react-native-smart-assets
# or
yarn unlink react-native-smart-assets

# In the package directory
npm unlink
# or
yarn unlink
```

## Method 3: Using Local File Path

In your test project's `package.json`, add:

```json
{
  "dependencies": {
    "react-native-smart-assets": "file:../path/to/awesome-library"
  }
}
```

Then run:
```bash
npm install
# or
yarn install
```

**Note:** Use relative paths from your test project to the package directory.

## Method 4: Using npm pack (For Testing Distribution)

### Step 1: Create a tarball
```bash
cd /Users/amanjbohloulzadeh/projects/my-packages/awesome-library
npm pack
```

This creates a file like `react-native-smart-assets-0.1.0.tgz`

### Step 2: Install in your test project
```bash
cd /path/to/your/test-project
npm install /path/to/awesome-library/react-native-smart-assets-0.1.0.tgz
# or
yarn add /path/to/awesome-library/react-native-smart-assets-0.1.0.tgz
```

## Method 5: Using Yarn Workspaces (For Monorepo)

If your test project is in a monorepo, add to the root `package.json`:

```json
{
  "workspaces": [
    "packages/*",
    "../awesome-library"
  ]
}
```

## Important Notes

1. **Rebuild after changes**: If you make changes to the package, you may need to rebuild:
   ```bash
   npm run prepare
   # or
   yarn prepare
   ```

2. **Metro bundler cache**: If using React Native, clear Metro cache:
   ```bash
   npx react-native start --reset-cache
   # or
   yarn start --reset-cache
   ```

3. **TypeScript**: If your test project uses TypeScript, it should automatically pick up types from the local package.

4. **Example app**: The included `example` folder is already configured to use the local package via workspaces.

## Quick Test in Example App

```bash
# 1. Build the package
yarn prepare

# 2. Start the example app
yarn example start

# 3. Make changes to the package
# 4. Rebuild
yarn prepare

# 5. Reload the app (shake device or press 'r' in Metro)
```

