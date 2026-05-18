import { useRef, useState, type ReactNode } from 'react';
import {
  AtSign,
  Bell,
  BellOff,
  EllipsisVertical,
  Info,
  Loader2,
  LogOut,
  MailOpen,
  Search,
  Star,
} from 'lucide-react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import {
  type WorkspaceChannel,
  type ConversationKind,
  type ConversationMessage,
  type ConversationTab,
} from '../data/team-chat-ui-data';
import { type ChannelDetailTabItem, type ChannelMember } from '../data/team-chat-channel-details';
import {
  focusRingClass,
  initials,
  tabMeta,
  type ActiveConversationDisplay,
} from '../lib/team-chat-screen.shared';
import { TeamChatConfirmActionDialog } from './team-chat-confirm-action-dialog';
import { TeamChatConversationDetailsDialog } from './team-chat-conversation-details-dialog';
import { TeamChatConversationIcon } from './team-chat-conversation-icon';
import { TeamChatDirectMessageDetailsDialog } from './team-chat-direct-message-details-dialog';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text: string, keyword: string, keyPrefix: string): ReactNode[] {
  const normalizedKeyword = keyword.trim();
  if (!normalizedKeyword) return [text];

  const regex = new RegExp(`(${escapeRegExp(normalizedKeyword)})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, index) => {
    const isMatch = part.toLowerCase() === normalizedKeyword.toLowerCase();
    if (!isMatch) return <span key={`${keyPrefix}-text-${index}`}>{part}</span>;
    return (
      <mark
        key={`${keyPrefix}-mark-${index}`}
        className="rounded-sm bg-primary/25 px-0.5 font-semibold text-primary-foreground"
      >
        {part}
      </mark>
    );
  });
}

function splitTrailingUrlPunctuation(value: string) {
  const match = value.match(/^(.*?)([),.;!?]+)?$/);
  if (!match) {
    return { url: value, trailing: '' };
  }

  return {
    url: match[1] ?? value,
    trailing: match[2] ?? '',
  };
}

function renderSearchPreviewText({
  text,
  keyword,
  mentionNames,
  keyPrefix,
}: {
  text: string;
  keyword: string;
  mentionNames: string[];
  keyPrefix: string;
}) {
  if (!text.length) return null;

  const normalizedMentionNames = Array.from(
    new Set(
      mentionNames
        .map((name) => name.trim())
        .filter((name) => name.length > 0),
    ),
  ).sort((left, right) => right.length - left.length);

  const mentionPattern = normalizedMentionNames.length
    ? `@(?:${normalizedMentionNames.map(escapeRegExp).join('|')})(?=$|\\s|[.,!?;:])`
    : '@[a-z0-9._-]+(?=$|\\s|[.,!?;:])';
  const tokenPattern = new RegExp(`https?:\\/\\/[^\\s<]+|${mentionPattern}`, 'gi');
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let tokenIndex = 0;

  for (const match of text.matchAll(tokenPattern)) {
    if (match.index === undefined) continue;

    if (match.index > lastIndex) {
      nodes.push(
        ...highlightText(
          text.slice(lastIndex, match.index),
          keyword,
          `${keyPrefix}-segment-${tokenIndex}`,
        ),
      );
    }

    const rawToken = match[0];
    if (/^https?:\/\//i.test(rawToken)) {
      const { url, trailing } = splitTrailingUrlPunctuation(rawToken);
      nodes.push(
        <a
          key={`${keyPrefix}-link-${tokenIndex}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          className={`cursor-pointer break-all text-sky-400 transition-colors hover:underline hover:underline-offset-2 focus-visible:text-sky-300 ${focusRingClass}`}
        >
          {highlightText(url, keyword, `${keyPrefix}-link-highlight-${tokenIndex}`)}
        </a>,
      );
      if (trailing) {
        nodes.push(...highlightText(trailing, keyword, `${keyPrefix}-trailing-${tokenIndex}`));
      }
    } else {
      nodes.push(
        <span
          key={`${keyPrefix}-mention-${tokenIndex}`}
          className="rounded-md bg-sky-500/15 px-1 py-0.5 text-sky-300"
        >
          {highlightText(rawToken, keyword, `${keyPrefix}-mention-highlight-${tokenIndex}`)}
        </span>,
      );
    }

    tokenIndex += 1;
    lastIndex = match.index + rawToken.length;
  }

  if (lastIndex < text.length) {
    nodes.push(...highlightText(text.slice(lastIndex), keyword, `${keyPrefix}-tail`));
  }

  return nodes;
}

interface TeamChatConversationHeaderProps {
  activeConversationRoom: WorkspaceChannel;
  activeChannelDetails: {
    roomId: string;
    visibility: 'public' | 'private';
    topic?: string;
    description?: string;
    createdBy?: string;
    createdByDisplayName?: string;
    createdAt?: string;
    myUserId?: string;
    members: ChannelMember[];
    notificationPreference: 'all-posts' | 'mentions' | 'muted';
    myRole?: string;
    myPermissions?: {
      canView?: boolean;
      canSendMessage?: boolean;
      canInviteMembers?: boolean;
      canManageMembers?: boolean;
      canPinMessages?: boolean;
      canJoin?: boolean;
      canLeave?: boolean;
      canChangeVisibilityToPublic?: boolean;
      canChangeVisibilityToPrivate?: boolean;
    };
    viewerState?: {
      membershipStatus?: 'member' | 'invited' | 'non_member';
      isInvited?: boolean;
      canViewPreview?: boolean;
      canJoin?: boolean;
    };
    visibilityUpdating?: boolean;
    isArchived?: boolean;
    canUnarchive?: boolean;
    allowMemberPinMessages: boolean;
    allowGuestPinMessages: boolean;
  };
  activeConversationDisplay: ActiveConversationDisplay;
  activeConversationSubtitle?: string;
  activeConversationKind: ConversationKind;
  isManualUnread: boolean;
  activeConversationStarred: boolean;
  deferredMessageSearch: string;
  messageSearch: string;
  searchOpen: boolean;
  searchResults: ConversationMessage[];
  searchLoading: boolean;
  searchActiveMessageId?: string | null;
  mentionNames: string[];
  onMessageSearchChange: (value: string) => void;
  onSearchOpenChange: (open: boolean) => void;
  onSearchResultSelect: (messageId: string) => void;
  onSetActiveTab: (tab: ConversationTab) => void;
  onToggleStarredConversation: () => void;
  onMarkConversationUnread: () => void | Promise<void>;
  onOpenMemberDirectMessage: (member: ChannelMember) => void;
  onUpdateNotificationPreference: (
    preference: 'all-posts' | 'mentions' | 'muted',
  ) => Promise<boolean> | boolean;
  onInviteMembers: (params: {
    userIds: string[];
    memberRole: 'admin' | 'member' | 'guest';
    inviteMessage?: string;
  }) => Promise<boolean> | boolean;
  onUpdateMemberRole: (
    memberId: string,
    memberRole: 'owner' | 'admin' | 'member' | 'guest',
  ) => Promise<boolean> | boolean;
  onJoinPublicRoom: (roomId?: string) => Promise<boolean> | boolean;
  onUpdateRoomPolicies: (policies: {
    allowMemberPinMessages: boolean;
    allowGuestPinMessages: boolean;
  }) => Promise<{
    success: boolean;
    updated: boolean;
    currentAllowMemberPinMessages: boolean;
    currentAllowGuestPinMessages: boolean;
  } | null> | {
    success: boolean;
    updated: boolean;
    currentAllowMemberPinMessages: boolean;
    currentAllowGuestPinMessages: boolean;
  } | null;
  onRemoveMember: (memberId: string) => Promise<boolean> | boolean;
  onUpdateRoomInfo: (payload: {
    name?: string;
    topic?: string;
    description?: string;
  }) => Promise<{ success: boolean; updated: boolean } | null>;
  onToggleArchiveState: (nextArchivedState: boolean) => Promise<boolean> | boolean;
  onUpdateChannelVisibility: (
    nextVisibility: 'public' | 'private',
  ) => Promise<boolean> | boolean;
  availableTabs: ConversationTab[];
  channelTabs: ChannelDetailTabItem[];
  directMessageTabs: ChannelDetailTabItem[];
  onMoveChannelTab: (tabId: string, direction: 'up' | 'down') => void;
  onMoveDirectMessageTab: (tabId: string, direction: 'up' | 'down') => void;
  onToggleChannelTabVisibility: (tabId: string) => void;
  onToggleDirectMessageTabVisibility: (tabId: string) => void;
}

export function TeamChatConversationHeader({
  activeConversationRoom,
  activeChannelDetails,
  activeConversationDisplay,
  activeConversationSubtitle,
  activeConversationKind,
  isManualUnread,
  activeConversationStarred,
  deferredMessageSearch,
  messageSearch,
  searchOpen,
  searchResults,
  searchLoading,
  searchActiveMessageId,
  mentionNames,
  onMessageSearchChange,
  onSearchOpenChange,
  onSearchResultSelect,
  onSetActiveTab,
  onToggleStarredConversation,
  onMarkConversationUnread,
  onOpenMemberDirectMessage,
  onUpdateNotificationPreference,
  onInviteMembers,
  onUpdateMemberRole,
  onJoinPublicRoom,
  onUpdateRoomPolicies,
  onRemoveMember,
  onUpdateRoomInfo,
  onToggleArchiveState,
  onUpdateChannelVisibility,
  availableTabs,
  channelTabs,
  directMessageTabs,
  onMoveChannelTab,
  onMoveDirectMessageTab,
  onToggleChannelTabVisibility,
  onToggleDirectMessageTabVisibility,
}: TeamChatConversationHeaderProps) {
  const t = useTranslations('teamChat');
  const [dmDetailsOpen, setDmDetailsOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const channelDetailsContainerRef = useRef<HTMLDivElement | null>(null);
  const isManagedPrivateRoom = activeConversationKind === 'channel' || activeConversationKind === 'group_dm';
  const canLeaveConversation =
    isManagedPrivateRoom &&
    Boolean(activeChannelDetails.myUserId) &&
    (activeChannelDetails.myPermissions?.canLeave ?? true);
  const conversationLabel =
    activeConversationKind === 'group_dm' ? t('header.leave.group') : t('header.leave.channel');
  const getTabLabel = (tab: ConversationTab) => {
    if (tab === 'messages') return t('header.tabs.messages');
    if (tab === 'files') return t('header.tabs.files');
    if (tab === 'photos') return t('header.tabs.photos');
    if (tab === 'pins') return t('header.tabs.pins');
    return '';
  };

  const openConversationDetails = () => {
    if (isManagedPrivateRoom) {
      const triggerButton =
        channelDetailsContainerRef.current?.querySelector<HTMLButtonElement>('button[aria-label]');
      triggerButton?.click();
      return;
    }

    setDmDetailsOpen(true);
  };

  const handleLeaveConversation = async () => {
    if (!canLeaveConversation) {
      toast.warning(t('aboutPanel.leaveUnavailable', { conversation: conversationLabel }));
      return;
    }
    const myUserId = activeChannelDetails.myUserId?.trim();
    if (!myUserId) return;
    await onRemoveMember(myUserId);
  };

  return (
    <div>
      <div className="flex min-h-[88px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="min-w-0 flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleStarredConversation}
            aria-label={
              activeConversationKind === 'channel'
                ? activeConversationStarred
                  ? t('header.star.channelRemove')
                  : t('header.star.channelAdd')
                : activeConversationKind === 'group_dm'
                  ? activeConversationStarred
                    ? t('header.star.groupRemove')
                    : t('header.star.groupAdd')
                  : activeConversationStarred
                    ? t('header.star.conversationRemove')
                    : t('header.star.conversationAdd')
            }
            className={cn(
              'flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted',
              focusRingClass,
            )}
          >
            <Star
              className={cn(
                'h-4 w-4',
                activeConversationStarred
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground',
              )}
            />
          </button>

          <div className="flex min-w-0 items-center gap-3">
            <TeamChatConversationIcon
              kind={activeConversationKind}
              title={activeConversationDisplay.title}
              visibility={activeConversationRoom.visibility}
              avatarUrl={activeConversationDisplay.avatarUrl}
              status={activeConversationDisplay.status}
              size="lg"
            />
            <div className="min-w-0 flex min-h-[52px] flex-col justify-center overflow-hidden py-1 pr-1">
              <h1 className="block overflow-hidden text-ellipsis whitespace-nowrap text-xl leading-[1.35] font-bold tracking-tight sm:text-2xl">
                {activeConversationDisplay.title}
              </h1>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <p className="min-w-0 truncate text-xs leading-[1.45] text-muted-foreground sm:text-sm">
                  {activeConversationSubtitle ?? activeConversationDisplay.subtitle}
                </p>
                {activeChannelDetails.myPermissions?.canSendMessage === false ? (
                  <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-muted/35 px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    {t('header.readOnly')}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isManagedPrivateRoom ? (
            <div ref={channelDetailsContainerRef}>
              <TeamChatConversationDetailsDialog
                room={activeConversationRoom}
                conversationKind={activeConversationKind === 'group_dm' ? 'group_dm' : 'channel'}
                details={activeChannelDetails}
                tabs={activeConversationKind === 'channel' ? channelTabs : directMessageTabs}
                memberCount={activeConversationDisplay.memberCount}
                starred={activeConversationStarred}
                onMoveTab={activeConversationKind === 'channel' ? onMoveChannelTab : onMoveDirectMessageTab}
                onToggleStarred={onToggleStarredConversation}
                onToggleTabVisibility={
                  activeConversationKind === 'channel'
                    ? onToggleChannelTabVisibility
                    : onToggleDirectMessageTabVisibility
                }
                onOpenMemberDirectMessage={onOpenMemberDirectMessage}
                onUpdateNotificationPreference={onUpdateNotificationPreference}
                onInviteMembers={onInviteMembers}
                onUpdateMemberRole={onUpdateMemberRole}
                onJoinPublicRoom={onJoinPublicRoom}
                onUpdateRoomPolicies={onUpdateRoomPolicies}
                onRemoveMember={onRemoveMember}
                onUpdateRoomInfo={onUpdateRoomInfo}
                onToggleArchiveState={onToggleArchiveState}
                onUpdateChannelVisibility={onUpdateChannelVisibility}
              />
            </div>
          ) : null}

          <Popover open={searchOpen} onOpenChange={onSearchOpenChange}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={t('header.searchMessages')}
                className={cn(
                  'flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  focusRingClass,
                )}
              >
                <Search className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              collisionPadding={12}
              className="h-[min(72vh,640px)] w-[min(94vw,460px)] overflow-hidden rounded-2xl border border-border bg-popover p-0 shadow-2xl"
            >
              <div className="flex h-full min-h-0 flex-col">
                <div className="border-b border-border p-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={messageSearch}
                      onChange={(event) => onMessageSearchChange(event.target.value)}
                      placeholder={t('header.searchPlaceholder', { title: activeConversationDisplay.title })}
                      className="h-10 rounded-xl bg-background pl-9"
                    />
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {!deferredMessageSearch.trim() ? (
                    <div className="p-4 text-sm text-muted-foreground">
                      {t('header.searchHint')}
                    </div>
                  ) : searchLoading && searchResults.length === 0 ? (
                    <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('header.searching')}
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="space-y-1 p-4 text-sm text-muted-foreground">
                      <p>{t('header.noMatching')}</p>
                      <p className="text-xs">
                        {t('header.searchTip')}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      <div className="bg-muted/25 flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
                        <span>{t('header.results', { count: searchResults.length })}</span>
                        {searchLoading ? (
                          <span className="inline-flex items-center gap-1">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            {t('header.updating')}
                          </span>
                        ) : null}
                      </div>
                      {searchResults.map((message) => (
                        <button
                          key={message.id}
                          type="button"
                          onClick={() => onSearchResultSelect(message.id)}
                          className={cn(
                            'flex w-full cursor-pointer gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/55',
                            searchActiveMessageId === message.id && 'bg-primary/10 ring-1 ring-inset ring-primary/25',
                            focusRingClass,
                          )}
                        >
                          <Avatar className="mt-0.5 h-8 w-8 border border-border">
                            <AvatarImage src={message.avatarUrl} alt={message.author} />
                            <AvatarFallback className="bg-muted text-[11px] font-semibold text-foreground">
                              {initials(message.author)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="truncate font-semibold text-foreground">
                                {message.author}
                              </span>
                              <span className="shrink-0 text-muted-foreground">{message.time}</span>
                            </div>
                            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                              <span className="mr-1 font-semibold text-foreground">{message.author}:</span>
                              {renderSearchPreviewText({
                                text: message.content || t('header.attachment'),
                                keyword: deferredMessageSearch,
                                mentionNames,
                                keyPrefix: message.id,
                              })}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t('header.conversationOptions')}
                className={cn(
                  'flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  focusRingClass,
                )}
              >
                <EllipsisVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 rounded-2xl border-border bg-popover p-2"
            >
              <DropdownMenuItem
                className="cursor-pointer rounded-xl"
                onClick={() => {
                  void onMarkConversationUnread();
                }}
              >
                <MailOpen className="h-4 w-4" />
                {isManualUnread ? t('header.markRead') : t('header.markUnread')}
                <DropdownMenuShortcut>U</DropdownMenuShortcut>
              </DropdownMenuItem>

              {isManagedPrivateRoom ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer rounded-xl">
                    <Bell className="h-4 w-4" />
                    {t('header.editNotifications')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-72 rounded-2xl border-border bg-popover p-2">
                    <DropdownMenuItem
                      className="cursor-pointer rounded-xl px-3 py-2.5"
                      onClick={() => {
                        void onUpdateNotificationPreference('all-posts');
                      }}
                    >
                      <div className="flex w-full items-start gap-3">
                        <Bell className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">{t('header.notif.allPosts')}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {t('header.notif.allPostsDescription')}
                          </p>
                        </div>
                        {activeChannelDetails.notificationPreference === 'all-posts' ? (
                          <span className="text-xs font-semibold text-primary">{t('header.selected')}</span>
                        ) : null}
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer rounded-xl px-3 py-2.5"
                      onClick={() => {
                        void onUpdateNotificationPreference('mentions');
                      }}
                    >
                      <div className="flex w-full items-start gap-3">
                        <AtSign className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">{t('header.notif.mentions')}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {activeConversationKind === 'group_dm'
                              ? t('header.notif.mentionsGroupDescription')
                              : t('header.notif.mentionsChannelDescription')}
                          </p>
                        </div>
                        {activeChannelDetails.notificationPreference === 'mentions' ? (
                          <span className="text-xs font-semibold text-primary">{t('header.selected')}</span>
                        ) : null}
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer rounded-xl px-3 py-2.5"
                      onClick={() => {
                        void onUpdateNotificationPreference('muted');
                      }}
                    >
                      <div className="flex w-full items-start gap-3">
                        <BellOff className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">{t('header.notif.mute')}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {t('header.notif.muteDescription', { conversation: conversationLabel })}
                          </p>
                        </div>
                        {activeChannelDetails.notificationPreference === 'muted' ? (
                          <span className="text-xs font-semibold text-primary">{t('header.selected')}</span>
                        ) : null}
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : (
                <DropdownMenuItem
                  className="cursor-pointer rounded-xl"
                  onClick={() => {
                    void onUpdateNotificationPreference('muted');
                  }}
                >
                  <BellOff className="h-4 w-4" />
                  {t('header.notif.mute')}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem className="cursor-pointer rounded-xl" onClick={openConversationDetails}>
                <Info className="h-4 w-4" />
                {t('header.viewDetails')}
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer rounded-xl"
                onClick={onToggleStarredConversation}
              >
                <Star
                  className={cn(
                    'h-4 w-4',
                    activeConversationStarred ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground',
                  )}
                />
                {activeConversationKind === 'channel'
                  ? activeConversationStarred
                    ? t('header.star.channelRemove')
                    : t('header.star.channelAdd')
                  : activeConversationKind === 'group_dm'
                    ? activeConversationStarred
                      ? t('header.star.groupRemove')
                      : t('header.star.groupAdd')
                    : activeConversationStarred
                      ? t('header.star.conversationRemove')
                      : t('header.star.conversationAdd')}
              </DropdownMenuItem>

              {isManagedPrivateRoom ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer rounded-xl text-destructive focus:text-destructive"
                    onClick={() => setLeaveConfirmOpen(true)}
                    disabled={!canLeaveConversation}
                  >
                    <LogOut className="h-4 w-4 text-destructive" />
                    {t('header.leave.menu', { conversation: conversationLabel })}
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex h-11 items-stretch gap-4 border-b border-border px-4 sm:px-6">
        <TabsPrimitive.List className="-mb-px flex h-full items-stretch gap-1">
          {availableTabs.map((tab) => {
            const Icon = tabMeta[tab].icon;

            return (
              <TabsPrimitive.Trigger
                key={tab}
                value={tab}
                className={cn(
                  'inline-flex h-full cursor-pointer items-center justify-center gap-2 border-x-0 border-t-0 border-b-2 border-b-transparent px-2 py-0 text-sm font-medium leading-none text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-foreground data-[state=active]:text-foreground',
                  focusRingClass,
                  'sm:px-3',
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="leading-none">{getTabLabel(tab)}</span>
              </TabsPrimitive.Trigger>
            );
          })}
        </TabsPrimitive.List>
      </div>

      <TeamChatDirectMessageDetailsDialog
        key={`${activeChannelDetails.roomId}-${dmDetailsOpen ? 'open' : 'closed'}`}
        open={dmDetailsOpen}
        onOpenChange={setDmDetailsOpen}
        roomId={activeChannelDetails.roomId}
        title={activeConversationDisplay.title}
        subtitle={activeConversationDisplay.subtitle}
        avatarUrl={activeConversationDisplay.avatarUrl}
        status={activeConversationDisplay.status}
        members={activeChannelDetails.members}
        notificationPreference={activeChannelDetails.notificationPreference}
        tabs={directMessageTabs}
        onSetActiveTab={onSetActiveTab}
        onMoveTab={onMoveDirectMessageTab}
        onToggleTabVisibility={onToggleDirectMessageTabVisibility}
        onToggleStarred={onToggleStarredConversation}
        onUpdateNotificationPreference={onUpdateNotificationPreference}
      />

      <TeamChatConfirmActionDialog
        open={leaveConfirmOpen}
        onOpenChange={setLeaveConfirmOpen}
        title={t('header.leave.title', { title: activeConversationDisplay.title })}
        description={
          activeConversationKind === 'group_dm'
            ? t('header.leave.groupDescription')
            : t('header.leave.channelDescription')
        }
        confirmLabel={t('header.leave.menu', { conversation: conversationLabel })}
        onConfirm={async () => {
          await handleLeaveConversation();
          setLeaveConfirmOpen(false);
        }}
      />
    </div>
  );
}

