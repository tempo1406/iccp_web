'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeMutation, useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { DailyReportService } from '@/features/tenant/analytics/services/daily-report.service';
import { dailyReportKeys } from '@/features/tenant/analytics/query/daily-report-keys';
import { ProjectsService } from '../services/projects.service';
import type {
  AddCommentReactionRequest,
  AddTaskAttachmentRequest,
  AddTaskTagRequest,
  CreateTaskCommentRequest,
  CreateTaskRequest,
  DuplicateTaskRequest,
  MemberTaskProgressQuery,
  ProjectTaskListQuery,
  CreateTaskWorklogRequest,
  TaskResponse,
  TaskWorklogListQuery,
  UpdateTaskWorklogRequest,
  UpdateTaskCommentRequest,
  UpdateTaskRequest,
  UpdateTaskStatusRequest,
} from '../services/projects.service';
import { projectKeys } from './project-keys';

function invalidateTaskMemberProgress(
  tenantId: string | null | undefined,
  qc: ReturnType<typeof useQueryClient>,
  projectId: string,
) {
  void qc.invalidateQueries({
    queryKey: projectKeys.taskMemberProgressRoot(tenantId, projectId),
  });
}

async function syncDailyReportDraftsForDates(
  tenantId: string | null | undefined,
  qc: ReturnType<typeof useQueryClient>,
  ctx: ReturnType<typeof useServiceContext>,
  projectId: string,
  dates?: string[],
) {
  const normalizedDates = [...new Set((dates ?? []).map((date) => date.trim()).filter(Boolean))];
  if (normalizedDates.length === 0) {
    return;
  }

  await Promise.allSettled(
    normalizedDates.map((date) =>
      new DailyReportService(ctx).generateMyReport(projectId, { date }),
    ),
  );

  void qc.invalidateQueries({
    queryKey: dailyReportKeys.projectRoot(tenantId, projectId),
  });
}

function isProjectTaskListQueryKey(queryKey: readonly unknown[]) {
  return (
    queryKey.length === 5 &&
    queryKey[0] === 'projects' &&
    queryKey[3] === 'tasks' &&
    typeof queryKey[4] === 'object' &&
    queryKey[4] !== null &&
    !Array.isArray(queryKey[4])
  );
}

function updateTaskStatusInCollection(
  tasks: TaskResponse[] | undefined,
  taskId: string,
  statusId: string,
) {
  if (!Array.isArray(tasks)) return tasks;

  let hasChanged = false;
  const nextTasks = tasks.map((task) => {
    if (task.id !== taskId || task.statusId === statusId) return task;
    hasChanged = true;
    return {
      ...task,
      statusId,
    };
  });

  return hasChanged ? nextTasks : tasks;
}

function updateTaskStatusInDetail(
  task: TaskResponse | undefined,
  taskId: string,
  statusId: string,
) {
  if (!task || task.id !== taskId || task.statusId === statusId) return task;
  return {
    ...task,
    statusId,
  };
}

function toTaskUpdatePatch(body: UpdateTaskRequest): Partial<TaskResponse> | null {
  const patch: Partial<TaskResponse> = {};

  if ('title' in body) patch.title = body.title;
  if ('description' in body) patch.description = body.description;
  if ('priority' in body) patch.priority = body.priority;
  if ('statusId' in body) patch.statusId = body.statusId;
  if ('parentTaskId' in body) patch.parentTaskId = body.parentTaskId;
  if ('assignedTo' in body) patch.assignedTo = body.assignedTo;
  if ('startedAt' in body) patch.startedAt = body.startedAt;
  if ('dueDate' in body) patch.dueDate = body.dueDate;
  if ('completedAt' in body) patch.completedAt = body.completedAt;
  if ('actualStart' in body) patch.actualStart = body.actualStart;
  if ('actualEnd' in body) patch.actualEnd = body.actualEnd;
  if ('estimatedPoint' in body) patch.estimatedPoint = body.estimatedPoint;
  if ('estimatedHours' in body) patch.estimatedHours = body.estimatedHours;

  return Object.keys(patch).length > 0 ? patch : null;
}

function updateTaskInCollection(
  tasks: TaskResponse[] | undefined,
  taskId: string,
  patch: Partial<TaskResponse> | null,
) {
  if (!Array.isArray(tasks) || !patch) return tasks;

  let hasChanged = false;
  const nextTasks = tasks.map((task) => {
    if (task.id !== taskId) return task;
    hasChanged = true;
    return {
      ...task,
      ...patch,
    };
  });

  return hasChanged ? nextTasks : tasks;
}

function updateTaskInDetail(
  task: TaskResponse | undefined,
  taskId: string,
  patch: Partial<TaskResponse> | null,
) {
  if (!task || task.id !== taskId || !patch) return task;
  return {
    ...task,
    ...patch,
  };
}

// Task APIs
export function useProjectTasks(
  projectId: string,
  input: ProjectTaskListQuery = {},
  enabled = true,
) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: projectKeys.tasks(ctx.tenantId, projectId, input),
      queryFn: () => new ProjectsService(ctx).listTasks(projectId, input),
      enabled: Boolean(projectId) && enabled,
      staleTime: 30_000,
    }),
  );
}

export function useProjectTaskById(projectId: string, taskId: string) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: projectKeys.taskById(ctx.tenantId, projectId, taskId),
      queryFn: () => new ProjectsService(ctx).getTaskById(projectId, taskId),
      enabled: Boolean(projectId) && Boolean(taskId),
    }),
  );
}

export function useProjectTaskMemberProgress(
  projectId: string,
  input: MemberTaskProgressQuery = {},
) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: projectKeys.taskMemberProgress(ctx.tenantId, projectId, input),
      queryFn: () => new ProjectsService(ctx).listTaskMemberProgress(projectId, input),
      enabled: Boolean(projectId),
      staleTime: 30_000,
    }),
  );
}

export function useCreateProjectTask() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({ projectId, body }: { projectId: string; body: CreateTaskRequest }) =>
        new ProjectsService(ctx).createTask(projectId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.tasksRoot(ctx.tenantId, variables.projectId),
        });
        invalidateTaskMemberProgress(ctx.tenantId, qc, variables.projectId);
        void qc.invalidateQueries({
          queryKey: projectKeys.detailRoot(ctx.tenantId),
        });
      },
    }),
  );
}

export function useUpdateProjectTask() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        taskId,
        body,
      }: {
        projectId: string;
        taskId: string;
        body: UpdateTaskRequest;
      }) => new ProjectsService(ctx).updateTask(projectId, taskId, body),
      onMutate: async (variables) => {
        const taskDetailKey = projectKeys.taskById(
          ctx.tenantId,
          variables.projectId,
          variables.taskId,
        );
        const patch = toTaskUpdatePatch(variables.body);

        await qc.cancelQueries({
          queryKey: projectKeys.tasksRoot(ctx.tenantId, variables.projectId),
        });
        await qc.cancelQueries({
          queryKey: taskDetailKey,
        });

        const previousTaskLists = qc
          .getQueriesData<TaskResponse[]>({
            queryKey: projectKeys.tasksRoot(ctx.tenantId, variables.projectId),
          })
          .filter(
            (entry): entry is [readonly unknown[], TaskResponse[] | undefined] =>
              isProjectTaskListQueryKey(entry[0]),
          );
        const hadTaskDetail = qc.getQueryState(taskDetailKey) !== undefined;
        const previousTaskDetail = qc.getQueryData<TaskResponse>(taskDetailKey);

        for (const [queryKey] of previousTaskLists) {
          qc.setQueryData<TaskResponse[]>(queryKey, (current) =>
            updateTaskInCollection(current, variables.taskId, patch),
          );
        }

        if (hadTaskDetail) {
          qc.setQueryData<TaskResponse>(taskDetailKey, (current) =>
            updateTaskInDetail(current, variables.taskId, patch),
          );
        }

        return {
          hadTaskDetail,
          previousTaskDetail,
          previousTaskLists,
          taskDetailKey,
        };
      },
      onError: (_error, _variables, context) => {
        if (!context) return;

        for (const [queryKey, data] of context.previousTaskLists) {
          qc.setQueryData(queryKey, data);
        }

        if (context.hadTaskDetail) {
          qc.setQueryData(context.taskDetailKey, context.previousTaskDetail);
          return;
        }

        qc.removeQueries({
          queryKey: context.taskDetailKey,
          exact: true,
        });
      },
      onSettled: (_data, _error, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.tasksRoot(ctx.tenantId, variables.projectId),
        });
        invalidateTaskMemberProgress(ctx.tenantId, qc, variables.projectId);
        void qc.invalidateQueries({
          queryKey: projectKeys.taskById(ctx.tenantId, variables.projectId, variables.taskId),
        });
        void qc.invalidateQueries({
          queryKey: projectKeys.detailRoot(ctx.tenantId),
        });
      },
    }),
  );
}

export function useDuplicateProjectTask() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        taskId,
        body,
      }: {
        projectId: string;
        taskId: string;
        body: DuplicateTaskRequest;
      }) => new ProjectsService(ctx).duplicateTask(projectId, taskId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.tasksRoot(ctx.tenantId, variables.projectId),
        });
        invalidateTaskMemberProgress(ctx.tenantId, qc, variables.projectId);
        void qc.invalidateQueries({
          queryKey: projectKeys.detailRoot(ctx.tenantId),
        });
      },
    }),
  );
}

export function useUpdateProjectTaskStatus() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        taskId,
        body,
      }: {
        projectId: string;
        taskId: string;
        body: UpdateTaskStatusRequest;
      }) => new ProjectsService(ctx).updateTaskStatus(projectId, taskId, body),
      onMutate: async (variables) => {
        const taskDetailKey = projectKeys.taskById(
          ctx.tenantId,
          variables.projectId,
          variables.taskId,
        );
        const nextStatusId = variables.body.statusId;

        await qc.cancelQueries({
          queryKey: projectKeys.tasksRoot(ctx.tenantId, variables.projectId),
        });
        await qc.cancelQueries({
          queryKey: taskDetailKey,
        });

        const previousTaskLists = qc
          .getQueriesData<TaskResponse[]>({
            queryKey: projectKeys.tasksRoot(ctx.tenantId, variables.projectId),
          })
          .filter(
            (entry): entry is [readonly unknown[], TaskResponse[] | undefined] =>
              isProjectTaskListQueryKey(entry[0]),
          );
        const hadTaskDetail = qc.getQueryState(taskDetailKey) !== undefined;
        const previousTaskDetail = qc.getQueryData<TaskResponse>(taskDetailKey);

        for (const [queryKey] of previousTaskLists) {
          qc.setQueryData<TaskResponse[]>(queryKey, (current) =>
            updateTaskStatusInCollection(current, variables.taskId, nextStatusId),
          );
        }

        if (hadTaskDetail) {
          qc.setQueryData<TaskResponse>(taskDetailKey, (current) =>
            updateTaskStatusInDetail(current, variables.taskId, nextStatusId),
          );
        }

        return {
          hadTaskDetail,
          previousTaskDetail,
          previousTaskLists,
          taskDetailKey,
        };
      },
      onError: (_error, _variables, context) => {
        if (!context) return;

        for (const [queryKey, data] of context.previousTaskLists) {
          qc.setQueryData(queryKey, data);
        }

        if (context.hadTaskDetail) {
          qc.setQueryData(context.taskDetailKey, context.previousTaskDetail);
          return;
        }

        qc.removeQueries({
          queryKey: context.taskDetailKey,
          exact: true,
        });
      },
      onSettled: (_data, _error, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.tasksRoot(ctx.tenantId, variables.projectId),
        });
        invalidateTaskMemberProgress(ctx.tenantId, qc, variables.projectId);
        void qc.invalidateQueries({
          queryKey: projectKeys.taskById(ctx.tenantId, variables.projectId, variables.taskId),
        });
        void qc.invalidateQueries({
          queryKey: projectKeys.detailRoot(ctx.tenantId),
        });
      },
    }),
  );
}

export function useDeleteProjectTask() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({ projectId, taskId }: { projectId: string; taskId: string }) =>
        new ProjectsService(ctx).deleteTask(projectId, taskId),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.tasksRoot(ctx.tenantId, variables.projectId),
        });
        invalidateTaskMemberProgress(ctx.tenantId, qc, variables.projectId);
        void qc.invalidateQueries({
          queryKey: projectKeys.detailRoot(ctx.tenantId),
        });
      },
    }),
  );
}

export function useProjectTaskHistory(projectId: string, taskId: string) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: projectKeys.taskHistory(ctx.tenantId, projectId, taskId),
      queryFn: () => new ProjectsService(ctx).getTaskHistory(projectId, taskId),
      enabled: Boolean(projectId) && Boolean(taskId),
      staleTime: 30_000,
    }),
  );
}

export function useProjectTaskWorklogs(
  projectId: string,
  taskId: string,
  input: TaskWorklogListQuery = {},
  enabled = true,
) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: projectKeys.taskWorklogs(ctx.tenantId, projectId, taskId, input),
      queryFn: () => new ProjectsService(ctx).listTaskWorklogs(projectId, taskId, input),
      enabled: Boolean(projectId) && Boolean(taskId) && enabled,
      staleTime: 15_000,
    }),
  );
}

export function useCreateProjectTaskWorklog() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        taskId,
        body,
      }: {
        projectId: string;
        taskId: string;
        body: CreateTaskWorklogRequest;
        syncReportDates?: string[];
      }) => new ProjectsService(ctx).createTaskWorklog(projectId, taskId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.taskWorklogsRoot(
            ctx.tenantId,
            variables.projectId,
            variables.taskId,
          ),
        });
        void qc.invalidateQueries({
          queryKey: projectKeys.taskById(ctx.tenantId, variables.projectId, variables.taskId),
        });
        void qc.invalidateQueries({
          queryKey: projectKeys.tasksRoot(ctx.tenantId, variables.projectId),
        });
        void syncDailyReportDraftsForDates(
          ctx.tenantId,
          qc,
          ctx,
          variables.projectId,
          variables.syncReportDates,
        );
      },
    }),
  );
}

export function useUpdateProjectTaskWorklog() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        taskId,
        worklogId,
        body,
      }: {
        projectId: string;
        taskId: string;
        worklogId: string;
        body: UpdateTaskWorklogRequest;
        syncReportDates?: string[];
      }) =>
        new ProjectsService(ctx).updateTaskWorklog(projectId, taskId, worklogId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.taskWorklogsRoot(
            ctx.tenantId,
            variables.projectId,
            variables.taskId,
          ),
        });
        void qc.invalidateQueries({
          queryKey: projectKeys.taskById(ctx.tenantId, variables.projectId, variables.taskId),
        });
        void qc.invalidateQueries({
          queryKey: projectKeys.tasksRoot(ctx.tenantId, variables.projectId),
        });
        void syncDailyReportDraftsForDates(
          ctx.tenantId,
          qc,
          ctx,
          variables.projectId,
          variables.syncReportDates,
        );
      },
    }),
  );
}

export function useDeleteProjectTaskWorklog() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        taskId,
        worklogId,
      }: {
        projectId: string;
        taskId: string;
        worklogId: string;
        syncReportDates?: string[];
      }) => new ProjectsService(ctx).deleteTaskWorklog(projectId, taskId, worklogId),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.taskWorklogsRoot(
            ctx.tenantId,
            variables.projectId,
            variables.taskId,
          ),
        });
        void qc.invalidateQueries({
          queryKey: projectKeys.taskById(ctx.tenantId, variables.projectId, variables.taskId),
        });
        void qc.invalidateQueries({
          queryKey: projectKeys.tasksRoot(ctx.tenantId, variables.projectId),
        });
        void syncDailyReportDraftsForDates(
          ctx.tenantId,
          qc,
          ctx,
          variables.projectId,
          variables.syncReportDates,
        );
      },
    }),
  );
}

export function useProjectTaskTags(projectId: string, taskId: string) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: projectKeys.taskTags(ctx.tenantId, projectId, taskId),
      queryFn: () => new ProjectsService(ctx).listTaskTags(projectId, taskId),
      enabled: Boolean(projectId) && Boolean(taskId),
      staleTime: 30_000,
    }),
  );
}

export function useAddProjectTaskTag() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        taskId,
        body,
      }: {
        projectId: string;
        taskId: string;
        body: AddTaskTagRequest;
      }) => new ProjectsService(ctx).addTaskTag(projectId, taskId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.taskTags(ctx.tenantId, variables.projectId, variables.taskId),
        });
        void qc.invalidateQueries({
          queryKey: ['projects', ctx.tenantId, variables.projectId, 'tasks'],
        });
      },
    }),
  );
}

export function useDeleteProjectTaskTag() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        taskId,
        tagId,
      }: {
        projectId: string;
        taskId: string;
        tagId: string;
      }) => new ProjectsService(ctx).deleteTaskTag(projectId, taskId, tagId),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.taskTags(ctx.tenantId, variables.projectId, variables.taskId),
        });
        void qc.invalidateQueries({
          queryKey: ['projects', ctx.tenantId, variables.projectId, 'tasks'],
        });
      },
    }),
  );
}

export function useProjectTaskAttachments(projectId: string, taskId: string) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: projectKeys.taskAttachments(ctx.tenantId, projectId, taskId),
      queryFn: () => new ProjectsService(ctx).listTaskAttachments(projectId, taskId),
      enabled: Boolean(projectId) && Boolean(taskId),
      staleTime: 30_000,
    }),
  );
}

export function useAddProjectTaskAttachment() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        taskId,
        body,
      }: {
        projectId: string;
        taskId: string;
        body: AddTaskAttachmentRequest;
      }) => new ProjectsService(ctx).addTaskAttachmentWebLink(projectId, taskId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.taskAttachments(
            ctx.tenantId,
            variables.projectId,
            variables.taskId,
          ),
        });
      },
    }),
  );
}

export function useAddProjectTaskAttachmentWebLink() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        taskId,
        body,
      }: {
        projectId: string;
        taskId: string;
        body: AddTaskAttachmentRequest;
      }) => new ProjectsService(ctx).addTaskAttachmentWebLink(projectId, taskId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.taskAttachments(
            ctx.tenantId,
            variables.projectId,
            variables.taskId,
          ),
        });
      },
    }),
  );
}

export function useAddProjectTaskAttachmentLocalFile() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        taskId,
        file,
        folder,
      }: {
        projectId: string;
        taskId: string;
        file: File;
        folder?: string;
      }) => new ProjectsService(ctx).addTaskAttachmentFile(projectId, taskId, file, folder),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.taskAttachments(
            ctx.tenantId,
            variables.projectId,
            variables.taskId,
          ),
        });
      },
    }),
  );
}

export function useDeleteProjectTaskAttachment() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        taskId,
        attachmentId,
      }: {
        projectId: string;
        taskId: string;
        attachmentId: string;
      }) => new ProjectsService(ctx).deleteTaskAttachment(projectId, taskId, attachmentId),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.taskAttachments(
            ctx.tenantId,
            variables.projectId,
            variables.taskId,
          ),
        });
      },
    }),
  );
}

export function useProjectTaskComments(projectId: string, taskId: string) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: projectKeys.taskComments(ctx.tenantId, projectId, taskId),
      queryFn: () => new ProjectsService(ctx).listTaskComments(projectId, taskId),
      enabled: Boolean(projectId) && Boolean(taskId),
      staleTime: 15_000,
    }),
  );
}

export function useAddProjectTaskComment() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        taskId,
        body,
      }: {
        projectId: string;
        taskId: string;
        body: CreateTaskCommentRequest;
      }) => new ProjectsService(ctx).addTaskComment(projectId, taskId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.taskComments(ctx.tenantId, variables.projectId, variables.taskId),
        });
      },
    }),
  );
}

export function useUpdateProjectTaskComment() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        taskId,
        commentId,
        body,
      }: {
        projectId: string;
        taskId: string;
        commentId: string;
        body: UpdateTaskCommentRequest;
      }) => new ProjectsService(ctx).updateTaskComment(projectId, taskId, commentId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.taskComments(ctx.tenantId, variables.projectId, variables.taskId),
        });
      },
    }),
  );
}

export function useDeleteProjectTaskComment() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        taskId,
        commentId,
      }: {
        projectId: string;
        taskId: string;
        commentId: string;
      }) => new ProjectsService(ctx).deleteTaskComment(projectId, taskId, commentId),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.taskComments(ctx.tenantId, variables.projectId, variables.taskId),
        });
      },
    }),
  );
}

export function useToggleProjectTaskCommentThumbsUp() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        taskId,
        commentId,
      }: {
        projectId: string;
        taskId: string;
        commentId: string;
      }) => new ProjectsService(ctx).toggleTaskCommentThumbsUp(projectId, taskId, commentId),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.taskComments(ctx.tenantId, variables.projectId, variables.taskId),
        });
      },
    }),
  );
}

export function useAddProjectTaskCommentReaction() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        taskId,
        commentId,
        body,
      }: {
        projectId: string;
        taskId: string;
        commentId: string;
        body: AddCommentReactionRequest;
      }) => new ProjectsService(ctx).addTaskCommentReaction(projectId, taskId, commentId, body),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.taskComments(ctx.tenantId, variables.projectId, variables.taskId),
        });
      },
    }),
  );
}

export function useRemoveProjectTaskCommentReaction() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: ({
        projectId,
        taskId,
        commentId,
        reaction,
      }: {
        projectId: string;
        taskId: string;
        commentId: string;
        reaction: string;
      }) => new ProjectsService(ctx).removeTaskCommentReaction(projectId, taskId, commentId, reaction),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({
          queryKey: projectKeys.taskComments(ctx.tenantId, variables.projectId, variables.taskId),
        });
      },
    }),
  );
}
