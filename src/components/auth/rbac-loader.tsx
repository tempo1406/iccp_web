'use client';

/**
 * src/components/auth/rbac-loader.tsx
 *
 * Fetches RBAC permissions from GET /api/v1/rbac/me and stores them in Redux.
 * Must be mounted inside TenantProvider so that tenantId can be injected
 * as x-organization-id for organization-scoped permission checks.
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useServiceContext } from '@/lib/use-service-context';
import { useOptionalTenant } from '@/providers';
import { RbacService } from '@/services/rbac';
import { authTokens } from '@/services/local-storage/auth.storage';
import { useAppDispatch } from '@/store';
import {
  resetRbacPermissions,
  setRbacHasSystemRole,
  setRbacPermissions,
} from '@/store/slices/user/user.slice';

export function RbacLoader({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const ctx = useServiceContext();
  const tenant = useOptionalTenant();
  const hasToken = Boolean(authTokens.getAccess());
  const canResolveTenantRbac = tenant?.isOrganizationResolved ?? true;

  const { data } = useQuery({
    queryKey: ['rbac', 'me', ctx.tenantId],
    queryFn: () => new RbacService(ctx).getMe(),
    enabled: hasToken && canResolveTenantRbac && Boolean(ctx.tenantId),
    staleTime: 5 * 60_000,
    retry: false,
  });

  useEffect(() => {
    // Prevent stale permissions when switching tenant workspace.
    dispatch(resetRbacPermissions());
    dispatch(setRbacHasSystemRole(false));
  }, [ctx.tenantId, dispatch]);

  useEffect(() => {
    if (!data) return;
    dispatch(setRbacPermissions(Array.isArray(data.permissions) ? data.permissions : []));
    dispatch(
      setRbacHasSystemRole(
        Array.isArray(data.roles) && data.roles.some((role) => role.isSystemRole === true),
      ),
    );
  }, [data, dispatch]);

  return <>{children}</>;
}
