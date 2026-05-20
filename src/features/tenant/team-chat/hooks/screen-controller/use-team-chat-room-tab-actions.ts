'use client';

import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import type { ChannelDetailTabItem } from '../../data/team-chat-channel-details';
import type {
  ConversationKind,
  ConversationTab,
} from '../../data/team-chat-ui-data';
import {
  isConversationTab,
  mapDetailTabsToApiTabs,
} from '../../lib/screen-controller/team-chat-controller-room-tabs.utils';
import { teamChatQueryKeys } from '../../query/use-team-chat';

interface UpdateRoomTabsResultLike {
  ok: boolean;
  error?: {
    message: string;
  };
}

export function useTeamChatRoomTabActions(params: {
  activeRoomId: string;
  activeConversationKind: ConversationKind;
  activeTab: ConversationTab;
  activeChannelRoomId: string;
  activeChannelTabs: ChannelDetailTabItem[];
  activeDirectMessageTabs: ChannelDetailTabItem[];
  canManageActiveChannelTabs: boolean;
  queryClient: QueryClient;
  persistRoomTabsCache: (roomId: string, tabs: ChannelDetailTabItem[]) => void;
  setChannelTabsById: Dispatch<
    SetStateAction<Record<string, ChannelDetailTabItem[]>>
  >;
  setDirectMessageTabsByRoomId: Dispatch<
    SetStateAction<Record<string, ChannelDetailTabItem[]>>
  >;
  setActiveTab: Dispatch<SetStateAction<ConversationTab>>;
  updateRoomTabs: (params: {
    roomId: string;
    body: {
      tabs: {
        id: string;
        order: number;
        hidden: boolean;
      }[];
    };
  }) => Promise<UpdateRoomTabsResultLike>;
}) {
  const {
    activeRoomId,
    activeConversationKind,
    activeTab,
    activeChannelRoomId,
    activeChannelTabs,
    activeDirectMessageTabs,
    canManageActiveChannelTabs,
    queryClient,
    persistRoomTabsCache,
    setChannelTabsById,
    setDirectMessageTabsByRoomId,
    setActiveTab,
    updateRoomTabs,
  } = params;

  const persistRoomTabs = useCallback(
    async (roomId: string, nextTabs: ChannelDetailTabItem[]) => {
      const result = await updateRoomTabs({
        roomId,
        body: {
          tabs: mapDetailTabsToApiTabs(nextTabs),
        },
      });

      if (!result.ok) {
        toast.danger(result.error?.message ?? 'Unable to update room tabs');
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.roomTabs(roomId),
        });
        return false;
      }

      persistRoomTabsCache(roomId, nextTabs);
      return true;
    },
    [persistRoomTabsCache, queryClient, updateRoomTabs],
  );

  const handleToggleChannelTabVisibility = useCallback(
    (tabId: string) => {
      if (!canManageActiveChannelTabs) {
        toast.warning('Only owner/admin can update room tabs');
        return;
      }

      const nextTabs = activeChannelTabs.map((tab) => ({ ...tab }));
      const tabIndex = nextTabs.findIndex((tab) => tab.id === tabId);
      if (tabIndex < 0) return;

      const targetTab = nextTabs[tabIndex];
      if (!targetTab) return;

      const visibleCount = nextTabs.filter(
        (tab) => !tab.hidden && isConversationTab(tab.id),
      ).length;
      if (!targetTab.hidden && isConversationTab(targetTab.id) && visibleCount === 1) {
        toast.warning('Keep at least one visible conversation tab');
        return;
      }

      nextTabs[tabIndex] = {
        ...targetTab,
        hidden: !targetTab.hidden,
      };

      const visibleTabs = nextTabs.filter((tab) => !tab.hidden);
      const hiddenTabs = nextTabs.filter((tab) => tab.hidden);
      const mergedTabs = [...visibleTabs, ...hiddenTabs];

      if (
        activeConversationKind === 'channel' &&
        activeTab === targetTab.id &&
        !targetTab.hidden &&
        isConversationTab(targetTab.id)
      ) {
        const nextVisibleConversationTab = visibleTabs.find((tab) =>
          isConversationTab(tab.id),
        );
        const nextTab =
          (nextVisibleConversationTab?.id as ConversationTab | undefined) ?? 'messages';
        void (async () => {
          const persisted = await persistRoomTabs(activeChannelRoomId, mergedTabs);
          if (!persisted) return;

          setChannelTabsById((previous) => ({
            ...previous,
            [activeChannelRoomId]: mergedTabs,
          }));
          setActiveTab(nextTab);
        })();
        return;
      }

      void (async () => {
        const persisted = await persistRoomTabs(activeChannelRoomId, mergedTabs);
        if (!persisted) return;

        setChannelTabsById((previous) => ({
          ...previous,
          [activeChannelRoomId]: mergedTabs,
        }));
      })();
    },
    [
      activeChannelRoomId,
      activeChannelTabs,
      activeConversationKind,
      activeTab,
      canManageActiveChannelTabs,
      persistRoomTabs,
      setActiveTab,
      setChannelTabsById,
    ],
  );

  const handleMoveChannelTab = useCallback(
    (tabId: string, direction: 'up' | 'down') => {
      if (!canManageActiveChannelTabs) {
        toast.warning('Only owner/admin can update room tabs');
        return;
      }

      const nextTabs = activeChannelTabs.map((tab) => ({ ...tab }));
      const tabIndex = nextTabs.findIndex((tab) => tab.id === tabId);
      if (tabIndex < 0) return;

      const targetTab = nextTabs[tabIndex];
      if (!targetTab) return;

      const groupIndexes = nextTabs
        .map((tab, index) => ({ tab, index }))
        .filter(({ tab }) => Boolean(tab.hidden) === Boolean(targetTab.hidden))
        .map(({ index }) => index);
      const groupPosition = groupIndexes.indexOf(tabIndex);
      if (groupPosition < 0) return;

      const targetPosition = direction === 'up' ? groupPosition - 1 : groupPosition + 1;
      if (targetPosition < 0 || targetPosition >= groupIndexes.length) return;

      const swapIndex = groupIndexes[targetPosition];
      if (swapIndex === undefined) return;

      [nextTabs[tabIndex], nextTabs[swapIndex]] = [nextTabs[swapIndex], nextTabs[tabIndex]];

      void (async () => {
        const persisted = await persistRoomTabs(activeChannelRoomId, nextTabs);
        if (!persisted) return;

        setChannelTabsById((previous) => ({
          ...previous,
          [activeChannelRoomId]: nextTabs,
        }));
      })();
    },
    [
      activeChannelRoomId,
      activeChannelTabs,
      canManageActiveChannelTabs,
      persistRoomTabs,
      setChannelTabsById,
    ],
  );

  const handleToggleDirectMessageTabVisibility = useCallback(
    (tabId: string) => {
      if (!activeRoomId) return;

      const nextTabs = activeDirectMessageTabs.map((tab) => ({ ...tab }));
      const tabIndex = nextTabs.findIndex((tab) => tab.id === tabId);
      if (tabIndex < 0) return;

      const targetTab = nextTabs[tabIndex];
      if (!targetTab) return;

      const visibleCount = nextTabs.filter(
        (tab) => !tab.hidden && isConversationTab(tab.id),
      ).length;
      if (!targetTab.hidden && isConversationTab(targetTab.id) && visibleCount === 1) {
        toast.warning('Keep at least one visible conversation tab');
        return;
      }

      nextTabs[tabIndex] = {
        ...targetTab,
        hidden: !targetTab.hidden,
      };

      const visibleTabs = nextTabs.filter((tab) => !tab.hidden);
      const hiddenTabs = nextTabs.filter((tab) => tab.hidden);
      const mergedTabs = [...visibleTabs, ...hiddenTabs];

      if (
        activeConversationKind !== 'channel' &&
        activeTab === targetTab.id &&
        !targetTab.hidden &&
        isConversationTab(targetTab.id)
      ) {
        const nextVisibleConversationTab = visibleTabs.find((tab) =>
          isConversationTab(tab.id),
        );
        const nextTab =
          (nextVisibleConversationTab?.id as ConversationTab | undefined) ?? 'messages';
        void (async () => {
          const persisted = await persistRoomTabs(activeRoomId, mergedTabs);
          if (!persisted) return;

          setDirectMessageTabsByRoomId((previous) => ({
            ...previous,
            [activeRoomId]: mergedTabs,
          }));
          setActiveTab(nextTab);
        })();
        return;
      }

      void (async () => {
        const persisted = await persistRoomTabs(activeRoomId, mergedTabs);
        if (!persisted) return;

        setDirectMessageTabsByRoomId((previous) => ({
          ...previous,
          [activeRoomId]: mergedTabs,
        }));
      })();
    },
    [
      activeConversationKind,
      activeDirectMessageTabs,
      activeRoomId,
      activeTab,
      persistRoomTabs,
      setActiveTab,
      setDirectMessageTabsByRoomId,
    ],
  );

  const handleMoveDirectMessageTab = useCallback(
    (tabId: string, direction: 'up' | 'down') => {
      if (!activeRoomId) return;

      const nextTabs = activeDirectMessageTabs.map((tab) => ({ ...tab }));
      const tabIndex = nextTabs.findIndex((tab) => tab.id === tabId);
      if (tabIndex < 0) return;

      const targetTab = nextTabs[tabIndex];
      if (!targetTab) return;

      const groupIndexes = nextTabs
        .map((tab, index) => ({ tab, index }))
        .filter(({ tab }) => Boolean(tab.hidden) === Boolean(targetTab.hidden))
        .map(({ index }) => index);
      const groupPosition = groupIndexes.indexOf(tabIndex);
      if (groupPosition < 0) return;

      const targetPosition = direction === 'up' ? groupPosition - 1 : groupPosition + 1;
      if (targetPosition < 0 || targetPosition >= groupIndexes.length) return;

      const swapIndex = groupIndexes[targetPosition];
      if (swapIndex === undefined) return;

      [nextTabs[tabIndex], nextTabs[swapIndex]] = [nextTabs[swapIndex], nextTabs[tabIndex]];

      void (async () => {
        const persisted = await persistRoomTabs(activeRoomId, nextTabs);
        if (!persisted) return;

        setDirectMessageTabsByRoomId((previous) => ({
          ...previous,
          [activeRoomId]: nextTabs,
        }));
      })();
    },
    [
      activeDirectMessageTabs,
      activeRoomId,
      persistRoomTabs,
      setDirectMessageTabsByRoomId,
    ],
  );

  return {
    handleToggleChannelTabVisibility,
    handleMoveChannelTab,
    handleToggleDirectMessageTabVisibility,
    handleMoveDirectMessageTab,
  };
}
