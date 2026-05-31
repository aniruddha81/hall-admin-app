import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Platform, Pressable, StatusBar, StyleSheet, View, type ViewProps } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useStatusBarOverride } from '@/contexts/StatusBarContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type ScreenProps = ViewProps & {
  title?: string;
  subtitle?: string;
  scroll?: boolean;
  loading?: boolean;
  withBackButton?: boolean;
  /** Full-bleed element rendered above padded content (e.g. GradientHeader). */
  header?: React.ReactNode;
  /** When true (default if header is set), status bar becomes translucent over the header. */
  immersiveHeader?: boolean;
  /** Pull the first content block up into the header curve. */
  overlap?: number;
  children: React.ReactNode;
};

export function Screen({
  title,
  subtitle,
  scroll = true,
  loading,
  withBackButton = false,
  header,
  immersiveHeader,
  overlap = 0,
  style,
  children,
  ...rest
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, resolvedTheme } = useAppTheme();
  const { setOverride } = useStatusBarOverride();
  const useImmersiveHeader = immersiveHeader ?? Boolean(header);

  /** Transparent Android status bar draws content edge-to-edge; always respect top inset. */
  const topInset =
    insets.top > 0
      ? insets.top
      : Platform.OS === 'android'
        ? (StatusBar.currentHeight ?? 0)
        : 0;
  /** Below gradient header: overlap pulls content up; pad by overlap + inset so titles clear the curve. */
  const topPadding = header ? overlap + Spacing.md : topInset + Spacing.sm;

  useFocusEffect(
    useCallback(() => {
      if (!useImmersiveHeader) return;

      // Gradient header: light mode uses dark status icons; dark mode uses light icons.
      setOverride({
        backgroundColor: 'transparent',
        style: resolvedTheme === 'dark' ? 'light' : 'dark',
        translucent: true,
      });

      return () => setOverride(null);
    }, [resolvedTheme, setOverride, useImmersiveHeader]),
  );

  const heading =
    title || withBackButton ? (
      <View style={styles.headingBlock}>
        {title ? (
          withBackButton ? (
            <View style={styles.titleRow}>
              <Pressable
                onPress={() => router.back()}
                style={[styles.backButton, { backgroundColor: colors.border }]}
                hitSlop={6}>
                <MaterialIcons name="arrow-back" size={20} color={colors.text} />
              </Pressable>
              <ThemedText type="title">{title}</ThemedText>
            </View>
          ) : (
            <ThemedText type="title">{title}</ThemedText>
          )
        ) : null}
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
    ) : null;

  const body = loading ? (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  ) : (
    children
  );

  const paddedContent = (
    <View
      style={[
        styles.padded,
        { paddingTop: topPadding, marginTop: header ? -overlap : 0 },
      ]}>
      {heading}
      {body}
    </View>
  );

  if (!scroll) {
    return (
      <ThemedView style={[styles.flex, style]} {...rest}>
        {header}
        <View style={[styles.flex, { paddingBottom: insets.bottom + Spacing.md }]}>{paddedContent}</View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.flex, style]} {...rest}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: Spacing.lg }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}>
        {header}
        {paddedContent}
      </KeyboardAwareScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  headingBlock: {
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
});
