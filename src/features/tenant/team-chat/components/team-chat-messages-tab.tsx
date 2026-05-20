import { useCallback, useEffect, useRef, useState } from 'react';
import { type EmojiClickData } from 'emoji-picker-react';
import { TeamChatTypingIndicator } from './team-chat-typing-indicator';
import { TeamChatComposerPanel } from './team-chat-composer-panel';
import { TeamChatMessageList } from './team-chat-message-list';
import {
  type ConversationKey,
  type ConversationMessage,
} from '../data/team-chat-ui-data';
import {
  type ComposerAttachmentDraft,
  type ComposerState,
  type MentionCandidate,
  type TeamChatComposerDraftPayload,
  type UploadingAttachmentDraft,
} from '../lib/team-chat-screen.shared';
import { type InlineEditState } from '../lib/team-chat-messages-tab.shared';

const SCROLL_BOTTOM_THRESHOLD = 32;

interface TeamChatMessagesTabProps {
  activeConversationPlaceholder: string;
  canSendMessage?: boolean;
  canForwardMessages?: boolean;
  canReactToMessages?: boolean;
  canReplyToMessages?: boolean;
  readOnlyForwardOnlyActions?: boolean;
  canTogglePinMessages?: boolean;
  canEditOwnMessages?: boolean;
  canDeleteOwnMessages?: boolean;
  readOnlyVariant?: 'default' | 'announcements';
  composerScheduledNotice?:
    | {
        label: string;
        ctaLabel: string;
      }
    | null;
  conversationKey: ConversationKey;
  composerAttachments: ComposerAttachmentDraft[];
  draftSeedValue: string;
  draftSeedPayload: TeamChatComposerDraftPayload;
  composerResetKey: number;
  composerState: ComposerState | null;
  highlightedMessageId: string | null;
  isActive?: boolean;
  inlineEditState: InlineEditState | null;
  mentionCandidates: MentionCandidate[];
  mentionContextKind: 'channel' | 'dm' | 'group_dm';
  messages: ConversationMessage[];
  typingIndicatorText?: string | null;
  canLoadOlderMessages?: boolean;
  isLoadingOlderMessages?: boolean;
  onCancelComposer: () => void;
  onComposerAttachmentRemove: (attachmentId: string) => void;
  onComposerAttachmentSelect: (files: File[]) => void;
  onCopyLink: (message: ConversationMessage) => void;
  onCopyMessage: (message: ConversationMessage) => void;
  onDeleteAttachment: (messageId: string, attachmentId: string) => void;
  onRetryUploadingAttachment: (messageId: string, attachmentId: string) => void;
  onRemoveUploadingAttachment: (messageId: string, attachmentId: string) => void;
  onDelete: (message: ConversationMessage) => void;
  onDraftChange: (payload: TeamChatComposerDraftPayload) => void;
  onDraftPresenceChange: (hasText: boolean) => void;
  onOpenMessageLink?: (href: string) => void;
  onEdit: (message: ConversationMessage) => void;
  onEmojiPick: (messageId: string, emojiData: EmojiClickData) => void;
  onForward: (message: ConversationMessage) => void;
  onForwardSourceOpen: (conversationKey: ConversationKey, messageId?: string) => void;
  canOpenForwardSourceConversation?: (
    conversationKey: ConversationKey,
    options?: {
      visibility?: 'public' | 'private';
    },
  ) => 'available' | 'not_in_current_list' | 'private_inaccessible';
  onInlineEditCancel: () => void;
  onInlineEditRemoveAttachment: (attachmentId: string) => void;
  onInlineEditSave: (value: string) => void;
  onLoadOlderMessages?: () => Promise<boolean> | boolean | void;
  onOpenScheduledMessages: () => void;
  onReply: (message: ConversationMessage) => void;
  onSchedule: (payload: TeamChatComposerDraftPayload, scheduledFor: Date) => void;
  onDismissOptimisticMessage: (messageId: string) => void;
  onRetryOptimisticMessage: (message: ConversationMessage) => void;
  onSend: (payload: TeamChatComposerDraftPayload) => void;
  onTogglePinMessage: (messageId: string, isPinned: boolean) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onHydrateReactionActors?: (
    messageId: string,
  ) => Promise<ConversationMessage['reactions'] | undefined>;
  uploadingAttachmentsByMessageId: Record<string, UploadingAttachmentDraft[]>;
}

export function TeamChatMessagesTab({
  activeConversationPlaceholder,
  canSendMessage = true,
  canForwardMessages = true,
  canReactToMessages = true,
  canReplyToMessages = true,
  readOnlyForwardOnlyActions = false,
  canTogglePinMessages = true,
  canEditOwnMessages = true,
  canDeleteOwnMessages = true,
  readOnlyVariant = 'default',
  composerScheduledNotice,
  conversationKey,
  composerAttachments,
  draftSeedValue,
  draftSeedPayload,
  composerResetKey,
  composerState,
  highlightedMessageId,
  isActive = true,
  inlineEditState,
  mentionCandidates,
  mentionContextKind,
  messages,
  typingIndicatorText,
  canLoadOlderMessages,
  isLoadingOlderMessages,
  onCancelComposer,
  onComposerAttachmentRemove,
  onComposerAttachmentSelect,
  onCopyLink,
  onCopyMessage,
  onDeleteAttachment,
  onRetryUploadingAttachment,
  onRemoveUploadingAttachment,
  onDelete,
  onDraftChange,
  onDraftPresenceChange,
  onOpenMessageLink,
  onEdit,
  onEmojiPick,
  onForward,
  onForwardSourceOpen,
  canOpenForwardSourceConversation,
  onInlineEditCancel,
  onInlineEditRemoveAttachment,
  onInlineEditSave,
  onLoadOlderMessages,
  onOpenScheduledMessages,
  onReply,
  onSchedule,
  onDismissOptimisticMessage,
  onRetryOptimisticMessage,
  onSend,
  onTogglePinMessage,
  onToggleReaction,
  onHydrateReactionActors,
  uploadingAttachmentsByMessageId,
}: TeamChatMessagesTabProps) {
  const messageScrollAreaRootRef = useRef<HTMLDivElement | null>(null);
  const messageContentRef = useRef<HTMLDivElement | null>(null);
  const messageViewportRef = useRef<HTMLDivElement | null>(null);
  const pendingComposerSendRef = useRef(false);
  const pendingComposerSendResetTimerRef = useRef<number | null>(null);
  const isAtBottomRef = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);
  const needsInitialScrollRef = useRef(true);
  const isBootstrappingViewportRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const shouldStickToBottomRef = useRef(true);
  const hasUserArmedOlderLoadRef = useRef(false);
  const lastKnownScrollTopRef = useRef(0);
  const olderMessagesRequestInFlightRef = useRef(false);
  const prependScrollSnapshotRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
  const linkedNavigationLockUntilRef = useRef(0);
  const canLoadOlderMessagesRef = useRef(canLoadOlderMessages);
  const isLoadingOlderMessagesRef = useRef(isLoadingOlderMessages);
  const onLoadOlderMessagesRef = useRef(onLoadOlderMessages);
  const [unseenIncomingCount, setUnseenIncomingCount] = useState(0);
  const [viewportReadyTick, setViewportReadyTick] = useState(0);

  useEffect(() => {
    canLoadOlderMessagesRef.current = canLoadOlderMessages;
  }, [canLoadOlderMessages]);

  useEffect(() => {
    isLoadingOlderMessagesRef.current = isLoadingOlderMessages;
  }, [isLoadingOlderMessages]);

  useEffect(() => {
    onLoadOlderMessagesRef.current = onLoadOlderMessages;
  }, [onLoadOlderMessages]);

  const clearPendingComposerSendIntent = () => {
    pendingComposerSendRef.current = false;
    if (pendingComposerSendResetTimerRef.current !== null) {
      window.clearTimeout(pendingComposerSendResetTimerRef.current);
      pendingComposerSendResetTimerRef.current = null;
    }
  };

  const handleComposerSend = (payload: TeamChatComposerDraftPayload) => {
    const hasPayload = payload.content.trim().length > 0 || composerAttachments.length > 0;
    if (!canSendMessage) {
      onSend(payload);
      return;
    }

    if (hasPayload) {
      pendingComposerSendRef.current = true;
      shouldStickToBottomRef.current = true;
      isAtBottomRef.current = true;
      hasUserArmedOlderLoadRef.current = false;
      setUnseenIncomingCount(0);
      if (pendingComposerSendResetTimerRef.current !== null) {
        window.clearTimeout(pendingComposerSendResetTimerRef.current);
      }
      pendingComposerSendResetTimerRef.current = window.setTimeout(() => {
        pendingComposerSendRef.current = false;
        pendingComposerSendResetTimerRef.current = null;
      }, 10000);
      scheduleScrollToBottom('smooth');
    }

    onSend(payload);
  };

  const runWithProgrammaticScrollLock = (callback: () => void) => {
    isProgrammaticScrollRef.current = true;
    callback();

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        isProgrammaticScrollRef.current = false;
      });
    });
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    const viewport = messageViewportRef.current;
    if (!viewport) return;
    runWithProgrammaticScrollLock(() => {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior,
      });
    });
    lastKnownScrollTopRef.current = viewport.scrollHeight;
  };

  const scheduleScrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    let outerFrame: number | null = null;
    let innerFrame: number | null = null;

    outerFrame = window.requestAnimationFrame(() => {
      innerFrame = window.requestAnimationFrame(() => {
        scrollToBottom(behavior);
      });
    });

    return () => {
      if (outerFrame !== null) {
        window.cancelAnimationFrame(outerFrame);
      }
      if (innerFrame !== null) {
        window.cancelAnimationFrame(innerFrame);
      }
    };
  };

  const isLatestMessageVisibleInViewport = (messageId: string) => {
    const viewport = messageViewportRef.current;
    if (!viewport || !messageId) return null;

    const messageElement = viewport.querySelector<HTMLElement>(`[data-message-id="${messageId}"]`);
    if (!messageElement) return null;

    const viewportRect = viewport.getBoundingClientRect();
    const messageRect = messageElement.getBoundingClientRect();
    return messageRect.bottom <= viewportRect.bottom + 8;
  };

  const measureIsAtBottom = () => {
    const viewport = messageViewportRef.current;
    if (!viewport) return isAtBottomRef.current;

    const distanceToBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    return distanceToBottom <= SCROLL_BOTTOM_THRESHOLD;
  };

  const requestOlderMessages = useCallback(() => {
    if (!canLoadOlderMessagesRef.current || isLoadingOlderMessagesRef.current) return;

    const loadOlderMessages = onLoadOlderMessagesRef.current;
    if (!loadOlderMessages || olderMessagesRequestInFlightRef.current) return;

    const viewport = messageViewportRef.current;
    if (viewport) {
      prependScrollSnapshotRef.current = {
        scrollHeight: viewport.scrollHeight,
        scrollTop: viewport.scrollTop,
      };
    }

    olderMessagesRequestInFlightRef.current = true;
    const result = loadOlderMessages();

    if (result && typeof (result as Promise<unknown>).finally === 'function') {
      void (result as Promise<unknown>).finally(() => {
        olderMessagesRequestInFlightRef.current = false;
      });
      return;
    }

    olderMessagesRequestInFlightRef.current = false;
  }, []);

  useEffect(() => {
    let activeViewport: HTMLDivElement | null = null;
    let resolveFrame: number | null = null;

    const updateScrollState = () => {
      if (!activeViewport) return;

      const distanceToBottom =
        activeViewport.scrollHeight - activeViewport.scrollTop - activeViewport.clientHeight;
      const isAtBottom = distanceToBottom <= SCROLL_BOTTOM_THRESHOLD;
      isAtBottomRef.current = isAtBottom;

      if (isAtBottom) {
        setUnseenIncomingCount(0);
      }

      const canAutoLoadOlder =
        Boolean(canLoadOlderMessagesRef.current) &&
        !isLoadingOlderMessagesRef.current &&
        !isBootstrappingViewportRef.current &&
        hasUserArmedOlderLoadRef.current &&
        !olderMessagesRequestInFlightRef.current &&
        Date.now() >= linkedNavigationLockUntilRef.current &&
        activeViewport.scrollTop <= 56 &&
        activeViewport.scrollHeight > activeViewport.clientHeight + 24;

      if (canAutoLoadOlder) {
        requestOlderMessages();
      }
    };

    const detachViewport = () => {
      if (!activeViewport) return;
      activeViewport.removeEventListener('scroll', handleViewportScroll);
      if (messageViewportRef.current === activeViewport) {
        messageViewportRef.current = null;
      }
      activeViewport = null;
    };

    const handleViewportScroll = () => {
      if (!activeViewport) return;

      const currentScrollTop = activeViewport.scrollTop;
      const previousScrollTop = lastKnownScrollTopRef.current;
      const isNearBottom =
        activeViewport.scrollHeight - currentScrollTop - activeViewport.clientHeight <=
        SCROLL_BOTTOM_THRESHOLD;

      if (!isProgrammaticScrollRef.current) {
        if (Date.now() < linkedNavigationLockUntilRef.current) {
          lastKnownScrollTopRef.current = currentScrollTop;
          updateScrollState();
          return;
        }

        if (currentScrollTop < previousScrollTop - 4) {
          hasUserArmedOlderLoadRef.current = true;
          shouldStickToBottomRef.current = false;
        }

        if (isNearBottom) {
          shouldStickToBottomRef.current = true;
          hasUserArmedOlderLoadRef.current = false;
        }
      }

      lastKnownScrollTopRef.current = currentScrollTop;
      updateScrollState();
    };

    const attachViewport = (viewport: HTMLDivElement) => {
      if (activeViewport === viewport) return;

      detachViewport();
      activeViewport = viewport;
      messageViewportRef.current = viewport;
      setViewportReadyTick((currentTick) => currentTick + 1);

      if (needsInitialScrollRef.current) {
        isBootstrappingViewportRef.current = true;
        runWithProgrammaticScrollLock(() => {
          viewport.scrollTop = viewport.scrollHeight;
        });
        needsInitialScrollRef.current = false;
        isAtBottomRef.current = true;
        shouldStickToBottomRef.current = true;
        hasUserArmedOlderLoadRef.current = false;
        setUnseenIncomingCount(0);

        window.requestAnimationFrame(() => {
          if (messageViewportRef.current !== viewport) return;
          runWithProgrammaticScrollLock(() => {
            viewport.scrollTop = viewport.scrollHeight;
          });
          lastKnownScrollTopRef.current = viewport.scrollTop;
          isBootstrappingViewportRef.current = false;
          updateScrollState();
        });
      }

      lastKnownScrollTopRef.current = viewport.scrollTop;
      updateScrollState();
      viewport.addEventListener('scroll', handleViewportScroll, { passive: true });
    };

    const resolveViewport = (attempt = 0) => {
      const scrollAreaRoot = messageScrollAreaRootRef.current;
      if (!scrollAreaRoot) return;

      const viewport = scrollAreaRoot.querySelector<HTMLDivElement>(
        '[data-slot="scroll-area-viewport"]',
      );

      if (viewport) {
        attachViewport(viewport);
        return;
      }

      if (attempt >= 10) return;
      resolveFrame = window.requestAnimationFrame(() => resolveViewport(attempt + 1));
    };

    resolveViewport();

    return () => {
      if (resolveFrame !== null) {
        window.cancelAnimationFrame(resolveFrame);
      }
      detachViewport();
    };
  }, [conversationKey, requestOlderMessages]);

  useEffect(() => {
    needsInitialScrollRef.current = true;
    isBootstrappingViewportRef.current = false;
    isProgrammaticScrollRef.current = false;
    isAtBottomRef.current = true;
    shouldStickToBottomRef.current = true;
    hasUserArmedOlderLoadRef.current = false;
    lastKnownScrollTopRef.current = 0;
    lastMessageIdRef.current = null;
    olderMessagesRequestInFlightRef.current = false;
    prependScrollSnapshotRef.current = null;
    linkedNavigationLockUntilRef.current = 0;
    clearPendingComposerSendIntent();
    const resetUnseenCountFrameId = window.requestAnimationFrame(() => {
      setUnseenIncomingCount((previous) => (previous === 0 ? previous : 0));
    });
    const cancelScheduledScroll = scheduleScrollToBottom('auto');

    return () => {
      window.cancelAnimationFrame(resetUnseenCountFrameId);
      cancelScheduledScroll();
      clearPendingComposerSendIntent();
    };
  }, [conversationKey]);

  useEffect(() => {
    if (isLoadingOlderMessages) return;
    if (olderMessagesRequestInFlightRef.current) return;

    const snapshot = prependScrollSnapshotRef.current;
    const viewport = messageViewportRef.current;
    if (!snapshot || !viewport) {
      prependScrollSnapshotRef.current = null;
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const nextScrollTop = viewport.scrollHeight - snapshot.scrollHeight + snapshot.scrollTop;
      viewport.scrollTop = Math.max(0, nextScrollTop);
      prependScrollSnapshotRef.current = null;
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isLoadingOlderMessages, messages]);

  useEffect(() => {
    const content = messageContentRef.current;
    if (!content) return;

    let frameId: number | null = null;
    const observer = new ResizeObserver(() => {
      if (!shouldStickToBottomRef.current || highlightedMessageId) return;

      const viewport = messageViewportRef.current;
      if (!viewport) return;

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        if (!shouldStickToBottomRef.current || highlightedMessageId) return;
        const currentViewport = messageViewportRef.current;
        if (!currentViewport) return;

        runWithProgrammaticScrollLock(() => {
          currentViewport.scrollTop = currentViewport.scrollHeight;
        });
        lastKnownScrollTopRef.current = currentViewport.scrollTop;
        isAtBottomRef.current = true;
        setUnseenIncomingCount(0);
      });
    });

    observer.observe(content);

    return () => {
      observer.disconnect();
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [conversationKey, highlightedMessageId]);

  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage) {
      // Keep the last known message id after initial bootstrap so transient empty
      // states (query refresh) do not reset message-flow heuristics.
      if (needsInitialScrollRef.current) {
        lastMessageIdRef.current = null;
      }
      return;
    }

    const previousMessageId = lastMessageIdRef.current;
    if (previousMessageId === latestMessage.id) return;

    if (!previousMessageId) {
      if (!messageViewportRef.current) {
        return;
      }

      lastMessageIdRef.current = latestMessage.id;
      needsInitialScrollRef.current = false;
      const shouldSkipInitialBottomScroll = Boolean(highlightedMessageId);
      isAtBottomRef.current = shouldSkipInitialBottomScroll ? false : true;
      shouldStickToBottomRef.current = shouldSkipInitialBottomScroll ? false : true;
      hasUserArmedOlderLoadRef.current = false;
      window.requestAnimationFrame(() => {
        setUnseenIncomingCount((previous) => (previous === 0 ? previous : 0));
      });
      if (shouldSkipInitialBottomScroll) {
        return;
      }

      const cancelScheduledScroll = scheduleScrollToBottom('auto');
      return () => cancelScheduledScroll();
    }

    lastMessageIdRef.current = latestMessage.id;

    const wasAtBottomBeforeIncoming =
      isAtBottomRef.current || shouldStickToBottomRef.current;
    const shouldAutoStickForIncoming =
      wasAtBottomBeforeIncoming && !highlightedMessageId;

    if (pendingComposerSendRef.current || shouldAutoStickForIncoming) {
      let cancelScheduledScroll: (() => void) | null = null;
      shouldStickToBottomRef.current = true;
      isAtBottomRef.current = true;
      hasUserArmedOlderLoadRef.current = false;
      if (pendingComposerSendRef.current) {
        clearPendingComposerSendIntent();
      }
      window.setTimeout(() => {
        setUnseenIncomingCount((previous) => (previous === 0 ? previous : 0));
      }, 0);
      cancelScheduledScroll = scheduleScrollToBottom('smooth');
      return () => {
        cancelScheduledScroll?.();
      };
    }

    const isCurrentlyAtBottom =
      isLatestMessageVisibleInViewport(latestMessage.id) ?? measureIsAtBottom();
    isAtBottomRef.current = isCurrentlyAtBottom;
    if (!isCurrentlyAtBottom) {
      shouldStickToBottomRef.current = false;
      hasUserArmedOlderLoadRef.current = true;
    }

    if (!isCurrentlyAtBottom) {
      window.setTimeout(() => {
        setUnseenIncomingCount((previous) => previous + 1);
      }, 0);
      return;
    }

    window.setTimeout(() => {
      setUnseenIncomingCount((previous) => (previous === 0 ? previous : 0));
    }, 0);
    const cancelScheduledScroll = scheduleScrollToBottom('smooth');
    return () => cancelScheduledScroll();
  }, [
    conversationKey,
    highlightedMessageId,
    messages,
    viewportReadyTick,
  ]);

  useEffect(() => {
    if (!highlightedMessageId) return;

    shouldStickToBottomRef.current = false;
    hasUserArmedOlderLoadRef.current = false;
    isAtBottomRef.current = false;
    linkedNavigationLockUntilRef.current = Date.now() + 4_000;

    let cancelled = false;
    let frameId: number | null = null;
    let retryCount = 0;
    const MAX_SCROLL_RETRIES = 240;

    const scrollToHighlightedMessage = () => {
      if (cancelled) return;

      const viewport = messageViewportRef.current;
      if (!viewport) {
        if (retryCount >= MAX_SCROLL_RETRIES) {
          return;
        }

        retryCount += 1;
        frameId = window.requestAnimationFrame(scrollToHighlightedMessage);
        return;
      }

      const target = viewport.querySelector<HTMLElement>(
        `[data-message-id="${highlightedMessageId}"]`,
      );
      if (!target) {
        if (retryCount >= MAX_SCROLL_RETRIES) return;
        retryCount += 1;
        frameId = window.requestAnimationFrame(scrollToHighlightedMessage);
        return;
      }

      runWithProgrammaticScrollLock(() => {
        target.scrollIntoView({
          block: 'center',
          behavior: 'smooth',
        });
      });
      window.requestAnimationFrame(() => {
        if (cancelled) return;

        const recenteredTarget = viewport.querySelector<HTMLElement>(
          `[data-message-id="${highlightedMessageId}"]`,
        );
        if (!recenteredTarget) return;

        runWithProgrammaticScrollLock(() => {
          recenteredTarget.scrollIntoView({
            block: 'center',
            behavior: 'auto',
          });
        });
        lastKnownScrollTopRef.current = viewport.scrollTop;
      });
    };

    frameId = window.requestAnimationFrame(scrollToHighlightedMessage);

    return () => {
      cancelled = true;
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

    };
  }, [
    conversationKey,
    highlightedMessageId,
    messages,
    viewportReadyTick,
  ]);

  const handleJumpToLatest = () => {
    isAtBottomRef.current = true;
    shouldStickToBottomRef.current = true;
    hasUserArmedOlderLoadRef.current = false;
    linkedNavigationLockUntilRef.current = 0;
    clearPendingComposerSendIntent();
    setUnseenIncomingCount(0);
    scrollToBottom('smooth');
  };

  useEffect(
    () => () => {
      clearPendingComposerSendIntent();
    },
    [],
  );

  return (
    <>
      <TeamChatMessageList
        canLoadOlderMessages={canLoadOlderMessages}
        canForwardMessages={canForwardMessages}
        canReactToMessages={canReactToMessages}
        canReplyToMessages={canReplyToMessages}
        readOnlyForwardOnlyActions={readOnlyForwardOnlyActions}
        canTogglePinMessages={canTogglePinMessages}
        canEditOwnMessages={canEditOwnMessages}
        canDeleteOwnMessages={canDeleteOwnMessages}
        conversationKey={conversationKey}
        highlightedMessageId={highlightedMessageId}
        inlineEditState={inlineEditState}
        isLoadingOlderMessages={isLoadingOlderMessages}
        mentionCandidates={mentionCandidates}
        messageContentRef={messageContentRef}
        messageScrollAreaRootRef={messageScrollAreaRootRef}
        messages={messages}
        onCopyLink={onCopyLink}
        onCopyMessage={onCopyMessage}
        onDelete={onDelete}
        onDeleteAttachment={onDeleteAttachment}
        onRetryUploadingAttachment={onRetryUploadingAttachment}
        onRemoveUploadingAttachment={onRemoveUploadingAttachment}
        onEdit={onEdit}
        onEmojiPick={onEmojiPick}
        onForward={onForward}
        onForwardSourceOpen={onForwardSourceOpen}
        canOpenForwardSourceConversation={canOpenForwardSourceConversation}
        onHydrateReactionActors={onHydrateReactionActors}
        onInlineEditCancel={onInlineEditCancel}
        onInlineEditRemoveAttachment={onInlineEditRemoveAttachment}
        onInlineEditSave={onInlineEditSave}
        onJumpToLatest={handleJumpToLatest}
        onLoadOlderMessages={requestOlderMessages}
        onReply={onReply}
        onDismissOptimisticMessage={onDismissOptimisticMessage}
        onOpenMessageLink={onOpenMessageLink}
        onRetryOptimisticMessage={onRetryOptimisticMessage}
        onTogglePinMessage={onTogglePinMessage}
        onToggleReaction={onToggleReaction}
        unseenIncomingCount={unseenIncomingCount}
        uploadingAttachmentsByMessageId={uploadingAttachmentsByMessageId}
      />

      {isActive ? <TeamChatTypingIndicator text={typingIndicatorText} /> : null}

      {isActive && composerScheduledNotice ? (
        <div className="mx-4 mb-3 rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground sm:mx-6">
          <span>{composerScheduledNotice.label} </span>
          <button
            type="button"
            onClick={onOpenScheduledMessages}
            className="cursor-pointer font-semibold text-cyan-300 transition-colors hover:text-cyan-200"
          >
            {composerScheduledNotice.ctaLabel}
          </button>
        </div>
      ) : null}

      {isActive ? (
        <TeamChatComposerPanel
        key={`composer:${conversationKey}:${composerResetKey}`}
        activeConversationPlaceholder={activeConversationPlaceholder}
        canSendMessage={canSendMessage}
        composerAttachments={composerAttachments}
        draftSeedValue={draftSeedValue}
        draftSeedPayload={draftSeedPayload}
        composerResetKey={composerResetKey}
        composerState={composerState}
        conversationKey={conversationKey}
        mentionCandidates={mentionCandidates}
        mentionContextKind={mentionContextKind}
        readOnlyVariant={readOnlyVariant}
        onCancelComposer={onCancelComposer}
          onComposerAttachmentRemove={onComposerAttachmentRemove}
          onComposerAttachmentSelect={onComposerAttachmentSelect}
          onDraftChange={onDraftChange}
          onDraftPresenceChange={onDraftPresenceChange}
          onOpenMessageLink={onOpenMessageLink}
          onSchedule={onSchedule}
          onSend={handleComposerSend}
        />
      ) : null}
    </>
  );
}
