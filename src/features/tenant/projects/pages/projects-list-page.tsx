'use client';

import { useQueries } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { HttpError } from '@/config/http/errors';
import { ROUTES } from '@/common/constant/routes';
import { formatDate } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useServiceContext } from '@/lib/use-service-context';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { useProjectList } from '@/features/tenant/projects';
import { CreateProjectDialog } from '@/features/tenant/projects/components/create-project-dialog';
import { ProjectsGrid } from '@/features/tenant/projects/components/projects-grid';
import type { ProjectItem } from '@/features/tenant/projects/components/projects-data';
import { ProjectsStatsGrid } from '@/features/tenant/projects/components/projects-stats-grid';
import { ProjectsTable } from '@/features/tenant/projects/components/projects-table';
import { ProjectsToolbar } from '@/features/tenant/projects/components/projects-toolbar';
import { projectKeys } from '@/features/tenant/projects/query/project-keys';
import { ProjectsService } from '@/features/tenant/projects/services/projects.service';
import type {
  ProjectResponse,
  TaskResponse,
} from '@/features/tenant/projects/services/projects.service';

function toUiStatus(status: ProjectResponse['status']): ProjectItem['status'] {
  switch (status) {
    case 'active':
      return 'active';
    case 'planning':
      return 'planning';
    case 'completed':
      return 'completed';
    case 'on_hold':
    case 'cancelled':
      return 'on-hold';
    default:
      return 'planning';
  }
}

function formatDateOrFallback(value: string | null | undefined, fallbackLabel: string): string {
  if (!value) return fallbackLabel;
  return formatDate(value);
}

function resolveProjectSlug(project: ProjectResponse): string {
  const slugValue = (project as ProjectResponse & { slug?: string | null }).slug;
  if (typeof slugValue === 'string' && slugValue.trim().length > 0) {
    return slugValue.trim();
  }
  return project.id;
}

function toOptionalNonNegativeInt(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  if (rounded < 0) return null;
  return rounded;
}

function resolveProjectTaskSummary(project: ProjectResponse): {
  total: number;
  completed: number;
} | null {
  const source = project as ProjectResponse & Record<string, unknown>;
  const total =
    toOptionalNonNegativeInt(source.totalTasks) ??
    toOptionalNonNegativeInt(source.tasksTotal) ??
    toOptionalNonNegativeInt(source.taskCount) ??
    toOptionalNonNegativeInt(source.totalTaskCount);

  if (total == null) return null;

  const completedRaw =
    toOptionalNonNegativeInt(source.completedTasks) ??
    toOptionalNonNegativeInt(source.tasksCompleted) ??
    toOptionalNonNegativeInt(source.doneTasks) ??
    toOptionalNonNegativeInt(source.completedTaskCount);
  const progress = Math.max(0, Math.min(100, Math.round(project.progress ?? 0)));
  const completed =
    completedRaw == null
      ? Math.round((progress / 100) * total)
      : Math.max(0, Math.min(total, completedRaw));

  return { total, completed };
}

function isTopLevelTask(task: TaskResponse): boolean {
  if (task.parentTaskId == null) return true;
  const normalized = task.parentTaskId.trim().toLowerCase();
  return normalized.length === 0 || normalized === 'null' || normalized === 'undefined';
}

function mapProjectToItem(
  project: ProjectResponse,
  labels: { noDescription: string; notAvailable: string },
): ProjectItem {
  const progress = Math.max(0, Math.min(100, Math.round(project.progress ?? 0)));
  const slug = resolveProjectSlug(project);
  const summary = resolveProjectTaskSummary(project);

  return {
    id: project.id,
    slug,
    name: project.name,
    description: project.description ?? labels.noDescription,
    status: toUiStatus(project.status),
    priority: project.priority ?? 'medium',
    progress,
    startDate: formatDateOrFallback(project.startDate, labels.notAvailable),
    dueDate: formatDateOrFallback(project.endDate, labels.notAvailable),
    team: [],
    tasksCompleted: summary?.completed ?? 0,
    tasksTotal: summary?.total ?? 0,
    tags: [slug].filter(Boolean),
  };
}

function isNotProjectMemberError(error: unknown): boolean {
  if (error instanceof HttpError) {
    const message = (error.payload?.message ?? error.message ?? '').toLowerCase();
    if (message.includes('not a member of this project')) return true;
    if (
      error.status === 403 &&
      (message.includes('forbidden') || message.includes('forbidden resource'))
    ) {
      return true;
    }
    return false;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('not a member of this project') ||
      message.includes('forbidden')
    );
  }
  return false;
}

export function ProjectsListPage() {
  const t = useTranslations('project.listPage');
  const commonT = useTranslations('project.common');
  const toolbarT = useTranslations('project.toolbar');
  const statusT = useTranslations('project.statusBadge');
  const router = useRouter();
  const params = useParams<{ tenant: string }>();
  const tenant = params?.tenant;
  const serviceContext = useServiceContext();
  const projectListQuery = useProjectList();
  const canCreateProject = useCan(PERMISSIONS.PROJECTS_CREATE);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const loadErrorToastRef = useRef<string | null>(null);
  const statusOptions = useMemo(
    () => [
      { value: 'all', label: toolbarT('allStatus') },
      { value: 'active', label: statusT('active') },
      { value: 'planning', label: statusT('planning') },
      { value: 'completed', label: statusT('completed') },
      { value: 'on-hold', label: statusT('on-hold') },
    ],
    [statusT, toolbarT],
  );

  const allProjects = useMemo(
    () =>
      (projectListQuery.data ?? []).map((project) =>
        mapProjectToItem(project, {
          noDescription: t('noDescription'),
          notAvailable: commonT('notAvailable'),
        }),
      ),
    [commonT, projectListQuery.data, t],
  );

  const projectMembershipChecks = useQueries({
    queries: allProjects.map((project) => {
      const membershipInput = { page: 1, limit: 1 } as const;
      return {
        queryKey: projectKeys.members(serviceContext.tenantId, project.id, membershipInput),
        queryFn: () =>
          new ProjectsService(serviceContext).listProjectMembers(project.id, membershipInput),
        enabled: Boolean(project.id),
        staleTime: 30_000,
        retry: false,
      };
    }),
  });

  const hiddenProjectIdSet = useMemo(() => {
    const set = new Set<string>();
    allProjects.forEach((project, index) => {
      const check = projectMembershipChecks[index];
      if (check?.isError && isNotProjectMemberError(check.error)) {
        set.add(project.id);
      }
    });
    return set;
  }, [allProjects, projectMembershipChecks]);

  const visibleProjects = useMemo(
    () => allProjects.filter((project) => !hiddenProjectIdSet.has(project.id)),
    [allProjects, hiddenProjectIdSet],
  );

  const projectTaskChecks = useQueries({
    queries: visibleProjects.map((project) => ({
      queryKey: projectKeys.tasks(serviceContext.tenantId, project.id, {}),
      queryFn: () => new ProjectsService(serviceContext).listTasks(project.id, {}),
      enabled: Boolean(project.id),
      staleTime: 30_000,
      retry: false,
    })),
  });

  const taskSummaryByProjectId = useMemo(() => {
    const summaryByProjectId = new Map<string, { total: number }>();
    visibleProjects.forEach((project, index) => {
      const check = projectTaskChecks[index];
      if (!check?.isSuccess || !Array.isArray(check.data)) return;
      const total = check.data.filter((task) => isTopLevelTask(task)).length;
      summaryByProjectId.set(project.id, { total });
    });
    return summaryByProjectId;
  }, [visibleProjects, projectTaskChecks]);

  const visibleProjectsWithTaskTotals = useMemo(
    () =>
      visibleProjects.map((project) => {
        const summary = taskSummaryByProjectId.get(project.id);
        if (!summary) return project;

        const total = Math.max(0, summary.total);
        const completed = total > 0 ? Math.round((project.progress / 100) * total) : 0;

        return {
          ...project,
          tasksTotal: total,
          tasksCompleted: Math.max(0, Math.min(total, completed)),
        };
      }),
    [visibleProjects, taskSummaryByProjectId],
  );

  const isCheckingProjectMembership =
    projectListQuery.isSuccess &&
    projectMembershipChecks.some((query) => query.isPending);

  const getProjectHref = (projectSlug: string) =>
    tenant ? ROUTES.tenant.project(tenant, projectSlug) : `/projects/${projectSlug}`;

  const filteredProjects = useMemo(
    () =>
      visibleProjectsWithTaskTotals.filter((project) => {
        const matchesSearch =
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [visibleProjectsWithTaskTotals, searchQuery, statusFilter],
  );

  const stats = {
    total: visibleProjectsWithTaskTotals.length,
    active: visibleProjectsWithTaskTotals.filter((project) => project.status === 'active').length,
    completed: visibleProjectsWithTaskTotals.filter((project) => project.status === 'completed')
      .length,
    onHold: visibleProjectsWithTaskTotals.filter((project) => project.status === 'on-hold').length,
  };

  useEffect(() => {
    if (!projectListQuery.isError) {
      loadErrorToastRef.current = null;
      return;
    }

    const message = projectListQuery.error?.message?.trim() || t('loadFailed');
    if (loadErrorToastRef.current === message) return;
    loadErrorToastRef.current = message;
    toast.danger(message);
  }, [projectListQuery.isError, projectListQuery.error?.message, t]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={[
          {
            label: commonT('dashboard'),
            href: tenant ? ROUTES.tenant.dashboard(tenant) : ROUTES.dashboard,
          },
          { label: t('title') },
        ]}
        actions={
          <Button
            type="button"
            disabled={!canCreateProject}
            onClick={() => setCreateProjectDialogOpen(true)}
            title={
              canCreateProject
                ? t('createProjectHint')
                : t('createProjectNoPermission')
            }
            className={
              canCreateProject
                ? undefined
                : 'bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed'
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('createProject')}
          </Button>
        }
      />

      <ProjectsStatsGrid
        total={stats.total}
        active={stats.active}
        completed={stats.completed}
        onHold={stats.onHold}
        archived={0}
      />

      <ProjectsToolbar
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        statusOptions={statusOptions}
        viewMode={viewMode}
        onSearchQueryChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
        onViewModeChange={setViewMode}
      />

      {projectListQuery.isError ? (
        <div className="text-destructive rounded-lg border border-dashed border-current/40 p-4 text-sm">
          {projectListQuery.error?.message ?? t('loadFailed')}
        </div>
      ) : projectListQuery.isPending ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          {t('loading')}
        </div>
      ) : isCheckingProjectMembership ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          {t('checkingAccess')}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          {t('empty')}
        </div>
      ) : viewMode === 'grid' ? (
        <ProjectsGrid projects={filteredProjects} getProjectHref={getProjectHref} />
      ) : (
        <ProjectsTable
          projects={filteredProjects}
          onOpenProject={(projectSlug) => router.push(getProjectHref(projectSlug))}
        />
      )}

      {canCreateProject && (
        <CreateProjectDialog
          open={isCreateProjectDialogOpen}
          onOpenChange={setCreateProjectDialogOpen}
          onCreated={(newProjectSlug) => {
            router.push(getProjectHref(newProjectSlug));
          }}
        />
      )}
    </div>
  );
}
