'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  type LucideIcon,
  CalendarDays,
  Clock3,
  FileText,
  Layers3,
  Loader2,
  MoreVertical,
  Pencil,
  SendHorizontal,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  type DraftHubTab,
  type TeamChatDraftItem,
  type TeamChatScheduledItem,
} from '../data/team-chat-drafts-ui-data';
import { TeamChatDeleteOutgoingDialog } from './team-chat-delete-outgoing-dialog';
import { TeamChatConversationIcon } from './team-chat-conversation-icon';
import { TeamChatScheduleDialog } from './team-chat-schedule-dialog';

interface TeamChatDraftsViewProps {
  activeTab: DraftHubTab;
  draftItems: TeamChatDraftItem[];
  draftsHasMore?: boolean;
  draftsLoading?: boolean;
  draftsLoadingMore?: boolean;
  scheduledHasMore?: boolean;
  scheduledItems: TeamChatScheduledItem[];
  scheduledLoading?: boolean;
  scheduledLoadingMore?: boolean;
  onDeleteDraft: (draftId: string) => void;
  onDeleteDrafts: (draftIds: string[]) => void;
  onDeleteScheduled: (scheduledId: string) => void;
  onEditDraft: (draftId: string) => void;
  onEditScheduled: (scheduledId: string) => void;
  onLoadMoreDrafts?: () => void;
  onLoadMoreScheduled?: () => void;
  onActiveTabChange: (tab: DraftHubTab) => void;
  onRescheduleScheduled: (scheduledId: string, scheduledFor: Date) => void;
  onScheduleDraft: (draftId: string, scheduledFor: Date) => void;
  onSendDraftNow: (draftId: string) => void;
  onSendScheduledNow: (scheduledId: string) => void;
  onConvertScheduledToDraft: (scheduledId: string) => void;
}

type ScheduleDialogState =
  | { mode: 'schedule'; draftId: string }
  | { mode: 'reschedule'; scheduledId: string }
  | null;

type DeleteDialogState =
  | { kind: 'draft'; draftId: string }
  | { kind: 'scheduled'; scheduledId: string }
  | { kind: 'bulk-draft'; draftIds: string[] }
  | null;

function conversationBadgeLabel(
  item: TeamChatDraftItem | TeamChatScheduledItem,
  t: ReturnType<typeof useTranslations>,
) {
  if (item.conversationKind === 'group_dm') return t('drafts.conversationBadge.group');
  if (item.conversationKind === 'dm') return t('drafts.conversationBadge.dm');
  if (item.conversationVisibility === 'private') return t('drafts.conversationBadge.privateChannel');
  return t('drafts.conversationBadge.channel');
}

function titleLabel(item: TeamChatDraftItem | TeamChatScheduledItem) {
  if (item.conversationKind === 'channel') {
    return item.conversationVisibility === 'private'
      ? item.conversationTitle
      : `#${item.conversationTitle}`;
  }

  return item.conversationTitle;
}

function ConversationIdentity({ item }: { item: TeamChatDraftItem | TeamChatScheduledItem }) {
  return (
    <TeamChatConversationIcon
      kind={item.conversationKind}
      title={item.conversationTitle}
      visibility={item.conversationVisibility}
      avatarUrl={item.avatarUrl}
      size="md"
    />
  );
}

function AttachmentHint({
  hint,
  t,
}: {
  hint?: TeamChatDraftItem['attachmentHint'];
  t: ReturnType<typeof useTranslations>;
}) {
  if (!hint) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-2.5 py-1 text-[11px] text-muted-foreground">
      <div
        className={cn(
          'h-4 w-4 rounded-full',
          hint === 'image'
            ? 'bg-linear-to-br from-sky-400/50 via-cyan-400/25 to-emerald-400/40'
            : 'bg-linear-to-br from-fuchsia-500/50 via-violet-500/25 to-sky-500/40',
        )}
      />
      <span>{hint === 'image' ? t('drafts.attachmentHint.image') : t('drafts.attachmentHint.code')}</span>
    </div>
  );
}

function LoadingState({ title }: { title: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/10 px-6 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/10 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background/70 text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function ActionIconButton({
  label,
  onClick,
  icon: Icon,
  danger,
}: {
  label: string;
  onClick: () => void;
  icon: LucideIcon;
  danger?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClick}
          className={cn(
            'h-9 w-9 cursor-pointer rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            danger && 'hover:bg-destructive/10 hover:text-destructive',
          )}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function LoadMoreRow({
  visible,
  loading,
  onLoadMore,
}: {
  visible?: boolean;
  loading?: boolean;
  onLoadMore?: () => void;
}) {
  const t = useTranslations('teamChat');
  if (!visible || !onLoadMore) return null;

  return (
    <div className="flex justify-center pt-2">
      <Button
        type="button"
        variant="outline"
        className="rounded-2xl px-5"
        disabled={loading}
        onClick={onLoadMore}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {t('drafts.loadMore')}
      </Button>
    </div>
  );
}

export function TeamChatDraftsView({
  activeTab,
  draftItems,
  draftsHasMore,
  draftsLoading,
  draftsLoadingMore,
  scheduledHasMore,
  scheduledItems,
  scheduledLoading,
  scheduledLoadingMore,
  onDeleteDraft,
  onDeleteDrafts,
  onDeleteScheduled,
  onEditDraft,
  onEditScheduled,
  onLoadMoreDrafts,
  onLoadMoreScheduled,
  onActiveTabChange,
  onRescheduleScheduled,
  onScheduleDraft,
  onSendDraftNow,
  onSendScheduledNow,
  onConvertScheduledToDraft,
}: TeamChatDraftsViewProps) {
  const t = useTranslations('teamChat');
  const [editMode, setEditMode] = useState(false);
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
  const [scheduleDialogState, setScheduleDialogState] = useState<ScheduleDialogState>(null);
  const [deleteDialogState, setDeleteDialogState] = useState<DeleteDialogState>(null);

  const allDraftIds = useMemo(() => draftItems.map((item) => item.id), [draftItems]);
  const allDraftsSelected = allDraftIds.length > 0 && selectedDraftIds.length === allDraftIds.length;
  const scheduleDialogInitialValue =
    scheduleDialogState?.mode === 'reschedule'
      ? new Date(
          scheduledItems.find((item) => item.id === scheduleDialogState.scheduledId)?.scheduledForIso ??
            new Date().toISOString(),
        )
      : null;
  const deleteDialogPreview = useMemo(() => {
    if (!deleteDialogState) return null;

    if (deleteDialogState.kind === 'bulk-draft') {
      const draftCount = deleteDialogState.draftIds.length;
      return {
        subjectLabel: draftCount === 1 ? t('drafts.deletePreview.draft') : t('drafts.deletePreview.selectedDrafts'),
        previewTitle:
          draftCount === 1
            ? t('drafts.deletePreview.draftSelected')
            : t('drafts.deletePreview.draftsSelected', { count: draftCount }),
        previewText:
          draftCount === 1
            ? t('drafts.deletePreview.draftRemoved')
            : t('drafts.deletePreview.draftsRemoved'),
      };
    }

    if (deleteDialogState.kind === 'draft') {
      const draftItem = draftItems.find((item) => item.id === deleteDialogState.draftId);
      if (!draftItem) return null;
      return {
        subjectLabel: t('drafts.deletePreview.draft'),
        previewTitle: titleLabel(draftItem),
        previewMeta: draftItem.updatedAtLabel,
        previewText: draftItem.preview,
      };
    }

    const scheduledItem = scheduledItems.find((item) => item.id === deleteDialogState.scheduledId);
    if (!scheduledItem) return null;

    return {
      subjectLabel: t('drafts.deletePreview.scheduledMessage'),
      previewTitle: titleLabel(scheduledItem),
      previewMeta: scheduledItem.scheduledForLabel,
      previewText: scheduledItem.preview,
    };
  }, [deleteDialogState, draftItems, scheduledItems, t]);

  const resetDraftSelection = () => {
    setEditMode(false);
    setSelectedDraftIds([]);
  };

  const handleTabChange = (nextTab: string) => {
    onActiveTabChange(nextTab as DraftHubTab);
    resetDraftSelection();
  };

  const handleConfirmDelete = () => {
    if (!deleteDialogState) return;

    if (deleteDialogState.kind === 'bulk-draft') {
      onDeleteDrafts(deleteDialogState.draftIds);
      resetDraftSelection();
      setDeleteDialogState(null);
      return;
    }

    if (deleteDialogState.kind === 'draft') {
      onDeleteDraft(deleteDialogState.draftId);
      setDeleteDialogState(null);
      return;
    }

    onDeleteScheduled(deleteDialogState.scheduledId);
    setDeleteDialogState(null);
  };

  const toggleDraftSelection = (draftId: string, checked: boolean) => {
    setSelectedDraftIds((currentIds) => {
      if (checked) {
        if (currentIds.includes(draftId)) return currentIds;
        return [...currentIds, draftId];
      }

      return currentIds.filter((itemId) => itemId !== draftId);
    });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="flex min-h-0 flex-1 overflow-hidden">
      <div className="border-b border-border px-4 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {t('drafts.header.eyebrow')}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{t('drafts.header.title')}</h1>
          </div>

          {activeTab === 'drafts' && draftItems.length > 0 ? (
            editMode ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={selectedDraftIds.length === 0}
                  onClick={() => setDeleteDialogState({ kind: 'bulk-draft', draftIds: selectedDraftIds })}
                >
                  {t('drafts.header.delete')}
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={resetDraftSelection}>
                  {t('drafts.header.done')}
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditMode(true)}>
                {t('drafts.header.edit')}
              </Button>
            )
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <TabsList variant="line" className="h-auto gap-5 rounded-none bg-transparent p-0 text-sm">
            <TabsTrigger value="drafts" className="px-0 py-2 text-base font-semibold">
              {t('drafts.header.drafts', { count: draftItems.length })}
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="px-0 py-2 text-base font-semibold">
              {t('drafts.header.scheduled', { count: scheduledItems.length })}
            </TabsTrigger>
          </TabsList>

          {editMode && activeTab === 'drafts' ? (
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={allDraftsSelected} onCheckedChange={(checked) => setSelectedDraftIds(checked ? allDraftIds : [])} />
              {t('drafts.header.selectAll')}
            </label>
          ) : null}
        </div>
      </div>

      <TooltipProvider delayDuration={120}>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4 px-4 py-5 sm:px-6">
            <div className="overflow-hidden rounded-[22px] border border-border bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(79,70,229,0.14),transparent_34%),linear-gradient(135deg,#0a0f18,#101828_58%,#0e1527)] p-3 shadow-[0_12px_30px_rgba(0,0,0,0.2)] sm:p-3.5">
              <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                <div className="max-w-[500px]">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-sky-200 uppercase">
                      <Layers3 className="h-3.5 w-3.5" />
                      {t('drafts.hero.eyebrow')}
                    </div>
                  <h2 className="mt-2 text-[1.18rem] font-semibold tracking-tight text-white sm:text-[1.32rem]">
                    {t('drafts.hero.title')}
                  </h2>
                  <p className="mt-1.5 max-w-xl text-[13px] leading-5 text-slate-300">
                    {t('drafts.hero.description')}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[13px] text-slate-200">
                      {t('drafts.hero.draftsReady', { count: draftItems.length })}
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[13px] text-slate-200">
                      {t('drafts.hero.scheduledQueue', { count: scheduledItems.length })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-start md:justify-end">
                  <div className="relative h-[112px] w-[156px] overflow-hidden rounded-[28px] shadow-[0_16px_34px_rgba(8,12,22,0.28)] sm:h-[120px] sm:w-[172px]">
                    <Image
                      src="/images/draft-scheduled-messages.jpg"
                      alt={t('drafts.hero.imageAlt')}
                      fill
                      sizes="(min-width: 640px) 172px, 156px"
                      className="rounded-[28px] object-cover"
                      priority={false}
                    />
                  </div>
                </div>
              </div>
            </div>

            {activeTab === 'drafts' ? (
              draftsLoading ? (
                <LoadingState title={t('drafts.loadingDrafts')} />
              ) : draftItems.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title={t('drafts.empty.draftsTitle')}
                  description={t('drafts.empty.draftsDescription')}
                />
              ) : (
                <div className="space-y-3">
                  {draftItems.map((item) => {
                    const selected = selectedDraftIds.includes(item.id);

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'group/card rounded-[28px] border border-border bg-card/95 px-4 py-3 shadow-sm transition-colors',
                          selected && 'border-primary/35 bg-primary/[0.05]',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {editMode ? (
                            <div className="pt-2">
                              <Checkbox checked={selected} onCheckedChange={(checked) => toggleDraftSelection(item.id, checked === true)} />
                            </div>
                          ) : null}

                          <ConversationIdentity item={item} />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-base font-semibold">{titleLabel(item)}</p>
                              <span className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                {conversationBadgeLabel(item, t)}
                              </span>
                              {item.attachmentHint ? <AttachmentHint hint={item.attachmentHint} t={t} /> : null}
                            </div>
                            <p className={cn('mt-2 line-clamp-2 pr-2 text-sm leading-6', !item.content && 'text-muted-foreground')}>
                              {item.preview}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-3 pl-2">
                            <span className="text-xs font-medium text-muted-foreground">{item.updatedAtLabel}</span>
                            {!editMode ? (
                              <div className="inline-flex items-center gap-1 rounded-2xl border border-border bg-background/92 p-1 opacity-100 transition-all md:pointer-events-none md:translate-y-1 md:opacity-0 md:group-focus-within/card:pointer-events-auto md:group-focus-within/card:translate-y-0 md:group-focus-within/card:opacity-100 md:group-hover/card:pointer-events-auto md:group-hover/card:translate-y-0 md:group-hover/card:opacity-100">
                                <ActionIconButton
                                  label={t('drafts.actions.deleteDraft')}
                                  icon={Trash2}
                                  danger
                                  onClick={() => setDeleteDialogState({ kind: 'draft', draftId: item.id })}
                                />
                                <ActionIconButton label={t('drafts.actions.editDraft')} icon={Pencil} onClick={() => onEditDraft(item.id)} />
                                <ActionIconButton label={t('drafts.actions.scheduleMessage')} icon={Clock3} onClick={() => setScheduleDialogState({ mode: 'schedule', draftId: item.id })} />
                                <ActionIconButton label={t('drafts.actions.sendMessage')} icon={SendHorizontal} onClick={() => onSendDraftNow(item.id)} />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <LoadMoreRow visible={draftsHasMore} loading={draftsLoadingMore} onLoadMore={onLoadMoreDrafts} />
                </div>
              )
            ) : scheduledLoading ? (
              <LoadingState title={t('drafts.loadingScheduled')} />
            ) : scheduledItems.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title={t('drafts.empty.scheduledTitle')}
                description={t('drafts.empty.scheduledDescription')}
              />
            ) : (
              <div className="space-y-3">
                {scheduledItems.map((item) => (
                  <div
                    key={item.id}
                    className="group/card rounded-[28px] border border-border bg-card/95 px-4 py-3 shadow-sm transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <ConversationIdentity item={item} />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-base font-semibold">{titleLabel(item)}</p>
                          <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-300">
                            {item.scheduledForLabel}
                          </span>
                          {item.attachmentHint ? <AttachmentHint hint={item.attachmentHint} t={t} /> : null}
                        </div>
                        <p className="mt-2 line-clamp-2 pr-2 text-sm leading-6">{item.preview}</p>
                        {item.lastErrorMessage ? (
                          <p className="mt-2 text-xs text-amber-300">{item.lastErrorMessage}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-col items-end gap-3 pl-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {t('drafts.actions.saved', { value: item.updatedAtLabel })}
                        </span>
                        <div className="inline-flex items-center gap-1 rounded-2xl border border-border bg-background/92 p-1 opacity-100 transition-all md:pointer-events-none md:translate-y-1 md:opacity-0 md:group-focus-within/card:pointer-events-auto md:group-focus-within/card:translate-y-0 md:group-focus-within/card:opacity-100 md:group-hover/card:pointer-events-auto md:group-hover/card:translate-y-0 md:group-hover/card:opacity-100">
                          <ActionIconButton
                            label={t('drafts.actions.editScheduled')}
                            icon={Pencil}
                            onClick={() => onEditScheduled(item.id)}
                          />
                          <ActionIconButton
                            label={t('drafts.actions.reschedule')}
                            icon={Clock3}
                            onClick={() => setScheduleDialogState({ mode: 'reschedule', scheduledId: item.id })}
                          />
                          <ActionIconButton
                            label={t('drafts.actions.sendMessage')}
                            icon={SendHorizontal}
                            onClick={() => onSendScheduledNow(item.id)}
                          />
                          <DropdownMenu>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="h-9 w-9 cursor-pointer rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={8}>
                                {t('drafts.actions.moreActions')}
                              </TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent
                              align="end"
                              className="w-72 rounded-2xl border-border bg-popover p-1.5"
                            >
                              <DropdownMenuItem
                                className="cursor-pointer rounded-xl py-2.5 text-sm"
                                onClick={() => {
                                  onActiveTabChange('drafts');
                                  onConvertScheduledToDraft(item.id);
                                }}
                              >
                                {t('drafts.actions.cancelSchedule')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="cursor-pointer rounded-xl py-2.5 text-sm text-destructive focus:text-destructive"
                                onClick={() => setDeleteDialogState({ kind: 'scheduled', scheduledId: item.id })}
                              >
                                {t('drafts.actions.deleteMessage')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <LoadMoreRow visible={scheduledHasMore} loading={scheduledLoadingMore} onLoadMore={onLoadMoreScheduled} />
              </div>
            )}
          </div>
        </ScrollArea>
      </TooltipProvider>

      <TeamChatScheduleDialog
        open={Boolean(scheduleDialogState)}
        mode={scheduleDialogState?.mode === 'reschedule' ? 'reschedule' : 'schedule'}
        initialValue={scheduleDialogInitialValue}
        onOpenChange={(open) => {
          if (!open) {
            setScheduleDialogState(null);
          }
        }}
        onSubmit={(scheduledFor) => {
          if (!scheduleDialogState) return;

          if (scheduleDialogState.mode === 'schedule') {
            onScheduleDraft(scheduleDialogState.draftId, scheduledFor);
            return;
          }

          onRescheduleScheduled(scheduleDialogState.scheduledId, scheduledFor);
        }}
      />

      <TeamChatDeleteOutgoingDialog
        open={Boolean(deleteDialogState && deleteDialogPreview)}
        previewTitle={deleteDialogPreview?.previewTitle ?? t('drafts.deletePreview.defaultTitle')}
        previewMeta={deleteDialogPreview?.previewMeta}
        previewText={deleteDialogPreview?.previewText ?? t('drafts.deletePreview.defaultText')}
        subjectLabel={deleteDialogPreview?.subjectLabel ?? t('drafts.deletePreview.message')}
        onConfirm={handleConfirmDelete}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogState(null);
          }
        }}
      />
    </Tabs>
  );
}
