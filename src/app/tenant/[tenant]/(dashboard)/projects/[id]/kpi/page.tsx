'use client';

import { use } from 'react';
import { useProjectById } from '@/features/tenant/projects';
import { ProjectKpiWorkspace } from '@/features/tenant/analytics/components/project-kpi/project-kpi-workspace';

interface Props {
  params: Promise<{ tenant: string; id: string }>;
}

export default function ProjectKpiPage({ params }: Props) {
  const { id: projectSlug } = use(params);
  const projectQuery = useProjectById(projectSlug);
  const projectId = projectQuery.data?.id ?? '';

  return <ProjectKpiWorkspace projectId={projectId} projectSlug={projectSlug} />;
}
