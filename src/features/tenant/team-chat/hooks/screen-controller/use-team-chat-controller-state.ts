'use client';

import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from 'react';
import type {
  ConversationKey,
  ConversationKind,
  ConversationMessage,
  ConversationTab,
  DiscoverableChannel,
} from '../../data/team-chat-ui-data';
import type { DraftHubTab } from '../../data/team-chat-drafts-ui-data';
import type { ChannelDetailTabItem } from '../../data/team-chat-channel-details';
import type {
  TeamChatDraftResponse,
  TeamChatScheduledMessageResponse,
  TeamChatSupportedContextScope,
} from '../../services/types/team-chat.types';
import type {
  ComposerAttachmentDraft,
  ComposerState,
  PersonalFilter,
  TeamChatComposerDraftPayload,
  TeamChatOpenSections,
  TeamChatView,
  UploadingAttachmentDraft,
} from '../../lib/team-chat-screen.shared';
import {
  cloneTeamChatComposerDraftPayload,
  createEmptyTeamChatComposerDraftPayload,
} from '../../lib/team-chat-composer-draft-payload.utils';
import type { RoomMessageHistoryState } from '../../lib/team-chat-message-history.utils';
import {
  cloneRoomTabs,
  createInitialChannelTabs,
  createInitialDirectMessageTabs,
  readRoomTabsCacheFromStorage,
  writeRoomTabsCacheToStorage,
} from '../../lib/screen-controller/team-chat-controller-room-tabs.utils';
import {
  readComposerDraftSessionCacheFromStorage,
  writeComposerDraftSessionCacheToStorage,
} from '../../lib/screen-controller/team-chat-controller-draft-session-storage.utils';
import type { ForwardedMessageRenderOverride } from '../../lib/screen-controller/team-chat-controller-message.utils';

interface ComposerScheduledNotice {
  roomId: string;
  scheduledForIso: string;
}

interface PendingComposerDraftHydration {
  conversationKey: ConversationKey;
  value: string;
  payload?: TeamChatComposerDraftPayload;
  threadRootMessageId?: string;
  parentMessageId?: string;
  scheduledMessageId?: string;
}

interface InlineEditState {
  messageId: string;
  draft: string;
  allowsEmptyDraft: boolean;
  removedAttachmentIds: string[];
}

interface DeleteMessageState {
  messageId: string;
  source: 'menu' | 'inline-edit-empty';
}

interface ForwardState {
  message: ConversationMessage;
  sourceConversationLabel: string;
  sourceConversationSubtitle: string;
}

export function useTeamChatControllerState(params: {
  currentUserId?: string | null;
}) {
  const [activeView, setActiveView] = useState<TeamChatView>('channel');
  const [activeConversationKind, setActiveConversationKind] =
    useState<ConversationKind>('channel');
  const [activeChannelId, setActiveChannelId] = useState('');
  const [activeDmId, setActiveDmId] = useState('');
  const [activeTab, setActiveTab] = useState<ConversationTab>('messages');
  const [draftHubActiveTab, setDraftHubActiveTab] = useState<DraftHubTab>('drafts');
  const [channelTabsById, setChannelTabsById] = useState(createInitialChannelTabs);
  const [directMessageTabsByRoomId, setDirectMessageTabsByRoomId] =
    useState(createInitialDirectMessageTabs);
  const [personalFilter, setPersonalFilter] = useState<PersonalFilter>('mentions');
  const [selectedPersonalFeedId, setSelectedPersonalFeedId] = useState<string | null>(null);
  const [personalReadOverrideIds, setPersonalReadOverrideIds] = useState<string[]>([]);
  const [composerResetKey, setComposerResetKey] = useState(0);
  const [composerDraftSeedValue, setComposerDraftSeedValue] = useState('');
  const [composerDraftSeedPayload, setComposerDraftSeedPayload] =
    useState<TeamChatComposerDraftPayload>(createEmptyTeamChatComposerDraftPayload);
  const [composerHasImmediateDraftText, setComposerHasImmediateDraftText] = useState(false);
  const [, setComposerDraftDirty] = useState(false);
  const [hydratedComposerDraftContextKey, setHydratedComposerDraftContextKey] = useState<
    string | null
  >(null);
  const [activeCurrentDraftSnapshot, setActiveCurrentDraftSnapshot] =
    useState<TeamChatDraftResponse | null>(null);
  const [activeCurrentDraftFetchStatus, setActiveCurrentDraftFetchStatus] = useState<
    'idle' | 'pending' | 'success'
  >('idle');
  const [draftsExtraRecords, setDraftsExtraRecords] = useState<TeamChatDraftResponse[]>([]);
  const [draftsNextCursor, setDraftsNextCursor] = useState<string | null>(null);
  const [draftsLoadingMore, setDraftsLoadingMore] = useState(false);
  const [scheduledExtraRecords, setScheduledExtraRecords] = useState<
    TeamChatScheduledMessageResponse[]
  >([]);
  const [scheduledNextCursor, setScheduledNextCursor] = useState<string | null>(null);
  const [scheduledLoadingMore, setScheduledLoadingMore] = useState(false);
  const [pendingComposerDraftHydration, setPendingComposerDraftHydration] =
    useState<PendingComposerDraftHydration | null>(null);
  const [activeComposerScheduledEditId, setActiveComposerScheduledEditId] = useState<string | null>(
    null,
  );
  const [composerScheduledNotice, setComposerScheduledNotice] =
    useState<ComposerScheduledNotice | null>(null);
  const [composerAttachments, setComposerAttachments] = useState<ComposerAttachmentDraft[]>([]);
  const [uploadingAttachmentsByMessageId, setUploadingAttachmentsByMessageId] = useState<
    Record<string, UploadingAttachmentDraft[]>
  >({});
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<ConversationKey, ConversationMessage[]>
  >({});
  const [messageHistoryByRoomId, setMessageHistoryByRoomId] = useState<
    Record<string, RoomMessageHistoryState>
  >({});
  const [forwardedAuthorOverridesByMessageId, setForwardedAuthorOverridesByMessageId] = useState<
    Record<string, string>
  >({});
  const [forwardedRenderOverridesByMessageId, setForwardedRenderOverridesByMessageId] = useState<
    Record<string, ForwardedMessageRenderOverride>
  >({});
  const [createChannelDialogOpen, setCreateChannelDialogOpen] = useState(false);
  const [createGroupDmDialogOpen, setCreateGroupDmDialogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [messageSearch, setMessageSearch] = useState('');
  const [filesSearch, setFilesSearch] = useState('');
  const [browseSearch, setBrowseSearch] = useState('');
  const [browseSortBy, setBrowseSortBy] = useState<'recent' | 'members' | 'name'>('recent');
  const [roomScope, setRoomScope] = useState<TeamChatSupportedContextScope>('organization');
  const [roomScopeProjectId, setRoomScopeProjectId] = useState('');
  const [browseSelectedChannelId, setBrowseSelectedChannelId] = useState('');
  const [browseChannels, setBrowseChannels] = useState<DiscoverableChannel[]>([]);
  const [browseCursor, setBrowseCursor] = useState<string | null>(null);
  const [browseNextCursor, setBrowseNextCursor] = useState<string | null>(null);
  const [browseLoadingMore, setBrowseLoadingMore] = useState(false);
  const [joiningPublicRoomId, setJoiningPublicRoomId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [manualUnreadRoomIds, setManualUnreadRoomIds] = useState<string[]>([]);
  const [pendingLinkedMessageTarget, setPendingLinkedMessageTarget] = useState<{
    roomId: string;
    messageId: string;
  } | null>(null);
  const [composerState, setComposerState] = useState<ComposerState | null>(null);
  const [inlineEditState, setInlineEditState] = useState<InlineEditState | null>(null);
  const [deleteMessageState, setDeleteMessageState] = useState<DeleteMessageState | null>(null);
  const [forwardState, setForwardState] = useState<ForwardState | null>(null);
  const [openSections, setOpenSections] = useState<TeamChatOpenSections>({
    personal: true,
    starred: true,
    channels: true,
    groupChats: true,
    directMessages: true,
    hidden: false,
    archived: false,
  });

  const deferredMessageSearch = useDeferredValue(messageSearch);
  const deferredFilesSearch = useDeferredValue(filesSearch);
  const deferredBrowseSearch = useDeferredValue(browseSearch);

  const autoPresenceSessionSyncRef = useRef<Set<string>>(new Set());
  const composerDraftSessionStorageCacheRef = useRef<
    ReturnType<typeof readComposerDraftSessionCacheFromStorage> | null
  >(null);
  const composerDraftContextKeyRef = useRef('');
  const composerDraftValueRef = useRef('');
  const composerDraftPayloadRef = useRef<TeamChatComposerDraftPayload>(
    createEmptyTeamChatComposerDraftPayload(),
  );
  const composerDraftSeedValueRef = useRef('');
  const composerDraftSeedPayloadRef = useRef<TeamChatComposerDraftPayload>(
    createEmptyTeamChatComposerDraftPayload(),
  );
  if (composerDraftSessionStorageCacheRef.current === null) {
    composerDraftSessionStorageCacheRef.current = readComposerDraftSessionCacheFromStorage(
      params.currentUserId,
    );
  }
  const composerDraftSessionByContextRef = useRef(
    composerDraftSessionStorageCacheRef.current.draftsByContext,
  );
  const composerDraftPayloadSessionByContextRef = useRef(
    composerDraftSessionStorageCacheRef.current.payloadByContext,
  );
  const composerScheduledEditSessionByContextRef = useRef(
    composerDraftSessionStorageCacheRef.current.scheduledEditByContext,
  );
  const composerDraftSessionPersistTimerRef = useRef<number | null>(null);
  const fetchedComposerDraftContextKeysRef = useRef(new Set<string>());
  const activeCurrentDraftSnapshotRef = useRef<TeamChatDraftResponse | null>(null);
  const activeCurrentDraftRequestIdRef = useRef(0);
  const pendingLinkedMessageRequestIdRef = useRef(0);
  const roomTabsCacheRef = useRef<Record<string, ChannelDetailTabItem[]> | null>(null);
  const readStateSyncRef = useRef<Record<string, string>>({});
  const manualUnreadRoomIdsRef = useRef<Set<string>>(new Set());
  const personalFeedReadSyncRef = useRef<Set<string>>(new Set());
  const notificationDeeplinkHandledRef = useRef<string | null>(null);
  const reactionActorsHydrationRef = useRef<Set<string>>(new Set());
  const reactionMutationPendingRef = useRef<Set<string>>(new Set());
  if (roomTabsCacheRef.current === null) {
    roomTabsCacheRef.current = readRoomTabsCacheFromStorage();
  }

  useEffect(() => {
    if (!params.currentUserId) {
      autoPresenceSessionSyncRef.current.clear();
    }
  }, [params.currentUserId]);

  const persistComposerDraftSessionStorage = () => {
    writeComposerDraftSessionCacheToStorage({
      currentUserId: params.currentUserId,
      draftsByContext: composerDraftSessionByContextRef.current,
      payloadByContext: composerDraftPayloadSessionByContextRef.current,
      scheduledEditByContext: composerScheduledEditSessionByContextRef.current,
    });
  };

  const schedulePersistComposerDraftSessionStorage = () => {
    if (typeof window === 'undefined') {
      persistComposerDraftSessionStorage();
      return;
    }

    if (composerDraftSessionPersistTimerRef.current !== null) {
      window.clearTimeout(composerDraftSessionPersistTimerRef.current);
    }
    composerDraftSessionPersistTimerRef.current = window.setTimeout(() => {
      composerDraftSessionPersistTimerRef.current = null;
      persistComposerDraftSessionStorage();
    }, 180);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const flushDraftSessionStorage = () => {
      if (composerDraftSessionPersistTimerRef.current !== null) {
        window.clearTimeout(composerDraftSessionPersistTimerRef.current);
        composerDraftSessionPersistTimerRef.current = null;
      }
      persistComposerDraftSessionStorage();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushDraftSessionStorage();
      }
    };

    window.addEventListener('beforeunload', flushDraftSessionStorage);
    window.addEventListener('pagehide', flushDraftSessionStorage);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', flushDraftSessionStorage);
      window.removeEventListener('pagehide', flushDraftSessionStorage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      flushDraftSessionStorage();
    };
  }, [params.currentUserId]);

  useEffect(() => {
    composerDraftSeedValueRef.current = composerDraftSeedValue;
  }, [composerDraftSeedValue]);

  useEffect(() => {
    composerDraftPayloadRef.current = composerDraftSeedPayload;
  }, [composerDraftSeedPayload]);

  useEffect(() => {
    composerDraftSeedPayloadRef.current = cloneTeamChatComposerDraftPayload(
      composerDraftSeedPayload,
    );
  }, [composerDraftSeedPayload]);

  useEffect(() => {
    activeCurrentDraftSnapshotRef.current = activeCurrentDraftSnapshot;
  }, [activeCurrentDraftSnapshot]);

  const setComposerDraftSessionValue = (contextKey: string, value: string) => {
    if (!contextKey) return;
    if (value.trim().length === 0) {
      composerDraftSessionByContextRef.current.delete(contextKey);
      schedulePersistComposerDraftSessionStorage();
      return;
    }

    composerDraftSessionByContextRef.current.set(contextKey, value);
    schedulePersistComposerDraftSessionStorage();
  };

  const clearComposerDraftSessionValue = (contextKey: string) => {
    if (!contextKey) return;
    composerDraftSessionByContextRef.current.delete(contextKey);
    schedulePersistComposerDraftSessionStorage();
  };

  const setComposerDraftPayloadSessionValue = (
    contextKey: string,
    payload: TeamChatComposerDraftPayload,
  ) => {
    if (!contextKey) return;
    const normalizedPayload = cloneTeamChatComposerDraftPayload(payload);
    const shouldClearPayloadSession =
      normalizedPayload.content.trim().length === 0 &&
      normalizedPayload.contentFormat === 'plain_text' &&
      !normalizedPayload.richContent;
    if (shouldClearPayloadSession) {
      composerDraftPayloadSessionByContextRef.current.delete(contextKey);
      schedulePersistComposerDraftSessionStorage();
      return;
    }

    composerDraftPayloadSessionByContextRef.current.set(contextKey, normalizedPayload);
    schedulePersistComposerDraftSessionStorage();
  };

  const clearComposerDraftPayloadSessionValue = (contextKey: string) => {
    if (!contextKey) return;
    composerDraftPayloadSessionByContextRef.current.delete(contextKey);
    schedulePersistComposerDraftSessionStorage();
  };

  const setComposerScheduledEditSessionValue = (
    contextKey: string,
    scheduledMessageId?: string | null,
  ) => {
    if (!contextKey) return;
    if (!scheduledMessageId) {
      composerScheduledEditSessionByContextRef.current.delete(contextKey);
      schedulePersistComposerDraftSessionStorage();
      return;
    }

    composerScheduledEditSessionByContextRef.current.set(contextKey, scheduledMessageId);
    schedulePersistComposerDraftSessionStorage();
  };

  const clearComposerScheduledEditSessionValue = (contextKey: string) => {
    if (!contextKey) return;
    composerScheduledEditSessionByContextRef.current.delete(contextKey);
    schedulePersistComposerDraftSessionStorage();
  };

  const persistRoomTabsCache = (roomId: string, tabs: ChannelDetailTabItem[]) => {
    const normalizedRoomId = roomId.trim();
    if (!normalizedRoomId) return;

    const cachedTabs = cloneRoomTabs(tabs);
    roomTabsCacheRef.current = {
      ...(roomTabsCacheRef.current ?? {}),
      [normalizedRoomId]: cachedTabs,
    };
    writeRoomTabsCacheToStorage(roomTabsCacheRef.current);
  };

  return {
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
    composerDraftSeedValue,
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
    composerDraftSeedValueRef,
    composerDraftSeedPayloadRef,
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
  };
}
