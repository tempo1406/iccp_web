'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, RefreshCw, Save, Send } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/common/constant/routes';
import { useProjectList } from '@/features/tenant/projects/query/use-project-core';
import { toast } from '@/lib/toast';
import { useTenant } from '@/providers';
import {
  useGenerateMyDailyReport,
  useMyDailyReport,
  useSubmitDailyReport,
  useUpdateDailyReport,
} from '../query/use-daily-reports';
import { DailyReportItemsList } from './daily-report-items-list';
import { DailyReportStatusBadge } from './daily-report-status-badge';
import {
  formatDailyDateTime,
  formatDailyMinutes,
  toTodayDateInputValue,
} from './daily-report-utils';

const NO_PROJECT_VALUE = '__no_project__';

interface DraftFormState {
  summary: string;
  blockers: string;
  planTomorrow: string;
}

function createDraftFormStateFromReport(report: {
  summary?: string | null;
  blockers?: string | null;
  planTomorrow?: string | null;
}): DraftFormState {
  return {
    summary: report.summary ?? '',
    blockers: report.blockers ?? '',
    planTomorrow: report.planTomorrow ?? '',
  };
}

interface DailyReportDraftEditorProps {
  report: NonNullable<ReturnType<typeof useMyDailyReport>['data']>;
  isSavingDraft: boolean;
  isRefreshing: boolean;
  isUpdating: boolean;
  isSubmitting: boolean;
  onRefreshFromWorklogs: () => Promise<void>;
  onSaveDraft: (draftForm: DraftFormState) => Promise<void>;
  onSubmitReport: (draftForm: DraftFormState) => Promise<void>;
}

function DailyReportDraftEditor({
  report,
  isSavingDraft,
  isRefreshing,
  isUpdating,
  isSubmitting,
  onRefreshFromWorklogs,
  onSaveDraft,
  onSubmitReport,
}: DailyReportDraftEditorProps) {
  const t = useTranslations('analytics');
  const [draftForm, setDraftForm] = useState<DraftFormState>(() =>
    createDraftFormStateFromReport(report),
  );

  const isDraftDirty = useMemo(() => {
    return (
      draftForm.summary !== (report.summary ?? '') ||
      draftForm.blockers !== (report.blockers ?? '') ||
      draftForm.planTomorrow !== (report.planTomorrow ?? '')
    );
  }, [draftForm, report.blockers, report.planTomorrow, report.summary]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reportView.narrative.title')}</CardTitle>
        <CardDescription>
          {t('dailyReports.narrativeDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="daily-report-summary">{t('reportView.narrative.summary')}</Label>
          <Textarea
            id="daily-report-summary"
            className="min-h-28"
            value={draftForm.summary}
            onChange={(event) =>
              setDraftForm((previous) => ({
                ...previous,
                summary: event.target.value,
              }))
            }
            disabled={report.status !== 'draft' || isSavingDraft}
            placeholder={t('reportView.narrative.summaryPlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="daily-report-blockers">{t('reportView.narrative.blockers')}</Label>
          <Textarea
            id="daily-report-blockers"
            className="min-h-24"
            value={draftForm.blockers}
            onChange={(event) =>
              setDraftForm((previous) => ({
                ...previous,
                blockers: event.target.value,
              }))
            }
            disabled={report.status !== 'draft' || isSavingDraft}
            placeholder={t('reportView.narrative.blockersPlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="daily-report-plan-tomorrow">{t('reportView.narrative.planTomorrow')}</Label>
          <Textarea
            id="daily-report-plan-tomorrow"
            className="min-h-24"
            value={draftForm.planTomorrow}
            onChange={(event) =>
              setDraftForm((previous) => ({
                ...previous,
                planTomorrow: event.target.value,
              }))
            }
            disabled={report.status !== 'draft' || isSavingDraft}
            placeholder={t('reportView.narrative.planTomorrowPlaceholder')}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void onRefreshFromWorklogs()}
            disabled={report.status !== 'draft' || isSavingDraft}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {t('dailyReports.refreshFromWorklogs')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void onSaveDraft(draftForm)}
            disabled={report.status !== 'draft' || isSavingDraft || !isDraftDirty}
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t('reportView.narrative.saveDraft')}
          </Button>
          <Button
            type="button"
            onClick={() => void onSubmitReport(draftForm)}
            disabled={report.status !== 'draft' || isSavingDraft}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {t('reportView.narrative.submit')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function DailyReportsPage() {
  const t = useTranslations('analytics');
  const { tenantSlug } = useTenant();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(toTodayDateInputValue());

  const projectsQuery = useProjectList({ page: 1, limit: 1000 });
  const projectOptions = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const projectIdFromQuery = searchParams.get('projectId') ?? '';
  const selectedProjectId = useMemo(() => {
    if (projectOptions.length === 0) return projectIdFromQuery;
    if (projectOptions.some((project) => project.id === projectIdFromQuery)) {
      return projectIdFromQuery;
    }
    return projectOptions[0]?.id ?? '';
  }, [projectIdFromQuery, projectOptions]);

  useEffect(() => {
    if (!selectedProjectId || selectedProjectId === projectIdFromQuery) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('projectId', selectedProjectId);
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, projectIdFromQuery, router, searchParams, selectedProjectId]);

  const myReportQuery = useMyDailyReport(
    selectedProjectId,
    { date: selectedDate },
    Boolean(selectedDate && selectedProjectId),
  );
  const generateDailyReportMutation = useGenerateMyDailyReport();
  const updateDailyReportMutation = useUpdateDailyReport();
  const submitDailyReportMutation = useSubmitDailyReport();

  const report = myReportQuery.data;
  const isDraft = report?.status === 'draft';
  const selectedProject = useMemo(
    () => projectOptions.find((project) => project.id === selectedProjectId) ?? null,
    [projectOptions, selectedProjectId],
  );

  const isSavingDraft =
    generateDailyReportMutation.isPending ||
    updateDailyReportMutation.isPending ||
    submitDailyReportMutation.isPending;

  const handleRefreshFromWorklogs = async () => {
    if (!selectedProjectId) return;

    const result = await generateDailyReportMutation.mutateAsync({
      projectId: selectedProjectId,
      query: { date: selectedDate },
    });
    if (!result.ok) {
      toast.danger(result.error.message || t('dailyReports.toasts.refreshFailed'));
      return;
    }

    toast.success(t('dailyReports.toasts.refreshed'));
  };

  const handleSaveDraft = async (draftForm: DraftFormState) => {
    if (!report?.id || !selectedProjectId) return;

    const result = await updateDailyReportMutation.mutateAsync({
      projectId: selectedProjectId,
      reportId: report.id,
      body: {
        summary: draftForm.summary.trim() || null,
        blockers: draftForm.blockers.trim() || null,
        planTomorrow: draftForm.planTomorrow.trim() || null,
      },
    });

    if (!result.ok) {
      toast.danger(result.error.message || t('reportView.toasts.saveDraftFailed'));
      return;
    }

    toast.success(t('reportView.toasts.draftSaved'));
  };

  const handleSubmitReport = async (draftForm: DraftFormState) => {
    if (!report?.id || !selectedProjectId) return;

    const saveResult = await updateDailyReportMutation.mutateAsync({
      projectId: selectedProjectId,
      reportId: report.id,
      body: {
        summary: draftForm.summary.trim() || null,
        blockers: draftForm.blockers.trim() || null,
        planTomorrow: draftForm.planTomorrow.trim() || null,
      },
    });

    if (!saveResult.ok) {
      toast.danger(saveResult.error.message || t('reportView.toasts.saveBeforeSubmitFailed'));
      return;
    }

    const submitResult = await submitDailyReportMutation.mutateAsync({
      projectId: selectedProjectId,
      reportId: report.id,
    });
    if (!submitResult.ok) {
      toast.danger(submitResult.error.message || t('reportView.toasts.submitFailed'));
      return;
    }

    toast.success(t('reportView.toasts.submitted'));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('dailyReports.pageTitle')}
        description={t('dailyReports.pageDescription')}
        breadcrumbs={[
          { label: t('common.dashboard'), href: ROUTES.tenant.dashboard(tenantSlug) },
          { label: t('common.analytics') },
          { label: t('dailyReports.pageTitle') },
        ]}
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t('dailyReports.scopeTitle')}</CardTitle>
            <CardDescription>
              {t('dailyReports.scopeDescription')}
            </CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Select
              value={selectedProjectId || NO_PROJECT_VALUE}
              onValueChange={(value) => {
                if (value === NO_PROJECT_VALUE) return;
                const nextParams = new URLSearchParams(searchParams.toString());
                nextParams.set('projectId', value);
                const nextQuery = nextParams.toString();
                router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
                  scroll: false,
                });
              }}
              disabled={projectsQuery.isPending || projectOptions.length === 0}
            >
              <SelectTrigger className="w-full sm:w-[260px]">
                <SelectValue placeholder={t('dailyReports.selectProject')} />
              </SelectTrigger>
              <SelectContent>
                {projectOptions.length === 0 ? (
                  <SelectItem value={NO_PROJECT_VALUE} disabled>
                    {t('dailyReports.noProjects')}
                  </SelectItem>
                ) : null}
                {projectOptions.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-full sm:w-[220px]">
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                placeholder={t('reportView.filters.selectDate')}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {projectsQuery.isPending ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            {t('dailyReports.loadingProjects')}
          </CardContent>
        </Card>
      ) : projectsQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>{t('dailyReports.loadProjectsFailed')}</AlertTitle>
          <AlertDescription>
            {projectsQuery.error?.message ?? t('reportView.errors.unknown')}
          </AlertDescription>
        </Alert>
      ) : projectOptions.length === 0 ? (
        <Alert>
          <AlertTitle>{t('dailyReports.noProjects')}</AlertTitle>
          <AlertDescription>
            {t('dailyReports.noProjectsDescription')}
          </AlertDescription>
        </Alert>
      ) : !selectedProjectId ? (
        <Alert>
          <AlertTitle>{t('dailyReports.selectProject')}</AlertTitle>
          <AlertDescription>
            {t('dailyReports.selectProjectDescription')}
          </AlertDescription>
        </Alert>
      ) : myReportQuery.isPending ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            {t('reportView.loading.myReport')}
          </CardContent>
        </Card>
      ) : myReportQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>{t('reportView.errors.loadMyReport')}</AlertTitle>
          <AlertDescription>
            {myReportQuery.error?.message ?? t('reportView.errors.unknown')}
          </AlertDescription>
        </Alert>
      ) : report ? (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader>
                <CardDescription>{t('common.project')}</CardDescription>
                <CardTitle className="text-base">
                  {report.projectName?.trim() || selectedProject?.name || t('common.unknownProject')}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>{t('common.status')}</CardDescription>
                <CardTitle>
                  <DailyReportStatusBadge status={report.status} />
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>{t('reportView.overview.totalLogged')}</CardDescription>
                <CardTitle>{formatDailyMinutes(report.totalLoggedMinutes)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>{t('reportView.overview.submittedAt')}</CardDescription>
                <CardTitle className="text-base">
                  {formatDailyDateTime(report.submittedAt)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>{t('reportView.overview.lastUpdated')}</CardDescription>
                <CardTitle className="text-base">
                  {formatDailyDateTime(report.updatedAt)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {!isDraft ? (
            <Alert>
              <AlertTitle>{t('dailyReports.lockedTitle')}</AlertTitle>
              <AlertDescription>
                {t('dailyReports.lockedDescription')}
              </AlertDescription>
            </Alert>
          ) : null}

          <DailyReportDraftEditor
            key={`${report.id}:${report.updatedAt ?? ''}:${report.status}`}
            report={report}
            isSavingDraft={isSavingDraft}
            isRefreshing={generateDailyReportMutation.isPending}
            isUpdating={updateDailyReportMutation.isPending}
            isSubmitting={submitDailyReportMutation.isPending}
            onRefreshFromWorklogs={handleRefreshFromWorklogs}
            onSaveDraft={handleSaveDraft}
            onSubmitReport={handleSubmitReport}
          />

          <Card>
            <CardHeader>
              <CardTitle>{t('reportView.items.title')}</CardTitle>
              <CardDescription>
                {t('dailyReports.itemsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DailyReportItemsList items={report.items} />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            {t('dailyReports.empty')}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
