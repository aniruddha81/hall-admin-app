import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRef } from 'react';
import { useTheme } from '@/theme';

type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  size?: 'md' | 'sm';
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
  textStyle,
  ...rest
}: ButtonProps) {
  const { colors, radius } = useTheme();
  const isDisabled = disabled || loading;

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const sizeStyle = size === 'sm' ? styles.sm : styles.md;
  const fontSize = size === 'sm' ? 13 : 15;

  let bg = 'transparent';
  let borderCol = 'transparent';
  let borderWidth = 0;
  let textColor: string = colors.text;

  if (variant === 'primary') {
    bg = colors.primary;
    textColor = '#FFFFFF';
  } else if (variant === 'secondary') {
    bg = 'transparent';
    borderCol = colors.borderAccent;
    borderWidth = 1;
    textColor = colors.primary;
  } else if (variant === 'outline') {
    bg = 'transparent';
    borderCol = colors.border;
    borderWidth = 1.5;
    textColor = colors.text;
  } else if (variant === 'destructive') {
    bg = colors.error;
    textColor = '#FFFFFF';
  } else if (variant === 'ghost') {
    bg = 'transparent';
    textColor = colors.primary;
  }

  const inner = loading ? (
    <ActivityIndicator size="small" color={textColor} />
  ) : (
    <Text
      style={[
        styles.label,
        {
          color: textColor,
          fontSize,
          fontWeight: '600',
        },
        textStyle,
      ]}>
      {title}
    </Text>
  );

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: colors.ripple }}
      {...rest}>
      <Animated.View
        style={[
          styles.base,
          sizeStyle,
          {
            backgroundColor: bg,
            borderColor: borderCol,
            borderWidth: borderWidth,
            borderRadius: radius.lg,
            transform: [{ scale: scaleAnim }],
            opacity: isDisabled ? 0.5 : 1,
          },
          style,
        ]}>
        {inner}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  md: { height: 50 },
  sm: { height: 40, paddingHorizontal: 12 },
  label: {
    letterSpacing: -0.2,
  },
});
