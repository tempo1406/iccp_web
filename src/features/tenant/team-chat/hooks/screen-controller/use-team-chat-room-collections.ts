'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  DirectMessageContact,
  GroupDirectMessageConversation,
  WorkspaceChannel,
} from '../../data/team-chat-ui-data';
import type { RecoverableConversationItem } from '../../lib/team-chat-screen.shared';
import {
  buildPresenceMap,
  buildUnreadCountMap,
  extractUnreadRoomSummaries,
  mapPresenceToDirectMessageContact,
  mapRoomToDirectMessageContact,
  mapRoomToGroupDirectMessageConversation,
  mapRoomToWorkspaceChannel,
} from '../../lib/team-chat-api-mappers';
import {
  mapPresenceToUiStatus,
  mapRoomSummaryToRecoverableItem,
  normalizeContactIdentity,
  shouldFetchRoomMembersForIdentity,
  shouldHydratePrivateRoomSidebarDetail,
} from '../../lib/screen-controller/team-chat-controller-room.utils';
import { TeamChatService } from '../../services/team-chat.service';
import type {
  TeamChatPaginatedResponse,
  TeamChatPresenceResponse,
  TeamChatRoomSummaryResponse,
  TeamChatUnreadSummaryResponse,
} from '../../services/types/team-chat.types';
import { teamChatQueryKeys } from '../../query/use-team-chat';

function toUnixTimestamp(value?: string | null): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function compareRoomByRecentActivityDesc(
  left: Pick<TeamChatRoomSummaryResponse, 'id' | 'lastMessageAt' | 'updatedAt'>,
  right: Pick<TeamChatRoomSummaryResponse, 'id' | 'lastMessageAt' | 'updatedAt'>,
): number {
  const leftRecent = toUnixTimestamp(left.lastMessageAt ?? left.updatedAt ?? null);
  const rightRecent = toUnixTimestamp(right.lastMessageAt ?? right.updatedAt ?? null);
  if (leftRecent !== rightRecent) return rightRecent - leftRecent;

  const leftUpdatedAt = toUnixTimestamp(left.updatedAt ?? null);
  const rightUpdatedAt = toUnixTimestamp(right.updatedAt ?? null);
  if (leftUpdatedAt !== rightUpdatedAt) return rightUpdatedAt - leftUpdatedAt;

  return right.id.localeCompare(left.id);
}

function sortRoomsByRecentActivity(
  rooms: TeamChatRoomSummaryResponse[],
): TeamChatRoomSummaryResponse[] {
  return [...rooms].sort(compareRoomByRecentActivityDesc);
}

export function useTeamChatRoomCollections(params: {
  roomsData?: TeamChatPaginatedResponse<TeamChatRoomSummaryResponse>;
  archivedRoomsData?: TeamChatPaginatedResponse<TeamChatRoomSummaryResponse>;
  hiddenRoomsData?: TeamChatPaginatedResponse<TeamChatRoomSummaryResponse>;
  starredRoomsData?: TeamChatPaginatedResponse<TeamChatRoomSummaryResponse>;
  unreadSummaryData?: TeamChatUnreadSummaryResponse;
  presenceData?: TeamChatPresenceResponse[];
  currentUserId?: string | null;
  currentUserDisplayName?: string;
  currentUserEmail?: string | null;
  service: TeamChatService;
}) {
  const roomSummaries = useMemo(
    () => sortRoomsByRecentActivity(params.roomsData?.data ?? []),
    [params.roomsData],
  );
  const archivedRoomSummaries = useMemo(
    () => sortRoomsByRecentActivity(params.archivedRoomsData?.data ?? []),
    [params.archivedRoomsData],
  );
  const hiddenRoomSummaries = useMemo(
    () => sortRoomsByRecentActivity(params.hiddenRoomsData?.data ?? []),
    [params.hiddenRoomsData],
  );
  const starredRoomSummaries = useMemo(
    () => sortRoomsByRecentActivity(params.starredRoomsData?.data ?? []),
    [params.starredRoomsData],
  );

  const hiddenNonArchivedRoomSummaries = useMemo(
    () => hiddenRoomSummaries.filter((room) => !room.isArchived),
    [hiddenRoomSummaries],
  );
  const roomSummaryById = useMemo(
    () => new Map(roomSummaries.map((room) => [room.id, room] as const)),
    [roomSummaries],
  );
  const unreadCountMap = useMemo(
    () => buildUnreadCountMap(params.unreadSummaryData),
    [params.unreadSummaryData],
  );
  const presenceMap = useMemo(
    () => buildPresenceMap(params.presenceData),
    [params.presenceData],
  );
  const currentUserPresence = params.currentUserId
    ? presenceMap.get(params.currentUserId)
    : undefined;
  const currentUserPresenceStatus = useMemo(() => {
    const normalizedStatus = currentUserPresence?.presenceStatus?.trim().toLowerCase();
    const normalizedSource = currentUserPresence?.source?.trim().toLowerCase();
    if ((!normalizedStatus || normalizedStatus === 'away') && normalizedSource !== 'manual') {
      return 'online';
    }
    return mapPresenceToUiStatus(normalizedStatus ?? 'online');
  }, [currentUserPresence?.presenceStatus, currentUserPresence?.source]);

  const workspaceChannels = useMemo<WorkspaceChannel[]>(
    () =>
      roomSummaries
        .filter((room) => room.roomType === 'channel')
        .map((room) => mapRoomToWorkspaceChannel(room, unreadCountMap)),
    [roomSummaries, unreadCountMap],
  );

  const groupDmRoomSummaries = useMemo(
    () => roomSummaries.filter((room) => room.roomType === 'group_dm'),
    [roomSummaries],
  );
  const groupDmRoomSummaryMap = useMemo(
    () => new Map(groupDmRoomSummaries.map((room) => [room.id, room] as const)),
    [groupDmRoomSummaries],
  );
  const dmRoomSummaries = useMemo(
    () => roomSummaries.filter((room) => room.roomType === 'dm'),
    [roomSummaries],
  );
  const dmRoomSummaryMap = useMemo(
    () => new Map(dmRoomSummaries.map((room) => [room.id, room] as const)),
    [dmRoomSummaries],
  );
  const unreadRoomSummaries = useMemo(
    () => extractUnreadRoomSummaries(params.unreadSummaryData),
    [params.unreadSummaryData],
  );
  const groupDmUnreadRoomIds = useMemo(
    () =>
      unreadRoomSummaries
        .filter(
          (room) =>
            room.roomType === 'group_dm' &&
            room.unreadCount > 0 &&
            groupDmRoomSummaryMap.has(room.roomId),
        )
        .map((room) => room.roomId),
    [groupDmRoomSummaryMap, unreadRoomSummaries],
  );
  const dmUnreadRoomIds = useMemo(
    () =>
      unreadRoomSummaries
        .filter(
          (room) =>
            room.roomType === 'dm' &&
            room.unreadCount > 0 &&
            dmRoomSummaryMap.has(room.roomId),
        )
        .map((room) => room.roomId),
    [dmRoomSummaryMap, unreadRoomSummaries],
  );
  const groupDmRoomIds = useMemo(
    () => Array.from(new Set([...groupDmRoomSummaries.map((room) => room.id), ...groupDmUnreadRoomIds])),
    [groupDmRoomSummaries, groupDmUnreadRoomIds],
  );
  const dmRoomIds = useMemo(
    () => Array.from(new Set([...dmRoomSummaries.map((room) => room.id), ...dmUnreadRoomIds])),
    [dmRoomSummaries, dmUnreadRoomIds],
  );
  const privateRoomIds = useMemo(
    () => Array.from(new Set([...groupDmRoomIds, ...dmRoomIds])),
    [dmRoomIds, groupDmRoomIds],
  );
  const privateRoomDetailHydrationIds = useMemo(
    () =>
      privateRoomIds.filter((roomId) => {
        const roomSummary = dmRoomSummaryMap.get(roomId) ?? groupDmRoomSummaryMap.get(roomId);
        return shouldHydratePrivateRoomSidebarDetail(roomSummary, {
          currentUserId: params.currentUserId,
          currentUserDisplayName: params.currentUserDisplayName,
          currentUserEmail: params.currentUserEmail ?? null,
        });
      }),
    [
      dmRoomSummaryMap,
      groupDmRoomSummaryMap,
      params.currentUserDisplayName,
      params.currentUserEmail,
      params.currentUserId,
      privateRoomIds,
    ],
  );
  const privateRoomDetailsQuery = useQuery({
    queryKey: teamChatQueryKeys.privateRoomDetails(privateRoomDetailHydrationIds),
    enabled: privateRoomDetailHydrationIds.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const detailEntries = await Promise.all(
        privateRoomDetailHydrationIds.map(async (roomId) => {
          try {
            const roomSummary = dmRoomSummaryMap.get(roomId) ?? groupDmRoomSummaryMap.get(roomId);
            const detail = await params.service.getRoomDetail(roomId, {
              includeMembers: shouldFetchRoomMembersForIdentity(roomSummary),
            });
            return [roomId, detail] as const;
          } catch {
            return [roomId, null] as const;
          }
        }),
      );

      return Object.fromEntries(detailEntries);
    },
  });
  const privateRoomDetailsMap = useMemo(() => {
    const detailMap = new Map<string, Awaited<ReturnType<TeamChatService['getRoomDetail']>>>();
    Object.entries(privateRoomDetailsQuery.data ?? {}).forEach(([roomId, roomDetail]) => {
      if (roomDetail) {
        detailMap.set(roomId, roomDetail);
      }
    });
    return detailMap;
  }, [privateRoomDetailsQuery.data]);

  const groupDmRooms = useMemo<GroupDirectMessageConversation[]>(() => {
    return groupDmRoomIds
      .map((roomId) => {
        const room = privateRoomDetailsMap.get(roomId) ?? groupDmRoomSummaryMap.get(roomId);
        if (!room) return null;

        return mapRoomToGroupDirectMessageConversation(room, {
          currentUserId: params.currentUserId,
          unreadCountMap,
        });
      })
      .filter((room): room is GroupDirectMessageConversation => Boolean(room));
  }, [
    groupDmRoomIds,
    groupDmRoomSummaryMap,
    params.currentUserId,
    privateRoomDetailsMap,
    unreadCountMap,
  ]);

  const dmRoomContacts = useMemo<DirectMessageContact[]>(() => {
    const identityMap = new Map<string, DirectMessageContact>();

    dmRoomIds.forEach((roomId) => {
      const room = privateRoomDetailsMap.get(roomId) ?? dmRoomSummaryMap.get(roomId);
      if (!room) return;

      const mappedContact = mapRoomToDirectMessageContact(room, {
        currentUserId: params.currentUserId,
        currentUserDisplayName: params.currentUserDisplayName,
        currentUserEmail: params.currentUserEmail ?? null,
        unreadCountMap,
        presenceMap,
      });

      const identityKey =
        mappedContact.userId
          ? `user:${mappedContact.userId}`
          : normalizeContactIdentity(mappedContact.email)
            ? `email:${normalizeContactIdentity(mappedContact.email)}`
            : `room:${mappedContact.id}`;
      const existingContact = identityMap.get(identityKey);
      if (!existingContact) {
        identityMap.set(identityKey, mappedContact);
        return;
      }

      const existingUnread = existingContact.unread ?? 0;
      const nextUnread = mappedContact.unread ?? 0;
      if (nextUnread > existingUnread) {
        identityMap.set(identityKey, mappedContact);
        return;
      }

      if (mappedContact.status === 'online' && existingContact.status !== 'online') {
        identityMap.set(identityKey, mappedContact);
      }
    });

    return Array.from(identityMap.values());
  }, [
    dmRoomIds,
    dmRoomSummaryMap,
    params.currentUserDisplayName,
    params.currentUserEmail,
    params.currentUserId,
    presenceMap,
    privateRoomDetailsMap,
    unreadCountMap,
  ]);

  const directMessageContacts = useMemo<DirectMessageContact[]>(() => {
    const canUsePresenceSuggestions =
      dmRoomIds.length === 0 || privateRoomDetailsQuery.status === 'success';

    const existingUserIds = new Set(
      dmRoomContacts.map((contact) => contact.userId).filter((value): value is string => Boolean(value)),
    );
    const existingEmails = new Set(
      dmRoomContacts
        .map((contact) => normalizeContactIdentity(contact.email))
        .filter((value): value is string => Boolean(value)),
    );
    const existingFallbackNames = new Set(
      dmRoomContacts
        .filter(
          (contact) =>
            !contact.userId && !normalizeContactIdentity(contact.email),
        )
        .map((contact) => normalizeContactIdentity(contact.name))
        .filter((value): value is string => Boolean(value)),
    );

    if (!canUsePresenceSuggestions) {
      return dmRoomContacts;
    }

    const suggestions = (params.presenceData ?? [])
      .filter((presence) => presence.userId !== params.currentUserId)
      .map(mapPresenceToDirectMessageContact)
      .filter((contact) => {
        if (!contact.userId) return false;
        if (existingUserIds.has(contact.userId)) return false;
        const normalizedEmail = normalizeContactIdentity(contact.email);
        if (normalizedEmail && existingEmails.has(normalizedEmail)) return false;
        const normalizedName = normalizeContactIdentity(contact.name);
        if (normalizedName && existingFallbackNames.has(normalizedName)) return false;
        return true;
      })
      .sort((left, right) => {
        const statusRank: Record<DirectMessageContact['status'], number> = {
          online: 0,
          away: 1,
          busy: 2,
          offline: 3,
        };

        const leftRank = statusRank[left.status];
        const rightRank = statusRank[right.status];
        if (leftRank !== rightRank) return leftRank - rightRank;
        return left.name.localeCompare(right.name);
      });

    return [...dmRoomContacts, ...suggestions];
  }, [
    dmRoomContacts,
    dmRoomIds.length,
    params.currentUserId,
    params.presenceData,
    privateRoomDetailsQuery.status,
  ]);

  const dmContacts = useMemo(() => directMessageContacts, [directMessageContacts]);
  const hiddenRecoverableItems = useMemo<RecoverableConversationItem[]>(
    () =>
      hiddenNonArchivedRoomSummaries.map((room) =>
        mapRoomSummaryToRecoverableItem(room, {
          currentUserId: params.currentUserId,
          currentUserDisplayName: params.currentUserDisplayName,
          currentUserEmail: params.currentUserEmail ?? null,
          unreadCountMap,
          presenceMap,
        }),
      ),
    [
      hiddenNonArchivedRoomSummaries,
      params.currentUserDisplayName,
      params.currentUserEmail,
      params.currentUserId,
      presenceMap,
      unreadCountMap,
    ],
  );
  const archivedRecoverableItems = useMemo<RecoverableConversationItem[]>(
    () =>
      archivedRoomSummaries.map((room) =>
        mapRoomSummaryToRecoverableItem(room, {
          currentUserId: params.currentUserId,
          currentUserDisplayName: params.currentUserDisplayName,
          currentUserEmail: params.currentUserEmail ?? null,
          unreadCountMap,
          presenceMap,
        }),
      ),
    [
      archivedRoomSummaries,
      params.currentUserDisplayName,
      params.currentUserEmail,
      params.currentUserId,
      presenceMap,
      unreadCountMap,
    ],
  );

  return {
    roomSummaries,
    archivedRoomSummaries,
    hiddenRoomSummaries,
    hiddenNonArchivedRoomSummaries,
    starredRoomSummaries,
    roomSummaryById,
    unreadCountMap,
    presenceMap,
    currentUserPresenceStatus,
    workspaceChannels,
    groupDmRoomSummaries,
    groupDmRoomSummaryMap,
    dmRoomSummaries,
    dmRoomSummaryMap,
    unreadRoomSummaries,
    groupDmUnreadRoomIds,
    dmUnreadRoomIds,
    groupDmRoomIds,
    dmRoomIds,
    privateRoomIds,
    privateRoomDetailHydrationIds,
    privateRoomDetailsQueryStatus: privateRoomDetailsQuery.status,
    privateRoomDetailsMap,
    groupDmRooms,
    dmRoomContacts,
    directMessageContacts,
    dmContacts,
    hiddenRecoverableItems,
    archivedRecoverableItems,
  };
}
