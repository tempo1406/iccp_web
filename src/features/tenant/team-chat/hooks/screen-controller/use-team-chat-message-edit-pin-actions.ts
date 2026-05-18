'use client';

import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { toast } from '@/lib/toast';
import type {
  ConversationKey,
  ConversationMessage,
} from '../../data/team-chat-ui-data';
import { mergeRoomHistoryItems } from '../../lib/team-chat-message-history.utils';
import type {
  TeamChatRoomMessageResponse,
  TeamChatToggleMessagePinResponse,
} from '../../services/types/team-chat.types';

interface InlineEditState {
  messageId: string;
  draft: string;
  allowsEmptyDraft: boolean;
  removedAttachmentIds: string[];
}

interface UpdateMessageResultLike {
  ok: boolean;
  data?: TeamChatRoomMessageResponse;
  error?: {
    message: string;
  };
}

interface TogglePinResultLike {
  ok: boolean;
  data?: TeamChatToggleMessagePinResponse;
  error?: {
    message: string;
  };
}

export function useTeamChatMessageEditPinActions(params: {
  activeRoomId: string;
  activeConversationKey: ConversationKey;
  messages: ConversationMessage[];
  inlineEditState: InlineEditState | null;
  canPinActiveConversationMessages: boolean;
  notifyCannotPinMessage: () => void;
  requestDeleteMessage: (messageId: string, source?: 'menu' | 'inline-edit-empty') => void;
  updateMessage: (params: {
    roomId: string;
    messageId: string;
    body: {
      content: string;
      contentFormat?: 'plain_text' | 'rich_text_v1';
      richContent?: Record<string, unknown>;
      removeAttachmentIds?: string[];
    };
  }) => Promise<UpdateMessageResultLike>;
  pinMessage: (params: {
    roomId: string;
    messageId: string;
  }) => Promise<TogglePinResultLike>;
  unpinMessage: (params: {
    roomId: string;
    messageId: string;
  }) => Promise<TogglePinResultLike>;
  updateRoomMessageHistory: (
    roomId: string,
    updater: (
      currentMessages: TeamChatRoomMessageResponse[],
    ) => TeamChatRoomMessageResponse[],
  ) => void;
  mapRoomMessageToConversationStreamMessage: (
    message: TeamChatRoomMessageResponse,
  ) => ConversationMessage;
  updateConversationMessages: (
    conversationKey: ConversationKey,
    updater: (currentMessages: ConversationMessage[]) => ConversationMessage[],
  ) => void;
  setInlineEditState: Dispatch<SetStateAction<InlineEditState | null>>;
}) {
  const {
    activeRoomId,
    activeConversationKey,
    messages,
    inlineEditState,
    canPinActiveConversationMessages,
    notifyCannotPinMessage,
    requestDeleteMessage,
    updateMessage,
    pinMessage,
    unpinMessage,
    updateRoomMessageHistory,
    mapRoomMessageToConversationStreamMessage,
    updateConversationMessages,
    setInlineEditState,
  } = params;

  const handleInlineEditRemoveAttachment = useCallback(
    (attachmentId: string) => {
      setInlineEditState((previous) => {
        if (!previous || previous.removedAttachmentIds.includes(attachmentId)) return previous;
        return {
          ...previous,
          removedAttachmentIds: [...previous.removedAttachmentIds, attachmentId],
        };
      });
    },
    [setInlineEditState],
  );

  const handleInlineEditSave = useCallback(
    async (draftValue: string) => {
      if (!inlineEditState) return;
      if (!activeRoomId) return;

      const nextContent = draftValue.trim();
      const editedMessage = messages.find(
        (message) => message.id === inlineEditState.messageId,
      );
      const remainingAttachmentCount = (editedMessage?.attachments ?? []).filter(
        (attachment) => !inlineEditState.removedAttachmentIds.includes(attachment.id),
      ).length;
      const allowsEmptyDraft = remainingAttachmentCount > 0;
      if (!nextContent && !allowsEmptyDraft) {
        requestDeleteMessage(inlineEditState.messageId, 'inline-edit-empty');
        return;
      }
      const shouldPreserveRichPayload =
        editedMessage?.contentFormat === 'rich_text_v1' &&
        Boolean(editedMessage.richContent) &&
        editedMessage.content.trim() === nextContent;

      const updateMessageResult = await updateMessage({
        roomId: activeRoomId,
        messageId: inlineEditState.messageId,
        body: {
          content: nextContent,
          contentFormat: shouldPreserveRichPayload ? 'rich_text_v1' : 'plain_text',
          ...(shouldPreserveRichPayload && editedMessage?.richContent
            ? { richContent: editedMessage.richContent }
            : {}),
          ...(inlineEditState.removedAttachmentIds.length
            ? { removeAttachmentIds: inlineEditState.removedAttachmentIds }
            : {}),
        },
      });

      if (!updateMessageResult.ok || !updateMessageResult.data) {
        toast.danger(updateMessageResult.error?.message ?? 'Unable to update message');
        return;
      }

      const removedAttachmentIdSet = new Set(inlineEditState.removedAttachmentIds);
      let normalizedUpdatedMessage = updateMessageResult.data;

      updateRoomMessageHistory(activeRoomId, (currentMessages) => {
        const previousMessage = currentMessages.find(
          (message) => message.id === inlineEditState.messageId,
        );
        const previousAttachments = Array.isArray(previousMessage?.attachments)
          ? previousMessage.attachments
          : undefined;
        const shouldHydrateRemovedAttachments =
          removedAttachmentIdSet.size > 0 &&
          !Array.isArray(normalizedUpdatedMessage.attachments) &&
          Array.isArray(previousAttachments);

        normalizedUpdatedMessage = {
          ...normalizedUpdatedMessage,
          ...(!shouldPreserveRichPayload
            ? {
                contentFormat: 'plain_text',
                richContent: null,
              }
            : {}),
          ...(shouldHydrateRemovedAttachments
            ? {
                attachments: previousAttachments.filter(
                  (attachment) => !removedAttachmentIdSet.has(attachment.id),
                ),
              }
            : {}),
        };

        return mergeRoomHistoryItems(currentMessages, [normalizedUpdatedMessage]);
      });

      const mappedMessage = mapRoomMessageToConversationStreamMessage(
        normalizedUpdatedMessage,
      );
      const resolvedEditedContent =
        mappedMessage.forwardedMessage
          ? nextContent
          : mappedMessage.content.trim().length > 0
            ? mappedMessage.content
            : nextContent;
      const resolvedAttachmentPlaceholder = resolvedEditedContent
        ? false
        : mappedMessage.isAttachmentPlaceholder;

      updateConversationMessages(activeConversationKey, (currentMessages) =>
        currentMessages.map((message) =>
          message.id === inlineEditState.messageId
            ? {
                ...message,
                content: resolvedEditedContent,
                time: mappedMessage.time,
                sentAt: mappedMessage.sentAt,
                messageType: mappedMessage.messageType,
                isSystem: mappedMessage.isSystem,
                isDeleted: mappedMessage.isDeleted,
                isEdited: mappedMessage.isEdited,
                contentFormat: mappedMessage.contentFormat,
                richContent: mappedMessage.richContent,
                quote: mappedMessage.quote,
                attachments: mappedMessage.attachments,
                imagePreview: mappedMessage.imagePreview,
                isAttachmentPlaceholder: resolvedAttachmentPlaceholder,
                forwardedMessage: mappedMessage.forwardedMessage,
                linkPreviews: mappedMessage.linkPreviews,
                linkPreview: mappedMessage.linkPreview,
                linkPreviewStatus: mappedMessage.linkPreviewStatus,
                linkPreviewPendingUrls: mappedMessage.linkPreviewPendingUrls,
                linkPreviewFailedUrls: mappedMessage.linkPreviewFailedUrls,
                linkPreviewVersion: mappedMessage.linkPreviewVersion,
              }
            : message,
        ),
      );
      setInlineEditState(null);
    },
    [
      activeConversationKey,
      activeRoomId,
      inlineEditState,
      mapRoomMessageToConversationStreamMessage,
      messages,
      requestDeleteMessage,
      setInlineEditState,
      updateConversationMessages,
      updateMessage,
      updateRoomMessageHistory,
    ],
  );

  const handleInlineEditCancel = useCallback(() => {
    setInlineEditState(null);
  }, [setInlineEditState]);

  const handleTogglePinMessage = useCallback(
    async (messageId: string, isPinned: boolean) => {
      if (!activeRoomId) return false;
      if (!canPinActiveConversationMessages) {
        notifyCannotPinMessage();
        return false;
      }

      const result = isPinned
        ? await unpinMessage({ roomId: activeRoomId, messageId })
        : await pinMessage({ roomId: activeRoomId, messageId });

      if (!result.ok) {
        toast.danger(result.error?.message ?? 'Unable to update pin state');
        return false;
      }

      return true;
    },
    [
      activeRoomId,
      canPinActiveConversationMessages,
      notifyCannotPinMessage,
      pinMessage,
      unpinMessage,
    ],
  );

  return {
    handleInlineEditRemoveAttachment,
    handleInlineEditSave,
    handleInlineEditCancel,
    handleTogglePinMessage,
  };
}
