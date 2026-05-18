'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, RotateCcw, Save, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/lib/toast';
import {
  useProjectSettings,
  useResetProjectSettings,
  useUpsertProjectSettings,
} from '../query/use-project-settings';
import {
  localTimeToOrgTime,
  orgTimeToLocalTime,
  VIETNAM_TIMEZONE,
  VIETNAM_TIMEZONE_LABEL,
} from '../utils/timezone-time';

const DAILY_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

type TranslationFn = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

function createSchema(t: TranslationFn) {
  return z
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
    });
}

type FormValues = z.infer<ReturnType<typeof createSchema>>;

interface ProjectSettingsFormSource {
  dailyEnabled: boolean;
  dailyTime?: string | null;
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

function mapSettingsToFormValues(data: ProjectSettingsFormSource): FormValues {
  return {
    dailyEnabled: data.dailyEnabled,
    dailyTime: data.dailyTime ? orgTimeToLocalTime(data.dailyTime, VIETNAM_TIMEZONE) : '',
    dailyDays: data.dailyDays,
    kpiWeightPointCompletion: data.kpiWeightPointCompletion,
    kpiWeightOnTime: data.kpiWeightOnTime,
    kpiWeightOtContribution: data.kpiWeightOtContribution,
    bonusEnabled: data.bonusEnabled,
    bonusOnTimeTask: data.bonusOnTimeTask,
    bonusEarlyTaskHours: data.bonusEarlyTaskHours,
    bonusEarlyTask: data.bonusEarlyTask,
    bonusZeroOverdue: data.bonusZeroOverdue,
    bonusMaxCap: data.bonusMaxCap,
    bonusOtPerEffectiveHour: data.bonusOtPerEffectiveHour,
    maxPointPerTask: data.maxPointPerTask,
  };
}

interface Props {
  open: boolean;
  projectId: string;
  onOpenChange: (open: boolean) => void;
}

function ViewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-4 py-3">
      <span className="text-muted-foreground min-w-0 text-sm">{label}</span>
      <span className="min-w-0 text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function EditRow({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1 py-1.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <Label className="text-muted-foreground min-w-0 text-sm font-normal">{label}</Label>
        <div className="w-full sm:w-auto sm:flex-none">{children}</div>
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

function WeightBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <Badge variant="secondary" className="font-mono text-xs">
          {pct}%
        </Badge>
      </div>
      <Progress value={pct} className={`h-2 ${color}`} />
    </div>
  );
}

function formatDailyDays(
  days: number[],
  options: Array<{ value: number; short: string }>,
  emptyLabel: string,
) {
  const labels = options.filter((day) => days.includes(day.value)).map((day) => day.short);
  return labels.length > 0 ? labels.join(', ') : emptyLabel;
}

export function ProjectSettingsDialog({ open, projectId, onOpenChange }: Props) {
  const t = useTranslations('project.settingsDialog');
  const [isEditing, setIsEditing] = useState(false);

  const schema = useMemo(() => createSchema(t), [t]);
  const q = useProjectSettings(projectId);
  const mutation = useUpsertProjectSettings(projectId);
  const resetMutation = useResetProjectSettings(projectId);

  const dailyDayOptions = useMemo(
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
      reset(mapSettingsToFormValues(q.data));
    }
  }, [q.data, reset]);

  useEffect(() => {
    if (!open) setIsEditing(false);
  }, [open]);

  const handleCancel = () => {
    if (q.data) {
      reset(mapSettingsToFormValues(q.data));
    }
    setIsEditing(false);
  };

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
      setIsEditing(false);
    } else {
      toast.danger(result.error.message);
    }
  }

  async function handleReset() {
    const result = await resetMutation.mutateAsync();
    if (result.ok) {
      toast.success(t('toasts.reset'));
      setIsEditing(false);
    } else {
      toast.danger(result.error.message);
    }
  }

  const values = watch();
  const dailyEnabled = values.dailyEnabled;
  const bonusEnabled = values.bonusEnabled;
  const numberField = { valueAsNumber: true } as const;
  const totalWeight =
    values.kpiWeightPointCompletion + values.kpiWeightOnTime + values.kpiWeightOtContribution;
  const isTotalWeightValid = Math.abs(totalWeight - 1) < 0.01;

  const renderContent = () => {
    if (q.isPending) {
      return (
        <div className="space-y-4 p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      );
    }

    if (q.isError) {
      return (
        <div className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{q.error?.message ?? t('errors.loadFailed')}</AlertDescription>
          </Alert>
        </div>
      );
    }

    if (!isEditing) {
      return (
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t('sections.dailyReportReminder')}</h3>
                <Badge variant={dailyEnabled ? 'secondary' : 'outline'} className="text-xs">
                  {dailyEnabled ? t('states.enabled') : t('states.disabled')}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">{t('dailyReport.description')}</p>
              <div className="divide-y overflow-hidden rounded-lg border">
                <ViewRow
                  label={t('dailyReport.enable')}
                  value={
                    dailyEnabled ? (
                      <Badge className="bg-emerald-500 text-xs text-white hover:bg-emerald-500">
                        {t('states.enabled')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {t('states.disabled')}
                      </Badge>
                    )
                  }
                />
                <ViewRow
                  label={t('dailyReport.reminderTime')}
                  value={
                    dailyEnabled && values.dailyTime ? (
                      <span className="flex items-center gap-2">
                        <span className="font-mono">{values.dailyTime}</span>
                        <span className="text-muted-foreground text-xs">
                          {VIETNAM_TIMEZONE_LABEL}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">
                        {t('states.notScheduled')}
                      </span>
                    )
                  }
                />
                <ViewRow
                  label={t('dailyReport.reminderDays')}
                  value={
                    <span className="font-mono">
                      {formatDailyDays(
                        values.dailyDays,
                        dailyDayOptions,
                        t('states.noDaysSelected'),
                      )}
                    </span>
                  }
                />
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t('sections.kpiWeights')}</h3>
                <Badge variant="outline" className="text-xs">
                  {t('states.organizationOverride')}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">{t('kpi.description')}</p>
              <div className="space-y-4 rounded-lg border p-4">
                <WeightBar
                  label={t('kpi.pointCompletion')}
                  value={values.kpiWeightPointCompletion}
                  color="[&>div]:bg-blue-500"
                />
                <WeightBar
                  label={t('kpi.onTimeRate')}
                  value={values.kpiWeightOnTime}
                  color="[&>div]:bg-emerald-500"
                />
                <WeightBar
                  label={t('kpi.otContribution')}
                  value={values.kpiWeightOtContribution}
                  color="[&>div]:bg-amber-500"
                />
                <Separator />
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-muted-foreground">{t('kpi.totalWeight')}</span>
                  <Badge
                    variant={isTotalWeightValid ? 'secondary' : 'destructive'}
                    className="font-mono"
                  >
                    {(totalWeight * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">{t('sections.pointScale')}</h3>
              <div className="divide-y overflow-hidden rounded-lg border">
                <ViewRow
                  label={t('pointScale.maxPointsPerTask')}
                  value={
                    values.maxPointPerTask != null && !Number.isNaN(values.maxPointPerTask) ? (
                      <span className="font-mono">{values.maxPointPerTask}</span>
                    ) : (
                      <span className="text-muted-foreground italic">
                        {t('states.unlimited')}
                      </span>
                    )
                  }
                />
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t('sections.bonusSettings')}</h3>
                <Badge variant="outline" className="text-xs">
                  {t('states.organizationOverride')}
                </Badge>
              </div>
              <div className="divide-y overflow-hidden rounded-lg border">
                <ViewRow
                  label={t('bonus.enable')}
                  value={
                    bonusEnabled ? (
                      <Badge className="bg-emerald-500 text-xs text-white hover:bg-emerald-500">
                        {t('states.enabled')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {t('states.disabled')}
                      </Badge>
                    )
                  }
                />
                {bonusEnabled && (
                  <>
                    <ViewRow
                      label={t('bonus.onTimeTaskBonus')}
                      value={<span className="font-mono">{values.bonusOnTimeTask}</span>}
                    />
                    <ViewRow
                      label={t('bonus.earlyCompletionThreshold')}
                      value={
                        <span className="font-mono">
                          {t('units.hoursShort', { value: values.bonusEarlyTaskHours })}
                        </span>
                      }
                    />
                    <ViewRow
                      label={t('bonus.earlyTaskBonus')}
                      value={<span className="font-mono">{values.bonusEarlyTask}</span>}
                    />
                    <ViewRow
                      label={t('bonus.zeroOverdueBonus')}
                      value={<span className="font-mono">{values.bonusZeroOverdue}</span>}
                    />
                    <ViewRow
                      label={t('bonus.maxBonusCap')}
                      value={<span className="font-mono">{values.bonusMaxCap}</span>}
                    />
                    <ViewRow
                      label={t('bonus.otBonusPerEffectiveHour')}
                      value={<span className="font-mono">{values.bonusOtPerEffectiveHour}</span>}
                    />
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      );
    }

    return (
      <form
        id="project-kpi-settings-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 overflow-y-auto"
      >
        <div className="space-y-6 p-6">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{t('sections.dailyReportReminder')}</h3>
              <Badge variant={dailyEnabled ? 'secondary' : 'outline'} className="text-xs">
                {dailyEnabled ? t('states.enabled') : t('states.disabled')}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs">{t('dailyReport.description')}</p>
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-sm font-normal">
                  {t('dailyReport.enable')}
                </Label>
                <Switch
                  checked={dailyEnabled}
                  onCheckedChange={(value) =>
                    setValue('dailyEnabled', value, { shouldValidate: true })
                  }
                />
              </div>

              {dailyEnabled && (
                <>
                  <Separator />
                  <EditRow label={t('dailyReport.reminderTime')} error={errors.dailyTime?.message}>
                    <div className="flex flex-col items-start gap-1 sm:items-end">
                      <Input
                        type="time"
                        className="w-full text-right font-mono sm:w-36"
                        {...register('dailyTime')}
                      />
                      <span className="text-muted-foreground text-xs">{reminderTimeHelpText}</span>
                    </div>
                  </EditRow>
                  <EditRow
                    label={t('dailyReport.reminderDays')}
                    error={errors.dailyDays?.message}
                  >
                    <div className="flex flex-wrap justify-end gap-2 sm:max-w-[320px]">
                      {DAILY_DAYS.map((dayValue) => {
                        const day = dailyDayOptions.find((item) => item.value === dayValue);
                        const isChecked = values.dailyDays.includes(dayValue);

                        if (!day) return null;

                        return (
                          <label
                            key={dayValue}
                            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                              isChecked ? 'border-primary/50 bg-primary/5' : ''
                            }`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const nextDays = checked
                                  ? [...values.dailyDays, dayValue]
                                  : values.dailyDays.filter((value) => value !== dayValue);
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
                  </EditRow>
                </>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{t('sections.kpiWeights')}</h3>
              <Badge variant="outline" className="text-xs">
                {t('states.organizationOverride')}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs">{t('kpi.totalWeightHint')}</p>
            <div className="space-y-2 rounded-lg border p-4">
              {(
                [
                  ['kpiWeightPointCompletion', t('kpi.pointCompletion')],
                  ['kpiWeightOnTime', t('kpi.onTimeRate')],
                  ['kpiWeightOtContribution', t('kpi.otContribution')],
                ] as const
              ).map(([name, label]) => (
                <EditRow key={name} label={label} error={errors[name]?.message}>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    className="w-full text-right font-mono sm:w-28"
                    {...register(name, numberField)}
                  />
                </EditRow>
              ))}
              <Separator className="my-2" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t('kpi.totalWeight')}</span>
                <Badge
                  variant={isTotalWeightValid ? 'secondary' : 'destructive'}
                  className="font-mono"
                >
                  {(totalWeight * 100).toFixed(0)}%
                </Badge>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">{t('sections.pointScale')}</h3>
            <div className="rounded-lg border p-4">
              <EditRow
                label={t('pointScale.maxPointsPerTask')}
                error={errors.maxPointPerTask?.message}
              >
                <Input
                  type="number"
                  step="1"
                  min="0"
                  className="w-full text-right font-mono sm:w-28"
                  placeholder={t('pointScale.unlimitedPlaceholder')}
                  {...register('maxPointPerTask', numberField)}
                />
              </EditRow>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{t('sections.bonusSettings')}</h3>
              <Badge variant="outline" className="text-xs">
                {t('states.organizationOverride')}
              </Badge>
            </div>
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-sm font-normal">
                  {t('bonus.enable')}
                </Label>
                <Switch
                  checked={bonusEnabled}
                  onCheckedChange={(value) => setValue('bonusEnabled', value)}
                />
              </div>
              {bonusEnabled && (
                <>
                  <Separator />
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
                    <EditRow key={name} label={label} error={errors[name]?.message}>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full text-right font-mono sm:w-28"
                        {...register(name, numberField)}
                      />
                    </EditRow>
                  ))}
                </>
              )}
            </div>
          </section>
        </div>
      </form>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md [&>button]:right-4 [&>button]:top-4">
        <SheetHeader className="border-b px-6 py-4 pr-14">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <SheetTitle>{t('title')}</SheetTitle>
              <SheetDescription className="mt-0.5">{t('description')}</SheetDescription>
            </div>
            {!isEditing && !q.isPending && !q.isError && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start sm:mr-2"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                {t('actions.edit')}
              </Button>
            )}
          </div>
        </SheetHeader>

        {renderContent()}

        <div className="border-t px-6 py-4">
          {isEditing ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-auto max-w-full justify-start whitespace-normal text-left sm:max-w-[55%]"
                disabled={resetMutation.isPending || mutation.isPending}
                onClick={() => void handleReset()}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                {t('actions.reset')}
              </Button>
              <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={mutation.isPending}
                  onClick={handleCancel}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  {t('actions.cancel')}
                </Button>
                <Button
                  type="submit"
                  form="project-kpi-settings-form"
                  size="sm"
                  disabled={mutation.isPending}
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  {mutation.isPending ? t('actions.saving') : t('actions.save')}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center text-xs">
              {t.rich('footer.editHint', {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
