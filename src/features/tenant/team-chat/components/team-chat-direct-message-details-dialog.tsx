'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  AtSign,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Files,
  Image as ImageIcon,
  MessageSquare,
  Pin,
  PlusCircle,
  Star,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { type ChannelDetailTabItem, type ChannelMember } from '../data/team-chat-channel-details';
import { type ConversationTab, type PresenceStatus } from '../data/team-chat-ui-data';
import { focusRingClass, initials, presenceDotClass, tabMeta } from '../lib/team-chat-screen.shared';
import { MemberRoleBadge } from './team-chat-conversation-details-shared';

type NotificationPreference = 'all-posts' | 'mentions' | 'muted';
type DetailsTab = 'about' | 'tabs' | 'settings';
type DmTabItem = {
  id: ConversationTab;
  label: string;
  hidden?: boolean;
};

function createNotificationOptions(t: (key: string, values?: Record<string, string | number>) => string): Array<{
  id: NotificationPreference;
  label: string;
  description: string;
  icon: typeof Bell;
}> {
  return [
    {
      id: 'all-posts',
      label: t('header.notif.allPosts'),
      description: t('header.notif.allPostsDescription'),
      icon: Bell,
    },
    {
      id: 'mentions',
      label: t('header.notif.mentions'),
      description: t('header.notif.mentionsGroupDescription'),
      icon: AtSign,
    },
    {
      id: 'muted',
      label: t('header.notif.mute'),
      description: t('header.notif.muteDescription', {
        conversation: t('globalSearch.scopeRoom').toLowerCase(),
      }),
      icon: BellOff,
    },
  ];
}

function createDetailTabs(t: (key: string) => string): Array<{ id: DetailsTab; label: string }> {
  return [
    { id: 'about', label: t('detailsShared.tabs.about') },
    { id: 'tabs', label: t('detailsShared.tabs.tabs') },
    { id: 'settings', label: t('detailsShared.tabs.settings') },
  ];
}

function getStatusLabel(
  t: (key: string, values?: Record<string, string | number>) => string,
  status: PresenceStatus,
) {
  return t(`detailsShared.presence.${status}`);
}

const detailTabIcons = {
  messages: MessageSquare,
  files: Files,
  photos: ImageIcon,
  pins: Pin,
} as const;

function isConversationTab(tabId: string): tabId is ConversationTab {
  return tabId === 'messages' || tabId === 'files' || tabId === 'photos' || tabId === 'pins';
}

function DmTabManageRow({
  tab,
  hidden = false,
  canMoveUp,
  canMoveDown,
  onMove,
  onToggleVisibility,
}: {
  tab: DmTabItem;
  hidden?: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (tabId: ConversationTab, direction: 'up' | 'down') => void;
  onToggleVisibility: (tabId: ConversationTab) => void;
}) {
  const t = useTranslations('teamChat');
  const Icon = detailTabIcons[tab.id as keyof typeof detailTabIcons] ?? (hidden ? Pin : Files);
  const VisibilityIcon = hidden ? Eye : EyeOff;
  const visibilityLabel = hidden
    ? t('detailsShared.tabManage.show')
    : t('detailsShared.tabManage.hide');
  const tabLabel =
    tab.id === 'messages'
      ? t('header.tabs.messages')
      : tab.id === 'files'
        ? t('header.tabs.files')
        : tab.id === 'photos'
          ? t('header.tabs.photos')
          : tab.id === 'pins'
            ? t('header.tabs.pins')
            : tab.label;

  return (
    <div
      className={cn(
        'group flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors',
        hidden
          ? 'border-dashed border-border/80 bg-muted/20 hover:bg-muted/30'
          : 'border-border bg-card/70 hover:bg-muted/35',
      )}
    >
      <div
        className={cn(
          'inline-flex items-center gap-2.5 text-sm font-medium',
          hidden ? 'text-muted-foreground' : 'text-foreground',
        )}
      >
        <Icon className="h-4 w-4" />
        {tabLabel}
      </div>

      <div className="flex items-center gap-3">
        {hidden ? (
          <span className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {t('detailsShared.tabManage.hidden')}
          </span>
        ) : null}

        <div className="inline-flex translate-x-2 items-center gap-1 rounded-xl border border-border/80 bg-background/95 px-1.5 py-1 opacity-0 shadow-sm transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100">
          <button
            type="button"
            title={visibilityLabel}
            aria-label={visibilityLabel}
            onClick={() => onToggleVisibility(tab.id)}
            className={cn(
              'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              focusRingClass,
            )}
          >
            <VisibilityIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            title={t('detailsShared.tabManage.moveUp')}
            aria-label={t('detailsShared.tabManage.moveUp')}
            onClick={() => onMove(tab.id, 'up')}
            disabled={!canMoveUp}
            className={cn(
              'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-muted-foreground',
              focusRingClass,
            )}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            title={t('detailsShared.tabManage.moveDown')}
            aria-label={t('detailsShared.tabManage.moveDown')}
            onClick={() => onMove(tab.id, 'down')}
            disabled={!canMoveDown}
            className={cn(
              'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-muted-foreground',
              focusRingClass,
            )}
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface TeamChatDirectMessageDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  title: string;
  subtitle: string;
  avatarUrl?: string;
  status?: PresenceStatus;
  members: ChannelMember[];
  notificationPreference: NotificationPreference;
  tabs: ChannelDetailTabItem[];
  onSetActiveTab: (tab: ConversationTab) => void;
  onMoveTab: (tabId: string, direction: 'up' | 'down') => void;
  onToggleTabVisibility: (tabId: string) => void;
  onToggleStarred: () => void;
  onUpdateNotificationPreference: (
    preference: NotificationPreference,
  ) => Promise<boolean> | boolean;
}

export function TeamChatDirectMessageDetailsDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  avatarUrl,
  status,
  members,
  notificationPreference,
  tabs,
  onSetActiveTab,
  onMoveTab,
  onToggleTabVisibility,
  onToggleStarred,
  onUpdateNotificationPreference,
}: TeamChatDirectMessageDetailsDialogProps) {
  const t = useTranslations('teamChat');
  const [activeTab, setActiveTab] = useState<DetailsTab>('about');
  const [currentPreference, setCurrentPreference] =
    useState<NotificationPreference>(notificationPreference);

  const preferenceMeta = useMemo(
    () =>
      createNotificationOptions(t).find((option) => option.id === currentPreference) ??
      createNotificationOptions(t)[0],
    [currentPreference, t],
  );
  const notificationOptions = useMemo(() => createNotificationOptions(t), [t]);
  const detailTabs = useMemo(() => createDetailTabs(t), [t]);
  const PreferenceIcon = preferenceMeta.icon;
  const titleInitials = useMemo(() => initials(title), [title]);
  const memberList = useMemo(() => members.slice(0, 12), [members]);
  const dmTabItems = useMemo<DmTabItem[]>(
    () =>
      tabs
        .filter((tab): tab is ChannelDetailTabItem & { id: ConversationTab } => isConversationTab(tab.id))
        .map((tab) => ({
          id: tab.id,
          label: tab.label || tabMeta[tab.id].label,
          hidden: tab.hidden,
        })),
    [tabs],
  );
  const visibleDmTabs = useMemo(
    () => dmTabItems.filter((tab) => !tab.hidden),
    [dmTabItems],
  );
  const hiddenDmTabs = useMemo(
    () => dmTabItems.filter((tab) => tab.hidden),
    [dmTabItems],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden border-border bg-card p-0 shadow-2xl sm:max-w-[980px]"
      >
        <DialogTitle className="sr-only">{t('dmDetails.title', { title })}</DialogTitle>
        <DialogDescription className="sr-only">
          {t('dmDetails.description')}
        </DialogDescription>

        <div className="flex max-h-[84vh] min-h-[560px] flex-col overflow-hidden">
          <div className="border-b border-border px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative">
                  <Avatar className="h-16 w-16 border border-border">
                    <AvatarImage src={avatarUrl} alt={title} />
                    <AvatarFallback className="bg-muted text-lg font-semibold text-foreground">
                      {titleInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      'absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-card',
                      presenceDotClass(status ?? 'away'),
                    )}
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-3xl font-bold tracking-tight text-foreground">{title}</h2>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{subtitle}</p>
                  <p className="mt-2 text-xs font-medium text-muted-foreground">
                    {getStatusLabel(t, status ?? 'away')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label={t('dmDetails.closeDetails')}
                onClick={() => onOpenChange(false)}
                className={cn(
                  'flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  focusRingClass,
                )}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onToggleStarred}
                className={cn(
                  'flex h-10 w-12 cursor-pointer items-center justify-center rounded-xl border border-border bg-background transition-colors hover:bg-muted',
                  focusRingClass,
                )}
              >
                <Star className="h-4 w-4 text-muted-foreground" />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted',
                      focusRingClass,
                    )}
                  >
                    <PreferenceIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{preferenceMeta.label}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 rounded-2xl p-2">
                  {notificationOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = option.id === currentPreference;

                    return (
                      <DropdownMenuItem
                        key={option.id}
                        className="cursor-pointer rounded-xl px-3 py-3"
                        onClick={async () => {
                          const previous = currentPreference;
                          setCurrentPreference(option.id);
                          const updated = await onUpdateNotificationPreference(option.id);
                          if (!updated) {
                            setCurrentPreference(previous);
                          }
                        }}
                      >
                        <div className="flex w-full items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">{option.label}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                          </div>
                          {isSelected ? (
                            <span className="pt-1 text-[11px] font-semibold text-primary">{t('header.selected')}</span>
                          ) : null}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as DetailsTab)}
            className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden"
          >
            <div className="border-b border-border px-6">
              <TabsPrimitive.List className="-mb-px flex h-12 items-stretch gap-4">
                {detailTabs.map((tab) => (
                  <TabsPrimitive.Trigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      'inline-flex h-full cursor-pointer items-center justify-center border-x-0 border-t-0 border-b-2 border-b-transparent px-1 py-0 text-sm font-medium leading-none text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-foreground data-[state=active]:text-foreground',
                      focusRingClass,
                    )}
                  >
                    {tab.label}
                  </TabsPrimitive.Trigger>
                ))}
              </TabsPrimitive.List>
            </div>

            <TabsContent value="about" className="min-h-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full min-h-0">
                <div className="space-y-4 px-6 py-5">
                  <div className="rounded-2xl border border-border bg-background/70 px-5 py-4">
                    <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                      {t('dmDetails.participants')}
                    </p>
                    {memberList.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {memberList.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-3 py-2.5"
                          >
                            <div className="min-w-0 flex items-center gap-3">
                              <Avatar className="h-10 w-10 border border-border">
                                <AvatarImage src={member.avatarUrl} alt={member.name} />
                                <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                                  {initials(member.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {member.name}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {member.email || '--'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <MemberRoleBadge role={member.role} variant="inline" />
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {member.localTime || '--'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">{t('dmDetails.noParticipants')}</p>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="tabs" className="min-h-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full min-h-0">
                <div className="space-y-4 px-6 py-5">
                  <div className="rounded-3xl border border-border bg-background/70 px-5 py-5 shadow-sm">
                    <p className="text-2xl font-semibold tracking-tight text-foreground">{t('dmDetails.manageTabs')}</p>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                      {t('dmDetails.manageTabsDescription')}
                    </p>

                    <div className="mt-6 space-y-2.5">
                      {visibleDmTabs.map((tab, index) => (
                        <DmTabManageRow
                          key={tab.id}
                          tab={tab}
                          canMoveUp={index > 0}
                          canMoveDown={index < visibleDmTabs.length - 1}
                          onMove={(tabId, direction) => onMoveTab(tabId, direction)}
                          onToggleVisibility={(tabId) => onToggleTabVisibility(tabId)}
                        />
                      ))}

                      {hiddenDmTabs.map((tab, index) => (
                        <DmTabManageRow
                          key={tab.id}
                          tab={tab}
                          hidden
                          canMoveUp={index > 0}
                          canMoveDown={index < hiddenDmTabs.length - 1}
                          onMove={(tabId, direction) => onMoveTab(tabId, direction)}
                          onToggleVisibility={(tabId) => onToggleTabVisibility(tabId)}
                        />
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer rounded-2xl"
                        onClick={() => {
                          onSetActiveTab(visibleDmTabs[0]?.id ?? 'messages');
                          onOpenChange(false);
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                        {t('dmDetails.openActiveTab')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer rounded-2xl"
                        onClick={() => toast.infor(t('dmDetails.newTabPrototype'))}
                      >
                        <PlusCircle className="h-4 w-4" />
                        {t('dmDetails.newTab')}
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="settings" className="min-h-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full min-h-0">
                <div className="space-y-4 px-6 py-5">
                  <div className="rounded-2xl border border-border bg-background/70 px-5 py-5">
                    <p className="text-base font-semibold text-foreground">{t('dmDetails.notificationPreference')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('dmDetails.currentMode', {
                        label: preferenceMeta.label,
                        description: preferenceMeta.description,
                      })}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-background/70 px-5 py-5">
                    <p className="text-base font-semibold text-foreground">{t('dmDetails.conversationScope')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('dmDetails.conversationScopeDescription')}
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
