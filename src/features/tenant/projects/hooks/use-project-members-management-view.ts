'use client';

import { useMemo, useState } from 'react';
import type { AppError } from '@/lib/safe-query';
import { toast } from '@/lib/toast';
import {
  useAssignProjectRoleToMember,
  useProjectMemberRoles,
  useProjectRoles,
  useRemoveProjectMember,
  useRevokeProjectRoleFromMember,
} from '../query/use-projects';
import { useUpdateProjectMemberRole } from '../query/use-project-members';
import { resolveProjectMemberDisplayName } from '../lib/project-member-display';
import type { ProjectMemberResponse } from '../services/projects.service';
import { useProjectMemberRolesByUserId } from './use-project-member-role-resolver';
import type { ConfirmAlertDialogOptions } from './use-confirm-alert-dialog';

interface UseProjectMembersManagementViewParams {
  projectId: string;
  members: ProjectMemberResponse[];
  userDisplayNameById?: Map<string, string>;
  canLoadRoles: boolean;
  confirmAction: (options: ConfirmAlertDialogOptions) => Promise<boolean>;
}

function resolveMemberRoleSearchText(member: ProjectMemberResponse): string {
  return [
    member.roleName,
    member.roleId,
    member.role,
    ...(member.roleNames ?? []),
    ...(member.roleIds ?? []),
    ...(member.roles ?? []).flatMap((role) => [role.roleName, role.roleId]),
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .toLowerCase();
}

function resolveMemberIdentitySearchText(member: ProjectMemberResponse): string {
  const source = member as ProjectMemberResponse & {
    fullName?: string | null;
    email?: string | null;
    user?: {
      fullName?: string | null;
      email?: string | null;
    } | null;
  };

  return [
    source.fullName,
    source.email,
    source.user?.fullName,
    source.user?.email,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .toLowerCase();
}

function getErrorStatusCode(error: AppError | null | undefined): number | null {
  const cause = error?.cause;
  if (!cause || typeof cause !== 'object') {
    return null;
  }

  const status = (cause as { status?: unknown }).status;
  return typeof status === 'number' ? status : null;
}

function toRoleScopeErrorMessage(
  error: AppError | null | undefined,
  fallbackMessage: string,
): string {
  const message = (error?.message ?? '').trim();
  const normalizedMessage = message.toLowerCase();
  if (
    getErrorStatusCode(error) === 403 &&
    (!message || normalizedMessage === 'forbidden resource')
  ) {
    return 'Role does not belong to this project';
  }

  return message || fallbackMessage;
}

export function useProjectMembersManagementView({
  projectId,
  members,
  userDisplayNameById,
  canLoadRoles,
  confirmAction,
}: UseProjectMembersManagementViewParams) {
  const [searchQuery, setSearchQuery] = useState('');
  const [manageRolesMember, setManageRolesMember] = useState<ProjectMemberResponse | null>(null);
  const [editAllocationMember, setEditAllocationMember] =
    useState<ProjectMemberResponse | null>(null);
  const [draftRoleIds, setDraftRoleIds] = useState<string[]>([]);
  const [isDraftRoleSelectionDirty, setDraftRoleSelectionDirty] = useState(false);
  const [draftAllocatedHours, setDraftAllocatedHours] = useState<string>('');

  const removeMemberMutation = useRemoveProjectMember();
  const updateMemberRoleMutation = useUpdateProjectMemberRole();
  const assignRoleToMemberMutation = useAssignProjectRoleToMember();
  const revokeRoleFromMemberMutation = useRevokeProjectRoleFromMember();
  const rolesQuery = useProjectRoles(projectId, canLoadRoles);
  const manageRolesMemberUserId = manageRolesMember?.userId ?? '';
  const memberRolesQuery = useProjectMemberRoles(projectId, manageRolesMemberUserId);

  const filteredMembers = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return members;
    return members.filter((member) => {
      const displayName = (userDisplayNameById?.get(member.userId) ?? '').toLowerCase();
      return (
        displayName.includes(keyword) ||
        resolveMemberIdentitySearchText(member).includes(keyword) ||
        member.userId.toLowerCase().includes(keyword) ||
        resolveMemberRoleSearchText(member).includes(keyword)
      );
    });
  }, [members, searchQuery, userDisplayNameById]);

  const roles = rolesQuery.data ?? [];
  const isSavingRoleAssignments =
    assignRoleToMemberMutation.isPending || revokeRoleFromMemberMutation.isPending;
  const isSavingAllocatedHours = updateMemberRoleMutation.isPending;
  const currentRoleIds = (memberRolesQuery.data ?? []).map((item) => item.roleId);
  const effectiveDraftRoleIds = isDraftRoleSelectionDirty ? draftRoleIds : currentRoleIds;
  const memberRolesByUserId = useProjectMemberRolesByUserId(projectId, members, canLoadRoles);

  const openManageRoles = (member: ProjectMemberResponse) => {
    setManageRolesMember(member);
    setDraftRoleIds([]);
    setDraftRoleSelectionDirty(false);
  };

  const closeManageRoles = () => {
    setManageRolesMember(null);
    setDraftRoleIds([]);
    setDraftRoleSelectionDirty(false);
  };

  const openEditAllocatedHours = (member: ProjectMemberResponse) => {
    setEditAllocationMember(member);
    const current = member.allocatedHoursPerDay;
    setDraftAllocatedHours(current != null ? String(current) : '');
  };

  const closeEditAllocatedHours = () => {
    setEditAllocationMember(null);
    setDraftAllocatedHours('');
  };

  const toggleDraftRole = (roleId: string, checked: boolean) => {
    setDraftRoleSelectionDirty(true);
    setDraftRoleIds((previous) => {
      const base = isDraftRoleSelectionDirty ? previous : effectiveDraftRoleIds;
      return checked
        ? [...new Set([...base, roleId])]
        : base.filter((value) => value !== roleId);
    });
  };

  const handleRemoveMember = async (member: ProjectMemberResponse) => {
    const memberDisplayName = resolveProjectMemberDisplayName(
      member,
      userDisplayNameById,
    );
    const confirmed = await confirmAction({
      title: 'Remove member',
      description: `Remove "${memberDisplayName}" from this project?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      destructive: true,
    });
    if (!confirmed) return;

    const result = await removeMemberMutation.mutateAsync({
      projectId,
      memberId: member.id,
    });
    if (!result.ok) {
      toast.danger(result.error.message || 'Failed to remove member.');
      return;
    }
    toast.success('Member removed.');
  };

  const handleSaveRoleAssignments = async () => {
    if (!manageRolesMember) return;
    const currentRoleIdSet = new Set((memberRolesQuery.data ?? []).map((item) => item.roleId));
    const nextRoleIdSet = new Set(
      isDraftRoleSelectionDirty
        ? draftRoleIds
        : (memberRolesQuery.data ?? []).map((item) => item.roleId),
    );

    const toAssign = [...nextRoleIdSet].filter((roleId) => !currentRoleIdSet.has(roleId));
    const toRevoke = [...currentRoleIdSet].filter((roleId) => !nextRoleIdSet.has(roleId));

    for (const roleId of toAssign) {
      const result = await assignRoleToMemberMutation.mutateAsync({
        projectId,
        body: {
          userId: manageRolesMember.userId,
          roleId,
        },
      });
      if (!result.ok) {
        toast.danger(toRoleScopeErrorMessage(result.error, 'Failed to assign role to member.'));
        return;
      }
    }

    for (const roleId of toRevoke) {
      const result = await revokeRoleFromMemberMutation.mutateAsync({
        projectId,
        body: {
          userId: manageRolesMember.userId,
          roleId,
        },
      });
      if (!result.ok) {
        toast.danger(toRoleScopeErrorMessage(result.error, 'Failed to revoke role from member.'));
        return;
      }
    }

    toast.success('Member role assignments updated.');
    closeManageRoles();
  };

  const handleSaveAllocatedHours = async () => {
    if (!editAllocationMember) return;

    const parsedHours = draftAllocatedHours.trim()
      ? Number(draftAllocatedHours)
      : null;
    const currentHours = editAllocationMember.allocatedHoursPerDay ?? null;
    const nextHours = Number.isFinite(parsedHours as number) ? parsedHours : null;
    if (nextHours === currentHours) {
      closeEditAllocatedHours();
      return;
    }

    const updateResult = await updateMemberRoleMutation.mutateAsync({
      projectId,
      memberId: editAllocationMember.id,
      body: { allocatedHoursPerDay: nextHours },
    });
    if (!updateResult.ok) {
      toast.danger(updateResult.error.message || 'Failed to update member allocation.');
      return;
    }

    toast.success('Member allocation updated.');
    closeEditAllocatedHours();
  };

  return {
    searchQuery,
    setSearchQuery,
    filteredMembers,
    manageRolesMember,
    editAllocationMember,
    roles,
    rolesQuery,
    memberRolesQuery,
    memberRolesByUserId,
    isSavingRoleAssignments,
    isSavingAllocatedHours,
    effectiveDraftRoleIds,
    draftAllocatedHours,
    setDraftAllocatedHours,
    removeMemberMutation,
    openManageRoles,
    closeManageRoles,
    openEditAllocatedHours,
    closeEditAllocatedHours,
    toggleDraftRole,
    handleRemoveMember,
    handleSaveRoleAssignments,
    handleSaveAllocatedHours,
  };
}

