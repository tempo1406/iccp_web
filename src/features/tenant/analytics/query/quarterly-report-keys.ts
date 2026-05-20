import type { PeriodicReportHistoryListQuery } from '../types/quarterly-report.types';

export const periodicReportKeys = {
  root: (tenantId: string | null | undefined) =>
    ['analytics', 'periodic-reports', tenantId] as const,

  historyList: (
    tenantId: string | null | undefined,
    query: PeriodicReportHistoryListQuery,
  ) => ['analytics', 'periodic-reports', tenantId, 'history', query] as const,

  historyDetail: (tenantId: string | null | undefined, runId: string) =>
    ['analytics', 'periodic-reports', tenantId, 'history', runId] as const,
};
