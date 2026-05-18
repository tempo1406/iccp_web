'use client';

import { useQueries } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronsUpDown, Loader2 } from 'lucide-react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/common/constant/routes';
import { formatDate } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useServiceContext } from '@/lib/use-service-context';
import { usePagination } from '@/hooks/use-pagination';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import {
  useAddProjectTaskTag,
  useCreateProjectTask,
  useCreateProjectStatus,
  useDeleteProjectTask,
  useDeleteProjectStatus,
  useDeleteProject,
  useDuplicateProjectTask,
  useProjectById,
  useProjectMembers,
  useProjectRoles,
  useProjectStatuses,
  useProjectTaskMemberProgress,
  useProjectTasks,
  useUpdateProject,
  useUpdateProjectTask,
  useUpdateProjectStatus,
  useUpdateProjectTaskStatus,
} from '@/features/tenant/projects';
import { projectKeys } from '@/features/tenant/projects/query/project-keys';
import { ProjectsService } from '@/features/tenant/projects/services/projects.service';
import type {
  MemberTaskProgressResponse,
  ProjectMemberResponse,
  ProjectMemberRoleResponse,
  ProjectPriority,
  ProjectResponse,
  ProjectStatus,
  StatusTaskResponse,
  TaskPriority,
  TaskResponse,
  TaskTagResponse,
  UpdateProjectRequest,
} from '@/features/tenant/projects/services/projects.service';
import { InviteProjectMemberDialog } from '@/features/tenant/projects/components/invite-project-member-dialog';
import { ProjectDetailHeaderControls } from '@/features/tenant/projects/components/project-detail-header-controls';
import { ProjectKanbanBoard } from '@/features/tenant/projects/components/project-kanban-board';
import { ProjectMembersManagementView } from '@/features/tenant/projects/components/project-members-management-view';
import { ProjectReportViewPage } from '@/features/tenant/projects/components/project-report-view-page';
import { ProjectRolesManagementView } from '@/features/tenant/projects/components/project-roles-management-view';
import { ProjectTaskDetailDialog } from '@/features/tenant/projects/components/project-task-detail-dialog';
import { ProjectRealtimeBridge } from '@/features/tenant/projects/realtime/project-realtime-bridge';
import type {
  ProjectColumn,
  ProjectTask,
  ProjectTeamProgressMember,
  ProjectTeamProgressTask,
} from '@/features/tenant/projects/components/project-detail-data';
import {
  type ProjectListTask,
  ProjectTaskListTable,
} from '@/features/tenant/projects/components/project-task-list-table';
import { ProjectTeamProgressView } from '@/features/tenant/projects/components/project-team-progress-view';
import { useConfirmAlertDialog } from '@/features/tenant/projects/hooks/use-confirm-alert-dialog';
import { ProjectKpiWorkspace } from '@/features/tenant/analytics/components/project-kpi/project-kpi-workspace';

const STATUS_COLORS = [
  'bg-gray-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-cyan-500',
];

interface TaskFilterOption {
  value: string;
  label: string;
}

const ASSIGNEE_FILTER_UNASSIGNED = '__filter_unassigned__';
const TAG_FILTER_NO_TAG = '__filter_no_tag__';
const PRIORITY_FILTER_OPTIONS: TaskFilterOption[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

type ProjectBudgetCurrency = 'USD' | 'VND';

interface ProjectSettingsFormState {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  endDate: string;
  managerId: string[];
  estimatedBudget: string;
  actualBudget: string;
  budgetCurrency: ProjectBudgetCurrency;
}

type ProjectSettingsErrors = Partial<
  Record<
    'name' | 'endDate' | 'estimatedBudget' | 'actualBudget' | 'budgetCurrency',
    string
  >
>;

const PROJECT_STATUS_OPTIONS: Array<{ value: ProjectStatus; label: string }> = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PROJECT_PRIORITY_OPTIONS: Array<{ value: ProjectPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

function formatDateOrFallback(value?: string | null): string {
  if (!value) return 'Not available';
  return formatDate(value);
}

function toDateInputValue(value?: string | null): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
}

function normalizeManagerIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [
      ...new Set(
        value
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ];
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  return [];
}
function mapProjectToSettingsForm(
  project: ProjectResponse | undefined,
): ProjectSettingsFormState {
  const budgetCurrency = project?.budgetCurrency;
  const normalizedBudgetCurrency: ProjectBudgetCurrency =
    budgetCurrency === 'USD' || budgetCurrency === 'VND' ? budgetCurrency : 'VND';

  return {
    name: project?.name ?? '',
    description: project?.description ?? '',
    status: project?.status ?? 'planning',
    priority: project?.priority ?? 'medium',
    startDate: toDateInputValue(project?.startDate),
    endDate: toDateInputValue(project?.endDate),
    managerId: normalizeManagerIds(project?.managerId),
    estimatedBudget:
      project?.estimatedBudget != null ? String(project.estimatedBudget) : '',
    actualBudget: project?.actualBudget != null ? String(project.actualBudget) : '',
    budgetCurrency: normalizedBudgetCurrency,
  };
}

function validateProjectSettingsForm(
  state: ProjectSettingsFormState,
  messages: {
    nameRequired: string;
    endDateAfterStart: string;
    estimatedBudgetPositive: string;
    actualBudgetPositive: string;
    budgetCurrencyInvalid: string;
  },
): ProjectSettingsErrors {
  const errors: ProjectSettingsErrors = {};

  if (!state.name.trim()) {
    errors.name = messages.nameRequired;
  }

  if (state.endDate && state.startDate && state.endDate < state.startDate) {
    errors.endDate = messages.endDateAfterStart;
  }

  if (state.estimatedBudget.trim()) {
    const estimatedBudget = Number(state.estimatedBudget);
    if (Number.isNaN(estimatedBudget) || estimatedBudget < 0) {
      errors.estimatedBudget = messages.estimatedBudgetPositive;
    }
  }

  if (state.actualBudget.trim()) {
    const actualBudget = Number(state.actualBudget);
    if (Number.isNaN(actualBudget) || actualBudget < 0) {
      errors.actualBudget = messages.actualBudgetPositive;
    }
  }

  if (state.budgetCurrency !== 'USD' && state.budgetCurrency !== 'VND') {
    errors.budgetCurrency = messages.budgetCurrencyInvalid;
  }

  return errors;
}

function toUpdateProjectPayload(state: ProjectSettingsFormState): UpdateProjectRequest {
  const managerIds = [...new Set(state.managerId.map((id) => id.trim()).filter(Boolean))];

  return {
    name: state.name.trim(),
    description: state.description.trim() || undefined,
    status: state.status,
    priority: state.priority,
    startDate: state.startDate || undefined,
    endDate: state.endDate || undefined,
    managerId: managerIds.length > 0 ? managerIds : undefined,
    estimatedBudget: toOptionalNumber(state.estimatedBudget),
    actualBudget: toOptionalNumber(state.actualBudget),
    budgetCurrency: state.budgetCurrency,
  };
}

function toDisplayName(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

function toTrimmedString(value?: string | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickString(
  records: Array<Record<string, unknown>>,
  keys: string[],
): string | undefined {
  for (const record of records) {
    for (const key of keys) {
      const value = record[key];
      if (typeof value !== 'string') continue;
      const trimmed = value.trim();
      if (trimmed.length > 0) return trimmed;
    }
  }
  return undefined;
}

function resolveProjectSlug(
  project: ProjectResponse | undefined,
  fallbackSlug: string,
): string {
  const slugValue = (project as (ProjectResponse & { slug?: string | null }) | undefined)
    ?.slug;
  if (typeof slugValue === 'string' && slugValue.trim().length > 0) {
    return slugValue.trim();
  }
  return fallbackSlug;
}

function buildUserLabel(input: {
  displayName?: string | null;
  email?: string | null;
  userId?: string | null;
}): string {
  const normalizedDisplayName = toTrimmedString(input.displayName);
  if (normalizedDisplayName) return normalizedDisplayName;

  const normalizedEmail = toTrimmedString(input.email);
  if (normalizedEmail) return normalizedEmail;

  return 'Unknown user';
}

function isEmailLike(value?: string | null): boolean {
  return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()));
}

function getUserLabelScore(label: string, userId?: string | null): number {
  const normalizedLabel = toTrimmedString(label);
  if (!normalizedLabel) return 0;
  const normalizedUserId = toTrimmedString(userId);
  if (
    normalizedLabel === 'Unknown user' ||
    (normalizedUserId.length > 0 && normalizedLabel === normalizedUserId)
  ) {
    return 1;
  }
  if (normalizedLabel.includes('@')) return 2;
  return 3;
}

function upsertUserLabel(map: Map<string, string>, userId: string, candidate: string) {
  const normalizedUserId = toTrimmedString(userId);
  const normalizedCandidate = toTrimmedString(candidate);
  if (!normalizedUserId || !normalizedCandidate) return;

  const current = map.get(normalizedUserId);
  if (!current) {
    map.set(normalizedUserId, normalizedCandidate);
    return;
  }

  if (
    getUserLabelScore(normalizedCandidate, normalizedUserId) >
    getUserLabelScore(current, normalizedUserId)
  ) {
    map.set(normalizedUserId, normalizedCandidate);
  }
}

function resolveProjectMemberIdentity(member: ProjectMemberResponse): {
  displayName?: string;
  email?: string;
} {
  const source = member as ProjectMemberResponse & Record<string, unknown>;
  const user = toRecord(source.user);
  const records = [source, user].filter((item): item is Record<string, unknown> =>
    Boolean(item),
  );

  const displayName =
    pickString(records, [
      'fullName',
      'full_name',
      'displayName',
      'display_name',
      'name',
    ]) ??
    toDisplayName(
      pickString(records, ['firstName', 'first_name', 'user_firstName', 'userFirstName']),
      pickString(records, ['lastName', 'last_name', 'user_lastName', 'userLastName']),
    );
  const email = pickString(records, ['email', 'user_email', 'userEmail', 'mail']);

  return {
    displayName: toTrimmedString(displayName) || undefined,
    email: toTrimmedString(email) || undefined,
  };
}

function resolveProjectMemberAvatarUrl(
  member: ProjectMemberResponse,
): string | undefined {
  const source = member as ProjectMemberResponse & Record<string, unknown>;
  const user = toRecord(source.user);
  const records = [source, user].filter((item): item is Record<string, unknown> =>
    Boolean(item),
  );
  const avatarUrl = pickString(records, [
    'avatarUrl',
    'avatar_url',
    'avatar',
    'photoUrl',
    'photo_url',
    'imageUrl',
    'image_url',
  ]);
  return toTrimmedString(avatarUrl) || undefined;
}

function resolveProjectMemberRoleId(member: ProjectMemberResponse): string {
  return typeof member.roleId === 'string' ? member.roleId.trim() : '';
}

function resolveProjectMemberRoleLabel(
  member: ProjectMemberResponse,
  roleNameById?: Map<string, string>,
): string {
  const embeddedRoleName = member.roleNames?.find(
    (name) => toTrimmedString(name).length > 0,
  );
  if (embeddedRoleName) {
    return embeddedRoleName.trim();
  }

  const embeddedRole = member.roles?.find(
    (role) => toTrimmedString(role.roleName).length > 0,
  );
  if (embeddedRole) {
    return embeddedRole.roleName.trim();
  }

  const roleId = resolveProjectMemberRoleId(member);
  if (roleId && roleNameById?.has(roleId)) {
    return roleNameById.get(roleId) ?? 'Not available';
  }

  if (typeof member.roleName === 'string' && member.roleName.trim().length > 0) {
    return member.roleName.trim();
  }

  if (typeof member.role === 'string' && member.role.trim().length > 0) {
    return member.role.trim();
  }

  return 'Not available';
}

function resolveProjectMemberRoleLabels(
  member: ProjectMemberResponse,
  roleNameById?: Map<string, string>,
  memberRolesByUserId?: Map<string, ProjectMemberRoleResponse[]>,
): string[] {
  const assignedRoles = memberRolesByUserId?.has(member.userId)
    ? (memberRolesByUserId.get(member.userId) ?? [])
    : (member.roles ?? []);

  if (assignedRoles.length > 0) {
    const roleNames = [
      ...new Set(
        assignedRoles
          .map(
            (item) =>
              toTrimmedString(item.roleName) || roleNameById?.get(item.roleId) || '',
          )
          .filter((name) => name.length > 0),
      ),
    ];
    if (roleNames.length > 0) return roleNames;
    return [];
  }

  if (member.roleNames?.length) {
    return [
      ...new Set(
        member.roleNames
          .map((name) => toTrimmedString(name))
          .filter((name) => name.length > 0),
      ),
    ];
  }

  const fallback = resolveProjectMemberRoleLabel(member, roleNameById);
  return fallback === 'Not available' ? [] : [fallback];
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function isDoneStatus(name: string): boolean {
  const value = normalize(name);
  return value.includes('done') || value.includes('complete');
}

function isTodoStatus(name: string): boolean {
  const value = normalize(name);
  return value.includes('todo') || value.includes('to do') || value.includes('backlog');
}

function normalizeParentTaskId(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  const lowered = normalized.toLowerCase();
  if (lowered === 'null' || lowered === 'undefined') return null;
  return normalized;
}

function extractTaskTagNames(task: TaskResponse): string[] {
  const source = task as TaskResponse & {
    tags?: unknown;
    taskTags?: unknown;
    labels?: unknown;
  };
  const containers = [source.tags, source.taskTags, source.labels];
  const names: string[] = [];

  for (const container of containers) {
    if (!Array.isArray(container)) continue;
    for (const item of container) {
      if (typeof item === 'string') {
        const value = item.trim();
        if (value) names.push(value);
        continue;
      }

      if (item && typeof item === 'object') {
        const candidate = item as Record<string, unknown>;
        const rawName =
          candidate.name ?? candidate.label ?? candidate.title ?? candidate.tagName;
        if (typeof rawName === 'string' && rawName.trim().length > 0) {
          names.push(rawName.trim());
        }
      }
    }
  }

  return [...new Set(names)];
}

function hasTaskTagMeta(task: TaskResponse, resolvedTagNames: string[]): boolean {
  if (resolvedTagNames.length > 0) return true;
  const source = task as TaskResponse & {
    tagCount?: unknown;
    tagsCount?: unknown;
    totalTags?: unknown;
  };
  const counters = [source.tagCount, source.tagsCount, source.totalTags];
  return counters.some((value) => typeof value === 'number' && value > 0);
}

function mapTaskToUiTask(
  task: TaskResponse,
  resolveUserLabel: (userId: string) => string,
  subtaskCount: number,
  taskTagNames?: string[],
): ProjectTask {
  const taskWithSlug = task as TaskResponse & {
    slug?: string | null;
    code?: string | null;
    taskCode?: string | null;
    taskKey?: string | null;
  };
  const slugSource =
    taskWithSlug.slug ??
    taskWithSlug.code ??
    taskWithSlug.taskCode ??
    taskWithSlug.taskKey;
  const slug =
    typeof slugSource === 'string' && slugSource.trim().length > 0
      ? slugSource.trim().toUpperCase()
      : `TS-${task.id.replace(/-/g, '').slice(0, 4).toUpperCase()}`;
  const resolvedTagNames =
    taskTagNames && taskTagNames.length > 0 ? taskTagNames : extractTaskTagNames(task);
  const normalizedTagNames = [
    ...new Set(resolvedTagNames.map((name) => name.trim()).filter(Boolean)),
  ];
  const tags =
    normalizedTagNames.length > 0
      ? normalizedTagNames
      : hasTaskTagMeta(task, normalizedTagNames)
        ? ['Tagged']
        : [];

  return {
    id: task.id,
    title: task.title,
    slug,
    description: task.description ?? undefined,
    priority: task.priority ?? 'medium',
    dueState: task.dueState ?? undefined,
    assigneeUserId: task.assignedTo ?? undefined,
    subtaskCount,
    assignees: task.assignedTo ? [{ name: resolveUserLabel(task.assignedTo) }] : [],
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
  taskTagsByTaskId?: Map<string, string[]>,
): ProjectColumn[] {
  const orderedStatuses = [...statuses].sort((a, b) => a.orderIndex - b.orderIndex);
  const statusNameById = new Map(
    orderedStatuses.map((status) => [status.id, status.name]),
  );
  const subtaskCountByParentId = new Map<string, number>();
  for (const task of tasks) {
    const parentTaskId = normalizeParentTaskId(task.parentTaskId);
    if (!parentTaskId) continue;
    subtaskCountByParentId.set(
      parentTaskId,
      (subtaskCountByParentId.get(parentTaskId) ?? 0) + 1,
    );
  }
  const topLevelTasks = tasks.filter((task) => !normalizeParentTaskId(task.parentTaskId));

  const tasksByStatus = new Map<string, ProjectTask[]>();
  for (const task of topLevelTasks) {
    const list = tasksByStatus.get(task.statusId) ?? [];
    list.push(
      mapTaskToUiTask(
        task,
        resolveUserLabel,
        subtaskCountByParentId.get(task.id) ?? 0,
        taskTagsByTaskId?.get(task.id),
      ),
    );
    tasksByStatus.set(task.statusId, list);
  }

  const baseColumns = orderedStatuses.map((status, index) => ({
    id: status.id,
    title: status.name,
    color: STATUS_COLORS[index % STATUS_COLORS.length],
    tasks: tasksByStatus.get(status.id) ?? [],
  }));

  const missingStatusIds = [...tasksByStatus.keys()].filter(
    (statusId) => !statusNameById.has(statusId),
  );
  const missingColumns = missingStatusIds.map((statusId, index) => {
    const fallbackStatusName =
      topLevelTasks.find((task) => task.statusId === statusId)?.status ??
      `Status ${index + 1}`;

    return {
      id: statusId,
      title: fallbackStatusName,
      color: STATUS_COLORS[(baseColumns.length + index) % STATUS_COLORS.length],
      tasks: tasksByStatus.get(statusId) ?? [],
    };
  });

  return [...baseColumns, ...missingColumns];
}

function filterProjectColumns(
  columns: ProjectColumn[],
  selectedAssigneeFilters: string[],
  selectedTagFilters: string[],
  selectedStatusFilters: string[],
  selectedPriorityFilters: string[],
): ProjectColumn[] {
  const assigneeSet = new Set(selectedAssigneeFilters);
  const statusSet = new Set(selectedStatusFilters);
  const prioritySet = new Set(
    selectedPriorityFilters.map((value) => value.toLowerCase()),
  );
  const includeNoTag = selectedTagFilters.includes(TAG_FILTER_NO_TAG);
  const selectedTagSet = new Set(
    selectedTagFilters
      .filter((value) => value !== TAG_FILTER_NO_TAG)
      .map((value) => value.toLowerCase()),
  );

  return columns.map((column) => ({
    ...column,
    tasks: column.tasks.filter((task) => {
      if (assigneeSet.size > 0) {
        const assigneeUserId = task.assigneeUserId ?? '';
        const isUnassigned = !assigneeUserId;
        const matchesAssignee =
          (isUnassigned && assigneeSet.has(ASSIGNEE_FILTER_UNASSIGNED)) ||
          (!isUnassigned && assigneeSet.has(assigneeUserId));
        if (!matchesAssignee) return false;
      }

      if (selectedTagFilters.length > 0) {
        const normalizedTaskTags = task.tags
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean);
        const matchesNoTag = includeNoTag && normalizedTaskTags.length === 0;
        const matchesTag = normalizedTaskTags.some((tag) => selectedTagSet.has(tag));
        if (!matchesNoTag && !matchesTag) return false;
      }

      if (statusSet.size > 0 && !statusSet.has(task.status)) {
        return false;
      }

      const normalizedPriority = (task.priority ?? 'medium').toLowerCase();
      if (prioritySet.size > 0 && !prioritySet.has(normalizedPriority)) {
        return false;
      }

      return true;
    }),
  }));
}

function flattenColumnsToListTasks(columns: ProjectColumn[]): ProjectListTask[] {
  return columns.flatMap((column) =>
    column.tasks.map((task) => ({
      ...task,
      columnId: column.id,
      columnTitle: column.title,
    })),
  );
}

function buildStatusColumns(statuses: StatusTaskResponse[]): ProjectColumn[] {
  return [...statuses]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((status, index) => ({
      id: status.id,
      title: status.name,
      color: STATUS_COLORS[index % STATUS_COLORS.length],
      tasks: [],
    }));
}

function mapProjectSummary(project: ProjectResponse | undefined, projectId: string) {
  return {
    id: project?.id ?? projectId,
    name: project?.name ?? 'Project',
    description: project?.description ?? 'No description available.',
    progress: Math.max(0, Math.min(100, Math.round(project?.progress ?? 0))),
    startDate: formatDateOrFallback(project?.startDate),
    dueDate: formatDateOrFallback(project?.endDate),
  };
}

function mapTeamMembersFromProgress(
  members: ProjectMemberResponse[],
  progressRows: MemberTaskProgressResponse[],
  tasks: ProjectTeamProgressTask[],
  resolveUserLabel: (userId: string) => string,
  resolveUserAvatar: (userId: string) => string | undefined,
  resolveMemberRoleLabels: (member: ProjectMemberResponse) => string[],
): ProjectTeamProgressMember[] {
  const progressByUserId = new Map(progressRows.map((row) => [row.userId, row]));
  const tasksByUserId = new Map<string, ProjectTeamProgressTask[]>();

  for (const task of tasks) {
    const assignedTo = toTrimmedString(
      (task as { assignedTo?: string | null }).assignedTo,
    );
    if (!assignedTo) continue;
    const list = tasksByUserId.get(assignedTo) ?? [];
    list.push(task);
    tasksByUserId.set(assignedTo, list);
  }

  return members.map((member) => {
    const progress = progressByUserId.get(member.userId);
    const memberTasks = tasksByUserId.get(member.userId) ?? [];
    const roleLabels = resolveMemberRoleLabels(member);
    const memberIdentity = resolveProjectMemberIdentity(member);
    const progressFullName = toTrimmedString(progress?.fullName);
    const progressEmail = toTrimmedString(progress?.email || null);
    const displayName =
      memberIdentity.displayName ||
      (!isEmailLike(progressFullName) ? progressFullName : '') ||
      resolveUserLabel(member.userId);
    const email = memberIdentity.email || progressEmail;

    return {
      id: member.id,
      name: displayName,
      email: email || undefined,
      avatar:
        resolveUserAvatar(member.userId) ??
        toTrimmedString(progress?.avatar || null) ??
        undefined,
      role: roleLabels.join(', ') || 'No role',
      roles: roleLabels,
      tasksCompleted: progress?.doneTasks ?? 0,
      tasksTotal: progress?.totalAssignedTasks ?? 0,
      tasksInProgress: progress?.openTasks ?? 0,
      lastActive: 'Not available',
      doneOnTimeTasks: progress?.doneOnTimeTasks ?? 0,
      doneLateTasks: progress?.doneLateTasks ?? 0,
      overdueOpenTasks: progress?.overdueOpenTasks ?? 0,
      dueSoonTasks: progress?.dueSoonTasks ?? 0,
      completionRate: progress?.completionRate ?? 0,
      onTimeRate: progress?.onTimeRate ?? 0,
      progressScore: progress?.progressScore ?? 0,
      tasks: memberTasks,
    };
  });
}

function toggleFilterValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function resolveProjectActiveTab(
  activeTab: string,
  permissions: {
    canViewProjectMembersTab: boolean;
    canViewProjectRolesTab: boolean;
    canViewDocumentsTab: boolean;
    canViewKpiTab: boolean;
    canViewReportsTab: boolean;
  },
) {
  if (activeTab === 'members' && !permissions.canViewProjectMembersTab) {
    return 'board';
  }
  if (activeTab === 'roles' && !permissions.canViewProjectRolesTab) {
    return 'board';
  }
  if (activeTab === 'documents' && !permissions.canViewDocumentsTab) {
    return 'board';
  }
  if (activeTab === 'kpi' && !permissions.canViewKpiTab) {
    return 'board';
  }
  if (activeTab === 'reports' && !permissions.canViewReportsTab) {
    return 'board';
  }
  return activeTab;
}

export default function ProjectDetailPage() {
  const detailT = useTranslations('project.detail');
  const commonT = useTranslations('project.common');
  const statusT = useTranslations('project.detail.status');
  const priorityT = useTranslations('project.detail.priority');
  const { confirm, confirmDialog } = useConfirmAlertDialog();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams<{
    tenant?: string;
    id?: string;
    projectId?: string;
    slug?: string;
  }>();
  const tenant = params?.tenant ?? '';
  const projectSlug = params?.slug ?? params?.id ?? params?.projectId ?? '';
  const dashboardHref = tenant ? ROUTES.tenant.dashboard(tenant) : ROUTES.dashboard;
  const projectsHref = tenant ? ROUTES.tenant.projects(tenant) : ROUTES.dashboard;
  const serviceContext = useServiceContext();
  const taskListPagination = usePagination({ initialPage: 1, initialLimit: 10 });
  const membersPagination = usePagination({ initialPage: 1, initialLimit: 10 });
  const {
    page: taskListPage,
    limit: taskListLimit,
    setPage: setTaskListPage,
  } = taskListPagination;
  const {
    page: membersPage,
    limit: membersLimit,
    setPage: setMembersPage,
  } = membersPagination;

  // Detail API now resolves by slug; projectId is read from detail response
  // and reused for members/statuses/tasks/roles APIs.
  const projectQuery = useProjectById(projectSlug);
  const projectId = projectQuery.data?.id ?? '';
  const currentProjectSlug = resolveProjectSlug(projectQuery.data, projectSlug);
  const statusesQuery = useProjectStatuses(projectId);
  const tasksQuery = useProjectTasks(projectId);
  const paginatedTaskListQuery = useProjectTasks(projectId, {
    page: taskListPage,
    limit: taskListLimit,
  });
  const memberProgressQuery = useProjectTaskMemberProgress(projectId);
  const membersQuery = useProjectMembers(projectId);
  const paginatedMembersQuery = useProjectMembers(projectId, {
    page: membersPage,
    limit: membersLimit,
  });
  const rolesQuery = useProjectRoles(projectId);
  const createTaskMutation = useCreateProjectTask();
  const updateTaskMutation = useUpdateProjectTask();
  const deleteTaskMutation = useDeleteProjectTask();
  const duplicateTaskMutation = useDuplicateProjectTask();
  const addTaskTagMutation = useAddProjectTaskTag();
  const createStatusMutation = useCreateProjectStatus();
  const updateStatusMutation = useUpdateProjectStatus();
  const deleteStatusMutation = useDeleteProjectStatus();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  const updateTaskStatusMutation = useUpdateProjectTaskStatus();
  const canUpdateProject = useCan(PERMISSIONS.PROJECTS_UPDATE);
  const canDeleteProject = useCan(PERMISSIONS.PROJECTS_DELETE);
  const canListDocuments = useCan(PERMISSIONS.DOCUMENTS_LIST);
  const canViewDocuments = useCan(PERMISSIONS.DOCUMENTS_VIEW);
  const canListMembers = useCan(PERMISSIONS.PROJECTS_MEMBERS_LIST);
  const canCreateTask = useCan(PERMISSIONS.PROJECTS_TASKS_CREATE);
  const canUpdateTask = useCan(PERMISSIONS.PROJECTS_TASKS_UPDATE);
  const canDeleteTask = useCan(PERMISSIONS.PROJECTS_TASKS_DELETE);
  const canCreateStatus = useCan(PERMISSIONS.PROJECTS_STATUSES_CREATE);
  const canManageMembers = useCan(PERMISSIONS.PROJECTS_MEMBERS_MANAGE);
  const canUpdateMembers = useCan(PERMISSIONS.PROJECTS_MEMBERS_UPDATE);
  const canRemoveMembers = useCan(PERMISSIONS.PROJECTS_MEMBERS_REMOVE);
  const canListProjectRoles = useCan(PERMISSIONS.PROJECTS_ROLES_LIST);
  const canViewProjectRoles = useCan(PERMISSIONS.PROJECTS_ROLES_VIEW);
  const canCreateProjectRoles = useCan(PERMISSIONS.PROJECTS_ROLES_CREATE);
  const canUpdateProjectRoles = useCan(PERMISSIONS.PROJECTS_ROLES_UPDATE);
  const canDeleteProjectRoles = useCan(PERMISSIONS.PROJECTS_ROLES_DELETE);
  const canAssignProjectRolePermissions = useCan(
    PERMISSIONS.PROJECTS_ROLES_ASSIGN_PERMISSIONS,
  );
  const canRevokeProjectRolePermissions = useCan(
    PERMISSIONS.PROJECTS_ROLES_REVOKE_PERMISSIONS,
  );
  const canAssignRoleToProjectMember = useCan(
    PERMISSIONS.PROJECTS_ROLES_ASSIGN_TO_MEMBER,
  );
  const canRevokeRoleFromProjectMember = useCan(
    PERMISSIONS.PROJECTS_ROLES_REVOKE_FROM_MEMBER,
  );
  const canAssignTask = useCan(PERMISSIONS.PROJECTS_TASKS_ASSIGN);
  const canInviteMember = canManageMembers || canUpdateMembers;
  const canViewProjectMembersTab = canListMembers;
  const canViewProjectRolesTab = canListProjectRoles || canViewProjectRoles;
  const canViewDocumentsTab = canListDocuments || canViewDocuments;
  // Project members can always open this tab to see their own KPI.
  // Team-wide KPI inside the tab is still gated by analytics.kpi.project.view.
  const canViewKpiTab = Boolean(projectId);
  // Project members can always open Report view to work with their own daily report.
  // Team reports inside that page are still gated by projects.daily_reports.view_all.
  const canViewReportsTab = Boolean(projectId);

  const currentUserId = useAppSelector((state) => state.user.profile?.id) ?? '';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('board');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isProjectSettingsDialogOpen, setProjectSettingsDialogOpen] = useState(false);
  const [projectSettingsForm, setProjectSettingsForm] =
    useState<ProjectSettingsFormState>(() => mapProjectToSettingsForm(projectQuery.data));
  const [projectSettingsErrors, setProjectSettingsErrors] =
    useState<ProjectSettingsErrors>({});
  const [projectSettingsSubmitError, setProjectSettingsSubmitError] = useState('');
  const [isInviteMemberDialogOpen, setInviteMemberDialogOpen] = useState(false);
  const [taskDetailRef, setTaskDetailRef] = useState<string | null>(
    () => searchParams?.get('taskSlug') ?? searchParams?.get('taskId') ?? null,
  );
  const [selectedAssigneeFilters, setSelectedAssigneeFilters] = useState<string[]>([]);
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<string[]>([]);
  const [selectedPriorityFilters, setSelectedPriorityFilters] = useState<string[]>([]);
  const resolvedActiveTab = useMemo(
    () =>
      resolveProjectActiveTab(activeTab, {
        canViewProjectMembersTab,
        canViewProjectRolesTab,
        canViewDocumentsTab,
        canViewKpiTab,
        canViewReportsTab,
      }),
    [
      activeTab,
      canViewDocumentsTab,
      canViewKpiTab,
      canViewProjectMembersTab,
      canViewProjectRolesTab,
      canViewReportsTab,
    ],
  );

  useEffect(() => {
    setTaskListPage(1);
    setMembersPage(1);
  }, [projectId, setMembersPage, setTaskListPage]);

  const [draggedTask, setDraggedTask] = useState<{
    task: ProjectTask;
    sourceColumnId: string;
  } | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const userDisplayNameById = useMemo(() => {
    const map = new Map<string, string>();

    for (const member of membersQuery.data ?? []) {
      if (!member.userId) continue;
      const identity = resolveProjectMemberIdentity(member);
      const label = buildUserLabel({
        displayName: identity.displayName,
        email: identity.email,
        userId: member.userId,
      });
      upsertUserLabel(map, member.userId, label);
    }

    for (const row of memberProgressQuery.data ?? []) {
      if (!row.userId) continue;
      const label = buildUserLabel({
        displayName: row.fullName,
        email: row.email,
        userId: row.userId,
      });
      upsertUserLabel(map, row.userId, label);
    }

    return map;
  }, [membersQuery.data, memberProgressQuery.data]);

  const userAvatarById = useMemo(() => {
    const map = new Map<string, string>();

    for (const row of memberProgressQuery.data ?? []) {
      const avatar = toTrimmedString(row.avatar || null);
      if (row.userId && avatar) map.set(row.userId, avatar);
    }

    for (const member of membersQuery.data ?? []) {
      const avatar = resolveProjectMemberAvatarUrl(member);
      if (member.userId && avatar) map.set(member.userId, avatar);
    }

    return map;
  }, [membersQuery.data, memberProgressQuery.data]);

  const project = useMemo(
    () => mapProjectSummary(projectQuery.data, projectId),
    [projectQuery.data, projectId],
  );
  const roleNameById = useMemo(
    () => new Map((rolesQuery.data ?? []).map((role) => [role.id, role.name])),
    [rolesQuery.data],
  );

  const topLevelTasks = useMemo(
    () =>
      (tasksQuery.data ?? []).filter((task) => !normalizeParentTaskId(task.parentTaskId)),
    [tasksQuery.data],
  );
  const paginatedTopLevelTasks = useMemo(
    () =>
      (paginatedTaskListQuery.data ?? []).filter(
        (task) => !normalizeParentTaskId(task.parentTaskId),
      ),
    [paginatedTaskListQuery.data],
  );

  const taskTagQueries = useQueries({
    queries: topLevelTasks.map((task) => ({
      queryKey: projectKeys.taskTags(serviceContext.tenantId, projectId, task.id),
      queryFn: () => new ProjectsService(serviceContext).listTaskTags(projectId, task.id),
      enabled: Boolean(projectId),
      staleTime: 30_000,
    })),
  });
  const paginatedTaskTagQueries = useQueries({
    queries: paginatedTopLevelTasks.map((task) => ({
      queryKey: projectKeys.taskTags(serviceContext.tenantId, projectId, task.id),
      queryFn: () => new ProjectsService(serviceContext).listTaskTags(projectId, task.id),
      enabled: Boolean(projectId),
      staleTime: 30_000,
    })),
  });

  const taskTagsByTaskId = useMemo(() => {
    const map = new Map<string, string[]>();
    topLevelTasks.forEach((task, index) => {
      const fromTaskPayload = extractTaskTagNames(task);
      const fromTagsEndpoint = (taskTagQueries[index]?.data ?? [])
        .map((tag: TaskTagResponse) => tag.name.trim())
        .filter(Boolean);
      const merged = [...new Set([...fromTaskPayload, ...fromTagsEndpoint])];
      if (merged.length > 0) {
        map.set(task.id, merged);
      } else if (hasTaskTagMeta(task, merged)) {
        map.set(task.id, ['Tagged']);
      }
    });
    return map;
  }, [topLevelTasks, taskTagQueries]);
  const paginatedTaskTagsByTaskId = useMemo(() => {
    const map = new Map<string, string[]>();
    paginatedTopLevelTasks.forEach((task, index) => {
      const fromTaskPayload = extractTaskTagNames(task);
      const fromTagsEndpoint = (paginatedTaskTagQueries[index]?.data ?? [])
        .map((tag: TaskTagResponse) => tag.name.trim())
        .filter(Boolean);
      const merged = [...new Set([...fromTaskPayload, ...fromTagsEndpoint])];
      if (merged.length > 0) {
        map.set(task.id, merged);
      } else if (hasTaskTagMeta(task, merged)) {
        map.set(task.id, ['Tagged']);
      }
    });
    return map;
  }, [paginatedTopLevelTasks, paginatedTaskTagQueries]);

  const columns = useMemo(
    () =>
      buildColumns(
        statusesQuery.data ?? [],
        tasksQuery.data ?? [],
        (userId) => userDisplayNameById.get(userId) ?? 'Unknown user',
        taskTagsByTaskId,
      ),
    [statusesQuery.data, tasksQuery.data, userDisplayNameById, taskTagsByTaskId],
  );

  const orderedStatuses = useMemo(
    () => [...(statusesQuery.data ?? [])].sort((a, b) => a.orderIndex - b.orderIndex),
    [statusesQuery.data],
  );

  const selectedTask = useMemo(
    () =>
      taskDetailRef
        ? (tasksQuery.data ?? []).find(
            (task) => task.id === taskDetailRef || task.slug === taskDetailRef,
          ) ?? null
        : null,
    [taskDetailRef, tasksQuery.data],
  );
  const isTaskDetailOpen =
    Boolean(taskDetailRef) && (Boolean(selectedTask) || tasksQuery.isPending);

  const memberOptions = useMemo(() => {
    const members = membersQuery.data ?? [];
    const map = new Map<string, { userId: string; label: string; subtitle?: string }>();

    for (const member of members) {
      if (map.has(member.userId)) continue;
      map.set(member.userId, {
        userId: member.userId,
        label: userDisplayNameById.get(member.userId) ?? 'Unknown user',
        subtitle: resolveProjectMemberRoleLabel(member, roleNameById),
      });
    }

    return [...map.values()];
  }, [membersQuery.data, userDisplayNameById, roleNameById]);

  const assignableMemberOptions = useMemo(() => {
    if (canAssignTask) return memberOptions;
    return memberOptions.filter((member) => member.userId === currentUserId);
  }, [canAssignTask, currentUserId, memberOptions]);
  const memberRolesQueries = useQueries({
    queries: (membersQuery.data ?? []).map((member) => ({
      queryKey: projectKeys.memberRoles(
        serviceContext.tenantId,
        projectId,
        member.userId,
      ),
      queryFn: () =>
        new ProjectsService(serviceContext).getProjectMemberRoles(
          projectId,
          member.userId,
        ),
      enabled: canViewProjectRolesTab && Boolean(projectId) && Boolean(member.userId),
      staleTime: 30_000,
    })),
  });
  const memberRolesByUserId = useMemo(() => {
    const map = new Map<string, ProjectMemberRoleResponse[]>();
    (membersQuery.data ?? []).forEach((member, index) => {
      const data = memberRolesQueries[index]?.data;
      if (Array.isArray(data)) {
        map.set(member.userId, data);
      }
    });
    return map;
  }, [memberRolesQueries, membersQuery.data]);

  const assigneeFilterOptions = useMemo<TaskFilterOption[]>(
    () => [
      { value: ASSIGNEE_FILTER_UNASSIGNED, label: 'Unassigned' },
      ...memberOptions.map((member) => ({
        value: member.userId,
        label: member.label,
      })),
    ],
    [memberOptions],
  );

  const tagFilterOptions = useMemo<TaskFilterOption[]>(() => {
    const tagNames = new Set<string>();
    for (const names of taskTagsByTaskId.values()) {
      for (const name of names) {
        const normalized = name.trim();
        if (normalized) {
          tagNames.add(normalized);
        }
      }
    }
    return [
      { value: TAG_FILTER_NO_TAG, label: 'No tag' },
      ...[...tagNames]
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({ value: name, label: name })),
    ];
  }, [taskTagsByTaskId]);

  const statusFilterOptions = useMemo<TaskFilterOption[]>(
    () =>
      columns.map((column) => ({
        value: column.id,
        label: column.title,
      })),
    [columns],
  );

  const priorityFilterOptions = PRIORITY_FILTER_OPTIONS;

  const filteredColumns = useMemo(
    () =>
      filterProjectColumns(
        columns,
        selectedAssigneeFilters,
        selectedTagFilters,
        selectedStatusFilters,
        selectedPriorityFilters,
      ),
    [
      columns,
      selectedAssigneeFilters,
      selectedTagFilters,
      selectedStatusFilters,
      selectedPriorityFilters,
    ],
  );

  const paginatedColumns = useMemo(
    () =>
      buildColumns(
        statusesQuery.data ?? [],
        paginatedTaskListQuery.data ?? [],
        (userId) => userDisplayNameById.get(userId) ?? 'Unknown user',
        paginatedTaskTagsByTaskId,
      ),
    [
      statusesQuery.data,
      paginatedTaskListQuery.data,
      userDisplayNameById,
      paginatedTaskTagsByTaskId,
    ],
  );

  const filteredPaginatedColumns = useMemo(
    () =>
      filterProjectColumns(
        paginatedColumns,
        selectedAssigneeFilters,
        selectedTagFilters,
        selectedStatusFilters,
        selectedPriorityFilters,
      ),
    [
      paginatedColumns,
      selectedAssigneeFilters,
      selectedTagFilters,
      selectedStatusFilters,
      selectedPriorityFilters,
    ],
  );

  const allTasks = useMemo<ProjectListTask[]>(
    () => flattenColumnsToListTasks(filteredColumns),
    [filteredColumns],
  );
  const paginatedListTasks = useMemo<ProjectListTask[]>(
    () => flattenColumnsToListTasks(filteredPaginatedColumns),
    [filteredPaginatedColumns],
  );
  const paginatedListPageItemCount = useMemo(
    () => flattenColumnsToListTasks(paginatedColumns).length,
    [paginatedColumns],
  );
  const listViewStatusColumns = useMemo(
    () => buildStatusColumns(statusesQuery.data ?? []),
    [statusesQuery.data],
  );
  const canGoToPreviousTaskListPage = taskListPage > 1;
  const canGoToNextTaskListPage =
    (paginatedTaskListQuery.data?.length ?? 0) === taskListLimit;

  const totalTasks = allTasks.length;
  const doneCount = allTasks.filter((task) => isDoneStatus(task.columnTitle)).length;
  const todoCount = allTasks.filter((task) => isTodoStatus(task.columnTitle)).length;
  const inProgressCount = Math.max(totalTasks - doneCount - todoCount, 0);
  const leafTaskIds = useMemo(() => {
    const parentIds = new Set<string>();
    for (const task of tasksQuery.data ?? []) {
      const parentTaskId = normalizeParentTaskId(task.parentTaskId);
      if (parentTaskId) parentIds.add(parentTaskId);
    }
    return parentIds;
  }, [tasksQuery.data]);
  const teamProgressTasks = useMemo<ProjectTeamProgressTask[]>(
    () =>
      (tasksQuery.data ?? [])
        .filter((task) => !leafTaskIds.has(task.id) && toTrimmedString(task.assignedTo))
        .map((task) => ({
          id: task.id,
          title: task.title,
          assignedTo: task.assignedTo ?? undefined,
          statusId: task.statusId,
          statusName:
            orderedStatuses.find((status) => status.id === task.statusId)?.name ??
            task.status ??
            'Unknown status',
          priority: (task.priority ?? 'medium') as TaskPriority,
          dueDate: task.dueDate ?? undefined,
          dueState: task.dueState ?? undefined,
        })),
    [leafTaskIds, orderedStatuses, tasksQuery.data],
  );

  const teamMembers = useMemo(
    () =>
      mapTeamMembersFromProgress(
        membersQuery.data ?? [],
        memberProgressQuery.data ?? [],
        teamProgressTasks,
        (userId) => userDisplayNameById.get(userId) ?? 'Unknown user',
        (userId) => userAvatarById.get(userId),
        (member) =>
          resolveProjectMemberRoleLabels(member, roleNameById, memberRolesByUserId),
      ),
    [
      memberProgressQuery.data,
      memberRolesByUserId,
      membersQuery.data,
      roleNameById,
      teamProgressTasks,
      userAvatarById,
      userDisplayNameById,
    ],
  );
  const canGoToPreviousMembersPage = membersPage > 1;
  const canGoToNextMembersPage =
    (paginatedMembersQuery.data?.length ?? 0) === membersLimit;

  useEffect(() => {
    if (taskListPage <= 1) return;
    if (paginatedTaskListQuery.isPending) return;
    if ((paginatedTaskListQuery.data?.length ?? 0) > 0) return;
    setTaskListPage((previous) => Math.max(previous - 1, 1));
  }, [
    paginatedTaskListQuery.data?.length,
    paginatedTaskListQuery.isPending,
    setTaskListPage,
    taskListPage,
  ]);

  useEffect(() => {
    if (membersPage <= 1) return;
    if (paginatedMembersQuery.isPending) return;
    if ((paginatedMembersQuery.data?.length ?? 0) > 0) return;
    setMembersPage((previous) => Math.max(previous - 1, 1));
  }, [
    membersPage,
    setMembersPage,
    paginatedMembersQuery.data?.length,
    paginatedMembersQuery.isPending,
  ]);

  const isMutatingStatus =
    createStatusMutation.isPending ||
    updateStatusMutation.isPending ||
    deleteStatusMutation.isPending;

  const handleDragStart = (
    event: DragEvent<HTMLDivElement>,
    task: ProjectTask,
    columnId: string,
  ) => {
    setDraggedTask({ task, sourceColumnId: columnId });
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', task.id);
    setTimeout(() => {
      (event.target as HTMLElement).style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (event: DragEvent<HTMLDivElement>) => {
    (event.target as HTMLElement).style.opacity = '1';
    setDraggedTask(null);
    setDragOverColumnId(null);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>, columnId: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverColumnId(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumnId(null);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, targetColumnId: string) => {
    event.preventDefault();
    setDragOverColumnId(null);

    if (!draggedTask || draggedTask.sourceColumnId === targetColumnId) return;
    if (!projectId) return;

    updateTaskStatusMutation.mutate({
      projectId,
      taskId: draggedTask.task.id,
      body: { statusId: targetColumnId },
    });

    setDraggedTask(null);
  };

  const changeTaskStatus = (
    taskId: string,
    currentColumnId: string,
    newColumnId: string,
  ) => {
    if (currentColumnId === newColumnId) return;
    if (!projectId) return;

    updateTaskStatusMutation.mutate({
      projectId,
      taskId,
      body: { statusId: newColumnId },
    });
  };

  const handleCreateTask = async (input: {
    statusId: string;
    title: string;
    dueDate?: string;
    assignedTo?: string | null;
  }) => {
    if (!projectId) {
      toast.danger('Project ID is missing.');
      return false;
    }

    const dueDate = input.dueDate
      ? new Date(`${input.dueDate}T00:00:00`).toISOString()
      : undefined;

    const result = await createTaskMutation.mutateAsync({
      projectId,
      body: {
        title: input.title,
        statusId: input.statusId,
        dueDate,
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
            'Task was created, but failed to set assignee as unassigned.',
        );
      }
    }

    toast.success('Task created successfully.');
    return true;
  };

  const handleAssignTask = async (taskId: string, assigneeUserId?: string) => {
    if (!projectId) {
      toast.danger('Project ID is missing.');
      return false;
    }

    const result = await updateTaskMutation.mutateAsync({
      projectId,
      taskId,
      body: { assignedTo: assigneeUserId ?? null },
    });

    if (!result.ok) {
      toast.danger(result.error.message || 'Failed to assign task.');
      return false;
    }

    return true;
  };

  const handleRenameTask = async (taskId: string, title: string) => {
    if (!projectId) {
      toast.danger('Project ID is missing.');
      return false;
    }

    const nextTitle = title.trim();
    if (!nextTitle) {
      toast.danger('Task title is required.');
      return false;
    }

    const result = await updateTaskMutation.mutateAsync({
      projectId,
      taskId,
      body: { title: nextTitle },
    });

    if (!result.ok) {
      toast.danger(result.error.message || 'Failed to rename task.');
      return false;
    }

    return true;
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!projectId) {
      toast.danger('Project ID is missing.');
      return false;
    }

    const result = await deleteTaskMutation.mutateAsync({ projectId, taskId });
    if (!result.ok) {
      toast.danger(result.error.message || 'Failed to delete task.');
      return false;
    }

    toast.success('Task deleted successfully.');
    return true;
  };

  const handleDuplicateTask = async (taskId: string) => {
    if (!projectId) {
      toast.danger('Project ID is missing.');
      return false;
    }

    const sourceTask = (tasksQuery.data ?? []).find((task) => task.id === taskId);
    const parentTaskId = normalizeParentTaskId(sourceTask?.parentTaskId);
    const body: {
      assigneeUserId?: string;
      keepParentTask?: boolean;
      parentTaskId?: string;
      copyTags?: boolean;
      copyAttachments?: boolean;
    } = {
      copyTags: true,
      copyAttachments: true,
    };
    if (parentTaskId) {
      body.keepParentTask = true;
      body.parentTaskId = parentTaskId;
    }

    const result = await duplicateTaskMutation.mutateAsync({
      projectId,
      taskId,
      body,
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
            'Task was duplicated, but failed to clear the assignee.',
        );
      }
    }

    toast.success('Task duplicated successfully.');
    return true;
  };

  const handleAddTaskTag = async (taskId: string, tagName: string) => {
    if (!projectId) {
      toast.danger('Project ID is missing.');
      return false;
    }

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

  const handleChangeTaskStatusFromMenu = async (taskId: string, statusId: string) => {
    if (!projectId) {
      toast.danger('Project ID is missing.');
      return false;
    }

    const result = await updateTaskStatusMutation.mutateAsync({
      projectId,
      taskId,
      body: { statusId },
    });
    if (!result.ok) {
      toast.danger(result.error.message || 'Failed to change task status.');
      return false;
    }

    return true;
  };

  const handleCreateStatus = async (name: string) => {
    if (!projectId) {
      toast.danger('Project ID is missing.');
      return false;
    }

    const result = await createStatusMutation.mutateAsync({
      projectId,
      body: { name },
    });

    if (!result.ok) {
      toast.danger(result.error.message || 'Failed to create column.');
      return false;
    }

    toast.success('Column created successfully.');
    return true;
  };

  const handleRenameStatus = async (statusId: string, name: string) => {
    if (!projectId) {
      toast.danger('Project ID is missing.');
      return false;
    }

    const result = await updateStatusMutation.mutateAsync({
      projectId,
      statusId,
      body: { name },
    });

    if (!result.ok) {
      toast.danger(result.error.message || 'Failed to rename column.');
      return false;
    }

    toast.success('Column renamed successfully.');
    return true;
  };

  const handleReorderStatus = async (statusId: string, targetIndex: number) => {
    if (!projectId) {
      toast.danger('Project ID is missing.');
      return false;
    }

    const sourceIndex = orderedStatuses.findIndex((status) => status.id === statusId);
    if (sourceIndex < 0) return false;

    const sourceStatus = orderedStatuses[sourceIndex];
    const clampedTargetIndex = Math.max(
      0,
      Math.min(targetIndex, orderedStatuses.length - 1),
    );
    if (sourceIndex === clampedTargetIndex) return true;

    // FE rule:
    // - Move left  => orderIndex = currentOrderIndex - 1
    // - Move right => orderIndex = currentOrderIndex + 1
    // For larger drag jumps, fallback to target column orderIndex.
    const direction = clampedTargetIndex > sourceIndex ? 1 : -1;
    let nextOrderIndex = sourceStatus.orderIndex + direction;

    if (Math.abs(clampedTargetIndex - sourceIndex) > 1) {
      const targetStatus = orderedStatuses[clampedTargetIndex];
      if (targetStatus) {
        nextOrderIndex = targetStatus.orderIndex;
      }
    }

    if (nextOrderIndex < 0) return false;

    const result = await updateStatusMutation.mutateAsync({
      projectId,
      statusId,
      body: { orderIndex: nextOrderIndex },
    });

    if (!result.ok) {
      toast.danger(result.error.message || 'Failed to reorder columns.');
      return false;
    }

    return true;
  };

  const handleDeleteStatus = async (statusId: string) => {
    if (!projectId) {
      toast.danger('Project ID is missing.');
      return false;
    }

    if (orderedStatuses.length <= 1) {
      toast.warning('Cannot delete the last status column.');
      return false;
    }

    const currentIndex = orderedStatuses.findIndex((status) => status.id === statusId);
    if (currentIndex < 0) return false;

    const moveToStatusId =
      orderedStatuses[currentIndex + 1]?.id ?? orderedStatuses[currentIndex - 1]?.id;

    const result = await deleteStatusMutation.mutateAsync({
      projectId,
      statusId,
      body: moveToStatusId ? { moveToStatusId } : undefined,
    });

    if (!result.ok) {
      toast.danger(result.error.message || 'Failed to delete column.');
      return false;
    }

    toast.success('Column deleted successfully.');
    return true;
  };

  const writeTaskRefToUrl = (taskRef: string | null) => {
    if (!pathname) return;
    const next = new URLSearchParams(searchParams?.toString() ?? '');
    next.delete('taskId');
    if (taskRef) {
      next.set('taskSlug', taskRef);
    } else {
      next.delete('taskSlug');
      next.delete('commentId');
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleOpenTaskDetail = (taskId: string) => {
    setTaskDetailRef(taskId);
    const task = (tasksQuery.data ?? []).find((t) => t.id === taskId);
    const ref = task?.slug && task.slug.trim().length > 0 ? task.slug : taskId;
    writeTaskRefToUrl(ref);
  };

  const handleTaskDetailOpenChange = (open: boolean) => {
    if (!open) {
      setTaskDetailRef(null);
      writeTaskRefToUrl(null);
    }
  };

  const handleActiveTabChange = (nextTab: string) => {
    setActiveTab(
      resolveProjectActiveTab(nextTab, {
        canViewProjectMembersTab,
        canViewProjectRolesTab,
        canViewDocumentsTab,
        canViewKpiTab,
        canViewReportsTab,
      }),
    );
  };

  const handleSubmitTaskDetail = async (input: {
    taskId: string;
    title: string;
    description: string;
    statusId: string;
    priority: string;
    assignedTo: string | null;
    startedAt: string;
    dueDate: string;
    actualStart: string;
    actualEnd: string;
  }) => {
    if (!projectId) {
      toast.danger('Project ID is missing.');
      return false;
    }

    const nextTitle = input.title.trim();
    if (!nextTitle) {
      toast.danger('Task title is required.');
      return false;
    }

    if (input.startedAt && input.dueDate && input.startedAt > input.dueDate) {
      toast.warning('Start date must be earlier than or equal to due date.');
      return false;
    }

    if (input.actualStart && input.dueDate && input.actualStart > input.dueDate) {
      toast.warning('Actual start must be earlier than or equal to due date.');
      return false;
    }

    if (input.actualStart && input.actualEnd && input.actualEnd < input.actualStart) {
      toast.warning('Actual end must be later than or equal to actual start.');
      return false;
    }

    const startedAt = input.startedAt
      ? new Date(`${input.startedAt}T00:00:00`).toISOString()
      : null;

    const dueDate = input.dueDate
      ? new Date(input.dueDate + 'T00:00:00').toISOString()
      : null;

    const actualStart = input.actualStart
      ? new Date(input.actualStart + 'T00:00:00').toISOString()
      : null;

    const actualEnd = input.actualEnd
      ? new Date(input.actualEnd + 'T00:00:00').toISOString()
      : null;

    const result = await updateTaskMutation.mutateAsync({
      projectId,
      taskId: input.taskId,
      body: {
        title: nextTitle,
        description: input.description.trim() || undefined,
        statusId: input.statusId,
        priority: input.priority as TaskPriority,
        assignedTo: input.assignedTo,
        startedAt,
        dueDate,
        actualStart,
        actualEnd,
      },
    });

    if (!result.ok) {
      toast.danger(result.error.message || 'Failed to update task.');
      return false;
    }

    toast.success('Task updated successfully.');
    return true;
  };

  const setProjectSettingsField = <K extends keyof ProjectSettingsFormState>(
    key: K,
    value: ProjectSettingsFormState[K],
  ) => {
    setProjectSettingsForm((previous) => ({ ...previous, [key]: value }));
    if (projectSettingsErrors[key as keyof ProjectSettingsErrors]) {
      setProjectSettingsErrors((previous) => ({ ...previous, [key]: undefined }));
    }
  };

  const lockedProjectManagerIds = useMemo(
    () => new Set(normalizeManagerIds(projectQuery.data?.managerId)),
    [projectQuery.data?.managerId],
  );
  const selectedProjectManagersLabel = useMemo(() => {
    if (projectSettingsForm.managerId.length === 0) {
      return detailT('noManagersSelected');
    }

    const selectedLabels = memberOptions
      .filter((member) => projectSettingsForm.managerId.includes(member.userId))
      .map((member) => member.label);

    if (selectedLabels.length === 0) {
      return detailT('selectedCount', { count: projectSettingsForm.managerId.length });
    }

    if (selectedLabels.length <= 2) {
      return selectedLabels.join(', ');
    }

    return `${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2}`;
  }, [detailT, memberOptions, projectSettingsForm.managerId]);

  const toggleProjectManagerSelection = (userId: string, nextChecked: boolean) => {
    const isLockedManager = lockedProjectManagerIds.has(userId);

    if (!nextChecked && isLockedManager) {
      return;
    }

    if (nextChecked) {
      if (projectSettingsForm.managerId.includes(userId)) return;
      setProjectSettingsField('managerId', [...projectSettingsForm.managerId, userId]);
      return;
    }

    setProjectSettingsField(
      'managerId',
      projectSettingsForm.managerId.filter((selectedId) => selectedId !== userId),
    );
  };

  const handleOpenProjectSettings = () => {
    if (!canUpdateProject) return;
    setProjectSettingsForm(mapProjectToSettingsForm(projectQuery.data));
    setProjectSettingsErrors({});
    setProjectSettingsSubmitError('');
    setProjectSettingsDialogOpen(true);
  };

  const handleProjectSettingsOpenChange = (open: boolean) => {
    if (!open && updateProjectMutation.isPending) {
      return;
    }
    if (!open) {
      setProjectSettingsErrors({});
      setProjectSettingsSubmitError('');
    }
    setProjectSettingsDialogOpen(open);
  };

  const handleSubmitProjectSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectId) {
      toast.danger('Project ID is missing.');
      return;
    }

    const validationErrors = validateProjectSettingsForm(projectSettingsForm, {
      nameRequired: detailT('validation.nameRequired'),
      endDateAfterStart: detailT('validation.endDateAfterStart'),
      estimatedBudgetPositive: detailT('validation.estimatedBudgetPositive'),
      actualBudgetPositive: detailT('validation.actualBudgetPositive'),
      budgetCurrencyInvalid: 'Currency must be either USD or VND.',
    });
    setProjectSettingsErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const result = await updateProjectMutation.mutateAsync({
      projectId,
      body: toUpdateProjectPayload(projectSettingsForm),
    });
    if (!result.ok) {
      const message = result.error.message || detailT('toasts.updateFailed');
      setProjectSettingsSubmitError(message);
      toast.danger(message);
      return;
    }

    toast.success(detailT('toasts.updated'));
    setProjectSettingsDialogOpen(false);

    const nextProjectSlug = resolveProjectSlug(result.data as ProjectResponse, '');
    if (nextProjectSlug && nextProjectSlug !== currentProjectSlug) {
      if (tenant) {
        router.replace(ROUTES.tenant.project(tenant, nextProjectSlug));
      } else {
        router.replace(`/projects/${nextProjectSlug}`);
      }
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId) {
      toast.danger(detailT('toasts.projectIdMissing'));
      return;
    }

    const confirmed = await confirm({
      title: detailT('deleteDialog.title'),
      description: detailT('deleteDialog.description', {
        name: projectQuery.data?.name ?? project.name,
      }),
      confirmText: commonT('delete'),
      cancelText: commonT('cancel'),
      destructive: true,
    });
    if (!confirmed) return;

    const result = await deleteProjectMutation.mutateAsync(projectId);
    if (!result.ok) {
      const message = result.error.message || detailT('toasts.deleteFailed');
      toast.danger(message);
      return;
    }

    toast.success(detailT('toasts.deleted'));
    setProjectSettingsSubmitError('');
    setProjectSettingsDialogOpen(false);
    if (tenant) {
      router.push(ROUTES.tenant.projects(tenant));
      return;
    }
    router.push('/projects');
  };

  const handleToggleAssigneeFilter = (value: string) => {
    setSelectedAssigneeFilters((previous) => toggleFilterValue(previous, value));
  };

  const handleToggleTagFilter = (value: string) => {
    setSelectedTagFilters((previous) => toggleFilterValue(previous, value));
  };

  const handleToggleStatusFilter = (value: string) => {
    setSelectedStatusFilters((previous) => toggleFilterValue(previous, value));
  };

  const handleTogglePriorityFilter = (value: string) => {
    setSelectedPriorityFilters((previous) => toggleFilterValue(previous, value));
  };

  return (
    <div className="space-y-6">
      {confirmDialog}
      <ProjectRealtimeBridge projectId={projectId} />

      <ProjectDetailHeaderControls
        project={project}
        dashboardHref={dashboardHref}
        projectsHref={projectsHref}
        todoCount={todoCount}
        inProgressCount={inProgressCount}
        doneCount={doneCount}
        activeTab={resolvedActiveTab}
        viewMode={viewMode}
        searchQuery={searchQuery}
        assigneeFilterOptions={assigneeFilterOptions}
        tagFilterOptions={tagFilterOptions}
        statusFilterOptions={statusFilterOptions}
        priorityFilterOptions={priorityFilterOptions}
        selectedAssigneeFilters={selectedAssigneeFilters}
        selectedTagFilters={selectedTagFilters}
        selectedStatusFilters={selectedStatusFilters}
        selectedPriorityFilters={selectedPriorityFilters}
        onActiveTabChange={handleActiveTabChange}
        onViewModeChange={setViewMode}
        onSearchQueryChange={setSearchQuery}
        onToggleAssigneeFilter={handleToggleAssigneeFilter}
        onToggleTagFilter={handleToggleTagFilter}
        onToggleStatusFilter={handleToggleStatusFilter}
        onTogglePriorityFilter={handleTogglePriorityFilter}
        onClearAssigneeFilters={() => setSelectedAssigneeFilters([])}
        onClearTagFilters={() => setSelectedTagFilters([])}
        onClearStatusFilters={() => setSelectedStatusFilters([])}
        onClearPriorityFilters={() => setSelectedPriorityFilters([])}
        canUpdateProject={canUpdateProject}
        canDeleteProject={canDeleteProject}
        isUpdatingProject={updateProjectMutation.isPending}
        isDeletingProject={deleteProjectMutation.isPending}
        onEditProjectClick={handleOpenProjectSettings}
        onDeleteProjectClick={() => void handleDeleteProject()}
        canInviteMember={canInviteMember}
        onInviteMemberClick={() => setInviteMemberDialogOpen(true)}
        canViewMembersTab={canViewProjectMembersTab}
        canViewRolesTab={canViewProjectRolesTab}
        canViewDocumentsTab={canViewDocumentsTab}
        canViewKpiTab={canViewKpiTab}
        canViewReportsTab={canViewReportsTab}
        onOpenRolesClick={() => handleActiveTabChange('roles')}
      />

      {resolvedActiveTab === 'board' ? (
        viewMode === 'board' ? (
          <ProjectKanbanBoard
            columns={filteredColumns}
            draggedTaskId={draggedTask?.task.id}
            dragOverColumnId={dragOverColumnId}
            searchQuery={searchQuery}
            memberOptions={assignableMemberOptions}
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
              addTaskTagMutation.isPending
            }
            isCreatingStatus={createStatusMutation.isPending}
            isMutatingStatus={isMutatingStatus}
          />
        ) : (
          <ProjectTaskListTable
            tasks={paginatedListTasks}
            columns={listViewStatusColumns}
            searchQuery={searchQuery}
            page={taskListPage}
            limit={taskListLimit}
            pageItemCount={paginatedListPageItemCount}
            canGoPrevious={canGoToPreviousTaskListPage}
            canGoNext={canGoToNextTaskListPage}
            canUpdateTask={canUpdateTask}
            canDeleteTask={canDeleteTask}
            isPending={paginatedTaskListQuery.isPending}
            onPageChange={taskListPagination.setPage}
            onLimitChange={(limit) => {
              taskListPagination.setLimit(limit);
              taskListPagination.setPage(1);
            }}
            onChangeTaskStatus={changeTaskStatus}
            onTaskClick={handleOpenTaskDetail}
            onDeleteTask={handleDeleteTask}
            isUpdatingTask={updateTaskMutation.isPending || deleteTaskMutation.isPending}
          />
        )
      ) : resolvedActiveTab === 'team' ? (
        <ProjectTeamProgressView teamMembers={teamMembers} />
      ) : resolvedActiveTab === 'members' && canViewProjectMembersTab ? (
        <ProjectMembersManagementView
          key={projectId}
          projectId={projectId}
          members={paginatedMembersQuery.data ?? []}
          isPending={paginatedMembersQuery.isPending}
          errorMessage={paginatedMembersQuery.error?.message ?? null}
          userDisplayNameById={userDisplayNameById}
          currentUserId={currentUserId}
          canViewMembers={canViewProjectMembersTab}
          canViewProjectRoles={canListProjectRoles}
          canRemoveMember={canRemoveMembers}
          canEditAllocatedHours={canManageMembers || canUpdateMembers}
          canAssignRoleToMember={canAssignRoleToProjectMember}
          canRevokeRoleFromMember={canRevokeRoleFromProjectMember}
          page={membersPage}
          limit={membersLimit}
          pageItemCount={paginatedMembersQuery.data?.length ?? 0}
          canGoPrevious={canGoToPreviousMembersPage}
          canGoNext={canGoToNextMembersPage}
          onPageChange={membersPagination.setPage}
          onLimitChange={(limit) => {
            membersPagination.setLimit(limit);
            membersPagination.setPage(1);
          }}
        />
      ) : resolvedActiveTab === 'roles' && canViewProjectRolesTab ? (
        <ProjectRolesManagementView
          key={projectId}
          projectId={projectId}
          canViewRoles={canViewProjectRolesTab}
          canCreateRole={canCreateProjectRoles}
          canUpdateRole={canUpdateProjectRoles}
          canDeleteRole={canDeleteProjectRoles}
          canAssignPermissions={canAssignProjectRolePermissions}
          canRevokePermissions={canRevokeProjectRolePermissions}
        />
      ) : resolvedActiveTab === 'documents' && canViewDocumentsTab ? (
        <div className="text-muted-foreground rounded-xl border border-dashed p-8 text-sm">
          Document tab is intentionally empty for now.
        </div>
      ) : resolvedActiveTab === 'kpi' && canViewKpiTab ? (
        <ProjectKpiWorkspace
          projectId={projectId}
          projectSlug={currentProjectSlug}
          projectKpiBasePath={
            tenant
              ? ROUTES.tenant.projectTab(tenant, currentProjectSlug, 'kpi')
              : `/projects/${currentProjectSlug}/kpi`
          }
        />
      ) : resolvedActiveTab === 'reports' && canViewReportsTab ? (
        <ProjectReportViewPage
          projectId={projectId}
          projectName={projectQuery.data?.name}
        />
      ) : null}

      <Dialog
        open={isProjectSettingsDialogOpen}
        onOpenChange={handleProjectSettingsOpenChange}
      >
        <DialogContent
          className="sm:max-w-2xl"
          onPointerDownOutside={() => handleProjectSettingsOpenChange(false)}
        >
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project information.</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(event) => void handleSubmitProjectSettings(event)}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-project-name">{detailT('editDialog.name')}</Label>
                <Input
                  id="edit-project-name"
                  value={projectSettingsForm.name}
                  onChange={(event) =>
                    setProjectSettingsField('name', event.target.value)
                  }
                  placeholder="Project name"
                  disabled={!canUpdateProject || updateProjectMutation.isPending}
                  aria-invalid={Boolean(projectSettingsErrors.name)}
                />
                {projectSettingsErrors.name && (
                  <p className="text-destructive text-xs">{projectSettingsErrors.name}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-project-description">{detailT('editDialog.descriptionLabel')}</Label>
                <Textarea
                  id="edit-project-description"
                  value={projectSettingsForm.description}
                  onChange={(event) =>
                    setProjectSettingsField('description', event.target.value)
                  }
                  placeholder={detailT('editDialog.descriptionLabel')}
                  className="min-h-22.5"
                  disabled={!canUpdateProject || updateProjectMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label>{detailT('editDialog.status')}</Label>
                <Select
                  value={projectSettingsForm.status}
                  onValueChange={(value) =>
                    setProjectSettingsField('status', value as ProjectStatus)
                  }
                  disabled={!canUpdateProject || updateProjectMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={detailT('editDialog.status')} />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {statusT(option.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{detailT('editDialog.priority')}</Label>
                <Select
                  value={projectSettingsForm.priority}
                  onValueChange={(value) =>
                    setProjectSettingsField('priority', value as ProjectPriority)
                  }
                  disabled={!canUpdateProject || updateProjectMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={detailT('editDialog.priority')} />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {priorityT(option.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-project-start-date">{detailT('editDialog.startDate')}</Label>
                <DatePicker
                  id="edit-project-start-date"
                  value={projectSettingsForm.startDate}
                  onChange={(value) => setProjectSettingsField('startDate', value)}
                  disabled={!canUpdateProject || updateProjectMutation.isPending}
                  placeholder={detailT('editDialog.startDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-project-end-date">{detailT('editDialog.endDate')}</Label>
                <DatePicker
                  id="edit-project-end-date"
                  value={projectSettingsForm.endDate}
                  onChange={(value) => setProjectSettingsField('endDate', value)}
                  disabled={!canUpdateProject || updateProjectMutation.isPending}
                  placeholder={detailT('editDialog.endDate')}
                />
                {projectSettingsErrors.endDate && (
                  <p className="text-destructive text-xs">
                    {projectSettingsErrors.endDate}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{detailT('editDialog.budgetCurrency')}</Label>
                <Select
                  value={projectSettingsForm.budgetCurrency}
                  onValueChange={(value) =>
                    setProjectSettingsField(
                      'budgetCurrency',
                      value as ProjectBudgetCurrency,
                    )
                  }
                  disabled={!canUpdateProject || updateProjectMutation.isPending}
                >
                  <SelectTrigger
                    aria-invalid={Boolean(projectSettingsErrors.budgetCurrency)}
                  >
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VND">VND</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
                {projectSettingsErrors.budgetCurrency && (
                  <p className="text-destructive text-xs">
                    {projectSettingsErrors.budgetCurrency}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-project-estimated-budget">{detailT('editDialog.estimatedBudget')}</Label>
                <Input
                  id="edit-project-estimated-budget"
                  type="number"
                  min={0}
                  step="0.01"
                  value={projectSettingsForm.estimatedBudget}
                  onChange={(event) =>
                    setProjectSettingsField('estimatedBudget', event.target.value)
                  }
                  placeholder="15000"
                  disabled={!canUpdateProject || updateProjectMutation.isPending}
                  aria-invalid={Boolean(projectSettingsErrors.estimatedBudget)}
                />
                {projectSettingsErrors.estimatedBudget && (
                  <p className="text-destructive text-xs">
                    {projectSettingsErrors.estimatedBudget}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-project-actual-budget">{detailT('editDialog.actualBudget')}</Label>
                <Input
                  id="edit-project-actual-budget"
                  type="number"
                  min={0}
                  step="0.01"
                  value={projectSettingsForm.actualBudget}
                  onChange={(event) =>
                    setProjectSettingsField('actualBudget', event.target.value)
                  }
                  placeholder="14500"
                  disabled={!canUpdateProject || updateProjectMutation.isPending}
                  aria-invalid={Boolean(projectSettingsErrors.actualBudget)}
                />
                {projectSettingsErrors.actualBudget && (
                  <p className="text-destructive text-xs">
                    {projectSettingsErrors.actualBudget}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>{detailT('editDialog.projectManagers')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between overflow-hidden font-normal"
                      disabled={
                        !canUpdateProject ||
                        updateProjectMutation.isPending ||
                        membersQuery.isPending
                      }
                    >
                      <span className="truncate text-left">
                        {selectedProjectManagersLabel}
                      </span>
                      <ChevronsUpDown className="text-muted-foreground ml-2 h-4 w-4 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-[var(--radix-popover-trigger-width)] p-2"
                  >
                    {memberOptions.length === 0 ? (
                      <p className="text-muted-foreground py-2 text-center text-sm">
                        {membersQuery.isPending
                          ? 'Loading project members...'
                          : 'No project members found.'}
                      </p>
                    ) : (
                      <div className="max-h-48 space-y-1 overflow-y-auto overscroll-contain pr-1">
                        {memberOptions.map((member) => {
                          const isChecked = projectSettingsForm.managerId.includes(
                            member.userId,
                          );
                          const isLockedManager = lockedProjectManagerIds.has(
                            member.userId,
                          );
                          return (
                            <button
                              key={member.userId}
                              type="button"
                              className="hover:bg-muted/40 flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left"
                              onClick={() =>
                                toggleProjectManagerSelection(member.userId, !isChecked)
                              }
                              disabled={
                                !canUpdateProject ||
                                updateProjectMutation.isPending ||
                                (isChecked && isLockedManager)
                              }
                            >
                              <Checkbox
                                checked={isChecked}
                                className="pointer-events-none mt-0.5"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm">{member.label}</p>
                                {member.subtitle ? (
                                  <p className="text-muted-foreground truncate text-xs">
                                    {member.subtitle}
                                  </p>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
                {membersQuery.isPending && (
                  <p className="text-muted-foreground text-xs">
                    Loading project members...
                  </p>
                )}
                {membersQuery.isError && (
                  <p className="text-destructive text-xs">
                    {membersQuery.error?.message || detailT('toasts.loadMembersFailed')}
                  </p>
                )}
              </div>
            </div>

            {projectSettingsSubmitError && (
              <p className="text-destructive text-sm">{projectSettingsSubmitError}</p>
            )}

            <DialogFooter className="sm:justify-end">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleProjectSettingsOpenChange(false)}
                  disabled={updateProjectMutation.isPending}
                >
                  {commonT('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={!canUpdateProject || updateProjectMutation.isPending}
                >
                  {updateProjectMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {commonT('saveChanges')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {canInviteMember && (
        <InviteProjectMemberDialog
          open={isInviteMemberDialogOpen}
          onOpenChange={setInviteMemberDialogOpen}
          projectId={projectId}
          projectMemberUserIds={(membersQuery.data ?? []).map((member) => member.userId)}
          isProjectMembersPending={membersQuery.isPending}
          projectMembersErrorMessage={membersQuery.error?.message ?? null}
        />
      )}

      <ProjectTaskDetailDialog
        key={selectedTask?.id ?? 'task-detail-empty'}
        open={isTaskDetailOpen}
        projectId={projectId}
        onOpenChange={handleTaskDetailOpenChange}
        onOpenTask={handleOpenTaskDetail}
        task={selectedTask}
        projectTasks={tasksQuery.data ?? []}
        statuses={orderedStatuses.map((status) => ({ id: status.id, name: status.name }))}
        members={assignableMemberOptions}
        userDisplayNameById={userDisplayNameById}
        isSubmitting={updateTaskMutation.isPending}
        onSubmit={handleSubmitTaskDetail}
      />
    </div>
  );
}
