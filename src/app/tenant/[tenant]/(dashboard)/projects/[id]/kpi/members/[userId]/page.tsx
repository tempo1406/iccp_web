'use client';

import { use } from 'react';
import { useProjectById } from '@/features/tenant/projects';
import { ProjectKpiMemberDetail } from '@/features/tenant/analytics/components/project-kpi/project-kpi-member-detail';

interface Props {
  params: Promise<{ tenant: string; id: string; userId: string }>;
}

export default function ProjectKpiMemberDetailPage({ params }: Props) {
  const { id: projectSlug, userId } = use(params);
  const projectQuery = useProjectById(projectSlug);
  const projectId = projectQuery.data?.id ?? '';

  return <ProjectKpiMemberDetail projectId={projectId} userId={userId} projectSlug={projectSlug} />;
}
