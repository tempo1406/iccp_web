'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeMutation, useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { OrganizationRolesService } from '@/services/organization-roles';
import type {
  CreateOrganizationRoleDto,
  MemberRoleMutationDto,
  RolePermissionMutationDto,
  UpdateOrganizationRoleDto,
  UpdateRolePermissionsDto,
} from '@/services/organization-roles';

export const organizationRoleKeys = {
  all: (tenantId: string | null | undefined) =>
    ['organization', 'roles', tenantId] as const,
  byId: (tenantId: string | null | undefined, roleId: string) =>
    ['organization', 'roles', tenantId, roleId] as const,
  memberRoles: (tenantId: string | null | undefined, memberId: string) =>
    ['organization', 'memberRoles', tenantId, memberId] as const,
  myRoles: (tenantId: string | null | undefined) =>
    ['organization', 'roles', 'me', tenantId] as const,
};

export function useOrganizationRolesQuery(
  params?: { search?: string },
  options?: { enabled?: boolean },
) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: [...organizationRoleKeys.all(ctx.tenantId), params?.search ?? ''],
      queryFn: () => new OrganizationRolesService(ctx).listRoles(params),
      enabled: Boolean(ctx.tenantId) && (options?.enabled ?? true),
      staleTime: 30_000,
    }),
  );
}

export function useOrganizationRoleByIdQuery(roleId: string | null, enabled = true) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: organizationRoleKeys.byId(ctx.tenantId, roleId ?? ''),
      queryFn: () => new OrganizationRolesService(ctx).getRoleById(roleId ?? ''),
      enabled: Boolean(ctx.tenantId) && Boolean(roleId) && enabled,
    }),
  );
}

export function useMemberRolesQuery(memberId: string | null, enabled = true) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: organizationRoleKeys.memberRoles(ctx.tenantId, memberId ?? ''),
      queryFn: () => new OrganizationRolesService(ctx).getMemberRoles(memberId ?? ''),
      enabled: Boolean(ctx.tenantId) && Boolean(memberId) && enabled,
    }),
  );
}

export function useMyOrganizationRolesQuery() {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: organizationRoleKeys.myRoles(ctx.tenantId),
      queryFn: () => new OrganizationRolesService(ctx).getMyRoles(),
      enabled: Boolean(ctx.tenantId),
      staleTime: 30_000,
    }),
  );
}

export function useCreateOrganizationRoleMutation() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: CreateOrganizationRoleDto) =>
        new OrganizationRolesService(ctx).createRole(body),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: organizationRoleKeys.all(ctx.tenantId) });
      },
    }),
  );
}

export function useUpdateOrganizationRoleMutation() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        roleId,
        body,
      }: {
        roleId: string;
        body: UpdateOrganizationRoleDto;
      }) => new OrganizationRolesService(ctx).updateRole(roleId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({ queryKey: organizationRoleKeys.all(ctx.tenantId) });
        void qc.invalidateQueries({
          queryKey: organizationRoleKeys.byId(ctx.tenantId, variables.roleId),
        });
      },
    }),
  );
}

export function useDeleteOrganizationRoleMutation() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (roleId: string) =>
        new OrganizationRolesService(ctx).deleteRole(roleId),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: organizationRoleKeys.all(ctx.tenantId) });
      },
    }),
  );
}

export function useAssignRolePermissionsMutation() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: RolePermissionMutationDto) =>
        new OrganizationRolesService(ctx).assignPermissions(body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({ queryKey: organizationRoleKeys.all(ctx.tenantId) });
        void qc.invalidateQueries({
          queryKey: organizationRoleKeys.byId(ctx.tenantId, variables.roleId),
        });
      },
    }),
  );
}

export function useRevokeRolePermissionsMutation() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: RolePermissionMutationDto) =>
        new OrganizationRolesService(ctx).revokePermissions(body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({ queryKey: organizationRoleKeys.all(ctx.tenantId) });
        void qc.invalidateQueries({
          queryKey: organizationRoleKeys.byId(ctx.tenantId, variables.roleId),
        });
      },
    }),
  );
}

export function useUpdateRolePermissionsMutation() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        roleId,
        body,
      }: {
        roleId: string;
        body: UpdateRolePermissionsDto;
      }) => new OrganizationRolesService(ctx).updateRolePermissions(roleId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({ queryKey: organizationRoleKeys.all(ctx.tenantId) });
        void qc.invalidateQueries({
          queryKey: organizationRoleKeys.byId(ctx.tenantId, variables.roleId),
        });
      },
    }),
  );
}

export function useAssignMemberRoleMutation() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: MemberRoleMutationDto) =>
        new OrganizationRolesService(ctx).assignMemberRole(body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({ queryKey: organizationRoleKeys.all(ctx.tenantId) });
        void qc.invalidateQueries({
          queryKey: organizationRoleKeys.memberRoles(ctx.tenantId, variables.userId),
        });
      },
    }),
  );
}

export function useRevokeMemberRoleMutation() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: MemberRoleMutationDto) =>
        new OrganizationRolesService(ctx).revokeMemberRole(body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({ queryKey: organizationRoleKeys.all(ctx.tenantId) });
        void qc.invalidateQueries({
          queryKey: organizationRoleKeys.memberRoles(ctx.tenantId, variables.userId),
        });
      },
    }),
  );
}
