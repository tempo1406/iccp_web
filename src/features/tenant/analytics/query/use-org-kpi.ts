'use client';

import { useQuery } from '@tanstack/react-query';
import { useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { KpiService } from '../services/kpi.service';
import { kpiKeys } from './kpi-keys';
import type { OrgKpiMembersQuery } from '../types/kpi.types';

export function useOrgKpiOverview(enabled = true) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: kpiKeys.orgOverview(ctx.tenantId),
      queryFn: () => new KpiService(ctx).getOrgOverview(),
      staleTime: 60_000,
      enabled,
    }),
  );
}

export function useOrgKpiMembers(query: OrgKpiMembersQuery = {}, enabled = true) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: kpiKeys.orgMembers(ctx.tenantId, query),
      queryFn: () => new KpiService(ctx).getOrgMembers(query),
      staleTime: 60_000,
      enabled,
    }),
  );
}

export function useOrgMemberKpiDetail(userId: string, enabled = true) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: kpiKeys.orgMemberDetail(ctx.tenantId, userId),
      queryFn: () => new KpiService(ctx).getOrgMemberDetail(userId),
      staleTime: 60_000,
      enabled: enabled && !!userId,
    }),
  );
}
