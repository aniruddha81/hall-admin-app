import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/icon-badge';
import { useInvalidateNotificationQueries } from '@/hooks/queries/notifications';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useTheme } from '@/theme';
import { getApiErrorMessage } from '@/lib/api';
import { markNotificationAsRead } from '@/lib/services/notification.service';
import type { NotificationAudience } from '@/lib/types';

function formatDateTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationDetailScreen() {
  const { colors, spacing, radius } = useTheme();
  const params = useLocalSearchParams<{
    id: string;
    title?: string;
    message?: string;
    createdAt?: string;
    isRead?: string;
    targetAudience?: string;
    createdByName?: string;
  }>();

  const notificationId = params.id ?? '';
  const [isRead, setIsRead] = useState(params.isRead === 'true');
  const [marking, setMarking] = useState(false);

  const title = params.title ?? 'Notification';
  const message = params.message ?? '';
  const audience = (params.targetAudience ?? 'ADMIN') as NotificationAudience;
  const createdByName = params.createdByName || 'Hall Admin';

  const statusLabel = useMemo(() => (isRead ? 'Read' : 'Unread'), [isRead]);
  const invalidateNotifications = useInvalidateNotificationQueries();
  const { onRefresh, refreshing } = usePullToRefresh(invalidateNotifications);

  const markRead = async () => {
    if (!notificationId || isRead) return;
    setMarking(true);
    try {
      await markNotificationAsRead(notificationId);
      setIsRead(true);
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    } finally {
      setMarking(false);
    }
  };

  return (
    <Screen title="Notification" withBackButton onRefresh={onRefresh} refreshing={refreshing}>
      <Card
        style={[
          styles.hero,
          {
            backgroundColor: isRead ? colors.surface : `${colors.primary}12`,
            borderColor: isRead ? colors.border : colors.borderAccent,
          },
        ]}>
        <View style={styles.heroTop}>
          <IconBadge
            name={isRead ? 'mark-email-read' : 'mark-email-unread'}
            color={isRead ? colors.textMuted : colors.primary}
            background={`${isRead ? colors.textMuted : colors.primary}20`}
            size={28}
          />
          <View style={[styles.statusPill, { backgroundColor: `${isRead ? colors.textMuted : colors.primary}20`, borderRadius: radius.full }]}>
            <ThemedText type="smallBold" style={{ color: isRead ? colors.textMuted : colors.primary }}>
              {statusLabel}
            </ThemedText>
          </View>
        </View>
        <ThemedText type="title" style={{ color: colors.text }}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textMuted">
          {formatDateTime(params.createdAt)}
        </ThemedText>
      </Card>

      <View style={[styles.metaRow, { gap: spacing.sm }]}>
        <View style={[styles.metaChip, { borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface }]}>
          <MaterialIcons name="campaign" size={16} color={colors.primary} />
          <ThemedText type="smallBold">{audience}</ThemedText>
        </View>
        <View style={[styles.metaChip, { borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface }]}>
          <MaterialIcons name="person" size={16} color={colors.secondary} />
          <ThemedText type="smallBold" numberOfLines={1} style={{ flex: 1 }}>
            {createdByName}
          </ThemedText>
        </View>
      </View>

      <Card title="Message">
        <ThemedText type="default" style={[styles.message, { color: colors.text }]}>
          {message || 'No message content.'}
        </ThemedText>
      </Card>

      <View style={{ gap: spacing.sm }}>
        {!isRead ? (
          <Button title="Mark as read" loading={marking} onPress={markRead} />
        ) : null}
        <Button title="Back to inbox" variant="outline" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 10,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
  },
  metaChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  message: {
    lineHeight: 24,
  },
});
