'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeMutation, useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { ProjectsService } from '../services/projects.service';
import type {
  AssignPermissionsToProjectRoleRequest,
  AssignRoleToProjectMemberRequest,
  CreateProjectRoleRequest,
  RevokePermissionsFromProjectRoleRequest,
  RevokeRoleFromProjectMemberRequest,
  UpdateProjectRoleRequest,
} from '../services/projects.service';
import { projectKeys } from './project-keys';

// Role management APIs
export function useProjectRolesMe(projectId: string) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: projectKeys.rolesMe(ctx.tenantId, projectId),
      queryFn: () => new ProjectsService(ctx).getMyProjectRoles(projectId),
      enabled: Boolean(projectId),
      staleTime: 30_000,
    }),
  );
}

export function useProjectRoles(projectId: string, enabled = true) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: projectKeys.roles(ctx.tenantId, projectId),
      queryFn: () => new ProjectsService(ctx).listProjectRoles(projectId),
      enabled: enabled && Boolean(projectId),
      staleTime: 30_000,
    }),
  );
}

export function useProjectRoleById(projectId: string, roleId: string) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: projectKeys.roleById(ctx.tenantId, projectId, roleId),
      queryFn: () => new ProjectsService(ctx).getProjectRoleById(projectId, roleId),
      enabled: Boolean(projectId) && Boolean(roleId),
    }),
  );
}

export function useProjectRoleAvailablePermissions(projectId: string) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: projectKeys.rolePermissions(ctx.tenantId, projectId),
      queryFn: () => new ProjectsService(ctx).listAvailableProjectRolePermissions(projectId),
      enabled: Boolean(projectId),
      staleTime: 5 * 60_000,
    }),
  );
}

export function useCreateProjectRole() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        body,
      }: {
        projectId: string;
        body: CreateProjectRoleRequest;
      }) => new ProjectsService(ctx).createProjectRole(projectId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.roles(ctx.tenantId, variables.projectId),
        });
      },
    }),
  );
}

export function useUpdateProjectRole() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        roleId,
        body,
      }: {
        projectId: string;
        roleId: string;
        body: UpdateProjectRoleRequest;
      }) => new ProjectsService(ctx).updateProjectRole(projectId, roleId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.roles(ctx.tenantId, variables.projectId),
        });
        void qc.invalidateQueries({
          queryKey: projectKeys.roleById(ctx.tenantId, variables.projectId, variables.roleId),
        });
      },
    }),
  );
}

export function useDeleteProjectRole() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({ projectId, roleId }: { projectId: string; roleId: string }) =>
        new ProjectsService(ctx).deleteProjectRole(projectId, roleId),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.roles(ctx.tenantId, variables.projectId),
        });
      },
    }),
  );
}

export function useAssignProjectRolePermissions() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        body,
      }: {
        projectId: string;
        body: AssignPermissionsToProjectRoleRequest;
      }) => new ProjectsService(ctx).assignPermissionsToProjectRole(projectId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.roles(ctx.tenantId, variables.projectId),
        });
        void qc.invalidateQueries({
          queryKey: projectKeys.roleById(ctx.tenantId, variables.projectId, variables.body.roleId),
        });
      },
    }),
  );
}

export function useRevokeProjectRolePermissions() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        body,
      }: {
        projectId: string;
        body: RevokePermissionsFromProjectRoleRequest;
      }) => new ProjectsService(ctx).revokePermissionsFromProjectRole(projectId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.roles(ctx.tenantId, variables.projectId),
        });
        void qc.invalidateQueries({
          queryKey: projectKeys.roleById(ctx.tenantId, variables.projectId, variables.body.roleId),
        });
      },
    }),
  );
}

export function useProjectMemberRoles(projectId: string, memberId: string) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: projectKeys.memberRoles(ctx.tenantId, projectId, memberId),
      queryFn: () => new ProjectsService(ctx).getProjectMemberRoles(projectId, memberId),
      enabled: Boolean(projectId) && Boolean(memberId),
    }),
  );
}

export function useAssignProjectRoleToMember() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        body,
      }: {
        projectId: string;
        body: AssignRoleToProjectMemberRequest;
      }) => new ProjectsService(ctx).assignRoleToProjectMember(projectId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.memberRoles(
            ctx.tenantId,
            variables.projectId,
            variables.body.userId,
          ),
        });
        void qc.invalidateQueries({
          queryKey: projectKeys.membersRoot(ctx.tenantId, variables.projectId),
        });
      },
    }),
  );
}

export function useRevokeProjectRoleFromMember() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        body,
      }: {
        projectId: string;
        body: RevokeRoleFromProjectMemberRequest;
      }) => new ProjectsService(ctx).revokeRoleFromProjectMember(projectId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.memberRoles(
            ctx.tenantId,
            variables.projectId,
            variables.body.userId,
          ),
        });
        void qc.invalidateQueries({
          queryKey: projectKeys.membersRoot(ctx.tenantId, variables.projectId),
        });
      },
    }),
  );
}
