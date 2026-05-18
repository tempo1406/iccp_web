'use client';

import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { toast } from '@/lib/toast';
import type {
  ConversationKind,
  ConversationMessage,
  ConversationTab,
} from '../../data/team-chat-ui-data';
import type {
  ComposerState,
} from '../../lib/team-chat-screen.shared';
import type { TeamChatDraftResponse } from '../../services/types/team-chat.types';
import { buildAbsoluteTeamChatMessageDeepLink } from '../../lib/team-chat-message-link.utils';
import { parseTeamChatMessageLink } from '../../lib/team-chat-message-link.utils';

interface ActiveConversationDisplayLike {
  title: string;
  subtitle: string;
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

export function useTeamChatMessageActions(params: {
  activeRoomId: string;
  pathname: string;
  activeConversationKind: ConversationKind;
  activeConversationDisplay: ActiveConversationDisplayLike;
  canSendActiveConversationMessage: boolean;
  canForwardActiveConversationMessage: boolean;
  deleteMessageState: DeleteMessageState | null;
  roomSummaryById: Map<string, unknown>;
  composerDraftValueRef: MutableRefObject<string>;
  composerDraftSeedValueRef: MutableRefObject<string>;
  setHydratedComposerDraftContextKey: Dispatch<SetStateAction<string | null>>;
  setInlineEditState: Dispatch<
    SetStateAction<{
      messageId: string;
      draft: string;
      allowsEmptyDraft: boolean;
      removedAttachmentIds: string[];
    } | null>
  >;
  setForwardState: Dispatch<SetStateAction<ForwardState | null>>;
  setComposerDraftSeedValue: Dispatch<SetStateAction<string>>;
  setActiveCurrentDraftSnapshot: Dispatch<
    SetStateAction<TeamChatDraftResponse | null>
  >;
  setComposerHasImmediateDraftText: Dispatch<SetStateAction<boolean>>;
  setComposerDraftDirty: Dispatch<SetStateAction<boolean>>;
  setComposerState: Dispatch<SetStateAction<ComposerState | null>>;
  setDeleteMessageState: Dispatch<SetStateAction<DeleteMessageState | null>>;
  setActiveTab: Dispatch<SetStateAction<ConversationTab>>;
  setSearchOpen: Dispatch<SetStateAction<boolean>>;
  notifyCannotSendMessage: () => void;
  notifyCannotForwardMessage: () => void;
  navigateToHref: (href: string) => void;
  queuePendingLinkedMessage: (roomId: string, messageId?: string) => void;
  openConversationFromRoomId: (roomId: string, messageId?: string) => boolean;
  openBrowseChannels: (roomId?: string) => void;
  openMessageInActiveConversation: (messageId: string) => Promise<void>;
  copyToClipboard?: (text: string) => Promise<void>;
  handleDelete: (messageId: string) => Promise<boolean>;
}) {
  const {
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
    navigateToHref,
    queuePendingLinkedMessage,
    openConversationFromRoomId,
    openBrowseChannels,
    openMessageInActiveConversation,
    copyToClipboard,
    handleDelete,
  } = params;

  const writeToClipboard = useCallback(
    async (text: string) => {
      if (copyToClipboard) {
        await copyToClipboard(text);
        return;
      }

      try {
        await navigator.clipboard.writeText(text);
      } catch {
        toast.danger('Clipboard action failed');
      }
    },
    [copyToClipboard],
  );

  const resetComposerDraftReplyState = useCallback(() => {
    setHydratedComposerDraftContextKey(null);
    setInlineEditState(null);
    setForwardState(null);
    setComposerDraftSeedValue('');
    composerDraftValueRef.current = '';
    composerDraftSeedValueRef.current = '';
    setActiveCurrentDraftSnapshot(null);
    setComposerHasImmediateDraftText(false);
    setComposerDraftDirty(false);
  }, [
    composerDraftSeedValueRef,
    composerDraftValueRef,
    setActiveCurrentDraftSnapshot,
    setComposerDraftDirty,
    setComposerDraftSeedValue,
    setComposerHasImmediateDraftText,
    setForwardState,
    setHydratedComposerDraftContextKey,
    setInlineEditState,
  ]);

  const handleReply = useCallback(
    (message: ConversationMessage) => {
      if (!canSendActiveConversationMessage) {
        notifyCannotSendMessage();
        return;
      }

      resetComposerDraftReplyState();
      setComposerState({ mode: 'reply', message });
      setActiveTab('messages');
    },
    [
      canSendActiveConversationMessage,
      notifyCannotSendMessage,
      resetComposerDraftReplyState,
      setActiveTab,
      setComposerState,
    ],
  );

  const handleForward = useCallback(
    (message: ConversationMessage) => {
      if (!canForwardActiveConversationMessage) {
        notifyCannotForwardMessage();
        return;
      }

      setComposerState(null);
      setInlineEditState(null);
      const sourceConversationLabel =
        activeConversationKind === 'channel'
          ? `#${activeConversationDisplay.title}`
          : activeConversationDisplay.title;
      setForwardState({
        message,
        sourceConversationLabel,
        sourceConversationSubtitle: activeConversationDisplay.subtitle,
      });
    },
    [
      activeConversationDisplay.subtitle,
      activeConversationDisplay.title,
      activeConversationKind,
      canForwardActiveConversationMessage,
      notifyCannotForwardMessage,
      setComposerState,
      setForwardState,
      setInlineEditState,
    ],
  );

  const handleEdit = useCallback(
    (message: ConversationMessage) => {
      if (!canSendActiveConversationMessage) {
        notifyCannotSendMessage();
        return;
      }
      if (!message.isOwn || message.isDeleted) return;

      const hasAttachments = Boolean(message.attachments?.length);
      const normalizedContent = message.content.trim().toLowerCase();
      const isAttachmentOnlyMessage =
        Boolean(message.isAttachmentPlaceholder) ||
        (hasAttachments && (!normalizedContent || normalizedContent === 'attachment'));
      const normalizedMessageContent = message.content.trim();
      const editableDraft = isAttachmentOnlyMessage
        ? ''
        : message.forwardedMessage
          ? normalizedMessageContent
          : normalizedMessageContent || message.content;

      setComposerState(null);
      setForwardState(null);
      setInlineEditState({
        messageId: message.id,
        draft: editableDraft,
        allowsEmptyDraft: hasAttachments,
        removedAttachmentIds: [],
      });
    },
    [
      canSendActiveConversationMessage,
      notifyCannotSendMessage,
      setComposerState,
      setForwardState,
      setInlineEditState,
    ],
  );

  const requestDeleteMessage = useCallback(
    (messageId: string, source: 'menu' | 'inline-edit-empty' = 'menu') => {
      if (!canSendActiveConversationMessage) {
        notifyCannotSendMessage();
        return;
      }
      setDeleteMessageState({
        messageId,
        source,
      });
    },
    [
      canSendActiveConversationMessage,
      notifyCannotSendMessage,
      setDeleteMessageState,
    ],
  );

  const handleCopyMessage = useCallback(
    (message: ConversationMessage) => {
      void writeToClipboard(message.content);
    },
    [writeToClipboard],
  );

  const handleOpenMessageLink = useCallback(
    (href: string) => {
      const normalizedHref = href.trim();
      if (!normalizedHref) return;

      const parsedMessageLink = parseTeamChatMessageLink(normalizedHref, {
        currentPathname: pathname,
      });
      if (!parsedMessageLink) {
        navigateToHref(normalizedHref);
        return;
      }

      const { roomId, messageId } = parsedMessageLink;
      if (activeRoomId === roomId) {
        void openMessageInActiveConversation(messageId);
        return;
      }

      if (roomSummaryById.has(roomId)) {
        openConversationFromRoomId(roomId, messageId);
        return;
      }

      queuePendingLinkedMessage(roomId, messageId);
      openBrowseChannels(roomId);
    },
    [
      activeRoomId,
      navigateToHref,
      openMessageInActiveConversation,
      openBrowseChannels,
      openConversationFromRoomId,
      pathname,
      queuePendingLinkedMessage,
      roomSummaryById,
    ],
  );

  const handleCopyLink = useCallback(
    (message: ConversationMessage) => {
      const link =
        activeRoomId && message.id
          ? buildAbsoluteTeamChatMessageDeepLink({
              roomId: activeRoomId,
              messageId: message.id,
              currentPathname: pathname,
            })
          : typeof window !== 'undefined'
            ? window.location.href
            : pathname;

      void writeToClipboard(link);
    },
    [activeRoomId, pathname, writeToClipboard],
  );

  const handleSearchResultSelect = useCallback(
    async (messageId: string) => {
      setSearchOpen(false);
      await openMessageInActiveConversation(messageId);
    },
    [openMessageInActiveConversation, setSearchOpen],
  );

  const handleDeleteDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setDeleteMessageState(null);
      }
    },
    [setDeleteMessageState],
  );

  const handleConfirmDeleteMessage = useCallback(async () => {
    if (!deleteMessageState) return;
    await handleDelete(deleteMessageState.messageId);
  }, [deleteMessageState, handleDelete]);

  return {
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
  };
}
