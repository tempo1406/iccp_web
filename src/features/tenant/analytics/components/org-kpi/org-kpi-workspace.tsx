'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { KpiTargetsManager } from '../kpi-targets/kpi-targets-manager';
import { OrgKpiMembersTable } from './org-kpi-members-table';
import { OrgKpiOverviewCards } from './org-kpi-overview-cards';

export function OrgKpiWorkspace() {
  const t = useTranslations('analytics');
  const canViewOrgKpi = useCan(PERMISSIONS.ANALYTICS_KPI_ORG_VIEW);
  const canViewTargetList = useCan(PERMISSIONS.ANALYTICS_KPI_TARGET_VIEW);
  const canManageTargets = useCan(PERMISSIONS.ANALYTICS_KPI_TARGET_MANAGE);
  const canViewTargets = canViewTargetList || canManageTargets;
  const defaultTab = canViewOrgKpi ? 'overview' : 'targets';

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('page.orgKpiTitle')}
        description={t('page.orgKpiDescription')}
        breadcrumbs={[
          { label: t('common.dashboard'), href: '../dashboard' },
          { label: t('common.analytics') },
          { label: t('common.kpi') },
        ]}
      />

      <Tabs defaultValue={defaultTab} className="space-y-4">
        {canViewOrgKpi && canViewTargets ? (
          <TabsList>
            <TabsTrigger value="overview">{t('orgKpi.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="targets">{t('orgKpi.tabs.targets')}</TabsTrigger>
          </TabsList>
        ) : null}

        {canViewOrgKpi ? (
          <TabsContent value="overview" className="space-y-6">
            <OrgKpiOverviewCards />
            <OrgKpiMembersTable />
          </TabsContent>
        ) : null}

        {canViewTargets ? (
          <TabsContent value="targets">
            <KpiTargetsManager />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
