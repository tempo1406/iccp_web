'use client';

import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useProjectMyKpiDetail } from '../../query/use-project-kpi';
import { PerformanceScoreBadge } from '../org-kpi/performance-score-badge';
import { DueStateBadge } from './due-state-badge';
import { ProjectKpiTargetAchievementCard } from './project-kpi-target-achievement-card';
import type { ProjectMemberKpiTargetSummary } from '../../types/kpi.types';

interface Props {
  projectId: string;
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

export function ProjectKpiMyDetail({ projectId }: Props) {
  const commonT = useTranslations('project.kpiWorkspace.common');
  const detailT = useTranslations('project.kpiWorkspace.myDetail');
  const achievementT = useTranslations('project.kpiWorkspace.targetAchievement');
  const q = useProjectMyKpiDetail(projectId);

  if (q.isPending) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (q.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {q.error?.message ?? detailT('loadFailed')}
        </AlertDescription>
      </Alert>
    );
  }

  const data = q.data;
  if (!data) return null;

  const statCards = [
    {
      label: detailT('stats.performanceScore'),
      value: <PerformanceScoreBadge score={data.performanceScore} />,
      sub: null,
    },
    {
      label: detailT('stats.taskCompletion'),
      value: formatPercent(data.completionRate),
      sub: `${data.completedTasks} / ${data.totalAssigned}`,
    },
    {
      label: detailT('stats.onTimeRate'),
      value: formatPercent(data.onTimeRate),
      sub: detailT('stats.tasks', { count: data.onTimeTasks }),
    },
    {
      label: detailT('stats.pointKpi'),
      value: formatPercent(data.pointCompletionRate),
      sub: detailT('stats.points', {
        actual: data.totalActualPoints,
        estimated: data.totalEstimatePoints,
      }),
    },
  ];

  const priorityKeys = ['urgent', 'high', 'medium', 'low'] as const;
  const totalPriorityTasks = Object.values(data.tasksByPriority).reduce((sum, value) => sum + value, 0);
  const totalPriorityPoints = Object.values(data.pointsByPriority).reduce((sum, value) => sum + value, 0);
  const priorityLabels = {
    urgent: commonT('priority.urgent'),
    high: commonT('priority.high'),
    medium: commonT('priority.medium'),
    low: commonT('priority.low'),
  };
  const targetRows = data.target
    ? buildTargetRows(data.target, {
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
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={data.avatar} />
          <AvatarFallback className="text-lg">
            {(data.fullName ?? data.email ?? '?').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-muted-foreground text-sm">{detailT('title')}</p>
          <h2 className="text-primary text-2xl font-bold">{data.fullName ?? '-'}</h2>
          <p className="text-muted-foreground">{data.email}</p>
        </div>
      </div>

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
              {card.sub ? <p className="text-muted-foreground text-xs">{card.sub}</p> : null}
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
            {data.target ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-xs">{commonT('period')}</p>
                    <p className="mt-1 truncate text-sm font-medium">
                      {data.target.periodStart} - {data.target.periodEnd}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{commonT('type')}</p>
                    <p className="mt-1 truncate text-sm font-medium">{data.target.period}</p>
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
          achievement={data.achievement}
          achievementAdjustment={data.achievementAdjustment}
          achievementRate={data.achievementRate}
          actualScore={data.performanceScore}
          actualPointCompletionRate={data.pointCompletionRate}
          actualOnTimeRate={data.onTimeRate}
          actualOtHours={data.totalOtHours}
          actualCompletedTasks={data.completedTasks}
          actualOverdueTasks={data.overdueTasks}
          target={data.target}
        />
      </div>

      <Tabs defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent">{commonT('recentTasks')}</TabsTrigger>
          <TabsTrigger value="priority">{commonT('byPriority')}</TabsTrigger>
        </TabsList>

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
                {data.recentTasks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground py-8 text-center text-sm"
                    >
                      {commonT('noRecentTasks')}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recentTasks.map((task) => (
                    <TableRow key={task.taskId}>
                      <TableCell className="max-w-xs">
                        <p className="truncate font-medium">{task.title}</p>
                        {task.slug ? (
                          <p className="text-muted-foreground text-xs">{task.slug}</p>
                        ) : null}
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

        <TabsContent value="priority" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{commonT('tasksByPriority')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {priorityKeys.map((key) => {
                  const count = data.tasksByPriority[key];
                  const pct = totalPriorityTasks > 0 ? Math.round((count / totalPriorityTasks) * 100) : 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <Badge className={PRIORITY_COLORS[key]}>{priorityLabels[key]}</Badge>
                        <span className="font-medium">
                          {count} <span className="text-muted-foreground font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{commonT('pointsByPriority')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {priorityKeys.map((key) => {
                  const count = data.pointsByPriority[key];
                  const pct = totalPriorityPoints > 0 ? Math.round((count / totalPriorityPoints) * 100) : 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <Badge className={PRIORITY_COLORS[key]}>{priorityLabels[key]}</Badge>
                        <span className="font-medium">
                          {commonT('pointsValue', { count })}{' '}
                          <span className="text-muted-foreground font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <Progress value={pct} className="h-2" />
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
