import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { ThemedText } from '@/components/themed-text';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
};

export function Chip({ label, selected, onPress, color }: ChipProps) {
  const { colors, radius, resolvedTheme } = useTheme();
  
  // Use primary accent or custom color
  const accentColor = color ?? colors.primary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected
            ? (resolvedTheme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.12)')
            : colors.surfaceGlass,
          borderColor: selected ? accentColor : colors.border,
          borderRadius: radius.full,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      <ThemedText
        type="smallBold"
        style={{
          color: selected ? accentColor : colors.textSecondary,
        }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 38,
    paddingHorizontal: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
