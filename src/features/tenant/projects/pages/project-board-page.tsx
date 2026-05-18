'use client';

import { useCallback, useMemo, useState, type DragEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQueries } from '@tanstack/react-query';
import { Filter, LayoutGrid, List, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/lib/toast';
import { formatDate, cn } from '@/lib/utils';
import { useServiceContext } from '@/lib/use-service-context';
import { usePagination } from '@/hooks/use-pagination';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import {
  useProjectById,
  useProjectMembers,
  useProjectStatuses,
  useProjectTasks,
  useProjectRoles,
  useCreateProjectTask,
  useUpdateProjectTask,
  useDeleteProjectTask,
  useDuplicateProjectTask,
  useAddProjectTaskTag,
  useCreateProjectStatus,
  useUpdateProjectStatus,
  useDeleteProjectStatus,
  useUpdateProjectTaskStatus,
  useProjectTaskMemberProgress,
} from '../query/use-projects';
import { projectKeys } from '../query/project-keys';
import { ProjectsService } from '../services/projects.service';
import { ProjectKanbanBoard } from '../components/project-kanban-board';
import { ProjectTaskDetailDialog } from '../components/project-task-detail-dialog';
import {
  type ProjectListTask,
  ProjectTaskListTable,
} from '../components/project-task-list-table';
import {
  useProjectDetailHeaderFilters,
  type ProjectHeaderTaskFilterOption,
} from '../hooks/use-project-detail-header-filters';
import type {
  ProjectMemberResponse,
  StatusTaskResponse,
  TaskResponse,
} from '../services/projects.service';
import type { ProjectColumn, ProjectTask } from '../components/project-detail-data';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS = [
  'bg-gray-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-cyan-500',
];

const ASSIGNEE_FILTER_UNASSIGNED = '__filter_unassigned__';
const TAG_FILTER_NO_TAG = '__filter_no_tag__';
const PRIORITY_FILTER_VALUES = ['low', 'medium', 'high', 'urgent'] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeParentTaskId(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === 'null' || normalized === 'undefined') return null;
  return value.trim();
}

function mapTaskToUiTask(
  task: TaskResponse,
  resolveUserLabel: (userId: string) => string,
  resolveUserAvatar: (userId: string) => string | undefined,
  subtaskCount: number,
  taskTagNames?: string[],
): ProjectTask {
  const anyTask = task as TaskResponse & { slug?: string | null };
  const slug = anyTask.slug?.trim()
    ? anyTask.slug.trim().toUpperCase()
    : `TS-${task.id.replace(/-/g, '').slice(0, 4).toUpperCase()}`;

  const tags = taskTagNames?.filter(Boolean) ?? [];

  return {
    id: task.id,
    title: task.title,
    slug,
    description: task.description ?? undefined,
    priority: task.priority ?? 'medium',
    dueState: (task as typeof task & { dueState?: string }).dueState ?? undefined,
    assigneeUserId: task.assignedTo ?? undefined,
    subtaskCount,
    assignees: task.assignedTo
      ? [
          {
            name: resolveUserLabel(task.assignedTo),
            avatar: resolveUserAvatar(task.assignedTo),
          },
        ]
      : [],
    dueDate: task.dueDate
      ? formatDate(task.dueDate, { day: 'numeric', month: 'short', year: 'numeric' })
      : undefined,
    comments: 0,
    attachments: 0,
    tags,
    status: task.statusId,
  };
}

function buildColumns(
  statuses: StatusTaskResponse[],
  tasks: TaskResponse[],
  resolveUserLabel: (userId: string) => string,
  resolveUserAvatar: (userId: string) => string | undefined,
  taskTagsByTaskId?: Map<string, string[]>,
): ProjectColumn[] {
  const ordered = [...statuses].sort((a, b) => a.orderIndex - b.orderIndex);
  const statusNameById = new Map(ordered.map((s) => [s.id, s.name]));

  const subtaskCountByParentId = new Map<string, number>();
  for (const task of tasks) {
    const parentId = normalizeParentTaskId(task.parentTaskId);
    if (!parentId) continue;
    subtaskCountByParentId.set(parentId, (subtaskCountByParentId.get(parentId) ?? 0) + 1);
  }

  const topLevel = tasks.filter((t) => !normalizeParentTaskId(t.parentTaskId));
  const tasksByStatus = new Map<string, ProjectTask[]>();
  for (const task of topLevel) {
    const list = tasksByStatus.get(task.statusId) ?? [];
    list.push(
      mapTaskToUiTask(
        task,
        resolveUserLabel,
        resolveUserAvatar,
        subtaskCountByParentId.get(task.id) ?? 0,
        taskTagsByTaskId?.get(task.id),
      ),
    );
    tasksByStatus.set(task.statusId, list);
  }

  const base = ordered.map((s, i) => ({
    id: s.id,
    title: s.name,
    color: STATUS_COLORS[i % STATUS_COLORS.length],
    tasks: tasksByStatus.get(s.id) ?? [],
  }));

  const missing = [...tasksByStatus.keys()]
    .filter((id) => !statusNameById.has(id))
    .map((id, i) => ({
      id,
      title: topLevel.find((t) => t.statusId === id)?.status ?? `Status ${i + 1}`,
      color: STATUS_COLORS[(base.length + i) % STATUS_COLORS.length],
      tasks: tasksByStatus.get(id) ?? [],
    }));

  return [...base, ...missing];
}

function filterColumns(
  columns: ProjectColumn[],
  assignees: string[],
  tags: string[],
  statuses: string[],
  priorities: string[],
  search: string,
): ProjectColumn[] {
  const assigneeSet = new Set(assignees);
  const statusSet = new Set(statuses);
  const prioritySet = new Set(priorities.map((v) => v.toLowerCase()));
  const includeNoTag = tags.includes(TAG_FILTER_NO_TAG);
  const tagSet = new Set(
    tags.filter((v) => v !== TAG_FILTER_NO_TAG).map((v) => v.toLowerCase()),
  );
  const searchLower = search.toLowerCase().trim();

  return columns.map((col) => ({
    ...col,
    tasks: col.tasks.filter((task) => {
      if (searchLower && !task.title.toLowerCase().includes(searchLower)) return false;
      if (assigneeSet.size > 0) {
        const isUnassigned = !task.assigneeUserId;
        const match =
          (isUnassigned && assigneeSet.has(ASSIGNEE_FILTER_UNASSIGNED)) ||
          (!isUnassigned && assigneeSet.has(task.assigneeUserId!));
        if (!match) return false;
      }
      if (tags.length > 0) {
        const taskTags = task.tags.map((t) => t.toLowerCase());
        if (!includeNoTag || taskTags.length > 0) {
          if (taskTags.length === 0 && !includeNoTag) return false;
          if (taskTags.length > 0 && !taskTags.some((t) => tagSet.has(t))) return false;
        }
      }
      if (statusSet.size > 0 && !statusSet.has(task.status)) return false;
      if (
        prioritySet.size > 0 &&
        !prioritySet.has((task.priority ?? 'medium').toLowerCase())
      )
        return false;
      return true;
    }),
  }));
}

// ─── URL param helpers ────────────────────────────────────────────────────────

function parseCSV(val: string | null): string[] {
  if (!val) return [];
  return val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  projectSlug: string;
}

export function ProjectBoardPage({ projectSlug }: Props) {
  const headerT = useTranslations('project.detailHeader');
  const tabsT = useTranslations('project.tabs');
  const priorityT = useTranslations('project.dashboard.priority');
  const boardPageT = useTranslations('project.boardPage');
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceContext = useServiceContext();
  const taskListPagination = usePagination({ initialPage: 1, initialLimit: 10 });

  // ─── URL param state ───────────────────────────────────────────────────
  const viewMode = (searchParams.get('view') as 'board' | 'list') || 'board';
  const searchQuery = searchParams.get('q') ?? '';
  const selectedAssigneeFilters = parseCSV(searchParams.get('assignees'));
  const selectedTagFilters = parseCSV(searchParams.get('tags'));
  const selectedStatusFilters = parseCSV(searchParams.get('statuses'));
  const selectedPriorityFilters = parseCSV(searchParams.get('priorities'));

  function setParam(key: string, values: string[]) {
    const current = new URLSearchParams(searchParams.toString());
    if (values.length === 0) {
      current.delete(key);
    } else {
      current.set(key, values.join(','));
    }
    router.replace(`?${current.toString()}`, { scroll: false });
  }

  function setSearch(value: string) {
    const current = new URLSearchParams(searchParams.toString());
    if (value) {
      current.set('q', value);
    } else {
      current.delete('q');
    }
    router.replace(`?${current.toString()}`, { scroll: false });
  }

  function setViewMode(mode: 'board' | 'list') {
    const current = new URLSearchParams(searchParams.toString());
    current.set('view', mode);
    router.replace(`?${current.toString()}`, { scroll: false });
  }

  function toggleParam(key: string, current: string[], value: string) {
    setParam(
      key,
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    );
  }

  // ─── Queries ───────────────────────────────────────────────────────────
  const projectQuery = useProjectById(projectSlug);
  const projectId = projectQuery.data?.id ?? '';
  const statusesQuery = useProjectStatuses(projectId);
  const tasksQuery = useProjectTasks(projectId);
  const paginatedTaskListQuery = useProjectTasks(projectId, {
    page: taskListPagination.page,
    limit: taskListPagination.limit,
  });
  const membersQuery = useProjectMembers(projectId);
  const memberProgressQuery = useProjectTaskMemberProgress(projectId);
  const rolesQuery = useProjectRoles(projectId);
  void memberProgressQuery;
  void rolesQuery;

  // ─── Mutations ─────────────────────────────────────────────────────────
  const createTaskMutation = useCreateProjectTask();
  const updateTaskMutation = useUpdateProjectTask();
  const deleteTaskMutation = useDeleteProjectTask();
  const duplicateTaskMutation = useDuplicateProjectTask();
  const addTaskTagMutation = useAddProjectTaskTag();
  const createStatusMutation = useCreateProjectStatus();
  const updateStatusMutation = useUpdateProjectStatus();
  const deleteStatusMutation = useDeleteProjectStatus();
  const updateTaskStatusMutation = useUpdateProjectTaskStatus();

  // ─── Permissions ───────────────────────────────────────────────────────
  const canCreateTask = useCan(PERMISSIONS.PROJECTS_TASKS_CREATE);
  const canUpdateTask = useCan(PERMISSIONS.PROJECTS_TASKS_UPDATE);
  const canDeleteTask = useCan(PERMISSIONS.PROJECTS_TASKS_DELETE);
  const canCreateStatus = useCan(PERMISSIONS.PROJECTS_STATUSES_CREATE);
  const isTaskStatusUpdating = updateTaskStatusMutation.isPending;
  const isMutatingStatus =
    updateStatusMutation.isPending ||
    deleteStatusMutation.isPending ||
    createStatusMutation.isPending;

  // ─── Task detail dialog ────────────────────────────────────────────────
  const [isTaskDetailOpen, setTaskDetailOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // ─── Drag state ────────────────────────────────────────────────────────
  const [draggedTask, setDraggedTask] = useState<{
    task: ProjectTask;
    sourceColumnId: string;
  } | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);

  // ─── Derived data ──────────────────────────────────────────────────────
  const topLevelTasks = useMemo(
    () => (tasksQuery.data ?? []).filter((t) => !normalizeParentTaskId(t.parentTaskId)),
    [tasksQuery.data],
  );

  const taskTagQueries = useQueries({
    queries: topLevelTasks.map((task) => ({
      queryKey: projectKeys.taskTags(serviceContext.tenantId, projectId, task.id),
      queryFn: () => new ProjectsService(serviceContext).listTaskTags(projectId, task.id),
      staleTime: 60_000,
      enabled: Boolean(projectId) && Boolean(task.id),
    })),
  });

  const taskTagsByTaskId = useMemo(() => {
    const map = new Map<string, string[]>();
    topLevelTasks.forEach((task, index) => {
      const tags = taskTagQueries[index]?.data ?? [];
      map.set(
        task.id,
        tags.map((t) => t.name),
      );
    });
    return map;
  }, [topLevelTasks, taskTagQueries]);

  const userDisplayNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of membersQuery.data ?? []) {
      const m = member as ProjectMemberResponse & Record<string, unknown>;
      const user = (m.user ?? {}) as Record<string, unknown>;
      const firstName = (user.firstName ?? m.firstName ?? '') as string;
      const lastName = (user.lastName ?? m.lastName ?? '') as string;
      const name = [firstName, lastName].filter(Boolean).join(' ').trim();
      const email = (user.email ?? m.email ?? '') as string;
      if (member.userId) map.set(member.userId, name || email || member.userId);
    }
    return map;
  }, [membersQuery.data]);

  const resolveUserLabel = useCallback(
    (userId: string): string => userDisplayNameById.get(userId) ?? 'Unknown',
    [userDisplayNameById],
  );
  const userAvatarById = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of membersQuery.data ?? []) {
      const candidate = member as ProjectMemberResponse &
        Record<string, unknown> & {
          avatar?: string | null;
          avatarUrl?: string | null;
          user?: Record<string, unknown>;
        };
      const directAvatar =
        typeof candidate.avatarUrl === 'string' && candidate.avatarUrl.trim().length > 0
          ? candidate.avatarUrl.trim()
          : typeof candidate.avatar === 'string' && candidate.avatar.trim().length > 0
            ? candidate.avatar.trim()
            : undefined;
      const nestedAvatar =
        typeof candidate.user?.avatarUrl === 'string' &&
        candidate.user.avatarUrl.trim().length > 0
          ? candidate.user.avatarUrl.trim()
          : typeof candidate.user?.avatar === 'string' &&
              candidate.user.avatar.trim().length > 0
            ? candidate.user.avatar.trim()
            : undefined;
      const avatarUrl = directAvatar ?? nestedAvatar;
      if (member.userId && avatarUrl) {
        map.set(member.userId, avatarUrl);
      }
    }
    return map;
  }, [membersQuery.data]);
  const resolveUserAvatar = useCallback(
    (userId: string): string | undefined => userAvatarById.get(userId),
    [userAvatarById],
  );

  const allColumns = useMemo(
    () =>
      buildColumns(
        statusesQuery.data ?? [],
        tasksQuery.data ?? [],
        resolveUserLabel,
        resolveUserAvatar,
        taskTagsByTaskId,
      ),
    [
      resolveUserAvatar,
      resolveUserLabel,
      statusesQuery.data,
      tasksQuery.data,
      taskTagsByTaskId,
    ],
  );

  const filteredColumns = useMemo(
    () =>
      filterColumns(
        allColumns,
        selectedAssigneeFilters,
        selectedTagFilters,
        selectedStatusFilters,
        selectedPriorityFilters,
        searchQuery,
      ),
    [
      allColumns,
      selectedAssigneeFilters,
      selectedTagFilters,
      selectedStatusFilters,
      selectedPriorityFilters,
      searchQuery,
    ],
  );

  const paginatedListTasks = useMemo((): ProjectListTask[] => {
    const statusCols = [...(statusesQuery.data ?? [])]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((s, i) => ({
        id: s.id,
        title: s.name,
        color: STATUS_COLORS[i % STATUS_COLORS.length],
        tasks: [] as ProjectTask[],
      }));
    const statusById = new Map(statusCols.map((c) => [c.id, c]));
    return (paginatedTaskListQuery.data ?? [])
      .filter((t) => !normalizeParentTaskId(t.parentTaskId))
      .map((t) => {
        const col = statusById.get(t.statusId);
        return {
          ...mapTaskToUiTask(
            t,
            resolveUserLabel,
            resolveUserAvatar,
            0,
            taskTagsByTaskId.get(t.id),
          ),
          columnId: t.statusId,
          columnTitle: col?.title ?? 'Unknown',
        };
      });
  }, [
    paginatedTaskListQuery.data,
    resolveUserAvatar,
    resolveUserLabel,
    statusesQuery.data,
    taskTagsByTaskId,
  ]);

  const listViewStatusColumns = useMemo(
    () =>
      [...(statusesQuery.data ?? [])]
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((s, i) => ({
          id: s.id,
          title: s.name,
          color: STATUS_COLORS[i % STATUS_COLORS.length],
          tasks: [] as ProjectTask[],
        })),
    [statusesQuery.data],
  );

  const memberOptions = useMemo(
    () =>
      (membersQuery.data ?? []).map((m) => {
        const label = userDisplayNameById.get(m.userId) ?? m.userId;
        return { userId: m.userId, label, avatarUrl: resolveUserAvatar(m.userId) };
      }),
    [membersQuery.data, resolveUserAvatar, userDisplayNameById],
  );

  const assigneeFilterOptions: ProjectHeaderTaskFilterOption[] = useMemo(
    () => [
      { value: ASSIGNEE_FILTER_UNASSIGNED, label: 'Unassigned' },
      ...memberOptions.map((m) => ({
        value: m.userId,
        label: m.label,
        avatarUrl: m.avatarUrl,
      })),
    ],
    [memberOptions],
  );

  const tagFilterOptions: ProjectHeaderTaskFilterOption[] = useMemo(() => {
    const allTags = new Set<string>();
    for (const tags of taskTagsByTaskId.values()) {
      for (const tag of tags) if (tag) allTags.add(tag);
    }
    return [
      { value: TAG_FILTER_NO_TAG, label: 'No Tag' },
      ...[...allTags].map((t) => ({ value: t, label: t })),
    ];
  }, [taskTagsByTaskId]);

  const statusFilterOptions: ProjectHeaderTaskFilterOption[] = useMemo(
    () =>
      (statusesQuery.data ?? [])
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((s) => ({ value: s.id, label: s.name })),
    [statusesQuery.data],
  );
  const priorityFilterOptions: ProjectHeaderTaskFilterOption[] = useMemo(
    () =>
      PRIORITY_FILTER_VALUES.map((value) => ({
        value,
        label: priorityT(value),
      })),
    [priorityT],
  );

  const {
    isFilterOpen,
    activeFilterGroup,
    filterSearch,
    selectedCount,
    activeGroupConfig,
    activeSelected,
    filteredOptions,
    filterGroups,
    setFilterSearch,
    handleToggleOption,
    handleClearActiveGroup,
    handleFilterOpenChange,
    handleSelectFilterGroup,
  } = useProjectDetailHeaderFilters({
    assigneeFilterOptions,
    tagFilterOptions,
    statusFilterOptions,
    priorityFilterOptions,
    selectedAssigneeFilters,
    selectedTagFilters,
    selectedStatusFilters,
    selectedPriorityFilters,
    onToggleAssigneeFilter: (v) => toggleParam('assignees', selectedAssigneeFilters, v),
    onToggleTagFilter: (v) => toggleParam('tags', selectedTagFilters, v),
    onToggleStatusFilter: (v) => toggleParam('statuses', selectedStatusFilters, v),
    onTogglePriorityFilter: (v) => toggleParam('priorities', selectedPriorityFilters, v),
    onClearAssigneeFilters: () => setParam('assignees', []),
    onClearTagFilters: () => setParam('tags', []),
    onClearStatusFilters: () => setParam('statuses', []),
    onClearPriorityFilters: () => setParam('priorities', []),
  });

  // ─── Handlers ──────────────────────────────────────────────────────────
  const changeTaskStatus = async (taskId: string, statusId: string): Promise<boolean> => {
    if (!projectId) return false;
    setMovingTaskId(taskId);

    try {
      const result = await updateTaskStatusMutation.mutateAsync({
        projectId,
        taskId,
        body: { statusId },
      });
      if (!result.ok) {
        toast.danger(result.error.message || boardPageT('toasts.updateTaskStatusFailed'));
        return false;
      }
      return true;
    } finally {
      setMovingTaskId((current) => (current === taskId ? null : current));
    }
  };

  const handleCreateTask = async (input: {
    statusId: string;
    title: string;
    dueDate?: string;
    assignedTo?: string | null;
  }): Promise<boolean> => {
    if (!projectId || !input.title.trim()) return false;
    const result = await createTaskMutation.mutateAsync({
      projectId,
      body: {
        title: input.title.trim(),
        statusId: input.statusId,
        dueDate: input.dueDate,
        assignedTo: input.assignedTo ?? null,
      },
    });
    if (!result.ok) {
      toast.danger(result.error.message || 'Failed to create task.');
      return false;
    }

    if (!input.assignedTo && result.data.assignedTo) {
      const unassignResult = await updateTaskMutation.mutateAsync({
        projectId,
        taskId: result.data.id,
        body: { assignedTo: null },
      });
      if (!unassignResult.ok) {
        toast.warning(
          unassignResult.error.message ||
            boardPageT('toasts.taskCreatedButUnassignFailed'),
        );
      }
    }

    return true;
  };

  const handleAssignTask = async (
    taskId: string,
    assigneeId?: string | null,
  ): Promise<boolean> => {
    if (!projectId) return false;
    const result = await updateTaskMutation.mutateAsync({
      projectId,
      taskId,
      body: { assignedTo: assigneeId ?? null },
    });
    if (!result.ok) {
      toast.danger(result.error.message || 'Failed to assign task.');
      return false;
    }
    return true;
  };

  const handleRenameTask = async (taskId: string, title: string): Promise<boolean> => {
    if (!projectId || !title.trim()) return false;
    const result = await updateTaskMutation.mutateAsync({
      projectId,
      taskId,
      body: { title: title.trim() },
    });
    if (!result.ok) {
      toast.danger(result.error.message || 'Failed to rename task.');
      return false;
    }
    return true;
  };

  const handleDeleteTask = async (taskId: string): Promise<boolean> => {
    if (!projectId) return false;
    const result = await deleteTaskMutation.mutateAsync({ projectId, taskId });
    if (!result.ok) {
      toast.danger(result.error.message || 'Failed to delete task.');
      return false;
    }
    return true;
  };

  const handleDuplicateTask = async (taskId: string): Promise<boolean> => {
    if (!projectId) return false;
    const result = await duplicateTaskMutation.mutateAsync({
      projectId,
      taskId,
      body: {},
    });
    if (!result.ok) {
      toast.danger(result.error.message || 'Failed to duplicate task.');
      return false;
    }

    if (result.data.assignedTo) {
      const unassignResult = await updateTaskMutation.mutateAsync({
        projectId,
        taskId: result.data.id,
        body: { assignedTo: null },
      });
      if (!unassignResult.ok) {
        toast.warning(
          unassignResult.error.message ||
            boardPageT('toasts.taskDuplicatedButClearAssigneeFailed'),
        );
      }
    }

    return true;
  };

  const handleAddTaskTag = async (taskId: string, tagName: string): Promise<boolean> => {
    if (!projectId || !tagName.trim()) return false;
    const result = await addTaskTagMutation.mutateAsync({
      projectId,
      taskId,
      body: { name: tagName.trim() },
    });
    if (!result.ok) {
      toast.danger(result.error.message || 'Failed to add tag.');
      return false;
    }
    return true;
  };

  const handleChangeTaskStatusFromMenu = async (
    taskId: string,
    statusId: string,
  ): Promise<boolean> => {
    return changeTaskStatus(taskId, statusId);
  };

  const handleCreateStatus = async (name: string): Promise<boolean> => {
    if (!projectId || !name.trim()) return false;
    const result = await createStatusMutation.mutateAsync({
      projectId,
      body: { name: name.trim() },
    });
    if (!result.ok) {
      toast.danger(result.error.message || 'Failed to create status.');
      return false;
    }
    return true;
  };

  const handleRenameStatus = async (statusId: string, name: string): Promise<boolean> => {
    if (!projectId || !name.trim()) return false;
    const result = await updateStatusMutation.mutateAsync({
      projectId,
      statusId,
      body: { name: name.trim() },
    });
    if (!result.ok) {
      toast.danger(result.error.message || 'Failed to rename status.');
      return false;
    }
    return true;
  };

  const handleDeleteStatus = async (statusId: string): Promise<boolean> => {
    if (!projectId) return false;
    const result = await deleteStatusMutation.mutateAsync({ projectId, statusId });
    if (!result.ok) {
      toast.danger(result.error.message || 'Failed to delete status.');
      return false;
    }
    return true;
  };

  const handleReorderStatus = async (
    statusId: string,
    targetIndex: number,
  ): Promise<boolean> => {
    void statusId;
    void targetIndex;
    // TODO: implement reorder if API supports it
    return false;
  };

  // ─── Drag handlers ─────────────────────────────────────────────────────
  const handleDragStart = (
    event: DragEvent<HTMLDivElement>,
    task: ProjectTask,
    columnId: string,
  ) => {
    if (isTaskStatusUpdating) return;
    event.dataTransfer.effectAllowed = 'move';
    setDraggedTask({ task, sourceColumnId: columnId });
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumnId(null);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>, columnId: string) => {
    if (isTaskStatusUpdating) return;
    event.preventDefault();
    setDragOverColumnId(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumnId(null);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>, targetColumnId: string) => {
    event.preventDefault();
    const currentDraggedTask = draggedTask;
    setDraggedTask(null);
    setDragOverColumnId(null);

    if (
      isTaskStatusUpdating ||
      !currentDraggedTask ||
      currentDraggedTask.sourceColumnId === targetColumnId
    ) {
      return;
    }
    await changeTaskStatus(currentDraggedTask.task.id, targetColumnId);
  };

  const handleOpenTaskDetail = (taskId: string) => {
    setSelectedTaskId(taskId);
    setTaskDetailOpen(true);
  };

  const canGoPreviousTaskListPage = taskListPagination.page > 1;
  const canGoNextTaskListPage =
    (paginatedTaskListQuery.data?.filter((t) => !normalizeParentTaskId(t.parentTaskId))
      .length ?? 0) >= taskListPagination.limit;

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Filter toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border p-1">
            <Button
              variant={viewMode === 'board' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('board')}
            >
              <LayoutGrid className="mr-1 h-4 w-4" />
              {tabsT('board')}
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('list')}
            >
              <List className="mr-1 h-4 w-4" />
              {headerT('viewMode.list')}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder={headerT('filters.searchTasks')}
              value={searchQuery}
              onChange={(e) => setSearch(e.target.value)}
              className="w-52 pl-9"
            />
          </div>

          {/* Filter popover */}
          <Popover open={isFilterOpen} onOpenChange={handleFilterOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 gap-2 px-3">
                <Filter className="h-4 w-4" />
                {headerT('filters.button')}
                {selectedCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                    {selectedCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[480px] p-0">
              <div className="grid grid-cols-[220px_1fr]">
                <div className="border-r p-3">
                  <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
                    Filters
                  </p>
                  <div className="space-y-1">
                    {filterGroups.map((group) => (
                      <button
                        key={group.key}
                        type="button"
                        className={cn(
                          'hover:bg-muted flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm',
                          activeFilterGroup === group.key && 'bg-muted',
                        )}
                        onClick={() => handleSelectFilterGroup(group.key)}
                      >
                        {group.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 border-t pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full justify-start px-2"
                      onClick={handleClearActiveGroup}
                    >
                      Clear {activeGroupConfig.label}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 p-3">
                  <div className="relative">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                      placeholder={activeGroupConfig.searchPlaceholder}
                      className="pl-9"
                    />
                  </div>
                  <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
                    {filteredOptions.length > 0 ? (
                      filteredOptions.map((option) => {
                        const isChecked = activeSelected.has(option.value);
                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={cn(
                              'hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left',
                              isChecked && 'bg-muted',
                            )}
                            onClick={() => handleToggleOption(option.value)}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handleToggleOption(option.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-sm">{option.label}</span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground p-2 text-sm">
                        No options found.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Board / List content */}
      {viewMode === 'board' ? (
        <ProjectKanbanBoard
          columns={filteredColumns}
          draggedTaskId={draggedTask?.task.id}
          movingTaskId={movingTaskId}
          dragOverColumnId={dragOverColumnId}
          searchQuery={searchQuery}
          memberOptions={memberOptions}
          canCreateTask={canCreateTask}
          canCreateStatus={canCreateStatus}
          onTaskClick={handleOpenTaskDetail}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onCreateTask={handleCreateTask}
          onAssignTask={handleAssignTask}
          onRenameTask={handleRenameTask}
          onDeleteTask={handleDeleteTask}
          onDuplicateTask={handleDuplicateTask}
          onAddTaskTag={handleAddTaskTag}
          onChangeTaskStatus={handleChangeTaskStatusFromMenu}
          onCreateStatus={handleCreateStatus}
          onRenameStatus={handleRenameStatus}
          onDeleteStatus={handleDeleteStatus}
          onReorderStatus={handleReorderStatus}
          isCreatingTask={createTaskMutation.isPending}
          isUpdatingTask={
            updateTaskMutation.isPending ||
            deleteTaskMutation.isPending ||
            duplicateTaskMutation.isPending ||
            addTaskTagMutation.isPending ||
            isTaskStatusUpdating
          }
          isCreatingStatus={createStatusMutation.isPending}
          isMutatingStatus={isMutatingStatus}
        />
      ) : (
        <ProjectTaskListTable
          tasks={paginatedListTasks}
          columns={listViewStatusColumns}
          searchQuery={searchQuery}
          page={taskListPagination.page}
          limit={taskListPagination.limit}
          pageItemCount={paginatedListTasks.length}
          canGoPrevious={canGoPreviousTaskListPage}
          canGoNext={canGoNextTaskListPage}
          canUpdateTask={canUpdateTask}
          canDeleteTask={canDeleteTask}
          isPending={paginatedTaskListQuery.isPending}
          onPageChange={taskListPagination.setPage}
          onLimitChange={(l) => {
            taskListPagination.setLimit(l);
            taskListPagination.setPage(1);
          }}
          onChangeTaskStatus={changeTaskStatus}
          onTaskClick={handleOpenTaskDetail}
          onDeleteTask={handleDeleteTask}
          isUpdatingTask={updateTaskMutation.isPending || deleteTaskMutation.isPending}
        />
      )}

      {/* Task detail dialog */}
      {isTaskDetailOpen &&
        selectedTaskId &&
        projectId &&
        (() => {
          const selectedTask =
            (tasksQuery.data ?? []).find((t) => t.id === selectedTaskId) ?? null;
          const statusOptions = (statusesQuery.data ?? []).map((s) => ({
            id: s.id,
            name: s.name,
          }));
          return (
            <ProjectTaskDetailDialog
              open={isTaskDetailOpen}
              projectId={projectId}
              task={selectedTask}
              projectTasks={tasksQuery.data ?? []}
              statuses={statusOptions}
              members={memberOptions}
              userDisplayNameById={userDisplayNameById}
              onOpenChange={(open) => {
                setTaskDetailOpen(open);
                if (!open) setSelectedTaskId(null);
              }}
              onOpenTask={(taskId) => {
                setSelectedTaskId(taskId);
              }}
              onSubmit={async (input) => {
                if (!projectId) return false;
                const result = await updateTaskMutation.mutateAsync({
                  projectId,
                  taskId: input.taskId,
                  body: {
                    title: input.title || undefined,
                    description: input.description || undefined,
                    statusId: input.statusId || undefined,
                    priority:
                      (input.priority as import('../services/projects.service').TaskPriority) ||
                      undefined,
                    assignedTo: input.assignedTo ?? null,
                    startedAt: input.startedAt || undefined,
                    dueDate: input.dueDate || undefined,
                    actualStart: input.actualStart || undefined,
                    actualEnd: input.actualEnd || undefined,
                    estimatedPoint: input.estimatedPoint
                      ? Number(input.estimatedPoint)
                      : undefined,
                    estimatedHours: input.estimatedHours
                      ? Number(input.estimatedHours)
                      : undefined,
                  },
                });
                if (!result.ok) {
                  toast.danger(result.error.message || 'Failed to update task.');
                  return false;
                }
                return true;
              }}
            />
          );
        })()}
    </div>
  );
}
