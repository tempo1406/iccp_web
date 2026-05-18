'use client';

import { CalendarIcon, X } from 'lucide-react';
import { format, parseISO, startOfDay } from 'date-fns';
import type { DayPickerProps, Matcher } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

function parseDateValue(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

interface DatePickerProps {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: string | Date | null;
  maxDate?: string | Date | null;
  defaultMonth?: string | Date | null;
  startMonth?: string | Date | null;
  endMonth?: string | Date | null;
  captionLayout?: DayPickerProps['captionLayout'];
  reverseYears?: boolean;
  className?: string;
  align?: 'start' | 'center' | 'end';
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  minDate,
  maxDate,
  defaultMonth,
  startMonth,
  endMonth,
  captionLayout,
  reverseYears,
  className,
  align = 'start',
  id,
}: DatePickerProps) {
  const selectedDate = parseDateValue(value);
  const minSelectableDate =
    minDate instanceof Date
      ? startOfDay(minDate)
      : typeof minDate === 'string'
        ? parseDateValue(minDate)
        : undefined;
  const maxSelectableDate =
    maxDate instanceof Date
      ? startOfDay(maxDate)
      : typeof maxDate === 'string'
        ? parseDateValue(maxDate)
        : undefined;
  const defaultVisibleMonth =
    defaultMonth instanceof Date
      ? startOfDay(defaultMonth)
      : typeof defaultMonth === 'string'
        ? parseDateValue(defaultMonth)
        : undefined;
  const startVisibleMonth =
    startMonth instanceof Date
      ? startOfDay(startMonth)
      : typeof startMonth === 'string'
        ? parseDateValue(startMonth)
        : undefined;
  const endVisibleMonth =
    endMonth instanceof Date
      ? startOfDay(endMonth)
      : typeof endMonth === 'string'
        ? parseDateValue(endMonth)
        : undefined;
  const disabledDays: Matcher[] | undefined =
    minSelectableDate || maxSelectableDate
      ? [
          ...(minSelectableDate ? [{ before: minSelectableDate } satisfies Matcher] : []),
          ...(maxSelectableDate ? [{ after: maxSelectableDate } satisfies Matcher] : []),
        ]
      : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-between text-left font-normal',
            !selectedDate && 'text-muted-foreground',
            className,
          )}
        >
          <span>
            {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : placeholder}
          </span>
          <CalendarIcon className="text-muted-foreground h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : '')}
          disabled={disabledDays}
          defaultMonth={selectedDate ?? defaultVisibleMonth}
          startMonth={startVisibleMonth}
          endMonth={endVisibleMonth}
          captionLayout={captionLayout}
          reverseYears={reverseYears}
          initialFocus
        />
        <div className="border-t p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => onChange('')}
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
