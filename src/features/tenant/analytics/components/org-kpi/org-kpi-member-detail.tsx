'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { Progress } from '@/components/ui/progress';
import { ArrowLeft } from 'lucide-react';
import { useOrgMemberKpiDetail } from '../../query/use-org-kpi';
import { PerformanceScoreBadge } from './performance-score-badge';

interface Props {
  userId: string;
}

export function OrgKpiMemberDetail({ userId }: Props) {
  const t = useTranslations('analytics');
  const projectStatusT = useTranslations('project.statusBadge');
  const params = useParams<{ tenant: string }>();
  const q = useOrgMemberKpiDetail(userId);

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
        <AlertDescription>{q.error?.message ?? t('orgKpi.failedToLoad')}</AlertDescription>
      </Alert>
    );
  }

  const d = q.data;
  if (!d) return null;
  const agg = d.aggregate;

  const statCards = [
    {
      label: t('orgKpi.memberDetail.performanceScore'),
      value: <PerformanceScoreBadge score={agg.performanceScore} />,
    },
    {
      label: t('orgKpi.memberDetail.taskCompletion'),
      value: `${agg.completionRate.toFixed(1)}%`,
      sub: `${agg.completedTasks} / ${agg.totalAssigned}`,
    },
    {
      label: t('orgKpi.memberDetail.onTime'),
      value: `${agg.onTimeRate.toFixed(1)}%`,
      sub: `${agg.onTimeTasks} ${t('common.tasks').toLowerCase()}`,
    },
    {
      label: t('orgKpi.memberDetail.pointKpi'),
      value: `${agg.pointCompletionRate.toFixed(1)}%`,
      sub: `${agg.totalActualPoints} / ${agg.totalEstimatePoints} pts`,
    },
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/tenant/${params.tenant}/analytics/kpi`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.backToKpi')}
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

      {/* Aggregate stat cards */}
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

      {/* OT + Ticket summary row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('orgKpi.memberDetail.ot')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('orgKpi.memberDetail.totalOtHours')}</span>
              <span className="font-medium">{d.ot.totalOtHours.toFixed(1)}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('orgKpi.memberDetail.effectiveHours')}</span>
              <span className="font-medium">{d.ot.effectiveOtHours.toFixed(1)}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('orgKpi.memberDetail.approvedTickets')}</span>
              <span className="font-medium">{d.ot.approvedOtTickets}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('orgKpi.memberDetail.tickets')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2">
              <Badge variant="secondary">{t('orgKpi.memberDetail.ticketTotal', { count: d.tickets.total })}</Badge>
              <Badge className="bg-yellow-500 text-white hover:bg-yellow-500">
                {t('orgKpi.memberDetail.ticketPending', { count: d.tickets.pending })}
              </Badge>
              <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">
                {t('orgKpi.memberDetail.ticketApproved', { count: d.tickets.approved })}
              </Badge>
              <Badge variant="destructive">
                {t('orgKpi.memberDetail.ticketRejected', { count: d.tickets.rejected })}
              </Badge>
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-xs">
              <span>{t('orgKpi.memberDetail.leave', { count: d.tickets.byType.leave })}</span>
              <span>{t('orgKpi.memberDetail.wfh', { count: d.tickets.byType.wfh })}</span>
              <span>{t('orgKpi.memberDetail.overtime', { count: d.tickets.byType.overtime })}</span>
              <span>{t('orgKpi.memberDetail.advance', { count: d.tickets.byType.advance })}</span>
              <span>{t('orgKpi.memberDetail.general', { count: d.tickets.byType.general })}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">{t('orgKpi.memberDetail.byProjectTab')}</TabsTrigger>
          <TabsTrigger value="ot">{t('orgKpi.memberDetail.otDetailTab')}</TabsTrigger>
        </TabsList>

        {/* By Project tab */}
        <TabsContent value="projects" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.project')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('common.tasks')}</TableHead>
                  <TableHead>{t('orgKpi.table.completion')}</TableHead>
                  <TableHead>{t('orgKpi.table.onTime')}</TableHead>
                  <TableHead>{t('orgKpi.table.score')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.byProject.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground py-8 text-center text-sm">
                      {t('orgKpi.memberDetail.noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  d.byProject.map((p) => (
                    <TableRow key={p.projectId}>
                      <TableCell className="font-medium">{p.projectName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {projectStatusT.has(p.projectStatus) ? projectStatusT(p.projectStatus) : p.projectStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{p.completedTasks} / {p.totalAssigned}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{p.completionRate.toFixed(1)}%</span>
                          <Progress value={p.completionRate} className="h-1.5 w-16" />
                        </div>
                      </TableCell>
                      <TableCell>{p.onTimeRate.toFixed(1)}%</TableCell>
                      <TableCell>
                        <PerformanceScoreBadge score={p.performanceScore} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* OT Breakdown tab */}
        <TabsContent value="ot" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orgKpi.memberDetail.ticketCode')}</TableHead>
                  <TableHead>{t('orgKpi.memberDetail.date')}</TableHead>
                  <TableHead>{t('orgKpi.memberDetail.otHours')}</TableHead>
                  <TableHead>{t('orgKpi.memberDetail.multiplier')}</TableHead>
                  <TableHead>{t('orgKpi.memberDetail.effectiveOtHours')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.ot.breakdown.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-8 text-center text-sm">
                      {t('orgKpi.memberDetail.noOtData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  d.ot.breakdown.map((item) => (
                    <TableRow key={item.ticketId}>
                      <TableCell className="font-mono text-xs">{item.ticketCode}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.hours}h</TableCell>
                      <TableCell>x{item.multiplier}</TableCell>
                      <TableCell className="font-medium">{item.effectiveHours.toFixed(2)}h</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
