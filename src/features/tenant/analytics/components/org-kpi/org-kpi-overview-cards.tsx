'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  FolderKanban,
  CheckCircle2,
  Clock,
  Star,
  Timer,
} from 'lucide-react';
import { useOrgKpiOverview } from '../../query/use-org-kpi';

export function OrgKpiOverviewCards() {
  const t = useTranslations('analytics');
  const q = useOrgKpiOverview();

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
        <AlertDescription>{q.error?.message ?? t('orgKpi.failedToLoad')}</AlertDescription>
      </Alert>
    );
  }

  const d = q.data;
  if (!d) return null;

  const cards = [
    {
      title: t('orgKpi.overview.totalMembers'),
      icon: Users,
      value: d.totalMembers,
      sub: t('orgKpi.overview.activeMembers', { count: d.activeMembers }),
      progress: null,
    },
    {
      title: t('orgKpi.overview.projects'),
      icon: FolderKanban,
      value: `${d.activeProjects} / ${d.totalProjects}`,
      sub: t('orgKpi.overview.projectsSub', {
        completed: d.completedProjects,
        onHold: d.onHoldProjects,
      }),
      progress: null,
    },
    {
      title: t('orgKpi.overview.completedTasks'),
      icon: CheckCircle2,
      value: `${d.completionRate.toFixed(1)}%`,
      sub: t('orgKpi.overview.completedTasksSub', {
        completed: d.completedTasks,
        total: d.totalTasks,
      }),
      progress: d.completionRate,
    },
    {
      title: t('orgKpi.overview.onTime'),
      icon: Clock,
      value: `${d.onTimeRate.toFixed(1)}%`,
      sub: t('orgKpi.overview.onTimeSub', { count: d.overdueTasks }),
      progress: d.onTimeRate,
    },
    {
      title: t('orgKpi.overview.pointKpi'),
      icon: Star,
      value: `${d.pointCompletionRate.toFixed(1)}%`,
      sub: t('orgKpi.overview.pointKpiSub', {
        actual: d.totalActualPoints,
        estimate: d.totalEstimatePoints,
      }),
      progress: d.pointCompletionRate,
    },
    {
      title: t('orgKpi.overview.totalOt'),
      icon: Timer,
      value: `${d.totalOtHours.toFixed(1)}h`,
      sub: t('orgKpi.overview.totalOtSub', { count: d.totalApprovedOtTickets }),
      progress: null,
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
            {card.progress !== null && (
              <Progress value={card.progress} className="h-1.5" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
