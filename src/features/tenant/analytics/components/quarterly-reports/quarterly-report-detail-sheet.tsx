import { Download, RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatBytes } from '@/lib/utils';
import type { PeriodicReportHistoryDetail } from '../../types/quarterly-report.types';
import {
  QuarterlyReportAttemptStatusBadge,
  QuarterlyReportStatusBadge,
} from './quarterly-report-status-badge';
import {
  canResendPeriodicReport,
  getPeriodicArtifactLabel,
  getPeriodicFrequencyLabel,
  getPeriodicTriggerSourceLabel,
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

function DetailField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1 rounded-lg border bg-muted/20 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

export function QuarterlyReportDetailSheet({
  open,
  onOpenChange,
  report,
  isPending,
  errorMessage,
  canSendReports,
  isResending,
  onSafeResend,
  onRebuildResend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: PeriodicReportHistoryDetail | null | undefined;
  isPending: boolean;
  errorMessage?: string | null;
  canSendReports: boolean;
  isResending: boolean;
  onSafeResend: () => void;
  onRebuildResend: () => void;
}) {
  const t = useTranslations('analytics');
  const showResendActions =
    canSendReports && report && canResendPeriodicReport(report.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-4xl">
        <SheetHeader className="px-5 pt-5 pr-14 sm:px-6 sm:pr-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div>
              <SheetTitle>{t('periodicReports.detail.title')}</SheetTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('periodicReports.detail.description')}
              </p>
            </div>
            {report ? (
              <QuarterlyReportStatusBadge
                status={report.status}
                className="shrink-0 self-start sm:mr-2"
              />
            ) : null}
          </div>
        </SheetHeader>

        <div className="space-y-6 px-5 pb-6 sm:px-6">
          {isPending ? (
            <div className="text-sm text-muted-foreground">
              {t('periodicReports.detail.loading')}
            </div>
          ) : errorMessage ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : report ? (
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <DetailField
                  label={t('periodicReports.detail.frequency')}
                  value={getPeriodicFrequencyLabel(report.frequency, t)}
                />
                <DetailField label={t('periodicReports.detail.period')} value={report.periodKey} />
                <DetailField label={t('periodicReports.detail.scheduledFor')} value={formatDateTimeOrDash(report.scheduledFor)} />
                <DetailField label={t('periodicReports.detail.sentAt')} value={formatDateTimeOrDash(report.sentAt)} />
                <DetailField label={t('periodicReports.detail.attempts')} value={report.attemptCount} />
                <DetailField label={t('periodicReports.detail.successfulRecipients')} value={report.successCount} />
                <DetailField label={t('periodicReports.detail.failedRecipients')} value={report.failedCount} />
                <DetailField
                  label={t('periodicReports.detail.lastError')}
                  value={
                    report.lastError ? (
                      <span className="text-destructive">{report.lastError}</span>
                    ) : (
                      '-'
                    )
                  }
                />
              </div>

              {showResendActions ? (
                <Card>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">{t('periodicReports.detail.resendTitle')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('periodicReports.detail.resendDescription')}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={onSafeResend}
                        disabled={isResending}
                      >
                        {isResending ? (
                          <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCcw className="mr-2 h-4 w-4" />
                        )}
                        {t('periodicReports.detail.safeResend')}
                      </Button>
                      <Button onClick={onRebuildResend} disabled={isResending}>
                        {isResending ? (
                          <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCcw className="mr-2 h-4 w-4" />
                        )}
                        {t('periodicReports.detail.resendRebuild')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">{t('periodicReports.history.artifacts')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('periodicReports.detail.artifactsDescription')}
                  </p>
                </div>
                {report.artifacts.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {report.artifacts.map((artifact) => (
                      <Card key={`${report.runId}-${artifact.fileName}`}>
                        <CardContent className="space-y-3 p-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{artifact.fileName}</p>
                            <p className="text-sm text-muted-foreground">
                              {getPeriodicArtifactLabel(artifact.artifactType, t)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{artifact.mimeType}</span>
                            <span>{formatBytes(artifact.size)}</span>
                          </div>
                          <Button asChild variant="outline" size="sm">
                            <a
                              href={artifact.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              {t('periodicReports.detail.download')}
                            </a>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    {t('periodicReports.detail.noArtifacts')}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">{t('periodicReports.detail.attempts')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('periodicReports.detail.attemptsDescription')}
                  </p>
                </div>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('periodicReports.detail.attempt')}</TableHead>
                        <TableHead>{t('periodicReports.detail.trigger')}</TableHead>
                        <TableHead>{t('common.status')}</TableHead>
                        <TableHead>{t('periodicReports.detail.successfulRecipients')}</TableHead>
                        <TableHead>{t('periodicReports.detail.failedRecipients')}</TableHead>
                        <TableHead>{t('periodicReports.detail.started')}</TableHead>
                        <TableHead>{t('periodicReports.detail.finished')}</TableHead>
                        <TableHead>{t('periodicReports.detail.errorSummary')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.attempts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                            {t('periodicReports.detail.noAttempts')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        report.attempts.map((attempt) => (
                          <TableRow key={`${report.runId}-attempt-${attempt.attemptNo}`}>
                            <TableCell>{attempt.attemptNo}</TableCell>
                            <TableCell>{getPeriodicTriggerSourceLabel(attempt.triggerSource, t)}</TableCell>
                            <TableCell>
                              <QuarterlyReportAttemptStatusBadge status={attempt.status} />
                            </TableCell>
                            <TableCell>{attempt.successCount}</TableCell>
                            <TableCell>{attempt.failedCount}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDateTimeOrDash(attempt.startedAt)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDateTimeOrDash(attempt.finishedAt)}
                            </TableCell>
                            <TableCell className="max-w-[220px] text-sm">
                              {attempt.errorSummary || '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              {t('periodicReports.detail.selectRun')}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
