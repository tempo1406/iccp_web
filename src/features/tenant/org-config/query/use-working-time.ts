'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeMutation, useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { OrgConfigService } from '../services/org-config.service';
import { orgConfigKeys } from './org-config-keys';
import type { UpsertWorkingTimeRequest, CreateHolidayRequest } from '../types/org-config.types';

export function useWorkingTime(enabled = true) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: orgConfigKeys.workingTime(ctx.tenantId),
      queryFn: () => new OrgConfigService(ctx).getWorkingTime(),
      staleTime: 60_000,
      enabled,
    }),
  );
}

export function useUpsertWorkingTime() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: UpsertWorkingTimeRequest) =>
        new OrgConfigService(ctx).upsertWorkingTime(body),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: orgConfigKeys.workingTime(ctx.tenantId) });
      },
    }),
  );
}

export function useHolidays(enabled = true) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: orgConfigKeys.holidays(ctx.tenantId),
      queryFn: () => new OrgConfigService(ctx).getHolidays(),
      staleTime: 60_000,
      enabled,
    }),
  );
}

export function useCreateHoliday() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: CreateHolidayRequest) =>
        new OrgConfigService(ctx).createHoliday(body),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: orgConfigKeys.holidays(ctx.tenantId) });
      },
    }),
  );
}

export function useDeleteHoliday() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (id: string) => new OrgConfigService(ctx).deleteHoliday(id),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: orgConfigKeys.holidays(ctx.tenantId) });
      },
    }),
  );
}
