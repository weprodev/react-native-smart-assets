export const AssetSizes = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
  small: 16,
  medium: 24,
  large: 32,
  xlarge: 48,
} as const;

export type AssetSizePreset = keyof typeof AssetSizes;

export function getSizePreset(preset: AssetSizePreset): number {
  return AssetSizes[preset];
}

export function getResponsiveSize(baseSize: number, scale: number = 1): number {
  return Math.round(baseSize * scale);
}
