'use client';

import { use } from 'react';
import { ProjectDetailLayout } from '@/features/tenant/projects/pages/project-detail-layout';

interface Props {
  children: React.ReactNode;
  params: Promise<{ tenant: string; id: string }>;
}

export default function ProjectDetailRouteLayout({ children, params }: Props) {
  const { tenant, id } = use(params);
  return (
    <ProjectDetailLayout tenant={tenant} projectSlug={id}>
      {children}
    </ProjectDetailLayout>
  );
}
