'use client';

import { useTranslations } from 'next-intl';
import { ArrowUpRight, Pin, PinOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TabsContent } from '@/components/ui/tabs';
import { type ConversationMessage } from '../data/team-chat-ui-data';
import { initials } from '../lib/team-chat-screen.shared';
import { TeamChatMessageAttachments } from './team-chat-message-attachments';
import { TeamChatMessageLinkPreviewList } from './team-chat-message-link-preview-list';
import { TeamChatMessageRichText } from './team-chat-message-rich-text';

interface TeamChatPinsTabProps {
  pinnedMessages: ConversationMessage[];
  pinnedCount?: number;
  canTogglePinMessage?: boolean;
  onOpenMessage: (messageId: string) => void;
  onOpenMessageLink?: (href: string) => void;
  onTogglePinMessage: (messageId: string, isPinned: boolean) => void;
}

const emptyMentionNames: string[] = [];
const noopDeleteAttachment = () => {};

function shouldHidePinnedMessagePlaceholder(message: ConversationMessage) {
  const hasVisibleAttachments = Boolean(message.attachments?.length);
  return (
    message.isAttachmentPlaceholder ||
    (hasVisibleAttachments && message.content.trim().toLowerCase() === 'attachment')
  );
}

export function TeamChatPinsTab({
  pinnedMessages,
  pinnedCount,
  canTogglePinMessage = true,
  onOpenMessage,
  onOpenMessageLink,
  onTogglePinMessage,
}: TeamChatPinsTabProps) {
  const t = useTranslations('teamChat');
  const resolvedPinnedCount =
    typeof pinnedCount === 'number' && pinnedCount >= 0
      ? pinnedCount
      : pinnedMessages.length;
  if (pinnedMessages.length === 0 && resolvedPinnedCount === 0) {
    return (
      <TabsContent
        value="pins"
        forceMount
        className="flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
      >
        <div className="flex h-full min-h-0 items-center justify-center px-6 py-10">
          <div className="max-w-md rounded-3xl border border-dashed border-border bg-muted/15 px-6 py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-sm">
              <Pin className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-base font-semibold text-foreground">{t('pins.emptyTitle')}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t('pins.emptyDescription')}
            </p>
          </div>
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent
      value="pins"
      forceMount
      className="flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
    >
      <ScrollArea className="h-full min-h-0">
        <div className="space-y-4 px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/45 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{t('pins.title')}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('pins.description')}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Pin className="h-3.5 w-3.5" />
              {t('pins.count', { count: resolvedPinnedCount })}
            </div>
          </div>

          {pinnedMessages.map((message) => {
            const shouldHideContent = shouldHidePinnedMessagePlaceholder(message);

            return (
              <article
                key={message.id}
                className="rounded-[28px] border border-border bg-card/70 px-4 py-4 shadow-sm sm:px-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={message.avatarUrl} alt={message.author} />
                        <AvatarFallback className="bg-muted text-xs font-semibold">
                          {initials(message.author)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{message.author}</span>
                          <span>{message.time}</span>
                          {message.isEdited ? <span>{t('messageList.edited')}</span> : null}
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/35 px-2 py-0.5 text-[11px] font-medium">
                            <Pin className="h-3 w-3" />
                            {t('messageList.pinned')}
                          </span>
                        </div>

                        {message.isDeleted ? (
                          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/35 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                            <PinOff className="h-3.5 w-3.5" />
                            {t('pins.deleted')}
                          </div>
                        ) : (
                          <>
                            {!shouldHideContent && message.content ? (
                              <div className="mt-3 text-sm leading-6 break-words whitespace-pre-wrap text-foreground">
                                <TeamChatMessageRichText
                                  mentionNames={emptyMentionNames}
                                  text={message.content}
                                  onOpenMessageLink={onOpenMessageLink}
                                  contentFormat={message.contentFormat}
                                  richContent={message.richContent}
                                />
                              </div>
                            ) : null}

                            <TeamChatMessageAttachments
                              attachments={message.attachments}
                              isOwn={message.isOwn}
                              messageId={message.id}
                              onDeleteAttachment={noopDeleteAttachment}
                            />

                            <TeamChatMessageLinkPreviewList
                              message={message}
                              onOpenMessageLink={onOpenMessageLink}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 lg:pt-0.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 cursor-pointer rounded-xl px-3"
                      onClick={() => onOpenMessage(message.id)}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      {t('pins.open')}
                    </Button>
                    {canTogglePinMessage ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 cursor-pointer rounded-xl px-3 text-muted-foreground hover:text-foreground"
                        onClick={() => onTogglePinMessage(message.id, true)}
                      >
                        <PinOff className="h-4 w-4" />
                        {t('pins.unpin')}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </ScrollArea>
    </TabsContent>
  );
}
