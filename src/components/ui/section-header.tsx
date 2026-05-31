import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';
import { ThemedText } from '@/components/themed-text';

type SectionHeaderProps = {
  title: string;
  caption?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function SectionHeader({ title, caption, actionLabel, onActionPress }: SectionHeaderProps) {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.row, { marginTop: spacing.xs }]}>
      <View style={styles.titleWrap}>
        {/* Left vertical accent indicator */}
        <View style={[styles.accent, { backgroundColor: colors.primary }]} />
        <View style={styles.textContainer}>
          <ThemedText type="subtitle">{title}</ThemedText>
          {caption ? (
            <ThemedText type="small" themeColor="textMuted">
              {caption}
            </ThemedText>
          ) : null}
        </View>
      </View>
      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress} hitSlop={12} accessibilityRole="button">
          <ThemedText type="smallBold" style={{ color: colors.primary }}>
            {actionLabel}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  accent: {
    width: 3.5,
    height: 18,
    borderRadius: 99,
  },
  textContainer: {
    flex: 1,
  },
});
