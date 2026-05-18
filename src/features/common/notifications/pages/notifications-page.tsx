'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout';
import { Bell, Megaphone, CheckCheck, Search, Plus } from 'lucide-react';
import {
  useNotificationInbox,
  type PanelTab,
  type InboxFilter,
} from '../hooks/use-notification-inbox';
import { NotificationListItem } from '../components/notification-list-item';
import { CampaignListItem } from '../components/campaign-list-item';
import { NotificationDetailPanel } from '../components/notification-detail-panel';
import { CampaignDetailPanel } from '../components/campaign-detail-panel';
import { CreateCampaignPanel } from '../components/create-campaign-panel';
import { ListSkeleton } from '../components/skeletons/list-skeleton';
import { EmptyList } from '../components/skeletons/empty-list';
import type { NotificationDto } from '@/services/notifications/types';
import { ROUTES } from '@/common/constant/routes';
import { useAppDispatch } from '@/store';
import { markInvitationAccepted } from '@/store/slices/notification/notification.slice';
import {
  buildTeamChatHrefFromRoomContext,
  buildTeamChatHrefFromNotification,
  extractNotificationInvitationData,
  isInvitationNotification,
} from '../lib/notification-chat-deeplink';
import { resolveNotificationHref } from '../utils/notification-navigation';
import {
  normalizeNotificationFeedScope,
  type NotificationFeedScope,
} from '../lib/notification-feed-scope';

export function NotificationsPage() {
  const params = useParams<{ tenant?: string }>();
  const searchParams = useSearchParams();
  const tenantId = typeof params.tenant === 'string' ? params.tenant : null;
  const preselectedNotificationId = searchParams.get('notificationId');
  const selectedFeedScope =
    normalizeNotificationFeedScope(searchParams.get('feed')) ?? 'all';

  return (
    <NotificationsPageContent
      key={`${preselectedNotificationId ?? 'notifications'}-${selectedFeedScope}`}
      tenantId={tenantId}
      preselectedNotificationId={preselectedNotificationId}
      feedScope={selectedFeedScope}
    />
  );
}

interface NotificationsPageContentProps {
  tenantId: string | null;
  preselectedNotificationId: string | null;
  feedScope: NotificationFeedScope;
}

function NotificationsPageContent({
  tenantId,
  preselectedNotificationId,
  feedScope,
}: NotificationsPageContentProps) {
  const t = useTranslations('notifications.page');
  const router = useRouter();
  const dispatch = useAppDispatch();
  const tenant = tenantId ?? undefined;
  const {
    panelTab,
    setPanelTab,
    inboxFilter,
    setInboxFilter,
    searchQuery,
    setSearchQuery,
    selectedNotificationId,
    selectedCampaignId,
    isCreatingCampaign,
    setIsCreatingCampaign,
    notificationStatus,
    hasMoreNotifications,
    isFetchingMoreNotifications,
    campaignsQuery,
    selectedCampaign,
    selectedNotification,
    unreadCount,
    filteredNotifications,
    filteredCampaigns,
    canListCampaigns,
    canCreateCampaign,
    handleSelectNotification,
    handleSelectCampaign,
    handleDeleteNotification,
    handleOpenCreateCampaign,
    handleAcceptInvitation,
    handleAcceptProjectInvitation,
    pendingProjectInviteIds,
    orgInvitationIsPending,
    handleMarkAllRead,
    handleMarkOneRead,
    handleLoadMore,
    isAccepting,
    isInvitationAccepted,
  } = useNotificationInbox({ preselectedNotificationId, feedScope });

  const handleSelectNotificationItem = (notification: NotificationDto) => {
    handleSelectNotification(notification.id);
    if (isInvitationNotification(notification)) {
      return;
    }

    const teamChatHref = buildTeamChatHrefFromNotification(notification, tenant);
    if (teamChatHref) {
      router.push(teamChatHref);
      return;
    }

    const notificationHref = resolveNotificationHref(notification, tenantId);
    if (notificationHref) {
      router.push(notificationHref);
    }
  };

  const handleAcceptInvitationFromDetail = async (notification: NotificationDto) => {
    const invitationData = extractNotificationInvitationData(notification);
    if (!invitationData) return;

    if (invitationData.source === 'organization') {
      const token = invitationData.token?.trim();
      if (!token) return;

      dispatch(markInvitationAccepted(notification.id));

      if (!notification.read) {
        handleMarkOneRead(notification.id);
      }

      router.push(`${ROUTES.inviteAccept}?token=${encodeURIComponent(token)}`);
      return;
    }

    const result = await handleAcceptInvitation(invitationData, notification.id);
    if (!result.ok) return;

    if (!notification.read) {
      handleMarkOneRead(notification.id);
    }

    const teamChatHref = buildTeamChatHrefFromRoomContext(tenant, {
      roomId: result.roomId,
      contextScope: result.room?.contextScope,
      contextId: result.room?.contextId,
    });
    if (teamChatHref) {
      router.push(teamChatHref);
    }
  };

  const breadcrumbs = tenantId
    ? [
        { label: t('dashboardCrumb'), href: ROUTES.tenant.dashboard(tenantId) },
        { label: t('notificationsCrumb') },
      ]
    : [
        { label: t('dashboardCrumb'), href: ROUTES.dashboard },
        { label: t('notificationsCrumb') },
      ];

  const showCampaignTabs = canListCampaigns;

  function renderRightPanel() {
    if (isCreatingCampaign) {
      return <CreateCampaignPanel onClose={() => setIsCreatingCampaign(false)} />;
    }

    if (panelTab === 'inbox') {
      return (
        <NotificationDetailPanel
          notification={selectedNotification}
          onMarkRead={handleMarkOneRead}
          onDelete={handleDeleteNotification}
          onAcceptInvitation={(notification) => {
            void handleAcceptInvitationFromDetail(notification);
          }}
          isAccepting={isAccepting}
          invitationAccepted={selectedNotification ? isInvitationAccepted(selectedNotification) : false}
          onAcceptProjectInvitation={handleAcceptProjectInvitation}
          pendingProjectInviteIds={pendingProjectInviteIds}
          orgInvitationIsPending={orgInvitationIsPending}
        />
      );
    }

    return <CampaignDetailPanel campaign={selectedCampaign} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={breadcrumbs}
        actions={
          canCreateCampaign && (
            <Button size="sm" className="gap-2" onClick={handleOpenCreateCampaign}>
              <Plus className="h-4 w-4" />
              {t('createCampaign')}
            </Button>
          )
        }
      />

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg border">
        <div className="flex min-h-0 min-w-0 w-full flex-col border-r md:w-1/3">
          {showCampaignTabs ? (
            <Tabs
              value={panelTab}
              onValueChange={(value) => {
                setPanelTab(value as PanelTab);
                setIsCreatingCampaign(false);
              }}
              className="border-b"
            >
              <TabsList className="h-10 w-full rounded-none border-0 bg-transparent">
                <TabsTrigger value="inbox" className="flex-1 gap-1.5 rounded-none text-xs">
                  <Bell className="h-3.5 w-3.5" />
                  {t('tabs.inbox')}
                  {unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] leading-none">
                      {unreadCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="campaigns" className="flex-1 gap-1.5 rounded-none text-xs">
                  <Megaphone className="h-3.5 w-3.5" />
                  {t('tabs.campaigns')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            <div className="flex h-10 shrink-0 items-center justify-center gap-1.5 border-b bg-background text-sm font-medium">
              <Bell className="h-4 w-4" />
              {t('tabs.inbox')}
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] leading-none">
                  {unreadCount}
                </span>
              )}
            </div>
          )}

          <div className="border-b p-2">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
              <Input
                placeholder={t('searchPlaceholder')}
                className="h-8 pl-8 text-sm"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>

          {panelTab === 'inbox' && (
            <div className="flex items-center gap-1 border-b px-2 py-1.5">
              {(['all', 'unread', 'invitation'] as InboxFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setInboxFilter(filter)}
                  className={`rounded px-2 py-1 text-xs capitalize transition-colors ${inboxFilter === filter
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                    }`}
                >
                  {t(`filters.${filter}`)}
                </button>
              ))}
              <div className="flex-1" />
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-muted-foreground hover:bg-muted flex items-center gap-1 rounded px-2 py-1 text-xs"
                >
                  <CheckCheck className="h-3 w-3" />
                  {t('markAllRead')}
                </button>
              )}
            </div>
          )}

          {panelTab === 'campaigns' && canCreateCampaign && (
            <div className="flex items-center border-b px-2 py-1.5">
              <button
                onClick={handleOpenCreateCampaign}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                  isCreatingCampaign
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Plus className="h-3 w-3" />
                {t('newCampaign')}
              </button>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full [&_[data-slot=scroll-area-viewport]]:pr-2 [&_[data-slot=scroll-area-viewport]>div]:max-w-full">
              {panelTab === 'inbox' ? (
                notificationStatus === 'loading' ? (
                  <ListSkeleton />
                ) : filteredNotifications.length === 0 ? (
                  <EmptyList message={t('noNotifications')} />
                ) : (
                  <div className="pr-2">
                    {filteredNotifications.map((notification) => (
                      <NotificationListItem
                        key={notification.id}
                        notification={notification}
                        isSelected={selectedNotificationId === notification.id}
                        onSelect={handleSelectNotificationItem}
                        onDelete={handleDeleteNotification}
                      />
                    ))}
                    {hasMoreNotifications && (
                      <div className="border-t px-3 py-2">
                        <button
                          onClick={handleLoadMore}
                          disabled={isFetchingMoreNotifications}
                          className="text-muted-foreground hover:text-foreground w-full rounded py-1 text-xs transition-colors disabled:opacity-50"
                        >
                          {isFetchingMoreNotifications ? t('loading') : t('loadMore')}
                        </button>
                      </div>
                    )}
                  </div>
                )
              ) : campaignsQuery.isPending ? (
                <ListSkeleton />
              ) : filteredCampaigns.length === 0 ? (
                <EmptyList message={t('noCampaigns')} />
              ) : (
                filteredCampaigns.map((campaign) => (
                  <CampaignListItem
                    key={campaign.id}
                    campaign={campaign}
                    isSelected={!isCreatingCampaign && selectedCampaignId === campaign.id}
                    onSelect={handleSelectCampaign}
                  />
                ))
              )}
            </ScrollArea>
          </div>
        </div>

        <div className="hidden min-h-0 min-w-0 flex-1 overflow-hidden md:flex">{renderRightPanel()}</div>
      </div>
    </div>
  );
}
