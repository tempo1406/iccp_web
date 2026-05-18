'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useProjectMemberKpiDetail } from '../../query/use-project-kpi';
import { PerformanceScoreBadge } from '../org-kpi/performance-score-badge';
import { DueStateBadge } from './due-state-badge';
import { ProjectKpiTargetAchievementCard } from './project-kpi-target-achievement-card';
import type { ProjectMemberKpiTargetSummary } from '../../types/kpi.types';

interface Props {
  projectId: string;
  userId: string;
  /** When provided, back button links to the (dashboard)/projects/[slug]/kpi route */
  projectSlug?: string;
  projectKpiBasePath?: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-blue-500 text-white',
};

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatNumber(value: number, suffix = '') {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`;
}

function buildTargetRows(
  target: ProjectMemberKpiTargetSummary,
  labels: {
    score: string;
    pointCompletion: string;
    onTime: string;
    otHours: string;
    completedTasks: string;
    maxOverdue: string;
    overdueRule: string;
    requireZero: string;
  },
) {
  const rows = [
    {
      label: labels.score,
      value: target.targetScore !== undefined ? formatPercent(target.targetScore) : null,
    },
    {
      label: labels.pointCompletion,
      value:
        target.targetPointCompletionRate !== undefined
          ? formatPercent(target.targetPointCompletionRate)
          : null,
    },
    {
      label: labels.onTime,
      value: target.targetOnTimeRate !== undefined ? formatPercent(target.targetOnTimeRate) : null,
    },
    {
      label: labels.otHours,
      value:
        target.targetOtHours !== undefined
          ? formatNumber(target.targetOtHours, 'h')
          : null,
    },
    {
      label: labels.completedTasks,
      value: target.targetCompletedTasks !== undefined ? String(target.targetCompletedTasks) : null,
    },
    {
      label: labels.maxOverdue,
      value: target.maxOverdueTasks !== undefined ? String(target.maxOverdueTasks) : null,
    },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));

  if (target.maxOverdueTasks === undefined && target.requireZeroOverdue) {
    rows.push({ label: labels.overdueRule, value: labels.requireZero });
  }

  return rows;
}

export function ProjectKpiMemberDetail({
  projectId,
  userId,
  projectSlug,
  projectKpiBasePath,
}: Props) {
  const params = useParams<{ tenant: string }>();
  const commonT = useTranslations('project.kpiWorkspace.common');
  const detailT = useTranslations('project.kpiWorkspace.memberDetail');
  const achievementT = useTranslations('project.kpiWorkspace.targetAchievement');
  const q = useProjectMemberKpiDetail(projectId, userId);

  if (q.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (q.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{q.error?.message ?? detailT('loadFailed')}</AlertDescription>
      </Alert>
    );
  }

  const d = q.data;
  if (!d) return null;
  const backHref =
    projectKpiBasePath ??
    (projectSlug
      ? `/tenant/${params.tenant}/projects/${projectSlug}/kpi`
      : `/tenant/${params.tenant}/projects/${projectId}/kpi`);

  const statCards = [
    {
      label: detailT('stats.performanceScore'),
      value: <PerformanceScoreBadge score={d.performanceScore} />,
      sub: null,
    },
    {
      label: detailT('stats.taskCompletion'),
      value: `${d.completionRate.toFixed(1)}%`,
      sub: `${d.completedTasks} / ${d.totalAssigned}`,
    },
    {
      label: detailT('stats.onTimeRate'),
      value: `${d.onTimeRate.toFixed(1)}%`,
      sub: detailT('stats.tasks', { count: d.onTimeTasks }),
    },
    {
      label: detailT('stats.pointKpi'),
      value: `${d.pointCompletionRate.toFixed(1)}%`,
      sub: detailT('stats.points', {
        actual: d.totalActualPoints,
        estimated: d.totalEstimatePoints,
      }),
    },
  ];

  const priorityKeys = ['urgent', 'high', 'medium', 'low'] as const;
  const priorityLabels = {
    urgent: commonT('priority.urgent'),
    high: commonT('priority.high'),
    medium: commonT('priority.medium'),
    low: commonT('priority.low'),
  };
  const targetRows = d.target
    ? buildTargetRows(d.target, {
        score: achievementT('labels.score'),
        pointCompletion: achievementT('labels.pointCompletion'),
        onTime: achievementT('labels.onTime'),
        otHours: achievementT('labels.otHours'),
        completedTasks: achievementT('labels.completedTasks'),
        maxOverdue: achievementT('labels.maxOverdue'),
        overdueRule: achievementT('labels.overdueRule'),
        requireZero: achievementT('labels.requireZero'),
      })
    : [];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link
          href={backHref}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {detailT('back')}
        </Link>
      </Button>

      {/* Member header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={d.avatar} />
          <AvatarFallback className="text-lg">
            {(d.fullName ?? d.email ?? '?').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-primary text-2xl font-bold">{d.fullName ?? '-'}</h1>
          <p className="text-muted-foreground">{d.email}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold">{card.value}</div>
              {card.sub && <p className="text-muted-foreground text-xs">{card.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{detailT('currentTarget')}</CardTitle>
          </CardHeader>
          <CardContent className="flex h-full flex-col space-y-4">
            {d.target ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-xs">{commonT('period')}</p>
                    <p className="mt-1 truncate text-sm font-medium">
                      {d.target.periodStart} - {d.target.periodEnd}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{commonT('type')}</p>
                    <p className="mt-1 truncate text-sm font-medium">{d.target.period}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs">{commonT('targetMetrics')}</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {targetRows.map((item) => (
                      <div key={item.label} className="rounded-md border px-3 py-2">
                        <p className="text-muted-foreground text-xs">{item.label}</p>
                        <div className="mt-2">
                          <p className="text-muted-foreground text-[11px] leading-none">{commonT('target')}</p>
                          <p className="mt-1 truncate text-lg font-semibold">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-auto">
                  <p className="text-muted-foreground text-xs">
                    {detailT('targetDescription')}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">{commonT('noTarget')}</p>
            )}
          </CardContent>
        </Card>

        <ProjectKpiTargetAchievementCard
          achievement={d.achievement}
          achievementAdjustment={d.achievementAdjustment}
          achievementRate={d.achievementRate}
          actualScore={d.performanceScore}
          actualPointCompletionRate={d.pointCompletionRate}
          actualOnTimeRate={d.onTimeRate}
          actualOtHours={d.totalOtHours}
          actualCompletedTasks={d.completedTasks}
          actualOverdueTasks={d.overdueTasks}
          target={d.target}
        />
      </div>

      {/* OT summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{detailT('ot')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">{detailT('totalOtHours')}</p>
            <p className="font-semibold">{d.totalOtHours.toFixed(1)}h</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{detailT('effectiveHours')}</p>
            <p className="font-semibold">{d.effectiveOtHours.toFixed(1)}h</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{detailT('approvedTickets')}</p>
            <p className="font-semibold">{d.approvedOtTickets}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent">{commonT('recentTasks')}</TabsTrigger>
          <TabsTrigger value="priority">{commonT('byPriority')}</TabsTrigger>
        </TabsList>

        {/* Recent tasks */}
        <TabsContent value="recent" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{commonT('task')}</TableHead>
                  <TableHead>{commonT('status')}</TableHead>
                  <TableHead>{commonT('priorityLabel')}</TableHead>
                  <TableHead>{commonT('points')}</TableHead>
                  <TableHead>{commonT('dueDate')}</TableHead>
                  <TableHead>{commonT('dueState')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.recentTasks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground py-8 text-center text-sm"
                    >
                      {commonT('noRecentTasks')}
                    </TableCell>
                  </TableRow>
                ) : (
                  d.recentTasks.map((task) => (
                    <TableRow key={task.taskId}>
                      <TableCell className="max-w-xs">
                        <p className="truncate font-medium">{task.title}</p>
                        {task.slug && <p className="text-muted-foreground text-xs">{task.slug}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{task.statusName}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={PRIORITY_COLORS[task.priority] ?? ''}>
                          {priorityLabels[task.priority as keyof typeof priorityLabels] ?? task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{task.estimatedPoint ?? '-'}</TableCell>
                      <TableCell className="text-sm">
                        {task.dueDate ? task.dueDate.slice(0, 10) : '-'}
                      </TableCell>
                      <TableCell>
                        <DueStateBadge state={task.dueState} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Priority breakdown */}
        <TabsContent value="priority" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Tasks by priority */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{commonT('tasksByPriority')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {priorityKeys.map((key) => {
                  const count = d.tasksByPriority[key];
                  const total = Object.values(d.tasksByPriority).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <Badge className={PRIORITY_COLORS[key]}>{priorityLabels[key]}</Badge>
                        <span className="font-medium">
                          {count} <span className="text-muted-foreground font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="bg-muted h-2 w-full rounded-full">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Points by priority */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{commonT('pointsByPriority')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {priorityKeys.map((key) => {
                  const count = d.pointsByPriority[key];
                  const total = Object.values(d.pointsByPriority).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <Badge className={PRIORITY_COLORS[key]}>{priorityLabels[key]}</Badge>
                        <span className="font-medium">
                          {commonT('pointsValue', { count })}{' '}
                          <span className="text-muted-foreground font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="bg-muted h-2 w-full rounded-full">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
