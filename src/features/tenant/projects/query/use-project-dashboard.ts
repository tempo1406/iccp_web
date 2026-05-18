'use client';

import { useQuery } from '@tanstack/react-query';
import { useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { ProjectsService } from '../services/projects.service';
import { projectKeys } from './project-keys';
import type { ProjectDashboardQuery } from '../types/project-dashboard.types';

export function useProjectDashboard(
  projectId: string,
  query: ProjectDashboardQuery = {},
  enabled = true,
) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: projectKeys.dashboard(ctx.tenantId, projectId, query),
      queryFn: () => new ProjectsService(ctx).getProjectDashboard(projectId, query),
      staleTime: 60_000,
      enabled: enabled && Boolean(projectId),
    }),
  );
}
