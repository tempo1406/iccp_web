'use client';

import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrganizationMembersData } from '@/features/tenant/organization-members/hooks/use-organization-members';
import {
  isProtectedRole,
  useOrganizationRolesData,
} from '@/features/tenant/organization-roles/hooks/use-organization-roles';
import { useProjectList } from '@/features/tenant/projects/query/use-project-core';
import { useProjectMembers } from '@/features/tenant/projects/query/use-project-members';
import { useProjectRoles } from '@/features/tenant/projects/query/use-project-roles';
import type {
  KpiTargetPeriod,
  KpiTargetResponse,
  KpiTargetScopeType,
  KpiTargetStatus,
  UpdateKpiTargetBody,
  UpsertKpiTargetBody,
} from '../../types/kpi.types';
import type { MemberDto } from '@/services/organizations/types';
import type {
  ProjectMemberResponse,
  ProjectResponse,
  ProjectRoleResponse,
} from '@/services/projects';

const PROJECT_NONE = '__none__';

const optionalNumberString = z.string().trim();
type Translator = (key: string, values?: Record<string, string | number>) => string;

interface PeriodRangeFormValue {
  period: KpiTargetPeriod;
  periodStart: string;
  periodEnd: string;
}

interface IsoDateParts {
  year: number;
  month: number;
  day: number;
}

function parseIsoDateParts(value: string): IsoDateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function formatIsoDate(year: number, month: number, day: number) {
  return [
    year.toString().padStart(4, '0'),
    month.toString().padStart(2, '0'),
    day.toString().padStart(2, '0'),
  ].join('-');
}

function getLastDayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addMonthsToDateParts(value: IsoDateParts, monthOffset: number) {
  const targetMonthIndex = value.month - 1 + monthOffset;
  const targetYear = value.year + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12 + 1;
  const targetDay = Math.min(value.day, getLastDayOfMonth(targetYear, targetMonth));

  return { year: targetYear, month: targetMonth, day: targetDay };
}

function subtractOneDay(value: IsoDateParts) {
  const date = new Date(Date.UTC(value.year, value.month - 1, value.day));
  date.setUTCDate(date.getUTCDate() - 1);

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function getExpectedPeriodRange(period: KpiTargetPeriod, periodStart: string) {
  const start = parseIsoDateParts(periodStart);
  if (!start) return null;

  const monthCountByPeriod: Record<KpiTargetPeriod, number> = {
    MONTHLY: 1,
    QUARTERLY: 3,
    YEARLY: 12,
  };
  const labelByPeriod: Record<KpiTargetPeriod, string> = {
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    YEARLY: 'yearly',
  };

  const nextPeriodStart = addMonthsToDateParts(start, monthCountByPeriod[period]);
  const expectedEnd = subtractOneDay(nextPeriodStart);

  return {
    start: periodStart,
    end: formatIsoDate(expectedEnd.year, expectedEnd.month, expectedEnd.day),
    label: labelByPeriod[period],
  };
}

function getPeriodEndForStart(period: KpiTargetPeriod, periodStart: string) {
  return getExpectedPeriodRange(period, periodStart)?.end ?? '';
}

function validatePeriodRange(value: PeriodRangeFormValue, ctx: z.RefinementCtx, t: Translator) {
  if (!value.periodStart || !value.periodEnd) return;

  const periodStart = parseIsoDateParts(value.periodStart);
  const periodEnd = parseIsoDateParts(value.periodEnd);

  if (!periodStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['periodStart'],
      message: t('validation.periodStartValid'),
    });
    return;
  }

  if (!periodEnd) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['periodEnd'],
      message: t('validation.periodEndValid'),
    });
    return;
  }

  if (value.periodStart > value.periodEnd) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['periodEnd'],
      message: t('validation.periodEndAfterStart'),
    });
    return;
  }

  const expected = getExpectedPeriodRange(value.period, value.periodStart);
  if (!expected) return;

  if (value.periodEnd !== expected.end) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['periodEnd'],
      message: t('validation.periodEndExpected', {
        label: expected.label,
        start: value.periodStart,
        end: expected.end,
      }),
    });
  }
}

function buildFormSchema(t: Translator) {
  return z
    .object({
      scopeType: z.enum(['USER', 'ROLE', 'PROJECT_ROLE']),
      userIds: z.array(z.string()).default([]),
      roleIds: z.array(z.string()).default([]),
      projectId: z.string().default(''),
      period: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
      periodStart: z.string().min(1, t('validation.periodStartRequired')),
      periodEnd: z.string().min(1, t('validation.periodEndRequired')),
      targetScore: optionalNumberString,
      targetPointCompletionRate: optionalNumberString,
      targetOnTimeRate: optionalNumberString,
      targetOtHours: optionalNumberString,
      targetCompletedTasks: optionalNumberString,
      maxOverdueTasks: optionalNumberString,
      requireZeroOverdue: z.boolean().default(false),
      status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
      note: z.string().max(1000, t('validation.noteMax')).default(''),
    })
    .superRefine((value, ctx) => {
      validatePeriodRange(value, ctx, t);

      if (value.scopeType === 'USER' && value.userIds.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['userIds'],
          message: t('validation.selectAtLeastOneUser'),
        });
      }

      if (value.scopeType === 'ROLE' && value.roleIds.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['roleIds'],
          message: t('validation.selectAtLeastOneOrgRole'),
        });
      }

      if (value.scopeType === 'PROJECT_ROLE') {
        if (!value.projectId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['projectId'],
            message: t('validation.projectRequiredForProjectRole'),
          });
        }
        if (value.roleIds.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['roleIds'],
            message: t('validation.selectAtLeastOneProjectRole'),
          });
        }
      }

      validateNumber(value.targetScore, 0, 100, ctx, 'targetScore', t('validation.fieldLabel.targetScore'), t);
      validateNumber(
        value.targetPointCompletionRate,
        0,
        100,
        ctx,
        'targetPointCompletionRate',
        t('validation.fieldLabel.pointCompletion'),
        t,
      );
      validateNumber(
        value.targetOnTimeRate,
        0,
        100,
        ctx,
        'targetOnTimeRate',
        t('validation.fieldLabel.onTime'),
        t,
      );
      validateNumber(value.targetOtHours, 0, undefined, ctx, 'targetOtHours', t('validation.fieldLabel.ot'), t);
      validateNumber(
        value.targetCompletedTasks,
        0,
        undefined,
        ctx,
        'targetCompletedTasks',
        t('validation.fieldLabel.completedTasks'),
        t,
        true,
      );
      validateNumber(
        value.maxOverdueTasks,
        0,
        undefined,
        ctx,
        'maxOverdueTasks',
        t('validation.fieldLabel.maxOverdueTasks'),
        t,
        true,
      );

      if (
        !value.targetScore.trim() &&
        !value.targetPointCompletionRate.trim() &&
        !value.targetOnTimeRate.trim() &&
        !value.targetOtHours.trim() &&
        !value.targetCompletedTasks.trim() &&
        !value.maxOverdueTasks.trim() &&
        !value.requireZeroOverdue
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['targetScore'],
          message: t('kpiTargetForm.targetConfigError'),
        });
      }
    });
}

type KpiTargetFormValues = z.infer<ReturnType<typeof buildFormSchema>>;

interface PickableItem {
  id: string;
  label: string;
  description?: string | null;
}

interface KpiTargetFormDialogProps {
  open: boolean;
  target?: KpiTargetResponse | null;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (body: UpsertKpiTargetBody) => Promise<boolean>;
  onUpdate: (id: string, body: UpdateKpiTargetBody) => Promise<boolean>;
}

function validateNumber(
  rawValue: string,
  min: number,
  max: number | undefined,
  ctx: z.RefinementCtx,
  path: keyof KpiTargetFormValues,
  label: string,
  t: Translator,
  integer = false,
) {
  const trimmed = rawValue.trim();
  if (!trimmed) return;

  const value = Number(trimmed);
  if (Number.isNaN(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: t('validation.mustBeNumber', { label }),
    });
    return;
  }

  if (integer && !Number.isInteger(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: t('validation.mustBeInteger', { label }),
    });
  }

  if (value < min || (max !== undefined && value > max)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message:
        max === undefined
          ? t('validation.atLeast', { label, min })
          : t('validation.between', { label, min, max }),
    });
  }
}

function toOptionalNumber(value: string) {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : undefined;
}

function memberDisplayName(member: MemberDto) {
  const name = [member.firstName, member.lastName].filter(Boolean).join(' ').trim();
  return name || member.email || member.userId;
}

function projectMemberLabel(
  member: ProjectMemberResponse,
  memberByUserId: Map<string, MemberDto>,
) {
  const orgMember = memberByUserId.get(member.userId);
  if (orgMember) return memberDisplayName(orgMember);

  const source = member as ProjectMemberResponse & {
    fullName?: string | null;
    email?: string | null;
    user?: { fullName?: string | null; email?: string | null } | null;
  };

  return source.fullName || source.user?.fullName || source.email || source.user?.email || member.userId;
}

function targetToFormValues(target?: KpiTargetResponse | null): KpiTargetFormValues {
  return {
    scopeType: target?.scopeType ?? 'USER',
    userIds: target?.userId ? [target.userId] : [],
    roleIds: target?.roleId ? [target.roleId] : [],
    projectId: target?.projectId ?? '',
    period: target?.period ?? 'MONTHLY',
    periodStart: target?.periodStart ?? '',
    periodEnd: target?.periodEnd ?? '',
    targetScore: target?.targetScore?.toString() ?? '',
    targetPointCompletionRate: target?.targetPointCompletionRate?.toString() ?? '',
    targetOnTimeRate: target?.targetOnTimeRate?.toString() ?? '',
    targetOtHours: target?.targetOtHours?.toString() ?? '',
    targetCompletedTasks: target?.targetCompletedTasks?.toString() ?? '',
    maxOverdueTasks: target?.maxOverdueTasks?.toString() ?? '',
    requireZeroOverdue: target?.requireZeroOverdue ?? false,
    status: target?.status ?? 'ACTIVE',
    note: target?.note ?? '',
  };
}

function buildCreatePayload(values: KpiTargetFormValues): UpsertKpiTargetBody {
  const payload: UpsertKpiTargetBody = {
    scopeType: values.scopeType,
    period: values.period,
    periodStart: values.periodStart,
    periodEnd: values.periodEnd,
    requireZeroOverdue: values.requireZeroOverdue,
    status: values.status,
  };

  if (values.note.trim()) payload.note = values.note.trim();
  if (values.scopeType === 'USER') {
    payload.userIds = values.userIds;
    if (values.projectId) payload.projectId = values.projectId;
  }
  if (values.scopeType === 'ROLE') {
    payload.roleIds = values.roleIds;
  }
  if (values.scopeType === 'PROJECT_ROLE') {
    payload.roleIds = values.roleIds;
    payload.projectId = values.projectId;
  }

  appendMetricPayload(payload, values);
  return payload;
}

function buildUpdatePayload(values: KpiTargetFormValues): UpdateKpiTargetBody {
  const payload: UpdateKpiTargetBody = {
    requireZeroOverdue: values.requireZeroOverdue,
    status: values.status,
  };

  payload.note = values.note.trim();
  appendMetricPayload(payload, values);
  return payload;
}

function appendMetricPayload(
  payload: UpsertKpiTargetBody | UpdateKpiTargetBody,
  values: KpiTargetFormValues,
) {
  const shouldClearEmptyMetrics = !('scopeType' in payload);
  const targetScore = metricPayloadValue(values.targetScore, shouldClearEmptyMetrics);
  const targetPointCompletionRate = metricPayloadValue(
    values.targetPointCompletionRate,
    shouldClearEmptyMetrics,
  );
  const targetOnTimeRate = metricPayloadValue(values.targetOnTimeRate, shouldClearEmptyMetrics);
  const targetOtHours = metricPayloadValue(values.targetOtHours, shouldClearEmptyMetrics);
  const targetCompletedTasks = metricPayloadValue(
    values.targetCompletedTasks,
    shouldClearEmptyMetrics,
  );
  const maxOverdueTasks = metricPayloadValue(values.maxOverdueTasks, shouldClearEmptyMetrics);

  if (targetScore !== undefined) payload.targetScore = targetScore;
  if (targetPointCompletionRate !== undefined) {
    payload.targetPointCompletionRate = targetPointCompletionRate;
  }
  if (targetOnTimeRate !== undefined) payload.targetOnTimeRate = targetOnTimeRate;
  if (targetOtHours !== undefined) payload.targetOtHours = targetOtHours;
  if (targetCompletedTasks !== undefined) {
    payload.targetCompletedTasks = targetCompletedTasks;
  }
  if (maxOverdueTasks !== undefined) payload.maxOverdueTasks = maxOverdueTasks;
}

function metricPayloadValue(value: string, clearWhenEmpty: boolean) {
  const parsed = toOptionalNumber(value);
  if (parsed !== undefined) return parsed;
  return clearWhenEmpty ? null : undefined;
}

function ToggleList({
  items,
  selectedIds,
  disabled,
  emptyText,
  onChange,
}: {
  items: PickableItem[];
  selectedIds: string[];
  disabled?: boolean;
  emptyText: string;
  onChange: (ids: string[]) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
      {items.map((item) => {
        const checked = selectedIds.includes(item.id);
        return (
          <label
            key={item.id}
            className="hover:bg-muted flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm"
          >
            <Checkbox
              checked={checked}
              disabled={disabled}
              onCheckedChange={(nextChecked) => {
                if (nextChecked) {
                  onChange([...selectedIds, item.id]);
                  return;
                }
                onChange(selectedIds.filter((id) => id !== item.id));
              }}
            />
            <span className="min-w-0">
              <span className="block truncate font-medium">{item.label}</span>
              {item.description ? (
                <span className="text-muted-foreground block truncate text-xs">
                  {item.description}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function KpiTargetFormDialog({
  open,
  target,
  isSubmitting = false,
  onOpenChange,
  onCreate,
  onUpdate,
}: KpiTargetFormDialogProps) {
  const t = useTranslations('analytics');
  const isEdit = Boolean(target);
  const formSchema = useMemo(() => buildFormSchema(t), [t]);
  const targetConfigErrorText = t('kpiTargetForm.targetConfigError');
  const form = useForm<KpiTargetFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: targetToFormValues(target),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const scopeType = useWatch({ control: form.control, name: 'scopeType' });
  const projectId = useWatch({ control: form.control, name: 'projectId' });
  const period = useWatch({ control: form.control, name: 'period' });
  const periodStart = useWatch({ control: form.control, name: 'periodStart' });
  const periodEnd = useWatch({ control: form.control, name: 'periodEnd' });
  const selectedUserIds = useWatch({ control: form.control, name: 'userIds' });
  const selectedRoleIds = useWatch({ control: form.control, name: 'roleIds' });
  const requireZeroOverdue = useWatch({
    control: form.control,
    name: 'requireZeroOverdue',
  });
  const status = useWatch({ control: form.control, name: 'status' });
  const targetScore = useWatch({ control: form.control, name: 'targetScore' });
  const targetPointCompletionRate = useWatch({
    control: form.control,
    name: 'targetPointCompletionRate',
  });
  const targetOnTimeRate = useWatch({ control: form.control, name: 'targetOnTimeRate' });
  const targetOtHours = useWatch({ control: form.control, name: 'targetOtHours' });
  const targetCompletedTasks = useWatch({ control: form.control, name: 'targetCompletedTasks' });
  const maxOverdueTasks = useWatch({ control: form.control, name: 'maxOverdueTasks' });

  const orgMembers = useOrganizationMembersData({ page: 1, limit: 1000, isActive: true });
  const orgRoles = useOrganizationRolesData();
  const projects = useProjectList({ page: 1, limit: 1000 });
  const projectMembers = useProjectMembers(
    projectId,
    { page: 1, limit: 1000 },
    scopeType === 'USER' && Boolean(projectId),
  );
  const projectRoles = useProjectRoles(
    projectId,
    scopeType === 'PROJECT_ROLE' && Boolean(projectId),
  );

  useEffect(() => {
    if (open) {
      form.reset(targetToFormValues(target));
    }
  }, [form, open, target]);

  useEffect(() => {
    if (!open || (!periodStart && !periodEnd)) return;
    void form.trigger(['periodStart', 'periodEnd']);
  }, [form, open, period, periodStart, periodEnd]);

  useEffect(() => {
    if (!open || isEdit || !periodStart) return;

    const expectedPeriodEnd = getPeriodEndForStart(period, periodStart);
    if (!expectedPeriodEnd || periodEnd === expectedPeriodEnd) return;

    form.setValue('periodEnd', expectedPeriodEnd, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [form, isEdit, open, period, periodEnd, periodStart]);

  const memberByUserId = useMemo(() => {
    return new Map(orgMembers.members.map((member) => [member.userId, member]));
  }, [orgMembers.members]);

  const projectOptions = (projects.data ?? []) as ProjectResponse[];

  const userOptions = useMemo<PickableItem[]>(() => {
    if (scopeType === 'USER' && projectId && projectMembers.data) {
      return projectMembers.data.map((member) => ({
        id: member.userId,
        label: projectMemberLabel(member, memberByUserId),
        description: member.roleName ?? member.role ?? null,
      }));
    }

    return orgMembers.members.map((member) => ({
      id: member.userId,
      label: memberDisplayName(member),
      description: member.email,
    }));
  }, [memberByUserId, orgMembers.members, projectId, projectMembers.data, scopeType]);

  const roleOptions = useMemo<PickableItem[]>(() => {
    if (scopeType === 'PROJECT_ROLE') {
      return (projectRoles.data ?? []).map((role: ProjectRoleResponse) => ({
        id: role.id,
        label: role.name,
        description: role.description,
      }));
    }

    return orgRoles.roles
      .filter((role) => !isProtectedRole(role))
      .map((role) => ({
        id: role.id,
        label: role.name,
        description: role.description,
      }));
  }, [orgRoles.roles, projectRoles.data, scopeType]);

  const fieldError = (name: keyof KpiTargetFormValues) =>
    form.formState.errors[name]?.message?.toString();
  const hasTargetConfiguration = Boolean(
    targetScore?.trim() ||
      targetPointCompletionRate?.trim() ||
      targetOnTimeRate?.trim() ||
      targetOtHours?.trim() ||
      targetCompletedTasks?.trim() ||
      maxOverdueTasks?.trim() ||
      requireZeroOverdue,
  );
  const targetConfigError =
    !hasTargetConfiguration && fieldError('targetScore') === targetConfigErrorText
      ? targetConfigErrorText
      : null;

  const isUserListLoading =
    orgMembers.isPending || (scopeType === 'USER' && Boolean(projectId) && projectMembers.isPending);
  const isRoleListLoading =
    scopeType === 'PROJECT_ROLE' ? projectRoles.isPending : orgRoles.isPending;

  const handleScopeChange = (nextScope: KpiTargetScopeType) => {
    form.setValue('scopeType', nextScope);
    form.setValue('userIds', []);
    form.setValue('roleIds', []);
    if (nextScope === 'ROLE') {
      form.setValue('projectId', '');
    }
  };

  const submit = form.handleSubmit(async (values: KpiTargetFormValues) => {
    const success =
      isEdit && target
        ? await onUpdate(target.id, buildUpdatePayload(values))
        : await onCreate(buildCreatePayload(values));

    if (success) {
      onOpenChange(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('kpiTargetForm.updateTitle') : t('kpiTargetForm.createTitle')}</DialogTitle>
          <DialogDescription>
            {t('kpiTargetForm.description')}
          </DialogDescription>
        </DialogHeader>

        <form id="kpi-target-form" onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('kpiTargetForm.scope')}</Label>
              <Select
                value={scopeType}
                disabled={isEdit || isSubmitting}
                onValueChange={(value) => handleScopeChange(value as KpiTargetScopeType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">{t('kpiTargetForm.user')}</SelectItem>
                  <SelectItem value="ROLE">{t('kpiTargetForm.organizationRole')}</SelectItem>
                  <SelectItem value="PROJECT_ROLE">{t('kpiTargetForm.projectRole')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scopeType !== 'ROLE' ? (
              <div className="space-y-2 md:col-span-2">
                <Label>
                  {t('kpiTargetForm.project')} {scopeType === 'PROJECT_ROLE' ? <span className="text-destructive">*</span> : null}
                </Label>
                <Select
                  value={projectId || PROJECT_NONE}
                  disabled={isEdit || isSubmitting}
                  onValueChange={(value) => {
                    form.setValue('projectId', value === PROJECT_NONE ? '' : value);
                    form.setValue('userIds', []);
                    form.setValue('roleIds', []);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('kpiTargetForm.selectProject')} />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeType === 'USER' ? (
                      <SelectItem value={PROJECT_NONE}>{t('kpiTargetForm.noProjectScope')}</SelectItem>
                    ) : null}
                    {projectOptions.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldError('projectId') ? (
                  <p className="text-destructive text-xs">{fieldError('projectId')}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          {scopeType === 'USER' ? (
            <div className="space-y-2">
              <Label>{t('kpiTargetForm.users')} <span className="text-destructive">*</span></Label>
              <ToggleList
                items={userOptions}
                selectedIds={selectedUserIds}
                disabled={isEdit || isSubmitting || isUserListLoading}
                emptyText={
                  projectId
                    ? t('kpiTargetForm.noProjectMembers')
                    : t('kpiTargetForm.noOrganizationMembers')
                }
                onChange={(ids) => form.setValue('userIds', ids, { shouldValidate: true })}
              />
              {fieldError('userIds') ? (
                <p className="text-destructive text-xs">{fieldError('userIds')}</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>
                {scopeType === 'PROJECT_ROLE' ? t('kpiTargetForm.projectRoles') : t('kpiTargetForm.organizationRoles')}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <ToggleList
                items={roleOptions}
                selectedIds={selectedRoleIds}
                disabled={isEdit || isSubmitting || isRoleListLoading}
                emptyText={
                  scopeType === 'PROJECT_ROLE'
                    ? t('kpiTargetForm.selectProjectToLoadRoles')
                    : t('kpiTargetForm.noOrganizationRoles')
                }
                onChange={(ids) => form.setValue('roleIds', ids, { shouldValidate: true })}
              />
              {fieldError('roleIds') ? (
                <p className="text-destructive text-xs">{fieldError('roleIds')}</p>
              ) : null}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>
                {t('kpiTargetForm.period')} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={period}
                disabled={isEdit || isSubmitting}
                onValueChange={(value) =>
                  form.setValue('period', value as KpiTargetPeriod, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">{t('periodLabel.MONTHLY')}</SelectItem>
                  <SelectItem value="QUARTERLY">{t('periodLabel.QUARTERLY')}</SelectItem>
                  <SelectItem value="YEARLY">{t('periodLabel.YEARLY')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                {t('kpiTargetForm.periodHint')}
              </p>
            </div>
            <div className="space-y-2">
              <Label>
                {t('kpiTargetForm.periodStart')} <span className="text-destructive">*</span>
              </Label>
              <DatePicker
                value={periodStart}
                disabled={isEdit || isSubmitting}
                onChange={(value) =>
                  form.setValue('periodStart', value, { shouldValidate: true })
                }
              />
              {fieldError('periodStart') ? (
                <p className="text-destructive text-xs">{fieldError('periodStart')}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>
                {t('kpiTargetForm.periodEnd')} <span className="text-destructive">*</span>
              </Label>
              <DatePicker
                value={periodEnd}
                disabled={isEdit || isSubmitting}
                onChange={(value) => form.setValue('periodEnd', value, { shouldValidate: true })}
              />
              {fieldError('periodEnd') ? (
                <p className="text-destructive text-xs">{fieldError('periodEnd')}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['targetScore', t('kpiTargetForm.targetScore')],
              ['targetPointCompletionRate', t('kpiTargetForm.pointCompletion')],
              ['targetOnTimeRate', t('kpiTargetForm.onTimeRate')],
              ['targetOtHours', t('kpiTargetForm.otHours')],
              ['targetCompletedTasks', t('kpiTargetForm.completedTasks')],
              ['maxOverdueTasks', t('kpiTargetForm.maxOverdueTasks')],
            ].map(([name, label]) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={`kpi-${name}`}>{label}</Label>
                <Input
                  id={`kpi-${name}`}
                  type="number"
                  min="0"
                  step={name === 'targetCompletedTasks' || name === 'maxOverdueTasks' ? '1' : '0.1'}
                  inputMode={
                    name === 'targetCompletedTasks' || name === 'maxOverdueTasks'
                      ? 'numeric'
                      : 'decimal'
                  }
                  disabled={isSubmitting}
                  {...form.register(name as keyof KpiTargetFormValues)}
                />
                {fieldError(name as keyof KpiTargetFormValues) &&
                fieldError(name as keyof KpiTargetFormValues) !== targetConfigErrorText ? (
                  <p className="text-destructive text-xs">
                    {fieldError(name as keyof KpiTargetFormValues)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          {targetConfigError ? <p className="text-destructive text-xs">{targetConfigError}</p> : null}

          <div className="flex items-center gap-2 rounded-md border p-3">
            <Checkbox
              checked={requireZeroOverdue}
              disabled={isSubmitting}
              onCheckedChange={(checked) =>
                form.setValue('requireZeroOverdue', Boolean(checked), { shouldValidate: true })
              }
            />
            <div>
              <Label>{t('kpiTargetForm.requireZeroOverdue')}</Label>
              <p className="text-muted-foreground text-xs">
                {t('kpiTargetForm.requireZeroOverdueDescription')}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('kpiTargetForm.status')}</Label>
              <Select
                value={status}
                disabled={isSubmitting}
                onValueChange={(value) =>
                  form.setValue('status', value as KpiTargetStatus, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">{t('targetStatus.DRAFT')}</SelectItem>
                  <SelectItem value="ACTIVE">{t('targetStatus.ACTIVE')}</SelectItem>
                  <SelectItem value="ARCHIVED">{t('targetStatus.ARCHIVED')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="kpi-target-note">{t('kpiTargetForm.note')}</Label>
              <Input
                id="kpi-target-note"
                disabled={isSubmitting}
                maxLength={1000}
                placeholder={t('kpiTargetForm.notePlaceholder')}
                {...form.register('note')}
              />
              {fieldError('note') ? (
                <p className="text-destructive text-xs">{fieldError('note')}</p>
              ) : null}
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            {t('kpiTargetForm.cancel')}
          </Button>
          <Button type="submit" form="kpi-target-form" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEdit ? t('kpiTargetForm.updateSubmit') : t('kpiTargetForm.createSubmit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
