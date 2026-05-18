'use client';

import { useState, useEffect } from 'react';
import { Filter, RotateCcw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { parseISO, format, addMonths, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  TicketRequestListQuery,
  TicketRequestStatus,
} from '../../../../services/ticket/types/ticket-request.types';
import { TICKET_REQUEST_STATUSES } from '../../../../services/ticket/types/ticket-request.types';
import { getTicketStatusLabel } from './ticket-request-utils';

interface TicketRequestFiltersProps {
  filters: TicketRequestListQuery;
  isPending: boolean;
  onFiltersChange: (next: TicketRequestListQuery) => void;
}

const DEFAULT_FILTERS: Pick<
  TicketRequestListQuery,
  'search' | 'status' | 'fromDate' | 'toDate'
> = {
  search: '',
  status: undefined,
  fromDate: undefined,
  toDate: undefined,
};

export function TicketRequestFilters({
  filters,
  isPending,
  onFiltersChange,
}: TicketRequestFiltersProps) {
  const t = useTranslations('ticket');
  const tStatuses = useTranslations('ticket.labels.statuses');
  const [localSearch, setLocalSearch] = useState(filters.search ?? '');

  useEffect(() => {
    setLocalSearch(filters.search ?? '');
  }, [filters.search]);

  const handleSearch = () => {
    onFiltersChange({ ...filters, page: 1, search: localSearch });
  };

  const handleReset = () => {
    setLocalSearch('');
    onFiltersChange({ ...filters, page: 1, ...DEFAULT_FILTERS });
  };

  const handleShiftMonth = (direction: 'prev' | 'next') => {
    let newFrom = filters.fromDate;
    let newTo = filters.toDate;

    if (filters.fromDate) {
      const from = parseISO(filters.fromDate);
      if (!Number.isNaN(from.getTime())) {
        newFrom = format(direction === 'prev' ? subMonths(from, 1) : addMonths(from, 1), 'yyyy-MM-dd');
      }
    }

    if (filters.toDate) {
      const to = parseISO(filters.toDate);
      if (!Number.isNaN(to.getTime())) {
        newTo = format(direction === 'prev' ? subMonths(to, 1) : addMonths(to, 1), 'yyyy-MM-dd');
      }
    }

    if (newFrom !== filters.fromDate || newTo !== filters.toDate) {
      onFiltersChange({ ...filters, page: 1, fromDate: newFrom, toDate: newTo });
    }
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== undefined ||
    filters.fromDate !== undefined ||
    filters.toDate !== undefined;

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4" />
          {t('filters.title')}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {/* Status */}
        <div className="w-full md:w-[200px] shrink-0">
          <Select
            value={filters.status ?? 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                page: 1,
                status: value === 'all' ? undefined : (value as TicketRequestStatus),
              })
            }
          >
            <SelectTrigger className="bg-background h-10 w-full">
              <SelectValue placeholder={t('filters.allStatuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
              {TICKET_REQUEST_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {getTicketStatusLabel(status, tStatuses)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="flex items-center justify-between rounded-md border border-input bg-background shadow-sm h-10 overflow-hidden w-full md:w-[350px] shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleShiftMonth('prev')}
            disabled={isPending || (!filters.fromDate && !filters.toDate)}
            className="h-full w-9 shrink-0 rounded-none border-r text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex flex-1 items-center justify-center gap-1 px-1">
            <DatePicker
              value={filters.fromDate ?? null}
              onChange={(value) =>
                onFiltersChange({ ...filters, page: 1, fromDate: value || undefined })
              }
              placeholder={t('filters.startDate')}
              className="h-8 flex-1 border-0 shadow-none hover:bg-muted/50 px-2 text-sm justify-between rounded-md"
              align="center"
            />
            <span className="text-muted-foreground text-sm font-medium">to</span>
            <DatePicker
              value={filters.toDate ?? null}
              onChange={(value) =>
                onFiltersChange({ ...filters, page: 1, toDate: value || undefined })
              }
              placeholder={t('filters.endDate')}
              className="h-8 flex-1 border-0 shadow-none hover:bg-muted/50 px-2 text-sm justify-between rounded-md"
              align="center"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleShiftMonth('next')}
            disabled={isPending || (!filters.fromDate && !filters.toDate)}
            className="h-full w-9 shrink-0 rounded-none border-l text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Conditional Reset Button next to Date Range */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-10 text-muted-foreground hover:text-foreground shrink-0">
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('filters.reset')}
          </Button>
        )}

        {/* Spacer */}
        <div className="hidden md:block flex-1" />

        {/* Search */}
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-[350px]">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              className="bg-background pl-9 h-10 w-full"
              placeholder={t('filters.searchPlaceholder')}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
          </div>
          <Button size="default" className="h-10 px-3 shrink-0" onClick={handleSearch} disabled={isPending}>
            <Search className="h-4 w-4 shrink-0" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
