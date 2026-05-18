'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from '@/lib/toast';
import { useCreateProject } from '../query/use-projects';
import type {
  CreateProjectRequest,
  ProjectPriority,
  ProjectStatus,
} from '../services/projects.service';

export type ProjectBudgetCurrency = 'USD' | 'VND';

export interface CreateProjectFormState {
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

export type CreateProjectFormErrors = Partial<Record<keyof CreateProjectFormState, string>>;

export const BUDGET_CURRENCY_OPTIONS: Array<{
  value: ProjectBudgetCurrency;
  label: string;
}> = [
  { value: 'VND', label: 'VND' },
  { value: 'USD', label: 'USD' },
];

const INITIAL_FORM_STATE: CreateProjectFormState = {
  name: '',
  description: '',
  status: 'planning',
  priority: 'medium',
  startDate: '',
  endDate: '',
  managerId: [],
  estimatedBudget: '',
  actualBudget: '',
  budgetCurrency: 'VND',
};

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
}

function validateForm(
  state: CreateProjectFormState,
  messages: {
    nameRequired: string;
    estimatedBudgetPositive: string;
    actualBudgetPositive: string;
    currencyInvalid: string;
    endDateAfterStart: string;
  },
): CreateProjectFormErrors {
  const errors: CreateProjectFormErrors = {};

  if (!state.name.trim()) {
    errors.name = messages.nameRequired;
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
    errors.budgetCurrency = messages.currencyInvalid;
  }

  if (state.startDate && state.endDate && state.endDate < state.startDate) {
    errors.endDate = messages.endDateAfterStart;
  }

  return errors;
}

function toCreateProjectPayload(state: CreateProjectFormState): CreateProjectRequest {
  return {
    name: state.name.trim(),
    description: state.description.trim() || undefined,
    status: state.status,
    priority: state.priority,
    startDate: state.startDate || undefined,
    endDate: state.endDate || undefined,
    managerId: state.managerId.length > 0 ? state.managerId : undefined,
    estimatedBudget: toOptionalNumber(state.estimatedBudget),
    actualBudget: toOptionalNumber(state.actualBudget),
    budgetCurrency: state.budgetCurrency,
  };
}

interface UseCreateProjectDialogParams {
  onOpenChange: (open: boolean) => void;
  onCreated?: (projectSlug: string) => void;
}

function resolveProjectSlug(project: { id: string; slug?: string | null }): string {
  const slug = typeof project.slug === 'string' ? project.slug.trim() : '';
  return slug || project.id;
}

export function useCreateProjectDialog({
  onOpenChange,
  onCreated,
}: UseCreateProjectDialogParams) {
  const t = useTranslations('project.createDialog');
  const validationT = useTranslations('project.detail.validation');
  const createProjectMutation = useCreateProject();
  const [formState, setFormState] = useState<CreateProjectFormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<CreateProjectFormErrors>({});
  const [submitError, setSubmitError] = useState('');

  const resetForm = () => {
    setFormState(INITIAL_FORM_STATE);
    setErrors({});
    setSubmitError('');
  };

  const setField = <K extends keyof CreateProjectFormState>(
    key: K,
    value: CreateProjectFormState[K],
  ) => {
    setFormState((previous) => ({ ...previous, [key]: value }));
    if (errors[key]) {
      setErrors((previous) => ({ ...previous, [key]: undefined }));
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && createProjectMutation.isPending) return;

    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');

    const validationErrors = validateForm(formState, {
      nameRequired: validationT('nameRequired'),
      estimatedBudgetPositive: validationT('estimatedBudgetPositive'),
      actualBudgetPositive: validationT('actualBudgetPositive'),
      currencyInvalid: t('validation.currencyInvalid'),
      endDateAfterStart: validationT('endDateAfterStart'),
    });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const result = await createProjectMutation.mutateAsync(
      toCreateProjectPayload(formState),
    );

    if (!result.ok) {
      const message = result.error.message || t('toasts.createFailed');
      setSubmitError(message);
      toast.danger(message);
      return;
    }

    toast.success(t('toasts.created'));
    onCreated?.(resolveProjectSlug(result.data));
    handleOpenChange(false);
  };

  return {
    formState,
    errors,
    submitError,
    isSubmitting: createProjectMutation.isPending,
    setField,
    resetForm,
    handleOpenChange,
    handleSubmit,
  };
}
