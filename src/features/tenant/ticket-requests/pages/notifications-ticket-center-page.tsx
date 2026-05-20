'use client';

import { useMemo } from 'react';
import { CheckCheck } from 'lucide-react';
import { ROUTES } from '@/common/constant/routes';
import { PageHeader } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTenant } from '@/providers';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationsRead,
  useNotifications,
} from '@/features/common/notifications/query/use-notifications';
import type { NotificationDto } from '@/services/notifications/types';

function formatRelativeTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const now = Date.now();
  const diffSeconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));

  if (diffSeconds < 60) return 'just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function getNotificationTag(type: string): string {
  const value = type.trim().toLowerCase();

  if (value.includes('ticket')) return 'Ticket';
  if (value.includes('invitation')) return 'Invitation';
  if (value.includes('approval')) return 'Approval';
  if (value.includes('system')) return 'System';

  return value.length > 0 ? value : 'General';
}

interface ActivityNotificationsPanelProps {
  items: NotificationDto[];
  isPending: boolean;
  isError: boolean;
  unreadCount: number;
  isMarkingAll: boolean;
  isMarkingSingle: boolean;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

function ActivityNotificationsPanel({
  items,
  isPending,
  isError,
  unreadCount,
  isMarkingAll,
  isMarkingSingle,
  onMarkAllRead,
  onMarkRead,
}: ActivityNotificationsPanelProps) {
  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (first, second) =>
          new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
      ),
    [items],
  );

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Activity Notifications</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            disabled={unreadCount === 0 || isMarkingAll}
            onClick={onMarkAllRead}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isPending ? (
          <div className="text-muted-foreground py-10 text-center text-sm">
            Loading notifications...
          </div>
        ) : isError ? (
          <div className="py-10 text-center text-sm text-red-600">
            Failed to load notifications.
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="text-muted-foreground py-10 text-center text-sm">
            No notifications available.
          </div>
        ) : (
          <ScrollArea className="max-h-[70vh]">
            <div className="divide-y">
              {sortedItems.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={cn(
                    'hover:bg-muted/60 w-full space-y-1 px-4 py-3 text-left transition-colors',
                    !item.read && 'bg-primary/5',
                  )}
                  onClick={() => {
                    if (!item.read) {
                      onMarkRead(item.id);
                    }
                  }}
                  disabled={isMarkingSingle}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('text-sm', !item.read && 'font-semibold')}>
                      {item.title}
                    </p>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {getNotificationTag(item.type)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">{item.message}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatRelativeTimestamp(item.createdAt)}
                  </p>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export function NotificationsTicketCenterPage() {
  const { tenantSlug } = useTenant();

  const notificationsQuery = useNotifications({
    page: 1,
    limit: 50,
    scope: 'all',
    enabled: true,
    syncToStore: false,
  });

  const markReadMutation = useMarkNotificationsRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;
  const notifications = notificationsQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Track organization updates, approvals, and invitations in one place."
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.tenant.dashboard(tenantSlug) },
          { label: 'Notifications' },
        ]}
      />

      <ActivityNotificationsPanel
        items={notifications}
        unreadCount={unreadCount}
        isPending={notificationsQuery.isPending}
        isError={notificationsQuery.isError}
        isMarkingAll={markAllReadMutation.isPending}
        isMarkingSingle={markReadMutation.isPending}
        onMarkAllRead={() => void markAllReadMutation.mutateAsync()}
        onMarkRead={(id) => void markReadMutation.mutateAsync([id])}
      />
    </div>
  );
}
