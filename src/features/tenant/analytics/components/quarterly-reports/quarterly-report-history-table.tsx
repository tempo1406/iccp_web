import { ChevronLeft, ChevronRight, Download, Eye, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatBytes, truncate } from '@/lib/utils';
import type {
  PeriodicReportHistoryItem,
  PeriodicReportHistoryListMeta,
} from '../../types/quarterly-report.types';
import { QuarterlyReportStatusBadge } from './quarterly-report-status-badge';
import {
  getPeriodicArtifactLabel,
  getPeriodicFrequencyLabel,
} from './quarterly-report-utils';

function formatDateTimeOrDash(value?: string | null): string {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const EMPTY_META: PeriodicReportHistoryListMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function QuarterlyReportHistoryTable({
  items,
  meta = EMPTY_META,
  isPending,
  errorMessage,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onViewDetails,
}: {
  items: PeriodicReportHistoryItem[];
  meta?: PeriodicReportHistoryListMeta;
  isPending: boolean;
  errorMessage?: string | null;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onViewDetails: (runId: string) => void;
}) {
  const t = useTranslations('analytics');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('periodicReports.history.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
                <TableRow>
                  <TableHead>{t('periodicReports.history.frequency')}</TableHead>
                  <TableHead>{t('periodicReports.history.period')}</TableHead>
                  <TableHead>{t('periodicReports.history.status')}</TableHead>
                  <TableHead>{t('periodicReports.history.scheduled')}</TableHead>
                  <TableHead>{t('periodicReports.history.sent')}</TableHead>
                  <TableHead>{t('periodicReports.history.attempts')}</TableHead>
                  <TableHead>{t('periodicReports.history.recipients')}</TableHead>
                  <TableHead>{t('periodicReports.history.artifacts')}</TableHead>
                  <TableHead>{t('periodicReports.history.lastError')}</TableHead>
                  <TableHead className="w-[120px] text-right">{t('periodicReports.history.actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                    {t('periodicReports.history.loading')}
                  </TableCell>
                </TableRow>
              ) : errorMessage ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-sm text-destructive">
                    {errorMessage}
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                    {t('periodicReports.history.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.runId}>
                    <TableCell>
                      <Badge variant="outline">
                        {getPeriodicFrequencyLabel(item.frequency, t)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.periodKey}</TableCell>
                    <TableCell>
                      <QuarterlyReportStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTimeOrDash(item.scheduledFor)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTimeOrDash(item.sentAt)}
                    </TableCell>
                    <TableCell>{item.attemptCount}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>{t('periodicReports.history.successfulRecipients', { count: item.successCount })}</div>
                        <div className="text-muted-foreground">
                          {t('periodicReports.history.failedRecipients', { count: item.failedCount })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.artifacts.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.artifacts.slice(0, 2).map((artifact) => (
                            <Button
                              key={`${item.runId}-${artifact.fileName}`}
                              variant="outline"
                              size="xs"
                              asChild
                            >
                              <a
                                href={artifact.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                title={`${getPeriodicArtifactLabel(artifact.artifactType, t)} - ${formatBytes(artifact.size)}`}
                              >
                                <Download className="h-3 w-3" />
                                {truncate(artifact.fileName, 18)}
                              </a>
                            </Button>
                          ))}
                          {item.artifacts.length > 2 ? (
                            <Badge variant="outline">+{item.artifacts.length - 2}</Badge>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[240px]">
                      {item.lastError ? (
                        <span className="text-sm text-destructive" title={item.lastError}>
                          {truncate(item.lastError, 90)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {item.artifacts[0]?.fileUrl ? (
                          <Button variant="ghost" size="icon-sm" asChild>
                            <a
                              href={item.artifacts[0].fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              title={t('periodicReports.history.openFirstArtifact')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails(item.runId)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {t('common.view')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {t('periodicReports.history.totalRuns', {
              total: meta.total,
              page: meta.page,
              totalPages: Math.max(meta.totalPages, 1),
            })}
          </p>

          <div className="flex items-center gap-2">
            <select
              value={String(limit)}
              onChange={(event) => onLimitChange(Number(event.target.value))}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="10">{t('periodicReports.history.perPage', { count: 10 })}</option>
              <option value="20">{t('periodicReports.history.perPage', { count: 20 })}</option>
              <option value="50">{t('periodicReports.history.perPage', { count: 50 })}</option>
            </select>
            <Button
              variant="outline"
              size="icon"
              disabled={!meta.hasPreviousPage || isPending || page <= 1}
              onClick={() => onPageChange(Math.max(page - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={!meta.hasNextPage || isPending}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
