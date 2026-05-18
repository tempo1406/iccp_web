'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeMutation, useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { OrgConfigService } from '../services/org-config.service';
import { orgConfigKeys } from './org-config-keys';
import type { UpsertOrgSettingsRequest } from '../types/org-config.types';

export function useOrgSettings(enabled = true) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: orgConfigKeys.settings(ctx.tenantId),
      queryFn: () => new OrgConfigService(ctx).getSettings(),
      staleTime: 60_000,
      enabled,
    }),
  );
}

export function useUpsertOrgSettings() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: UpsertOrgSettingsRequest) =>
        new OrgConfigService(ctx).upsertSettings(body),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: orgConfigKeys.settings(ctx.tenantId) });
      },
    }),
  );
}
