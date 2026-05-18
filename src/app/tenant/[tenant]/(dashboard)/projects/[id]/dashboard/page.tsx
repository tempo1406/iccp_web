'use client';

import { use, Suspense } from 'react';
import { ProjectDashboardPage } from '@/features/tenant/projects/pages/project-dashboard-page';

interface Props {
  params: Promise<{ tenant: string; id: string }>;
}

export default function DashboardPage({ params }: Props) {
  const { id: projectSlug } = use(params);
  return (
    <Suspense>
      <ProjectDashboardPage projectSlug={projectSlug} />
    </Suspense>
  );
}
