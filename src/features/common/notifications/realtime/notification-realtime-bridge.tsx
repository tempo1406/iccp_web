'use client';

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  pushNotification,
  selectNotificationItems,
} from '@/store/slices/notification/notification.slice';
import type { NotificationRealtimePayload, CampaignProgressPayload } from '@/lib/socket/events';
import { useSocketEvent } from '@/providers/socket-provider';
import { SOCKET_NAMESPACES, SOCKET_EVENTS } from '@/common/constant/socket.constant';
import { toast } from '@/lib/toast';

const MY_INBOX_CHAT_NOTIFICATION_EVENT_TYPES = new Set([
  'chat.mention',
  'chat.reaction',
  'chat.thread.reply',
]);

const ALWAYS_SILENT_CHAT_NOTIFICATION_EVENT_TYPES = new Set([
  'chat.message.new',
]);

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeNotificationEventType(payload: NotificationRealtimePayload) {
  return toNonEmptyString(payload.data?.eventType)?.toLowerCase() ?? null;
}

function normalizeRealtimeDeliveryMode(payload: NotificationRealtimePayload) {
  const normalizedMode = toNonEmptyString(payload.data?.realtimeDeliveryMode)?.toLowerCase();
  if (normalizedMode === 'normal' || normalizedMode === 'silent') {
    return normalizedMode;
  }
  return null;
}

function shouldSuppressNotificationToast(
  payload: NotificationRealtimePayload,
  eventName: string,
) {
  const normalizedEventType = normalizeNotificationEventType(payload);
  if (
    normalizedEventType &&
    ALWAYS_SILENT_CHAT_NOTIFICATION_EVENT_TYPES.has(normalizedEventType)
  ) {
    return true;
  }

  if (eventName === SOCKET_EVENTS.NOTIFICATION_UPDATED) {
    if (normalizedEventType?.startsWith('chat.')) {
      return true;
    }

    const moduleCode = toNonEmptyString(payload.data?.module)?.toLowerCase();
    if (moduleCode === 'chat' || moduleCode === 'team_chat') {
      return true;
    }
  }

  if (
    normalizedEventType &&
    MY_INBOX_CHAT_NOTIFICATION_EVENT_TYPES.has(normalizedEventType)
  ) {
    const realtimeDeliveryMode = normalizeRealtimeDeliveryMode(payload);
    if (realtimeDeliveryMode === 'normal') {
      return false;
    }
    return true;
  }

  return false;
}

function toNotificationDto(
  payload: NotificationRealtimePayload,
  fallbackRead: boolean,
) {
  const read =
    typeof payload.read === 'boolean'
      ? payload.read
      : typeof payload.isRead === 'boolean'
        ? payload.isRead
        : fallbackRead;

  return {
    id: payload.id,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    content: payload.content ?? null,
    campaignId: payload.campaignId ?? null,
    sender: payload.sender ?? null,
    read,
    data: payload.data,
    createdAt: payload.createdAt,
  };
}

export function NotificationRealtimeBridge() {
  const dispatch = useAppDispatch();
  const notificationItems = useAppSelector(selectNotificationItems);
  const qc = useQueryClient();
  const notificationReadById = useMemo(
    () =>
      new Map(
        notificationItems.map((item) => [item.id, item.read] as const),
      ),
    [notificationItems],
  );

  useSocketEvent(
    SOCKET_NAMESPACES.NOTIFICATIONS,
    SOCKET_EVENTS.NOTIFICATION_NEW,
    (payload) => {
      const fallbackRead = notificationReadById.get(payload.id) ?? false;
      const incomingNotification = toNotificationDto(payload, fallbackRead);
      dispatch(pushNotification(incomingNotification));
      void qc.invalidateQueries({ queryKey: ['notifications'] });
      if (!shouldSuppressNotificationToast(payload, SOCKET_EVENTS.NOTIFICATION_NEW)) {
        toast.infor(payload.title, payload.message);
      }
    },
  );

  useSocketEvent(
    SOCKET_NAMESPACES.NOTIFICATIONS,
    SOCKET_EVENTS.NOTIFICATION_UPDATED,
    (payload) => {
      const fallbackRead = notificationReadById.get(payload.id) ?? false;
      const incomingNotification = toNotificationDto(payload, fallbackRead);
      dispatch(pushNotification(incomingNotification));
      void qc.invalidateQueries({ queryKey: ['notifications'] });

      const moduleCode =
        typeof payload.data?.module === 'string' ? payload.data.module : undefined;
      const isTicketNotification =
        moduleCode === 'ticket_request' || payload.type.toLowerCase().includes('ticket');
      if (isTicketNotification) {
        void qc.invalidateQueries({ queryKey: ['ticket-requests'] });
      }
      if (!shouldSuppressNotificationToast(payload, SOCKET_EVENTS.NOTIFICATION_UPDATED)) {
        toast.infor(payload.title, payload.message);
      }
      const isDailyReportNotification =
        moduleCode === 'daily_report' || payload.type.toLowerCase().startsWith('daily_report_');
      if (isDailyReportNotification) {
        void qc.invalidateQueries({ queryKey: ['daily-reports'] });
      }
    },
  );

  useSocketEvent(
    SOCKET_NAMESPACES.NOTIFICATIONS,
    SOCKET_EVENTS.CAMPAIGN_PROGRESS,
    (payload: CampaignProgressPayload) => {
      void qc.invalidateQueries({ queryKey: ['campaigns'] });

      if (payload.status === 'COMPLETED') {
        toast.success(`Campaign completed: ${payload.sentCount}/${payload.totalRecipients} sent`);
      } else if (payload.status === 'FAILED') {
        toast.danger(`Campaign failed: ${payload.failedCount} errors`);
      }
    },
  );

  useSocketEvent(
    SOCKET_NAMESPACES.NOTIFICATIONS,
    SOCKET_EVENTS.TICKET_REQUEST_UPDATED,
    () => {
      void qc.invalidateQueries({ queryKey: ['ticket-requests'] });
    },
  );

  return null;
}
