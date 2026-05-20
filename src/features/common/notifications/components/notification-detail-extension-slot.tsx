'use client';

import type { NotificationDto } from '@/services/notifications/types';
import {
  isLandingPageLeadNotification,
  isTicketNotification,
} from '../utils/notification-detail.utils';
import { NotificationLandingPageLeadCard } from './notification-landing-page-lead-card';
import { NotificationTicketDetailCard } from './notification-ticket-detail-card';

interface NotificationDetailExtensionSlotProps {
  notification: NotificationDto;
  senderName: string;
  senderId: string | null;
  senderAvatarUrl: string | null;
}

export function NotificationDetailExtensionSlot({
  notification,
  senderName,
  senderId,
  senderAvatarUrl,
}: NotificationDetailExtensionSlotProps) {
  if (isTicketNotification(notification)) {
    return (
      <NotificationTicketDetailCard
        notification={notification}
        senderName={senderName}
        senderId={senderId}
        senderAvatarUrl={senderAvatarUrl}
      />
    );
  }

  if (isLandingPageLeadNotification(notification)) {
    return <NotificationLandingPageLeadCard notification={notification} />;
  }

  return null;
}
