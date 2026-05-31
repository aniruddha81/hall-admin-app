import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/theme';

export type ThemedViewProps = ViewProps & {
  variant?: 'background' | 'backgroundSecondary' | 'surface';
};

export function ThemedView({ style, variant = 'background', ...otherProps }: ThemedViewProps) {
  const { colors } = useTheme();
  
  // Resolve background colors
  const resolvedBg = variant === 'backgroundSecondary'
    ? colors.backgroundSecondary
    : variant === 'surface'
      ? colors.surface
      : colors.background;

  return <View style={[{ backgroundColor: resolvedBg }, style]} {...otherProps} />;
}
