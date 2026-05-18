'use client';

import { use } from 'react';
import { Loader2 } from 'lucide-react';
import { ProjectReportViewPage } from '@/features/tenant/projects/components/project-report-view-page';
import { useProjectById } from '@/features/tenant/projects/query/use-projects';

interface Props {
  params: Promise<{ tenant: string; id: string }>;
}

export default function ProjectReportsRoute({ params }: Props) {
  const { id: projectSlug } = use(params);
  const projectQuery = useProjectById(projectSlug);
  const projectId = projectQuery.data?.id ?? '';

  if (projectQuery.isPending) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!projectId) return null;

  return (
    <ProjectReportViewPage
      projectId={projectId}
      projectName={projectQuery.data?.name}
    />
  );
}
