import {
  ArrowDown,
  ArrowUp,
  AtSign,
  BadgeCheck,
  Bell,
  BellOff,
  Clock3,
  Crown,
  Eye,
  EyeOff,
  Files,
  Image as ImageIcon,
  Mail,
  MessageSquare,
  Pin,
  ShieldCheck,
  Trash2,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import type {
  ListMembersResponseData,
  OrganizationMemberApiDto,
} from '@/services/organizations/types';
import {
  type ChannelDetailTabItem,
  type ChannelMember,
} from '../data/team-chat-channel-details';
import { focusRingClass, initials, presenceDotClass } from '../lib/team-chat-screen.shared';
import { TeamChatConfirmActionDialog } from './team-chat-confirm-action-dialog';

export type ConversationDetailsTab = 'about' | 'members' | 'tabs' | 'settings';
export type NotificationPreference = 'all-posts' | 'mentions' | 'muted';

type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

export function createNotificationOptions(t: TranslateFn, conversationLabel = 'channel'): Array<{
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
      description: conversationLabel === 'group chat'
        ? t('header.notif.mentionsGroupDescription')
        : t('header.notif.mentionsChannelDescription'),
      icon: AtSign,
    },
    {
      id: 'muted',
      label: t('header.notif.mute'),
      description: t('header.notif.muteDescription', { conversation: conversationLabel }),
      icon: BellOff,
    },
  ];
}

export function createDetailsTabs(t: TranslateFn): Array<{ id: ConversationDetailsTab; label: string }> {
  return [
    { id: 'about', label: t('detailsShared.tabs.about') },
    { id: 'members', label: t('detailsShared.tabs.members') },
    { id: 'tabs', label: t('detailsShared.tabs.tabs') },
    { id: 'settings', label: t('detailsShared.tabs.settings') },
  ];
}

const detailTabIcons = {
  messages: MessageSquare,
  files: Files,
  photos: ImageIcon,
  pins: Pin,
} as const;

function getPresenceLabel(t: TranslateFn, status: ChannelMember['status']) {
  return t(`detailsShared.presence.${status}`);
}

function resolveMemberActivityValue(value: string): string | null {
  const normalized = value.trim();
  if (!normalized || normalized === '--') return null;
  return normalized;
}

type SupportedMemberRole = 'owner' | 'admin' | 'member' | 'guest';

type MemberRoleMeta = {
  label: string;
  icon?: LucideIcon;
  pillClassName: string;
  iconShellClassName?: string;
  iconClassName?: string;
  shimmerClassName?: string;
  textClassName: string;
};

const supportedMemberRoles: SupportedMemberRole[] = ['owner', 'admin', 'member', 'guest'];

const memberRoleMetaByRole: Record<SupportedMemberRole, MemberRoleMeta> = {
  owner: {
    label: 'owner',
    icon: Crown,
    pillClassName:
      'border-amber-300/70 bg-amber-50 text-amber-700 shadow-[0_10px_22px_-16px_rgba(251,191,36,0.42)] dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100',
    iconShellClassName:
      'border-amber-300/80 bg-amber-100 text-amber-700 dark:border-amber-400/30 dark:bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.26),_rgba(245,158,11,0.08)_58%,_transparent_100%)] dark:text-amber-300',
    iconClassName: 'text-amber-700 dark:text-amber-300',
    shimmerClassName: 'from-transparent via-amber-200/75 to-transparent',
    textClassName: 'text-amber-700 dark:text-amber-100',
  },
  admin: {
    label: 'admin',
    icon: BadgeCheck,
    pillClassName:
      'border-sky-300/70 bg-sky-50 text-sky-700 shadow-[0_10px_22px_-16px_rgba(56,189,248,0.42)] dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-100',
    iconShellClassName:
      'border-sky-300/80 bg-sky-100 text-sky-700 dark:border-sky-400/30 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_rgba(59,130,246,0.08)_58%,_transparent_100%)] dark:text-sky-300',
    iconClassName: 'text-sky-700 dark:text-sky-300',
    shimmerClassName: 'from-transparent via-sky-100/80 to-transparent',
    textClassName: 'text-sky-700 dark:text-sky-100',
  },
  member: {
    label: 'member',
    pillClassName: 'border-border/80 bg-muted/25 text-muted-foreground',
    textClassName: 'text-muted-foreground',
  },
  guest: {
    label: 'guest',
    pillClassName: 'border-border/80 bg-muted/25 text-muted-foreground',
    textClassName: 'text-muted-foreground',
  },
};

function normalizeMemberRole(role: string): SupportedMemberRole | null {
  const normalized = role.trim().toLowerCase();
  if (supportedMemberRoles.includes(normalized as SupportedMemberRole)) {
    return normalized as SupportedMemberRole;
  }

  return null;
}

function getMemberRoleMeta(role: string): MemberRoleMeta {
  const fallbackRole = role.trim().toLowerCase() || 'member';
  const normalizedRole = normalizeMemberRole(role);
  if (normalizedRole) return memberRoleMetaByRole[normalizedRole];

  return {
    label: fallbackRole,
    pillClassName: 'border-border/80 bg-muted/25 text-muted-foreground',
    textClassName: 'text-muted-foreground',
  };
}

export function MemberRoleBadge({
  role,
  size = 'sm',
  variant = 'pill',
  className,
}: {
  role: string;
  size?: 'sm' | 'md';
  variant?: 'pill' | 'inline';
  className?: string;
}) {
  const t = useTranslations('teamChat');
  const meta = getMemberRoleMeta(role);
  const Icon = meta.icon;
  const showPillWave = variant === 'pill' && Boolean(meta.shimmerClassName);
  const translatedLabel = (() => {
    const normalized = normalizeMemberRole(role);
    if (normalized === 'owner') return t('detailsShared.roles.owner');
    if (normalized === 'admin') return t('detailsShared.roles.admin');
    if (normalized === 'member') return t('detailsShared.roles.member');
    if (normalized === 'guest') return t('detailsShared.roles.guest');
    return meta.label;
  })();

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-2',
        variant === 'pill' && [
          'relative isolate overflow-hidden rounded-full border px-2.5 py-1 transition-colors duration-300',
          size === 'md' ? 'text-sm' : 'text-xs',
          meta.pillClassName,
        ],
        variant === 'inline' && [
          size === 'md' ? 'text-sm' : 'text-xs',
          meta.textClassName,
        ],
        className,
      )}
    >
      {showPillWave ? (
        <span
          className={cn(
            'team-chat-role-pill-wave motion-reduce:hidden pointer-events-none absolute inset-y-0 left-[-48%] w-[58%] -skew-x-12 rounded-full bg-gradient-to-r opacity-90 blur-sm',
            meta.shimmerClassName,
          )}
        />
      ) : null}
      {Icon ? (
        <span
          className={cn(
            'relative z-10 flex shrink-0 items-center justify-center overflow-hidden rounded-full border',
            size === 'md' ? 'h-6 w-6' : 'h-5 w-5',
            meta.iconShellClassName,
          )}
        >
          {meta.shimmerClassName ? (
            <span
              className={cn(
                'team-chat-role-wave motion-reduce:hidden pointer-events-none absolute inset-y-[-30%] left-[-72%] w-[74%] -skew-x-12 rounded-full bg-gradient-to-r opacity-95 blur-[1px]',
                meta.shimmerClassName,
              )}
            />
          ) : null}
          <Icon
            className={cn(
              'relative z-10 shrink-0',
              size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3',
              meta.iconClassName,
            )}
          />
        </span>
      ) : null}
      <span
        className={cn(
          'relative z-10 truncate font-semibold lowercase',
          size === 'md' ? 'leading-5' : 'leading-4',
          meta.textClassName,
        )}
      >
        {translatedLabel}
      </span>
    </span>
  );
}

export interface InviteOption {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  isAlreadyMember?: boolean;
  hasPendingInvitation?: boolean;
  reasonBlocked?: 'already_member' | 'pending_invitation' | string | null;
}

export function getInviteOptionBlockedLabel(
  option: InviteOption,
  labels?: Partial<Record<'already_member' | 'pending_invitation' | 'not_in_project', string>>,
): string | null {
  if (option.reasonBlocked === 'already_member' || option.isAlreadyMember) {
    return labels?.already_member ?? 'Already member';
  }

  if (option.reasonBlocked === 'pending_invitation' || option.hasPendingInvitation) {
    return labels?.pending_invitation ?? 'Pending invite';
  }

  if (option.reasonBlocked === 'not_in_project') {
    return labels?.not_in_project ?? 'Not in project';
  }

  return null;
}

export function extractOrganizationMembers(
  raw: ListMembersResponseData | undefined,
): OrganizationMemberApiDto[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if ('data' in raw && Array.isArray(raw.data)) return raw.data;
  if ('data' in raw && raw.data && typeof raw.data === 'object' && 'data' in raw.data) {
    const nested = raw.data.data;
    if (Array.isArray(nested)) return nested;
  }
  if ('items' in raw && Array.isArray(raw.items)) return raw.items;
  return [];
}

export function mapMemberToInviteOption(member: OrganizationMemberApiDto): InviteOption | null {
  const userId = member.userId ?? member.user_id ?? member.user?.id ?? '';
  if (!userId) return null;

  const email = member.user?.email ?? member.user_email ?? member.email ?? '--';
  const firstName = member.user?.firstName ?? member.user_firstName ?? member.firstName ?? '';
  const lastName = member.user?.lastName ?? member.user_lastName ?? member.lastName ?? '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || email;
  const avatarUrl = member.user?.avatarUrl ?? member.user_avatarUrl ?? member.avatarUrl ?? undefined;

  return {
    userId,
    displayName,
    email,
    avatarUrl,
  };
}

export function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    if (error.message.includes('tenant.members.list')) {
      return fallback;
    }
    return error.message;
  }
  return fallback;
}

export function TabManageRow({
  tab,
  hidden = false,
  canManageTabs,
  canMoveUp,
  canMoveDown,
  onMove,
  onToggleVisibility,
}: {
  tab: ChannelDetailTabItem;
  hidden?: boolean;
  canManageTabs: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (tabId: string, direction: 'up' | 'down') => void;
  onToggleVisibility: (tabId: string) => void;
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
        !canManageTabs && 'cursor-not-allowed',
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

        <div
          className={cn(
            'inline-flex items-center gap-1 rounded-xl border border-border/80 bg-background/95 px-1.5 py-1 shadow-sm transition-all duration-200',
            canManageTabs
              ? 'translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100'
              : 'translate-x-0 opacity-40',
          )}
        >
          <button
            type="button"
            title={visibilityLabel}
            aria-label={visibilityLabel}
            onClick={() => onToggleVisibility(tab.id)}
            disabled={!canManageTabs}
            className={cn(
              'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-muted-foreground',
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
            disabled={!canManageTabs || !canMoveUp}
            className={cn(
              'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-muted-foreground',
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
            disabled={!canManageTabs || !canMoveDown}
            className={cn(
              'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-muted-foreground',
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

export function MemberHoverCard({
  member,
  onMessage,
}: {
  member: ChannelMember;
  onMessage: (member: ChannelMember) => void;
}) {
  const t = useTranslations('teamChat');
  const memberActivityValue = resolveMemberActivityValue(member.localTime);

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className={cn(
            'cursor-pointer rounded-md text-left font-semibold text-foreground transition-colors hover:text-primary',
            focusRingClass,
          )}
        >
          {member.name}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        className="w-[320px] rounded-2xl border-border bg-popover p-0 shadow-2xl"
      >
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-4 px-5 py-5">
            <Avatar className="h-16 w-16 border border-border">
              <AvatarImage src={member.avatarUrl} alt={member.name} />
              <AvatarFallback className="bg-muted text-lg font-semibold text-foreground">
                {initials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-xl font-semibold text-foreground">{member.name}</p>
                <span
                  className={cn('h-2.5 w-2.5 rounded-full', presenceDotClass(member.status))}
                />
              </div>
              <MemberRoleBadge role={member.role} variant="inline" className="mt-1" />
            </div>
          </div>
          <div className="border-t border-border px-5 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              {memberActivityValue
                ? t('detailsShared.presence.lastActive', { value: memberActivityValue })
                : t('detailsShared.presence.unavailable')}
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full cursor-pointer rounded-xl"
              onClick={() => onMessage(member)}
            >
              <MessageSquare className="h-4 w-4" />
              {t('detailsShared.memberProfile.message')}
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export function MemberProfilePanel({
  member,
  channelName,
  conversationLabel,
  currentMemberId,
  canLeaveCurrentMember,
  canManageMembers,
  canTransferOwnership,
  onMessage,
  onRoleChange,
  onRemove,
  onTransferOwnership,
}: {
  member: ChannelMember | null;
  channelName: string;
  conversationLabel: string;
  currentMemberId?: string | null;
  canLeaveCurrentMember: boolean;
  canManageMembers: boolean;
  canTransferOwnership: boolean;
  onMessage: (member: ChannelMember) => void;
  onRoleChange: (
    memberId: string,
    role: 'owner' | 'admin' | 'member' | 'guest',
  ) => Promise<boolean> | boolean;
  onRemove: (memberId: string) => Promise<boolean> | boolean | Promise<void> | void;
  onTransferOwnership: (memberId: string) => Promise<boolean> | boolean;
}) {
  const t = useTranslations('teamChat');
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
  const [removePending, setRemovePending] = useState(false);
  const [transferPending, setTransferPending] = useState(false);
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleSaved, setRoleSaved] = useState(false);
  const [pendingRoleValue, setPendingRoleValue] = useState<
    'owner' | 'admin' | 'member' | 'guest' | null
  >(null);

  useEffect(() => {
    if (!roleSaved) return;

    const timer = window.setTimeout(() => {
      setRoleSaved(false);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [roleSaved]);

  if (!member) {
    return (
      <div className="flex h-full items-center justify-center px-8">
        <div className="max-w-sm rounded-3xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-sm">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-base font-semibold text-foreground">
            {t('detailsShared.memberProfile.selectTitle')}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t('detailsShared.memberProfile.selectDescription')}
          </p>
        </div>
      </div>
    );
  }

  const infoTileClass =
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/80 bg-muted/25 shadow-sm';
  const infoIconClass = 'h-5 w-5 text-muted-foreground';
  const infoGridClass = 'mt-4 grid auto-rows-[112px] gap-3';
  const infoCardClass =
    'grid h-full grid-cols-[48px_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3.5';
  const infoBodyClass = 'flex min-h-0 self-stretch flex-col justify-start py-1';
  const infoLabelClass =
    'text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase';
  const isCurrentMember = member.id === currentMemberId;
  const memberActivityValue = resolveMemberActivityValue(member.localTime);
  const canRemoveSelectedMember = isCurrentMember || canManageMembers;
  const removeActionLabel = isCurrentMember ? t('membersPanel.leave') : t('membersPanel.remove');
  const removeDialogTitle = isCurrentMember
    ? t('detailsShared.memberProfile.leaveTitle', { conversation: conversationLabel })
    : t('detailsShared.memberProfile.removeTitle', {
      name: member.name,
      conversation: conversationLabel,
    });
  const removeDialogDescription = isCurrentMember
    ? t('detailsShared.memberProfile.leaveDescription', { conversation: conversationLabel })
    : t('detailsShared.memberProfile.removeDescription', { conversation: conversationLabel });
  const removeDialogConfirmLabel = isCurrentMember
    ? t('detailsShared.memberProfile.leaveConfirm', { conversation: conversationLabel })
    : t('detailsShared.memberProfile.removeConfirm');

  const handleConfirmRemove = async () => {
    setRemovePending(true);
    const removed = await onRemove(member.id);
    setRemovePending(false);
    if (removed === false) return;
    setRemoveConfirmOpen(false);
  };

  const handleConfirmTransferOwnership = async () => {
    setTransferPending(true);
    const transferred = await onTransferOwnership(member.id);
    setTransferPending(false);
    if (transferred === false) return;
    setTransferConfirmOpen(false);
  };

  const handleRoleChange = async (nextRole: 'owner' | 'admin' | 'member' | 'guest') => {
    if (member.role === 'owner' && nextRole !== 'owner') {
      toast.danger(t('detailsShared.memberProfile.cannotEditOwnerRole'));
      return;
    }

    setPendingRoleValue(nextRole);
    setRoleSaving(true);
    const updated = await onRoleChange(member.id, nextRole);
    setRoleSaving(false);

    if (updated === false) {
      setPendingRoleValue(null);
      return;
    }

    setRoleSaved(true);
  };

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden bg-muted/[0.12]">
        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto w-full max-w-[560px] space-y-4 px-5 py-5">
            <div className="overflow-hidden rounded-[28px] border border-border/80 bg-card shadow-[0_20px_44px_-28px_rgba(15,23,42,0.35)]">
              <div className="h-1.5 bg-gradient-to-r from-primary/65 via-primary/20 to-transparent" />
              <div className="space-y-5 px-5 py-5">
                <div className="grid gap-4 lg:grid-cols-[88px_minmax(0,1fr)_auto] lg:items-start">
                  <Avatar className="h-[88px] w-[88px] border-4 border-background shadow-md">
                    <AvatarImage src={member.avatarUrl} alt={member.name} />
                    <AvatarFallback className="bg-muted text-xl font-semibold text-foreground">
                      {initials(member.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-[2.15rem] leading-none font-semibold tracking-tight text-foreground">
                        {member.name}
                      </h3>
                      <span
                        className={cn('h-3 w-3 rounded-full', presenceDotClass(member.status))}
                      />
                    </div>
                    <MemberRoleBadge role={member.role} size="md" />
                  </div>

                  <div className="flex justify-start lg:justify-end">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase shadow-sm">
                      <span
                        className={cn(
                          'h-2.5 w-2.5 rounded-full',
                          presenceDotClass(member.status),
                        )}
                      />
                      {getPresenceLabel(t, member.status)}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    className="h-11 cursor-pointer rounded-2xl shadow-sm"
                    onClick={() => onMessage(member)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {t('detailsShared.memberProfile.message')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 cursor-pointer rounded-2xl border-destructive/25 bg-background text-destructive shadow-sm hover:bg-destructive/5 hover:text-destructive"
                    disabled={!canRemoveSelectedMember}
                    onClick={() => setRemoveConfirmOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {removeActionLabel}
                  </Button>
                </div>

                {canTransferOwnership && member.role !== 'owner' ? (
                  <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3.5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase">
                          <Crown className="h-3.5 w-3.5 text-amber-400" />
                          {t('detailsShared.memberProfile.ownership')}
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {t('detailsShared.memberProfile.ownershipDescription', {
                            name: member.name,
                            conversation: conversationLabel,
                          })}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-full cursor-pointer rounded-2xl sm:w-auto sm:min-w-[188px]"
                        onClick={() => setTransferConfirmOpen(true)}
                      >
                        <Crown className="h-4 w-4" />
                        {t('detailsShared.memberProfile.transferOwnership')}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2 xl:items-stretch">
              <div className="flex h-full flex-col rounded-[24px] border border-border/80 bg-card p-5 shadow-[0_14px_28px_-22px_rgba(15,23,42,0.35)]">
                <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  {t('detailsShared.memberProfile.contact')}
                </p>
                <div className={infoGridClass}>
                  <div className={infoCardClass}>
                    <div className={infoTileClass}>
                      <Mail className={cn(infoIconClass, 'stroke-[2.3]')} />
                    </div>
                    <div className={infoBodyClass}>
                      <p className={infoLabelClass}>
                        {t('detailsShared.memberProfile.email')}
                      </p>
                      <p className="mt-1.5 line-clamp-2 break-all text-sm leading-5 font-semibold text-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className={infoCardClass}>
                    <div className={infoTileClass}>
                      <Clock3 className={infoIconClass} />
                    </div>
                    <div className={infoBodyClass}>
                      <p className={infoLabelClass}>
                        {t('detailsShared.memberProfile.lastActive')}
                      </p>
                      <p className="mt-1.5 text-sm leading-5 font-semibold text-foreground">
                        {memberActivityValue ?? t('detailsShared.presence.unavailable')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex h-full flex-col rounded-[24px] border border-border/80 bg-card p-5 shadow-[0_14px_28px_-22px_rgba(15,23,42,0.35)]">
                <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  {t('detailsShared.memberProfile.workspaceContext')}
                </p>
                <div className={infoGridClass}>
                  <div className={infoCardClass}>
                    <div className={infoTileClass}>
                      <ShieldCheck className={infoIconClass} />
                    </div>
                    <div className={infoBodyClass}>
                      <p className={infoLabelClass}>
                        {t('detailsShared.memberProfile.role')}
                      </p>
                      <div className="mt-1.5">
                        <Select
                          value={pendingRoleValue ?? member.role}
                          onValueChange={(value) =>
                            void handleRoleChange(
                              value as 'owner' | 'admin' | 'member' | 'guest',
                            )
                          }
                          disabled={!canManageMembers || roleSaving}
                        >
                          <SelectTrigger className="h-10 w-full rounded-xl">
                            <SelectValue className="min-w-0">
                              <MemberRoleBadge
                                role={pendingRoleValue ?? member.role}
                                variant="inline"
                              />
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">
                              <MemberRoleBadge role="owner" variant="inline" />
                            </SelectItem>
                            <SelectItem value="admin">
                              <MemberRoleBadge role="admin" variant="inline" />
                            </SelectItem>
                            <SelectItem value="member">
                              <MemberRoleBadge role="member" variant="inline" />
                            </SelectItem>
                            <SelectItem value="guest">
                              <MemberRoleBadge role="guest" variant="inline" />
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="mt-2 min-h-[16px] text-[11px] text-muted-foreground">
                          {roleSaving
                            ? t('detailsShared.memberProfile.savingRole')
                            : roleSaved
                              ? t('detailsShared.memberProfile.roleSaved')
                              : '\u00a0'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className={infoCardClass}>
                    <div className={infoTileClass}>
                      <Users className={infoIconClass} />
                    </div>
                    <div className={infoBodyClass}>
                      <p className={infoLabelClass}>
                        {conversationLabel}
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-sm leading-5 font-semibold text-foreground">
                        {channelName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      <TeamChatConfirmActionDialog
        open={removeConfirmOpen}
        onOpenChange={setRemoveConfirmOpen}
        title={removeDialogTitle}
        description={removeDialogDescription}
        confirmLabel={removeDialogConfirmLabel}
        pending={removePending}
        onConfirm={handleConfirmRemove}
      />

      <TeamChatConfirmActionDialog
        open={transferConfirmOpen}
        onOpenChange={setTransferConfirmOpen}
        title={t('detailsShared.memberProfile.transferTitle', { name: member.name })}
        description={t('detailsShared.memberProfile.transferDescription', {
          conversation: conversationLabel,
        })}
        confirmLabel={t('detailsShared.memberProfile.transferOwnership')}
        pending={transferPending}
        onConfirm={handleConfirmTransferOwnership}
      />
      <style jsx global>{`
        @keyframes team-chat-role-wave {
          0% {
            transform: translate3d(-185%, 0, 0) skewX(-14deg);
            opacity: 0;
          }
          20% {
            opacity: 0.55;
          }
          55% {
            opacity: 0.95;
          }
          100% {
            transform: translate3d(270%, 0, 0) skewX(-14deg);
            opacity: 0;
          }
        }

        @keyframes team-chat-role-pill-wave {
          0% {
            transform: translate3d(-175%, 0, 0) skewX(-14deg);
            opacity: 0;
          }
          18% {
            opacity: 0.18;
          }
          52% {
            opacity: 0.42;
          }
          100% {
            transform: translate3d(280%, 0, 0) skewX(-14deg);
            opacity: 0;
          }
        }

        .team-chat-role-wave {
          animation: team-chat-role-wave 2.3s linear infinite;
          will-change: transform, opacity;
        }

        .team-chat-role-pill-wave {
          animation: team-chat-role-pill-wave 2.7s linear infinite;
          will-change: transform, opacity;
        }
      `}</style>
    </>
  );
}

