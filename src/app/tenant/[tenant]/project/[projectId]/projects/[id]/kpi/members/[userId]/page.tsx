'use client';

import { use } from 'react';
import { ROUTES } from '@/common/constant/routes';
import { useProjectById } from '@/features/tenant/projects';
import { ProjectKpiMemberDetail } from '@/features/tenant/analytics/components/project-kpi/project-kpi-member-detail';

interface Props {
  params: Promise<{ tenant: string; projectId: string; id: string; userId: string }>;
}

export default function LegacyProjectKpiMemberDetailPage({ params }: Props) {
  const { tenant, id: projectSlug, userId } = use(params);
  const projectQuery = useProjectById(projectSlug);
  const projectId = projectQuery.data?.id ?? '';
  const projectKpiBasePath = ROUTES.tenant.projectTab(tenant, projectSlug, 'kpi');

  return (
    <ProjectKpiMemberDetail
      projectId={projectId}
      userId={userId}
      projectSlug={projectSlug}
      projectKpiBasePath={projectKpiBasePath}
    />
  );
}
