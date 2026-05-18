'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { RefreshCw, ShieldAlert } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUTES } from '@/common/constant/routes';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { useOrganizationMembersData } from '@/features/tenant/organization-members/hooks/use-organization-members';
import { useProjectList } from '@/features/tenant/projects/query/use-project-core';
import { useProjectMembers } from '@/features/tenant/projects/query/use-project-members';
import { useTenant } from '@/providers';
import { useTeamDailyReports } from '../query/use-daily-reports';
import { DailyReportItemsList } from './daily-report-items-list';
import { DailyReportStatusBadge } from './daily-report-status-badge';
import {
  formatDailyDateTime,
  formatDailyMinutes,
  toTodayDateInputValue,
} from './daily-report-utils';

const ALL_USERS_VALUE = '__all_users__';
const NO_PROJECT_VALUE = '__no_project__';

function fallbackProjectMemberLabel(member: {
  userId: string;
  fullName?: string | null;
  email?: string | null;
  user?: { fullName?: string | null; email?: string | null } | null;
}) {
  return (
    member.fullName ||
    member.user?.fullName ||
    member.email ||
    member.user?.email ||
    member.userId
  );
}

export function TeamDailyReportsPage() {
  const t = useTranslations('analytics');
  const { tenantSlug } = useTenant();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canViewTeamReports = useCan(PERMISSIONS.PROJECTS_DAILY_REPORTS_VIEW_ALL);
  const [selectedDate, setSelectedDate] = useState(toTodayDateInputValue());
  const [selectedUserId, setSelectedUserId] = useState(ALL_USERS_VALUE);

  const projectsQuery = useProjectList({ page: 1, limit: 1000 }, canViewTeamReports);
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

  const orgMembers = useOrganizationMembersData(
    { page: 1, limit: 1000, isActive: true },
    canViewTeamReports,
  );
  const projectMembersQuery = useProjectMembers(
    selectedProjectId,
    { page: 1, limit: 1000 },
    canViewTeamReports && Boolean(selectedProjectId),
  );
  const effectiveSelectedUserId =
    selectedUserId === ALL_USERS_VALUE ||
    (projectMembersQuery.data ?? []).some((member) => member.userId === selectedUserId)
      ? selectedUserId
      : ALL_USERS_VALUE;
  const teamReportsQuery = useTeamDailyReports(
    selectedProjectId,
    {
      date: selectedDate,
      userId: effectiveSelectedUserId === ALL_USERS_VALUE ? undefined : effectiveSelectedUserId,
      page: 1,
      limit: 100,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    },
    canViewTeamReports && Boolean(selectedProjectId),
  );

  const orgMemberByUserId = useMemo(() => {
    return new Map(orgMembers.members.map((member) => [member.userId, member]));
  }, [orgMembers.members]);

  const memberLabelById = useMemo(() => {
    const labels = new Map<string, string>();

    for (const member of projectMembersQuery.data ?? []) {
      const orgMember = orgMemberByUserId.get(member.userId);
      if (orgMember) {
        const displayName = [orgMember.firstName, orgMember.lastName].filter(Boolean).join(' ').trim();
        labels.set(member.userId, displayName || orgMember.email || member.userId);
        continue;
      }

      labels.set(member.userId, fallbackProjectMemberLabel(member));
    }

    return labels;
  }, [orgMemberByUserId, projectMembersQuery.data]);

  const teamReports = useMemo(() => {
    return teamReportsQuery.data?.data ?? [];
  }, [teamReportsQuery.data?.data]);

  const reportsByStatus = useMemo(() => {
    const submitted = teamReports.filter(
      (report) => report.status === 'submitted' || report.status === 'locked',
    );
    const drafts = teamReports.filter((report) => report.status === 'draft');
    return { drafts, submitted };
  }, [teamReports]);

  if (!canViewTeamReports) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('teamDailyReports.pageTitle')}
          description={t('teamDailyReports.noPermissionDescription')}
          breadcrumbs={[
            { label: t('common.dashboard'), href: ROUTES.tenant.dashboard(tenantSlug) },
            { label: t('common.analytics') },
            { label: t('teamDailyReports.pageTitle') },
          ]}
        />

        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>{t('page.permissionDenied')}</AlertTitle>
          <AlertDescription>
            {t('page.requiredPermission')} <code>{PERMISSIONS.PROJECTS_DAILY_REPORTS_VIEW_ALL}</code>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('teamDailyReports.pageTitle')}
        description={t('teamDailyReports.pageDescription')}
        breadcrumbs={[
          { label: t('common.dashboard'), href: ROUTES.tenant.dashboard(tenantSlug) },
          { label: t('common.analytics') },
          { label: t('teamDailyReports.pageTitle') },
        ]}
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t('teamDailyReports.filtersTitle')}</CardTitle>
            <CardDescription>
              {t('teamDailyReports.filtersDescription')}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
              <SelectTrigger className="w-full min-w-[220px] sm:w-[260px]">
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
            <div className="w-full min-w-[180px] sm:w-[200px]">
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                placeholder={t('reportView.filters.selectDate')}
              />
            </div>
            <Select value={effectiveSelectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-full min-w-[200px] sm:w-[220px]">
                <SelectValue placeholder={t('reportView.filters.allMembers')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_USERS_VALUE}>{t('reportView.filters.allMembers')}</SelectItem>
                {(projectMembersQuery.data ?? []).map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {memberLabelById.get(member.userId) ?? member.userId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!selectedProjectId}
              onClick={() => {
                const rawQuery = teamReportsQuery.raw as { refetch?: () => Promise<unknown> };
                void rawQuery.refetch?.();
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
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
            {t('teamDailyReports.noProjectsDescription')}
          </AlertDescription>
        </Alert>
      ) : !selectedProjectId ? (
        <Alert>
          <AlertTitle>{t('dailyReports.selectProject')}</AlertTitle>
          <AlertDescription>
            {t('teamDailyReports.selectProjectDescription')}
          </AlertDescription>
        </Alert>
      ) : teamReportsQuery.isPending ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            {t('reportView.loading.teamReports')}
          </CardContent>
        </Card>
      ) : teamReportsQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>{t('reportView.errors.loadTeamReports')}</AlertTitle>
          <AlertDescription>
            {teamReportsQuery.error?.message ?? t('reportView.errors.unknown')}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">{t('teamDailyReports.submittedTitle')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('teamDailyReports.submittedDescription')}
                </p>
              </div>
              <DailyReportStatusBadge status="submitted" />
            </div>

            {reportsByStatus.submitted.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-sm text-muted-foreground">
                    {t('teamDailyReports.noSubmitted')}
                  </CardContent>
                </Card>
            ) : (
              <div className="space-y-4">
                {reportsByStatus.submitted.map((report) => {
                  const displayName =
                    report.userDisplayName?.trim() ||
                    memberLabelById.get(report.userId) ||
                    report.userEmail ||
                    report.userId;

                  return (
                    <Card key={report.id}>
                      <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <CardTitle>{displayName}</CardTitle>
                            <CardDescription>
                              {report.reportDate} - {formatDailyMinutes(report.totalLoggedMinutes)}
                            </CardDescription>
                          </div>
                          <DailyReportStatusBadge status={report.status} />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="rounded-md border p-3">
                            <p className="text-xs text-muted-foreground">{t('reportView.narrative.summary')}</p>
                            <p className="mt-1 text-sm whitespace-pre-wrap">
                              {report.summary?.trim() || t('reportView.empty.noSummary')}
                            </p>
                          </div>
                          <div className="rounded-md border p-3">
                            <p className="text-xs text-muted-foreground">{t('reportView.narrative.blockers')}</p>
                            <p className="mt-1 text-sm whitespace-pre-wrap">
                              {report.blockers?.trim() || t('reportView.empty.noBlockers')}
                            </p>
                          </div>
                          <div className="rounded-md border p-3">
                            <p className="text-xs text-muted-foreground">{t('reportView.narrative.planTomorrow')}</p>
                            <p className="mt-1 text-sm whitespace-pre-wrap">
                              {report.planTomorrow?.trim() || t('reportView.empty.noPlan')}
                            </p>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {t('teamDailyReports.submittedAtLabel')}: {formatDailyDateTime(report.submittedAt)}
                        </div>

                        <DailyReportItemsList items={report.items} />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">{t('teamDailyReports.draftTitle')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('teamDailyReports.draftDescription')}
                </p>
              </div>
              <DailyReportStatusBadge status="draft" />
            </div>

            {reportsByStatus.drafts.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-sm text-muted-foreground">
                    {t('teamDailyReports.noDraft')}
                  </CardContent>
                </Card>
            ) : (
              <div className="space-y-4">
                {reportsByStatus.drafts.map((report) => {
                  const displayName =
                    report.userDisplayName?.trim() ||
                    memberLabelById.get(report.userId) ||
                    report.userEmail ||
                    report.userId;

                  return (
                    <Card key={report.id}>
                      <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <CardTitle>{displayName}</CardTitle>
                            <CardDescription>
                              {report.reportDate} - {formatDailyMinutes(report.totalLoggedMinutes)}
                            </CardDescription>
                          </div>
                          <DailyReportStatusBadge status={report.status} />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="rounded-md border p-3">
                            <p className="text-xs text-muted-foreground">{t('reportView.narrative.summary')}</p>
                            <p className="mt-1 text-sm whitespace-pre-wrap">
                              {report.summary?.trim() || t('reportView.empty.notFilledYet')}
                            </p>
                          </div>
                          <div className="rounded-md border p-3">
                            <p className="text-xs text-muted-foreground">{t('reportView.narrative.blockers')}</p>
                            <p className="mt-1 text-sm whitespace-pre-wrap">
                              {report.blockers?.trim() || t('reportView.empty.notFilledYet')}
                            </p>
                          </div>
                          <div className="rounded-md border p-3">
                            <p className="text-xs text-muted-foreground">{t('reportView.narrative.planTomorrow')}</p>
                            <p className="mt-1 text-sm whitespace-pre-wrap">
                              {report.planTomorrow?.trim() || t('reportView.empty.notFilledYet')}
                            </p>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {t('teamDailyReports.lastUpdatedLabel')}: {formatDailyDateTime(report.updatedAt)}
                        </div>

                        <DailyReportItemsList items={report.items} />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
