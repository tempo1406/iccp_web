'use client';

import { use } from 'react';
import { useProjectById } from '@/features/tenant/projects';
import { ProjectMembersPage } from '@/features/tenant/projects/pages/project-members-page';

interface Props {
  params: Promise<{ tenant: string; id: string }>;
}

export default function MembersPage({ params }: Props) {
  const { id: projectSlug } = use(params);
  const projectQuery = useProjectById(projectSlug);
  const projectId = projectQuery.data?.id ?? '';

  return <ProjectMembersPage projectId={projectId} />;
}
