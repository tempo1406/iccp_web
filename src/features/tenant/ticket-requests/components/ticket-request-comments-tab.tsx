'use client';

import { Loader2, MessageSquare, Send } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { TicketRequestComment } from '../../../../services/ticket/types/ticket-request.types';
import { EmptyPanelState } from './ticket-request-detail-shared';
import { formatTicketDateTime, formatTicketUser } from './ticket-request-utils';

interface TicketRequestCommentsTabProps {
  comments: TicketRequestComment[];
  isCommentsPending: boolean;
  canComment: boolean;
  commentValue: string;
  isAddingComment: boolean;
  onCommentValueChange: (value: string) => void;
  onAddComment: () => void;
}

export function TicketRequestCommentsTab({
  comments,
  isCommentsPending,
  canComment,
  commentValue,
  isAddingComment,
  onCommentValueChange,
  onAddComment,
}: TicketRequestCommentsTabProps) {
  const t = useTranslations('ticket');
  const locale = useLocale();

  return (
    <TabsContent value="comments" className="mt-5 space-y-5">
      {canComment ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{t('commentsTab.addComment')}</p>
          <Textarea
            id="ticket-comment-input"
            value={commentValue}
            onChange={(event) => onCommentValueChange(event.target.value)}
            placeholder={t('commentsTab.placeholder')}
            rows={4}
            disabled={isAddingComment}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={commentValue.trim().length === 0 || isAddingComment}
              onClick={onAddComment}
            >
              {isAddingComment ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-3.5 w-3.5" />
              )}
              {t('commentsTab.submit')}
            </Button>
          </div>
        </div>
      ) : null}

      <div className={canComment ? 'border-t border-border/60 pt-5' : undefined}>
        {isCommentsPending ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('commentsTab.loading')}</p>
        ) : comments.length === 0 ? (
          <EmptyPanelState
            icon={MessageSquare}
            title={t('commentsTab.emptyTitle')}
            description={t('commentsTab.emptyDescription')}
          />
        ) : (
          <ScrollArea className="max-h-[42vh]">
            <div className="divide-y divide-border/60">
              {comments.map((comment) => (
                <div key={comment.id} className="py-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-semibold text-foreground">
                        {formatTicketUser(comment.author)}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {comment.author.email}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTicketDateTime(comment.createdAt, locale)}
                    </span>
                  </div>
                  <p className="text-sm leading-7 whitespace-pre-wrap text-foreground">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </TabsContent>
  );
}
