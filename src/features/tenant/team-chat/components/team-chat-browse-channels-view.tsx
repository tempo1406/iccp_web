import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowUpRight,
  Clock3,
  Compass,
  Hash,
  Loader2,
  Lock,
  Search,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { type DiscoverableChannel } from '../data/team-chat-ui-data';
import { focusRingClass } from '../lib/team-chat-screen.shared';

type BrowseSortBy = 'recent' | 'members' | 'name';

interface TeamChatBrowseChannelsViewProps {
  channels: DiscoverableChannel[];
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  joiningRoomId?: string | null;
  previewChannel: DiscoverableChannel | null;
  previewErrorMessage?: string | null;
  previewLoading: boolean;
  search: string;
  selectedChannelId: string;
  sortBy: BrowseSortBy;
  onJoinChannel: (roomId: string) => void;
  onLoadMore: () => void;
  onOpenChannel: (roomId: string) => void;
  onSearchChange: (value: string) => void;
  onSelectChannel: (roomId: string) => void;
  onSortChange: (value: BrowseSortBy) => void;
}

function formatBrowseTimestamp(value: string | undefined, locale: string, t: ReturnType<typeof useTranslations>) {
  if (!value) return t('browse.time.none');

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t('browse.time.none');

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatMemberCount(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

function resolveChannelCta(
  channel: DiscoverableChannel | null,
  t: ReturnType<typeof useTranslations>,
) {
  if (!channel) {
    return {
      action: 'disabled' as const,
      label: t('browse.cta.choose'),
      description: t('browse.cta.chooseDescription'),
    };
  }

  if (channel.viewerState.membershipStatus === 'member') {
    return {
      action: 'open' as const,
      label: t('browse.cta.open'),
      description: t('browse.cta.openDescription'),
    };
  }

  if (channel.viewerState.canJoin) {
    return {
      action: 'join' as const,
      label: t('browse.cta.join'),
      description: t('browse.cta.joinDescription'),
    };
  }

  return {
    action: 'disabled' as const,
    label: t('browse.cta.previewOnly'),
    description: channel.viewerState.isInvited
      ? t('browse.cta.previewInvitedDescription')
      : t('browse.cta.previewUnavailableDescription'),
  };
}

function EmptyState({
  search,
  t,
}: {
  search: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/50">
        <Compass className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-foreground">
        {search.trim() ? t('browse.empty.searchTitle') : t('browse.empty.defaultTitle')}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {search.trim()
          ? t('browse.empty.searchDescription')
          : t('browse.empty.defaultDescription')}
      </p>
    </div>
  );
}

export function TeamChatBrowseChannelsView({
  channels,
  hasMore,
  isLoading,
  isLoadingMore,
  joiningRoomId,
  previewChannel,
  previewErrorMessage,
  previewLoading,
  search,
  selectedChannelId,
  sortBy,
  onJoinChannel,
  onLoadMore,
  onOpenChannel,
  onSearchChange,
  onSelectChannel,
  onSortChange,
}: TeamChatBrowseChannelsViewProps) {
  const t = useTranslations('teamChat');
  const locale = useLocale();
  const [previewOpen, setPreviewOpen] = useState(false);
  const selectedChannel =
    previewChannel ?? channels.find((channel) => channel.id === selectedChannelId) ?? null;
  const previewCta = resolveChannelCta(selectedChannel, t);
  const sortOptions: Array<{ value: BrowseSortBy; label: string }> = [
    { value: 'recent', label: t('browse.sort.recent') },
    { value: 'members', label: t('browse.sort.members') },
    { value: 'name', label: t('browse.sort.name') },
  ];

  const handlePreviewChannel = (roomId: string) => {
    onSelectChannel(roomId);
    setPreviewOpen(true);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-border px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-muted/35">
              <Compass className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('browse.header.title')}</h1>
                <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px] font-medium">
                  {t('browse.header.publicOnly')}
                </Badge>
              </div>
              <p className="mt-1 max-w-prose text-sm leading-6 text-muted-foreground">
                {t('browse.header.description')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
              {t('browse.header.results', { count: channels.length })}
            </Badge>
            {selectedChannel ? (
              <Badge className="max-w-[240px] truncate rounded-full bg-primary/12 px-3 py-1 text-xs text-primary hover:bg-primary/12">
                {t('browse.header.selectedPrefix')} {selectedChannel.name}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={t('browse.header.searchPlaceholder')}
              className="h-11 rounded-2xl border-border bg-background pl-10"
            />
          </div>

          <Select value={sortBy} onValueChange={(value) => onSortChange(value as BrowseSortBy)}>
            <SelectTrigger className="h-11 w-full rounded-2xl border-border bg-background xl:w-[190px]">
              <SelectValue placeholder={t('browse.sort.placeholder')} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border bg-popover">
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="cursor-pointer rounded-xl">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-4 py-4 sm:px-6 sm:py-6">
        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-border bg-card/85 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.88)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
            <div>
              <p className="text-sm font-semibold text-foreground">{t('browse.list.title')}</p>
              <p className="text-xs text-muted-foreground">{t('browse.list.subtitle')}</p>
            </div>
            <span className="text-xs text-muted-foreground">{t('browse.list.previewSide')}</span>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-3 p-3 sm:p-4">
              {isLoading && channels.length === 0 ? (
                <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('browse.list.loading')}
                </div>
              ) : channels.length === 0 ? (
                <EmptyState search={search} t={t} />
              ) : (
                channels.map((channel) => {
                  const isSelected = channel.id === selectedChannelId;
                  const ChannelIcon = channel.visibility === 'private' ? Lock : Hash;
                  const isMember = channel.viewerState.membershipStatus === 'member';

                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => handlePreviewChannel(channel.id)}
                      className={cn(
                        'group relative w-full cursor-pointer overflow-hidden rounded-[24px] border px-4 py-4 text-left transition-all',
                        isSelected
                          ? 'border-primary/45 bg-primary/10 shadow-[0_18px_50px_-40px_rgba(79,70,229,0.85)]'
                          : 'border-border bg-background/75 hover:border-border/80 hover:bg-muted/30',
                        focusRingClass,
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-3 bottom-3 left-0 w-1 rounded-r-full bg-primary transition-opacity',
                          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60',
                        )}
                      />

                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/55">
                          <ChannelIcon className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-base font-semibold text-foreground">{channel.name}</p>
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {channel.roomKey ? `#${channel.roomKey}` : t('browse.list.publicChannel')}
                              </p>
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                              {isSelected ? (
                                <Badge className="rounded-full bg-primary/14 px-2.5 py-1 text-[11px] text-primary hover:bg-primary/14">
                                  {t('common.selected')}
                                </Badge>
                              ) : null}
                              <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px] font-medium">
                                <Users className="h-3.5 w-3.5" />
                                {formatMemberCount(channel.memberCount, locale)}
                              </Badge>
                              {isMember ? (
                                <Badge className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/15">
                                  {t('common.joined')}
                                </Badge>
                              ) : channel.viewerState.isInvited ? (
                                <Badge className="rounded-full bg-sky-500/15 px-2.5 py-1 text-[11px] text-sky-200 hover:bg-sky-500/15">
                                  {t('common.invited')}
                                </Badge>
                              ) : null}
                            </div>
                          </div>

                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                            {channel.topic || channel.description || t('browse.list.noTopic')}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 className="h-3.5 w-3.5" />
                              {formatBrowseTimestamp(channel.lastMessageAt || channel.updatedAt, locale, t)}
                            </span>
                            <span className="inline-flex items-center gap-1.5 font-medium text-foreground/85">
                              {isSelected ? t('browse.list.previewOpen') : t('browse.list.preview')}
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}

              {channels.length > 0 && hasMore ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full cursor-pointer rounded-2xl"
                  disabled={isLoadingMore}
                  onClick={onLoadMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('browse.list.loadingMore')}
                    </>
                  ) : (
                    t('browse.list.loadMore')
                  )}
                </Button>
              ) : null}
            </div>
          </ScrollArea>
        </section>
      </div>

      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent
          side="right"
          className="gap-0 border-l border-border bg-card/95 p-0 sm:max-w-[480px]"
        >
          <SheetHeader className="gap-0 border-b border-border px-6 py-5 pr-14 text-left">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background/70">
                {selectedChannel?.visibility === 'private' ? (
                  <Lock className="h-[18px] w-[18px] text-muted-foreground" />
                ) : (
                  <Hash className="h-[18px] w-[18px] text-muted-foreground" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  {t('browse.preview.title')}
                </p>
                <SheetTitle className="mt-2 truncate text-2xl font-bold tracking-tight text-foreground">
                  {selectedChannel?.name ?? t('browse.preview.pickChannel')}
                </SheetTitle>
                <SheetDescription className="mt-2 max-w-prose leading-6">
                  {selectedChannel?.roomKey ? `#${selectedChannel.roomKey}` : t('browse.preview.publicChannelPreview')}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-4 p-5 sm:p-6">
              {previewLoading && !selectedChannel ? (
                <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('browse.preview.loading')}
                </div>
              ) : previewErrorMessage ? (
                <div className="rounded-[24px] border border-destructive/20 bg-destructive/5 p-6">
                  <p className="text-base font-semibold text-foreground">{t('browse.preview.unavailableTitle')}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{previewErrorMessage}</p>
                </div>
              ) : !selectedChannel ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-dashed border-border bg-muted/10 px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-border bg-card/70">
                    <Compass className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="mt-5 text-lg font-semibold text-foreground">{t('browse.preview.nothingSelected')}</p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    {t('browse.preview.nothingSelectedDescription')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-[28px] border border-border bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_44%),rgba(15,23,42,0.36)] p-5">
                    <div className="min-w-0 flex-1">
                      <Badge
                        variant="outline"
                        className="rounded-full px-3 py-1 text-xs font-medium capitalize"
                      >
                        {t(`browse.visibility.${selectedChannel.visibility}`)}
                      </Badge>

                      <p className="mt-4 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                        {t('browse.preview.description')}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {selectedChannel.description ||
                          selectedChannel.topic ||
                          t('browse.preview.descriptionFallback')}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-border bg-background/70 p-4">
                      <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                        {t('browse.preview.members')}
                      </p>
                      <p className="mt-3 text-lg font-semibold text-foreground">
                        {formatMemberCount(selectedChannel.memberCount, locale)}
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-border bg-background/70 p-4">
                      <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                        {t('browse.preview.lastActivity')}
                      </p>
                      <p className="mt-3 text-sm font-medium text-foreground">
                        {formatBrowseTimestamp(selectedChannel.lastMessageAt || selectedChannel.updatedAt, locale, t)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-border bg-background/70 p-5">
                    <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                      {t('browse.preview.nextAction')}
                    </p>
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-base font-semibold text-foreground">{previewCta.label}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {previewCta.description}
                        </p>
                      </div>

                      {previewCta.action === 'open' ? (
                        <Button
                          type="button"
                          className="h-11 w-full cursor-pointer rounded-2xl px-5"
                          onClick={() => onOpenChannel(selectedChannel.id)}
                        >
                          {t('browse.cta.open')}
                        </Button>
                      ) : previewCta.action === 'join' ? (
                        <Button
                          type="button"
                          className="h-11 w-full cursor-pointer rounded-2xl px-5"
                          disabled={joiningRoomId === selectedChannel.id}
                          onClick={() => onJoinChannel(selectedChannel.id)}
                        >
                          {joiningRoomId === selectedChannel.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t('browse.preview.joining')}
                            </>
                          ) : (
                            t('browse.cta.join')
                          )}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 w-full rounded-2xl px-5"
                          disabled
                        >
                          {t('browse.cta.previewOnly')}
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}

