import { PageHeader } from '@/components/layout/page-header';
import { getTranslations } from 'next-intl/server';
import { MyKpiTargetsPage } from '@/features/tenant/analytics/components/kpi-targets/my-kpi-targets-page';

export default async function MyKpiPage() {
  const t = await getTranslations('analytics');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('page.myKpiTitle')}
        description={t('page.myKpiDescription')}
        breadcrumbs={[
          { label: t('common.dashboard'), href: '../dashboard' },
          { label: t('common.myKpi') },
        ]}
      />
      <MyKpiTargetsPage />
    </div>
  );
}
