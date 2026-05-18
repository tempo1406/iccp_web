'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import {
  AlertCircle,
  CalendarClock,
  Mail,
  Pencil,
  RotateCcw,
  Save,
  Send,
  X,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import {
  PERIODIC_REPORT_CHANNELS,
  PERIODIC_REPORT_FREQUENCIES,
  PERIODIC_REPORT_RECIPIENT_GROUPS,
  PERIODIC_REPORT_SCOPES,
  createDefaultPeriodicReportSchedule,
  createDefaultPeriodicReportSchedules,
  type PeriodicReportChannel,
  type PeriodicReportFrequency,
  type PeriodicReportRecipientGroup,
  type PeriodicReportSchedule,
  type PeriodicReportScope,
} from '@/features/tenant/analytics/types/quarterly-report.types';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { useOrgSettings, useUpsertOrgSettings } from '../query/use-org-settings';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const scheduleSchema = z.object({
  frequency: z.enum(PERIODIC_REPORT_FREQUENCIES),
  enabled: z.boolean(),
  sendDelayDays: z.number().int().min(0),
  sendTime: z.string().regex(TIME_REGEX, 'Use HH:mm format.'),
  recipientGroups: z.array(z.enum(PERIODIC_REPORT_RECIPIENT_GROUPS)),
  customEmails: z.array(z.string().email('Invalid email address.')),
  channels: z.array(z.enum(PERIODIC_REPORT_CHANNELS)),
  scopes: z.array(z.enum(PERIODIC_REPORT_SCOPES)),
});

const schema = z
  .object({
    periodicReportSchedules: z
      .array(scheduleSchema)
      .length(PERIODIC_REPORT_FREQUENCIES.length),
  })
  .superRefine((value, ctx) => {
    const frequencies = value.periodicReportSchedules.map((item) => item.frequency);
    const uniqueFrequencies = new Set(frequencies);

    if (uniqueFrequencies.size !== PERIODIC_REPORT_FREQUENCIES.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Each frequency can only appear once.',
        path: ['periodicReportSchedules'],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

const FREQUENCY_OPTIONS: Array<{
  value: PeriodicReportFrequency;
  label: string;
  description: string;
}> = [
  {
    value: 'monthly',
    label: 'Monthly',
    description: 'Send a report after each closed month.',
  },
  {
    value: 'quarterly',
    label: 'Quarterly',
    description: 'Send a report after each closed quarter.',
  },
  {
    value: 'yearly',
    label: 'Yearly',
    description: 'Send a report after each closed year.',
  },
];

const RECIPIENT_GROUP_OPTIONS: Array<{
  value: PeriodicReportRecipientGroup;
  label: string;
  description: string;
}> = [
  {
    value: 'org_admin',
    label: 'Organization Admins',
    description: 'Send to organization admins with access to reports.',
  },
  {
    value: 'project_manager',
    label: 'Project Managers',
    description: 'Send to project managers across the organization.',
  },
  {
    value: 'project_owner',
    label: 'Project Owner',
    description: 'Send to the current project owner.',
  },
  {
    value: 'contact_email',
    label: 'Contact Email',
    description: 'Include the organization contact email recipients configured for this workspace.',
  },
];

const REPORT_SCOPE_OPTIONS: Array<{
  value: PeriodicReportScope;
  label: string;
  description: string;
}> = [
  {
    value: 'org_summary',
    label: 'Organization Summary',
    description: 'High-level organization summary exported as CSV.',
  },
  {
    value: 'project_summary',
    label: 'Project Summary',
    description: 'Per-project summary rows and metrics.',
  },
  {
    value: 'member_kpi',
    label: 'Member KPI',
    description: 'Member KPI breakdown for the selected reporting period.',
  },
];

const CHANNEL_OPTIONS: Array<{
  value: PeriodicReportChannel;
  label: string;
  description: string;
}> = [
  {
    value: 'email',
    label: 'Email',
    description: 'Send reports to recipient email addresses.',
  },
  {
    value: 'in_app',
    label: 'In-App Notification',
    description: 'Create in-app notifications for recipients mapped to system users.',
  },
];

const DEFAULT_VALUES: FormValues = {
  periodicReportSchedules: createDefaultPeriodicReportSchedules(),
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeTimeValue(value?: string | null): string {
  const normalized = value?.trim() ?? '';
  const hhmmMatch = normalized.match(/^([01]\d|2[0-3]):([0-5]\d)/);
  if (hhmmMatch) {
    return `${hhmmMatch[1]}:${hhmmMatch[2]}`;
  }

  return '08:00';
}

function normalizeStringArray<T extends string>(
  values: unknown,
  allowedValues: readonly T[],
  legacyAliases: Partial<Record<string, T>> = {},
): T[] {
  if (!Array.isArray(values)) return [];

  const normalizedValues = values
    .map((value) => {
      if (typeof value !== 'string') return null;
      return legacyAliases[value] ?? value;
    })
    .filter((value): value is T => Boolean(value) && allowedValues.includes(value as T));

  return Array.from(new Set(normalizedValues));
}

function buildPeriodicReportSchedules(
  schedules?: Partial<PeriodicReportSchedule>[] | null,
): PeriodicReportSchedule[] {
  return PERIODIC_REPORT_FREQUENCIES.map((frequency) => {
    const defaults = createDefaultPeriodicReportSchedule(frequency);
    const schedule = schedules?.find((item) => item?.frequency === frequency);

    return {
      frequency,
      enabled:
        typeof schedule?.enabled === 'boolean'
          ? schedule.enabled
          : defaults.enabled,
      sendDelayDays: Number.isFinite(Number(schedule?.sendDelayDays))
        ? Number(schedule?.sendDelayDays)
        : defaults.sendDelayDays,
      sendTime: normalizeTimeValue(schedule?.sendTime),
      recipientGroups:
        normalizeStringArray(
          schedule?.recipientGroups,
          PERIODIC_REPORT_RECIPIENT_GROUPS,
          { owner: 'project_owner' },
        ) || defaults.recipientGroups,
      customEmails: Array.from(
        new Set(
          Array.isArray(schedule?.customEmails)
            ? schedule.customEmails
                .filter((value): value is string => typeof value === 'string')
                .map(normalizeEmail)
                .filter(Boolean)
            : defaults.customEmails,
        ),
      ),
      channels:
        normalizeStringArray(schedule?.channels, PERIODIC_REPORT_CHANNELS) || defaults.channels,
      scopes:
        normalizeStringArray(schedule?.scopes, PERIODIC_REPORT_SCOPES) || defaults.scopes,
    };
  });
}

function MultiEmailInput({
  values,
  onChange,
  disabled,
  placeholder,
  addLabel,
  hint,
  invalidEmailMessage,
  duplicateEmailMessage,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  placeholder: string;
  addLabel: string;
  hint: string;
  invalidEmailMessage: string;
  duplicateEmailMessage: string;
}) {
  const [draftEmail, setDraftEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const addEmail = (rawValue: string) => {
    const email = normalizeEmail(rawValue);
    if (!email) return;

    if (!EMAIL_REGEX.test(email)) {
      setLocalError(invalidEmailMessage);
      return;
    }

    if (values.includes(email)) {
      setLocalError(duplicateEmailMessage);
      return;
    }

    onChange([...values, email]);
    setDraftEmail('');
    setLocalError(null);
  };

  const removeEmail = (email: string) => {
    onChange(values.filter((item) => item !== email));
    setLocalError(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addEmail(draftEmail);
      return;
    }

    if (
      event.key === 'Backspace' &&
      draftEmail.trim().length === 0 &&
      values.length > 0
    ) {
      event.preventDefault();
      removeEmail(values[values.length - 1]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border p-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {values.map((email) => (
            <Badge
              key={email}
              variant="secondary"
              className="gap-1 rounded-full px-2 py-1"
            >
              <span>{email}</span>
              {!disabled ? (
                <button
                  type="button"
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                  onClick={() => removeEmail(email)}
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </Badge>
          ))}
          <div className="flex min-w-[260px] flex-1 items-center gap-2 pl-1">
            <Input
              value={draftEmail}
              onChange={(event) => {
                setDraftEmail(event.target.value);
                if (localError) setLocalError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="min-w-0 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addEmail(draftEmail)}
              disabled={disabled || draftEmail.trim().length === 0}
            >
              {addLabel}
            </Button>
          </div>
        </div>
      </div>
      {localError ? (
        <p className="text-xs text-destructive">{localError}</p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {hint}
      </p>
    </div>
  );
}

export function PeriodicReportSettingsCard() {
  const t = useTranslations('orgConfig.periodicReportSettings');
  const q = useOrgSettings();
  const mutation = useUpsertOrgSettings();
  const canManageSettings = useCan(PERMISSIONS.ORG_CONFIG_SETTINGS_MANAGE);
  const [isEditing, setIsEditing] = useState(false);
  const [activeFrequency, setActiveFrequency] =
    useState<PeriodicReportFrequency>('monthly');

  const frequencyOptions = useMemo(
    () =>
      FREQUENCY_OPTIONS.map((option) => ({
        ...option,
        label: t(`frequencies.${option.value}.label`),
        description: t(`frequencies.${option.value}.description`),
      })),
    [t],
  );
  const recipientGroupOptions = useMemo(
    () =>
      RECIPIENT_GROUP_OPTIONS.map((option) => ({
        ...option,
        label: t(`recipientGroups.${option.value}.label`),
        description: t(`recipientGroups.${option.value}.description`),
      })),
    [t],
  );
  const reportScopeOptions = useMemo(
    () =>
      REPORT_SCOPE_OPTIONS.map((option) => ({
        ...option,
        label: t(`scopes.${option.value}.label`),
        description: t(`scopes.${option.value}.description`),
      })),
    [t],
  );
  const channelOptions = useMemo(
    () =>
      CHANNEL_OPTIONS.map((option) => ({
        ...option,
        label: t(`channels.${option.value}.label`),
        description: t(`channels.${option.value}.description`),
      })),
    [t],
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  const resetFromQueryData = useCallback(() => {
    reset({
      periodicReportSchedules: buildPeriodicReportSchedules(
        q.data?.periodicReportSchedules,
      ),
    });
  }, [q.data?.periodicReportSchedules, reset]);

  useEffect(() => {
    resetFromQueryData();
  }, [resetFromQueryData]);

  const watchedSchedules = useWatch({
    control,
    name: 'periodicReportSchedules',
  });

  const schedules = useMemo(
    () => buildPeriodicReportSchedules(watchedSchedules),
    [watchedSchedules],
  );

  const enabledCount = schedules.filter((schedule) => schedule.enabled).length;

  const updateSchedule = <K extends keyof PeriodicReportSchedule>(
    frequency: PeriodicReportFrequency,
    fieldName: K,
    value: PeriodicReportSchedule[K],
  ) => {
    const index = PERIODIC_REPORT_FREQUENCIES.indexOf(frequency);
    setValue(`periodicReportSchedules.${index}.${fieldName}` as const, value as never, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const toggleScheduleArrayValue = <
    T extends PeriodicReportRecipientGroup | PeriodicReportChannel | PeriodicReportScope,
  >(
    frequency: PeriodicReportFrequency,
    fieldName: 'recipientGroups' | 'channels' | 'scopes',
    currentValues: T[],
    value: T,
  ) => {
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    updateSchedule(frequency, fieldName, nextValues as PeriodicReportSchedule[typeof fieldName]);
  };

  const handleCancel = () => {
    resetFromQueryData();
    setIsEditing(false);
  };

  const onSubmit = async (formValues: FormValues) => {
    const normalizedSchedules = buildPeriodicReportSchedules(
      formValues.periodicReportSchedules,
    );
    const result = await mutation.mutateAsync({
      periodicReportSchedules: normalizedSchedules,
    });

    if (result.ok) {
      toast.success(t('toasts.saved'));
      setIsEditing(false);
      return;
    }

    toast.danger(result.error.message);
  };

  if (q.isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-44 w-full" />
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">{t('header.title')}</p>
          <p className="text-sm text-muted-foreground">
            {canManageSettings
              ? isEditing
                ? t('header.editingNotice')
                : t('header.reviewNotice')
              : t('header.viewOnlyNotice')}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 xl:w-auto xl:max-w-[56%] xl:items-end">
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <Badge variant={enabledCount > 0 ? 'default' : 'secondary'}>
              {t('header.enabledCount', {
                enabled: enabledCount,
                total: PERIODIC_REPORT_FREQUENCIES.length,
              })}
            </Badge>
            {frequencyOptions.map((option) => {
              const schedule = schedules.find((item) => item.frequency === option.value);
              return (
                <Badge
                  key={option.value}
                  variant={schedule?.enabled ? 'outline' : 'secondary'}
                >
                  {option.label}: {schedule?.enabled ? t('status.on') : t('status.off')}
                </Badge>
              );
            })}
          </div>

          {canManageSettings ? (
            isEditing ? (
              <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end xl:w-auto">
                <Button
                  type="submit"
                  size="sm"
                  disabled={mutation.isPending}
                  className="sm:min-w-36"
                >
                  {mutation.isPending ? (
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {t('actions.saveChanges')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="sm:min-w-28"
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  {t('actions.cancel')}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto"
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                {t('actions.editSettings')}
              </Button>
            )
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4 text-primary" />
            {t('schedules.title')}
          </CardTitle>
          <CardDescription>
            {t('schedules.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs
            value={activeFrequency}
            onValueChange={(value) =>
              setActiveFrequency(value as PeriodicReportFrequency)
            }
            className="space-y-6"
          >
            <TabsList className="h-auto w-full justify-start gap-2 rounded-xl bg-muted/40 p-1 sm:w-fit">
              {frequencyOptions.map((option) => (
                <TabsTrigger key={option.value} value={option.value} className="px-4 py-2">
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {frequencyOptions.map((option, index) => {
              const schedule = schedules[index];
              const scheduleErrors = errors.periodicReportSchedules?.[index];
              const statusSummary = schedule.enabled
                ? t('status.enabled')
                : t('status.disabled');

              return (
                <TabsContent key={option.value} value={option.value} className="space-y-6">
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <p className="text-sm font-medium">
                      {t('schedules.scheduleTitle', { frequency: option.label })}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">
                              {t('schedules.enableReport', { frequency: option.label })}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {t('schedules.enableReportDescription', {
                                frequency: option.label.toLowerCase(),
                              })}
                            </p>
                          </div>
                          <Switch
                            checked={schedule.enabled}
                            onCheckedChange={(checked) =>
                              updateSchedule(option.value, 'enabled', checked)
                            }
                            disabled={!isEditing}
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`${option.value}-send-delay-days`}>
                            {t('schedules.sendDelay')}
                          </Label>
                          <Input
                            id={`${option.value}-send-delay-days`}
                            type="number"
                            min="0"
                            value={schedule.sendDelayDays ?? 0}
                            onChange={(event) =>
                              updateSchedule(
                                option.value,
                                'sendDelayDays',
                                Number(event.target.value),
                              )
                            }
                            disabled={!isEditing}
                          />
                          {scheduleErrors?.sendDelayDays ? (
                            <p className="text-xs text-destructive">
                              {scheduleErrors.sendDelayDays.message}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`${option.value}-send-time`}>
                            {t('schedules.sendTime')}
                          </Label>
                          <Input
                            id={`${option.value}-send-time`}
                            type="time"
                            value={schedule.sendTime ?? ''}
                            onChange={(event) =>
                              updateSchedule(option.value, 'sendTime', event.target.value)
                            }
                            disabled={!isEditing}
                          />
                          {scheduleErrors?.sendTime ? (
                            <p className="text-xs text-destructive">
                              {scheduleErrors.sendTime.message}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Send className="h-4 w-4 text-primary" />
                        {t('summary.title')}
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">
                            {t('summary.automaticDispatch')}
                          </span>
                          <span className="font-medium">{statusSummary}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">
                            {t('summary.delayAfterPeriodEnd')}
                          </span>
                          <span className="font-medium">
                            {t('summary.days', { count: schedule.sendDelayDays ?? 0 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">
                            {t('summary.dispatchTime')}
                          </span>
                          <span className="font-medium">{schedule.sendTime}</span>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-muted-foreground">
                            {t('sections.recipientGroups')}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {schedule.recipientGroups.length > 0 ? (
                              recipientGroupOptions.filter((groupOption) =>
                                schedule.recipientGroups.includes(groupOption.value),
                              ).map((groupOption) => (
                                <Badge key={groupOption.value} variant="secondary">
                                  {groupOption.label}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {t('empty.recipientGroups')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-muted-foreground">
                            {t('sections.deliveryChannels')}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {schedule.channels.length > 0 ? (
                              channelOptions.filter((channelOption) =>
                                schedule.channels.includes(channelOption.value),
                              ).map((channelOption) => (
                                <Badge key={channelOption.value} variant="outline">
                                  {channelOption.label}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {t('empty.channels')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-muted-foreground">
                            {t('sections.reportScopes')}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {schedule.scopes.length > 0 ? (
                              reportScopeOptions.filter((scopeOption) =>
                                schedule.scopes.includes(scopeOption.value),
                              ).map((scopeOption) => (
                                <Badge key={scopeOption.value} variant="outline">
                                  {scopeOption.label}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {t('empty.scopes')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{t('sections.customEmails')}</span>
                          </div>
                          {schedule.customEmails.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {schedule.customEmails.map((email) => (
                                <Badge key={email} variant="outline">
                                  {email}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {t('empty.customEmails')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-3">
                      <Label>{t('sections.recipientGroups')}</Label>
                      <div className="space-y-3">
                        {recipientGroupOptions.map((groupOption) => {
                          const checked = schedule.recipientGroups.includes(groupOption.value);

                          return (
                            <label
                              key={groupOption.value}
                              className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                                checked && 'border-primary/50 bg-primary/5',
                                !isEditing && 'cursor-default',
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                disabled={!isEditing}
                                onCheckedChange={() =>
                                  toggleScheduleArrayValue(
                                    option.value,
                                    'recipientGroups',
                                    schedule.recipientGroups,
                                    groupOption.value,
                                  )
                                }
                              />
                              <div className="space-y-1">
                                <p className="text-sm font-medium">{groupOption.label}</p>
                                <p className="text-sm text-muted-foreground">
                                  {groupOption.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>{t('sections.deliveryChannels')}</Label>
                      <div className="space-y-3">
                        {channelOptions.map((channelOption) => {
                          const checked = schedule.channels.includes(channelOption.value);

                          return (
                            <label
                              key={channelOption.value}
                              className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                                checked && 'border-primary/50 bg-primary/5',
                                !isEditing && 'cursor-default',
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                disabled={!isEditing}
                                onCheckedChange={() =>
                                  toggleScheduleArrayValue(
                                    option.value,
                                    'channels',
                                    schedule.channels,
                                    channelOption.value,
                                  )
                                }
                              />
                              <div className="space-y-1">
                                <p className="text-sm font-medium">{channelOption.label}</p>
                                <p className="text-sm text-muted-foreground">
                                  {channelOption.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>{t('sections.reportScopes')}</Label>
                      <div className="space-y-3">
                        {reportScopeOptions.map((scopeOption) => {
                          const checked = schedule.scopes.includes(scopeOption.value);

                          return (
                            <label
                              key={scopeOption.value}
                              className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                                checked && 'border-primary/50 bg-primary/5',
                                !isEditing && 'cursor-default',
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                disabled={!isEditing}
                                onCheckedChange={() =>
                                  toggleScheduleArrayValue(
                                    option.value,
                                    'scopes',
                                    schedule.scopes,
                                    scopeOption.value,
                                  )
                                }
                              />
                              <div className="space-y-1">
                                <p className="text-sm font-medium">{scopeOption.label}</p>
                                <p className="text-sm text-muted-foreground">
                                  {scopeOption.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>{t('sections.customEmails')}</Label>
                    <MultiEmailInput
                      values={schedule.customEmails}
                      onChange={(next) =>
                        updateSchedule(option.value, 'customEmails', next)
                      }
                      disabled={!isEditing}
                      placeholder={t('customEmails.placeholder')}
                      addLabel={t('customEmails.add')}
                      hint={t('customEmails.hint')}
                      invalidEmailMessage={t('customEmails.invalid')}
                      duplicateEmailMessage={t('customEmails.duplicate')}
                    />
                    {scheduleErrors?.customEmails ? (
                      <p className="text-xs text-destructive">
                        {t('customEmails.invalidList')}
                      </p>
                    ) : null}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>

          {errors.periodicReportSchedules?.message ? (
            <p className="text-xs text-destructive">
              {errors.periodicReportSchedules.message}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </form>
  );
}

export const QuarterlyReportSettingsCard = PeriodicReportSettingsCard;
