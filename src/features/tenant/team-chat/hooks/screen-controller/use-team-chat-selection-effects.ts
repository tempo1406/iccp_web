'use client';

import { useEffect } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type {
  ConversationKind,
  DirectMessageContact,
  GroupDirectMessageConversation,
  WorkspaceChannel,
} from '../../data/team-chat-ui-data';
import type { ChannelDetailTabItem } from '../../data/team-chat-channel-details';
import { defaultChannelTabs } from '../../lib/team-chat-api-mappers';
import {
  cloneRoomTabs,
  defaultDirectMessageTabs,
} from '../../lib/screen-controller/team-chat-controller-room-tabs.utils';

export function useTeamChatSelectionEffects(params: {
  workspaceChannels: WorkspaceChannel[];
  dmContacts: DirectMessageContact[];
  groupDmRooms: GroupDirectMessageConversation[];
  activeConversationKind: ConversationKind;
  privateRoomIds: string[];
  roomTabsCacheRef: MutableRefObject<Record<string, ChannelDetailTabItem[]> | null>;
  setActiveChannelId: Dispatch<SetStateAction<string>>;
  setActiveDmId: Dispatch<SetStateAction<string>>;
  setChannelTabsById: Dispatch<SetStateAction<Record<string, ChannelDetailTabItem[]>>>;
  setDirectMessageTabsByRoomId: Dispatch<SetStateAction<Record<string, ChannelDetailTabItem[]>>>;
}) {
  const {
    workspaceChannels,
    dmContacts,
    groupDmRooms,
    activeConversationKind,
    privateRoomIds,
    roomTabsCacheRef,
    setActiveChannelId,
    setActiveDmId,
    setChannelTabsById,
    setDirectMessageTabsByRoomId,
  } = params;

  useEffect(() => {
    if (workspaceChannels.length === 0) return;
    const frameId = window.requestAnimationFrame(() => {
      setActiveChannelId((previous) =>
        workspaceChannels.some((channel) => channel.id === previous)
          ? previous
          : workspaceChannels[0]!.id,
      );
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [setActiveChannelId, workspaceChannels]);

  useEffect(() => {
    if (activeConversationKind !== 'dm' || dmContacts.length === 0) return;
    const frameId = window.requestAnimationFrame(() => {
      setActiveDmId((previous) => {
        if (dmContacts.some((contact) => contact.id === previous || contact.roomId === previous)) {
          return previous;
        }
        if (previous) {
          return previous;
        }
        return dmContacts[0]?.roomId ?? dmContacts[0]?.id ?? previous;
      });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeConversationKind, dmContacts, setActiveDmId]);

  useEffect(() => {
    if (groupDmRooms.length === 0 || activeConversationKind !== 'group_dm') return;

    const frameId = window.requestAnimationFrame(() => {
      setActiveDmId((previous) => {
        if (groupDmRooms.some((room) => room.id === previous || room.roomId === previous)) {
          return previous;
        }
        if (previous) {
          return previous;
        }
        return groupDmRooms[0]?.roomId ?? groupDmRooms[0]?.id ?? previous;
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeConversationKind, groupDmRooms, setActiveDmId]);

  useEffect(() => {
    if (workspaceChannels.length === 0) return;

    const frameId = window.requestAnimationFrame(() => {
      setChannelTabsById((previous) => {
        let changed = false;
        const nextValue = { ...previous };

        workspaceChannels.forEach((channel) => {
          if (!nextValue[channel.id]) {
            const cachedTabs = roomTabsCacheRef.current?.[channel.id];
            nextValue[channel.id] = cloneRoomTabs(cachedTabs ?? defaultChannelTabs());
            changed = true;
          }
        });

        return changed ? nextValue : previous;
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [roomTabsCacheRef, setChannelTabsById, workspaceChannels]);

  useEffect(() => {
    if (privateRoomIds.length === 0) return;

    const frameId = window.requestAnimationFrame(() => {
      setDirectMessageTabsByRoomId((previous) => {
        let changed = false;
        const nextValue = { ...previous };

        privateRoomIds.forEach((roomId) => {
          if (!nextValue[roomId]) {
            const cachedTabs = roomTabsCacheRef.current?.[roomId];
            nextValue[roomId] = cloneRoomTabs(cachedTabs ?? defaultDirectMessageTabs());
            changed = true;
          }
        });

        return changed ? nextValue : previous;
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [privateRoomIds, roomTabsCacheRef, setDirectMessageTabsByRoomId]);
}
