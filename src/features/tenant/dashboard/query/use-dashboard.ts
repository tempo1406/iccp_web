'use client';

import { useQuery } from '@tanstack/react-query';
import { useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { DashboardService } from '../services/dashboard.service';
import type { TenantDashboardOverviewQuery } from '../types/dashboard.types';

export function useDashboardOverview(query: TenantDashboardOverviewQuery) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: ['tenant-dashboard', 'overview', query],
      queryFn: () => new DashboardService(ctx).overview(query),
      staleTime: 45_000,
      refetchOnWindowFocus: true,
    }),
  );
}
