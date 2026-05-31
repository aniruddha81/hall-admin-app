import { Platform, StyleSheet, Text, type TextProps } from 'react-native';
import { useTheme } from '@/theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'code' | 'overline' | 'accent';
  themeColor?: 'text' | 'textSecondary' | 'textMuted' | 'primary' | 'error' | 'success' | 'warning';
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const { colors, typography } = useTheme();

  // Resolve default theme colors per typography rules:
  // - Headings: primary text color
  // - Body: secondary text color
  // - Overline: muted color
  // - Accent/Link: primary accent color
  let resolvedColor: string = colors.text;
  if (themeColor) {
    resolvedColor = colors[themeColor];
  } else {
    if (type === 'title' || type === 'subtitle') {
      resolvedColor = colors.text;
    } else if (type === 'default' || type === 'small') {
      resolvedColor = colors.textSecondary;
    } else if (type === 'overline') {
      resolvedColor = colors.textMuted;
    } else if (type === 'link' || type === 'accent') {
      resolvedColor = colors.primary;
    }
  }

  return (
    <Text
      style={[
        styles.base,
        { color: resolvedColor, fontFamily: typography.fonts.sans },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'accent' && styles.accent,
        type === 'code' && [styles.code, { fontFamily: typography.fonts.mono }],
        type === 'overline' && styles.overline,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontVariant: ['tabular-nums'],
  },
  default: {
    fontSize: 15,
    lineHeight: 24, // Line-height 1.6
    fontWeight: '400',
  },
  small: {
    fontSize: 13,
    lineHeight: 20.8, // Line-height 1.6
    fontWeight: '400',
  },
  smallBold: {
    fontSize: 13,
    lineHeight: 20.8,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  link: {
    fontSize: 15,
    fontWeight: '600',
  },
  accent: {
    fontSize: 15,
    fontWeight: '600',
  },
  code: {
    fontSize: 12,
    lineHeight: 18,
  },
  overline: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
});
