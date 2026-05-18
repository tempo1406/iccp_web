'use client';

import { formatDistanceToNow } from 'date-fns';
import { enUS, vi as viLocale } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { ActiveTask } from '../../types/project-dashboard.types';

interface ProjectDashboardActiveTasksProps {
  tasks: ActiveTask[] | undefined;
  isLoading: boolean;
}

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function pickTaskDueDate(task: ActiveTask): string | undefined {
  const source = task as ActiveTask & {
    due_date?: string | null;
    deadline?: string | null;
  };
  return task.dueDate ?? source.due_date ?? source.deadline ?? undefined;
}

function normalizeDueState(task: ActiveTask, dueDate?: string): string {
  const rawState = (
    task as ActiveTask & {
      due_state?: string | null;
      dueStatus?: string | null;
      due_status?: string | null;
    }
  ).dueState ?? (task as ActiveTask & { due_state?: string | null }).due_state;
  const state = rawState?.trim();

  if (state && state !== 'no_due_date') {
    if (state === 'due_soon') return 'upcoming';
    if (state === 'on_track' || state === 'done_on_time') return 'on_time';
    if (state === 'done_late') return 'late';
    return state;
  }

  if (!dueDate) return 'no_due_date';

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return 'no_due_date';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);

  return dueDay < today ? 'overdue' : 'upcoming';
}

function formatDueDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function ProjectDashboardActiveTasks({
  tasks,
  isLoading,
}: ProjectDashboardActiveTasksProps) {
  const locale = useLocale();
  const t = useTranslations('project.dashboard.activeTasks');
  const dueStateT = useTranslations('project.dashboard.dueState');
  const priorityT = useTranslations('project.dashboard.priority');
  const relativeLocale = locale === 'vi' ? viLocale : enUS;
  const priorityConfig: Record<string, { label: string; className: string }> = {
    urgent: { label: priorityT('urgent'), className: 'bg-red-500 text-white hover:bg-red-500' },
    high: { label: priorityT('high'), className: 'bg-orange-500 text-white hover:bg-orange-500' },
    medium: { label: priorityT('medium'), className: 'bg-yellow-500 text-white hover:bg-yellow-500' },
    low: { label: priorityT('low'), className: 'bg-blue-500 text-white hover:bg-blue-500' },
  };
  const dueStateConfig: Record<string, { label: string; className: string }> = {
    overdue: { label: dueStateT('overdue'), className: 'bg-red-600 text-white hover:bg-red-600' },
    late: { label: dueStateT('late'), className: 'bg-red-500 text-white hover:bg-red-500' },
    upcoming: { label: dueStateT('upcoming'), className: 'bg-yellow-500 text-white hover:bg-yellow-500' },
    on_time: { label: dueStateT('on_time'), className: 'bg-emerald-500 text-white hover:bg-emerald-500' },
    no_due_date: { label: dueStateT('no_due_date'), className: '' },
  };

  if (isLoading) {
    return (
      <Card className="flex flex-col">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const list = tasks ?? [];

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          {t('title')}
          <span className="text-muted-foreground ml-2 text-xs font-normal">{t('recent')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {list.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">{t('empty')}</p>
        ) : (
          <ul className="space-y-3">
            {list.map((task) => {
              const priority = priorityConfig[task.priority];
              const dueDate = pickTaskDueDate(task);
              const normalizedDueState = normalizeDueState(task, dueDate);
              const dueState =
                dueStateConfig[normalizedDueState] ?? dueStateConfig.no_due_date;
              const dueLabel = dueDate ? formatDueDate(dueDate, locale) : dueState.label;

              return (
                <li key={task.id} className="flex items-start gap-3">
                  <Avatar className="mt-0.5 h-7 w-7 flex-shrink-0">
                    {(() => {
                      const avatarUrl =
                        (task as ActiveTask & {
                          assigneeAvatarUrl?: string | null;
                          avatarUrl?: string | null;
                        }).assigneeAvatarUrl ??
                        (task as ActiveTask & {
                          assigneeAvatarUrl?: string | null;
                          avatarUrl?: string | null;
                        }).avatarUrl ??
                        undefined;

                      return avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={task.assigneeName ?? 'Assignee'} />
                      ) : null;
                    })()}
                    <AvatarFallback className="text-[10px]">
                      {getInitials(task.assigneeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-snug">{task.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {task.statusName && (
                        <span className="text-muted-foreground text-xs">{task.statusName}</span>
                      )}
                      {priority && (
                        <Badge className={`h-4 px-1.5 text-[10px] ${priority.className}`}>
                          {priority.label}
                        </Badge>
                      )}
                      <Badge
                        variant={normalizedDueState === 'no_due_date' ? 'secondary' : 'default'}
                        className={`h-4 px-1.5 text-[10px] ${dueState.className}`}
                      >
                        {dueLabel}
                      </Badge>
                      <span className="text-muted-foreground text-[10px]">
                        {formatDistanceToNow(new Date(task.updatedAt), {
                          addSuffix: true,
                          locale: relativeLocale,
                        })}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
