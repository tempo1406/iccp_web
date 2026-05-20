'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from '@/lib/toast';
import { useCreateProjectTask } from '../query/use-projects';
import type { CreateTaskRequest, TaskPriority } from '../services/projects.service';

export interface ProjectTaskStatusOption {
  id: string;
  name: string;
}

export interface CreateTaskFormState {
  title: string;
  description: string;
  priority: TaskPriority;
  statusId: string;
  assignedTo: string;
  dueDate: string;
  parentTaskId: string;
  estimatedPoint: string;
  estimatedHours: string;
}

export type CreateTaskFormErrors = Partial<Record<keyof CreateTaskFormState, string>>;

export const TASK_PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function toOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toIsoString(value: string): string | undefined {
  if (!value) return undefined;
  const normalizedValue = value.length <= 10 ? `${value}T00:00:00` : value;
  const parsed = new Date(normalizedValue);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function buildInitialFormState(defaultStatusId: string): CreateTaskFormState {
  return {
    title: '',
    description: '',
    priority: 'medium',
    statusId: defaultStatusId,
    assignedTo: '',
    dueDate: '',
    parentTaskId: '',
    estimatedPoint: '',
    estimatedHours: '',
  };
}

function validateForm(
  state: CreateTaskFormState,
  t: (key: string) => string,
): CreateTaskFormErrors {
  const errors: CreateTaskFormErrors = {};

  if (!state.title.trim()) {
    errors.title = t('validation.titleRequired');
  }

  if (!state.statusId) {
    errors.statusId = t('validation.statusRequired');
  }

  if (state.dueDate && !toIsoString(state.dueDate)) {
    errors.dueDate = t('validation.dueDateInvalid');
  }

  return errors;
}

function toCreateTaskPayload(state: CreateTaskFormState): CreateTaskRequest {
  return {
    title: state.title.trim(),
    description: state.description.trim() || undefined,
    priority: state.priority,
    statusId: state.statusId,
    assignedTo: state.assignedTo.trim() || null,
    dueDate: toIsoString(state.dueDate),
    parentTaskId: state.parentTaskId.trim() || undefined,
    estimatedPoint: toOptionalNumber(state.estimatedPoint),
    estimatedHours: toOptionalNumber(state.estimatedHours),
  };
}

interface UseCreateProjectTaskDialogParams {
  onOpenChange: (open: boolean) => void;
  projectId: string;
  statuses: ProjectTaskStatusOption[];
  defaultStatusId?: string;
}

export function useCreateProjectTaskDialog({
  onOpenChange,
  projectId,
  statuses,
  defaultStatusId,
}: UseCreateProjectTaskDialogParams) {
  const t = useTranslations('project.taskCreateDialog');
  const createTaskMutation = useCreateProjectTask();
  const resolvedDefaultStatusId = useMemo(() => {
    if (defaultStatusId && statuses.some((status) => status.id === defaultStatusId)) {
      return defaultStatusId;
    }
    return statuses[0]?.id ?? '';
  }, [defaultStatusId, statuses]);

  const [formState, setFormState] = useState<CreateTaskFormState>(
    buildInitialFormState(resolvedDefaultStatusId),
  );
  const [errors, setErrors] = useState<CreateTaskFormErrors>({});
  const [submitError, setSubmitError] = useState('');

  const hasStatuses = statuses.length > 0;

  const resetForm = () => {
    setFormState(buildInitialFormState(resolvedDefaultStatusId));
    setErrors({});
    setSubmitError('');
  };

  const setField = <K extends keyof CreateTaskFormState>(
    key: K,
    value: CreateTaskFormState[K],
  ) => {
    setFormState((previous) => ({ ...previous, [key]: value }));
    if (errors[key]) {
      setErrors((previous) => ({ ...previous, [key]: undefined }));
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && createTaskMutation.isPending) return;
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');

    const validationErrors = validateForm(formState, t);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    if (!projectId) {
      const message = t('toasts.projectIdMissing');
      setSubmitError(message);
      toast.danger(message);
      return;
    }

    const result = await createTaskMutation.mutateAsync({
      projectId,
      body: toCreateTaskPayload(formState),
    });

    if (!result.ok) {
      const message = result.error.message || t('toasts.createFailed');
      setSubmitError(message);
      toast.danger(message);
      return;
    }

    toast.success(t('toasts.created'));
    handleOpenChange(false);
  };

  return {
    formState,
    errors,
    submitError,
    hasStatuses,
    isSubmitting: createTaskMutation.isPending,
    setField,
    resetForm,
    handleOpenChange,
    handleSubmit,
  };
}
