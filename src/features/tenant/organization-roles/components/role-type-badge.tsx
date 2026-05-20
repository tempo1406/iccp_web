'use client';

import { Badge } from '@/components/ui/badge';
import type { OrganizationRoleDto } from '@/services/organization-roles';
import { isProtectedRole } from '../hooks/use-organization-roles';

interface RoleTypeBadgeProps {
  role: Pick<OrganizationRoleDto, 'name' | 'isSystemRole'>;
}

export function RoleTypeBadge({ role }: Readonly<RoleTypeBadgeProps>) {
  if (isProtectedRole(role)) {
    return <Badge className="bg-amber-500/10 text-amber-600">Protected</Badge>;
  }

  return <Badge variant="outline">Custom</Badge>;
}
