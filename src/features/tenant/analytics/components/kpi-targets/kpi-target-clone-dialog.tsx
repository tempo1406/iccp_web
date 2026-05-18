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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrganizationMembersData } from '@/features/tenant/organization-members/hooks/use-organization-members';
import { useProjectList } from '@/features/tenant/projects/query/use-project-core';
import type { CloneKpiTargetBody } from '../../types/kpi.types';
import type { MemberDto } from '@/services/organizations/types';

const PROJECT_ALL = '__all__';

type Translator = (key: string, values?: Record<string, string | number>) => string;

function buildCloneSchema(t: Translator) {
  return z
    .object({
      fromPeriodStart: z.string().min(1, t('validation.sourcePeriodStartRequired')),
      toPeriodStart: z.string().min(1, t('validation.targetPeriodStartRequired')),
      projectId: z.string().default(''),
      userIds: z.array(z.string()).default([]),
    })
    .superRefine((value, ctx) => {
      if (value.fromPeriodStart === value.toPeriodStart) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['toPeriodStart'],
          message: t('validation.targetPeriodDifferent'),
        });
      }
    });
}

type CloneFormValues = z.infer<ReturnType<typeof buildCloneSchema>>;

interface KpiTargetCloneDialogProps {
  open: boolean;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onClone: (body: CloneKpiTargetBody) => Promise<boolean>;
}

function memberDisplayName(member: MemberDto) {
  const name = [member.firstName, member.lastName].filter(Boolean).join(' ').trim();
  return name || member.email || member.userId;
}

export function KpiTargetCloneDialog({
  open,
  isSubmitting = false,
  onOpenChange,
  onClone,
}: KpiTargetCloneDialogProps) {
  const t = useTranslations('analytics');
  const cloneSchema = useMemo(() => buildCloneSchema(t), [t]);
  const form = useForm<CloneFormValues>({
    resolver: zodResolver(cloneSchema) as any,
    defaultValues: {
      fromPeriodStart: '',
      toPeriodStart: '',
      projectId: '',
      userIds: [],
    },
  });
  const members = useOrganizationMembersData({ page: 1, limit: 1000, isActive: true });
  const projects = useProjectList({ page: 1, limit: 1000 });
  const selectedUserIds = useWatch({ control: form.control, name: 'userIds' });
  const projectId = useWatch({ control: form.control, name: 'projectId' });
  const fromPeriodStart = useWatch({ control: form.control, name: 'fromPeriodStart' });
  const toPeriodStart = useWatch({ control: form.control, name: 'toPeriodStart' });

  useEffect(() => {
    if (open) {
      form.reset({ fromPeriodStart: '', toPeriodStart: '', projectId: '', userIds: [] });
    }
  }, [form, open]);

  const memberOptions = useMemo(
    () =>
      members.members.map((member) => ({
        id: member.userId,
        label: memberDisplayName(member),
        description: member.email,
      })),
    [members.members],
  );

  const fieldError = (name: keyof CloneFormValues) =>
    form.formState.errors[name]?.message?.toString();

  const submit = form.handleSubmit(async (values: CloneFormValues) => {
    const body: CloneKpiTargetBody = {
      fromPeriodStart: values.fromPeriodStart,
      toPeriodStart: values.toPeriodStart,
    };

    if (values.projectId) body.projectId = values.projectId;
    if (values.userIds.length > 0) body.userIds = values.userIds;

    const success = await onClone(body);
    if (success) onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('kpiTargetClone.title')}</DialogTitle>
          <DialogDescription>
            {t('kpiTargetClone.description')}
          </DialogDescription>
        </DialogHeader>

        <form id="kpi-target-clone-form" onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('kpiTargetClone.fromPeriodStart')}</Label>
              <DatePicker
                value={fromPeriodStart}
                disabled={isSubmitting}
                onChange={(value) =>
                  form.setValue('fromPeriodStart', value, { shouldValidate: true })
                }
              />
              {fieldError('fromPeriodStart') ? (
                <p className="text-destructive text-xs">{fieldError('fromPeriodStart')}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>{t('kpiTargetClone.toPeriodStart')}</Label>
              <DatePicker
                value={toPeriodStart}
                disabled={isSubmitting}
                onChange={(value) =>
                  form.setValue('toPeriodStart', value, { shouldValidate: true })
                }
              />
              {fieldError('toPeriodStart') ? (
                <p className="text-destructive text-xs">{fieldError('toPeriodStart')}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('kpiTargetClone.projectFilter')}</Label>
            <Select
              value={projectId || PROJECT_ALL}
              disabled={isSubmitting}
              onValueChange={(value) =>
                form.setValue('projectId', value === PROJECT_ALL ? '' : value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PROJECT_ALL}>{t('kpiTargetClone.allProjectsAndOrg')}</SelectItem>
                {(projects.data ?? []).map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('kpiTargetClone.userFilter')}</Label>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
              {memberOptions.length === 0 ? (
                <p className="text-muted-foreground p-2 text-sm">{t('kpiTargetClone.noOrganizationMembers')}</p>
              ) : (
                memberOptions.map((member) => {
                  const checked = selectedUserIds.includes(member.id);
                  return (
                    <label
                      key={member.id}
                      className="hover:bg-muted flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        disabled={isSubmitting}
                        onCheckedChange={(nextChecked) => {
                          if (nextChecked) {
                            form.setValue('userIds', [...selectedUserIds, member.id]);
                            return;
                          }
                          form.setValue(
                            'userIds',
                            selectedUserIds.filter((id) => id !== member.id),
                          );
                        }}
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{member.label}</span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {member.description}
                        </span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {t('kpiTargetClone.userFilterHint')}
            </p>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            {t('kpiTargetClone.cancel')}
          </Button>
          <Button type="submit" form="kpi-target-clone-form" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('kpiTargetClone.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
