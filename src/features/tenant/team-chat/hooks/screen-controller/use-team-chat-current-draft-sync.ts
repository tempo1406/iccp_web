'use client';

import { useCallback, useEffect, useMemo } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type {
  ConversationKey,
  ConversationMessage,
} from '../../data/team-chat-ui-data';
import { teamChatQueryKeys } from '../../query/use-team-chat';
import type {
  ComposerState,
  TeamChatComposerDraftPayload,
  TeamChatView,
} from '../../lib/team-chat-screen.shared';
import type {
  TeamChatDraftResponse,
  TeamChatRoomBootstrapResponse,
  TeamChatScheduledMessageResponse,
} from '../../services/types/team-chat.types';
import {
  buildTeamChatDraftContextKey,
  createDraftReplyPlaceholderMessage,
} from '../../lib/screen-controller/team-chat-controller-draft.utils';
import {
  cloneTeamChatComposerDraftPayload,
  createEmptyTeamChatComposerDraftPayload,
  normalizeTeamChatComposerDraftPayload,
} from '../../lib/team-chat-composer-draft-payload.utils';
import type { TeamChatService } from '../../services/team-chat.service';

interface ComposerDraftContext {
  roomId: string;
  threadRootMessageId?: string;
  parentMessageId?: string;
}

interface PendingComposerDraftHydration {
  conversationKey: ConversationKey;
  value: string;
  payload?: TeamChatComposerDraftPayload;
  threadRootMessageId?: string;
  parentMessageId?: string;
  scheduledMessageId?: string;
}

type StoredDraftSource =
  | 'session'
  | 'query_cache'
  | 'scheduled_session'
  | 'draft_hub'
  | 'empty';

export function useTeamChatCurrentDraftSync(params: {
  activeView: TeamChatView;
  activeRoomId: string;
  activeConversationKey: ConversationKey;
  activeComposerDraftContext: ComposerDraftContext | null;
  activeComposerDraftContextKey: string;
  activeCurrentDraftSnapshot: TeamChatDraftResponse | null;
  activeCurrentDraftFetchStatus: 'idle' | 'pending' | 'success';
  hydratedComposerDraftContextKey: string | null;
  shouldPauseStandaloneActiveRoomQueries: boolean;
  activeRoomBootstrapData: TeamChatRoomBootstrapResponse | undefined;
  pendingComposerDraftHydration: PendingComposerDraftHydration | null;
  messagesByConversation: Record<ConversationKey, ConversationMessage[]>;
  draftRecords: TeamChatDraftResponse[];
  scheduledRecords: TeamChatScheduledMessageResponse[];
  queryClient: QueryClient;
  service: Pick<TeamChatService, 'getCurrentDraft'>;
  composerDraftContextKeyRef: MutableRefObject<string>;
  composerDraftValueRef: MutableRefObject<string>;
  composerDraftPayloadRef: MutableRefObject<TeamChatComposerDraftPayload>;
  composerDraftSeedValueRef: MutableRefObject<string>;
  composerDraftSeedPayloadRef: MutableRefObject<TeamChatComposerDraftPayload>;
  composerDraftSessionByContextRef: MutableRefObject<Map<string, string>>;
  composerDraftPayloadSessionByContextRef: MutableRefObject<
    Map<string, TeamChatComposerDraftPayload>
  >;
  composerScheduledEditSessionByContextRef: MutableRefObject<Map<string, string>>;
  fetchedComposerDraftContextKeysRef: MutableRefObject<Set<string>>;
  activeCurrentDraftRequestIdRef: MutableRefObject<number>;
  setComposerState: Dispatch<SetStateAction<ComposerState | null>>;
  setComposerResetKey: Dispatch<SetStateAction<number>>;
  setComposerDraftSeedValue: Dispatch<SetStateAction<string>>;
  setComposerDraftSeedPayload: Dispatch<SetStateAction<TeamChatComposerDraftPayload>>;
  setComposerHasImmediateDraftText: Dispatch<SetStateAction<boolean>>;
  setComposerDraftDirty: Dispatch<SetStateAction<boolean>>;
  setHydratedComposerDraftContextKey: Dispatch<SetStateAction<string | null>>;
  setActiveCurrentDraftSnapshot: Dispatch<SetStateAction<TeamChatDraftResponse | null>>;
  setActiveCurrentDraftFetchStatus: Dispatch<
    SetStateAction<'idle' | 'pending' | 'success'>
  >;
  setPendingComposerDraftHydration: Dispatch<
    SetStateAction<PendingComposerDraftHydration | null>
  >;
  setActiveComposerScheduledEditId: Dispatch<SetStateAction<string | null>>;
  setComposerDraftSessionValue: (contextKey: string, value: string) => void;
  clearComposerDraftSessionValue: (contextKey: string) => void;
  setComposerDraftPayloadSessionValue: (
    contextKey: string,
    payload: TeamChatComposerDraftPayload,
  ) => void;
  clearComposerDraftPayloadSessionValue: (contextKey: string) => void;
  setComposerScheduledEditSessionValue: (
    contextKey: string,
    scheduledMessageId?: string | null,
  ) => void;
}) {
  const {
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
  } = params;

  const createDraftPayloadFromSource = useCallback(
    (
      source:
        | Pick<TeamChatDraftResponse, 'content' | 'contentFormat' | 'richContent'>
        | Pick<TeamChatScheduledMessageResponse, 'content' | 'contentFormat' | 'richContent'>
        | null
        | undefined,
    ) =>
      normalizeTeamChatComposerDraftPayload({
        content: source?.content ?? '',
        contentFormat:
          source?.contentFormat === 'rich_text_v1' ? 'rich_text_v1' : 'plain_text',
        richContent: source?.richContent ?? null,
      }),
    [],
  );

  const activeCurrentDraftQueryParams = useMemo(
    () => ({
      threadRootMessageId: activeComposerDraftContext?.threadRootMessageId,
      parentMessageId: activeComposerDraftContext?.parentMessageId,
    }),
    [
      activeComposerDraftContext?.parentMessageId,
      activeComposerDraftContext?.threadRootMessageId,
    ],
  );
  const isActiveRootDraftContext =
    !activeComposerDraftContext?.threadRootMessageId &&
    !activeComposerDraftContext?.parentMessageId;
  const activeCurrentDraftCacheKey = useMemo(
    () =>
      activeComposerDraftContext?.roomId
        ? teamChatQueryKeys.currentDraft(
            activeComposerDraftContext.roomId,
            activeCurrentDraftQueryParams,
          )
        : null,
    [activeComposerDraftContext, activeCurrentDraftQueryParams],
  );

  useEffect(() => {
    composerDraftContextKeyRef.current = activeComposerDraftContextKey;
  }, [activeComposerDraftContextKey, composerDraftContextKeyRef]);

  useEffect(() => {
    if (activeView !== 'channel' || !activeComposerDraftContext?.roomId) {
      activeCurrentDraftRequestIdRef.current += 1;
      setActiveCurrentDraftSnapshot(null);
      setActiveCurrentDraftFetchStatus('idle');
      return;
    }

    const currentContextKey = activeComposerDraftContextKey;
    const sessionDraftValue =
      composerDraftSessionByContextRef.current.get(currentContextKey);
    if (typeof sessionDraftValue === 'string') {
      const cachedDraft = activeCurrentDraftCacheKey
        ? queryClient.getQueryData<TeamChatDraftResponse | null | undefined>(
            activeCurrentDraftCacheKey,
        )
      : undefined;
      const cachedDraftPayload = composerDraftPayloadSessionByContextRef.current.get(
        currentContextKey,
      );
      setActiveCurrentDraftSnapshot(cachedDraft ?? null);
      composerDraftPayloadRef.current = cachedDraftPayload
        ? cloneTeamChatComposerDraftPayload(cachedDraftPayload)
        : createDraftPayloadFromSource(cachedDraft ?? null);
      setActiveCurrentDraftFetchStatus('success');
      return;
    }

    const cachedDraft = activeCurrentDraftCacheKey
      ? queryClient.getQueryData<TeamChatDraftResponse | null | undefined>(
        activeCurrentDraftCacheKey,
      )
    : undefined;
    if (cachedDraft !== undefined) {
      fetchedComposerDraftContextKeysRef.current.add(currentContextKey);
      setActiveCurrentDraftSnapshot(cachedDraft ?? null);
      composerDraftPayloadRef.current = createDraftPayloadFromSource(cachedDraft ?? null);
      setActiveCurrentDraftFetchStatus('success');
      return;
    }

    if (fetchedComposerDraftContextKeysRef.current.has(currentContextKey)) {
      setActiveCurrentDraftSnapshot(null);
      setActiveCurrentDraftFetchStatus('success');
      return;
    }

    if (activeRoomBootstrapData && isActiveRootDraftContext) {
      fetchedComposerDraftContextKeysRef.current.add(currentContextKey);
      setActiveCurrentDraftSnapshot(activeRoomBootstrapData.draft ?? null);
      composerDraftPayloadRef.current = createDraftPayloadFromSource(
        activeRoomBootstrapData.draft ?? null,
      );
      setActiveCurrentDraftFetchStatus('success');
      return;
    }

    if (shouldPauseStandaloneActiveRoomQueries) {
      setActiveCurrentDraftSnapshot(null);
      setActiveCurrentDraftFetchStatus('idle');
      return;
    }

    activeCurrentDraftRequestIdRef.current += 1;
    setActiveCurrentDraftSnapshot(null);
    setActiveCurrentDraftFetchStatus('pending');
  }, [
    activeComposerDraftContext?.roomId,
    activeComposerDraftContextKey,
    activeCurrentDraftCacheKey,
    activeCurrentDraftRequestIdRef,
    activeRoomBootstrapData,
    activeView,
    composerDraftSessionByContextRef,
    fetchedComposerDraftContextKeysRef,
    isActiveRootDraftContext,
    queryClient,
    setActiveCurrentDraftFetchStatus,
    setActiveCurrentDraftSnapshot,
    shouldPauseStandaloneActiveRoomQueries,
  ]);

  useEffect(() => {
    if (activeView !== 'channel') return;
    if (!activeComposerDraftContext?.roomId) return;
    if (hydratedComposerDraftContextKey === activeComposerDraftContextKey) return;
    if (activeCurrentDraftFetchStatus !== 'pending') return;
    if (shouldPauseStandaloneActiveRoomQueries) return;

    const requestId = activeCurrentDraftRequestIdRef.current;
    let cancelled = false;

    void service
      .getCurrentDraft(activeComposerDraftContext.roomId, activeCurrentDraftQueryParams)
      .then((draft) => {
        if (cancelled || activeCurrentDraftRequestIdRef.current !== requestId) return;

        const nextDraft = draft ?? null;
        fetchedComposerDraftContextKeysRef.current.add(activeComposerDraftContextKey);
        if (nextDraft?.content?.trim().length) {
          setComposerDraftSessionValue(activeComposerDraftContextKey, nextDraft.content);
        } else {
          clearComposerDraftSessionValue(activeComposerDraftContextKey);
        }
        if (nextDraft) {
          setComposerDraftPayloadSessionValue(
            activeComposerDraftContextKey,
            createDraftPayloadFromSource(nextDraft),
          );
        } else {
          clearComposerDraftPayloadSessionValue(activeComposerDraftContextKey);
        }
        composerDraftPayloadRef.current = createDraftPayloadFromSource(nextDraft);
        setActiveCurrentDraftSnapshot(nextDraft);
        setActiveCurrentDraftFetchStatus('success');
        queryClient.setQueryData(
          teamChatQueryKeys.currentDraft(
            activeComposerDraftContext.roomId,
            activeCurrentDraftQueryParams,
          ),
          nextDraft,
        );
      })
      .catch(() => {
        if (cancelled || activeCurrentDraftRequestIdRef.current !== requestId) return;
        fetchedComposerDraftContextKeysRef.current.add(activeComposerDraftContextKey);
        clearComposerDraftPayloadSessionValue(activeComposerDraftContextKey);
        composerDraftPayloadRef.current = createEmptyTeamChatComposerDraftPayload();
        setActiveCurrentDraftSnapshot(null);
        setActiveCurrentDraftFetchStatus('success');
      });

    return () => {
      cancelled = true;
    };
  }, [
    activeComposerDraftContext?.roomId,
    activeComposerDraftContextKey,
    activeCurrentDraftFetchStatus,
    activeCurrentDraftQueryParams,
    activeCurrentDraftRequestIdRef,
    activeView,
    clearComposerDraftSessionValue,
    clearComposerDraftPayloadSessionValue,
    fetchedComposerDraftContextKeysRef,
    hydratedComposerDraftContextKey,
    queryClient,
    service,
    setActiveCurrentDraftFetchStatus,
    setActiveCurrentDraftSnapshot,
    setComposerDraftSessionValue,
    setComposerDraftPayloadSessionValue,
    shouldPauseStandaloneActiveRoomQueries,
    createDraftPayloadFromSource,
  ]);

  useEffect(() => {
    setHydratedComposerDraftContextKey(null);
  }, [activeComposerDraftContextKey, setHydratedComposerDraftContextKey]);

  useEffect(() => {
    if (activeView !== 'channel') {
      setHydratedComposerDraftContextKey(null);
    }
  }, [activeView, setHydratedComposerDraftContextKey]);

  useEffect(() => {
    if (activeView !== 'channel') return;
    if (!activeComposerDraftContext?.roomId) return;
    if (activeCurrentDraftFetchStatus === 'pending') return;
    if (hydratedComposerDraftContextKey === activeComposerDraftContextKey) return;

    const hasLocalDraftOverride =
      composerDraftValueRef.current !== composerDraftSeedValueRef.current;

    if (hasLocalDraftOverride) {
      setHydratedComposerDraftContextKey(activeComposerDraftContextKey);
      return;
    }

    const nextDraftValue =
      composerDraftSessionByContextRef.current.get(activeComposerDraftContextKey) ??
      activeCurrentDraftSnapshot?.content ??
      '';
    const nextDraftPayload =
      composerDraftPayloadSessionByContextRef.current.get(activeComposerDraftContextKey) ??
      createDraftPayloadFromSource(activeCurrentDraftSnapshot);
    setComposerDraftSeedValue(nextDraftValue);
    setComposerDraftSeedPayload(nextDraftPayload);
    composerDraftValueRef.current = nextDraftValue;
    composerDraftPayloadRef.current = cloneTeamChatComposerDraftPayload(nextDraftPayload);
    composerDraftSeedValueRef.current = nextDraftValue;
    composerDraftSeedPayloadRef.current = cloneTeamChatComposerDraftPayload(nextDraftPayload);
    setComposerHasImmediateDraftText(nextDraftValue.trim().length > 0);
    setComposerDraftDirty(false);
    setComposerResetKey((previous) => previous + 1);
    setHydratedComposerDraftContextKey(activeComposerDraftContextKey);
  }, [
    activeComposerDraftContext?.roomId,
    activeComposerDraftContextKey,
    activeCurrentDraftFetchStatus,
    activeCurrentDraftSnapshot?.content,
    activeView,
    composerDraftSessionByContextRef,
    composerDraftPayloadSessionByContextRef,
    composerDraftPayloadRef,
    composerDraftSeedPayloadRef,
    composerDraftSeedValueRef,
    composerDraftValueRef,
    createDraftPayloadFromSource,
    hydratedComposerDraftContextKey,
    setComposerDraftDirty,
    setComposerDraftSeedPayload,
    setComposerDraftSeedValue,
    setComposerHasImmediateDraftText,
    setComposerResetKey,
    setHydratedComposerDraftContextKey,
  ]);

  useEffect(() => {
    if (!pendingComposerDraftHydration) return;
    if (activeView !== 'channel') return;
    if (activeConversationKey !== pendingComposerDraftHydration.conversationKey) return;

    const targetContextKey = buildTeamChatDraftContextKey({
      roomId: activeRoomId,
      threadRootMessageId: pendingComposerDraftHydration.threadRootMessageId,
      parentMessageId: pendingComposerDraftHydration.parentMessageId,
    });

    const replyMessageId =
      pendingComposerDraftHydration.parentMessageId ??
      pendingComposerDraftHydration.threadRootMessageId;
    const matchedReplyMessage = replyMessageId
      ? (messagesByConversation[activeConversationKey] ?? []).find(
          (message) => message.id === replyMessageId,
        ) ?? null
      : null;

    if (replyMessageId) {
      setComposerState({
        mode: 'reply',
        message:
          matchedReplyMessage ??
          createDraftReplyPlaceholderMessage({
            replyMessageId,
            threadRootMessageId:
              pendingComposerDraftHydration.threadRootMessageId,
          }),
      });
    } else {
      setComposerState(null);
    }

    setComposerDraftSeedValue(pendingComposerDraftHydration.value);
    const pendingDraftPayload = normalizeTeamChatComposerDraftPayload(
      pendingComposerDraftHydration.payload ?? {
        content: pendingComposerDraftHydration.value,
      },
    );
    setComposerDraftSeedPayload(pendingDraftPayload);
    composerDraftValueRef.current = pendingComposerDraftHydration.value;
    composerDraftPayloadRef.current = cloneTeamChatComposerDraftPayload(pendingDraftPayload);
    composerDraftSeedValueRef.current = pendingComposerDraftHydration.value;
    composerDraftSeedPayloadRef.current = cloneTeamChatComposerDraftPayload(pendingDraftPayload);
    setComposerDraftSessionValue(
      targetContextKey,
      pendingComposerDraftHydration.value,
    );
    setComposerDraftPayloadSessionValue(targetContextKey, pendingDraftPayload);
    setComposerScheduledEditSessionValue(
      targetContextKey,
      pendingComposerDraftHydration.scheduledMessageId ?? null,
    );
    setActiveComposerScheduledEditId(
      pendingComposerDraftHydration.scheduledMessageId ?? null,
    );
    setActiveCurrentDraftSnapshot((previous) =>
      previous
        ? {
            ...previous,
            content: pendingComposerDraftHydration.value,
            contentFormat: pendingDraftPayload.contentFormat,
            richContent: pendingDraftPayload.richContent ?? null,
          }
        : previous,
    );
    setComposerHasImmediateDraftText(
      pendingComposerDraftHydration.value.trim().length > 0,
    );
    setComposerDraftDirty(false);
    setComposerResetKey((previous) => previous + 1);
    setHydratedComposerDraftContextKey(targetContextKey);
    setPendingComposerDraftHydration(null);
  }, [
    activeConversationKey,
    activeRoomId,
    activeView,
    composerDraftSeedValueRef,
    composerDraftPayloadRef,
    composerDraftSeedPayloadRef,
    composerDraftValueRef,
    messagesByConversation,
    pendingComposerDraftHydration,
    setActiveComposerScheduledEditId,
    setActiveCurrentDraftSnapshot,
    setComposerDraftDirty,
    setComposerDraftPayloadSessionValue,
    setComposerDraftSeedPayload,
    setComposerDraftSeedValue,
    setComposerDraftSessionValue,
    setComposerHasImmediateDraftText,
    setComposerResetKey,
    setComposerScheduledEditSessionValue,
    setComposerState,
    setHydratedComposerDraftContextKey,
    setPendingComposerDraftHydration,
  ]);

  const getStoredComposerDraftValue = useCallback(
    (draftContext: ComposerDraftContext) => {
      const contextKey = buildTeamChatDraftContextKey(draftContext);
      const sessionDraftValue =
        composerDraftSessionByContextRef.current.get(contextKey);
      const sessionDraftPayload =
        composerDraftPayloadSessionByContextRef.current.get(contextKey);
      if (typeof sessionDraftValue === 'string') {
        return {
          payload: normalizeTeamChatComposerDraftPayload({
            content: sessionDraftValue,
            ...(sessionDraftPayload
              ? {
                  contentFormat: sessionDraftPayload.contentFormat,
                  richContent: sessionDraftPayload.richContent ?? null,
                }
              : {}),
          }),
          source: 'session' as StoredDraftSource,
        };
      }

      const cachedDraft = queryClient.getQueryData<TeamChatDraftResponse | null | undefined>(
        teamChatQueryKeys.currentDraft(draftContext.roomId, {
          threadRootMessageId: draftContext.threadRootMessageId,
          parentMessageId: draftContext.parentMessageId,
        }),
      );
      if (cachedDraft) {
        return {
          payload: createDraftPayloadFromSource(cachedDraft),
          source: 'query_cache' as StoredDraftSource,
        };
      }

      const scheduledEditId =
        composerScheduledEditSessionByContextRef.current.get(contextKey);
      if (scheduledEditId) {
        const matchingScheduledRecord =
          scheduledRecords.find((item) => item.id === scheduledEditId) ?? null;
        if (matchingScheduledRecord) {
          return {
            payload: createDraftPayloadFromSource(matchingScheduledRecord),
            source: 'scheduled_session' as StoredDraftSource,
          };
        }
      }

      const matchingDraftRecord = draftRecords.find(
        (draftRecord) =>
          draftRecord.roomId === draftContext.roomId &&
          (draftRecord.threadRootMessageId ?? undefined) ===
            draftContext.threadRootMessageId &&
          (draftRecord.parentMessageId ?? undefined) ===
            draftContext.parentMessageId &&
          draftRecord.content.trim().length > 0,
      );
      if (matchingDraftRecord) {
        return {
          payload: createDraftPayloadFromSource(matchingDraftRecord),
          source: 'draft_hub' as StoredDraftSource,
        };
      }

      return {
        payload: createEmptyTeamChatComposerDraftPayload(),
        source: 'empty' as StoredDraftSource,
      };
    },
    [
      composerDraftPayloadSessionByContextRef,
      composerDraftSessionByContextRef,
      composerScheduledEditSessionByContextRef,
      createDraftPayloadFromSource,
      draftRecords,
      queryClient,
      scheduledRecords,
    ],
  );

  const queueStoredComposerDraftHydration = useCallback(
    (draftContext: ComposerDraftContext & { conversationKey: ConversationKey }) => {
      const targetContextKey = buildTeamChatDraftContextKey(draftContext);
      const { payload: storedDraftPayload } = getStoredComposerDraftValue(draftContext);
      const storedDraftValue = storedDraftPayload.content;
      if (storedDraftValue.trim().length === 0) {
        setPendingComposerDraftHydration((currentPending) => {
          if (
            currentPending &&
            currentPending.conversationKey === draftContext.conversationKey &&
            currentPending.value.trim().length > 0
          ) {
            return currentPending;
          }
          return null;
        });
        return;
      }

      setComposerDraftSessionValue(targetContextKey, storedDraftValue);
      setComposerDraftPayloadSessionValue(targetContextKey, storedDraftPayload);

      setPendingComposerDraftHydration({
        conversationKey: draftContext.conversationKey,
        value: storedDraftValue,
        payload: storedDraftPayload,
        threadRootMessageId: draftContext.threadRootMessageId,
        parentMessageId: draftContext.parentMessageId,
        scheduledMessageId:
          composerScheduledEditSessionByContextRef.current.get(targetContextKey) ??
          undefined,
      });
    },
    [
      composerScheduledEditSessionByContextRef,
      getStoredComposerDraftValue,
      setComposerDraftPayloadSessionValue,
      setComposerDraftSessionValue,
      setPendingComposerDraftHydration,
    ],
  );

  const queueExplicitComposerDraftHydration = useCallback(
    (draftHydration: PendingComposerDraftHydration) => {
      const targetContextKey = buildTeamChatDraftContextKey({
        roomId: draftHydration.conversationKey.split(':')[1] ?? '',
        threadRootMessageId: draftHydration.threadRootMessageId,
        parentMessageId: draftHydration.parentMessageId,
      });
      setComposerDraftSessionValue(targetContextKey, draftHydration.value);
      setComposerDraftPayloadSessionValue(
        targetContextKey,
        normalizeTeamChatComposerDraftPayload(
          draftHydration.payload ?? {
            content: draftHydration.value,
          },
        ),
      );
      setComposerScheduledEditSessionValue(
        targetContextKey,
        draftHydration.scheduledMessageId ?? null,
      );
      setActiveComposerScheduledEditId(
        draftHydration.scheduledMessageId ?? null,
      );
      setPendingComposerDraftHydration(draftHydration);
    },
    [
      setActiveComposerScheduledEditId,
      setComposerDraftPayloadSessionValue,
      setComposerDraftSessionValue,
      setComposerScheduledEditSessionValue,
      setPendingComposerDraftHydration,
    ],
  );

  return {
    queueStoredComposerDraftHydration,
    queueExplicitComposerDraftHydration,
  };
}
