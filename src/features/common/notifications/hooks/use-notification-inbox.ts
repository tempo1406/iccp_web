'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAppDispatch, useAppSelector } from '@/store';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import {
  markInvitationAccepted,
  selectAcceptedInvitationIds,
  selectNotificationItems,
  selectNotificationUnreadCount,
  unmarkInvitationAccepted,
} from '@/store/slices/notification/notification.slice';
import {
  isActivityFeedNotification,
  type NotificationFeedScope,
} from '../lib/notification-feed-scope';
import {
  normalizeNotificationItems,
  normalizeNotificationTotal,
  normalizeNotificationUnreadCount,
  useCampaignById,
  useCampaigns,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkOneNotificationRead,
  useNotificationsInfinite,
} from '../query/use-notifications';
import { useAcceptInvitation } from '@/features/tenant/organization-invitations/hooks/use-accept-invitation';
import {
  extractNotificationInvitationData,
  extractNotificationInvitationStatus,
  type NotificationInvitationData,
} from '../lib/notification-chat-deeplink';
import type { NotificationDto } from '@/services/notifications/types';
import { ROUTES } from '@/common/constant/routes';
import { useMyProjectInvites } from '@/features/tenant/projects/query/use-project-core';
import { useInvitationByIdQuery } from '@/features/tenant/organization-invitations/query/invitations.queries';
import { useAcceptChatboxInvitation } from './use-accept-chatbox-invitation';
import type { TeamChatAcceptInvitationResponse } from '@/features/tenant/team-chat/services/types/team-chat.types';

export type PanelTab = 'inbox' | 'campaigns';
export type InboxFilter = 'all' | 'unread' | 'invitation';

interface UseNotificationInboxOptions {
  preselectedNotificationId?: string | null;
  feedScope?: NotificationFeedScope;
}

export function useNotificationInbox(options: UseNotificationInboxOptions = {}) {
  const { preselectedNotificationId = null, feedScope = 'all' } = options;
  const router = useRouter();
  const dispatch = useAppDispatch();
  const tBell = useTranslations('notifications.bell');

  const canListCampaigns = useCan(PERMISSIONS.NOTIFICATIONS_CAMPAIGNS_LIST);
  const canCreateCampaign = useCan(PERMISSIONS.NOTIFICATIONS_CAMPAIGNS_CREATE);
  const canViewInvitations = useCan(PERMISSIONS.TENANT_INVITATIONS_LIST);

  const myProjectInvitesQuery = useMyProjectInvites({ status: 'pending' });
  const pendingProjectInviteIds = useMemo(() => {
    const invites = myProjectInvitesQuery.data ?? [];
    return new Set(invites.map((inv) => inv.id));
  }, [myProjectInvitesQuery.data]);

  const [panelTab, setPanelTab] = useState<PanelTab>('inbox');
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(
    preselectedNotificationId,
  );
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

  const notificationFeedScope: NotificationFeedScope = feedScope;
  const notifQuery = useNotificationsInfinite({ limit: 20, scope: notificationFeedScope });
  const shouldMergeStoreItems = notificationFeedScope === 'activity';
  const notificationItemsFromQuery = useMemo(
    () =>
      notifQuery.data?.pages.flatMap((page) => normalizeNotificationItems(page)) ?? [],
    [notifQuery.data?.pages],
  );
  const notificationItemsFromStore = useAppSelector(selectNotificationItems);
  const notificationItems = useMemo(() => {
    const merged = [
      ...(shouldMergeStoreItems
        ? notificationItemsFromStore.filter((item) => isActivityFeedNotification(item))
        : []),
      ...notificationItemsFromQuery,
    ];
    const seenIds = new Set<string>();
    return merged.filter((item) => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });
  }, [notificationItemsFromQuery, notificationItemsFromStore, shouldMergeStoreItems]);

  const notificationTotal = normalizeNotificationTotal(notifQuery.data?.pages[0]);
  const notificationStatus =
    notifQuery.status === 'pending'
      ? 'loading'
      : notifQuery.status === 'error'
        ? 'error'
        : 'idle';
  const hasMoreNotifications = notificationItems.length < notificationTotal;
  const isFetchingMoreNotifications = notifQuery.isFetchingNextPage;
  const activityUnreadCount = useAppSelector(selectNotificationUnreadCount);
  const unreadCount =
    notificationFeedScope === 'activity'
      ? activityUnreadCount
      : normalizeNotificationUnreadCount(notifQuery.data?.pages[0]);

  const acceptedInvitationIds = useAppSelector(selectAcceptedInvitationIds);
  const acceptedInvitationIdSet = useMemo(
    () => new Set(acceptedInvitationIds),
    [acceptedInvitationIds],
  );

  const campaignsQuery = useCampaigns(
    { limit: 50 },
    { enabled: canListCampaigns },
  );
  const campaigns = useMemo(() => campaignsQuery.data?.data ?? [], [campaignsQuery.data]);

  const markOneRead = useMarkOneNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const { acceptInvitation, isAccepting } = useAcceptInvitation();
  const {
    acceptChatboxInvitation,
    isAccepting: isAcceptingChatboxInvitation,
  } = useAcceptChatboxInvitation();

  const filteredNotifications = useMemo(() => {
    let items = notificationItems;

    if (inboxFilter === 'unread') {
      items = items.filter((notification) => !notification.read);
    }

    if (inboxFilter === 'invitation') {
      items = items.filter(
        (notification) =>
          notification.type === 'invitation' || Boolean(extractNotificationInvitationData(notification)),
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (notification) =>
          notification.title.toLowerCase().includes(query) ||
          notification.message.toLowerCase().includes(query) ||
          (notification.sender?.name ?? '').toLowerCase().includes(query),
      );
    }

    return items;
  }, [notificationItems, inboxFilter, searchQuery]);

  const filteredCampaigns = useMemo(() => {
    if (!searchQuery.trim()) return campaigns;

    const query = searchQuery.toLowerCase();
    return campaigns.filter(
      (campaign) =>
        campaign.title.toLowerCase().includes(query) ||
        campaign.message.toLowerCase().includes(query),
    );
  }, [campaigns, searchQuery]);

  const effectiveSelectedNotificationId = useMemo(() => {
    const hasSelectedNotification = filteredNotifications.some(
      (notification) => notification.id === selectedNotificationId,
    );

    return hasSelectedNotification
      ? selectedNotificationId
      : (filteredNotifications[0]?.id ?? null);
  }, [filteredNotifications, selectedNotificationId]);

  const effectiveSelectedCampaignId = useMemo(() => {
    const hasSelectedCampaign = filteredCampaigns.some(
      (campaign) => campaign.id === selectedCampaignId,
    );

    return hasSelectedCampaign ? selectedCampaignId : (filteredCampaigns[0]?.id ?? null);
  }, [filteredCampaigns, selectedCampaignId]);

  const selectedNotification: NotificationDto | null = effectiveSelectedNotificationId
    ? (notificationItems.find(
        (notification) => notification.id === effectiveSelectedNotificationId,
      ) ?? null)
    : null;

  const campaignDetailQuery = useCampaignById(effectiveSelectedCampaignId, {
    enabled: canListCampaigns && panelTab === 'campaigns',
  });
  const selectedCampaign = campaignDetailQuery.data ?? null;

  const selectedOrgInvitationId =
    selectedNotification?.type === 'invitation'
      ? ((selectedNotification.data?.invitationId as string | undefined) ?? '')
      : '';
  const orgInvitationQuery = useInvitationByIdQuery(
    selectedOrgInvitationId,
    Boolean(selectedOrgInvitationId) && canViewInvitations,
  );
  const orgInvitationIsPending = selectedOrgInvitationId
    ? (!canViewInvitations ||
      !orgInvitationQuery.data ||
      orgInvitationQuery.data.status === 'pending')
    : false;

  const isInvitationAccepted = (notification: NotificationDto) => {
    if (!extractNotificationInvitationData(notification)) return false;
    if (acceptedInvitationIdSet.has(notification.id)) return true;
    if (extractNotificationInvitationStatus(notification) === 'accepted') return true;
    return false;
  };

  function handleSelectNotification(id: string) {
    setIsCreatingCampaign(false);
    setSelectedNotificationId(id);

    const item = notificationItems.find((notification) => notification.id === id);
    if (item && !item.read) {
      void markOneRead.mutateAsync(id);
    }
  }

  function handleSelectCampaign(id: string) {
    setIsCreatingCampaign(false);
    setSelectedCampaignId(id);
  }

  function handleDeleteNotification(id: string) {
    void deleteNotification.mutateAsync(id);
    if (effectiveSelectedNotificationId === id) {
      setSelectedNotificationId(null);
    }
  }

  function handleOpenCreateCampaign() {
    setIsCreatingCampaign(true);
    setSelectedCampaignId(null);
    setPanelTab('campaigns');
  }

  async function handleAcceptInvitation(
    invitationData: NotificationInvitationData,
    notificationId?: string,
  ): Promise<{
    ok: boolean;
    roomId?: string;
    room?: TeamChatAcceptInvitationResponse['room'];
    error?: string;
  }> {
    if (notificationId) {
      dispatch(markInvitationAccepted(notificationId));
    }

    if (invitationData.source === 'chatbox') {
      const result = await acceptChatboxInvitation(invitationData.invitationId ?? '');
      if (!result.ok) {
        if (notificationId) {
          dispatch(unmarkInvitationAccepted(notificationId));
        }
        return {
          ok: false,
          error: result.error,
        };
      }

      return {
        ok: true,
        roomId: result.data.roomId,
        room: result.data.room,
      };
    }

    const token = invitationData.token?.trim();
    if (token) {
      const result = await acceptInvitation(token);
      if (!result.ok) {
        if (notificationId) {
          dispatch(unmarkInvitationAccepted(notificationId));
        }
        return {
          ok: false,
          error: result.error,
        };
      }

      return {
        ok: true,
      };
    }

    if (notificationId) {
      dispatch(unmarkInvitationAccepted(notificationId));
    }

    return {
      ok: false,
      error: tBell('missingInvitationPayload'),
    };
  }

  function handleAcceptProjectInvitation(notification: NotificationDto) {
    const token = (notification.data?.token as string | undefined)?.trim();
    if (!token) return;

    const projectSlug = notification.data?.projectSlug as string | undefined;
    const organizationId = notification.data?.organizationId as string | undefined;
    const params = new URLSearchParams({ token });
    if (projectSlug) params.set('projectSlug', projectSlug);
    if (organizationId) params.set('orgId', organizationId);
    router.push(`${ROUTES.projectInviteAccept}?${params.toString()}`);
  }

  function handleMarkAllRead() {
    void markAllRead.mutateAsync();
  }

  function handleMarkOneRead(id: string) {
    void markOneRead.mutateAsync(id);
  }

  function handleLoadMore() {
    void notifQuery.fetchNextPage();
  }

  return {
    panelTab,
    setPanelTab,
    inboxFilter,
    setInboxFilter,
    searchQuery,
    setSearchQuery,
    selectedNotificationId: effectiveSelectedNotificationId,
    selectedCampaignId: effectiveSelectedCampaignId,
    isCreatingCampaign,
    setIsCreatingCampaign,
    notificationStatus,
    hasMoreNotifications,
    isFetchingMoreNotifications,
    campaigns,
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
    isAccepting: isAccepting || isAcceptingChatboxInvitation,
    isInvitationAccepted,
  };
}
