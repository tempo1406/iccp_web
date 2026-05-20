import type { NotificationDto } from '@/services/notifications/types';

export const NOTIFICATION_FEED_SCOPES = ['all', 'activity'] as const;
export type NotificationFeedScope = (typeof NOTIFICATION_FEED_SCOPES)[number];

export const NOTIFICATION_ITEM_FEED_SCOPES = ['activity', 'all_only'] as const;
export type NotificationItemFeedScope = (typeof NOTIFICATION_ITEM_FEED_SCOPES)[number];

const ACTIVITY_EVENT_TYPES = new Set([
  'chat.mention',
  'chat.thread.reply',
  'chat.reaction',
  'chat.invitation',
  'chat.invitation.updated',
]);

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function normalizeNotificationFeedScope(value: unknown): NotificationFeedScope | null {
  const normalized = toNonEmptyString(value)?.toLowerCase();
  if (normalized === 'all' || normalized === 'activity') {
    return normalized;
  }
  return null;
}

function normalizeNotificationItemFeedScope(value: unknown): NotificationItemFeedScope | null {
  const normalized = toNonEmptyString(value)?.toLowerCase();
  if (normalized === 'activity' || normalized === 'all_only') {
    return normalized;
  }
  return null;
}

function normalizeNotificationEventType(data: Record<string, unknown> | undefined): string | null {
  return toNonEmptyString(data?.eventType)?.toLowerCase() ?? null;
}

export function resolveNotificationItemFeedScope(
  notification: Pick<NotificationDto, 'data'>,
): NotificationItemFeedScope {
  const normalizedFeedScope = normalizeNotificationItemFeedScope(notification.data?.feedScope);
  if (normalizedFeedScope) {
    return normalizedFeedScope;
  }

  const normalizedEventType = normalizeNotificationEventType(notification.data);
  if (normalizedEventType && ACTIVITY_EVENT_TYPES.has(normalizedEventType)) {
    return 'activity';
  }

  return 'all_only';
}

export function isActivityFeedNotification(notification: Pick<NotificationDto, 'data'>): boolean {
  return resolveNotificationItemFeedScope(notification) === 'activity';
}

