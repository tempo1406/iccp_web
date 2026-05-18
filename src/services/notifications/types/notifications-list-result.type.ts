import type { NotificationDto } from './notification.dto';

export interface NotificationsUnreadByScope {
  all: number;
  activity: number;
}

export interface NotificationsListResult {
  data: NotificationDto[];
  total: number;
  unreadCount: number;
  unreadByScope?: NotificationsUnreadByScope;
}
