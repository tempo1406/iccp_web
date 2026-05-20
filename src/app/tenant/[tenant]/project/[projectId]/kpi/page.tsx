import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout/page-header';
import { ProjectKpiWorkspace } from '@/features/tenant/analytics/components/project-kpi/project-kpi-workspace';

interface Props {
  params: Promise<{ tenant: string; projectId: string }>;
}

export default async function ProjectKpiPage({ params }: Props) {
  const { projectId } = await params;
  const t = await getTranslations('project.kpiPage');
  const common = await getTranslations('project.common');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={[
          { label: common('dashboard'), href: '../../dashboard' },
          { label: common('projects') },
          { label: t('breadcrumbs.kpi') },
        ]}
      />
      <ProjectKpiWorkspace projectId={projectId} />
    </div>
  );
}
