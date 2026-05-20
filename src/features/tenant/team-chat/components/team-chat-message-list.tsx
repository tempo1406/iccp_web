import { useMemo, useState, type RefObject } from 'react';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import {
  EmojiStyle,
  Theme as EmojiPickerTheme,
  type EmojiClickData,
} from 'emoji-picker-react';
import {
  ArrowDown,
  Copy,
  EllipsisVertical,
  Forward,
  Hash,
  Link2,
  Lock,
  Pencil,
  Pin,
  PinOff,
  Reply,
  Smile,
  Trash2,
  Users,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TabsContent } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  quickReactionEmojis,
  type ConversationKey,
  type ConversationMessage,
} from '../data/team-chat-ui-data';
import {
  emojiPickerStyle,
  focusRingClass,
  initials,
  type MentionCandidate,
  type UploadingAttachmentDraft,
} from '../lib/team-chat-screen.shared';
import { type InlineEditState } from '../lib/team-chat-messages-tab.shared';
import { TeamChatConfirmActionDialog } from './team-chat-confirm-action-dialog';
import { TeamChatInlineEditPanel } from './team-chat-inline-edit-panel';
import { TeamChatMessageAttachments } from './team-chat-message-attachments';
import { TeamChatMessageLinkPreviewList } from './team-chat-message-link-preview-list';
import { TeamChatMessageRichText } from './team-chat-message-rich-text';
import { TeamChatReactionChip } from './team-chat-reaction-chip';

type MessageTimelineEntry =
  | {
      type: 'divider';
      key: string;
      label: string;
    }
  | {
      type: 'message';
      key: string;
      message: ConversationMessage;
    };

interface TeamChatMessageListProps {
  canForwardMessages?: boolean;
  canLoadOlderMessages?: boolean;
  canReactToMessages?: boolean;
  canReplyToMessages?: boolean;
  readOnlyForwardOnlyActions?: boolean;
  canTogglePinMessages?: boolean;
  canEditOwnMessages?: boolean;
  canDeleteOwnMessages?: boolean;
  conversationKey: ConversationKey;
  highlightedMessageId: string | null;
  inlineEditState: InlineEditState | null;
  isLoadingOlderMessages?: boolean;
  mentionCandidates: MentionCandidate[];
  messageContentRef: RefObject<HTMLDivElement | null>;
  messageScrollAreaRootRef: RefObject<HTMLDivElement | null>;
  messages: ConversationMessage[];
  onCopyLink: (message: ConversationMessage) => void;
  onCopyMessage: (message: ConversationMessage) => void;
  onDelete: (message: ConversationMessage) => void;
  onDeleteAttachment: (messageId: string, attachmentId: string) => void;
  onRetryUploadingAttachment: (messageId: string, attachmentId: string) => void;
  onRemoveUploadingAttachment: (messageId: string, attachmentId: string) => void;
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
  onHydrateReactionActors?: (
    messageId: string,
  ) => Promise<ConversationMessage['reactions'] | undefined>;
  onInlineEditCancel: () => void;
  onInlineEditRemoveAttachment: (attachmentId: string) => void;
  onInlineEditSave: (value: string) => void;
  onJumpToLatest: () => void;
  onLoadOlderMessages: () => void;
  onReply: (message: ConversationMessage) => void;
  onDismissOptimisticMessage: (messageId: string) => void;
  onOpenMessageLink?: (href: string) => void;
  onRetryOptimisticMessage: (message: ConversationMessage) => void;
  onTogglePinMessage: (messageId: string, isPinned: boolean) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  unseenIncomingCount: number;
  uploadingAttachmentsByMessageId: Record<string, UploadingAttachmentDraft[]>;
}

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const noopDeleteAttachment = () => {};

function getStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getMessageDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatMessageDayLabel(
  date: Date,
  now: Date,
  locale: string,
  t: ReturnType<typeof useTranslations>,
): string {
  const dateStart = getStartOfDay(date).getTime();
  const nowStart = getStartOfDay(now).getTime();
  const diffDays = Math.round((nowStart - dateStart) / DAY_IN_MS);

  if (diffDays === 0) return t('messageList.today');
  if (diffDays === 1) return t('messageList.yesterday');

  const sameYear = date.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(date);
}

export function TeamChatMessageList({
  canForwardMessages = true,
  canLoadOlderMessages,
  canReactToMessages = true,
  canReplyToMessages = true,
  readOnlyForwardOnlyActions = false,
  canTogglePinMessages = true,
  canEditOwnMessages = true,
  canDeleteOwnMessages = true,
  conversationKey,
  highlightedMessageId,
  inlineEditState,
  isLoadingOlderMessages,
  mentionCandidates,
  messageContentRef,
  messageScrollAreaRootRef,
  messages,
  onCopyLink,
  onCopyMessage,
  onDelete,
  onDeleteAttachment,
  onRetryUploadingAttachment,
  onRemoveUploadingAttachment,
  onEdit,
  onEmojiPick,
  onForward,
  onForwardSourceOpen,
  canOpenForwardSourceConversation,
  onHydrateReactionActors,
  onInlineEditCancel,
  onInlineEditRemoveAttachment,
  onInlineEditSave,
  onJumpToLatest,
  onLoadOlderMessages,
  onReply,
  onDismissOptimisticMessage,
  onOpenMessageLink,
  onRetryOptimisticMessage,
  onTogglePinMessage,
  onToggleReaction,
  unseenIncomingCount,
  uploadingAttachmentsByMessageId,
}: TeamChatMessageListProps) {
  const t = useTranslations('teamChat');
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const [optimisticMessageToDismiss, setOptimisticMessageToDismiss] =
    useState<ConversationMessage | null>(null);

  const mentionNameLookup = useMemo(
    () =>
      Array.from(
        new Set(
          mentionCandidates
            .map((candidate) => candidate.name?.trim())
            .filter((name): name is string => Boolean(name)),
        ),
      ).sort((left, right) => right.length - left.length),
    [mentionCandidates],
  );

  const messageTimelineEntries = useMemo<MessageTimelineEntry[]>(() => {
    const entries: MessageTimelineEntry[] = [];
    const now = new Date();
    let previousDayKey: string | null = null;

    messages.forEach((message) => {
      const parsedSentAt = message.sentAt ? new Date(message.sentAt) : null;
      const isValidSentAt = parsedSentAt && !Number.isNaN(parsedSentAt.getTime());
      if (isValidSentAt) {
        const dayKey = getMessageDayKey(parsedSentAt);
        if (dayKey !== previousDayKey) {
          previousDayKey = dayKey;
          entries.push({
            type: 'divider',
            key: `divider-${dayKey}-${message.id}`,
            label: formatMessageDayLabel(parsedSentAt, now, locale, t),
          });
        }
      }

      entries.push({
        type: 'message',
        key: message.id,
        message,
      });
    });

    return entries;
  }, [locale, messages, t]);

  return (
    <TabsContent
      value="messages"
      forceMount
      className="flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
    >
      <div className="bg-background flex h-full min-h-0 flex-1 flex-col" data-conversation-key={conversationKey}>
        <div ref={messageScrollAreaRootRef} className="relative min-h-0 flex-1 overflow-hidden">
          {unseenIncomingCount > 0 ? (
            <div className="pointer-events-none absolute right-6 bottom-5 z-20">
              <button
                type="button"
                onClick={onJumpToLatest}
                className={cn(
                  'border-border/80 bg-popover/95 hover:bg-popover text-foreground pointer-events-auto inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium shadow-[0_10px_28px_-18px_rgba(15,23,42,0.7)] backdrop-blur',
                  focusRingClass,
                )}
                aria-label={t('messageList.jumpAria', { count: unseenIncomingCount })}
              >
                <ArrowDown className="h-3.5 w-3.5" />
                <span>{t('messageList.jumpToLatest')}</span>
                <span className="bg-primary text-primary-foreground inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold">
                  {unseenIncomingCount > 99 ? '99+' : unseenIncomingCount}
                </span>
              </button>
            </div>
          ) : null}

          <ScrollArea className="h-full min-h-0">
            <div ref={messageContentRef} className="space-y-7 px-4 py-5 pb-6 sm:px-6 sm:pb-8">
              {canLoadOlderMessages ? (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onLoadOlderMessages}
                    disabled={isLoadingOlderMessages}
                    className="h-9 rounded-full px-4 text-xs"
                  >
                    {isLoadingOlderMessages ? t('messageList.loadingOlder') : t('messageList.loadOlder')}
                  </Button>
                </div>
              ) : null}

              {messageTimelineEntries.map((entry) => {
                if (entry.type === 'divider') {
                  return (
                    <div key={entry.key} className="flex items-center gap-3 py-1">
                      <div className="h-px flex-1 bg-border/70" />
                      <span className="rounded-full border border-border/80 bg-muted/55 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground">
                        {entry.label}
                      </span>
                      <div className="h-px flex-1 bg-border/70" />
                    </div>
                  );
                }

                const message = entry.message;
                const isEditing = inlineEditState?.messageId === message.id;
                const isOptimisticMessage = Boolean(message.isOptimistic);
                const isOwnMessage = Boolean(message.isOwn);

                if (message.isSystem) {
                  return (
                    <div
                      key={message.id}
                      id={message.id}
                      data-message-id={message.id}
                      className="flex justify-center py-1"
                    >
                      <div
                        className={cn(
                          'max-w-[80%] rounded-full border border-border/70 bg-muted/35 px-3 py-1.5 text-center text-xs text-muted-foreground',
                          highlightedMessageId === message.id && 'ring-1 ring-primary/30',
                        )}
                      >
                        <span>{message.content || t('messageList.systemUpdate')}</span>
                        {message.time ? (
                          <span className="ml-1 text-[10px] opacity-80">{message.time}</span>
                        ) : null}
                      </div>
                    </div>
                  );
                }

                const visibleBodyAttachments = message.forwardedMessage
                  ? undefined
                  : message.attachments;
                const visibleForwardedAttachments = message.forwardedMessage?.attachments;
                const hasVisibleAttachments =
                  Boolean(visibleBodyAttachments?.length) ||
                  Boolean(visibleForwardedAttachments?.length) ||
                  Boolean(uploadingAttachmentsByMessageId[message.id]?.length);
                const shouldHideAttachmentPlaceholder =
                  message.isAttachmentPlaceholder ||
                  (hasVisibleAttachments && message.content.trim().toLowerCase() === 'attachment');

                return (
                  <article
                    key={message.id}
                    id={message.id}
                    data-message-id={message.id}
                    className={cn(
                      'group relative flex w-fit max-w-full items-start gap-3 rounded-2xl px-2 py-2 hover:bg-muted/30',
                      isOwnMessage ? 'ml-auto flex-row-reverse' : 'mr-auto',
                      message.isPinned && 'bg-[#302e25] hover:bg-[#302e25]',
                      !message.isPinned && highlightedMessageId === message.id && 'bg-primary/8',
                      !message.isPinned && isEditing && 'bg-muted/25',
                      highlightedMessageId === message.id && 'ring-1 ring-primary/30',
                      isEditing && 'ring-1 ring-primary/20',
                    )}
                  >
                    <Avatar className="border-border h-10 w-10 shrink-0 border">
                      <AvatarImage src={message.avatarUrl} alt={message.author} />
                      <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
                        {initials(message.author)}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className={cn(
                        'relative min-w-0 max-w-[min(82vw,52rem)] rounded-2xl border px-3.5 py-2.5 shadow-sm',
                        isOwnMessage
                          ? 'rounded-br-md border-blue-200 bg-blue-100 text-slate-900 dark:border-blue-800/60 dark:bg-blue-950/55 dark:text-slate-100'
                          : 'rounded-bl-md border-slate-200 bg-slate-100 text-slate-900 dark:border-slate-700/70 dark:bg-slate-800/70 dark:text-slate-100',
                      )}
                    >
                      <header
                        className={cn(
                          'flex flex-wrap items-baseline gap-2',
                          isOwnMessage && 'justify-end',
                        )}
                      >
                        <p className="text-base leading-normal font-semibold">{message.author}</p>
                        <span className="text-muted-foreground text-xs">{message.time}</span>
                        {message.isEdited ? (
                          <span className="text-muted-foreground text-[11px]">{t('messageList.edited')}</span>
                        ) : null}
                        {message.isPinned ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            <Pin className="h-3 w-3" />
                            {t('messageList.pinned')}
                          </span>
                        ) : null}
                      </header>

                      {isEditing ? (
                        <TeamChatInlineEditPanel
                          allowsEmptyDraft={Boolean(inlineEditState?.allowsEmptyDraft)}
                          draft={inlineEditState?.draft ?? ''}
                          message={message}
                          removedAttachmentIds={inlineEditState?.removedAttachmentIds ?? []}
                          onCancel={onInlineEditCancel}
                          onRemoveAttachment={onInlineEditRemoveAttachment}
                          onSave={onInlineEditSave}
                        />
                      ) : (
                        <>
                          {message.isDeleted ? (
                            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/35 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>{t('messageList.deleted')}</span>
                            </div>
                          ) : null}

                          {!message.isDeleted && message.quote ? (
                            <div className="border-primary/35 bg-muted/35 mt-2 rounded-r-lg border-l-2 px-3 py-2">
                              <p className="text-muted-foreground text-xs">
                                {message.quote.author}
                                <span className="ml-1">{message.quote.time}</span>
                              </p>
                              <div className="text-muted-foreground mt-1 text-sm leading-6 break-words whitespace-pre-wrap">
                                <TeamChatMessageRichText
                                  text={message.quote.content}
                                  mentionNames={mentionNameLookup}
                                  onOpenMessageLink={onOpenMessageLink}
                                />
                              </div>
                            </div>
                          ) : null}

                          {!message.isDeleted && message.content && !shouldHideAttachmentPlaceholder ? (
                            <div className="text-foreground mt-1 text-sm leading-6 break-words whitespace-pre-wrap">
                              <TeamChatMessageRichText
                                text={message.content}
                                mentionNames={mentionNameLookup}
                                onOpenMessageLink={onOpenMessageLink}
                                contentFormat={message.contentFormat}
                                richContent={message.richContent}
                              />
                            </div>
                          ) : null}

                          {!message.isDeleted && message.deliveryStatus === 'failed' ? (
                            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                              <span className="font-medium text-rose-300/90">{t('messageList.notSent')}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onRetryOptimisticMessage(message)}
                                className="text-foreground/85 hover:text-foreground h-6 rounded-full px-2.5 text-[11px]"
                              >
                                {t('messageList.retry')}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setOptimisticMessageToDismiss(message)}
                                className="text-muted-foreground hover:text-foreground h-6 rounded-full px-2.5 text-[11px]"
                              >
                                {t('messageList.remove')}
                              </Button>
                            </div>
                          ) : null}

                          {!message.isDeleted ? (
                            <TeamChatMessageAttachments
                              attachments={visibleBodyAttachments}
                              isOwn={message.isOwn}
                              messageId={message.id}
                              onDeleteAttachment={onDeleteAttachment}
                              onRetryUploadingAttachment={onRetryUploadingAttachment}
                              onRemoveUploadingAttachment={onRemoveUploadingAttachment}
                              uploadingAttachments={uploadingAttachmentsByMessageId[message.id]}
                            />
                          ) : null}

                          {!message.isDeleted && message.forwardedMessage ? (
                            <div className="border-border bg-card/70 mt-3 max-w-2xl rounded-2xl border px-4 py-3">
                              <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-border bg-background/80 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                <Forward className="h-3 w-3" />
                                {t('messageList.forwarded')}
                              </div>
                              <div className="flex items-start gap-3">
                                <Avatar className="border-border h-9 w-9 border">
                                  <AvatarImage
                                    src={message.forwardedMessage.originalAvatarUrl}
                                    alt={message.forwardedMessage.originalAuthor}
                                  />
                                  <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
                                    {initials(message.forwardedMessage.originalAuthor)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-foreground text-sm font-semibold">
                                      {message.forwardedMessage.originalAuthor}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                      {message.forwardedMessage.originalTime}
                                    </span>
                                  </div>
                                  {message.forwardedMessage.originalContent.trim().length > 0 ? (
                                    <div className="text-foreground mt-1 text-sm leading-6 break-words whitespace-pre-wrap">
                                      <TeamChatMessageRichText
                                        text={message.forwardedMessage.originalContent}
                                        mentionNames={mentionNameLookup}
                                        onOpenMessageLink={onOpenMessageLink}
                                        contentFormat={message.forwardedMessage.originalContentFormat}
                                        richContent={message.forwardedMessage.originalRichContent}
                                      />
                                    </div>
                                  ) : null}
                                  {visibleForwardedAttachments?.length ? (
                                    <TeamChatMessageAttachments
                                      attachments={visibleForwardedAttachments}
                                      isOwn={false}
                                      messageId={`${message.id}-forwarded-preview`}
                                      onDeleteAttachment={noopDeleteAttachment}
                                    />
                                  ) : null}
                                  <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-2 text-xs">
                                    {(() => {
                                      const sourceAvailability = canOpenForwardSourceConversation
                                        ? canOpenForwardSourceConversation(
                                            message.forwardedMessage!.sourceConversationKey,
                                            {
                                              visibility:
                                                message.forwardedMessage!.sourceConversationVisibility,
                                            },
                                          )
                                        : 'available';
                                      const isPrivateSourceConversation =
                                        message.forwardedMessage!.sourceConversationKind ===
                                          'channel' &&
                                        message.forwardedMessage!.sourceConversationVisibility ===
                                          'private';
                                      const shouldRedactPrivateSourceLabel =
                                        isPrivateSourceConversation &&
                                        sourceAvailability !== 'available';
                                      const sourceConversationLabel =
                                        shouldRedactPrivateSourceLabel
                                          ? 'Private conversation'
                                          : message.forwardedMessage!.sourceConversationContext;
                                      const shouldShowOpenSourceButton =
                                        sourceAvailability !== 'private_inaccessible';

                                      return (
                                        <>
                                    <span className="inline-flex items-center gap-1.5">
                                      {message.forwardedMessage.sourceConversationKind === 'channel' ? (
                                        message.forwardedMessage.sourceConversationVisibility === 'private' ? (
                                          <Lock className="h-3.5 w-3.5" />
                                        ) : (
                                          <Hash className="h-3.5 w-3.5" />
                                        )
                                      ) : message.forwardedMessage.sourceConversationKind === 'group_dm' ? (
                                        <Users className="h-3.5 w-3.5" />
                                      ) : (
                                        <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground">@</span>
                                      )}
                                      <span>{sourceConversationLabel}</span>
                                    </span>
                                    <span>&bull;</span>
                                    <span>{message.forwardedMessage.sourceDateLabel}</span>
                                    {shouldShowOpenSourceButton ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onForwardSourceOpen(
                                            message.forwardedMessage!.sourceConversationKey,
                                            message.forwardedMessage!.originalMessageId,
                                          )
                                        }
                                        className={cn(
                                          'text-primary hover:text-primary/80 cursor-pointer font-medium transition-colors',
                                          focusRingClass,
                                        )}
                                      >
                                        View conversation
                                      </button>
                                    ) : null}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          {!message.isDeleted && message.imagePreview ? (
                            <div className="border-border bg-muted/25 mt-3 max-w-2xl rounded-xl border p-2">
                              <div className="border-border from-muted via-card to-background flex aspect-[16/9] items-center justify-center rounded-lg border bg-gradient-to-br">
                                <div className="space-y-1 text-center">
                                  <p className="text-sm font-medium">{message.imagePreview.title}</p>
                                  <p className="text-muted-foreground text-xs">
                                    {message.imagePreview.fileName}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          {!message.isDeleted ? (
                            <TeamChatMessageLinkPreviewList
                              message={message}
                              onOpenMessageLink={onOpenMessageLink}
                            />
                          ) : null}

                          {!message.isDeleted && message.reactions?.length ? (
                            <TooltipProvider delayDuration={120}>
                              <div
                                className={cn(
                                  'mt-3 flex flex-wrap items-center gap-2',
                                  isOwnMessage && 'justify-end',
                                )}
                              >
                                {message.reactions.map((reaction) => (
                                  <TeamChatReactionChip
                                    key={`${message.id}-${reaction.emoji}`}
                                    messageId={message.id}
                                    reaction={reaction}
                                    onToggleReaction={onToggleReaction}
                                    interactive={canReactToMessages}
                                    onHydrateActors={onHydrateReactionActors}
                                  />
                                ))}
                              </div>
                            </TooltipProvider>
                          ) : null}
                        </>
                      )}
                      {!isEditing && !message.isDeleted && !isOptimisticMessage ? (
                        <div
                          className={cn(
                            'pointer-events-none absolute -top-12 z-20 opacity-0 transition-all duration-150 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100',
                            isOwnMessage ? 'right-1' : 'left-1',
                          )}
                        >
                          <div className="border-border bg-background/95 rounded-2xl border p-1 shadow-xl backdrop-blur">
                            <div className="max-w-[min(calc(100vw-2.5rem),40rem)] overflow-x-auto">
                              <div className="flex min-w-max items-center gap-1">
                                {canReactToMessages ? (
                                  <>
                                    {quickReactionEmojis.map((emoji) => (
                                      <button
                                        key={`${message.id}-${emoji}`}
                                        type="button"
                                        onClick={() => onToggleReaction(message.id, emoji)}
                                        aria-label={t('messageList.reactWith', { emoji })}
                                        className={cn(
                                          'hover:bg-muted flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-lg transition-colors',
                                          focusRingClass,
                                        )}
                                      >
                                        <span>{emoji}</span>
                                      </button>
                                    ))}

                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <button
                                          type="button"
                                          aria-label={t('messageList.moreReactions')}
                                          className={cn(
                                            'text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl transition-colors',
                                            focusRingClass,
                                          )}
                                        >
                                          <Smile className="h-4 w-4" />
                                        </button>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        align={isOwnMessage ? 'end' : 'start'}
                                        className="border-border bg-popover w-auto rounded-2xl border p-0 shadow-2xl"
                                      >
                                        <EmojiPicker
                                          theme={
                                            resolvedTheme === 'dark'
                                              ? EmojiPickerTheme.DARK
                                              : EmojiPickerTheme.LIGHT
                                          }
                                          emojiStyle={EmojiStyle.NATIVE}
                                          width={320}
                                          height={380}
                                          previewConfig={{ showPreview: false }}
                                          searchPlaceholder={t('messageList.searchEmoji')}
                                          style={emojiPickerStyle}
                                          onEmojiClick={(emojiData) => onEmojiPick(message.id, emojiData)}
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </>
                                ) : null}

                                {canReactToMessages &&
                                (canReplyToMessages || canForwardMessages) &&
                                !readOnlyForwardOnlyActions ? (
                                  <div className="bg-border mx-1 h-5 w-px" />
                                ) : null}

                                {canReplyToMessages && !readOnlyForwardOnlyActions ? (
                                  <button
                                    type="button"
                                    onClick={() => onReply(message)}
                                    className={cn(
                                      'text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl transition-colors',
                                      focusRingClass,
                                    )}
                                  >
                                    <Reply className="h-4 w-4" />
                                  </button>
                                ) : null}

                                {canForwardMessages ? (
                                  <button
                                    type="button"
                                    onClick={() => onForward(message)}
                                    className={cn(
                                      'text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl transition-colors',
                                      focusRingClass,
                                    )}
                                  >
                                    <Forward className="h-4 w-4" />
                                  </button>
                                ) : null}

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className={cn(
                                        'text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl transition-colors',
                                        focusRingClass,
                                      )}
                                    >
                                      <EllipsisVertical className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="border-border bg-popover w-56 rounded-2xl p-2"
                                  >
                                    {canForwardMessages && !readOnlyForwardOnlyActions ? (
                                      <DropdownMenuItem
                                        className="cursor-pointer rounded-xl"
                                        onClick={() => onForward(message)}
                                      >
                                        <Forward className="h-4 w-4" />
                                        {t('messageList.forward')}
                                      </DropdownMenuItem>
                                    ) : null}
                                    {canReplyToMessages && !readOnlyForwardOnlyActions ? (
                                      <DropdownMenuItem
                                        className="cursor-pointer rounded-xl"
                                        onClick={() => onReply(message)}
                                      >
                                        <Reply className="h-4 w-4" />
                                        {t('messageList.reply')}
                                      </DropdownMenuItem>
                                    ) : null}
                                    {canTogglePinMessages && !readOnlyForwardOnlyActions ? (
                                      <DropdownMenuItem
                                        className="cursor-pointer rounded-xl"
                                        onClick={() =>
                                          onTogglePinMessage(message.id, Boolean(message.isPinned))
                                        }
                                      >
                                        {message.isPinned ? (
                                          <PinOff className="h-4 w-4" />
                                        ) : (
                                          <Pin className="h-4 w-4" />
                                        )}
                                        {message.isPinned ? t('messageList.unpin') : t('messageList.pin')}
                                      </DropdownMenuItem>
                                    ) : null}
                                    {(
                                      canForwardMessages ||
                                      canReplyToMessages ||
                                      canTogglePinMessages
                                    ) &&
                                    !readOnlyForwardOnlyActions ? (
                                      <DropdownMenuSeparator />
                                    ) : null}
                                    <DropdownMenuItem
                                      className="cursor-pointer rounded-xl"
                                      onClick={() => onCopyLink(message)}
                                    >
                                      <Link2 className="h-4 w-4" />
                                      {t('messageList.copyLink')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="cursor-pointer rounded-xl"
                                      onClick={() => onCopyMessage(message)}
                                    >
                                      <Copy className="h-4 w-4" />
                                      {t('messageList.copyMessage')}
                                      <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                    {canEditOwnMessages && message.isOwn && !message.isDeleted ? (
                                      <DropdownMenuItem
                                        className="cursor-pointer rounded-xl"
                                        onClick={() => onEdit(message)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                        {t('messageList.editMessage')}
                                      </DropdownMenuItem>
                                    ) : null}
                                    {canDeleteOwnMessages && message.isOwn && !message.isDeleted ? (
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive cursor-pointer rounded-xl"
                                        onClick={() => onDelete(message)}
                                      >
                                        <Trash2 className="text-destructive h-4 w-4" />
                                        {t('messageList.deleteMessage')}
                                      </DropdownMenuItem>
                                    ) : null}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      <TeamChatConfirmActionDialog
        open={Boolean(optimisticMessageToDismiss)}
        onOpenChange={(open) => {
          if (!open) setOptimisticMessageToDismiss(null);
        }}
        title={t('messageList.removeFailedTitle')}
        description={t('messageList.removeFailedDescription')}
        confirmLabel={t('messageList.removeFailedConfirm')}
        onConfirm={async () => {
          if (!optimisticMessageToDismiss) return;
          onDismissOptimisticMessage(optimisticMessageToDismiss.id);
          setOptimisticMessageToDismiss(null);
        }}
      />
    </TabsContent>
  );
}
