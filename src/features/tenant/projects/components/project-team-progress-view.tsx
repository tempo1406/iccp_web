'use client';

import { Fragment, useMemo, useState, type ElementType } from 'react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { useTranslations } from 'next-intl';
import type { DateRange } from 'react-day-picker';
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
  Search,
  Target,
  Timer,
  TriangleAlert,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ProjectTeamProgressMember, ProjectTeamProgressTask } from './project-detail-data';

interface ProjectTeamProgressViewProps {
  teamMembers: ProjectTeamProgressMember[];
}

interface MemberTaskFilterState {
  statusId: string;
  priority: 'all' | 'low' | 'medium' | 'high' | 'urgent';
  dueDateRange?: DateRange;
}

type MemberFilterFieldKey = 'dueDate' | 'priority' | 'status';

const DEFAULT_MEMBER_FILTER: MemberTaskFilterState = {
  statusId: 'all',
  priority: 'all',
  dueDateRange: undefined,
};


function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function resolveMemberDisplayName(member: ProjectTeamProgressMember): string {
  const name = member.name.trim();
  return name || member.email?.trim() || 'Unknown user';
}

function shouldShowMemberEmail(member: ProjectTeamProgressMember, displayName: string): boolean {
  const email = member.email?.trim();
  if (!email) return false;
  return displayName.toLowerCase() !== email.toLowerCase();
}

function formatRangeLabel(
  range: DateRange | undefined,
  t: (key: string, values?: Record<string, string>) => string,
): string {
  if (!range?.from && !range?.to) return t('dueDateRange.default');
  if (range.from && range.to) {
    return t('dueDateRange.range', {
      from: format(range.from, 'dd/MM/yyyy'),
      to: format(range.to, 'dd/MM/yyyy'),
    });
  }
  if (range.from) return t('dueDateRange.from', { date: format(range.from, 'dd/MM/yyyy') });
  return t('dueDateRange.until', { date: format(range.to!, 'dd/MM/yyyy') });
}

function computeTaskStats(tasks: ProjectTeamProgressTask[]) {
  const doneOnTimeTasks = tasks.filter((task) => task.dueState === 'done_on_time').length;
  const doneLateTasks = tasks.filter((task) => task.dueState === 'done_late').length;
  const tasksCompleted = doneOnTimeTasks + doneLateTasks;
  const overdueOpenTasks = tasks.filter((task) => task.dueState === 'overdue').length;
  const dueSoonTasks = tasks.filter((task) => task.dueState === 'due_soon').length;
  const tasksTotal = tasks.length;
  const tasksInProgress = Math.max(tasksTotal - tasksCompleted, 0);
  const completionRate = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
  const onTimeRate = tasksCompleted > 0 ? Math.round((doneOnTimeTasks / tasksCompleted) * 100) : 0;
  const progressScore = Math.round(completionRate * 0.7 + onTimeRate * 0.3);

  return {
    doneOnTimeTasks,
    doneLateTasks,
    tasksCompleted,
    overdueOpenTasks,
    dueSoonTasks,
    tasksTotal,
    tasksInProgress,
    completionRate,
    onTimeRate,
    progressScore,
  };
}

function matchesDueDateRange(task: ProjectTeamProgressTask, range: DateRange | undefined): boolean {
  if (!range?.from && !range?.to) return true;
  if (!task.dueDate) return false;

  const dueDate = parseISO(task.dueDate);
  if (Number.isNaN(dueDate.getTime())) return false;

  const from = range.from ?? range.to;
  const to = range.to ?? range.from;
  if (!from || !to) return true;

  return isWithinInterval(dueDate, {
    start: new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, 0, 0),
    end: new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999),
  });
}

function resolveCompletionRate(member: ProjectTeamProgressMember): number {
  if (typeof member.completionRate === 'number') return member.completionRate;
  return member.tasksTotal > 0 ? Math.round((member.tasksCompleted / member.tasksTotal) * 100) : 0;
}

function isFilterActive(filter: MemberTaskFilterState): boolean {
  return (
    filter.statusId !== 'all' ||
    filter.priority !== 'all' ||
    Boolean(filter.dueDateRange?.from || filter.dueDateRange?.to)
  );
}

function getFilterCount(filter: MemberTaskFilterState): number {
  let count = 0;
  if (filter.statusId !== 'all') count += 1;
  if (filter.priority !== 'all') count += 1;
  if (filter.dueDateRange?.from || filter.dueDateRange?.to) count += 1;
  return count;
}

function buildMemberStatusOptions(tasks: ProjectTeamProgressTask[]) {
  const map = new Map<string, string>();
  for (const task of tasks) {
    if (!map.has(task.statusId)) {
      map.set(task.statusId, task.statusName);
    }
  }
  return [...map.entries()].map(([value, label]) => ({ value, label }));
}

function StatTile({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: ElementType;
  label: string;
  value: string | number;
  valueClassName?: string;
}) {
  return (
    <div className="bg-muted/40 flex items-center gap-3 rounded-lg p-3">
      <div className="bg-background flex h-9 w-9 shrink-0 items-center justify-center rounded-md border">
        <Icon className="text-muted-foreground h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">{label}</p>
        <p className={cn('text-lg font-semibold leading-tight', valueClassName)}>{value}</p>
      </div>
    </div>
  );
}

function TaskDistributionBar({
  tasksCompleted,
  overdueOpenTasks,
  dueSoonTasks,
  tasksInProgress,
  labels,
}: {
  tasksCompleted: number;
  overdueOpenTasks: number;
  dueSoonTasks: number;
  tasksInProgress: number;
  labels: {
    title: string;
    done: string;
    onTrack: string;
    dueSoon: string;
    overdue: string;
  };
}) {
  const onTrack = Math.max(0, tasksInProgress - overdueOpenTasks - dueSoonTasks);
  const total = tasksCompleted + tasksInProgress || 1;

  const segments: { key: string; value: number; color: string; label: string }[] = [
    { key: 'done', value: tasksCompleted, color: 'bg-emerald-500', label: labels.done },
    { key: 'ontrack', value: onTrack, color: 'bg-primary', label: labels.onTrack },
    { key: 'dueSoon', value: dueSoonTasks, color: 'bg-amber-500', label: labels.dueSoon },
    { key: 'overdue', value: overdueOpenTasks, color: 'bg-rose-500', label: labels.overdue },
  ];

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{labels.title}</p>
      <div className="flex h-3 overflow-hidden rounded-full">
        {segments.map((seg) =>
          seg.value > 0 ? (
            <div
              key={seg.key}
              className={cn('transition-all', seg.color)}
              style={{ width: `${(seg.value / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-1.5 text-xs">
            <span className={cn('inline-block h-2.5 w-2.5 rounded-full', seg.color)} />
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="font-medium">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectTeamProgressView({ teamMembers }: ProjectTeamProgressViewProps) {
  const t = useTranslations('project.teamProgress');
  const [expandedMemberIds, setExpandedMemberIds] = useState<string[]>([]);
  const [memberQuery, setMemberQuery] = useState('');
  const [memberFilters, setMemberFilters] = useState<Record<string, MemberTaskFilterState>>({});
  const [memberFilterFields, setMemberFilterFields] = useState<Record<string, MemberFilterFieldKey[]>>({});
  const [openFilterMemberId, setOpenFilterMemberId] = useState<string | null>(null);
  const [filterFieldQuery, setFilterFieldQuery] = useState('');
  const priorityOptions = useMemo(
    () => [
      { value: 'all' as const, label: t('priorityOptions.all') },
      { value: 'low' as const, label: t('priorityOptions.low') },
      { value: 'medium' as const, label: t('priorityOptions.medium') },
      { value: 'high' as const, label: t('priorityOptions.high') },
      { value: 'urgent' as const, label: t('priorityOptions.urgent') },
    ],
    [t],
  );
  const memberFilterFieldOptions = useMemo(
    () => [
      { key: 'dueDate' as const, label: t('filterFields.dueDate') },
      { key: 'priority' as const, label: t('filterFields.priority') },
      { key: 'status' as const, label: t('filterFields.status') },
    ],
    [t],
  );

  const orderedMembers = useMemo(
    () =>
      [...teamMembers].sort(
        (a, b) => (b.progressScore ?? 0) - (a.progressScore ?? 0) || a.name.localeCompare(b.name),
      ),
    [teamMembers],
  );

  const displayedMembers = useMemo(() => {
    const normalizedMemberQuery = memberQuery.trim().toLowerCase();

    return orderedMembers
      .map((member) => {
        const filter = memberFilters[member.id] ?? DEFAULT_MEMBER_FILTER;
        const memberTasks = member.tasks ?? [];
        const memberStatusOptions = buildMemberStatusOptions(memberTasks);
        const scopedTasks = memberTasks.filter((task) => {
          if (filter.statusId !== 'all' && task.statusId !== filter.statusId) return false;
          if (filter.priority !== 'all' && task.priority !== filter.priority) return false;
          if (!matchesDueDateRange(task, filter.dueDateRange)) return false;
          return true;
        });

        const hasActiveTaskFilter = isFilterActive(filter);
        const stats = hasActiveTaskFilter
          ? computeTaskStats(scopedTasks)
          : {
              doneOnTimeTasks: member.doneOnTimeTasks ?? 0,
              doneLateTasks: member.doneLateTasks ?? 0,
              tasksCompleted: member.tasksCompleted,
              overdueOpenTasks: member.overdueOpenTasks ?? 0,
              dueSoonTasks: member.dueSoonTasks ?? 0,
              tasksTotal: member.tasksTotal,
              tasksInProgress: member.tasksInProgress,
              completionRate: resolveCompletionRate(member),
              onTimeRate: member.onTimeRate ?? 0,
              progressScore: member.progressScore ?? 0,
            };

        const matchesMemberQuery =
          !normalizedMemberQuery ||
          member.name.toLowerCase().includes(normalizedMemberQuery) ||
          member.email?.toLowerCase().includes(normalizedMemberQuery) ||
          [member.role, ...(member.roles ?? [])]
            .join(' ')
            .toLowerCase()
            .includes(normalizedMemberQuery);

        if (!matchesMemberQuery) return null;

        return {
          ...member,
          filter,
          filterCount: getFilterCount(filter),
          hasActiveTaskFilter,
          visibleFilterFields: memberFilterFields[member.id] ?? [],
          memberStatusOptions,
          scopedTasks,
          stats,
        };
      })
      .filter((member): member is NonNullable<typeof member> => Boolean(member));
  }, [memberFilterFields, memberFilters, memberQuery, orderedMembers]);

  const updateMemberFilter = (memberId: string, patch: Partial<MemberTaskFilterState>) => {
    setMemberFilters((previous) => {
      const current = previous[memberId] ?? DEFAULT_MEMBER_FILTER;
      return {
        ...previous,
        [memberId]: {
          ...current,
          ...patch,
        },
      };
    });
  };

  const clearMemberFilter = (memberId: string) => {
    setMemberFilters((previous) => {
      if (!previous[memberId]) return previous;
      const next = { ...previous };
      delete next[memberId];
      return next;
    });
  };

  const setMemberFilterField = (memberId: string, field: MemberFilterFieldKey, enabled: boolean) => {
    setMemberFilterFields((previous) => {
      const current = previous[memberId] ?? [];
      const nextFields = enabled ? [...new Set([...current, field])] : current.filter((item) => item !== field);
      const next = { ...previous };
      if (nextFields.length === 0) {
        delete next[memberId];
      } else {
        next[memberId] = nextFields;
      }
      return next;
    });

    if (!enabled) {
      if (field === 'status') {
        updateMemberFilter(memberId, { statusId: 'all' });
      }
      if (field === 'priority') {
        updateMemberFilter(memberId, { priority: 'all' });
      }
      if (field === 'dueDate') {
        updateMemberFilter(memberId, { dueDateRange: undefined });
      }
    }
  };

  const clearMemberFilterSelection = (memberId: string) => {
    setMemberFilterFields((previous) => {
      if (!previous[memberId]) return previous;
      const next = { ...previous };
      delete next[memberId];
      return next;
    });
    clearMemberFilter(memberId);
  };

  const toggleExpanded = (memberId: string) => {
    setExpandedMemberIds((previous) =>
      previous.includes(memberId)
        ? previous.filter((value) => value !== memberId)
        : [...previous, memberId],
    );
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Card>
        <CardHeader className="space-y-4">
          <div>
          <CardTitle>{t('title')}</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {t('description')}
            </p>
          </div>

          <div className="relative max-w-sm">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              value={memberQuery}
              onChange={(event) => setMemberQuery(event.target.value)}
              placeholder={t('searchPlaceholder')}
              className="pl-9"
            />
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[360px]">{t('headers.member')}</TableHead>
                <TableHead>{t('headers.role')}</TableHead>
                <TableHead className="text-right">{t('headers.assigned')}</TableHead>
                <TableHead className="text-right">{t('headers.done')}</TableHead>
                <TableHead className="text-right">{t('headers.open')}</TableHead>
                <TableHead className="min-w-[220px]">{t('headers.completion')}</TableHead>
                <TableHead className="text-right">{t('headers.onTime')}</TableHead>
                <TableHead className="text-right">{t('headers.score')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                    {t('empty')}
                  </TableCell>
                </TableRow>
              )}

              {displayedMembers.map((member) => {
                const isExpanded = expandedMemberIds.includes(member.id);
                const memberDisplayName = resolveMemberDisplayName(member);
                const showMemberEmail = shouldShowMemberEmail(member, memberDisplayName);
                const selectedFilterKeys = member.visibleFilterFields;
                const selectedFilterSet = new Set(selectedFilterKeys);
                const filteredFieldOptions = memberFilterFieldOptions.filter((option) =>
                  option.label.toLowerCase().includes(filterFieldQuery.trim().toLowerCase()),
                );
                const { stats } = member;

                return (
                  <Fragment key={member.id}>
                    <TableRow>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="mt-1 h-8 w-8"
                            onClick={() => toggleExpanded(member.id)}
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>

	                          <Avatar className="h-10 w-10">
                            {member.avatar ? <AvatarImage src={member.avatar} alt={memberDisplayName} /> : null}
	                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(memberDisplayName)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1 space-y-1.5">
                            <p className="truncate font-medium">{memberDisplayName}</p>
                            {showMemberEmail && (
                              <p className="text-muted-foreground truncate text-xs">{member.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {member.roles && member.roles.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {member.roles.map((roleName) => (
                              <Badge key={`${member.id}-${roleName}`} variant="outline">
                                {roleName}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">{t('noRole')}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">{stats.tasksTotal}</TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">{stats.tasksCompleted}</TableCell>
                      <TableCell className="text-primary text-right font-medium">{stats.tasksInProgress}</TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {t('completionSummary', { rate: stats.completionRate })}
                            </span>
                            <span className="font-medium">{stats.tasksCompleted}/{stats.tasksTotal}</span>
                          </div>
                          <Progress value={stats.completionRate} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{stats.onTimeRate}%</TableCell>
                      <TableCell className="text-right font-semibold">{stats.progressScore}</TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow className="bg-muted/25 hover:bg-muted/25">
                        <TableCell colSpan={8} className="p-0">
                          <div className="space-y-4 px-6 py-5">
                            <div className="flex flex-wrap items-center gap-2">
                              {selectedFilterSet.has('status') && (
                                <div className="bg-background flex h-8 items-center gap-1 rounded-md border px-2 text-xs">
                                  <span className="font-medium">
                                    {t('filterFields.status')}
                                    {member.filter.statusId !== 'all'
                                      ? `: ${
                                          member.memberStatusOptions.find((status) => status.value === member.filter.statusId)
                                            ?.label ?? t('custom')
                                        }`
                                      : ''}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="h-5 w-5"
                                    onClick={() => setMemberFilterField(member.id, 'status', false)}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}

                              {selectedFilterSet.has('priority') && (
                                <div className="bg-background flex h-8 items-center gap-1 rounded-md border px-2 text-xs">
                                  <span className="font-medium">
                                    {t('filterFields.priority')}
                                    {member.filter.priority !== 'all'
                                      ? `: ${
                                          priorityOptions.find((priority) => priority.value === member.filter.priority)?.label ??
                                          t('custom')
                                        }`
                                      : ''}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="h-5 w-5"
                                    onClick={() => setMemberFilterField(member.id, 'priority', false)}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}

                              {selectedFilterSet.has('dueDate') && (
                                <div className="bg-background flex h-8 items-center gap-1 rounded-md border px-2 text-xs">
                                  <span className="font-medium">{formatRangeLabel(member.filter.dueDateRange, t)}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="h-5 w-5"
                                    onClick={() => setMemberFilterField(member.id, 'dueDate', false)}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}

                              <Popover
                                open={openFilterMemberId === member.id}
                                onOpenChange={(open) => {
                                  setOpenFilterMemberId(open ? member.id : null);
                                  if (!open) setFilterFieldQuery('');
                                }}
                              >
                                <PopoverTrigger asChild>
                                  <Button type="button" variant="outline" size="sm" className="h-8 gap-2">
                                    <Filter className="h-3.5 w-3.5" />
                                    {t('filter.button')}
                                    {member.filterCount > 0 && (
                                      <Badge variant="secondary" className="h-5 min-w-5 px-1 text-[10px]">
                                        {member.filterCount}
                                      </Badge>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-[320px] p-0">
                                  <div className="border-b p-3">
                                    <div className="relative">
                                      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                      <Input
                                        value={filterFieldQuery}
                                        onChange={(event) => setFilterFieldQuery(event.target.value)}
                                        placeholder={t('filter.searchMore')}
                                        className="h-9 pl-9"
                                      />
                                    </div>
                                  </div>
                                  <div className="max-h-52 space-y-1 overflow-y-auto px-2 py-2">
                                    {filteredFieldOptions.map((option) => {
                                      const isChecked = selectedFilterSet.has(option.key);
                                      return (
                                        <button
                                          key={option.key}
                                          type="button"
                                          className={cn(
                                            'hover:bg-muted flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors',
                                            isChecked && 'bg-muted/70',
                                          )}
                                          onClick={() => setMemberFilterField(member.id, option.key, !isChecked)}
                                        >
                                          <Checkbox checked={isChecked} />
                                          <span>{option.label}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div className="flex items-center justify-between border-t px-3 py-2 text-sm">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2"
                                      onClick={() => clearMemberFilterSelection(member.id)}
                                    >
                                      {t('filter.clearSelection')}
                                    </Button>
                                    <span className="text-muted-foreground">
                                      {selectedFilterKeys.length} of {memberFilterFieldOptions.length}
                                    </span>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>

                            {selectedFilterSet.size > 0 && (
                              <div className="flex flex-wrap items-center gap-2">
                                {selectedFilterSet.has('status') && (
                                  <Select
                                    value={member.filter.statusId}
                                    onValueChange={(value) => updateMemberFilter(member.id, { statusId: value })}
                                  >
                                    <SelectTrigger className="h-8 w-[170px] bg-background">
                                      <SelectValue placeholder={t('filter.allStatuses')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">{t('filter.allStatuses')}</SelectItem>
                                      {member.memberStatusOptions.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                          {status.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}

                                {selectedFilterSet.has('priority') && (
                                  <Select
                                    value={member.filter.priority}
                                    onValueChange={(value) =>
                                      updateMemberFilter(member.id, {
                                        priority: value as MemberTaskFilterState['priority'],
                                      })
                                    }
                                  >
                                    <SelectTrigger className="h-8 w-[170px] bg-background">
                                      <SelectValue placeholder="All priorities" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {priorityOptions.map((priority) => (
                                        <SelectItem key={priority.value} value={priority.value}>
                                          {priority.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}

                                {selectedFilterSet.has('dueDate') && (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 min-w-[210px] justify-between bg-background px-3"
                                      >
                                        <span className="truncate">{formatRangeLabel(member.filter.dueDateRange, t)}</span>
                                        <CalendarDays className="text-muted-foreground h-4 w-4" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-auto p-0">
                                      <Calendar
                                        mode="range"
                                        selected={member.filter.dueDateRange}
                                        onSelect={(range) => updateMemberFilter(member.id, { dueDateRange: range })}
                                        numberOfMonths={1}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
                            )}

                            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                              <div className="space-y-4">
                                <div className="grid gap-3 sm:grid-cols-3">
                                  <StatTile icon={Target} label={t('headers.assigned')} value={stats.tasksTotal} />
                                  <StatTile
                                    icon={Timer}
                                    label={t('stats.dueSoon')}
                                    value={stats.dueSoonTasks}
                                    valueClassName="text-amber-500"
                                  />
                                  <StatTile
                                    icon={TriangleAlert}
                                    label={t('stats.overdue')}
                                    value={stats.overdueOpenTasks}
                                    valueClassName="text-rose-500"
                                  />
                                </div>

                                <div className="rounded-lg border p-4">
                                  <TaskDistributionBar
                                    tasksCompleted={stats.tasksCompleted}
                                    overdueOpenTasks={stats.overdueOpenTasks}
                                    dueSoonTasks={stats.dueSoonTasks}
                                    tasksInProgress={stats.tasksInProgress}
                                    labels={{
                                      title: t('stats.taskDistribution'),
                                      done: t('stats.segments.done'),
                                      onTrack: t('stats.segments.onTrack'),
                                      dueSoon: t('stats.segments.dueSoon'),
                                      overdue: t('stats.segments.overdue'),
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="rounded-lg border p-4">
                                  <div className="mb-4 flex items-center justify-between">
                                    <p className="font-medium">{t('stats.performance')}</p>
                                    <Badge variant="secondary" className="font-semibold">
                                      {t('stats.score', { score: stats.progressScore })}
                                    </Badge>
                                  </div>
                                  <div className="space-y-4">
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">{t('stats.completionRate')}</span>
                                        <span className="font-semibold">{stats.completionRate}%</span>
                                      </div>
                                      <Progress value={stats.completionRate} className="h-2" />
                                    </div>
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">{t('stats.onTimeRate')}</span>
                                        <span className="font-semibold">{stats.onTimeRate}%</span>
                                      </div>
                                      <Progress value={stats.onTimeRate} className="h-2" />
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex items-center gap-3 rounded-lg border p-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
                                        {t('stats.doneOnTime')}
                                      </p>
                                      <p className="text-lg font-semibold leading-tight text-emerald-600">
                                        {stats.doneOnTimeTasks}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 rounded-lg border p-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-500/10">
                                      <Clock className="h-4 w-4 text-amber-500" />
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
                                        {t('stats.doneLate')}
                                      </p>
                                      <p className="text-lg font-semibold leading-tight text-amber-600">
                                        {stats.doneLateTasks}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
