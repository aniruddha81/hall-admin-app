import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { GradientHeader } from '@/components/gradient-header';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeader } from '@/components/ui/section-header';
import { useTheme } from '@/theme';
import { useScreenLoad } from '@/hooks/use-screen-load';
import { getApiErrorMessage } from '@/lib/api';
import { createNotification, getMyNotifications, markNotificationAsRead } from '@/lib/services/notification.service';
import { NOTIFICATION_AUDIENCES, type NotificationAudience, type NotificationItem } from '@/lib/types';

export default function NotificationsScreen() {
  const { colors, spacing } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<NotificationAudience>('STUDENT');
  const [sending, setSending] = useState(false);

  const { loading, error, setError, reload } = useScreenLoad(
    useCallback(async () => {
      const res = await getMyNotifications(25);
      setNotifications(res.data.notifications ?? []);
      setUnreadCount(res.data.unreadCount ?? 0);
    }, []),
    [],
  );

  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Missing fields', 'Title and message are required.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      await createNotification({ title: title.trim(), message: message.trim(), targetAudience: audience });
      setTitle('');
      setMessage('');
      Alert.alert('Sent', 'Notification broadcast successfully.');
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const markRead = async (id: string) => {
    if (!id?.trim()) {
      Alert.alert('Error', 'Invalid notification id.');
      return;
    }
    try {
      await markNotificationAsRead(id);
      await reload();
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    }
  };

  const openNotification = (n: NotificationItem) => {
    router.push({
      pathname: '/(app)/notification/[id]',
      params: {
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        isRead: String(n.isRead),
        targetAudience: n.targetAudience,
        createdByName: n.createdByName ?? '',
      },
    });
  };

  const header = (
    <GradientHeader extraBottom={32}>
      <ThemedText type="overline" style={styles.headerOverline}>
        Broadcast Center
      </ThemedText>
      <View style={styles.headerRow}>
        <ThemedText type="title" style={styles.headerTitle}>
          Alerts
        </ThemedText>
        {unreadCount > 0 ? (
          <View style={styles.unreadBadge}>
            <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 12 }}>
              {unreadCount} unread
            </ThemedText>
          </View>
        ) : null}
      </View>
      <ThemedText type="small" style={styles.headerCaption}>
        Send announcements to students and staff
      </ThemedText>
    </GradientHeader>
  );

  return (
    <Screen header={header} overlap={24} loading={loading}>
      {error ? (
        <View style={[styles.errorBox, { backgroundColor: `${colors.error}14`, borderColor: `${colors.error}30` }]}>
          <ThemedText type="small" style={{ color: colors.error }}>{error}</ThemedText>
        </View>
      ) : null}

      <SectionHeader title="Create Notification" caption="Compose and broadcast a new alert" />
      <Card variant="tinted" style={{ paddingVertical: 16 }}>
        <View style={{ gap: spacing.md }}>
          <Input label="Title" icon="title" value={title} onChangeText={setTitle} placeholder="Announcement title" />
          <Input label="Message" icon="message" value={message} onChangeText={setMessage} placeholder="Write your message" multiline />
          <ThemedText type="overline">Audience</ThemedText>
          <View style={styles.chipRow}>
            {NOTIFICATION_AUDIENCES.map((a) => (
              <Chip key={a} label={a} selected={audience === a} onPress={() => setAudience(a)} />
            ))}
          </View>
          <Button title="Send notification" loading={sending} onPress={sendNotification} />
        </View>
      </Card>

      <SectionHeader title="Inbox" caption={unreadCount ? `${unreadCount} unread message${unreadCount === 1 ? '' : 's'}` : 'Recent notifications'} />
      {notifications.length === 0 ? (
        <EmptyState
          icon="campaign"
          title="No Notifications Yet"
          message="Your inbox is empty. Create a broadcast above to reach students and staff."
        />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {notifications.map((n) => (
            <Card key={n.id} style={{ padding: 0 }}>
              <ListRow
                icon={n.isRead ? 'mark-email-read' : 'mark-email-unread'}
                accent={n.isRead ? colors.textMuted : colors.primary}
                title={n.title}
                subtitle={n.message}
                trailingText={new Date(n.createdAt).toLocaleDateString('en-GB')}
                showChevron
                onPress={() => openNotification(n)}
              />
              {!n.isRead ? (
                <Button
                  title="Mark read"
                  size="sm"
                  variant="ghost"
                  onPress={() => markRead(n.id)}
                  style={{ alignSelf: 'flex-start', marginLeft: 12, marginBottom: 8 }}
                />
              ) : null}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerOverline: { color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  headerTitle: { color: '#FFFFFF', marginTop: -2 },
  headerCaption: { color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  unreadBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  errorBox: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
});
