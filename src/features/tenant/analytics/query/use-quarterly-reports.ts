'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeMutation, useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { PeriodicReportService } from '../services/quarterly-report.service';
import { periodicReportKeys } from './quarterly-report-keys';
import type {
  PeriodicReportDispatchRequest,
  PeriodicReportHistoryListQuery,
} from '../types/quarterly-report.types';

export function usePeriodicReportHistory(
  query: PeriodicReportHistoryListQuery,
  enabled = true,
) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: periodicReportKeys.historyList(ctx.tenantId, query),
      queryFn: () => new PeriodicReportService(ctx).getHistory(query),
      staleTime: 30_000,
      enabled,
    }),
  );
}

export function usePeriodicReportHistoryDetail(
  runId: string | null | undefined,
  enabled = true,
) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: periodicReportKeys.historyDetail(ctx.tenantId, runId ?? ''),
      queryFn: () => new PeriodicReportService(ctx).getHistoryDetail(runId ?? ''),
      enabled: enabled && Boolean(runId),
      staleTime: 30_000,
    }),
  );
}

export function useDispatchPeriodicReport() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: PeriodicReportDispatchRequest) =>
        new PeriodicReportService(ctx).dispatch(body),
      onSuccess: (data) => {
        void qc.invalidateQueries({
          queryKey: periodicReportKeys.root(ctx.tenantId),
        });
        void qc.setQueryData(
          periodicReportKeys.historyDetail(ctx.tenantId, data.runId),
          data,
        );
      },
    }),
  );
}
