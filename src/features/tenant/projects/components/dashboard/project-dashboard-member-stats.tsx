'use client';

import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { MemberStats } from '../../types/project-dashboard.types';

interface ProjectDashboardMemberStatsProps {
  memberStats: MemberStats | undefined;
  isLoading: boolean;
}

export function ProjectDashboardMemberStats({
  memberStats,
  isLoading,
}: ProjectDashboardMemberStatsProps) {
  const t = useTranslations('project.dashboardMemberStats');
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-8" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const total = memberStats?.total ?? 0;
  const byRole = memberStats?.byRole ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Total count */}
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-muted-foreground text-xs">{t('totalMembers')}</p>
          </div>
        </div>

        {/* By role */}
        {byRole.length === 0 ? (
          <p className="text-muted-foreground py-2 text-center text-sm">{t('empty')}</p>
        ) : (
          <ul className="space-y-2">
            {byRole.map((role) => (
              <li key={role.roleId} className="flex items-center justify-between">
                <span className="truncate text-sm">{role.roleName}</span>
                <Badge variant="secondary" className="ml-2 flex-shrink-0 text-xs">
                  {role.count}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
