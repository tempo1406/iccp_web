'use client';

import { useEffect, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useDiscoverTeamChatRooms, useTeamChatRoomPreview } from '../../query/use-team-chat';
import type {
  DiscoverableChannel,
} from '../../data/team-chat-ui-data';
import type { TeamChatProjectOption } from '../../lib/team-chat-scope.shared';
import type { TeamChatScreenViewProps } from '../../components/team-chat-screen-view';
import { mapDiscoverRoomToChannel, mapRoomPreviewToDiscoverChannel } from '../../lib/team-chat-api-mappers';
import { mergeDiscoverableChannels, resolveTeamChatProjectRoomAccessMessage } from '../../lib/screen-controller/team-chat-controller-room.utils';
import type { TeamChatSupportedContextScope } from '../../services/types/team-chat.types';
import type { TeamChatView } from '../../lib/team-chat-screen.shared';

const BROWSE_CHANNELS_BE_CACHE_WINDOW_MS = 5_000;

export function useTeamChatBrowseState(params: {
  activeView: TeamChatView;
  deferredBrowseSearch: string;
  browseSortBy: 'recent' | 'members' | 'name';
  browseSelectedChannelId: string;
  browseChannels: DiscoverableChannel[];
  browseCursor: string | null;
  browseNextCursor: string | null;
  setBrowseCursor: Dispatch<SetStateAction<string | null>>;
  setBrowseNextCursor: Dispatch<SetStateAction<string | null>>;
  setBrowseChannels: Dispatch<SetStateAction<DiscoverableChannel[]>>;
  setBrowseLoadingMore: Dispatch<SetStateAction<boolean>>;
  setBrowseSelectedChannelId: Dispatch<SetStateAction<string>>;
  roomScope: TeamChatSupportedContextScope;
  roomScopeProjectId: string;
  setRoomScope: Dispatch<SetStateAction<TeamChatSupportedContextScope>>;
  setRoomScopeProjectId: Dispatch<SetStateAction<string>>;
  roomScopeRequest: {
    contextScope: TeamChatSupportedContextScope;
    contextId?: string | null;
  };
  projectOptions: TeamChatProjectOption[];
  projectListPending: boolean;
  roomScopeProjectErrorMessage: string | null;
}) {
  const {
    activeView,
    deferredBrowseSearch,
    browseSortBy,
    browseSelectedChannelId,
    browseChannels,
    browseCursor,
    browseNextCursor,
    setBrowseCursor,
    setBrowseNextCursor,
    setBrowseChannels,
    setBrowseLoadingMore,
    setBrowseSelectedChannelId,
    roomScope,
    roomScopeProjectId,
    setRoomScope,
    setRoomScopeProjectId,
    roomScopeRequest,
    projectOptions,
    projectListPending,
    roomScopeProjectErrorMessage,
  } = params;

  const browseSearchKeyword = deferredBrowseSearch.trim();
  const browseRoomsQuery = useDiscoverTeamChatRooms(
    {
      search: browseSearchKeyword || undefined,
      sortBy: browseSortBy,
      limit: 20,
      cursor: browseCursor ?? undefined,
      contextScope: roomScopeRequest.contextScope,
      contextId: roomScopeRequest.contextId ?? undefined,
    },
    {
      enabled: activeView === 'browse',
      staleTime: BROWSE_CHANNELS_BE_CACHE_WINDOW_MS,
    },
  );

  const browsePreviewRoomId = browseSelectedChannelId.trim();
  const browsePreviewQuery = useTeamChatRoomPreview(browsePreviewRoomId, {
    enabled: browsePreviewRoomId.length > 0 && activeView === 'browse',
    staleTime: BROWSE_CHANNELS_BE_CACHE_WINDOW_MS,
  });
  const browsePreviewChannel = useMemo(
    () =>
      browsePreviewQuery.data
        ? mapRoomPreviewToDiscoverChannel(browsePreviewQuery.data)
        : browseChannels.find((channel) => channel.id === browsePreviewRoomId) ?? null,
    [browseChannels, browsePreviewQuery.data, browsePreviewRoomId],
  );

  useEffect(() => {
    setBrowseCursor(null);
    setBrowseNextCursor(null);
    setBrowseChannels([]);
    setBrowseLoadingMore(false);
    setBrowseSelectedChannelId('');
  }, [
    browseSearchKeyword,
    browseSortBy,
    roomScopeRequest.contextId,
    roomScopeRequest.contextScope,
    setBrowseChannels,
    setBrowseCursor,
    setBrowseLoadingMore,
    setBrowseNextCursor,
    setBrowseSelectedChannelId,
  ]);

  useEffect(() => {
    if (!browseRoomsQuery.data) return;

    const mappedChannels = browseRoomsQuery.data.data.map(mapDiscoverRoomToChannel);
    setBrowseChannels((previous) =>
      browseCursor ? mergeDiscoverableChannels(previous, mappedChannels) : mappedChannels,
    );
    setBrowseNextCursor(browseRoomsQuery.data.meta.nextCursor ?? null);
    setBrowseLoadingMore(false);
    setBrowseSelectedChannelId((previous) => {
      const normalizedPrevious = previous.trim();
      if (normalizedPrevious.length > 0) return normalizedPrevious;
      return mappedChannels[0]?.id ?? '';
    });
  }, [
    browseRoomsQuery.data,
    browseCursor,
    setBrowseChannels,
    setBrowseLoadingMore,
    setBrowseNextCursor,
    setBrowseSelectedChannelId,
  ]);

  useEffect(() => {
    if (!browseRoomsQuery.isError) return;
    setBrowseLoadingMore(false);
  }, [browseRoomsQuery.isError, setBrowseLoadingMore]);

  const browseLoading = browseRoomsQuery.isPending && browseChannels.length === 0;
  const browseHasMore = Boolean(browseNextCursor);
  const browsePreviewErrorMessage = browsePreviewQuery.isError
    ? resolveTeamChatProjectRoomAccessMessage(
        browsePreviewQuery.error?.message ?? 'Unable to load channel preview.',
      )
    : null;
  const roomScopeFilter = useMemo<TeamChatScreenViewProps['roomScopeFilter']>(
    () => ({
      scope: roomScope,
      projectId: roomScopeProjectId,
      projects: projectOptions,
      loadingProjects: projectListPending,
      projectErrorMessage: roomScopeProjectErrorMessage,
      onScopeChange: (nextScope) => {
        if (nextScope === 'project' && projectOptions.length === 0) return;
        setRoomScope(nextScope);
        if (nextScope === 'project' && !roomScopeProjectId.trim()) {
          const fallbackProjectId = projectOptions[0]?.id ?? '';
          if (fallbackProjectId) {
            setRoomScopeProjectId(fallbackProjectId);
          }
        }
      },
      onProjectChange: (projectId) => {
        setRoomScopeProjectId(projectId);
      },
    }),
    [
      projectListPending,
      projectOptions,
      roomScope,
      roomScopeProjectErrorMessage,
      roomScopeProjectId,
      setRoomScope,
      setRoomScopeProjectId,
    ],
  );

  return {
    browseRoomsPending: browseRoomsQuery.isPending,
    browsePreviewLoading: browsePreviewQuery.isPending,
    browsePreviewChannel,
    browsePreviewErrorMessage,
    browseLoading,
    browseHasMore,
    roomScopeFilter,
  };
}
