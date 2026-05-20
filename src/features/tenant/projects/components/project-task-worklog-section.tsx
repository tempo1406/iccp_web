'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { toast } from '@/lib/toast';
import { useAppSelector } from '@/store';
import { useConfirmAlertDialog } from '../hooks/use-confirm-alert-dialog';
import {
  useCreateProjectTaskWorklog,
  useDeleteProjectTaskWorklog,
  useProjectTaskWorklogs,
  useUpdateProjectTaskWorklog,
} from '../query/use-project-tasks';
import type {
  CreateTaskWorklogRequest,
  TaskResponse,
  TaskWorklogResponse,
  UpdateTaskWorklogRequest,
} from '../services/projects.service';
import type { MemberOption } from './project-task-detail-dialog.types';
import { getInitials, toDateInputValue } from './project-task-detail-dialog.utils';

type WorklogMode = 'duration' | 'time_range';

interface WorklogFormState {
  workDate: string;
  durationMinutes: string;
  startedAt: string;
  endedAt: string;
  description: string;
  progressPercent: string;
  isBlocker: boolean;
  mode: WorklogMode;
}

interface ProjectTaskWorklogSectionProps {
  projectId: string;
  task: TaskResponse | null;
  members: MemberOption[];
  userDisplayNameById?: Map<string, string>;
}

function formatMinutes(value?: number | null): string {
  const totalMinutes = Number(value ?? 0);
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '0m';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function toLocalTimeInputValue(value?: string | null): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function toDateTimeLabel(value?: string | null): string {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not available';
  return parsed.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildIsoDateTime(workDate: string, timeValue: string): string | null {
  if (!workDate || !timeValue) return null;
  const parsed = new Date(`${workDate}T${timeValue}`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function createDefaultFormState(): WorklogFormState {
  return {
    workDate: toDateInputValue(new Date().toISOString()),
    durationMinutes: '',
    startedAt: '',
    endedAt: '',
    description: '',
    progressPercent: '',
    isBlocker: false,
    mode: 'duration',
  };
}

function toEditableFormState(worklog: TaskWorklogResponse): WorklogFormState {
  const usesTimeRange = Boolean(worklog.startedAt || worklog.endedAt);
  return {
    workDate: worklog.workDate,
    durationMinutes:
      worklog.durationMinutes != null ? String(worklog.durationMinutes) : '',
    startedAt: toLocalTimeInputValue(worklog.startedAt),
    endedAt: toLocalTimeInputValue(worklog.endedAt),
    description: worklog.description ?? '',
    progressPercent:
      worklog.progressPercent != null ? String(worklog.progressPercent) : '',
    isBlocker: Boolean(worklog.isBlocker),
    mode: usesTimeRange ? 'time_range' : 'duration',
  };
}

export function ProjectTaskWorklogSection({
  projectId,
  task,
  members,
  userDisplayNameById,
}: ProjectTaskWorklogSectionProps) {
  const t = useTranslations('project.taskWorklog');
  const commonT = useTranslations('project.common');
  const currentUserId = useAppSelector((state) => state.user.profile?.id) ?? '';
  const canLogTimeForOthers = useCan(PERMISSIONS.PROJECTS_TASKS_LOG_TIME);
  const { confirm, confirmDialog } = useConfirmAlertDialog();

  const [editingWorklogId, setEditingWorklogId] = useState<string | null>(null);
  const [formState, setFormState] = useState<WorklogFormState>(() =>
    createDefaultFormState(),
  );

  const taskId = task?.id ?? '';
  const worklogFilters = useMemo(() => ({}), []);
  const worklogsQuery = useProjectTaskWorklogs(
    projectId,
    taskId,
    worklogFilters,
    Boolean(taskId),
  );
  const createWorklogMutation = useCreateProjectTaskWorklog();
  const updateWorklogMutation = useUpdateProjectTaskWorklog();
  const deleteWorklogMutation = useDeleteProjectTaskWorklog();

  const memberLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of members) {
      map.set(member.userId, member.label);
    }
    userDisplayNameById?.forEach((label, userId) => {
      if (!map.has(userId) && label.trim().length > 0) {
        map.set(userId, label);
      }
    });
    return map;
  }, [members, userDisplayNameById]);
  const memberAvatarById = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of members) {
      if (member.avatarUrl) {
        map.set(member.userId, member.avatarUrl);
      }
    }
    return map;
  }, [members]);
  const assignedUserId = task?.assignedTo?.trim() ?? '';
  const canLogCurrentTask = Boolean(
    taskId && assignedUserId && (assignedUserId === currentUserId || canLogTimeForOthers),
  );

  const sortedWorklogs = useMemo(() => {
    const items = [...(worklogsQuery.data ?? [])];
    items.sort((left, right) => {
      const leftKey = `${left.workDate}|${left.startedAt ?? left.createdAt ?? ''}`;
      const rightKey = `${right.workDate}|${right.startedAt ?? right.createdAt ?? ''}`;
      return leftKey < rightKey ? 1 : leftKey > rightKey ? -1 : 0;
    });
    return items;
  }, [worklogsQuery.data]);

  const editingWorklog =
    sortedWorklogs.find((worklog) => worklog.id === editingWorklogId) ?? null;

  const resetForm = () => {
    setEditingWorklogId(null);
    setFormState(createDefaultFormState());
  };

  const handleEditWorklog = (worklog: TaskWorklogResponse) => {
    if (!canLogCurrentTask) {
      toast.warning(
        'Only the assigned member can edit worklogs on this task or subtask.',
      );
      return;
    }
    setEditingWorklogId(worklog.id);
    setFormState(toEditableFormState(worklog));
  };

  const handleDeleteWorklog = async (worklog: TaskWorklogResponse) => {
    if (!taskId) return;
    if (!canLogCurrentTask) {
      toast.warning(
        'Only the assigned member can delete worklogs on this task or subtask.',
      );
      return;
    }

    const confirmed = await confirm({
      title: t('confirmDelete.title'),
      description: t('confirmDelete.description', {
        minutes: formatMinutes(worklog.durationMinutes),
        date: worklog.workDate,
      }),
      confirmText: commonT('delete'),
      cancelText: commonT('cancel'),
      destructive: true,
    });

    if (!confirmed) return;

    const result = await deleteWorklogMutation.mutateAsync({
      projectId,
      taskId,
      worklogId: worklog.id,
      syncReportDates: [worklog.workDate],
    });

    if (!result.ok) {
      toast.danger(result.error.message || t('toasts.deleteFailed'));
      return;
    }

    toast.success(t('toasts.deleted'));
    if (editingWorklogId === worklog.id) {
      resetForm();
    }
  };

  const handleRefresh = () => {
    const rawQuery = worklogsQuery.raw as { refetch?: () => Promise<unknown> };
    void rawQuery.refetch?.();
  };

  const handleSubmitWorklog = async () => {
    if (!taskId) return;
    if (!assignedUserId) {
      toast.warning('Assign this task or subtask before logging work.');
      return;
    }
    if (!canLogCurrentTask) {
      toast.warning('Only the assigned member can log work on this task or subtask.');
      return;
    }
    if (!formState.workDate) {
      toast.warning(t('validation.workDateRequired'));
      return;
    }

    const trimmedDescription = formState.description.trim();
    const progressPercent =
      formState.progressPercent.trim().length > 0
        ? Number(formState.progressPercent)
        : undefined;

    if (
      progressPercent !== undefined &&
      (!Number.isFinite(progressPercent) || progressPercent < 0 || progressPercent > 100)
    ) {
      toast.warning(t('validation.progressPercent'));
      return;
    }

    let payload: CreateTaskWorklogRequest | UpdateTaskWorklogRequest = {
      workDate: formState.workDate,
      description: trimmedDescription || undefined,
      progressPercent,
      isBlocker: formState.isBlocker,
    };

    if (canLogTimeForOthers && assignedUserId !== currentUserId) {
      payload.userId = assignedUserId;
    }

    if (formState.mode === 'duration') {
      const durationMinutes = Number(formState.durationMinutes);
      if (
        !Number.isFinite(durationMinutes) ||
        durationMinutes < 1 ||
        durationMinutes > 1440
      ) {
        toast.warning('Duration must be between 1 and 1440 minutes.');
        return;
      }

      payload = {
        ...payload,
        durationMinutes,
        startedAt: editingWorklogId ? null : undefined,
        endedAt: editingWorklogId ? null : undefined,
      };
    } else {
      if (!formState.startedAt || !formState.endedAt) {
        toast.warning(t('validation.timeRequired'));
        return;
      }

      const startedAt = buildIsoDateTime(formState.workDate, formState.startedAt);
      const endedAt = buildIsoDateTime(formState.workDate, formState.endedAt);

      if (!startedAt || !endedAt) {
        toast.warning(t('validation.invalidTimeRange'));
        return;
      }

      if (new Date(endedAt).getTime() <= new Date(startedAt).getTime()) {
        toast.warning(t('validation.endTimeAfterStart'));
        return;
      }

      payload = {
        ...payload,
        startedAt,
        endedAt,
        durationMinutes: editingWorklogId ? null : undefined,
      };
    }

    const result = editingWorklogId
      ? await updateWorklogMutation.mutateAsync({
          projectId,
          taskId,
          worklogId: editingWorklogId,
          body: payload as UpdateTaskWorklogRequest,
          syncReportDates: [
            editingWorklog?.workDate ?? '',
            (payload.workDate as string | undefined) ?? formState.workDate,
          ],
        })
      : await createWorklogMutation.mutateAsync({
          projectId,
          taskId,
          body: payload as CreateTaskWorklogRequest,
          syncReportDates: [formState.workDate],
        });

    if (!result.ok) {
      toast.danger(result.error.message || t('toasts.saveFailed'));
      return;
    }

    toast.success(editingWorklogId ? t('toasts.updated') : t('toasts.added'));
    resetForm();
  };

  const isSavingWorklog =
    createWorklogMutation.isPending || updateWorklogMutation.isPending;

  return (
    <>
      {confirmDialog}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{t('title')}</p>
            <p className="text-muted-foreground text-xs">
              {t('totalLogged', { value: formatMinutes(task?.actualLoggedMinutes) })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4 rounded-md border p-3">
          {editingWorklog?.isSubmitted ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>This worklog has already been submitted.</AlertTitle>
              <AlertDescription>
                Backend still allows edits, but this entry is already linked to a daily
                report.
              </AlertDescription>
            </Alert>
          ) : null}

          {canLogCurrentTask ? (
            <div className="bg-muted/20 space-y-4 rounded-md p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {editingWorklogId ? 'Edit worklog' : 'Add worklog'}
                </p>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {editingWorklogId ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetForm}
                      disabled={isSavingWorklog}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleSubmitWorklog()}
                    disabled={isSavingWorklog}
                    className="min-w-[130px]"
                  >
                    {isSavingWorklog ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : editingWorklogId ? (
                      <Save className="mr-2 h-4 w-4" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    {editingWorklogId ? 'Save changes' : 'Add worklog'}
                  </Button>
                </div>
              </div>

              <div className="grid items-end gap-3 md:grid-cols-2 lg:grid-cols-[160px_minmax(220px,1fr)_140px_140px_auto]">
                <div className="space-y-1.5">
                  <Label htmlFor="task-worklog-date" className="text-xs">
                    Work date
                  </Label>
                  <DatePicker
                    id="task-worklog-date"
                    value={formState.workDate}
                    onChange={(value) =>
                      setFormState((previous) => ({
                        ...previous,
                        workDate: value,
                      }))
                    }
                    disabled={isSavingWorklog}
                    placeholder="Select date"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Log type</Label>
                  <RadioGroup
                    value={formState.mode}
                    onValueChange={(value) =>
                      setFormState((previous) => ({
                        ...previous,
                        mode: value as WorklogMode,
                      }))
                    }
                    className="bg-background flex h-9 flex-wrap items-center gap-3 rounded-md border px-3"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="duration" id="task-worklog-mode-duration" />
                      <Label htmlFor="task-worklog-mode-duration" className="text-sm">
                        Duration
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="time_range" id="task-worklog-mode-range" />
                      <Label htmlFor="task-worklog-mode-range" className="text-sm">
                        Time range
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {formState.mode === 'duration' ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="task-worklog-duration" className="text-xs">
                      Minutes
                    </Label>
                    <Input
                      id="task-worklog-duration"
                      type="number"
                      min="1"
                      max="1440"
                      value={formState.durationMinutes}
                      onChange={(event) =>
                        setFormState((previous) => ({
                          ...previous,
                          durationMinutes: event.target.value,
                        }))
                      }
                      disabled={isSavingWorklog}
                      placeholder="90"
                      className="h-9"
                    />
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:col-span-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="task-worklog-started-at" className="text-xs">
                        Start
                      </Label>
                      <Input
                        id="task-worklog-started-at"
                        type="time"
                        value={formState.startedAt}
                        onChange={(event) =>
                          setFormState((previous) => ({
                            ...previous,
                            startedAt: event.target.value,
                          }))
                        }
                        disabled={isSavingWorklog}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="task-worklog-ended-at" className="text-xs">
                        End
                      </Label>
                      <Input
                        id="task-worklog-ended-at"
                        type="time"
                        value={formState.endedAt}
                        onChange={(event) =>
                          setFormState((previous) => ({
                            ...previous,
                            endedAt: event.target.value,
                          }))
                        }
                        disabled={isSavingWorklog}
                        className="h-9"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="task-worklog-progress" className="text-xs">
                    Progress
                  </Label>
                  <Input
                    id="task-worklog-progress"
                    type="number"
                    min="0"
                    max="100"
                    value={formState.progressPercent}
                    onChange={(event) =>
                      setFormState((previous) => ({
                        ...previous,
                        progressPercent: event.target.value,
                      }))
                    }
                    disabled={isSavingWorklog}
                    placeholder="0 - 100"
                    className="h-9"
                  />
                </div>

                <label className="bg-background flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium whitespace-nowrap">
                  <Checkbox
                    checked={formState.isBlocker}
                    onCheckedChange={(checked) =>
                      setFormState((previous) => ({
                        ...previous,
                        isBlocker: checked === true,
                      }))
                    }
                    disabled={isSavingWorklog}
                  />
                  Blocker
                </label>
              </div>

              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="task-worklog-description" className="text-xs">
                    Description
                  </Label>
                  <Textarea
                    id="task-worklog-description"
                    className="min-h-20"
                    value={formState.description}
                    onChange={(event) =>
                      setFormState((previous) => ({
                        ...previous,
                        description: event.target.value,
                      }))
                    }
                    disabled={isSavingWorklog}
                    placeholder="Describe what was done in this work session..."
                  />
                </div>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Worklog is limited to the assignee.</AlertTitle>
              <AlertDescription>
                {assignedUserId
                  ? 'Only the assigned member can log work on this task or subtask.'
                  : 'Assign this task or subtask before logging work.'}
              </AlertDescription>
            </Alert>
          )}

          <div className="border-t" />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Logged entries</p>
              <Badge variant="outline">{sortedWorklogs.length}</Badge>
            </div>

            {worklogsQuery.isPending ? (
              <p className="text-muted-foreground text-sm">Loading worklogs...</p>
            ) : worklogsQuery.isError ? (
              <p className="text-destructive text-sm">
                {worklogsQuery.error?.message ?? 'Failed to load worklogs.'}
              </p>
            ) : sortedWorklogs.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No worklogs have been logged yet.
              </p>
            ) : (
              <div className="space-y-3">
                {sortedWorklogs.map((worklog) => {
                  const displayName =
                    memberLabelById.get(worklog.userId) ??
                    worklog.userDisplayName?.trim() ??
                    userDisplayNameById?.get(worklog.userId) ??
                    worklog.userEmail ??
                    worklog.userId;

                  return (
                    <div key={worklog.id} className="space-y-3 rounded-md border p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{worklog.workDate}</Badge>
                            <Badge variant="outline">
                              {formatMinutes(worklog.durationMinutes)}
                            </Badge>
                            {worklog.isSubmitted ? (
                              <Badge
                                variant="outline"
                                className="border-amber-500/50 text-amber-700"
                              >
                                Submitted
                              </Badge>
                            ) : null}
                            {worklog.isBlocker ? (
                              <Badge variant="destructive">Blocker</Badge>
                            ) : null}
                            {worklog.progressPercent != null ? (
                              <Badge variant="outline">
                                {worklog.progressPercent}% progress
                              </Badge>
                            ) : null}
                          </div>

                          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                            <Avatar className="h-5 w-5">
                              {(() => {
                                const avatarUrl =
                                  memberAvatarById.get(worklog.userId) ??
                                  (
                                    worklog as TaskWorklogResponse & {
                                      userAvatarUrl?: string | null;
                                      avatarUrl?: string | null;
                                    }
                                  ).userAvatarUrl ??
                                  (
                                    worklog as TaskWorklogResponse & {
                                      userAvatarUrl?: string | null;
                                      avatarUrl?: string | null;
                                    }
                                  ).avatarUrl ??
                                  undefined;
                                return avatarUrl ? (
                                  <AvatarImage src={avatarUrl} alt={displayName} />
                                ) : null;
                              })()}
                              <AvatarFallback className="text-[10px]">
                                {displayName ? (
                                  getInitials(displayName)
                                ) : (
                                  <UserRound className="h-3 w-3" />
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <span>{displayName}</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="h-3.5 w-3.5" />
                              {worklog.startedAt && worklog.endedAt
                                ? `${toDateTimeLabel(worklog.startedAt)} - ${toDateTimeLabel(worklog.endedAt)}`
                                : 'Duration-only entry'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditWorklog(worklog)}
                            disabled={isSavingWorklog || deleteWorklogMutation.isPending}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void handleDeleteWorklog(worklog)}
                            disabled={isSavingWorklog || deleteWorklogMutation.isPending}
                          >
                            {deleteWorklogMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm whitespace-pre-wrap">
                        {worklog.description?.trim() || 'No description provided.'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
