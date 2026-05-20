'use client';

import { useMemo, useState } from 'react';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { useProjectMembers } from '../query/use-project-members';
import { ProjectMembersManagementView } from '../components/project-members-management-view';

const DEFAULT_LIMIT = 10;

interface Props {
  projectId: string;
}

export function ProjectMembersPage({ projectId }: Props) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const canListMembers = useCan(PERMISSIONS.PROJECTS_MEMBERS_LIST);
  const canManageMembers = useCan(PERMISSIONS.PROJECTS_MEMBERS_MANAGE);
  const canUpdateMembers = useCan(PERMISSIONS.PROJECTS_MEMBERS_UPDATE);
  const canListProjectRoles = useCan(PERMISSIONS.PROJECTS_ROLES_LIST);
  const canViewProjectRoles = useCan(PERMISSIONS.PROJECTS_ROLES_VIEW);

  const membersQuery = useProjectMembers(projectId, {}, canListMembers);
  const allMembers = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);

  const canRemoveMember = canManageMembers || canUpdateMembers;
  const canEditAllocatedHours = canManageMembers || canUpdateMembers;
  const canAssignRoleToMember = canManageMembers || canUpdateMembers;
  const canRevokeRoleFromMember = canManageMembers || canUpdateMembers;
  const viewProjectRoles = canListProjectRoles || canViewProjectRoles;

  // Client-side pagination
  const start = (page - 1) * limit;
  const pageMembers = useMemo(
    () => allMembers.slice(start, start + limit),
    [allMembers, start, limit],
  );

  const totalPages = Math.max(1, Math.ceil(allMembers.length / limit));

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  if (!canListMembers || membersQuery.isError) {
    return null;
  }

  return (
    <ProjectMembersManagementView
      projectId={projectId}
      members={pageMembers}
      isPending={membersQuery.isPending}
      errorMessage={membersQuery.isError ? (membersQuery.error?.message ?? 'Failed to load members.') : null}
      canViewMembers={canListMembers}
      canViewProjectRoles={viewProjectRoles}
      canRemoveMember={canRemoveMember}
      canEditAllocatedHours={canEditAllocatedHours}
      canAssignRoleToMember={canAssignRoleToMember}
      canRevokeRoleFromMember={canRevokeRoleFromMember}
      page={page}
      limit={limit}
      pageItemCount={pageMembers.length}
      canGoPrevious={page > 1}
      canGoNext={page < totalPages}
      onPageChange={setPage}
      onLimitChange={handleLimitChange}
    />
  );
}
