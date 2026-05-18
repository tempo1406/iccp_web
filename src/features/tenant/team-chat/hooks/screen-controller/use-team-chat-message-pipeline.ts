'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import type { ChannelMember } from '../../data/team-chat-channel-details';
import type {
  ConversationKey,
  ConversationMessage,
  ConversationTab,
} from '../../data/team-chat-ui-data';
import type {
  ComposerAttachmentDraft,
  TeamChatComposerDraftPayload,
  UploadingAttachmentDraft,
} from '../../lib/team-chat-screen.shared';
import { teamChatQueryKeys } from '../../query/use-team-chat';
import {
  mergeRoomHistoryItems,
  type RoomMessageHistoryState,
} from '../../lib/team-chat-message-history.utils';
import { inferComposerAttachmentKind } from '../../lib/team-chat-media.utils';
import {
  compareConversationMessagesBySentAt,
  extractSpecialMentionMetadata,
  extractMentionedUserIds,
  formatMessageTime,
} from '../../lib/screen-controller/team-chat-controller-message.utils';
import { normalizeTeamChatComposerDraftPayload } from '../../lib/team-chat-composer-draft-payload.utils';
import {
  createTeamChatClientUploadId,
  shouldUseDirectTeamChatUpload,
} from '../../lib/team-chat-upload.utils';
import type {
  TeamChatMessageContentFormat,
  TeamChatMessageAttachmentResponse,
  TeamChatMessageCursorResponse,
  TeamChatResolvedMessageLinkPreviewResponse,
  TeamChatResolvedMessageContextResponse,
  TeamChatRoomMessageResponse,
} from '../../services/types/team-chat.types';
import type { TeamChatService } from '../../services/team-chat.service';

interface PendingLinkedMessageTarget {
  roomId: string;
  messageId: string;
}

interface SendMessagePayload {
  roomId: string;
  body: {
    content: string;
    contentFormat?: TeamChatMessageContentFormat;
    richContent?: Record<string, unknown>;
    messageType: 'text';
    clientMessageId: string;
    parentMessageId?: string;
    metadata?: {
      mentionedUserIds?: string[];
      specialMentions?: Array<{
        type: 'channel' | 'everyone' | string;
      }>;
      attachmentOnly?: boolean;
    };
  };
}

type SendMessageResult =
  | {
      ok: true;
      data: TeamChatRoomMessageResponse;
    }
  | {
      ok: false;
      error: {
        message: string;
      };
    };

const LINKED_MESSAGE_BACKFILL_MAX_PAGES = 20;

function splitLinkedMessageAuthorName(authorName?: string | null) {
  const normalizedAuthorName = authorName?.trim();
  if (!normalizedAuthorName) {
    return {
      firstName: null,
      lastName: null,
    };
  }

  const authorNameParts = normalizedAuthorName.split(/\s+/).filter(Boolean);
  if (authorNameParts.length <= 1) {
    return {
      firstName: normalizedAuthorName,
      lastName: null,
    };
  }

  return {
    firstName: authorNameParts.slice(0, -1).join(' '),
    lastName: authorNameParts[authorNameParts.length - 1] ?? null,
  };
}

function buildDeletedLinkedMessagePlaceholder(params: {
  roomId: string;
  messageId: string;
  preview: TeamChatResolvedMessageLinkPreviewResponse;
  fallbackSentAt?: string | null;
}): TeamChatRoomMessageResponse | null {
  const previewState = params.preview.state?.trim().toLowerCase();
  const previewMessage = params.preview.message;

  if (previewState !== 'message_deleted' && !previewMessage?.isDeleted) {
    return null;
  }

  const authorParts = splitLinkedMessageAuthorName(previewMessage?.authorName);
  const previewCreatedAt = previewMessage?.createdAt?.trim();
  const fallbackSentAt = params.fallbackSentAt?.trim();

  return {
    id: params.messageId,
    roomId: params.roomId,
    organizationId: '',
    senderId:
      previewMessage?.authorId?.trim() ||
      `linked-message-placeholder:${params.messageId}`,
    messageType: 'text',
    content: '',
    metadata: {
      source: 'linked-message-placeholder',
      linkedMessagePlaceholderState: 'message_deleted',
    },
    clientMessageId: null,
    parentMessageId: null,
    threadRootMessageId: null,
    replyPreview: null,
    forwardedSnapshot: null,
    isEdited: false,
    isDeleted: true,
    sentAt: previewCreatedAt || fallbackSentAt || new Date(0).toISOString(),
    senderEmail: null,
    senderFirstName: authorParts.firstName,
    senderLastName: authorParts.lastName,
    senderAvatarUrl: previewMessage?.authorAvatarUrl?.trim() || null,
    attachments: [],
    linkPreviews: [],
    reactionSummaries: [],
  };
}

export function useTeamChatMessagePipeline(params: {
  activeRoomId: string;
  activeConversationKey: ConversationKey;
  activeRoomMessages: TeamChatRoomMessageResponse[];
  activeRoomHistoryState: RoomMessageHistoryState | undefined;
  activeMessageCursorSnapshot: TeamChatMessageCursorResponse | undefined;
  pendingLinkedMessageTarget: PendingLinkedMessageTarget | null;
  linkedMessageContextWindow: {
    before: number;
    after: number;
  };
  messagesByConversation: Record<ConversationKey, ConversationMessage[]>;
  currentUserDisplayName: string;
  currentUserEmail: string | null;
  mentionContextKind: 'channel' | 'dm' | 'group_dm';
  readActiveChannelMembers: () => Pick<ChannelMember, 'id' | 'name'>[];
  queryClient: QueryClient;
  service: Pick<
    TeamChatService,
    | 'getMessageContext'
    | 'getMessageLinkPreview'
    | 'listMessagesByCursor'
    | 'uploadMessageAttachmentDirect'
    | 'uploadMessageAttachmentWithProgress'
  >;
  sendMessageRequest: (payload: SendMessagePayload) => Promise<SendMessageResult>;
  mapRoomMessageToConversationStreamMessage: (
    message: TeamChatRoomMessageResponse,
  ) => ConversationMessage;
  updateConversationMessages: (
    conversationKey: ConversationKey,
    updater: (currentMessages: ConversationMessage[]) => ConversationMessage[],
  ) => void;
  pendingLinkedMessageRequestIdRef: MutableRefObject<number>;
  setMessageHistoryByRoomId: Dispatch<
    SetStateAction<Record<string, RoomMessageHistoryState>>
  >;
  setUploadingAttachmentsByMessageId: Dispatch<
    SetStateAction<Record<string, UploadingAttachmentDraft[]>>
  >;
  setPendingLinkedMessageTarget: Dispatch<
    SetStateAction<PendingLinkedMessageTarget | null>
  >;
  setActiveTab: Dispatch<SetStateAction<ConversationTab>>;
  setHighlightedMessageId: Dispatch<SetStateAction<string | null>>;
  updateUploadingAttachmentDraft: (
    messageId: string,
    attachmentId: string,
    updater: (draft: UploadingAttachmentDraft) => UploadingAttachmentDraft,
  ) => void;
  revokeAttachmentPreviewUrl: (previewUrl?: string) => void;
}) {
  const {
    activeRoomId,
    activeConversationKey,
    activeRoomMessages,
    activeRoomHistoryState,
    activeMessageCursorSnapshot,
    pendingLinkedMessageTarget,
    linkedMessageContextWindow,
    messagesByConversation,
    currentUserDisplayName,
    currentUserEmail,
    mentionContextKind,
    readActiveChannelMembers,
    queryClient,
    service,
    sendMessageRequest,
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
  } = params;

  useEffect(() => {
    const cursorPage = activeMessageCursorSnapshot;
    if (!activeRoomId || !cursorPage) return;

    setMessageHistoryByRoomId((previous) => {
      const roomHistory = previous[activeRoomId];
      return {
        ...previous,
        [activeRoomId]: {
          items: mergeRoomHistoryItems(roomHistory?.items ?? [], cursorPage.items),
          hasMore: cursorPage.hasMore,
          nextCursor: cursorPage.nextCursor ?? null,
          isLoadingOlder: roomHistory?.isLoadingOlder ?? false,
        },
      };
    });
  }, [activeMessageCursorSnapshot, activeRoomId, setMessageHistoryByRoomId]);

  const updateRoomMessageHistory = useCallback(
    (
      roomId: string,
      updater: (
        currentMessages: TeamChatRoomMessageResponse[],
      ) => TeamChatRoomMessageResponse[],
    ) => {
      if (!roomId) return;
      setMessageHistoryByRoomId((previous) => {
        const roomHistory = previous[roomId];
        const fallbackPage =
          roomId === activeRoomId ? activeMessageCursorSnapshot : undefined;
        const nextItems = mergeRoomHistoryItems(
          [],
          updater(roomHistory?.items ?? fallbackPage?.items ?? []),
        );
        return {
          ...previous,
          [roomId]: {
            items: nextItems,
            hasMore: roomHistory?.hasMore ?? fallbackPage?.hasMore ?? false,
            nextCursor: roomHistory?.nextCursor ?? fallbackPage?.nextCursor ?? null,
            isLoadingOlder: roomHistory?.isLoadingOlder ?? false,
          },
        };
      });
    },
    [activeMessageCursorSnapshot, activeRoomId, setMessageHistoryByRoomId],
  );

  const applyMessageContextToRoomHistory = useCallback(
    (roomId: string, context: TeamChatResolvedMessageContextResponse) => {
      if (!roomId) return;

      setMessageHistoryByRoomId((previous) => {
        const roomHistory = previous[roomId];
        const fallbackPage =
          roomId === activeRoomId ? activeMessageCursorSnapshot : undefined;
        const nextItems = mergeRoomHistoryItems(
          roomHistory?.items ?? fallbackPage?.items ?? [],
          context.items ?? [],
        );

        return {
          ...previous,
          [roomId]: {
            items: nextItems,
            hasMore:
              context.hasOlder ?? roomHistory?.hasMore ?? fallbackPage?.hasMore ?? false,
            nextCursor:
              context.olderCursor ??
              roomHistory?.nextCursor ??
              fallbackPage?.nextCursor ??
              null,
            isLoadingOlder: roomHistory?.isLoadingOlder ?? false,
          },
        };
      });
    },
    [activeMessageCursorSnapshot, activeRoomId, setMessageHistoryByRoomId],
  );

  const loadMessageContextForRoom = useCallback(
    async (
      roomId: string,
      messageId: string,
      options?: {
        forceFresh?: boolean;
        injectDeletedPlaceholder?: boolean;
      },
    ) => {
      if (!roomId || !messageId) return null;

      const response = await queryClient.fetchQuery({
        queryKey: teamChatQueryKeys.messageContext(
          roomId,
          messageId,
          linkedMessageContextWindow,
        ),
        queryFn: () =>
          service.getMessageContext(roomId, messageId, linkedMessageContextWindow),
        staleTime: options?.forceFresh ? 0 : 30_000,
      });

      let normalizedResponse = response;
      const normalizedState = response.state?.trim().toLowerCase();
      const responseItems = response.items ?? [];
      const hasRequestedMessage =
        response.items?.some((item) => item.id === messageId) ?? false;

      if (
        options?.injectDeletedPlaceholder &&
        normalizedState === 'message_deleted' &&
        !hasRequestedMessage
      ) {
        try {
          const linkPreview = await queryClient.fetchQuery({
            queryKey: teamChatQueryKeys.messageLinkPreview(roomId, messageId),
            queryFn: () => service.getMessageLinkPreview(roomId, messageId),
            staleTime: options.forceFresh ? 0 : 30_000,
          });
          const deletedPlaceholder = buildDeletedLinkedMessagePlaceholder({
            roomId,
            messageId,
            preview: linkPreview,
            fallbackSentAt:
              responseItems.find((item) => item.id === response.targetMessageId)
                ?.sentAt ??
              responseItems[responseItems.length - 1]?.sentAt ??
              responseItems[0]?.sentAt ??
              null,
          });

          if (deletedPlaceholder) {
            normalizedResponse = {
              ...response,
              items: mergeRoomHistoryItems(responseItems, [deletedPlaceholder]),
            };
          }
        } catch {
          // Fall back to the original context payload when the lightweight preview lookup fails.
        }
      }

      if ((normalizedResponse.items?.length ?? 0) > 0) {
        applyMessageContextToRoomHistory(roomId, normalizedResponse);
      }

      return normalizedResponse;
    },
    [applyMessageContextToRoomHistory, linkedMessageContextWindow, queryClient, service],
  );

  const queuePendingLinkedMessage = useCallback(
    (roomId: string, messageId?: string) => {
      const normalizedRoomId = roomId.trim();
      const normalizedMessageId = messageId?.trim() ?? '';
      if (!normalizedRoomId || !normalizedMessageId) return;

      setPendingLinkedMessageTarget((previous) =>
        previous?.roomId === normalizedRoomId &&
        previous.messageId === normalizedMessageId
          ? previous
          : {
              roomId: normalizedRoomId,
              messageId: normalizedMessageId,
            },
      );
    },
    [setPendingLinkedMessageTarget],
  );

  const loadOlderMessagesByCursor = useCallback(
    async (options?: { cursor?: string | null; limit?: number }) => {
      if (!activeRoomId) return null;

      const cursor = options?.cursor ?? activeRoomHistoryState?.nextCursor ?? null;
      if (!cursor && options?.cursor !== undefined) {
        return null;
      }

      setMessageHistoryByRoomId((previous) => ({
        ...previous,
        [activeRoomId]: {
          items: previous[activeRoomId]?.items ?? activeRoomMessages,
          hasMore:
            previous[activeRoomId]?.hasMore ??
            activeMessageCursorSnapshot?.hasMore ??
            false,
          nextCursor:
            previous[activeRoomId]?.nextCursor ??
            activeMessageCursorSnapshot?.nextCursor ??
            null,
          isLoadingOlder: true,
        },
      }));

      try {
        const response = await service.listMessagesByCursor(activeRoomId, {
          limit: options?.limit ?? 50,
          ...(cursor ? { cursor } : {}),
        });

        setMessageHistoryByRoomId((previous) => {
          const roomHistory = previous[activeRoomId];
          return {
            ...previous,
            [activeRoomId]: {
              items: mergeRoomHistoryItems(
                roomHistory?.items ?? activeRoomMessages,
                response.items,
              ),
              hasMore: response.hasMore,
              nextCursor: response.nextCursor ?? null,
              isLoadingOlder: false,
            },
          };
        });

        return response;
      } catch (error) {
        setMessageHistoryByRoomId((previous) => {
          const roomHistory = previous[activeRoomId];
          if (!roomHistory) return previous;

          return {
            ...previous,
            [activeRoomId]: {
              ...roomHistory,
              isLoadingOlder: false,
            },
          };
        });

        if (error instanceof Error && /invalid cursor/i.test(error.message)) {
          void queryClient.invalidateQueries({
            queryKey: teamChatQueryKeys.messageCursorRoot(activeRoomId),
          });
          toast.warning('Message history cursor expired, reloading latest messages');
        }

        throw error;
      }
    },
    [
      activeMessageCursorSnapshot?.hasMore,
      activeMessageCursorSnapshot?.nextCursor,
      activeRoomHistoryState?.nextCursor,
      activeRoomId,
      activeRoomMessages,
      queryClient,
      service,
      setMessageHistoryByRoomId,
    ],
  );

  const handleLoadOlderMessages = useCallback(async () => {
    if (!activeRoomHistoryState?.hasMore || activeRoomHistoryState.isLoadingOlder)
      return false;

    try {
      await loadOlderMessagesByCursor();
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to load older messages right now';
      toast.warning(errorMessage);
      return false;
    }
  }, [activeRoomHistoryState, loadOlderMessagesByCursor]);

  const createTeamChatClientMessageId = useCallback(
    () => `web-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    [],
  );

  const createOptimisticLocalMessageId = useCallback(
    () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    [],
  );

  const buildOptimisticReplyQuote = useCallback(
    (sourceMessage?: ConversationMessage | null): ConversationMessage['quote'] => {
      if (!sourceMessage) return undefined;

      return {
        author: sourceMessage.quote?.author ?? sourceMessage.author,
        time: sourceMessage.quote?.time ?? sourceMessage.time,
        content:
          sourceMessage.isAttachmentPlaceholder ||
          (sourceMessage.content.trim().toLowerCase() === 'attachment' &&
            sourceMessage.attachments?.length)
            ? 'Media attachment'
            : (sourceMessage.quote?.content ?? sourceMessage.content),
      };
    },
    [],
  );

  const createOptimisticConversationMessage = useCallback(
    (options: {
      localMessageId: string;
      clientMessageId: string;
      payload: TeamChatComposerDraftPayload;
      parentMessageId?: string;
      quote?: ConversationMessage['quote'];
      isAttachmentPlaceholder?: boolean;
    }): ConversationMessage => {
      const sentAt = new Date().toISOString();
      const author = currentUserDisplayName || currentUserEmail || 'You';
      const handleSeed = currentUserEmail ?? author;
      const normalizedPayload = normalizeTeamChatComposerDraftPayload(options.payload);

      return {
        id: options.localMessageId,
        clientMessageId: options.clientMessageId,
        parentMessageId: options.parentMessageId,
        author,
        handle: (handleSeed.split('@')[0] ?? 'user').trim() || 'user',
        time: formatMessageTime(sentAt),
        sentAt,
        messageType: 'text',
        content: normalizedPayload.content,
        contentFormat: normalizedPayload.contentFormat,
        richContent: normalizedPayload.richContent ?? null,
        avatarUrl: undefined,
        isOwn: true,
        quote: options.quote,
        reactions: [],
        attachments: [],
        isPinned: false,
        linkPreviews: [],
        linkPreviewPendingUrls: [],
        linkPreviewFailedUrls: [],
        isAttachmentPlaceholder: options.isAttachmentPlaceholder ?? false,
        deliveryStatus: 'sending',
        isOptimistic: true,
      };
    },
    [currentUserDisplayName, currentUserEmail],
  );

  const buildOutgoingMessageMetadata = useCallback(
    (
      payload: TeamChatComposerDraftPayload,
      options?: {
        attachmentOnly?: boolean;
      },
    ) => {
      const mentionedUserIds = extractMentionedUserIds(
        payload.content,
        readActiveChannelMembers(),
        payload.richContent ?? null,
      );
      const specialMentions = extractSpecialMentionMetadata(
        payload.content,
        mentionContextKind,
        payload.richContent ?? null,
      );
      const nextMetadata = {
        ...(mentionedUserIds.length > 0 ? { mentionedUserIds } : {}),
        ...(specialMentions.length > 0 ? { specialMentions } : {}),
        ...(options?.attachmentOnly ? { attachmentOnly: true } : {}),
      };

      return Object.keys(nextMetadata).length > 0 ? nextMetadata : undefined;
    },
    [mentionContextKind, readActiveChannelMembers],
  );

  const replaceOptimisticConversationMessage = useCallback(
    (options: {
      conversationKey: ConversationKey;
      localMessageId: string;
      clientMessageId: string;
      nextMessage: ConversationMessage;
    }) => {
      updateConversationMessages(options.conversationKey, (currentMessages) => {
        let replaced = false;
        const nextMessages = currentMessages.map((message) => {
          const matchesOptimisticMessage =
            message.id === options.localMessageId ||
            (Boolean(options.clientMessageId) &&
              message.clientMessageId === options.clientMessageId);

          if (!matchesOptimisticMessage) return message;
          replaced = true;
          return options.nextMessage;
        });

        const dedupedMessages = nextMessages.filter(
          (message, index, collection) =>
            collection.findIndex((candidate) => candidate.id === message.id) === index,
        );

        if (!replaced) {
          dedupedMessages.push(options.nextMessage);
        }

        return dedupedMessages.sort(compareConversationMessagesBySentAt);
      });
    },
    [updateConversationMessages],
  );

  const markOptimisticConversationMessageFailed = useCallback(
    (options: {
      conversationKey: ConversationKey;
      localMessageId: string;
      clientMessageId: string;
      errorMessage: string;
    }) => {
      updateConversationMessages(options.conversationKey, (currentMessages) =>
        currentMessages.map((message) => {
          const matchesOptimisticMessage =
            message.id === options.localMessageId ||
            (Boolean(options.clientMessageId) &&
              message.clientMessageId === options.clientMessageId);

          if (!matchesOptimisticMessage) return message;

          return {
            ...message,
            clientMessageId: options.clientMessageId,
            deliveryStatus: 'failed',
            isOptimistic: true,
            errorMessage: options.errorMessage,
          };
        }),
      );
    },
    [updateConversationMessages],
  );

  const dismissOptimisticConversationMessage = useCallback(
    (messageId: string) => {
      if (!messageId.startsWith('local-')) return;

      setUploadingAttachmentsByMessageId((previous) => {
        const currentAttachments = previous[messageId];
        currentAttachments?.forEach((attachment) => {
          revokeAttachmentPreviewUrl(attachment.previewUrl);
        });

        if (!currentAttachments) return previous;
        const nextValue = { ...previous };
        delete nextValue[messageId];
        return nextValue;
      });

      updateConversationMessages(activeConversationKey, (currentMessages) =>
        currentMessages.filter((message) => message.id !== messageId),
      );
    },
    [
      activeConversationKey,
      revokeAttachmentPreviewUrl,
      setUploadingAttachmentsByMessageId,
      updateConversationMessages,
    ],
  );

  const createUploadingAttachmentDrafts = useCallback(
    (attachments: ComposerAttachmentDraft[]): UploadingAttachmentDraft[] =>
      attachments.map((attachment) => ({
        id: attachment.id,
        file: attachment.file,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        attachmentType: attachment.attachmentType,
        fileSizeLabel: attachment.fileSizeLabel,
        previewUrl: attachment.previewUrl,
        progress: 0,
        status: 'uploading',
        clientUploadId: undefined,
        attemptCount: 0,
        width: attachment.width,
        height: attachment.height,
        durationMs: attachment.durationMs,
        error: undefined,
      })),
    [],
  );

  const setUploadingAttachmentDraftsForMessage = useCallback(
    (messageId: string, drafts: UploadingAttachmentDraft[]) => {
      setUploadingAttachmentsByMessageId((previous) => ({
        ...previous,
        [messageId]: drafts,
      }));
    },
    [setUploadingAttachmentsByMessageId],
  );

  const moveUploadingAttachmentDraftsToMessage = useCallback(
    (sourceMessageId: string, targetMessageId: string) => {
      if (!sourceMessageId || !targetMessageId || sourceMessageId === targetMessageId)
        return;

      setUploadingAttachmentsByMessageId((previous) => {
        const sourceAttachments = previous[sourceMessageId];
        if (!sourceAttachments?.length) return previous;

        const nextValue = { ...previous };
        delete nextValue[sourceMessageId];
        nextValue[targetMessageId] = sourceAttachments;
        return nextValue;
      });
    },
    [setUploadingAttachmentsByMessageId],
  );

  const markUploadingAttachmentDraftsFailed = useCallback(
    (messageId: string, errorMessage: string) => {
      setUploadingAttachmentsByMessageId((previous) => {
        const currentAttachments = previous[messageId];
        if (!currentAttachments?.length) return previous;

        return {
          ...previous,
          [messageId]: currentAttachments.map((attachment) => ({
            ...attachment,
            status: 'failed',
            error: errorMessage,
          })),
        };
      });
    },
    [setUploadingAttachmentsByMessageId],
  );

  const resetUploadingAttachmentDraftsForRetry = useCallback(
    (messageId: string) => {
      let nextDrafts: UploadingAttachmentDraft[] = [];

      setUploadingAttachmentsByMessageId((previous) => {
        const currentAttachments = previous[messageId];
        if (!currentAttachments?.length) return previous;

        nextDrafts = currentAttachments.map((attachment) => ({
          ...attachment,
          progress: 0,
          status: 'uploading',
          error: undefined,
        }));

        return {
          ...previous,
          [messageId]: nextDrafts,
        };
      });

      return nextDrafts;
    },
    [setUploadingAttachmentsByMessageId],
  );

  const resetUploadingAttachmentDraftForRetry = useCallback(
    (messageId: string, attachmentId: string) => {
      let nextDraft: UploadingAttachmentDraft | null = null;

      setUploadingAttachmentsByMessageId((previous) => {
        const currentAttachments = previous[messageId];
        if (!currentAttachments?.length) return previous;

        let changed = false;
        const nextAttachments = currentAttachments.map((attachment) => {
          if (attachment.id !== attachmentId || attachment.status !== 'failed') {
            return attachment;
          }

          changed = true;
          nextDraft = {
            ...attachment,
            progress: 0,
            status: 'uploading',
            error: undefined,
          };
          return nextDraft;
        });

        if (!changed) return previous;

        return {
          ...previous,
          [messageId]: nextAttachments,
        };
      });

      return nextDraft;
    },
    [setUploadingAttachmentsByMessageId],
  );

  const removeUploadingAttachmentDraft = useCallback(
    (messageId: string, attachmentId: string) => {
      let removedAttachment: UploadingAttachmentDraft | null = null;
      let remainingAttachments: UploadingAttachmentDraft[] = [];

      setUploadingAttachmentsByMessageId((previous) => {
        const currentAttachments = previous[messageId];
        if (!currentAttachments?.length) return previous;

        remainingAttachments = currentAttachments.filter((attachment) => {
          const shouldKeep = attachment.id !== attachmentId;
          if (!shouldKeep) {
            removedAttachment = attachment;
          }
          return shouldKeep;
        });

        if (!removedAttachment) return previous;

        if (remainingAttachments.length === 0) {
          const nextValue = { ...previous };
          delete nextValue[messageId];
          return nextValue;
        }

        return {
          ...previous,
          [messageId]: remainingAttachments,
        };
      });

      const removedAttachmentRecord =
        removedAttachment as UploadingAttachmentDraft | null;
      revokeAttachmentPreviewUrl(removedAttachmentRecord?.previewUrl);
      return {
        removedAttachment,
        remainingAttachments,
      };
    },
    [revokeAttachmentPreviewUrl, setUploadingAttachmentsByMessageId],
  );

  const appendUploadedAttachmentToRoomHistory = useCallback(
    (options: {
      roomId: string;
      messageId: string;
      attachment: TeamChatMessageAttachmentResponse;
    }) => {
      updateRoomMessageHistory(options.roomId, (currentMessages) =>
        currentMessages.map((message) => {
          if (message.id !== options.messageId) return message;

          const currentAttachments = message.attachments ?? [];
          if (
            currentAttachments.some(
              (attachment) => attachment.id === options.attachment.id,
            )
          ) {
            return message;
          }

          return {
            ...message,
            attachments: [...currentAttachments, options.attachment],
          };
        }),
      );
    },
    [updateRoomMessageHistory],
  );

  const finalizeUploadedAttachmentDrafts = useCallback(
    async (options: {
      roomId: string;
      messageId: string;
      attachments: UploadingAttachmentDraft[];
    }) => {
      if (!options.attachments.length) return;

      await queryClient.invalidateQueries({
        queryKey: ['teamChat', 'attachments', 'room', options.roomId],
      });

      options.attachments.forEach((attachment) => {
        revokeAttachmentPreviewUrl(attachment.previewUrl);
      });

      setUploadingAttachmentsByMessageId((previous) => {
        const currentAttachments = previous[options.messageId] ?? [];
        const completedAttachmentIds = new Set(
          options.attachments.map((attachment) => attachment.id),
        );
        const remainingAttachments = currentAttachments.filter(
          (attachment) => !completedAttachmentIds.has(attachment.id),
        );

        if (remainingAttachments.length === currentAttachments.length) {
          return previous;
        }

        if (remainingAttachments.length === 0) {
          const nextValue = { ...previous };
          delete nextValue[options.messageId];
          return nextValue;
        }

        return {
          ...previous,
          [options.messageId]: remainingAttachments,
        };
      });
    },
    [queryClient, revokeAttachmentPreviewUrl, setUploadingAttachmentsByMessageId],
  );

  const uploadSingleAttachmentToMessage = useCallback(
    async (options: {
      roomId: string;
      messageId: string;
      attachment: UploadingAttachmentDraft;
    }) => {
      try {
        const clientUploadId = createTeamChatClientUploadId();
        updateUploadingAttachmentDraft(
          options.messageId,
          options.attachment.id,
          (draftAttachment) => ({
            ...draftAttachment,
            clientUploadId,
            attemptCount: (draftAttachment.attemptCount ?? 0) + 1,
            progress: 0,
            status: 'uploading',
            error: undefined,
          }),
        );

        const uploadBody = {
          file: options.attachment.file,
          fileName: options.attachment.fileName,
          attachmentType: inferComposerAttachmentKind(options.attachment.file),
          clientUploadId,
          width: options.attachment.width,
          height: options.attachment.height,
          durationMs: options.attachment.durationMs,
        };
        const uploadedAttachment = shouldUseDirectTeamChatUpload(options.attachment.file)
          ? await service.uploadMessageAttachmentDirect(
              options.roomId,
              options.messageId,
              uploadBody,
              {
                onProgress: ({ percent }) => {
                  updateUploadingAttachmentDraft(
                    options.messageId,
                    options.attachment.id,
                    (draftAttachment) => ({
                      ...draftAttachment,
                      progress: percent,
                    }),
                  );
                },
              },
            )
          : await service.uploadMessageAttachmentWithProgress(
              options.roomId,
              options.messageId,
              uploadBody,
              {
                onProgress: ({ percent }) => {
                  updateUploadingAttachmentDraft(
                    options.messageId,
                    options.attachment.id,
                    (draftAttachment) => ({
                      ...draftAttachment,
                      progress: percent,
                    }),
                  );
                },
              },
            );

        appendUploadedAttachmentToRoomHistory({
          roomId: options.roomId,
          messageId: options.messageId,
          attachment: uploadedAttachment,
        });
        updateUploadingAttachmentDraft(
          options.messageId,
          options.attachment.id,
          (draftAttachment) => ({
            ...draftAttachment,
            progress: 100,
            error: undefined,
          }),
        );

        return {
          ok: true,
          uploadedAttachment,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        updateUploadingAttachmentDraft(
          options.messageId,
          options.attachment.id,
          (draftAttachment) => ({
            ...draftAttachment,
            status: 'failed',
            error: errorMessage,
          }),
        );
        toast.danger(`Failed to upload ${options.attachment.fileName}: ${errorMessage}`);
        return {
          ok: false,
          errorMessage,
        };
      }
    },
    [appendUploadedAttachmentToRoomHistory, service, updateUploadingAttachmentDraft],
  );

  const uploadComposerAttachmentsToMessage = useCallback(
    async (options: {
      roomId: string;
      messageId: string;
      attachments: UploadingAttachmentDraft[];
    }) => {
      const uploadedAttachments: UploadingAttachmentDraft[] = [];

      for (const attachment of options.attachments) {
        const result = await uploadSingleAttachmentToMessage({
          roomId: options.roomId,
          messageId: options.messageId,
          attachment,
        });

        if (result.ok) {
          uploadedAttachments.push(attachment);
        }
      }

      if (uploadedAttachments.length > 0) {
        await finalizeUploadedAttachmentDrafts({
          roomId: options.roomId,
          messageId: options.messageId,
          attachments: uploadedAttachments,
        });
      }

      return uploadedAttachments.length;
    },
    [finalizeUploadedAttachmentDrafts, uploadSingleAttachmentToMessage],
  );

  const sendAttachmentMessageOptimistically = useCallback(
    async (options: {
      payload: TeamChatComposerDraftPayload;
      localMessageId: string;
      clientMessageId: string;
      parentMessageId?: string;
      optimisticQuote?: ConversationMessage['quote'];
      isAttachmentOnlyMessage: boolean;
      uploadingAttachments: UploadingAttachmentDraft[];
    }) => {
      if (!activeRoomId) return false;

      const normalizedPayload = normalizeTeamChatComposerDraftPayload(options.payload);
      const messageMetadata = buildOutgoingMessageMetadata(normalizedPayload, {
        attachmentOnly: options.isAttachmentOnlyMessage,
      });

      try {
        const sendMessageResult = await sendMessageRequest({
          roomId: activeRoomId,
          body: {
            content: normalizedPayload.content || 'Attachment',
            contentFormat: normalizedPayload.contentFormat,
            ...(normalizedPayload.contentFormat === 'rich_text_v1' &&
            normalizedPayload.richContent
              ? { richContent: normalizedPayload.richContent }
              : {}),
            messageType: 'text',
            clientMessageId: options.clientMessageId,
            parentMessageId: options.parentMessageId,
            metadata: messageMetadata,
          },
        });

        if (!sendMessageResult.ok) {
          markOptimisticConversationMessageFailed({
            conversationKey: activeConversationKey,
            localMessageId: options.localMessageId,
            clientMessageId: options.clientMessageId,
            errorMessage: sendMessageResult.error.message,
          });
          markUploadingAttachmentDraftsFailed(
            options.localMessageId,
            sendMessageResult.error.message,
          );
          toast.danger(sendMessageResult.error.message);
          return false;
        }

        const createdMessage = sendMessageResult.data;
        updateRoomMessageHistory(activeRoomId, (currentMessages) =>
          mergeRoomHistoryItems(currentMessages, [createdMessage]),
        );
        const mappedMessage = mapRoomMessageToConversationStreamMessage(createdMessage);
        const messageForStream = options.optimisticQuote
          ? {
              ...mappedMessage,
              quote: mappedMessage.quote ?? options.optimisticQuote,
            }
          : mappedMessage;

        replaceOptimisticConversationMessage({
          conversationKey: activeConversationKey,
          localMessageId: options.localMessageId,
          clientMessageId: options.clientMessageId,
          nextMessage: messageForStream,
        });
        moveUploadingAttachmentDraftsToMessage(options.localMessageId, createdMessage.id);

        await uploadComposerAttachmentsToMessage({
          roomId: activeRoomId,
          messageId: createdMessage.id,
          attachments: options.uploadingAttachments,
        });

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unable to send message';
        markOptimisticConversationMessageFailed({
          conversationKey: activeConversationKey,
          localMessageId: options.localMessageId,
          clientMessageId: options.clientMessageId,
          errorMessage,
        });
        markUploadingAttachmentDraftsFailed(options.localMessageId, errorMessage);
        toast.danger(errorMessage);
        return false;
      }
    },
    [
      activeConversationKey,
      activeRoomId,
      mapRoomMessageToConversationStreamMessage,
      markOptimisticConversationMessageFailed,
      markUploadingAttachmentDraftsFailed,
      moveUploadingAttachmentDraftsToMessage,
      replaceOptimisticConversationMessage,
      buildOutgoingMessageMetadata,
      sendMessageRequest,
      updateRoomMessageHistory,
      uploadComposerAttachmentsToMessage,
    ],
  );

  const sendTextOnlyMessageOptimistically = useCallback(
    async (options: {
      payload: TeamChatComposerDraftPayload;
      localMessageId: string;
      clientMessageId: string;
      parentMessageId?: string;
      optimisticQuote?: ConversationMessage['quote'];
    }) => {
      if (!activeRoomId) return false;

      const normalizedPayload = normalizeTeamChatComposerDraftPayload(options.payload);
      const messageMetadata = buildOutgoingMessageMetadata(normalizedPayload);

      try {
        const sendMessageResult = await sendMessageRequest({
          roomId: activeRoomId,
          body: {
            content: normalizedPayload.content,
            contentFormat: normalizedPayload.contentFormat,
            ...(normalizedPayload.contentFormat === 'rich_text_v1' &&
            normalizedPayload.richContent
              ? { richContent: normalizedPayload.richContent }
              : {}),
            messageType: 'text',
            clientMessageId: options.clientMessageId,
            parentMessageId: options.parentMessageId,
            metadata: messageMetadata,
          },
        });

        if (!sendMessageResult.ok) {
          markOptimisticConversationMessageFailed({
            conversationKey: activeConversationKey,
            localMessageId: options.localMessageId,
            clientMessageId: options.clientMessageId,
            errorMessage: sendMessageResult.error.message,
          });
          toast.danger(sendMessageResult.error.message);
          return false;
        }

        const createdMessage = sendMessageResult.data;
        updateRoomMessageHistory(activeRoomId, (currentMessages) =>
          mergeRoomHistoryItems(currentMessages, [createdMessage]),
        );
        const mappedMessage = mapRoomMessageToConversationStreamMessage(createdMessage);
        const messageForStream = options.optimisticQuote
          ? {
              ...mappedMessage,
              quote: mappedMessage.quote ?? options.optimisticQuote,
            }
          : mappedMessage;

        replaceOptimisticConversationMessage({
          conversationKey: activeConversationKey,
          localMessageId: options.localMessageId,
          clientMessageId: options.clientMessageId,
          nextMessage: messageForStream,
        });

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unable to send message';
        markOptimisticConversationMessageFailed({
          conversationKey: activeConversationKey,
          localMessageId: options.localMessageId,
          clientMessageId: options.clientMessageId,
          errorMessage,
        });
        toast.danger(errorMessage);
        return false;
      }
    },
    [
      activeConversationKey,
      activeRoomId,
      mapRoomMessageToConversationStreamMessage,
      markOptimisticConversationMessageFailed,
      readActiveChannelMembers,
      replaceOptimisticConversationMessage,
      sendMessageRequest,
      updateRoomMessageHistory,
      buildOutgoingMessageMetadata,
    ],
  );

  const ensureMessageLoadedInActiveRoom = useCallback(
    async (messageId: string) => {
      const isMessageLoaded = () =>
        (messagesByConversation[activeConversationKey] ?? []).some(
          (message) => message.id === messageId,
        ) ||
        activeRoomMessages.some((message) => message.id === messageId) ||
        Boolean(
          activeMessageCursorSnapshot?.items?.some((message) => message.id === messageId),
        );

      if (!activeRoomId) return true;
      if (isMessageLoaded()) return true;

      let nextCursor =
        activeRoomHistoryState?.nextCursor ??
        activeMessageCursorSnapshot?.nextCursor ??
        null;
      let hasMore =
        activeRoomHistoryState?.hasMore ?? activeMessageCursorSnapshot?.hasMore ?? false;
      let backfillPageCount = 0;

      while (
        hasMore &&
        nextCursor &&
        backfillPageCount < LINKED_MESSAGE_BACKFILL_MAX_PAGES
      ) {
        try {
          const response = await loadOlderMessagesByCursor({
            cursor: nextCursor,
            limit: 100,
          });
          if (!response) break;
          backfillPageCount += 1;
          if (response.items.some((message) => message.id === messageId)) {
            return true;
          }
          if (isMessageLoaded()) {
            return true;
          }

          if (
            !response.hasMore ||
            !response.nextCursor ||
            response.nextCursor === nextCursor
          ) {
            break;
          }

          nextCursor = response.nextCursor;
          hasMore = response.hasMore;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unable to load message history';
          toast.warning(errorMessage);
          break;
        }
      }

      return false;
    },
    [
      activeConversationKey,
      activeMessageCursorSnapshot?.items,
      activeMessageCursorSnapshot?.hasMore,
      activeMessageCursorSnapshot?.nextCursor,
      activeRoomHistoryState?.hasMore,
      activeRoomHistoryState?.nextCursor,
      activeRoomId,
      activeRoomMessages,
      loadOlderMessagesByCursor,
      messagesByConversation,
    ],
  );

  const ensureMessageLoadedInActiveRoomRef = useRef(ensureMessageLoadedInActiveRoom);
  useEffect(() => {
    ensureMessageLoadedInActiveRoomRef.current = ensureMessageLoadedInActiveRoom;
  }, [ensureMessageLoadedInActiveRoom]);

  const loadMessageContextForRoomRef = useRef(loadMessageContextForRoom);
  useEffect(() => {
    loadMessageContextForRoomRef.current = loadMessageContextForRoom;
  }, [loadMessageContextForRoom]);

  useEffect(() => {
    if (!pendingLinkedMessageTarget) return;
    if (activeRoomId !== pendingLinkedMessageTarget.roomId) return;

    let disposed = false;
    const requestId = pendingLinkedMessageRequestIdRef.current + 1;
    pendingLinkedMessageRequestIdRef.current = requestId;

    void (async () => {
      const requestedMessageId = pendingLinkedMessageTarget.messageId;
      let resolvedMessageId = requestedMessageId;
      let resolvedContextState: string | null = null;
      let messageLoaded =
        await ensureMessageLoadedInActiveRoomRef.current(requestedMessageId);
      if (disposed || pendingLinkedMessageRequestIdRef.current !== requestId) return;

      if (!messageLoaded) {
        try {
          const messageContext = await loadMessageContextForRoomRef.current(
            pendingLinkedMessageTarget.roomId,
            requestedMessageId,
            {
              forceFresh: true,
              injectDeletedPlaceholder: true,
            },
          );
          if (disposed || pendingLinkedMessageRequestIdRef.current !== requestId) return;

          const contextState = messageContext?.state?.trim().toLowerCase();
          resolvedContextState = contextState ?? null;
          const contextTargetMessageId = messageContext?.targetMessageId?.trim();
          const contextItems = messageContext?.items ?? [];
          const contextHasRequestedMessage = contextItems.some(
            (message) => message.id === requestedMessageId,
          );

          if (contextState === 'ready' && contextTargetMessageId) {
            resolvedMessageId = contextTargetMessageId;
          }
          if (contextState === 'message_deleted') {
            resolvedMessageId = requestedMessageId;
          }

          if (contextState === 'forbidden') {
            setPendingLinkedMessageTarget((previous) =>
              previous?.roomId === pendingLinkedMessageTarget.roomId &&
              previous.messageId === requestedMessageId
                ? null
                : previous,
            );
            toast.warning('This original message is no longer accessible.');
            return;
          }

          if (contextState === 'message_not_found') {
            setPendingLinkedMessageTarget((previous) =>
              previous?.roomId === pendingLinkedMessageTarget.roomId &&
              previous.messageId === requestedMessageId
                ? null
                : previous,
            );
            toast.warning('This original message was deleted.');
            return;
          }

          if (
            (contextState === 'ready' &&
              contextItems.some((message) => message.id === resolvedMessageId)) ||
            (contextState === 'message_deleted' && contextHasRequestedMessage)
          ) {
            messageLoaded = true;
          }
        } catch {
          // Fall back to cursor-based backfill when the context API is unavailable.
        }
      }

      if (!messageLoaded) {
        messageLoaded =
          await ensureMessageLoadedInActiveRoomRef.current(resolvedMessageId);
      }
      if (disposed || pendingLinkedMessageRequestIdRef.current !== requestId) return;

      setActiveTab('messages');
      setHighlightedMessageId(resolvedMessageId);
      setPendingLinkedMessageTarget((previous) =>
        previous?.roomId === pendingLinkedMessageTarget.roomId &&
        previous.messageId === requestedMessageId
          ? null
          : previous,
      );

      if (!messageLoaded) {
        toast.warning(
          resolvedContextState === 'message_deleted'
            ? 'This original message was deleted.'
            : `Couldn't load the original message right now.`,
        );
      }
    })();

    return () => {
      disposed = true;
    };
  }, [
    activeRoomId,
    pendingLinkedMessageTarget,
    pendingLinkedMessageRequestIdRef,
    setActiveTab,
    setHighlightedMessageId,
    setPendingLinkedMessageTarget,
  ]);

  const openMessageInActiveConversation = useCallback(
    async (messageId: string) => {
      setActiveTab('messages');
      let resolvedMessageId = messageId;
      let resolvedContextState: string | null = null;
      let messageLoaded = await ensureMessageLoadedInActiveRoom(messageId);

      if (!messageLoaded && activeRoomId) {
        try {
          const messageContext = await loadMessageContextForRoom(
            activeRoomId,
            messageId,
            {
              forceFresh: true,
              injectDeletedPlaceholder: true,
            },
          );
          const contextState = messageContext?.state?.trim().toLowerCase();
          resolvedContextState = contextState ?? null;
          const contextTargetMessageId = messageContext?.targetMessageId?.trim();
          const contextItems = messageContext?.items ?? [];

          if (contextState === 'ready' && contextTargetMessageId) {
            resolvedMessageId = contextTargetMessageId;
          }
          if (contextState === 'message_deleted') {
            resolvedMessageId = messageId;
          }
          if (contextState === 'forbidden') {
            toast.warning('This original message is no longer accessible.');
            return;
          }
          if (contextState === 'message_not_found') {
            toast.warning('This original message was deleted.');
            return;
          }

          if (
            (contextState === 'ready' &&
              contextItems.some((message) => message.id === resolvedMessageId)) ||
            (contextState === 'message_deleted' &&
              contextItems.some((message) => message.id === messageId))
          ) {
            messageLoaded = true;
          }
        } catch {
          // Fall back to local history if the context request is unavailable.
        }
      }

      if (!messageLoaded) {
        messageLoaded = await ensureMessageLoadedInActiveRoom(resolvedMessageId);
      }

      if (!messageLoaded) {
        toast.warning(
          resolvedContextState === 'message_deleted'
            ? 'This original message was deleted.'
            : `Couldn't load the original message right now.`,
        );
      }

      setHighlightedMessageId(resolvedMessageId);
    },
    [
      activeRoomId,
      ensureMessageLoadedInActiveRoom,
      loadMessageContextForRoom,
      setActiveTab,
      setHighlightedMessageId,
    ],
  );

  return {
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
    loadMessageContextForRoom,
    queuePendingLinkedMessage,
    handleLoadOlderMessages,
    openMessageInActiveConversation,
  };
}
