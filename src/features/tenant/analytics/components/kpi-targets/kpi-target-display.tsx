'use client';

import { format, parseISO } from 'date-fns';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  KpiAchievement,
  KpiAchievementAdjustment,
  KpiTargetResponse,
  KpiTargetResolvedFromResponse,
  ProjectMemberKpiTargetSummary,
} from '../../types/kpi.types';

type Translator = (key: string, values?: Record<string, string | number>) => string;

export function getScopeLabel(scopeType: KpiTargetResponse['scopeType'], t: Translator) {
  return t(`scope.${scopeType}`);
}

export function getPeriodLabel(period: KpiTargetResponse['period'], t: Translator) {
  return t(`periodLabel.${period}`);
}

export function getStatusLabel(status: KpiTargetResponse['status'], t: Translator) {
  return t(`targetStatus.${status}`);
}

export function formatDate(value?: string | null) {
  if (!value) return '-';
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return format(parsed, 'dd/MM/yyyy');
}

export function formatNumber(value?: number | null, suffix = '') {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`;
}

export function formatPercent(value?: number | null) {
  return formatNumber(value, '%');
}

export function StatusBadge({ status }: { status: KpiTargetResponse['status'] }) {
  const t = useTranslations('analytics');

  return (
    <Badge
      className={cn(
        status === 'ACTIVE' && 'bg-emerald-500 text-white',
        status === 'DRAFT' && 'bg-slate-500 text-white',
        status === 'ARCHIVED' && 'bg-zinc-700 text-white',
      )}
    >
      {getStatusLabel(status, t)}
    </Badge>
  );
}

export function ScopeBadge({ scopeType }: { scopeType: KpiTargetResponse['scopeType'] }) {
  const t = useTranslations('analytics');

  return <Badge variant="outline">{getScopeLabel(scopeType, t)}</Badge>;
}

export function ResolvedFromBadge({
  resolvedFrom,
  fallbackScope,
}: {
  resolvedFrom?: KpiTargetResolvedFromResponse;
  fallbackScope?: KpiTargetResponse['scopeType'];
}) {
  const t = useTranslations('analytics');
  const scope = resolvedFrom?.scopeType ?? fallbackScope;
  if (!scope) return null;

  const label =
    scope === 'USER'
      ? resolvedFrom?.projectId
        ? t('resolvedFrom.projectUserOverride')
        : t('resolvedFrom.orgUserOverride')
      : scope === 'PROJECT_ROLE'
        ? t('resolvedFrom.projectRoleDefault')
        : t('resolvedFrom.orgRoleDefault');

  return <Badge variant="secondary">{label}</Badge>;
}

export function TargetMetricsSummary({
  target,
  className,
}: {
  target: KpiTargetResponse | ProjectMemberKpiTargetSummary;
  className?: string;
}) {
  const t = useTranslations('analytics');
  const rows = [
    { label: t('achievement.score'), value: formatPercent(target.targetScore) },
    { label: t('achievement.pointCompletion'), value: formatPercent(target.targetPointCompletionRate) },
    { label: t('achievement.onTime'), value: formatPercent(target.targetOnTimeRate) },
    { label: t('achievement.otHours'), value: formatNumber(target.targetOtHours, 'h') },
    { label: t('achievement.completedTasks'), value: formatNumber(target.targetCompletedTasks) },
    { label: t('achievement.maxOverdue'), value: formatNumber(target.maxOverdueTasks) },
  ].filter((item) => item.value !== '-');

  if (target.requireZeroOverdue) {
    rows.push({ label: t('achievement.overdue'), value: t('achievement.requireZero') });
  }

  if (rows.length === 0) {
    return <span className="text-muted-foreground text-sm">{t('common.noMetrics')}</span>;
  }

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {rows.map((row) => (
        <Badge key={row.label} variant="outline" className="font-normal">
          {row.label}: {row.value}
        </Badge>
      ))}
    </div>
  );
}

export function AchievementMetricsSummary({
  achievement,
  achievementAdjustment,
  achievementRate,
}: {
  achievement?: KpiAchievement;
  achievementAdjustment?: KpiAchievementAdjustment;
  achievementRate?: number;
}) {
  const t = useTranslations('analytics');
  const score = achievement?.score ?? achievementRate;
  const rows = [
    { label: t('achievement.score'), value: formatPercent(score) },
    { label: t('achievement.pointCompletion'), value: formatPercent(achievement?.pointCompletionRate) },
    { label: t('achievement.onTime'), value: formatPercent(achievement?.onTimeRate) },
    { label: t('achievement.otHours'), value: formatPercent(achievement?.otHours) },
    { label: t('achievement.completedTasks'), value: formatPercent(achievement?.completedTasks) },
    { label: t('achievement.overdue'), value: formatPercent(achievement?.overdueTasks) },
  ].filter((item) => item.value !== '-');

  if (rows.length === 0) {
    return <span className="text-muted-foreground text-sm">{t('achievement.noAchievementYet')}</span>;
  }

  const completedTasksFactor =
    achievementAdjustment?.adjustedByCompletedTasksTarget &&
    typeof achievementAdjustment.completedTasksFactor === 'number'
      ? Math.max(0, achievementAdjustment.completedTasksFactor * 100)
      : null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {rows.map((row) => (
        <Badge key={row.label} variant="secondary" className="font-normal">
          {row.label}: {row.value}
        </Badge>
      ))}
    </div>
  );
}
