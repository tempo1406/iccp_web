'use client';

import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { toast } from '@/lib/toast';
import type {
  ConversationKey,
  ConversationMessage,
} from '../../data/team-chat-ui-data';
import type {
  ComposerAttachmentDraft,
  ComposerState,
  TeamChatComposerDraftPayload,
} from '../../lib/team-chat-screen.shared';
import type { TeamChatDraftResponse } from '../../services/types/team-chat.types';
import { compareConversationMessagesBySentAt } from '../../lib/screen-controller/team-chat-controller-message.utils';
import { validateTeamChatUploadFile } from '../../lib/team-chat-upload.utils';
import {
  createEmptyTeamChatComposerDraftPayload,
  normalizeTeamChatComposerDraftPayload,
} from '../../lib/team-chat-composer-draft-payload.utils';

interface ComposerScheduledNotice {
  roomId: string;
  scheduledForIso: string;
}

interface ComposerDraftContext {
  roomId: string;
  threadRootMessageId?: string;
  parentMessageId?: string;
}

interface DeleteScheduledResultLike {
  ok: boolean;
  error?: {
    message: string;
  };
}

export function useTeamChatMessageSendActions(params: {
  activeRoomId: string;
  activeConversationKey: ConversationKey;
  activeComposerDraftContextKey: string;
  canSendActiveConversationMessage: boolean;
  composerAttachments: ComposerAttachmentDraft[];
  composerState: ComposerState | null;
  messages: ConversationMessage[];
  uploadingAttachmentsByMessageId: Record<
    string,
    import('../../lib/team-chat-screen.shared').UploadingAttachmentDraft[]
  >;
  composerDraftValueRef: MutableRefObject<string>;
  composerDraftPayloadRef: MutableRefObject<TeamChatComposerDraftPayload>;
  composerDraftSeedValueRef: MutableRefObject<string>;
  composerDraftSeedPayloadRef: MutableRefObject<TeamChatComposerDraftPayload>;
  setComposerState: Dispatch<SetStateAction<ComposerState | null>>;
  setComposerAttachments: Dispatch<SetStateAction<ComposerAttachmentDraft[]>>;
  setComposerDraftSeedValue: Dispatch<SetStateAction<string>>;
  setComposerDraftSeedPayload: Dispatch<SetStateAction<TeamChatComposerDraftPayload>>;
  setActiveCurrentDraftSnapshot: Dispatch<
    SetStateAction<TeamChatDraftResponse | null>
  >;
  setComposerHasImmediateDraftText: Dispatch<SetStateAction<boolean>>;
  setComposerDraftDirty: Dispatch<SetStateAction<boolean>>;
  setComposerResetKey: Dispatch<SetStateAction<number>>;
  setActiveComposerScheduledEditId: Dispatch<SetStateAction<string | null>>;
  setComposerScheduledNotice: Dispatch<
    SetStateAction<ComposerScheduledNotice | null>
  >;
  notifyTypingStopped: () => void;
  notifyCannotSendMessage: () => void;
  createTeamChatClientMessageId: () => string;
  createOptimisticLocalMessageId: () => string;
  buildOptimisticReplyQuote: (
    sourceMessage?: ConversationMessage | null,
  ) => ConversationMessage['quote'];
  createOptimisticConversationMessage: (options: {
    localMessageId: string;
    clientMessageId: string;
    payload: TeamChatComposerDraftPayload;
    parentMessageId?: string;
    quote?: ConversationMessage['quote'];
    isAttachmentPlaceholder?: boolean;
  }) => ConversationMessage;
  createUploadingAttachmentDrafts: (
    attachments: ComposerAttachmentDraft[],
  ) => import('../../lib/team-chat-screen.shared').UploadingAttachmentDraft[];
  setUploadingAttachmentDraftsForMessage: (
    messageId: string,
    drafts: import('../../lib/team-chat-screen.shared').UploadingAttachmentDraft[],
  ) => void;
  resetUploadingAttachmentDraftsForRetry: (
    messageId: string,
  ) => import('../../lib/team-chat-screen.shared').UploadingAttachmentDraft[];
  resetUploadingAttachmentDraftForRetry: (
    messageId: string,
    attachmentId: string,
  ) => import('../../lib/team-chat-screen.shared').UploadingAttachmentDraft | null;
  removeUploadingAttachmentDraft: (
    messageId: string,
    attachmentId: string,
  ) => {
    removedAttachment: import('../../lib/team-chat-screen.shared').UploadingAttachmentDraft | null;
    remainingAttachments: import('../../lib/team-chat-screen.shared').UploadingAttachmentDraft[];
  };
  dismissOptimisticConversationMessage: (messageId: string) => void;
  uploadComposerAttachmentsToMessage: (options: {
    roomId: string;
    messageId: string;
    attachments: import('../../lib/team-chat-screen.shared').UploadingAttachmentDraft[];
  }) => Promise<number>;
  sendAttachmentMessageOptimistically: (options: {
    payload: TeamChatComposerDraftPayload;
    localMessageId: string;
    clientMessageId: string;
    parentMessageId?: string;
    optimisticQuote?: ConversationMessage['quote'];
    isAttachmentOnlyMessage: boolean;
    uploadingAttachments: import('../../lib/team-chat-screen.shared').UploadingAttachmentDraft[];
  }) => Promise<boolean>;
  sendTextOnlyMessageOptimistically: (options: {
    payload: TeamChatComposerDraftPayload;
    localMessageId: string;
    clientMessageId: string;
    parentMessageId?: string;
    optimisticQuote?: ConversationMessage['quote'];
  }) => Promise<boolean>;
  updateConversationMessages: (
    conversationKey: ConversationKey,
    updater: (currentMessages: ConversationMessage[]) => ConversationMessage[],
  ) => void;
  resolveComposerScheduledEditId: () => string | null;
  deleteScheduledMessage: (
    scheduledMessageId: string,
  ) => Promise<DeleteScheduledResultLike>;
  syncScheduledHubCacheRecord: (
    scheduledMessageId: string,
    nextScheduledRecord: null,
  ) => void;
  clearComposerScheduledEditSessionValue: (contextKey: string) => void;
  clearCurrentComposerDraft: (
    context?: ComposerDraftContext | null,
    options?: { silent?: boolean },
  ) => Promise<boolean>;
  handleDelete: (messageId: string) => Promise<boolean>;
}) {
  const {
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
    deleteScheduledMessage,
    syncScheduledHubCacheRecord,
    clearComposerScheduledEditSessionValue,
    clearCurrentComposerDraft,
    handleDelete,
  } = params;

  const handleRetryOptimisticMessage = useCallback(
    async (message: ConversationMessage) => {
      if (!message.isOptimistic || message.deliveryStatus !== 'failed' || !activeRoomId) {
        return false;
      }
      if (!canSendActiveConversationMessage) {
        notifyCannotSendMessage();
        return false;
      }

      const retryableAttachments =
        uploadingAttachmentsByMessageId[message.id] ?? [];
      const hasRetryableAttachments = retryableAttachments.some(
        (attachment) => attachment.file instanceof File,
      );
      const nextContent =
        message.isAttachmentPlaceholder ||
        (hasRetryableAttachments && message.content.trim().toLowerCase() === 'attachment')
          ? ''
          : message.content.trim();

      if (!nextContent && !hasRetryableAttachments) return false;

      const nextClientMessageId = createTeamChatClientMessageId();

      updateConversationMessages(activeConversationKey, (currentMessages) =>
        currentMessages.map((currentMessage) =>
          currentMessage.id === message.id
            ? {
                ...currentMessage,
                clientMessageId: nextClientMessageId,
                deliveryStatus: 'sending',
                errorMessage: undefined,
              }
            : currentMessage,
        ),
      );

      if (hasRetryableAttachments) {
        const currentUploadingAttachments =
          resetUploadingAttachmentDraftsForRetry(message.id);
        const retryPayload = normalizeTeamChatComposerDraftPayload({
          content: nextContent,
          contentFormat:
            nextContent.length > 0 && message.contentFormat === 'rich_text_v1'
              ? 'rich_text_v1'
              : 'plain_text',
          richContent:
            nextContent.length > 0 && message.contentFormat === 'rich_text_v1'
              ? message.richContent ?? null
              : null,
        });
        return sendAttachmentMessageOptimistically({
          payload: retryPayload,
          localMessageId: message.id,
          clientMessageId: nextClientMessageId,
          parentMessageId: message.parentMessageId,
          optimisticQuote: message.quote,
          isAttachmentOnlyMessage: nextContent.length === 0,
          uploadingAttachments: currentUploadingAttachments,
        });
      }

      const retryPayload = normalizeTeamChatComposerDraftPayload({
        content: nextContent,
        contentFormat: message.contentFormat ?? 'plain_text',
        richContent: message.richContent ?? null,
      });
      return sendTextOnlyMessageOptimistically({
        payload: retryPayload,
        localMessageId: message.id,
        clientMessageId: nextClientMessageId,
        parentMessageId: message.parentMessageId,
        optimisticQuote: message.quote,
      });
    },
    [
      activeConversationKey,
      activeRoomId,
      canSendActiveConversationMessage,
      createTeamChatClientMessageId,
      uploadingAttachmentsByMessageId,
      notifyCannotSendMessage,
      resetUploadingAttachmentDraftsForRetry,
      sendAttachmentMessageOptimistically,
      sendTextOnlyMessageOptimistically,
      updateConversationMessages,
    ],
  );

  const handleSend = useCallback(
    async (draftPayload: TeamChatComposerDraftPayload) => {
      const normalizedDraftPayload = normalizeTeamChatComposerDraftPayload(draftPayload);
      const content = normalizedDraftPayload.content.trim();
      const composerAttachmentsSnapshot = composerAttachments;
      const invalidAttachment = composerAttachmentsSnapshot.find((attachment) =>
        validateTeamChatUploadFile(attachment.file),
      );
      if (invalidAttachment) {
        toast.warning(
          validateTeamChatUploadFile(invalidAttachment.file) ??
            'One attachment is not allowed',
        );
        return;
      }

      const isReplyMessage = composerState?.mode === 'reply';
      const replySourceMessage =
        composerState?.mode === 'reply' ? composerState.message : null;
      if ((!content && composerAttachmentsSnapshot.length === 0) || !activeRoomId) return;
      if (!canSendActiveConversationMessage) {
        notifyCannotSendMessage();
        return;
      }

      const clientMessageId = createTeamChatClientMessageId();
      const localMessageId = createOptimisticLocalMessageId();
      const optimisticQuote = isReplyMessage
        ? buildOptimisticReplyQuote(replySourceMessage)
        : undefined;
      const optimisticUploadingAttachments =
        composerAttachmentsSnapshot.length > 0
          ? createUploadingAttachmentDrafts(composerAttachmentsSnapshot)
          : [];
      const isAttachmentOnlyMessage = !content && optimisticUploadingAttachments.length > 0;
      const optimisticContent = isAttachmentOnlyMessage ? 'Attachment' : content;

      updateConversationMessages(activeConversationKey, (currentMessages) =>
        [
          ...currentMessages,
          createOptimisticConversationMessage({
            localMessageId,
            clientMessageId,
            payload: {
              content: optimisticContent,
              contentFormat:
                normalizedDraftPayload.contentFormat === 'rich_text_v1' &&
                normalizedDraftPayload.content.trim().length > 0
                  ? 'rich_text_v1'
                  : 'plain_text',
              richContent:
                normalizedDraftPayload.contentFormat === 'rich_text_v1' &&
                normalizedDraftPayload.content.trim().length > 0
                  ? normalizedDraftPayload.richContent ?? null
                  : null,
            },
            parentMessageId: isReplyMessage ? composerState?.message.id : undefined,
            quote: optimisticQuote,
            isAttachmentPlaceholder: isAttachmentOnlyMessage,
          }),
        ].sort(compareConversationMessagesBySentAt),
      );

      if (optimisticUploadingAttachments.length > 0) {
        setUploadingAttachmentDraftsForMessage(
          localMessageId,
          optimisticUploadingAttachments,
        );
      }

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
      notifyTypingStopped();

      let messageSent = false;

      if (optimisticUploadingAttachments.length > 0) {
        messageSent = await sendAttachmentMessageOptimistically({
          payload: normalizedDraftPayload,
          localMessageId,
          clientMessageId,
          parentMessageId: isReplyMessage ? composerState?.message.id : undefined,
          optimisticQuote,
          isAttachmentOnlyMessage,
          uploadingAttachments: optimisticUploadingAttachments,
        });
      } else {
        messageSent = await sendTextOnlyMessageOptimistically({
          payload: normalizedDraftPayload,
          localMessageId,
          clientMessageId,
          parentMessageId: isReplyMessage ? composerState?.message.id : undefined,
          optimisticQuote,
        });
      }

      if (messageSent) {
        const scheduledIdToRemove = resolveComposerScheduledEditId();
        if (scheduledIdToRemove) {
          const deleteScheduledResult =
            await deleteScheduledMessage(scheduledIdToRemove);
          if (!deleteScheduledResult.ok) {
            toast.warning(
              'Message sent, but scheduled copy could not be removed.',
            );
          } else {
            syncScheduledHubCacheRecord(scheduledIdToRemove, null);
          }
          clearComposerScheduledEditSessionValue(activeComposerDraftContextKey);
          setActiveComposerScheduledEditId(null);
          setComposerScheduledNotice(null);
        }

        await clearCurrentComposerDraft(undefined, { silent: true });
      }
    },
    [
      activeComposerDraftContextKey,
      activeConversationKey,
      activeRoomId,
      buildOptimisticReplyQuote,
      canSendActiveConversationMessage,
      clearComposerScheduledEditSessionValue,
      clearCurrentComposerDraft,
      composerAttachments,
      composerDraftSeedValueRef,
      composerDraftValueRef,
      composerDraftPayloadRef,
      composerDraftSeedPayloadRef,
      composerState,
      createOptimisticConversationMessage,
      createOptimisticLocalMessageId,
      createTeamChatClientMessageId,
      createUploadingAttachmentDrafts,
      deleteScheduledMessage,
      notifyCannotSendMessage,
      notifyTypingStopped,
      resolveComposerScheduledEditId,
      sendAttachmentMessageOptimistically,
      sendTextOnlyMessageOptimistically,
      setActiveComposerScheduledEditId,
      setActiveCurrentDraftSnapshot,
      setComposerAttachments,
      setComposerDraftDirty,
      setComposerDraftSeedPayload,
      setComposerDraftSeedValue,
      setComposerHasImmediateDraftText,
      setComposerResetKey,
      setComposerScheduledNotice,
      setComposerState,
      setUploadingAttachmentDraftsForMessage,
      syncScheduledHubCacheRecord,
      updateConversationMessages,
    ],
  );

  const handleRetryUploadingAttachment = useCallback(
    async (messageId: string, attachmentId: string) => {
      if (!activeRoomId) return false;

      const nextAttachment = resetUploadingAttachmentDraftForRetry(
        messageId,
        attachmentId,
      );
      if (!nextAttachment) return false;

      const uploadedCount = await uploadComposerAttachmentsToMessage({
        roomId: activeRoomId,
        messageId,
        attachments: [nextAttachment],
      });

      return uploadedCount > 0;
    },
    [
      activeRoomId,
      resetUploadingAttachmentDraftForRetry,
      uploadComposerAttachmentsToMessage,
    ],
  );

  const handleRemoveUploadingAttachment = useCallback(
    async (messageId: string, attachmentId: string) => {
      const { removedAttachment, remainingAttachments } =
        removeUploadingAttachmentDraft(messageId, attachmentId);
      if (!removedAttachment) return false;

      const targetMessage = messages.find((message) => message.id === messageId);
      const hasRemoteAttachments = Boolean(targetMessage?.attachments?.length);
      const hasVisibleContent = Boolean(
        targetMessage &&
          !targetMessage.isAttachmentPlaceholder &&
          targetMessage.content.trim().length > 0,
      );

      if (remainingAttachments.length === 0 && !hasRemoteAttachments && !hasVisibleContent) {
        if (messageId.startsWith('local-')) {
          dismissOptimisticConversationMessage(messageId);
          return true;
        }

        return handleDelete(messageId);
      }

      return true;
    },
    [
      dismissOptimisticConversationMessage,
      handleDelete,
      messages,
      removeUploadingAttachmentDraft,
    ],
  );

  return {
    handleRetryOptimisticMessage,
    handleSend,
    handleRetryUploadingAttachment,
    handleRemoveUploadingAttachment,
  };
}
