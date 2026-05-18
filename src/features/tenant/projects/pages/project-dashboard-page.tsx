'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CalendarIcon, RefreshCw, X } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { formatDate } from '@/lib/utils';
import {
  useProjectById,
  useProjectMembers,
  useProjectTaskMemberProgress,
} from '../query/use-projects';
import { useProjectDashboard } from '../query/use-project-dashboard';
import { ProjectDashboardSummaryCards } from '../components/dashboard/project-dashboard-summary-cards';
import { ProjectDashboardStatusChart } from '../components/dashboard/project-dashboard-status-chart';
import { ProjectDashboardActiveTasks } from '../components/dashboard/project-dashboard-active-tasks';
import { ProjectDashboardPriorityChart } from '../components/dashboard/project-dashboard-priority-chart';
import { ProjectDashboardTypeChart } from '../components/dashboard/project-dashboard-type-chart';
import { ProjectDashboardWorkload } from '../components/dashboard/project-dashboard-workload';
import type {
  MemberTaskProgressResponse,
  ProjectMemberResponse,
} from '../services/projects.service';
import type { Workload } from '../types/project-dashboard.types';

interface ProjectDashboardPageProps {
  projectSlug: string;
}

function parseDateParam(value: string | null): string {
  if (!value) return '';
  const parsed = parseISO(value);
  return isValid(parsed) ? value : '';
}

function toTrimmedString(value?: string | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function pickString(records: Array<Record<string, unknown> | null>, keys: string[]): string {
  for (const record of records) {
    if (!record) continue;
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    }
  }
  return '';
}

function toDisplayName(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].map(toTrimmedString).filter(Boolean).join(' ');
}

function resolveProjectMemberIdentity(member: ProjectMemberResponse) {
  const source = member as ProjectMemberResponse & Record<string, unknown>;
  const user = toRecord(source.user);
  const records = [source, user];
  const displayName =
    pickString(records, ['fullName', 'full_name', 'displayName', 'display_name', 'name']) ||
    toDisplayName(
      pickString(records, ['firstName', 'first_name']),
      pickString(records, ['lastName', 'last_name']),
    );
  const email = pickString(records, ['email', 'userEmail', 'user_email', 'mail']);

  return {
    displayName: toTrimmedString(displayName),
    email: toTrimmedString(email),
  };
}

function resolveProjectMemberAvatarUrl(member: ProjectMemberResponse): string {
  const source = member as ProjectMemberResponse & Record<string, unknown>;
  const user = toRecord(source.user);
  return pickString([source, user], [
    'avatarUrl',
    'avatar_url',
    'avatar',
    'photoUrl',
    'photo_url',
    'imageUrl',
    'image_url',
  ]);
}

function mapProgressToWorkload(
  members: ProjectMemberResponse[],
  progressRows: MemberTaskProgressResponse[],
  unassignedCount = 0,
): Workload {
  const progressByUserId = new Map(progressRows.map((row) => [row.userId, row]));
  const memberUserIds = new Set(members.map((member) => member.userId));

  const workloadMembers = members.map((member) => {
    const progress = progressByUserId.get(member.userId);
    const identity = resolveProjectMemberIdentity(member);
    const doneTasks = progress?.doneTasks ?? 0;
    const openTasks = progress?.openTasks ?? 0;

    return {
      userId: member.userId,
      fullName:
        toTrimmedString(progress?.fullName) ||
        identity.displayName ||
        identity.email ||
        member.userId,
      email: toTrimmedString(progress?.email || null) || identity.email || undefined,
      avatar:
        resolveProjectMemberAvatarUrl(member) ||
        toTrimmedString(progress?.avatar || null) ||
        undefined,
      totalTasks: progress?.totalAssignedTasks ?? doneTasks + openTasks,
      tasksByStatus: [
        { statusId: 'done', statusName: 'Done', count: doneTasks },
        { statusId: 'open', statusName: 'Open', count: openTasks },
      ].filter((status) => status.count > 0),
    };
  });

  for (const progress of progressRows) {
    if (memberUserIds.has(progress.userId)) continue;
    const doneTasks = progress.doneTasks ?? 0;
    const openTasks = progress.openTasks ?? 0;
    workloadMembers.push({
      userId: progress.userId,
      fullName:
        toTrimmedString(progress.fullName) ||
        toTrimmedString(progress.email || null) ||
        progress.userId,
      email: toTrimmedString(progress.email || null) || undefined,
      avatar: toTrimmedString(progress.avatar || null) || undefined,
      totalTasks: progress.totalAssignedTasks ?? doneTasks + openTasks,
      tasksByStatus: [
        { statusId: 'done', statusName: 'Done', count: doneTasks },
        { statusId: 'open', statusName: 'Open', count: openTasks },
      ].filter((status) => status.count > 0),
    });
  }

  return {
    unassignedCount,
    members: workloadMembers,
  };
}

function DateRangeFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClear,
  chartPeriodLabel,
  fromLabel,
  toLabel,
  clearLabel,
}: {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onClear: () => void;
  chartPeriodLabel: string;
  fromLabel: string;
  toLabel: string;
  clearLabel: string;
}) {
  const hasFilter = Boolean(dateFrom || dateTo);

  const fromDate = dateFrom ? parseISO(dateFrom) : undefined;
  const toDate = dateTo ? parseISO(dateTo) : undefined;

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">{chartPeriodLabel}</span>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <CalendarIcon className="h-3.5 w-3.5" />
            {fromDate ? format(fromDate, 'dd MMM yyyy') : fromLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={fromDate}
            onSelect={(date) => onDateFromChange(date ? format(date, 'yyyy-MM-dd') : '')}
            disabled={(date) => (toDate ? date > toDate : false)}
            initialFocus
          />
          {fromDate && (
            <div className="border-t p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => onDateFromChange('')}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                {clearLabel}
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <span className="text-muted-foreground text-xs">-</span>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <CalendarIcon className="h-3.5 w-3.5" />
            {toDate ? format(toDate, 'dd MMM yyyy') : toLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={toDate}
            onSelect={(date) => onDateToChange(date ? format(date, 'yyyy-MM-dd') : '')}
            disabled={(date) => (fromDate ? date < fromDate : false)}
            initialFocus
          />
          {toDate && (
            <div className="border-t p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => onDateToChange('')}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                {clearLabel}
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {hasFilter && (
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={onClear}>
          <X className="h-3.5 w-3.5" />
          {clearLabel}
        </Button>
      )}
    </div>
  );
}

export function ProjectDashboardPage({ projectSlug }: ProjectDashboardPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('project.dashboard');
  const commonT = useTranslations('project.common');

  const projectQuery = useProjectById(projectSlug);
  const projectId = projectQuery.data?.id ?? '';

  const rawDateFrom = searchParams.get('from');
  const rawDateTo = searchParams.get('to');
  const dateFrom = parseDateParam(rawDateFrom);
  const dateTo = parseDateParam(rawDateTo);

  const query = {
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  };

  const dashboardQuery = useProjectDashboard(projectId, query);
  const membersQuery = useProjectMembers(projectId);
  const memberProgressQuery = useProjectTaskMemberProgress(projectId);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  function clearDateFilter() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('from');
    params.delete('to');
    router.replace(`${pathname}?${params.toString()}`);
  }

  const data = dashboardQuery.data;
  const workload = useMemo(
    () =>
      mapProgressToWorkload(
        membersQuery.data ?? [],
        memberProgressQuery.data ?? [],
        data?.workload?.unassignedCount ?? 0,
      ),
    [data?.workload?.unassignedCount, memberProgressQuery.data, membersQuery.data],
  );
  const isLoading = dashboardQuery.isPending || projectQuery.isPending;
  const isWorkloadLoading =
    projectQuery.isPending || membersQuery.isPending || memberProgressQuery.isPending;
  const rawDashboard = dashboardQuery.raw as {
    refetch?: () => void;
    isFetching?: boolean;
  };
  const isFetching = rawDashboard?.isFetching ?? false;

  const project = projectQuery.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">{t('overallProgress')}</span>
            <span className="text-lg font-bold">{project?.progress ?? 0}%</span>
          </div>
          <Progress value={project?.progress ?? 0} className="h-2" />
          <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
            <span>
              Started: {project?.startDate ? formatDate(project.startDate) : 'Not available'}
            </span>
            <span>Due: {project?.endDate ? formatDate(project.endDate) : 'Not available'}</span>
          </div>
        </CardContent>
      </Card>

      <ProjectDashboardSummaryCards
        cards={data?.cards}
        totalMembers={data?.memberStats?.total}
        isLoading={isLoading}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          {t('chartOverview')}
        </h2>
        <div className="flex items-center gap-2">
          <DateRangeFilter
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={(value) => updateParam('from', value)}
            onDateToChange={(value) => updateParam('to', value)}
            onClear={clearDateFilter}
            chartPeriodLabel={t('chartPeriod')}
            fromLabel={t('from')}
            toLabel={t('to')}
            clearLabel={commonT('clear')}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => rawDashboard?.refetch?.()}
            disabled={isFetching}
            aria-label={commonT('refresh')}
            title={commonT('refresh')}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ProjectDashboardStatusChart data={data?.tasksByStatus} isLoading={isLoading} />
        <ProjectDashboardActiveTasks tasks={data?.activeTasks} isLoading={isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ProjectDashboardPriorityChart data={data?.tasksByPriority} isLoading={isLoading} />
        <ProjectDashboardTypeChart data={data?.tasksByType} isLoading={isLoading} />
      </div>

      <ProjectDashboardWorkload workload={workload} isLoading={isWorkloadLoading} />
    </div>
  );
}
