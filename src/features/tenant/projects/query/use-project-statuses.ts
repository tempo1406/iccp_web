'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeMutation, useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { ProjectsService } from '../services/projects.service';
import type {
  CreateProjectStatusRequest,
  DeleteProjectStatusRequest,
  ProjectStatusListQuery,
  UpdateProjectStatusRequest,
} from '../services/projects.service';
import { projectKeys } from './project-keys';

// Status task APIs
export function useProjectStatuses(projectId: string, input: ProjectStatusListQuery = {}) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: projectKeys.statuses(ctx.tenantId, projectId, input),
      queryFn: () => new ProjectsService(ctx).listProjectStatuses(projectId, input),
      enabled: Boolean(projectId),
      staleTime: 30_000,
    }),
  );
}

export function useCreateProjectStatus() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        body,
      }: {
        projectId: string;
        body: CreateProjectStatusRequest;
      }) => new ProjectsService(ctx).createProjectStatus(projectId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.statusesRoot(ctx.tenantId, variables.projectId),
        });
        void qc.invalidateQueries({
          queryKey: projectKeys.detailRoot(ctx.tenantId),
        });
      },
    }),
  );
}

export function useUpdateProjectStatus() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        statusId,
        body,
      }: {
        projectId: string;
        statusId: string;
        body: UpdateProjectStatusRequest;
      }) => new ProjectsService(ctx).updateProjectStatus(projectId, statusId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.statusesRoot(ctx.tenantId, variables.projectId),
        });
        void qc.invalidateQueries({
          queryKey: projectKeys.detailRoot(ctx.tenantId),
        });
      },
    }),
  );
}

export function useDeleteProjectStatus() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        statusId,
        body,
      }: {
        projectId: string;
        statusId: string;
        body?: DeleteProjectStatusRequest;
      }) => new ProjectsService(ctx).deleteProjectStatus(projectId, statusId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.statusesRoot(ctx.tenantId, variables.projectId),
        });
        void qc.invalidateQueries({
          queryKey: projectKeys.tasksRoot(ctx.tenantId, variables.projectId),
        });
        void qc.invalidateQueries({
          queryKey: projectKeys.detailRoot(ctx.tenantId),
        });
      },
    }),
  );
}
