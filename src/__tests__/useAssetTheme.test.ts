import { renderHook } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { useAssetTheme } from '../hooks/useAssetTheme';
import { setAssetRegistry } from '../utils/assetRegistry';

describe('useAssetTheme', () => {
  let useColorSchemeSpy: jest.SpyInstance;

  beforeEach(() => {
    useColorSchemeSpy = jest
      .spyOn(ReactNative, 'useColorScheme')
      .mockReturnValue('light');

    setAssetRegistry({
      'images/logo': { uri: 'logo.png' },
      'images/logo-dark': { uri: 'logo-dark.png' },
      'images/logo-light': { uri: 'logo-light.png' },
      'icons/home': { uri: 'home.png' },
      // icons/home-dark and icons/home-light intentionally absent → fallback tests
    });
  });

  afterEach(() => {
    useColorSchemeSpy.mockRestore();
    setAssetRegistry({});
  });

  // ─── Light mode ──────────────────────────────────────────────────────────────

  it('returns the base name on light mode when no lightSuffix is set', () => {
    useColorSchemeSpy.mockReturnValue('light');
    const { result } = renderHook(() => useAssetTheme('images/logo'));

    expect(result.current.name).toBe('images/logo');
    expect(result.current.colorScheme).toBe('light');
    expect(result.current.isDarkVariant).toBe(false);
    expect(result.current.isLightVariant).toBe(false);
  });

  it('returns the light variant when lightSuffix is set and variant exists', () => {
    useColorSchemeSpy.mockReturnValue('light');
    const { result } = renderHook(() =>
      useAssetTheme('images/logo', { lightSuffix: '-light' })
    );

    expect(result.current.name).toBe('images/logo-light');
    expect(result.current.colorScheme).toBe('light');
    expect(result.current.isLightVariant).toBe(true);
    expect(result.current.isDarkVariant).toBe(false);
  });

  it('falls back to base name when lightSuffix is set but variant does not exist', () => {
    useColorSchemeSpy.mockReturnValue('light');
    const { result } = renderHook(() =>
      useAssetTheme('icons/home', { lightSuffix: '-light' })
    );

    // icons/home-light is not in the registry
    expect(result.current.name).toBe('icons/home');
    expect(result.current.colorScheme).toBe('light');
    expect(result.current.isLightVariant).toBe(false);
  });

  // ─── Dark mode ───────────────────────────────────────────────────────────────

  it('returns the dark variant when system is dark and -dark asset exists', () => {
    useColorSchemeSpy.mockReturnValue('dark');
    const { result } = renderHook(() => useAssetTheme('images/logo'));

    expect(result.current.name).toBe('images/logo-dark');
    expect(result.current.colorScheme).toBe('dark');
    expect(result.current.isDarkVariant).toBe(true);
    expect(result.current.isLightVariant).toBe(false);
  });

  it('falls back to base name when dark mode but -dark asset does not exist', () => {
    useColorSchemeSpy.mockReturnValue('dark');
    const { result } = renderHook(() => useAssetTheme('icons/home'));

    // icons/home-dark is not in the registry
    expect(result.current.name).toBe('icons/home');
    expect(result.current.colorScheme).toBe('dark');
    expect(result.current.isDarkVariant).toBe(false);
  });

  // ─── Custom suffix ───────────────────────────────────────────────────────────

  it('supports a custom darkSuffix', () => {
    setAssetRegistry({
      'images/logo': { uri: 'logo.png' },
      'images/logo_dark': { uri: 'logo_dark.png' },
    });
    useColorSchemeSpy.mockReturnValue('dark');
    const { result } = renderHook(() =>
      useAssetTheme('images/logo', { darkSuffix: '_dark' })
    );

    expect(result.current.name).toBe('images/logo_dark');
    expect(result.current.isDarkVariant).toBe(true);
  });

  // ─── colorScheme override ─────────────────────────────────────────────────

  it('respects colorScheme override — forces dark regardless of system', () => {
    useColorSchemeSpy.mockReturnValue('light'); // system is light
    const { result } = renderHook(() =>
      useAssetTheme('images/logo', { colorScheme: 'dark' })
    );

    expect(result.current.name).toBe('images/logo-dark');
    expect(result.current.colorScheme).toBe('dark');
    expect(result.current.isDarkVariant).toBe(true);
  });

  it('respects colorScheme override — forces light regardless of system', () => {
    useColorSchemeSpy.mockReturnValue('dark'); // system is dark
    const { result } = renderHook(() =>
      useAssetTheme('images/logo', { colorScheme: 'light' })
    );

    expect(result.current.name).toBe('images/logo');
    expect(result.current.colorScheme).toBe('light');
    expect(result.current.isDarkVariant).toBe(false);
  });

  // ─── Null / unknown color scheme ─────────────────────────────────────────────

  it('defaults to light mode when useColorScheme returns null', () => {
    useColorSchemeSpy.mockReturnValue(null);
    const { result } = renderHook(() => useAssetTheme('images/logo'));

    expect(result.current.name).toBe('images/logo');
    expect(result.current.colorScheme).toBe('light');
    expect(result.current.isDarkVariant).toBe(false);
  });
});
