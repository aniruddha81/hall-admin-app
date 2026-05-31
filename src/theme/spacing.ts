import { Platform } from 'react-native';

export const fonts = {
  sans: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
};

export const typography = {
  fonts,
  sizes: {
    xs: 11,
    sm: 14,
    base: 16,
    lg: 20,
    xl: 28,
  },
  lineHeights: {
    xs: 14,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 34,
  },
  letterSpacings: {
    tight: -0.5,
    normal: 0,
    wide: 1.5,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
  giant: 64,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 999,
} as const;
