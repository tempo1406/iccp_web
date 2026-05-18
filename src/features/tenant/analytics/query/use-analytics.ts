'use client';
import { useQuery } from '@tanstack/react-query';
import { useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { AnalyticsService } from '../services/analytics.service';

export function useAnalyticsSummary(input: { from: string; to: string; enabled?: boolean }) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: ['analytics', 'summary', input.from, input.to],
      queryFn: () => new AnalyticsService(ctx).summary({ from: input.from, to: input.to }),
      enabled: input.enabled !== false,
      staleTime: 60_000,
    }),
  );
}

export function useQueriesOverTime(input: {
  from: string;
  to: string;
  granularity?: 'hour' | 'day' | 'week';
  enabled?: boolean;
}) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: ['analytics', 'queriesOverTime', input.from, input.to, input.granularity],
      queryFn: () =>
        new AnalyticsService(ctx).queriesOverTime({
          from: input.from,
          to: input.to,
          granularity: input.granularity ?? 'day',
        }),
      enabled: input.enabled !== false,
      staleTime: 60_000,
    }),
  );
}

export function useTopDocuments(limit?: number) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: ['analytics', 'topDocuments', limit],
      queryFn: () => new AnalyticsService(ctx).topDocuments({ limit: limit ?? 5 }),
      staleTime: 60_000,
    }),
  );
}
