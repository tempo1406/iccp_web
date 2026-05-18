'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useProjectSettings,
  useUpsertProjectSettings,
  useResetProjectSettings,
} from '../query/use-project-settings';
import { toast } from '@/lib/toast';
import {
  localTimeToOrgTime,
  orgTimeToLocalTime,
  VIETNAM_TIMEZONE,
  VIETNAM_TIMEZONE_LABEL,
} from '../utils/timezone-time';

interface FormValues {
  dailyEnabled: boolean;
  dailyTime?: string;
  dailyDays: number[];
  kpiWeightPointCompletion: number;
  kpiWeightOnTime: number;
  kpiWeightOtContribution: number;
  bonusEnabled: boolean;
  bonusOnTimeTask: number;
  bonusEarlyTaskHours: number;
  bonusEarlyTask: number;
  bonusZeroOverdue: number;
  bonusMaxCap: number;
  bonusOtPerEffectiveHour: number;
  maxPointPerTask?: number;
}

function FieldRow({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-4">
        <Label className="w-56 shrink-0 text-muted-foreground font-normal">{label}</Label>
        <div className="flex-1">{children}</div>
      </div>
      {error && <p className="text-xs text-destructive pl-60">{error}</p>}
    </div>
  );
}

interface Props {
  projectId: string;
}

export function ProjectSettingsTab({ projectId }: Props) {
  const t = useTranslations('project.settingsDialog');
  const q = useProjectSettings(projectId);
  const mutation = useUpsertProjectSettings(projectId);
  const resetMutation = useResetProjectSettings(projectId);
  const schema = useMemo(
    () =>
      z
        .object({
          dailyEnabled: z.boolean(),
          dailyTime: z.string().optional(),
          dailyDays: z.array(z.number().int().min(1).max(7)),
          kpiWeightPointCompletion: z.number().min(0).max(1),
          kpiWeightOnTime: z.number().min(0).max(1),
          kpiWeightOtContribution: z.number().min(0).max(1),
          bonusEnabled: z.boolean(),
          bonusOnTimeTask: z.number().min(0),
          bonusEarlyTaskHours: z.number().min(0),
          bonusEarlyTask: z.number().min(0),
          bonusZeroOverdue: z.number().min(0),
          bonusMaxCap: z.number().min(0),
          bonusOtPerEffectiveHour: z.number().min(0),
          maxPointPerTask: z.number().min(0).optional(),
        })
        .superRefine((value, ctx) => {
          if (!value.dailyEnabled) return;

          if (!value.dailyTime?.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('errors.dailyTimeRequired'),
              path: ['dailyTime'],
            });
          }

          if (value.dailyDays.length === 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('errors.dailyDaysRequired'),
              path: ['dailyDays'],
            });
          }
        }),
    [t],
  );
  const dailyDays = useMemo(
    () => [
      { value: 1, short: t('days.monShort') },
      { value: 2, short: t('days.tueShort') },
      { value: 3, short: t('days.wedShort') },
      { value: 4, short: t('days.thuShort') },
      { value: 5, short: t('days.friShort') },
      { value: 6, short: t('days.satShort') },
      { value: 7, short: t('days.sunShort') },
    ],
    [t],
  );
  const reminderTimeHelpText = t('dailyReport.reminderTimeHelp', {
    timezone: VIETNAM_TIMEZONE_LABEL,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      dailyEnabled: false,
      dailyTime: '',
      dailyDays: [1, 2, 3, 4, 5],
      kpiWeightPointCompletion: 0.4,
      kpiWeightOnTime: 0.4,
      kpiWeightOtContribution: 0.2,
      bonusEnabled: false,
      bonusOnTimeTask: 0,
      bonusEarlyTaskHours: 0,
      bonusEarlyTask: 0,
      bonusZeroOverdue: 0,
      bonusMaxCap: 0,
      bonusOtPerEffectiveHour: 0,
      maxPointPerTask: undefined,
    },
  });

  useEffect(() => {
    if (q.data) {
      reset({
        dailyEnabled: q.data.dailyEnabled,
        dailyTime: q.data.dailyTime ? orgTimeToLocalTime(q.data.dailyTime, VIETNAM_TIMEZONE) : '',
        dailyDays: q.data.dailyDays,
        kpiWeightPointCompletion: q.data.kpiWeightPointCompletion,
        kpiWeightOnTime: q.data.kpiWeightOnTime,
        kpiWeightOtContribution: q.data.kpiWeightOtContribution,
        bonusEnabled: q.data.bonusEnabled,
        bonusOnTimeTask: q.data.bonusOnTimeTask,
        bonusEarlyTaskHours: q.data.bonusEarlyTaskHours,
        bonusEarlyTask: q.data.bonusEarlyTask,
        bonusZeroOverdue: q.data.bonusZeroOverdue,
        bonusMaxCap: q.data.bonusMaxCap,
        bonusOtPerEffectiveHour: q.data.bonusOtPerEffectiveHour,
        maxPointPerTask: q.data.maxPointPerTask,
      });
    }
  }, [q.data, reset]);

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      dailyTime: values.dailyTime
        ? localTimeToOrgTime(values.dailyTime, VIETNAM_TIMEZONE)
        : values.dailyTime,
    };
    const result = await mutation.mutateAsync(payload);
    if (result.ok) {
      toast.success(t('toasts.saved'));
    } else {
      toast.danger(result.error.message);
    }
  }

  async function handleReset() {
    const result = await resetMutation.mutateAsync();
    if (result.ok) {
      toast.success(t('toasts.reset'));
    } else {
      toast.danger(result.error.message);
    }
  }

  if (q.isPending) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (q.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{q.error?.message ?? t('errors.loadFailed')}</AlertDescription>
      </Alert>
    );
  }

  const values = watch();
  const dailyEnabled = values.dailyEnabled;
  const bonusEnabled = values.bonusEnabled;
  const numberField = { valueAsNumber: true } as const;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('sections.dailyReportReminder')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FieldRow label={t('dailyReport.enable')}>
            <Switch
              checked={dailyEnabled}
              onCheckedChange={(v) => setValue('dailyEnabled', v, { shouldValidate: true })}
            />
          </FieldRow>
          {dailyEnabled && (
            <>
              <FieldRow label={t('dailyReport.reminderTime')} error={errors.dailyTime?.message}>
                <div className="flex flex-col items-start gap-1">
                  <Input type="time" className="w-32" {...register('dailyTime')} />
                  <span className="text-muted-foreground text-xs">{reminderTimeHelpText}</span>
                </div>
              </FieldRow>
              <FieldRow label={t('dailyReport.reminderDays')} error={errors.dailyDays?.message}>
                <div className="flex flex-wrap gap-2">
                  {dailyDays.map((day) => {
                    const isChecked = values.dailyDays.includes(day.value);
                    return (
                      <label
                        key={day.value}
                        className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                          isChecked ? 'border-primary/50 bg-primary/5' : ''
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const nextDays = checked
                              ? [...values.dailyDays, day.value]
                              : values.dailyDays.filter((value) => value !== day.value);
                            setValue('dailyDays', nextDays.sort((a, b) => a - b), {
                              shouldValidate: true,
                            });
                          }}
                        />
                        {day.short}
                      </label>
                    );
                  })}
                </div>
              </FieldRow>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('sections.kpiWeights')} ({t('states.organizationOverride')})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground mb-2">
            {t('kpi.description')}
          </p>
          {(
            [
              ['kpiWeightPointCompletion', t('kpi.pointCompletion')],
              ['kpiWeightOnTime', t('kpi.onTimeRate')],
              ['kpiWeightOtContribution', t('kpi.otContribution')],
            ] as const
          ).map(([name, label]) => (
            <FieldRow key={name} label={label} error={errors[name]?.message}>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                className="w-32"
                {...register(name, numberField)}
              />
            </FieldRow>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('sections.pointScale')}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldRow label={t('pointScale.maxPointsPerTask')} error={errors.maxPointPerTask?.message}>
            <Input
              type="number"
              step="1"
              min="0"
              className="w-32"
              placeholder={t('pointScale.unlimitedPlaceholder')}
              {...register('maxPointPerTask', numberField)}
            />
          </FieldRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('sections.bonusSettings')} ({t('states.organizationOverride')})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FieldRow label={t('bonus.enable')}>
            <Switch
              checked={bonusEnabled}
              onCheckedChange={(v) => setValue('bonusEnabled', v)}
            />
          </FieldRow>
          {bonusEnabled && (
            <>
              {(
                [
                  ['bonusOnTimeTask', t('bonus.onTimeTaskBonus')],
                  ['bonusEarlyTaskHours', t('bonus.earlyCompletionThreshold')],
                  ['bonusEarlyTask', t('bonus.earlyTaskBonus')],
                  ['bonusZeroOverdue', t('bonus.zeroOverdueBonus')],
                  ['bonusMaxCap', t('bonus.maxBonusCap')],
                  ['bonusOtPerEffectiveHour', t('bonus.otBonusPerEffectiveHour')],
                ] as const
              ).map(([name, label]) => (
                <FieldRow key={name} label={label} error={errors[name]?.message}>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-32"
                    {...register(name, numberField)}
                  />
                </FieldRow>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={resetMutation.isPending}
          onClick={() => void handleReset()}
        >
          {t('actions.reset')}
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? t('actions.saving') : t('actions.save')}
        </Button>
      </div>
    </form>
  );
}
