import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type {
  PeriodicReportAttemptStatus,
  PeriodicReportRunStatus,
} from '../../types/quarterly-report.types';
import {
  getPeriodicAttemptStatusLabel,
  getPeriodicRunStatusLabel,
} from './quarterly-report-utils';

function getRunStatusClasses(status: PeriodicReportRunStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
    case 'running':
      return 'bg-sky-500/10 text-sky-700 border-sky-500/20';
    case 'sent':
      return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
    case 'partial_failed':
      return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
    case 'failed_retryable':
      return 'bg-rose-500/10 text-rose-700 border-rose-500/20';
    case 'failed_exhausted':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return '';
  }
}

function getAttemptStatusClasses(status: PeriodicReportAttemptStatus): string {
  switch (status) {
    case 'success':
      return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
    case 'partial_failed':
      return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
    case 'failed':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return '';
  }
}

export function QuarterlyReportStatusBadge({
  status,
  className,
}: {
  status: PeriodicReportRunStatus;
  className?: string;
}) {
  const t = useTranslations('analytics');

  return (
    <Badge
      variant="outline"
      className={cn('whitespace-nowrap', getRunStatusClasses(status), className)}
    >
      {getPeriodicRunStatusLabel(status, t)}
    </Badge>
  );
}

export function QuarterlyReportAttemptStatusBadge({
  status,
  className,
}: {
  status: PeriodicReportAttemptStatus;
  className?: string;
}) {
  const t = useTranslations('analytics');

  return (
    <Badge
      variant="outline"
      className={cn(
        'whitespace-nowrap',
        getAttemptStatusClasses(status),
        className,
      )}
    >
      {getPeriodicAttemptStatusLabel(status, t)}
    </Badge>
  );
}
