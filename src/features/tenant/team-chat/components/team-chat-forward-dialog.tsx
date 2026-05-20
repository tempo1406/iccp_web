import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Code2, Hash, Italic, Link2, List, ListOrdered, Search, Type, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { TeamChatMessageAttachments } from './team-chat-message-attachments';
import {
  type ConversationKey,
  type ConversationKind,
  type ConversationMessage,
  type PresenceStatus,
} from '../data/team-chat-ui-data';
import { focusRingClass, initials, presenceDotClass } from '../lib/team-chat-screen.shared';
import { resolveConversationMessageForwardPreview } from '../lib/screen-controller/team-chat-controller-message.utils';
import { TeamChatConversationIcon } from './team-chat-conversation-icon';

interface ForwardTarget {
  key: ConversationKey;
  kind: ConversationKind;
  id: string;
  title: string;
  subtitle: string;
  visibility?: 'public' | 'private';
  status?: PresenceStatus;
  avatarUrl?: string;
}

interface ForwardState {
  message: ConversationMessage;
  sourceConversationLabel: string;
  sourceConversationSubtitle: string;
}

interface TeamChatForwardDialogProps {
  open: boolean;
  forwardState: ForwardState | null;
  targets: ForwardTarget[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { note: string; targetKeys: ConversationKey[] }) => void;
}

const noopDeleteAttachment = () => {};

export function TeamChatForwardDialog({
  open,
  forwardState,
  targets,
  onOpenChange,
  onSubmit,
}: TeamChatForwardDialogProps) {
  const t = useTranslations('teamChat');
  const [targetPickerOpen, setTargetPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [note, setNote] = useState('');
  const [selectedTargetKeys, setSelectedTargetKeys] = useState<ConversationKey[]>([]);
  const deferredQuery = useDeferredValue(query);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!targetPickerOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setTargetPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [targetPickerOpen]);

  const targetLookup = useMemo(
    () => new Map(targets.map((target) => [target.key, target] as const)),
    [targets],
  );
  const selectedTargetKeySet = useMemo(
    () => new Set(selectedTargetKeys),
    [selectedTargetKeys],
  );
  const selectedTargets = useMemo(
    () =>
      selectedTargetKeys
        .map((targetKey) => targetLookup.get(targetKey) ?? null)
        .filter((target): target is ForwardTarget => Boolean(target)),
    [selectedTargetKeys, targetLookup],
  );
  const filteredTargets = useMemo(() => {
    const visibleTargets = targets.filter((target) => !selectedTargetKeySet.has(target.key));
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    if (!normalizedQuery) return visibleTargets;

    return visibleTargets.filter((target) =>
      `${target.title} ${target.subtitle}`.toLowerCase().includes(normalizedQuery),
    );
  }, [deferredQuery, selectedTargetKeySet, targets]);

  const showSuggestions = targetPickerOpen;
  const previewMessage = forwardState?.message;
  const previewMessageId = previewMessage?.id ?? 'forward-preview';
  const previewAttachments = previewMessage?.forwardedMessage
    ? undefined
    : previewMessage?.attachments;
  const previewContent = previewMessage
    ? resolveConversationMessageForwardPreview(previewMessage).content
    : '';

  const handleSelectTarget = (targetKey: ConversationKey) => {
    const target = targetLookup.get(targetKey);
    if (!target) return;

    setSelectedTargetKeys((previous) => {
      const isBroadcastConversationTarget =
        target.kind === 'channel' || target.kind === 'group_dm';

      if (isBroadcastConversationTarget) {
        const directMessageTargetKeys = previous.filter(
          (key) => !key.startsWith('channel:') && !key.startsWith('group_dm:'),
        );
        return [...directMessageTargetKeys, target.key];
      }

      if (previous.includes(target.key)) {
        return previous;
      }

      return [...previous, target.key];
    });
    setQuery('');

    if (target.kind === 'channel') {
      setTargetPickerOpen(false);
    } else {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleRemoveTarget = (targetKey: ConversationKey) => {
    setSelectedTargetKeys((previous) => previous.filter((key) => key !== targetKey));
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setTargetPickerOpen(false);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="grid h-[min(88vh,760px)] max-h-[88vh] w-[min(94vw,780px)] max-w-[780px] grid-rows-[auto,minmax(0,1fr),auto] overflow-hidden border-border bg-card p-0 shadow-2xl sm:max-w-[780px]">
        <div className="px-5 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
          <DialogTitle className="text-[1.7rem] font-bold tracking-tight text-foreground">
            {t('forwardDialog.title')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('forwardDialog.description')}
          </DialogDescription>
        </div>

        <div className="min-h-0 overflow-hidden px-5 pb-0 sm:px-6">
          <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
            <div ref={pickerRef} className="space-y-2">
              <div className="relative">
                <div className="rounded-2xl border border-border bg-background px-3 py-2 shadow-sm transition-colors focus-within:border-primary/40">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={inputRef}
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setTargetPickerOpen(true);
                      }}
                      onFocus={() => setTargetPickerOpen(true)}
                      placeholder={t('forwardDialog.searchPlaceholder')}
                      className="h-10 min-w-[180px] flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
                    />
                  </div>
                </div>

                {showSuggestions ? (
                  <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-[18px] border border-border bg-popover p-0 shadow-2xl">
                    <ScrollArea className="max-h-[260px]">
                      <div className="divide-y divide-border">
                        {filteredTargets.map((target) => {
                          const isSelected = selectedTargetKeySet.has(target.key);

                          return (
                            <button
                              key={target.key}
                              type="button"
                              onClick={() => handleSelectTarget(target.key)}
                              className={cn(
                                'flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40',
                                isSelected && 'bg-primary/8',
                                focusRingClass,
                              )}
                            >
                              <TeamChatConversationIcon
                                kind={target.kind}
                                title={target.title}
                                visibility={target.visibility}
                                avatarUrl={target.avatarUrl}
                                status={target.status}
                                size="md"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="truncate text-sm font-semibold text-foreground">
                                    {target.title}
                                  </p>
                                  {target.kind === 'dm' && target.status ? (
                                    <span
                                      className={cn(
                                        'h-2.5 w-2.5 rounded-full',
                                        presenceDotClass(target.status),
                                      )}
                                    />
                                  ) : null}
                                </div>
                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                  {target.subtitle}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                        {filteredTargets.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            {t('forwardDialog.emptySearch')}
                          </div>
                        ) : null}
                      </div>
                    </ScrollArea>
                  </div>
                ) : null}
              </div>

              {selectedTargets.length ? (
                <div className="flex flex-wrap gap-2">
                  {selectedTargets.map((target) => (
                    <div
                      key={target.key}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-2.5 py-1.5 text-sm font-medium text-foreground"
                    >
                      <TeamChatConversationIcon
                        kind={target.kind}
                        title={target.title}
                        visibility={target.visibility}
                        avatarUrl={target.avatarUrl}
                        status={target.status}
                        size="sm"
                      />
                      <span>{target.title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTarget(target.key)}
                        className={cn(
                          'flex h-5 w-5 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                          focusRingClass,
                        )}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-background">
              <div className="flex items-center gap-1 border-b border-border px-3 py-2">
                {[Type, Italic, Link2, ListOrdered, List, Code2].map((Icon, index) => (
                  <button
                    key={`forward-toolbar-${index}`}
                    type="button"
                    className={cn(
                      'flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                      focusRingClass,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder={t('forwardDialog.notePlaceholder')}
                className="min-h-[88px] w-full resize-none border-0 bg-transparent px-4 py-4 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground sm:min-h-[104px]"
              />
              <div className="min-h-0 flex-1 border-t border-border px-3 py-3 sm:px-4 sm:py-4">
                <ScrollArea className="h-full min-h-0 pr-2">
                  <div className="w-full max-w-full pr-2 pb-6">
                    <div className="max-w-full overflow-hidden rounded-[22px] border border-border/80 border-l-2 border-l-primary/50 bg-muted/20 px-4 py-3">
                      <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-border bg-background/70 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        {t('messageList.forwarded')}
                      </div>
                      <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarImage src={forwardState?.message.avatarUrl} alt={forwardState?.message.author} />
                          <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                            {initials(forwardState?.message.author ?? 'User')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="text-sm font-semibold text-foreground">
                              {forwardState?.message.author}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {forwardState?.message.time}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {forwardState?.sourceConversationLabel}
                            {forwardState?.sourceConversationSubtitle
                              ? ` - ${forwardState.sourceConversationSubtitle}`
                              : ''}
                          </p>
                          {previewContent ? (
                            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                              {previewContent}
                            </p>
                          ) : null}
                          {previewAttachments?.length ? (
                            <div className="mt-3 w-full max-w-full">
                              <TeamChatMessageAttachments
                                attachments={previewAttachments}
                                displayMode="compact"
                                messageId={previewMessageId + '-forward-dialog-preview'}
                                onDeleteAttachment={noopDeleteAttachment}
                              />
                            </div>
                          ) : !previewContent ? (
                            <p className="mt-2 text-sm text-muted-foreground">
                              {t('forwardDialog.attachmentFallback')}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border bg-card px-5 py-4 sm:px-6">
          <Button
            type="button"
            className="cursor-pointer rounded-xl"
            onClick={() => onSubmit({ note, targetKeys: selectedTargetKeys })}
            disabled={selectedTargets.length === 0}
          >
            {t('forwardDialog.submit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
