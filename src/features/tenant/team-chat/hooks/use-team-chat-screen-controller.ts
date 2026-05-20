'use client';

import { startTransition, useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatISO } from 'date-fns';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/lib/toast';
import { useServiceContext } from '@/lib/use-service-context';
import { useAppSelector } from '@/store';
import type {
  ChatPersonalInboxRoomReadUpdatedPayload,
  ChatRoomReadStateUpdatedPayload,
} from '@/lib/socket/events';
import { useProjectList } from '../../projects/query/use-projects';
import {
  type PersonalFeedItem,
  type ConversationKey,
  type ConversationKind,
  type ConversationMessage,
  type ConversationTab,
  type DirectMessageContact,
  type WorkspaceChannel,
} from '../data/team-chat-ui-data';
import {
  type DraftHubTab,
} from '../data/team-chat-drafts-ui-data';
import { type ChannelMember } from '../data/team-chat-channel-details';
import {
  useAcceptTeamChatInvitation,
  useAddTeamChatReaction,
  useArchiveTeamChatRoom,
  useCreateTeamChatRoom,
  useCancelTeamChatScheduledMessageToDraft,
  useCreateTeamChatScheduledMessage,
  useDeleteTeamChatAttachment,
  useDeleteTeamChatDraft,
  useDeleteTeamChatMessage,
  useDeleteTeamChatScheduledMessage,
  useInviteTeamChatMembers,
  useJoinTeamChatRoom,
  useMarkAllTeamChatMentionsRead,
  useMarkAllTeamChatNotificationsRead,
  useMarkTeamChatPersonalInboxRoomRead,
  useMarkTeamChatMentionRead,
  useMarkTeamChatNotificationRead,
  usePinTeamChatMessage,
  useRemoveTeamChatMember,
  useRemoveTeamChatReaction,
  useSendTeamChatMessage,
  useSendTeamChatScheduledMessageNow,
  useStarTeamChatRoom,
  useTeamChatMentions,
  useTeamChatMessageCursor,
  useTeamChatMessageSearch,
  useTeamChatNotifications,
  useTeamChatPinnedMessages,
  useTeamChatRoomPinState,
  useTeamChatPresence,
  useTeamChatRoomAttachments,
  useTeamChatRoomBootstrap,
  useTeamChatRoomDetail,
  useTeamChatRooms,
  useTeamChatRoomTabs,
  useTeamChatUnreadSummary,
  useUnarchiveTeamChatRoom,
  useUnpinTeamChatMessage,
  useUnstarTeamChatRoom,
  useUpsertTeamChatCurrentDraft,
  useUpdateTeamChatMemberRole,
  useUpdateTeamChatMessage,
  useUpdateTeamChatNotifySettings,
  useUpdateTeamChatPresence,
  useUpdateTeamChatReadState,
  useUpdateTeamChatRoomInfo,
  useUpdateTeamChatRoomPolicies,
  useUpdateTeamChatRoomTabs,
  useUpdateTeamChatChannelVisibility,
  useUpdateTeamChatRoomVisibility,
  useUpdateTeamChatScheduledMessage,
  useForwardTeamChatMessage,
  buildUnreadSummaryAggregates,
  upsertRoomDetailIntoRoomListCaches,
  syncManualUnreadStateCache,
  syncUnreadSummaryCache,
  teamChatQueryKeys,
} from '../query/use-team-chat';
import { useTeamChatRealtime } from '../hooks/use-team-chat-realtime';
import { useTeamChatBrowseState } from '../hooks/screen-controller/use-team-chat-browse-state';
import { useTeamChatComposerDraftPersistence } from '../hooks/screen-controller/use-team-chat-composer-draft-persistence';
import { useTeamChatCurrentDraftSync } from '../hooks/screen-controller/use-team-chat-current-draft-sync';
import { useTeamChatDraftHub } from '../hooks/screen-controller/use-team-chat-draft-hub';
import { useTeamChatMessageActions } from '../hooks/screen-controller/use-team-chat-message-actions';
import { useTeamChatMessageEditPinActions } from '../hooks/screen-controller/use-team-chat-message-edit-pin-actions';
import { useTeamChatMessageForwardActions } from '../hooks/screen-controller/use-team-chat-message-forward-actions';
import { useTeamChatMessageMutationActions } from '../hooks/screen-controller/use-team-chat-message-mutation-actions';
import { useTeamChatMessagePipeline } from '../hooks/screen-controller/use-team-chat-message-pipeline';
import { useTeamChatMessageSendActions } from '../hooks/screen-controller/use-team-chat-message-send-actions';
import { useTeamChatRoomAdminActions } from '../hooks/screen-controller/use-team-chat-room-admin-actions';
import { useTeamChatRoomMembershipActions } from '../hooks/screen-controller/use-team-chat-room-membership-actions';
import { useTeamChatRoomTabActions } from '../hooks/screen-controller/use-team-chat-room-tab-actions';
import { useTeamChatViewModel } from '../hooks/screen-controller/use-team-chat-view-model';
import { useTeamChatTyping } from '../hooks/use-team-chat-typing';
import { useTeamChatControllerState } from '../hooks/screen-controller/use-team-chat-controller-state';
import { useTeamChatRoomCollections } from '../hooks/screen-controller/use-team-chat-room-collections';
import { useTeamChatSelectionEffects } from '../hooks/screen-controller/use-team-chat-selection-effects';
import { TeamChatService } from '../services/team-chat.service';
import type {
  TeamChatDraftResponse,
  ListTeamChatRoomsParams,
  TeamChatMessageCursorResponse,
  TeamChatMessageReactionSummaryResponse,
  TeamChatPinnedMessageResponse,
  TeamChatReadStateResponse,
  TeamChatRoomDetailResponse,
  TeamChatRoomMessageResponse,
  TeamChatRoomSummaryResponse,
  TeamChatSupportedContextScope,
  TeamChatUnreadSummaryResponse,
} from '../services/types/team-chat.types';
import {
  type ActiveConversationDisplay,
  type ComposerAttachmentDraft,
  type MentionCandidate,
  type PersonalFilter,
  type StarredConversationItem,
  type TeamChatComposerDraftPayload,
  type UploadingAttachmentDraft,
} from '../lib/team-chat-screen.shared';
import {
  resolveTeamChatScopeRequest,
  type TeamChatProjectOption,
} from '../lib/team-chat-scope.shared';
import {
  defaultChannelTabs,
  mapMemberToChannelMember,
  mapMentionToPersonalFeedItem,
  mapMessageToConversationMessage,
  mapNotificationToPersonalFeedItem,
  mapReactionSummaryToMessageReaction,
  mapRoomToDirectMessageContact,
  mapRoomToGroupDirectMessageConversation,
  mapRoomToWorkspaceChannel,
} from '../lib/team-chat-api-mappers';
import {
  createComposerAttachmentDraft,
  createComposerAttachmentPlaceholder,
} from '../lib/team-chat-media.utils';
import {
  buildTypingSummary,
  mergeRoomHistoryMessage,
  mergeRoomHistoryItems,
} from '../lib/team-chat-message-history.utils';
import {
  buildTeamChatGroupedPhotos,
  buildTeamChatSharedFiles,
} from '../lib/team-chat-shared-assets.utils';
import {
  buildTeamChatDraftContextKey,
  formatScheduledComposerNoticeLabel,
} from '../lib/screen-controller/team-chat-controller-draft.utils';
import {
  areConversationMessagesEqual,
  buildForwardedDisplayContentPreview,
  buildMentionCandidateFromMessage,
  compareConversationMessagesBySentAt,
  extractRoomAttachmentItems,
  mapSearchResultToConversationMessage,
  resolveRawMessageAuthor,
} from '../lib/screen-controller/team-chat-controller-message.utils';
import {
  buildLinkPreviewMetadataPatch,
  buildPersonalMentionFeedDedupKey,
  matchesTeamChatNotificationOrganization,
  normalizeTeamChatNotificationList,
} from '../lib/screen-controller/team-chat-controller-notification.utils';
import { sortPersonalFeedItemsByNewest } from '../lib/screen-controller/team-chat-controller-personal-feed.utils';
import { mergeTeamChatReactionSummaryList } from '../lib/screen-controller/team-chat-controller-reaction.utils';
import {
  areRoomTabsEqual,
  cloneRoomTabs,
  defaultDirectMessageTabs,
  isConversationTab,
  mapApiTabsToDetailTabs,
} from '../lib/screen-controller/team-chat-controller-room-tabs.utils';
import {
  buildConversationKey,
  isCompanyAnnouncementsReadOnlyForRole,
  isUuidLikeValue,
  mapNotifyLevelToPreference,
  mapUiStatusToPresenceStatus,
  resolveEffectiveCanSendMessage,
  resolveFallbackPersonalConversationLabel,
  resolveTeamChatScopeGuardErrorMessage,
  shouldFetchRoomMembersForIdentity,
} from '../lib/screen-controller/team-chat-controller-room.utils';
import { validateTeamChatUploadFile } from '../lib/team-chat-upload.utils';
import {
  areTeamChatComposerDraftPayloadEqual,
  cloneTeamChatComposerDraftPayload,
  createEmptyTeamChatComposerDraftPayload,
  normalizeTeamChatComposerDraftPayload,
} from '../lib/team-chat-composer-draft-payload.utils';
import { type TeamChatScreenViewProps } from '../components/team-chat-screen-view';

const DRAFTS_HUB_PAGE_LIMIT = 20;
const SCHEDULED_MESSAGES_PAGE_LIMIT = 20;
const ACTIVE_ROOM_MESSAGE_BOOTSTRAP_LIMIT = 50;
const ACTIVE_ROOM_PINNED_BOOTSTRAP_LIMIT = 5;
const DEFAULT_SCHEDULE_TIMEZONE = 'Asia/Bangkok';
const MENTION_CANDIDATE_RECENT_MESSAGE_LIMIT = 40;
const LINKED_MESSAGE_CONTEXT_WINDOW = {
  before: 20,
  after: 20,
} as const;
const FORWARDED_SOURCE_CONTEXT_WINDOW = {
  before: 0,
  after: 0,
} as const;
const FORWARDED_SOURCE_CONTEXT_FALLBACK_WINDOW = {
  before: 1,
  after: 1,
} as const;

function normalizeUnreadReadStateMessageId(value?: string | null) {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : null;
}

function parseUnreadReadStateTimestamp(value?: string | null) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function shouldApplyActiveRoomBootstrapReadState(
  currentRoom:
    | TeamChatUnreadSummaryResponse['rooms'][number]
    | undefined,
  nextReadState: TeamChatReadStateResponse,
) {
  if (!currentRoom) return true;
  if (nextReadState.isManualUnreadByUser === true) return true;

  const currentLastReadAt = parseUnreadReadStateTimestamp(currentRoom.lastReadAt);
  const nextLastReadAt = parseUnreadReadStateTimestamp(nextReadState.lastReadAt);
  if (currentLastReadAt !== null && nextLastReadAt !== null && nextLastReadAt < currentLastReadAt) {
    return false;
  }
  if (
    currentLastReadAt !== null &&
    nextLastReadAt === null &&
    currentRoom.unreadCount === 0 &&
    nextReadState.unreadCount > 0
  ) {
    return false;
  }

  const currentLastReadMessageId = normalizeUnreadReadStateMessageId(
    currentRoom.lastReadMessageId,
  );
  const nextLastReadMessageId = normalizeUnreadReadStateMessageId(
    nextReadState.lastReadMessageId,
  );
  const hasSameReadAnchor =
    currentLastReadMessageId !== null && currentLastReadMessageId === nextLastReadMessageId;

  if (
    hasSameReadAnchor &&
    nextReadState.unreadCount < currentRoom.unreadCount &&
    ((currentLastReadAt !== null &&
      nextLastReadAt !== null &&
      nextLastReadAt === currentLastReadAt) ||
      (currentLastReadAt === null && nextLastReadAt === null))
  ) {
    return false;
  }

  return true;
}
const FORWARDED_SOURCE_HYDRATION_RETRY_DELAY_MS = 15_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseTeamChatDeeplinkScope(
  value: string | null | undefined,
): TeamChatSupportedContextScope | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'project') return 'project';
  if (normalized === 'organization' || normalized === 'org') return 'organization';
  return null;
}

function buildScopedRoomListQueryParams(params: {
  scope: TeamChatSupportedContextScope;
  projectId?: string | null;
  page?: number;
  limit?: number;
  includeArchived?: boolean;
  includeHidden?: boolean;
  archivedOnly?: boolean;
  hiddenOnly?: boolean;
  starredOnly?: boolean;
}): ListTeamChatRoomsParams {
  const scopeRequest = resolveTeamChatScopeRequest({
    scope: params.scope,
    projectId: params.projectId,
  });

  return {
    page: params.page ?? 1,
    limit: params.limit ?? 100,
    includeArchived: params.includeArchived ?? false,
    includeHidden: params.includeHidden ?? false,
    archivedOnly: params.archivedOnly,
    hiddenOnly: params.hiddenOnly,
    starredOnly: params.starredOnly,
    contextScope: scopeRequest.contextScope,
    contextId: scopeRequest.contextId,
  };
}

function formatPersonalFeedTimeLabel(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatPersonalFeedDateLabel(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function resolveMergedForwardedSnapshot(
  message: Pick<TeamChatRoomMessageResponse, 'forwardedSnapshot' | 'metadata'>,
): Record<string, unknown> | undefined {
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
}

function parseConversationKeyRoomId(conversationKey?: string | null): string | null {
  const normalizedConversationKey = toNonEmptyString(conversationKey);
  if (!normalizedConversationKey) return null;

  const separatorIndex = normalizedConversationKey.indexOf(':');
  if (separatorIndex < 0) return null;

  return toNonEmptyString(normalizedConversationKey.slice(separatorIndex + 1));
}

function resolveRoomIdFromConversationKey(
  conversationKey: string | null | undefined,
  roomSummaryById: Map<string, TeamChatRoomSummaryResponse>,
): string | null {
  const conversationToken = parseConversationKeyRoomId(conversationKey);
  if (!conversationToken) return null;

  if (roomSummaryById.has(conversationToken) || isUuidLikeValue(conversationToken)) {
    return conversationToken;
  }

  const normalizedConversationToken = conversationToken.toLowerCase();

  for (const roomSummary of roomSummaryById.values()) {
    if (roomSummary.id.trim().toLowerCase() === normalizedConversationToken) {
      return roomSummary.id;
    }

    const normalizedRoomKey = roomSummary.roomKey?.trim().toLowerCase();
    if (normalizedRoomKey && normalizedRoomKey === normalizedConversationToken) {
      return roomSummary.id;
    }

    if (roomSummary.name.trim().toLowerCase() === normalizedConversationToken) {
      return roomSummary.id;
    }
  }

  return conversationToken;
}

interface ForwardTarget {
  key: ConversationKey;
  kind: ConversationKind;
  id: string;
  title: string;
  subtitle: string;
  visibility?: 'public' | 'private';
  status?: DirectMessageContact['status'];
  avatarUrl?: string;
}

interface ForwardedSourceMessagePreview {
  author?: string;
  content?: string;
  rawContent?: string;
  nestedForwardedContent?: string;
  forwardedOriginalMessageId?: string;
  contentFormat?: ConversationMessage['contentFormat'];
  richContent?: ConversationMessage['richContent'];
  sentAt?: string;
  avatarUrl?: string;
  isForwarded?: boolean;
}

export function useTeamChatScreenController(): TeamChatScreenViewProps {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceCtx = useServiceContext();
  const currentUserProfile = useAppSelector((state) => state.user.profile ?? null);
  const currentUserId = currentUserProfile?.id ?? null;
  const currentUserDisplayName = useMemo(() => {
    const fullName = [currentUserProfile?.firstName, currentUserProfile?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    return fullName || currentUserProfile?.email || '';
  }, [
    currentUserProfile?.email,
    currentUserProfile?.firstName,
    currentUserProfile?.lastName,
  ]);
  const {
    activeView,
    setActiveView,
    activeConversationKind,
    setActiveConversationKind,
    activeChannelId,
    setActiveChannelId,
    activeDmId,
    setActiveDmId,
    activeTab,
    setActiveTab,
    draftHubActiveTab,
    setDraftHubActiveTab,
    channelTabsById,
    setChannelTabsById,
    directMessageTabsByRoomId,
    setDirectMessageTabsByRoomId,
    personalFilter,
    setPersonalFilter,
    selectedPersonalFeedId,
    setSelectedPersonalFeedId,
    personalReadOverrideIds,
    setPersonalReadOverrideIds,
    composerResetKey,
    setComposerResetKey,
    composerDraftSeedValueRef,
    setComposerDraftSeedValue,
    composerDraftSeedPayload,
    setComposerDraftSeedPayload,
    composerHasImmediateDraftText,
    setComposerHasImmediateDraftText,
    setComposerDraftDirty,
    hydratedComposerDraftContextKey,
    setHydratedComposerDraftContextKey,
    activeCurrentDraftSnapshot,
    setActiveCurrentDraftSnapshot,
    activeCurrentDraftFetchStatus,
    setActiveCurrentDraftFetchStatus,
    draftsExtraRecords,
    setDraftsExtraRecords,
    draftsNextCursor,
    setDraftsNextCursor,
    draftsLoadingMore,
    setDraftsLoadingMore,
    scheduledExtraRecords,
    setScheduledExtraRecords,
    scheduledNextCursor,
    setScheduledNextCursor,
    scheduledLoadingMore,
    setScheduledLoadingMore,
    pendingComposerDraftHydration,
    setPendingComposerDraftHydration,
    activeComposerScheduledEditId,
    setActiveComposerScheduledEditId,
    composerScheduledNotice,
    setComposerScheduledNotice,
    composerAttachments,
    setComposerAttachments,
    uploadingAttachmentsByMessageId,
    setUploadingAttachmentsByMessageId,
    messagesByConversation,
    setMessagesByConversation,
    messageHistoryByRoomId,
    setMessageHistoryByRoomId,
    forwardedAuthorOverridesByMessageId,
    setForwardedAuthorOverridesByMessageId,
    forwardedRenderOverridesByMessageId,
    setForwardedRenderOverridesByMessageId,
    createChannelDialogOpen,
    setCreateChannelDialogOpen,
    createGroupDmDialogOpen,
    setCreateGroupDmDialogOpen,
    searchOpen,
    setSearchOpen,
    messageSearch,
    setMessageSearch,
    filesSearch,
    setFilesSearch,
    browseSearch,
    setBrowseSearch,
    browseSortBy,
    setBrowseSortBy,
    roomScope,
    setRoomScope,
    roomScopeProjectId,
    setRoomScopeProjectId,
    browseSelectedChannelId,
    setBrowseSelectedChannelId,
    browseChannels,
    setBrowseChannels,
    browseCursor,
    setBrowseCursor,
    browseNextCursor,
    setBrowseNextCursor,
    browseLoadingMore,
    setBrowseLoadingMore,
    joiningPublicRoomId,
    setJoiningPublicRoomId,
    highlightedMessageId,
    setHighlightedMessageId,
    manualUnreadRoomIds,
    setManualUnreadRoomIds,
    pendingLinkedMessageTarget,
    setPendingLinkedMessageTarget,
    composerState,
    setComposerState,
    inlineEditState,
    setInlineEditState,
    deleteMessageState,
    setDeleteMessageState,
    forwardState,
    setForwardState,
    openSections,
    setOpenSections,
    deferredMessageSearch,
    deferredFilesSearch,
    deferredBrowseSearch,
    autoPresenceSessionSyncRef,
    composerDraftContextKeyRef,
    composerDraftValueRef,
    composerDraftPayloadRef,
    composerDraftSeedPayloadRef,
    composerDraftSeedValue,
    composerDraftSessionByContextRef,
    composerDraftPayloadSessionByContextRef,
    composerScheduledEditSessionByContextRef,
    fetchedComposerDraftContextKeysRef,
    activeCurrentDraftSnapshotRef,
    activeCurrentDraftRequestIdRef,
    pendingLinkedMessageRequestIdRef,
    roomTabsCacheRef,
    readStateSyncRef,
    manualUnreadRoomIdsRef,
    personalFeedReadSyncRef,
    notificationDeeplinkHandledRef,
    reactionActorsHydrationRef,
    reactionMutationPendingRef,
    setComposerDraftSessionValue,
    clearComposerDraftSessionValue,
    setComposerDraftPayloadSessionValue,
    clearComposerDraftPayloadSessionValue,
    setComposerScheduledEditSessionValue,
    clearComposerScheduledEditSessionValue,
    persistRoomTabsCache,
  } = useTeamChatControllerState({
    currentUserId,
  });
  const service = useMemo(() => new TeamChatService(serviceCtx), [serviceCtx]);
  const projectListQuery = useProjectList({ page: 1, limit: 100 });
  const projectOptions = useMemo<TeamChatProjectOption[]>(
    () =>
      (projectListQuery.data ?? [])
        .map((project) => ({
          id: project.id,
          name: project.name,
          status: project.status,
        }))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [projectListQuery.data],
  );
  const roomScopeRequest = useMemo(
    () =>
      resolveTeamChatScopeRequest({
        scope: roomScope,
        projectId: roomScopeProjectId,
      }),
    [roomScope, roomScopeProjectId],
  );
  const roomScopeProjectErrorMessage = projectListQuery.isError
    ? (projectListQuery.error?.message ?? 'Unable to load accessible projects right now.')
    : null;
  const queryClient = useQueryClient();
  const notificationDeeplinkFallbackRef = useRef<string | null>(null);
  const roomHydrationInFlightRef = useRef(new Set<string>());
  const forwardedSourceHydrationKeysRef = useRef(new Set<string>());
  const forwardedSourceHydrationBackoffUntilRef = useRef(new Map<string, number>());
  const personalInboxRoomReadInFlightRef = useRef(new Set<string>());
  const personalInboxRoomForcedConsumeRef = useRef<string | null>(null);

  useEffect(() => {
    if (roomScope !== 'project') return;
    if (projectListQuery.isPending) return;
    if (projectOptions.length === 0) {
      setRoomScope('organization');
      setRoomScopeProjectId('');
      return;
    }
    if (projectOptions.some((project) => project.id === roomScopeProjectId)) return;
    setRoomScopeProjectId(projectOptions[0]?.id ?? '');
  }, [projectListQuery.isPending, projectOptions, roomScope, roomScopeProjectId]);

  const scopedRoomsQueryParams = useMemo<ListTeamChatRoomsParams>(
    () =>
      buildScopedRoomListQueryParams({
        scope: roomScope,
        projectId: roomScopeProjectId,
      }),
    [roomScope, roomScopeProjectId],
  );
  const archivedRoomsQueryParams = useMemo<ListTeamChatRoomsParams>(
    () =>
      buildScopedRoomListQueryParams({
        scope: roomScope,
        projectId: roomScopeProjectId,
        archivedOnly: true,
        includeHidden: true,
      }),
    [roomScope, roomScopeProjectId],
  );
  const hiddenRoomsQueryParams = useMemo<ListTeamChatRoomsParams>(
    () =>
      buildScopedRoomListQueryParams({
        scope: roomScope,
        projectId: roomScopeProjectId,
        hiddenOnly: true,
      }),
    [roomScope, roomScopeProjectId],
  );
  const starredRoomsQueryParams = useMemo<ListTeamChatRoomsParams>(
    () =>
      buildScopedRoomListQueryParams({
        scope: roomScope,
        projectId: roomScopeProjectId,
        limit: 50,
        starredOnly: true,
      }),
    [roomScope, roomScopeProjectId],
  );
  const roomsQuery = useTeamChatRooms(scopedRoomsQueryParams);
  const archivedRoomsQuery = useTeamChatRooms(archivedRoomsQueryParams);
  const hiddenRoomsQuery = useTeamChatRooms(hiddenRoomsQueryParams);
  const unreadSummaryQuery = useTeamChatUnreadSummary();
  const presenceQuery = useTeamChatPresence();
  const mentionsQuery = useTeamChatMentions({ limit: 100 });
  const notificationsQuery = useTeamChatNotifications({ limit: 100 });
  const starredRoomsQuery = useTeamChatRooms(starredRoomsQueryParams);
  const sendMessageMutation = useSendTeamChatMessage();
  const forwardMessageMutation = useForwardTeamChatMessage();
  const updateMessageMutation = useUpdateTeamChatMessage();
  const deleteMessageMutation = useDeleteTeamChatMessage();
  const deleteAttachmentMutation = useDeleteTeamChatAttachment();
  const starRoomMutation = useStarTeamChatRoom();
  const unstarRoomMutation = useUnstarTeamChatRoom();
  const archiveRoomMutation = useArchiveTeamChatRoom();
  const unarchiveRoomMutation = useUnarchiveTeamChatRoom();
  const addReactionMutation = useAddTeamChatReaction();
  const removeReactionMutation = useRemoveTeamChatReaction();
  const pinMessageMutation = usePinTeamChatMessage();
  const unpinMessageMutation = useUnpinTeamChatMessage();
  const updateRoomInfoMutation = useUpdateTeamChatRoomInfo();
  const updateChannelVisibilityMutation = useUpdateTeamChatChannelVisibility();
  const updateNotifySettingsMutation = useUpdateTeamChatNotifySettings();
  const updateRoomVisibilityMutation = useUpdateTeamChatRoomVisibility();
  const updateRoomTabsMutation = useUpdateTeamChatRoomTabs();
  const updateRoomPoliciesMutation = useUpdateTeamChatRoomPolicies();
  const updateMemberRoleMutation = useUpdateTeamChatMemberRole();
  const inviteMembersMutation = useInviteTeamChatMembers();
  const removeMemberMutation = useRemoveTeamChatMember();
  const createRoomMutation = useCreateTeamChatRoom();
  const joinRoomMutation = useJoinTeamChatRoom();
  const acceptInvitationMutation = useAcceptTeamChatInvitation();
  const updateReadStateMutation = useUpdateTeamChatReadState();
  const updatePresenceMutation = useUpdateTeamChatPresence();
  const updateCurrentDraftMutation = useUpsertTeamChatCurrentDraft();
  const deleteDraftMutation = useDeleteTeamChatDraft();
  const createScheduledMessageMutation = useCreateTeamChatScheduledMessage();
  const updateScheduledMessageMutation = useUpdateTeamChatScheduledMessage();
  const cancelScheduledMessageToDraftMutation =
    useCancelTeamChatScheduledMessageToDraft();
  const sendScheduledMessageNowMutation = useSendTeamChatScheduledMessageNow();
  const deleteScheduledMessageMutation = useDeleteTeamChatScheduledMessage();
  const markMentionReadMutation = useMarkTeamChatMentionRead();
  const markAllMentionsReadMutation = useMarkAllTeamChatMentionsRead();
  const markNotificationReadMutation = useMarkTeamChatNotificationRead();
  const markAllNotificationsReadMutation = useMarkAllTeamChatNotificationsRead();
  const markPersonalInboxRoomReadMutation = useMarkTeamChatPersonalInboxRoomRead();
  const {
    roomSummaries,
    archivedRoomSummaries,
    hiddenRoomSummaries,
    starredRoomSummaries,
    roomSummaryById,
    unreadCountMap,
    unreadRoomSummaries,
    presenceMap,
    currentUserPresenceStatus,
    workspaceChannels,
    dmRoomSummaryMap,
    privateRoomIds,
    privateRoomDetailsMap,
    groupDmRooms,
    dmRoomContacts,
    dmContacts,
    hiddenRecoverableItems,
    archivedRecoverableItems,
  } = useTeamChatRoomCollections({
    roomsData: roomsQuery.data,
    archivedRoomsData: archivedRoomsQuery.data,
    hiddenRoomsData: hiddenRoomsQuery.data,
    starredRoomsData: starredRoomsQuery.data,
    unreadSummaryData: unreadSummaryQuery.data,
    presenceData: presenceQuery.data,
    currentUserId,
    currentUserDisplayName,
    currentUserEmail: currentUserProfile?.email ?? null,
    service,
  });
  const currentUserPresence = currentUserId ? presenceMap.get(currentUserId) : undefined;
  const {
    browseRoomsPending,
    browsePreviewLoading,
    browsePreviewChannel,
    browsePreviewErrorMessage,
    browseLoading,
    browseHasMore,
    roomScopeFilter,
  } = useTeamChatBrowseState({
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
    projectListPending: projectListQuery.isPending,
    roomScopeProjectErrorMessage,
  });
  const updateManualUnreadRoomState = useCallback(
    (roomId: string, isManualUnreadByUser?: boolean | null) => {
      const normalizedRoomId = roomId.trim();
      if (!normalizedRoomId || typeof isManualUnreadByUser !== 'boolean') return;

      if (isManualUnreadByUser) {
        if (manualUnreadRoomIdsRef.current.has(normalizedRoomId)) return;
        manualUnreadRoomIdsRef.current.add(normalizedRoomId);
        setManualUnreadRoomIds((previous) =>
          previous.includes(normalizedRoomId)
            ? previous
            : [...previous, normalizedRoomId],
        );
        return;
      }

      if (!manualUnreadRoomIdsRef.current.has(normalizedRoomId)) return;
      manualUnreadRoomIdsRef.current.delete(normalizedRoomId);
      setManualUnreadRoomIds((previous) =>
        previous.filter((currentRoomId) => currentRoomId !== normalizedRoomId),
      );
    },
    [manualUnreadRoomIdsRef, setManualUnreadRoomIds],
  );
  const syncManualUnreadRoomState = useCallback(
    (params: {
      roomId: string;
      isManualUnreadByUser?: boolean | null;
      manualUnreadAt?: string | null;
      manualUnreadFromMessageId?: string | null;
    }) => {
      syncManualUnreadStateCache(queryClient, params);
      updateManualUnreadRoomState(params.roomId, params.isManualUnreadByUser);
    },
    [queryClient, updateManualUnreadRoomState],
  );

  useEffect(() => {
    if (!currentUserId) return;
    if (presenceQuery.status !== 'success') return;
    if (autoPresenceSessionSyncRef.current.has(currentUserId)) return;

    const normalizedStatus = currentUserPresence?.presenceStatus?.trim().toLowerCase();
    if (normalizedStatus === 'online') {
      autoPresenceSessionSyncRef.current.add(currentUserId);
      return;
    }

    const normalizedSource = currentUserPresence?.source?.trim().toLowerCase();
    if (normalizedSource === 'manual') {
      autoPresenceSessionSyncRef.current.add(currentUserId);
      return;
    }

    autoPresenceSessionSyncRef.current.add(currentUserId);
    void updatePresenceMutation.mutateAsync({
      presenceStatus: 'online',
      source: 'session_start',
    });
  }, [
    currentUserId,
    currentUserPresence?.presenceStatus,
    currentUserPresence?.source,
    presenceQuery.status,
    updatePresenceMutation,
  ]);
  useTeamChatSelectionEffects({
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
  });

  const activeConversationId =
    activeConversationKind === 'channel' ? activeChannelId : activeDmId;
  const activeConversationKey = buildConversationKey(
    activeConversationKind,
    activeConversationId,
  );

  const fallbackChannel: WorkspaceChannel = useMemo(
    () => ({
      id: '',
      name: 'No channel',
      visibility: 'public',
      memberCount: 0,
      topic: 'Channel conversation',
      unread: 0,
    }),
    [],
  );

  const activeChannel = useMemo(
    () => {
      const normalizedActiveChannelId = activeChannelId.trim();
      const matchedWorkspaceChannel = workspaceChannels.find(
        (channel) => channel.id === normalizedActiveChannelId,
      );
      if (matchedWorkspaceChannel) {
        return matchedWorkspaceChannel;
      }

      if (normalizedActiveChannelId) {
        const roomFromCurrentScope = roomSummaryById.get(normalizedActiveChannelId);
        if (roomFromCurrentScope?.roomType === 'channel') {
          return mapRoomToWorkspaceChannel(roomFromCurrentScope, unreadCountMap);
        }

        const cachedRoomDetail = queryClient.getQueryData<TeamChatRoomDetailResponse>(
          teamChatQueryKeys.roomDetail(normalizedActiveChannelId),
        );
        if (cachedRoomDetail?.roomType === 'channel') {
          return mapRoomToWorkspaceChannel(cachedRoomDetail, unreadCountMap);
        }
      }

      return workspaceChannels[0] ?? fallbackChannel;
    },
    [
      activeChannelId,
      fallbackChannel,
      queryClient,
      roomSummaryById,
      unreadCountMap,
      workspaceChannels,
    ],
  );

  const activeDm = useMemo(() => {
    const selectedContact = dmContacts.find(
      (contact) => contact.id === activeDmId || contact.roomId === activeDmId,
    );
    if (selectedContact) return selectedContact;
    if (!activeDmId) return dmContacts[0];

    const fallbackDmRoom =
      privateRoomDetailsMap.get(activeDmId) ??
      dmRoomSummaryMap.get(activeDmId) ??
      roomSummaryById.get(activeDmId);
    if (fallbackDmRoom?.roomType !== 'dm') return undefined;

    return mapRoomToDirectMessageContact(fallbackDmRoom, {
      currentUserId,
      currentUserDisplayName,
      currentUserEmail: currentUserProfile?.email ?? null,
      unreadCountMap,
      presenceMap,
    });
  }, [
    activeDmId,
    currentUserDisplayName,
    currentUserId,
    currentUserProfile?.email,
    dmContacts,
    dmRoomSummaryMap,
    presenceMap,
    privateRoomDetailsMap,
    roomSummaryById,
    unreadCountMap,
  ]);
  const activeGroupDm = useMemo(() => {
    const selectedRoom = groupDmRooms.find(
      (room) => room.id === activeDmId || room.roomId === activeDmId,
    );
    if (selectedRoom) return selectedRoom;
    if (!activeDmId) return groupDmRooms[0];

    const fallbackGroupDmRoom =
      privateRoomDetailsMap.get(activeDmId) ?? roomSummaryById.get(activeDmId);
    if (fallbackGroupDmRoom?.roomType !== 'group_dm') return undefined;

    return mapRoomToGroupDirectMessageConversation(fallbackGroupDmRoom, {
      currentUserId,
      unreadCountMap,
    });
  }, [
    activeDmId,
    currentUserId,
    groupDmRooms,
    privateRoomDetailsMap,
    roomSummaryById,
    unreadCountMap,
  ]);

  const activeRoomId =
    activeConversationKind === 'channel'
      ? activeChannel.id
      : activeConversationKind === 'group_dm'
        ? (activeGroupDm?.roomId ?? activeGroupDm?.id ?? activeDmId)
        : (activeDm?.roomId ??
          (activeDm?.source === 'room' ? activeDm.id : undefined) ??
          (activeDmId.startsWith('user:') ? '' : activeDmId));
  const activeComposerDraftContext = useMemo(() => {
    if (!activeRoomId) return null;

    const replyMessage = composerState?.mode === 'reply' ? composerState.message : null;
    return {
      roomId: activeRoomId,
      threadRootMessageId: replyMessage?.parentMessageId ?? replyMessage?.id,
      parentMessageId: replyMessage?.id,
    };
  }, [
    activeRoomId,
    composerState?.message?.id,
    composerState?.message?.parentMessageId,
    composerState?.mode,
  ]);
  const activeComposerDraftContextKey = buildTeamChatDraftContextKey(
    activeComposerDraftContext ?? {},
  );
  const resolveComposerScheduledEditId = (contextKey = activeComposerDraftContextKey) => {
    if (!contextKey) return null;
    if (contextKey === activeComposerDraftContextKey && activeComposerScheduledEditId) {
      return activeComposerScheduledEditId;
    }
    return composerScheduledEditSessionByContextRef.current.get(contextKey) ?? null;
  };
  const activeRoomSummary = roomSummaryById.get(activeRoomId);
  const activeCachedPrivateRoomDetail = useMemo(
    () =>
      activeConversationKind !== 'channel' && activeRoomId
        ? privateRoomDetailsMap.get(activeRoomId)
        : undefined,
    [activeConversationKind, activeRoomId, privateRoomDetailsMap],
  );
  const activeRoomHistoryState = activeRoomId
    ? messageHistoryByRoomId[activeRoomId]
    : undefined;
  const activeRoomMessageCursorParams = useMemo(
    () => ({ limit: ACTIVE_ROOM_MESSAGE_BOOTSTRAP_LIMIT }),
    [],
  );
  const activeRoomRootDraftQueryParams = useMemo(
    () => ({
      threadRootMessageId: undefined as string | undefined,
      parentMessageId: undefined as string | undefined,
    }),
    [],
  );
  const activeRoomRootDraftQueryKey = useMemo(
    () =>
      activeRoomId
        ? teamChatQueryKeys.currentDraft(activeRoomId, activeRoomRootDraftQueryParams)
        : null,
    [activeRoomId, activeRoomRootDraftQueryParams],
  );
  const shouldIncludeActiveRoomMembers =
    activeConversationKind === 'dm'
      ? shouldFetchRoomMembersForIdentity(activeRoomSummary)
      : true;
  const hasActiveRoomDetailCache = useMemo(() => {
    if (!activeRoomId) return false;
    if (activeCachedPrivateRoomDetail) return true;
    return Boolean(queryClient.getQueryState(teamChatQueryKeys.roomDetail(activeRoomId)));
  }, [activeCachedPrivateRoomDetail, activeRoomId, queryClient]);
  const hasActiveRoomTabsCache = useMemo(
    () =>
      Boolean(
        activeRoomId &&
        queryClient.getQueryState(teamChatQueryKeys.roomTabs(activeRoomId)),
      ),
    [activeRoomId, queryClient],
  );
  const hasActiveRoomMessageCursorCache = useMemo(
    () =>
      Boolean(activeRoomHistoryState?.items?.length) ||
      Boolean(
        activeRoomId &&
        queryClient.getQueryState(
          teamChatQueryKeys.messageCursor(activeRoomId, activeRoomMessageCursorParams),
        ),
      ),
    [
      activeRoomHistoryState?.items?.length,
      activeRoomId,
      activeRoomMessageCursorParams,
      queryClient,
    ],
  );
  const hasActiveRoomRootDraftCache = useMemo(
    () =>
      Boolean(
        activeRoomRootDraftQueryKey &&
        queryClient.getQueryState(activeRoomRootDraftQueryKey),
      ),
    [activeRoomRootDraftQueryKey, queryClient],
  );
  const shouldUseActiveRoomBootstrap =
    activeView === 'channel' &&
    Boolean(activeRoomId) &&
    (!hasActiveRoomDetailCache ||
      !hasActiveRoomTabsCache ||
      !hasActiveRoomMessageCursorCache ||
      !hasActiveRoomRootDraftCache);
  const activeRoomBootstrapQuery = useTeamChatRoomBootstrap(
    activeRoomId,
    {
      includeMembers: shouldIncludeActiveRoomMembers,
      messageLimit: activeRoomMessageCursorParams.limit,
      pinnedLimit: ACTIVE_ROOM_PINNED_BOOTSTRAP_LIMIT,
    },
    {
      enabled: shouldUseActiveRoomBootstrap,
      staleTime: activeConversationKind === 'channel' ? 15_000 : 30_000,
    },
  );
  const activeRoomBootstrapData = activeRoomBootstrapQuery.data;
  const bootstrapPinnedMessages = activeRoomBootstrapData?.pinnedMessages ?? [];
  const shouldWaitForBootstrapSeed =
    Boolean(activeRoomBootstrapData) &&
    ((!hasActiveRoomDetailCache && Boolean(activeRoomBootstrapData?.room)) ||
      (!hasActiveRoomTabsCache && Boolean(activeRoomBootstrapData?.tabs)) ||
      (!hasActiveRoomMessageCursorCache &&
        Boolean(activeRoomBootstrapData?.messageCursor)) ||
      (!hasActiveRoomRootDraftCache && activeRoomBootstrapData?.draft !== undefined));
  const shouldPauseStandaloneActiveRoomQueries =
    Boolean(activeRoomId) &&
    (activeRoomBootstrapQuery.isPending || shouldWaitForBootstrapSeed);

  useEffect(() => {
    if (!activeRoomId || !activeRoomBootstrapData) return;

    if (activeRoomBootstrapData.room) {
      queryClient.setQueryData<TeamChatRoomDetailResponse | undefined>(
        teamChatQueryKeys.roomDetail(activeRoomId),
        (current) => {
          const nextRoom = activeRoomBootstrapData.room ?? undefined;
          if (!nextRoom) return current;
          if (!current) return nextRoom;

          return {
            ...current,
            ...nextRoom,
            members:
              Array.isArray(nextRoom.members) && nextRoom.members.length > 0
                ? nextRoom.members
                : current.members,
          };
        },
      );
    }

    if (activeRoomBootstrapData.tabs) {
      queryClient.setQueryData(
        teamChatQueryKeys.roomTabs(activeRoomId),
        activeRoomBootstrapData.tabs,
      );
    }

    if (activeRoomBootstrapData.messageCursor) {
      let seededMessageCursorFromBootstrap = false;
      queryClient.setQueryData<TeamChatMessageCursorResponse | undefined>(
        teamChatQueryKeys.messageCursor(activeRoomId, activeRoomMessageCursorParams),
        (current) => {
          if (current) return current;
          seededMessageCursorFromBootstrap = true;
          return activeRoomBootstrapData.messageCursor ?? current;
        },
      );
      if (seededMessageCursorFromBootstrap) {
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.messageCursor(
            activeRoomId,
            activeRoomMessageCursorParams,
          ),
          exact: true,
        });
      }
    }

    if (activeRoomRootDraftQueryKey) {
      queryClient.setQueryData<TeamChatDraftResponse | null | undefined>(
        activeRoomRootDraftQueryKey,
        (current) =>
          current === undefined ? (activeRoomBootstrapData.draft ?? null) : current,
      );
    }

    if (Array.isArray(activeRoomBootstrapData.pinnedMessages)) {
      const bootstrapPinnedMessages = activeRoomBootstrapData.pinnedMessages;
      queryClient.setQueryData<TeamChatPinnedMessageResponse[] | undefined>(
        teamChatQueryKeys.pinnedMessages(activeRoomId),
        (current) => current ?? bootstrapPinnedMessages,
      );
    }

    if (activeRoomBootstrapData.readState) {
      const currentUnreadSummary = queryClient.getQueryData<TeamChatUnreadSummaryResponse>(
        teamChatQueryKeys.unreadSummary(),
      );
      const currentRoomUnread = currentUnreadSummary?.rooms?.find(
        (room) => room.roomId === activeRoomBootstrapData.readState?.roomId,
      );
      const shouldApplyBootstrapReadState = shouldApplyActiveRoomBootstrapReadState(
        currentRoomUnread,
        activeRoomBootstrapData.readState,
      );
      if (shouldApplyBootstrapReadState) {
        syncUnreadSummaryCache(queryClient, activeRoomBootstrapData.readState);
        syncManualUnreadRoomState(activeRoomBootstrapData.readState);
      }
    }
  }, [
    activeRoomBootstrapData,
    activeRoomId,
    activeRoomMessageCursorParams,
    activeRoomRootDraftQueryKey,
    queryClient,
    syncManualUnreadRoomState,
  ]);

  useEffect(() => {
    if (activeConversationKind === 'channel' || !activeRoomId) return;
    setDirectMessageTabsByRoomId((previous) => {
      if (previous[activeRoomId]) return previous;
      return {
        ...previous,
        [activeRoomId]: cloneRoomTabs(
          roomTabsCacheRef.current?.[activeRoomId] ?? defaultDirectMessageTabs(),
        ),
      };
    });
  }, [activeConversationKind, activeRoomId]);

  const roomAttachmentsRoomId = activeView === 'channel' ? activeRoomId : '';
  const roomPhotosRoomId = activeView === 'channel' ? activeRoomId : '';
  const roomAttachmentsRefetchInterval = activeTab === 'files' ? 25_000 : false;
  const roomPhotosRefetchInterval = activeTab === 'photos' ? 25_000 : false;

  const roomAttachmentsQuery = useTeamChatRoomAttachments(
    roomAttachmentsRoomId,
    {
      page: 1,
      limit: 100,
      search: deferredFilesSearch.trim() || undefined,
    },
    {
      refetchInterval: roomAttachmentsRefetchInterval,
    },
  );
  const roomPhotosQuery = useTeamChatRoomAttachments(
    roomPhotosRoomId,
    {
      page: 1,
      limit: 100,
      type: 'image',
    },
    {
      refetchInterval: roomPhotosRefetchInterval,
    },
  );
  const filesTabLoading =
    activeView === 'channel' &&
    Boolean(roomAttachmentsRoomId) &&
    roomAttachmentsQuery.isPending;
  const photosTabLoading =
    activeView === 'channel' && Boolean(roomPhotosRoomId) && roomPhotosQuery.isPending;

  const activeRoomDetailQuery = useTeamChatRoomDetail(activeRoomId, {
    enabled: Boolean(activeRoomId) && !shouldPauseStandaloneActiveRoomQueries,
    includeMembers: shouldIncludeActiveRoomMembers,
    staleTime: activeConversationKind === 'channel' ? 15_000 : 30_000,
  });
  const activeRoomTabsQuery = useTeamChatRoomTabs(activeRoomId, {
    enabled: Boolean(activeRoomId) && !shouldPauseStandaloneActiveRoomQueries,
    staleTime: 15_000,
  });
  const activeRoomTabsData =
    activeRoomTabsQuery.data ?? activeRoomBootstrapData?.tabs ?? undefined;
  const activeRoomDetail =
    activeRoomDetailQuery.data ??
    activeRoomBootstrapData?.room ??
    activeCachedPrivateRoomDetail;
  useEffect(() => {
    const nextManualUnreadRoomIds = new Set(manualUnreadRoomIdsRef.current);

    const reconcileRoom = (room: TeamChatRoomSummaryResponse | null | undefined) => {
      if (!room) return;
      const normalizedRoomId = room.id?.trim();
      if (!normalizedRoomId) return;

      if (room.isManualUnreadByUser) {
        nextManualUnreadRoomIds.add(normalizedRoomId);
      } else {
        nextManualUnreadRoomIds.delete(normalizedRoomId);
      }
    };

    roomSummaries.forEach(reconcileRoom);
    hiddenRoomSummaries.forEach(reconcileRoom);
    archivedRoomSummaries.forEach(reconcileRoom);
    reconcileRoom(activeRoomDetail);

    const previousManualUnreadRoomIds = manualUnreadRoomIdsRef.current;
    const isSameSet =
      previousManualUnreadRoomIds.size === nextManualUnreadRoomIds.size &&
      Array.from(previousManualUnreadRoomIds).every((roomId) =>
        nextManualUnreadRoomIds.has(roomId),
      );
    if (isSameSet) return;

    manualUnreadRoomIdsRef.current = nextManualUnreadRoomIds;
    const nextManualUnreadRoomIdList = Array.from(nextManualUnreadRoomIds);
    setManualUnreadRoomIds((previous) => {
      if (
        previous.length === nextManualUnreadRoomIdList.length &&
        previous.every((roomId) => nextManualUnreadRoomIds.has(roomId))
      ) {
        return previous;
      }
      return nextManualUnreadRoomIdList;
    });
  }, [
    activeRoomDetail,
    archivedRoomSummaries,
    hiddenRoomSummaries,
    manualUnreadRoomIdsRef,
    roomSummaries,
    setManualUnreadRoomIds,
  ]);
  const activeRoomScopeRequest = useMemo(
    () =>
      resolveTeamChatScopeRequest({
        scope:
          (activeRoomDetail?.contextScope ?? activeRoomSummary?.contextScope) ===
          'project'
            ? 'project'
            : 'organization',
        projectId: activeRoomDetail?.contextId ?? activeRoomSummary?.contextId,
      }),
    [
      activeRoomDetail?.contextId,
      activeRoomDetail?.contextScope,
      activeRoomSummary?.contextId,
      activeRoomSummary?.contextScope,
    ],
  );
  const myRoomMembership = activeRoomDetail?.members.find(
    (member) => member.userId === currentUserId,
  );
  const activeParticipantNameByUserId = useMemo(() => {
    const participantMap = new Map(
      (activeRoomDetail?.members ?? []).map((member) => {
        const displayName =
          [member.firstName, member.lastName].filter(Boolean).join(' ').trim() ||
          member.email ||
          member.userId;
        return [member.userId, displayName] as const;
      }),
    );

    if (activeConversationKind === 'dm') {
      if (activeDm?.userId && activeDm.name.trim().length > 0) {
        participantMap.set(activeDm.userId, activeDm.name);
      }
      if (currentUserId?.trim() && currentUserDisplayName.trim().length > 0) {
        participantMap.set(currentUserId, currentUserDisplayName);
      }
    }

    return participantMap;
  }, [
    activeConversationKind,
    activeDm,
    activeRoomDetail?.members,
    currentUserDisplayName,
    currentUserId,
  ]);
  const {
    typingNames: activeTypingNames,
    notifyTypingActivity,
    notifyTypingStopped,
    handleTypingStartedEvent,
    handleTypingStoppedEvent,
  } = useTeamChatTyping({
    activeRoomId,
    organizationId: serviceCtx.tenantId,
    currentUserId,
    participantNameByUserId: activeParticipantNameByUserId,
    enabled: Boolean(serviceCtx.tenantId),
  });
  const subscribedRealtimeRoomIds = useMemo(
    () =>
      Array.from(
        new Set(
          [...roomSummaries, ...hiddenRoomSummaries, ...archivedRoomSummaries].map(
            (room) => room.id,
          ),
        ),
      ),
    [archivedRoomSummaries, hiddenRoomSummaries, roomSummaries],
  );

  useTeamChatRealtime({
    activeRoomId,
    subscribedRoomIds: subscribedRealtimeRoomIds,
    organizationId: serviceCtx.tenantId,
    enabled: Boolean(serviceCtx.tenantId),
    currentUserId,
    isActiveRoomVisible: activeView === 'channel',
    onTypingStarted: handleTypingStartedEvent,
    onTypingStopped: handleTypingStoppedEvent,
    onPersonalInboxRoomReadUpdated: (
      payload: ChatPersonalInboxRoomReadUpdatedPayload,
    ) => {
      if (payload.roomId !== activeRoomId) return;
      if (activeView !== 'channel') return;

      const roomUnreadFeedIds = personalFeedItems
        .filter((item) => item.isUnread && item.channelId === payload.roomId)
        .map((item) => item.id);
      if (roomUnreadFeedIds.length === 0) return;

      setPersonalReadOverrideIds((previous) => {
        const nextIds = new Set(previous);
        roomUnreadFeedIds.forEach((feedId) => {
          if (feedId) {
            nextIds.add(feedId);
          }
        });

        return nextIds.size === previous.length ? previous : Array.from(nextIds);
      });
    },
    onRoomReadStateUpdated: (payload: ChatRoomReadStateUpdatedPayload) => {
      if (currentUserId?.trim() && payload.userId !== currentUserId.trim()) return;
      const fallbackManualUnreadByMode =
        payload.readStateMode === 'mark_unread'
          ? true
          : payload.readStateMode === 'mark_read'
            ? false
            : undefined;
      updateManualUnreadRoomState(
        payload.roomId,
        payload.isManualUnreadByUser ?? fallbackManualUnreadByMode,
      );
    },
    onMessageLinkPreviewUpdated: (payload) => {
      setMessageHistoryByRoomId((previous) => {
        const roomHistory = previous[payload.roomId];
        if (!roomHistory?.items?.length) return previous;

        return {
          ...previous,
          [payload.roomId]: {
            ...roomHistory,
            items: roomHistory.items.map((message) =>
              message.id === payload.messageId
                ? (() => {
                    const nextLinkPreviewMetadata =
                      buildLinkPreviewMetadataPatch(payload);

                    return {
                      ...message,
                      linkPreviews: payload.linkPreviews,
                      metadata: {
                        ...(message.metadata ?? {}),
                        ...(nextLinkPreviewMetadata.linkPreviewStatus
                          ? {
                              linkPreviewStatus:
                                nextLinkPreviewMetadata.linkPreviewStatus,
                            }
                          : {}),
                        linkPreviewPendingUrls:
                          nextLinkPreviewMetadata.linkPreviewPendingUrls,
                        linkPreviewFailedUrls:
                          nextLinkPreviewMetadata.linkPreviewFailedUrls,
                        ...(nextLinkPreviewMetadata.linkPreviewVersion
                          ? {
                              linkPreviewVersion:
                                nextLinkPreviewMetadata.linkPreviewVersion,
                            }
                          : {}),
                      },
                    };
                  })()
                : message,
            ),
          },
        };
      });
    },
    onMessageCreated: (message, payload) => {
      updateRoomMessageHistory(payload.roomId, (currentMessages) => {
        const currentMessage = currentMessages.find(
          (item) =>
            item.id === message.id ||
            (Boolean(message.clientMessageId) &&
              item.clientMessageId === message.clientMessageId),
        );
        const nextMessage = currentMessage
          ? mergeRealtimeRoomMessage(currentMessage, message)
          : message;

        return mergeRoomHistoryItems(
          currentMessages.filter(
            (item) =>
              item.id !== message.id &&
              (!message.clientMessageId ||
                item.clientMessageId !== message.clientMessageId),
          ),
          [nextMessage],
        );
      });
      upsertActiveConversationMessage(payload.roomId, message);
    },
    onMessageUpdated: (message, payload) => {
      updateRoomMessageHistory(payload.roomId, (currentMessages) => {
        const currentMessage = currentMessages.find(
          (item) =>
            item.id === message.id ||
            (Boolean(message.clientMessageId) &&
              item.clientMessageId === message.clientMessageId),
        );
        const nextMessage = currentMessage
          ? mergeRealtimeRoomMessage(currentMessage, message)
          : message;

        return mergeRoomHistoryItems(
          currentMessages.filter(
            (item) =>
              item.id !== message.id &&
              (!message.clientMessageId ||
                item.clientMessageId !== message.clientMessageId),
          ),
          [nextMessage],
        );
      });
      upsertActiveConversationMessage(payload.roomId, message);
      if (message.isEdited) {
        setForwardedRenderOverridesByMessageId((previous) => {
          if (!previous[message.id]) return previous;
          const next = { ...previous };
          delete next[message.id];
          return next;
        });
      }
    },
    onMessageDeleted: (payload) => {
      updateRoomMessageHistory(payload.roomId, (currentMessages) =>
        currentMessages.map((message) =>
          message.id === payload.messageId
            ? {
                ...message,
                isDeleted: payload.isDeleted ?? true,
                attachments: [],
                linkPreviews: [],
                reactionSummaries: [],
              }
            : message,
        ),
      );
      markActiveConversationMessageDeleted(payload.roomId, payload.messageId);
    },
    onMessageReactionUpdated: (payload) => {
      const normalizedCurrentUserId = currentUserId?.trim();
      const reactedByMe =
        normalizedCurrentUserId && Array.isArray(payload.reactorUserIds)
          ? payload.reactorUserIds.some((userId) => userId === normalizedCurrentUserId)
          : payload.reactedByMe;
      const nextReactionSummary: TeamChatMessageReactionSummaryResponse = {
        emoji: payload.emoji,
        count: payload.count,
        reactedByMe,
        reactors: payload.reactors?.map((reactor) => ({
          userId: reactor.userId,
          displayName: reactor.displayName ?? null,
          email: reactor.email ?? null,
          avatarUrl: reactor.avatarUrl ?? null,
          reactedAt: reactor.reactedAt ?? null,
        })),
      };

      syncMessageReactionSummaries(
        payload.roomId,
        payload.messageId,
        mergeTeamChatReactionSummaryList(
          readReactionSummariesForRoom(payload.roomId, payload.messageId),
          nextReactionSummary,
        ),
      );
    },
  });

  const activeMessagesQuery = useTeamChatMessageCursor(
    activeRoomId,
    activeRoomMessageCursorParams,
    {
      enabled: Boolean(activeRoomId) && !shouldPauseStandaloneActiveRoomQueries,
      staleTime: 15_000,
    },
  );
  const messageSearchQuery = useTeamChatMessageSearch(activeRoomId, {
    q: deferredMessageSearch.trim(),
    limit: 20,
  });
  const messageSearchItems = messageSearchQuery.data?.items ?? [];
  const activeMessageCursorSnapshot =
    activeMessagesQuery.data ?? activeRoomBootstrapData?.messageCursor ?? undefined;
  const activeRoomMessages =
    activeRoomHistoryState?.items ?? activeMessageCursorSnapshot?.items ?? [];
  const cachedRoomMessagesById = useMemo(() => {
    const lookup = new Map<string, TeamChatRoomMessageResponse>();

    Object.values(messageHistoryByRoomId).forEach((roomHistory) => {
      roomHistory.items.forEach((message) => {
        lookup.set(message.id, message);
      });
    });

    activeRoomMessages.forEach((message) => {
      lookup.set(message.id, message);
    });

    return lookup;
  }, [activeRoomMessages, messageHistoryByRoomId]);
  const cachedRoomMessages = useMemo(
    () => Array.from(cachedRoomMessagesById.values()),
    [cachedRoomMessagesById],
  );
  const {
    createTeamChatClientMessageId,
    createOptimisticLocalMessageId,
    buildOptimisticReplyQuote,
    createOptimisticConversationMessage,
    createUploadingAttachmentDrafts,
    setUploadingAttachmentDraftsForMessage,
    resetUploadingAttachmentDraftsForRetry,
    resetUploadingAttachmentDraftForRetry,
    removeUploadingAttachmentDraft,
    dismissOptimisticConversationMessage,
    uploadComposerAttachmentsToMessage,
    sendAttachmentMessageOptimistically,
    sendTextOnlyMessageOptimistically,
    updateRoomMessageHistory,
    queuePendingLinkedMessage,
    handleLoadOlderMessages,
    openMessageInActiveConversation,
  } = useTeamChatMessagePipeline({
    activeRoomId,
    activeConversationKey,
    activeRoomMessages,
    activeRoomHistoryState,
    activeMessageCursorSnapshot,
    pendingLinkedMessageTarget,
    linkedMessageContextWindow: LINKED_MESSAGE_CONTEXT_WINDOW,
    messagesByConversation,
    currentUserDisplayName,
    currentUserEmail: currentUserProfile?.email ?? null,
    mentionContextKind: activeConversationKind,
    readActiveChannelMembers,
    queryClient,
    service,
    sendMessageRequest: sendMessageMutation.mutateAsync,
    mapRoomMessageToConversationStreamMessage,
    updateConversationMessages,
    pendingLinkedMessageRequestIdRef,
    setMessageHistoryByRoomId,
    setUploadingAttachmentsByMessageId,
    setPendingLinkedMessageTarget,
    setActiveTab,
    setHighlightedMessageId,
    updateUploadingAttachmentDraft,
    revokeAttachmentPreviewUrl,
  });
  useEffect(() => {
    if (!activeRoomId || activeRoomMessages.length === 0) return;

    const hasKnownForwardedSnapshotAuthor = (message: TeamChatRoomMessageResponse) => {
      const snapshot = resolveMergedForwardedSnapshot(message);
      if (!snapshot) return false;

      const fullName = [snapshot.originalSenderFirstName, snapshot.originalSenderLastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      const legacyFullName = [
        snapshot['originalAuthorFirstName'],
        snapshot['originalAuthorLastName'],
      ]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (fullName || legacyFullName) return true;

      return Boolean(
        toNonEmptyString(snapshot.originalSenderDisplayName) ||
        toNonEmptyString(snapshot.originalSenderEmail) ||
        toNonEmptyString(snapshot.originalSenderId) ||
        toNonEmptyString(snapshot['originalAuthorDisplayName']) ||
        toNonEmptyString(snapshot['originalAuthorEmail']) ||
        toNonEmptyString(snapshot['originalAuthorId']) ||
        toNonEmptyString(snapshot.originalAuthor),
      );
    };

    const pendingHydrationTargets = new Map<
      string,
      {
        sourceRoomId: string;
        sourceMessageId: string;
      }
    >();

    activeRoomMessages.forEach((message) => {
      const resolvedForwardedSnapshot = resolveMergedForwardedSnapshot(message);
      const metadata = isRecord(message.metadata) ? message.metadata : undefined;
      const sourceMessageId =
        toNonEmptyString(metadata?.forwardedFromMessageId) ||
        toNonEmptyString(resolvedForwardedSnapshot?.['originalMessageId']);
      if (!sourceMessageId) {
        return;
      }

      const sourceRoomId =
        toNonEmptyString(metadata?.forwardedFromRoomId) ||
        toNonEmptyString(resolvedForwardedSnapshot?.['originalRoomId']) ||
        resolveRoomIdFromConversationKey(
          toNonEmptyString(resolvedForwardedSnapshot?.['sourceConversationKey']) ||
            toNonEmptyString(metadata?.forwardedFromConversationKey),
          roomSummaryById,
        );
      if (!sourceRoomId) {
        return;
      }

      const cachedSourceMessage = cachedRoomMessagesById.get(sourceMessageId);
      const cachedSourceAuthor = cachedSourceMessage
        ? resolveRawMessageAuthor(cachedSourceMessage)
        : null;
      const snapshotHasKnownAuthor = hasKnownForwardedSnapshotAuthor(message);
      if (cachedSourceAuthor && cachedSourceAuthor !== 'Unknown user') {
        setForwardedAuthorOverridesByMessageId((previous) =>
          previous[sourceMessageId] === cachedSourceAuthor
            ? previous
            : {
                ...previous,
                [sourceMessageId]: cachedSourceAuthor,
              },
        );
      }

      const needsSourceHydration = !cachedSourceMessage;
      const needsAuthorHydration =
        !snapshotHasKnownAuthor &&
        (!cachedSourceAuthor || cachedSourceAuthor === 'Unknown user');
      if (!needsSourceHydration && !needsAuthorHydration) {
        return;
      }

      const hydrationKey = `${sourceRoomId}:${sourceMessageId}`;
      const retryAfter =
        forwardedSourceHydrationBackoffUntilRef.current.get(hydrationKey) ?? 0;
      if (Date.now() < retryAfter) return;
      pendingHydrationTargets.set(hydrationKey, { sourceRoomId, sourceMessageId });
    });

    if (pendingHydrationTargets.size === 0) return;

    let cancelled = false;
    pendingHydrationTargets.forEach(({ sourceRoomId, sourceMessageId }, hydrationKey) => {
      if (forwardedSourceHydrationKeysRef.current.has(hydrationKey)) return;
      forwardedSourceHydrationKeysRef.current.add(hydrationKey);
      forwardedSourceHydrationBackoffUntilRef.current.delete(hydrationKey);

      const fetchForwardedSourceContext = async () => {
        const primaryResponse = await queryClient.fetchQuery({
          queryKey: teamChatQueryKeys.messageContext(
            sourceRoomId,
            sourceMessageId,
            FORWARDED_SOURCE_CONTEXT_WINDOW,
          ),
          queryFn: () =>
            service.getMessageContext(
              sourceRoomId,
              sourceMessageId,
              FORWARDED_SOURCE_CONTEXT_WINDOW,
            ),
          staleTime: 30_000,
        });
        const primarySourceMessage =
          primaryResponse.items?.find((item) => item.id === sourceMessageId) ?? null;
        if (primarySourceMessage) {
          return {
            response: primaryResponse,
            sourceMessage: primarySourceMessage,
            resolution: 'primary',
          } as const;
        }

        const fallbackResponse = await queryClient.fetchQuery({
          queryKey: teamChatQueryKeys.messageContext(
            sourceRoomId,
            sourceMessageId,
            FORWARDED_SOURCE_CONTEXT_FALLBACK_WINDOW,
          ),
          queryFn: () =>
            service.getMessageContext(
              sourceRoomId,
              sourceMessageId,
              FORWARDED_SOURCE_CONTEXT_FALLBACK_WINDOW,
            ),
          staleTime: 30_000,
        });
        const fallbackSourceMessage =
          fallbackResponse.items?.find((item) => item.id === sourceMessageId) ??
          fallbackResponse.items?.[0] ??
          null;

        return {
          response: fallbackResponse,
          sourceMessage: fallbackSourceMessage,
          resolution: 'fallback',
        } as const;
      };

      void fetchForwardedSourceContext()
        .then((response) => {
          if (cancelled) return;

          const sourceMessage = response.sourceMessage;
          if (!sourceMessage) {
            forwardedSourceHydrationBackoffUntilRef.current.set(
              hydrationKey,
              Date.now() + FORWARDED_SOURCE_HYDRATION_RETRY_DELAY_MS,
            );
            return;
          }

          updateRoomMessageHistory(sourceRoomId, (currentMessages) =>
            mergeRoomHistoryItems(currentMessages, [sourceMessage]),
          );

          const sourceAuthor = resolveRawMessageAuthor(sourceMessage);
          if (sourceAuthor && sourceAuthor !== 'Unknown user') {
            setForwardedAuthorOverridesByMessageId((previous) =>
              previous[sourceMessageId] === sourceAuthor
                ? previous
                : {
                    ...previous,
                    [sourceMessageId]: sourceAuthor,
                  },
            );
          }
        })
        .catch(() => {
          forwardedSourceHydrationBackoffUntilRef.current.set(
            hydrationKey,
            Date.now() + FORWARDED_SOURCE_HYDRATION_RETRY_DELAY_MS,
          );
        })
        .finally(() => {
          forwardedSourceHydrationKeysRef.current.delete(hydrationKey);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [
    activeRoomId,
    activeRoomMessages,
    cachedRoomMessagesById,
    queryClient,
    roomSummaryById,
    service,
    setForwardedAuthorOverridesByMessageId,
    updateRoomMessageHistory,
  ]);
  const pinnedMessagesQuery = useTeamChatPinnedMessages(activeRoomId, {
    enabled: Boolean(activeRoomId) && !shouldPauseStandaloneActiveRoomQueries,
    staleTime: 10_000,
  });
  const roomPinStateQuery = useTeamChatRoomPinState(activeRoomId, {
    enabled: Boolean(activeRoomId),
  });
  const pinnedMessages = pinnedMessagesQuery.data ?? bootstrapPinnedMessages;
  const activePinnedCount =
    typeof roomPinStateQuery.data?.pinnedCount === 'number'
      ? roomPinStateQuery.data.pinnedCount
      : pinnedMessages.length;
  const pinnedMessageIds = useMemo(
    () => new Set(pinnedMessages.map((item) => item.messageId)),
    [pinnedMessages],
  );

  const activeMessageIds = useMemo(
    () => activeRoomMessages.map((message) => message.id),
    [activeRoomMessages],
  );
  const reactionHydrationMessageIds = useMemo(
    () =>
      Array.from(
        new Set([
          ...activeRoomMessages
            .filter((message) => !Array.isArray(message.reactionSummaries))
            .map((message) => message.id),
          ...pinnedMessages
            .filter((item) => !Array.isArray(item.message.reactionSummaries))
            .map((item) => item.messageId),
        ]),
      ),
    [activeRoomMessages, pinnedMessages],
  );
  const attachmentHydrationMessageIds = useMemo(
    () =>
      Array.from(
        new Set([...activeMessageIds, ...pinnedMessages.map((item) => item.messageId)]),
      ),
    [activeMessageIds, pinnedMessages],
  );

  const reactionsByMessageQuery = useQuery({
    queryKey: [
      'teamChat',
      'reactions-by-message',
      activeRoomId,
      reactionHydrationMessageIds,
    ],
    enabled: Boolean(activeRoomId && reactionHydrationMessageIds.length > 0),
    queryFn: async () => {
      try {
        const reactionEntries = await service.listReactionsByMessageIds(
          activeRoomId,
          reactionHydrationMessageIds,
        );
        return Object.fromEntries(
          reactionHydrationMessageIds.map((messageId) => [
            messageId,
            reactionEntries.find((item) => item.messageId === messageId)
              ?.reactionSummaries ?? [],
          ]),
        );
      } catch {
        const fallbackEntries = await Promise.all(
          reactionHydrationMessageIds.map(async (messageId) => {
            try {
              const reactions = await service.listReactions(activeRoomId, messageId);
              return [messageId, reactions] as const;
            } catch {
              return [messageId, []] as const;
            }
          }),
        );

        return Object.fromEntries(fallbackEntries);
      }
    },
  });

  const shouldHydrateMessageAttachments =
    activeRoomMessages.some((message) => !Array.isArray(message.attachments)) ||
    pinnedMessages.some((item) => !Array.isArray(item.message.attachments));

  const attachmentsByMessageQuery = useQuery({
    queryKey: [
      'teamChat',
      'attachments-by-message',
      activeRoomId,
      attachmentHydrationMessageIds,
    ],
    enabled: Boolean(
      activeRoomId &&
      attachmentHydrationMessageIds.length > 0 &&
      shouldHydrateMessageAttachments,
    ),
    queryFn: async () => {
      const attachmentEntries = await Promise.all(
        attachmentHydrationMessageIds.map(async (messageId) => {
          try {
            const attachments = await service.listMessageAttachments(
              activeRoomId,
              messageId,
            );
            return [messageId, attachments] as const;
          } catch {
            return [messageId, []] as const;
          }
        }),
      );

      return Object.fromEntries(attachmentEntries);
    },
  });

  const reactionsByMessage = useMemo(
    () =>
      (reactionsByMessageQuery.data ?? {}) as Record<
        string,
        ReturnType<typeof service.listReactions> extends Promise<infer T> ? T : never
      >,
    [reactionsByMessageQuery.data],
  );
  const attachmentsByMessage = useMemo(
    () =>
      (attachmentsByMessageQuery.data ?? {}) as Record<
        string,
        ReturnType<typeof service.listMessageAttachments> extends Promise<infer T>
          ? T
          : never
      >,
    [attachmentsByMessageQuery.data],
  );

  const activeChannelMembers = useMemo(
    () =>
      (activeRoomDetail?.members ?? []).map((member) =>
        mapMemberToChannelMember(member, presenceMap),
      ),
    [activeRoomDetail?.members, presenceMap],
  );

  function readActiveChannelMembers() {
    return activeChannelMembers;
  }

  const mentionCandidates = useMemo<MentionCandidate[]>(() => {
    const specialMentionCandidates: MentionCandidate[] =
      activeConversationKind === 'channel'
        ? [
            {
              id: 'special:channel',
              name: 'channel',
              role: 'Notify everyone in this channel',
              inCurrentConversation: true,
              kind: 'special',
              specialMentionType: 'channel',
            },
          ]
        : activeConversationKind === 'group_dm'
          ? [
              {
                id: 'special:everyone',
                name: 'everyone',
                role: 'Notify everyone in this group',
                inCurrentConversation: true,
                kind: 'special',
                specialMentionType: 'everyone',
              },
            ]
          : [];
    const candidateMap = new Map<
      string,
      Omit<MentionCandidate, 'inCurrentConversation'>
    >();

    activeChannelMembers.forEach((member) => {
      candidateMap.set(member.id, {
        id: member.id,
        name: member.name,
        displayName: member.displayName,
        role: member.role,
        status: member.status,
        avatarUrl: member.avatarUrl,
        kind: 'user',
      });
    });

    if (activeConversationKind === 'dm' && activeDm) {
      const fallbackMentionId = activeDm.userId ?? activeDm.id;
      if (!candidateMap.has(fallbackMentionId)) {
        candidateMap.set(fallbackMentionId, {
          id: fallbackMentionId,
          name: activeDm.name,
          displayName: activeDm.name,
          role: activeDm.role ?? 'Direct message',
          status: activeDm.status,
          avatarUrl: activeDm.avatarUrl,
          kind: 'user',
        });
      }
    }

    activeRoomMessages
      .slice(-MENTION_CANDIDATE_RECENT_MESSAGE_LIMIT)
      .forEach((message) => {
        const fallbackCandidate = buildMentionCandidateFromMessage(message, presenceMap);
        if (!fallbackCandidate || candidateMap.has(fallbackCandidate.id)) return;

        candidateMap.set(fallbackCandidate.id, fallbackCandidate);
      });

    const currentMemberIds = new Set(candidateMap.keys());

    const memberMentionCandidates = Array.from(candidateMap.values())
      .map((candidate) => ({
        ...candidate,
        inCurrentConversation: currentMemberIds.has(candidate.id),
      }))
      .sort((left, right) => {
        if (left.inCurrentConversation !== right.inCurrentConversation) {
          return left.inCurrentConversation ? -1 : 1;
        }
        return left.name.localeCompare(right.name);
      });
    return [...specialMentionCandidates, ...memberMentionCandidates];
  }, [
    activeChannelMembers,
    activeConversationKind,
    activeDm,
    activeRoomMessages,
    presenceMap,
  ]);

  const mentionNameLookup = useMemo(
    () =>
      Array.from(
        new Set(
          mentionCandidates
            .flatMap((candidate) => [candidate.displayName, candidate.name])
            .filter((value): value is string => Boolean(value))
            .map((value) => value.trim())
            .filter((value) => value.length > 0),
        ),
      ),
    [mentionCandidates],
  );

  const activeChannelTabs = useMemo(() => {
    const roomId = activeChannel.id;
    if (!roomId) return defaultChannelTabs();

    const tabsFromState = channelTabsById[roomId];
    if (tabsFromState) return tabsFromState;

    const cachedTabs = roomTabsCacheRef.current?.[roomId];
    return cloneRoomTabs(cachedTabs ?? defaultChannelTabs());
  }, [activeChannel.id, channelTabsById]);
  const activeDirectMessageTabs = useMemo(() => {
    if (!activeRoomId || activeConversationKind === 'channel') {
      return defaultDirectMessageTabs();
    }

    const tabsFromState = directMessageTabsByRoomId[activeRoomId];
    if (tabsFromState) return tabsFromState;

    const cachedTabs = roomTabsCacheRef.current?.[activeRoomId];
    return cloneRoomTabs(cachedTabs ?? defaultDirectMessageTabs());
  }, [activeConversationKind, activeRoomId, directMessageTabsByRoomId]);

  useEffect(() => {
    if (!activeRoomId) return;
    const persistedTabs = activeRoomTabsData?.tabs;
    if (!persistedTabs || persistedTabs.length === 0) return;

    if (activeConversationKind === 'channel') {
      const mappedTabs = mapApiTabsToDetailTabs(persistedTabs, defaultChannelTabs());
      setChannelTabsById((previous) => {
        const currentTabs =
          previous[activeRoomId] ??
          roomTabsCacheRef.current?.[activeRoomId] ??
          defaultChannelTabs();
        if (areRoomTabsEqual(currentTabs, mappedTabs)) return previous;
        return {
          ...previous,
          [activeRoomId]: mappedTabs,
        };
      });
      persistRoomTabsCache(activeRoomId, mappedTabs);
      return;
    }

    const mappedTabs = mapApiTabsToDetailTabs(persistedTabs, defaultDirectMessageTabs());
    setDirectMessageTabsByRoomId((previous) => {
      const currentTabs =
        previous[activeRoomId] ??
        roomTabsCacheRef.current?.[activeRoomId] ??
        defaultDirectMessageTabs();
      if (areRoomTabsEqual(currentTabs, mappedTabs)) return previous;
      return {
        ...previous,
        [activeRoomId]: mappedTabs,
      };
    });
    persistRoomTabsCache(activeRoomId, mappedTabs);
  }, [activeConversationKind, activeRoomId, activeRoomTabsData?.tabs]);

  const availableHeaderTabs = useMemo(() => {
    const sourceTabs =
      activeConversationKind === 'channel' ? activeChannelTabs : activeDirectMessageTabs;

    return sourceTabs
      .filter((tab) => !tab.hidden && isConversationTab(tab.id))
      .map((tab) => tab.id as ConversationTab);
  }, [activeChannelTabs, activeConversationKind, activeDirectMessageTabs]);

  const forwardedAuthorLookupByMessageId = useMemo(() => {
    const lookup = new Map<string, string>();

    Object.values(messagesByConversation).forEach((conversationMessages) => {
      conversationMessages.forEach((conversationMessage) => {
        const directAuthor = conversationMessage.author?.trim();
        if (directAuthor && directAuthor !== 'Unknown user') {
          lookup.set(conversationMessage.id, directAuthor);
        }

        const forwardedMessage = conversationMessage.forwardedMessage;
        const forwardedAuthor = forwardedMessage?.originalAuthor?.trim();
        if (
          forwardedMessage?.originalMessageId &&
          forwardedAuthor &&
          forwardedAuthor !== 'Unknown user'
        ) {
          lookup.set(forwardedMessage.originalMessageId, forwardedAuthor);
        }
      });
    });

    cachedRoomMessages.forEach((rawMessage) => {
      const author = resolveRawMessageAuthor(rawMessage);
      if (author) {
        lookup.set(rawMessage.id, author);
      }
    });

    Object.entries(forwardedAuthorOverridesByMessageId).forEach(([messageId, author]) => {
      const normalizedAuthor = author.trim();
      if (!normalizedAuthor || normalizedAuthor === 'Unknown user') return;
      lookup.set(messageId, normalizedAuthor);
    });

    return lookup;
  }, [cachedRoomMessages, forwardedAuthorOverridesByMessageId, messagesByConversation]);
  const forwardedSourceMessageLookupByMessageId = useMemo(() => {
    const lookup = new Map<string, ForwardedSourceMessagePreview>();

    Object.values(messagesByConversation).forEach((conversationMessages) => {
      conversationMessages.forEach((conversationMessage) => {
        lookup.set(conversationMessage.id, {
          author: conversationMessage.author,
          content: conversationMessage.content,
          rawContent: conversationMessage.content,
          nestedForwardedContent: conversationMessage.forwardedMessage?.originalContent,
          forwardedOriginalMessageId:
            conversationMessage.forwardedMessage?.originalMessageId,
          contentFormat: conversationMessage.contentFormat,
          richContent: conversationMessage.richContent,
          sentAt: conversationMessage.sentAt,
          avatarUrl: conversationMessage.avatarUrl,
          isForwarded: Boolean(conversationMessage.forwardedMessage),
        });
      });
    });

    cachedRoomMessages.forEach((rawMessage) => {
      const previous = lookup.get(rawMessage.id);
      const resolvedForwardedSnapshot = resolveMergedForwardedSnapshot(rawMessage);
      const metadata = isRecord(rawMessage.metadata) ? rawMessage.metadata : undefined;
      const forwardedFromMessageId = toNonEmptyString(
        metadata?.['forwardedFromMessageId'],
      );
      const resolvedNestedForwardedContent =
        toNonEmptyString(resolvedForwardedSnapshot?.['originalContent']) ||
        (typeof resolvedForwardedSnapshot?.['originalContent'] === 'string'
          ? (resolvedForwardedSnapshot['originalContent'] as string)
          : null) ||
        previous?.nestedForwardedContent;
      const resolvedAuthor = resolveRawMessageAuthor(rawMessage) ?? previous?.author;
      const resolvedContent =
        buildForwardedDisplayContentPreview(
          rawMessage.content,
          resolvedNestedForwardedContent,
          { enableLegacyStrip: true },
        ) || previous?.content;

      lookup.set(rawMessage.id, {
        author: resolvedAuthor,
        content: resolvedContent,
        rawContent:
          rawMessage.content?.trim() || rawMessage.content || previous?.rawContent,
        nestedForwardedContent: resolvedNestedForwardedContent,
        forwardedOriginalMessageId:
          toNonEmptyString(resolvedForwardedSnapshot?.['originalMessageId']) ||
          forwardedFromMessageId ||
          previous?.forwardedOriginalMessageId,
        contentFormat: rawMessage.contentFormat ?? previous?.contentFormat,
        richContent: rawMessage.richContent ?? previous?.richContent,
        sentAt: rawMessage.sentAt ?? previous?.sentAt,
        avatarUrl: rawMessage.senderAvatarUrl ?? previous?.avatarUrl,
        isForwarded:
          Boolean(resolvedForwardedSnapshot) ||
          metadata?.source === 'forward' ||
          Boolean(forwardedFromMessageId) ||
          previous?.isForwarded,
      });
    });

    return lookup;
  }, [cachedRoomMessages, messagesByConversation]);
  const apiConversationMessages = useMemo(() => {
    const mappedMessages = activeRoomMessages.map((message) =>
      mapMessageToConversationMessage(message, {
        currentUserId,
        reactions: Array.isArray(message.reactionSummaries)
          ? message.reactionSummaries
          : reactionsByMessage[message.id],
        attachments: Array.isArray(message.attachments)
          ? message.attachments
          : attachmentsByMessage[message.id],
        isPinned: pinnedMessageIds.has(message.id),
        resolveForwardedAuthorByMessageId: (messageId) =>
          forwardedAuthorLookupByMessageId.get(messageId),
        resolveForwardedSourceMessageByMessageId: (messageId) =>
          forwardedSourceMessageLookupByMessageId.get(messageId),
        resolveForwardedRenderOverrideByMessageId: (messageId) =>
          forwardedRenderOverridesByMessageId[messageId],
      }),
    );

    return mappedMessages.sort(compareConversationMessagesBySentAt);
  }, [
    activeRoomMessages,
    attachmentsByMessage,
    currentUserId,
    forwardedAuthorLookupByMessageId,
    forwardedRenderOverridesByMessageId,
    forwardedSourceMessageLookupByMessageId,
    pinnedMessageIds,
    reactionsByMessage,
  ]);

  useEffect(() => {
    if (!activeConversationId) return;

    const frameId = window.requestAnimationFrame(() => {
      setMessagesByConversation((previous) => {
        const currentMessages = previous[activeConversationKey] ?? [];
        const remoteIds = new Set(apiConversationMessages.map((message) => message.id));
        const remoteClientMessageIds = new Set(
          apiConversationMessages
            .map((message) => message.clientMessageId?.trim())
            .filter((value): value is string => Boolean(value)),
        );
        const localOnlyMessages = currentMessages.filter((message) => {
          if (!message.id.startsWith('local-')) return false;
          if (remoteIds.has(message.id)) return false;
          const clientMessageId = message.clientMessageId?.trim();
          if (clientMessageId && remoteClientMessageIds.has(clientMessageId))
            return false;
          return true;
        });
        const nextMessages = [...apiConversationMessages, ...localOnlyMessages].sort(
          compareConversationMessagesBySentAt,
        );

        if (areConversationMessagesEqual(currentMessages, nextMessages)) {
          return previous;
        }

        return {
          ...previous,
          [activeConversationKey]: nextMessages,
        };
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeConversationId, activeConversationKey, apiConversationMessages]);

  const messages = useMemo(
    () => messagesByConversation[activeConversationKey] ?? [],
    [activeConversationKey, messagesByConversation],
  );
  const deleteDialogMessage = useMemo(
    () =>
      deleteMessageState
        ? (messages.find((message) => message.id === deleteMessageState.messageId) ??
          null)
        : null,
    [deleteMessageState, messages],
  );

  const pinnedConversationMessages = useMemo(
    () =>
      pinnedMessages.map((pinnedMessage) =>
        mapMessageToConversationMessage(pinnedMessage.message, {
          currentUserId,
          reactions: Array.isArray(pinnedMessage.message.reactionSummaries)
            ? pinnedMessage.message.reactionSummaries
            : reactionsByMessage[pinnedMessage.messageId],
          attachments: attachmentsByMessage[pinnedMessage.messageId],
          isPinned: true,
          resolveForwardedAuthorByMessageId: (messageId) =>
            forwardedAuthorLookupByMessageId.get(messageId),
          resolveForwardedSourceMessageByMessageId: (messageId) =>
            forwardedSourceMessageLookupByMessageId.get(messageId),
          resolveForwardedRenderOverrideByMessageId: (messageId) =>
            forwardedRenderOverridesByMessageId[messageId],
        }),
      ),
    [
      attachmentsByMessage,
      currentUserId,
      forwardedAuthorLookupByMessageId,
      forwardedRenderOverridesByMessageId,
      forwardedSourceMessageLookupByMessageId,
      pinnedMessages,
      reactionsByMessage,
    ],
  );
  const scopedNotifications = useMemo(
    () =>
      normalizeTeamChatNotificationList(notificationsQuery.data).filter((notification) =>
        matchesTeamChatNotificationOrganization(notification, serviceCtx.tenantId),
      ),
    [notificationsQuery.data, serviceCtx.tenantId],
  );
  const personalFeedRoomIds = useMemo(() => {
    const mentionRoomIds = (mentionsQuery.data ?? [])
      .map((mention) => mention.roomId.trim())
      .filter(Boolean);
    const notificationRoomIds = scopedNotifications
      .map((notification) =>
        typeof notification.data?.roomId === 'string'
          ? notification.data.roomId.trim()
          : '',
      )
      .filter(Boolean);
    const unreadSummaryRoomIds = unreadRoomSummaries
      .map((room) => room.roomId.trim())
      .filter(Boolean);

    return Array.from(
      new Set([...mentionRoomIds, ...notificationRoomIds, ...unreadSummaryRoomIds]),
    ).filter((roomId) => !roomSummaryById.has(roomId));
  }, [mentionsQuery.data, roomSummaryById, scopedNotifications, unreadRoomSummaries]);
  const personalFeedRoomDetailsQuery = useQuery({
    queryKey: [
      'team-chat',
      'personal-feed-room-details',
      serviceCtx.tenantId ?? 'global',
      personalFeedRoomIds,
    ],
    enabled: personalFeedRoomIds.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const detailEntries = await Promise.all(
        personalFeedRoomIds.map(async (roomId) => {
          try {
            const detail = await service.getRoomDetail(roomId, {
              includeMembers: false,
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
  const personalFeedRoomDetailsMap = useMemo(() => {
    const detailMap = new Map<
      string,
      Awaited<ReturnType<TeamChatService['getRoomDetail']>>
    >();
    Object.entries(personalFeedRoomDetailsQuery.data ?? {}).forEach(
      ([roomId, roomDetail]) => {
        if (roomDetail) {
          detailMap.set(roomId, roomDetail);
        }
      },
    );
    return detailMap;
  }, [personalFeedRoomDetailsQuery.data]);
  const personalReadOverrideIdSet = useMemo(
    () => new Set(personalReadOverrideIds),
    [personalReadOverrideIds],
  );

  const personalFeedItems = useMemo<PersonalFeedItem[]>(() => {
    const mentionFeeds: PersonalFeedItem[] = (mentionsQuery.data ?? []).map((mention) => {
      const mapped = mapMentionToPersonalFeedItem(mention);
      const roomSummary = roomSummaryById.get(mention.roomId);
      const roomDetail = personalFeedRoomDetailsMap.get(mention.roomId);
      const channelRoomType =
        roomSummary?.roomType ?? roomDetail?.roomType ?? mapped.channelRoomType;
      const resolvedChannelName =
        roomSummary?.name ??
        roomDetail?.name ??
        roomDetail?.roomKey ??
        (!isUuidLikeValue(mapped.channelName)
          ? mapped.channelName
          : resolveFallbackPersonalConversationLabel(channelRoomType));

      return {
        ...mapped,
        channelName: resolvedChannelName,
        channelRoomType,
        channelVisibility: roomSummary?.visibility ?? roomDetail?.visibility ?? 'private',
      };
    });
    const mentionFeedDedupKeys = new Set(
      mentionFeeds
        .map((item) => buildPersonalMentionFeedDedupKey(item))
        .filter((item): item is string => Boolean(item)),
    );
    const notificationFeeds = scopedNotifications
      .map((notification) => {
        const mapped = mapNotificationToPersonalFeedItem(notification);
        if (!mapped) {
          return null;
        }

        const roomSummary = roomSummaryById.get(mapped.channelId);
        const roomDetail = personalFeedRoomDetailsMap.get(mapped.channelId);
        const channelRoomType =
          roomSummary?.roomType ?? roomDetail?.roomType ?? mapped.channelRoomType;
        const resolvedChannelName =
          roomSummary?.name ??
          roomDetail?.name ??
          roomDetail?.roomKey ??
          (!isUuidLikeValue(mapped.channelName)
            ? mapped.channelName
            : resolveFallbackPersonalConversationLabel(channelRoomType));

        return {
          ...mapped,
          channelName: resolvedChannelName,
          channelRoomType,
          channelVisibility:
            roomSummary?.visibility ?? roomDetail?.visibility ?? mapped.channelVisibility,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .filter((item) => {
        const mentionDedupKey = buildPersonalMentionFeedDedupKey(item);
        return !mentionDedupKey || !mentionFeedDedupKeys.has(mentionDedupKey);
      });
    const roomsWithExplicitUnreadItems = new Set(
      [...mentionFeeds, ...notificationFeeds]
        .filter(
          (item) =>
            item.isUnread &&
            item.kind === 'unread' &&
            !item.channelId.startsWith('invitation:'),
        )
        .map((item) => item.channelId),
    );
    const unreadFallbackFeeds: PersonalFeedItem[] = unreadRoomSummaries
      .filter((room) => room.unreadCount > 0 && !roomsWithExplicitUnreadItems.has(room.roomId))
      .map((room) => {
        const roomSummary = roomSummaryById.get(room.roomId);
        const roomDetail = personalFeedRoomDetailsMap.get(room.roomId);
        const channelRoomType =
          roomSummary?.roomType ?? roomDetail?.roomType ?? room.roomType;
        const resolvedChannelName =
          roomSummary?.name ??
          roomDetail?.name ??
          roomDetail?.roomKey ??
          (!isUuidLikeValue(room.roomName)
            ? room.roomName
            : resolveFallbackPersonalConversationLabel(channelRoomType));
        const roomUnreadCount = Math.max(0, Math.trunc(room.unreadCount));
        const lastActivityAt =
          roomSummary?.lastMessageAt ??
          roomDetail?.lastMessageAt ??
          room.lastMessageAt ??
          null;
        const roomLastMessageSnippet =
          roomSummary?.lastMessageSnippet?.trim() ??
          roomDetail?.lastMessageSnippet?.trim() ??
          '';
        const fallbackPreview =
          roomUnreadCount > 1 ? `${roomUnreadCount} unread messages` : '1 unread message';

        return {
          id: `unread-room:${room.roomId}`,
          kind: 'unread',
          isUnread: true,
          occurredAt: lastActivityAt ?? undefined,
          isReadStateDerived: true,
          unreadMessageCount: roomUnreadCount,
          channelId: room.roomId,
          channelName: resolvedChannelName,
          channelRoomType,
          channelVisibility:
            roomSummary?.visibility ?? roomDetail?.visibility ?? 'private',
          actor: resolvedChannelName,
          time: formatPersonalFeedTimeLabel(lastActivityAt),
          dateLabel: formatPersonalFeedDateLabel(lastActivityAt),
          context:
            roomUnreadCount > 1 ? `${roomUnreadCount} unread messages` : 'Unread message',
          preview: roomLastMessageSnippet || fallbackPreview,
          detailContent: roomLastMessageSnippet || fallbackPreview,
        };
      });

    const mergedFeeds = [...mentionFeeds, ...notificationFeeds, ...unreadFallbackFeeds];
    const seenFeedIds = new Set<string>();

    return sortPersonalFeedItemsByNewest(
      mergedFeeds
        .filter((item) => {
          if (seenFeedIds.has(item.id)) return false;
          seenFeedIds.add(item.id);
          return true;
        })
        .map((item) =>
          item.isUnread &&
          !item.isReadStateDerived &&
          personalReadOverrideIdSet.has(item.id)
            ? { ...item, isUnread: false }
            : item,
        ),
    );
  }, [
    mentionsQuery.data,
    personalFeedRoomDetailsMap,
    personalReadOverrideIdSet,
    roomSummaryById,
    scopedNotifications,
    unreadRoomSummaries,
  ]);
  const unreadPersonalFeeds = useMemo<PersonalFeedItem[]>(() => {
    // Canonical source for Unread tab is room unread summary (room-card semantics).
    const unreadRoomCards = unreadRoomSummaries
      .filter((room) => room.unreadCount > 0)
      .map((room) => {
        const roomSummary = roomSummaryById.get(room.roomId);
        const roomDetail = personalFeedRoomDetailsMap.get(room.roomId);
        const channelRoomType =
          roomSummary?.roomType ?? roomDetail?.roomType ?? room.roomType;
        const resolvedChannelName =
          roomSummary?.name ??
          roomDetail?.name ??
          roomDetail?.roomKey ??
          (!isUuidLikeValue(room.roomName)
            ? room.roomName
            : resolveFallbackPersonalConversationLabel(channelRoomType));
        const roomUnreadCount = Math.max(0, Math.trunc(room.unreadCount));
        const lastActivityAt =
          roomSummary?.lastMessageAt ??
          roomDetail?.lastMessageAt ??
          room.lastMessageAt ??
          null;
        const roomLastMessageSnippet =
          roomSummary?.lastMessageSnippet?.trim() ??
          roomDetail?.lastMessageSnippet?.trim() ??
          '';
        const fallbackPreview =
          roomUnreadCount > 1 ? `${roomUnreadCount} unread messages` : '1 unread message';

        return {
          id: `unread-room:${room.roomId}`,
          kind: 'unread' as const,
          isUnread: true,
          occurredAt: lastActivityAt ?? undefined,
          isReadStateDerived: true,
          unreadMessageCount: roomUnreadCount,
          channelId: room.roomId,
          channelName: resolvedChannelName,
          channelRoomType,
          channelVisibility:
            roomSummary?.visibility ?? roomDetail?.visibility ?? 'private',
          actor: resolvedChannelName,
          actorAvatarUrl: undefined,
          time: formatPersonalFeedTimeLabel(lastActivityAt),
          dateLabel: formatPersonalFeedDateLabel(lastActivityAt),
          context: 'Latest activity',
          preview: roomLastMessageSnippet || fallbackPreview,
          detailContent: roomLastMessageSnippet || fallbackPreview,
        } satisfies PersonalFeedItem;
      });

    return sortPersonalFeedItemsByNewest(unreadRoomCards);
  }, [personalFeedRoomDetailsMap, roomSummaryById, unreadRoomSummaries]);
  const unreadSummaryAggregates = useMemo(() => {
    const unreadSummary = unreadSummaryQuery.data;
    if (!unreadSummary) return null;
    return buildUnreadSummaryAggregates(unreadSummary, unreadSummary.aggregates);
  }, [unreadSummaryQuery.data]);
  const personalFeedItemsRef = useRef<PersonalFeedItem[]>(personalFeedItems);
  useEffect(() => {
    personalFeedItemsRef.current = personalFeedItems;
  }, [personalFeedItems]);

  const personalUnreadCounts = useMemo<
    Record<'mentions' | 'threads' | 'reactions' | 'unread', number>
  >(() => {
    const counts = {
      mentions: 0,
      threads: 0,
      reactions: 0,
      unread: 0,
    };

    personalFeedItems.forEach((item) => {
      if (!item.isUnread) return;
      if (item.kind !== 'unread') {
        counts[item.kind] += 1;
      }
      counts.unread += 1;
    });

    counts.unread =
      unreadSummaryAggregates?.myInboxUnreadItemCount ?? unreadPersonalFeeds.length;

    return counts;
  }, [personalFeedItems, unreadPersonalFeeds, unreadSummaryAggregates]);
  const unreadRoomIds = useMemo(
    () =>
      Array.from(unreadCountMap.entries())
        .filter(([, unreadCount]) => unreadCount > 0)
        .map(([roomId]) => roomId),
    [unreadCountMap],
  );

  const personalFeeds = useMemo<PersonalFeedItem[]>(() => {
    if (personalFilter === 'unread') {
      return unreadPersonalFeeds;
    }
    return personalFeedItems.filter((item) => item.kind === personalFilter);
  }, [personalFeedItems, personalFilter, unreadPersonalFeeds]);

  const derivedSelectedPersonalFeedId = useMemo(() => {
    if (personalFeeds.length === 0) return null;
    if (
      selectedPersonalFeedId &&
      personalFeeds.some((item) => item.id === selectedPersonalFeedId)
    ) {
      return selectedPersonalFeedId;
    }
    return personalFeeds[0].id;
  }, [personalFeeds, selectedPersonalFeedId]);

  const selectedPersonalFeed = useMemo(
    () => personalFeeds.find((item) => item.id === derivedSelectedPersonalFeedId) ?? null,
    [derivedSelectedPersonalFeedId, personalFeeds],
  );

  const roomAttachmentItems = useMemo(
    () => extractRoomAttachmentItems(roomAttachmentsQuery.data),
    [roomAttachmentsQuery.data],
  );
  const roomPhotoAttachmentItems = useMemo(
    () => extractRoomAttachmentItems(roomPhotosQuery.data),
    [roomPhotosQuery.data],
  );

  const filteredFiles = useMemo(() => {
    const sharedFiles = buildTeamChatSharedFiles({
      roomAttachments: roomAttachmentItems,
      messages,
    });
    if (!deferredFilesSearch.trim()) return sharedFiles;

    const normalizedQuery = deferredFilesSearch.trim().toLowerCase();
    return sharedFiles.filter((file) =>
      `${file.name} ${file.sharedBy} ${file.kind}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [deferredFilesSearch, messages, roomAttachmentItems]);

  const groupedPhotos = useMemo(() => {
    return buildTeamChatGroupedPhotos({
      roomAttachments: roomPhotoAttachmentItems,
      messages,
    });
  }, [messages, roomPhotoAttachmentItems]);

  const searchResults = useMemo(() => {
    if (!deferredMessageSearch.trim()) return [];
    return messageSearchItems.slice(0, 20).map(mapSearchResultToConversationMessage);
  }, [deferredMessageSearch, messageSearchItems]);
  const searchLoading = useMemo(() => {
    if (!deferredMessageSearch.trim()) return false;
    const rawQuery = messageSearchQuery.raw as { isFetching?: boolean } | undefined;
    return messageSearchQuery.isPending || Boolean(rawQuery?.isFetching);
  }, [deferredMessageSearch, messageSearchQuery.isPending, messageSearchQuery.raw]);

  const groupDmRoomLookup = useMemo(
    () => new Map(groupDmRooms.map((room) => [room.roomId, room] as const)),
    [groupDmRooms],
  );
  const starredItems = useMemo(() => {
    return starredRoomSummaries.reduce<StarredConversationItem[]>((items, room) => {
      if (room.roomType === 'channel') {
        const channel = mapRoomToWorkspaceChannel(room, unreadCountMap);
        items.push({
          key: buildConversationKey('channel', room.id),
          kind: 'channel',
          id: room.id,
          name: channel.name,
          subtitle: channel.lastMessageSnippet,
          unread: channel.unread,
          visibility: channel.visibility,
        });
        return items;
      }

      if (room.roomType === 'group_dm') {
        const groupConversation =
          groupDmRoomLookup.get(room.id) ??
          mapRoomToGroupDirectMessageConversation(room, {
            currentUserId,
            unreadCountMap,
          });

        items.push({
          key: buildConversationKey('group_dm', room.id),
          kind: 'group_dm',
          id: room.id,
          name: groupConversation.name,
          subtitle:
            groupConversation.lastMessageSnippet ||
            (groupConversation.memberCount > 0
              ? `${groupConversation.memberCount} members`
              : undefined),
          unread: groupConversation.unread ?? unreadCountMap.get(room.id) ?? 0,
          visibility: 'private',
          memberPreview: groupConversation.memberPreview,
          memberPreviewOverflowCount: groupConversation.memberPreviewOverflowCount,
        });
        return items;
      }

      const matchedContact = dmContacts.find(
        (contact) => contact.roomId === room.id || contact.id === room.id,
      );

      items.push({
        key: buildConversationKey(
          'dm',
          matchedContact?.roomId ?? matchedContact?.id ?? room.id,
        ),
        kind: 'dm',
        id: matchedContact?.roomId ?? matchedContact?.id ?? room.id,
        name: matchedContact?.name || room.name || 'Direct message',
        subtitle: matchedContact?.lastMessageSnippet || matchedContact?.role,
        unread: matchedContact?.unread ?? unreadCountMap.get(room.id) ?? 0,
        avatarUrl: matchedContact?.avatarUrl,
        status: matchedContact?.status,
      });
      return items;
    }, []);
  }, [
    currentUserId,
    dmContacts,
    groupDmRoomLookup,
    starredRoomSummaries,
    unreadCountMap,
  ]);
  const starredChannelIds = useMemo(
    () =>
      new Set(
        starredItems.filter((item) => item.kind === 'channel').map((item) => item.id),
      ),
    [starredItems],
  );
  const starredGroupDmIds = useMemo(
    () =>
      new Set(
        starredItems.filter((item) => item.kind === 'group_dm').map((item) => item.id),
      ),
    [starredItems],
  );
  const sidebarChannels = useMemo(
    () => workspaceChannels.filter((channel) => !starredChannelIds.has(channel.id)),
    [starredChannelIds, workspaceChannels],
  );
  const sidebarGroupDmRooms = useMemo(
    () => groupDmRooms.filter((room) => !starredGroupDmIds.has(room.id)),
    [groupDmRooms, starredGroupDmIds],
  );

  const activeConversationDisplay: ActiveConversationDisplay =
    activeConversationKind === 'channel'
      ? {
          title: activeRoomDetail?.name ?? activeChannel.name,
          subtitle: activeRoomDetail?.topic ?? activeChannel.topic ?? 'Channel conversation',
          unread: activeChannel.unread ?? 0,
          visibility: activeChannel.visibility,
          memberCount: activeRoomDetail?.memberCount ?? activeChannel.memberCount ?? 0,
          avatarUrl: undefined,
          status: undefined,
        }
      : activeConversationKind === 'group_dm'
        ? {
            title: activeRoomDetail?.name ?? activeGroupDm?.name ?? 'Group chat',
            subtitle:
              activeRoomDetail?.topic ??
              activeGroupDm?.topic ??
              `${activeRoomDetail?.memberCount ?? activeGroupDm?.memberCount ?? 0} members`,
            unread: activeGroupDm?.unread ?? unreadCountMap.get(activeRoomId) ?? 0,
            visibility: 'private',
            memberCount: activeRoomDetail?.memberCount ?? activeGroupDm?.memberCount ?? 0,
            avatarUrl: undefined,
            status: undefined,
          }
        : {
            title: activeDm?.name ?? 'Direct Message',
            subtitle: activeDm?.role ?? 'Direct message',
            unread: activeDm?.unread ?? 0,
            visibility: 'private',
            memberCount: activeRoomDetail?.memberCount ?? 2,
            avatarUrl: activeDm?.avatarUrl,
            status: activeDm?.status,
          };

  const activeConversationRoom = useMemo<WorkspaceChannel>(
    () =>
      activeConversationKind === 'channel'
        ? activeChannel
        : {
            id: activeRoomId,
            name: activeConversationDisplay.title,
            unread: activeConversationDisplay.unread,
            visibility: 'private',
            memberCount: activeConversationDisplay.memberCount,
            topic: activeConversationDisplay.subtitle,
          },
    [
      activeChannel,
      activeConversationDisplay.memberCount,
      activeConversationDisplay.subtitle,
      activeConversationDisplay.title,
      activeConversationDisplay.unread,
      activeConversationKind,
      activeRoomId,
    ],
  );
  const activeConversationIsManualUnread = Boolean(
    activeRoomId && manualUnreadRoomIds.includes(activeRoomId),
  );

  const activeTypingSummary = useMemo(
    () => buildTypingSummary(activeTypingNames),
    [activeTypingNames],
  );

  const activeConversationPlaceholder =
    activeConversationKind === 'channel'
      ? `Message ${activeChannel.visibility === 'private' ? activeChannel.name : `#${activeChannel.name}`}`
      : `Message ${activeConversationDisplay.title}`;
  const activeComposerScheduledSessionId =
    activeView === 'channel' && activeComposerDraftContext?.roomId
      ? resolveComposerScheduledEditId()
      : null;
  const resolveScheduleTimezone = () =>
    Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_SCHEDULE_TIMEZONE;
  const {
    draftsHubQuery,
    scheduledMessagesQuery,
    draftRecords,
    scheduledRecords,
    draftItems,
    scheduledDraftItems,
    draftHubCounts,
    draftsHubLoading,
    scheduledHubLoading,
    sidebarDraftIndicators,
  } = useTeamChatDraftHub({
    draftsLimit: DRAFTS_HUB_PAGE_LIMIT,
    scheduledLimit: SCHEDULED_MESSAGES_PAGE_LIMIT,
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
    activeConversationTitle: activeConversationDisplay.title,
    activeConversationAvatarUrl: activeConversationDisplay.avatarUrl,
    activeChannelVisibility: activeChannel.visibility,
    activeComposerDraftRoomId: activeComposerDraftContext?.roomId,
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
  });
  const { queueStoredComposerDraftHydration, queueExplicitComposerDraftHydration } =
    useTeamChatCurrentDraftSync({
      activeView,
      activeRoomId,
      activeConversationKey,
      activeComposerDraftContext,
      activeComposerDraftContextKey,
      activeCurrentDraftSnapshot,
      activeCurrentDraftFetchStatus,
      hydratedComposerDraftContextKey,
      shouldPauseStandaloneActiveRoomQueries,
      activeRoomBootstrapData,
      pendingComposerDraftHydration,
      messagesByConversation,
      draftRecords,
      scheduledRecords,
      queryClient,
      service,
      composerDraftContextKeyRef,
      composerDraftValueRef,
      composerDraftPayloadRef,
      composerDraftSeedValueRef,
      composerDraftSeedPayloadRef,
      composerDraftSessionByContextRef,
      composerDraftPayloadSessionByContextRef,
      composerScheduledEditSessionByContextRef,
      fetchedComposerDraftContextKeysRef,
      activeCurrentDraftRequestIdRef,
      setComposerState,
      setComposerResetKey,
      setComposerDraftSeedValue,
      setComposerDraftSeedPayload,
      setComposerHasImmediateDraftText,
      setComposerDraftDirty,
      setHydratedComposerDraftContextKey,
      setActiveCurrentDraftSnapshot,
      setActiveCurrentDraftFetchStatus,
      setPendingComposerDraftHydration,
      setActiveComposerScheduledEditId,
      setComposerDraftSessionValue,
      clearComposerDraftSessionValue,
      setComposerDraftPayloadSessionValue,
      clearComposerDraftPayloadSessionValue,
      setComposerScheduledEditSessionValue,
    });
  const {
    syncScheduledHubCacheRecord,
    queueActiveComposerDraftSync,
    resetComposerLikeState,
    clearDraftComposerStateForContext,
    clearCurrentComposerDraft,
  } = useTeamChatComposerDraftPersistence({
    activeView,
    activeComposerDraftContext,
    activeComposerDraftContextKey,
    scheduledRecords,
    queryClient,
    composerDraftContextKeyRef,
    composerDraftValueRef,
    composerDraftPayloadRef,
    composerDraftSeedValueRef,
    composerDraftSeedPayloadRef,
    composerDraftPayloadSessionByContextRef,
    fetchedComposerDraftContextKeysRef,
    activeCurrentDraftSnapshotRef,
    setComposerState,
    setInlineEditState,
    setForwardState,
    setComposerAttachments,
    setComposerDraftSeedValue,
    setComposerDraftSeedPayload,
    setActiveCurrentDraftSnapshot,
    setComposerHasImmediateDraftText,
    setComposerDraftDirty,
    setHydratedComposerDraftContextKey,
    setActiveComposerScheduledEditId,
    setPendingComposerDraftHydration,
    setComposerResetKey,
    setScheduledExtraRecords,
    setComposerDraftSessionValue,
    clearComposerDraftSessionValue,
    setComposerDraftPayloadSessionValue,
    clearComposerDraftPayloadSessionValue,
    setComposerScheduledEditSessionValue,
    clearComposerScheduledEditSessionValue,
    resolveComposerScheduledEditId,
    resolveScheduleTimezone,
    updateCurrentDraft: updateCurrentDraftMutation.mutateAsync,
    updateScheduledMessage: updateScheduledMessageMutation.mutateAsync,
  });

  const activeConversationStarred = useMemo(() => {
    if (!activeRoomId) return false;
    return Boolean(
      activeRoomSummary?.isStarred ||
      starredRoomSummaries.some((room) => room.id === activeRoomId && room.isStarred),
    );
  }, [activeRoomId, activeRoomSummary?.isStarred, starredRoomSummaries]);
  const isPersonalView = activeView === 'personal';
  const isDraftsView = activeView === 'drafts';
  const activeComposerScheduledNotice =
    activeView === 'channel' &&
    activeRoomId &&
    composerScheduledNotice?.roomId === activeRoomId
      ? {
          label: `Your message will be sent on ${formatScheduledComposerNoticeLabel(
            composerScheduledNotice.scheduledForIso,
          )}.`,
          ctaLabel: 'See all scheduled messages',
        }
      : null;
  useEffect(() => {
    if (!scheduledRecords.length) return;
    if (!activeRoomId && activeView !== 'drafts') return;

    const relevantScheduledRecords = scheduledRecords.filter((scheduledRecord) =>
      activeView === 'drafts' ? true : scheduledRecord.roomId === activeRoomId,
    );
    if (!relevantScheduledRecords.length) return;

    const now = Date.now();
    const hasDueSoon = relevantScheduledRecords.some((scheduledRecord) => {
      const scheduledAt = new Date(scheduledRecord.scheduledForUtc).getTime();
      if (!Number.isFinite(scheduledAt)) return true;
      return scheduledAt - now <= 120_000;
    });
    if (!hasDueSoon) return;

    const reconcileScheduledDispatch = () => {
      void queryClient.invalidateQueries({
        queryKey: teamChatQueryKeys.scheduledMessagesRoot(),
      });
      void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.rooms() });
      void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.unreadSummary() });
      if (activeRoomId) {
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.messageCursorRoot(activeRoomId),
        });
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.roomDetail(activeRoomId),
        });
      }
    };

    reconcileScheduledDispatch();
    const intervalId = window.setInterval(reconcileScheduledDispatch, 6_000);

    return () => window.clearInterval(intervalId);
  }, [activeRoomId, activeView, queryClient, scheduledRecords]);
  useEffect(() => {
    if (activeView !== 'channel') return;
    if (scheduledMessagesQuery.status !== 'success') return;
    if (!activeComposerDraftContext?.roomId) return;
    const activeContextScheduledEditId = resolveComposerScheduledEditId(
      activeComposerDraftContextKey,
    );
    if (!activeContextScheduledEditId) return;

    const hasMatchingScheduledRecord = scheduledRecords.some(
      (scheduledRecord) => scheduledRecord.id === activeContextScheduledEditId,
    );
    if (hasMatchingScheduledRecord) return;

    clearDraftComposerStateForContext(activeComposerDraftContext);
    setComposerScheduledNotice(null);
  }, [
    activeComposerDraftContext,
    activeComposerDraftContextKey,
    activeView,
    clearDraftComposerStateForContext,
    resolveComposerScheduledEditId,
    scheduledMessagesQuery.status,
    scheduledRecords,
    setComposerScheduledNotice,
  ]);

  const activeChannelDetails = useMemo(() => {
    const roomKey = activeRoomDetail?.roomKey ?? activeRoomSummary?.roomKey ?? null;
    const myRole =
      myRoomMembership?.memberRole ??
      activeRoomDetail?.myRole ??
      activeRoomSummary?.myRole;
    const basePermissions =
      activeRoomDetail?.myPermissions ?? activeRoomSummary?.myPermissions;
    const effectiveCanSendMessage = resolveEffectiveCanSendMessage({
      roomKey,
      memberRole: myRole,
      canSendMessage: basePermissions?.canSendMessage,
    });
    const mergedPermissions: {
      canSendMessage?: boolean;
      canView?: boolean;
      canInviteMembers?: boolean;
      canManageMembers?: boolean;
      canPinMessages?: boolean;
      canJoin?: boolean;
      canLeave?: boolean;
      canChangeVisibilityToPublic?: boolean;
      canChangeVisibilityToPrivate?: boolean;
    } = basePermissions
      ? {
          ...basePermissions,
          canSendMessage: effectiveCanSendMessage,
        }
      : { canSendMessage: effectiveCanSendMessage };

    return {
      roomId: activeRoomId,
      roomKey: roomKey ?? undefined,
      visibility:
        activeRoomDetail?.visibility ?? activeRoomSummary?.visibility ?? 'private',
      topic: activeRoomDetail?.topic ?? activeConversationRoom.topic ?? '',
      description: activeRoomDetail?.description ?? '',
      createdBy: activeRoomDetail?.createdBy ?? '',
      createdByDisplayName:
        activeRoomDetail?.createdByDisplayName ??
        activeRoomSummary?.createdByDisplayName ??
        '',
      createdAt: activeRoomDetail?.createdAt
        ? new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }).format(new Date(activeRoomDetail.createdAt))
        : '',
      myUserId: currentUserId ?? '',
      members: activeChannelMembers,
      notificationPreference: mapNotifyLevelToPreference(
        myRoomMembership?.notifyLevel ?? activeRoomSummary?.myNotifyLevel,
      ),
      myRole,
      myPermissions: mergedPermissions,
      viewerState: activeRoomDetail?.viewerState ?? activeRoomSummary?.viewerState,
      visibilityUpdating: updateChannelVisibilityMutation.isPending,
      isArchived: activeRoomDetail?.isArchived ?? activeRoomSummary?.isArchived ?? false,
      canUnarchive: activeRoomDetail?.canUnarchive ?? activeRoomSummary?.canUnarchive,
      allowMemberPinMessages:
        activeRoomDetail?.allowMemberPinMessages ??
        activeRoomSummary?.allowMemberPinMessages ??
        false,
      allowGuestPinMessages:
        activeRoomDetail?.allowGuestPinMessages ??
        activeRoomSummary?.allowGuestPinMessages ??
        false,
    };
  }, [
    activeConversationRoom.topic,
    activeChannelMembers,
    activeRoomDetail,
    activeRoomId,
    activeRoomSummary,
    myRoomMembership?.memberRole,
    myRoomMembership?.notifyLevel,
    updateChannelVisibilityMutation.isPending,
  ]);
  const canManageActiveChannelTabs =
    activeChannelDetails.myRole === 'owner' || activeChannelDetails.myRole === 'admin';
  const canSendActiveConversationMessage =
    activeChannelDetails.myPermissions?.canSendMessage ?? true;
  const canForwardActiveConversationMessage =
    activeChannelDetails.myPermissions?.canView ?? true;
  const activeConversationReadOnlyVariant =
    !canSendActiveConversationMessage &&
    isCompanyAnnouncementsReadOnlyForRole(
      activeChannelDetails.roomKey,
      activeChannelDetails.myRole,
    )
      ? 'announcements'
      : 'default';
  const canPinActiveConversationMessages =
    activeChannelDetails.myPermissions?.canPinMessages ?? true;
  const notifyCannotSendMessage = () => {
    toast.warning(
      activeConversationReadOnlyVariant === 'announcements'
        ? 'Only organization owners and admins can post in company-announcements.'
        : 'You do not have permission to send messages here.',
    );
  };
  const notifyCannotForwardMessage = () => {
    toast.warning('You do not have permission to forward messages here.');
  };
  const notifyCannotPinMessage = () => {
    toast.warning('You do not have permission to pin messages in this room.');
  };

  const forwardTargets = useMemo<ForwardTarget[]>(
    () => [
      ...workspaceChannels.map((channel) => ({
        key: buildConversationKey('channel', channel.id),
        kind: 'channel' as const,
        id: channel.id,
        title: channel.name,
        subtitle: channel.topic ?? 'Channel conversation',
        visibility: channel.visibility,
      })),
      ...groupDmRooms.map((room) => ({
        key: buildConversationKey('group_dm', room.roomId),
        kind: 'group_dm' as const,
        id: room.roomId,
        title: room.name,
        subtitle: room.topic ?? `${room.memberCount} members`,
        visibility: 'private' as const,
      })),
      ...dmContacts
        .filter((contact) => Boolean(contact.roomId) || contact.source === 'room')
        .map((contact) => ({
          key: buildConversationKey('dm', contact.roomId ?? contact.id),
          kind: 'dm' as const,
          id: contact.roomId ?? contact.id,
          title: contact.name,
          subtitle: contact.role ?? 'Direct message',
          status: contact.status,
          avatarUrl: contact.avatarUrl,
        })),
    ],
    [dmContacts, groupDmRooms, workspaceChannels],
  );
  const forwardTargetLookup = useMemo(
    () => new Map(forwardTargets.map((target) => [target.key, target] as const)),
    [forwardTargets],
  );

  useEffect(() => {
    if (!openSections.archived) return;

    const syncArchivedRoomCollections = () => {
      void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.rooms() });
      void queryClient.invalidateQueries({
        queryKey: teamChatQueryKeys.discoverRoomsRoot(),
      });
    };

    syncArchivedRoomCollections();
    const syncTimer = window.setInterval(syncArchivedRoomCollections, 5_000);

    return () => {
      window.clearInterval(syncTimer);
    };
  }, [openSections.archived, queryClient]);

  useEffect(() => {
    if (!highlightedMessageId) return;

    const timer = window.setTimeout(() => {
      setHighlightedMessageId(null);
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [highlightedMessageId]);

  useEffect(() => {
    if (activeView !== 'channel') return;
    if (!activeRoomId || activeRoomMessages.length === 0) return;
    if ((unreadCountMap.get(activeRoomId) ?? 0) <= 0) return;
    if (manualUnreadRoomIdsRef.current.has(activeRoomId)) return;

    const lastMessageId = activeRoomMessages[activeRoomMessages.length - 1]?.id;
    if (!lastMessageId) return;
    if (readStateSyncRef.current[activeRoomId] === lastMessageId) return;

    readStateSyncRef.current[activeRoomId] = lastMessageId;

    void (async () => {
      const result = await updateReadStateMutation.mutateAsync({
        roomId: activeRoomId,
        body: { mode: 'mark_read', lastReadMessageId: lastMessageId },
      });

      if (!result.ok) {
        delete readStateSyncRef.current[activeRoomId];
        return;
      }
      syncManualUnreadRoomState({
        roomId: activeRoomId,
        isManualUnreadByUser: result.data?.isManualUnreadByUser ?? false,
        manualUnreadAt: result.data?.manualUnreadAt,
        manualUnreadFromMessageId: result.data?.manualUnreadFromMessageId,
      });
    })();
  }, [
    activeRoomId,
    activeRoomMessages,
    activeView,
    unreadCountMap,
    syncManualUnreadRoomState,
    updateReadStateMutation,
  ]);

  function updateConversationMessages(
    conversationKey: ConversationKey,
    updater: (currentMessages: ConversationMessage[]) => ConversationMessage[],
  ) {
    setMessagesByConversation((previous) => ({
      ...previous,
      [conversationKey]: updater(previous[conversationKey] ?? []),
    }));
  }

  const mergeRealtimeRoomMessage = (
    currentMessage: TeamChatRoomMessageResponse,
    nextMessage: TeamChatRoomMessageResponse,
  ): TeamChatRoomMessageResponse => mergeRoomHistoryMessage(currentMessage, nextMessage);

  function mapRoomMessageToConversationStreamMessage(
    message: TeamChatRoomMessageResponse,
  ): ConversationMessage {
    return mapMessageToConversationMessage(message, {
      currentUserId,
      reactions: Array.isArray(message.reactionSummaries)
        ? message.reactionSummaries
        : reactionsByMessage[message.id],
      attachments: Array.isArray(message.attachments)
        ? message.attachments
        : attachmentsByMessage[message.id],
      isPinned: pinnedMessageIds.has(message.id),
      resolveForwardedAuthorByMessageId: (messageId) =>
        forwardedAuthorLookupByMessageId.get(messageId),
      resolveForwardedSourceMessageByMessageId: (messageId) =>
        forwardedSourceMessageLookupByMessageId.get(messageId),
      resolveForwardedRenderOverrideByMessageId: (messageId) =>
        forwardedRenderOverridesByMessageId[messageId],
    });
  }

  const upsertActiveConversationMessage = (
    roomId: string,
    nextMessage: TeamChatRoomMessageResponse,
  ) => {
    if (!activeRoomId || roomId !== activeRoomId) return;

    const existingRoomMessage = activeRoomMessages.find(
      (message) =>
        message.id === nextMessage.id ||
        (Boolean(nextMessage.clientMessageId) &&
          message.clientMessageId === nextMessage.clientMessageId),
    );
    const mappedMessage = mapRoomMessageToConversationStreamMessage(
      existingRoomMessage
        ? mergeRoomHistoryMessage(existingRoomMessage, nextMessage)
        : nextMessage,
    );
    updateConversationMessages(activeConversationKey, (currentMessages) => {
      const nextMessages = [
        ...currentMessages.filter(
          (message) =>
            message.id !== mappedMessage.id &&
            (!mappedMessage.clientMessageId ||
              message.clientMessageId !== mappedMessage.clientMessageId),
        ),
        mappedMessage,
      ].sort(compareConversationMessagesBySentAt);

      return areConversationMessagesEqual(currentMessages, nextMessages)
        ? currentMessages
        : nextMessages;
    });
  };

  const markActiveConversationMessageDeleted = (roomId: string, messageId: string) => {
    if (!activeRoomId || roomId !== activeRoomId) return;

    updateConversationMessages(activeConversationKey, (currentMessages) => {
      let hasChanged = false;
      const nextMessages = currentMessages.map((message) => {
        if (message.id !== messageId) return message;
        hasChanged = true;
        return {
          ...message,
          isDeleted: true,
          content: 'This message was deleted.',
          reactions: undefined,
          attachments: undefined,
          imagePreview: undefined,
          quote: undefined,
          forwardedMessage: undefined,
          linkPreviews: [],
          linkPreview: undefined,
          linkPreviewStatus: undefined,
          linkPreviewPendingUrls: [],
          linkPreviewFailedUrls: [],
          linkPreviewVersion: undefined,
          isAttachmentPlaceholder: false,
        };
      });

      return hasChanged ? nextMessages : currentMessages;
    });
  };

  const openDraftsAndScheduledView = (tab: DraftHubTab = 'drafts') => {
    queueActiveComposerDraftSync();
    setDraftHubActiveTab(tab);
    setActiveView('drafts');
  };

  const openDraftHubTab = (tab: DraftHubTab) => {
    if (activeView === 'drafts') {
      setDraftHubActiveTab(tab);
      return;
    }

    openDraftsAndScheduledView(tab);
  };

  const openBrowseChannels = (roomId?: string) => {
    const normalizedRoomId = roomId?.trim() ?? '';
    queueActiveComposerDraftSync();
    resetComposerLikeState();
    setSearchOpen(false);
    setMessageSearch('');
    setFilesSearch('');
    setHighlightedMessageId(null);
    setOpenSections((previous) => ({
      ...previous,
      channels: true,
    }));

    if (normalizedRoomId) {
      setBrowseSearch('');
      setBrowseSortBy('recent');
      setBrowseCursor(null);
      setBrowseNextCursor(null);
      setBrowseChannels([]);
      setBrowseSelectedChannelId(normalizedRoomId);
    }

    setActiveView('browse');
  };
  const handleSelectBrowseChannel = (roomId: string) => {
    const normalizedRoomId = roomId.trim();
    if (!normalizedRoomId) return;
    setBrowseSelectedChannelId(normalizedRoomId);
  };

  const handleLoadMoreBrowseChannels = () => {
    if (!browseNextCursor || browseLoadingMore || browseRoomsPending) return;
    setBrowseLoadingMore(true);
    setBrowseCursor(browseNextCursor);
  };
  const markRoomReadImmediately = (roomId: string) => {
    if (!roomId) return;
    const hasUnreadCount = (unreadCountMap.get(roomId) ?? 0) > 0;
    const hasManualUnread = manualUnreadRoomIdsRef.current.has(roomId);
    if (!hasUnreadCount && !hasManualUnread) return;

    const historyItems = messageHistoryByRoomId[roomId]?.items ?? [];
    const cursorItems =
      queryClient.getQueryData<TeamChatMessageCursorResponse>(
        teamChatQueryKeys.messageCursor(roomId, activeRoomMessageCursorParams),
      )?.items ?? [];
    const sourceItems = historyItems.length > 0 ? historyItems : cursorItems;
    const lastMessageId = sourceItems[sourceItems.length - 1]?.id;
    if (lastMessageId && readStateSyncRef.current[roomId] === lastMessageId && !hasManualUnread) {
      return;
    }

    if (lastMessageId) {
      readStateSyncRef.current[roomId] = lastMessageId;
    }

    syncManualUnreadRoomState({
      roomId,
      isManualUnreadByUser: false,
      manualUnreadAt: null,
      manualUnreadFromMessageId: null,
    });
    syncUnreadSummaryCache(queryClient, {
      roomId,
      userId: currentUserId ?? '',
      unreadCount: 0,
      lastReadMessageId: lastMessageId ?? null,
      lastReadAt: formatISO(new Date()),
    });

    void (async () => {
      const result = await updateReadStateMutation.mutateAsync({
        roomId,
        body: lastMessageId
          ? { mode: 'mark_read', lastReadMessageId: lastMessageId }
          : { mode: 'mark_read' },
      });

      if (!result.ok) {
        if (lastMessageId) {
          delete readStateSyncRef.current[roomId];
        }
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.unreadSummary(),
        });
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.rooms(),
        });
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.roomDetail(roomId),
        });
        void queryClient.invalidateQueries({
          queryKey: teamChatQueryKeys.privateRoomDetailsRoot(),
        });
        return;
      }
      syncManualUnreadRoomState({
        roomId,
        isManualUnreadByUser: result.data?.isManualUnreadByUser ?? false,
        manualUnreadAt: result.data?.manualUnreadAt,
        manualUnreadFromMessageId: result.data?.manualUnreadFromMessageId,
      });
    })();
  };

  const handleToggleConversationUnread = () => {
    const normalizedActiveRoomId = activeRoomId.trim();
    if (!normalizedActiveRoomId) return false;

    if (manualUnreadRoomIdsRef.current.has(normalizedActiveRoomId)) {
      markRoomReadImmediately(normalizedActiveRoomId);
      return true;
    }

    return handleMarkConversationUnread();
  };

  const openChannel = (channelId: string) => {
    const conversationKey = buildConversationKey('channel', channelId);
    queueActiveComposerDraftSync();
    markRoomReadImmediately(channelId);
    setActiveChannelId(channelId);
    setActiveConversationKind('channel');
    setActiveView('channel');
    setActiveTab('messages');
    setSearchOpen(false);
    setMessageSearch('');
    setFilesSearch('');
    setHighlightedMessageId(null);
    resetComposerLikeState();
    queueStoredComposerDraftHydration({
      conversationKey,
      roomId: channelId,
    });
  };

  const openDirectMessageRoom = (roomId: string) => {
    const conversationKey = buildConversationKey('dm', roomId);
    queueActiveComposerDraftSync();
    markRoomReadImmediately(roomId);
    setOpenSections((previous) => ({
      ...previous,
      directMessages: true,
    }));
    setActiveDmId(roomId);
    setActiveConversationKind('dm');
    setActiveView('channel');
    setActiveTab('messages');
    setSearchOpen(false);
    setMessageSearch('');
    setFilesSearch('');
    setHighlightedMessageId(null);
    resetComposerLikeState();
    queueStoredComposerDraftHydration({
      conversationKey,
      roomId,
    });
  };

  const openGroupDirectMessageRoom = (roomId: string) => {
    const conversationKey = buildConversationKey('group_dm', roomId);
    queueActiveComposerDraftSync();
    markRoomReadImmediately(roomId);
    setOpenSections((previous) => ({
      ...previous,
      groupChats: true,
    }));
    setActiveDmId(roomId);
    setActiveConversationKind('group_dm');
    setActiveView('channel');
    setActiveTab('messages');
    setSearchOpen(false);
    setMessageSearch('');
    setFilesSearch('');
    setHighlightedMessageId(null);
    resetComposerLikeState();
    queueStoredComposerDraftHydration({
      conversationKey,
      roomId,
    });
  };

  const openDirectMessage = async (contactId: string) => {
    const selectedContact = dmContacts.find((contact) => contact.id === contactId);
    if (!selectedContact) {
      const directRoom =
        dmRoomSummaryMap.get(contactId) ?? roomSummaryById.get(contactId);
      if (directRoom?.roomType === 'dm') {
        openDirectMessageRoom(directRoom.id);
      }
      return;
    }

    if (selectedContact.roomId || selectedContact.source === 'room') {
      openDirectMessageRoom(selectedContact.roomId ?? selectedContact.id);
      return;
    }

    if (!selectedContact.userId) {
      toast.warning('Cannot open direct message for this contact');
      return;
    }

    const existingDmRoom = dmRoomContacts.find(
      (contact) => contact.userId === selectedContact.userId,
    );
    if (existingDmRoom) {
      openDirectMessageRoom(existingDmRoom.id);
      return;
    }

    const createRoomResult = await createRoomMutation.mutateAsync({
      roomType: 'dm',
      visibility: 'private',
      name: selectedContact.name,
      contextScope: roomScopeRequest.contextScope,
      contextId: roomScopeRequest.contextId,
      memberIds: [selectedContact.userId],
    });

    if (!createRoomResult.ok) {
      toast.danger(
        resolveTeamChatScopeGuardErrorMessage(
          createRoomResult.error.message,
          'You do not belong to the selected project scope for this conversation.',
        ),
      );
      return;
    }

    openDirectMessageRoom(createRoomResult.data.id);
  };

  const openDirectMessageFromMember = async (member: ChannelMember) => {
    if (currentUserId && member.id === currentUserId) {
      const selfConversation = Array.from(privateRoomDetailsMap.values()).find(
        (roomDetail) => {
          if (roomDetail.roomType !== 'dm') return false;
          if (roomDetail.members.length === 0) return false;
          return roomDetail.members.every(
            (roomMember) => roomMember.userId === currentUserId,
          );
        },
      );

      if (selfConversation) {
        openDirectMessageRoom(selfConversation.id);
        return;
      }
    }

    const existingRoom = dmContacts.find(
      (contact) =>
        contact.userId === member.id ||
        (member.email && contact.email === member.email) ||
        contact.name === member.name,
    );

    if (existingRoom) {
      await openDirectMessage(existingRoom.id);
      return;
    }

    const createRoomBody =
      currentUserId && member.id === currentUserId
        ? {
            roomType: 'dm' as const,
            memberIds: [],
          }
        : {
            roomType: 'dm' as const,
            visibility: 'private' as const,
            name: member.name,
            contextScope: activeRoomScopeRequest.contextScope,
            contextId: activeRoomScopeRequest.contextId,
            memberIds: [member.id],
          };

    const createRoomResult = await createRoomMutation.mutateAsync(createRoomBody);

    if (!createRoomResult.ok) {
      toast.danger(
        resolveTeamChatScopeGuardErrorMessage(
          createRoomResult.error.message,
          'You do not belong to the selected project scope for this conversation.',
        ),
      );
      return;
    }

    const dmRoom = createRoomResult.data;
    openDirectMessageRoom(dmRoom.id);
  };

  const getForwardSourceAvailability = useCallback(
    (
      conversationKey: ConversationKey,
      options?: {
        visibility?: 'public' | 'private';
      },
    ): 'available' | 'not_in_current_list' | 'private_inaccessible' => {
      const [kind, id] = conversationKey.split(':') as [ConversationKind, string];

      if (kind === 'channel') {
        const room = roomSummaryById.get(id);
        if (room?.roomType === 'channel') {
          return 'available';
        }

        return options?.visibility === 'private'
          ? 'private_inaccessible'
          : 'not_in_current_list';
      }

      if (kind === 'group_dm') {
        const room = roomSummaryById.get(id);
        return room?.roomType === 'group_dm'
          ? 'available'
          : 'not_in_current_list';
      }

      const room = roomSummaryById.get(id);
      if (room?.roomType === 'dm') {
        return 'available';
      }

      const matchedContact = dmContacts.find(
        (contact) => contact.id === id || contact.roomId === id,
      );
      return matchedContact ? 'available' : 'not_in_current_list';
    },
    [dmContacts, roomSummaryById],
  );

  const openConversationByKey = (
    conversationKey: ConversationKey,
    messageId?: string,
  ) => {
    const [kind, id] = conversationKey.split(':') as [ConversationKind, string];
    let opened = false;

    if (kind === 'channel') {
      const room = roomSummaryById.get(id) ?? personalFeedRoomDetailsMap.get(id);
      if (!room || room.roomType !== 'channel') {
        toast.warning('This conversation is not available in your current room list yet.');
        return;
      }
      ensureRoomScopeSelected(room);
      openChannel(room.id);
      opened = true;
    } else if (kind === 'group_dm') {
      const room = roomSummaryById.get(id) ?? personalFeedRoomDetailsMap.get(id);
      if (!room || room.roomType !== 'group_dm') {
        toast.warning('This conversation is not available in your current room list yet.');
        return;
      }
      ensureRoomScopeSelected(room);
      openGroupDirectMessageRoom(room.id);
      opened = true;
    } else {
      const room = roomSummaryById.get(id) ?? personalFeedRoomDetailsMap.get(id);
      if (room && room.roomType === 'dm') {
        ensureRoomScopeSelected(room);
        openDirectMessageRoom(room.id);
        opened = true;
      } else {
        const matchedContact = dmContacts.find(
          (contact) => contact.id === id || contact.roomId === id,
        );
        if (!matchedContact) {
          toast.warning('This conversation is not available in your current room list yet.');
          return;
        }
        void openDirectMessage(matchedContact.id);
        opened = true;
      }
    }

    if (opened && messageId) {
      queuePendingLinkedMessage(id, messageId);
    }
  };

  const openPersonal = (
    itemId: 'mentions' | 'threads' | 'reactions' | 'unread' | 'drafts',
  ) => {
    if (itemId === 'drafts') {
      openDraftsAndScheduledView(
        resolveComposerScheduledEditId() ? 'scheduled' : 'drafts',
      );
      return;
    }

    queueActiveComposerDraftSync();
    resetComposerLikeState();
    setActiveView('personal');
    setPersonalFilter(itemId);
  };

  const openDraftHubItemInComposer = (
    conversationKey: ConversationKey,
    payload: TeamChatComposerDraftPayload,
    context?: {
      threadRootMessageId?: string;
      parentMessageId?: string;
      scheduledMessageId?: string;
    },
  ) => {
    const normalizedPayload = normalizeTeamChatComposerDraftPayload(payload);
    openConversationByKey(conversationKey);
    queueExplicitComposerDraftHydration({
      conversationKey,
      value: normalizedPayload.content,
      payload: normalizedPayload,
      threadRootMessageId: context?.threadRootMessageId,
      parentMessageId: context?.parentMessageId,
      scheduledMessageId: context?.scheduledMessageId,
    });
  };

  const handleLoadMoreDrafts = async () => {
    if (!draftsNextCursor || draftsLoadingMore) return;

    setDraftsLoadingMore(true);
    try {
      const response = await service.listDrafts({
        limit: DRAFTS_HUB_PAGE_LIMIT,
        cursor: draftsNextCursor,
      });
      setDraftsExtraRecords((previous) => {
        const existingIds = new Set(
          [...(draftsHubQuery.data?.items ?? []), ...previous].map((item) => item.id),
        );
        const nextItems = response.items.filter((item) => !existingIds.has(item.id));
        return [...previous, ...nextItems];
      });
      setDraftsNextCursor(response.nextCursor ?? null);
    } catch (error) {
      toast.warning(
        error instanceof Error ? error.message : 'Unable to load more drafts right now',
      );
    } finally {
      setDraftsLoadingMore(false);
    }
  };

  const handleLoadMoreScheduledMessages = async () => {
    if (!scheduledNextCursor || scheduledLoadingMore) return;

    setScheduledLoadingMore(true);
    try {
      const response = await service.listScheduledMessages({
        status: 'pending',
        limit: SCHEDULED_MESSAGES_PAGE_LIMIT,
        cursor: scheduledNextCursor,
      });
      setScheduledExtraRecords((previous) => {
        const existingIds = new Set(
          [...(scheduledMessagesQuery.data?.items ?? []), ...previous].map(
            (item) => item.id,
          ),
        );
        const nextItems = response.items.filter((item) => !existingIds.has(item.id));
        return [...previous, ...nextItems];
      });
      setScheduledNextCursor(response.nextCursor ?? null);
    } catch (error) {
      toast.warning(
        error instanceof Error
          ? error.message
          : 'Unable to load more scheduled messages right now',
      );
    } finally {
      setScheduledLoadingMore(false);
    }
  };

  const handleEditDraftHubDraft = (draftId: string) => {
    const draftItem = draftItems.find((item) => item.id === draftId);
    if (!draftItem) return;

    openDraftHubItemInComposer(
      draftItem.conversationKey,
      {
        content: draftItem.content,
        contentFormat: draftItem.contentFormat ?? 'plain_text',
        richContent: draftItem.richContent ?? null,
      },
      {
        threadRootMessageId: draftItem.threadRootMessageId,
        parentMessageId: draftItem.parentMessageId,
      },
    );
  };

  const handleEditScheduledHubDraft = (scheduledId: string) => {
    const scheduledItem = scheduledDraftItems.find((item) => item.id === scheduledId);
    if (!scheduledItem) return;

    openDraftHubItemInComposer(
      scheduledItem.conversationKey,
      {
        content: scheduledItem.content,
        contentFormat: scheduledItem.contentFormat ?? 'plain_text',
        richContent: scheduledItem.richContent ?? null,
      },
      {
        threadRootMessageId: scheduledItem.threadRootMessageId,
        parentMessageId: scheduledItem.parentMessageId,
        scheduledMessageId: scheduledId,
      },
    );
  };

  const handleDeleteDraftHubDraft = async (draftId: string) => {
    const draftItem = draftItems.find((item) => item.id === draftId);
    const result = await deleteDraftMutation.mutateAsync(draftId);
    if (!result.ok) {
      toast.danger(result.error.message);
      return;
    }

    if (draftItem) {
      clearDraftComposerStateForContext({
        roomId: draftItem.roomId,
        threadRootMessageId: draftItem.threadRootMessageId,
        parentMessageId: draftItem.parentMessageId,
      });
    }
  };

  const handleDeleteDraftHubDrafts = async (draftIds: string[]) => {
    if (!draftIds.length) return;

    for (const draftId of draftIds) {
      const draftItem = draftItems.find((item) => item.id === draftId);
      const result = await deleteDraftMutation.mutateAsync(draftId);
      if (result.ok) {
        if (draftItem) {
          clearDraftComposerStateForContext({
            roomId: draftItem.roomId,
            threadRootMessageId: draftItem.threadRootMessageId,
            parentMessageId: draftItem.parentMessageId,
          });
        }
        continue;
      }

      toast.warning(result.error.message);
    }
  };

  const handleScheduleDraftHubDraft = async (draftId: string, scheduledFor: Date) => {
    const draftItem = draftItems.find((item) => item.id === draftId);
    if (!draftItem) return;

    const content = draftItem.content.trim();
    if (!content) {
      toast.warning('Scheduled message content is required');
      return;
    }

    const result = await createScheduledMessageMutation.mutateAsync({
      roomId: draftItem.roomId,
      body: {
        ...(draftItem.threadRootMessageId
          ? { threadRootMessageId: draftItem.threadRootMessageId }
          : {}),
        ...(draftItem.parentMessageId
          ? { parentMessageId: draftItem.parentMessageId }
          : {}),
        content,
        contentFormat: draftItem.contentFormat ?? 'plain_text',
        ...(draftItem.contentFormat === 'rich_text_v1' && draftItem.richContent
          ? { richContent: draftItem.richContent }
          : {}),
        metadata: { source: 'drafts-hub' },
        scheduledFor: formatISO(scheduledFor),
        timezone: resolveScheduleTimezone(),
        sourceDraftId: draftItem.id,
      },
    });

    if (!result.ok) {
      toast.danger(result.error.message);
      return;
    }

    const scheduledContext = {
      roomId: draftItem.roomId,
      threadRootMessageId: draftItem.threadRootMessageId,
      parentMessageId: draftItem.parentMessageId,
    };
    clearDraftComposerStateForContext(scheduledContext);
  };

  const handleSendDraftHubDraftNow = async (draftId: string) => {
    const draftItem = draftItems.find((item) => item.id === draftId);
    if (!draftItem) return;

    const content = draftItem.content.trim();
    if (!content) {
      toast.warning('Draft content is required before sending');
      return;
    }

    const sendResult = await sendMessageMutation.mutateAsync({
      roomId: draftItem.roomId,
      body: {
        content,
        contentFormat: draftItem.contentFormat ?? 'plain_text',
        ...(draftItem.contentFormat === 'rich_text_v1' && draftItem.richContent
          ? { richContent: draftItem.richContent }
          : {}),
        messageType: 'text',
        clientMessageId: createTeamChatClientMessageId(),
        ...(draftItem.parentMessageId
          ? { parentMessageId: draftItem.parentMessageId }
          : {}),
      },
    });

    if (!sendResult.ok) {
      toast.danger(sendResult.error.message);
      return;
    }

    clearDraftComposerStateForContext({
      roomId: draftItem.roomId,
      threadRootMessageId: draftItem.threadRootMessageId,
      parentMessageId: draftItem.parentMessageId,
    });

    const deleteResult = await deleteDraftMutation.mutateAsync(draftId);
    if (!deleteResult.ok) {
      toast.warning('Message sent, but the draft could not be cleared from the hub.');
    }

    openConversationByKey(draftItem.conversationKey, sendResult.data.id);
  };

  const handleRescheduleScheduledDraft = async (
    scheduledId: string,
    scheduledFor: Date,
  ) => {
    const scheduledItem = scheduledDraftItems.find((item) => item.id === scheduledId);
    if (!scheduledItem) return;

    const content = scheduledItem.content.trim();
    if (!content) {
      toast.warning('Scheduled message content is required');
      return;
    }

    const result = await updateScheduledMessageMutation.mutateAsync({
      scheduledMessageId: scheduledId,
      body: {
        content,
        contentFormat: scheduledItem.contentFormat ?? 'plain_text',
        ...(scheduledItem.contentFormat === 'rich_text_v1' && scheduledItem.richContent
          ? { richContent: scheduledItem.richContent }
          : {}),
        scheduledFor: formatISO(scheduledFor),
        timezone: resolveScheduleTimezone(),
      },
    });

    if (!result.ok) {
      toast.danger(result.error.message);
      return;
    }
  };

  const handleSendScheduledDraftNow = async (scheduledId: string) => {
    const scheduledItem = scheduledDraftItems.find((item) => item.id === scheduledId);
    const result = await sendScheduledMessageNowMutation.mutateAsync(scheduledId);
    if (!result.ok) {
      toast.danger(result.error.message);
      return;
    }

    if (scheduledItem) {
      const scheduledContext = {
        roomId: scheduledItem.roomId,
        threadRootMessageId: scheduledItem.threadRootMessageId,
        parentMessageId: scheduledItem.parentMessageId,
      };
      clearDraftComposerStateForContext(scheduledContext);
    }
    syncScheduledHubCacheRecord(scheduledId, null);
  };

  const handleConvertScheduledDraftToDraft = async (scheduledId: string) => {
    const result = await cancelScheduledMessageToDraftMutation.mutateAsync(scheduledId);
    if (!result.ok) {
      toast.danger(result.error.message);
      return;
    }

    setDraftHubActiveTab('drafts');
  };

  const handleDeleteScheduledDraft = async (scheduledId: string) => {
    const result = await deleteScheduledMessageMutation.mutateAsync(scheduledId);
    if (!result.ok) {
      toast.danger(result.error.message);
      return;
    }

    toast.warning('Scheduled message deleted');
  };

  const markPersonalFeedsReadOptimistically = useCallback(
    (feedIds: string[]) => {
      if (feedIds.length === 0) return;

      setPersonalReadOverrideIds((previous) => {
        const nextIds = new Set(previous);
        feedIds.forEach((feedId) => {
          if (feedId) {
            nextIds.add(feedId);
          }
        });

        return nextIds.size === previous.length ? previous : Array.from(nextIds);
      });
    },
    [setPersonalReadOverrideIds],
  );

  const revertPersonalFeedsReadOptimistically = useCallback(
    (feedIds: string[]) => {
      if (feedIds.length === 0) return;

      setPersonalReadOverrideIds((previous) => {
        const revertIds = new Set(feedIds);
        const nextIds = previous.filter((feedId) => !revertIds.has(feedId));
        return nextIds.length === previous.length ? previous : nextIds;
      });
    },
    [setPersonalReadOverrideIds],
  );

  const markPersonalFeedAsRead = useCallback(
    (targetFeed: PersonalFeedItem | null | undefined) => {
      if (!targetFeed?.isUnread) return;
      if (targetFeed.isReadStateDerived) return;
      if (personalFeedReadSyncRef.current.has(targetFeed.id)) return;

      personalFeedReadSyncRef.current.add(targetFeed.id);
      markPersonalFeedsReadOptimistically([targetFeed.id]);

      void (async () => {
        const notificationId = targetFeed.notificationId?.trim();
        const mentionId = targetFeed.mentionId?.trim();
        const shouldUseMentionReadEndpoint =
          targetFeed.kind === 'mentions' && !notificationId;
        const targetReadId = shouldUseMentionReadEndpoint
          ? mentionId || targetFeed.id
          : notificationId || targetFeed.id;
        const result = shouldUseMentionReadEndpoint
          ? await markMentionReadMutation.mutateAsync(targetReadId)
          : await markNotificationReadMutation.mutateAsync(targetReadId);

        if (!result.ok) {
          personalFeedReadSyncRef.current.delete(targetFeed.id);
          revertPersonalFeedsReadOptimistically([targetFeed.id]);
        }
      })();
    },
    [
      markMentionReadMutation,
      markNotificationReadMutation,
      markPersonalFeedsReadOptimistically,
      revertPersonalFeedsReadOptimistically,
      personalFeedReadSyncRef,
    ],
  );

  const markPersonalInboxRoomRead = useCallback(
    (
      roomId: string,
      feedItems: PersonalFeedItem[],
      options?: { forceByRoomOpen?: boolean },
    ) => {
      const normalizedRoomId = roomId.trim();
      if (!normalizedRoomId) return;
      if (personalInboxRoomReadInFlightRef.current.has(normalizedRoomId)) return;

      const shouldForceByRoomOpen = options?.forceByRoomOpen === true;
      const unreadFeedItems = feedItems.filter(
        (item) => item.isUnread && item.channelId === normalizedRoomId,
      );
      if (unreadFeedItems.length === 0 && !shouldForceByRoomOpen) return;

      const unreadMentionFeedIds = unreadFeedItems
        .filter((item) => item.kind === 'mentions' && !item.notificationId)
        .map((item) => item.id);
      const unreadNotificationFeedIds = unreadFeedItems
        .filter(
          (item) =>
            (item.kind !== 'mentions' || Boolean(item.notificationId)) &&
            !item.isReadStateDerived,
        )
        .map((item) => item.id);
      const unreadFeedIds = unreadFeedItems
        .filter((item) => !item.isReadStateDerived)
        .map((item) => item.id);
      const hasActionableUnreadByFeed =
        unreadMentionFeedIds.length > 0 || unreadNotificationFeedIds.length > 0;

      if (!hasActionableUnreadByFeed && !shouldForceByRoomOpen) {
        return;
      }

      markPersonalFeedsReadOptimistically(unreadFeedIds);
      personalInboxRoomReadInFlightRef.current.add(normalizedRoomId);

      void (async () => {
        try {
          const markByRoomResult = await markPersonalInboxRoomReadMutation.mutateAsync({
            roomId: normalizedRoomId,
            body: {
              includeKinds: ['mentions', 'notifications'],
              source: 'active_room_visible',
            },
          });

          if (markByRoomResult.ok) {
            return;
          }

          const [markMentionsResult, markNotificationsResult] = await Promise.all([
            unreadMentionFeedIds.length
              ? markAllMentionsReadMutation.mutateAsync({ roomId: normalizedRoomId })
              : Promise.resolve({ ok: true } as const),
            unreadNotificationFeedIds.length
              ? markAllNotificationsReadMutation.mutateAsync(
                  serviceCtx.tenantId
                    ? { organizationId: serviceCtx.tenantId, roomId: normalizedRoomId }
                    : { roomId: normalizedRoomId },
                )
              : Promise.resolve({ ok: true } as const),
          ]);

          if (!markMentionsResult.ok) {
            revertPersonalFeedsReadOptimistically(unreadMentionFeedIds);
          }
          if (!markNotificationsResult.ok) {
            revertPersonalFeedsReadOptimistically(unreadNotificationFeedIds);
          }
        } finally {
          personalInboxRoomReadInFlightRef.current.delete(normalizedRoomId);
        }
      })();
    },
    [
      markAllMentionsReadMutation,
      markAllNotificationsReadMutation,
      markPersonalFeedsReadOptimistically,
      markPersonalInboxRoomReadMutation,
      revertPersonalFeedsReadOptimistically,
      serviceCtx.tenantId,
    ],
  );

  useEffect(() => {
    if (activeView !== 'channel') return;

    const normalizedActiveRoomId = activeRoomId.trim();
    if (!normalizedActiveRoomId) return;
    if (manualUnreadRoomIdsRef.current.has(normalizedActiveRoomId)) return;
    markPersonalInboxRoomRead(normalizedActiveRoomId, personalFeedItems);
  }, [
    activeRoomId,
    activeView,
    manualUnreadRoomIdsRef,
    markPersonalInboxRoomRead,
    personalFeedItems,
  ]);

  useEffect(() => {
    if (activeView !== 'channel') {
      personalInboxRoomForcedConsumeRef.current = null;
      return;
    }

    const normalizedActiveRoomId = activeRoomId.trim();
    if (!normalizedActiveRoomId) {
      personalInboxRoomForcedConsumeRef.current = null;
      return;
    }
    if (manualUnreadRoomIdsRef.current.has(normalizedActiveRoomId)) return;
    if (personalInboxRoomForcedConsumeRef.current === normalizedActiveRoomId) return;
    personalInboxRoomForcedConsumeRef.current = normalizedActiveRoomId;

    markPersonalInboxRoomRead(
      normalizedActiveRoomId,
      personalFeedItemsRef.current,
      { forceByRoomOpen: true },
    );
  }, [activeRoomId, activeView, manualUnreadRoomIdsRef, markPersonalInboxRoomRead]);

  const handleSelectPersonalFeed = (feedId: string) => {
    setSelectedPersonalFeedId(feedId);
    const targetFeed = personalFeedItems.find((item) => item.id === feedId);
    markPersonalFeedAsRead(targetFeed);
  };

  const ensureRoomScopeSelected = useCallback(
    (room: Pick<TeamChatRoomSummaryResponse, 'contextScope' | 'contextId'>) => {
      const normalizedRoomScope = room.contextScope === 'project' ? 'project' : 'organization';
      const normalizedRoomContextId = room.contextId?.trim() ?? '';

      if (normalizedRoomScope === 'project') {
        if (!normalizedRoomContextId) {
          return;
        }
        if (roomScope !== 'project') {
          setRoomScope('project');
        }
        if (roomScopeProjectId !== normalizedRoomContextId) {
          setRoomScopeProjectId(normalizedRoomContextId);
        }
        return;
      }

      if (roomScope !== 'organization') {
        setRoomScope('organization');
      }
      if (roomScopeProjectId) {
        setRoomScopeProjectId('');
      }
    },
    [roomScope, roomScopeProjectId, setRoomScope, setRoomScopeProjectId],
  );

  const upsertRoomIntoSidebarCache = useCallback(
    (roomDetail: TeamChatRoomDetailResponse) => {
      upsertRoomDetailIntoRoomListCaches(queryClient, roomDetail);
    },
    [queryClient],
  );

  const hydrateMissingRoomForCurrentScope = useCallback(
    (roomId: string, messageId?: string) => {
      const normalizedRoomId = roomId.trim();
      if (!normalizedRoomId) {
        return false;
      }
      if (roomHydrationInFlightRef.current.has(normalizedRoomId)) {
        return true;
      }

      roomHydrationInFlightRef.current.add(normalizedRoomId);
      void (async () => {
        try {
          const roomDetail = await service.getRoomDetail(normalizedRoomId, {
            includeMembers: false,
          });
          upsertRoomIntoSidebarCache(roomDetail);
          ensureRoomScopeSelected(roomDetail);

          if (roomDetail.roomType === 'channel') {
            openChannel(roomDetail.id);
          } else if (roomDetail.roomType === 'group_dm') {
            openGroupDirectMessageRoom(roomDetail.id);
          } else {
            openDirectMessageRoom(roomDetail.id);
          }

          if (messageId) {
            queuePendingLinkedMessage(roomDetail.id, messageId);
          }
        } catch {
          toast.warning('This conversation is not available in your current room list yet.');
        } finally {
          roomHydrationInFlightRef.current.delete(normalizedRoomId);
        }
      })();

      return true;
    },
    [
      ensureRoomScopeSelected,
      openChannel,
      openDirectMessageRoom,
      openGroupDirectMessageRoom,
      queuePendingLinkedMessage,
      service,
      upsertRoomIntoSidebarCache,
    ],
  );

  const openConversationFromRoomId = (roomId: string, messageId?: string) => {
    if (!roomId || roomId.startsWith('invitation:')) {
      return false;
    }

    const fallbackRoomDetail = personalFeedRoomDetailsMap.get(roomId);
    const room = roomSummaryById.get(roomId) ?? fallbackRoomDetail;
    if (!room) {
      hydrateMissingRoomForCurrentScope(roomId, messageId);
      return false;
    }

    if (fallbackRoomDetail) {
      upsertRoomIntoSidebarCache(fallbackRoomDetail);
    }

    ensureRoomScopeSelected(room);

    if (room.roomType === 'channel') {
      openChannel(room.id);
    } else if (room.roomType === 'group_dm') {
      openGroupDirectMessageRoom(room.id);
    } else {
      openDirectMessageRoom(room.id);
    }

    if (messageId) {
      queuePendingLinkedMessage(room.id, messageId);
    }

    return true;
  };

  const openCreatedRoomWithHydration = (
    roomId: string,
    roomType: 'channel' | 'group_dm' | 'dm',
    options?: {
      expectedScope?: {
        contextScope: TeamChatSupportedContextScope;
        contextId?: string;
      };
    },
  ) => {
    const normalizedRoomId = roomId.trim();
    if (!normalizedRoomId) return;
    const expectedScope = options?.expectedScope;
    const normalizedExpectedProjectId =
      expectedScope?.contextScope === 'project'
        ? (expectedScope.contextId?.trim() ?? '')
        : '';

    if (expectedScope) {
      ensureRoomScopeSelected({
        contextScope: expectedScope.contextScope,
        contextId:
          expectedScope.contextScope === 'project'
            ? normalizedExpectedProjectId || null
            : null,
      });
    }

    const openResolvedRoom = (resolvedRoomId: string) => {
      if (roomType === 'channel') {
        openChannel(resolvedRoomId);
      } else if (roomType === 'group_dm') {
        openGroupDirectMessageRoom(resolvedRoomId);
      } else {
        openDirectMessageRoom(resolvedRoomId);
      }
    };

    void (async () => {
      try {
        const fetchedRoomDetail = await service.getRoomDetail(normalizedRoomId, {
          includeMembers: false,
        });
        const roomDetail =
          expectedScope?.contextScope === 'project'
            ? {
                ...fetchedRoomDetail,
                contextScope: 'project' as const,
                contextId:
                  normalizedExpectedProjectId || fetchedRoomDetail.contextId || null,
              }
            : expectedScope?.contextScope === 'organization'
              ? {
                  ...fetchedRoomDetail,
                  contextScope: 'organization' as const,
                  contextId: null,
                }
              : fetchedRoomDetail;

        upsertRoomIntoSidebarCache(roomDetail);
        ensureRoomScopeSelected(roomDetail);
        openResolvedRoom(roomDetail.id);
      } catch {
        openResolvedRoom(normalizedRoomId);
      }
    })();
  };

  const handleOpenPersonalFeed = (feedId: string) => {
    const targetFeed =
      personalFeedItems.find((item) => item.id === feedId) ??
      personalFeeds.find((item) => item.id === feedId);
    if (!targetFeed) return;

    setSelectedPersonalFeedId(feedId);
    if (!targetFeed.isReadStateDerived) {
      markPersonalFeedAsRead(targetFeed);
    }

    const opened = openConversationFromRoomId(targetFeed.channelId, targetFeed.messageId);
    if (!opened && targetFeed.invitationId) {
      toast.infor('Accept this invitation to join the room first.');
    }
  };

  const deeplinkRoomId = searchParams.get('roomId')?.trim() ?? '';
  const deeplinkMessageId = searchParams.get('messageId')?.trim() ?? '';
  const deeplinkScopeParam = searchParams.get('scope');
  const deeplinkProjectId = searchParams.get('projectId')?.trim() ?? '';
  const deeplinkScope = useMemo(() => {
    const parsedScope = parseTeamChatDeeplinkScope(deeplinkScopeParam);
    if (parsedScope === 'project' && !deeplinkProjectId) {
      return null;
    }
    return parsedScope;
  }, [deeplinkProjectId, deeplinkScopeParam]);
  const isDeeplinkScopeReady = useMemo(() => {
    if (!deeplinkScope) return true;
    if (deeplinkScope === 'project') {
      return roomScope === 'project' && roomScopeProjectId === deeplinkProjectId;
    }
    return roomScope === 'organization';
  }, [deeplinkProjectId, deeplinkScope, roomScope, roomScopeProjectId]);

  useEffect(() => {
    if (!deeplinkRoomId || !deeplinkScope) return;

    if (deeplinkScope === 'project') {
      if (roomScope !== 'project') {
        setRoomScope('project');
      }
      if (roomScopeProjectId !== deeplinkProjectId) {
        setRoomScopeProjectId(deeplinkProjectId);
      }
      return;
    }

    if (roomScope !== 'organization') {
      setRoomScope('organization');
    }
    if (roomScopeProjectId) {
      setRoomScopeProjectId('');
    }
  }, [
    deeplinkProjectId,
    deeplinkRoomId,
    deeplinkScope,
    roomScope,
    roomScopeProjectId,
    setRoomScope,
    setRoomScopeProjectId,
  ]);

  useEffect(() => {
    if (!deeplinkRoomId) {
      notificationDeeplinkHandledRef.current = null;
      notificationDeeplinkFallbackRef.current = null;
      return;
    }

    const deeplinkKey = `${deeplinkRoomId}:${deeplinkMessageId}:${deeplinkScope ?? 'auto'}:${deeplinkProjectId}`;
    if (notificationDeeplinkHandledRef.current === deeplinkKey) return;
    if (!isDeeplinkScopeReady) return;

    const canOpenConversation =
      roomSummaryById.has(deeplinkRoomId) || personalFeedRoomDetailsMap.has(deeplinkRoomId);
    if (!canOpenConversation) {
      if (notificationDeeplinkFallbackRef.current !== deeplinkKey) {
        notificationDeeplinkFallbackRef.current = deeplinkKey;
        queuePendingLinkedMessage(deeplinkRoomId, deeplinkMessageId || undefined);
        const didStartHydration = hydrateMissingRoomForCurrentScope(
          deeplinkRoomId,
          deeplinkMessageId || undefined,
        );
        if (!didStartHydration) {
          openBrowseChannels(deeplinkRoomId);
        }
      }
      return;
    }

    notificationDeeplinkHandledRef.current = deeplinkKey;
    notificationDeeplinkFallbackRef.current = null;
    openConversationFromRoomId(deeplinkRoomId, deeplinkMessageId || undefined);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('roomId');
    nextParams.delete('messageId');
    nextParams.delete('mentionId');
    nextParams.delete('scope');
    nextParams.delete('projectId');

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    // The deeplink is intentionally handled once per query-state transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    deeplinkProjectId,
    deeplinkMessageId,
    deeplinkRoomId,
    deeplinkScope,
    isDeeplinkScopeReady,
    pathname,
    personalFeedRoomDetailsMap,
    roomScope,
    roomScopeProjectId,
    roomSummaryById,
    router,
    searchParams,
    hydrateMissingRoomForCurrentScope,
  ]);
  function revokeAttachmentPreviewUrl(previewUrl?: string) {
    if (!previewUrl?.startsWith('blob:')) return;
    URL.revokeObjectURL(previewUrl);
  }

  const updateComposerAttachmentDraft = (
    attachmentId: string,
    updater: (draft: ComposerAttachmentDraft) => ComposerAttachmentDraft,
  ) => {
    setComposerAttachments((previous) => {
      let changed = false;
      const nextAttachments = previous.map((attachment) => {
        if (attachment.id !== attachmentId) return attachment;
        changed = true;
        return updater(attachment);
      });

      return changed ? nextAttachments : previous;
    });
  };

  function updateUploadingAttachmentDraft(
    messageId: string,
    attachmentId: string,
    updater: (draft: UploadingAttachmentDraft) => UploadingAttachmentDraft,
  ) {
    setUploadingAttachmentsByMessageId((previous) => {
      const currentAttachments = previous[messageId];
      if (!currentAttachments?.length) return previous;

      let changed = false;
      const nextAttachments = currentAttachments.map((attachment) => {
        if (attachment.id !== attachmentId) return attachment;
        changed = true;
        return updater(attachment);
      });

      if (!changed) return previous;

      return {
        ...previous,
        [messageId]: nextAttachments,
      };
    });
  }

  const syncMessageReactionSummaries = (
    roomId: string,
    messageId: string,
    nextReactionSummaries: TeamChatMessageReactionSummaryResponse[],
  ) => {
    updateRoomMessageHistory(roomId, (currentMessages) =>
      currentMessages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              reactionSummaries: nextReactionSummaries,
            }
          : message,
      ),
    );

    queryClient.setQueriesData<TeamChatMessageCursorResponse>(
      {
        queryKey: teamChatQueryKeys.messageCursorRoot(roomId),
      },
      (previous) => {
        if (!previous?.items?.length) return previous;

        let hasChanged = false;
        const nextItems = previous.items.map((message) => {
          if (message.id !== messageId) return message;
          hasChanged = true;
          return {
            ...message,
            reactionSummaries: nextReactionSummaries,
          };
        });

        if (!hasChanged) return previous;

        return {
          ...previous,
          items: nextItems,
        };
      },
    );

    if (roomId === activeRoomId) {
      const nextConversationReactions =
        nextReactionSummaries.length > 0
          ? nextReactionSummaries.map(mapReactionSummaryToMessageReaction)
          : undefined;

      updateConversationMessages(activeConversationKey, (currentMessages) => {
        let hasChanged = false;
        const nextMessages = currentMessages.map((message) => {
          if (message.id !== messageId) return message;
          hasChanged = true;
          return {
            ...message,
            reactions: nextConversationReactions,
          };
        });

        return hasChanged ? nextMessages : currentMessages;
      });
    }

    queryClient.setQueryData<TeamChatPinnedMessageResponse[] | undefined>(
      teamChatQueryKeys.pinnedMessages(roomId),
      (previous) => {
        if (!Array.isArray(previous) || previous.length === 0) return previous;

        let hasChanged = false;
        const nextPinnedMessages = previous.map((item) => {
          if (item.messageId !== messageId) return item;
          hasChanged = true;
          return {
            ...item,
            message: {
              ...item.message,
              reactionSummaries: nextReactionSummaries,
            },
          };
        });

        return hasChanged ? nextPinnedMessages : previous;
      },
    );

    queryClient.setQueriesData<Record<string, TeamChatMessageReactionSummaryResponse[]>>(
      {
        queryKey: ['teamChat', 'reactions-by-message', roomId],
      },
      (previous) => {
        if (!previous || typeof previous !== 'object' || Array.isArray(previous)) {
          return previous;
        }

        return {
          ...previous,
          [messageId]: nextReactionSummaries,
        };
      },
    );

    queryClient.setQueryData<TeamChatMessageReactionSummaryResponse[]>(
      teamChatQueryKeys.messageReactions(roomId, messageId),
      nextReactionSummaries,
    );
  };

  const readReactionSummariesForRoom = (
    roomId: string,
    messageId: string,
  ): TeamChatMessageReactionSummaryResponse[] => {
    const normalizedRoomId = roomId.trim();
    if (!normalizedRoomId) return [];

    if (normalizedRoomId === activeRoomId) {
      const activeMessage = activeRoomMessages.find((item) => item.id === messageId);
      if (Array.isArray(activeMessage?.reactionSummaries)) {
        return activeMessage.reactionSummaries;
      }

      const pinnedMessage = pinnedMessages.find((item) => item.messageId === messageId);
      if (Array.isArray(pinnedMessage?.message.reactionSummaries)) {
        return pinnedMessage.message.reactionSummaries;
      }
    }

    const exactCachedReactions = queryClient.getQueryData<
      TeamChatMessageReactionSummaryResponse[]
    >(teamChatQueryKeys.messageReactions(normalizedRoomId, messageId));
    if (Array.isArray(exactCachedReactions)) {
      return exactCachedReactions;
    }

    if (
      normalizedRoomId === activeRoomId &&
      Array.isArray(reactionsByMessage[messageId])
    ) {
      return reactionsByMessage[messageId];
    }

    return [];
  };

  const { handleHydrateReactionActors, toggleReaction, handleEmojiPick, handleDelete } =
    useTeamChatMessageMutationActions({
      activeRoomId,
      activeConversationKey,
      activeRoomMessages,
      pinnedMessages,
      messages,
      reactionsByMessage,
      canSendActiveConversationMessage,
      queryClient,
      reactionActorsHydrationRef,
      reactionMutationPendingRef,
      notifyCannotSendMessage,
      listReactions: service.listReactions.bind(service),
      addReaction: addReactionMutation.mutateAsync,
      removeReaction: removeReactionMutation.mutateAsync,
      deleteMessage: deleteMessageMutation.mutateAsync,
      syncMessageReactionSummaries,
      updateRoomMessageHistory,
      updateConversationMessages,
      mapRoomMessageToConversationStreamMessage,
      dismissOptimisticConversationMessage,
      setInlineEditState,
      setDeleteMessageState,
    });
  const {
    handleReply,
    handleForward,
    handleEdit,
    requestDeleteMessage,
    handleCopyMessage,
    handleOpenMessageLink,
    handleCopyLink,
    handleSearchResultSelect,
    handleDeleteDialogOpenChange,
    handleConfirmDeleteMessage,
  } = useTeamChatMessageActions({
    activeRoomId,
    pathname,
    activeConversationKind,
    activeConversationDisplay,
    canSendActiveConversationMessage,
    canForwardActiveConversationMessage,
    deleteMessageState,
    roomSummaryById,
    composerDraftValueRef,
    composerDraftSeedValueRef,
    setHydratedComposerDraftContextKey,
    setInlineEditState,
    setForwardState,
    setComposerDraftSeedValue,
    setActiveCurrentDraftSnapshot,
    setComposerHasImmediateDraftText,
    setComposerDraftDirty,
    setComposerState,
    setDeleteMessageState,
    setActiveTab,
    setSearchOpen,
    notifyCannotSendMessage,
    notifyCannotForwardMessage,
    navigateToHref: (href) => {
      router.push(href, { scroll: false });
    },
    queuePendingLinkedMessage,
    openConversationFromRoomId,
    openBrowseChannels,
    openMessageInActiveConversation,
    handleDelete,
  });
  const {
    handleInlineEditRemoveAttachment,
    handleInlineEditSave,
    handleInlineEditCancel,
    handleTogglePinMessage,
  } = useTeamChatMessageEditPinActions({
    activeRoomId,
    activeConversationKey,
    messages,
    inlineEditState,
    canPinActiveConversationMessages,
    notifyCannotPinMessage,
    requestDeleteMessage,
    updateMessage: updateMessageMutation.mutateAsync,
    pinMessage: pinMessageMutation.mutateAsync,
    unpinMessage: unpinMessageMutation.mutateAsync,
    updateRoomMessageHistory,
    mapRoomMessageToConversationStreamMessage,
    updateConversationMessages,
    setInlineEditState,
  });
  const { handleForwardSubmit } = useTeamChatMessageForwardActions({
    activeRoomId,
    forwardState,
    forwardTargetLookup,
    canForwardActiveConversationMessage,
    notifyCannotForwardMessage,
    forwardMessage: forwardMessageMutation.mutateAsync,
    openForwardTargetRoom: (roomId) => {
      if (!roomSummaryById.has(roomId)) return;
      openConversationFromRoomId(roomId);
    },
    setForwardState,
    setForwardedAuthorOverridesByMessageId,
    setForwardedRenderOverridesByMessageId,
    onForwardCommitted: ({ result }) => {
      result.results.forEach((item) => {
        const targetRoomId = item.targetRoomId?.trim() ?? '';
        const targetMessage = item.message;
        if (!item.forwarded || !targetRoomId || !targetMessage) return;
        const normalizedTargetMessage =
          Array.isArray(targetMessage.attachments) || !Array.isArray(item.attachments)
            ? targetMessage
            : {
                ...targetMessage,
                attachments: item.attachments,
              };

        updateRoomMessageHistory(targetRoomId, (currentMessages) =>
          mergeRoomHistoryItems(currentMessages, [normalizedTargetMessage]),
        );
      });
    },
  });
  const {
    handleRetryOptimisticMessage,
    handleSend,
    handleRetryUploadingAttachment,
    handleRemoveUploadingAttachment,
  } = useTeamChatMessageSendActions({
    activeRoomId,
    activeConversationKey,
    activeComposerDraftContextKey,
    canSendActiveConversationMessage,
    composerAttachments,
    composerState,
    messages,
    uploadingAttachmentsByMessageId,
    composerDraftValueRef,
    composerDraftPayloadRef,
    composerDraftSeedValueRef,
    composerDraftSeedPayloadRef,
    setComposerState,
    setComposerAttachments,
    setComposerDraftSeedValue,
    setComposerDraftSeedPayload,
    setActiveCurrentDraftSnapshot,
    setComposerHasImmediateDraftText,
    setComposerDraftDirty,
    setComposerResetKey,
    setActiveComposerScheduledEditId,
    setComposerScheduledNotice,
    notifyTypingStopped,
    notifyCannotSendMessage,
    createTeamChatClientMessageId,
    createOptimisticLocalMessageId,
    buildOptimisticReplyQuote,
    createOptimisticConversationMessage,
    createUploadingAttachmentDrafts,
    setUploadingAttachmentDraftsForMessage,
    resetUploadingAttachmentDraftsForRetry,
    resetUploadingAttachmentDraftForRetry,
    removeUploadingAttachmentDraft,
    dismissOptimisticConversationMessage,
    uploadComposerAttachmentsToMessage,
    sendAttachmentMessageOptimistically,
    sendTextOnlyMessageOptimistically,
    updateConversationMessages,
    resolveComposerScheduledEditId,
    deleteScheduledMessage: deleteScheduledMessageMutation.mutateAsync,
    syncScheduledHubCacheRecord,
    clearComposerScheduledEditSessionValue,
    clearCurrentComposerDraft,
    handleDelete,
  });
  const {
    handleUpdateRoomInfo,
    handleUpdateChannelVisibility,
    handleCreateChannel,
    handleCreateGroupDm,
    handleUpdateNotificationPreference,
    handleToggleArchiveState,
    handleUnhideConversation,
    handleUnarchiveConversation,
  } = useTeamChatRoomAdminActions({
    activeRoomId,
    activeConversationKind,
    activeRoomDetailUpdatedAt: activeRoomDetail?.updatedAt,
    activeRoomSummaryUpdatedAt: activeRoomSummary?.updatedAt,
    activeRoomHiddenByUser:
      activeRoomDetail?.isHiddenByUser ?? activeRoomSummary?.isHiddenByUser ?? false,
    queryClient,
    openCreatedRoom: openCreatedRoomWithHydration,
    openSidebarSection: (section) => {
      setOpenSections((previous) => ({
        ...previous,
        [section]: true,
      }));
    },
    updateRoomInfo: updateRoomInfoMutation.mutateAsync,
    updateChannelVisibility: updateChannelVisibilityMutation.mutateAsync,
    createRoom: createRoomMutation.mutateAsync,
    updateNotifySettings: updateNotifySettingsMutation.mutateAsync,
    updateRoomVisibility: updateRoomVisibilityMutation.mutateAsync,
    archiveRoom: archiveRoomMutation.mutateAsync,
    unarchiveRoom: unarchiveRoomMutation.mutateAsync,
  });
  const {
    handleMarkConversationUnread,
    handleRemoveMember,
    handleUpdateMemberRole,
    handleInviteMembers,
    handleJoinPublicRoom,
    handleMarkAllMentionsRead,
    handleMarkAllNotificationsRead,
    handleMarkAllUnreadActivities,
    handleAcceptInvitation,
  } = useTeamChatRoomMembershipActions({
    activeRoomId,
    activeRoomMessages,
    organizationId: serviceCtx.tenantId,
    unreadRoomIds,
    activeParticipantNameByUserId,
    personalFeedItems,
    manualUnreadRoomIdsRef,
    setManualUnreadRoomIds,
    syncManualUnreadRoomState,
    readStateSyncRef,
    markPersonalFeedsReadOptimistically,
    revertPersonalFeedsReadOptimistically,
    openResolvedRoom: (roomId, roomType) => {
      if (roomType === 'channel') {
        openChannel(roomId);
      } else if (roomType === 'group_dm') {
        openGroupDirectMessageRoom(roomId);
      } else {
        openDirectMessageRoom(roomId);
      }
    },
    resolveRoomType: async (roomId) => {
      const roomDetail = await service.getRoomDetail(roomId, {
        includeMembers: false,
      });
      return roomDetail.roomType;
    },
    setJoiningPublicRoomId,
    updateReadState: updateReadStateMutation.mutateAsync,
    removeMember: removeMemberMutation.mutateAsync,
    updateMemberRole: updateMemberRoleMutation.mutateAsync,
    inviteMembers: inviteMembersMutation.mutateAsync,
    joinRoom: joinRoomMutation.mutateAsync,
    acceptInvitation: acceptInvitationMutation.mutateAsync,
    markAllMentionsRead: markAllMentionsReadMutation.mutateAsync,
    markAllNotificationsRead: markAllNotificationsReadMutation.mutateAsync,
  });
  const {
    handleToggleChannelTabVisibility,
    handleMoveChannelTab,
    handleToggleDirectMessageTabVisibility,
    handleMoveDirectMessageTab,
  } = useTeamChatRoomTabActions({
    activeRoomId,
    activeConversationKind,
    activeTab,
    activeChannelRoomId: activeChannel.id,
    activeChannelTabs,
    activeDirectMessageTabs,
    canManageActiveChannelTabs,
    queryClient,
    persistRoomTabsCache,
    setChannelTabsById,
    setDirectMessageTabsByRoomId,
    setActiveTab,
    updateRoomTabs: updateRoomTabsMutation.mutateAsync,
  });

  const toggleStarredConversation = async () => {
    if (!activeRoomId) return;

    const mutationResult = activeConversationStarred
      ? await unstarRoomMutation.mutateAsync(activeRoomId)
      : await starRoomMutation.mutateAsync(activeRoomId);

    if (!mutationResult.ok) {
      toast.danger(mutationResult.error.message);
      return;
    }

    if (!mutationResult.data.updated) {
      return;
    }
  };

  const getPersonalFeedCount = (filter: PersonalFilter) => {
    return personalUnreadCounts[filter];
  };

  const resetActiveComposerInputState = () => {
    const emptyPayload = createEmptyTeamChatComposerDraftPayload();
    setComposerDraftSeedValue('');
    setComposerDraftSeedPayload(emptyPayload);
    composerDraftValueRef.current = '';
    composerDraftPayloadRef.current = emptyPayload;
    composerDraftSeedValueRef.current = '';
    composerDraftSeedPayloadRef.current = emptyPayload;
  };

  const handleDraftChange = (payload: TeamChatComposerDraftPayload) => {
    const normalizedPayload = normalizeTeamChatComposerDraftPayload(payload);
    const currentPayload = composerDraftPayloadRef.current;
    if (areTeamChatComposerDraftPayloadEqual(currentPayload, normalizedPayload)) return;

    composerDraftValueRef.current = normalizedPayload.content;
    composerDraftPayloadRef.current =
      cloneTeamChatComposerDraftPayload(normalizedPayload);
    setComposerDraftSessionValue(
      activeComposerDraftContextKey,
      normalizedPayload.content,
    );
    setComposerDraftPayloadSessionValue(activeComposerDraftContextKey, normalizedPayload);
    notifyTypingActivity(normalizedPayload.content);
  };

  const handleDraftPresenceChange = (hasText: boolean) => {
    startTransition(() => {
      setComposerHasImmediateDraftText((previous) =>
        previous === hasText ? previous : hasText,
      );
    });
  };

  const handleScheduleComposerMessage = async (
    payload: TeamChatComposerDraftPayload,
    scheduledFor: Date,
  ) => {
    const normalizedPayload = normalizeTeamChatComposerDraftPayload(payload);
    const content = normalizedPayload.content.trim();
    if (!content || !activeRoomId) return;
    if (!canSendActiveConversationMessage) {
      notifyCannotSendMessage();
      return;
    }

    const scheduledEditId = resolveComposerScheduledEditId();

    if (scheduledEditId) {
      const result = await updateScheduledMessageMutation.mutateAsync({
        scheduledMessageId: scheduledEditId,
        body: {
          content,
          contentFormat: normalizedPayload.contentFormat,
          ...(normalizedPayload.contentFormat === 'rich_text_v1' &&
          normalizedPayload.richContent
            ? { richContent: normalizedPayload.richContent }
            : {}),
          scheduledFor: formatISO(scheduledFor),
          timezone: resolveScheduleTimezone(),
        },
      });

      if (!result.ok) {
        toast.danger(result.error.message);
        return;
      }

      syncScheduledHubCacheRecord(scheduledEditId, result.data);
      if (activeComposerDraftContext) {
        clearDraftComposerStateForContext(activeComposerDraftContext);
      } else {
        clearComposerScheduledEditSessionValue(activeComposerDraftContextKey);
        clearComposerDraftSessionValue(activeComposerDraftContextKey);
        clearComposerDraftPayloadSessionValue(activeComposerDraftContextKey);
      }
      setComposerScheduledNotice({
        roomId: activeRoomId,
        scheduledForIso: result.data.scheduledForUtc,
      });
      notifyTypingStopped();
      return;
    }

    const result = await createScheduledMessageMutation.mutateAsync({
      roomId: activeRoomId,
      body: {
        ...(activeComposerDraftContext?.threadRootMessageId
          ? { threadRootMessageId: activeComposerDraftContext.threadRootMessageId }
          : {}),
        ...(activeComposerDraftContext?.parentMessageId
          ? { parentMessageId: activeComposerDraftContext.parentMessageId }
          : {}),
        content,
        contentFormat: normalizedPayload.contentFormat,
        ...(normalizedPayload.contentFormat === 'rich_text_v1' &&
        normalizedPayload.richContent
          ? { richContent: normalizedPayload.richContent }
          : {}),
        metadata: { source: 'composer' },
        scheduledFor: formatISO(scheduledFor),
        timezone: resolveScheduleTimezone(),
      },
    });

    if (!result.ok) {
      toast.danger(result.error.message);
      return;
    }

    await clearCurrentComposerDraft(activeComposerDraftContext, {
      silent: true,
    });
    if (activeComposerDraftContext) {
      clearDraftComposerStateForContext(activeComposerDraftContext);
    } else {
      clearComposerDraftSessionValue(activeComposerDraftContextKey);
      clearComposerDraftPayloadSessionValue(activeComposerDraftContextKey);
      clearComposerScheduledEditSessionValue(activeComposerDraftContextKey);
    }
    setComposerScheduledNotice({
      roomId: activeRoomId,
      scheduledForIso: result.data.scheduledForUtc,
    });
    notifyTypingStopped();
  };

  const handleCancelComposer = () => {
    clearComposerDraftSessionValue(activeComposerDraftContextKey);
    clearComposerDraftPayloadSessionValue(activeComposerDraftContextKey);
    clearComposerScheduledEditSessionValue(activeComposerDraftContextKey);
    setComposerState(null);
    setComposerAttachments([]);
    resetActiveComposerInputState();
    setActiveCurrentDraftSnapshot(null);
    setComposerHasImmediateDraftText(false);
    setComposerDraftDirty(false);
    setActiveComposerScheduledEditId(null);
    setComposerResetKey((previous) => previous + 1);
    notifyTypingStopped();
  };

  const handleUpdateRoomPolicies = async (policies: {
    allowMemberPinMessages: boolean;
    allowGuestPinMessages: boolean;
  }) => {
    if (!activeRoomId) return null;

    const updatePolicyResult = await updateRoomPoliciesMutation.mutateAsync({
      roomId: activeRoomId,
      body: policies,
    });

    if (!updatePolicyResult.ok) {
      const errorMessage = updatePolicyResult.error.message.includes(
        'emitRoomUpdatedEvent is not a function',
      )
        ? 'Backend room update event emitter is missing. Please redeploy or restart the BE service before retrying this change.'
        : updatePolicyResult.error.message;
      toast.danger(errorMessage);
      return null;
    }

    return {
      success: true,
      updated: updatePolicyResult.data.updated,
      currentAllowMemberPinMessages:
        updatePolicyResult.data.currentAllowMemberPinMessages,
      currentAllowGuestPinMessages: updatePolicyResult.data.currentAllowGuestPinMessages,
    };
  };

  const handleDeleteAttachment = async (messageId: string, attachmentId: string) => {
    if (!canSendActiveConversationMessage) {
      notifyCannotSendMessage();
      return false;
    }
    if (!activeRoomId) return false;

    const deleteAttachmentResult = await deleteAttachmentMutation.mutateAsync({
      roomId: activeRoomId,
      messageId,
      attachmentId,
    });

    if (!deleteAttachmentResult.ok) {
      toast.danger(deleteAttachmentResult.error.message);
      return false;
    }

    updateRoomMessageHistory(activeRoomId, (currentMessages) =>
      currentMessages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              attachments: (message.attachments ?? []).filter(
                (attachment) => attachment.id !== attachmentId,
              ),
            }
          : message,
      ),
    );
    await queryClient.invalidateQueries({
      queryKey: ['teamChat', 'attachments', 'room', activeRoomId],
    });
    return true;
  };

  const handleUpdatePresence = async (
    nextStatus: 'online' | 'away' | 'busy' | 'offline',
  ) => {
    const updatePresenceResult = await updatePresenceMutation.mutateAsync({
      presenceStatus: mapUiStatusToPresenceStatus(nextStatus),
      source: 'manual',
    });

    if (!updatePresenceResult.ok) {
      toast.danger(updatePresenceResult.error.message);
      return false;
    }

    return true;
  };

  const handleComposerAttachmentsChange = (nextFiles: File[]) => {
    const validFiles: File[] = [];
    const rejectedMessages: string[] = [];

    nextFiles.forEach((file) => {
      const validationError = validateTeamChatUploadFile(file);
      if (validationError) {
        rejectedMessages.push(validationError);
        return;
      }

      validFiles.push(file);
    });

    rejectedMessages.forEach((message) => {
      toast.warning(message);
    });

    if (validFiles.length === 0) return;

    let nextPlaceholders: ComposerAttachmentDraft[] = [];

    setComposerAttachments((previous) => {
      const seenFileKeys = new Set(
        previous.map(
          (attachment) =>
            attachment.file.name +
            '-' +
            attachment.file.size +
            '-' +
            attachment.file.lastModified,
        ),
      );

      nextPlaceholders = validFiles.reduce<ComposerAttachmentDraft[]>((drafts, file) => {
        const fileKey = file.name + '-' + file.size + '-' + file.lastModified;
        if (seenFileKeys.has(fileKey)) return drafts;
        seenFileKeys.add(fileKey);
        drafts.push(createComposerAttachmentPlaceholder(file));
        return drafts;
      }, []);

      return nextPlaceholders.length > 0 ? [...previous, ...nextPlaceholders] : previous;
    });

    nextPlaceholders.forEach((placeholder) => {
      void createComposerAttachmentDraft(
        placeholder.file,
        (progress) => {
          updateComposerAttachmentDraft(placeholder.id, (currentAttachment) => ({
            ...currentAttachment,
            previewProgress: progress,
            previewStatus:
              currentAttachment.previewStatus === 'failed' ? 'failed' : 'preparing',
          }));
        },
        {
          id: placeholder.id,
          previewUrl: placeholder.previewUrl,
        },
      ).then((preparedAttachment) => {
        updateComposerAttachmentDraft(placeholder.id, () => preparedAttachment);
      });
    });
  };

  const handleComposerAttachmentRemove = (attachmentId: string) => {
    setComposerAttachments((previous) => {
      const attachmentToRemove = previous.find(
        (attachment) => attachment.id === attachmentId,
      );
      revokeAttachmentPreviewUrl(attachmentToRemove?.previewUrl);
      return previous.filter((attachment) => attachment.id !== attachmentId);
    });
  };

  return useTeamChatViewModel({
    baseProps: {
      activeChannel,
      activeConversationRoom,
      activeConversationDisplay,
      activeConversationKey,
      activeConversationKind,
      activeConversationIsManualUnread,
      activeConversationPlaceholder,
      activeConversationStarred,
      activeDmId,
      activeTab,
      activeTypingSummary: activeTypingSummary || '',
      activeView,
      archivedRecoverableItems,
      availableHeaderTabs,
      composerAttachments,
      composerDraftSeedValue,
      composerDraftSeedPayload,
      composerResetKey,
      composerState,
      composerScheduledNotice: activeComposerScheduledNotice,
      createChannelDialogOpen,
      createGroupDmDialogOpen,
      currentUserPresenceStatus,
      draftHubCounts,
      draftHubActiveTab,
      sidebarDraftIndicators,
      manualUnreadRoomIds,
      draftItems,
      draftsHasMore: Boolean(draftsNextCursor),
      draftsLoading: draftsHubLoading,
      draftsLoadingMore,
      deferredMessageSearch,
      deleteDialogMessage,
      deleteMessagePending: deleteMessageMutation.isPending,
      browseChannels,
      browseHasMore,
      browseJoiningRoomId: joiningPublicRoomId,
      browseLoading,
      browseLoadingMore,
      browsePreviewChannel,
      browsePreviewErrorMessage,
      browsePreviewLoading,
      browseSearch,
      browseSelectedChannelId,
      browseSortBy,
      roomScopeFilter,
      dmContacts,
      filesSearch,
      filesLoading: filesTabLoading,
      filteredFiles,
      forwardState,
      forwardTargets,
      photosLoading: photosTabLoading,
      groupedPhotos,
      hiddenRecoverableItems,
      highlightedMessageId,
      isDraftsView,
      inlineEditState,
      isLoadingOlderMessages: activeRoomHistoryState?.isLoadingOlder,
      isPersonalView,
      mentionCandidates,
      mentionNameLookup,
      messageSearch,
      messages,
      openSections,
      personalFeeds,
      personalFilter,
      personalUnreadCounts,
      unreadAggregates: unreadSummaryAggregates,
      pinnedConversationMessages,
      activePinnedCount,
      scheduledHasMore: Boolean(scheduledNextCursor),
      scheduledDraftItems,
      scheduledLoading: scheduledHubLoading,
      scheduledLoadingMore,
      searchLoading,
      searchOpen,
      searchResults,
      selectedPersonalFeed,
      sidebarChannels,
      sidebarGroupDmRooms,
      starredItems,
      typingIndicatorText: activeTypingSummary || null,
      readOnlyVariant: activeConversationReadOnlyVariant,
      uploadingAttachmentsByMessageId,
      workspaceChannels,
      canLoadOlderMessages: Boolean(activeRoomHistoryState?.hasMore),
      activeChannelDetails,
      activeChannelTabs,
      activeDirectMessageTabs,
      onCancelComposer: handleCancelComposer,
      onComposerAttachmentRemove: handleComposerAttachmentRemove,
      onComposerAttachmentSelect: handleComposerAttachmentsChange,
      onBrowseSearchChange: setBrowseSearch,
      onBrowseSelectChannel: handleSelectBrowseChannel,
      onCopyLink: handleCopyLink,
      onCopyMessage: handleCopyMessage,
      onCreateChannelDialogOpenChange: setCreateChannelDialogOpen,
      onCreateChannelSubmit: handleCreateChannel,
      onCreateGroupDmDialogOpenChange: setCreateGroupDmDialogOpen,
      onCreateGroupDmSubmit: handleCreateGroupDm,
      onLoadMoreBrowseChannels: handleLoadMoreBrowseChannels,
      onDeleteDialogOpenChange: handleDeleteDialogOpenChange,
      onDraftChange: handleDraftChange,
      onDraftPresenceChange: handleDraftPresenceChange,
      onEdit: handleEdit,
      onEditDraft: handleEditDraftHubDraft,
      onEditScheduled: handleEditScheduledHubDraft,
      onEmojiPick: handleEmojiPick,
      onFilesSearchChange: setFilesSearch,
      onForward: handleForward,
      onForwardSourceOpen: openConversationByKey,
      canOpenForwardSourceConversation: getForwardSourceAvailability,
      onHydrateReactionActors: handleHydrateReactionActors,
      onInlineEditCancel: handleInlineEditCancel,
      onInlineEditRemoveAttachment: handleInlineEditRemoveAttachment,
      onInviteMembers: handleInviteMembers,
      onJoinPublicRoom: handleJoinPublicRoom,
      onLoadOlderMessages: handleLoadOlderMessages,
      onMessageSearchChange: setMessageSearch,
      onMoveChannelTab: handleMoveChannelTab,
      onMoveDirectMessageTab: handleMoveDirectMessageTab,
      onOpenChannel: openChannel,
      onOpenGroupChat: openGroupDirectMessageRoom,
      onOpenMemberDirectMessage: openDirectMessageFromMember,
      onOpenMessageLink: handleOpenMessageLink,
      onOpenPersonal: openPersonal,
      onRemoveMember: handleRemoveMember,
      onReply: handleReply,
      onDismissOptimisticMessage: dismissOptimisticConversationMessage,
      onSearchOpenChange: setSearchOpen,
      onSelectFeed: handleSelectPersonalFeed,
      onSelectFilter: setPersonalFilter,
      onSetActiveTab: setActiveTab,
      onToggleArchiveState: handleToggleArchiveState,
      onToggleChannelTabVisibility: handleToggleChannelTabVisibility,
      onToggleDirectMessageTabVisibility: handleToggleDirectMessageTabVisibility,
      onUpdateMemberRole: handleUpdateMemberRole,
      onUpdateNotificationPreference: handleUpdateNotificationPreference,
      onUpdateRoomInfo: handleUpdateRoomInfo,
      onUpdateChannelVisibility: handleUpdateChannelVisibility,
      onUpdateRoomPolicies: handleUpdateRoomPolicies,
      getPersonalFeedCount,
    },
    actions: {
      setCreateChannelDialogOpen,
      setCreateGroupDmDialogOpen,
      setBrowseSortBy,
      setActiveTab,
      setHighlightedMessageId,
      setOpenSections,
      clearForwardState: () => setForwardState(null),
      handleAcceptInvitation,
      handleConfirmDeleteMessage,
      requestDeleteMessage,
      handleDeleteAttachment,
      handleDeleteDraftHubDraft,
      handleDeleteDraftHubDrafts,
      handleDeleteScheduledDraft,
      handleLoadMoreDrafts,
      handleLoadMoreScheduledMessages,
      handleRetryUploadingAttachment,
      handleRemoveUploadingAttachment,
      handleInlineEditSave,
      handleMarkAllMentionsRead,
      handleMarkAllNotificationsRead,
      handleMarkAllUnreadActivities,
      handleMarkConversationUnread: handleToggleConversationUnread,
      openBrowseChannels,
      openDirectMessage,
      handleOpenPersonalFeed,
      openDraftHubTab,
      handleRescheduleScheduledDraft,
      handleRetryOptimisticMessage,
      handleSearchResultSelect,
      handleSend,
      handleSendDraftHubDraftNow,
      handleSendScheduledDraftNow,
      handleScheduleDraftHubDraft,
      handleScheduleComposerMessage,
      handleForwardSubmit,
      handleTogglePinMessage,
      toggleReaction,
      handleConvertScheduledDraftToDraft,
      toggleStarredConversation,
      handleUnarchiveConversation,
      handleUnhideConversation,
      handleUpdatePresence,
    },
  });
}
