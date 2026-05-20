'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, Pencil, RotateCcw, Save, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useWorkingTime, useUpsertWorkingTime } from '../query/use-working-time';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const DAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export function WorkingTimeForm() {
  const t = useTranslations('orgConfig');
  const q = useWorkingTime();
  const mutation = useUpsertWorkingTime();
  const [isEditing, setIsEditing] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        mondayHours: z
          .coerce.number()
          .min(0, t('workingTimeForm.validation.range'))
          .max(24, t('workingTimeForm.validation.range')),
        tuesdayHours: z
          .coerce.number()
          .min(0, t('workingTimeForm.validation.range'))
          .max(24, t('workingTimeForm.validation.range')),
        wednesdayHours: z
          .coerce.number()
          .min(0, t('workingTimeForm.validation.range'))
          .max(24, t('workingTimeForm.validation.range')),
        thursdayHours: z
          .coerce.number()
          .min(0, t('workingTimeForm.validation.range'))
          .max(24, t('workingTimeForm.validation.range')),
        fridayHours: z
          .coerce.number()
          .min(0, t('workingTimeForm.validation.range'))
          .max(24, t('workingTimeForm.validation.range')),
        saturdayHours: z
          .coerce.number()
          .min(0, t('workingTimeForm.validation.range'))
          .max(24, t('workingTimeForm.validation.range')),
        sundayHours: z
          .coerce.number()
          .min(0, t('workingTimeForm.validation.range'))
          .max(24, t('workingTimeForm.validation.range')),
      }),
    [t],
  );

  const days = useMemo(
    () =>
      [
        {
          name: 'mondayHours' as const,
          label: t('days.monday.label'),
          short: t('days.monday.short'),
          isWeekend: false,
        },
        {
          name: 'tuesdayHours' as const,
          label: t('days.tuesday.label'),
          short: t('days.tuesday.short'),
          isWeekend: false,
        },
        {
          name: 'wednesdayHours' as const,
          label: t('days.wednesday.label'),
          short: t('days.wednesday.short'),
          isWeekend: false,
        },
        {
          name: 'thursdayHours' as const,
          label: t('days.thursday.label'),
          short: t('days.thursday.short'),
          isWeekend: false,
        },
        {
          name: 'fridayHours' as const,
          label: t('days.friday.label'),
          short: t('days.friday.short'),
          isWeekend: false,
        },
        {
          name: 'saturdayHours' as const,
          label: t('days.saturday.label'),
          short: t('days.saturday.short'),
          isWeekend: true,
        },
        {
          name: 'sundayHours' as const,
          label: t('days.sunday.label'),
          short: t('days.sunday.short'),
          isWeekend: true,
        },
      ],
    [t],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      mondayHours: 8,
      tuesdayHours: 8,
      wednesdayHours: 8,
      thursdayHours: 8,
      fridayHours: 8,
      saturdayHours: 0,
      sundayHours: 0,
    },
  });
  const values = useWatch({ control });

  useEffect(() => {
    if (!q.data) return;
    reset({
      mondayHours: q.data.mondayHours,
      tuesdayHours: q.data.tuesdayHours,
      wednesdayHours: q.data.wednesdayHours,
      thursdayHours: q.data.thursdayHours,
      fridayHours: q.data.fridayHours,
      saturdayHours: q.data.saturdayHours,
      sundayHours: q.data.sundayHours,
    });
  }, [q.data, reset]);

  function handleCancel() {
    if (q.data) {
      reset({
        mondayHours: q.data.mondayHours,
        tuesdayHours: q.data.tuesdayHours,
        wednesdayHours: q.data.wednesdayHours,
        thursdayHours: q.data.thursdayHours,
        fridayHours: q.data.fridayHours,
        saturdayHours: q.data.saturdayHours,
        sundayHours: q.data.sundayHours,
      });
    }
    setIsEditing(false);
  }

  async function onSubmit(values: z.output<typeof schema>) {
    const result = await mutation.mutateAsync(values);
    if (result.ok) {
      toast.success(t('workingTimeForm.toasts.saved'));
      setIsEditing(false);
    } else {
      toast.danger(result.error.message);
    }
  }

  if (q.isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (q.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{q.error?.message}</AlertDescription>
      </Alert>
    );
  }

  const totalWeeklyHours = DAY_KEYS.reduce((sum, key) => {
    const fieldName = `${key}Hours` as keyof z.output<typeof schema>;
    const hours = Number(values[fieldName] ?? 0);
    return sum + (Number.isFinite(hours) ? hours : 0);
  }, 0);

  const numberRegisterOptions = { valueAsNumber: true } as const;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isEditing
            ? t('workingTimeForm.actions.editingNotice')
            : t('workingTimeForm.actions.viewOnlyNotice')}
        </p>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                <X className="mr-1.5 h-3.5 w-3.5" />
                {t('workingTimeForm.actions.cancel')}
              </Button>
              <Button type="submit" size="sm" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                {t('workingTimeForm.actions.saveChanges')}
              </Button>
            </>
          ) : (
            <Button type="button" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              {t('workingTimeForm.actions.editSettings')}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-primary" />
                {t('workingTimeForm.card.title')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('workingTimeForm.card.description')}
              </CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="shrink-0 tabular-nums text-xs">
                    {t('workingTimeForm.card.totalWeek', { hours: totalWeeklyHours })}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  {t('workingTimeForm.card.totalWeekTooltip')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            {days.map(({ name, label, short, isWeekend }) => {
              const hours = Number(values[name] ?? 0);
              return (
                <div
                  key={name}
                  className={cn(
                    'space-y-2 rounded-lg border p-3 transition-colors',
                    isWeekend ? 'bg-muted/40' : 'bg-background',
                    isEditing && 'ring-1 ring-border',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className={cn('text-xs font-semibold', isWeekend && 'text-muted-foreground')}>
                      {short}
                    </p>
                    {isWeekend ? (
                      <span className="bg-muted rounded px-1 text-[10px] text-muted-foreground">
                        {t('workingTimeForm.card.weekend')}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-xs text-muted-foreground">{label}</p>

                  {isEditing ? (
                    <div className="space-y-0.5">
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        className="h-9 w-full text-center text-sm"
                        {...register(name, numberRegisterOptions)}
                      />
                      {errors[name] ? (
                        <p className="text-[10px] text-destructive">{errors[name]?.message}</p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-center text-2xl font-bold tabular-nums">
                      {hours}
                      <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                        {t('workingTimeForm.card.hoursUnit')}
                      </span>
                    </p>
                  )}

                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        hours > 0 ? 'bg-primary' : 'bg-transparent',
                      )}
                      style={{ width: `${Math.min(100, (hours / 12) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
