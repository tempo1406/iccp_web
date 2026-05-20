import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  type ConversationKind,
  type PersonalFeedItem,
} from '../data/team-chat-ui-data';
import {
  focusRingClass,
  initials,
  personalFeedKindMeta,
  type PersonalFilter,
} from '../lib/team-chat-screen.shared';
import type { TeamChatUnreadAggregates } from '../services/types/team-chat.types';
import { TeamChatConversationIcon } from './team-chat-conversation-icon';

interface TeamChatPersonalViewProps {
  personalFeeds: PersonalFeedItem[];
  personalFilter: PersonalFilter;
  selectedPersonalFeed: PersonalFeedItem | null;
  onSelectFilter: (filter: PersonalFilter) => void;
  onSelectFeed: (feedId: string) => void;
  onOpenFeed: (feedId: string) => void;
  onMarkAllMentionsRead: () => void;
  onMarkAllNotificationsRead: () => void;
  onMarkAllUnread: () => void;
  onAcceptInvitation: (invitationId: string) => void;
  getPersonalFeedCount: (filter: PersonalFilter) => number;
  unreadAggregates?: TeamChatUnreadAggregates | null;
}

function normalizeInvitationStatus(status?: PersonalFeedItem['invitationStatus']): string {
  return status?.trim().toLowerCase() ?? '';
}

function canAcceptInvitationStatus(status?: PersonalFeedItem['invitationStatus']): boolean {
  const normalized = normalizeInvitationStatus(status);
  return !normalized || normalized === 'pending';
}

function invitationBadgeLabel(
  status: PersonalFeedItem['invitationStatus'] | undefined,
  t: ReturnType<typeof useTranslations>,
): string {
  const normalized = normalizeInvitationStatus(status);
  if (!normalized || normalized === 'pending') return t('personal.invitation.pending');
  if (normalized === 'accepted') return t('personal.invitation.accepted');
  if (normalized === 'declined') return t('personal.invitation.declined');
  if (normalized === 'canceled' || normalized === 'cancelled') {
    return t('personal.invitation.canceled');
  }
  return t('personal.invitation.generic', { status: normalized });
}

function resolveFeedConversationKind(item: PersonalFeedItem): ConversationKind {
  if (item.channelRoomType === 'group_dm') return 'group_dm';
  if (item.channelRoomType === 'dm') return 'dm';
  return 'channel';
}

function buildUnreadSummaryText(
  item: PersonalFeedItem,
  t: ReturnType<typeof useTranslations>,
): string | null {
  const unreadMessageCount = item.unreadMessageCount ?? 0;
  if (item.kind !== 'unread' || unreadMessageCount <= 0) return null;
  return t('personal.unreadSummary', { count: unreadMessageCount });
}

export function TeamChatPersonalView({
  personalFeeds,
  personalFilter,
  selectedPersonalFeed,
  onSelectFilter,
  onSelectFeed,
  onOpenFeed,
  onMarkAllMentionsRead,
  onMarkAllNotificationsRead,
  onMarkAllUnread,
  onAcceptInvitation,
  getPersonalFeedCount,
  unreadAggregates,
}: TeamChatPersonalViewProps) {
  const t = useTranslations('teamChat');
  const personalFilters: PersonalFilter[] = ['mentions', 'threads', 'reactions', 'unread'];
  const personalFilterLabels: Record<PersonalFilter, string> = {
    mentions: t('personal.filters.mentions'),
    threads: t('personal.filters.threads'),
    reactions: t('personal.filters.reactions'),
    unread: t('personal.filters.unread'),
  };
  const personalFeedKindLabels: Record<PersonalFeedItem['kind'], string> = {
    mentions: t('personal.feedKinds.mentions'),
    threads: t('personal.feedKinds.threads'),
    reactions: t('personal.feedKinds.reactions'),
    unread: t('personal.feedKinds.unread'),
  };
  const headerBadgeLabel =
    personalFilter === 'unread' && unreadAggregates
      ? t('personal.header.unreadItems', {
          conversations: unreadAggregates.myInboxUnreadItemCount,
          messages: unreadAggregates.myInboxUnreadMessageCount,
        })
      : t('personal.header.items', { count: personalFeeds.length });

  return (
    <>
      <div className="border-b border-border px-4 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              {t('personal.header.eyebrow')}
            </p>
            <h1 className="mt-1 text-2xl leading-none font-bold tracking-tight">
              {t('personal.header.title')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {personalFilter === 'unread'
                ? t('personal.header.unreadDescription')
                : t('personal.header.description')}
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-xs">
            {headerBadgeLabel}
          </Badge>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {personalFilters.map((filter) => {
            const Icon =
              filter === 'mentions'
                ? personalFeedKindMeta.mentions.icon
                : filter === 'threads'
                  ? personalFeedKindMeta.threads.icon
                  : filter === 'reactions'
                    ? personalFeedKindMeta.reactions.icon
                    : personalFeedKindMeta.unread.icon;
            const isActive = personalFilter === filter;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => onSelectFilter(filter)}
                className={cn(
                  'flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground',
                  isActive && 'border-primary/40 bg-primary/10 text-primary',
                  focusRingClass,
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="leading-none">{personalFilterLabels[filter]}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px]',
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {getPersonalFeedCount(filter)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {personalFilter === 'mentions' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 cursor-pointer rounded-full"
              onClick={onMarkAllMentionsRead}
            >
              {t('personal.actions.markAllMentionsRead')}
            </Button>
          ) : null}
          {personalFilter === 'threads' || personalFilter === 'reactions' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 cursor-pointer rounded-full"
              onClick={onMarkAllNotificationsRead}
            >
              {t('personal.actions.markAllNotificationsRead')}
            </Button>
          ) : null}
          {personalFilter === 'unread' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 cursor-pointer rounded-full"
              onClick={onMarkAllUnread}
            >
              {t('personal.actions.markAllUnread')}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[460px_minmax(0,1fr)]">
        <ScrollArea className="min-h-0 border-r border-border">
          {personalFeeds.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">{t('personal.empty')}</div>
          ) : (
            <div className="divide-y divide-border">
              {personalFeeds.map((item) => {
                const conversationKind = resolveFeedConversationKind(item);
                const KindIcon = personalFeedKindMeta[item.kind].icon;
                const isSelected = item.id === selectedPersonalFeed?.id;
                const isInvitationAcceptable = canAcceptInvitationStatus(
                  item.invitationStatus,
                );
                const unreadSummaryText = buildUnreadSummaryText(item, t);
                const invitationActionLabel =
                  normalizeInvitationStatus(item.invitationStatus) === 'accepted'
                    ? t('personal.accepted')
                    : t('personal.invitationClosed');

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (personalFilter === 'unread' && !item.invitationId) {
                        onOpenFeed(item.id);
                        return;
                      }
                      onSelectFeed(item.id);
                    }}
                    className={cn(
                      'relative flex w-full cursor-pointer flex-col gap-2 px-4 py-3 pl-6 text-left transition-colors hover:bg-muted/50',
                      item.isUnread && 'bg-primary/5 hover:bg-primary/10',
                      isSelected && (item.isUnread ? 'bg-primary/10' : 'bg-muted/60'),
                      focusRingClass,
                    )}
                  >
                    {item.isUnread ? (
                      <span className="absolute left-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_0_4px_rgba(99,102,241,0.12)]" />
                    ) : null}
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex min-w-0 items-center gap-1.5 leading-none">
                        <KindIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>{personalFeedKindLabels[item.kind]}</span>
                        <span>{t('personal.in')}</span>
                        <TeamChatConversationIcon
                          kind={conversationKind}
                          title={item.channelName}
                          visibility={item.channelVisibility}
                          size="sm"
                        />
                        <span className="truncate">{item.channelName}</span>
                      </span>
                      <span className="shrink-0">{item.dateLabel}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage src={item.actorAvatarUrl} alt={item.actor} />
                        <AvatarFallback className="bg-muted text-xs font-semibold">
                          {initials(item.actor)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              'truncate text-sm',
                              item.isUnread
                                ? 'font-semibold text-foreground'
                                : 'font-medium text-foreground/90',
                            )}
                          >
                            {item.kind === 'unread' ? item.channelName : item.actor}
                          </p>
                          {item.isUnread && item.kind !== 'unread' ? (
                            <Badge
                              variant="secondary"
                              className="rounded-full px-1.5 py-0 text-[10px] uppercase"
                            >
                              {t('personal.unreadBadge')}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {unreadSummaryText
                            ? `${unreadSummaryText} ${item.time}`
                            : `${item.context} ${item.time}`}
                        </p>
                        <p
                          className={cn(
                            'mt-1 line-clamp-2 text-sm',
                            item.isUnread ? 'text-foreground' : 'text-muted-foreground',
                          )}
                        >
                          {item.preview}
                        </p>
                        {item.invitationId ? (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="rounded-full">
                              {invitationBadgeLabel(item.invitationStatus, t)}
                            </Badge>
                            {isInvitationAcceptable ? (
                              <Button
                                type="button"
                                size="sm"
                                className="h-7 cursor-pointer rounded-full px-2.5 text-xs"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onAcceptInvitation(item.invitationId!);
                                }}
                              >
                                {t('personal.accept')}
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 rounded-full px-2.5 text-xs"
                                disabled
                              >
                                {invitationActionLabel}
                              </Button>
                            )}
                          </div>
                        ) : null}
                        {item.kind === 'reactions' && item.reactionEmoji ? (
                          <div className="mt-2 inline-flex w-fit items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs">
                            <span>{item.reactionEmoji}</span>
                            <span>{item.reactionCount ?? 1}</span>
                          </div>
                        ) : null}
                        {item.kind === 'unread' &&
                        (item.unreadMessageCount ?? 0) > 0 ? (
                          <Badge variant="outline" className="mt-2 rounded-full">
                            {t('personal.messages', {
                              count: item.unreadMessageCount ?? 0,
                            })}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="hidden min-h-0 flex-col lg:flex">
          {selectedPersonalFeed ? (
            <div className="min-h-0 flex-1 p-5">
              <div className="bg-card flex h-full flex-col rounded-2xl border border-border p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex min-w-0 items-start gap-1.5 leading-5">
                    <TeamChatConversationIcon
                      kind={resolveFeedConversationKind(selectedPersonalFeed)}
                      title={selectedPersonalFeed.channelName}
                      visibility={selectedPersonalFeed.channelVisibility}
                      size="sm"
                    />
                    <span className="min-w-0 break-words text-sm font-medium text-foreground">
                      {selectedPersonalFeed.channelName}
                    </span>
                  </span>
                  <span className="shrink-0">
                    {t('personal.detailAt', {
                      dateLabel: selectedPersonalFeed.dateLabel,
                      time: selectedPersonalFeed.time,
                    })}
                  </span>
                </div>

                <div className="mt-4 flex items-start gap-3">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage
                      src={selectedPersonalFeed.actorAvatarUrl}
                      alt={selectedPersonalFeed.actor}
                    />
                    <AvatarFallback className="bg-muted text-xs font-semibold">
                      {initials(selectedPersonalFeed.actor)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold">
                      {selectedPersonalFeed.actor}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {buildUnreadSummaryText(selectedPersonalFeed, t) ??
                        selectedPersonalFeed.context}
                    </p>
                    <p className="mt-3 max-w-2xl break-words whitespace-pre-wrap text-sm leading-6">
                      {selectedPersonalFeed.detailContent ??
                        selectedPersonalFeed.preview}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      {selectedPersonalFeed.replyCount ? (
                        <Badge variant="secondary" className="rounded-full">
                          {t('personal.replies', {
                            count: selectedPersonalFeed.replyCount,
                          })}
                        </Badge>
                      ) : null}
                      {selectedPersonalFeed.reactionEmoji ? (
                        <Badge variant="outline" className="rounded-full">
                          {selectedPersonalFeed.reactionEmoji}{' '}
                          {selectedPersonalFeed.reactionCount ?? 1}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex flex-wrap items-center gap-2">
                    {!selectedPersonalFeed.channelId.startsWith('invitation:') ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 min-w-[148px] cursor-pointer justify-center rounded-lg px-4 text-xs whitespace-nowrap"
                        onClick={() => onOpenFeed(selectedPersonalFeed.id)}
                      >
                        {t('personal.openConversation')}
                      </Button>
                    ) : null}
                    {selectedPersonalFeed.invitationId ? (
                      <Button
                        type="button"
                        className="h-9 cursor-pointer rounded-lg text-xs"
                        onClick={() =>
                          onAcceptInvitation(selectedPersonalFeed.invitationId!)
                        }
                        disabled={
                          !canAcceptInvitationStatus(
                            selectedPersonalFeed.invitationStatus,
                          )
                        }
                      >
                        {canAcceptInvitationStatus(
                          selectedPersonalFeed.invitationStatus,
                        )
                          ? t('personal.accept')
                          : normalizeInvitationStatus(
                                selectedPersonalFeed.invitationStatus,
                              ) === 'accepted'
                            ? t('personal.accepted')
                            : t('personal.invitationClosed')}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-sm text-muted-foreground">
              {t('personal.selectPreview')}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
