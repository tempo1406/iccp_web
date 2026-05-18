'use client';

import { NotificationBellBase } from './notification-bell-base';

interface TenantNotificationBellProps {
  notificationsHref: string;
}

export function TenantNotificationBell({ notificationsHref }: TenantNotificationBellProps) {
  return (
    <NotificationBellBase
      notificationsHref={notificationsHref}
      plainTopBadge
      topBadgeClassName="border-0"
      topBadgeStyle={{
        backgroundColor: 'var(--brand)',
        color: 'var(--brand-fg)',
      }}
      unreadBadgeClassName="border"
      unreadBadgeStyle={{
        borderColor: 'var(--brand-muted)',
        backgroundColor: 'var(--brand-light)',
        color: 'var(--brand)',
      }}
      viewAllLinkClassName="text-[var(--brand)] hover:bg-[var(--brand-light)]"
    />
  );
}
