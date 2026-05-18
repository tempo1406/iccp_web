'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SOCKET_EVENTS, SOCKET_NAMESPACES } from '@/common/constant/socket.constant';
import type { NotificationRealtimePayload } from '@/lib/socket/types';
import { useServiceContext } from '@/lib/use-service-context';
import type {
  ChatMessageAttachmentChangePayload,
  ChatMessageAttachmentPreviewUpdatedPayload,
  ChatMessageCreatedPayload,
  ChatMessageDeletedPayload,
  ChatMessageLinkPreviewUpdatedPayload,
  ChatMessagePinUpdatedPayload,
  ChatPresenceUpdatedPayload,
  ChatMessageReactionUpdatedPayload,
  ChatRealtimeMessage,
  ChatMessageUpdatedPayload,
  ChatRoomInvitationCreatedPayload,
  ChatRoomMemberJoinedPayload,
  ChatRoomMemberRemovedPayload,
  ChatRoomReadStateUpdatedPayload,
  ChatPersonalInboxRoomReadUpdatedPayload,
  ChatRoomMemberRoleUpdatedPayload,
  ChatRoomUpdatedPayload,
  ChatRoomVisibilityChangedPayload,
  ChatTypingStartedPayload,
  ChatTypingStoppedPayload,
} from '@/lib/socket/events';
import { useSocket, useSocketEvent } from '@/providers/socket-provider';
import {
  syncManualUnreadStateCache,
  teamChatQueryKeys,
  upsertRoomDetailIntoRoomListCaches,
  withUnreadSummaryAggregates,
} from '../query/use-team-chat';
import { TeamChatService } from '../services/team-chat.service';
import type {
  TeamChatMessageAttachmentResponse,
  TeamChatMessageCursorResponse,
  TeamChatMessageReactionSummaryResponse,
  TeamChatNotificationsListResponse,
  TeamChatNotificationResponse,
  TeamChatPaginatedResponse,
  TeamChatPinnedMessageResponse,
  TeamChatRoomPinStateResponse,
  TeamChatUnreadSummaryResponse,
  TeamChatRoomAttachmentListResponse,
  TeamChatRoomAttachmentResponse,
  TeamChatRoomDetailResponse,
  TeamChatRoomMessageResponse,
  TeamChatRoomMutationSnapshotResponse,
  TeamChatPresenceResponse,
  TeamChatRoomSummaryResponse,
} from '../services/types/team-chat.types';
import {
  mergeRoomHistoryItems,
  mergeRoomHistoryMessage,
} from '../lib/team-chat-message-history.utils';
import { buildForwardedDisplayContentPreview } from '../lib/screen-controller/team-chat-controller-message.utils';

interface UseTeamChatRealtimeOptions {
  activeRoomId: string;
  subscribedRoomIds?: string[];
  organizationId?: string | null;
  enabled?: boolean;
  currentUserId?: string | null;
  isActiveRoomVisible?: boolean;
  onTypingStarted?: (payload: ChatTypingStartedPayload) => void;
  onTypingStopped?: (payload: ChatTypingStoppedPayload) => void;
  onMessageLinkPreviewUpdated?: (payload: ChatMessageLinkPreviewUpdatedPayload) => void;
  onMessageCreated?: (
    message: TeamChatRoomMessageResponse,
    payload: ChatMessageCreatedPayload,
  ) => void;
  onMessageUpdated?: (
    message: TeamChatRoomMessageResponse,
    payload: ChatMessageUpdatedPayload,
  ) => void;
  onMessageDeleted?: (payload: ChatMessageDeletedPayload) => void;
  onMessagePinUpdated?: (payload: ChatMessagePinUpdatedPayload) => void;
  onMessageReactionUpdated?: (payload: ChatMessageReactionUpdatedPayload) => void;
  onRoomReadStateUpdated?: (payload: ChatRoomReadStateUpdatedPayload) => void;
  onPersonalInboxRoomReadUpdated?: (
    payload: ChatPersonalInboxRoomReadUpdatedPayload,
  ) => void;
}

export function useTeamChatRealtime({
  activeRoomId,
  subscribedRoomIds = [],
  organizationId,
  enabled = true,
  currentUserId,
  isActiveRoomVisible = false,
  onTypingStarted,
  onTypingStopped,
  onMessageLinkPreviewUpdated,
  onMessageCreated,
  onMessageUpdated,
  onMessageDeleted,
  onMessagePinUpdated,
  onMessageReactionUpdated,
  onRoomReadStateUpdated,
  onPersonalInboxRoomReadUpdated,
}: UseTeamChatRealtimeOptions) {
  const REALTIME_FALLBACK_POLL_MS = 10_000;
  const queryClient = useQueryClient();
  const { emit, getStatus } = useSocket();
  const serviceCtx = useServiceContext();
  const service = useMemo(() => new TeamChatService(serviceCtx), [serviceCtx]);
  const chatSocketStatus = getStatus(SOCKET_NAMESPACES.CHAT);
  const notificationSocketStatus = getStatus(SOCKET_NAMESPACES.NOTIFICATIONS);
  const processedPinEventIdsRef = useRef<Record<string, Set<string>>>({});
  const processedIncomingUnreadMessageIdsRef = useRef<Record<string, Set<string>>>({});
  const subscribedRoomIdsRef = useRef<Set<string>>(new Set<string>());
  const subscribedOrganizationIdRef = useRef<string | null>(null);
  const roomDetailSyncInFlightRef = useRef(new Set<string>());
  const pendingRoomUnsubscribeTimersRef = useRef<Record<string, number>>({});
  const ROOM_UNSUBSCRIBE_GRACE_MS = 15_000;
  const toUnixTimestamp = (value?: string | null) => {
    if (!value) return 0;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const normalizePinActionCandidate = (value: unknown): 'pinned' | 'unpinned' | null => {
    if (typeof value !== 'string') return null;
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === 'unpinned') return 'unpinned';
    if (normalizedValue === 'pinned') return 'pinned';
    return null;
  };

  const readCachedRoomPinState = (roomId: string) =>
    queryClient.getQueryData<TeamChatRoomPinStateResponse | undefined>(
      teamChatQueryKeys.roomPinState(roomId),
    );

  const syncRoomPinStateCache = (payload: ChatMessagePinUpdatedPayload) => {
    queryClient.setQueryData<TeamChatRoomPinStateResponse>(
      teamChatQueryKeys.roomPinState(payload.roomId),
      (current) => ({
        roomId: payload.roomId,
        roomPinVersion:
          typeof payload.roomPinVersion === 'number'
            ? payload.roomPinVersion
            : current?.roomPinVersion ?? 0,
        pinnedCount:
          typeof payload.pinnedCount === 'number'
            ? payload.pinnedCount
            : current?.pinnedCount ?? 0,
        updatedAt: payload.occurredAt ?? current?.updatedAt ?? null,
        lastEventId:
          typeof payload.eventId === 'string' && payload.eventId.trim().length > 0
            ? payload.eventId.trim()
            : current?.lastEventId ?? null,
      }),
    );
  };

  const hasProcessedPinEvent = (roomId: string, eventId?: string) => {
    const normalizedEventId = typeof eventId === 'string' ? eventId.trim() : '';
    if (!normalizedEventId) return false;
    return processedPinEventIdsRef.current[roomId]?.has(normalizedEventId) ?? false;
  };

  const rememberProcessedPinEvent = (roomId: string, eventId?: string) => {
    const normalizedEventId = typeof eventId === 'string' ? eventId.trim() : '';
    if (!normalizedEventId) return;

    const eventIdsForRoom =
      processedPinEventIdsRef.current[roomId] ??
      (processedPinEventIdsRef.current[roomId] = new Set<string>());
    eventIdsForRoom.add(normalizedEventId);

    if (eventIdsForRoom.size <= 100) return;
    const oldestEventId = eventIdsForRoom.values().next().value;
    if (typeof oldestEventId === 'string') {
      eventIdsForRoom.delete(oldestEventId);
    }
  };

  const hasProcessedIncomingUnreadMessage = (roomId: string, messageId?: string) => {
    const normalizedMessageId = typeof messageId === 'string' ? messageId.trim() : '';
    if (!normalizedMessageId) return false;
    return (
      processedIncomingUnreadMessageIdsRef.current[roomId]?.has(normalizedMessageId) ??
      false
    );
  };

  const rememberProcessedIncomingUnreadMessage = (roomId: string, messageId?: string) => {
    const normalizedMessageId = typeof messageId === 'string' ? messageId.trim() : '';
    if (!normalizedMessageId) return;

    const messageIdsForRoom =
      processedIncomingUnreadMessageIdsRef.current[roomId] ??
      (processedIncomingUnreadMessageIdsRef.current[roomId] = new Set<string>());
    messageIdsForRoom.add(normalizedMessageId);

    if (messageIdsForRoom.size <= 200) return;
    const oldestMessageId = messageIdsForRoom.values().next().value;
    if (typeof oldestMessageId === 'string') {
      messageIdsForRoom.delete(oldestMessageId);
    }
  };

  const resolveRealtimePinAction = (
    payload: ChatMessagePinUpdatedPayload,
  ): 'pinned' | 'unpinned' | null => {
    return normalizePinActionCandidate(payload.action);
  };

  const invalidateRoomQueries = (
    roomId?: string,
    options?: {
      includeMessageCursor?: boolean;
      includeRoomDetail?: boolean;
      includePinnedMessages?: boolean;
      includePrivateRoomDetails?: boolean;
      includeRooms?: boolean;
      includeDiscoverRooms?: boolean;
      includeUnreadSummary?: boolean;
    },
  ) => {
    if (!roomId) return;

    if (options?.includeMessageCursor ?? true) {
      void queryClient.invalidateQueries({
        queryKey: teamChatQueryKeys.messageCursorRoot(roomId),
      });
    }
    if (options?.includeRoomDetail ?? true) {
      void queryClient.invalidateQueries({
        queryKey: teamChatQueryKeys.roomDetail(roomId),
      });
    }
    if (options?.includePinnedMessages ?? true) {
      void queryClient.invalidateQueries({
        queryKey: teamChatQueryKeys.pinnedMessages(roomId),
      });
    }
    if (options?.includePrivateRoomDetails ?? true) {
      void queryClient.invalidateQueries({
        queryKey: teamChatQueryKeys.privateRoomDetailsRoot(),
      });
    }
    if (options?.includeRooms ?? true) {
      void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.rooms() });
    }
    if (options?.includeDiscoverRooms ?? true) {
      void queryClient.invalidateQueries({
        queryKey: teamChatQueryKeys.discoverRoomsRoot(),
      });
    }
    if (options?.includeUnreadSummary ?? true) {
      void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.unreadSummary() });
    }
  };

  const sortRoomSummariesByRecentActivity = (rooms: TeamChatRoomSummaryResponse[]) =>
    [...rooms].sort((left, right) => {
      const leftRecent = toUnixTimestamp(left.lastMessageAt ?? left.updatedAt ?? null);
      const rightRecent = toUnixTimestamp(right.lastMessageAt ?? right.updatedAt ?? null);
      if (leftRecent !== rightRecent) return rightRecent - leftRecent;

      const leftUpdatedAt = toUnixTimestamp(left.updatedAt ?? null);
      const rightUpdatedAt = toUnixTimestamp(right.updatedAt ?? null);
      if (leftUpdatedAt !== rightUpdatedAt) return rightUpdatedAt - leftUpdatedAt;

      return right.id.localeCompare(left.id);
    });

  const resolveRealtimeMessageSnippet = (message: ChatRealtimeMessage) => {
    const normalizedContent = message.content.trim();
    if (normalizedContent) return normalizedContent;
    if (Array.isArray(message.attachments) && message.attachments.length > 0) {
      const firstAttachmentName = message.attachments[0]?.fileName?.trim();
      return firstAttachmentName || 'Sent an attachment';
    }
    if (message.messageType === 'system') {
      return normalizedContent || 'System message';
    }
    return '';
  };

  const readCachedRoomSummaryForUnread = (roomId: string) => {
    const roomDetail = queryClient.getQueryData<TeamChatRoomDetailResponse | undefined>(
      teamChatQueryKeys.roomDetail(roomId),
    );
    if (roomDetail) {
      return {
        roomName: roomDetail.name || roomDetail.roomKey || '',
        roomType: roomDetail.roomType,
        lastMessageAt: roomDetail.lastMessageAt ?? null,
      };
    }

    const privateRoomCaches = queryClient.getQueriesData<
      Record<string, TeamChatRoomDetailResponse | null> | undefined
    >({
      queryKey: teamChatQueryKeys.privateRoomDetailsRoot(),
    });
    for (const [, privateRoomMap] of privateRoomCaches) {
      const privateRoom = privateRoomMap?.[roomId];
      if (!privateRoom) continue;
      return {
        roomName: privateRoom.name || privateRoom.roomKey || '',
        roomType: privateRoom.roomType,
        lastMessageAt: privateRoom.lastMessageAt ?? null,
      };
    }

    const cachedRoomLists = queryClient.getQueriesData<
      TeamChatPaginatedResponse<TeamChatRoomSummaryResponse> | undefined
    >({
      queryKey: teamChatQueryKeys.rooms(),
    });
    for (const [, pagedRooms] of cachedRoomLists) {
      const matchedRoom = pagedRooms?.data?.find((room) => room.id === roomId);
      if (!matchedRoom) continue;
      return {
        roomName: matchedRoom.name || matchedRoom.roomKey || '',
        roomType: matchedRoom.roomType,
        lastMessageAt: matchedRoom.lastMessageAt ?? null,
      };
    }

    return null;
  };

  const hasRoomInAnyListCache = (roomId: string) => {
    const normalizedRoomId = roomId.trim();
    if (!normalizedRoomId) return false;

    const cachedRoomLists = queryClient.getQueriesData<
      TeamChatPaginatedResponse<TeamChatRoomSummaryResponse> | undefined
    >({
      queryKey: [...teamChatQueryKeys.rooms(), 'list'],
    });

    return cachedRoomLists.some(([, pagedRooms]) =>
      Boolean(pagedRooms?.data?.some((room) => room.id === normalizedRoomId)),
    );
  };

  const syncRoomDetailIntoSidebarCache = (
    roomId: string,
    options?: {
      includeMembers?: boolean;
      forceRefresh?: boolean;
    },
  ) => {
    const normalizedRoomId = roomId.trim();
    if (!normalizedRoomId) return;
    if (!options?.forceRefresh && hasRoomInAnyListCache(normalizedRoomId)) return;

    const includeMembers = Boolean(options?.includeMembers);
    const syncKey = `${normalizedRoomId}:${includeMembers ? 'members' : 'base'}`;
    if (roomDetailSyncInFlightRef.current.has(syncKey)) return;

    roomDetailSyncInFlightRef.current.add(syncKey);

    void (async () => {
      try {
        const roomDetail = await service.getRoomDetail(normalizedRoomId, {
          includeMembers,
        });
        upsertRoomDetailIntoRoomListCaches(queryClient, roomDetail);
      } catch {
        // Ignore transient hydration errors; next interaction will retry naturally.
      } finally {
        roomDetailSyncInFlightRef.current.delete(syncKey);
      }
    })();
  };

  const syncRoomMessageFallbackCaches = (payload: ChatMessageCreatedPayload) => {
    if (
      payload.roomDelta &&
      payload.roomDelta.lastMessageSnippet !== undefined &&
      payload.roomDelta.lastMessageAt !== undefined
    ) {
      return false;
    }

    const messageSnippet = resolveRealtimeMessageSnippet(payload.message);
    const fallbackLastMessageAt = payload.roomDelta?.lastMessageAt ?? payload.message.sentAt ?? null;
    const shouldPatchSnippet = messageSnippet.length > 0;
    const shouldPatchTimestamp = Boolean(fallbackLastMessageAt);

    if (!shouldPatchSnippet && !shouldPatchTimestamp) {
      return false;
    }

    let hasChanged = false;

    queryClient.setQueriesData<TeamChatPaginatedResponse<TeamChatRoomSummaryResponse> | undefined>(
      { queryKey: teamChatQueryKeys.rooms() },
      (current) => {
        if (!current?.data?.length) return current;

        let didChangeCurrentList = false;
        const nextData = current.data.map((room) => {
          if (room.id !== payload.roomId) return room;
          didChangeCurrentList = true;
          hasChanged = true;
          return {
            ...room,
            ...(shouldPatchTimestamp ? { lastMessageAt: fallbackLastMessageAt } : {}),
            ...(shouldPatchSnippet ? { lastMessageSnippet: messageSnippet } : {}),
            ...(shouldPatchTimestamp ? { updatedAt: fallbackLastMessageAt ?? room.updatedAt } : {}),
          };
        });

        if (!didChangeCurrentList) return current;

        return {
          ...current,
          data: sortRoomSummariesByRecentActivity(nextData),
        };
      },
    );

    queryClient.setQueryData<TeamChatRoomDetailResponse | undefined>(
      teamChatQueryKeys.roomDetail(payload.roomId),
      (current) =>
        current
          ? {
              ...current,
              ...(shouldPatchTimestamp ? { lastMessageAt: fallbackLastMessageAt } : {}),
              ...(shouldPatchSnippet ? { lastMessageSnippet: messageSnippet } : {}),
              ...(shouldPatchTimestamp
                ? { updatedAt: fallbackLastMessageAt ?? current.updatedAt }
                : {}),
            }
          : current,
    );

    queryClient.setQueriesData<Record<string, TeamChatRoomDetailResponse | null> | undefined>(
      { queryKey: teamChatQueryKeys.privateRoomDetailsRoot() },
      (current) => {
        if (!current || typeof current !== 'object' || Array.isArray(current)) {
          return current;
        }

        const currentRoom = current[payload.roomId];
        if (!currentRoom) return current;
        hasChanged = true;

        return {
          ...current,
          [payload.roomId]: {
            ...currentRoom,
            ...(shouldPatchTimestamp ? { lastMessageAt: fallbackLastMessageAt } : {}),
            ...(shouldPatchSnippet ? { lastMessageSnippet: messageSnippet } : {}),
            ...(shouldPatchTimestamp
              ? { updatedAt: fallbackLastMessageAt ?? currentRoom.updatedAt }
              : {}),
          },
        };
      },
    );

    return hasChanged;
  };

  const syncRoomDeltaCaches = (
    roomDelta?: ChatMessageCreatedPayload['roomDelta'],
  ) => {
    if (!roomDelta?.roomId || roomDelta.shouldRefreshRoomSummary) {
      return false;
    }

    queryClient.setQueriesData<TeamChatPaginatedResponse<TeamChatRoomSummaryResponse> | undefined>(
      { queryKey: teamChatQueryKeys.rooms() },
      (current) => {
        if (!current?.data?.length) return current;

        let hasChanged = false;
        const nextData = current.data.map((room) => {
          if (room.id !== roomDelta.roomId) return room;
          hasChanged = true;
          return {
            ...room,
            ...(roomDelta.lastMessageAt !== undefined
              ? { lastMessageAt: roomDelta.lastMessageAt ?? null }
              : {}),
            ...(roomDelta.lastMessageSnippet !== undefined
              ? { lastMessageSnippet: roomDelta.lastMessageSnippet ?? null }
              : {}),
            ...(roomDelta.lastMessageAt !== undefined
              ? { updatedAt: roomDelta.lastMessageAt ?? room.updatedAt }
              : {}),
          };
        });

        if (!hasChanged) return current;

        return {
          ...current,
          data: sortRoomSummariesByRecentActivity(nextData),
        };
      },
    );

    queryClient.setQueryData<TeamChatRoomDetailResponse | undefined>(
      teamChatQueryKeys.roomDetail(roomDelta.roomId),
      (current) =>
        current
          ? {
              ...current,
              ...(roomDelta.lastMessageAt !== undefined
                ? { lastMessageAt: roomDelta.lastMessageAt ?? null }
                : {}),
              ...(roomDelta.lastMessageSnippet !== undefined
                ? { lastMessageSnippet: roomDelta.lastMessageSnippet ?? null }
                : {}),
              ...(roomDelta.lastMessageAt !== undefined
                ? { updatedAt: roomDelta.lastMessageAt ?? current.updatedAt }
                : {}),
            }
          : current,
    );

    queryClient.setQueriesData<Record<string, TeamChatRoomDetailResponse | null> | undefined>(
      { queryKey: teamChatQueryKeys.privateRoomDetailsRoot() },
      (current) => {
        if (!current || typeof current !== 'object' || Array.isArray(current)) {
          return current;
        }

        const currentRoom = current[roomDelta.roomId];
        if (!currentRoom) return current;

        return {
          ...current,
          [roomDelta.roomId]: {
            ...currentRoom,
            ...(roomDelta.lastMessageAt !== undefined
              ? { lastMessageAt: roomDelta.lastMessageAt ?? null }
              : {}),
            ...(roomDelta.lastMessageSnippet !== undefined
              ? { lastMessageSnippet: roomDelta.lastMessageSnippet ?? null }
              : {}),
            ...(roomDelta.lastMessageAt !== undefined
              ? { updatedAt: roomDelta.lastMessageAt ?? currentRoom.updatedAt }
              : {}),
          },
        };
      },
    );

    return true;
  };

  const syncUnreadSummaryFromRealtime = (payload: ChatRoomReadStateUpdatedPayload) => {
    if (currentUserId?.trim() && payload.userId !== currentUserId.trim()) {
      return;
    }

    queryClient.setQueryData<TeamChatUnreadSummaryResponse | undefined>(
      teamChatQueryKeys.unreadSummary(),
      (current) => {
        if (!current?.rooms) return current;

        const currentRoom = current.rooms.find((room) => room.roomId === payload.roomId);
        const previousUnreadCount = currentRoom?.unreadCount ?? 0;
        const nextRoom = {
          roomId: payload.roomId,
          roomName: currentRoom?.roomName ?? '',
          roomType: currentRoom?.roomType ?? 'channel',
          unreadCount: payload.unreadCount,
          lastReadMessageId: payload.lastReadMessageId ?? null,
          lastReadAt: payload.lastReadAt ?? null,
          lastMessageAt: currentRoom?.lastMessageAt ?? null,
        };
        const nextRooms = current.rooms.some((room) => room.roomId === payload.roomId)
          ? current.rooms.map((room) => (room.roomId === payload.roomId ? nextRoom : room))
          : [...current.rooms, nextRoom];

        return withUnreadSummaryAggregates({
          ...current,
          totalUnread: Math.max(
            0,
            current.totalUnread - previousUnreadCount + payload.unreadCount,
          ),
          rooms: nextRooms,
        });
      },
    );
  };

  const syncUnreadSummaryFromMessageCreated = (payload: ChatMessageCreatedPayload) => {
    const normalizedCurrentUserId = currentUserId?.trim();
    if (normalizedCurrentUserId && payload.message.senderId.trim() === normalizedCurrentUserId) {
      return false;
    }
    if (isActiveRoomVisible && activeRoomId && payload.roomId === activeRoomId) {
      return false;
    }
    if (hasProcessedIncomingUnreadMessage(payload.roomId, payload.message.id)) {
      return true;
    }
    let didSyncUnreadSummary = false;

    queryClient.setQueryData<TeamChatUnreadSummaryResponse | undefined>(
      teamChatQueryKeys.unreadSummary(),
      (current) => {
        if (!current?.rooms) return current;
        didSyncUnreadSummary = true;

        const currentRoom = current.rooms.find((room) => room.roomId === payload.roomId);
        const previousUnreadCount = currentRoom?.unreadCount ?? 0;
        const cachedRoomSnapshot = readCachedRoomSummaryForUnread(payload.roomId);
        const nextUnreadCount = previousUnreadCount + 1;
        const nextRoom = {
          roomId: payload.roomId,
          roomName: currentRoom?.roomName || cachedRoomSnapshot?.roomName || '',
          roomType: currentRoom?.roomType ?? cachedRoomSnapshot?.roomType ?? 'channel',
          unreadCount: nextUnreadCount,
          lastReadMessageId: currentRoom?.lastReadMessageId ?? null,
          lastReadAt: currentRoom?.lastReadAt ?? null,
          lastMessageAt:
            payload.roomDelta?.lastMessageAt ??
            payload.message.sentAt ??
            currentRoom?.lastMessageAt ??
            cachedRoomSnapshot?.lastMessageAt ??
            null,
        };
        const nextRooms = current.rooms.some((room) => room.roomId === payload.roomId)
          ? current.rooms.map((room) => (room.roomId === payload.roomId ? nextRoom : room))
          : [...current.rooms, nextRoom];

        return withUnreadSummaryAggregates({
          ...current,
          totalUnread: Math.max(
            0,
            current.totalUnread - previousUnreadCount + nextUnreadCount,
          ),
          rooms: nextRooms,
        });
      },
    );

    if (didSyncUnreadSummary) {
      rememberProcessedIncomingUnreadMessage(payload.roomId, payload.message.id);
    }

    return didSyncUnreadSummary;
  };

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  const toNonEmptyString = (value: unknown) => {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  };

  const resolveNotificationReadState = (
    notification: Pick<TeamChatNotificationResponse, 'read' | 'isRead'>,
  ) => {
    if (typeof notification.read === 'boolean') return notification.read;
    return Boolean(notification.isRead);
  };

  const resolveNotificationOrganizationId = (
    notification: Pick<TeamChatNotificationResponse, 'data'>,
  ) =>
    toNonEmptyString(notification.data?.organizationId) ??
    toNonEmptyString(notification.data?.orgId) ??
    null;

  const normalizeRealtimeNotificationPayload = (
    payload: NotificationRealtimePayload,
  ): TeamChatNotificationResponse | null => {
    const notificationId = toNonEmptyString(payload.id);
    const notificationType = toNonEmptyString(payload.type);
    const createdAt = toNonEmptyString(payload.createdAt);
    if (!notificationId || !notificationType || !createdAt) return null;

    const notificationReadState =
      typeof payload.isRead === 'boolean'
        ? payload.isRead
        : typeof payload.read === 'boolean'
          ? payload.read
          : false;
    const payloadData = isRecord(payload.data) ? payload.data : undefined;
    const senderActorId = toNonEmptyString(payload.sender?.id);
    const senderActorName = toNonEmptyString(payload.sender?.name);
    const senderActorAvatarUrl = toNonEmptyString(payload.sender?.avatarUrl ?? undefined);

    return {
      id: notificationId,
      userId: toNonEmptyString(currentUserId) ?? '',
      title: payload.title,
      message: payload.message,
      type: notificationType,
      read: notificationReadState,
      isRead: notificationReadState,
      data: payloadData
        ? {
            ...payloadData,
            actorUserId: toNonEmptyString(payloadData.actorUserId) ?? senderActorId,
            actorName: toNonEmptyString(payloadData.actorName) ?? senderActorName,
            actorAvatarUrl:
              toNonEmptyString(payloadData.actorAvatarUrl) ?? senderActorAvatarUrl,
          }
        : senderActorId || senderActorName || senderActorAvatarUrl
          ? {
              ...(senderActorId ? { actorUserId: senderActorId } : {}),
              ...(senderActorName ? { actorName: senderActorName } : {}),
              ...(senderActorAvatarUrl ? { actorAvatarUrl: senderActorAvatarUrl } : {}),
            }
          : undefined,
      createdAt,
    };
  };

  const mergeNotificationPayload = (
    current: TeamChatNotificationResponse,
    incoming: TeamChatNotificationResponse,
  ): TeamChatNotificationResponse => ({
    ...current,
    ...incoming,
    userId: toNonEmptyString(incoming.userId) ?? current.userId,
    title: toNonEmptyString(incoming.title) ?? current.title,
    message: toNonEmptyString(incoming.message) ?? current.message,
    type: toNonEmptyString(incoming.type) ?? current.type,
    read: resolveNotificationReadState(incoming),
    isRead: resolveNotificationReadState(incoming),
    data:
      current.data || incoming.data
        ? {
            ...(current.data ?? {}),
            ...(incoming.data ?? {}),
          }
        : undefined,
    createdAt: toNonEmptyString(incoming.createdAt) ?? current.createdAt,
  });

  const patchNotificationCollection = (
    current: TeamChatNotificationsListResponse | undefined,
    notification: TeamChatNotificationResponse,
    mode: 'new' | 'updated',
  ): TeamChatNotificationsListResponse | undefined => {
    if (Array.isArray(current)) {
      const currentItems = current;
      const existingIndex = currentItems.findIndex((item) => item.id === notification.id);
      if (existingIndex < 0) {
        return mode === 'new' ? [notification, ...currentItems] : current;
      }

      const mergedNotification = mergeNotificationPayload(currentItems[existingIndex], notification);
      return mode === 'new'
        ? [mergedNotification, ...currentItems.filter((item) => item.id !== notification.id)]
        : currentItems.map((item) => (item.id === notification.id ? mergedNotification : item));
    }

    if (!current || typeof current !== 'object') return current;

    if ('data' in current && Array.isArray(current.data)) {
      const currentItems = current.data;
      const existingIndex = currentItems.findIndex((item) => item.id === notification.id);
      const previousUnreadCount = currentItems.reduce(
        (count, item) => count + (resolveNotificationReadState(item) ? 0 : 1),
        0,
      );

      let nextItems = currentItems;
      let totalDelta = 0;
      if (existingIndex < 0) {
        if (mode === 'updated') return current;
        nextItems = [notification, ...currentItems];
        totalDelta = 1;
      } else {
        const mergedNotification = mergeNotificationPayload(currentItems[existingIndex], notification);
        nextItems =
          mode === 'new'
            ? [mergedNotification, ...currentItems.filter((item) => item.id !== notification.id)]
            : currentItems.map((item) =>
                item.id === notification.id ? mergedNotification : item,
              );
      }

      const nextUnreadCount = nextItems.reduce(
        (count, item) => count + (resolveNotificationReadState(item) ? 0 : 1),
        0,
      );
      const unreadDelta = nextUnreadCount - previousUnreadCount;
      const nextValue: Record<string, unknown> = {
        ...current,
        data: nextItems,
      };

      if ('unreadCount' in current && typeof current.unreadCount === 'number') {
        nextValue.unreadCount = Math.max(0, current.unreadCount + unreadDelta);
      }
      if ('total' in current && typeof current.total === 'number') {
        nextValue.total = Math.max(0, current.total + totalDelta);
      }

      return nextValue as TeamChatNotificationsListResponse;
    }

    if ('items' in current && Array.isArray(current.items)) {
      const currentItems = current.items;
      const existingIndex = currentItems.findIndex((item) => item.id === notification.id);
      if (existingIndex < 0) {
        if (mode === 'updated') return current;
        return {
          ...current,
          items: [notification, ...currentItems],
        };
      }

      const mergedNotification = mergeNotificationPayload(currentItems[existingIndex], notification);
      return {
        ...current,
        items:
          mode === 'new'
            ? [mergedNotification, ...currentItems.filter((item) => item.id !== notification.id)]
            : currentItems.map((item) =>
                item.id === notification.id ? mergedNotification : item,
              ),
      };
    }

    return current;
  };

  const syncNotificationFeedCache = (
    payload: NotificationRealtimePayload,
    mode: 'new' | 'updated',
  ) => {
    const normalizedNotification = normalizeRealtimeNotificationPayload(payload);
    if (!normalizedNotification) return false;

    const notificationOrganizationId = resolveNotificationOrganizationId(normalizedNotification);
    if (organizationId && notificationOrganizationId && notificationOrganizationId !== organizationId) {
      return false;
    }

    const cachedNotificationQueries = queryClient.getQueriesData<
      TeamChatNotificationsListResponse | undefined
    >({
      queryKey: teamChatQueryKeys.notificationsRoot(),
    });

    let didPatch = false;
    cachedNotificationQueries.forEach(([queryKey, current]) => {
      const queryTenantId =
        Array.isArray(queryKey) && typeof queryKey[2] === 'string'
          ? queryKey[2]
          : undefined;

      if (queryTenantId && queryTenantId !== 'global') {
        if (organizationId && queryTenantId !== organizationId) return;
        if (notificationOrganizationId && queryTenantId !== notificationOrganizationId) return;
      }

      const next = patchNotificationCollection(current, normalizedNotification, mode);
      if (next === current) return;

      didPatch = true;
      queryClient.setQueryData(queryKey, next);
    });

    return didPatch;
  };

  const normalizeContentFormat = (
    value: unknown,
  ): TeamChatRoomMessageResponse['contentFormat'] => {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'plain_text') return 'plain_text';
    if (normalized === 'rich_text_v1') return 'rich_text_v1';
    return null;
  };

  const normalizeRichContentPayload = (
    value: unknown,
  ): TeamChatRoomMessageResponse['richContent'] => {
    if (value === null) return null;
    if (!isRecord(value)) return null;
    return value;
  };

  const parseConversationKeyRoomId = (conversationKey: unknown) => {
    const normalizedConversationKey = toNonEmptyString(conversationKey);
    if (!normalizedConversationKey) return undefined;

    const separatorIndex = normalizedConversationKey.indexOf(':');
    if (separatorIndex < 0) return undefined;

    return toNonEmptyString(normalizedConversationKey.slice(separatorIndex + 1));
  };

  const resolveMergedForwardedSnapshot = (
    message: Pick<TeamChatRoomMessageResponse, 'forwardedSnapshot' | 'metadata'>,
  ): Record<string, unknown> | undefined => {
    const rootSnapshot = isRecord(message.forwardedSnapshot)
      ? message.forwardedSnapshot
      : undefined;
    const metadataSnapshotRaw = isRecord(message.metadata)
      ? message.metadata['forwardedSnapshot']
      : undefined;
    const metadataSnapshot = isRecord(metadataSnapshotRaw)
      ? metadataSnapshotRaw
      : undefined;

    if (rootSnapshot && metadataSnapshot) {
      return {
        ...metadataSnapshot,
        ...rootSnapshot,
      };
    }

    return rootSnapshot ?? metadataSnapshot;
  };

  const findCachedRoomMessage = (roomId: string, messageId: string) => {
    const cachedCursors = queryClient.getQueriesData<TeamChatMessageCursorResponse>({
      queryKey: teamChatQueryKeys.messageCursorRoot(roomId),
    });

    for (const [, cursor] of cachedCursors) {
      const cachedMessage = cursor?.items?.find((item) => item.id === messageId);
      if (cachedMessage) return cachedMessage;
    }

    return null;
  };

  const hydrateRealtimeMessagePayload = (message: ChatRealtimeMessage): ChatRealtimeMessage => {
    let nextMessage = message;

    if (!nextMessage.replyPreview && nextMessage.parentMessageId) {
      const parentMessage = findCachedRoomMessage(nextMessage.roomId, nextMessage.parentMessageId);
      if (parentMessage) {
        nextMessage = {
          ...nextMessage,
          replyPreview: {
            id: parentMessage.id,
            content: parentMessage.content,
            senderId: parentMessage.senderId,
            senderEmail: parentMessage.senderEmail,
            senderFirstName: parentMessage.senderFirstName,
            senderLastName: parentMessage.senderLastName,
            senderAvatarUrl: parentMessage.senderAvatarUrl,
            sentAt: parentMessage.sentAt,
          },
        };
      }
    }

    const metadata = isRecord(nextMessage.metadata) ? nextMessage.metadata : undefined;
    const forwardedFromMessageId = toNonEmptyString(metadata?.['forwardedFromMessageId']);
    const existingForwardedSnapshot = resolveMergedForwardedSnapshot(
      nextMessage as Pick<TeamChatRoomMessageResponse, 'forwardedSnapshot' | 'metadata'>,
    );
    if (!existingForwardedSnapshot && forwardedFromMessageId) {
      const forwardedFromRoomId =
        toNonEmptyString(metadata?.['forwardedFromRoomId']) ??
        parseConversationKeyRoomId(metadata?.['forwardedFromConversationKey']) ??
        nextMessage.roomId;
      const sourceMessage = findCachedRoomMessage(forwardedFromRoomId, forwardedFromMessageId);
      if (sourceMessage) {
        const sourceForwardedSnapshot = resolveMergedForwardedSnapshot(sourceMessage);
        const sourceForwardedOriginalContent =
          toNonEmptyString(sourceForwardedSnapshot?.['originalContent']) ??
          undefined;
        const resolvedOriginalContent =
          buildForwardedDisplayContentPreview(
            sourceMessage.content,
            sourceForwardedOriginalContent,
            { enableLegacyStrip: true },
          ) || sourceMessage.content;
        const usesSourceMessageBody = resolvedOriginalContent === sourceMessage.content;
        const resolvedOriginalContentFormat = usesSourceMessageBody
          ? normalizeContentFormat(sourceMessage.contentFormat)
          : normalizeContentFormat(sourceForwardedSnapshot?.['originalContentFormat']) ??
            normalizeContentFormat(sourceMessage.contentFormat);
        const resolvedOriginalRichContent = usesSourceMessageBody
          ? normalizeRichContentPayload(sourceMessage.richContent)
          : normalizeRichContentPayload(sourceForwardedSnapshot?.['originalRichContent']) ??
            normalizeRichContentPayload(sourceMessage.richContent);

        nextMessage = {
          ...nextMessage,
          forwardedSnapshot: {
            originalMessageId: sourceMessage.id,
            originalContent: resolvedOriginalContent,
            originalContentFormat: resolvedOriginalContentFormat,
            originalRichContent: resolvedOriginalRichContent,
            originalSenderId: sourceMessage.senderId,
            originalSenderEmail: sourceMessage.senderEmail,
            originalSenderFirstName: sourceMessage.senderFirstName,
            originalSenderLastName: sourceMessage.senderLastName,
            originalSenderAvatarUrl: sourceMessage.senderAvatarUrl,
            originalSentAt: sourceMessage.sentAt,
            sourceConversationKey: toNonEmptyString(metadata?.['forwardedFromConversationKey']) ?? null,
            sourceConversationLabel:
              toNonEmptyString(metadata?.['forwardedFromConversationLabel']) ?? null,
            attachments: sourceMessage.attachments?.map((attachment) => ({
              attachmentType: attachment.attachmentType,
              fileName: attachment.fileName,
              fileUrl: attachment.fileUrl,
              mimeType: attachment.mimeType,
            })),
          },
        };
      }
    }

    return nextMessage;
  };

  const normalizeRealtimeMessage = (
    message: ChatRealtimeMessage,
  ): TeamChatRoomMessageResponse => ({
    id: message.id,
    roomId: message.roomId,
    organizationId: message.organizationId,
    senderId: message.senderId,
    messageType: message.messageType as TeamChatRoomMessageResponse['messageType'],
    content: message.content,
    contentFormat: normalizeContentFormat(message.contentFormat),
    richContent: normalizeRichContentPayload(message.richContent),
    metadata: message.metadata ?? null,
    clientMessageId: message.clientMessageId ?? null,
    parentMessageId: message.parentMessageId ?? null,
    threadRootMessageId: message.threadRootMessageId ?? null,
    replyPreview: message.replyPreview ?? null,
    forwardedSnapshot:
      (message.forwardedSnapshot as TeamChatRoomMessageResponse['forwardedSnapshot']) ?? null,
    isEdited: Boolean(message.isEdited),
    isDeleted: Boolean(message.isDeleted),
    sentAt: message.sentAt,
    senderEmail: message.senderEmail ?? null,
    senderFirstName: message.senderFirstName ?? null,
    senderLastName: message.senderLastName ?? null,
    senderAvatarUrl: message.senderAvatarUrl ?? null,
    attachments:
      message.attachments as TeamChatRoomMessageResponse['attachments'] | undefined,
    linkPreviews:
      message.linkPreviews as TeamChatRoomMessageResponse['linkPreviews'] | undefined,
    reactionSummaries: [],
  });

  const isForwardMessage = (
    message?: Pick<TeamChatRoomMessageResponse, 'metadata'> | null,
  ) => {
    if (!message || !isRecord(message.metadata)) return false;
    return toNonEmptyString(message.metadata['source']) === 'forward';
  };

  const syncAttachmentsByMessageCaches = (
    roomId: string,
    messageId: string,
    attachments?: TeamChatMessageAttachmentResponse[],
  ) => {
    if (!Array.isArray(attachments)) return;

    queryClient.setQueriesData<Record<string, TeamChatMessageAttachmentResponse[]>>(
      {
        queryKey: ['teamChat', 'attachments-by-message', roomId],
      },
      (previous) => ({
        ...(previous ?? {}),
        [messageId]: attachments,
      }),
    );

    queryClient.setQueryData<TeamChatMessageAttachmentResponse[]>(
      teamChatQueryKeys.messageAttachments(roomId, messageId),
      attachments,
    );
  };

  const syncRealtimeMessageCreatedCache = (payload: ChatMessageCreatedPayload) => {
    const nextMessage = normalizeRealtimeMessage(hydrateRealtimeMessagePayload(payload.message));

    queryClient.setQueriesData<TeamChatMessageCursorResponse>(
      {
        queryKey: teamChatQueryKeys.messageCursorRoot(payload.roomId),
      },
      (previous) => {
        if (!previous) return previous;

        const currentItems = Array.isArray(previous.items) ? previous.items : [];
        const existingMessage = currentItems.find(
          (message) =>
            message.id === nextMessage.id ||
            (Boolean(nextMessage.clientMessageId) &&
              message.clientMessageId === nextMessage.clientMessageId),
        );
        const nextItems = mergeRoomHistoryItems(
          currentItems.filter(
            (message) =>
              message.id !== nextMessage.id &&
              (!nextMessage.clientMessageId ||
                message.clientMessageId !== nextMessage.clientMessageId),
          ),
          [
            existingMessage
              ? {
                  ...existingMessage,
                  ...nextMessage,
                  attachments: nextMessage.attachments ?? existingMessage.attachments,
                  linkPreviews: nextMessage.linkPreviews ?? existingMessage.linkPreviews,
                  reactionSummaries:
                    existingMessage.reactionSummaries ?? nextMessage.reactionSummaries,
                }
              : nextMessage,
          ],
        );

        return {
          ...previous,
          items: nextItems,
        };
      },
    );

    syncAttachmentsByMessageCaches(
      payload.roomId,
      nextMessage.id,
      nextMessage.attachments,
    );

    return nextMessage;
  };

  const syncRealtimeMessageUpdatedCache = (payload: ChatMessageUpdatedPayload) => {
    const nextMessage = normalizeRealtimeMessage(hydrateRealtimeMessagePayload(payload.message));

    queryClient.setQueriesData<TeamChatMessageCursorResponse>(
      {
        queryKey: teamChatQueryKeys.messageCursorRoot(payload.roomId),
      },
      (previous) => {
        if (!previous?.items?.length) return previous;

        const currentItems = previous.items;
        const existingMessage = currentItems.find(
          (message) =>
            message.id === nextMessage.id ||
            (Boolean(nextMessage.clientMessageId) &&
              message.clientMessageId === nextMessage.clientMessageId),
        );
        if (!existingMessage) return previous;

        const reconciledMessage = existingMessage
          ? {
              ...existingMessage,
              ...nextMessage,
              attachments: nextMessage.attachments ?? existingMessage.attachments,
              linkPreviews: nextMessage.linkPreviews ?? existingMessage.linkPreviews,
              reactionSummaries:
                existingMessage.reactionSummaries ?? nextMessage.reactionSummaries,
            }
          : nextMessage;
        const nextItems = mergeRoomHistoryItems(
          currentItems.filter(
            (message) =>
              message.id !== nextMessage.id &&
              (!nextMessage.clientMessageId ||
                message.clientMessageId !== nextMessage.clientMessageId),
          ),
          [reconciledMessage],
        );

        return {
          ...previous,
          items: nextItems,
        };
      },
    );

    queryClient.setQueryData<TeamChatPinnedMessageResponse[] | undefined>(
      teamChatQueryKeys.pinnedMessages(payload.roomId),
      (previous) => {
        if (!previous?.length) return previous;

        let hasChanged = false;
        const nextPinnedMessages = previous.map((item) => {
          if (item.messageId !== nextMessage.id) return item;
          hasChanged = true;
          return {
            ...item,
            message: mergeRoomHistoryMessage(item.message, nextMessage),
          };
        });

        return hasChanged ? nextPinnedMessages : previous;
      },
    );

    syncAttachmentsByMessageCaches(
      payload.roomId,
      nextMessage.id,
      nextMessage.attachments,
    );

    return nextMessage;
  };

  const syncRealtimeMessageDeletedCache = (payload: ChatMessageDeletedPayload) => {
    queryClient.setQueriesData<TeamChatMessageCursorResponse>(
      {
        queryKey: teamChatQueryKeys.messageCursorRoot(payload.roomId),
      },
      (previous) => {
        if (!previous?.items?.length) return previous;

        let hasChanged = false;
        const nextItems = previous.items.map((message) => {
          if (message.id !== payload.messageId) return message;
          hasChanged = true;
          return {
            ...message,
            isDeleted: payload.isDeleted ?? true,
            attachments: [],
            linkPreviews: [],
            reactionSummaries: [],
          };
        });

        if (!hasChanged) return previous;

        return {
          ...previous,
          items: nextItems,
        };
      },
    );
  };

  const sortReactionSummaries = (
    reactions: TeamChatMessageReactionSummaryResponse[],
  ): TeamChatMessageReactionSummaryResponse[] =>
    [...reactions].sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.emoji.localeCompare(right.emoji);
    });

  const resolveRealtimeReactedByMe = (payload: ChatMessageReactionUpdatedPayload) => {
    const normalizedCurrentUserId = currentUserId?.trim();
    if (!normalizedCurrentUserId || !Array.isArray(payload.reactorUserIds)) {
      return payload.reactedByMe;
    }

    return payload.reactorUserIds.some((userId) => userId === normalizedCurrentUserId);
  };

  const buildRealtimeReactionSummary = (
    payload: ChatMessageReactionUpdatedPayload,
  ): TeamChatMessageReactionSummaryResponse => {
    const normalizedReactors = payload.reactors?.map((reactor) => ({
      userId: reactor.userId,
      displayName: reactor.displayName ?? null,
      email: reactor.email ?? null,
      avatarUrl: reactor.avatarUrl ?? null,
      reactedAt: reactor.reactedAt ?? null,
    }));
    return {
      emoji: payload.emoji,
      count: payload.count,
      reactedByMe: resolveRealtimeReactedByMe(payload),
      reactors: normalizedReactors,
    };
  };

  const mergeReactionSummaryList = (
    currentReactions: TeamChatMessageReactionSummaryResponse[] | undefined,
    nextReaction: TeamChatMessageReactionSummaryResponse,
  ) => {
    const previousReaction = currentReactions?.find(
      (reaction) => reaction.emoji === nextReaction.emoji,
    );
    const resolvedReaction =
      nextReaction.count > 0 &&
      !(nextReaction.reactors?.length ?? 0) &&
      (previousReaction?.reactors?.length ?? 0) > 0
        ? {
            ...nextReaction,
            reactors: previousReaction?.reactors,
          }
        : nextReaction;

    const nextReactions = (currentReactions ?? []).filter(
      (reaction) => reaction.emoji !== nextReaction.emoji,
    );

    if (resolvedReaction.count > 0) {
      nextReactions.push(resolvedReaction);
    }

    return sortReactionSummaries(nextReactions);
  };

  const patchMessageReactionSummaries = (
    message: TeamChatMessageCursorResponse['items'][number],
    messageId: string,
    nextMessageReactions: TeamChatMessageReactionSummaryResponse[],
  ) =>
    message.id === messageId
      ? {
          ...message,
          reactionSummaries: nextMessageReactions,
        }
      : message;

  const syncRealtimeReactionCache = (payload: ChatMessageReactionUpdatedPayload) => {
    const nextReaction = buildRealtimeReactionSummary(payload);

    queryClient.setQueriesData<Record<string, TeamChatMessageReactionSummaryResponse[]>>(
      {
        queryKey: ['teamChat', 'reactions-by-message', payload.roomId],
      },
      (previous) => {
        if (!previous || typeof previous !== 'object' || Array.isArray(previous)) {
          return previous;
        }

        const currentMessageReactions = Array.isArray(previous[payload.messageId])
          ? previous[payload.messageId]
          : [];
        const nextMessageReactions = mergeReactionSummaryList(
          currentMessageReactions,
          nextReaction,
        );

        return {
          ...previous,
          [payload.messageId]: nextMessageReactions,
        };
      },
    );

    queryClient.setQueryData<TeamChatMessageReactionSummaryResponse[] | undefined>(
      teamChatQueryKeys.messageReactions(payload.roomId, payload.messageId),
      (previous) => mergeReactionSummaryList(previous, nextReaction),
    );

    queryClient.setQueriesData<TeamChatMessageCursorResponse>(
      {
        queryKey: teamChatQueryKeys.messageCursorRoot(payload.roomId),
      },
      (previous) => {
        if (!previous?.items?.length) return previous;

        let hasChanged = false;
        const nextItems = previous.items.map((message) => {
          if (message.id !== payload.messageId) return message;
          hasChanged = true;
          return patchMessageReactionSummaries(
            message,
            payload.messageId,
            mergeReactionSummaryList(message.reactionSummaries, nextReaction),
          );
        });

        if (!hasChanged) return previous;

        return {
          ...previous,
          items: nextItems,
        };
      },
    );

    queryClient.setQueryData<TeamChatPinnedMessageResponse[] | undefined>(
      teamChatQueryKeys.pinnedMessages(payload.roomId),
      (previous) => {
        if (!previous?.length) return previous;

        let hasChanged = false;
        const nextPinnedMessages = previous.map((item) => {
          if (item.messageId !== payload.messageId) return item;
          hasChanged = true;
          return {
            ...item,
            message: {
              ...item.message,
              reactionSummaries: mergeReactionSummaryList(
                item.message.reactionSummaries,
                nextReaction,
              ),
            },
          };
        });

        return hasChanged ? nextPinnedMessages : previous;
      },
    );
  };

  const syncRealtimePinCache = (
    payload: ChatMessagePinUpdatedPayload,
  ): 'patched' | 'ignored' | 'refetch' => {
    const normalizedAction = resolveRealtimePinAction(payload);
    if (normalizedAction !== 'pinned' && normalizedAction !== 'unpinned') {
      return 'refetch';
    }

    const localPinState = readCachedRoomPinState(payload.roomId);
    const localRoomPinVersion = localPinState?.roomPinVersion ?? null;
    const eventRoomPinVersion =
      typeof payload.roomPinVersion === 'number' ? payload.roomPinVersion : null;

    if (hasProcessedPinEvent(payload.roomId, payload.eventId)) {
      return 'ignored';
    }

    if (
      eventRoomPinVersion !== null &&
      localRoomPinVersion !== null &&
      eventRoomPinVersion <= localRoomPinVersion
    ) {
      rememberProcessedPinEvent(payload.roomId, payload.eventId);
      return 'ignored';
    }

    syncRoomPinStateCache(payload);

    let needsRefetch = false;
    let patched = false;
    queryClient.setQueryData<TeamChatPinnedMessageResponse[] | undefined>(
      teamChatQueryKeys.pinnedMessages(payload.roomId),
      (previous) => {
        if (!Array.isArray(previous) && normalizedAction === 'unpinned') {
          patched = true;
          return previous;
        }

        const currentPinnedMessages = Array.isArray(previous) ? previous : [];
        if (normalizedAction === 'unpinned') {
          const nextPinnedMessages = currentPinnedMessages.filter(
            (item) => item.messageId !== payload.messageId,
          );
          patched = true;
          return nextPinnedMessages.length === currentPinnedMessages.length
            ? currentPinnedMessages
            : nextPinnedMessages;
        }

        const existingPinnedMessage = currentPinnedMessages.find(
          (item) => item.messageId === payload.messageId,
        );
        if (existingPinnedMessage) {
          patched = true;
          return currentPinnedMessages.map((item) =>
            item.messageId !== payload.messageId
              ? item
              : {
                  ...item,
                  id: payload.pin?.id ?? item.id,
                  pinnedBy: payload.pin?.pinnedBy ?? payload.actorUserId ?? item.pinnedBy,
                  pinnedAt: payload.pin?.pinnedAt ?? payload.occurredAt ?? item.pinnedAt,
                },
          );
        }

        const cachedMessage = findCachedRoomMessage(payload.roomId, payload.messageId);
        if (!cachedMessage) {
          needsRefetch = true;
          return currentPinnedMessages;
        }

        patched = true;
        const nextPinnedMessage: TeamChatPinnedMessageResponse = {
          id: payload.pin?.id ?? `realtime-pin-${payload.messageId}`,
          roomId: payload.pin?.roomId ?? payload.roomId,
          messageId: payload.pin?.messageId ?? payload.messageId,
          pinnedBy: payload.pin?.pinnedBy ?? payload.actorUserId ?? cachedMessage.senderId,
          pinnedAt: payload.pin?.pinnedAt ?? payload.occurredAt ?? cachedMessage.sentAt,
          message: cachedMessage,
        };

        return [nextPinnedMessage, ...currentPinnedMessages];
      },
    );

    rememberProcessedPinEvent(payload.roomId, payload.eventId);
    if (needsRefetch) return 'refetch';
    return patched ? 'patched' : 'ignored';
  };

  const normalizeLinkPreviewUrlList = (value: unknown) =>
    Array.isArray(value)
      ? value
          .filter((entry): entry is string => typeof entry === 'string')
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0)
      : [];
  const buildLinkPreviewMetadataPatch = (payload: ChatMessageLinkPreviewUpdatedPayload) => {
    const pendingUrls = normalizeLinkPreviewUrlList(payload.metadata?.linkPreviewPendingUrls);
    const failedUrls = normalizeLinkPreviewUrlList(payload.metadata?.linkPreviewFailedUrls);
    const nextStatus =
      typeof payload.metadata?.linkPreviewStatus === 'string' && payload.metadata.linkPreviewStatus.trim().length > 0
        ? payload.metadata.linkPreviewStatus.trim()
        : payload.linkPreviews.length > 0
          ? failedUrls.length > 0
            ? 'partial'
            : 'ready'
          : failedUrls.length > 0
            ? 'failed'
            : pendingUrls.length > 0
              ? 'pending'
              : undefined;
    const nextVersion =
      typeof payload.metadata?.linkPreviewVersion === 'string' && payload.metadata.linkPreviewVersion.trim().length > 0
        ? payload.metadata.linkPreviewVersion.trim()
        : undefined;
    return {
      linkPreviewStatus: nextStatus,
      linkPreviewPendingUrls: pendingUrls,
      linkPreviewFailedUrls: failedUrls,
      linkPreviewVersion: nextVersion,
    };
  };
  const patchMessageCursorCache = (payload: ChatMessageLinkPreviewUpdatedPayload) => {
    queryClient.setQueriesData<TeamChatMessageCursorResponse>(
      {
        queryKey: teamChatQueryKeys.messageCursorRoot(payload.roomId),
      },
      (previous) => {
        if (!previous?.items?.length) return previous;

        let hasChanged = false;
        const nextItems = previous.items.map((message) => {
          if (message.id !== payload.messageId) return message;

          const nextLinkPreviewMetadata = buildLinkPreviewMetadataPatch(payload);
          hasChanged = true;
          return {
            ...message,
            linkPreviews: payload.linkPreviews,
            metadata: {
              ...(message.metadata ?? {}),
              ...(nextLinkPreviewMetadata.linkPreviewStatus
                ? { linkPreviewStatus: nextLinkPreviewMetadata.linkPreviewStatus }
                : {}),
              linkPreviewPendingUrls: nextLinkPreviewMetadata.linkPreviewPendingUrls,
              linkPreviewFailedUrls: nextLinkPreviewMetadata.linkPreviewFailedUrls,
              ...(nextLinkPreviewMetadata.linkPreviewVersion
                ? { linkPreviewVersion: nextLinkPreviewMetadata.linkPreviewVersion }
                : {}),
            },
          };
        });

        if (!hasChanged) return previous;

        return {
          ...previous,
          items: nextItems,
        };
      },
    );
  };

  type AttachmentPreviewPatch = Pick<
    TeamChatMessageAttachmentResponse,
    | 'attachmentType'
    | 'fileName'
    | 'fileUrl'
    | 'mimeType'
    | 'fileSize'
    | 'documentType'
    | 'previewStatus'
    | 'thumbnailUrl'
    | 'thumbnailUrlSmall'
    | 'thumbnailUrlMedium'
    | 'previewUrl'
    | 'openUrl'
    | 'downloadUrl'
    | 'previewWidth'
    | 'previewHeight'
    | 'previewPage'
    | 'pageCount'
    | 'previewUpdatedAt'
    | 'previewErrorCode'
    | 'previewVersion'
    | 'previewAssetSource'
  >;

  const normalizeAttachmentPreviewVersion = (value?: string | null) => {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  };

  const shouldApplyAttachmentPreviewUpdate = (
    currentPreviewVersion?: string | null,
    incomingPreviewVersion?: string | null,
  ) => {
    const currentVersion = normalizeAttachmentPreviewVersion(currentPreviewVersion);
    const incomingVersion = normalizeAttachmentPreviewVersion(incomingPreviewVersion);

    if (!incomingVersion) return true;
    return currentVersion !== incomingVersion;
  };

  const buildAttachmentPreviewPatch = (
    attachment: ChatMessageAttachmentPreviewUpdatedPayload['attachment'],
  ): AttachmentPreviewPatch => ({
    attachmentType: attachment.attachmentType as TeamChatMessageAttachmentResponse['attachmentType'],
    fileName: attachment.fileName,
    fileUrl: attachment.fileUrl,
    mimeType: attachment.mimeType ?? null,
    fileSize: attachment.fileSize ?? null,
    documentType: attachment.documentType as TeamChatMessageAttachmentResponse['documentType'],
    previewStatus: attachment.previewStatus as TeamChatMessageAttachmentResponse['previewStatus'],
    thumbnailUrl: attachment.thumbnailUrl ?? null,
    thumbnailUrlSmall: attachment.thumbnailUrlSmall ?? null,
    thumbnailUrlMedium: attachment.thumbnailUrlMedium ?? null,
    previewUrl: attachment.previewUrl ?? null,
    openUrl: attachment.openUrl ?? null,
    downloadUrl: attachment.downloadUrl ?? null,
    previewWidth: attachment.previewWidth ?? null,
    previewHeight: attachment.previewHeight ?? null,
    previewPage: attachment.previewPage ?? null,
    pageCount: attachment.pageCount ?? null,
    previewUpdatedAt: attachment.previewUpdatedAt ?? null,
    previewErrorCode: attachment.previewErrorCode ?? null,
    previewVersion: attachment.previewVersion ?? null,
    previewAssetSource: attachment.previewAssetSource ?? null,
  });

  const patchMessageAttachmentPreviewCache = (payload: ChatMessageAttachmentPreviewUpdatedPayload) => {
    const attachmentPatch = buildAttachmentPreviewPatch(payload.attachment);

    queryClient.setQueriesData<TeamChatMessageCursorResponse>(
      {
        queryKey: teamChatQueryKeys.messageCursorRoot(payload.roomId),
      },
      (previous) => {
        if (!previous?.items?.length) return previous;

        let hasChanged = false;
        const nextItems = previous.items.map((message) => {
          if (message.id !== payload.messageId || !Array.isArray(message.attachments)) return message;

          let attachmentChanged = false;
          const nextAttachments = message.attachments.map((attachment) => {
            if (attachment.id !== payload.attachmentId) return attachment;
            if (!shouldApplyAttachmentPreviewUpdate(attachment.previewVersion, payload.attachment.previewVersion)) {
              return attachment;
            }

            attachmentChanged = true;
            return {
              ...attachment,
              ...attachmentPatch,
            };
          });

          if (!attachmentChanged) return message;
          hasChanged = true;
          return {
            ...message,
            attachments: nextAttachments,
          };
        });

        if (!hasChanged) return previous;

        return {
          ...previous,
          items: nextItems,
        };
      },
    );

    queryClient.setQueriesData<Record<string, TeamChatMessageAttachmentResponse[]>>(
      {
        queryKey: ['teamChat', 'attachments-by-message', payload.roomId],
      },
      (previous) => {
        if (!previous || !Array.isArray(previous[payload.messageId])) return previous;

        let hasChanged = false;
        const nextAttachments = previous[payload.messageId].map((attachment) => {
          if (attachment.id !== payload.attachmentId) return attachment;
          if (!shouldApplyAttachmentPreviewUpdate(attachment.previewVersion, payload.attachment.previewVersion)) {
            return attachment;
          }

          hasChanged = true;
          return {
            ...attachment,
            ...attachmentPatch,
          };
        });

        if (!hasChanged) return previous;

        return {
          ...previous,
          [payload.messageId]: nextAttachments,
        };
      },
    );

    queryClient.setQueryData<TeamChatMessageAttachmentResponse[]>(
      teamChatQueryKeys.messageAttachments(payload.roomId, payload.messageId),
      (previous) => {
        if (!Array.isArray(previous) || previous.length === 0) return previous;

        let hasChanged = false;
        const nextAttachments = previous.map((attachment) => {
          if (attachment.id !== payload.attachmentId) return attachment;
          if (!shouldApplyAttachmentPreviewUpdate(attachment.previewVersion, payload.attachment.previewVersion)) {
            return attachment;
          }

          hasChanged = true;
          return {
            ...attachment,
            ...attachmentPatch,
          };
        });

        return hasChanged ? nextAttachments : previous;
      },
    );

    queryClient.setQueriesData<TeamChatRoomAttachmentListResponse | TeamChatRoomAttachmentResponse[]>(
      {
        queryKey: [...teamChatQueryKeys.attachments(), 'room', payload.roomId],
      },
      (previous) => {
        if (!previous) return previous;

        const patchRoomAttachmentArray = (attachments: TeamChatRoomAttachmentResponse[]) => {
          let hasChanged = false;
          const nextAttachments = attachments.map((attachment) => {
            const currentAttachmentId = attachment.attachmentId ?? attachment.id;
            if (currentAttachmentId !== payload.attachmentId) return attachment;
            if (!shouldApplyAttachmentPreviewUpdate(attachment.previewVersion, payload.attachment.previewVersion)) {
              return attachment;
            }

            hasChanged = true;
            return {
              ...attachment,
              ...attachmentPatch,
              attachmentId: attachment.attachmentId ?? payload.attachmentId,
              id: attachment.id ?? payload.attachment.id,
            };
          });

          return hasChanged ? nextAttachments : attachments;
        };

        if (Array.isArray(previous)) {
          const nextItems = patchRoomAttachmentArray(previous);
          return nextItems === previous ? previous : nextItems;
        }

        if (Array.isArray(previous.items)) {
          const nextItems = patchRoomAttachmentArray(previous.items);
          if (nextItems === previous.items) return previous;
          return {
            ...previous,
            items: nextItems,
          };
        }

        return previous;
      },
    );
  };

  const invalidateAttachmentsByMessageQueries = (roomId?: string) => {
    if (!roomId) return;

    void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.attachments() });
  };

  const syncMessageAttachmentsCache = async (payload: ChatMessageAttachmentChangePayload) => {
    const attachments = await queryClient.fetchQuery({
      queryKey: teamChatQueryKeys.messageAttachments(payload.roomId, payload.messageId),
      queryFn: () => service.listMessageAttachments(payload.roomId, payload.messageId),
      staleTime: 0,
    });

    queryClient.setQueriesData<TeamChatMessageCursorResponse>(
      {
        queryKey: teamChatQueryKeys.messageCursorRoot(payload.roomId),
      },
      (previous) => {
        if (!previous?.items?.length) return previous;

        let hasChanged = false;
        const nextItems = previous.items.map((message) => {
          if (message.id !== payload.messageId) return message;
          hasChanged = true;
          return {
            ...message,
            attachments,
          };
        });

        if (!hasChanged) return previous;

        return {
          ...previous,
          items: nextItems,
        };
      },
    );

    queryClient.setQueriesData<Record<string, TeamChatMessageAttachmentResponse[]>>(
      {
        queryKey: ['teamChat', 'attachments-by-message', payload.roomId],
      },
      (previous) => ({
        ...(previous ?? {}),
        [payload.messageId]: attachments,
      }),
    );
  };

  const shouldTreatAsForwardAttachmentParityUpdate = (params: {
    payload: ChatMessageUpdatedPayload;
    message: TeamChatRoomMessageResponse;
  }) => {
    const normalizedReason = params.payload.roomDelta?.reason?.trim().toLowerCase();
    if (normalizedReason === 'message_updated') return false;

    return isForwardMessage(params.message) && Array.isArray(params.message.attachments);
  };

  const shouldSkipIncrementalAttachmentSync = (payload: ChatMessageAttachmentChangePayload) => {
    const cachedMessage = findCachedRoomMessage(payload.roomId, payload.messageId);
    return isForwardMessage(cachedMessage);
  };

  const shouldReconcileScheduledQueueFromMessage = (payload: ChatMessageCreatedPayload) => {
    const normalizedCurrentUserId = toNonEmptyString(currentUserId);
    if (!normalizedCurrentUserId) return false;
    return payload.message.senderId === normalizedCurrentUserId;
  };

  const normalizePresenceStatus = (
    value: unknown,
  ): TeamChatPresenceResponse['presenceStatus'] => {
    if (typeof value !== 'string') return 'away';
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === 'online') return 'online';
    if (normalizedValue === 'away') return 'away';
    if (normalizedValue === 'dnd') return 'dnd';
    if (normalizedValue === 'offline') return 'offline';
    return 'away';
  };

  const syncPresenceCacheFromRealtime = (payload: ChatPresenceUpdatedPayload) => {
    const presenceUserId = toNonEmptyString(payload.presence.userId);
    if (!presenceUserId) return false;

    const payloadOrganizationId =
      toNonEmptyString(payload.presence.organizationId) ??
      toNonEmptyString(payload.organizationId);

    if (organizationId && payloadOrganizationId && payloadOrganizationId !== organizationId) {
      return false;
    }

    let didPatch = false;
    queryClient.setQueryData<TeamChatPresenceResponse[] | undefined>(
      teamChatQueryKeys.presence(),
      (current) => {
        if (!Array.isArray(current)) return current;

        const existingIndex = current.findIndex((item) => item.userId === presenceUserId);
        const currentPresence = existingIndex >= 0 ? current[existingIndex] : null;
        const resolvedOrganizationId =
          payloadOrganizationId ?? currentPresence?.organizationId ?? organizationId ?? '';

        if (!resolvedOrganizationId) return current;

        const nextPresence: TeamChatPresenceResponse = {
          userId: presenceUserId,
          organizationId: resolvedOrganizationId,
          presenceStatus: normalizePresenceStatus(
            payload.presence.presenceStatus ?? currentPresence?.presenceStatus,
          ),
          customStatus:
            payload.presence.customStatus !== undefined
              ? payload.presence.customStatus
              : currentPresence?.customStatus ?? null,
          customEmoji:
            payload.presence.customEmoji !== undefined
              ? payload.presence.customEmoji
              : currentPresence?.customEmoji ?? null,
          source:
            payload.presence.source !== undefined
              ? payload.presence.source
              : currentPresence?.source ?? null,
          lastSeenAt:
            payload.presence.lastSeenAt !== undefined
              ? payload.presence.lastSeenAt
              : currentPresence?.lastSeenAt ?? null,
          lastActivityAt:
            payload.presence.lastActivityAt !== undefined
              ? payload.presence.lastActivityAt
              : currentPresence?.lastActivityAt ?? null,
          updatedAt:
            payload.presence.updatedAt ?? payload.occurredAt ?? currentPresence?.updatedAt ?? null,
          email:
            payload.presence.email !== undefined
              ? payload.presence.email
              : currentPresence?.email ?? null,
          firstName:
            payload.presence.firstName !== undefined
              ? payload.presence.firstName
              : currentPresence?.firstName ?? null,
          lastName:
            payload.presence.lastName !== undefined
              ? payload.presence.lastName
              : currentPresence?.lastName ?? null,
        };

        didPatch = true;

        if (!currentPresence || existingIndex < 0) {
          return [...current, nextPresence];
        }

        const nextPresences = [...current];
        nextPresences[existingIndex] = {
          ...currentPresence,
          ...nextPresence,
        };
        return nextPresences;
      },
    );

    return didPatch;
  };

  const invalidatePresenceQueries = () => {
    void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.presence() });
  };

  const mergeRoomSnapshotIntoDetail = (
    current: TeamChatRoomDetailResponse,
    room: TeamChatRoomMutationSnapshotResponse,
  ): TeamChatRoomDetailResponse => ({
    ...current,
    ...(room.roomType ? { roomType: room.roomType } : {}),
    ...(room.visibility ? { visibility: room.visibility } : {}),
    ...(room.name !== undefined ? { name: room.name ?? '' } : {}),
    ...(room.roomKey !== undefined ? { roomKey: room.roomKey } : {}),
    ...(room.topic !== undefined ? { topic: room.topic } : {}),
    ...(room.description !== undefined ? { description: room.description } : {}),
    ...(room.memberCount !== undefined ? { memberCount: room.memberCount } : {}),
    ...(room.isArchived !== undefined ? { isArchived: room.isArchived } : {}),
    ...(room.allowMemberPinMessages !== undefined
      ? { allowMemberPinMessages: room.allowMemberPinMessages }
      : {}),
    ...(room.allowGuestPinMessages !== undefined
      ? { allowGuestPinMessages: room.allowGuestPinMessages }
      : {}),
    ...(room.ownerId !== undefined ? { ownerId: room.ownerId } : {}),
    ...(room.updatedAt !== undefined ? { updatedAt: room.updatedAt ?? current.updatedAt } : {}),
    ...(room.dmCounterpart !== undefined ? { dmCounterpart: room.dmCounterpart ?? null } : {}),
    ...(Array.isArray(room.groupMemberPreview)
      ? { groupMemberPreview: room.groupMemberPreview }
      : {}),
    ...(room.groupMemberPreviewHasMore !== undefined
      ? { groupMemberPreviewHasMore: room.groupMemberPreviewHasMore }
      : {}),
    ...(room.lastMessageSnippet !== undefined
      ? { lastMessageSnippet: room.lastMessageSnippet ?? null }
      : {}),
  });

  const mergeRoomSnapshotIntoSummary = (
    current: TeamChatRoomSummaryResponse,
    room: TeamChatRoomMutationSnapshotResponse,
  ): TeamChatRoomSummaryResponse => ({
    ...current,
    ...(room.roomType ? { roomType: room.roomType } : {}),
    ...(room.visibility ? { visibility: room.visibility } : {}),
    ...(room.name !== undefined ? { name: room.name ?? '' } : {}),
    ...(room.roomKey !== undefined ? { roomKey: room.roomKey } : {}),
    ...(room.topic !== undefined ? { topic: room.topic } : {}),
    ...(room.description !== undefined ? { description: room.description } : {}),
    ...(room.memberCount !== undefined ? { memberCount: room.memberCount } : {}),
    ...(room.isArchived !== undefined ? { isArchived: room.isArchived } : {}),
    ...(room.allowMemberPinMessages !== undefined
      ? { allowMemberPinMessages: room.allowMemberPinMessages }
      : {}),
    ...(room.allowGuestPinMessages !== undefined
      ? { allowGuestPinMessages: room.allowGuestPinMessages }
      : {}),
    ...(room.ownerId !== undefined ? { ownerId: room.ownerId } : {}),
    ...(room.updatedAt !== undefined ? { updatedAt: room.updatedAt ?? current.updatedAt } : {}),
    ...(room.dmCounterpart !== undefined ? { dmCounterpart: room.dmCounterpart ?? null } : {}),
    ...(Array.isArray(room.groupMemberPreview)
      ? { groupMemberPreview: room.groupMemberPreview }
      : {}),
    ...(room.groupMemberPreviewHasMore !== undefined
      ? { groupMemberPreviewHasMore: room.groupMemberPreviewHasMore }
      : {}),
    ...(room.lastMessageSnippet !== undefined
      ? { lastMessageSnippet: room.lastMessageSnippet ?? null }
      : {}),
  });

  const syncRealtimeRoomSnapshotCaches = (payload: {
    roomId: string;
    room?: TeamChatRoomMutationSnapshotResponse | null;
  }) => {
    if (!payload.room?.id) return;

    void queryClient.setQueryData<TeamChatRoomDetailResponse | undefined>(
      teamChatQueryKeys.roomDetail(payload.roomId),
      (current) => (current ? mergeRoomSnapshotIntoDetail(current, payload.room!) : current),
    );

    queryClient.setQueriesData<Record<string, TeamChatRoomDetailResponse | null> | undefined>(
      { queryKey: teamChatQueryKeys.privateRoomDetailsRoot() },
      (current) => {
        if (!current || typeof current !== 'object' || Array.isArray(current)) {
          return current;
        }

        const currentRoomDetail = current[payload.roomId];
        if (!currentRoomDetail) return current;

        return {
          ...current,
          [payload.roomId]: mergeRoomSnapshotIntoDetail(currentRoomDetail, payload.room!),
        };
      },
    );

    queryClient.setQueriesData<TeamChatPaginatedResponse<TeamChatRoomSummaryResponse> | undefined>(
      { queryKey: teamChatQueryKeys.rooms() },
      (current) => {
        if (!current?.data?.length) return current;

        let changed = false;
        const nextItems = current.data.map((roomItem) => {
          if (roomItem.id !== payload.roomId) return roomItem;
          changed = true;
          return mergeRoomSnapshotIntoSummary(roomItem, payload.room!);
        });

        if (!changed) return current;
        return {
          ...current,
          data: nextItems,
        };
      },
    );
  };

  const normalizeRealtimeRoomSnapshot = (
    room: ChatRoomUpdatedPayload['room'],
  ): TeamChatRoomMutationSnapshotResponse | null => {
    if (!room?.id) return null;

    return {
      id: room.id,
      roomType:
        room.roomType === 'channel' || room.roomType === 'dm' || room.roomType === 'group_dm'
          ? room.roomType
          : undefined,
      visibility:
        room.visibility === 'public' || room.visibility === 'private'
          ? room.visibility
          : undefined,
      name: room.name,
      roomKey: room.roomKey,
      topic: room.topic,
      description: room.description,
      memberCount: room.memberCount,
      isArchived: room.isArchived,
      allowMemberPinMessages: room.allowMemberPinMessages,
      allowGuestPinMessages: room.allowGuestPinMessages,
      ownerId: room.ownerId,
      updatedAt: room.updatedAt,
    };
  };

  const invalidateFeedQueries = () => {
    void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.notificationsRoot() });
    void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.mentionsRoot() });
    void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.unreadSummary() });
  };

  const invalidateNotificationQueries = () => {
    void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.notificationsRoot() });
  };

  useEffect(() => {
    const shouldRunFallbackPolling =
      enabled &&
      Boolean(organizationId) &&
      Boolean(activeRoomId) &&
      (chatSocketStatus === 'disconnected' || chatSocketStatus === 'error');
    if (!shouldRunFallbackPolling) return;

    const refetchFallbackQueries = () => {
      void queryClient.invalidateQueries({
        queryKey: teamChatQueryKeys.messageCursorRoot(activeRoomId),
      });
      void queryClient.invalidateQueries({
        queryKey: teamChatQueryKeys.roomDetail(activeRoomId),
      });
      void queryClient.invalidateQueries({
        queryKey: teamChatQueryKeys.rooms(),
      });
      void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.unreadSummary() });
      void queryClient.invalidateQueries({
        queryKey: teamChatQueryKeys.scheduledMessagesRoot(),
      });
    };

    refetchFallbackQueries();
    const fallbackTimer = window.setInterval(refetchFallbackQueries, REALTIME_FALLBACK_POLL_MS);

    return () => window.clearInterval(fallbackTimer);
  }, [
    REALTIME_FALLBACK_POLL_MS,
    activeRoomId,
    chatSocketStatus,
    enabled,
    organizationId,
    queryClient,
  ]);

  useEffect(() => {
    if (!enabled) return;
    if (!organizationId) return;
    if (chatSocketStatus !== 'connected') return;

    const normalizedRoomIds = Array.from(
      new Set(
        [activeRoomId, ...subscribedRoomIds]
          .map((roomId) => (typeof roomId === 'string' ? roomId.trim() : ''))
          .filter((roomId): roomId is string => roomId.length > 0),
      ),
    );
    const nextSubscribedRoomIds = new Set(normalizedRoomIds);
    const previousOrganizationId = subscribedOrganizationIdRef.current;

    if (previousOrganizationId && previousOrganizationId !== organizationId) {
      Object.values(pendingRoomUnsubscribeTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      pendingRoomUnsubscribeTimersRef.current = {};
      subscribedRoomIdsRef.current.forEach((roomId) => {
        emit(SOCKET_NAMESPACES.CHAT, SOCKET_EVENTS.CHAT_ROOM_UNSUBSCRIBE, {
          organizationId: previousOrganizationId,
          roomId,
        });
      });
      subscribedRoomIdsRef.current = new Set<string>();
    }

    nextSubscribedRoomIds.forEach((roomId) => {
      const pendingUnsubscribeTimer = pendingRoomUnsubscribeTimersRef.current[roomId];
      if (pendingUnsubscribeTimer !== undefined) {
        window.clearTimeout(pendingUnsubscribeTimer);
        delete pendingRoomUnsubscribeTimersRef.current[roomId];
      }
      if (subscribedRoomIdsRef.current.has(roomId)) return;
      emit(SOCKET_NAMESPACES.CHAT, SOCKET_EVENTS.CHAT_ROOM_SUBSCRIBE, {
        organizationId,
        roomId,
      });
      subscribedRoomIdsRef.current.add(roomId);
    });

    subscribedOrganizationIdRef.current = organizationId;

  }, [activeRoomId, chatSocketStatus, emit, enabled, organizationId, subscribedRoomIds]);

  useEffect(() => {
    if (enabled && organizationId && chatSocketStatus === 'connected') return;

    const subscribedOrganizationId = subscribedOrganizationIdRef.current;
    const subscribedRoomIds = Array.from(subscribedRoomIdsRef.current);
    if (subscribedRoomIds.length === 0) {
      if (!organizationId) {
        subscribedOrganizationIdRef.current = null;
      }
      return;
    }

    if (chatSocketStatus === 'connected' && subscribedOrganizationId) {
      subscribedRoomIds.forEach((roomId) => {
        const pendingUnsubscribeTimer = pendingRoomUnsubscribeTimersRef.current[roomId];
        if (pendingUnsubscribeTimer !== undefined) {
          window.clearTimeout(pendingUnsubscribeTimer);
          delete pendingRoomUnsubscribeTimersRef.current[roomId];
        }
        emit(SOCKET_NAMESPACES.CHAT, SOCKET_EVENTS.CHAT_ROOM_UNSUBSCRIBE, {
          organizationId: subscribedOrganizationId,
          roomId,
        });
      });
    }
    subscribedRoomIdsRef.current = new Set<string>();
    if (!organizationId || chatSocketStatus !== 'connected') {
      subscribedOrganizationIdRef.current = null;
    }
  }, [chatSocketStatus, emit, enabled, organizationId]);

  useEffect(() => {
    return () => {
      const subscribedOrganizationId = subscribedOrganizationIdRef.current;
      const subscribedRoomIds = Array.from(subscribedRoomIdsRef.current);
      if (!subscribedOrganizationId || subscribedRoomIds.length === 0) return;

      subscribedRoomIds.forEach((roomId) => {
        const pendingUnsubscribeTimer = pendingRoomUnsubscribeTimersRef.current[roomId];
        if (pendingUnsubscribeTimer !== undefined) {
          window.clearTimeout(pendingUnsubscribeTimer);
          delete pendingRoomUnsubscribeTimersRef.current[roomId];
        }
        emit(SOCKET_NAMESPACES.CHAT, SOCKET_EVENTS.CHAT_ROOM_UNSUBSCRIBE, {
          organizationId: subscribedOrganizationId,
          roomId,
        });
      });
      subscribedRoomIdsRef.current = new Set<string>();
      subscribedOrganizationIdRef.current = null;
    };
  }, [emit]);

  useEffect(() => {
    if (!enabled) return;
    if (!organizationId) return;
    if (chatSocketStatus !== 'connected') return;

    const normalizedRoomIds = new Set(
      [activeRoomId, ...subscribedRoomIds]
        .map((roomId) => (typeof roomId === 'string' ? roomId.trim() : ''))
        .filter((roomId): roomId is string => roomId.length > 0),
    );

    subscribedRoomIdsRef.current.forEach((roomId) => {
      if (normalizedRoomIds.has(roomId)) return;
      if (pendingRoomUnsubscribeTimersRef.current[roomId] !== undefined) return;

      pendingRoomUnsubscribeTimersRef.current[roomId] = window.setTimeout(() => {
        delete pendingRoomUnsubscribeTimersRef.current[roomId];
        if (!subscribedRoomIdsRef.current.has(roomId)) return;

        const latestDesiredRoomIds = new Set(
          [activeRoomId, ...subscribedRoomIds]
            .map((nextRoomId) =>
              typeof nextRoomId === 'string' ? nextRoomId.trim() : '',
            )
            .filter((nextRoomId): nextRoomId is string => nextRoomId.length > 0),
        );
        if (latestDesiredRoomIds.has(roomId)) return;

        const subscribedOrganizationId = subscribedOrganizationIdRef.current;
        if (!subscribedOrganizationId) return;

        emit(SOCKET_NAMESPACES.CHAT, SOCKET_EVENTS.CHAT_ROOM_UNSUBSCRIBE, {
          organizationId: subscribedOrganizationId,
          roomId,
        });
        subscribedRoomIdsRef.current.delete(roomId);
      }, ROOM_UNSUBSCRIBE_GRACE_MS);
    });
  }, [
    ROOM_UNSUBSCRIBE_GRACE_MS,
    activeRoomId,
    chatSocketStatus,
    emit,
    enabled,
    organizationId,
    subscribedRoomIds,
  ]);

  const handleIncomingTypingStarted = (payload: ChatTypingStartedPayload) => {
    if (payload.roomId !== activeRoomId) return;
    if (currentUserId && payload.userId === currentUserId) return;
    onTypingStarted?.(payload);
  };

  const handleIncomingTypingStopped = (payload: ChatTypingStoppedPayload) => {
    if (payload.roomId !== activeRoomId) return;
    if (currentUserId && payload.userId === currentUserId) return;
    onTypingStopped?.(payload);
  };

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_MESSAGE_CREATED,
    (payload: ChatMessageCreatedPayload) => {
      const nextMessage = syncRealtimeMessageCreatedCache(payload);
      onMessageCreated?.(nextMessage, payload);
      const didSyncUnreadSummary = syncUnreadSummaryFromMessageCreated(payload);
      if (shouldReconcileScheduledQueueFromMessage(payload)) {
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.scheduledMessagesRoot(),
        });
      }
      const patchedRoomDelta = syncRoomDeltaCaches(payload.roomDelta);
      const patchedRoomMessageFallback = syncRoomMessageFallbackCaches(payload);
      invalidateRoomQueries(payload.roomId, {
        includeMessageCursor: false,
        includeRooms: !(patchedRoomDelta || patchedRoomMessageFallback),
        includeUnreadSummary: !didSyncUnreadSummary,
      });
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_MESSAGE_UPDATED,
    (payload: ChatMessageUpdatedPayload) => {
      const nextMessage = syncRealtimeMessageUpdatedCache(payload);
      onMessageUpdated?.(nextMessage, payload);
      const patchedRoomDelta = syncRoomDeltaCaches(payload.roomDelta);
      const shouldTreatAsForwardAttachmentParity =
        shouldTreatAsForwardAttachmentParityUpdate({
          payload,
          message: nextMessage,
        });
      if (shouldTreatAsForwardAttachmentParity) {
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.attachments() });
      }
      invalidateRoomQueries(payload.roomId, {
        includeMessageCursor: Boolean(nextMessage.isDeleted),
        includeRoomDetail: !shouldTreatAsForwardAttachmentParity,
        includePinnedMessages: false,
        includePrivateRoomDetails: !shouldTreatAsForwardAttachmentParity,
        includeRooms: shouldTreatAsForwardAttachmentParity ? false : !patchedRoomDelta,
        includeDiscoverRooms: !shouldTreatAsForwardAttachmentParity,
        includeUnreadSummary: false,
      });
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_MESSAGE_DELETED,
    (payload: ChatMessageDeletedPayload) => {
      syncRealtimeMessageDeletedCache(payload);
      onMessageDeleted?.(payload);
      const patchedRoomDelta = syncRoomDeltaCaches(payload.roomDelta);
      invalidateRoomQueries(payload.roomId, {
        includeMessageCursor: true,
        includeRooms: !patchedRoomDelta,
        includeUnreadSummary: true,
      });
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_MESSAGE_REACTION_UPDATED,
    (payload: ChatMessageReactionUpdatedPayload) => {
      syncRealtimeReactionCache(payload);
      onMessageReactionUpdated?.(payload);
      void syncRoomDeltaCaches(payload.roomDelta);
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_ROOM_READ_STATE_UPDATED,
    (payload: ChatRoomReadStateUpdatedPayload) => {
      syncUnreadSummaryFromRealtime(payload);
      syncManualUnreadStateCache(queryClient, payload);
      onRoomReadStateUpdated?.(payload);
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_PERSONAL_INBOX_ROOM_READ_UPDATED,
    (payload: ChatPersonalInboxRoomReadUpdatedPayload) => {
      if (organizationId && payload.organizationId !== organizationId) return;
      if (currentUserId?.trim() && payload.userId !== currentUserId.trim()) return;
      onPersonalInboxRoomReadUpdated?.(payload);
      invalidateFeedQueries();
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_MESSAGE_PIN_UPDATED,
    (payload: ChatMessagePinUpdatedPayload) => {
      const pinSyncResult = syncRealtimePinCache(payload);
      onMessagePinUpdated?.(payload);
      if (pinSyncResult === 'refetch') {
        void queryClient.refetchQueries({
          queryKey: teamChatQueryKeys.pinnedMessages(payload.roomId),
          type: 'active',
        });
      }
      invalidateRoomQueries(payload.roomId, {
        includeMessageCursor: false,
        includeRoomDetail: false,
        includePinnedMessages: pinSyncResult === 'refetch',
        includePrivateRoomDetails: false,
        includeRooms: false,
        includeDiscoverRooms: false,
        includeUnreadSummary: false,
      });
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_MESSAGE_ATTACHMENT_ADDED,
    (payload: ChatMessageAttachmentChangePayload) => {
      if (!shouldSkipIncrementalAttachmentSync(payload)) {
        void syncMessageAttachmentsCache(payload);
      }
      invalidateAttachmentsByMessageQueries(payload.roomId);
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_MESSAGE_ATTACHMENT_REMOVED,
    (payload: ChatMessageAttachmentChangePayload) => {
      void syncMessageAttachmentsCache(payload);
      invalidateAttachmentsByMessageQueries(payload.roomId);
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_MESSAGE_ATTACHMENT_PREVIEW_UPDATED,
    (payload: ChatMessageAttachmentPreviewUpdatedPayload) => {
      patchMessageAttachmentPreviewCache(payload);
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_MESSAGE_LINK_PREVIEW_UPDATED,
    (payload: ChatMessageLinkPreviewUpdatedPayload) => {
      patchMessageCursorCache(payload);
      onMessageLinkPreviewUpdated?.(payload);
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_TYPING_STARTED,
    handleIncomingTypingStarted,
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_TYPING_START,
    handleIncomingTypingStarted,
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_TYPING_STOPPED,
    handleIncomingTypingStopped,
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_TYPING_STOP,
    handleIncomingTypingStopped,
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_ROOM_INVITATION_CREATED,
    (_payload: ChatRoomInvitationCreatedPayload) => {
      invalidateFeedQueries();
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_ROOM_MEMBER_JOINED,
    (payload: ChatRoomMemberJoinedPayload) => {
      syncRoomDetailIntoSidebarCache(payload.roomId, {
        includeMembers: payload.roomId === activeRoomId,
        forceRefresh: true,
      });
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_ROOM_VISIBILITY_CHANGED,
    (payload: ChatRoomVisibilityChangedPayload) => {
      invalidateRoomQueries(payload.roomId);
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_ROOM_MEMBER_ROLE_UPDATED,
    (payload: ChatRoomMemberRoleUpdatedPayload) => {
      invalidateRoomQueries(payload.roomId);
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_ROOM_MEMBER_REMOVED,
    (payload: ChatRoomMemberRemovedPayload) => {
      invalidateRoomQueries(payload.roomId);
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_ROOM_UPDATED,
    (payload: ChatRoomUpdatedPayload) => {
      const normalizedRoom = normalizeRealtimeRoomSnapshot(payload.room ?? null);
      const shouldHydrateRoomCollection = !hasRoomInAnyListCache(payload.roomId);
      syncRealtimeRoomSnapshotCaches({
        roomId: payload.roomId,
        room: normalizedRoom,
      });
      if (shouldHydrateRoomCollection || payload.roomId === activeRoomId) {
        syncRoomDetailIntoSidebarCache(payload.roomId, {
          includeMembers: false,
          forceRefresh: shouldHydrateRoomCollection,
        });
      }

      if (payload.roomId === activeRoomId) {
        invalidateRoomQueries(payload.roomId, {
          includeMessageCursor: false,
          includeRoomDetail: true,
          includePinnedMessages: false,
          includePrivateRoomDetails: true,
          includeRooms: false,
          includeDiscoverRooms: false,
          includeUnreadSummary: false,
        });
      }
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.CHAT,
    SOCKET_EVENTS.CHAT_PRESENCE_UPDATED,
    (payload: ChatPresenceUpdatedPayload) => {
      const payloadOrganizationId =
        toNonEmptyString(payload.presence.organizationId) ??
        toNonEmptyString(payload.organizationId);
      if (organizationId && payloadOrganizationId && payloadOrganizationId !== organizationId) {
        return;
      }
      syncPresenceCacheFromRealtime(payload);
      invalidatePresenceQueries();
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.NOTIFICATIONS,
    SOCKET_EVENTS.NOTIFICATION_NEW,
    (payload: NotificationRealtimePayload) => {
      const didPatch = syncNotificationFeedCache(payload, 'new');

      if (!didPatch) {
        const normalizedNotification = normalizeRealtimeNotificationPayload(payload);
        if (!normalizedNotification) return;

        const notificationOrganizationId = resolveNotificationOrganizationId(normalizedNotification);
        if (
          organizationId &&
          notificationOrganizationId &&
          notificationOrganizationId !== organizationId
        ) {
          return;
        }
      }

      invalidateNotificationQueries();
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.NOTIFICATIONS,
    SOCKET_EVENTS.NOTIFICATION_UPDATED,
    (payload: NotificationRealtimePayload) => {
      const didPatch = syncNotificationFeedCache(payload, 'updated');
      if (!didPatch) {
        const normalizedNotification = normalizeRealtimeNotificationPayload(payload);
        if (!normalizedNotification) return;

        const notificationOrganizationId = resolveNotificationOrganizationId(normalizedNotification);
        if (
          organizationId &&
          notificationOrganizationId &&
          notificationOrganizationId !== organizationId
        ) {
          return;
        }
      }

      invalidateNotificationQueries();
    },
    enabled,
  );
}
