import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Star, Users, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs } from '@/components/ui/tabs';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { type WorkspaceChannel } from '../data/team-chat-ui-data';
import { type ChannelDetailTabItem, type ChannelMember } from '../data/team-chat-channel-details';
import { focusRingClass, initials } from '../lib/team-chat-screen.shared';
import {
  useTeamChatRoomInviteCandidates,
  useTransferTeamChatRoomOwnership,
} from '../query/use-team-chat';
import { TeamChatConversationAboutPanel } from './team-chat-conversation-about-panel';
import { TeamChatConversationIcon } from './team-chat-conversation-icon';
import {
  createDetailsTabs,
  createNotificationOptions,
  toErrorMessage,
  type ConversationDetailsTab,
  type InviteOption,
  type NotificationPreference,
} from './team-chat-conversation-details-shared';
import { TeamChatConversationMembersPanel } from './team-chat-conversation-members-panel';
import { TeamChatConversationSettingsPanel } from './team-chat-conversation-settings-panel';
import { TeamChatConversationTabsPanel } from './team-chat-conversation-tabs-panel';

interface TeamChatConversationDetailsDialogProps {
  room: WorkspaceChannel;
  conversationKind: 'channel' | 'group_dm';
  details: {
    roomId: string;
    visibility: 'public' | 'private';
    topic?: string;
    description?: string;
    createdBy?: string;
    createdByDisplayName?: string;
    createdAt?: string;
    myUserId?: string;
    members: ChannelMember[];
    notificationPreference: NotificationPreference;
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
    isArchived?: boolean;
    canUnarchive?: boolean;
    allowMemberPinMessages: boolean;
    allowGuestPinMessages: boolean;
    visibilityUpdating?: boolean;
  };
  tabs: ChannelDetailTabItem[];
  memberCount: number;
  starred: boolean;
  onToggleStarred: () => void;
  onMoveTab: (tabId: string, direction: 'up' | 'down') => void;
  onToggleTabVisibility: (tabId: string) => void;
  onOpenMemberDirectMessage: (member: ChannelMember) => void;
  onUpdateNotificationPreference: (
    preference: NotificationPreference,
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
}

export function TeamChatConversationDetailsDialog({
  room,
  conversationKind,
  details,
  tabs,
  memberCount,
  starred,
  onMoveTab,
  onToggleStarred,
  onToggleTabVisibility,
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
}: TeamChatConversationDetailsDialogProps) {
  const t = useTranslations('teamChat');
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ConversationDetailsTab>('members');
  const [memberQuery, setMemberQuery] = useState('');
  const [notificationPreference, setNotificationPreference] =
    useState<NotificationPreference>(details.notificationPreference);
  const [removedMemberIds, setRemovedMemberIds] = useState<string[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(details.members[0]?.id ?? null);
  const [aboutEditMode, setAboutEditMode] = useState(false);
  const [isLeavingChannel, setIsLeavingChannel] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteSuggestionsOpen, setInviteSuggestionsOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [selectedInviteUserIds, setSelectedInviteUserIds] = useState<string[]>([]);
  const [inviteOptionCache, setInviteOptionCache] = useState<Record<string, InviteOption>>({});
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'guest'>('member');
  const [inviteMessage, setInviteMessage] = useState('');
  const [pinPolicyDraft, setPinPolicyDraft] = useState<{
    allowMemberPinMessages: boolean;
    allowGuestPinMessages: boolean;
  } | null>(null);
  const [roomNameDraft, setRoomNameDraft] = useState(room.name);
  const [roomTopicDraft, setRoomTopicDraft] = useState(details.topic ?? '');
  const [roomDescriptionDraft, setRoomDescriptionDraft] = useState(details.description ?? '');
  const [roomInfoSaving, setRoomInfoSaving] = useState(false);
  const [archiveUpdating, setArchiveUpdating] = useState(false);
  const inviteSearchContainerRef = useRef<HTMLDivElement | null>(null);

  const availableMembers = useMemo(
    () => details.members.filter((member) => !removedMemberIds.includes(member.id)),
    [details.members, removedMemberIds],
  );

  const filteredMembers = useMemo(() => {
    const normalized = memberQuery.trim().toLowerCase();
    if (!normalized) return availableMembers;

    return availableMembers.filter((member) =>
      `${member.name} ${member.displayName ?? ''} ${member.role} ${member.email}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [availableMembers, memberQuery]);

  const effectiveSelectedMemberId =
    selectedMemberId && filteredMembers.some((member) => member.id === selectedMemberId)
      ? selectedMemberId
      : filteredMembers[0]?.id ?? null;
  const selectedMember = useMemo(
    () => filteredMembers.find((member) => member.id === effectiveSelectedMemberId) ?? null,
    [effectiveSelectedMemberId, filteredMembers],
  );

  const visibleMembers = availableMembers.slice(0, 5);
  const conversationLabel = conversationKind === 'group_dm' ? t('header.leave.group') : t('header.leave.channel');
  const conversationTitleLabel =
    conversationKind === 'group_dm' ? t('detailsDialog.groupChat') : t('detailsDialog.channel');
  const roomNameLabel =
    conversationKind === 'group_dm' ? t('createGroup.name') : t('createChannel.name');
  const notificationOptions = useMemo(
    () => createNotificationOptions(t, conversationLabel),
    [conversationLabel, t],
  );
  const detailsTabs = useMemo(() => createDetailsTabs(t), [t]);
  const notificationMeta =
    notificationOptions.find((option) => option.id === notificationPreference) ??
    notificationOptions[0];
  const NotificationIcon = notificationMeta.icon;
  const visibleDetailTabs = useMemo(() => tabs.filter((tab) => !tab.hidden), [tabs]);
  const hiddenDetailTabs = useMemo(() => tabs.filter((tab) => tab.hidden), [tabs]);
  const canInviteMembers = details.myPermissions?.canInviteMembers ?? true;
  const canManageMembers = details.myPermissions?.canManageMembers ?? true;
  const canManagePinPolicy = details.myPermissions?.canPinMessages ?? true;
  const canChangeVisibilityToPublic =
    conversationKind === 'channel' ? details.myPermissions?.canChangeVisibilityToPublic ?? false : false;
  const canChangeVisibilityToPrivate =
    conversationKind === 'channel' ? details.myPermissions?.canChangeVisibilityToPrivate ?? false : false;
  const membershipStatus = details.viewerState?.membershipStatus ?? (details.myUserId ? 'member' : 'non_member');
  const canJoinPublicRoom =
    conversationKind === 'channel' &&
    details.visibility === 'public' &&
    membershipStatus !== 'member' &&
    (details.viewerState?.canJoin ?? details.myPermissions?.canJoin ?? true);
  const canManageTabs = details.myRole === 'owner' || details.myRole === 'admin';
  const canLeaveChannel =
    Boolean(details.myUserId) && (details.myPermissions?.canLeave ?? true);
  const isArchived = Boolean(details.isArchived);
  const canArchiveByRole = details.myRole === 'owner' || details.myRole === 'admin';
  const canToggleArchive = isArchived ? details.canUnarchive ?? canArchiveByRole : canArchiveByRole;
  const inviteSearchKeyword = inviteSearch.trim();
  const createdByMember = useMemo(
    () =>
      availableMembers.find((member) => member.id === details.createdBy) ??
      details.members.find((member) => member.id === details.createdBy) ??
      null,
    [availableMembers, details.createdBy, details.members],
  );
  const createdByLabel = useMemo(() => {
    const displayName = details.createdByDisplayName?.trim();
    if (displayName) return displayName;

    const resolvedName = createdByMember?.name || createdByMember?.displayName;
    if (resolvedName?.trim()) return resolvedName;

    const rawCreatedBy = details.createdBy?.trim();
    if (rawCreatedBy) return rawCreatedBy;
    return t('detailsDialog.unknown');
  }, [
    createdByMember?.displayName,
    createdByMember?.name,
    details.createdBy,
    details.createdByDisplayName,
    t,
  ]);
  const roomInfoDirty =
    roomNameDraft.trim() !== room.name.trim() ||
    roomTopicDraft.trim() !== (details.topic ?? '').trim() ||
    roomDescriptionDraft.trim() !== (details.description ?? '').trim();
  const effectiveAllowMemberPinMessages =
    pinPolicyDraft?.allowMemberPinMessages ?? details.allowMemberPinMessages;
  const effectiveAllowGuestPinMessages =
    pinPolicyDraft?.allowGuestPinMessages ?? details.allowGuestPinMessages;
  const pinPolicyDirty =
    effectiveAllowMemberPinMessages !== details.allowMemberPinMessages ||
    effectiveAllowGuestPinMessages !== details.allowGuestPinMessages;
  const transferOwnershipMutation = useTransferTeamChatRoomOwnership();

  const inviteCandidatesQuery = useTeamChatRoomInviteCandidates(
    details.roomId,
    {
      search: inviteSearchKeyword || undefined,
      limit: 20,
    },
    {
      enabled:
        open &&
        inviteDialogOpen &&
        activeTab === 'members' &&
        canInviteMembers &&
        details.roomId.length > 0,
      staleTime: 30_000,
    },
  );

  const inviteOptions = useMemo(
    () =>
      (inviteCandidatesQuery.data?.items ?? []).map((candidate) => ({
        userId: candidate.userId,
        displayName: candidate.displayName,
        email: candidate.email,
        avatarUrl: candidate.avatarUrl ?? undefined,
        isAlreadyMember: candidate.isAlreadyMember,
        hasPendingInvitation: candidate.hasPendingInvitation,
        reasonBlocked: candidate.reasonBlocked ?? null,
      })),
    [inviteCandidatesQuery.data?.items],
  );
  const selectedInviteOptions = useMemo(
    () =>
      selectedInviteUserIds.map(
        (userId) =>
          inviteOptionCache[userId] ??
          inviteOptions.find((option) => option.userId === userId) ?? {
            userId,
            displayName: userId,
            email: '--',
          },
      ),
    [inviteOptionCache, inviteOptions, selectedInviteUserIds],
  );
  const organizationMembersError = inviteCandidatesQuery.isError
    ? toErrorMessage(
        inviteCandidatesQuery.error,
        t(
          conversationKind === 'group_dm'
            ? 'detailsDialog.inviteFallbackGroup'
            : 'detailsDialog.inviteFallbackChannel',
        ),
      )
    : null;
  const roomMembersError = null;


  useEffect(() => {
    if (!inviteDialogOpen || !inviteSuggestionsOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!inviteSearchContainerRef.current?.contains(event.target as Node)) {
        setInviteSuggestionsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setInviteSuggestionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [inviteDialogOpen, inviteSuggestionsOpen]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      setActiveTab('members');
      setMemberQuery('');
      setNotificationPreference(details.notificationPreference);
      setRemovedMemberIds([]);
      setSelectedMemberId(details.members[0]?.id ?? null);
      setAboutEditMode(false);
      setIsLeavingChannel(false);
      setInviteDialogOpen(false);
      setInviteSuggestionsOpen(false);
      setInviteSearch('');
      setSelectedInviteUserIds([]);
      setInviteOptionCache({});
      setInviteRole('member');
      setInviteMessage('');
      setPinPolicyDraft(null);
      setRoomNameDraft(room.name);
      setRoomTopicDraft(details.topic ?? '');
      setRoomDescriptionDraft(details.description ?? '');
      setRoomInfoSaving(false);
      setArchiveUpdating(false);
      return;
    }

    setInviteDialogOpen(false);
    setInviteSuggestionsOpen(false);
  };

  const handleMessageMember = (member: ChannelMember) => {
    setOpen(false);
    onOpenMemberDirectMessage(member);
  };

  const handleRemoveMember = async (memberId: string) => {
    const removed = await onRemoveMember(memberId);
    if (!removed) return false;

    setRemovedMemberIds((previous) => {
      if (previous.includes(memberId)) return previous;
      return [...previous, memberId];
    });

    return true;
  };

  const handleUpdateMemberRole = async (
    memberId: string,
    memberRole: 'owner' | 'admin' | 'member' | 'guest',
  ) => {
    const updated = await onUpdateMemberRole(memberId, memberRole);
    if (!updated) return false;
    return true;
  };

  const handleTransferOwnership = async (memberId: string) => {
    const targetMember =
      availableMembers.find((member) => member.id === memberId) ??
      details.members.find((member) => member.id === memberId) ??
      null;
    const transferResult = await transferOwnershipMutation.mutateAsync({
      roomId: details.roomId,
      body: { newOwnerUserId: memberId },
    });

    if (!transferResult.ok) {
      toast.danger(transferResult.error.message);
      return false;
    }

    if (!transferResult.data.updated) {
      toast.warning(t('detailsDialog.targetAlreadyOwner'));
      return false;
    }

    const targetLabel =
      targetMember?.name?.trim() ||
      targetMember?.displayName?.trim() ||
      targetMember?.email?.trim() ||
      t('detailsShared.roles.member');
    toast.success(t('detailsDialog.ownershipTransferred', { name: targetLabel }));
    return true;
  };

  const handleInviteMembers = async () => {
    if (selectedInviteUserIds.length === 0) {
      toast.warning(t('detailsDialog.selectMember'));
      return;
    }

    const invited = await onInviteMembers({
      userIds: selectedInviteUserIds,
      memberRole: inviteRole,
      inviteMessage: inviteMessage.trim() || undefined,
    });
    if (!invited) return;

    setSelectedInviteUserIds([]);
    setInviteSearch('');
    setInviteMessage('');
    setInviteDialogOpen(false);
  };

  const handleInviteDialogOpenChange = (nextOpen: boolean) => {
    setInviteDialogOpen(nextOpen);
    setInviteSuggestionsOpen(false);
    if (nextOpen) return;
    setInviteSearch('');
    setSelectedInviteUserIds([]);
    setInviteOptionCache({});
    setInviteRole('member');
    setInviteMessage('');
  };

  const handleLeaveChannel = async () => {
    if (!canLeaveChannel) {
      toast.warning('You do not have permission to leave this conversation right now.');
      return;
    }

    if (!details.myUserId) {
      toast.warning(t('detailsDialog.cannotResolveCurrentMember'));
      return;
    }

    setIsLeavingChannel(true);
    const removed = await onRemoveMember(details.myUserId);
    setIsLeavingChannel(false);
    if (!removed) return;

    setOpen(false);
  };

  const handleToggleInviteUser = (userId: string) => {
    const matchedOption = inviteOptions.find((option) => option.userId === userId);
    if (matchedOption) {
      setInviteOptionCache((previous) => ({
        ...previous,
        [userId]: matchedOption,
      }));
    }

    setSelectedInviteUserIds((previous) =>
      previous.includes(userId) ? previous.filter((id) => id !== userId) : [...previous, userId],
    );
  };

  const handleApplyPolicies = async () => {
    const requestedAllowMemberPinMessages = effectiveAllowMemberPinMessages;
    const requestedAllowGuestPinMessages = effectiveAllowGuestPinMessages;
    const policyResult = await onUpdateRoomPolicies({
      allowMemberPinMessages: requestedAllowMemberPinMessages,
      allowGuestPinMessages: requestedAllowGuestPinMessages,
    });
    if (!policyResult?.success) return false;
    setPinPolicyDraft(null);

    if (
      policyResult.currentAllowMemberPinMessages !== requestedAllowMemberPinMessages ||
      policyResult.currentAllowGuestPinMessages !== requestedAllowGuestPinMessages
    ) {
      toast.warning(t('detailsDialog.serverKeptDifferentPinPolicy'));
    }

    return true;
  };

  const handleToggleArchive = async () => {
    setArchiveUpdating(true);
    const updated = await onToggleArchiveState(!isArchived);
    setArchiveUpdating(false);
    if (!updated) return;
    setOpen(false);
  };

  const handleSaveRoomInfo = async (): Promise<boolean> => {
    const normalizedName = roomNameDraft.trim();
    const normalizedTopic = roomTopicDraft.trim();
    const normalizedDescription = roomDescriptionDraft.trim();

    if (!normalizedName) {
      toast.warning(t('detailsDialog.nameRequired', { conversation: conversationTitleLabel }));
      return false;
    }

    setRoomInfoSaving(true);
    const result = await onUpdateRoomInfo({
      name: normalizedName,
      topic: normalizedTopic || undefined,
      description: normalizedDescription || undefined,
    });
    setRoomInfoSaving(false);

    if (!result) return false;
    if (!result.success) return false;
    if (!result.updated) return false;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={t('detailsDialog.openDetails', { room: room.name, conversation: conversationLabel })}
          className={cn(
            'hidden cursor-pointer items-center rounded-2xl border border-border/80 bg-muted/60 px-1.5 py-1 shadow-sm transition-colors hover:bg-muted/80 sm:flex',
            focusRingClass,
          )}
        >
          <div className="flex -space-x-2">
            {visibleMembers.map((member) => (
              <Avatar
                key={member.id}
                className="h-7 w-7 border-2 border-card shadow-[0_2px_6px_rgba(15,23,42,0.15)]"
                title={member.name}
              >
                <AvatarImage src={member.avatarUrl} alt={member.name} />
                <AvatarFallback className="bg-muted text-[11px] font-semibold text-foreground">
                  {initials(member.name)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="mx-2 h-4 w-px bg-border" />
          <span className="pr-1 text-sm font-semibold text-muted-foreground">{memberCount}</span>
        </button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="overflow-hidden border-border bg-card p-0 shadow-2xl sm:max-w-[1040px]"
      >
        <DialogTitle className="sr-only">{t('detailsDialog.title', { room: room.name })}</DialogTitle>
        <DialogDescription className="sr-only">
          {t('detailsDialog.dialogDescription', { conversation: conversationLabel })}
        </DialogDescription>

        <div className="flex max-h-[84vh] min-h-[680px] flex-col overflow-hidden">
          <div className="border-b border-border px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <TeamChatConversationIcon
                  kind={conversationKind}
                  title={room.name}
                  visibility={room.visibility}
                  size="lg"
                />
                <div className="min-w-0">
                  <h2 className="truncate text-3xl font-bold tracking-tight text-foreground">
                    {room.name}
                  </h2>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {details.topic || t('detailsDialog.noTopic', { conversation: conversationLabel })}
                  </p>
                </div>
              </div>

              <DialogClose asChild>
                <button
                  type="button"
                  aria-label={t('detailsDialog.closeDetails')}
                  className={cn(
                    'flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                    focusRingClass,
                  )}
                >
                  <X className="h-5 w-5" />
                </button>
              </DialogClose>
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
                <Star
                  className={cn(
                    'h-4 w-4',
                    starred ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground',
                  )}
                />
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
                    <NotificationIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="leading-none">{notificationMeta.label}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 rounded-2xl p-2">
                  {notificationOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = option.id === notificationPreference;

                    return (
                      <DropdownMenuItem
                        key={option.id}
                        className="cursor-pointer rounded-xl px-3 py-3"
                        onClick={async () => {
                          const previousPreference = notificationPreference;
                          setNotificationPreference(option.id);
                          const updated = await onUpdateNotificationPreference(option.id);
                          if (!updated) {
                            setNotificationPreference(previousPreference);
                          }
                        }}
                      >
                        <div className="flex w-full items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{option.label}</span>
                              {isActive ? <Check className="h-4 w-4 text-primary" /> : null}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
                <Users className="h-3.5 w-3.5" />
                {t('detailsDialog.membersCount', { count: availableMembers.length })}
              </Badge>
              {canJoinPublicRoom ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 cursor-pointer rounded-xl"
                  onClick={async () => {
                    await onJoinPublicRoom(details.roomId);
                  }}
                >
                  <Users className="h-4 w-4" />
                  {t('detailsDialog.joinPublicRoom')}
                </Button>
              ) : null}
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as ConversationDetailsTab)}
            className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden"
          >
            <div className="border-b border-border px-6">
              <TabsPrimitive.List className="-mb-px flex h-12 items-stretch gap-4">
                {detailsTabs.map((tab) => (
                  <TabsPrimitive.Trigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      'inline-flex h-full cursor-pointer items-center justify-center border-x-0 border-t-0 border-b-2 border-b-transparent px-1 py-0 text-sm font-medium leading-none text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-foreground data-[state=active]:text-foreground',
                      focusRingClass,
                    )}
                  >
                    {tab.id === 'members'
                      ? `${tab.label} ${availableMembers.length}`
                      : tab.label}
                  </TabsPrimitive.Trigger>
                ))}
              </TabsPrimitive.List>
            </div>

            <TeamChatConversationAboutPanel
              aboutEditMode={aboutEditMode}
              canLeaveChannel={canLeaveChannel}
              channel={room}
              conversationLabel={conversationLabel}
              conversationTitleLabel={conversationTitleLabel}
              roomNameLabel={roomNameLabel}
              createdByLabel={createdByLabel}
              details={details}
              isLeavingChannel={isLeavingChannel}
              roomDescriptionDraft={roomDescriptionDraft}
              roomInfoDirty={roomInfoDirty}
              roomInfoSaving={roomInfoSaving}
              roomNameDraft={roomNameDraft}
              roomTopicDraft={roomTopicDraft}
              onLeaveChannel={handleLeaveChannel}
              onSaveRoomInfo={handleSaveRoomInfo}
              setAboutEditMode={setAboutEditMode}
              setRoomDescriptionDraft={setRoomDescriptionDraft}
              setRoomNameDraft={setRoomNameDraft}
              setRoomTopicDraft={setRoomTopicDraft}
            />

            <TeamChatConversationMembersPanel
              canInviteMembers={canInviteMembers}
              canLeaveCurrentMember={canLeaveChannel}
              canManageMembers={canManageMembers}
              canTransferOwnership={details.myRole === 'owner'}
              channelName={room.name}
              conversationLabel={conversationLabel}
              currentMemberId={details.myUserId}
              filteredMembers={filteredMembers}
              handleInviteDialogOpenChange={handleInviteDialogOpenChange}
              handleToggleInviteUser={handleToggleInviteUser}
              inviteDialogOpen={inviteDialogOpen}
              inviteMessage={inviteMessage}
              inviteOptions={inviteOptions}
              inviteRole={inviteRole}
              inviteSearch={inviteSearch}
              inviteSearchContainerRef={inviteSearchContainerRef}
              inviteSearchKeyword={inviteSearchKeyword}
              inviteSuggestionsOpen={inviteSuggestionsOpen}
              memberQuery={memberQuery}
              organizationMembersError={organizationMembersError}
              organizationMembersPending={inviteCandidatesQuery.isPending}
              roomMembersError={roomMembersError}
              roomMembersPending={false}
              selectedInviteOptions={selectedInviteOptions}
              selectedInviteUserIds={selectedInviteUserIds}
              selectedMember={selectedMember}
              setInviteMessage={setInviteMessage}
              setInviteRole={setInviteRole}
              setInviteSearch={setInviteSearch}
              setInviteSuggestionsOpen={setInviteSuggestionsOpen}
              setMemberQuery={setMemberQuery}
              setSelectedInviteUserIds={setSelectedInviteUserIds}
              setSelectedMemberId={(value) => setSelectedMemberId(value)}
              onInviteMembers={() => {
                void handleInviteMembers();
              }}
              onMessageMember={handleMessageMember}
              onRemoveMember={handleRemoveMember}
              onTransferOwnership={handleTransferOwnership}
              onUpdateMemberRole={handleUpdateMemberRole}
            />

            <TeamChatConversationTabsPanel
              canManageTabs={canManageTabs}
              hiddenDetailTabs={hiddenDetailTabs}
              onCreateTabPlaceholder={() => toast.infor(t('detailsDialog.newTabPrototype'))}
              onMoveTab={onMoveTab}
              onToggleTabVisibility={onToggleTabVisibility}
              visibleDetailTabs={visibleDetailTabs}
            />

            <TeamChatConversationSettingsPanel
              allowGuestPinMessages={effectiveAllowGuestPinMessages}
              allowMemberPinMessages={effectiveAllowMemberPinMessages}
              archiveUpdating={archiveUpdating}
              canChangeVisibilityToPrivate={canChangeVisibilityToPrivate}
              canChangeVisibilityToPublic={canChangeVisibilityToPublic}
              canManagePinPolicy={canManagePinPolicy}
              canToggleArchive={canToggleArchive}
              channel={room}
              conversationKind={conversationKind}
              conversationLabel={conversationLabel}
              isArchived={isArchived}
              notificationMeta={notificationMeta}
              onApplyPolicies={handleApplyPolicies}
              onToggleArchive={() => {
                void handleToggleArchive();
              }}
              onUpdateVisibility={(nextVisibility) => onUpdateChannelVisibility(nextVisibility)}
              pinPolicyDirty={pinPolicyDirty}
              setAllowGuestPinMessages={(value) =>
                setPinPolicyDraft((previous) => ({
                  allowMemberPinMessages:
                    previous?.allowMemberPinMessages ?? details.allowMemberPinMessages,
                  allowGuestPinMessages: value,
                }))
              }
              setAllowMemberPinMessages={(value) =>
                setPinPolicyDraft((previous) => ({
                  allowMemberPinMessages: value,
                  allowGuestPinMessages:
                    previous?.allowGuestPinMessages ?? details.allowGuestPinMessages,
                }))
              }
              visibility={details.visibility}
              visibilityUpdating={details.visibilityUpdating ?? false}
            />
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

