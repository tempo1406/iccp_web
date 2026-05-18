'use client';

import { toast } from '@/lib/toast';
import type { TaskResponse } from '../services/projects.service';
import type { StatusOption } from '../components/project-task-detail-dialog.types';
import { isTodoStatusName } from '../components/project-task-detail-dialog.utils';

type MutationResult<TData = unknown> = {
  ok: boolean;
  data?: TData;
  error?: { message?: string };
};

interface MutationLike<TInput> {
  mutateAsync: (input: TInput) => Promise<unknown>;
}

interface UseProjectTaskDetailSubtaskActionsParams {
  projectId: string;
  parentTaskId?: string | null;
  statuses: StatusOption[];
  newSubtaskTitle: string;
  setNewSubtaskTitle: (value: string) => void;
  editingSubtaskId: string | null;
  setEditingSubtaskId: (value: string | null) => void;
  editingSubtaskTitle: string;
  setEditingSubtaskTitle: (value: string) => void;
  createTaskMutation: MutationLike<{
    projectId: string;
    body: {
      title: string;
      statusId: string;
      parentTaskId: string;
      assignedTo: null;
    };
  }>;
  updateTaskMutation: MutationLike<{
    projectId: string;
    taskId: string;
    body: {
      title?: string;
      statusId?: string;
      assignedTo?: string | null;
      description?: string;
      dueDate?: string | null;
    };
  }>;
  deleteTaskMutation: MutationLike<{
    projectId: string;
    taskId: string;
  }>;
}

export function useProjectTaskDetailSubtaskActions({
  projectId,
  parentTaskId,
  statuses,
  newSubtaskTitle,
  setNewSubtaskTitle,
  editingSubtaskId,
  setEditingSubtaskId,
  editingSubtaskTitle,
  setEditingSubtaskTitle,
  createTaskMutation,
  updateTaskMutation,
  deleteTaskMutation,
}: UseProjectTaskDetailSubtaskActionsParams) {
  const handleDeleteSubtask = async (subtaskId: string) => {
    const result = (await deleteTaskMutation.mutateAsync({
      projectId,
      taskId: subtaskId,
    })) as MutationResult;

    if (!result.ok) {
      toast.danger(result.error?.message || 'Failed to delete subtask.');
      return;
    }

    if (editingSubtaskId === subtaskId) {
      setEditingSubtaskId(null);
      setEditingSubtaskTitle('');
    }
  };

  const handleCreateSubtask = async () => {
    if (!parentTaskId) return;
    const title = newSubtaskTitle.trim();
    if (!title) return;

    const todoStatusId =
      statuses.find((status) => isTodoStatusName(status.name))?.id ?? statuses[0]?.id;
    if (!todoStatusId) {
      toast.danger('No status available for creating subtask.');
      return;
    }

    const result = (await createTaskMutation.mutateAsync({
      projectId,
      body: {
        title,
        statusId: todoStatusId,
        parentTaskId,
        assignedTo: null,
      },
    })) as MutationResult<TaskResponse>;
    if (!result.ok || !result.data) {
      toast.danger(result.error?.message || 'Failed to create subtask.');
      return;
    }

    if (result.data.assignedTo) {
      const unassignResult = (await updateTaskMutation.mutateAsync({
        projectId,
        taskId: result.data.id,
        body: { assignedTo: null },
      })) as MutationResult;
      if (!unassignResult.ok) {
        toast.warning(
          unassignResult.error?.message ||
            'Subtask was created, but failed to set assignee as unassigned.',
        );
      }
    }

    setNewSubtaskTitle('');
  };

  const handleUpdateSubtask = async (
    subtaskId: string,
    body: {
      title?: string;
      statusId?: string;
      assignedTo?: string | null;
      description?: string;
      dueDate?: string | null;
    },
    fallbackMessage: string,
  ) => {
    const result = (await updateTaskMutation.mutateAsync({
      projectId,
      taskId: subtaskId,
      body,
    })) as MutationResult;
    if (!result.ok) {
      toast.danger(result.error?.message || fallbackMessage);
      return false;
    }
    return true;
  };

  const handleRenameSubtask = async (subtaskId: string) => {
    const title = editingSubtaskTitle.trim();
    if (!title) return;

    const isSuccess = await handleUpdateSubtask(
      subtaskId,
      { title },
      'Failed to update subtask title.',
    );
    if (isSuccess) {
      setEditingSubtaskId(null);
      setEditingSubtaskTitle('');
    }
  };

  const handleUpdateSubtaskAssignee = async (subtaskId: string, value: string) => {
    await handleUpdateSubtask(
      subtaskId,
      { assignedTo: value === 'unassigned' ? null : value },
      'Failed to update subtask assignee.',
    );
  };

  const handleUpdateSubtaskStatus = async (subtaskId: string, statusId: string) => {
    await handleUpdateSubtask(
      subtaskId,
      { statusId },
      'Failed to update subtask status.',
    );
  };

  return {
    handleDeleteSubtask,
    handleCreateSubtask,
    handleRenameSubtask,
    handleUpdateSubtaskAssignee,
    handleUpdateSubtaskStatus,
  };
}
