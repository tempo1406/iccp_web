'use client';

import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import type {
  ConversationKey,
  ConversationMessage,
} from '../../data/team-chat-ui-data';
import { mapReactionSummaryToMessageReaction } from '../../lib/team-chat-api-mappers';
import { mergeRoomHistoryItems } from '../../lib/team-chat-message-history.utils';
import {
  mapConversationReactionToSummary,
  mergeTeamChatReactionSummaryList,
} from '../../lib/screen-controller/team-chat-controller-reaction.utils';
import { teamChatQueryKeys } from '../../query/use-team-chat';
import type {
  TeamChatMessageReactionSummaryResponse,
  TeamChatPinnedMessageResponse,
  TeamChatRoomMessageResponse,
} from '../../services/types/team-chat.types';

interface AddReactionResultLike {
  ok: boolean;
  data?: TeamChatMessageReactionSummaryResponse;
  error?: {
    message: string;
  };
}

interface DeleteMessageResultLike {
  ok: boolean;
  data?: TeamChatRoomMessageResponse;
  error?: {
    message: string;
  };
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

export function useTeamChatMessageMutationActions(params: {
  activeRoomId: string;
  activeConversationKey: ConversationKey;
  activeRoomMessages: TeamChatRoomMessageResponse[];
  pinnedMessages: TeamChatPinnedMessageResponse[];
  messages: ConversationMessage[];
  reactionsByMessage: Record<string, TeamChatMessageReactionSummaryResponse[]>;
  canSendActiveConversationMessage: boolean;
  queryClient: QueryClient;
  reactionActorsHydrationRef: MutableRefObject<Set<string>>;
  reactionMutationPendingRef: MutableRefObject<Set<string>>;
  notifyCannotSendMessage: () => void;
  listReactions: (
    roomId: string,
    messageId: string,
  ) => Promise<TeamChatMessageReactionSummaryResponse[]>;
  addReaction: (params: {
    roomId: string;
    messageId: string;
    body: { emoji: string };
  }) => Promise<AddReactionResultLike>;
  removeReaction: (params: {
    roomId: string;
    messageId: string;
    emoji: string;
  }) => Promise<AddReactionResultLike>;
  deleteMessage: (params: {
    roomId: string;
    messageId: string;
  }) => Promise<DeleteMessageResultLike>;
  syncMessageReactionSummaries: (
    roomId: string,
    messageId: string,
    nextReactionSummaries: TeamChatMessageReactionSummaryResponse[],
  ) => void;
  updateRoomMessageHistory: (
    roomId: string,
    updater: (
      currentMessages: TeamChatRoomMessageResponse[],
    ) => TeamChatRoomMessageResponse[],
  ) => void;
  updateConversationMessages: (
    conversationKey: ConversationKey,
    updater: (currentMessages: ConversationMessage[]) => ConversationMessage[],
  ) => void;
  mapRoomMessageToConversationStreamMessage: (
    message: TeamChatRoomMessageResponse,
  ) => ConversationMessage;
  dismissOptimisticConversationMessage: (messageId: string) => void;
  setInlineEditState: Dispatch<SetStateAction<InlineEditState | null>>;
  setDeleteMessageState: Dispatch<SetStateAction<DeleteMessageState | null>>;
}) {
  const {
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
    listReactions,
    addReaction,
    removeReaction,
    deleteMessage,
    syncMessageReactionSummaries,
    updateRoomMessageHistory,
    updateConversationMessages,
    mapRoomMessageToConversationStreamMessage,
    dismissOptimisticConversationMessage,
    setInlineEditState,
    setDeleteMessageState,
  } = params;

  const readCurrentReactionSummaries = useCallback(
    (
      messageId: string,
      fallbackMessage?: ConversationMessage,
    ): TeamChatMessageReactionSummaryResponse[] => {
      const activeMessage = activeRoomMessages.find((item) => item.id === messageId);
      if (Array.isArray(activeMessage?.reactionSummaries)) {
        return activeMessage.reactionSummaries;
      }

      const pinnedMessage = pinnedMessages.find((item) => item.messageId === messageId);
      if (Array.isArray(pinnedMessage?.message.reactionSummaries)) {
        return pinnedMessage.message.reactionSummaries;
      }

      if (activeRoomId) {
        const exactCachedReactions =
          queryClient.getQueryData<TeamChatMessageReactionSummaryResponse[]>(
            teamChatQueryKeys.messageReactions(activeRoomId, messageId),
          );
        if (Array.isArray(exactCachedReactions)) {
          return exactCachedReactions;
        }
      }

      if (Array.isArray(reactionsByMessage[messageId])) {
        return reactionsByMessage[messageId];
      }

      if (fallbackMessage?.reactions?.length) {
        return fallbackMessage.reactions.map(mapConversationReactionToSummary);
      }

      return [];
    },
    [
      activeRoomId,
      activeRoomMessages,
      pinnedMessages,
      queryClient,
      reactionsByMessage,
    ],
  );

  const readCachedReactionActors = useCallback(
    (messageId: string): ConversationMessage['reactions'] | undefined => {
      if (!activeRoomId) return undefined;

      const exactCachedReactions =
        queryClient.getQueryData<TeamChatMessageReactionSummaryResponse[]>(
          teamChatQueryKeys.messageReactions(activeRoomId, messageId),
        );
      if (Array.isArray(exactCachedReactions) && exactCachedReactions.length > 0) {
        return exactCachedReactions.map(mapReactionSummaryToMessageReaction);
      }

      const cachedReactionEntries = queryClient.getQueriesData<
        Record<string, TeamChatMessageReactionSummaryResponse[]>
      >({
        queryKey: ['teamChat', 'reactions-by-message', activeRoomId],
      });

      for (const [, cachedEntry] of cachedReactionEntries) {
        if (!cachedEntry || typeof cachedEntry !== 'object' || Array.isArray(cachedEntry)) {
          continue;
        }

        const cachedMessageReactions = cachedEntry[messageId];
        if (Array.isArray(cachedMessageReactions) && cachedMessageReactions.length > 0) {
          return cachedMessageReactions.map(mapReactionSummaryToMessageReaction);
        }
      }

      return undefined;
    },
    [activeRoomId, queryClient],
  );

  const handleHydrateReactionActors = useCallback(
    async (
      messageId: string,
    ): Promise<ConversationMessage['reactions'] | undefined> => {
      if (!activeRoomId) return undefined;

      const inlineReactions = messages.find((message) => message.id === messageId)?.reactions;
      if (inlineReactions?.some((reaction) => (reaction.reactors?.length ?? 0) > 0)) {
        return inlineReactions;
      }

      const cachedReactions = readCachedReactionActors(messageId);
      if (cachedReactions?.some((reaction) => (reaction.reactors?.length ?? 0) > 0)) {
        return cachedReactions;
      }

      const hydrationKey = `${activeRoomId}:${messageId}`;
      if (reactionActorsHydrationRef.current.has(hydrationKey)) return cachedReactions;
      reactionActorsHydrationRef.current.add(hydrationKey);

      try {
        const reactionSummaries = await listReactions(activeRoomId, messageId);
        if (!Array.isArray(reactionSummaries)) return cachedReactions;
        const mappedReactions = reactionSummaries.map(mapReactionSummaryToMessageReaction);
        syncMessageReactionSummaries(activeRoomId, messageId, reactionSummaries);
        return mappedReactions;
      } catch {
        return cachedReactions;
      } finally {
        reactionActorsHydrationRef.current.delete(hydrationKey);
      }
    },
    [
      activeRoomId,
      listReactions,
      messages,
      reactionActorsHydrationRef,
      readCachedReactionActors,
      syncMessageReactionSummaries,
    ],
  );

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!activeRoomId) return;
      if (!canSendActiveConversationMessage) {
        notifyCannotSendMessage();
        return;
      }

      const mutationKey = `${activeRoomId}:${messageId}:${emoji}`;
      if (reactionMutationPendingRef.current.has(mutationKey)) return;

      const message = messages.find((item) => item.id === messageId);
      const currentReaction = message?.reactions?.find((reaction) => reaction.emoji === emoji);
      const previousReactionSummaries =
        readCurrentReactionSummaries(messageId, message).map((reaction) => ({ ...reaction })) ?? [];
      const nextReactionCount = Math.max(
        0,
        (currentReaction?.count ?? 0) + (currentReaction?.reacted ? -1 : 1),
      );
      const optimisticReactionSummary: TeamChatMessageReactionSummaryResponse = {
        emoji,
        count: nextReactionCount,
        reactedByMe: !Boolean(currentReaction?.reacted),
        reactors: previousReactionSummaries.find((reaction) => reaction.emoji === emoji)?.reactors,
      };

      reactionMutationPendingRef.current.add(mutationKey);
      syncMessageReactionSummaries(
        activeRoomId,
        messageId,
        mergeTeamChatReactionSummaryList(previousReactionSummaries, optimisticReactionSummary),
      );

      try {
        const mutationResult =
          currentReaction?.reacted
            ? await removeReaction({
                roomId: activeRoomId,
                messageId,
                emoji,
              })
            : await addReaction({
                roomId: activeRoomId,
                messageId,
                body: { emoji },
              });

        if (!mutationResult.ok || !mutationResult.data) {
          syncMessageReactionSummaries(activeRoomId, messageId, previousReactionSummaries);
          toast.danger(mutationResult.error?.message ?? 'Unable to update reaction');
          return;
        }

        const nextReactionSummaries = mergeTeamChatReactionSummaryList(
          readCurrentReactionSummaries(messageId, message),
          mutationResult.data,
        );
        syncMessageReactionSummaries(activeRoomId, messageId, nextReactionSummaries);

        if (mutationResult.data.count > 0 && !(mutationResult.data.reactors?.length ?? 0)) {
          void handleHydrateReactionActors(messageId);
        }
      } finally {
        reactionMutationPendingRef.current.delete(mutationKey);
      }
    },
    [
      activeRoomId,
      addReaction,
      canSendActiveConversationMessage,
      handleHydrateReactionActors,
      messages,
      notifyCannotSendMessage,
      readCurrentReactionSummaries,
      reactionMutationPendingRef,
      removeReaction,
      syncMessageReactionSummaries,
    ],
  );

  const handleEmojiPick = useCallback(
    (messageId: string, emojiData: { emoji: string }) => {
      void toggleReaction(messageId, emojiData.emoji);
    },
    [toggleReaction],
  );

  const handleDelete = useCallback(
    async (messageId: string) => {
      if (!canSendActiveConversationMessage) {
        notifyCannotSendMessage();
        return false;
      }
      if (messageId.startsWith('local-')) {
        dismissOptimisticConversationMessage(messageId);
        return true;
      }

      if (!activeRoomId) return false;

      const deleteMessageResult = await deleteMessage({
        roomId: activeRoomId,
        messageId,
      });

      if (!deleteMessageResult.ok || !deleteMessageResult.data) {
        toast.danger(deleteMessageResult.error?.message ?? 'Unable to delete message');
        return false;
      }

      updateRoomMessageHistory(activeRoomId, (currentMessages) =>
        mergeRoomHistoryItems(currentMessages, [deleteMessageResult.data!]),
      );
      const mappedMessage = mapRoomMessageToConversationStreamMessage(
        deleteMessageResult.data,
      );

      updateConversationMessages(activeConversationKey, (currentMessages) =>
        currentMessages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                ...mappedMessage,
                isDeleted: true,
                content: mappedMessage.content,
                time: mappedMessage.time,
                reactions: [],
                attachments: [],
                linkPreviews: [],
                linkPreview: undefined,
                linkPreviewStatus: undefined,
                linkPreviewPendingUrls: [],
                linkPreviewFailedUrls: [],
                imagePreview: undefined,
                quote: undefined,
                forwardedMessage: undefined,
                isAttachmentPlaceholder: false,
              }
            : message,
        ),
      );

      setInlineEditState((previous) =>
        previous?.messageId === messageId ? null : previous,
      );
      setDeleteMessageState((previous) =>
        previous?.messageId === messageId ? null : previous,
      );
      return true;
    },
    [
      activeConversationKey,
      activeRoomId,
      canSendActiveConversationMessage,
      deleteMessage,
      dismissOptimisticConversationMessage,
      mapRoomMessageToConversationStreamMessage,
      notifyCannotSendMessage,
      setDeleteMessageState,
      setInlineEditState,
      updateConversationMessages,
      updateRoomMessageHistory,
    ],
  );

  return {
    handleHydrateReactionActors,
    toggleReaction,
    handleEmojiPick,
    handleDelete,
  };
}
