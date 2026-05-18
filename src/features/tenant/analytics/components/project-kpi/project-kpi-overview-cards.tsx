'use client';

import { useTranslations } from 'next-intl';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gauge,
  Star,
  Users,
} from 'lucide-react';
import { useProjectKpiOverview } from '../../query/use-project-kpi';

interface Props {
  projectId: string;
}

export function ProjectKpiOverviewCards({ projectId }: Props) {
  const t = useTranslations('project.kpiWorkspace.overviewCards');
  const q = useProjectKpiOverview(projectId);

  if (q.isPending) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (q.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{q.error?.message ?? t('loadFailed')}</AlertDescription>
      </Alert>
    );
  }

  const d = q.data;
  if (!d) return null;

  const overdueRate = d.totalTasks > 0 ? (d.overdueTasks / d.totalTasks) * 100 : 0;
  const daysRemaining =
    d.daysRemaining !== undefined ? Math.max(0, d.daysRemaining) : undefined;

  const cards = [
    {
      title: t('progress'),
      icon: Gauge,
      value: `${d.progress.toFixed(1)}%`,
      sub: t('tasksCompleted', { completed: d.completedTasks, total: d.totalTasks }),
      progress: d.progress,
    },
    {
      title: t('completionRate'),
      icon: CheckCircle2,
      value: `${d.completionRate.toFixed(1)}%`,
      sub: t('tasks', { completed: d.completedTasks, total: d.totalTasks }),
      progress: d.completionRate,
    },
    {
      title: t('onTimeRate'),
      icon: Clock3,
      value: `${d.onTimeRate.toFixed(1)}%`,
      sub: t('dueSoon', { count: d.dueSoonTasks }),
      progress: d.onTimeRate,
    },
    {
      title: t('pointProgress'),
      icon: Star,
      value: `${d.pointCompletionRate.toFixed(1)}%`,
      sub: t('points', {
        actual: d.projectTotalActualPoints,
        estimated: d.projectTotalEstimatePoints,
      }),
      progress: d.pointCompletionRate,
    },
    {
      title: t('overdueTasks'),
      icon: AlertTriangle,
      value: d.overdueTasks,
      sub:
        d.totalTasks > 0
          ? t('overdueRate', { rate: overdueRate.toFixed(1) })
          : t('noTasks'),
      progress: null as number | null,
    },
    {
      title: daysRemaining !== undefined ? t('remaining') : t('members'),
      icon: daysRemaining !== undefined ? CalendarDays : Users,
      value: daysRemaining !== undefined ? t('days', { count: daysRemaining }) : d.totalMembers,
      sub:
        daysRemaining !== undefined
          ? t('activeMembers', { count: d.activeMembers })
          : t('active', { count: d.activeMembers }),
      progress: null as number | null,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-muted-foreground text-xs">{card.sub}</p>
            {card.progress !== null && <Progress value={card.progress} className="h-1.5" />}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
