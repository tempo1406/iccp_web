'use client';

import { useQuery } from '@tanstack/react-query';
import { useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { KpiService } from '../services/kpi.service';
import { kpiKeys } from './kpi-keys';
import type { ProjectKpiMembersQuery, ProjectKpiSelfQuery } from '../types/kpi.types';

export function useProjectKpiOverview(projectId: string, enabled = true) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: kpiKeys.projectOverview(ctx.tenantId, projectId),
      queryFn: () => new KpiService(ctx).getProjectOverview(projectId),
      staleTime: 60_000,
      enabled: enabled && !!projectId,
    }),
  );
}

export function useProjectKpiMembers(
  projectId: string,
  query: ProjectKpiMembersQuery = {},
  enabled = true,
) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: kpiKeys.projectMembers(ctx.tenantId, projectId, query),
      queryFn: () => new KpiService(ctx).getProjectMembers(projectId, query),
      staleTime: 60_000,
      enabled: enabled && !!projectId,
    }),
  );
}

export function useProjectMyKpiDetail(
  projectId: string,
  query: ProjectKpiSelfQuery = {},
  enabled = true,
) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: kpiKeys.projectMe(ctx.tenantId, projectId, query),
      queryFn: () => new KpiService(ctx).getProjectMyKpi(projectId, query),
      staleTime: 60_000,
      enabled: enabled && !!projectId,
    }),
  );
}

export function useProjectMemberKpiDetail(
  projectId: string,
  userId: string,
  enabled = true,
) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: kpiKeys.projectMemberDetail(ctx.tenantId, projectId, userId),
      queryFn: () => new KpiService(ctx).getProjectMemberDetail(projectId, userId),
      staleTime: 60_000,
      enabled: enabled && !!projectId && !!userId,
    }),
  );
}
