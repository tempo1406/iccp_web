import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  PeriodicReportFrequency,
  PeriodicReportHistorySortField,
  PeriodicReportRunStatus,
} from '../../types/quarterly-report.types';
import {
  getPeriodicFrequencyLabel,
  getPeriodicRunStatusLabel,
  isValidPeriodicPeriodKey,
  normalizePeriodicPeriodKey,
} from './quarterly-report-utils';

const RUN_STATUS_OPTIONS: PeriodicReportRunStatus[] = [
  'pending',
  'running',
  'sent',
  'partial_failed',
  'failed_retryable',
  'failed_exhausted',
];

const SORT_OPTIONS: Array<{
  value: PeriodicReportHistorySortField;
  label: string;
}> = [
  { value: 'scheduledFor', label: 'Scheduled For' },
  { value: 'updatedAt', label: 'Updated At' },
  { value: 'sentAt', label: 'Sent At' },
  { value: 'createdAt', label: 'Created At' },
];

export function QuarterlyReportFilters({
  frequency,
  periodKey,
  status,
  sortBy,
  sortOrder,
  onFrequencyChange,
  onPeriodKeyChange,
  onStatusChange,
  onSortByChange,
  onSortOrderChange,
  onReset,
}: {
  frequency: 'all' | PeriodicReportFrequency;
  periodKey: string;
  status: 'all' | PeriodicReportRunStatus;
  sortBy: PeriodicReportHistorySortField;
  sortOrder: 'ASC' | 'DESC';
  onFrequencyChange: (value: 'all' | PeriodicReportFrequency) => void;
  onPeriodKeyChange: (value: string) => void;
  onStatusChange: (value: 'all' | PeriodicReportRunStatus) => void;
  onSortByChange: (value: PeriodicReportHistorySortField) => void;
  onSortOrderChange: (value: 'ASC' | 'DESC') => void;
  onReset: () => void;
}) {
  const t = useTranslations('analytics');
  const normalizedPeriodKey = normalizePeriodicPeriodKey(periodKey);
  const showPeriodKeyWarning =
    normalizedPeriodKey.length > 0 &&
    !isValidPeriodicPeriodKey(
      normalizedPeriodKey,
      frequency === 'all' ? undefined : frequency,
    );

  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Select
            value={frequency}
            onValueChange={(value) =>
              onFrequencyChange(value as 'all' | PeriodicReportFrequency)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t('periodicReports.filters.frequency')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('periodicReports.filters.allFrequencies')}</SelectItem>
              {(['monthly', 'quarterly', 'yearly'] as const).map((option) => (
                <SelectItem key={option} value={option}>
                  {getPeriodicFrequencyLabel(option, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-1">
            <Input
              value={periodKey}
              onChange={(event) => onPeriodKeyChange(event.target.value.toUpperCase())}
              placeholder={t('periodicReports.filters.periodKeyPlaceholder')}
            />
            {showPeriodKeyWarning ? (
              <p className="text-xs text-muted-foreground">
                {t('periodicReports.filters.periodKeyHint', {
                  monthly: '2026-M03',
                  quarterly: '2026-Q1',
                  yearly: '2026-Y',
                })}
              </p>
            ) : null}
          </div>

          <Select
            value={status}
            onValueChange={(value) =>
              onStatusChange(value as 'all' | PeriodicReportRunStatus)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t('periodicReports.filters.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('periodicReports.filters.allStatuses')}</SelectItem>
              {RUN_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {getPeriodicRunStatusLabel(option, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value) =>
              onSortByChange(value as PeriodicReportHistorySortField)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t('periodicReports.filters.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(`periodicReports.filters.${option.value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sortOrder}
            onValueChange={(value) => onSortOrderChange(value as 'ASC' | 'DESC')}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('periodicReports.filters.order')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DESC">{t('periodicReports.filters.newestFirst')}</SelectItem>
              <SelectItem value="ASC">{t('periodicReports.filters.oldestFirst')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={onReset}>
          {t('periodicReports.filters.reset')}
        </Button>
      </div>
    </div>
  );
}
