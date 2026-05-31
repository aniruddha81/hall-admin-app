import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconBadge } from '@/components/ui/icon-badge';
import { useTheme } from '@/theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type EmptyStateProps = {
  icon?: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'success';
  style?: ViewStyle;
};

export function EmptyState({
  icon = 'inbox',
  title,
  message,
  actionLabel,
  onAction,
  variant = 'default',
  style,
}: EmptyStateProps) {
  const { colors, radius } = useTheme();
  const accent = variant === 'success' ? colors.primary : colors.textMuted;
  const borderColor = variant === 'success' ? colors.primary : colors.border;
  const bg = variant === 'success' ? `${colors.primary}0D` : colors.surfaceGlass;

  return (
    <View
      style={[
        styles.container,
        {
          borderColor,
          backgroundColor: bg,
          borderRadius: radius.xl,
        },
        style,
      ]}>
      {variant === 'success' ? (
        <IconBadge name={icon} color={accent} background="transparent" size={44} />
      ) : (
        <MaterialIcons name={icon} size={32} color={accent} />
      )}
      <ThemedText type={variant === 'success' ? 'subtitle' : 'smallBold'} style={{ color: colors.text }}>
        {title}
      </ThemedText>
      {message ? (
        <ThemedText type="small" themeColor={variant === 'success' ? 'textSecondary' : 'textMuted'} style={styles.message}>
          {message}
        </ThemedText>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} size="sm" variant="ghost" onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  message: {
    textAlign: 'center',
  },
  action: {
    marginTop: 4,
  },
});
