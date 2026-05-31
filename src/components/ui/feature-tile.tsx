import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useRef } from 'react';
import { useTheme } from '@/theme';
import { ThemedText } from '@/components/themed-text';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type FeatureTileProps = {
  icon: IconName;
  label: string;
  caption?: string;
  accent: string;
  accentTint: string;
  onPress: () => void;
};

export function FeatureTile({ icon, label, caption, accent, accentTint, onPress }: FeatureTileProps) {
  const { colors, radius } = useTheme();

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  const bg = colors.surface;
  const borderCol = colors.border;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: colors.ripple }}
      style={styles.pressable}
      accessibilityRole="button">
      <Animated.View
        style={[
          styles.tile,
          {
            backgroundColor: bg,
            borderColor: borderCol,
            borderRadius: radius.xl,
            transform: [{ scale: scaleAnim }],
          },
        ]}>
        <View style={[styles.iconWrap, { backgroundColor: accentTint, borderRadius: radius.sm + 2 }]}>
          <MaterialIcons name={icon} size={22} color={accent} />
        </View>
        <ThemedText type="smallBold" numberOfLines={1} style={{ color: colors.text }}>
          {label}
        </ThemedText>
        {caption ? (
          <ThemedText type="small" themeColor="textMuted" numberOfLines={1}>
            {caption}
          </ThemedText>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flexBasis: '46%',
    flexGrow: 1,
  },
  tile: {
    padding: 16,
    gap: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
