import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StatusBar, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

type GradientHeaderProps = {
  children: React.ReactNode;
  /** extra bottom padding so overlapping content can pull up into the curve */
  extraBottom?: number;
  style?: ViewStyle;
};

/** Full-bleed premium blue gradient banner that sits under status bar with a modern curved bottom. */
export function GradientHeader({ children, extraBottom = 0, style }: GradientHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  
  const topInset =
    insets.top > 0
      ? insets.top
      : Platform.OS === 'android'
        ? (StatusBar.currentHeight ?? 0)
        : 0;

  const gradientColors = [colors.secondary, colors.primary, colors.tertiary] as const;

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.header,
        {
          paddingTop: topInset + spacing.md,
          paddingBottom: spacing.lg + extraBottom,
          borderBottomLeftRadius: radius.xxl,
          borderBottomRightRadius: radius.xxl,
        },
        style,
      ]}>
      <View style={styles.inner}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  inner: {
    gap: 16,
  },
});
