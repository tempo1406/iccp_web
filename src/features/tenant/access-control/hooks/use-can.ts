'use client';

import type { AuthUser } from '@/features/auth/types';
import { useAppSelector } from '@/store';

import { can } from '../policies';
import type { Permission } from '../permissions';

interface PermissionReadyProfile {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string | null;
  permissions?: string[] | null;
}

function toAuthUser(profile: PermissionReadyProfile | null): AuthUser | null {
  if (!profile?.role || !profile.email || !profile.id) {
    return null;
  }

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    fullName: fullName.length > 0 ? fullName : undefined,
  };
}

/**
 * Returns a callback to check permissions using (in priority order):
 * 1) rbacPermissions from Redux (fetched from GET /api/v1/rbac/me)
 * 2) profile.permissions (legacy field, if populated)
 * 3) role-based policy fallback (static mapping in policies.ts)
 */
export function usePermissionChecker(): (permission: Permission) => boolean {
  const profile = useAppSelector((state) => state.user.profile) as PermissionReadyProfile | null;
  const rbacPermissions = useAppSelector((state) => state.user.rbacPermissions);
  const rbacPermissionsLoaded = useAppSelector((state) => state.user.rbacPermissionsLoaded);

  const authUser = toAuthUser(profile);

  const profilePermissions = (profile?.permissions ?? []).filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  ) as string[];

  return (permission: Permission) => {
    // Once RBAC permissions are loaded for the active tenant, treat them as the source of truth
    // even when the resolved permission list is empty.
    if (rbacPermissionsLoaded) {
      return rbacPermissions.includes(permission);
    }

    if (profilePermissions.length > 0) {
      return profilePermissions.includes(permission);
    }

    return can(authUser, permission);
  };
}

/**
 * Returns whether the current user has a given permission.
 */
export function useCan(permission: Permission): boolean {
  const hasPermission = usePermissionChecker();
  return hasPermission(permission);
}

