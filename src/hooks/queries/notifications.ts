import { useQueryClient } from '@tanstack/react-query';

import { useFocusQuery } from '@/hooks/use-focus-query';
import { queryKeys } from '@/lib/query-keys';
import { getMyNotifications } from '@/lib/services/notification.service';

const NOTIFICATION_LIMIT = 25;

export function useAdminNotificationsQuery() {
  return useFocusQuery(queryKeys.notifications.list(NOTIFICATION_LIMIT), async ({ signal }) => {
    const res = await getMyNotifications(NOTIFICATION_LIMIT, { signal });
    return {
      notifications: res.data.notifications ?? [],
      unreadCount: res.data.unreadCount ?? 0,
    };
  });
}

export function useInvalidateNotificationQueries() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: queryKeys.notifications.all });
}
