import { Platform, type ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

// Legacy compatibility: re-export colors under the legacy structure
export const Colors = colors;
export type AppColors = typeof Colors[ResolvedTheme];

export const Fonts = typography.fonts;

// Map our custom spacing naming back to legacy xs-xxl
export const Spacing = {
  xs: spacing.sm,    // 8
  sm: spacing.md,    // 12
  md: spacing.lg,    // 16
  lg: spacing.xxl,   // 24
  xl: spacing.xxxl,  // 32
  xxl: spacing.massive, // 48
} as const;

export const Radius = {
  sm: radius.sm,
  md: radius.md,
  lg: radius.xl, // Premium 16px radius
  xl: radius.xxl, // 24px radius
  full: radius.full,
} as const;

export function gradientStops(colors: AppColors): [string, string, string] {
  return [colors.primary, colors.secondary, colors.tertiary];
}

export const GradientAxis = {
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
} as const;

/** Raised card / tile style conforming to the premium design specification */
export function elevatedCardStyle(colors: AppColors, theme: ResolvedTheme): ViewStyle {
  return {
    backgroundColor: theme === 'dark' ? colors.surface : colors.backgroundSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadows[theme],
  } as ViewStyle;
}

/** Filled button style matching premium primary styles */
export function filledButtonStyle(
  colors: AppColors,
  theme: ResolvedTheme,
  pressed: boolean,
): ViewStyle {
  const bg = theme === 'dark' ? colors.primary : colors.primary;
  return {
    backgroundColor: bg,
    opacity: pressed ? 0.9 : 1,
  };
}

/** Outlined or secondary control surfaces */
export function outlinedControlStyle(colors: AppColors, theme: ResolvedTheme): ViewStyle {
  return {
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.border,
    borderWidth: 1,
  };
}
export { spacing, radius } from '@/theme/spacing';
export { typography } from '@/theme/spacing';
export { shadows } from '@/theme/shadows';
