'use client';

import { useMemo } from 'react';
import { useTicketRequestDetailQuery } from '@/features/tenant/ticket-requests/query/ticket-requests.queries';
import type { NotificationDto } from '@/services/notifications/types';
import type { NotificationTicketUserSummary } from '../types';
import {
  extractTicketIdFromNotification,
  isTicketNotification,
  readString,
} from '../utils/notification-detail.utils';

function formatUserName(
  user: NotificationTicketUserSummary | null | undefined,
): string | null {
  if (!user) {
    return null;
  }

  const fullName = [user.firstName, user.lastName]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(' ')
    .trim();

  if (fullName.length > 0) {
    return fullName;
  }

  return user.email ?? null;
}

export function useNotificationSenderDisplay(notification: NotificationDto | null) {
  const senderId = notification?.sender?.id ?? null;
  const senderAvatarUrl = notification?.sender?.avatarUrl ?? null;
  const fallbackSenderName = readString(notification?.sender?.name) ?? 'System';
  const ticketId = extractTicketIdFromNotification(notification);
  const isTicket = isTicketNotification(notification);

  const ticketDetailQuery = useTicketRequestDetailQuery(ticketId, Boolean(ticketId && isTicket));
  const ticketDetail = ticketDetailQuery.data;

  const senderName = useMemo(() => {
    if (!senderId || !ticketDetail) {
      return fallbackSenderName;
    }

    if (ticketDetail.requester.id === senderId) {
      return formatUserName(ticketDetail.requester) ?? fallbackSenderName;
    }

    if (ticketDetail.approver?.id === senderId) {
      return formatUserName(ticketDetail.approver) ?? fallbackSenderName;
    }

    const matchedEffortOwner =
      ticketDetail.effortOwners?.find((owner) => owner.id === senderId) ??
      (ticketDetail.effortOwner?.id === senderId ? ticketDetail.effortOwner : null);
    if (matchedEffortOwner) {
      return formatUserName(matchedEffortOwner) ?? fallbackSenderName;
    }

    const latestMatchedActor = [...ticketDetail.activities]
      .reverse()
      .find((activity) => activity.actor?.id === senderId)?.actor;

    return formatUserName(latestMatchedActor) ?? fallbackSenderName;
  }, [fallbackSenderName, senderId, ticketDetail]);

  return {
    senderId,
    senderAvatarUrl,
    senderName,
  };
}
