'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeMutation, useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { ProjectsService } from '../services/projects.service';
import type {
  AcceptProjectInviteTokenRequest,
  CreateProjectInviteRequest,
  CreateProjectRequest,
  ProjectInviteMeQuery,
  ProjectListQuery,
  UpdateProjectRequest,
} from '../services/projects.service';
import { projectKeys } from './project-keys';

// Core project APIs
export function useProjectList(input: ProjectListQuery = {}, enabled = true) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: projectKeys.list(ctx.tenantId, input),
      queryFn: () => new ProjectsService(ctx).listProjects(input),
      staleTime: 30_000,
      enabled,
    }),
  );
}

export function useProjectById(projectId: string) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: projectKeys.byId(ctx.tenantId, projectId),
      queryFn: () => new ProjectsService(ctx).getProjectById(projectId),
      enabled: Boolean(projectId),
    }),
  );
}

export function useCreateProject() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: CreateProjectRequest) => new ProjectsService(ctx).createProject(body),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: projectKeys.all(ctx.tenantId) });
      },
    }),
  );
}

export function useUpdateProject() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({ projectId, body }: { projectId: string; body: UpdateProjectRequest }) =>
        new ProjectsService(ctx).updateProject(projectId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({ queryKey: projectKeys.all(ctx.tenantId) });
        void qc.invalidateQueries({
          queryKey: projectKeys.detailRoot(ctx.tenantId),
        });
      },
    }),
  );
}

export function useDeleteProject() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (projectId: string) => new ProjectsService(ctx).deleteProject(projectId),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: projectKeys.all(ctx.tenantId) });
      },
    }),
  );
}

// Project invite APIs (PM + my invites)
export function useCreateProjectInvite() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        body,
      }: {
        projectId: string;
        body: CreateProjectInviteRequest;
      }) => new ProjectsService(ctx).inviteProjectPm(projectId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({ queryKey: projectKeys.all(ctx.tenantId) });
        void qc.invalidateQueries({
          queryKey: projectKeys.detailRoot(ctx.tenantId),
        });
      },
    }),
  );
}

export function useMyProjectInvites(input: ProjectInviteMeQuery = {}) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: projectKeys.invitesMe(ctx.tenantId, input),
      queryFn: () => new ProjectsService(ctx).listMyProjectInvites(input),
      staleTime: 30_000,
    }),
  );
}

export function useAcceptProjectInvite() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: AcceptProjectInviteTokenRequest) =>
        new ProjectsService({ accessToken: ctx.accessToken }).acceptProjectInvite(body),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: ['projects'] });
        void qc.invalidateQueries({ queryKey: ['notifications', 'list'] });
      },
    }),
  );
}

export function useRejectProjectInvite() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (inviteId: string) => new ProjectsService(ctx).rejectProjectInvite(inviteId),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: projectKeys.all(ctx.tenantId) });
      },
    }),
  );
}

export function useCancelProjectInvite() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (inviteId: string) => new ProjectsService(ctx).cancelProjectInvite(inviteId),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: projectKeys.all(ctx.tenantId) });
      },
    }),
  );
}
