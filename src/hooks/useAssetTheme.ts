import { useColorScheme } from 'react-native';
import { hasAsset } from '../utils/assetRegistry';

export type ColorScheme = 'light' | 'dark';

export interface UseAssetThemeOptions {
  /**
   * Override the detected color scheme. Useful for testing or when you want
   * to force a specific theme regardless of the system setting.
   */
  colorScheme?: ColorScheme;
  /**
   * The suffix used for dark mode variants.
   * @default '-dark'
   */
  darkSuffix?: string;
  /**
   * The suffix used for light mode variants.
   * When set, the light variant (e.g. `name-light`) will be used for light mode
   * instead of the base name.
   * @default undefined (base name is used for light mode)
   */
  lightSuffix?: string;
}

export interface UseAssetThemeResult {
  /** The resolved asset name for the current color scheme. */
  name: string;
  /** The currently active color scheme. */
  colorScheme: ColorScheme;
  /** Whether the dark mode variant was found and is being used. */
  isDarkVariant: boolean;
  /** Whether the light mode variant was found and is being used. */
  isLightVariant: boolean;
}

/**
 * A hook that listens to the system color scheme and automatically resolves
 * the appropriate asset variant for dark or light mode.
 *
 * **Convention:**
 * - Dark mode  → prefers `{name}-dark` over `{name}`
 * - Light mode → prefers `{name}-light` over `{name}` (if `lightSuffix` is set),
 *                otherwise falls back to the base `{name}`
 *
 * If the themed variant does not exist in the registry, the hook gracefully
 * falls back to the base asset name so the `<Asset />` component can show its
 * own "not found" warning.
 *
 * @example
 * ```tsx
 * // Basic usage — automatic dark/light switching
 * const logo = useAssetTheme('images/logo');
 * <Asset name={logo} size={100} />
 *
 * // With explicit light suffix
 * const { name, colorScheme } = useAssetTheme('images/logo', { lightSuffix: '-light' });
 *
 * // Force a specific theme (e.g. for Storybook / testing)
 * const icon = useAssetTheme('icons/home', { colorScheme: 'dark' });
 * ```
 */
export function useAssetTheme(
  baseName: string,
  options: UseAssetThemeOptions = {}
): UseAssetThemeResult {
  const systemColorScheme = useColorScheme();
  const {
    colorScheme: overrideScheme,
    darkSuffix = '-dark',
    lightSuffix,
  } = options;

  const activeScheme: ColorScheme =
    overrideScheme ?? (systemColorScheme === 'dark' ? 'dark' : 'light');

  if (activeScheme === 'dark') {
    const darkName = `${baseName}${darkSuffix}`;
    const hasDark = hasAsset(darkName);
    return {
      name: hasDark ? darkName : baseName,
      colorScheme: 'dark',
      isDarkVariant: hasDark,
      isLightVariant: false,
    };
  }

  // Light mode
  if (lightSuffix) {
    const lightName = `${baseName}${lightSuffix}`;
    const hasLight = hasAsset(lightName);
    return {
      name: hasLight ? lightName : baseName,
      colorScheme: 'light',
      isDarkVariant: false,
      isLightVariant: hasLight,
    };
  }

  return {
    name: baseName,
    colorScheme: 'light',
    isDarkVariant: false,
    isLightVariant: false,
  };
}
