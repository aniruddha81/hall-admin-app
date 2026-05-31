import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Animated, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useRef } from 'react';
import { useTheme } from '@/theme';
import { ThemedText } from '@/components/themed-text';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type ListRowProps = {
  icon: IconName;
  accent: string;
  accentTint?: string; // Optional legacy param, will fall back to dynamic 15% opacity
  title: string;
  subtitle?: string;
  trailingText?: string;
  showChevron?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export function ListRow({
  icon,
  accent,
  accentTint,
  title,
  subtitle,
  trailingText,
  showChevron,
  onPress,
  style,
}: ListRowProps) {
  const { colors, spacing, radius } = useTheme();

  // Premium press scale animation
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  // Determine standard 15% opacity tint for icon container
  const iconBg = accentTint || `${accent}26`; // 15% opacity hex approximation or explicit tint

  const body = (
    <Animated.View
      style={[
        styles.row,
        {
          transform: [{ scale: scaleAnim }],
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        style,
      ]}>
      {/* 40px rounded icon container */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: iconBg,
            borderRadius: radius.sm + 2, // curved premium shape
          },
        ]}>
        <MaterialIcons name={icon} size={20} color={accent} />
      </View>

      <View style={styles.texts}>
        <ThemedText type="smallBold" numberOfLines={1} style={{ color: colors.text }}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textMuted" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>

      {trailingText ? (
        <ThemedText type="smallBold" style={[styles.trailing, { color: accent }]}>
          {trailingText}
        </ThemedText>
      ) : null}

      {showChevron ? (
        <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} style={styles.chevron} />
      ) : null}
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
        {body}
      </Pressable>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16, // 16px vertical padding
    paddingHorizontal: 8,
    gap: 12,
  },
  iconContainer: {
    width: 40, // 40px size
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  trailing: {
    fontVariant: ['tabular-nums'],
  },
  chevron: {
    marginLeft: 4,
  },
});
