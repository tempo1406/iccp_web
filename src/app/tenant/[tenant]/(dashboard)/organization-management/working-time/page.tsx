import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout/page-header';
import { HolidaysTable } from '@/features/tenant/org-config/components/holidays-table';
import { WorkingTimeForm } from '@/features/tenant/org-config/components/working-time-form';

export default async function WorkingTimePage() {
  const tPage = await getTranslations('orgConfig.workingTimePage');
  const tNav = await getTranslations('navigation.sidebar.items');

  return (
    <div className="space-y-6">
      <PageHeader
        title={tPage('title')}
        description={tPage('description')}
        breadcrumbs={[
          { label: tNav('settings') },
          { label: tNav('workingTime') },
        ]}
      />
      <WorkingTimeForm />
      <HolidaysTable />
    </div>
  );
}
