'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/common/constant/routes';
import { usePagination } from '@/hooks/use-pagination';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { toast } from '@/lib/toast';
import { useTenant } from '@/providers';
import {
  useDispatchPeriodicReport,
  usePeriodicReportHistory,
  usePeriodicReportHistoryDetail,
} from '../../query/use-quarterly-reports';
import type {
  PeriodicReportDispatchRequest,
  PeriodicReportFrequency,
  PeriodicReportHistorySortField,
  PeriodicReportRunStatus,
} from '../../types/quarterly-report.types';
import { QuarterlyReportDetailSheet } from './quarterly-report-detail-sheet';
import { QuarterlyReportDispatchDialog } from './quarterly-report-dispatch-dialog';
import { QuarterlyReportFilters } from './quarterly-report-filters';
import { QuarterlyReportHistoryTable } from './quarterly-report-history-table';
import {
  isValidPeriodicPeriodKey,
  normalizePeriodicPeriodKey,
  toPeriodicDispatchErrorMessage,
} from './quarterly-report-utils';

type StatusFilter = 'all' | PeriodicReportRunStatus;
type FrequencyFilter = 'all' | PeriodicReportFrequency;

export function PeriodicReportsPage() {
  const t = useTranslations('analytics');
  const { tenantSlug } = useTenant();
  const canViewReports = useCan(PERMISSIONS.ANALYTICS_REPORTS_VIEW);
  const canSendReports = useCan(PERMISSIONS.ANALYTICS_REPORTS_SEND);
  const pagination = usePagination({ initialPage: 1, initialLimit: 10 });

  const [frequencyFilter, setFrequencyFilter] = useState<FrequencyFilter>('all');
  const [periodKeyFilter, setPeriodKeyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] =
    useState<PeriodicReportHistorySortField>('scheduledFor');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [dispatchOpen, setDispatchOpen] = useState(false);

  const normalizedPeriodKey = useMemo(
    () => normalizePeriodicPeriodKey(periodKeyFilter),
    [periodKeyFilter],
  );
  const effectivePeriodKey = isValidPeriodicPeriodKey(
    normalizedPeriodKey,
    frequencyFilter === 'all' ? undefined : frequencyFilter,
  )
    ? normalizedPeriodKey
    : undefined;

  const historyQuery = usePeriodicReportHistory(
    {
      page: pagination.page,
      limit: pagination.limit,
      sortBy,
      sortOrder,
      frequency: frequencyFilter === 'all' ? undefined : frequencyFilter,
      periodKey: effectivePeriodKey,
      status: statusFilter === 'all' ? undefined : statusFilter,
    },
    canViewReports,
  );

  const detailQuery = usePeriodicReportHistoryDetail(
    selectedRunId,
    canViewReports && detailOpen && Boolean(selectedRunId),
  );
  const dispatchMutation = useDispatchPeriodicReport();

  const selectedReport = detailQuery.data ?? null;

  const openDetail = (runId: string) => {
    setSelectedRunId(runId);
    setDetailOpen(true);
  };

  const handleDispatch = async (payload: PeriodicReportDispatchRequest) => {
    const result = await dispatchMutation.mutateAsync(payload);

    if (!result.ok) {
      toast.danger(
        toPeriodicDispatchErrorMessage(
          result.error,
          t('periodicReports.failedDispatch'),
          t,
        ),
      );
      return;
    }

    toast.success(t('periodicReports.dispatchSuccess', { periodKey: payload.periodKey }));
    setDispatchOpen(false);
    setSelectedRunId(result.data.runId);
    setDetailOpen(true);
    pagination.setPage(1);
  };

  const handleResend = async (forceRebuild: boolean) => {
    if (!selectedReport) return;

    const result = await dispatchMutation.mutateAsync({
      periodKey: selectedReport.periodKey,
      forceResend: true,
      forceRebuild,
    });

    if (!result.ok) {
      toast.danger(
        toPeriodicDispatchErrorMessage(
          result.error,
          t('periodicReports.failedResend'),
          t,
        ),
      );
      return;
    }

    toast.success(
      forceRebuild
        ? t('periodicReports.resendWithRebuild', { periodKey: selectedReport.periodKey })
        : t('periodicReports.resendSuccess', { periodKey: selectedReport.periodKey }),
    );
    setSelectedRunId(result.data.runId);
  };

  if (!canViewReports) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('page.periodicReportsTitle')}
          description={t('page.periodicReportsDescriptionNoPermission')}
          breadcrumbs={[
            { label: t('common.dashboard'), href: ROUTES.tenant.dashboard(tenantSlug) },
            { label: t('common.analytics') },
            { label: t('page.periodicReportsTitle') },
          ]}
        />

        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>{t('page.permissionDenied')}</AlertTitle>
          <AlertDescription>
            {t('page.requiredPermission')} <code>{PERMISSIONS.ANALYTICS_REPORTS_VIEW}</code>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('page.periodicReportsTitle')}
        description={t('page.periodicReportsDescription')}
        breadcrumbs={[
          { label: t('common.dashboard'), href: ROUTES.tenant.dashboard(tenantSlug) },
          { label: t('common.analytics') },
          { label: t('page.periodicReportsTitle') },
        ]}
        actions={
          canSendReports ? (
            <Button onClick={() => setDispatchOpen(true)}>
              {t('periodicReports.dispatchNow')}
            </Button>
          ) : undefined
        }
      />

      <QuarterlyReportFilters
        frequency={frequencyFilter}
        periodKey={periodKeyFilter}
        status={statusFilter}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onFrequencyChange={(value) => {
          setFrequencyFilter(value);
          pagination.setPage(1);
        }}
        onPeriodKeyChange={(value) => {
          setPeriodKeyFilter(value);
          pagination.setPage(1);
        }}
        onStatusChange={(value) => {
          setStatusFilter(value);
          pagination.setPage(1);
        }}
        onSortByChange={(value) => {
          setSortBy(value);
          pagination.setPage(1);
        }}
        onSortOrderChange={(value) => {
          setSortOrder(value);
          pagination.setPage(1);
        }}
        onReset={() => {
          setFrequencyFilter('all');
          setPeriodKeyFilter('');
          setStatusFilter('all');
          setSortBy('scheduledFor');
          setSortOrder('DESC');
          pagination.setPage(1);
          pagination.setLimit(10);
        }}
      />

      <QuarterlyReportHistoryTable
        items={historyQuery.data?.data ?? []}
        meta={historyQuery.data?.meta}
        isPending={historyQuery.isPending}
        errorMessage={historyQuery.isError ? historyQuery.error?.message : null}
        page={pagination.page}
        limit={pagination.limit}
        onPageChange={pagination.setPage}
        onLimitChange={(nextLimit) => {
          pagination.setLimit(nextLimit);
          pagination.setPage(1);
        }}
        onViewDetails={openDetail}
      />

      <QuarterlyReportDispatchDialog
        open={dispatchOpen}
        onOpenChange={setDispatchOpen}
        isPending={dispatchMutation.isPending}
        onSubmit={handleDispatch}
      />

      <QuarterlyReportDetailSheet
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setSelectedRunId(null);
          }
        }}
        report={selectedReport}
        isPending={detailQuery.isPending}
        errorMessage={detailQuery.isError ? detailQuery.error?.message : null}
        canSendReports={canSendReports}
        isResending={dispatchMutation.isPending}
        onSafeResend={() => void handleResend(false)}
        onRebuildResend={() => void handleResend(true)}
      />
    </div>
  );
}

export const QuarterlyReportsPage = PeriodicReportsPage;
