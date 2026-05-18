'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  KpiAchievement,
  KpiAchievementAdjustment,
  ProjectMemberKpiTargetSummary,
} from '../../types/kpi.types';

function formatNumber(value: number, suffix = '') {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`;
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function isValidNumber(value?: number | null): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

type AchievementMetricKind = 'percent' | 'hours' | 'count';

interface AchievementRow {
  label: string;
  achievementValue?: number;
  actualValue?: number;
  targetValue?: number;
  kind: AchievementMetricKind;
  targetConfigured: boolean;
}

interface AchievementLabels {
  score: string;
  pointCompletion: string;
  onTime: string;
  otHours: string;
  completedTasks: string;
  maxOverdue: string;
  overdueRule: string;
}

function formatMetricValue(value: number, kind: AchievementMetricKind) {
  if (kind === 'hours') return formatNumber(value, 'h');
  if (kind === 'count') return formatNumber(value);
  return formatPercent(value);
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, value));
}

function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildAchievementRows({
  achievement,
  achievementRate,
  actualScore,
  actualPointCompletionRate,
  actualOnTimeRate,
  actualOtHours,
  actualCompletedTasks,
  actualOverdueTasks,
  target,
}: ProjectKpiTargetAchievementCardProps, labels: AchievementLabels) {
  const hasMaxOverdueTarget = isValidNumber(target?.maxOverdueTasks);
  const hasZeroOverdueRule = target?.requireZeroOverdue === true;
  const overdueTarget = hasMaxOverdueTarget
    ? target?.maxOverdueTasks
    : hasZeroOverdueRule
      ? 0
      : undefined;
  const rows: AchievementRow[] = [
    {
      label: labels.score,
      achievementValue: achievement?.score ?? achievementRate,
      actualValue: actualScore,
      targetValue: target?.targetScore,
      kind: 'percent',
      targetConfigured: isValidNumber(target?.targetScore),
    },
    {
      label: labels.pointCompletion,
      achievementValue: achievement?.pointCompletionRate,
      actualValue: actualPointCompletionRate,
      targetValue: target?.targetPointCompletionRate,
      kind: 'percent',
      targetConfigured: isValidNumber(target?.targetPointCompletionRate),
    },
    {
      label: labels.onTime,
      achievementValue: achievement?.onTimeRate,
      actualValue: actualOnTimeRate,
      targetValue: target?.targetOnTimeRate,
      kind: 'percent',
      targetConfigured: isValidNumber(target?.targetOnTimeRate),
    },
    {
      label: labels.otHours,
      achievementValue: achievement?.otHours,
      actualValue: actualOtHours,
      targetValue: target?.targetOtHours,
      kind: 'hours',
      targetConfigured: isValidNumber(target?.targetOtHours),
    },
    {
      label: labels.completedTasks,
      achievementValue: achievement?.completedTasks,
      actualValue: actualCompletedTasks,
      targetValue: target?.targetCompletedTasks,
      kind: 'count',
      targetConfigured: isValidNumber(target?.targetCompletedTasks),
    },
    {
      label: hasMaxOverdueTarget ? labels.maxOverdue : labels.overdueRule,
      achievementValue: achievement?.overdueTasks,
      actualValue: actualOverdueTasks,
      targetValue: overdueTarget,
      kind: 'count',
      targetConfigured: hasMaxOverdueTarget || hasZeroOverdueRule,
    },
  ];

  return rows.filter((item) => item.targetConfigured);
}

function resolveOverallAchievement(rows: AchievementRow[], achievementRate?: number) {
  if (isValidNumber(achievementRate)) return Math.max(0, achievementRate);
  return average(
    rows
      .map((item) => item.achievementValue)
      .filter(isValidNumber)
      .map((value) => Math.max(0, value)),
  );
}

function resolveKpiStatus(
  overallAchievement: number | null,
  t: (key: string, values?: Record<string, string>) => string,
) {
  if (overallAchievement === null) {
    return {
      label: t('noTargetData'),
      description: t('noTargetDataDescription'),
      tone: 'border-border bg-muted/20',
      valueClassName: 'text-muted-foreground',
      icon: AlertCircle,
    };
  }

  if (overallAchievement >= 100) {
    const overBy = overallAchievement - 100;
    return {
      label: overBy > 0 ? t('exceeded') : t('achieved'),
      description:
        overBy > 0
          ? t('exceededDescription', { value: formatPercent(overBy) })
          : t('achievedDescription'),
      tone: 'border-border bg-muted/20',
      valueClassName: 'text-primary',
      icon: overBy > 0 ? TrendingUp : CheckCircle2,
    };
  }

  return {
    label: t('notMet'),
    description: t('notMetDescription', { value: formatPercent(100 - overallAchievement) }),
    tone: 'border-border bg-muted/20',
    valueClassName: 'text-primary',
    icon: AlertCircle,
  };
}

interface ProjectKpiTargetAchievementCardProps {
  achievement?: KpiAchievement;
  achievementAdjustment?: KpiAchievementAdjustment;
  achievementRate?: number;
  actualScore: number;
  actualPointCompletionRate: number;
  actualOnTimeRate: number;
  actualOtHours: number;
  actualCompletedTasks: number;
  actualOverdueTasks: number;
  target?: ProjectMemberKpiTargetSummary;
}

export function ProjectKpiTargetAchievementCard(
  props: ProjectKpiTargetAchievementCardProps,
) {
  const t = useTranslations('project.kpiWorkspace.targetAchievement');
  const commonT = useTranslations('project.kpiWorkspace.common');
  const achievementRows = buildAchievementRows(props, {
    score: t('labels.score'),
    pointCompletion: t('labels.pointCompletion'),
    onTime: t('labels.onTime'),
    otHours: t('labels.otHours'),
    completedTasks: t('labels.completedTasks'),
    maxOverdue: t('labels.maxOverdue'),
    overdueRule: t('labels.overdueRule'),
  });
  const overallAchievement = resolveOverallAchievement(
    achievementRows,
    props.achievementRate,
  );
  const status = resolveKpiStatus(overallAchievement, t);
  const StatusIcon = status.icon;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {achievementRows.length > 0 ? (
          <>
            <div className={`rounded-md border px-3 py-3 ${status.tone}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="bg-background/70 text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md border">
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{status.label}</p>
                    <p className="mt-1 text-xs opacity-80">{status.description}</p>
                  </div>
                </div>
                <div
                  className={`shrink-0 text-right text-xl font-semibold ${status.valueClassName}`}
                >
                  {overallAchievement !== null ? formatPercent(overallAchievement) : '-'}
                </div>
              </div>
              <div className="bg-muted mt-4 h-2 rounded-full">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{
                    width: `${
                      overallAchievement !== null ? clampProgress(overallAchievement) : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {achievementRows.map((item) => (
                <div key={item.label} className="rounded-md border px-3 py-2">
                  <p className="text-muted-foreground text-xs">{item.label}</p>
                  <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-[11px] leading-none">
                        {commonT('actual')}
                      </p>
                      <p className="mt-1 truncate text-lg font-semibold">
                        {isValidNumber(item.actualValue)
                          ? formatMetricValue(item.actualValue, item.kind)
                          : '-'}
                      </p>
                    </div>
                    <span className="text-muted-foreground pb-0.5 text-lg font-medium">
                      /
                    </span>
                    <div className="min-w-0 text-right">
                      <p className="text-muted-foreground text-[11px] leading-none">
                        {commonT('target')}
                      </p>
                      <p className="mt-1 truncate text-lg font-semibold">
                        {isValidNumber(item.targetValue)
                          ? formatMetricValue(item.targetValue, item.kind)
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">{t('noAchievementData')}</p>
        )}
      </CardContent>
    </Card>
  );
}
