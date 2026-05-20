'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { useProjectRolesMe } from '@/features/tenant/projects/query/use-project-roles';
import { ProjectKpiMembersTable } from './project-kpi-members-table';
import { ProjectKpiMyDetail } from './project-kpi-my-detail';
import { ProjectKpiOverviewCards } from './project-kpi-overview-cards';

const PRIVILEGED_PROJECT_ROLES = ['project_manager', 'project_owner'];

interface Props {
  projectId: string;
  projectSlug?: string;
  projectKpiBasePath?: string;
}

export function ProjectKpiWorkspace({ projectId, projectSlug, projectKpiBasePath }: Props) {
  const canViewProjectKpiAll = useCan(PERMISSIONS.ANALYTICS_KPI_PROJECT_VIEW);
  const canViewOrgKpi = useCan(PERMISSIONS.ANALYTICS_KPI_ORG_VIEW);
  const myProjectRolesQuery = useProjectRolesMe(projectId);

  const hasPrivilegedProjectRole = (myProjectRolesQuery.data ?? []).some(
    (role) => PRIVILEGED_PROJECT_ROLES.includes(role.roleName),
  );
  const canViewAll = canViewProjectKpiAll || canViewOrgKpi || hasPrivilegedProjectRole;

  if (!projectId || myProjectRolesQuery.isPending) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (!canViewAll) {
    return <ProjectKpiMyDetail projectId={projectId} />;
  }

  return (
    <div className="space-y-6">
      <ProjectKpiOverviewCards projectId={projectId} />
      <ProjectKpiMembersTable
        projectId={projectId}
        projectSlug={projectSlug}
        projectKpiBasePath={projectKpiBasePath}
      />
    </div>
  );
}
