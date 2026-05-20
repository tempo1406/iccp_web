import { useEffect, useMemo, useState, type MutableRefObject } from 'react';
import { Check, PlusCircle, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TabsContent } from '@/components/ui/tabs';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { type ChannelMember } from '../data/team-chat-channel-details';
import { focusRingClass, initials, presenceDotClass } from '../lib/team-chat-screen.shared';
import {
  getInviteOptionBlockedLabel,
  MemberHoverCard,
  MemberProfilePanel,
  MemberRoleBadge,
  type InviteOption,
} from './team-chat-conversation-details-shared';
import { TeamChatConfirmActionDialog } from './team-chat-confirm-action-dialog';

interface TeamChatConversationMembersPanelProps {
  canInviteMembers: boolean;
  canLeaveCurrentMember: boolean;
  canManageMembers: boolean;
  canTransferOwnership: boolean;
  channelName: string;
  conversationLabel: string;
  currentMemberId?: string | null;
  filteredMembers: ChannelMember[];
  handleInviteDialogOpenChange: (nextOpen: boolean) => void;
  handleToggleInviteUser: (userId: string) => void;
  inviteDialogOpen: boolean;
  inviteMessage: string;
  inviteOptions: InviteOption[];
  inviteRole: 'admin' | 'member' | 'guest';
  inviteSearch: string;
  inviteSearchContainerRef: MutableRefObject<HTMLDivElement | null>;
  inviteSearchKeyword: string;
  inviteSuggestionsOpen: boolean;
  memberQuery: string;
  organizationMembersError: string | null;
  organizationMembersPending: boolean;
  roomMembersError: string | null;
  roomMembersPending: boolean;
  selectedInviteOptions: InviteOption[];
  selectedInviteUserIds: string[];
  selectedMember: ChannelMember | null;
  setInviteMessage: (value: string) => void;
  setInviteRole: (value: 'admin' | 'member' | 'guest') => void;
  setInviteSearch: (value: string) => void;
  setInviteSuggestionsOpen: (value: boolean) => void;
  setMemberQuery: (value: string) => void;
  setSelectedInviteUserIds: (value: string[] | ((previous: string[]) => string[])) => void;
  setSelectedMemberId: (value: string) => void;
  onInviteMembers: () => void;
  onMessageMember: (member: ChannelMember) => void;
  onRemoveMember: (memberId: string) => Promise<boolean> | boolean;
  onTransferOwnership: (memberId: string) => Promise<boolean> | boolean;
  onUpdateMemberRole: (
    memberId: string,
    role: 'owner' | 'admin' | 'member' | 'guest',
  ) => Promise<boolean> | boolean;
}

export function TeamChatConversationMembersPanel({
  canInviteMembers,
  canLeaveCurrentMember,
  canManageMembers,
  canTransferOwnership,
  channelName,
  conversationLabel,
  currentMemberId,
  filteredMembers,
  handleInviteDialogOpenChange,
  handleToggleInviteUser,
  inviteDialogOpen,
  inviteMessage,
  inviteOptions,
  inviteRole,
  inviteSearch,
  inviteSearchContainerRef,
  inviteSearchKeyword,
  inviteSuggestionsOpen,
  memberQuery,
  organizationMembersError,
  organizationMembersPending,
  roomMembersError,
  roomMembersPending,
  selectedInviteOptions,
  selectedInviteUserIds,
  selectedMember,
  setInviteMessage,
  setInviteRole,
  setInviteSearch,
  setInviteSuggestionsOpen,
  setMemberQuery,
  setSelectedInviteUserIds,
  setSelectedMemberId,
  onInviteMembers,
  onMessageMember,
  onRemoveMember,
  onTransferOwnership,
  onUpdateMemberRole,
}: TeamChatConversationMembersPanelProps) {
  const t = useTranslations('teamChat');
  const canSubmitInvite = canInviteMembers && selectedInviteUserIds.length > 0;
  const blockedLabels = useMemo(
    () => ({
      already_member: t('createGroup.blocked.alreadyMember'),
      pending_invitation: t('createGroup.blocked.pendingInvite'),
      not_in_project: t('createGroup.blocked.notInProject'),
    }),
    [t],
  );
  const [memberToRemove, setMemberToRemove] = useState<ChannelMember | null>(null);
  const [removePending, setRemovePending] = useState(false);
  const [roleOverrides, setRoleOverrides] = useState<
    Record<string, 'owner' | 'admin' | 'member' | 'guest'>
  >({});
  const [rolePendingMemberId, setRolePendingMemberId] = useState<string | null>(null);
  const [roleSavedMemberId, setRoleSavedMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (!roleSavedMemberId) return;

    const timer = window.setTimeout(() => {
      setRoleSavedMemberId(null);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [roleSavedMemberId]);

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    setRemovePending(true);
    const removed = await onRemoveMember(memberToRemove.id);
    setRemovePending(false);
    if (!removed) return;
    setMemberToRemove(null);
  };
  const memberToRemoveIsCurrentUser = memberToRemove?.id === currentMemberId;
  const removeDialogTitle = memberToRemove
    ? memberToRemoveIsCurrentUser
      ? t('detailsShared.memberProfile.leaveTitle', { conversation: conversationLabel })
      : t('detailsShared.memberProfile.removeTitle', {
          name: memberToRemove.name,
          conversation: conversationLabel,
        })
    : t('detailsShared.memberProfile.removeTitle', {
        name: t('detailsShared.roles.member'),
        conversation: conversationLabel,
      });
  const removeDialogDescription = memberToRemoveIsCurrentUser
    ? t('detailsShared.memberProfile.leaveDescription', { conversation: conversationLabel })
    : t('detailsShared.memberProfile.removeDescription', { conversation: conversationLabel });
  const removeDialogConfirmLabel = memberToRemoveIsCurrentUser
    ? t('detailsShared.memberProfile.leaveConfirm', { conversation: conversationLabel })
    : t('detailsShared.memberProfile.removeConfirm');

  const handleRoleChange = async (
    member: ChannelMember,
    nextRole: 'owner' | 'admin' | 'member' | 'guest',
  ) => {
    if (member.role === 'owner' && nextRole !== 'owner') {
      toast.danger(t('detailsShared.memberProfile.cannotEditOwnerRole'));
      return;
    }

    const previousRole = roleOverrides[member.id] ?? member.role;
    setRoleOverrides((previous) => ({
      ...previous,
      [member.id]: nextRole,
    }));
    setRolePendingMemberId(member.id);
    const updated = await onUpdateMemberRole(member.id, nextRole);
    setRolePendingMemberId(null);

    if (updated === false) {
      setRoleOverrides((previous) => {
        const nextValue = { ...previous };
        if (previousRole === member.role) {
          delete nextValue[member.id];
        } else {
          nextValue[member.id] = previousRole;
        }
        return nextValue;
      });
      return;
    }

    setRoleSavedMemberId(member.id);
  };

  return (
    <>
      <TabsContent value="members" className="min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full min-h-0 flex-col lg:flex-row">
          <div className="flex min-h-0 flex-col border-b border-border lg:w-[46%] lg:border-r lg:border-b-0">
            <div className="space-y-3 border-b border-border px-6 py-4">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={memberQuery}
                  onChange={(event) => setMemberQuery(event.target.value)}
                  placeholder={t('membersPanel.findMembers')}
                  className="h-11 rounded-2xl bg-background pl-10"
                />
              </div>
              <Dialog open={inviteDialogOpen} onOpenChange={handleInviteDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full cursor-pointer rounded-xl"
                    disabled={!canInviteMembers}
                  >
                    <PlusCircle className="h-4 w-4" />
                    {t('membersPanel.addPeople')}
                  </Button>
                </DialogTrigger>

                <DialogContent className="border-border bg-card sm:max-w-[580px]">
                  <DialogTitle className="text-xl font-semibold">
                    {t('membersPanel.addTitle')}
                  </DialogTitle>
                  <DialogDescription>
                    {t('membersPanel.addDescription')}
                  </DialogDescription>

                  <div className="space-y-4">
                    <div ref={inviteSearchContainerRef} className="relative space-y-2">
                      <Label htmlFor="invite-member-search">{t('membersPanel.people')}</Label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="invite-member-search"
                          value={inviteSearch}
                          onChange={(event) => {
                            setInviteSearch(event.target.value);
                            setInviteSuggestionsOpen(true);
                          }}
                          onFocus={() => setInviteSuggestionsOpen(true)}
                          placeholder={t('membersPanel.searchPlaceholder')}
                          className="h-11 rounded-xl bg-background pl-10"
                          disabled={!canInviteMembers}
                        />
                      </div>
                      {inviteSuggestionsOpen ? (
                        <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
                          <div className="max-h-64 overflow-y-auto overscroll-contain">
                            <div className="divide-y divide-border/70">
                              {organizationMembersPending || roomMembersPending ? (
                                <p className="px-4 py-3 text-sm text-muted-foreground">
                                  {t('membersPanel.loadingMembers')}
                                </p>
                              ) : inviteOptions.length === 0 ? (
                                <p className="px-4 py-3 text-sm text-muted-foreground">
                                  {inviteSearchKeyword
                                    ? t('membersPanel.emptySearch')
                                    : t('membersPanel.emptyDefault')}
                                </p>
                              ) : (
                                inviteOptions.map((option) => {
                                  const isSelected = selectedInviteUserIds.includes(option.userId);
                                  const blockedLabel = getInviteOptionBlockedLabel(option, blockedLabels);
                                  const isBlocked = Boolean(blockedLabel);
                                  return (
                                    <button
                                      key={option.userId}
                                      type="button"
                                      title={blockedLabel ?? undefined}
                                      onClick={() => {
                                        if (isBlocked) return;
                                        handleToggleInviteUser(option.userId);
                                      }}
                                      disabled={isBlocked}
                                      className={cn(
                                        'flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/40',
                                        isSelected && 'bg-primary/10',
                                        isBlocked &&
                                          'cursor-not-allowed opacity-60 hover:bg-transparent',
                                        focusRingClass,
                                      )}
                                    >
                                      <div className="flex min-w-0 items-center gap-3">
                                        <Avatar className="h-8 w-8 border border-border">
                                          <AvatarImage
                                            src={option.avatarUrl}
                                            alt={option.displayName}
                                          />
                                          <AvatarFallback className="bg-muted text-[11px] font-semibold text-foreground">
                                            {initials(option.displayName)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-medium text-foreground">
                                            {option.displayName}
                                          </p>
                                          <p className="truncate text-xs text-muted-foreground">
                                            {option.email}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex shrink-0 items-center gap-2">
                                        {blockedLabel ? (
                                          <Badge
                                            variant="outline"
                                            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                          >
                                            {blockedLabel}
                                          </Badge>
                                        ) : null}
                                        {isSelected ? (
                                          <Check className="h-4 w-4 shrink-0 text-primary" />
                                        ) : null}
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label>{t('membersPanel.selectedMembers')}</Label>
                      <div className="flex min-h-11 flex-wrap gap-2 rounded-xl border border-border bg-background px-3 py-2">
                        {selectedInviteOptions.length === 0 ? (
                          <span className="text-sm text-muted-foreground">{t('membersPanel.noneSelected')}</span>
                        ) : (
                          selectedInviteOptions.map((option) => (
                            <Badge
                              key={option.userId}
                              variant="secondary"
                              className="flex items-center gap-1 rounded-full px-2.5 py-1"
                            >
                              <span className="max-w-[220px] truncate">{option.displayName}</span>
                              <button
                                type="button"
                                aria-label={t('membersPanel.removeInvite', { name: option.displayName })}
                                onClick={() => {
                                  setSelectedInviteUserIds((previous) =>
                                    previous.filter((userId) => userId !== option.userId),
                                  );
                                }}
                                className={cn(
                                  'flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                                  focusRingClass,
                                )}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>

                    {organizationMembersError ? (
                      <p role="alert" className="text-sm text-destructive">
                        {organizationMembersError}
                      </p>
                    ) : null}
                    {roomMembersError ? (
                      <p role="alert" className="text-sm text-destructive">
                        {roomMembersError}
                      </p>
                    ) : null}

                    <div className="grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
                      <div className="space-y-2">
                        <Label htmlFor="invite-member-role">{t('membersPanel.role')}</Label>
                        <Select
                          value={inviteRole}
                          onValueChange={(value) =>
                            setInviteRole(value as 'admin' | 'member' | 'guest')
                          }
                          disabled={!canInviteMembers}
                        >
                          <SelectTrigger id="invite-member-role" className="h-10 rounded-xl">
                            <SelectValue className="min-w-0">
                              <MemberRoleBadge role={inviteRole} variant="inline" />
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
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
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="invite-message">{t('membersPanel.inviteMessage')}</Label>
                        <Input
                          id="invite-message"
                          value={inviteMessage}
                          onChange={(event) => setInviteMessage(event.target.value)}
                          placeholder={t('membersPanel.optionalMessage')}
                          className="h-10 rounded-xl bg-background"
                          disabled={!canInviteMembers}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer rounded-xl"
                        onClick={() => handleInviteDialogOpenChange(false)}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button
                        type="button"
                        className="cursor-pointer rounded-xl"
                        disabled={!canSubmitInvite}
                        onClick={onInviteMembers}
                      >
                        {t('membersPanel.sendInvite')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="divide-y divide-border">
                {filteredMembers.map((member) => {
                  const isActive = member.id === selectedMember?.id;
                  const isCurrentMember = member.id === currentMemberId;
                  const canRemoveMember = isCurrentMember
                    ? canLeaveCurrentMember
                    : canManageMembers;
                  const removeActionLabel = isCurrentMember
                    ? t('membersPanel.leave')
                    : t('membersPanel.remove');

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedMemberId(member.id)}
                      className={cn(
                        'flex w-full cursor-pointer items-start gap-3 px-6 py-4 text-left transition-colors hover:bg-muted/35',
                        isActive && 'bg-muted/35',
                        focusRingClass,
                      )}
                    >
                      <Avatar className="h-12 w-12 border border-border">
                        <AvatarImage src={member.avatarUrl} alt={member.name} />
                        <AvatarFallback className="bg-muted text-sm font-semibold text-foreground">
                          {initials(member.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <MemberHoverCard member={member} onMessage={onMessageMember} />
                          <span
                            className={cn(
                              'h-2.5 w-2.5 rounded-full',
                              presenceDotClass(member.status),
                            )}
                          />
                          {member.displayName ? (
                            <span className="truncate text-sm text-muted-foreground">
                              {member.displayName}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <Select
                            value={roleOverrides[member.id] ?? member.role}
                            onValueChange={(value) =>
                              void handleRoleChange(
                                member,
                                value as 'owner' | 'admin' | 'member' | 'guest',
                              )
                            }
                            disabled={!canManageMembers || rolePendingMemberId === member.id}
                          >
                            <SelectTrigger className="h-8 w-[148px] rounded-lg text-xs">
                              <SelectValue className="min-w-0">
                                <MemberRoleBadge
                                  role={roleOverrides[member.id] ?? member.role}
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
                          <p className="text-[11px] text-muted-foreground">
                            {rolePendingMemberId === member.id
                              ? t('membersPanel.savingRole')
                              : roleSavedMemberId === member.id
                                ? t('membersPanel.roleSaved')
                                : '\u00a0'}
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer rounded-lg px-3 text-destructive hover:bg-destructive/5 hover:text-destructive"
                        disabled={!canRemoveMember}
                        onClick={(event) => {
                          event.stopPropagation();
                          setMemberToRemove(member);
                        }}
                      >
                        {removeActionLabel}
                      </Button>
                    </button>
                  );
                })}

                {filteredMembers.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    {t('membersPanel.emptyList')}
                  </div>
                ) : null}
              </div>
            </ScrollArea>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <MemberProfilePanel
              key={selectedMember?.id ?? 'empty-member'}
              member={selectedMember}
              channelName={channelName}
              conversationLabel={conversationLabel}
              currentMemberId={currentMemberId}
              canLeaveCurrentMember={canLeaveCurrentMember}
              canManageMembers={canManageMembers}
              canTransferOwnership={canTransferOwnership}
              onMessage={onMessageMember}
              onRoleChange={onUpdateMemberRole}
              onRemove={onRemoveMember}
              onTransferOwnership={onTransferOwnership}
            />
          </div>
        </div>
      </TabsContent>

      <TeamChatConfirmActionDialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => {
          if (!open) setMemberToRemove(null);
        }}
        title={removeDialogTitle}
        description={removeDialogDescription}
        confirmLabel={removeDialogConfirmLabel}
        pending={removePending}
        onConfirm={handleConfirmRemoveMember}
      />
    </>
  );
}

