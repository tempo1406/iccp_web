'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import {
  AlertCircle,
  Clock,
  Gift,
  Info,
  Mail,
  Pencil,
  RotateCcw,
  Save,
  TrendingUp,
  X,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import {
  DIGEST_CHANNEL_OPTIONS,
  DIGEST_RECIPIENT_OPTIONS,
  type DigestChannel,
  type DigestRecipient,
} from '../types/org-config.types';
import { useOrgSettings, useUpsertOrgSettings } from '../query/use-org-settings';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const numberField = () => z.coerce.number();
const integerField = () => z.coerce.number().int();

// digestDay: 1=Monday … 7=Sunday (ISO weekday, matches backend)
// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    defaultWeightPointCompletion: numberField().min(0).max(1),
    defaultWeightOnTime: numberField().min(0).max(1),
    defaultWeightOtContribution: numberField().min(0).max(1),
    otMultiplierWeekday: numberField().min(0),
    otMultiplierSaturday: numberField().min(0),
    otMultiplierSunday: numberField().min(0),
    otMultiplierHoliday: numberField().min(0),
    bonusEnabled: z.boolean(),
    bonusOnTimeTask: numberField().min(0),
    bonusEarlyTaskHours: integerField().min(0),
    bonusEarlyTask: numberField().min(0),
    bonusZeroOverdue: numberField().min(0),
    bonusMaxCap: numberField().min(0),
    bonusOtPerEffectiveHour: numberField().min(0),
    digestEnabled: z.boolean(),
    digestDay: integerField().min(1).max(7),
    digestTime: z.string().regex(TIME_REGEX, 'Use HH:MM format.'),
    digestRecipients: z.array(z.enum(DIGEST_RECIPIENT_OPTIONS)),
    digestChannels: z.array(z.enum(DIGEST_CHANNEL_OPTIONS)),
  })
  .refine(
    (v) =>
      Math.abs(
        v.defaultWeightPointCompletion + v.defaultWeightOnTime + v.defaultWeightOtContribution - 1,
      ) < 0.01,
    { message: 'KPI weights must sum to 1.0', path: ['defaultWeightPointCompletion'] },
  );

type FormValues = z.infer<typeof schema>;
type FormInput = z.input<typeof schema>;

const DEFAULT_VALUES: FormInput = {
  defaultWeightPointCompletion: 0.5,
  defaultWeightOnTime: 0.3,
  defaultWeightOtContribution: 0.2,
  otMultiplierWeekday: 1.0,
  otMultiplierSaturday: 1.5,
  otMultiplierSunday: 2.0,
  otMultiplierHoliday: 3.0,
  bonusEnabled: false,
  bonusOnTimeTask: 0.5,
  bonusEarlyTaskHours: 24,
  bonusEarlyTask: 1.0,
  bonusZeroOverdue: 2.0,
  bonusMaxCap: 10.0,
  bonusOtPerEffectiveHour: 0.2,
  digestEnabled: false,
  digestDay: 1,
  digestTime: '08:00',
  digestRecipients: ['project_owner', 'org_admin'],
  digestChannels: ['email'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeTimeValue(value?: string | null): string {
  const normalized = value?.trim() ?? '';
  const match = normalized.match(/^([01]\d|2[0-3]):([0-5]\d)/);
  if (match) return `${match[1]}:${match[2]}`;
  return '08:00';
}

function formatLastSentAt(
  value: string | null | undefined,
  locale: string,
  emptyLabel: string,
): string {
  if (!value) return emptyLabel;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}

function normalizeDigestRecipients(values: unknown): DigestRecipient[] {
  if (!Array.isArray(values)) return [];

  const normalizedValues = values
    .map((value) => {
      if (typeof value !== 'string') return null;
      return value === 'owner' ? 'project_owner' : value;
    })
    .filter((value): value is DigestRecipient =>
      Boolean(value) && DIGEST_RECIPIENT_OPTIONS.includes(value as DigestRecipient),
    );

  return Array.from(new Set(normalizedValues));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoTooltip({ content }: { content: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 cursor-help shrink-0 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function FieldRow({
  label,
  hint,
  error,
  children,
  value,
  isEditing,
  suffix,
  enabledLabel = 'Enabled',
  disabledLabel = 'Disabled',
}: {
  label: string;
  hint: string;
  error?: string;
  children: React.ReactNode;
  value?: string | number | boolean;
  isEditing: boolean;
  suffix?: string;
  enabledLabel?: string;
  disabledLabel?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-medium">{label}</span>
          <InfoTooltip content={hint} />
        </div>
        {isEditing ? (
          <div className="flex w-full shrink-0 items-center justify-end gap-3 md:w-auto">
            {children}
            {suffix && (
              <span className="min-w-22 text-left text-sm text-muted-foreground">
                {suffix}
              </span>
            )}
          </div>
        ) : (
          <span className="shrink-0 text-sm font-semibold tabular-nums md:text-right">
            {typeof value === 'boolean'
              ? value
                ? enabledLabel
                : disabledLabel
              : `${value}${suffix ? ` ${suffix}` : ''}`}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function WeightSumBadge({ sum, label }: { sum: number; label: string }) {
  const rounded = Math.round(sum * 100) / 100;
  const isOk = Math.abs(rounded - 1) < 0.01;
  return (
    <Badge variant={isOk ? 'default' : 'destructive'} className="text-xs tabular-nums">
      {isOk ? '✓' : '✗'} {label}: {rounded.toFixed(2)} / 1.00
    </Badge>
  );
}

function WeightBar({ weights }: { weights: { label: string; value: number; color: string }[] }) {
  const total = weights.reduce((s, w) => s + w.value, 0);
  return (
    <div className="space-y-1">
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
        {weights.map((w) => (
          <div
            key={w.label}
            className={cn('transition-all', w.color)}
            style={{ width: `${total > 0 ? (w.value / total) * 100 : 0}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {weights.map((w) => (
          <div key={w.label} className="flex items-center gap-1">
            <div className={cn('h-2 w-2 shrink-0 rounded-full', w.color)} />
            <span className="text-xs text-muted-foreground">
              {w.label}{' '}
              <span className="font-medium text-foreground">{(w.value * 100).toFixed(0)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MultiCheckboxGroup<T extends string>({
  options,
  labels,
  selected,
  onChange,
  disabled,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  selected: T[];
  onChange: (next: T[]) => void;
  disabled?: boolean;
}) {
  const toggle = (value: T) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => (
        <label
          key={opt}
          className={cn(
            'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
            selected.includes(opt) && 'border-primary/50 bg-primary/5',
            disabled && 'cursor-default',
          )}
        >
          <Checkbox
            checked={selected.includes(opt)}
            onCheckedChange={() => toggle(opt)}
            disabled={disabled}
          />
          {labels[opt]}
        </label>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function OrgSettingsForm() {
  const t = useTranslations('orgConfig.orgSettingsForm');
  const tDays = useTranslations('orgConfig.days');
  const locale = useLocale();
  const q = useOrgSettings();
  const mutation = useUpsertOrgSettings();
  const [isEditing, setIsEditing] = useState(false);

  const daysOfWeek = [
    { value: 1, label: tDays('monday.label') },
    { value: 2, label: tDays('tuesday.label') },
    { value: 3, label: tDays('wednesday.label') },
    { value: 4, label: tDays('thursday.label') },
    { value: 5, label: tDays('friday.label') },
    { value: 6, label: tDays('saturday.label') },
    { value: 7, label: tDays('sunday.label') },
  ] as const;

  const digestRecipientLabels: Record<DigestRecipient, string> = {
    org_admin: t('digest.recipients.orgAdmin'),
    project_owner: t('digest.recipients.projectOwner'),
    project_manager: t('digest.recipients.projectManager'),
    contact_email: t('digest.recipients.contactEmail'),
  };

  const digestChannelLabels: Record<DigestChannel, string> = {
    email: t('digest.channels.email'),
    in_app: t('digest.channels.inApp'),
  };

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  function resetFromQueryData() {
    if (!q.data) return;
    const digestRecipients = normalizeDigestRecipients(q.data.digestRecipients);

    reset({
      defaultWeightPointCompletion: Number(q.data.defaultWeightPointCompletion),
      defaultWeightOnTime: Number(q.data.defaultWeightOnTime),
      defaultWeightOtContribution: Number(q.data.defaultWeightOtContribution),
      otMultiplierWeekday: Number(q.data.otMultiplierWeekday),
      otMultiplierSaturday: Number(q.data.otMultiplierSaturday),
      otMultiplierSunday: Number(q.data.otMultiplierSunday),
      otMultiplierHoliday: Number(q.data.otMultiplierHoliday),
      bonusEnabled: q.data.bonusEnabled,
      bonusOnTimeTask: Number(q.data.bonusOnTimeTask),
      bonusEarlyTaskHours: Math.trunc(Number(q.data.bonusEarlyTaskHours)),
      bonusEarlyTask: Number(q.data.bonusEarlyTask),
      bonusZeroOverdue: Number(q.data.bonusZeroOverdue),
      bonusMaxCap: Number(q.data.bonusMaxCap),
      bonusOtPerEffectiveHour: Number(q.data.bonusOtPerEffectiveHour),
      digestEnabled: q.data.digestEnabled ?? false,
      digestDay: Number(q.data.digestDay ?? 1),
      digestTime: normalizeTimeValue(q.data.digestTime),
      digestRecipients: digestRecipients.length
        ? digestRecipients
        : DEFAULT_VALUES.digestRecipients,
      digestChannels: q.data.digestChannels?.length
        ? q.data.digestChannels
        : DEFAULT_VALUES.digestChannels,
    });
  }

  useEffect(() => {
    resetFromQueryData();
  }, [q.data, reset]);

  function handleCancel() {
    resetFromQueryData();
    setIsEditing(false);
  }

  async function onSubmit(values: FormValues) {
    const result = await mutation.mutateAsync(values);
    if (result.ok) {
      toast.success(t('toasts.saved'));
      setIsEditing(false);
    } else {
      toast.danger(result.error.message);
    }
  }

  if (q.isPending) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (q.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{q.error?.message}</AlertDescription>
      </Alert>
    );
  }

  const rawValues = watch();
  const values: FormValues = {
    defaultWeightPointCompletion: Number(
      rawValues.defaultWeightPointCompletion ?? DEFAULT_VALUES.defaultWeightPointCompletion,
    ),
    defaultWeightOnTime: Number(rawValues.defaultWeightOnTime ?? DEFAULT_VALUES.defaultWeightOnTime),
    defaultWeightOtContribution: Number(
      rawValues.defaultWeightOtContribution ?? DEFAULT_VALUES.defaultWeightOtContribution,
    ),
    otMultiplierWeekday: Number(
      rawValues.otMultiplierWeekday ?? DEFAULT_VALUES.otMultiplierWeekday,
    ),
    otMultiplierSaturday: Number(
      rawValues.otMultiplierSaturday ?? DEFAULT_VALUES.otMultiplierSaturday,
    ),
    otMultiplierSunday: Number(rawValues.otMultiplierSunday ?? DEFAULT_VALUES.otMultiplierSunday),
    otMultiplierHoliday: Number(
      rawValues.otMultiplierHoliday ?? DEFAULT_VALUES.otMultiplierHoliday,
    ),
    bonusEnabled:
      typeof rawValues.bonusEnabled === 'boolean'
        ? rawValues.bonusEnabled
        : DEFAULT_VALUES.bonusEnabled,
    bonusOnTimeTask: Number(rawValues.bonusOnTimeTask ?? DEFAULT_VALUES.bonusOnTimeTask),
    bonusEarlyTaskHours: Math.trunc(
      Number(rawValues.bonusEarlyTaskHours ?? DEFAULT_VALUES.bonusEarlyTaskHours),
    ),
    bonusEarlyTask: Number(rawValues.bonusEarlyTask ?? DEFAULT_VALUES.bonusEarlyTask),
    bonusZeroOverdue: Number(rawValues.bonusZeroOverdue ?? DEFAULT_VALUES.bonusZeroOverdue),
    bonusMaxCap: Number(rawValues.bonusMaxCap ?? DEFAULT_VALUES.bonusMaxCap),
    bonusOtPerEffectiveHour: Number(
      rawValues.bonusOtPerEffectiveHour ?? DEFAULT_VALUES.bonusOtPerEffectiveHour,
    ),
    digestEnabled:
      typeof rawValues.digestEnabled === 'boolean'
        ? rawValues.digestEnabled
        : DEFAULT_VALUES.digestEnabled,
    digestDay: Number(rawValues.digestDay ?? DEFAULT_VALUES.digestDay),
    digestTime: (rawValues.digestTime ?? DEFAULT_VALUES.digestTime) as string,
    digestRecipients: Array.isArray(rawValues.digestRecipients)
      ? normalizeDigestRecipients(rawValues.digestRecipients)
      : DEFAULT_VALUES.digestRecipients,
    digestChannels: Array.isArray(rawValues.digestChannels)
      ? (rawValues.digestChannels.filter((v) =>
          DIGEST_CHANNEL_OPTIONS.includes(v as DigestChannel),
        ) as DigestChannel[])
      : DEFAULT_VALUES.digestChannels,
  };

  const bonusEnabled = values.bonusEnabled;
  const digestEnabled = values.digestEnabled;
  const weightSum =
    (values.defaultWeightPointCompletion ?? 0) +
    (values.defaultWeightOnTime ?? 0) +
    (values.defaultWeightOtContribution ?? 0);

  const n = { valueAsNumber: true } as const;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isEditing ? t('actions.editingNotice') : t('actions.viewOnlyNotice')}
        </p>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                <X className="mr-1.5 h-3.5 w-3.5" />
                {t('actions.cancel')}
              </Button>
              <Button type="submit" size="sm" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                {t('actions.saveChanges')}
              </Button>
            </>
          ) : (
            <Button type="button" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              {t('actions.editSettings')}
            </Button>
          )}
        </div>
      </div>

      {/* ── KPI Weights ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                {t('weights.title')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('weights.description')}
              </CardDescription>
            </div>
            {isEditing && <WeightSumBadge sum={weightSum} label={t('weights.sum')} />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing && (
            <WeightBar
              weights={[
                {
                  label: t('weights.pointCompletion'),
                  value: values.defaultWeightPointCompletion ?? 0,
                  color: 'bg-blue-500',
                },
                {
                  label: t('weights.onTimeRate'),
                  value: values.defaultWeightOnTime ?? 0,
                  color: 'bg-emerald-500',
                },
                {
                  label: t('weights.otContribution'),
                  value: values.defaultWeightOtContribution ?? 0,
                  color: 'bg-amber-500',
                },
              ]}
            />
          )}

          {errors.defaultWeightPointCompletion?.message === 'KPI weights must sum to 1.0' && (
            <Alert
              variant="destructive"
              className="py-2 [&>svg+div]:translate-y-0 [&>svg]:top-1/2 [&>svg]:-translate-y-1/2"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {t('weights.sumError', { sum: Math.round(weightSum * 100) / 100 })}
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          <div className="space-y-3">
            <FieldRow
              label={t('weights.pointCompletion')}
              hint={t('weights.pointCompletionHint')}
              error={errors.defaultWeightPointCompletion?.message}
              value={values.defaultWeightPointCompletion}
              isEditing={isEditing}
              suffix="/ 1.00"
            >
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                className="h-8 w-24 text-right"
                {...register('defaultWeightPointCompletion', n)}
              />
            </FieldRow>
            <FieldRow
              label={t('weights.onTimeRate')}
              hint={t('weights.onTimeRateHint')}
              error={errors.defaultWeightOnTime?.message}
              value={values.defaultWeightOnTime}
              isEditing={isEditing}
              suffix="/ 1.00"
            >
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                className="h-8 w-24 text-right"
                {...register('defaultWeightOnTime', n)}
              />
            </FieldRow>
            <FieldRow
              label={t('weights.otContribution')}
              hint={t('weights.otContributionHint')}
              error={errors.defaultWeightOtContribution?.message}
              value={values.defaultWeightOtContribution}
              isEditing={isEditing}
              suffix="/ 1.00"
            >
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                className="h-8 w-24 text-right"
                {...register('defaultWeightOtContribution', n)}
              />
            </FieldRow>
          </div>
        </CardContent>
      </Card>

      {/* ── OT Multipliers ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-primary" />
            {t('ot.title')}
          </CardTitle>
          <CardDescription className="text-xs">
            {t('ot.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                [
                  'otMultiplierWeekday',
                  t('ot.weekday'),
                  t('ot.weekdayHint'),
                ],
                [
                  'otMultiplierSaturday',
                  tDays('saturday.label'),
                  t('ot.saturdayHint'),
                ],
                [
                  'otMultiplierSunday',
                  tDays('sunday.label'),
                  t('ot.sundayHint'),
                ],
                [
                  'otMultiplierHoliday',
                  t('ot.publicHoliday'),
                  t('ot.publicHolidayHint'),
                ],
              ] as const
            ).map(([name, label, hint]) => (
              <FieldRow
                key={name}
                label={label}
                hint={hint}
                error={errors[name]?.message}
                value={values[name]}
                isEditing={isEditing}
                suffix="x"
              >
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  className="h-8 w-20 text-right"
                  {...register(name, n)}
                />
              </FieldRow>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── KPI Digest ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-primary" />
            {t('digest.title')}
          </CardTitle>
          <CardDescription className="text-xs">
            {t('digest.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable toggle + last sent */}
          <div className="flex items-center justify-between gap-4">
            <FieldRow
              label={t('digest.enable')}
              hint={t('digest.enableHint')}
              value={digestEnabled}
              isEditing={isEditing}
              enabledLabel={t('status.enabled')}
              disabledLabel={t('status.disabled')}
            >
              <Switch
                checked={digestEnabled}
                onCheckedChange={(v) => setValue('digestEnabled', v, { shouldDirty: true })}
                disabled={!isEditing}
              />
            </FieldRow>
            {q.data?.lastDigestSentAt !== undefined && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {t('digest.lastSent', {
                  value: formatLastSentAt(
                    q.data.lastDigestSentAt,
                    locale,
                    t('digest.neverSent'),
                  ),
                })}
              </span>
            )}
          </div>

          <Separator />

          <div
            className={cn(
              'space-y-4',
              !digestEnabled && 'pointer-events-none opacity-50',
            )}
          >
            {/* Day + Time */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldRow
                label={t('digest.day')}
                hint={t('digest.dayHint')}
                value={daysOfWeek.find((d) => d.value === values.digestDay)?.label ?? tDays('monday.label')}
                isEditing={isEditing}
              >
                <Select
                  value={String(values.digestDay)}
                  onValueChange={(val) =>
                    setValue('digestDay', Number(val), { shouldDirty: true })
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day.value} value={String(day.value)}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>

              <FieldRow
                label={t('digest.time')}
                hint={t('digest.timeHint')}
                error={errors.digestTime?.message}
                value={values.digestTime}
                isEditing={isEditing}
              >
                <Input
                  type="time"
                  value={values.digestTime ?? ''}
                  onChange={(event) =>
                    setValue('digestTime', event.target.value, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  }
                  disabled={!isEditing}
                  className="h-8 w-32"
                />
              </FieldRow>
            </div>

            {/* Recipients */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium">{t('digest.recipientGroups')}</span>
                <InfoTooltip content={t('digest.recipientGroupsHint')} />
              </div>
              {isEditing ? (
                <MultiCheckboxGroup
                  options={DIGEST_RECIPIENT_OPTIONS}
                  labels={digestRecipientLabels}
                  selected={values.digestRecipients}
                  onChange={(next) =>
                    setValue('digestRecipients', next, { shouldDirty: true, shouldValidate: true })
                  }
                  disabled={!isEditing}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {values.digestRecipients.length > 0 ? (
                    values.digestRecipients.map((r) => (
                      <Badge key={r} variant="secondary">
                        {digestRecipientLabels[r]}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t('digest.noRecipients')}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Channels */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium">{t('digest.deliveryChannels')}</span>
                <InfoTooltip content={t('digest.deliveryChannelsHint')} />
              </div>
              {isEditing ? (
                <MultiCheckboxGroup
                  options={DIGEST_CHANNEL_OPTIONS}
                  labels={digestChannelLabels}
                  selected={values.digestChannels}
                  onChange={(next) =>
                    setValue('digestChannels', next, { shouldDirty: true, shouldValidate: true })
                  }
                  disabled={!isEditing}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {values.digestChannels.length > 0 ? (
                    values.digestChannels.map((c) => (
                      <Badge key={c} variant="outline">
                        {digestChannelLabels[c]}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t('digest.noChannels')}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Bonus Rules ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="h-4 w-4 text-primary" />
            {t('bonus.title')}
          </CardTitle>
          <CardDescription className="text-xs">
            {t.rich('bonus.description', {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldRow
            label={t('bonus.enable')}
            hint={t('bonus.enableHint')}
            value={bonusEnabled}
            isEditing={isEditing}
            enabledLabel={t('status.enabled')}
            disabledLabel={t('status.disabled')}
          >
            <Switch
              checked={bonusEnabled}
              onCheckedChange={(v) => setValue('bonusEnabled', v)}
              disabled={!isEditing}
            />
          </FieldRow>

          {(bonusEnabled || !isEditing) && (
            <>
              <Separator />
              <div className={cn('space-y-3', !bonusEnabled && 'pointer-events-none opacity-50')}>
                {(
                  [
                    [
                      'bonusOnTimeTask',
                      t('bonus.onTimeTask'),
                      t('bonus.pointsPerTask'),
                      t('bonus.onTimeTaskHint'),
                    ],
                    [
                      'bonusEarlyTaskHours',
                      t('bonus.earlyThreshold'),
                      t('bonus.hoursEarly'),
                      t('bonus.earlyThresholdHint'),
                    ],
                    [
                      'bonusEarlyTask',
                      t('bonus.earlyTask'),
                      t('bonus.pointsPerTask'),
                      t('bonus.earlyTaskHint'),
                    ],
                    [
                      'bonusZeroOverdue',
                      t('bonus.zeroOverdue'),
                      t('bonus.points'),
                      t('bonus.zeroOverdueHint'),
                    ],
                    [
                      'bonusMaxCap',
                      t('bonus.maxCap'),
                      t('bonus.points'),
                      t('bonus.maxCapHint'),
                    ],
                    [
                      'bonusOtPerEffectiveHour',
                      t('bonus.otPerEffectiveHour'),
                      t('bonus.pointsPerHour'),
                      t('bonus.otPerEffectiveHourHint'),
                    ],
                  ] as const
                ).map(([name, label, suffix, hint]) => (
                  <FieldRow
                    key={name}
                    label={label}
                    hint={hint}
                    error={errors[name]?.message}
                    value={values[name]}
                    isEditing={isEditing}
                    suffix={suffix}
                  >
                    <Input
                      type="number"
                      step={name === 'bonusEarlyTaskHours' ? '1' : '0.01'}
                      min="0"
                      className="h-10 w-28 text-right tabular-nums"
                      {...register(name, n)}
                    />
                  </FieldRow>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
