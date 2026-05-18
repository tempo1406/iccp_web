'use client';

import { use } from 'react';
import { Loader2 } from 'lucide-react';
import { useProjectById } from '@/features/tenant/projects/query/use-projects';
import { ProjectDocumentsPage } from '@/features/tenant/documents/pages/project-documents-page';

interface Props {
  params: Promise<{ tenant: string; id: string }>;
}

export default function ProjectDocumentsRoute({ params }: Props) {
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

  return <ProjectDocumentsPage projectId={projectId} />;
}
