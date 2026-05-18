'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeMutation, useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { BaseService } from '@/services/base-service';
import { projectKeys } from './project-keys';
import type {
  ProjectSettings,
  UpsertProjectSettingsRequest,
} from '../types/project-settings.types';

class ProjectSettingsService extends BaseService {
  fetchSettings(projectId: string): Promise<ProjectSettings> {
    return this.get(`/v1/projects/${projectId}/settings`);
  }

  upsertSettings(projectId: string, body: UpsertProjectSettingsRequest): Promise<ProjectSettings> {
    return this.put(`/v1/projects/${projectId}/settings`, body);
  }

  resetSettings(projectId: string): Promise<void> {
    return this.delete(`/v1/projects/${projectId}/settings`);
  }
}

export function useProjectSettings(projectId: string, enabled = true) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: projectKeys.settings(ctx.tenantId, projectId),
      queryFn: () => new ProjectSettingsService(ctx).fetchSettings(projectId),
      staleTime: 60_000,
      enabled: Boolean(projectId) && enabled,
    }),
  );
}

export function useUpsertProjectSettings(projectId: string) {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: UpsertProjectSettingsRequest) =>
        new ProjectSettingsService(ctx).upsertSettings(projectId, body),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: projectKeys.settings(ctx.tenantId, projectId) });
      },
    }),
  );
}

export function useResetProjectSettings(projectId: string) {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: () => new ProjectSettingsService(ctx).resetSettings(projectId),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: projectKeys.settings(ctx.tenantId, projectId) });
      },
    }),
  );
}
