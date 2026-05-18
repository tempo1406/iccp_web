'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeMutation, useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { KpiTargetService } from '../services/kpi-target.service';
import { kpiKeys } from './kpi-keys';
import type {
  CloneKpiTargetBody,
  KpiTargetListQuery,
  UpdateKpiTargetBody,
  UpsertKpiTargetBody,
} from '../types/kpi.types';

function useInvalidateKpiTargets() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return (projectId?: string | null) => {
    void queryClient.invalidateQueries({ queryKey: kpiKeys.targetRoot(ctx.tenantId) });
    void queryClient.invalidateQueries({ queryKey: kpiKeys.orgRoot(ctx.tenantId) });

    if (projectId) {
      void queryClient.invalidateQueries({
        queryKey: kpiKeys.projectRoot(ctx.tenantId, projectId),
      });
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: kpiKeys.projectTenantRoot(ctx.tenantId),
    });
  };
}

export function useKpiTargets(query: KpiTargetListQuery = {}, enabled = true) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: kpiKeys.targetList(ctx.tenantId, query),
      queryFn: () => new KpiTargetService(ctx).list(query),
      enabled: enabled && Boolean(ctx.tenantId),
      staleTime: 30_000,
    }),
  );
}

export function useMyKpiTargets(enabled = true) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: kpiKeys.targetMine(ctx.tenantId),
      queryFn: () => new KpiTargetService(ctx).mine(),
      enabled: enabled && Boolean(ctx.tenantId),
      staleTime: 30_000,
    }),
  );
}

export function useKpiTargetDetail(id: string | null, enabled = true) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: kpiKeys.targetDetail(ctx.tenantId, id ?? ''),
      queryFn: () => new KpiTargetService(ctx).detail(id ?? ''),
      enabled: enabled && Boolean(ctx.tenantId) && Boolean(id),
    }),
  );
}

export function useBulkAssignKpiTargets() {
  const ctx = useServiceContext();
  const invalidate = useInvalidateKpiTargets();

  return useSafeMutation(
    useMutation({
      mutationFn: (body: UpsertKpiTargetBody) => new KpiTargetService(ctx).bulkAssign(body),
      onSuccess: (_data, variables) => invalidate(variables.projectId),
    }),
  );
}

export function useCloneKpiTargets() {
  const ctx = useServiceContext();
  const invalidate = useInvalidateKpiTargets();

  return useSafeMutation(
    useMutation({
      mutationFn: (body: CloneKpiTargetBody) => new KpiTargetService(ctx).clone(body),
      onSuccess: (_data, variables) => invalidate(variables.projectId),
    }),
  );
}

export function useUpdateKpiTarget() {
  const ctx = useServiceContext();
  const invalidate = useInvalidateKpiTargets();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({ id, body }: { id: string; body: UpdateKpiTargetBody }) =>
        new KpiTargetService(ctx).update(id, body),
      onSuccess: (response, variables) => {
        invalidate(response.data?.projectId);
        void queryClient.invalidateQueries({
          queryKey: kpiKeys.targetDetail(ctx.tenantId, variables.id),
        });
      },
    }),
  );
}

export function useDeleteKpiTarget() {
  const ctx = useServiceContext();
  const invalidate = useInvalidateKpiTargets();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (id: string) => new KpiTargetService(ctx).remove(id),
      onSuccess: (_data, id) => {
        invalidate();
        void queryClient.invalidateQueries({
          queryKey: kpiKeys.targetDetail(ctx.tenantId, id),
        });
      },
    }),
  );
}
