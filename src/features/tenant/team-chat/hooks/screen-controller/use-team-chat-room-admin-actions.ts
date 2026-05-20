'use client';

import { useCallback } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import type { ConversationKind } from '../../data/team-chat-ui-data';
import { resolveTeamChatScopeRequest } from '../../lib/team-chat-scope.shared';
import {
  mapPreferenceToNotifyLevel,
  resolveTeamChatScopeGuardErrorMessage,
} from '../../lib/screen-controller/team-chat-controller-room.utils';
import { teamChatQueryKeys } from '../../query/use-team-chat';
import type {
  TeamChatNotifyLevel,
  TeamChatSupportedContextScope,
} from '../../services/types/team-chat.types';

interface OpenCreatedRoomContextScope {
  contextScope: TeamChatSupportedContextScope;
  contextId?: string;
}

interface BasicResultLike {
  ok: boolean;
  error?: {
    message: string;
  };
}

interface UpdatedFlagResultLike extends BasicResultLike {
  data?: {
    updated: boolean;
  };
}

interface CreateRoomResultLike extends BasicResultLike {
  data?: {
    id: string;
  };
}

export function useTeamChatRoomAdminActions(params: {
  activeRoomId: string;
  activeConversationKind: ConversationKind;
  activeRoomDetailUpdatedAt?: string | null;
  activeRoomSummaryUpdatedAt?: string | null;
  activeRoomHiddenByUser: boolean;
  queryClient: QueryClient;
  openCreatedRoom: (
    roomId: string,
    roomType: 'channel' | 'group_dm' | 'dm',
    options?: {
      expectedScope?: OpenCreatedRoomContextScope;
    },
  ) => void;
  openSidebarSection: (section: 'hidden' | 'archived') => void;
  updateRoomInfo: (params: {
    roomId: string;
    body: {
      name?: string;
      topic?: string;
      description?: string;
    };
  }) => Promise<UpdatedFlagResultLike>;
  updateChannelVisibility: (params: {
    roomId: string;
    body: {
      visibility: 'public' | 'private';
      expectedUpdatedAt?: string;
    };
  }) => Promise<UpdatedFlagResultLike>;
  createRoom: (params: {
    roomType: 'channel' | 'group_dm';
    visibility: 'public' | 'private';
    name: string;
    topic?: string;
    description?: string;
    contextScope?: TeamChatSupportedContextScope;
    contextId?: string;
    memberIds?: string[];
  }) => Promise<CreateRoomResultLike>;
  updateNotifySettings: (params: {
    roomId: string;
    body: {
      notifyLevel: TeamChatNotifyLevel;
    };
  }) => Promise<BasicResultLike>;
  updateRoomVisibility: (params: {
    roomId: string;
    body:
      | {
          isHidden: true;
          hiddenReason: string;
          source: string;
        }
      | {
          isHidden: false;
          source: string;
        };
  }) => Promise<UpdatedFlagResultLike>;
  archiveRoom: (roomId: string) => Promise<UpdatedFlagResultLike>;
  unarchiveRoom: (roomId: string) => Promise<UpdatedFlagResultLike>;
}) {
  const {
    activeRoomId,
    activeRoomDetailUpdatedAt,
    activeRoomSummaryUpdatedAt,
    activeRoomHiddenByUser,
    queryClient,
    openCreatedRoom,
    openSidebarSection,
    updateRoomInfo,
    updateChannelVisibility,
    createRoom,
    updateNotifySettings,
    updateRoomVisibility,
    archiveRoom,
    unarchiveRoom,
  } = params;

  const invalidateRoomCollections = useCallback(
    (roomId?: string) => {
      const normalizedRoomId = roomId?.trim() ?? '';
      void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.rooms() });
      void queryClient.invalidateQueries({
        queryKey: teamChatQueryKeys.discoverRoomsRoot(),
      });
      void queryClient.invalidateQueries({
        queryKey: teamChatQueryKeys.privateRoomDetailsRoot(),
      });

      if (!normalizedRoomId) return;

      void queryClient.invalidateQueries({
        queryKey: teamChatQueryKeys.roomDetail(normalizedRoomId),
      });
      void queryClient.invalidateQueries({
        queryKey: teamChatQueryKeys.roomPreview(normalizedRoomId),
      });
    },
    [queryClient],
  );

  const handleUpdateRoomInfo = useCallback(
    async (payload: {
      name?: string;
      topic?: string;
      description?: string;
    }) => {
      const resolveRoomUpdateErrorMessage = (message: string) =>
        message.includes('emitRoomUpdatedEvent is not a function')
          ? 'Backend room update event emitter is missing. Please redeploy or restart the BE service before retrying this change.'
          : message;

      if (!activeRoomId) return null;

      const body = {
        name: payload.name?.trim() || undefined,
        topic: payload.topic?.trim() || undefined,
        description: payload.description?.trim() || undefined,
      };

      if (!body.name && !body.topic && !body.description) {
        return { success: true, updated: false };
      }

      const updateRoomInfoResult = await updateRoomInfo({
        roomId: activeRoomId,
        body,
      });

      if (!updateRoomInfoResult.ok) {
        toast.danger(
          resolveRoomUpdateErrorMessage(
            updateRoomInfoResult.error?.message ?? 'Unable to update room info',
          ),
        );
        return { success: false, updated: false };
      }

      if (!updateRoomInfoResult.data?.updated) {
        toast.warning('Server kept the existing room info.');
        return { success: true, updated: false };
      }

      return { success: true, updated: true };
    },
    [activeRoomId, updateRoomInfo],
  );

  const handleUpdateChannelVisibility = useCallback(
    async (nextVisibility: 'public' | 'private') => {
      if (!activeRoomId) return false;

      const updateVisibilityResult = await updateChannelVisibility({
        roomId: activeRoomId,
        body: {
          visibility: nextVisibility,
          expectedUpdatedAt:
            activeRoomDetailUpdatedAt ?? activeRoomSummaryUpdatedAt ?? undefined,
        },
      });

      if (!updateVisibilityResult.ok) {
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.roomDetail(activeRoomId),
        });
        const normalizedErrorMessage = (
          updateVisibilityResult.error?.message ?? ''
        ).trim().toLowerCase();
        if (
          normalizedErrorMessage.includes('stale') ||
          normalizedErrorMessage.includes('conflict')
        ) {
          toast.warning('Channel details changed. Refreshing room data, then try again.');
        } else {
          toast.danger(updateVisibilityResult.error?.message ?? 'Unable to update visibility');
        }
        return false;
      }

      if (!updateVisibilityResult.data?.updated) {
        return true;
      }
      return true;
    },
    [
      activeRoomDetailUpdatedAt,
      activeRoomId,
      activeRoomSummaryUpdatedAt,
      queryClient,
      updateChannelVisibility,
    ],
  );

  const handleCreateChannel = useCallback(
    async (payload: {
      name: string;
      topic?: string;
      description?: string;
      visibility: 'public' | 'private';
      contextScope: TeamChatSupportedContextScope;
      contextId?: string;
    }) => {
      if (payload.contextScope === 'project' && !payload.contextId?.trim()) {
        toast.warning('Select a project before creating a project-scoped channel.');
        return false;
      }

      const createScopeRequest = resolveTeamChatScopeRequest({
        scope: payload.contextScope,
        projectId: payload.contextId,
      });
      const createRoomResult = await createRoom({
        roomType: 'channel',
        visibility: payload.visibility,
        name: payload.name.trim(),
        topic: payload.topic?.trim() || undefined,
        description: payload.description?.trim() || undefined,
        contextScope: createScopeRequest.contextScope,
        contextId: createScopeRequest.contextId,
      });

      if (!createRoomResult.ok || !createRoomResult.data) {
        toast.danger(
          resolveTeamChatScopeGuardErrorMessage(
            createRoomResult.error?.message ?? 'Unable to create channel',
            'You do not belong to the selected project scope for this channel.',
          ),
        );
        return false;
      }

      openCreatedRoom(createRoomResult.data.id, 'channel', {
        expectedScope: {
          contextScope: createScopeRequest.contextScope,
          contextId: createScopeRequest.contextId ?? undefined,
        },
      });
      return true;
    },
    [createRoom, openCreatedRoom],
  );

  const handleCreateGroupDm = useCallback(
    async (payload: {
      name: string;
      topic?: string;
      description?: string;
      memberIds: string[];
      contextScope: TeamChatSupportedContextScope;
      contextId?: string;
    }) => {
      if (payload.contextScope === 'project' && !payload.contextId?.trim()) {
        toast.warning('Select a project before creating a project-scoped group chat.');
        return false;
      }

      const createScopeRequest = resolveTeamChatScopeRequest({
        scope: payload.contextScope,
        projectId: payload.contextId,
      });
      const createRoomResult = await createRoom({
        roomType: 'group_dm',
        visibility: 'private',
        name: payload.name.trim(),
        topic: payload.topic?.trim() || undefined,
        description: payload.description?.trim() || undefined,
        contextScope: createScopeRequest.contextScope,
        contextId: createScopeRequest.contextId,
        memberIds: payload.memberIds,
      });

      if (!createRoomResult.ok || !createRoomResult.data) {
        toast.danger(
          resolveTeamChatScopeGuardErrorMessage(
            createRoomResult.error?.message ?? 'Unable to create group chat',
            'You do not belong to the selected project scope for this group chat.',
          ),
        );
        return false;
      }

      openCreatedRoom(createRoomResult.data.id, 'group_dm', {
        expectedScope: {
          contextScope: createScopeRequest.contextScope,
          contextId: createScopeRequest.contextId ?? undefined,
        },
      });
      return true;
    },
    [createRoom, openCreatedRoom],
  );

  const handleUpdateNotificationPreference = useCallback(
    async (preference: 'all-posts' | 'mentions' | 'muted') => {
      if (!activeRoomId) return false;

      const updateNotifyResult = await updateNotifySettings({
        roomId: activeRoomId,
        body: {
          notifyLevel: mapPreferenceToNotifyLevel(preference),
        },
      });

      if (!updateNotifyResult.ok) {
        toast.danger(updateNotifyResult.error?.message ?? 'Unable to update notifications');
        return false;
      }

      const shouldHideRoom = preference === 'muted';

      if (activeRoomHiddenByUser !== shouldHideRoom) {
        const updateVisibilityResult = await updateRoomVisibility({
          roomId: activeRoomId,
          body: shouldHideRoom
            ? {
                isHidden: true,
                hiddenReason: 'mute_and_hide',
                source: 'room_menu',
              }
            : {
                isHidden: false,
                source: 'room_menu',
              },
        });

        if (!updateVisibilityResult.ok) {
          toast.warning(
            shouldHideRoom
              ? 'Notifications updated, but hiding this room failed'
              : 'Notifications updated, but unhide failed',
          );
        } else if (shouldHideRoom) {
          openSidebarSection('hidden');
        }
      }

      return true;
    },
    [
      activeRoomHiddenByUser,
      activeRoomId,
      openSidebarSection,
      updateNotifySettings,
      updateRoomVisibility,
    ],
  );

  const handleToggleArchiveState = useCallback(
    async (nextArchivedState: boolean) => {
      if (!activeRoomId) return false;

      const result = nextArchivedState
        ? await archiveRoom(activeRoomId)
        : await unarchiveRoom(activeRoomId);

      if (!result.ok) {
        invalidateRoomCollections(activeRoomId);
        toast.danger(result.error?.message ?? 'Unable to update archive state');
        return false;
      }

      if (!result.data?.updated) {
        invalidateRoomCollections(activeRoomId);
        return true;
      }

      if (nextArchivedState) {
        openSidebarSection('archived');
      }
      return true;
    },
    [
      activeRoomId,
      archiveRoom,
      invalidateRoomCollections,
      openSidebarSection,
      unarchiveRoom,
    ],
  );

  const handleUnhideConversation = useCallback(
    async (roomId: string) => {
      const normalizedRoomId = roomId.trim();
      if (!normalizedRoomId) return false;

      const result = await updateRoomVisibility({
        roomId: normalizedRoomId,
        body: {
          isHidden: false,
          source: 'sidebar_hidden_section',
        },
      });

      if (!result.ok) {
        toast.danger(result.error?.message ?? 'Unable to restore conversation');
        return false;
      }

      if (!result.data?.updated) {
        return true;
      }
      return true;
    },
    [updateRoomVisibility],
  );

  const handleUnarchiveConversation = useCallback(
    async (roomId: string) => {
      const normalizedRoomId = roomId.trim();
      if (!normalizedRoomId) return false;

      const result = await unarchiveRoom(normalizedRoomId);

      if (!result.ok) {
        invalidateRoomCollections(normalizedRoomId);
        toast.danger(result.error?.message ?? 'Unable to unarchive conversation');
        return false;
      }

      if (!result.data?.updated) {
        invalidateRoomCollections(normalizedRoomId);
        return true;
      }
      invalidateRoomCollections(normalizedRoomId);
      return true;
    },
    [invalidateRoomCollections, unarchiveRoom],
  );

  return {
    handleUpdateRoomInfo,
    handleUpdateChannelVisibility,
    handleCreateChannel,
    handleCreateGroupDm,
    handleUpdateNotificationPreference,
    handleToggleArchiveState,
    handleUnhideConversation,
    handleUnarchiveConversation,
  };
}
