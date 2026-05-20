'use client';

import { isOk, isErr } from '@/lib/safe-query';
import { toast } from '@/lib/toast';
import type {
  ListMemberRolesResponseData,
  ListOrganizationRolesResponseData,
  OrganizationRoleDto,
  UserRoleAssignmentDto,
} from '@/services/organization-roles';
import {
  useAssignMemberRoleMutation,
  useAssignRolePermissionsMutation,
  useCreateOrganizationRoleMutation,
  useDeleteOrganizationRoleMutation,
  useMemberRolesQuery,
  useMyOrganizationRolesQuery,
  useOrganizationRoleByIdQuery,
  useOrganizationRolesQuery,
  useRevokeMemberRoleMutation,
  useRevokeRolePermissionsMutation,
  useUpdateRolePermissionsMutation,
  useUpdateOrganizationRoleMutation,
} from '../query/organization-roles.queries';

const PROTECTED_ROLE_NAMES = new Set(['org_admin', 'member', 'system_admin']);

function normalizeRoles(
  raw: ListOrganizationRolesResponseData | undefined,
): OrganizationRoleDto[] {
  if (!raw) return [];

  const list = Array.isArray(raw)
    ? raw
    : 'data' in raw && Array.isArray(raw.data)
      ? raw.data
      : 'items' in raw && Array.isArray(raw.items)
        ? raw.items
        : [];

  return list.filter(
    (item): item is OrganizationRoleDto =>
      typeof item.id === 'string' && item.id.length > 0,
  );
}

function normalizeMemberRoles(
  raw: ListMemberRolesResponseData | undefined,
): UserRoleAssignmentDto[] {
  if (!raw) return [];

  const list = Array.isArray(raw)
    ? raw
    : 'data' in raw && Array.isArray(raw.data)
      ? raw.data
      : [];

  return list
    .map((item, index) => ({
      id: item.id ?? `role-assignment-${index + 1}`,
      roleId: item.roleId ?? '',
      roleName: item.roleName ?? 'unknown',
      scopeType: item.scopeType,
      scopeId: item.scopeId ?? null,
      assignedAt: item.assignedAt,
    }))
    .filter((item) => item.roleId.length > 0);
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

export function isProtectedRole(
  role: Pick<OrganizationRoleDto, 'name' | 'isSystemRole'>,
): boolean {
  if (role.isSystemRole) return true;
  return PROTECTED_ROLE_NAMES.has((role.name ?? '').toLowerCase());
}

export function parsePermissionCodes(input: string): string[] {
  const rawCodes = input
    .split(/[,\n;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(rawCodes));
}

export function useOrganizationRolesData() {
  const rolesQuery = useOrganizationRolesQuery();

  return {
    roles: normalizeRoles(rolesQuery.data),
    isPending: rolesQuery.isPending,
    isError: rolesQuery.isError,
    error: rolesQuery.error,
  };
}

export function useOrganizationRoleDetails(roleId: string | null, enabled = true) {
  const roleByIdQuery = useOrganizationRoleByIdQuery(roleId, enabled);

  return {
    role: roleByIdQuery.data ?? null,
    isPending: roleByIdQuery.isPending,
    isError: roleByIdQuery.isError,
    error: roleByIdQuery.error,
  };
}

export function useMyOrganizationRolesData() {
  const myRolesQuery = useMyOrganizationRolesQuery();

  return {
    memberRoles: normalizeMemberRoles(myRolesQuery.data),
    isPending: myRolesQuery.isPending,
    isError: myRolesQuery.isError,
    error: myRolesQuery.error,
  };
}

export function useOrganizationMemberRoles(memberId: string | null, enabled = true) {
  const memberRolesQuery = useMemberRolesQuery(memberId, enabled);

  return {
    memberRoles: normalizeMemberRoles(memberRolesQuery.data),
    isPending: memberRolesQuery.isPending,
    isError: memberRolesQuery.isError,
    error: memberRolesQuery.error,
  };
}

export function useOrganizationRoleActions() {
  const createRoleMutation = useCreateOrganizationRoleMutation();
  const updateRoleMutation = useUpdateOrganizationRoleMutation();
  const deleteRoleMutation = useDeleteOrganizationRoleMutation();
  const assignPermissionsMutation = useAssignRolePermissionsMutation();
  const revokePermissionsMutation = useRevokeRolePermissionsMutation();
  const updateRolePermissionsMutation = useUpdateRolePermissionsMutation();
  const assignMemberRoleMutation = useAssignMemberRoleMutation();
  const revokeMemberRoleMutation = useRevokeMemberRoleMutation();

  const createRole = async (input: { name: string; description?: string }) => {
    const result = await createRoleMutation.mutateAsync({
      name: input.name,
      description: input.description,
    });

    if (isOk(result)) {
      toast.success('Role created successfully.');
      return { ok: true as const };
    }

    if (isErr(result)) {
      const message = toErrorMessage(result.error, 'Failed to create role.');
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  const updateRole = async (input: {
    roleId: string;
    name?: string;
    description?: string;
  }) => {
    const result = await updateRoleMutation.mutateAsync({
      roleId: input.roleId,
      body: {
        name: input.name,
        description: input.description,
      },
    });

    if (isOk(result)) {
      toast.success('Role updated successfully.');
      return { ok: true as const };
    }

    if (isErr(result)) {
      const message = toErrorMessage(result.error, 'Failed to update role.');
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  const deleteRole = async (roleId: string) => {
    const result = await deleteRoleMutation.mutateAsync(roleId);
    if (isOk(result)) {
      toast.success('Role deleted successfully.');
      return { ok: true as const };
    }

    if (isErr(result)) {
      const message = toErrorMessage(result.error, 'Failed to delete role.');
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  const assignPermissions = async (roleId: string, permissionCodes: string[]) => {
    const result = await assignPermissionsMutation.mutateAsync({
      roleId,
      permissionCodes,
    });
    if (isOk(result)) {
      toast.success('Permissions assigned successfully.');
      return { ok: true as const };
    }

    if (isErr(result)) {
      const message = toErrorMessage(result.error, 'Failed to assign permissions.');
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  const revokePermissions = async (roleId: string, permissionCodes: string[]) => {
    const result = await revokePermissionsMutation.mutateAsync({
      roleId,
      permissionCodes,
    });
    if (isOk(result)) {
      toast.success('Permissions revoked successfully.');
      return { ok: true as const };
    }

    if (isErr(result)) {
      const message = toErrorMessage(result.error, 'Failed to revoke permissions.');
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  const updateRolePermissions = async (roleId: string, permissionCodes: string[]) => {
    const result = await updateRolePermissionsMutation.mutateAsync({
      roleId,
      body: { permissionCodes },
    });
    if (isOk(result)) {
      toast.success('Role permissions updated successfully.');
      return { ok: true as const };
    }

    if (isErr(result)) {
      const message = toErrorMessage(result.error, 'Failed to update role permissions.');
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  const assignMemberRole = async (userId: string, roleId: string) => {
    const result = await assignMemberRoleMutation.mutateAsync({ userId, roleId });
    if (isOk(result)) {
      toast.success('Role assigned to member successfully.');
      return { ok: true as const };
    }

    if (isErr(result)) {
      const message = toErrorMessage(result.error, 'Failed to assign role to member.');
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  const revokeMemberRole = async (userId: string, roleId: string) => {
    const result = await revokeMemberRoleMutation.mutateAsync({ userId, roleId });
    if (isOk(result)) {
      toast.success('Role revoked from member successfully.');
      return { ok: true as const };
    }

    if (isErr(result)) {
      const message = toErrorMessage(result.error, 'Failed to revoke role from member.');
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  return {
    createRole,
    updateRole,
    deleteRole,
    assignPermissions,
    revokePermissions,
    updateRolePermissions,
    assignMemberRole,
    revokeMemberRole,
    isSaving:
      createRoleMutation.isPending ||
      updateRoleMutation.isPending ||
      deleteRoleMutation.isPending ||
      assignPermissionsMutation.isPending ||
      revokePermissionsMutation.isPending ||
      updateRolePermissionsMutation.isPending ||
      assignMemberRoleMutation.isPending ||
      revokeMemberRoleMutation.isPending,
  };
}
