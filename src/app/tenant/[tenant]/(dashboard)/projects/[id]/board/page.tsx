'use client';

import { use } from 'react';
import { ProjectBoardPage } from '@/features/tenant/projects/pages/project-board-page';

interface Props {
  params: Promise<{ tenant: string; id: string }>;
}

export default function BoardPage({ params }: Props) {
  const { id: projectSlug } = use(params);
  return <ProjectBoardPage projectSlug={projectSlug} />;
}
