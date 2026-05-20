'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeMutation, useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { DailyReportService } from '../services/daily-report.service';
import { dailyReportKeys } from './daily-report-keys';
import type {
  AddDailyReportCommentRequest,
  DailyReportQuery,
  DailyReportTeamQuery,
  UpdateDailyReportRequest,
} from '../types/daily-report.types';

export function useMyDailyReport(
  projectId: string,
  query: DailyReportQuery = {},
  enabled = true,
) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: dailyReportKeys.my(ctx.tenantId, projectId, query),
      queryFn: () => new DailyReportService(ctx).getMyReport(projectId, query),
      enabled: Boolean(projectId) && enabled,
      staleTime: 15_000,
    }),
  );
}

export function useGenerateMyDailyReport() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        query,
      }: {
        projectId: string;
        query: DailyReportQuery;
      }) => new DailyReportService(ctx).generateMyReport(projectId, query),
      onSuccess: (data, variables) => {
        void qc.invalidateQueries({
          queryKey: dailyReportKeys.projectRoot(ctx.tenantId, variables.projectId),
        });
        qc.setQueryData(dailyReportKeys.my(ctx.tenantId, variables.projectId, variables.query), data);
      },
    }),
  );
}

export function useUpdateDailyReport() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        reportId,
        body,
      }: {
        projectId: string;
        reportId: string;
        body: UpdateDailyReportRequest;
      }) => new DailyReportService(ctx).updateReport(projectId, reportId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: dailyReportKeys.projectRoot(ctx.tenantId, variables.projectId),
        });
      },
    }),
  );
}

export function useSubmitDailyReport() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({ projectId, reportId }: { projectId: string; reportId: string }) =>
        new DailyReportService(ctx).submitReport(projectId, reportId),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: dailyReportKeys.projectRoot(ctx.tenantId, variables.projectId),
        });
      },
    }),
  );
}

export function useDailyReportComments(projectId: string, reportId: string | null, enabled = true) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: dailyReportKeys.comments(ctx.tenantId, projectId, reportId ?? ''),
      queryFn: () => new DailyReportService(ctx).getReportComments(projectId, reportId ?? ''),
      enabled: Boolean(projectId) && Boolean(reportId) && enabled,
      staleTime: 15_000,
    }),
  );
}

export function useAddDailyReportComment() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        reportId,
        body,
      }: {
        projectId: string;
        reportId: string;
        body: AddDailyReportCommentRequest;
      }) => new DailyReportService(ctx).addReportComment(projectId, reportId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: dailyReportKeys.comments(ctx.tenantId, variables.projectId, variables.reportId),
        });
        void qc.invalidateQueries({
          queryKey: dailyReportKeys.projectRoot(ctx.tenantId, variables.projectId),
        });
      },
    }),
  );
}

export function useMarkDailyReportSeen() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({ projectId, reportId }: { projectId: string; reportId: string }) =>
        new DailyReportService(ctx).markReportSeen(projectId, reportId),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: dailyReportKeys.projectRoot(ctx.tenantId, variables.projectId),
        });
        void qc.invalidateQueries({
          queryKey: dailyReportKeys.comments(ctx.tenantId, variables.projectId, variables.reportId),
        });
      },
    }),
  );
}

export function useTeamDailyReports(
  projectId: string,
  query: DailyReportTeamQuery = {},
  enabled = true,
) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: dailyReportKeys.team(ctx.tenantId, projectId, query),
      queryFn: () => new DailyReportService(ctx).getTeamReports(projectId, query),
      enabled: Boolean(projectId) && enabled,
      staleTime: 15_000,
    }),
  );
}
