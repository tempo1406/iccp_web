'use client';

import { use } from 'react';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { useProjectById } from '@/features/tenant/projects';
import { useProjectRoles } from '@/features/tenant/projects/query/use-project-roles';
import { ProjectRolesManagementView } from '@/features/tenant/projects/components/project-roles-management-view';

interface Props {
  params: Promise<{ tenant: string; id: string }>;
}

export default function ProjectRolesPage({ params }: Props) {
  const { id: projectSlug } = use(params);
  const projectQuery = useProjectById(projectSlug);
  const projectId = projectQuery.data?.id ?? '';

  const canListRoles = useCan(PERMISSIONS.PROJECTS_ROLES_LIST);
  const canViewRoles = canListRoles;
  const canCreateRole = useCan(PERMISSIONS.PROJECTS_ROLES_CREATE);
  const canUpdateRole = useCan(PERMISSIONS.PROJECTS_ROLES_UPDATE);
  const canDeleteRole = useCan(PERMISSIONS.PROJECTS_ROLES_DELETE);
  const canAssignPermissions = useCan(PERMISSIONS.PROJECTS_ROLES_ASSIGN_PERMISSIONS);
  const canRevokePermissions = useCan(PERMISSIONS.PROJECTS_ROLES_REVOKE_PERMISSIONS);

  const rolesQuery = useProjectRoles(projectId, canListRoles);

  if (!canListRoles || rolesQuery.isError) {
    return null;
  }

  return (
    <ProjectRolesManagementView
      key={projectId}
      projectId={projectId}
      canViewRoles={canViewRoles}
      canCreateRole={canCreateRole}
      canUpdateRole={canUpdateRole}
      canDeleteRole={canDeleteRole}
      canAssignPermissions={canAssignPermissions}
      canRevokePermissions={canRevokePermissions}
    />
  );
}
