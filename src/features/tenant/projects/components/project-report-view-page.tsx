'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  MessageSquare,
  RefreshCw,
  Save,
  Send,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { useOrganizationMembersData } from '@/features/tenant/organization-members/hooks/use-organization-members';
import { useProjectMembers } from '@/features/tenant/projects/query/use-project-members';
import type {
  DailyReportCommentResponse,
  DailyReportResponse,
  DailyReportStatus,
} from '@/features/tenant/analytics/types/daily-report.types';
import { DEFAULT_DAILY_REPORT_LIST_META } from '@/features/tenant/analytics/types/daily-report.types';
import { usePagination } from '@/hooks/use-pagination';
import { toast } from '@/lib/toast';
import {
  useAddDailyReportComment,
  useDailyReportComments,
  useGenerateMyDailyReport,
  useMarkDailyReportSeen,
  useMyDailyReport,
  useSubmitDailyReport,
  useTeamDailyReports,
  useUpdateDailyReport,
} from '@/features/tenant/analytics/query/use-daily-reports';
import { DailyReportItemsList } from '@/features/tenant/analytics/components/daily-report-items-list';
import { DailyReportStatusBadge } from '@/features/tenant/analytics/components/daily-report-status-badge';
import {
  formatDailyDateTime,
  formatDailyMinutes,
  toTodayDateInputValue,
} from '@/features/tenant/analytics/components/daily-report-utils';
import { useAppSelector } from '@/store';

const ALL_USERS_VALUE = '__all_users__';
const ALL_TEAM_REPORT_STATUSES_VALUE = '__all_team_report_statuses__';
const TEAM_REPORT_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const TEAM_REPORT_STATUS_ORDER: Record<DailyReportStatus, number> = {
  draft: 0,
  submitted: 1,
  locked: 2,
};

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

function resolveTeamReportDisplayName(
  report: DailyReportResponse,
  memberLabelById: Map<string, string>,
) {
  return (
    report.userDisplayName?.trim() ||
    memberLabelById.get(report.userId) ||
    report.userEmail ||
    report.userId
  );
}

function resolveDailyReportCommentAuthorName(reportComment: {
  author: {
    id: string;
    displayName?: string | null;
    email?: string | null;
  };
}) {
  return (
    reportComment.author.displayName?.trim() ||
    reportComment.author.email ||
    reportComment.author.id
  );
}

function ReportOverviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/20 rounded-lg border px-4 py-3">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className="text-foreground mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}

function DailyReportReviewStatusText({
  isSeen,
  seenByDisplayName,
  seenByEmail,
  seenByUserId,
  seenAt,
  unseenLabel,
}: Pick<
  DailyReportResponse,
  'isSeen' | 'seenByDisplayName' | 'seenByEmail' | 'seenByUserId' | 'seenAt'
> & {
  unseenLabel: string;
}) {
  const t = useTranslations('project.reportView.review');
  if (!isSeen) return unseenLabel;

  return t('seenBy', {
    reviewer: seenByDisplayName?.trim() || seenByEmail || seenByUserId || t('reviewerFallback'),
    time: formatDailyDateTime(seenAt),
  });
}

function DailyReportCommentsList({
  comments,
  emptyMessage,
}: {
  comments: DailyReportCommentResponse[];
  emptyMessage: string;
}) {
  if (comments.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="border-border/70 bg-background rounded-lg border px-3 py-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">
              {resolveDailyReportCommentAuthorName(comment)}
            </p>
            <p className="text-muted-foreground text-xs">
              {formatDailyDateTime(comment.createdAt)}
            </p>
          </div>
          <p className="mt-2 text-sm whitespace-pre-wrap">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}

function DailyReportNarrativeSummary({
  report,
}: {
  report: Pick<DailyReportResponse, 'summary' | 'blockers' | 'planTomorrow'>;
}) {
  const t = useTranslations('project.reportView.narrative');
  const emptyT = useTranslations('project.reportView.empty');
  return (
    <section className="bg-card overflow-hidden rounded-xl border">
      <div className="border-b px-5 py-4">
        <h2 className="text-base font-semibold">{t('title')}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('submittedDescription')}
        </p>
      </div>

      <div className="grid gap-4 px-5 py-5 lg:grid-cols-2">
        <div className="space-y-2 lg:col-span-2">
          <Label>{t('summary')}</Label>
          <div className="bg-background min-h-28 rounded-lg border px-4 py-3 text-sm whitespace-pre-wrap">
            {report.summary?.trim() || emptyT('noSummary')}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('blockers')}</Label>
          <div className="bg-background min-h-24 rounded-lg border px-4 py-3 text-sm whitespace-pre-wrap">
            {report.blockers?.trim() || emptyT('noBlockers')}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('planTomorrow')}</Label>
          <div className="bg-background min-h-24 rounded-lg border px-4 py-3 text-sm whitespace-pre-wrap">
            {report.planTomorrow?.trim() || emptyT('noPlan')}
          </div>
        </div>
      </div>
    </section>
  );
}

interface DailyReportDraftEditorProps {
  report: NonNullable<ReturnType<typeof useMyDailyReport>['data']>;
  hasReportItems: boolean;
  isSavingDraft: boolean;
  isUpdating: boolean;
  isSubmitting: boolean;
  onSaveDraft: (draftForm: DraftFormState) => Promise<void>;
  onSubmitReport: (draftForm: DraftFormState) => Promise<void>;
}

function DailyReportDraftEditor({
  report,
  hasReportItems,
  isSavingDraft,
  isUpdating,
  isSubmitting,
  onSaveDraft,
  onSubmitReport,
}: DailyReportDraftEditorProps) {
  const t = useTranslations('project.reportView.narrative');
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
    <section className="bg-card overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-4 border-b px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-base font-semibold">{t('title')}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('draftDescription')}
          </p>
        </div>

        <div className="flex flex-row flex-nowrap items-center gap-2 self-start lg:self-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => void onSaveDraft(draftForm)}
            disabled={report.status !== 'draft' || isSavingDraft || !isDraftDirty}
            className="shrink-0 whitespace-nowrap"
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t('saveDraft')}
          </Button>
          <Button
            type="button"
            onClick={() => void onSubmitReport(draftForm)}
            disabled={report.status !== 'draft' || isSavingDraft || !hasReportItems}
            className="shrink-0 whitespace-nowrap"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {t('submit')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 px-5 py-5 lg:grid-cols-2">
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="daily-report-summary">{t('summary')}</Label>
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
            placeholder={t('summaryPlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="daily-report-blockers">{t('blockers')}</Label>
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
            placeholder={t('blockersPlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="daily-report-plan-tomorrow">{t('planTomorrow')}</Label>
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
            placeholder={t('planTomorrowPlaceholder')}
          />
        </div>
      </div>
    </section>
  );
}

interface ProjectReportViewPageProps {
  projectId: string;
  projectName?: string;
}

export function ProjectReportViewPage({
  projectId,
  projectName,
}: ProjectReportViewPageProps) {
  const t = useTranslations('project.reportView');
  const currentUserId = useAppSelector((state) => state.user.profile?.id) ?? null;
  const searchParams = useSearchParams();
  const dateFromQuery = searchParams.get('date')?.trim();
  const reportIdFromQuery = searchParams.get('reportId')?.trim();
  const userIdFromQuery = searchParams.get('userId')?.trim();
  const statusFromQuery = searchParams.get('status')?.trim();
  const canViewTeamReports = useCan(PERMISSIONS.PROJECTS_DAILY_REPORTS_VIEW_ALL);
  const [selectedDate, setSelectedDate] = useState(
    dateFromQuery || toTodayDateInputValue(),
  );
  const [activeTab, setActiveTab] = useState<'my-report' | 'team-report'>(
    reportIdFromQuery ? 'team-report' : 'my-report',
  );
  const [selectedUserId, setSelectedUserId] = useState(
    userIdFromQuery || ALL_USERS_VALUE,
  );
  const [teamReportSearchQuery, setTeamReportSearchQuery] = useState('');
  const [teamReportStatusFilter, setTeamReportStatusFilter] = useState<
    DailyReportStatus | typeof ALL_TEAM_REPORT_STATUSES_VALUE
  >(
    statusFromQuery === 'draft' ||
      statusFromQuery === 'submitted' ||
      statusFromQuery === 'locked'
      ? statusFromQuery
      : ALL_TEAM_REPORT_STATUSES_VALUE,
  );
  const [selectedTeamReportId, setSelectedTeamReportId] = useState<string | null>(
    reportIdFromQuery || null,
  );
  const [teamReportCommentInput, setTeamReportCommentInput] = useState('');
  const teamReportPagination = usePagination({ initialPage: 1, initialLimit: 10 });
  const {
    page: teamReportPage,
    limit: teamReportLimit,
    setPage: setTeamReportPage,
  } = teamReportPagination;
  const effectiveActiveTab =
    activeTab === 'team-report' && !canViewTeamReports ? 'my-report' : activeTab;

  const myReportQuery = useMyDailyReport(
    projectId,
    { date: selectedDate },
    Boolean(projectId),
  );
  const generateDailyReportMutation = useGenerateMyDailyReport();
  const updateDailyReportMutation = useUpdateDailyReport();
  const submitDailyReportMutation = useSubmitDailyReport();
  const addDailyReportCommentMutation = useAddDailyReportComment();
  const markDailyReportSeenMutation = useMarkDailyReportSeen();

  const projectMembersQuery = useProjectMembers(
    projectId,
    { page: 1, limit: 1000 },
    canViewTeamReports && Boolean(projectId),
  );
  const orgMembers = useOrganizationMembersData(
    { page: 1, limit: 1000, isActive: true },
    canViewTeamReports,
  );

  const effectiveSelectedUserId =
    selectedUserId === ALL_USERS_VALUE ||
    (projectMembersQuery.data ?? []).some((member) => member.userId === selectedUserId)
      ? selectedUserId
      : ALL_USERS_VALUE;
  const normalizedTeamReportSearchQuery = teamReportSearchQuery.trim();
  const selectedTeamReportStatus =
    teamReportStatusFilter === ALL_TEAM_REPORT_STATUSES_VALUE
      ? undefined
      : teamReportStatusFilter;

  const teamReportsQuery = useTeamDailyReports(
    projectId,
    {
      date: selectedDate,
      userId:
        effectiveSelectedUserId === ALL_USERS_VALUE ? undefined : effectiveSelectedUserId,
      status: selectedTeamReportStatus,
      search: normalizedTeamReportSearchQuery || undefined,
      page: teamReportPage,
      limit: teamReportLimit,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    },
    canViewTeamReports && Boolean(projectId),
  );

  const teamReportsPermissionDenied =
    teamReportsQuery.isError &&
    (teamReportsQuery.error?.message?.toLowerCase().includes('permission') ||
      teamReportsQuery.error?.message?.toLowerCase().includes('forbidden') ||
      teamReportsQuery.error?.message?.toLowerCase().includes('unauthorized'));

  const canShowTeamReports = canViewTeamReports && !teamReportsPermissionDenied;
  const resolvedActiveTab =
    activeTab === 'team-report' && !canShowTeamReports ? 'my-report' : effectiveActiveTab;

  const orgMemberByUserId = useMemo(() => {
    return new Map(orgMembers.members.map((member) => [member.userId, member]));
  }, [orgMembers.members]);

  const memberLabelById = useMemo(() => {
    const labels = new Map<string, string>();

    for (const member of projectMembersQuery.data ?? []) {
      const orgMember = orgMemberByUserId.get(member.userId);
      if (orgMember) {
        const displayName = [orgMember.firstName, orgMember.lastName]
          .filter(Boolean)
          .join(' ')
          .trim();
        labels.set(member.userId, displayName || orgMember.email || member.userId);
        continue;
      }

      labels.set(member.userId, fallbackProjectMemberLabel(member));
    }

    return labels;
  }, [orgMemberByUserId, projectMembersQuery.data]);

  const teamReportRows = useMemo(() => {
    return teamReportsQuery.data?.data ?? [];
  }, [teamReportsQuery.data?.data]);

  const teamReportMeta = teamReportsQuery.data?.meta ?? DEFAULT_DAILY_REPORT_LIST_META;

  useEffect(() => {
    if (!teamReportsQuery.data?.meta) return;

    const lastPage = Math.max(teamReportsQuery.data.meta.totalPages, 1);
    if (teamReportPage > lastPage) {
      setTeamReportPage(lastPage);
    }
  }, [setTeamReportPage, teamReportPage, teamReportsQuery.data?.meta]);

  const sortedTeamReports = useMemo(() => {
    return [...teamReportRows].sort((left, right) => {
      const statusDifference =
        TEAM_REPORT_STATUS_ORDER[left.status] - TEAM_REPORT_STATUS_ORDER[right.status];
      if (statusDifference !== 0) return statusDifference;

      const rightTimestamp = new Date(
        right.submittedAt ?? right.updatedAt ?? right.createdAt ?? 0,
      ).getTime();
      const leftTimestamp = new Date(
        left.submittedAt ?? left.updatedAt ?? left.createdAt ?? 0,
      ).getTime();
      if (rightTimestamp !== leftTimestamp) return rightTimestamp - leftTimestamp;

      return resolveTeamReportDisplayName(left, memberLabelById).localeCompare(
        resolveTeamReportDisplayName(right, memberLabelById),
      );
    });
  }, [memberLabelById, teamReportRows]);

  const teamReportSummary = useMemo(() => {
    return sortedTeamReports.reduce(
      (summary, teamReport) => {
        summary.total += 1;
        summary.members.add(teamReport.userId);
        summary.totalLoggedMinutes += teamReport.totalLoggedMinutes;
        if ((teamReport.blockers ?? '').trim()) summary.withBlockers += 1;
        summary[teamReport.status] += 1;
        return summary;
      },
      {
        total: 0,
        draft: 0,
        submitted: 0,
        locked: 0,
        withBlockers: 0,
        totalLoggedMinutes: 0,
        members: new Set<string>(),
      },
    );
  }, [sortedTeamReports]);

  const totalTeamReportPages = Math.max(teamReportMeta.totalPages, 1);
  const currentTeamReportPage = Math.min(teamReportPage, totalTeamReportPages);
  const teamReportPageStartIndex = (currentTeamReportPage - 1) * teamReportMeta.limit;
  const teamReportPageStart =
    teamReportMeta.total === 0 ? 0 : teamReportPageStartIndex + 1;
  const teamReportPageEnd = Math.min(
    teamReportPageStartIndex + sortedTeamReports.length,
    teamReportMeta.total,
  );

  const selectedTeamReport =
    sortedTeamReports.find((teamReport) => teamReport.id === selectedTeamReportId) ??
    null;

  const selectedTeamReportCommentsQuery = useDailyReportComments(
    projectId,
    selectedTeamReportId,
    canShowTeamReports && Boolean(projectId) && Boolean(selectedTeamReportId),
  );
  const selectedTeamReportComments = useMemo(() => {
    const comments =
      selectedTeamReportCommentsQuery.data ?? selectedTeamReport?.comments ?? [];
    return [...comments].sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );
  }, [selectedTeamReport?.comments, selectedTeamReportCommentsQuery.data]);
  const canReviewSelectedTeamReport = Boolean(
    selectedTeamReport &&
    selectedTeamReport.status !== 'draft' &&
    selectedTeamReport.userId !== currentUserId,
  );

  const report = myReportQuery.data;
  const myReportComments = useMemo(() => {
    const comments = report?.comments ?? [];
    return [...comments].sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );
  }, [report?.comments]);
  const isDraft = report?.status === 'draft';
  const hasReportItems = (report?.items.length ?? 0) > 0;
  const isSavingDraft =
    updateDailyReportMutation.isPending || submitDailyReportMutation.isPending;

  const handleSaveDraft = async (draftForm: DraftFormState) => {
    if (!report?.id) return;

    const result = await updateDailyReportMutation.mutateAsync({
      projectId,
      reportId: report.id,
      body: {
        summary: draftForm.summary.trim() || null,
        blockers: draftForm.blockers.trim() || null,
        planTomorrow: draftForm.planTomorrow.trim() || null,
      },
    });

    if (!result.ok) {
      toast.danger(result.error.message || t('toasts.saveDraftFailed'));
      return;
    }

    toast.success(t('toasts.draftSaved'));
  };

  const handleSubmitReport = async (draftForm: DraftFormState) => {
    if (!report?.id) return;
    if (report.items.length === 0) {
      toast.danger('Add at least one report item before submitting the daily report.');
      return;
    }

    const saveResult = await updateDailyReportMutation.mutateAsync({
      projectId,
      reportId: report.id,
      body: {
        summary: draftForm.summary.trim() || null,
        blockers: draftForm.blockers.trim() || null,
        planTomorrow: draftForm.planTomorrow.trim() || null,
      },
    });

    if (!saveResult.ok) {
      toast.danger(
        saveResult.error.message || 'Failed to save the draft before submission.',
      );
      return;
    }

    const submitResult = await submitDailyReportMutation.mutateAsync({
      projectId,
      reportId: report.id,
    });
    if (!submitResult.ok) {
      toast.danger(submitResult.error.message || t('toasts.submitFailed'));
      return;
    }

    toast.success('Daily report submitted successfully.');
  };

  const handleRefreshMyReportDraft = async () => {
    const result = await generateDailyReportMutation.mutateAsync({
      projectId,
      query: { date: selectedDate },
    });

    if (!result.ok) {
      toast.danger(
        result.error.message || 'Failed to refresh daily report from worklogs.',
      );
      return;
    }

    toast.success('Daily report refreshed from worklogs.');
  };

  const handleAddTeamReportComment = async () => {
    if (!selectedTeamReportId) return;

    const content = teamReportCommentInput.trim();
    if (!content) return;

    const result = await addDailyReportCommentMutation.mutateAsync({
      projectId,
      reportId: selectedTeamReportId,
      body: { content },
    });
    if (!result.ok) {
      toast.danger(result.error.message || t('errors.addComment'));
      return;
    }

    setTeamReportCommentInput('');
    toast.success(t('toasts.commentAdded'));
  };

  const handleMarkTeamReportSeen = async () => {
    if (!selectedTeamReportId) return;

    const result = await markDailyReportSeenMutation.mutateAsync({
      projectId,
      reportId: selectedTeamReportId,
    });
    if (!result.ok) {
      toast.danger(result.error.message || t('errors.markSeen'));
      return;
    }

    toast.success(t('toasts.markedSeen'));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:gap-5">
          <div className="max-w-xl space-y-1">
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>
              {t('description', { project: projectName?.trim() || t('thisProject') })}
            </CardDescription>
          </div>
          <div className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-[220px_minmax(220px,1fr)] 2xl:flex 2xl:flex-wrap 2xl:items-center">
            <div className="w-full min-w-0 2xl:w-[220px]">
              <DatePicker
                value={selectedDate}
                onChange={(value) => {
                  setSelectedDate(value);
                  teamReportPagination.setPage(1);
                }}
                placeholder={t('filters.selectDate')}
              />
            </div>
            {resolvedActiveTab === 'team-report' && canShowTeamReports ? (
              <>
                <Select
                  value={effectiveSelectedUserId}
                  onValueChange={(value) => {
                    setSelectedUserId(value);
                    teamReportPagination.setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full min-w-0 2xl:w-[220px]">
                    <SelectValue placeholder={t('filters.allMembers')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_USERS_VALUE}>{t('filters.allMembers')}</SelectItem>
                    {(projectMembersQuery.data ?? []).map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {memberLabelById.get(member.userId) ?? member.userId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={teamReportStatusFilter}
                  onValueChange={(value) => {
                    setTeamReportStatusFilter(
                      value as DailyReportStatus | typeof ALL_TEAM_REPORT_STATUSES_VALUE,
                    );
                    teamReportPagination.setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full min-w-0 2xl:w-[180px]">
                    <SelectValue placeholder={t('filters.allStatuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_TEAM_REPORT_STATUSES_VALUE}>
                      {t('filters.allStatuses')}
                    </SelectItem>
                    <SelectItem value="draft">{t('statuses.draft')}</SelectItem>
                    <SelectItem value="submitted">{t('statuses.submitted')}</SelectItem>
                    <SelectItem value="locked">{t('statuses.locked')}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={teamReportSearchQuery}
                  onChange={(event) => {
                    setTeamReportSearchQuery(event.target.value);
                    teamReportPagination.setPage(1);
                  }}
                  placeholder={t('filters.searchPlaceholder')}
                  className="w-full min-w-0 md:col-span-2 xl:col-span-1 2xl:w-[280px]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => {
                    const rawQuery = teamReportsQuery.raw as {
                      refetch?: () => Promise<unknown>;
                    };
                    void rawQuery.refetch?.();
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </>
            ) : resolvedActiveTab === 'my-report' ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleRefreshMyReportDraft()}
                disabled={!report || !isDraft || generateDailyReportMutation.isPending}
                className="w-full min-w-0 md:col-span-1 xl:w-fit"
              >
                {generateDailyReportMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {t('actions.refreshFromWorklogs')}
              </Button>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <Tabs
        value={resolvedActiveTab}
        onValueChange={(value) => {
          if (value === 'team-report' && !canShowTeamReports) return;
          setActiveTab(value as typeof activeTab);
        }}
      >
        <TabsList>
          <TabsTrigger value="my-report">{t('tabs.myReport')}</TabsTrigger>
          {canShowTeamReports ? (
            <TabsTrigger value="team-report">{t('tabs.teamReports')}</TabsTrigger>
          ) : null}
        </TabsList>
      </Tabs>

      {resolvedActiveTab === 'my-report' ? (
        myReportQuery.isPending ? (
          <Card>
            <CardContent className="text-muted-foreground py-6 text-sm">
              {t('loading.myReport')}
            </CardContent>
          </Card>
        ) : myReportQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>{t('errors.loadMyReport')}</AlertTitle>
            <AlertDescription>
              {myReportQuery.error?.message ?? t('errors.unknown')}
            </AlertDescription>
          </Alert>
        ) : report ? (
          <>
            <section className="bg-card overflow-hidden rounded-xl border">
              <div className="flex flex-col gap-4 border-b px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm font-medium">{t('myReport.label')}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold tracking-tight">
                      {report.projectName?.trim() ||
                        projectName?.trim() ||
                        t('myReport.unknownProject')}
                    </h2>
                    <DailyReportStatusBadge status={report.status} />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {t('myReport.reportDateSummary', {
                      date: report.reportDate,
                      count: report.items.length,
                    })}
                  </p>
                </div>

                <div className="bg-muted/20 max-w-sm rounded-lg border px-4 py-3">
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {t('myReport.mode')}
                  </p>
                  <p className="text-foreground mt-2 text-sm">
                    {isDraft
                      ? t('myReport.draftMode')
                      : t('myReport.readonlyMode')}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
                <ReportOverviewMetric
                  label={t('overview.totalLogged')}
                  value={formatDailyMinutes(report.totalLoggedMinutes)}
                />
                <ReportOverviewMetric
                  label={t('overview.items')}
                  value={t('overview.itemsCount', { count: report.items.length })}
                />
                <ReportOverviewMetric
                  label={t('overview.submittedAt')}
                  value={formatDailyDateTime(report.submittedAt, t('common.notAvailable'))}
                />
                <ReportOverviewMetric
                  label={t('overview.lastUpdated')}
                  value={formatDailyDateTime(report.updatedAt, t('common.notAvailable'))}
                />
              </div>
            </section>

            <div className="space-y-6">
              {hasReportItems ? (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                  <div className="space-y-6">
                    {isDraft ? (
                      <DailyReportDraftEditor
                        key={`${report.id}:${report.updatedAt ?? ''}:${report.status}`}
                        report={report}
                        hasReportItems={hasReportItems}
                        isSavingDraft={isSavingDraft}
                        isUpdating={updateDailyReportMutation.isPending}
                        isSubmitting={submitDailyReportMutation.isPending}
                        onSaveDraft={handleSaveDraft}
                        onSubmitReport={handleSubmitReport}
                      />
                    ) : (
                      <DailyReportNarrativeSummary report={report} />
                    )}
                  </div>

                  <section className="bg-card h-fit overflow-hidden rounded-xl border">
                    <div className="border-b px-5 py-4">
                      <h2 className="text-base font-semibold">Review</h2>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {isDraft
                          ? t('review.descriptionDraft')
                          : t('review.descriptionSubmitted')}
                      </p>
                    </div>

                    <div className="space-y-5 px-5 py-5">
                      <div className="bg-muted/20 rounded-lg border px-4 py-3">
                        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                          {t('review.statusTitle')}
                        </p>
                        <p className="text-foreground mt-2 text-sm">
                          <DailyReportReviewStatusText
                            isSeen={report.isSeen}
                            seenByDisplayName={report.seenByDisplayName}
                            seenByEmail={report.seenByEmail}
                            seenByUserId={report.seenByUserId}
                            seenAt={report.seenAt}
                            unseenLabel={
                              isDraft
                                ? t('review.submitFirst')
                                : t('review.notSeenYet')
                            }
                          />
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium">{t('review.commentsTitle')}</p>
                          <p className="text-muted-foreground text-xs">
                            {t('review.commentsDescription')}
                          </p>
                        </div>

                        <DailyReportCommentsList
                          comments={myReportComments}
                          emptyMessage={
                            isDraft
                              ? t('empty.commentsAfterSubmit')
                              : t('empty.comments')
                          }
                        />
                      </div>
                    </div>
                  </section>
                </div>
              ) : null}

              <section className="bg-card overflow-hidden rounded-xl border xl:col-span-2">
                <div className="border-b px-5 py-4">
                  <h2 className="text-base font-semibold">{t('items.title')}</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {t('items.description')}
                  </p>
                </div>
                <div className="px-5 py-5">
                  <DailyReportItemsList items={report.items} />
                </div>
              </section>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="text-muted-foreground py-6 text-sm">
              {t('empty.day')}
            </CardContent>
          </Card>
        )
      ) : canShowTeamReports ? (
        teamReportsQuery.isPending ? (
          <Card>
            <CardContent className="text-muted-foreground py-6 text-sm">
              Loading team daily reports...
            </CardContent>
          </Card>
        ) : teamReportsQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>{t('errors.loadTeamReports')}</AlertTitle>
            <AlertDescription>
              {teamReportsQuery.error?.message ?? t('errors.unknown')}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{t('team.title')}</CardTitle>
                  <CardDescription>
                    Scan blockers, spot missing drafts, and open any report for full
                    detail.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="h-8 rounded-md px-3">
                  {t('team.matchingReports', { count: teamReportMeta.total })}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-md border px-4 py-3">
                    <p className="text-muted-foreground text-xs">Drafts</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {teamReportSummary.draft}
                    </p>
                  </div>
                  <div className="rounded-md border px-4 py-3">
                    <p className="text-muted-foreground text-xs">Submitted / Locked</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {teamReportSummary.submitted + teamReportSummary.locked}
                    </p>
                  </div>
                  <div className="rounded-md border px-4 py-3">
                    <p className="text-muted-foreground text-xs">Reports with blockers</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {teamReportSummary.withBlockers}
                    </p>
                  </div>
                  <div className="rounded-md border px-4 py-3">
                    <p className="text-muted-foreground text-xs">Total logged</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {formatDailyMinutes(teamReportSummary.totalLoggedMinutes)}
                    </p>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/25 hover:bg-muted/25">
                        <TableHead className="px-4">{t('team.member')}</TableHead>
                        <TableHead>{t('team.status')}</TableHead>
                        <TableHead>{t('team.logged')}</TableHead>
                        <TableHead className="min-w-[320px]">{t('team.summary')}</TableHead>
                        <TableHead className="min-w-[220px]">{t('team.blockers')}</TableHead>
                        <TableHead className="min-w-[180px]">{t('team.lastActivity')}</TableHead>
                        <TableHead className="w-[88px] text-right">{t('team.action')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedTeamReports.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-muted-foreground py-10 text-center text-sm"
                          >
                            {t('empty.filteredReports')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedTeamReports.map((teamReport) => {
                          const displayName = resolveTeamReportDisplayName(
                            teamReport,
                            memberLabelById,
                          );
                          const blockersText = teamReport.blockers?.trim() || '';
                          const summaryText = teamReport.summary?.trim() || '';

                          return (
                            <TableRow key={teamReport.id}>
                              <TableCell className="px-4 align-top">
                                <div className="min-w-[180px]">
                                  <p className="font-medium">{displayName}</p>
                                  <p className="text-muted-foreground text-xs">
                                    {teamReport.userEmail || 'No email'}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <DailyReportStatusBadge status={teamReport.status} />
                              </TableCell>
                              <TableCell className="align-top">
                                <div>
                                  <p className="font-medium">
                                    {formatDailyMinutes(teamReport.totalLoggedMinutes)}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    {teamReport.items.length} item
                                    {teamReport.items.length === 1 ? '' : 's'}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <div className="max-w-[360px] space-y-1 break-words whitespace-normal">
                                  <p className="text-sm">
                                    {summaryText || t('empty.noSummary')}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    Plan:{' '}
                                    {teamReport.planTomorrow?.trim() || 'Not filled yet.'}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <div className="max-w-[260px] text-sm break-words whitespace-normal">
                                  {blockersText ? (
                                    blockersText
                                  ) : (
                                    <span className="text-muted-foreground">
                                      No blockers reported.
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <div className="text-sm">
                                  <p>
                                    {teamReport.submittedAt
                                      ? t('team.lastActivitySubmitted')
                                      : t('team.lastActivityUpdated')}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    {formatDailyDateTime(
                                      teamReport.submittedAt ??
                                        teamReport.updatedAt ??
                                        null,
                                    )}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right align-top">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedTeamReportId(teamReport.id)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  {t('team.view')}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-muted-foreground text-sm">
                    Showing {teamReportPageStart}-{teamReportPageEnd} of{' '}
                    {teamReportMeta.total} reports across {teamReportSummary.members.size}{' '}
                    members.
                  </p>

                  <div className="flex items-center gap-2">
                    <Select
                      value={String(teamReportPagination.limit)}
                      onValueChange={(value) => {
                        teamReportPagination.setLimit(Number(value));
                        teamReportPagination.setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAM_REPORT_PAGE_SIZE_OPTIONS.map((pageSize) => (
                          <SelectItem key={pageSize} value={String(pageSize)}>
                            {t('team.perPage', { count: pageSize })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={currentTeamReportPage <= 1}
                      onClick={() =>
                        teamReportPagination.setPage(
                          Math.max(currentTeamReportPage - 1, 1),
                        )
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={currentTeamReportPage >= totalTeamReportPages}
                      onClick={() =>
                        teamReportPagination.setPage(currentTeamReportPage + 1)
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Dialog
              open={Boolean(selectedTeamReport)}
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedTeamReportId(null);
                  setTeamReportCommentInput('');
                }
              }}
            >
              <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-7xl">
                {selectedTeamReport ? (
                  <>
                    <DialogHeader>
                      <DialogTitle>
                        {resolveTeamReportDisplayName(
                          selectedTeamReport,
                          memberLabelById,
                        )}
                      </DialogTitle>
                      <DialogDescription>
                        {t('team.detailSummary', {
                          date: selectedTeamReport.reportDate,
                          logged: formatDailyMinutes(selectedTeamReport.totalLoggedMinutes),
                          count: selectedTeamReport.items.length,
                        })}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-md border px-4 py-3">
                          <p className="text-muted-foreground text-xs">Status</p>
                          <div className="mt-2">
                            <DailyReportStatusBadge status={selectedTeamReport.status} />
                          </div>
                        </div>
                        <div className="rounded-md border px-4 py-3">
                          <p className="text-muted-foreground text-xs">Submitted at</p>
                          <p className="mt-2 text-sm">
                            {formatDailyDateTime(selectedTeamReport.submittedAt)}
                          </p>
                        </div>
                        <div className="rounded-md border px-4 py-3">
                          <p className="text-muted-foreground text-xs">Last updated</p>
                          <p className="mt-2 text-sm">
                            {formatDailyDateTime(selectedTeamReport.updatedAt)}
                          </p>
                        </div>
                        <div className="rounded-md border px-4 py-3">
                          <p className="text-muted-foreground text-xs">Logged time</p>
                          <p className="mt-2 text-sm">
                            {formatDailyMinutes(selectedTeamReport.totalLoggedMinutes)}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-3">
                        <div className="rounded-md border p-4">
                          <p className="text-muted-foreground text-xs">Summary</p>
                          <p className="mt-2 text-sm whitespace-pre-wrap">
                            {selectedTeamReport.summary?.trim() || 'No summary provided.'}
                          </p>
                        </div>
                        <div className="rounded-md border p-4">
                          <p className="text-muted-foreground text-xs">Blockers</p>
                          <p className="mt-2 text-sm whitespace-pre-wrap">
                            {selectedTeamReport.blockers?.trim() ||
                              'No blockers reported.'}
                          </p>
                        </div>
                        <div className="rounded-md border p-4">
                          <p className="text-muted-foreground text-xs">Plan tomorrow</p>
                          <p className="mt-2 text-sm whitespace-pre-wrap">
                            {selectedTeamReport.planTomorrow?.trim() ||
                              'No plan provided.'}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                        <div className="rounded-md border p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Review status</p>
                              <p className="text-muted-foreground text-sm">
                                <DailyReportReviewStatusText
                                  isSeen={selectedTeamReport.isSeen}
                                  seenByDisplayName={selectedTeamReport.seenByDisplayName}
                                  seenByEmail={selectedTeamReport.seenByEmail}
                                  seenByUserId={selectedTeamReport.seenByUserId}
                                  seenAt={selectedTeamReport.seenAt}
                                  unseenLabel={t('teamDetail.noReviewerSeen')}
                                />
                              </p>
                              {!canReviewSelectedTeamReport ? (
                                <p className="text-muted-foreground text-xs">
                                  PM review actions are available only for submitted or
                                  locked reports from other members.
                                </p>
                              ) : null}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => void handleMarkTeamReportSeen()}
                              disabled={
                                !canReviewSelectedTeamReport ||
                                markDailyReportSeenMutation.isPending ||
                                Boolean(selectedTeamReport.isSeen)
                              }
                            >
                              {markDailyReportSeenMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCheck className="mr-2 h-4 w-4" />
                              )}
                              {selectedTeamReport.isSeen ? t('teamDetail.seen') : t('teamDetail.markAsSeen')}
                            </Button>
                          </div>
                        </div>

                        <div className="rounded-md border p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <MessageSquare className="text-muted-foreground h-4 w-4" />
                            <div>
                              <p className="text-sm font-medium">Review comments</p>
                              <p className="text-muted-foreground text-xs">
                                PM comments stay with the report for follow-up.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {selectedTeamReportCommentsQuery.isPending ? (
                              <p className="text-muted-foreground text-sm">
                                Loading comments...
                              </p>
                            ) : (
                              <DailyReportCommentsList
                                comments={selectedTeamReportComments}
                                emptyMessage={t('empty.comments')}
                              />
                            )}
                          </div>

                          <div className="mt-4 space-y-2">
                            <Label htmlFor="team-report-comment">{t('teamDetail.addComment')}</Label>
                            <Textarea
                              id="team-report-comment"
                              className="min-h-24"
                              value={teamReportCommentInput}
                              onChange={(event) =>
                                setTeamReportCommentInput(event.target.value)
                              }
                              disabled={
                                !canReviewSelectedTeamReport ||
                                addDailyReportCommentMutation.isPending
                              }
                              placeholder={t('teamDetail.addCommentPlaceholder')}
                            />
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                onClick={() => void handleAddTeamReportComment()}
                                disabled={
                                  !canReviewSelectedTeamReport ||
                                  addDailyReportCommentMutation.isPending ||
                                  teamReportCommentInput.trim().length === 0
                                }
                              >
                                {addDailyReportCommentMutation.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                )}
                                {t('teamDetail.addCommentAction')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-md border p-4">
                        <div className="mb-3">
                          <p className="text-sm font-medium">Report items</p>
                          <p className="text-muted-foreground text-xs">
                            Worklogs and manual entries included in this report.
                          </p>
                        </div>
                        <DailyReportItemsList items={selectedTeamReport.items} />
                      </div>
                    </div>
                  </>
                ) : null}
              </DialogContent>
            </Dialog>
          </>
        )
      ) : null}
    </div>
  );
}
