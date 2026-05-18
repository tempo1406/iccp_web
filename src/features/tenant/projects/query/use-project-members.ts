'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeMutation, useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { ProjectsService } from '../services/projects.service';
import type {
  InviteProjectMemberRequest,
  ProjectMemberListQuery,
  UpdateProjectMemberRoleRequest,
} from '../services/projects.service';
import { projectKeys } from './project-keys';

// Project member APIs
export function useProjectMembers(
  projectId: string,
  input: ProjectMemberListQuery = {},
  enabled = true,
) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: projectKeys.members(ctx.tenantId, projectId, input),
      queryFn: () => new ProjectsService(ctx).listProjectMembers(projectId, input),
      enabled: Boolean(projectId) && enabled,
      staleTime: 30_000,
    }),
  );
}

export function useInviteProjectMember() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        body,
      }: {
        projectId: string;
        body: InviteProjectMemberRequest;
      }) => new ProjectsService(ctx).inviteProjectMember(projectId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({ queryKey: projectKeys.all(ctx.tenantId) });
        void qc.invalidateQueries({
          queryKey: projectKeys.membersRoot(ctx.tenantId, variables.projectId),
        });
      },
    }),
  );
}

export function useUpdateProjectMemberRole() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        memberId,
        body,
      }: {
        projectId: string;
        memberId: string;
        body: UpdateProjectMemberRoleRequest;
      }) => new ProjectsService(ctx).updateProjectMemberRole(projectId, memberId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({ queryKey: projectKeys.all(ctx.tenantId) });
        void qc.invalidateQueries({
          queryKey: projectKeys.membersRoot(ctx.tenantId, variables.projectId),
        });
      },
    }),
  );
}

export function useRemoveProjectMember() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({ projectId, memberId }: { projectId: string; memberId: string }) =>
        new ProjectsService(ctx).removeProjectMember(projectId, memberId),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({ queryKey: projectKeys.all(ctx.tenantId) });
        void qc.invalidateQueries({
          queryKey: projectKeys.membersRoot(ctx.tenantId, variables.projectId),
        });
      },
    }),
  );
}
