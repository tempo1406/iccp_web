'use client';

import { useCan } from '../hooks/use-can';
import type { Permission } from '../permissions';

interface CanProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Render children only if the current user has the given permission.
 * Usage: <Can permission="users:write"><DeleteButton /></Can>
 */
export function Can({ permission, children, fallback = null }: CanProps) {
  const allowed = useCan(permission);
  return allowed ? <>{children}</> : <>{fallback}</>;
}
