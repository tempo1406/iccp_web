'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrgSettingsForm } from '@/features/tenant/org-config/components/org-settings-form';
import { PeriodicReportSettingsCard } from '@/features/tenant/org-config/components/quarterly-report-settings-card';

export default function OrgSettingsPage() {
  const tPage = useTranslations('orgConfig.organizationSettingsPage');
  const tNav = useTranslations('navigation.sidebar.items');

  return (
    <div className="space-y-6">
      <PageHeader
        title={tPage('title')}
        description={tPage('description')}
        breadcrumbs={[
          { label: tNav('settings') },
          { label: tNav('organizationSettings') },
        ]}
      />

      <Tabs defaultValue="kpi-rules" className="space-y-6">
        <TabsList className="h-auto w-full justify-start gap-2 rounded-xl bg-muted/40 p-1 sm:w-fit">
          <TabsTrigger value="kpi-rules" className="px-4 py-2">
            {tPage('tabs.kpiRules')}
          </TabsTrigger>
          <TabsTrigger value="periodic-reporting" className="px-4 py-2">
            {tPage('tabs.periodicReports')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kpi-rules" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{tPage('kpiRules.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {tPage('kpiRules.description')}
            </p>
          </div>
          <OrgSettingsForm />
        </TabsContent>

        <TabsContent value="periodic-reporting" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{tPage('periodicReports.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {tPage('periodicReports.description')}
            </p>
          </div>
          <PeriodicReportSettingsCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
