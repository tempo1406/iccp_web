'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  markInvitationAccepted,
  selectAcceptedInvitationIds,
  selectNotificationItems,
  selectNotificationUnreadTotalCount,
  selectNotificationStatus,
  unmarkInvitationAccepted,
} from '@/store/slices/notification/notification.slice';
import {
  useMarkNotificationsRead,
  useNotifications,
} from '@/features/common/notifications/query/use-notifications';
import {
  buildTeamChatHrefFromRoomContext,
  buildTeamChatHrefFromNotification,
  extractNotificationInvitationData,
  extractNotificationInvitationStatus,
  isInvitationNotification,
} from '@/features/common/notifications/lib/notification-chat-deeplink';
import { resolveNotificationHref } from '@/features/common/notifications/utils/notification-navigation';
import { NotificationItem } from './notification-item';
import type { NotificationDto } from '@/services/notifications/types';
import { useAcceptInvitation } from '@/features/tenant/organization-invitations/hooks/use-accept-invitation';
import { toast } from '@/lib/toast';
import { useAcceptChatboxInvitation } from '../hooks/use-accept-chatbox-invitation';

interface NotificationBellProps {
  notificationsHref: string;
}

export function NotificationBell({ notificationsHref }: NotificationBellProps) {
  const t = useTranslations('notifications.bell');
  const router = useRouter();
  const params = useParams();
  const tenant = params?.tenant as string | undefined;
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [acceptingNotificationId, setAcceptingNotificationId] = useState<string | null>(null);

  const items = useAppSelector(selectNotificationItems);
  const unreadCount = useAppSelector(selectNotificationUnreadTotalCount);
  const acceptedInvitationIds = useAppSelector(selectAcceptedInvitationIds);
  const acceptedInvitationIdSet = useMemo(
    () => new Set(acceptedInvitationIds),
    [acceptedInvitationIds],
  );
  const status = useAppSelector(selectNotificationStatus);
  const markReadMutation = useMarkNotificationsRead();
  const { acceptInvitation } = useAcceptInvitation();
  const { acceptChatboxInvitation } = useAcceptChatboxInvitation();

  useNotifications({ page: 1, limit: 20, scope: 'all', enabled: true });

  const unreadItems = useMemo(() => items.filter((notification) => !notification.read), [items]);

  const markAsRead = async (notification: NotificationDto) => {
    if (notification.read || markReadMutation.isPending) return;
    await markReadMutation.mutateAsync([notification.id]);
  };

  const isInvitationAccepted = (notification: NotificationDto) => {
    if (!isInvitationNotification(notification)) return false;
    if (acceptedInvitationIdSet.has(notification.id)) return true;
    if (extractNotificationInvitationStatus(notification) === 'accepted') return true;
    return false;
  };

  const handleSelectNotification = (notification: NotificationDto) => {
    void markAsRead(notification);

    if (isInvitationNotification(notification)) {
      return;
    }

    const teamChatHref = buildTeamChatHrefFromNotification(notification, tenant);
    if (teamChatHref) {
      setOpen(false);
      router.push(teamChatHref);
      return;
    }

    const notificationHref = resolveNotificationHref(notification, tenant ?? null);
    if (notificationHref) {
      setOpen(false);
      router.push(notificationHref);
    }
  };

  const handleAcceptInvitationFromDropdown = async (notification: NotificationDto) => {
    const invitationData = extractNotificationInvitationData(notification);
    if (!invitationData) return;

    setAcceptingNotificationId(notification.id);
    dispatch(markInvitationAccepted(notification.id));

    try {
      if (invitationData.source === 'chatbox') {
        const result = await acceptChatboxInvitation(invitationData.invitationId ?? '');
        if (!result.ok) {
          dispatch(unmarkInvitationAccepted(notification.id));
          return;
        }

        await markAsRead(notification);
        setOpen(false);

        if (tenant) {
          const teamChatHref = buildTeamChatHrefFromRoomContext(tenant, {
            roomId: result.data.roomId,
            contextScope: result.data.room?.contextScope,
            contextId: result.data.room?.contextId,
          });
          if (teamChatHref) {
            router.push(teamChatHref);
          }
        }
        return;
      }

      const token = invitationData.token?.trim();
      if (!token) {
        dispatch(unmarkInvitationAccepted(notification.id));
        toast.warning(t('missingInvitationPayload'));
        return;
      }

      const result = await acceptInvitation(token);
      if (!result.ok) {
        dispatch(unmarkInvitationAccepted(notification.id));
        return;
      }

      await markAsRead(notification);
      setOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('acceptFailedFallback');
      dispatch(unmarkInvitationAccepted(notification.id));
      toast.danger(errorMessage);
    } finally {
      setAcceptingNotificationId(null);
    }
  };

  const activeNotifications = activeTab === 'all' ? items : unreadItems;
  const showLoadingState = status === 'loading' && items.length === 0;
  const showErrorState = status === 'error' && items.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1 text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">{t('label')}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className="z-[70] flex h-[min(78vh,42rem)] w-[min(22rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border border-border bg-popover p-0 shadow-2xl"
      >
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            if (value === 'all' || value === 'unread') {
              setActiveTab(value);
            }
          }}
          className="flex h-full min-h-0 flex-col"
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <span className="font-semibold">{t('label')}</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {t('unreadCount', { count: unreadCount })}
              </Badge>
            )}
          </div>
          <Separator />

          <TabsList className="mx-4 mt-2 h-8 w-[calc(100%-2rem)]">
            <TabsTrigger value="all" className="flex-1 text-xs">
              All ({items.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1 text-xs">
              {t('tabs.unread', { count: unreadCount })}
            </TabsTrigger>
          </TabsList>

          <div className="mt-1 min-h-0 flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto overscroll-contain px-1">
              {showLoadingState && (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  {t('loading')}
                </p>
              )}
              {showErrorState && (
                <p className="text-destructive py-6 text-center text-sm">
                  {t('loadFailed')}
                </p>
              )}
              {!showLoadingState && !showErrorState && activeNotifications.length === 0 && (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  {activeTab === 'unread' ? t('emptyUnread') : t('emptyAll')}
                </p>
              )}
              {!showLoadingState && !showErrorState && activeNotifications.length > 0 && (
                <div className="space-y-0.5 px-2 py-1">
                  {activeNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onSelect={handleSelectNotification}
                      isInvitation={isInvitationNotification(notification)}
                      invitationAccepted={isInvitationAccepted(notification)}
                      onAcceptInvitation={handleAcceptInvitationFromDropdown}
                      isAccepting={acceptingNotificationId === notification.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Tabs>

        <Separator className="mt-1" />
        <div className="p-2">
          <Link
            href={notificationsHref}
            onClick={() => setOpen(false)}
            className="text-primary hover:bg-accent block rounded-md py-2 text-center text-xs font-medium transition-colors"
          >
            {t('viewAll')}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

