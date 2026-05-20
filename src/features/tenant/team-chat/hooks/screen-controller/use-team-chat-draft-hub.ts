'use client';

import { useCallback, useEffect, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  createTeamChatDraftItem,
  createTeamChatScheduledItem,
  type TeamChatDraftHubConversationTarget,
  type TeamChatDraftItem,
  type TeamChatScheduledItem,
} from '../../data/team-chat-drafts-ui-data';
import type {
  ConversationKey,
  ConversationKind,
  DirectMessageContact,
  GroupDirectMessageConversation,
} from '../../data/team-chat-ui-data';
import type {
  SidebarDraftIndicator,
  TeamChatView,
} from '../../lib/team-chat-screen.shared';
import {
  useTeamChatDrafts,
  useTeamChatScheduledMessages,
} from '../../query/use-team-chat';
import type {
  TeamChatDraftResponse,
  TeamChatRoomSummaryResponse,
  TeamChatScheduledMessageResponse,
} from '../../services/types/team-chat.types';
import { mapRoomToGroupDirectMessageConversation } from '../../lib/team-chat-api-mappers';
import { buildConversationKey } from '../../lib/screen-controller/team-chat-controller-room.utils';

export function useTeamChatDraftHub(params: {
  draftsLimit: number;
  scheduledLimit: number;
  roomSummaries: TeamChatRoomSummaryResponse[];
  roomSummaryById: Map<string, TeamChatRoomSummaryResponse>;
  groupDmRooms: GroupDirectMessageConversation[];
  dmContacts: DirectMessageContact[];
  unreadCountMap: Map<string, number>;
  currentUserId?: string | null;
  activeRoomId: string;
  activeView: TeamChatView;
  activeConversationKey: ConversationKey;
  activeConversationKind: ConversationKind;
  activeConversationTitle: string;
  activeConversationAvatarUrl?: string;
  activeChannelVisibility: 'public' | 'private';
  activeComposerDraftRoomId?: string;
  activeComposerScheduledSessionId: string | null;
  composerHasImmediateDraftText: boolean;
  composerDraftSeedValue: string;
  activeCurrentDraftSnapshot: TeamChatDraftResponse | null;
  draftsExtraRecords: TeamChatDraftResponse[];
  setDraftsExtraRecords: Dispatch<SetStateAction<TeamChatDraftResponse[]>>;
  setDraftsNextCursor: Dispatch<SetStateAction<string | null>>;
  scheduledExtraRecords: TeamChatScheduledMessageResponse[];
  setScheduledExtraRecords: Dispatch<SetStateAction<TeamChatScheduledMessageResponse[]>>;
  setScheduledNextCursor: Dispatch<SetStateAction<string | null>>;
}) {
  const {
    draftsLimit,
    scheduledLimit,
    roomSummaries,
    roomSummaryById,
    groupDmRooms,
    dmContacts,
    unreadCountMap,
    currentUserId,
    activeRoomId,
    activeView,
    activeConversationKey,
    activeConversationKind,
    activeConversationTitle,
    activeConversationAvatarUrl,
    activeChannelVisibility,
    activeComposerDraftRoomId,
    activeComposerScheduledSessionId,
    composerHasImmediateDraftText,
    composerDraftSeedValue,
    activeCurrentDraftSnapshot,
    draftsExtraRecords,
    setDraftsExtraRecords,
    setDraftsNextCursor,
    scheduledExtraRecords,
    setScheduledExtraRecords,
    setScheduledNextCursor,
  } = params;

  const draftsHubParams = useMemo(
    () => ({ limit: draftsLimit }),
    [draftsLimit],
  );
  const scheduledMessagesParams = useMemo(
    () =>
      ({
        status: 'pending',
        limit: scheduledLimit,
      }) as const,
    [scheduledLimit],
  );

  const draftsHubQuery = useTeamChatDrafts(draftsHubParams);
  const scheduledMessagesQuery = useTeamChatScheduledMessages(scheduledMessagesParams);

  const activeDraftHubConversation = useMemo<TeamChatDraftHubConversationTarget>(
    () => ({
      key: activeConversationKey,
      kind: activeConversationKind,
      title: activeConversationTitle,
      visibility:
        activeConversationKind === 'channel' ? activeChannelVisibility : 'private',
      avatarUrl: activeConversationAvatarUrl,
    }),
    [
      activeChannelVisibility,
      activeConversationAvatarUrl,
      activeConversationKey,
      activeConversationKind,
      activeConversationTitle,
    ],
  );

  const groupDmRoomLookup = useMemo(
    () => new Map(groupDmRooms.map((room) => [room.roomId, room] as const)),
    [groupDmRooms],
  );

  const draftHubConversationTargetByRoomId = useMemo(() => {
    const nextMap = new Map<string, TeamChatDraftHubConversationTarget>();

    roomSummaries.forEach((room) => {
      if (room.roomType === 'channel') {
        nextMap.set(room.id, {
          key: buildConversationKey('channel', room.id),
          kind: 'channel',
          title: room.name,
          visibility: room.visibility,
        });
        return;
      }

      if (room.roomType === 'group_dm') {
        const groupConversation =
          groupDmRoomLookup.get(room.id) ??
          mapRoomToGroupDirectMessageConversation(room, {
            currentUserId,
            unreadCountMap,
          });
        nextMap.set(room.id, {
          key: buildConversationKey('group_dm', room.id),
          kind: 'group_dm',
          title: groupConversation.name,
          visibility: 'private',
        });
        return;
      }

      const matchedContact = dmContacts.find(
        (contact) =>
          contact.roomId === room.id || (contact.source === 'room' && contact.id === room.id),
      );
      nextMap.set(room.id, {
        key: buildConversationKey('dm', room.id),
        kind: 'dm',
        title: matchedContact?.name || room.name || 'Direct message',
        visibility: 'private',
        avatarUrl: matchedContact?.avatarUrl,
      });
    });

    if (activeRoomId && activeDraftHubConversation.title.trim().length > 0) {
      nextMap.set(activeRoomId, activeDraftHubConversation);
    }

    return nextMap;
  }, [
    activeDraftHubConversation,
    groupDmRoomLookup,
    activeRoomId,
    currentUserId,
    dmContacts,
    roomSummaries,
    unreadCountMap,
  ]);

  const resolveDraftHubConversationTarget = useCallback(
    (roomId: string): TeamChatDraftHubConversationTarget => {
      const cachedConversation = draftHubConversationTargetByRoomId.get(roomId);
      if (cachedConversation) return cachedConversation;

      const fallbackRoom = roomSummaryById.get(roomId);
      if (fallbackRoom?.roomType === 'channel') {
        return {
          key: buildConversationKey('channel', roomId),
          kind: 'channel',
          title: fallbackRoom.name,
          visibility: fallbackRoom.visibility,
        };
      }

      if (fallbackRoom?.roomType === 'group_dm') {
        const groupConversation =
          groupDmRoomLookup.get(roomId) ??
          mapRoomToGroupDirectMessageConversation(fallbackRoom, {
            currentUserId,
            unreadCountMap,
          });
        return {
          key: buildConversationKey('group_dm', roomId),
          kind: 'group_dm',
          title: groupConversation.name,
          visibility: 'private',
        };
      }

      return {
        key: buildConversationKey('dm', roomId),
        kind: 'dm',
        title: fallbackRoom?.name || 'Direct message',
        visibility: 'private',
      };
    },
    [
      draftHubConversationTargetByRoomId,
      groupDmRoomLookup,
      currentUserId,
      roomSummaryById,
      unreadCountMap,
    ],
  );

  useEffect(() => {
    if (draftsHubQuery.status !== 'success') return;
    setDraftsExtraRecords([]);
    setDraftsNextCursor(draftsHubQuery.data?.nextCursor ?? null);
  }, [draftsHubQuery.data, draftsHubQuery.status, setDraftsExtraRecords, setDraftsNextCursor]);

  useEffect(() => {
    if (scheduledMessagesQuery.status !== 'success') return;
    setScheduledExtraRecords([]);
    setScheduledNextCursor(scheduledMessagesQuery.data?.nextCursor ?? null);
  }, [scheduledMessagesQuery.data, scheduledMessagesQuery.status, setScheduledExtraRecords, setScheduledNextCursor]);

  const draftRecords = useMemo(() => {
    const seenDraftIds = new Set<string>();
    return [...(draftsHubQuery.data?.items ?? []), ...draftsExtraRecords].filter((item) => {
      if (seenDraftIds.has(item.id)) return false;
      seenDraftIds.add(item.id);
      return true;
    });
  }, [draftsExtraRecords, draftsHubQuery.data?.items]);

  const scheduledRecords = useMemo(() => {
    const seenScheduledIds = new Set<string>();
    return [...(scheduledMessagesQuery.data?.items ?? []), ...scheduledExtraRecords].filter(
      (item) => {
        if (seenScheduledIds.has(item.id)) return false;
        seenScheduledIds.add(item.id);
        return true;
      },
    );
  }, [scheduledExtraRecords, scheduledMessagesQuery.data?.items]);

  const draftItems = useMemo<TeamChatDraftItem[]>(
    () =>
      draftRecords.map((draftRecord) => {
        const conversation = resolveDraftHubConversationTarget(draftRecord.roomId);
        return createTeamChatDraftItem({
          id: draftRecord.id,
          roomId: draftRecord.roomId,
          conversation,
          content: draftRecord.content,
          contentFormat: draftRecord.contentFormat ?? undefined,
          richContent: draftRecord.richContent ?? null,
          updatedAt: new Date(draftRecord.updatedAt),
          updatedAtIso: draftRecord.updatedAt,
          threadRootMessageId: draftRecord.threadRootMessageId ?? undefined,
          parentMessageId: draftRecord.parentMessageId ?? undefined,
          draftSource: draftRecord.draftSource ?? undefined,
        });
      }),
    [draftRecords, resolveDraftHubConversationTarget],
  );

  const scheduledDraftItems = useMemo<TeamChatScheduledItem[]>(
    () =>
      scheduledRecords.map((scheduledRecord) => {
        const conversation = resolveDraftHubConversationTarget(scheduledRecord.roomId);
        return createTeamChatScheduledItem({
          id: scheduledRecord.id,
          roomId: scheduledRecord.roomId,
          conversation,
          content: scheduledRecord.content,
          contentFormat: scheduledRecord.contentFormat ?? undefined,
          richContent: scheduledRecord.richContent ?? null,
          scheduledFor: new Date(scheduledRecord.scheduledForUtc),
          updatedAt: new Date(scheduledRecord.updatedAt ?? scheduledRecord.scheduledForUtc),
          updatedAtIso: scheduledRecord.updatedAt ?? undefined,
          threadRootMessageId: scheduledRecord.threadRootMessageId ?? undefined,
          parentMessageId: scheduledRecord.parentMessageId ?? undefined,
          scheduledTimezone: scheduledRecord.scheduledTimezone ?? undefined,
          status: scheduledRecord.status,
          sourceDraftId: scheduledRecord.sourceDraftId ?? undefined,
          lastErrorMessage: scheduledRecord.lastErrorMessage ?? undefined,
        });
      }),
    [resolveDraftHubConversationTarget, scheduledRecords],
  );

  const draftItemsByRoomId = useMemo(() => {
    const nextMap: Record<string, TeamChatDraftItem[]> = {};

    draftItems.forEach((item) => {
      if (!nextMap[item.roomId]) {
        nextMap[item.roomId] = [item];
        return;
      }

      nextMap[item.roomId]!.push(item);
    });

    return nextMap;
  }, [draftItems]);

  const sidebarDraftIndicators = useMemo<Record<string, SidebarDraftIndicator>>(() => {
    const nextIndicators: Record<string, SidebarDraftIndicator> = {};

    draftItems.forEach((item) => {
      if (nextIndicators[item.roomId]) return;
      nextIndicators[item.roomId] = { preview: item.preview };
    });

    const activeRoomId = activeComposerDraftRoomId ?? '';
    if (!activeRoomId || activeView !== 'channel') {
      return nextIndicators;
    }

    const isActiveDraftLocallyCleared =
      !activeComposerScheduledSessionId &&
      !composerHasImmediateDraftText &&
      composerDraftSeedValue.trim().length > 0 &&
      (draftItemsByRoomId[activeRoomId]?.length ?? 0) <= 1;

    if (
      isActiveDraftLocallyCleared ||
      (!activeComposerScheduledSessionId &&
        activeCurrentDraftSnapshot?.id &&
        (draftItemsByRoomId[activeRoomId]?.length ?? 0) <= 1 &&
        !composerHasImmediateDraftText)
    ) {
      delete nextIndicators[activeRoomId];
    }

    return nextIndicators;
  }, [
    activeComposerDraftRoomId,
    activeComposerScheduledSessionId,
    activeCurrentDraftSnapshot?.id,
    activeView,
    composerDraftSeedValue,
    composerHasImmediateDraftText,
    draftItems,
    draftItemsByRoomId,
  ]);

  const draftHubCounts = useMemo(
    () => ({
      drafts: Math.max(
        0,
        draftItems.length -
          (activeView === 'channel' &&
          !activeComposerScheduledSessionId &&
          !composerHasImmediateDraftText &&
          composerDraftSeedValue.trim().length > 0 &&
          (draftItemsByRoomId[activeComposerDraftRoomId ?? '']?.length ?? 0) <= 1
            ? 1
            : 0),
      ),
      scheduled: scheduledDraftItems.length,
    }),
    [
      activeComposerDraftRoomId,
      activeComposerScheduledSessionId,
      activeView,
      composerDraftSeedValue,
      composerHasImmediateDraftText,
      draftItems.length,
      draftItemsByRoomId,
      scheduledDraftItems.length,
    ],
  );

  const draftsHubLoading = draftsHubQuery.isPending && draftItems.length === 0;
  const scheduledHubLoading =
    scheduledMessagesQuery.isPending && scheduledDraftItems.length === 0;

  return {
    draftsHubQuery,
    scheduledMessagesQuery,
    draftRecords,
    scheduledRecords,
    draftItems,
    scheduledDraftItems,
    draftItemsByRoomId,
    draftHubCounts,
    draftsHubLoading,
    scheduledHubLoading,
    sidebarDraftIndicators,
  };
}
