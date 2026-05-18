'use client';

import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Workload, WorkloadMemberStatus } from '../../types/project-dashboard.types';

interface ProjectDashboardWorkloadProps {
  workload: Workload | undefined;
  isLoading: boolean;
}

const STATUS_COLORS = [
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#3b82f6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#8b5cf6',
];

function getInitials(name: string | undefined, email: string | undefined): string {
  if (name) {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) return email[0].toUpperCase();
  return '?';
}

function toCount(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, value);
}

function getRuntimeCount(member: Workload['members'][number], key: string): number | null {
  return toCount((member as unknown as Record<string, unknown>)[key]);
}

function getMemberStatusSegments(member: Workload['members'][number]): WorkloadMemberStatus[] {
  const explicitStatuses = member.tasksByStatus ?? [];
  if (explicitStatuses.length > 0) return explicitStatuses;

  const doneTasks =
    getRuntimeCount(member, 'doneTasks') ?? getRuntimeCount(member, 'tasksCompleted') ?? 0;
  const openTasks =
    getRuntimeCount(member, 'openTasks') ?? getRuntimeCount(member, 'tasksInProgress') ?? 0;

  return [
    { statusId: 'done', statusName: 'Done', count: doneTasks },
    { statusId: 'open', statusName: 'Open', count: openTasks },
  ].filter((status) => status.count > 0);
}

function getStatusCountTotal(member: Workload['members'][number]): number {
  return getMemberStatusSegments(member).reduce((sum, status) => sum + status.count, 0);
}

function getMemberTotalTasks(member: Workload['members'][number]): number {
  const statusTotal = getStatusCountTotal(member);
  const directTotals = [
    toCount(member.totalTasks),
    getRuntimeCount(member, 'totalAssignedTasks'),
    getRuntimeCount(member, 'tasksTotal'),
    getRuntimeCount(member, 'taskCount'),
    getRuntimeCount(member, 'totalTaskCount'),
    getRuntimeCount(member, 'assignedTaskCount'),
  ].filter((value): value is number => value != null);

  return Math.max(statusTotal, ...directTotals, 0);
}

function getRenderableStatusSegments(
  member: Workload['members'][number],
  total: number,
): WorkloadMemberStatus[] {
  const segments = getMemberStatusSegments(member);
  if (segments.length > 0 || total === 0) return segments;
  return [{ statusId: 'assigned', statusName: 'Assigned', count: total }];
}

export function ProjectDashboardWorkload({
  workload,
  isLoading,
}: ProjectDashboardWorkloadProps) {
  const t = useTranslations('project.dashboard.workload');
  const resolveStatusName = (statusId: string, statusName: string) => {
    const normalizedName = statusName.trim().toLowerCase();
    if (statusId === 'assigned' || normalizedName === 'assigned') {
      return t('statusFallback.assigned');
    }
    if (statusId === 'done' || normalizedName === 'done') {
      return t('statusFallback.done');
    }
    if (statusId === 'open' || normalizedName === 'open') {
      return t('statusFallback.open');
    }
    return statusName;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2 w-full" />
              </div>
              <Skeleton className="h-5 w-8" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const members = workload?.members ?? [];

  const allStatuses = new Map<string, string>();
  for (const member of members) {
    const total = getMemberTotalTasks(member);
    for (const status of getRenderableStatusSegments(member, total)) {
      if (!allStatuses.has(status.statusId)) {
        allStatuses.set(status.statusId, resolveStatusName(status.statusId, status.statusName));
      }
    }
  }
  const statusList = Array.from(allStatuses.entries());

  return (
    <Card>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">{t('empty')}</p>
        ) : (
          <div className="space-y-4">
            {statusList.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {statusList.map(([statusId, statusName], index) => (
                  <div key={statusId} className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[index % STATUS_COLORS.length] }}
                    />
                    <span className="text-muted-foreground text-xs">{statusName}</span>
                  </div>
                ))}
              </div>
            )}

            {members.map((member) => {
              const total = getMemberTotalTasks(member);
              const statusSegments = getRenderableStatusSegments(member, total);

              return (
                <div key={member.userId} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {member.avatar ? (
                      <AvatarImage
                        src={member.avatar}
                        alt={member.fullName ?? member.email ?? member.userId}
                      />
                    ) : null}
                    <AvatarFallback className="text-xs">
                      {getInitials(member.fullName, member.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="truncate text-sm font-medium">
                        {member.fullName ?? member.email ?? member.userId}
                      </span>
                      <span className="text-muted-foreground ml-2 flex-shrink-0 text-xs">
                        {total === 1
                          ? t('taskCount', { count: total })
                          : t('taskCountPlural', { count: total })}
                      </span>
                    </div>
                    {total > 0 ? (
                      <div className="flex h-2 w-full overflow-hidden rounded-full">
                        {statusSegments.map((segment, index) => {
                          const pct = (segment.count / total) * 100;
                          const statusIndex = statusList.findIndex(([id]) => id === segment.statusId);
                          return (
                            <div
                              key={segment.statusId}
                              title={`${resolveStatusName(segment.statusId, segment.statusName)}: ${segment.count}`}
                              className="h-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor:
                                  STATUS_COLORS[
                                    (statusIndex >= 0 ? statusIndex : index) % STATUS_COLORS.length
                                  ],
                              }}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <Progress value={0} className="h-2" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
