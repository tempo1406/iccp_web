import { AnalyticsChartsRow } from '@/features/tenant/analytics/components/analytics-charts-row';
import { AnalyticsInsightsTabs } from '@/features/tenant/analytics/components/analytics-insights-tabs';
import { AnalyticsKpiGrid } from '@/features/tenant/analytics/components/analytics-kpi-grid';
import { AnalyticsPageHeader } from '@/features/tenant/analytics/components/analytics-header';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <AnalyticsPageHeader />
      <AnalyticsKpiGrid />
      <AnalyticsChartsRow />
      <AnalyticsInsightsTabs />
    </div>
  );
}
