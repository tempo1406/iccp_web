import type { NotificationDto } from '@/services/notifications/types';

export function readString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function isTicketNotification(notification: NotificationDto | null): boolean {
  if (!notification) {
    return false;
  }

  const moduleCode = readString(toRecord(notification.data)?.module)?.toLowerCase();
  return (
    notification.type.toLowerCase().includes('ticket') || moduleCode === 'ticket_request'
  );
}

export function isLandingPageLeadNotification(
  notification: NotificationDto | null,
): boolean {
  if (!notification) {
    return false;
  }

  const moduleCode = readString(toRecord(notification.data)?.module)?.toLowerCase();
  return (
    notification.type.toLowerCase() === 'landing_page.lead' ||
    moduleCode === 'landing_page'
  );
}

export function extractTicketIdFromNotification(
  notification: NotificationDto | null,
): string | null {
  if (!notification) {
    return null;
  }

  const data = toRecord(notification.data);
  const ticket = toRecord(data?.ticket);
  return (
    readString(data?.ticketId) ?? readString(data?.ticket_id) ?? readString(ticket?.id)
  );
}
