'use client';

import type {
  DailyReportQuery,
  DailyReportTeamQuery,
} from '../types/daily-report.types';

export const dailyReportKeys = {
  root: (tenantId: string | null | undefined) => ['daily-reports', tenantId] as const,
  projectRoot: (tenantId: string | null | undefined, projectId: string) =>
    ['daily-reports', tenantId, projectId] as const,
  my: (tenantId: string | null | undefined, projectId: string, query: DailyReportQuery) =>
    ['daily-reports', tenantId, projectId, 'me', query] as const,
  team: (tenantId: string | null | undefined, projectId: string, query: DailyReportTeamQuery) =>
    ['daily-reports', tenantId, projectId, 'team', query] as const,
  comments: (tenantId: string | null | undefined, projectId: string, reportId: string) =>
    ['daily-reports', tenantId, projectId, 'comments', reportId] as const,
};
