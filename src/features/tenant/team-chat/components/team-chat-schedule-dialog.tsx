'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const TIMEZONE_LABEL = 'Asia/Bangkok';
const WEEKDAY_KEYS = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'] as const;
const TIME_OPTIONS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
];

interface TeamChatScheduleDialogProps {
  open: boolean;
  mode?: 'schedule' | 'reschedule';
  initialValue?: Date | null;
  title?: string;
  description?: string;
  primaryActionLabel?: string;
  messageValue?: string;
  messagePlaceholder?: string;
  onMessageValueChange?: (value: string) => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (scheduledFor: Date) => void;
}

function createReferenceTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const reference = new Date();
  reference.setHours(hours, minutes, 0, 0);
  return reference;
}

function formatTimeLabel(value: string, formatter: Intl.DateTimeFormat) {
  return formatter.format(createReferenceTime(value));
}

function buildDefaultScheduleDate() {
  const nextDate = startOfDay(new Date());
  nextDate.setDate(nextDate.getDate() + 1);
  nextDate.setHours(9, 0, 0, 0);
  return nextDate;
}

function applyTimeToDate(date: Date, timeValue: string) {
  const [hours, minutes] = timeValue.split(':').map(Number);
  const nextDate = new Date(date);
  nextDate.setHours(hours, minutes, 0, 0);
  return nextDate;
}

function normalizeInitialState(initialValue?: Date | null) {
  const resolved = initialValue ? new Date(initialValue) : buildDefaultScheduleDate();
  return {
    date: startOfDay(resolved),
    time: format(resolved, 'HH:mm'),
  };
}

function to24HourTime(hours: number, minutes: number) {
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function normalizeTypedTimeInput(rawValue: string) {
  const compactValue = rawValue
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, '');
  if (!compactValue) return null;

  const meridiemMatch = compactValue.match(/^(\d{1,2})(?::?(\d{2}))?(am|pm)$/);
  if (meridiemMatch) {
    const rawHours = Number(meridiemMatch[1]);
    const minutes = Number(meridiemMatch[2] ?? '0');
    if (rawHours < 1 || rawHours > 12 || minutes > 59) return null;

    const meridiem = meridiemMatch[3];
    const normalizedHours = (rawHours % 12) + (meridiem === 'pm' ? 12 : 0);
    return to24HourTime(normalizedHours, minutes);
  }

  const colonMatch = compactValue.match(/^(\d{1,2}):(\d{2})$/);
  if (colonMatch) {
    return to24HourTime(Number(colonMatch[1]), Number(colonMatch[2]));
  }

  const digitsOnlyMatch = compactValue.match(/^\d{1,4}$/);
  if (!digitsOnlyMatch) return null;

  const digits = digitsOnlyMatch[0];
  if (digits.length <= 2) {
    return to24HourTime(Number(digits), 0);
  }

  if (digits.length === 3) {
    return to24HourTime(Number(digits[0]), Number(digits.slice(1)));
  }

  return to24HourTime(Number(digits.slice(0, 2)), Number(digits.slice(2)));
}

export function TeamChatScheduleDialog({
  open,
  mode = 'schedule',
  initialValue,
  title,
  description,
  primaryActionLabel,
  messageValue,
  messagePlaceholder,
  onMessageValueChange,
  secondaryActionLabel,
  onSecondaryAction,
  onOpenChange,
  onSubmit,
}: TeamChatScheduleDialogProps) {
  const t = useTranslations('teamChat');
  const locale = useLocale();
  const initialState = useMemo(() => normalizeInitialState(initialValue), [initialValue]);
  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale],
  );
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }),
    [locale],
  );
  const dayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'long' }),
    [locale],
  );
  const timeFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }),
    [locale],
  );
  const [selectedDate, setSelectedDate] = useState(initialState.date);
  const [selectedTime, setSelectedTime] = useState(initialState.time);
  const [displayMonth, setDisplayMonth] = useState(startOfMonth(initialState.date));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [timeInputValue, setTimeInputValue] = useState(formatTimeLabel(initialState.time, timeFormatter));
  const [currentTimestamp, setCurrentTimestamp] = useState<number | null>(null);

  const formatScheduledDayLabel = (reference: Date) => {
    if (isSameDay(reference, new Date())) return t('schedule.today');

    const tomorrow = startOfDay(new Date());
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (isSameDay(reference, tomorrow)) return t('schedule.tomorrow');

    return dayFormatter.format(reference);
  };

  const formatScheduledDateLabel = (reference: Date) =>
    `${formatScheduledDayLabel(reference)}, ${dateFormatter.format(reference)}`;

  const formatScheduledHintLabel = (reference: Date) =>
    `${formatScheduledDayLabel(reference)} ${timeFormatter.format(reference)}`;

  useEffect(() => {
    if (!open) return;

    const frameId = window.requestAnimationFrame(() => {
      setSelectedDate(initialState.date);
      setSelectedTime(initialState.time);
      setDisplayMonth(startOfMonth(initialState.date));
      setCalendarOpen(false);
      setTimePickerOpen(false);
      setTimeInputValue(formatTimeLabel(initialState.time, timeFormatter));
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [initialState.date, initialState.time, open, timeFormatter]);

  useEffect(() => {
    if (!open) return;

    const syncCurrentTimestamp = () => setCurrentTimestamp(Date.now());
    const timeoutId = window.setTimeout(syncCurrentTimestamp, 0);

    const intervalId = window.setInterval(syncCurrentTimestamp, 30_000);
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [open]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(displayMonth);
    const monthEnd = endOfMonth(displayMonth);
    const intervalStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const intervalEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: intervalStart, end: intervalEnd });
  }, [displayMonth]);

  const scheduledFor = useMemo(
    () => applyTimeToDate(selectedDate, selectedTime),
    [selectedDate, selectedTime],
  );
  const isPastSelection =
    currentTimestamp !== null && scheduledFor.getTime() <= currentTimestamp;
  const supportsMessageEditor =
    typeof messageValue === 'string' && typeof onMessageValueChange === 'function';
  const isMessageInvalid = supportsMessageEditor && messageValue.trim().length === 0;

  const commitTypedTime = (rawValue: string) => {
    const normalizedTime = normalizeTypedTimeInput(rawValue);
    if (!normalizedTime) {
      setTimeInputValue(formatTimeLabel(selectedTime, timeFormatter));
      return false;
    }

    setSelectedTime(normalizedTime);
    setTimeInputValue(formatTimeLabel(normalizedTime, timeFormatter));
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="border-border bg-card max-w-[680px] gap-0 overflow-hidden rounded-3xl p-0"
      >
        <div className="border-border border-b px-6 py-5">
          <DialogHeader className="gap-1 text-left">
            <DialogTitle className="text-2xl tracking-tight">
              {title ??
                (mode === 'reschedule' ? t('schedule.rescheduleTitle') : t('schedule.title'))}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {description ?? t('schedule.timezone', { timezone: TIMEZONE_LABEL })}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 py-5">
          {supportsMessageEditor ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-semibold tracking-[0.08em] uppercase">
                {t('schedule.messageLabel')}
              </p>
              <Textarea
                value={messageValue}
                onChange={(event) => onMessageValueChange(event.target.value)}
                placeholder={messagePlaceholder ?? t('schedule.messagePlaceholder')}
                className="border-border bg-background min-h-[120px] rounded-2xl px-4 py-3 text-sm leading-6"
              />
              {isMessageInvalid ? (
                <p className="text-xs text-amber-300">
                  {t('schedule.messageRequired')}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-[minmax(0,1.35fr)_210px]">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="border-border bg-background hover:border-primary/40 hover:bg-muted/40 flex h-11 w-full items-center justify-between rounded-2xl border px-4 text-left text-sm transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <CalendarDays className="text-muted-foreground h-4 w-4" />
                    <span className="font-medium">
                      {formatScheduledDateLabel(selectedDate)}
                    </span>
                  </span>
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="border-border bg-popover w-[390px] rounded-3xl p-4 shadow-2xl"
              >
                <div className="flex items-center justify-between pb-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full"
                    onClick={() => setDisplayMonth((current) => subMonths(current, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-base font-semibold">
                    {monthFormatter.format(displayMonth)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full"
                    onClick={() => setDisplayMonth((current) => addMonths(current, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-muted-foreground grid grid-cols-7 gap-1 pb-2 text-center text-xs font-medium">
                  {WEEKDAY_KEYS.map((day) => (
                    <div key={day} className="py-1">
                      {t(`schedule.weekdayShort.${day}`)}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, displayMonth);

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => {
                          setSelectedDate(startOfDay(day));
                          setCalendarOpen(false);
                        }}
                        className={cn(
                          'flex h-11 items-center justify-center rounded-2xl text-sm font-medium transition-colors',
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : isCurrentMonth
                              ? 'text-foreground hover:bg-muted'
                              : 'text-muted-foreground/45 hover:bg-muted/40',
                        )}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={timePickerOpen} onOpenChange={setTimePickerOpen}>
              <div className="group/timefield border-border bg-background hover:border-primary/40 hover:bg-muted/40 focus-within:border-primary/40 focus-within:ring-primary/25 flex h-11 w-full items-center rounded-2xl border pr-2 pl-4 transition-colors focus-within:ring-2">
                <Clock3 className="text-muted-foreground h-4 w-4 shrink-0" />
                <Input
                  value={timeInputValue}
                  onChange={(event) => setTimeInputValue(event.target.value)}
                  onBlur={() => {
                    commitTypedTime(timeInputValue);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    if (commitTypedTime(timeInputValue)) {
                      setTimePickerOpen(false);
                    }
                  }}
                  aria-label={t('schedule.scheduleTime')}
                  className="h-full flex-1 rounded-none border-0 bg-transparent px-3 py-0 text-sm font-medium shadow-none focus-visible:ring-0 group-hover/timefield:bg-transparent dark:bg-transparent"
                />
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label={t('schedule.openTimeOptions')}
                    className="text-muted-foreground inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent transition-colors hover:bg-transparent"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
              </div>
              <PopoverContent
                align="end"
                className="border-border bg-popover w-[280px] rounded-3xl p-3 shadow-2xl"
              >
                <div className="max-h-[240px] space-y-1 overflow-y-auto overscroll-contain pr-1">
                  {TIME_OPTIONS.map((timeValue) => {
                    const isSelected = timeValue === selectedTime;
                    return (
                      <button
                        key={timeValue}
                        type="button"
                        onClick={() => {
                          setSelectedTime(timeValue);
                          setTimeInputValue(formatTimeLabel(timeValue, timeFormatter));
                          setTimePickerOpen(false);
                        }}
                        className={cn(
                          'flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition-colors',
                          isSelected
                            ? 'bg-primary/12 text-foreground'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                        )}
                      >
                        <span className="font-medium">{formatTimeLabel(timeValue, timeFormatter)}</span>
                        {isSelected ? <Check className="text-primary h-4 w-4" /> : null}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="border-border bg-muted/20 text-muted-foreground rounded-2xl border px-4 py-3 text-sm">
            {isPastSelection
              ? t('schedule.pickFuture')
              : t('schedule.queuedFor', { value: formatScheduledHintLabel(scheduledFor) })}
          </div>
        </div>

        <DialogFooter className="border-border border-t px-6 py-4 sm:justify-between">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            {secondaryActionLabel && onSecondaryAction ? (
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={onSecondaryAction}
              >
                {secondaryActionLabel}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
          </div>
          <Button
            type="button"
            className="rounded-xl px-5"
            disabled={isPastSelection || isMessageInvalid}
            onClick={() => {
              onSubmit(scheduledFor);
              onOpenChange(false);
            }}
          >
            {primaryActionLabel ??
              (mode === 'reschedule' ? t('schedule.saveNewTime') : t('schedule.title'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
