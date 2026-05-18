'use client';

import { useEffect, useMemo } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';

import { ROUTES } from '@/common/constant/routes';
import { useServiceContext } from '@/lib/use-service-context';
import { useOptionalTenant } from '@/providers';
import { RbacService } from '@/services/rbac';
import { authTokens } from '@/services/local-storage/auth.storage';
import { useAppSelector } from '@/store';

import { findTenantRouteAccessRule } from '../route-access-map';
import { useQuery } from '@tanstack/react-query';

/**
 * Guards tenant routes based on the user's RBAC permissions.
 *
 * Reads permissions from Redux (populated by RbacLoader) instead of
 * making its own API call — RbacLoader is the sole owner of RBAC fetching.
 */
export function TenantRouteAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams<{ tenant?: string }>();
  const router = useRouter();
  const serviceCtx = useServiceContext();
  const tenantCtx = useOptionalTenant();

  const isProfileLoading = useAppSelector((state) => state.user.isLoading);
  const hasToken = Boolean(authTokens.getAccess());
  const isOrganizationResolving = tenantCtx ? !tenantCtx.isOrganizationResolved : false;
  const rbacPermissions = useAppSelector((state) => state.user.rbacPermissions);
  const rbacPermissionsLoaded = useAppSelector((state) => state.user.rbacPermissionsLoaded);

  const tenant = typeof params.tenant === 'string' ? params.tenant : '';
  const tenantPrefix = tenant.length > 0 ? `/tenant/${tenant}` : '';

  const tenantRelativePath = useMemo(() => {
    if (!tenantPrefix || !pathname.startsWith(tenantPrefix)) {
      return pathname;
    }
    const relativePath = pathname.slice(tenantPrefix.length);
    return relativePath.length > 0 ? relativePath : '/';
  }, [pathname, tenantPrefix]);

  const matchedRule = useMemo(
    () => findTenantRouteAccessRule(tenantRelativePath),
    [tenantRelativePath],
  );

  const rbacQuery = useQuery({
    queryKey: ['rbac', 'me', serviceCtx.tenantId],
    queryFn: () => new RbacService(serviceCtx).getMe(),
    enabled:
      hasToken &&
      !isOrganizationResolving &&
      Boolean(serviceCtx.tenantId) &&
      Boolean(matchedRule),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const resolvedPermissionCodes = Array.isArray(rbacQuery.data?.permissions)
    ? rbacQuery.data.permissions
    : null;
  // Wait for RbacLoader to finish populating Redux before checking permission.
  const isPermissionLoading = Boolean(matchedRule) && !rbacPermissionsLoaded;

  // Read directly from Redux — no duplicate query needed.
  const canAccess = !matchedRule
    ? true
    : matchedRule.anyPermissions
      ? matchedRule.anyPermissions.some((permission) => rbacPermissions.includes(permission))
      : matchedRule.requiredPermission
        ? rbacPermissions.includes(matchedRule.requiredPermission)
        : true;

  useEffect(() => {
    if (isProfileLoading || isPermissionLoading || isOrganizationResolving) {
      return;
    }

    if (matchedRule && !canAccess) {
      router.replace(ROUTES.forbidden);
    }
  }, [isProfileLoading, isPermissionLoading, isOrganizationResolving, matchedRule, canAccess, router]);

  if (isProfileLoading || isPermissionLoading || isOrganizationResolving) {
    return null;
  }

  if (matchedRule && !canAccess) {
    return null;
  }

  return <>{children}</>;
}
