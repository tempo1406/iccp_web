'use client';
import { useEffect, useRef } from 'react';
import { Copy, ExternalLink, FileText, Loader2, Sparkles, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { MarkdownContent } from './markdown-content';
import type { UiMessage } from '../types';

function classifyUserMessage(text: string): { rich: boolean; content: string } {
  const t = text.trim();

  if (
    t.includes('```') ||
    t.includes('`') ||
    t.includes('**') ||
    t.includes('# ') ||
    t.includes('- [')
  ) {
    return { rich: true, content: text };
  }

  if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
    try {
      const parsed = JSON.parse(t);
      const pretty = JSON.stringify(parsed, null, 2);
      return { rich: true, content: '```json\n' + pretty + '\n```' };
    } catch {
      if (t.includes('\n')) {
        return { rich: true, content: '```json\n' + t + '\n```' };
      }
    }
  }

  return { rich: false, content: text };
}

interface ChatbotMessageListProps {
  messages: UiMessage[];
  isLoading?: boolean;
  isStreaming?: boolean;
  busyPendingActionId?: string | null;
  onConfirmPendingAction?: (actionId: string) => void;
  onCancelPendingAction?: (actionId: string) => void;
}

function SpinnerRow() {
  const t = useTranslations('chatbot');

  return (
    <div className="flex gap-3">
      <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="bg-muted flex items-center gap-2 rounded-2xl rounded-tl-none px-4 py-3">
        <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        <span className="text-muted-foreground text-sm">{t('messageList.thinking')}</span>
      </div>
    </div>
  );
}

export function ChatbotMessageList({
  messages,
  isLoading,
  isStreaming,
  busyPendingActionId,
  onConfirmPendingAction,
  onCancelPendingAction,
}: ChatbotMessageListProps) {
  const t = useTranslations('chatbot');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isStreaming]);

  return (
    <ScrollArea className="min-h-0 min-w-0 flex-1">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {isLoading && messages.length === 0 ? (
          <SpinnerRow />
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  msg.role === 'assistant' ? 'bg-primary/10 text-primary' : 'bg-muted',
                )}
              >
                {msg.role === 'assistant' ? (
                  <Sparkles className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>

              <div
                className={cn(
                  'flex max-w-[min(56rem,94%)] flex-col gap-2',
                  msg.role === 'user' && 'items-end',
                )}
              >
                {msg.role === 'user' ? (
                  (() => {
                    const { rich, content } = classifyUserMessage(msg.content);
                    return rich ? (
                      <div className="bg-muted/60 w-full rounded-2xl rounded-tr-none border px-4 py-3">
                        <MarkdownContent content={content} />
                      </div>
                    ) : (
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-4 py-2.5 text-sm">
                        <p className="leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    );
                  })()
                ) : (
                  <div className="w-full min-w-0">
                    {msg.isStreaming && msg.content === '' ? (
                      <span className="flex items-center gap-2 py-1 text-sm">
                        <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                        <span className="text-muted-foreground">
                          {t('messageList.thinking')}
                        </span>
                      </span>
                    ) : (
                      <>
                        <MarkdownContent
                          content={msg.content}
                          isStreaming={msg.isStreaming}
                        />
                        {msg.isStreaming ? (
                          <span className="bg-foreground ml-0.5 inline-block h-[1em] w-0.5 animate-[blink_0.8s_step-end_infinite] align-middle" />
                        ) : null}
                      </>
                    )}
                  </div>
                )}

                {msg.pending_action ? (
                  <Card className="w-full border-amber-500/20 bg-amber-500/5 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {t('messageList.pendingAction.title')}
                        </p>
                        <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
                          {msg.pending_action.preview}
                        </p>
                      </div>

                      <Badge variant="secondary" className="shrink-0">
                        {msg.pending_action.status === 'pending'
                          ? t('messageList.pendingAction.statusPending')
                          : msg.pending_action.status === 'confirmed'
                            ? t('messageList.pendingAction.statusConfirmed')
                            : msg.pending_action.status === 'executed'
                              ? 'Executed'
                              : msg.pending_action.status === 'failed'
                                ? 'Failed'
                                : msg.pending_action.status === 'expired'
                                  ? 'Expired'
                                  : t('messageList.pendingAction.statusCancelled')}
                      </Badge>
                    </div>

                    {msg.pending_action.status === 'pending' ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            onConfirmPendingAction?.(msg.pending_action!.action_id)
                          }
                          disabled={isStreaming || busyPendingActionId !== null}
                        >
                          {t('messageList.pendingAction.confirm')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            onCancelPendingAction?.(msg.pending_action!.action_id)
                          }
                          disabled={isStreaming || busyPendingActionId !== null}
                        >
                          {busyPendingActionId === msg.pending_action.action_id ? (
                            <>
                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                              {t('messageList.pendingAction.cancelling')}
                            </>
                          ) : (
                            t('messageList.pendingAction.cancel')
                          )}
                        </Button>
                      </div>
                    ) : null}
                    {msg.pending_action.error ? (
                      <p className="text-destructive mt-2 text-xs">
                        {msg.pending_action.error}
                      </p>
                    ) : null}
                  </Card>
                ) : null}

                {msg.citations.length > 0 ? (
                  <Card className="w-full p-3">
                    <p className="text-muted-foreground mb-2 text-xs font-medium">
                      {t('messageList.sources', { count: msg.citations.length })}
                    </p>
                    <div className="space-y-1.5">
                      {msg.citations.map((citation, index) => (
                        <div
                          key={`${citation.document_id}-${index}`}
                          className="bg-muted/50 flex items-center gap-2 rounded-lg p-2 text-xs"
                        >
                          <FileText className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                          <span className="min-w-0 flex-1 truncate">
                            {citation.file_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : null}

                {msg.web_sources.length > 0 ? (
                  <Card className="w-full p-3">
                    <p className="text-muted-foreground mb-2 text-xs font-medium">
                      {t('messageList.webSources', { count: msg.web_sources.length })}
                    </p>
                    <div className="space-y-1.5">
                      {msg.web_sources.map((source, index) => (
                        <a
                          key={`${source.url}-${index}`}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-muted/50 hover:bg-muted flex items-center gap-2 rounded-lg p-2 text-xs transition-colors"
                        >
                          <ExternalLink className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                          <span className="min-w-0 flex-1 truncate">{source.title}</span>
                        </a>
                      ))}
                    </div>
                  </Card>
                ) : null}

                {msg.role === 'assistant' && !msg.isStreaming ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground h-6 w-6 self-start"
                    title={t('messageList.copyResponse')}
                    onClick={() => navigator.clipboard.writeText(msg.content)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
