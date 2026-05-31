import { Animated, Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import { useRef } from 'react';
import { useTheme } from '@/theme';
import { ThemedText } from '@/components/themed-text';

type CardProps = Omit<ViewProps, 'style'> & {
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  variant?: 'plain' | 'tinted' | 'glass';
  tint?: string;
  style?: any;
  children?: React.ReactNode;
};

export function Card({
  title,
  subtitle,
  onPress,
  variant = 'plain',
  tint,
  style,
  children,
  ...rest
}: CardProps) {
  const { colors, radius, shadows, resolvedTheme } = useTheme();

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  let bg: string = colors.surface;
  let borderCol: string = colors.border;
  let borderWidth = 1;
  let topHighlight = 'transparent';

  if (variant === 'tinted') {
    bg =
      tint ||
      (resolvedTheme === 'dark' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(37, 99, 235, 0.05)');
    borderWidth = 0;
  } else if (variant === 'glass') {
    bg = colors.surfaceGlass;
    borderCol = colors.border;
    borderWidth = 1;
  } else {
    bg = resolvedTheme === 'dark' ? colors.surface : colors.backgroundSecondary;
    borderCol = colors.border;
    topHighlight =
      resolvedTheme === 'dark' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(37, 99, 235, 0.04)';
  }

  const content = (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderColor: borderCol,
          borderWidth,
          borderRadius: radius.xl,
          transform: [{ scale: scaleAnim }],
          ...shadows,
        },
        style,
      ]}
      {...rest}>
      {topHighlight !== 'transparent' ? (
        <View style={[styles.highlight, { backgroundColor: topHighlight }]} />
      ) : null}

      {title ? (
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>
      ) : null}
      {subtitle ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      ) : null}

      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: colors.ripple }}
        accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
    gap: 8,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  title: {
    marginBottom: 2,
  },
  subtitle: {
    marginTop: -4,
    marginBottom: 4,
  },
});
