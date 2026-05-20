'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
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
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useOrgKpiMembers } from '../../query/use-org-kpi';
import { PerformanceScoreBadge } from './performance-score-badge';
import type { OrgKpiMembersQuery } from '../../types/kpi.types';

type SortField = NonNullable<OrgKpiMembersQuery['sortBy']>;

function SortIcon({ field, current, order }: { field: SortField; current?: SortField; order?: 'ASC' | 'DESC' }) {
  if (field !== current) return <ChevronsUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
  return order === 'ASC'
    ? <ChevronUp className="ml-1 inline h-3 w-3" />
    : <ChevronDown className="ml-1 inline h-3 w-3" />;
}

export function OrgKpiMembersTable() {
  const t = useTranslations('analytics');
  const params = useParams<{ tenant: string }>();
  const [query, setQuery] = useState<OrgKpiMembersQuery>({
    page: 1,
    limit: 20,
    sortBy: 'performanceScore',
    sortOrder: 'DESC',
  });

  const q = useOrgKpiMembers(query);

  function handleSort(field: SortField) {
    setQuery((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'DESC' ? 'ASC' : 'DESC',
      page: 1,
    }));
  }

  const sortableHeaders: { label: string; field: SortField }[] = [
    { label: t('orgKpi.table.projects'), field: 'projectCount' },
    { label: t('orgKpi.table.assigned'), field: 'totalAssigned' },
    { label: t('orgKpi.table.completion'), field: 'completionRate' },
    { label: t('orgKpi.table.onTime'), field: 'onTimeRate' },
    { label: t('orgKpi.table.pointKpi'), field: 'pointCompletionRate' },
    { label: t('orgKpi.table.otHours'), field: 'totalOtHours' },
    { label: t('orgKpi.table.score'), field: 'performanceScore' },
  ];

  const total = q.data?.meta.total ?? 0;
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('orgKpi.membersTitle')}</h2>
        {!q.isPending && (
          <span className="text-muted-foreground text-sm">
            {t('orgKpi.membersCount', { count: total })}
          </span>
        )}
      </div>

      {q.isError && (
        <Alert variant="destructive">
          <AlertDescription>{q.error?.message ?? t('orgKpi.failedToLoad')}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-48">{t('orgKpi.table.member')}</TableHead>
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
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isPending
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : q.data?.data.map((member, index) => (
                  <TableRow key={`${member.userId}-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-xs">
                            {(member.fullName ?? member.email ?? '?').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {member.fullName ?? '-'}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {member.email ?? ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.projectCount}</TableCell>
                    <TableCell>{member.totalAssigned}</TableCell>
                    <TableCell>{member.completionRate.toFixed(1)}%</TableCell>
                    <TableCell>{member.onTimeRate.toFixed(1)}%</TableCell>
                    <TableCell>{member.pointCompletionRate.toFixed(1)}%</TableCell>
                    <TableCell>{member.totalOtHours.toFixed(1)}h</TableCell>
                    <TableCell>
                      <PerformanceScoreBadge score={member.performanceScore} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/tenant/${params.tenant}/analytics/kpi/members/${member.userId}`}>
                          {t('common.details')}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-muted-foreground text-sm">
            {t('orgKpi.pagination.page', { page, totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || q.isPending}
            onClick={() => setQuery((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || q.isPending}
            onClick={() => setQuery((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
