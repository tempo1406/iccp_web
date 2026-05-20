'use client';

import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { teamChatQueryKeys } from '../../query/use-team-chat';
import type { ConversationKey } from '../../data/team-chat-ui-data';
import type {
  ComposerAttachmentDraft,
  ComposerState,
  TeamChatComposerDraftPayload,
} from '../../lib/team-chat-screen.shared';
import type {
  TeamChatDraftListResponse,
  TeamChatDraftResponse,
  TeamChatScheduledMessageListResponse,
  TeamChatScheduledMessageResponse,
} from '../../services/types/team-chat.types';
import { buildTeamChatDraftContextKey } from '../../lib/screen-controller/team-chat-controller-draft.utils';
import {
  areTeamChatComposerDraftPayloadEqual,
  cloneTeamChatComposerDraftPayload,
  createEmptyTeamChatComposerDraftPayload,
  normalizeTeamChatComposerDraftPayload,
} from '../../lib/team-chat-composer-draft-payload.utils';

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

interface UpsertCurrentDraftResultLike {
  ok: boolean;
  data?: {
    draftDeleted: boolean;
    draft?: TeamChatDraftResponse | null;
  };
  error?: {
    message: string;
  };
}

interface UpdateScheduledMessageResultLike {
  ok: boolean;
  data?: TeamChatScheduledMessageResponse;
  error?: {
    message: string;
  };
}

export function useTeamChatComposerDraftPersistence(params: {
  activeView: 'channel' | 'personal' | 'drafts' | 'browse';
  activeComposerDraftContext: ComposerDraftContext | null;
  activeComposerDraftContextKey: string;
  scheduledRecords: TeamChatScheduledMessageResponse[];
  queryClient: QueryClient;
  composerDraftContextKeyRef: MutableRefObject<string>;
  composerDraftValueRef: MutableRefObject<string>;
  composerDraftPayloadRef: MutableRefObject<TeamChatComposerDraftPayload>;
  composerDraftSeedValueRef: MutableRefObject<string>;
  composerDraftSeedPayloadRef: MutableRefObject<TeamChatComposerDraftPayload>;
  composerDraftPayloadSessionByContextRef: MutableRefObject<
    Map<string, TeamChatComposerDraftPayload>
  >;
  fetchedComposerDraftContextKeysRef: MutableRefObject<Set<string>>;
  activeCurrentDraftSnapshotRef: MutableRefObject<TeamChatDraftResponse | null>;
  setComposerState: Dispatch<SetStateAction<ComposerState | null>>;
  setInlineEditState: Dispatch<
    SetStateAction<{
      messageId: string;
      draft: string;
      allowsEmptyDraft: boolean;
      removedAttachmentIds: string[];
    } | null>
  >;
  setForwardState: Dispatch<
    SetStateAction<
      | {
          message: import('../../data/team-chat-ui-data').ConversationMessage;
          sourceConversationLabel: string;
          sourceConversationSubtitle: string;
        }
      | null
    >
  >;
  setComposerAttachments: Dispatch<SetStateAction<ComposerAttachmentDraft[]>>;
  setComposerDraftSeedValue: Dispatch<SetStateAction<string>>;
  setComposerDraftSeedPayload: Dispatch<SetStateAction<TeamChatComposerDraftPayload>>;
  setActiveCurrentDraftSnapshot: Dispatch<SetStateAction<TeamChatDraftResponse | null>>;
  setComposerHasImmediateDraftText: Dispatch<SetStateAction<boolean>>;
  setComposerDraftDirty: Dispatch<SetStateAction<boolean>>;
  setHydratedComposerDraftContextKey: Dispatch<SetStateAction<string | null>>;
  setActiveComposerScheduledEditId: Dispatch<SetStateAction<string | null>>;
  setPendingComposerDraftHydration: Dispatch<
    SetStateAction<PendingComposerDraftHydration | null>
  >;
  setComposerResetKey: Dispatch<SetStateAction<number>>;
  setScheduledExtraRecords: Dispatch<
    SetStateAction<TeamChatScheduledMessageResponse[]>
  >;
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
  clearComposerScheduledEditSessionValue: (contextKey: string) => void;
  resolveComposerScheduledEditId: (contextKey?: string) => string | null;
  resolveScheduleTimezone: () => string;
  updateCurrentDraft: (params: {
    roomId: string;
    body: {
      threadRootMessageId?: string;
      parentMessageId?: string;
      content: string;
      contentFormat?: 'plain_text' | 'rich_text_v1';
      richContent?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
      draftSource?: 'composer_autosave';
    };
  }) => Promise<UpsertCurrentDraftResultLike>;
  updateScheduledMessage: (params: {
    scheduledMessageId: string;
    body: {
      content: string;
      contentFormat?: 'plain_text' | 'rich_text_v1';
      richContent?: Record<string, unknown>;
      scheduledFor: string;
      timezone: string;
    };
  }) => Promise<UpdateScheduledMessageResultLike>;
}) {
  const {
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
    updateCurrentDraft,
    updateScheduledMessage,
  } = params;

  const syncDraftHubCacheForContext = (
    context: ComposerDraftContext,
    nextDraft: TeamChatDraftResponse | null,
  ) => {
    queryClient.setQueriesData<TeamChatDraftListResponse | undefined>(
      { queryKey: teamChatQueryKeys.draftsHubRoot() },
      (currentDraftList) => {
        if (!currentDraftList) return currentDraftList;

        const nextItems = currentDraftList.items.filter(
          (draftItem) =>
            !(
              draftItem.roomId === context.roomId &&
              (draftItem.threadRootMessageId ?? undefined) ===
                (context.threadRootMessageId ?? undefined) &&
              (draftItem.parentMessageId ?? undefined) ===
                (context.parentMessageId ?? undefined)
            ),
        );

        return nextDraft
          ? {
              ...currentDraftList,
              items: [nextDraft, ...nextItems],
            }
          : {
              ...currentDraftList,
              items: nextItems,
            };
      },
    );
  };

  const syncScheduledHubCacheRecord = (
    scheduledMessageId: string,
    nextScheduledRecord: TeamChatScheduledMessageResponse | null,
  ) => {
    queryClient.setQueriesData<TeamChatScheduledMessageListResponse | undefined>(
      { queryKey: teamChatQueryKeys.scheduledMessagesRoot() },
      (currentScheduledList) => {
        if (!currentScheduledList) return currentScheduledList;

        const nextItems = currentScheduledList.items.filter(
          (scheduledItem) => scheduledItem.id !== scheduledMessageId,
        );

        return nextScheduledRecord
          ? {
              ...currentScheduledList,
              items: [nextScheduledRecord, ...nextItems],
            }
          : {
              ...currentScheduledList,
              items: nextItems,
            };
      },
    );

    setScheduledExtraRecords((previous) =>
      nextScheduledRecord
        ? [
            nextScheduledRecord,
            ...previous.filter((scheduledItem) => scheduledItem.id !== scheduledMessageId),
          ]
        : previous.filter((scheduledItem) => scheduledItem.id !== scheduledMessageId),
    );
  };

  const findScheduledRecordById = (scheduledMessageId: string) =>
    scheduledRecords.find((scheduledItem) => scheduledItem.id === scheduledMessageId) ?? null;

  const persistComposerDraftSnapshot = async (draftSnapshot: {
    context: ComposerDraftContext;
    contextKey: string;
    payload: TeamChatComposerDraftPayload;
    seedPayload: TeamChatComposerDraftPayload;
    forcePersistWhenUnchanged?: boolean;
    silent?: boolean;
  }) => {
    const {
      context,
      contextKey,
      payload,
      seedPayload,
      forcePersistWhenUnchanged = false,
      silent,
    } = draftSnapshot;
    if (
      !forcePersistWhenUnchanged &&
      areTeamChatComposerDraftPayloadEqual(payload, seedPayload)
    ) {
      return true;
    }

    const normalizedPayload = normalizeTeamChatComposerDraftPayload(payload);
    const normalizedValue =
      normalizedPayload.content.trim().length > 0 ? normalizedPayload.content : '   ';
    const optimisticTimestamp = new Date().toISOString();
    const optimisticDraft: TeamChatDraftResponse | null =
      normalizedPayload.content.trim().length > 0
        ? {
            id:
              activeCurrentDraftSnapshotRef.current?.id ??
              `optimistic-draft:${context.roomId}:${context.threadRootMessageId ?? ''}:${context.parentMessageId ?? ''}`,
            roomId: context.roomId,
            threadRootMessageId: context.threadRootMessageId ?? null,
            parentMessageId: context.parentMessageId ?? null,
            content: normalizedPayload.content,
            contentFormat: normalizedPayload.contentFormat,
            richContent: normalizedPayload.richContent ?? null,
            metadata: {},
            draftSource: 'composer_autosave',
            updatedAt: optimisticTimestamp,
            lastComposerActivityAt: optimisticTimestamp,
          }
        : null;

    queryClient.setQueryData(
      teamChatQueryKeys.currentDraft(context.roomId, {
        threadRootMessageId: context.threadRootMessageId,
        parentMessageId: context.parentMessageId,
      }),
      optimisticDraft,
    );
    fetchedComposerDraftContextKeysRef.current.add(contextKey);
    if (composerDraftContextKeyRef.current === contextKey) {
      setActiveCurrentDraftSnapshot(optimisticDraft);
    }
    if (normalizedPayload.content.trim().length > 0) {
      setComposerDraftSessionValue(contextKey, normalizedPayload.content);
      setComposerDraftPayloadSessionValue(contextKey, normalizedPayload);
    } else {
      clearComposerDraftSessionValue(contextKey);
      clearComposerDraftPayloadSessionValue(contextKey);
    }
    syncDraftHubCacheForContext(context, optimisticDraft);

    const result = await updateCurrentDraft({
      roomId: context.roomId,
      body: {
        ...(context.threadRootMessageId
          ? { threadRootMessageId: context.threadRootMessageId }
          : {}),
        ...(context.parentMessageId ? { parentMessageId: context.parentMessageId } : {}),
        content: normalizedValue,
        contentFormat: normalizedPayload.contentFormat,
        ...(normalizedPayload.contentFormat === 'rich_text_v1' && normalizedPayload.richContent
          ? { richContent: normalizedPayload.richContent }
          : {}),
        metadata: {},
        ...(normalizedPayload.content.trim().length > 0
          ? { draftSource: 'composer_autosave' as const }
          : {}),
      },
    });

    if (!result.ok || !result.data) {
      if (!silent) {
        toast.warning(result.error?.message ?? 'Unable to save draft right now.');
      }
      return false;
    }

    if (composerDraftContextKeyRef.current === contextKey) {
      setActiveCurrentDraftSnapshot(
        result.data.draftDeleted ? null : result.data.draft ?? null,
      );
      const nextSeedPayload = result.data.draftDeleted
        ? createEmptyTeamChatComposerDraftPayload()
        : normalizeTeamChatComposerDraftPayload({
            content: normalizedPayload.content,
            contentFormat: normalizedPayload.contentFormat,
            richContent: normalizedPayload.richContent ?? null,
          });
      setComposerDraftSeedValue(normalizedPayload.content);
      setComposerDraftSeedPayload(nextSeedPayload);
      composerDraftSeedValueRef.current = normalizedPayload.content;
      composerDraftSeedPayloadRef.current = cloneTeamChatComposerDraftPayload(nextSeedPayload);
      composerDraftPayloadRef.current = cloneTeamChatComposerDraftPayload(nextSeedPayload);
      setComposerHasImmediateDraftText(normalizedPayload.content.trim().length > 0);
      setComposerDraftDirty(false);
    }

    if (result.data.draftDeleted) {
      clearComposerDraftSessionValue(contextKey);
      clearComposerDraftPayloadSessionValue(contextKey);
    } else {
      setComposerDraftSessionValue(contextKey, normalizedPayload.content);
      setComposerDraftPayloadSessionValue(contextKey, normalizedPayload);
    }

    return true;
  };

  const persistComposerScheduledEditSnapshot = async (draftSnapshot: {
    contextKey: string;
    scheduledMessageId: string;
    payload: TeamChatComposerDraftPayload;
  }) => {
    const { contextKey, scheduledMessageId, payload } = draftSnapshot;
    const scheduledRecord = findScheduledRecordById(scheduledMessageId);
    if (!scheduledRecord) return false;

    const normalizedPayload = normalizeTeamChatComposerDraftPayload(payload);
    const normalizedValue = normalizedPayload.content.trim();
    if (!normalizedValue) return true;
    const scheduledRecordPayload = normalizeTeamChatComposerDraftPayload({
      content: scheduledRecord.content,
      contentFormat: scheduledRecord.contentFormat ?? 'plain_text',
      richContent: scheduledRecord.richContent ?? null,
    });
    if (areTeamChatComposerDraftPayloadEqual(normalizedPayload, scheduledRecordPayload)) {
      return true;
    }

    const optimisticTimestamp = new Date().toISOString();
    const optimisticScheduledRecord: TeamChatScheduledMessageResponse = {
      ...scheduledRecord,
      content: normalizedPayload.content,
      contentFormat: normalizedPayload.contentFormat,
      richContent: normalizedPayload.richContent ?? null,
      updatedAt: optimisticTimestamp,
    };

    syncScheduledHubCacheRecord(scheduledMessageId, optimisticScheduledRecord);
    setComposerDraftSessionValue(contextKey, normalizedPayload.content);
    setComposerDraftPayloadSessionValue(contextKey, normalizedPayload);
    setComposerScheduledEditSessionValue(contextKey, scheduledMessageId);

    const result = await updateScheduledMessage({
      scheduledMessageId,
      body: {
        content: normalizedValue,
        contentFormat: normalizedPayload.contentFormat,
        ...(normalizedPayload.contentFormat === 'rich_text_v1' && normalizedPayload.richContent
          ? { richContent: normalizedPayload.richContent }
          : {}),
        scheduledFor: scheduledRecord.scheduledForUtc,
        timezone: scheduledRecord.scheduledTimezone ?? resolveScheduleTimezone(),
      },
    });

    if (!result.ok || !result.data) {
      toast.warning(result.error?.message ?? 'Unable to update scheduled message right now.');
      return false;
    }

    syncScheduledHubCacheRecord(scheduledMessageId, result.data);
    setComposerDraftSessionValue(contextKey, normalizedPayload.content);
    setComposerDraftPayloadSessionValue(contextKey, normalizedPayload);
    setComposerScheduledEditSessionValue(contextKey, scheduledMessageId);

    if (composerDraftContextKeyRef.current === contextKey) {
      setComposerDraftSeedValue(normalizedPayload.content);
      setComposerDraftSeedPayload(normalizedPayload);
      composerDraftSeedValueRef.current = normalizedPayload.content;
      composerDraftSeedPayloadRef.current = cloneTeamChatComposerDraftPayload(
        normalizedPayload,
      );
      composerDraftPayloadRef.current = cloneTeamChatComposerDraftPayload(normalizedPayload);
      setComposerHasImmediateDraftText(normalizedPayload.content.trim().length > 0);
      setComposerDraftDirty(false);
    }

    return true;
  };

  const queueActiveComposerDraftSync = () => {
    if (activeView !== 'channel') return;
    if (!activeComposerDraftContext?.roomId) return;

    const context = activeComposerDraftContext;
    const contextKey = activeComposerDraftContextKey;
    const value = composerDraftValueRef.current;
    const payload = composerDraftPayloadRef.current;
    const seedValue = composerDraftSeedValueRef.current;
    const seedPayload = composerDraftSeedPayloadRef.current;
    const payloadChanged = !areTeamChatComposerDraftPayloadEqual(payload, seedPayload);
    const hasMeaningfulDraftPayload =
      payload.content.trim().length > 0 ||
      payload.contentFormat === 'rich_text_v1' ||
      Boolean(payload.richContent);
    const hasServerDraftSnapshot = Boolean(
      activeCurrentDraftSnapshotRef.current?.content?.trim().length,
    );
    const contextScheduledEditId = resolveComposerScheduledEditId(contextKey);
    const shouldForcePersistWhenUnchanged =
      !payloadChanged &&
      hasMeaningfulDraftPayload &&
      !hasServerDraftSnapshot &&
      !contextScheduledEditId;

    if (value === seedValue && !payloadChanged && !shouldForcePersistWhenUnchanged) {
      return;
    }

    setComposerDraftDirty(true);
    const scheduledEditId = contextScheduledEditId;
    if (scheduledEditId) {
      void persistComposerScheduledEditSnapshot({
        contextKey,
        scheduledMessageId: scheduledEditId,
        payload,
      });
      return;
    }

    void persistComposerDraftSnapshot({
      context,
      contextKey,
      payload,
      seedPayload,
      forcePersistWhenUnchanged: shouldForcePersistWhenUnchanged,
      silent: true,
    });
  };

  const resetComposerLikeState = () => {
    setComposerState(null);
    setInlineEditState(null);
    setForwardState(null);
    setComposerAttachments([]);
    setComposerDraftSeedValue('');
    setComposerDraftSeedPayload(createEmptyTeamChatComposerDraftPayload());
    composerDraftValueRef.current = '';
    composerDraftPayloadRef.current = createEmptyTeamChatComposerDraftPayload();
    composerDraftSeedValueRef.current = '';
    composerDraftSeedPayloadRef.current = createEmptyTeamChatComposerDraftPayload();
    setActiveCurrentDraftSnapshot(null);
    setComposerHasImmediateDraftText(false);
    setComposerDraftDirty(false);
    setHydratedComposerDraftContextKey(null);
    setActiveComposerScheduledEditId(null);
  };

  const clearDraftComposerStateForContext = (context: ComposerDraftContext) => {
    const targetContextKey = buildTeamChatDraftContextKey(context);
    const currentDraftQueryKey = teamChatQueryKeys.currentDraft(context.roomId, {
      threadRootMessageId: context.threadRootMessageId,
      parentMessageId: context.parentMessageId,
    });

    void queryClient.setQueryData(currentDraftQueryKey, null);
    clearComposerDraftSessionValue(targetContextKey);
    clearComposerDraftPayloadSessionValue(targetContextKey);
    clearComposerScheduledEditSessionValue(targetContextKey);
    fetchedComposerDraftContextKeysRef.current.add(targetContextKey);

    if (composerDraftContextKeyRef.current !== targetContextKey) return;

    setPendingComposerDraftHydration(null);
    setComposerState(null);
    setComposerAttachments([]);
    setComposerDraftSeedValue('');
    setComposerDraftSeedPayload(createEmptyTeamChatComposerDraftPayload());
    composerDraftValueRef.current = '';
    composerDraftPayloadRef.current = createEmptyTeamChatComposerDraftPayload();
    composerDraftSeedValueRef.current = '';
    composerDraftSeedPayloadRef.current = createEmptyTeamChatComposerDraftPayload();
    setActiveCurrentDraftSnapshot(null);
    setComposerHasImmediateDraftText(false);
    setComposerDraftDirty(false);
    setComposerResetKey((previous) => previous + 1);
    setHydratedComposerDraftContextKey(null);
    setActiveComposerScheduledEditId(null);
  };

  const clearCurrentComposerDraft = async (
    context = activeComposerDraftContext,
    options?: { silent?: boolean },
  ) => {
    if (!context?.roomId) return true;
    const targetContextKey = buildTeamChatDraftContextKey(context);

    const result = await updateCurrentDraft({
      roomId: context.roomId,
      body: {
        ...(context.threadRootMessageId
          ? { threadRootMessageId: context.threadRootMessageId }
          : {}),
        ...(context.parentMessageId ? { parentMessageId: context.parentMessageId } : {}),
        content: '   ',
        contentFormat: 'plain_text',
        metadata: {},
      },
    });

    if (!result.ok) {
      if (!options?.silent) {
        toast.warning(result.error?.message ?? 'Unable to clear draft right now.');
      }
      return false;
    }

    clearComposerDraftSessionValue(targetContextKey);
    clearComposerDraftPayloadSessionValue(targetContextKey);
    clearComposerScheduledEditSessionValue(targetContextKey);
    fetchedComposerDraftContextKeysRef.current.add(targetContextKey);

    if (composerDraftContextKeyRef.current === targetContextKey) {
      setActiveCurrentDraftSnapshot(null);
      setComposerHasImmediateDraftText(false);
      setComposerDraftDirty(false);
      setActiveComposerScheduledEditId(null);
    }

    return true;
  };

  return {
    syncScheduledHubCacheRecord,
    queueActiveComposerDraftSync,
    resetComposerLikeState,
    clearDraftComposerStateForContext,
    clearCurrentComposerDraft,
  };
}
