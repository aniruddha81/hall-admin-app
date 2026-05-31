import { apiRequest } from '@/lib/api';
import type { NotificationAudience, NotificationItem, NotificationListData } from '@/lib/types';

export async function getMyNotifications(limit = 20) {
  const { data } = await apiRequest<NotificationListData>('/notifications/my', {
    params: { limit },
  });
  return data;
}

export async function markNotificationAsRead(notificationId: string) {
  const id = encodeURIComponent(notificationId);
  const { data } = await apiRequest<{ notificationId: string; isRead: boolean }>(
    `/notifications/${id}/read`,
    { method: 'PATCH', body: {} },
  );
  return data;
}

export async function createNotification(body: {
  title: string;
  message: string;
  targetAudience: NotificationAudience;
}) {
  const { data } = await apiRequest<{ notification: NotificationItem }>('/notifications', {
    method: 'POST',
    body,
  });
  return data;
}
