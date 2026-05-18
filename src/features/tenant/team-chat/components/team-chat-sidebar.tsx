import { useEffect, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArchiveRestore,
  ChevronDown,
  Clock3,
  Compass,
  Eye,
  FileText,
  PlusCircle,
  Sidebar,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  personalItems,
  type WorkspaceChannel,
  type ConversationKey,
  type ConversationKind,
  type DirectMessageContact,
  type GroupDirectMessageConversation,
} from '../data/team-chat-ui-data';
import {
  focusRingClass,
  personalItemIcons,
  sectionBodyClass,
  type PersonalFilter,
  type RecoverableConversationItem,
  type SidebarDraftIndicator,
  type StarredConversationItem,
  type TeamChatOpenSections,
  type TeamChatView,
} from '../lib/team-chat-screen.shared';
import { type TeamChatRoomScopeFilterControls } from '../lib/team-chat-scope.shared';
import { TeamChatConversationIcon } from './team-chat-conversation-icon';
import { TeamChatRoomScopeFilter } from './team-chat-room-scope-filter';

interface TeamChatSidebarProps {
  activeConversationKey: ConversationKey;
  activeConversationKind: ConversationKind;
  activeChannelId: string;
  activeDmId: string;
  activeView: TeamChatView;
  channels: WorkspaceChannel[];
  directMessageContacts: DirectMessageContact[];
  groupDmRooms: GroupDirectMessageConversation[];
  hiddenItems: RecoverableConversationItem[];
  archivedItems: RecoverableConversationItem[];
  openSections: TeamChatOpenSections;
  personalFilter: PersonalFilter;
  personalUnreadCounts: Record<'mentions' | 'threads' | 'reactions' | 'unread', number>;
  draftHubCounts: { drafts: number; scheduled: number };
  sidebarDraftIndicators: Record<string, SidebarDraftIndicator>;
  manualUnreadRoomIds: string[];
  starredItems: StarredConversationItem[];
  currentPresenceStatus: 'online' | 'away' | 'busy' | 'offline';
  roomScopeFilter: TeamChatRoomScopeFilterControls;
  onToggleSection: (section: keyof TeamChatOpenSections) => void;
  onUpdatePresenceStatus: (status: 'online' | 'away' | 'busy' | 'offline') => void;
  onOpenPersonal: (itemId: (typeof personalItems)[number]['id']) => void;
  onOpenChannel: (channelId: string) => void;
  onOpenDirectMessage: (contactId: string) => void;
  onOpenGroupChat: (roomId: string) => void;
  onUnhideConversation: (roomId: string) => void;
  onUnarchiveConversation: (roomId: string) => void;
  onOpenCreateChannel: () => void;
  onOpenCreateGroupDm: () => void;
  onOpenBrowseChannels: () => void;
}

export function TeamChatSidebar({
  activeConversationKey,
  activeConversationKind,
  activeChannelId,
  activeDmId,
  activeView,
  channels,
  directMessageContacts,
  groupDmRooms,
  hiddenItems,
  archivedItems,
  openSections,
  personalFilter,
  personalUnreadCounts,
  draftHubCounts,
  sidebarDraftIndicators,
  manualUnreadRoomIds,
  starredItems,
  currentPresenceStatus,
  roomScopeFilter,
  onToggleSection,
  onUpdatePresenceStatus,
  onOpenPersonal,
  onOpenChannel,
  onOpenDirectMessage,
  onOpenGroupChat,
  onUnhideConversation,
  onUnarchiveConversation,
  onOpenCreateChannel,
  onOpenCreateGroupDm,
  onOpenBrowseChannels,
}: TeamChatSidebarProps) {
  const t = useTranslations('teamChat');
  const privateConversationItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const starredChannelIdSet = useMemo(
    () => new Set(starredItems.filter((item) => item.kind === 'channel').map((item) => item.id)),
    [starredItems],
  );
  const starredGroupChatIdSet = useMemo(
    () => new Set(starredItems.filter((item) => item.kind === 'group_dm').map((item) => item.id)),
    [starredItems],
  );
  const starredDirectMessageIdSet = useMemo(
    () => new Set(starredItems.filter((item) => item.kind === 'dm').map((item) => item.id)),
    [starredItems],
  );
  const manualUnreadRoomIdSet = useMemo(() => new Set(manualUnreadRoomIds), [manualUnreadRoomIds]);

  const visibleChannels = useMemo(
    () => channels.filter((channel) => !starredChannelIdSet.has(channel.id)),
    [channels, starredChannelIdSet],
  );
  const visibleGroupChats = useMemo(
    () => groupDmRooms.filter((room) => !starredGroupChatIdSet.has(room.id)),
    [groupDmRooms, starredGroupChatIdSet],
  );
  const visibleDirectMessages = useMemo(
    () =>
      directMessageContacts.filter(
        (contact) => !starredDirectMessageIdSet.has(contact.roomId ?? contact.id),
      ),
    [directMessageContacts, starredDirectMessageIdSet],
  );

  useEffect(() => {
    if (activeView !== 'channel' || activeConversationKind === 'channel' || !activeDmId) {
      return;
    }

    if (activeConversationKind === 'group_dm' && !openSections.groupChats) {
      return;
    }

    if (activeConversationKind === 'dm' && !openSections.directMessages) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      privateConversationItemRefs.current[activeDmId]?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [
    activeConversationKind,
    activeDmId,
    activeView,
    openSections.directMessages,
    openSections.groupChats,
  ]);

  const renderDraftIndicator = (roomId: string) => {
    const draftIndicator = sidebarDraftIndicators[roomId];
    if (!draftIndicator) return null;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex h-6 w-6 cursor-help items-center justify-center rounded-full border border-sky-400/15 bg-sky-400/10 text-sky-200 transition-colors hover:border-sky-300/30 hover:bg-sky-400/15">
            <FileText className="h-3.5 w-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent
          hideArrow
          side="top"
          align="end"
          sideOffset={10}
          className="max-w-[220px] rounded-xl border border-border/70 bg-[#111827]/96 px-3 py-2.5 text-slate-50 shadow-[0_20px_45px_-24px_rgba(15,23,42,0.78)] backdrop-blur-md"
        >
          <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            {t('sidebar.draftLabel')}
          </p>
          <p className="mt-1 text-sm leading-5 text-slate-50">{draftIndicator.preview}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderConversationMeta = (roomId: string, unread?: number, isManualUnread?: boolean) => {
    const draftIndicator = renderDraftIndicator(roomId);
    const unreadCount = unread ?? 0;
    const shouldShowUnreadBadge = unreadCount > 0 && !isManualUnread;
    if (!draftIndicator && !shouldShowUnreadBadge) return null;

    return (
      <div className="ml-auto flex shrink-0 items-center gap-1.5 pl-2">
        {draftIndicator}
        {shouldShowUnreadBadge ? (
          <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px]">
            {unreadCount}
          </Badge>
        ) : null}
      </div>
    );
  };

  const renderRecoverableList = (
    items: RecoverableConversationItem[],
    actionLabel: string,
    onAction: (roomId: string) => void,
  ) => {
    if (items.length === 0) {
      return <p className="px-2.5 py-1.5 text-xs text-muted-foreground">{t('sidebar.recover.empty')}</p>;
    }

    return items.map((item) => {
      const isActive = activeView === 'channel' && item.key === activeConversationKey;

      return (
        <div
          key={item.key}
          className={cn(
            'flex items-center gap-2.5 rounded-lg py-2 pr-2 pl-4 text-left text-sm transition-colors',
            isActive ? 'bg-muted text-foreground' : 'text-foreground hover:bg-muted/60',
          )}
        >
          <TeamChatConversationIcon
            kind={item.kind}
            title={item.name}
            visibility={item.visibility}
            avatarUrl={item.avatarUrl}
            status={item.status}
            size="sm"
          />

          <span className="min-w-0 flex-1 truncate leading-5">{item.name}</span>

          <button
            type="button"
            onClick={() => onAction(item.roomId)}
            className={cn(
              'cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10',
              focusRingClass,
            )}
          >
            {actionLabel}
          </button>
        </div>
      );
    });
  };

  const getPersonalItemLabel = (itemId: (typeof personalItems)[number]['id']) => {
    if (itemId === 'mentions') return t('personal.filters.mentions');
    if (itemId === 'threads') return t('personal.filters.threads');
    if (itemId === 'reactions') return t('personal.filters.reactions');
    if (itemId === 'unread') return t('sidebar.personal.unread');
    return t('sidebar.personal.drafts');
  };

  const renderConversationButton = ({
    key,
    kind,
    title,
    roomId,
    unread,
    isActive,
    visibility,
    avatarUrl,
    status,
    memberPreview,
    memberPreviewOverflowCount,
    onClick,
    refKey,
    subtitle,
    isManualUnread,
  }: {
    key: string;
    kind: ConversationKind;
    title: string;
    roomId: string;
    unread?: number;
    isActive: boolean;
    visibility?: 'public' | 'private';
    avatarUrl?: string;
    status?: DirectMessageContact['status'];
    memberPreview?: GroupDirectMessageConversation['memberPreview'];
    memberPreviewOverflowCount?: GroupDirectMessageConversation['memberPreviewOverflowCount'];
    onClick: () => void;
    refKey?: string;
    subtitle?: string;
    isManualUnread?: boolean;
  }) => (
    <button
      key={key}
      ref={
        refKey
          ? (node) => {
              privateConversationItemRefs.current[refKey] = node;
            }
          : undefined
      }
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-w-0 w-full cursor-pointer items-center gap-2 overflow-hidden rounded-md py-1.5 pr-2 pl-4 text-left text-sm transition-colors',
        isActive ? 'bg-muted text-foreground' : 'text-foreground hover:bg-muted/60',
        isManualUnread && !isActive && 'bg-sky-500/8 text-sky-50 hover:bg-sky-500/12',
        focusRingClass,
      )}
      >
      <span className="flex h-3 w-2 shrink-0 items-center justify-center" aria-hidden>
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full transition-colors',
            isManualUnread
              ? 'bg-sky-300 shadow-[0_0_8px_rgba(125,211,252,0.7)]'
              : 'bg-transparent',
          )}
        />
      </span>
      <TeamChatConversationIcon
        kind={kind}
        title={title}
        visibility={visibility}
        avatarUrl={avatarUrl}
        status={status}
        memberPreview={memberPreview}
        memberPreviewOverflowCount={memberPreviewOverflowCount}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className={cn('truncate leading-5', isManualUnread && 'font-semibold text-sky-50')}>
          {title}
        </div>
        {subtitle ? (
          <div
            className={cn(
              'truncate text-[11px] text-muted-foreground',
              isManualUnread && 'font-medium text-sky-200/85',
            )}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      {renderConversationMeta(roomId, unread, isManualUnread)}
    </button>
  );

  return (
    <TooltipProvider delayDuration={120}>
      <aside className="bg-card hidden min-h-0 w-[300px] shrink-0 border-r border-border lg:flex lg:flex-col">
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-border bg-muted/60 p-1.5">
              <Sidebar className="h-4 w-4 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">{t('common.workspace')}</h2>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex h-9 items-center gap-2 rounded-full border border-border bg-background px-3 text-xs font-medium text-muted-foreground hover:bg-muted/60',
                  focusRingClass,
                )}
              >
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-full',
                    currentPresenceStatus === 'online'
                      ? 'bg-emerald-500'
                      : currentPresenceStatus === 'busy'
                        ? 'bg-rose-500'
                        : currentPresenceStatus === 'away'
                          ? 'bg-amber-500'
                          : 'bg-slate-400',
                  )}
                />
                {t(`presence.${currentPresenceStatus}`)}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl p-1.5">
              {(['online', 'away', 'busy', 'offline'] as const).map((status) => (
                <DropdownMenuItem
                  key={status}
                  className="cursor-pointer rounded-lg"
                  onClick={() => onUpdatePresenceStatus(status)}
                >
                  <span
                    className={cn(
                      'mr-2 h-2.5 w-2.5 rounded-full',
                      status === 'online'
                        ? 'bg-emerald-500'
                        : status === 'busy'
                          ? 'bg-rose-500'
                          : status === 'away'
                            ? 'bg-amber-500'
                            : 'bg-slate-400',
                    )}
                  />
                  {t(`presence.${status}`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="border-b border-border px-4 py-3">
          <TeamChatRoomScopeFilter
            mode="compact"
            scope={roomScopeFilter.scope}
            projectId={roomScopeFilter.projectId}
            projects={roomScopeFilter.projects}
            loadingProjects={roomScopeFilter.loadingProjects}
            projectErrorMessage={roomScopeFilter.projectErrorMessage}
            onScopeChange={roomScopeFilter.onScopeChange}
            onProjectChange={roomScopeFilter.onProjectChange}
          />
        </div>

        <ScrollArea className="min-h-0 min-w-0 flex-1">
          <div className="min-w-0 w-full space-y-4 p-4">
            <section className="min-w-0 space-y-1">
              <button
                type="button"
                onClick={() => onToggleSection('personal')}
                aria-expanded={openSections.personal}
                className={cn(
                  'flex w-full cursor-pointer items-start justify-between rounded-md px-2 py-1 text-left text-sm font-medium transition-colors hover:bg-muted/60',
                  focusRingClass,
                )}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="leading-5">{t('sidebar.personal.title')}</span>
                  <span className="text-[11px] font-normal leading-4 text-muted-foreground">
                    {t('sidebar.personal.subtitle')}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    'mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                    !openSections.personal && '-rotate-90',
                  )}
                />
              </button>

              <div className={sectionBodyClass(openSections.personal)}>
                <div className="min-h-0 min-w-0 space-y-1">
                  {personalItems.map((item) => {
                    const Icon = personalItemIcons[item.id];
                    const isDraftHubItem = item.id === 'drafts';
                    const itemUnreadCount = isDraftHubItem
                      ? 0
                      : personalUnreadCounts[item.id as PersonalFilter];
                    const isActivePersonalItem = isDraftHubItem
                      ? activeView === 'drafts'
                      : activeView === 'personal' && item.id === personalFilter;
                    const itemLabel = getPersonalItemLabel(item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onOpenPersonal(item.id)}
                        className={cn(
                          'text-foreground flex min-w-0 w-full cursor-pointer items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/60',
                          isActivePersonalItem && 'bg-muted text-foreground',
                          focusRingClass,
                        )}
                        >
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate leading-5">{itemLabel}</span>
                        {isDraftHubItem ? (
                          <div className="ml-auto flex items-center gap-1.5">
                            {draftHubCounts.drafts > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                <FileText className="h-3 w-3" />
                                {draftHubCounts.drafts}
                              </span>
                            ) : null}
                            {draftHubCounts.scheduled > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                <Clock3 className="h-3 w-3" />
                                {draftHubCounts.scheduled}
                              </span>
                            ) : null}
                          </div>
                        ) : itemUnreadCount > 0 ? (
                          <Badge className="ml-auto h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px]">
                            {itemUnreadCount}
                          </Badge>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="min-w-0 space-y-1">
              <button
                type="button"
                onClick={() => onToggleSection('starred')}
                aria-expanded={openSections.starred}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1 text-left text-sm font-medium transition-colors hover:bg-muted/60',
                  focusRingClass,
                )}
              >
                <span className="leading-5">{t('sidebar.starred.title')}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform duration-200',
                    !openSections.starred && '-rotate-90',
                  )}
                />
              </button>

              <div className={sectionBodyClass(openSections.starred)}>
                <div className="min-h-0 min-w-0 space-y-1">
                  {starredItems.length === 0 ? (
                    <p className="px-2.5 py-1.5 text-xs text-muted-foreground">{t('sidebar.starred.empty')}</p>
                  ) : null}
                  {starredItems.map((item) => {
                    const isActive = activeView === 'channel' && item.key === activeConversationKey;
                    const handleOpen =
                      item.kind === 'channel'
                        ? () => onOpenChannel(item.id)
                        : item.kind === 'group_dm'
                          ? () => onOpenGroupChat(item.id)
                          : () => onOpenDirectMessage(item.id);

                    return renderConversationButton({
                      key: item.key,
                      kind: item.kind,
                      title: item.name,
                      roomId: item.id,
                      unread: item.unread,
                      isManualUnread: manualUnreadRoomIdSet.has(item.id),
                      isActive,
                      visibility: item.visibility,
                      avatarUrl: item.avatarUrl,
                      status: item.status,
                      memberPreview: item.memberPreview,
                      memberPreviewOverflowCount: item.memberPreviewOverflowCount,
                      onClick: handleOpen,
                      subtitle: item.subtitle,
                    });
                  })}
                </div>
              </div>
            </section>

            <section className="min-w-0 space-y-1">
              <button
                type="button"
                onClick={() => onToggleSection('channels')}
                aria-expanded={openSections.channels}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1 text-left text-sm font-medium transition-colors hover:bg-muted/60',
                  focusRingClass,
                )}
              >
                <span className="leading-5">{t('sidebar.channels.title')}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform duration-200',
                    !openSections.channels && '-rotate-90',
                  )}
                />
              </button>

              <div className={sectionBodyClass(openSections.channels)}>
                <div className="min-h-0 min-w-0 space-y-1">
                  {visibleChannels.map((channel) =>
                    renderConversationButton({
                      key: channel.id,
                      kind: 'channel',
                      title: channel.name,
                      roomId: channel.id,
                      unread: channel.unread,
                      isManualUnread: manualUnreadRoomIdSet.has(channel.id),
                      isActive:
                        activeConversationKind === 'channel' &&
                        activeChannelId === channel.id &&
                        activeView === 'channel',
                      visibility: channel.visibility,
                      onClick: () => onOpenChannel(channel.id),
                      subtitle: channel.lastMessageSnippet,
                    }),
                  )}

                  <button
                    type="button"
                    onClick={onOpenCreateChannel}
                    className={cn(
                      'text-muted-foreground mt-0.5 flex h-9 min-w-0 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/20 px-3 text-[13px] font-medium transition-colors hover:bg-muted/60 hover:text-foreground',
                      focusRingClass,
                    )}
                  >
                    <div className="inline-flex h-5 w-[156px] max-w-full items-center justify-start gap-2.5 whitespace-nowrap">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                        <PlusCircle className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate text-left leading-5">{t('sidebar.channels.create')}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenBrowseChannels}
                    className={cn(
                      'mt-2 flex h-9 min-w-0 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border px-3 text-[13px] font-medium transition-colors',
                      activeView === 'browse'
                        ? 'border-primary/35 bg-muted/20 text-foreground'
                        : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                      focusRingClass,
                    )}
                  >
                    <div className="inline-flex h-5 w-[156px] max-w-full items-center justify-start gap-2.5 whitespace-nowrap">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                        <Compass className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate text-left leading-5">{t('sidebar.channels.browse')}</span>
                    </div>
                  </button>
                </div>
              </div>
            </section>

            <section className="min-w-0 space-y-1">
              <button
                type="button"
                onClick={() => onToggleSection('groupChats')}
                aria-expanded={openSections.groupChats}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1 text-left text-sm font-medium transition-colors hover:bg-muted/60',
                  focusRingClass,
                )}
              >
                <span className="leading-5">{t('sidebar.groupChats.title')}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform duration-200',
                    !openSections.groupChats && '-rotate-90',
                  )}
                />
              </button>

              <div className={sectionBodyClass(openSections.groupChats)}>
                <div className="min-h-0 min-w-0 space-y-1">
                  {visibleGroupChats.map((room) =>
                    renderConversationButton({
                      key: room.roomId,
                      kind: 'group_dm',
                      title: room.name,
                      roomId: room.roomId,
                      unread: room.unread,
                      isManualUnread: manualUnreadRoomIdSet.has(room.roomId),
                      isActive:
                        activeConversationKind === 'group_dm' &&
                        activeDmId === room.roomId &&
                        activeView === 'channel',
                      onClick: () => onOpenGroupChat(room.roomId),
                      refKey: room.roomId,
                      memberPreview: room.memberPreview,
                      memberPreviewOverflowCount: room.memberPreviewOverflowCount,
                      subtitle:
                        room.lastMessageSnippet ||
                        (room.memberCount > 0
                          ? t('sidebar.groupChats.membersCount', { count: room.memberCount })
                          : undefined),
                    }),
                  )}

                  <button
                    type="button"
                    onClick={onOpenCreateGroupDm}
                    className={cn(
                      'text-muted-foreground mt-0.5 flex h-9 min-w-0 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/20 px-3 text-[13px] font-medium transition-colors hover:bg-muted/60 hover:text-foreground',
                      focusRingClass,
                    )}
                  >
                    <div className="inline-flex h-5 w-[156px] max-w-full items-center justify-start gap-2.5 whitespace-nowrap">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                        <Users className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate text-left leading-5">{t('sidebar.groupChats.create')}</span>
                    </div>
                  </button>
                </div>
              </div>
            </section>

            <section className="min-w-0 space-y-1">
              <button
                type="button"
                onClick={() => onToggleSection('directMessages')}
                aria-expanded={openSections.directMessages}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1 text-left text-sm font-medium transition-colors hover:bg-muted/60',
                  focusRingClass,
                )}
              >
                <span className="leading-5">{t('sidebar.directMessages.title')}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform duration-200',
                    !openSections.directMessages && '-rotate-90',
                  )}
                />
              </button>

              <div className={sectionBodyClass(openSections.directMessages)}>
                <div className="min-h-0 min-w-0 space-y-1">
                  {visibleDirectMessages.map((contact) =>
                    renderConversationButton({
                      key: contact.id,
                      kind: 'dm',
                      title: contact.name,
                      roomId: contact.roomId ?? contact.id,
                      unread: contact.unread,
                      isManualUnread: manualUnreadRoomIdSet.has(contact.roomId ?? contact.id),
                      isActive:
                        activeConversationKind === 'dm' &&
                        activeDmId === (contact.roomId ?? contact.id) &&
                        activeView === 'channel',
                      avatarUrl: contact.avatarUrl,
                      status: contact.status,
                      onClick: () => onOpenDirectMessage(contact.id),
                      refKey: contact.roomId ?? contact.id,
                      subtitle: contact.lastMessageSnippet || contact.role,
                    }),
                  )}
                </div>
              </div>
            </section>

            <div className="min-w-0 space-y-1.5">
              <section className="min-w-0 space-y-0.5">
                <button
                  type="button"
                  onClick={() => onToggleSection('hidden')}
                  aria-expanded={openSections.hidden}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm font-medium transition-colors hover:bg-muted/60',
                    focusRingClass,
                  )}
                >
                  <span className="inline-flex items-center gap-2 leading-5">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    {t('common.hidden')}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform duration-200',
                      !openSections.hidden && '-rotate-90',
                    )}
                  />
                </button>

                <div className={sectionBodyClass(openSections.hidden)}>
                  <div className="min-h-0 min-w-0 space-y-1">
                    {renderRecoverableList(hiddenItems, t('sidebar.recover.unhide'), onUnhideConversation)}
                  </div>
                </div>
              </section>

              <section className="min-w-0 space-y-0.5">
                <button
                  type="button"
                  onClick={() => onToggleSection('archived')}
                  aria-expanded={openSections.archived}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm font-medium transition-colors hover:bg-muted/60',
                    focusRingClass,
                  )}
                >
                  <span className="inline-flex items-center gap-2 leading-5">
                    <ArchiveRestore className="h-4 w-4 text-muted-foreground" />
                    {t('common.archived')}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform duration-200',
                      !openSections.archived && '-rotate-90',
                    )}
                  />
                </button>

                <div className={sectionBodyClass(openSections.archived)}>
                  <div className="min-h-0 min-w-0 space-y-1">
                    {renderRecoverableList(archivedItems, t('sidebar.recover.unarchive'), onUnarchiveConversation)}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </ScrollArea>
      </aside>
    </TooltipProvider>
  );
}

