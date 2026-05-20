'use client';

import { NotificationBellBase } from './notification-bell-base';

interface UserDashboardNotificationBellProps {
  notificationsHref: string;
}

export function UserDashboardNotificationBell({
  notificationsHref,
}: UserDashboardNotificationBellProps) {
  return (
    <NotificationBellBase
      notificationsHref={notificationsHref}
      topBadgeClassName="bg-destructive text-white"
      unreadBadgeClassName=""
      viewAllLinkClassName="text-primary hover:bg-accent"
    />
  );
}
