'use client';

import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { parseISO } from 'date-fns';
import { Info, Plus, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCreateHoliday, useDeleteHoliday, useHolidays } from '../query/use-working-time';
import type { HolidayType } from '../types/org-config.types';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const CURRENT_HOLIDAY_YEAR = new Date().getFullYear();

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function buildHolidayDate(month: string, day: string) {
  return `${CURRENT_HOLIDAY_YEAR}-${month}-${day}`;
}

export function HolidaysTable() {
  const t = useTranslations('orgConfig');
  const locale = useLocale();
  const intlLocale = locale === 'vi' ? 'vi-VN' : 'en-US';
  const q = useHolidays();
  const createMutation = useCreateHoliday();
  const deleteMutation = useDeleteHoliday();
  const [open, setOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        month: z.string().min(1, t('holidays.validation.selectMonth')),
        day: z.string().min(1, t('holidays.validation.selectDay')),
        name: z
          .string()
          .min(1, t('holidays.validation.enterName'))
          .max(255, t('holidays.validation.nameMax')),
        type: z.enum(['national_holiday', 'company_holiday', 'special_day'] as const),
        workingHours: z
          .coerce.number()
          .min(0, t('holidays.validation.workingHoursRange'))
          .max(24, t('holidays.validation.workingHoursRange')),
      }),
    [t],
  );

  const holidayTypeLabels: Record<HolidayType, string> = useMemo(
    () => ({
      national_holiday: t('holidays.types.nationalHoliday'),
      company_holiday: t('holidays.types.companyHoliday'),
      special_day: t('holidays.types.specialDay'),
    }),
    [t],
  );

  const holidayTypeColors: Record<HolidayType, string> = {
    national_holiday: 'bg-red-100 text-red-700 border-red-200',
    company_holiday: 'bg-blue-100 text-blue-700 border-blue-200',
    special_day: 'bg-purple-100 text-purple-700 border-purple-200',
  };

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(intlLocale, { month: 'long' }),
    [intlLocale],
  );
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(intlLocale, { month: 'short', day: 'numeric' }),
    [intlLocale],
  );

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        value: String(index + 1).padStart(2, '0'),
        label: monthFormatter.format(new Date(CURRENT_HOLIDAY_YEAR, index, 1)),
      })),
    [monthFormatter],
  );

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    control,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      month: '',
      day: '',
      name: '',
      type: 'national_holiday',
      workingHours: 0,
    },
  });

  const selectedMonth = useWatch({
    control,
    name: 'month',
  });

  const dayOptions = useMemo(() => {
    const monthNumber = Number(selectedMonth);
    if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) return [];

    return Array.from({ length: getDaysInMonth(CURRENT_HOLIDAY_YEAR, monthNumber) }, (_, index) =>
      String(index + 1).padStart(2, '0'),
    );
  }, [selectedMonth]);

  const formatHolidayDisplayDate = (value: string) => {
    const parsed = parseISO(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return dateFormatter.format(parsed);
  };

  async function onSubmit(values: z.output<typeof schema>) {
    const result = await createMutation.mutateAsync({
      date: buildHolidayDate(values.month, values.day),
      name: values.name,
      type: values.type,
      workingHours: values.workingHours,
    });
    if (result.ok) {
      toast.success(t('holidays.toasts.added'));
      reset();
      setOpen(false);
    } else {
      toast.danger(result.error.message);
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteMutation.mutateAsync(id);
    if (result.ok) {
      toast.success(t('holidays.toasts.removed'));
      setDeleteConfirmId(null);
    } else {
      toast.danger(result.error.message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <CardTitle className="flex items-center gap-2 text-base">
              {t('holidays.card.title')}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {t('holidays.card.tooltip')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription className="text-xs">
              {t('holidays.card.description')}
            </CardDescription>
          </div>

          <Dialog
            open={open}
            onOpenChange={(value) => {
              setOpen(value);
              if (!value) reset();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {t('holidays.card.addHoliday')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t('holidays.dialog.addTitle')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>
                    {t('holidays.dialog.date')} <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Controller
                      control={control}
                      name="month"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            const nextDayCount = getDaysInMonth(
                              CURRENT_HOLIDAY_YEAR,
                              Number(value),
                            );
                            const currentDay = Number(getValues('day'));
                            if (currentDay > nextDayCount) {
                              setValue('day', '', {
                                shouldDirty: true,
                                shouldTouch: true,
                                shouldValidate: true,
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('holidays.dialog.selectMonth')} />
                          </SelectTrigger>
                          <SelectContent>
                            {monthOptions.map((month) => (
                              <SelectItem key={month.value} value={month.value}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <Controller
                      control={control}
                      name="day"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!selectedMonth}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('holidays.dialog.selectDay')} />
                          </SelectTrigger>
                          <SelectContent>
                            {dayOptions.map((day) => (
                              <SelectItem key={day} value={day}>
                                {t('holidays.dialog.dayOption', { day: Number(day) })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('holidays.dialog.yearHint', { year: CURRENT_HOLIDAY_YEAR })}
                  </p>
                  {errors.month || errors.day ? (
                    <p className="text-xs text-destructive">
                      {errors.month?.message || errors.day?.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label>
                    {t('holidays.dialog.name')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder={t('holidays.dialog.namePlaceholder')}
                    {...register('name')}
                  />
                  {errors.name ? (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label>{t('holidays.dialog.type')}</Label>
                  <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(holidayTypeLabels) as [HolidayType, string][]).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1">
                    {t('holidays.dialog.workingHours')}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          {t('holidays.dialog.workingHoursTooltip')}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      className="w-28"
                      {...register('workingHours', { valueAsNumber: true })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {t('holidays.dialog.hoursHint')}
                    </span>
                  </div>
                  {errors.workingHours ? (
                    <p className="text-xs text-destructive">{errors.workingHours.message}</p>
                  ) : null}
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      reset();
                    }}
                  >
                    {t('holidays.dialog.cancel')}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending
                      ? t('holidays.dialog.adding')
                      : t('holidays.dialog.confirmAdd')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {q.isError ? (
          <Alert variant="destructive" className="mb-3">
            <AlertDescription>{q.error?.message}</AlertDescription>
          </Alert>
        ) : null}

        <Dialog
          open={!!deleteConfirmId}
          onOpenChange={(value) => {
            if (!value) setDeleteConfirmId(null);
          }}
        >
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t('holidays.deleteDialog.title')}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {t('holidays.deleteDialog.description')}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                {t('holidays.deleteDialog.cancel')}
              </Button>
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => (deleteConfirmId ? void handleDelete(deleteConfirmId) : undefined)}
              >
                {deleteMutation.isPending
                  ? t('holidays.deleteDialog.removing')
                  : t('holidays.deleteDialog.confirmRemove')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">{t('holidays.table.date')}</TableHead>
                <TableHead>{t('holidays.table.name')}</TableHead>
                <TableHead className="w-40">{t('holidays.table.type')}</TableHead>
                <TableHead className="w-28">{t('holidays.table.workingHours')}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.isPending
                ? Array.from({ length: 3 }).map((_, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Array.from({ length: 5 }).map((__, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : (q.data ?? []).map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell className="whitespace-nowrap font-mono text-sm">
                        {formatHolidayDisplayDate(holiday.date)}
                      </TableCell>
                      <TableCell className="font-medium">{holiday.name}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium',
                            holidayTypeColors[holiday.type] ?? 'bg-gray-100 text-gray-700',
                          )}
                        >
                          {holidayTypeLabels[holiday.type] ?? holiday.type}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {holiday.workingHours === 0 ? (
                          <span className="text-sm text-muted-foreground">
                            {t('holidays.table.fullDayOff')}
                          </span>
                        ) : (
                          <span className="text-sm">{holiday.workingHours}h</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteConfirmId(holiday.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              {!q.isPending && (q.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    {t('holidays.table.empty')}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
