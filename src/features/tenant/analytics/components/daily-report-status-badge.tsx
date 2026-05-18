'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DailyReportStatus } from '../types/daily-report.types';
import { useTranslations } from 'next-intl';

interface DailyReportStatusBadgeProps {
  status: DailyReportStatus;
  className?: string;
}

export function DailyReportStatusBadge({
  status,
  className,
}: DailyReportStatusBadgeProps) {
  const t = useTranslations('project.reportView.statuses');

  return (
    <Badge
      variant="outline"
      className={cn(
        status === 'draft' && 'border-slate-300 text-slate-700',
        status === 'submitted' && 'border-emerald-300 text-emerald-700',
        status === 'locked' && 'border-amber-300 text-amber-700',
        className,
      )}
    >
      {t(status)}
    </Badge>
  );
}
