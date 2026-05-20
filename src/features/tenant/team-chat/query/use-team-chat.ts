'use client';

import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeMutation, useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { TeamChatService } from '../services/team-chat.service';
import type {
  AddTeamChatReactionBody,
  CreateTeamChatRoomBody,
  CreateTeamChatScheduledMessageBody,
  ForwardTeamChatMessageBody,
  GetTeamChatCreateRoomCandidatesParams,
  GetTeamChatCurrentDraftParams,
  GetTeamChatMessageContextParams,
  GetTeamChatRoomBootstrapParams,
  GetTeamChatRoomDetailParams,
  GetTeamChatRoomInviteCandidatesParams,
  TeamChatDraftListResponse,
  InviteTeamChatRoomMembersBody,
  ListTeamChatDiscoverRoomsParams,
  ListTeamChatDraftsParams,
  ListTeamChatRoomAttachmentsParams,
  ListTeamChatMessageCursorParams,
  ListTeamChatRoomMessageSearchParams,
  ListTeamChatMentionsParams,
  ListTeamChatMessagesParams,
  ListTeamChatNotificationsParams,
  ListTeamChatRoomsParams,
  ListTeamChatScheduledMessagesParams,
  MarkAllTeamChatMentionsReadBody,
  MarkAllTeamChatNotificationsReadBody,
  MarkTeamChatPersonalInboxRoomReadBody,
  SendTeamChatMessageBody,
  TeamChatDraftResponse,
  TeamChatPinnedMessageResponse,
  TeamChatRoomPinStateResponse,
  TeamChatToggleMessagePinResponse,
  TeamChatRoomDetailResponse,
  TeamChatPaginatedResponse,
  TeamChatReadStateResponse,
  TeamChatRoomMutationSnapshotResponse,
  TeamChatRoomSummaryResponse,
  TeamChatUnreadAggregates,
  TeamChatUnreadSummaryResponse,
  UpdateTeamChatCurrentDraftBody,
  UpdateTeamChatMemberRoleBody,
  UpdateTeamChatMessageBody,
  UpdateTeamChatChannelVisibilityBody,
  UpdateTeamChatNotifySettingsBody,
  UpdateTeamChatPresenceBody,
  UpdateTeamChatReadStateBody,
  UpdateTeamChatRoomVisibilityBody,
  UpdateTeamChatRoomInfoBody,
  UpdateTeamChatRoomOwnershipBody,
  UpdateTeamChatRoomPoliciesBody,
  UpdateTeamChatRoomTabsBody,
  UpdateTeamChatScheduledMessageBody,
  UploadTeamChatMessageAttachmentBody,
} from '../services/types/team-chat.types';

export const teamChatQueryKeys = {
  root: ['teamChat'] as const,
  rooms: () => [...teamChatQueryKeys.root, 'rooms'] as const,
  roomList: (params?: ListTeamChatRoomsParams) =>
    [...teamChatQueryKeys.rooms(), 'list', params ?? {}] as const,
  discoverRoomsRoot: () => [...teamChatQueryKeys.rooms(), 'discover'] as const,
  discoverRooms: (params?: ListTeamChatDiscoverRoomsParams) =>
    [...teamChatQueryKeys.discoverRoomsRoot(), params ?? {}] as const,
  roomDetail: (roomId: string) => [...teamChatQueryKeys.rooms(), 'detail', roomId] as const,
  roomBootstrap: (roomId: string, params?: GetTeamChatRoomBootstrapParams) =>
    [...teamChatQueryKeys.rooms(), 'bootstrap', roomId, params ?? {}] as const,
  roomPreview: (roomId: string) => [...teamChatQueryKeys.rooms(), 'preview', roomId] as const,
  roomTabs: (roomId: string) => [...teamChatQueryKeys.rooms(), 'tabs', roomId] as const,
  roomInviteCandidates: (
    roomId: string,
    params?: GetTeamChatRoomInviteCandidatesParams,
  ) => [...teamChatQueryKeys.rooms(), 'invite-candidates', roomId, params ?? {}] as const,
  roomCreateCandidates: (params?: GetTeamChatCreateRoomCandidatesParams) =>
    [...teamChatQueryKeys.rooms(), 'create-candidates', params ?? {}] as const,
  privateRoomDetailsRoot: () => [...teamChatQueryKeys.root, 'private-room-details'] as const,
  privateRoomDetails: (roomIds: string[]) =>
    [...teamChatQueryKeys.privateRoomDetailsRoot(), roomIds] as const,
  messages: () => [...teamChatQueryKeys.root, 'messages'] as const,
  messageLinkPreview: (roomId: string, messageId: string) =>
    [...teamChatQueryKeys.messages(), 'linkPreview', roomId, messageId] as const,
  messageContext: (
    roomId: string,
    messageId: string,
    params?: GetTeamChatMessageContextParams,
  ) => [...teamChatQueryKeys.messages(), 'context', roomId, messageId, params ?? {}] as const,
  messageCursorRoot: (roomId: string) =>
    [...teamChatQueryKeys.messages(), 'cursor', roomId] as const,
  messageCursor: (roomId: string, params?: ListTeamChatMessageCursorParams) =>
    [...teamChatQueryKeys.messages(), 'cursor', roomId, params ?? {}] as const,
  messageList: (roomId: string, params?: ListTeamChatMessagesParams) =>
    [...teamChatQueryKeys.messages(), 'list', roomId, params ?? {}] as const,
  messageSearch: (roomId: string, params?: ListTeamChatRoomMessageSearchParams) =>
    [...teamChatQueryKeys.messages(), 'search', roomId, params ?? {}] as const,
  attachments: () => [...teamChatQueryKeys.root, 'attachments'] as const,
  roomAttachments: (roomId: string, params?: ListTeamChatRoomAttachmentsParams) =>
    [...teamChatQueryKeys.attachments(), 'room', roomId, params ?? {}] as const,
  messageAttachments: (roomId: string, messageId: string) =>
    [...teamChatQueryKeys.attachments(), roomId, messageId] as const,
  unreadSummary: () => [...teamChatQueryKeys.root, 'unreadSummary'] as const,
  reactions: () => [...teamChatQueryKeys.root, 'reactions'] as const,
  messageReactions: (roomId: string, messageId: string) =>
    [...teamChatQueryKeys.reactions(), roomId, messageId] as const,
  pins: () => [...teamChatQueryKeys.root, 'pins'] as const,
  pinnedMessages: (roomId: string) => [...teamChatQueryKeys.pins(), roomId] as const,
  roomPinState: (roomId: string) => [...teamChatQueryKeys.pins(), roomId, 'state'] as const,
  presence: () => [...teamChatQueryKeys.root, 'presence'] as const,
  mentionsRoot: () => [...teamChatQueryKeys.root, 'mentions'] as const,
  mentions: (tenantId?: string | null, params?: ListTeamChatMentionsParams) =>
    [...teamChatQueryKeys.mentionsRoot(), tenantId ?? 'global', params ?? {}] as const,
  notificationsRoot: () => [...teamChatQueryKeys.root, 'notifications'] as const,
  notifications: (tenantId?: string | null, params?: ListTeamChatNotificationsParams) =>
    [...teamChatQueryKeys.notificationsRoot(), tenantId ?? 'global', params ?? {}] as const,
  currentDrafts: () => [...teamChatQueryKeys.root, 'currentDrafts'] as const,
  currentDraft: (roomId: string, params?: GetTeamChatCurrentDraftParams) =>
    [...teamChatQueryKeys.currentDrafts(), roomId, params ?? {}] as const,
  draftsHubRoot: () => [...teamChatQueryKeys.root, 'draftsHub'] as const,
  draftsHub: (params?: ListTeamChatDraftsParams) =>
    [...teamChatQueryKeys.draftsHubRoot(), params ?? {}] as const,
  scheduledMessagesRoot: () => [...teamChatQueryKeys.root, 'scheduledMessages'] as const,
  scheduledMessages: (params?: ListTeamChatScheduledMessagesParams) =>
    [...teamChatQueryKeys.scheduledMessagesRoot(), params ?? {}] as const,
};

function useTeamChatService() {
  const ctx = useServiceContext();
  return new TeamChatService(ctx);
}

function clearDraftFromCurrentDraftCaches(queryClient: QueryClient, draftId: string) {
  queryClient.setQueriesData<TeamChatDraftResponse | null | undefined>(
    { queryKey: teamChatQueryKeys.currentDrafts() },
    (currentDraft) => (currentDraft?.id === draftId ? null : currentDraft),
  );
}

function readCachedRoomMessageForPin(
  queryClient: QueryClient,
  roomId: string,
  messageId: string,
): TeamChatPinnedMessageResponse['message'] | null {
  const cachedCursors = queryClient.getQueriesData<{
    items?: TeamChatPinnedMessageResponse['message'][];
  }>({
    queryKey: teamChatQueryKeys.messageCursorRoot(roomId),
  });

  for (const [, cursor] of cachedCursors) {
    const cachedMessage = cursor?.items?.find((item) => item.id === messageId);
    if (cachedMessage) return cachedMessage;
  }

  return null;
}

function syncRoomPinStateCache(
  queryClient: QueryClient,
  payload: Pick<
    TeamChatToggleMessagePinResponse,
    'roomId' | 'roomPinVersion' | 'pinnedCount'
  > & {
    occurredAt?: string | null;
    eventId?: string | null;
  },
) {
  queryClient.setQueryData<TeamChatRoomPinStateResponse>(
    teamChatQueryKeys.roomPinState(payload.roomId),
    (current) => ({
      roomId: payload.roomId,
      roomPinVersion:
        Number.isFinite(payload.roomPinVersion)
          ? payload.roomPinVersion
          : current?.roomPinVersion ?? 0,
      pinnedCount:
        Number.isFinite(payload.pinnedCount)
          ? payload.pinnedCount
          : current?.pinnedCount ?? 0,
      updatedAt: payload.occurredAt ?? current?.updatedAt ?? null,
      lastEventId: payload.eventId ?? current?.lastEventId ?? null,
    }),
  );
}

function normalizePinAction(value: unknown): 'pinned' | 'unpinned' | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'pinned') return 'pinned';
  if (normalized === 'unpinned') return 'unpinned';
  return null;
}

function invalidatePrivateRoomDetailCaches(queryClient: QueryClient) {
  void queryClient.invalidateQueries({
    queryKey: teamChatQueryKeys.privateRoomDetailsRoot(),
  });
}

function invalidateRoomDetailCaches(queryClient: QueryClient, roomId: string) {
  void queryClient.invalidateQueries({
    queryKey: teamChatQueryKeys.roomDetail(roomId),
  });
  invalidatePrivateRoomDetailCaches(queryClient);
}

function parseUnreadAggregateCount(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.trunc(parsed));
}

export function buildUnreadSummaryAggregates(
  summary: Pick<TeamChatUnreadSummaryResponse, 'totalUnread' | 'rooms' | 'aggregates'>,
  override?: TeamChatUnreadAggregates | null,
): TeamChatUnreadAggregates {
  const roomUnreadMessageCount =
    parseUnreadAggregateCount(override?.roomUnreadMessageCount) ??
    parseUnreadAggregateCount(summary.totalUnread) ??
    0;
  const myInboxUnreadItemCount =
    parseUnreadAggregateCount(override?.myInboxUnreadItemCount) ??
    summary.rooms.filter((room) => room.unreadCount > 0).length;
  const myInboxUnreadMessageCount =
    parseUnreadAggregateCount(override?.myInboxUnreadMessageCount) ?? roomUnreadMessageCount;
  const notificationUnreadCount =
    parseUnreadAggregateCount(override?.notificationUnreadCount) ??
    parseUnreadAggregateCount(summary.aggregates?.notificationUnreadCount) ??
    0;

  return {
    roomUnreadMessageCount,
    myInboxUnreadItemCount,
    myInboxUnreadMessageCount,
    notificationUnreadCount,
  };
}

export function withUnreadSummaryAggregates(
  summary: TeamChatUnreadSummaryResponse,
  override?: TeamChatUnreadAggregates | null,
): TeamChatUnreadSummaryResponse {
  return {
    ...summary,
    aggregates: buildUnreadSummaryAggregates(summary, override),
  };
}

export function syncUnreadSummaryCache(
  queryClient: QueryClient,
  readState: TeamChatReadStateResponse,
) {
  queryClient.setQueryData<TeamChatUnreadSummaryResponse | undefined>(
    teamChatQueryKeys.unreadSummary(),
    (current) => {
      if (!current?.rooms) return current;

      const currentRoom = current.rooms.find((room) => room.roomId === readState.roomId);
      const previousUnreadCount = currentRoom?.unreadCount ?? 0;
      const nextRoom = {
        roomId: readState.roomId,
        roomName: currentRoom?.roomName ?? '',
        roomType: currentRoom?.roomType ?? 'channel',
        unreadCount: readState.unreadCount,
        lastReadMessageId: readState.lastReadMessageId ?? null,
        lastReadAt: readState.lastReadAt ?? null,
        lastMessageAt: currentRoom?.lastMessageAt ?? null,
      };
      const nextRooms = current.rooms.some((room) => room.roomId === readState.roomId)
        ? current.rooms.map((room) => (room.roomId === readState.roomId ? nextRoom : room))
        : [...current.rooms, nextRoom];

      return withUnreadSummaryAggregates({
        ...current,
        totalUnread: Math.max(0, current.totalUnread - previousUnreadCount + readState.unreadCount),
        rooms: nextRooms,
      }, readState.afterAggregates);
    },
  );
}

function mergeRoomSnapshotIntoDetail(
  current: TeamChatRoomDetailResponse,
  room: TeamChatRoomMutationSnapshotResponse,
): TeamChatRoomDetailResponse {
  return {
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
    ...(room.myRole !== undefined ? { myRole: room.myRole } : {}),
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
    ...(Array.isArray(room.members) && room.members.length > 0 ? { members: room.members } : {}),
  };
}

function mergeRoomSnapshotIntoSummary(
  current: TeamChatRoomSummaryResponse,
  room: TeamChatRoomMutationSnapshotResponse,
): TeamChatRoomSummaryResponse {
  return {
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
    ...(room.myRole !== undefined ? { myRole: room.myRole } : {}),
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
  };
}

function toUnixTimestamp(value?: string | null): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortRoomSummariesByRecentActivity(
  rooms: TeamChatRoomSummaryResponse[],
): TeamChatRoomSummaryResponse[] {
  return [...rooms].sort((left, right) => {
    const leftRecent = toUnixTimestamp(left.lastMessageAt ?? left.updatedAt ?? null);
    const rightRecent = toUnixTimestamp(right.lastMessageAt ?? right.updatedAt ?? null);
    if (leftRecent !== rightRecent) return rightRecent - leftRecent;

    const leftUpdated = toUnixTimestamp(left.updatedAt ?? null);
    const rightUpdated = toUnixTimestamp(right.updatedAt ?? null);
    if (leftUpdated !== rightUpdated) return rightUpdated - leftUpdated;

    return right.id.localeCompare(left.id);
  });
}

function normalizeRoomContextScope(value: unknown): 'organization' | 'project' {
  return typeof value === 'string' && value.trim().toLowerCase() === 'project'
    ? 'project'
    : 'organization';
}

function normalizeRoomContextId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function getRoomListParamsFromQueryKey(queryKey: readonly unknown[]): ListTeamChatRoomsParams {
  const candidate = queryKey[queryKey.length - 1];
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return {};
  }
  return candidate as ListTeamChatRoomsParams;
}

function doesRoomMatchListParams(
  room: TeamChatRoomSummaryResponse,
  params?: ListTeamChatRoomsParams,
): boolean {
  const roomScope = normalizeRoomContextScope(room.contextScope);
  const roomContextId = normalizeRoomContextId(room.contextId);
  const paramsScope = normalizeRoomContextScope(params?.contextScope);
  const paramsContextId = normalizeRoomContextId(params?.contextId);

  if (roomScope !== paramsScope) return false;
  if (paramsScope === 'project' && roomContextId !== paramsContextId) return false;

  if (params?.roomType && params.roomType !== room.roomType) return false;
  if (params?.visibility && params.visibility !== room.visibility) return false;
  if (params?.archivedOnly && !room.isArchived) return false;
  if (params?.hiddenOnly && !room.isHiddenByUser) return false;
  if (!(params?.includeArchived ?? false) && room.isArchived) return false;
  if (!(params?.includeHidden ?? false) && room.isHiddenByUser) return false;
  if (params?.starredOnly && !room.isStarred) return false;

  const normalizedSearch =
    typeof params?.search === 'string' ? params.search.trim().toLowerCase() : '';
  if (!normalizedSearch) return true;

  const searchableFields = [room.name, room.roomKey, room.topic]
    .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
    .filter(Boolean);

  return searchableFields.some((value) => value.includes(normalizedSearch));
}

export function upsertRoomDetailIntoRoomListCaches(
  queryClient: QueryClient,
  roomDetail: TeamChatRoomDetailResponse,
) {
  const roomSummary: TeamChatRoomSummaryResponse = roomDetail;
  const roomListRootQueryKey = [...teamChatQueryKeys.rooms(), 'list'] as const;

  queryClient.setQueryData<TeamChatRoomDetailResponse | undefined>(
    teamChatQueryKeys.roomDetail(roomDetail.id),
    roomDetail,
  );
  syncPrivateRoomDetailCaches(queryClient, roomDetail.id, () => roomDetail);

  const cachedRoomLists = queryClient.getQueriesData<
    TeamChatPaginatedResponse<TeamChatRoomSummaryResponse> | undefined
  >({
    queryKey: roomListRootQueryKey,
  });

  cachedRoomLists.forEach(([queryKey]) => {
    if (!Array.isArray(queryKey)) return;

    const params = getRoomListParamsFromQueryKey(queryKey);

    queryClient.setQueryData<TeamChatPaginatedResponse<TeamChatRoomSummaryResponse> | undefined>(
      queryKey,
      (current) => {
        if (!current?.data) return current;

        const matchesList = doesRoomMatchListParams(roomSummary, params);
        const existingIndex = current.data.findIndex((item) => item.id === roomSummary.id);
        const nextLimit = Math.max(1, current.meta?.limit || params.limit || 100);
        const currentTotal = Math.max(current.meta?.total ?? current.data.length, current.data.length);

        if (!matchesList) {
          if (existingIndex < 0) return current;
          const nextData = current.data.filter((item) => item.id !== roomSummary.id);
          return nextData.length === current.data.length
            ? current
            : {
                ...current,
                data: nextData,
                meta: {
                  ...current.meta,
                  total: Math.max(nextData.length, currentTotal - 1),
                  totalPages: Math.max(
                    1,
                    Math.ceil(Math.max(nextData.length, currentTotal - 1) / nextLimit),
                  ),
                },
              };
        }

        const nextData =
          existingIndex >= 0
            ? current.data.map((item) => (item.id === roomSummary.id ? roomSummary : item))
            : [roomSummary, ...current.data];
        const sortedData = sortRoomSummariesByRecentActivity(nextData);
        const limitedData =
          sortedData.length > nextLimit ? sortedData.slice(0, nextLimit) : sortedData;
        const nextTotal =
          existingIndex >= 0 ? currentTotal : Math.max(currentTotal + 1, nextData.length);

        return {
          ...current,
          data: limitedData,
          meta: {
            ...current.meta,
            total: nextTotal,
            totalPages: Math.max(1, Math.ceil(nextTotal / nextLimit)),
          },
        };
      },
    );
  });
}

function syncRoomSnapshotCaches(
  queryClient: QueryClient,
  room?: TeamChatRoomMutationSnapshotResponse | null,
) {
  if (!room?.id) return;

  void queryClient.setQueryData<TeamChatRoomDetailResponse | undefined>(
    teamChatQueryKeys.roomDetail(room.id),
    (current) => (current ? mergeRoomSnapshotIntoDetail(current, room) : current),
  );

  syncPrivateRoomDetailCaches(queryClient, room.id, (current) =>
    mergeRoomSnapshotIntoDetail(current, room),
  );

  queryClient.setQueriesData<TeamChatPaginatedResponse<TeamChatRoomSummaryResponse> | undefined>(
    { queryKey: teamChatQueryKeys.rooms() },
    (current) => {
      if (!current?.data?.length) return current;

      let changed = false;
      const nextItems = current.data.map((item) => {
        if (item.id !== room.id) return item;
        changed = true;
        return mergeRoomSnapshotIntoSummary(item, room);
      });

      if (!changed) return current;
      return {
        ...current,
        data: nextItems,
      };
    },
  );
}

function syncPrivateRoomDetailCaches(
  queryClient: QueryClient,
  roomId: string,
  updater: (roomDetail: TeamChatRoomDetailResponse) => TeamChatRoomDetailResponse,
) {
  queryClient.setQueriesData<Record<string, TeamChatRoomDetailResponse | null> | undefined>(
    { queryKey: teamChatQueryKeys.privateRoomDetailsRoot() },
    (current) => {
      if (!current || typeof current !== 'object' || Array.isArray(current)) {
        return current;
      }

      const currentRoomDetail = current[roomId];
      if (!currentRoomDetail) {
        return current;
      }

      return {
        ...current,
        [roomId]: updater(currentRoomDetail),
      };
    },
  );
}

function normalizeDraftContextValue(value?: string | null) {
  return value ?? undefined;
}

function syncDraftsHubCaches(
  queryClient: QueryClient,
  updater: (items: TeamChatDraftResponse[]) => TeamChatDraftResponse[],
) {
  queryClient.setQueriesData<TeamChatDraftListResponse | undefined>(
    { queryKey: teamChatQueryKeys.draftsHubRoot() },
    (currentDraftList) =>
      currentDraftList
        ? {
            ...currentDraftList,
            items: updater(currentDraftList.items),
          }
        : currentDraftList,
  );
}

export function useTeamChatRooms(params?: ListTeamChatRoomsParams) {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.roomList(params),
      queryFn: () => service.listRooms(params ?? {}),
      staleTime: 30_000,
      placeholderData: (previousData) => previousData,
    }),
  );
}

export function useTeamChatRoomDetail(
  roomId: string,
  options?: {
    enabled?: boolean;
    includeMembers?: GetTeamChatRoomDetailParams['includeMembers'];
    staleTime?: number;
  },
) {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.roomDetail(roomId),
      queryFn: () =>
        service.getRoomDetail(roomId, {
          includeMembers: options?.includeMembers,
        }),
      enabled: Boolean(roomId) && (options?.enabled ?? true),
      staleTime: options?.staleTime ?? 15_000,
    }),
  );
}

export function useTeamChatRoomBootstrap(
  roomId: string,
  params?: GetTeamChatRoomBootstrapParams,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  },
) {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.roomBootstrap(roomId, params),
      queryFn: () => service.getRoomBootstrap(roomId, params ?? {}),
      enabled: Boolean(roomId) && (options?.enabled ?? true),
      staleTime: options?.staleTime ?? 15_000,
    }),
  );
}

export function useTeamChatRoomInviteCandidates(
  roomId: string,
  params?: GetTeamChatRoomInviteCandidatesParams,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  },
) {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.roomInviteCandidates(roomId, params),
      queryFn: () => service.getRoomInviteCandidates(roomId, params ?? {}),
      enabled: Boolean(roomId) && (options?.enabled ?? true),
      staleTime: options?.staleTime ?? 15_000,
    }),
  );
}

export function useTeamChatCreateRoomCandidates(
  params: GetTeamChatCreateRoomCandidatesParams,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  },
) {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.roomCreateCandidates(params),
      queryFn: () => service.getCreateRoomCandidates(params),
      enabled: (options?.enabled ?? true) && Boolean(params.roomType),
      staleTime: options?.staleTime ?? 15_000,
    }),
  );
}

export function useDiscoverTeamChatRooms(
  params?: ListTeamChatDiscoverRoomsParams,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  },
) {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.discoverRooms(params),
      queryFn: () => service.discoverRooms(params ?? {}),
      enabled: options?.enabled ?? true,
      staleTime: options?.staleTime ?? 30_000,
    }),
  );
}

export function useTeamChatRoomPreview(
  roomId: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  },
) {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.roomPreview(roomId),
      queryFn: () => service.getRoomPreview(roomId),
      enabled: Boolean(roomId) && (options?.enabled ?? true),
      staleTime: options?.staleTime ?? 30_000,
    }),
  );
}

export function useCreateTeamChatRoom() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (body: CreateTeamChatRoomBody) => service.createRoom(body),
      onSuccess: (roomDetail) => {
        upsertRoomDetailIntoRoomListCaches(queryClient, roomDetail);
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.discoverRoomsRoot() });
      },
    }),
  );
}

export interface TeamChatManualUnreadStatePatch {
  roomId: string;
  isManualUnreadByUser?: boolean | null;
  manualUnreadAt?: string | null;
  manualUnreadFromMessageId?: string | null;
}

function applyManualUnreadPatchToRoom<
  TRoom extends {
    isManualUnreadByUser?: boolean;
    manualUnreadAt?: string | null;
    manualUnreadFromMessageId?: string | null;
  },
>(room: TRoom, patch: TeamChatManualUnreadStatePatch): TRoom {
  const hasManualUnreadFlag = typeof patch.isManualUnreadByUser === 'boolean';
  const hasManualUnreadAt = patch.manualUnreadAt !== undefined;
  const hasManualUnreadFromMessageId = patch.manualUnreadFromMessageId !== undefined;
  if (!hasManualUnreadFlag && !hasManualUnreadAt && !hasManualUnreadFromMessageId) {
    return room;
  }

  return {
    ...room,
    ...(hasManualUnreadFlag
      ? { isManualUnreadByUser: Boolean(patch.isManualUnreadByUser) }
      : {}),
    ...(hasManualUnreadAt ? { manualUnreadAt: patch.manualUnreadAt ?? null } : {}),
    ...(hasManualUnreadFromMessageId
      ? { manualUnreadFromMessageId: patch.manualUnreadFromMessageId ?? null }
      : {}),
  };
}

export function syncManualUnreadStateCache(
  queryClient: QueryClient,
  patch: TeamChatManualUnreadStatePatch,
) {
  const normalizedRoomId = patch.roomId.trim();
  if (!normalizedRoomId) return;

  const roomListRootQueryKey = [...teamChatQueryKeys.rooms(), 'list'] as const;

  queryClient.setQueriesData<TeamChatPaginatedResponse<TeamChatRoomSummaryResponse> | undefined>(
    { queryKey: roomListRootQueryKey },
    (current) => {
      if (!current?.data?.length) return current;
      let didUpdate = false;
      const nextRooms = current.data.map((room) => {
        if (room.id !== normalizedRoomId) return room;
        didUpdate = true;
        return applyManualUnreadPatchToRoom(room, patch);
      });
      return didUpdate ? { ...current, data: nextRooms } : current;
    },
  );

  queryClient.setQueryData<TeamChatRoomDetailResponse | undefined>(
    teamChatQueryKeys.roomDetail(normalizedRoomId),
    (current) => (current ? applyManualUnreadPatchToRoom(current, patch) : current),
  );

  queryClient.setQueriesData<Record<string, TeamChatRoomDetailResponse | null> | undefined>(
    { queryKey: teamChatQueryKeys.privateRoomDetailsRoot() },
    (current) => {
      if (!current || typeof current !== 'object' || Array.isArray(current)) return current;
      const roomDetail = current[normalizedRoomId];
      if (!roomDetail) return current;
      return {
        ...current,
        [normalizedRoomId]: applyManualUnreadPatchToRoom(roomDetail, patch),
      };
    },
  );
}

export function useUpdateTeamChatRoomPolicies() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        roomId,
        body,
      }: {
        roomId: string;
        body: UpdateTeamChatRoomPoliciesBody;
      }) => service.updateRoomPolicies(roomId, body),
      onSuccess: (data, variables) => {
        syncRoomSnapshotCaches(queryClient, data.room);
        if (!data.room) {
          void queryClient.setQueryData(
            teamChatQueryKeys.roomDetail(variables.roomId),
            (current) =>
              current
                ? {
                    ...current,
                    allowMemberPinMessages: data.currentAllowMemberPinMessages,
                    allowGuestPinMessages: data.currentAllowGuestPinMessages,
                  }
                : current,
          );
          syncPrivateRoomDetailCaches(queryClient, variables.roomId, (current) => ({
            ...current,
            allowMemberPinMessages: data.currentAllowMemberPinMessages,
            allowGuestPinMessages: data.currentAllowGuestPinMessages,
          }));
        }
        invalidateRoomDetailCaches(queryClient, variables.roomId);
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.rooms() });
      },
    }),
  );
}

export function useUpdateTeamChatRoomInfo() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        roomId,
        body,
      }: {
        roomId: string;
        body: UpdateTeamChatRoomInfoBody;
      }) => service.updateRoomInfo(roomId, body),
      onSuccess: (data, variables) => {
        if (data.room) {
          void queryClient.setQueryData<TeamChatRoomDetailResponse | undefined>(
            teamChatQueryKeys.roomDetail(variables.roomId),
            (current) =>
              current
                ? {
                    ...current,
                    name: data.room?.name ?? current.name,
                    topic: data.room?.topic ?? current.topic ?? null,
                    description: data.room?.description ?? current.description ?? null,
                  }
                : current,
          );
          syncPrivateRoomDetailCaches(queryClient, variables.roomId, (current) => ({
            ...current,
            name: data.room?.name ?? current.name,
            topic: data.room?.topic ?? current.topic ?? null,
            description: data.room?.description ?? current.description ?? null,
          }));
        }
        invalidateRoomDetailCaches(queryClient, variables.roomId);
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.rooms() });
      },
    }),
  );
}

export function useTeamChatRoomTabs(
  roomId: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  },
) {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.roomTabs(roomId),
      queryFn: () => service.getRoomTabs(roomId),
      enabled: Boolean(roomId) && (options?.enabled ?? true),
      staleTime: options?.staleTime ?? 15_000,
    }),
  );
}

export function useJoinTeamChatRoom() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (roomId: string) => service.joinRoom(roomId),
      onSuccess: (data, roomId) => {
        upsertRoomDetailIntoRoomListCaches(queryClient, data.room);
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.discoverRoomsRoot() });
        void queryClient.setQueryData(teamChatQueryKeys.roomPreview(roomId), data.room);
      },
    }),
  );
}

export function useInviteTeamChatMembers() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        roomId,
        body,
      }: {
        roomId: string;
        body: InviteTeamChatRoomMembersBody;
      }) => service.inviteMembers(roomId, body),
      onSuccess: (_data, variables) => {
        invalidateRoomDetailCaches(queryClient, variables.roomId);
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.notificationsRoot() });
      },
    }),
  );
}

export function useAcceptTeamChatInvitation() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (invitationId: string) => service.acceptInvitation(invitationId),
      onSuccess: (result) => {
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.discoverRoomsRoot() });
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.unreadSummary() });
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.notificationsRoot() });
        if (result.roomId) {
          void (async () => {
            try {
              const roomDetail = await service.getRoomDetail(result.roomId, {
                includeMembers: false,
              });
              upsertRoomDetailIntoRoomListCaches(queryClient, roomDetail);
            } catch {
              invalidateRoomDetailCaches(queryClient, result.roomId);
            }
          })();
          void queryClient.invalidateQueries({
            queryKey: teamChatQueryKeys.roomPreview(result.roomId),
          });
        }
      },
    }),
  );
}

export function useUpdateTeamChatMemberRole() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        roomId,
        memberId,
        body,
      }: {
        roomId: string;
        memberId: string;
        body: UpdateTeamChatMemberRoleBody;
      }) => service.updateMemberRole(roomId, memberId, body),
      onSuccess: (data, variables) => {
        syncRoomSnapshotCaches(queryClient, data.room);
        if (!data.room) {
          void queryClient.setQueryData<TeamChatRoomDetailResponse | undefined>(
            teamChatQueryKeys.roomDetail(variables.roomId),
            (current) =>
              current
                ? {
                    ...current,
                    members: current.members.map((member) =>
                      member.userId === data.memberId
                        ? {
                            ...member,
                            memberRole: data.currentRole,
                          }
                        : member,
                    ),
                  }
                : current,
          );
          syncPrivateRoomDetailCaches(queryClient, variables.roomId, (current) => ({
            ...current,
            members: current.members.map((member) =>
              member.userId === data.memberId
                ? {
                    ...member,
                    memberRole: data.currentRole,
                  }
                : member,
            ),
          }));
        }
        invalidateRoomDetailCaches(queryClient, variables.roomId);
      },
    }),
  );
}

export function useTransferTeamChatRoomOwnership() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        roomId,
        body,
      }: {
        roomId: string;
        body: UpdateTeamChatRoomOwnershipBody;
      }) => service.transferRoomOwnership(roomId, body),
      onSuccess: (data, variables) => {
        syncRoomSnapshotCaches(queryClient, data.room);

        if (data.previousOwnerUserId && data.currentOwnerUserId) {
          void queryClient.setQueryData<TeamChatRoomDetailResponse | undefined>(
            teamChatQueryKeys.roomDetail(variables.roomId),
            (current) =>
              current
                ? {
                    ...current,
                    ownerId: data.currentOwnerUserId ?? current.ownerId,
                    members: current.members.map((member) => {
                      if (member.userId === data.currentOwnerUserId) {
                        return { ...member, memberRole: 'owner' };
                      }
                      if (member.userId === data.previousOwnerUserId) {
                        return { ...member, memberRole: 'admin' };
                      }
                      return member;
                    }),
                  }
                : current,
          );
          syncPrivateRoomDetailCaches(queryClient, variables.roomId, (current) => ({
            ...current,
            ownerId: data.currentOwnerUserId ?? current.ownerId,
            members: current.members.map((member) => {
              if (member.userId === data.currentOwnerUserId) {
                return { ...member, memberRole: 'owner' };
              }
              if (member.userId === data.previousOwnerUserId) {
                return { ...member, memberRole: 'admin' };
              }
              return member;
            }),
          }));
        }

        invalidateRoomDetailCaches(queryClient, variables.roomId);
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.rooms() });
      },
    }),
  );
}

export function useUpdateTeamChatNotifySettings() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        roomId,
        body,
      }: {
        roomId: string;
        body: UpdateTeamChatNotifySettingsBody;
      }) => service.updateMyNotifySettings(roomId, body),
      onSuccess: (_data, variables) => {
        invalidateRoomDetailCaches(queryClient, variables.roomId);
      },
    }),
  );
}

export function useRemoveTeamChatMember() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({ roomId, memberId }: { roomId: string; memberId: string }) =>
        service.removeMember(roomId, memberId),
      onSuccess: (data, variables) => {
        syncRoomSnapshotCaches(queryClient, data.room);
        invalidateRoomDetailCaches(queryClient, variables.roomId);
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.rooms() });
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.discoverRoomsRoot() });
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.roomPreview(variables.roomId),
        });
      },
    }),
  );
}

export function useTeamChatMessages(roomId: string, params?: ListTeamChatMessagesParams) {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.messageList(roomId, params),
      queryFn: () => service.listMessages(roomId, params ?? {}),
      enabled: Boolean(roomId),
      staleTime: 15_000,
    }),
  );
}

export function useStarTeamChatRoom() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (roomId: string) => service.starRoom(roomId),
      onSuccess: (_data, roomId) => {
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.rooms() });
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.roomDetail(roomId),
        });
      },
    }),
  );
}

export function useTeamChatMessageCursor(
  roomId: string,
  params?: ListTeamChatMessageCursorParams,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  },
) {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.messageCursor(roomId, params),
      queryFn: () => service.listMessagesByCursor(roomId, params ?? {}),
      enabled: Boolean(roomId) && (options?.enabled ?? true),
      staleTime: options?.staleTime ?? 15_000,
    }),
  );
}

export function useTeamChatMessageLinkPreview(
  roomId: string,
  messageId: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  },
) {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.messageLinkPreview(roomId, messageId),
      queryFn: () => service.getMessageLinkPreview(roomId, messageId),
      enabled: Boolean(roomId && messageId) && (options?.enabled ?? true),
      staleTime: options?.staleTime ?? 60_000,
    }),
  );
}

export function useTeamChatMessageContext(
  roomId: string,
  messageId: string,
  params?: GetTeamChatMessageContextParams,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  },
) {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.messageContext(roomId, messageId, params),
      queryFn: () => service.getMessageContext(roomId, messageId, params ?? {}),
      enabled: Boolean(roomId && messageId) && (options?.enabled ?? true),
      staleTime: options?.staleTime ?? 30_000,
    }),
  );
}

export function useUpdateTeamChatRoomVisibility() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        roomId,
        body,
      }: {
        roomId: string;
        body: UpdateTeamChatRoomVisibilityBody;
      }) => service.updateMyRoomVisibility(roomId, body),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.roomDetail(variables.roomId),
        });
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.rooms() });
      },
    }),
  );
}

export function useArchiveTeamChatRoom() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (roomId: string) => service.archiveRoom(roomId),
      onSuccess: (data, roomId) => {
        syncRoomSnapshotCaches(queryClient, data.room);
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.rooms() });
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.discoverRoomsRoot() });
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.roomPreview(roomId),
        });
        invalidateRoomDetailCaches(queryClient, roomId);
      },
    }),
  );
}

export function useUnarchiveTeamChatRoom() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (roomId: string) => service.unarchiveRoom(roomId),
      onSuccess: (data, roomId) => {
        syncRoomSnapshotCaches(queryClient, data.room);
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.rooms() });
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.discoverRoomsRoot() });
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.roomPreview(roomId),
        });
        invalidateRoomDetailCaches(queryClient, roomId);
      },
    }),
  );
}

export function useUpdateTeamChatRoomTabs() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        roomId,
        body,
      }: {
        roomId: string;
        body: UpdateTeamChatRoomTabsBody;
      }) => service.updateRoomTabs(roomId, body),
      onSuccess: (data, variables) => {
        void queryClient.setQueryData(teamChatQueryKeys.roomTabs(variables.roomId), data);
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.roomTabs(variables.roomId),
        });
      },
    }),
  );
}

export function useUnstarTeamChatRoom() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (roomId: string) => service.unstarRoom(roomId),
      onSuccess: (_data, roomId) => {
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.rooms() });
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.roomDetail(roomId),
        });
      },
    }),
  );
}

export function useSendTeamChatMessage() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({ roomId, body }: { roomId: string; body: SendTeamChatMessageBody }) =>
        service.sendMessage(roomId, body),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.messageCursorRoot(variables.roomId),
        });
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.unreadSummary() });
      },
    }),
  );
}

export function useForwardTeamChatMessage() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        roomId,
        messageId,
        body,
      }: {
        roomId: string;
        messageId: string;
        body: ForwardTeamChatMessageBody;
      }) => service.forwardMessage(roomId, messageId, body),
      onSuccess: (data, variables) => {
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.messageCursorRoot(variables.roomId),
        });
        const targetRoomIds = Array.from(
          new Set(
            data.results
              .filter((item) => item.forwarded)
              .map((item) => item.targetRoomId?.trim() ?? '')
              .filter((roomId) => roomId.length > 0),
          ),
        );

        targetRoomIds.forEach((roomId) => {
          void queryClient.invalidateQueries({
            queryKey: teamChatQueryKeys.messageCursorRoot(roomId),
          });
          void queryClient.invalidateQueries({
            queryKey: [...teamChatQueryKeys.rooms(), 'bootstrap', roomId],
          });
          void queryClient.invalidateQueries({
            queryKey: teamChatQueryKeys.roomDetail(roomId),
          });
        });
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.rooms() });
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.unreadSummary() });
      },
    }),
  );
}

export function useUpdateTeamChatMessage() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        roomId,
        messageId,
        body,
      }: {
        roomId: string;
        messageId: string;
        body: UpdateTeamChatMessageBody;
      }) => service.updateMessage(roomId, messageId, body),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.messageCursorRoot(variables.roomId),
        });
      },
    }),
  );
}

export function useDeleteTeamChatMessage() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({ roomId, messageId }: { roomId: string; messageId: string }) =>
        service.deleteMessage(roomId, messageId),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.messageCursorRoot(variables.roomId),
        });
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.pinnedMessages(variables.roomId) });
      },
    }),
  );
}

export function useUploadTeamChatAttachment() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        roomId,
        messageId,
        body,
      }: {
        roomId: string;
        messageId: string;
        body: UploadTeamChatMessageAttachmentBody;
      }) => service.uploadMessageAttachment(roomId, messageId, body),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.messageAttachments(variables.roomId, variables.messageId),
        });
      },
    }),
  );
}

export function useTeamChatMessageAttachments(roomId: string, messageId: string) {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.messageAttachments(roomId, messageId),
      queryFn: () => service.listMessageAttachments(roomId, messageId),
      enabled: Boolean(roomId && messageId),
      staleTime: 20_000,
    }),
  );
}

export function useTeamChatRoomAttachments(
  roomId: string,
  params?: ListTeamChatRoomAttachmentsParams,
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false;
  },
) {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.roomAttachments(roomId, params),
      queryFn: () => service.listRoomAttachments(roomId, params ?? {}),
      enabled: Boolean(roomId) && (options?.enabled ?? true),
      staleTime: 20_000,
      refetchInterval: options?.refetchInterval ?? 25_000,
    }),
  );
}

export function useTeamChatMessageSearch(
  roomId: string,
  params?: ListTeamChatRoomMessageSearchParams,
) {
  const service = useTeamChatService();
  const query = params?.q?.trim() ?? '';
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.messageSearch(roomId, params),
      queryFn: () => service.searchMessages(roomId, params!),
      enabled: Boolean(roomId && query.length > 0),
      staleTime: 8_000,
    }),
  );
}

export function useDeleteTeamChatAttachment() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        roomId,
        messageId,
        attachmentId,
      }: {
        roomId: string;
        messageId: string;
        attachmentId: string;
      }) => service.deleteMessageAttachment(roomId, messageId, attachmentId),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.messageAttachments(variables.roomId, variables.messageId),
        });
      },
    }),
  );
}

export function useUpdateTeamChatReadState() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({ roomId, body }: { roomId: string; body: UpdateTeamChatReadStateBody }) =>
        service.updateReadState(roomId, body),
      onSuccess: (data) => {
        syncUnreadSummaryCache(queryClient, data);
        syncManualUnreadStateCache(queryClient, data);
      },
    }),
  );
}

export function useUpsertTeamChatCurrentDraft() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({ roomId, body }: { roomId: string; body: UpdateTeamChatCurrentDraftBody }) =>
        service.upsertCurrentDraft(roomId, body),
      onSuccess: (data, variables) => {
        const draftContext = {
          threadRootMessageId: variables.body.threadRootMessageId,
          parentMessageId: variables.body.parentMessageId,
        };
        const nextDraft = data.draftDeleted ? null : data.draft ?? null;

        void queryClient.setQueryData(
          teamChatQueryKeys.currentDraft(variables.roomId, draftContext),
          nextDraft,
        );
        syncDraftsHubCaches(queryClient, (currentItems) => {
          const nextItems = currentItems.filter(
            (draftItem) =>
              !(
                draftItem.roomId === variables.roomId &&
                normalizeDraftContextValue(draftItem.threadRootMessageId) ===
                  normalizeDraftContextValue(draftContext.threadRootMessageId) &&
                normalizeDraftContextValue(draftItem.parentMessageId) ===
                  normalizeDraftContextValue(draftContext.parentMessageId)
              ),
          );

          return nextDraft ? [nextDraft, ...nextItems] : nextItems;
        });
        if (data.draftDeleted && data.draft?.id) {
          clearDraftFromCurrentDraftCaches(queryClient, data.draft.id);
        }
      },
    }),
  );
}

export function useUpdateTeamChatChannelVisibility() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        roomId,
        body,
      }: {
        roomId: string;
        body: UpdateTeamChatChannelVisibilityBody;
      }) => service.updateChannelVisibility(roomId, body),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.roomDetail(variables.roomId),
        });
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.roomPreview(variables.roomId),
        });
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.rooms() });
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.discoverRoomsRoot() });
      },
    }),
  );
}

export function useTeamChatCurrentDraft(
  roomId: string,
  params?: GetTeamChatCurrentDraftParams,
  options?: { enabled?: boolean },
) {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.currentDraft(roomId, params),
      queryFn: () => service.getCurrentDraft(roomId, params ?? {}),
      enabled: Boolean(roomId) && (options?.enabled ?? true),
      staleTime: 15_000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }),
  );
}

export function useTeamChatDrafts(params?: ListTeamChatDraftsParams) {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.draftsHub(params),
      queryFn: () => service.listDrafts(params ?? {}),
      staleTime: 30_000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }),
  );
}

export function useDeleteTeamChatDraft() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (draftId: string) => service.deleteDraft(draftId),
      onSuccess: (data) => {
        clearDraftFromCurrentDraftCaches(queryClient, data.draftId);
        syncDraftsHubCaches(queryClient, (currentItems) =>
          currentItems.filter((draftItem) => draftItem.id !== data.draftId),
        );
      },
    }),
  );
}

export function useCreateTeamChatScheduledMessage() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({ roomId, body }: { roomId: string; body: CreateTeamChatScheduledMessageBody }) =>
        service.createScheduledMessage(roomId, body),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.scheduledMessagesRoot() });
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.draftsHubRoot() });
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.currentDraft(variables.roomId, {
            threadRootMessageId: variables.body.threadRootMessageId,
            parentMessageId: variables.body.parentMessageId,
          }),
        });
      },
    }),
  );
}

export function useTeamChatScheduledMessages(params?: ListTeamChatScheduledMessagesParams) {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.scheduledMessages(params),
      queryFn: () => service.listScheduledMessages(params ?? {}),
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    }),
  );
}

export function useUpdateTeamChatScheduledMessage() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        scheduledMessageId,
        body,
      }: {
        scheduledMessageId: string;
        body: UpdateTeamChatScheduledMessageBody;
      }) => service.updateScheduledMessage(scheduledMessageId, body),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.scheduledMessagesRoot() });
      },
    }),
  );
}

export function useCancelTeamChatScheduledMessageToDraft() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (scheduledMessageId: string) =>
        service.cancelScheduledMessageToDraft(scheduledMessageId),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.scheduledMessagesRoot() });
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.draftsHubRoot() });
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.currentDrafts() });
      },
    }),
  );
}

export function useSendTeamChatScheduledMessageNow() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (scheduledMessageId: string) => service.sendScheduledMessageNow(scheduledMessageId),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.scheduledMessagesRoot() });
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.messages() });
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.rooms() });
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.unreadSummary() });
      },
    }),
  );
}

export function useDeleteTeamChatScheduledMessage() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (scheduledMessageId: string) => service.deleteScheduledMessage(scheduledMessageId),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.scheduledMessagesRoot() });
      },
    }),
  );
}

export function useTeamChatUnreadSummary() {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.unreadSummary(),
      queryFn: () => service.getUnreadSummary(),
      staleTime: 30_000,
    }),
  );
}

export function useAddTeamChatReaction() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        roomId,
        messageId,
        body,
      }: {
        roomId: string;
        messageId: string;
        body: AddTeamChatReactionBody;
      }) => service.addReaction(roomId, messageId, body),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.messageReactions(variables.roomId, variables.messageId),
          exact: true,
        });
      },
    }),
  );
}

export function useRemoveTeamChatReaction() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        roomId,
        messageId,
        emoji,
      }: {
        roomId: string;
        messageId: string;
        emoji: string;
      }) => service.removeReaction(roomId, messageId, emoji),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.messageReactions(variables.roomId, variables.messageId),
          exact: true,
        });
      },
    }),
  );
}

export function useTeamChatMessageReactions(roomId: string, messageId: string) {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.messageReactions(roomId, messageId),
      queryFn: () => service.listReactions(roomId, messageId),
      enabled: Boolean(roomId && messageId),
      staleTime: 10_000,
    }),
  );
}

export function usePinTeamChatMessage() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();
  type PinMutationContext = {
    previousPinnedMessages?: TeamChatPinnedMessageResponse[];
    previousRoomPinState?: TeamChatRoomPinStateResponse;
  };
  type PinMutationVariables = {
    roomId: string;
    messageId: string;
  };

  return useSafeMutation(
    useMutation<
      TeamChatToggleMessagePinResponse,
      unknown,
      PinMutationVariables,
      PinMutationContext
    >({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: teamChatQueryKeys.pinnedMessages(variables.roomId),
        });
        await queryClient.cancelQueries({
          queryKey: teamChatQueryKeys.roomPinState(variables.roomId),
        });

        const previousPinnedMessages = queryClient.getQueryData<
          TeamChatPinnedMessageResponse[] | undefined
        >(teamChatQueryKeys.pinnedMessages(variables.roomId));
        const previousRoomPinState = queryClient.getQueryData<
          TeamChatRoomPinStateResponse | undefined
        >(teamChatQueryKeys.roomPinState(variables.roomId));
        const cachedMessage = readCachedRoomMessageForPin(
          queryClient,
          variables.roomId,
          variables.messageId,
        );

        queryClient.setQueryData<TeamChatPinnedMessageResponse[] | undefined>(
          teamChatQueryKeys.pinnedMessages(variables.roomId),
          (previous) => {
            const currentPinnedMessages = Array.isArray(previous) ? previous : [];
            if (currentPinnedMessages.some((item) => item.messageId === variables.messageId)) {
              return currentPinnedMessages;
            }
            if (!cachedMessage) {
              return currentPinnedMessages;
            }

            const optimisticPinnedMessage: TeamChatPinnedMessageResponse = {
              id: `optimistic-pin-${variables.messageId}`,
              roomId: variables.roomId,
              messageId: variables.messageId,
              pinnedBy: cachedMessage.senderId,
              pinnedAt: new Date().toISOString(),
              message: cachedMessage,
            };
            return [optimisticPinnedMessage, ...currentPinnedMessages];
          },
        );

        queryClient.setQueryData<TeamChatRoomPinStateResponse>(
          teamChatQueryKeys.roomPinState(variables.roomId),
          (current) => {
            const optimisticPinnedMessages =
              queryClient.getQueryData<TeamChatPinnedMessageResponse[] | undefined>(
                teamChatQueryKeys.pinnedMessages(variables.roomId),
              ) ?? [];
            const optimisticPinnedCount =
              typeof current?.pinnedCount === 'number'
                ? Math.max(current.pinnedCount, optimisticPinnedMessages.length)
                : optimisticPinnedMessages.length;

            return {
              roomId: variables.roomId,
              roomPinVersion: current?.roomPinVersion ?? previousRoomPinState?.roomPinVersion ?? 0,
              pinnedCount: optimisticPinnedCount,
              updatedAt: current?.updatedAt ?? previousRoomPinState?.updatedAt ?? null,
              lastEventId: current?.lastEventId ?? previousRoomPinState?.lastEventId ?? null,
            };
          },
        );

        return {
          previousPinnedMessages,
          previousRoomPinState,
        };
      },
      mutationFn: ({ roomId, messageId }) =>
        service.pinMessage(roomId, messageId),
      onError: (_error, variables, context) => {
        queryClient.setQueryData(
          teamChatQueryKeys.pinnedMessages(variables.roomId),
          context?.previousPinnedMessages,
        );
        queryClient.setQueryData(
          teamChatQueryKeys.roomPinState(variables.roomId),
          context?.previousRoomPinState,
        );
      },
      onSuccess: (data, variables) => {
        const normalizedAction = normalizePinAction(data.action);
        syncRoomPinStateCache(queryClient, {
          roomId: data.roomId || variables.roomId,
          roomPinVersion: data.roomPinVersion,
          pinnedCount: data.pinnedCount,
        });

        queryClient.setQueryData<TeamChatPinnedMessageResponse[] | undefined>(
          teamChatQueryKeys.pinnedMessages(variables.roomId),
          (previous) => {
            const currentPinnedMessages = Array.isArray(previous) ? previous : [];

            if (normalizedAction !== 'pinned') {
              return currentPinnedMessages;
            }

            const resolvedMessageId = data.pin?.messageId ?? data.messageId;
            const existingPinnedMessage = currentPinnedMessages.find(
              (item) => item.messageId === resolvedMessageId,
            );
            if (existingPinnedMessage) {
              return currentPinnedMessages.map((item) =>
                item.messageId !== resolvedMessageId
                  ? item
                  : {
                      ...item,
                      id: data.pin?.id ?? item.id,
                      pinnedBy: data.pin?.pinnedBy ?? item.pinnedBy,
                      pinnedAt: data.pin?.pinnedAt ?? item.pinnedAt,
                    },
              );
            }

            const cachedMessage = readCachedRoomMessageForPin(
              queryClient,
              variables.roomId,
              resolvedMessageId,
            );
            if (!cachedMessage) {
              return currentPinnedMessages;
            }

            const nextPinnedMessage: TeamChatPinnedMessageResponse = {
              id: data.pin?.id ?? `mutation-pin-${resolvedMessageId}`,
              roomId: data.pin?.roomId ?? variables.roomId,
              messageId: resolvedMessageId,
              pinnedBy: data.pin?.pinnedBy ?? cachedMessage.senderId,
              pinnedAt: data.pin?.pinnedAt ?? cachedMessage.sentAt,
              message: cachedMessage,
            };

            return [nextPinnedMessage, ...currentPinnedMessages];
          },
        );
      },
    }),
  );
}

export function useUnpinTeamChatMessage() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();
  type UnpinMutationContext = {
    previousPinnedMessages?: TeamChatPinnedMessageResponse[];
    previousRoomPinState?: TeamChatRoomPinStateResponse;
  };
  type UnpinMutationVariables = {
    roomId: string;
    messageId: string;
  };

  return useSafeMutation(
    useMutation<
      TeamChatToggleMessagePinResponse,
      unknown,
      UnpinMutationVariables,
      UnpinMutationContext
    >({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: teamChatQueryKeys.pinnedMessages(variables.roomId),
        });
        await queryClient.cancelQueries({
          queryKey: teamChatQueryKeys.roomPinState(variables.roomId),
        });

        const previousPinnedMessages = queryClient.getQueryData<
          TeamChatPinnedMessageResponse[] | undefined
        >(teamChatQueryKeys.pinnedMessages(variables.roomId));
        const previousRoomPinState = queryClient.getQueryData<
          TeamChatRoomPinStateResponse | undefined
        >(teamChatQueryKeys.roomPinState(variables.roomId));

        queryClient.setQueryData<TeamChatPinnedMessageResponse[] | undefined>(
          teamChatQueryKeys.pinnedMessages(variables.roomId),
          (previous) => {
            if (!Array.isArray(previous) || previous.length === 0) {
              return previous;
            }
            const nextPinnedMessages = previous.filter(
              (item) => item.messageId !== variables.messageId,
            );
            return nextPinnedMessages.length === previous.length ? previous : nextPinnedMessages;
          },
        );

        queryClient.setQueryData<TeamChatRoomPinStateResponse>(
          teamChatQueryKeys.roomPinState(variables.roomId),
          (current) => {
            const optimisticPinnedMessages =
              queryClient.getQueryData<TeamChatPinnedMessageResponse[] | undefined>(
                teamChatQueryKeys.pinnedMessages(variables.roomId),
              ) ?? [];
            const optimisticPinnedCount =
              typeof current?.pinnedCount === 'number'
                ? Math.max(0, Math.min(current.pinnedCount, optimisticPinnedMessages.length))
                : optimisticPinnedMessages.length;

            return {
              roomId: variables.roomId,
              roomPinVersion: current?.roomPinVersion ?? previousRoomPinState?.roomPinVersion ?? 0,
              pinnedCount: optimisticPinnedCount,
              updatedAt: current?.updatedAt ?? previousRoomPinState?.updatedAt ?? null,
              lastEventId: current?.lastEventId ?? previousRoomPinState?.lastEventId ?? null,
            };
          },
        );

        return {
          previousPinnedMessages,
          previousRoomPinState,
        };
      },
      mutationFn: ({ roomId, messageId }) =>
        service.unpinMessage(roomId, messageId),
      onError: (_error, variables, context) => {
        queryClient.setQueryData(
          teamChatQueryKeys.pinnedMessages(variables.roomId),
          context?.previousPinnedMessages,
        );
        queryClient.setQueryData(
          teamChatQueryKeys.roomPinState(variables.roomId),
          context?.previousRoomPinState,
        );
      },
      onSuccess: (data, variables) => {
        const normalizedAction = normalizePinAction(data.action);
        syncRoomPinStateCache(queryClient, {
          roomId: data.roomId || variables.roomId,
          roomPinVersion: data.roomPinVersion,
          pinnedCount: data.pinnedCount,
        });

        queryClient.setQueryData<TeamChatPinnedMessageResponse[] | undefined>(
          teamChatQueryKeys.pinnedMessages(variables.roomId),
          (previous) => {
            if (!Array.isArray(previous) || previous.length === 0) return previous;

            if (normalizedAction !== 'unpinned') {
              return previous;
            }

            const resolvedMessageId = data.messageId || variables.messageId;
            const nextPinnedMessages = previous.filter(
              (item) => item.messageId !== resolvedMessageId,
            );

            return nextPinnedMessages.length === previous.length
              ? previous
              : nextPinnedMessages;
          },
        );
      },
    }),
  );
}

export function useTeamChatPinnedMessages(
  roomId: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  },
) {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.pinnedMessages(roomId),
      queryFn: () => service.listPinnedMessages(roomId),
      enabled: Boolean(roomId) && (options?.enabled ?? true),
      staleTime: options?.staleTime ?? 10_000,
    }),
  );
}

export function useTeamChatRoomPinState(
  roomId: string,
  options?: {
    enabled?: boolean;
  },
) {
  const queryClient = useQueryClient();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.roomPinState(roomId),
      queryFn: async () =>
        queryClient.getQueryData<TeamChatRoomPinStateResponse | null>(
          teamChatQueryKeys.roomPinState(roomId),
        ) ?? null,
      enabled: Boolean(roomId) && (options?.enabled ?? true),
      staleTime: Number.POSITIVE_INFINITY,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    }),
  );
}

export function useUpdateTeamChatPresence() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (body: UpdateTeamChatPresenceBody) => service.updateMyPresence(body),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.presence() });
      },
    }),
  );
}

export function useTeamChatPresence() {
  const service = useTeamChatService();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.presence(),
      queryFn: () => service.listPresence(),
      staleTime: 30_000,
    }),
  );
}

export function useTeamChatMentions(params?: ListTeamChatMentionsParams) {
  const service = useTeamChatService();
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.mentions(ctx.tenantId, params),
      queryFn: () => service.listMyMentions(params ?? {}),
      staleTime: 30_000,
    }),
  );
}

export function useMarkTeamChatMentionRead() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (mentionId: string) => service.markMentionRead(mentionId),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.mentionsRoot() });
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.notificationsRoot() });
      },
    }),
  );
}

export function useMarkAllTeamChatMentionsRead() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (body?: MarkAllTeamChatMentionsReadBody) => service.markMyMentionsReadAll(body),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.mentionsRoot() });
      },
    }),
  );
}

export function useMarkTeamChatPersonalInboxRoomRead() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        roomId,
        body,
      }: {
        roomId: string;
        body?: MarkTeamChatPersonalInboxRoomReadBody;
      }) => service.markPersonalInboxRoomRead(roomId, body ?? {}),
      onSuccess: (data) => {
        queryClient.setQueryData<TeamChatUnreadSummaryResponse | undefined>(
          teamChatQueryKeys.unreadSummary(),
          (current) => {
            if (!current) return current;
            return withUnreadSummaryAggregates(current, data.afterAggregates);
          },
        );
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.mentionsRoot() });
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.notificationsRoot() });
        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
    }),
  );
}

export function useTeamChatNotifications(params?: ListTeamChatNotificationsParams) {
  const service = useTeamChatService();
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.notifications(ctx.tenantId, params),
      queryFn: () => service.listNotifications(params ?? {}),
      staleTime: 30_000,
    }),
  );
}

export function useMarkTeamChatNotificationRead() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (notificationId: string) => service.markNotificationRead(notificationId),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.notificationsRoot() });
      },
    }),
  );
}

export function useMarkAllTeamChatNotificationsRead() {
  const service = useTeamChatService();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (body?: MarkAllTeamChatNotificationsReadBody) =>
        service.markNotificationsReadAll(body),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.notificationsRoot() });
      },
    }),
  );
}




