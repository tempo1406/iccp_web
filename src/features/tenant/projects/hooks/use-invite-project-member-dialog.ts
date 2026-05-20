'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useOrganizationMembersData } from '@/features/tenant/organization-members/hooks/use-organization-members';
import { toast } from '@/lib/toast';
import type { MemberDto } from '@/services/organizations/types';
import { useInviteProjectMember } from '../query/use-projects';

export interface InviteProjectMemberOption {
  userId: string;
  label: string;
  subtitle?: string;
}

function toMemberLabel(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

interface UseInviteProjectMemberDialogParams {
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectMemberUserIds?: string[];
  isProjectMembersPending?: boolean;
  projectMembersErrorMessage?: string | null;
}

export function useInviteProjectMemberDialog({
  onOpenChange,
  projectId,
  projectMemberUserIds = [],
  isProjectMembersPending = false,
  projectMembersErrorMessage = null,
}: UseInviteProjectMemberDialogParams) {
  const t = useTranslations('project.inviteMemberDialog');
  const inviteMemberMutation = useInviteProjectMember();
  const organizationMembersData = useOrganizationMembersData();

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const availableMembers = useMemo<MemberDto[]>(() => {
    const projectMemberUserIdSet = new Set(projectMemberUserIds);

    return organizationMembersData.members
      .filter(
        (member) =>
          member.userId.length > 0 &&
          !projectMemberUserIdSet.has(member.userId),
      )
      .sort((a, b) => {
        const labelA =
          toMemberLabel(a.firstName, a.lastName) || a.email || `User ${a.userId.slice(0, 8)}`;
        const labelB =
          toMemberLabel(b.firstName, b.lastName) || b.email || `User ${b.userId.slice(0, 8)}`;

        return labelA.localeCompare(labelB);
      });
  }, [organizationMembersData.members, projectMemberUserIds]);

  const selectableMembers = useMemo<InviteProjectMemberOption[]>(() => {
    const normalizedSearch = memberSearch.trim().toLowerCase();

    return availableMembers
      .map((member) => {
        const label =
          toMemberLabel(member.firstName, member.lastName) ||
          member.email ||
          `User ${member.userId.slice(0, 8)}`;

        return {
          userId: member.userId,
          label,
          subtitle: member.email || undefined,
        };
      })
      .filter((member) => {
        if (!normalizedSearch) return true;
        return (
          member.label.toLowerCase().includes(normalizedSearch) ||
          member.subtitle?.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [availableMembers, memberSearch]);

  const isLoadingMembers = organizationMembersData.isPending || isProjectMembersPending;
  const membersErrorMessage =
    projectMembersErrorMessage ||
    organizationMembersData.error?.message ||
    null;
  const hasSelectableMembers = selectableMembers.length > 0;

  const resetState = () => {
    setSelectedUserIds([]);
    setError('');
    setMemberSearch('');
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && inviteMemberMutation.isPending) return;
    if (!nextOpen) resetState();
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const inviteeUserIds = [...new Set(selectedUserIds.map((userId) => userId.trim()).filter(Boolean))];
    if (inviteeUserIds.length === 0) {
      setError(t('validation.required'));
      return;
    }

    if (membersErrorMessage) {
      const message = membersErrorMessage || t('validation.loadFailed');
      setError(message);
      toast.danger(message);
      return;
    }

    if (!projectId) {
      const message = t('validation.projectIdMissing');
      setError(message);
      toast.danger(message);
      return;
    }

    const result = await inviteMemberMutation.mutateAsync({
      projectId,
      body: { inviteeUserIds },
    });

    if (!result.ok) {
      const message = result.error.message || t('toasts.sendFailed');
      setError(message);
      toast.danger(message);
      return;
    }

    toast.success(t('toasts.sent', { count: inviteeUserIds.length }));
    handleOpenChange(false);
  };

  return {
    selectedUserIds,
    setSelectedUserIds,
    memberSearch,
    setMemberSearch,
    availableMembers,
    error,
    selectableMembers,
    isLoadingMembers,
    membersErrorMessage,
    hasSelectableMembers,
    isSubmitting: inviteMemberMutation.isPending,
    handleOpenChange,
    handleSubmit,
  };
}
