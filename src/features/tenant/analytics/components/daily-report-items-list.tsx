'use client';

import { Clock3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DailyReportItemResponse } from '../types/daily-report.types';
import {
  formatDailyDateTime,
  formatDailyMinutes,
  sortDailyReportItems,
} from './daily-report-utils';

interface DailyReportItemsListProps {
  items: DailyReportItemResponse[];
}

export function DailyReportItemsList({ items }: DailyReportItemsListProps) {
  const t = useTranslations('analytics');
  const narrativeT = useTranslations('project.reportView.narrative');
  const reportT = useTranslations('project.reportView.common');
  const sortedItems = sortDailyReportItems(items);

  if (sortedItems.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {t('dailyReports.items.empty')}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <Table className="min-w-[980px] table-fixed">
        <TableHeader>
          <TableRow className="bg-muted/25 hover:bg-muted/25">
            <TableHead className="w-[22%]">{t('dailyReports.items.headers.task')}</TableHead>
            <TableHead className="w-[30%]">{narrativeT('summary')}</TableHead>
            <TableHead className="w-[10%]">{t('dailyReports.items.headers.date')}</TableHead>
            <TableHead className="w-[18%]">{t('dailyReports.items.headers.time')}</TableHead>
            <TableHead className="w-[8%]">{t('dailyReports.items.headers.logged')}</TableHead>
            <TableHead className="w-[8%]">{t('dailyReports.items.headers.progress')}</TableHead>
            <TableHead className="w-[4%]">{t('dailyReports.items.headers.flags')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.map((item) => {
            const taskLabel = item.taskSlug?.trim()
              ? `${item.taskSlug} ${item.taskTitle ?? ''}`.trim()
              : item.taskTitle?.trim() || t('dailyReports.items.manualItem');
            const projectLabel = item.projectName?.trim() || t('common.noProject');
            const timeRange =
              item.startedAt && item.endedAt
                ? `${formatDailyDateTime(item.startedAt, reportT('notAvailable'))} - ${formatDailyDateTime(item.endedAt, reportT('notAvailable'))}`
                : reportT('notAvailable');

            return (
              <TableRow key={item.id}>
                <TableCell className="align-top whitespace-normal">
                  <div className="min-w-0 space-y-2">
                    <p className="break-words font-medium">{taskLabel}</p>
                    <div className="text-muted-foreground text-xs break-words">
                      <span>{projectLabel}</span>
                      <span className="mx-1">/</span>
                      <span>{item.type}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="align-top text-sm whitespace-pre-wrap break-words">
                  {item.content?.trim() || t('dailyReports.items.noSummary')}
                </TableCell>
                <TableCell className="align-top text-sm break-words">
                  {item.workDate ?? reportT('notAvailable')}
                </TableCell>
                <TableCell className="align-top text-sm whitespace-normal">
                  <div className="text-muted-foreground flex min-w-0 items-start gap-2">
                    <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="break-words">{timeRange}</span>
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <Badge variant="secondary" className="whitespace-normal text-center">
                    {formatDailyMinutes(item.durationMinutes)}
                  </Badge>
                </TableCell>
                <TableCell className="align-top">
                  {item.progressPercent != null ? (
                    <Badge variant="outline">{item.progressPercent}%</Badge>
                  ) : null}
                </TableCell>
                <TableCell className="align-top">
                  <div className="flex flex-wrap gap-2">
                    {item.isBlocker ? <Badge variant="destructive">{t('dailyReports.items.blocker')}</Badge> : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
