'use client';

import { type CSSProperties, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store';
import {
  selectNotificationItems,
  selectNotificationUnreadTotalCount,
  selectNotificationStatus,
} from '@/store/slices/notification/notification.slice';
import {
  normalizeNotificationItems,
  normalizeNotificationUnreadByScope,
  normalizeNotificationUnreadCount,
  useMarkNotificationsRead,
  useNotifications,
  useDeleteNotification,
  useDeleteAllNotifications,
} from '@/features/common/notifications/query/use-notifications';
import { isActivityFeedNotification } from '@/features/common/notifications/lib/notification-feed-scope';
import { NotificationItem } from './notification-item';

interface NotificationBellBaseProps {
  notificationsHref: string;
  plainTopBadge?: boolean;
  topBadgeClassName?: string;
  topBadgeStyle?: CSSProperties;
  unreadBadgeClassName?: string;
  unreadBadgeStyle?: CSSProperties;
  viewAllLinkClassName?: string;
}

export function NotificationBellBase({
  notificationsHref,
  plainTopBadge = false,
  topBadgeClassName,
  topBadgeStyle,
  unreadBadgeClassName,
  unreadBadgeStyle,
  viewAllLinkClassName,
}: NotificationBellBaseProps) {
  const t = useTranslations('notifications');
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isTeamChatRoute = pathname?.includes('/team-chat') ?? false;

  const items = useAppSelector(selectNotificationItems);
  const unreadCount = useAppSelector(selectNotificationUnreadTotalCount);
  const status = useAppSelector(selectNotificationStatus);
  const markReadMutation = useMarkNotificationsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const deleteAllNotificationsMutation = useDeleteAllNotifications();

  const notificationsQuery = useNotifications({
    page: 1,
    limit: 20,
    scope: isTeamChatRoute ? 'activity' : 'all',
    enabled: true,
    syncToStore: !isTeamChatRoute,
  });

  const resolvedItems = useMemo(() => {
    if (!isTeamChatRoute) {
      return items;
    }

    return normalizeNotificationItems(notificationsQuery.data).filter((notification) =>
      isActivityFeedNotification(notification),
    );
  }, [isTeamChatRoute, items, notificationsQuery.data]);

  const resolvedUnreadCount = useMemo(() => {
    if (!isTeamChatRoute) {
      return unreadCount;
    }

    const unreadByScope = normalizeNotificationUnreadByScope(
      notificationsQuery.data,
      resolvedItems,
      normalizeNotificationUnreadCount(notificationsQuery.data),
    );
    return unreadByScope?.activity ?? resolvedItems.filter((notification) => !notification.read).length;
  }, [isTeamChatRoute, notificationsQuery.data, resolvedItems, unreadCount]);

  const resolvedStatus = isTeamChatRoute
    ? notificationsQuery.isPending
      ? 'loading'
      : notificationsQuery.isError
        ? 'error'
        : 'idle'
    : status;

  const unreadItems = useMemo(
    () => resolvedItems.filter((notification) => !notification.read),
    [resolvedItems],
  );

  const handleRead = (id: string, read: boolean) => {
    if (read || markReadMutation.isPending) return;
    void markReadMutation.mutateAsync([id]);
  };

  const handleOpenNotification = (id: string, read: boolean) => {
    handleRead(id, read);
    setOpen(false);
    const [baseHref, rawQuery = ''] = notificationsHref.split('?', 2);
    const searchParams = new URLSearchParams(rawQuery);
    searchParams.set('notificationId', id);
    router.push(`${baseHref}?${searchParams.toString()}`);
  };

  const handleDeleteNotification = (id: string) => {
    if (deleteNotificationMutation.isPending) {
      return;
    }

    void deleteNotificationMutation.mutateAsync(id);
  };

  const handleDeleteAllNotifications = () => {
    if (deleteAllNotificationsMutation.isPending || resolvedItems.length === 0) {
      return;
    }

    void deleteAllNotificationsMutation.mutateAsync(resolvedItems.map((item) => item.id));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative cursor-pointer">
          <Bell className="h-5 w-5" />
          {resolvedUnreadCount > 0 &&
            (plainTopBadge ? (
              <span
                className={cn(
                  'absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-medium',
                  topBadgeClassName,
                )}
                style={topBadgeStyle}
              >
                {resolvedUnreadCount > 99 ? '99+' : resolvedUnreadCount}
              </span>
            ) : (
              <Badge
                className={cn(
                  'absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1 text-[10px]',
                  topBadgeClassName,
                )}
                style={topBadgeStyle}
              >
                {resolvedUnreadCount > 99 ? '99+' : resolvedUnreadCount}
              </Badge>
            ))}
          <span className="sr-only">{t('bell.label')}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <span className="font-semibold">{t('bell.label')}</span>
          <div className="flex items-center gap-2">
            {resolvedItems.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteAllNotifications}
                disabled={deleteAllNotificationsMutation.isPending}
                className="text-muted-foreground hover:text-destructive text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
              >
                {deleteAllNotificationsMutation.isPending
                  ? t('bell.clearing')
                  : t('bell.clearAll')}
              </button>
            )}
            {/* {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className={cn('text-xs', unreadBadgeClassName)}
                style={unreadBadgeStyle}
              >
                {t('bell.unreadCount', { count: unreadCount })}
              </Badge>
            )} */}
          </div>
        </div>
        <Separator />

        <Tabs defaultValue="all">
          <TabsList
            variant="line"
            className="w-full justify-start rounded-none border-b px-4"
          >
            <TabsTrigger value="all" className="flex-1 text-xs">
              All ({resolvedItems.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1 text-xs">
              {t('bell.tabs.unread', { count: resolvedUnreadCount })}
            </TabsTrigger>
          </TabsList>

          {(['all', 'unread'] as const).map((tab) => {
            const list = tab === 'all' ? resolvedItems : unreadItems;
            const showLoadingState = resolvedStatus === 'loading' && resolvedItems.length === 0;
            const showErrorState = resolvedStatus === 'error' && resolvedItems.length === 0;
            return (
              <TabsContent key={tab} value={tab} className="mt-1">
                {showLoadingState && (
                  <p className="text-muted-foreground py-6 text-center text-sm">
                    Loading...
                  </p>
                )}
                {showErrorState && (
                  <p className="text-destructive py-6 text-center text-sm">
                    {t('bell.loadFailed')}
                  </p>
                )}
                {!showLoadingState && !showErrorState && list.length === 0 && (
                  <p className="text-muted-foreground py-6 text-center text-sm">
                    {tab === 'unread' ? t('bell.emptyUnread') : t('bell.emptyAll')}
                  </p>
                )}
                {!showLoadingState && !showErrorState && list.length > 0 && (
                  <ScrollArea className="h-72">
                    <div className="space-y-0.5 px-2 py-1">
                      {list.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onOpen={() =>
                            handleOpenNotification(notification.id, notification.read)
                          }
                          onDelete={() => handleDeleteNotification(notification.id)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        <Separator className="mt-1" />
        <div className="p-2">
          <Link
            href={notificationsHref}
            onClick={() => setOpen(false)}
            className={cn(
              'block rounded-md py-2 text-center text-xs font-medium transition-colors',
              viewAllLinkClassName,
            )}
          >
            {t('bell.viewAll')}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
