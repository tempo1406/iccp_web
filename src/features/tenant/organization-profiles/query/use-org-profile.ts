'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeMutation, useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { useAppSelector } from '@/store';
import { OrgProfileService } from '../services/org-profile.service';
import type { UpdateOrgBrandingBody, UpdateOrgGeneralBody } from '../types/org-profile.types';

type TenantId = string | null | undefined;

const orgProfileRootKey = (tenantId: TenantId) => ['org-profile', tenantId ?? 'global'] as const;

export const ORG_PROFILE_QUERY_KEYS = {
  root: (tenantId?: TenantId) => orgProfileRootKey(tenantId),
  detail: (tenantId?: TenantId) => [...orgProfileRootKey(tenantId), 'detail'] as const,
  branding: (tenantId?: TenantId) => [...orgProfileRootKey(tenantId), 'branding'] as const,
};

/**
 * Full org profile — only for users with a system role (org admin).
 * Regular members must not call GET /v1/organizations/profile.
 */
export function useOrgProfile(options?: { enabled?: boolean }) {
  const ctx = useServiceContext();
  const hasSystemRole = useAppSelector((state) => state.user.rbacHasSystemRole);

  return useSafeQuery(
    useQuery({
      queryKey: ORG_PROFILE_QUERY_KEYS.detail(ctx.tenantId),
      queryFn: () => new OrgProfileService(ctx).getProfile(),
      enabled: hasSystemRole && Boolean(ctx.tenantId) && (options?.enabled ?? true),
      staleTime: 5 * 60_000,
    }),
  );
}

/**
 * Fetches only the branding subset (brandColor, botName, botPersona).
 * Accessible by all members — uses GET /v1/organizations/branding.
 */
export function useOrgBranding(options?: { enabled?: boolean }) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: ORG_PROFILE_QUERY_KEYS.branding(ctx.tenantId),
      queryFn: () => new OrgProfileService(ctx).getBranding(),
      enabled: Boolean(ctx.tenantId) && (options?.enabled ?? true),
      staleTime: 5 * 60_000,
    }),
  );
}

export function useUpdateOrgGeneral() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (body: UpdateOrgGeneralBody) => new OrgProfileService(ctx).updateGeneral(body),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ORG_PROFILE_QUERY_KEYS.root(ctx.tenantId) });
      },
    }),
  );
}

export function useUpdateOrgBranding() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (body: UpdateOrgBrandingBody) => new OrgProfileService(ctx).updateBranding(body),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ORG_PROFILE_QUERY_KEYS.root(ctx.tenantId) });
      },
    }),
  );
}
