'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useProjectKpiMembers } from '../../query/use-project-kpi';
import { PerformanceScoreBadge } from '../org-kpi/performance-score-badge';
import {
  AchievementMetricsSummary,
  TargetMetricsSummary,
} from '../kpi-targets/kpi-target-display';
import type { ProjectKpiMembersQuery } from '../../types/kpi.types';

type SortField = NonNullable<ProjectKpiMembersQuery['sortBy']>;

function SortIcon({
  field,
  current,
  order,
}: {
  field: SortField;
  current?: SortField;
  order?: 'ASC' | 'DESC';
}) {
  if (field !== current) return <ChevronsUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
  return order === 'ASC' ? (
    <ChevronUp className="ml-1 inline h-3 w-3" />
  ) : (
    <ChevronDown className="ml-1 inline h-3 w-3" />
  );
}

interface Props {
  projectId: string;
  /** When provided, "Details" links to the (dashboard)/projects/[slug]/kpi/members/[userId] route */
  projectSlug?: string;
  projectKpiBasePath?: string;
}

export function ProjectKpiMembersTable({ projectId, projectSlug, projectKpiBasePath }: Props) {
  const params = useParams<{ tenant: string }>();
  const t = useTranslations('project.kpiWorkspace.membersTable');
  const [query, setQuery] = useState<ProjectKpiMembersQuery>({
    sortBy: 'performanceScore',
    sortOrder: 'DESC',
  });

  const q = useProjectKpiMembers(projectId, query);

  function handleSort(field: SortField) {
    setQuery((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'DESC' ? 'ASC' : 'DESC',
    }));
  }

  const sortableHeaders: { label: string; field: SortField }[] = [
    { label: t('headers.actualAssigned'), field: 'totalAssigned' },
    { label: t('headers.actualCompletion'), field: 'completionRate' },
    { label: t('headers.actualOnTime'), field: 'onTimeRate' },
    { label: t('headers.actualPoint'), field: 'pointCompletionRate' },
    { label: t('headers.actualScore'), field: 'performanceScore' },
  ];

  const members = q.data ?? [];
  const defaultProjectKpiBasePath = projectSlug
    ? `/tenant/${params.tenant}/projects/${projectSlug}/kpi`
    : `/tenant/${params.tenant}/projects/${projectId}/kpi`;
  const detailBasePath = projectKpiBasePath ?? defaultProjectKpiBasePath;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        {!q.isPending && (
          <span className="text-muted-foreground text-sm">{t('count', { count: members.length })}</span>
        )}
      </div>

      {q.isError && (
        <Alert variant="destructive">
          <AlertDescription>{q.error?.message ?? t('loadFailed')}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-48">{t('headers.member')}</TableHead>
              {sortableHeaders.map(({ label, field }) => (
                <TableHead
                  key={field}
                  className="cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort(field)}
                >
                  {label}
                  <SortIcon field={field} current={query.sortBy} order={query.sortOrder} />
                </TableHead>
              ))}
              <TableHead>{t('headers.target')}</TableHead>
              <TableHead>{t('headers.targetAchievement')}</TableHead>
              <TableHead>{t('headers.otHours')}</TableHead>
              <TableHead className="whitespace-nowrap">{t('headers.allocatedPerDay')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isPending
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 11 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : members.map((member) => (
                  <TableRow key={member.userId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-xs">
                            {(member.fullName ?? member.email ?? '?').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{member.fullName ?? '-'}</p>
                          <p className="text-muted-foreground truncate text-xs">
                            {member.email ?? ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.totalAssigned}</TableCell>
                    <TableCell>{member.completionRate.toFixed(1)}%</TableCell>
                    <TableCell>{member.onTimeRate.toFixed(1)}%</TableCell>
                    <TableCell>{member.pointCompletionRate.toFixed(1)}%</TableCell>
                    <TableCell>
                      <PerformanceScoreBadge score={member.performanceScore} />
                    </TableCell>
                    <TableCell className="min-w-56">
                      {member.target ? (
                        <TargetMetricsSummary target={member.target} />
                      ) : (
                        <span className="text-muted-foreground text-sm">{t('noTarget')}</span>
                      )}
                    </TableCell>
                    <TableCell className="min-w-56">
                      <AchievementMetricsSummary
                        achievement={member.achievement}
                        achievementAdjustment={member.achievementAdjustment}
                        achievementRate={member.achievementRate}
                      />
                    </TableCell>
                    <TableCell>{member.totalOtHours.toFixed(1)}h</TableCell>
                    <TableCell>
                      {member.allocatedHoursPerDay !== undefined
                        ? `${member.allocatedHoursPerDay}h`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`${detailBasePath}/members/${member.userId}`}>
                          {t('details')}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
