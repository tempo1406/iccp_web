'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import type { ApexOptions } from 'apexcharts';
import { useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  ArrowUpRight,
  BellDot,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FolderKanban,
  Gauge,
  LoaderCircle,
  MessageSquareText,
  Target,
  Ticket,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { ROUTES } from '@/common/constant/routes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDashboardOverview } from '../query/use-dashboard';
import type {
  TenantDashboardMemberRange,
  TenantDashboardOverviewQuery,
  TenantDashboardPriorityAction,
  TenantDashboardProjectFocusItem,
  TenantDashboardProjectStatus,
  TenantDashboardQuickLink,
  TenantDashboardResponse,
  TenantDashboardTaskFocusItem,
  TenantDashboardTicketFocusItem,
} from '../types/dashboard.types';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

type DashboardTranslator = ReturnType<typeof useTranslations>;

const CHART_COLORS = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

function resolveTenantParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function buildTenantHref(tenant: string, href: string): string {
  if (!href) return ROUTES.tenant.dashboard(tenant);
  if (href.startsWith('/tenant/')) return href;
  if (href.startsWith('/')) return `${ROUTES.tenant.root(tenant)}${href}`;
  return `${ROUTES.tenant.root(tenant)}/${href}`;
}

function toIntlLocale(locale: string): string {
  return locale === 'vi' ? 'vi-VN' : 'en-US';
}

function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(toIntlLocale(locale)).format(value);
}

function formatPercent(value: number, locale: string): string {
  return `${new Intl.NumberFormat(toIntlLocale(locale), {
    maximumFractionDigits: 0,
  }).format(value)}%`;
}

function formatCurrencyFull(value: number, currency: 'USD' | 'VND', locale: string): string {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'VND' ? 0 : 2,
  }).format(value);
}

function translateOr(t: DashboardTranslator, key: string, fallback: string): string {
  return t.has(key) ? t(key) : fallback;
}

function getCurrentQuarterSelection() {
  const now = new Date();
  return {
    quarter: Math.floor(now.getMonth() / 3) + 1,
    year: now.getFullYear(),
  };
}

function getQuarterLabel(t: DashboardTranslator, quarter: number, year: number): string {
  return t('labels.currentQuarter', { quarter, year });
}

function getMemberRangeLabel(t: DashboardTranslator, range: TenantDashboardMemberRange): string {
  switch (range) {
    case 'today':
      return t('labels.today');
    case 'last_month':
      return t('labels.lastMonth');
    default:
      return t('labels.lastWeek');
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function ratioPercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return clamp(Math.round((part / total) * 100), 0, 100);
}

function getProjectStatusClassName(status: TenantDashboardProjectStatus): string {
  switch (status) {
    case 'active':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20';
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20';
    case 'on_hold':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20';
    case 'cancelled':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
}

function getPriorityToneClass(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'critical':
      return 'text-rose-600 dark:text-rose-300';
    case 'high':
      return 'text-amber-600 dark:text-amber-300';
    case 'medium':
      return 'text-blue-600 dark:text-blue-300';
    default:
      return 'text-slate-600 dark:text-slate-300';
  }
}

function buildChartThemeOptions(locale: string): ApexOptions {
  return {
    chart: {
      background: 'transparent',
      toolbar: { show: false },
      zoom: { enabled: false },
      foreColor: '#64748b',
    },
    dataLabels: { enabled: false },
    stroke: {
      width: 0,
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '12px',
      labels: {
        colors: ['#475569'],
      },
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (value) => formatNumber(Number(value ?? 0), locale),
      },
    },
  };
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
      {message}
    </div>
  );
}

function Surface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950',
        className,
      )}
    >
      {children}
    </section>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        ) : null}
      </div>
      {action ? <div className="w-full md:w-auto md:shrink-0">{action}</div> : null}
    </div>
  );
}

function KpiCard({
  label,
  value,
  helper,
  icon: Icon,
  progress,
  accentClassName,
  trackClassName,
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  progress: number;
  accentClassName: string;
  trackClassName: string;
}) {
  return (
    <Surface className="p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{value}</h3>
        </div>
        <div className={cn('rounded-lg p-2', trackClassName)}>
          <Icon className={cn('h-5 w-5', accentClassName)} />
        </div>
      </div>

      <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
        <div className={cn('h-full rounded-full', accentClassName.replace('text-', 'bg-'))} style={{ width: `${progress}%` }} />
      </div>

      <p className={cn('text-xs font-medium', accentClassName)}>{helper}</p>
    </Surface>
  );
}

function TimelineRow({
  href,
  label,
  meta,
  dotClassName,
}: {
  href: string;
  label: string;
  meta: string;
  dotClassName: string;
}) {
  return (
    <Link href={href} className="group flex items-start gap-3">
      <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-white bg-slate-100 dark:border-slate-950 dark:bg-slate-900">
        <div className={cn('h-1.5 w-1.5 rounded-full', dotClassName)} />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-300">
          {label}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{meta}</p>
      </div>
    </Link>
  );
}

function StatusPill({
  tone,
  children,
}: {
  tone: 'emerald' | 'amber' | 'blue';
  children: ReactNode;
}) {
  const toneClassName =
    tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'
        : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold',
        toneClassName,
      )}
    >
      {children}
    </span>
  );
}

function QuarterFilter({
  quarter,
  year,
  onQuarterChange,
  onYearChange,
  t,
}: {
  quarter: number;
  year: number;
  onQuarterChange: (quarter: number) => void;
  onYearChange: (delta: number) => void;
  t: DashboardTranslator;
}) {
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-slate-50/90 p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 md:w-auto">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label={t('labels.previousYear')}
          onClick={() => onYearChange(-1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-950 dark:hover:text-slate-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="min-w-[88px] text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
          {year}
        </div>
        <button
          type="button"
          aria-label={t('labels.nextYear')}
          onClick={() => onYearChange(1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-950 dark:hover:text-slate-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-1 grid grid-cols-4 gap-1">
        {[1, 2, 3, 4].map((item) => {
          const active = item === quarter;

          return (
            <button
              key={item}
              type="button"
              aria-pressed={active}
              onClick={() => onQuarterChange(item)}
              className={cn(
                'inline-flex min-w-[56px] items-center justify-center rounded-lg px-2 py-2 text-sm font-medium transition-all',
                active
                  ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-200 dark:bg-slate-950 dark:text-indigo-300 dark:ring-indigo-500/30'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-950 dark:hover:text-slate-100',
              )}
            >
              {`Q${item}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MemberRangeFilter({
  value,
  onChange,
  t,
}: {
  value: TenantDashboardMemberRange;
  onChange: (value: TenantDashboardMemberRange) => void;
  t: DashboardTranslator;
}) {
  const options: TenantDashboardMemberRange[] = ['today', 'last_week', 'last_month'];

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-slate-50/90 p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 md:w-auto">
      <div className="grid grid-cols-3 gap-1">
        {options.map((option) => {
          const active = option === value;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option)}
              className={cn(
                'inline-flex min-w-[88px] items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-all',
                active
                  ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-200 dark:bg-slate-950 dark:text-indigo-300 dark:ring-indigo-500/30'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-950 dark:hover:text-slate-100',
              )}
            >
              {getMemberRangeLabel(t, option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getPriorityActionLabel(code: string, t: DashboardTranslator): string {
  switch (code) {
    case 'pendingTickets':
    case 'processingDocuments':
    case 'failedDocuments':
    case 'invitationNeedsAttention':
    case 'overdueTasks':
    case 'dueSoonTasks':
    case 'changesRequestedTickets':
    case 'pendingSubmissionTickets':
      return t(`priorityActions.${code}`);
    default:
      return code;
  }
}

function getPriorityActionToneClass(tone: TenantDashboardPriorityAction['tone']): string {
  switch (tone) {
    case 'danger':
      return 'bg-rose-500';
    case 'warning':
      return 'bg-amber-500';
    case 'success':
      return 'bg-emerald-500';
    case 'primary':
      return 'bg-indigo-500';
    default:
      return 'bg-slate-400';
  }
}

function getQuickLinkLabel(key: string, t: DashboardTranslator): string {
  switch (key) {
    case 'organizationManagement':
    case 'analytics':
    case 'ticketCenter':
    case 'documents':
    case 'projects':
    case 'teamChat':
    case 'myKpi':
      return t(`quickLinks.${key}`);
    default:
      return key;
  }
}

function getQuickLinkHref(tenant: string, link: TenantDashboardQuickLink): string {
  return buildTenantHref(tenant, link.href);
}

function getKpiCards(
  dashboard: TenantDashboardResponse,
  locale: string,
  t: DashboardTranslator,
): Array<{
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  progress: number;
  accentClassName: string;
  trackClassName: string;
}> {
  if (dashboard.viewer.roleVariant === 'org_admin') {
    const admin = dashboard.adminOverview;
    const totalMembers = admin?.orgKpi?.totalMembers ?? 0;
    const activeMembers = admin?.orgKpi?.activeMembers ?? 0;
    const totalProjects = admin?.projects?.total ?? 0;
    const activeProjects = admin?.projects?.active ?? 0;
    const pendingApprovals = admin?.approvals?.pendingTickets ?? 0;
    const queueTotal =
      (admin?.approvals?.pendingTickets ?? 0) +
      (admin?.approvals?.processingDocuments ?? 0) +
      (admin?.approvals?.failedDocuments ?? 0);
    const totalOtHours = admin?.orgKpi?.totalOtHours ?? 0;
    const acceptanceRate = admin?.invitations?.acceptanceRate ?? 0;

    return [
      {
        label: t('summary.activeMembers'),
        value: formatNumber(activeMembers, locale),
        helper: t('detail.totalMembers', { value: formatNumber(totalMembers, locale) }),
        icon: Users,
        progress: ratioPercent(activeMembers, totalMembers),
        accentClassName: 'text-indigo-600 dark:text-indigo-300',
        trackClassName: 'bg-indigo-50 dark:bg-indigo-500/10',
      },
      {
        label: t('summary.activeProjects'),
        value: formatNumber(activeProjects, locale),
        helper: t('detail.completionRate', {
          value: formatPercent(admin?.orgKpi?.completionRate ?? 0, locale),
        }),
        icon: FolderKanban,
        progress: ratioPercent(activeProjects, totalProjects),
        accentClassName: 'text-blue-600 dark:text-blue-300',
        trackClassName: 'bg-blue-50 dark:bg-blue-500/10',
      },
      {
        label: t('summary.pendingApprovals'),
        value: formatNumber(pendingApprovals, locale),
        helper: t('detail.processingDocuments', {
          value: formatNumber(admin?.approvals?.processingDocuments ?? 0, locale),
        }),
        icon: Ticket,
        progress: ratioPercent(pendingApprovals, Math.max(queueTotal, pendingApprovals, 1)),
        accentClassName: 'text-amber-600 dark:text-amber-300',
        trackClassName: 'bg-amber-50 dark:bg-amber-500/10',
      },
      {
        label: t('snapshot.totalOtHours'),
        value: formatNumber(totalOtHours, locale),
        helper: `${t('snapshot.acceptanceRate')} • ${formatPercent(acceptanceRate, locale)}`,
        icon: Clock3,
        progress: clamp(Math.round(acceptanceRate), 0, 100),
        accentClassName: 'text-emerald-600 dark:text-emerald-300',
        trackClassName: 'bg-emerald-50 dark:bg-emerald-500/10',
      },
    ];
  }

  const member = dashboard.memberOverview;
  const assignedTasks = member?.assignedWork.assignedTasks ?? 0;
  const activeProjects = member?.projects.active ?? 0;
  const totalProjects = member?.projects.total ?? 0;
  const myOpen = member?.tickets.myOpen ?? 0;
  const ticketWork =
    (member?.tickets.myOpen ?? 0) +
    (member?.tickets.pendingApproval ?? 0) +
    (member?.tickets.pendingSubmission ?? 0);
  const activeTargets = member?.myKpi?.activeTargets ?? 0;
  const metricsTracked = member?.myKpi?.metricsTracked ?? 0;

  return [
    {
      label: t('summary.assignedTasks'),
      value: formatNumber(assignedTasks, locale),
      helper: `${formatNumber(member?.assignedWork.overdueTasks ?? 0, locale)} ${t('charts.overdue').toLowerCase()}`,
      icon: Activity,
      progress: clamp(assignedTasks * 10, 0, 100),
      accentClassName: 'text-indigo-600 dark:text-indigo-300',
      trackClassName: 'bg-indigo-50 dark:bg-indigo-500/10',
    },
    {
      label: t('summary.myTickets'),
      value: formatNumber(myOpen, locale),
      helper: t('detail.pendingApproval', {
        value: formatNumber(member?.tickets.pendingApproval ?? 0, locale),
      }),
      icon: Ticket,
      progress: ratioPercent(myOpen, Math.max(ticketWork, myOpen, 1)),
      accentClassName: 'text-blue-600 dark:text-blue-300',
      trackClassName: 'bg-blue-50 dark:bg-blue-500/10',
    },
    {
      label: t('summary.myKpi'),
      value: formatNumber(activeTargets, locale),
      helper: t('detail.metricsTracked', { value: formatNumber(metricsTracked, locale) }),
      icon: Target,
      progress: clamp(metricsTracked * 10, 0, 100),
      accentClassName: 'text-emerald-600 dark:text-emerald-300',
      trackClassName: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: t('summary.activeProjects'),
      value: formatNumber(activeProjects, locale),
      helper: t('detail.completedProjects', {
        value: formatNumber(member?.projects.completed ?? 0, locale),
      }),
      icon: FolderKanban,
      progress: ratioPercent(activeProjects, totalProjects),
      accentClassName: 'text-sky-600 dark:text-sky-300',
      trackClassName: 'bg-sky-50 dark:bg-sky-500/10',
    },
  ];
}

function getOverviewChartPayload(
  dashboard: TenantDashboardResponse,
  locale: string,
  t: DashboardTranslator,
) {
  if (dashboard.viewer.roleVariant === 'org_admin') {
    const admin = dashboard.adminOverview;
    const activeProjects = admin?.projects?.active ?? 0;
    const totalProjects = admin?.projects?.total ?? 0;
    const budgetEstimatedTotal =
      admin?.budgets?.reduce((sum, budget) => sum + budget.estimatedTotal, 0) ?? 0;
    const budgetActualTotal =
      admin?.budgets?.reduce((sum, budget) => sum + budget.actualTotal, 0) ?? 0;

    return {
      title: t('sections.visualOverview'),
      description: t('charts.orgPulseDescription'),
      labels: [
        t('snapshot.completionRate'),
        t('snapshot.failedDocuments'),
        translateOr(t, 'snapshot.budgetUtilization', 'Budget utilization'),
        translateOr(t, 'snapshot.activeProjectRatio', 'Active project ratio'),
      ],
      colors: [CHART_COLORS[0], CHART_COLORS[1], CHART_COLORS[2], CHART_COLORS[3]],
      series: [
        clamp(Math.round(admin?.orgKpi?.completionRate ?? 0), 0, 100),
        clamp((admin?.documents?.failed ?? 0) * 10, 0, 100),
        ratioPercent(budgetActualTotal, budgetEstimatedTotal),
        ratioPercent(activeProjects, totalProjects),
      ],
      detailRows: [
        {
          label: t('snapshot.completionRate'),
          value: formatPercent(admin?.orgKpi?.completionRate ?? 0, locale),
        },
        {
          label: t('snapshot.failedDocuments'),
          value: formatNumber(admin?.documents?.failed ?? 0, locale),
        },
        {
          label: translateOr(t, 'snapshot.budgetUtilization', 'Budget utilization'),
          value:
            budgetEstimatedTotal > 0
              ? formatPercent(ratioPercent(budgetActualTotal, budgetEstimatedTotal), locale)
              : t('labels.notAvailable'),
        },
        {
          label: translateOr(t, 'snapshot.activeProjectRatio', 'Active project ratio'),
          value: `${formatNumber(activeProjects, locale)} / ${formatNumber(totalProjects, locale)}`,
        },
      ],
      budgetRows:
        admin?.budgets?.map((budget) => ({
          currency: budget.currency,
          estimated: formatCurrencyFull(budget.estimatedTotal, budget.currency, locale),
          actual: formatCurrencyFull(budget.actualTotal, budget.currency, locale),
          variance: formatCurrencyFull(Math.abs(budget.variance), budget.currency, locale),
          varianceTone:
            budget.variance > 0
              ? 'text-rose-600 dark:text-rose-300'
              : budget.variance < 0
                ? 'text-emerald-600 dark:text-emerald-300'
                : 'text-slate-600 dark:text-slate-300',
          variancePrefix: budget.variance > 0 ? '+' : budget.variance < 0 ? '-' : '',
        })) ?? [],
    };
  }

  const member = dashboard.memberOverview;
  const assignedTasks = member?.assignedWork.assignedTasks ?? 0;
  const totalProjects = member?.projects.total ?? 0;
  const completedProjects = member?.projects.completed ?? 0;
  const ticketWork =
    (member?.tickets.myOpen ?? 0) +
    (member?.tickets.pendingApproval ?? 0) +
    (member?.tickets.pendingSubmission ?? 0);

  return {
    title: t('sections.visualOverview'),
    description: t('charts.personalWorkloadDescription'),
      labels: [
        t('charts.overdue'),
        t('charts.dueSoon'),
        t('summary.myTickets'),
        t('summary.activeProjects'),
      ],
      colors: [CHART_COLORS[4], CHART_COLORS[3], CHART_COLORS[0], CHART_COLORS[2]],
      series: [
        ratioPercent(member?.assignedWork.overdueTasks ?? 0, assignedTasks),
        ratioPercent(member?.assignedWork.dueSoonTasks ?? 0, assignedTasks),
      ratioPercent(member?.tickets.pendingApproval ?? 0, ticketWork),
      ratioPercent(completedProjects, totalProjects),
    ],
    detailRows: [
      {
        label: t('charts.overdue'),
        value: `${formatNumber(member?.assignedWork.overdueTasks ?? 0, locale)} / ${formatNumber(assignedTasks, locale)}`,
      },
      {
        label: t('charts.dueSoon'),
        value: `${formatNumber(member?.assignedWork.dueSoonTasks ?? 0, locale)} / ${formatNumber(assignedTasks, locale)}`,
      },
      {
        label: translateOr(t, 'snapshot.pendingApproval', 'Pending approval tickets'),
        value: `${formatNumber(member?.tickets.pendingApproval ?? 0, locale)} / ${formatNumber(ticketWork, locale)}`,
      },
      {
        label: translateOr(t, 'snapshot.completedProjects', 'Completed projects'),
        value: `${formatNumber(completedProjects, locale)} / ${formatNumber(totalProjects, locale)}`,
      },
    ],
    budgetRows: [],
  };
}

function getCompositionPayload(dashboard: TenantDashboardResponse, t: DashboardTranslator) {
  if (dashboard.viewer.roleVariant === 'org_admin') {
    const admin = dashboard.adminOverview;

    return {
      title: t('charts.projectPortfolio'),
      description: t('charts.projectPortfolioDescription'),
      labels: [t('projectStatus.active'), t('projectStatus.completed'), t('projectStatus.on_hold')],
      values: [
        admin?.projects?.active ?? 0,
        admin?.projects?.completed ?? 0,
        admin?.projects?.onHold ?? 0,
      ],
      colors: [CHART_COLORS[0], CHART_COLORS[2], CHART_COLORS[3]],
    };
  }

  const member = dashboard.memberOverview;

  return {
    title: t('charts.ticketFlow'),
    description: t('charts.ticketFlowDescription'),
    labels: [
      t('ticketStatus.pending_approval'),
      t('ticketStatus.changes_requested'),
      t('ticketStatus.pending_submission'),
    ],
    values: [
      member?.tickets.pendingApproval ?? 0,
      member?.tickets.changesRequested ?? 0,
      member?.tickets.pendingSubmission ?? 0,
    ],
    colors: [CHART_COLORS[0], CHART_COLORS[3], CHART_COLORS[4]],
  };
}

function getPrimaryActions(dashboard: TenantDashboardResponse): TenantDashboardPriorityAction[] {
  return [...dashboard.lists.priorityActions]
    .filter((item) => item.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 4);
}

function getTableMode(dashboard: TenantDashboardResponse): 'projects' | 'tasks' | 'tickets' {
  if (dashboard.viewer.roleVariant === 'org_admin') return 'projects';
  if (dashboard.lists.taskFocus.length > 0) return 'tasks';
  if (dashboard.lists.ticketFocus.length > 0) return 'tickets';
  return 'projects';
}

function getProjectStatusLabel(status: TenantDashboardProjectStatus, t: DashboardTranslator): string {
  return t(`projectStatus.${status}`);
}

function getTaskDueStateLabel(dueState: TenantDashboardTaskFocusItem['dueState'], t: DashboardTranslator): string {
  return t(`dueState.${dueState}`);
}

function getTicketStatusLabel(status: TenantDashboardTicketFocusItem['status'], t: DashboardTranslator): string {
  return t(`ticketStatus.${status}`);
}

function getTicketTypeLabel(type: TenantDashboardTicketFocusItem['type'], t: DashboardTranslator): string {
  return t(`ticketType.${type}`);
}

function getPriorityLabel(priority: string, t: DashboardTranslator): string {
  const normalized = priority.toLowerCase();
  if (normalized === 'low' || normalized === 'medium' || normalized === 'high' || normalized === 'critical') {
    return t(`priority.${normalized}`);
  }
  return priority;
}

function DashboardHeader({
  dashboard,
  tenant,
  t,
  adminQuarter,
  adminYear,
  memberRange,
}: {
  dashboard: TenantDashboardResponse;
  tenant: string;
  t: DashboardTranslator;
  adminQuarter: number;
  adminYear: number;
  memberRange: TenantDashboardMemberRange;
}) {
  const primaryLink = dashboard.quickLinks[0];
  const periodLabel =
    dashboard.viewer.roleVariant === 'org_admin'
      ? getQuarterLabel(t, adminQuarter, adminYear)
      : getMemberRangeLabel(t, memberRange);

  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {dashboard.viewer.roleVariant === 'org_admin' ? t('titleAdmin') : t('titleMember')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {dashboard.viewer.roleVariant === 'org_admin'
            ? t('subtitleAdmin', { organization: dashboard.hero.organizationName })
            : t('subtitleMember', { organization: dashboard.hero.organizationName })}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone="emerald">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          {t('charts.live')}
        </StatusPill>
        <StatusPill tone="blue">{periodLabel}</StatusPill>
        {primaryLink ? (
          <Link
            href={getQuickLinkHref(tenant, primaryLink)}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            {getQuickLinkLabel(primaryLink.key, t)}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function DashboardOverview({
  dashboard,
  locale,
  tenant,
  t,
  adminQuarter,
  adminYear,
  onAdminQuarterChange,
  onAdminYearChange,
  memberRange,
  onMemberRangeChange,
}: {
  dashboard: TenantDashboardResponse;
  locale: string;
  tenant: string;
  t: DashboardTranslator;
  adminQuarter: number;
  adminYear: number;
  onAdminQuarterChange: (quarter: number) => void;
  onAdminYearChange: (delta: number) => void;
  memberRange: TenantDashboardMemberRange;
  onMemberRangeChange: (value: TenantDashboardMemberRange) => void;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const chartPayload = getOverviewChartPayload(dashboard, locale, t);
  const compositionPayload = getCompositionPayload(dashboard, t);
  const chartOptions: ApexOptions = {
    ...buildChartThemeOptions(locale),
    chart: {
      ...buildChartThemeOptions(locale).chart,
      type: 'line',
      height: 360,
      foreColor: isDark ? '#94a3b8' : '#64748b',
    },
    colors: [CHART_COLORS[0]],
    legend: {
      show: false,
    },
    stroke: {
      curve: 'smooth',
      width: 4,
    },
    grid: {
      borderColor: isDark ? 'rgba(148,163,184,0.22)' : '#e2e8f0',
      strokeDashArray: 4,
    },
    markers: {
      size: 6,
      strokeWidth: 0,
      discrete: chartPayload.labels.map((_, index) => ({
        seriesIndex: 0,
        dataPointIndex: index,
        fillColor: chartPayload.colors[index],
        strokeColor: chartPayload.colors[index],
        size: 7,
      })),
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.24,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      categories: chartPayload.labels,
      labels: {
        style: {
          colors: Array(chartPayload.labels.length).fill(isDark ? '#cbd5e1' : '#64748b'),
          fontSize: '12px',
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 4,
      labels: {
        style: {
          colors: [isDark ? '#94a3b8' : '#94a3b8'],
        },
        formatter: (value) => `${Math.round(Number(value ?? 0))}%`,
      },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (value) => `${Math.round(Number(value ?? 0))}%`,
      },
    },
  };

  const donutOptions: ApexOptions = {
    ...buildChartThemeOptions(locale),
    chart: {
      ...buildChartThemeOptions(locale).chart,
      type: 'donut',
      height: 220,
      foreColor: isDark ? '#cbd5e1' : '#64748b',
    },
    labels: compositionPayload.labels,
    colors: compositionPayload.colors,
    legend: {
      show: false,
    },
    stroke: {
      width: 0,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            value: {
              show: true,
              formatter: (value) => formatNumber(Number(value ?? 0), locale),
              color: isDark ? '#f8fafc' : '#0f172a',
            },
            total: {
              show: true,
              label: t('charts.total'),
              color: isDark ? '#94a3b8' : '#64748b',
              formatter: () =>
                formatNumber(
                  compositionPayload.values.reduce((sum, current) => sum + current, 0),
                  locale,
                ),
            },
          },
        },
      },
    },
  };
  const primaryActions = getPrimaryActions(dashboard);
  const fallbackActions = dashboard.quickLinks.slice(0, 4);

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Surface className="lg:col-span-2 p-5">
        <SectionHeader
          title={chartPayload.title}
          description={chartPayload.description}
          action={
            dashboard.viewer.roleVariant === 'org_admin' ? (
              <QuarterFilter
                quarter={adminQuarter}
                year={adminYear}
                onQuarterChange={onAdminQuarterChange}
                onYearChange={onAdminYearChange}
                t={t}
              />
            ) : (
              <MemberRangeFilter value={memberRange} onChange={onMemberRangeChange} t={t} />
            )
          }
        />

        <div className="mt-5">
          <div className="space-y-4">
            <ApexChart
              type="area"
              height={420}
              series={[{ name: t('charts.score'), data: chartPayload.series }]}
              options={chartOptions}
            />

            <div className="flex flex-wrap gap-x-5 gap-y-3">
              {chartPayload.detailRows.map((item, index) => (
                <div
                  key={item.label}
                  className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: chartPayload.colors[index] }}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {chartPayload.budgetRows.length > 0 ? (
          <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
            <SectionHeader
              title={translateOr(t, 'charts.budgetOverview', 'Budget overview')}
              description={translateOr(
                t,
                'charts.budgetOverviewDescription',
                'Estimated versus actual project budget aggregated from active portfolio data.',
              )}
            />

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {chartPayload.budgetRows.map((budget) => (
                <div
                  key={budget.currency}
                  className="rounded-lg border border-slate-200 px-4 py-4 dark:border-slate-800"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{budget.currency}</p>
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      {translateOr(t, 'charts.budget', 'Budget')}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500 dark:text-slate-400">
                        {translateOr(t, 'charts.estimated', 'Estimated')}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{budget.estimated}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500 dark:text-slate-400">
                        {translateOr(t, 'charts.actual', 'Actual')}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{budget.actual}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500 dark:text-slate-400">
                        {translateOr(t, 'charts.variance', 'Variance')}
                      </span>
                      <span className={cn('font-medium', budget.varianceTone)}>
                        {budget.variancePrefix}
                        {budget.variance}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Surface>

      <div className="flex flex-col gap-4">
        <Surface className="p-5">
          <SectionHeader
            title={compositionPayload.title}
            description={compositionPayload.description}
            action={<Gauge className="h-4 w-4 text-slate-400" />}
          />

          {compositionPayload.values.some((value) => value > 0) ? (
            <>
              <div className="mt-4 overflow-hidden rounded-lg">
                <ApexChart
                  type="donut"
                  height={220}
                  series={compositionPayload.values}
                  options={donutOptions}
                />
              </div>
              <div className="mt-3 space-y-3">
                {compositionPayload.labels.map((label, index) => (
                  <div key={label} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: compositionPayload.colors[index] }}
                      />
                      <span className="truncate text-slate-600 dark:text-slate-300">{label}</span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatNumber(compositionPayload.values[index] ?? 0, locale)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-5">
              <EmptyState message={t('empty.actions')} />
            </div>
          )}
        </Surface>

        <Surface className="flex-1 p-5">
          <SectionHeader
            title={t('sections.priorityActions')}
            description={t('sections.priorityActionsDescription')}
            action={
              fallbackActions[0] ? (
                <Link
                  href={getQuickLinkHref(tenant, fallbackActions[0])}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
                >
                  {getQuickLinkLabel(fallbackActions[0].key, t)}
                </Link>
              ) : null
            }
          />

          <div className="mt-5 space-y-4">
            {primaryActions.length > 0
              ? primaryActions.map((item) => (
                  <TimelineRow
                    key={item.code}
                    href={buildTenantHref(tenant, item.href)}
                    label={getPriorityActionLabel(item.code, t)}
                    meta={`${formatNumber(item.count, locale)} ${t('charts.total').toLowerCase()}`}
                    dotClassName={getPriorityActionToneClass(item.tone)}
                  />
                ))
              : fallbackActions.map((item, index) => (
                  <TimelineRow
                    key={item.key}
                    href={getQuickLinkHref(tenant, item)}
                    label={getQuickLinkLabel(item.key, t)}
                    meta={t(`quickLinkDescriptions.${item.key}`)}
                    dotClassName={index % 2 === 0 ? 'bg-indigo-500' : 'bg-sky-500'}
                  />
                ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}

function BottomTable({
  dashboard,
  locale,
  tenant,
  t,
}: {
  dashboard: TenantDashboardResponse;
  locale: string;
  tenant: string;
  t: DashboardTranslator;
}) {
  const mode = getTableMode(dashboard);
  const quickLinks = dashboard.quickLinks.slice(0, 3);

  return (
    <Surface className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {mode === 'projects'
              ? t('sections.projects')
              : mode === 'tasks'
                ? t('sections.tasks')
                : t('sections.myTickets')}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {mode === 'projects'
              ? t('sections.projectsDescription')
              : mode === 'tasks'
                ? t('sections.tasksDescription')
                : t('sections.myTicketsDescription')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {quickLinks.map((item) => (
            <Link
              key={item.key}
              href={getQuickLinkHref(tenant, item)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"
            >
              {getQuickLinkLabel(item.key, t)}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        {mode === 'projects' ? (
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('table.project')}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('table.slug')}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('table.status')}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('table.progress')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-900 dark:bg-slate-950">
              {dashboard.lists.projectFocus.length > 0 ? (
                dashboard.lists.projectFocus.map((project) => (
                  <tr
                    key={project.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/60"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={buildTenantHref(tenant, project.href)}
                        className="font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-300"
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{project.slug}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant="outline" className={cn('rounded-full', getProjectStatusClassName(project.status))}>
                        {getProjectStatusLabel(project.status, t)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="w-12 font-medium text-slate-900 dark:text-slate-100">
                          {formatPercent(project.progress, locale)}
                        </span>
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
                          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${project.progress}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-6">
                    <EmptyState message={t('empty.projects')} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : mode === 'tasks' ? (
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('table.task')}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('table.project')}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('table.dueState')}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('table.priority')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-900 dark:bg-slate-950">
              {dashboard.lists.taskFocus.length > 0 ? (
                dashboard.lists.taskFocus.map((task) => (
                  <tr key={task.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/60">
                    <td className="px-5 py-3.5">
                      <Link
                        href={buildTenantHref(tenant, task.href)}
                        className="font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-300"
                      >
                        {task.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{task.projectName}</td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {getTaskDueStateLabel(task.dueState, t)}
                    </td>
                    <td className={cn('px-5 py-3.5 font-medium', getPriorityToneClass(task.priority))}>
                      {getPriorityLabel(task.priority, t)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-6">
                    <EmptyState message={t('empty.tasks')} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('table.code')}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('table.name')}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('table.status')}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('table.type')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-900 dark:bg-slate-950">
              {dashboard.lists.ticketFocus.length > 0 ? (
                dashboard.lists.ticketFocus.map((ticket) => (
                  <tr key={ticket.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/60">
                    <td className="px-5 py-3.5 font-mono text-[13px] text-slate-900 dark:text-slate-100">
                      {ticket.code}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={buildTenantHref(tenant, ticket.href)}
                        className="font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-300"
                      >
                        {ticket.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {getTicketStatusLabel(ticket.status, t)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                      {getTicketTypeLabel(ticket.type, t)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-6">
                    <EmptyState message={t('empty.tickets')} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </Surface>
  );
}

export function TenantDashboardPage() {
  const params = useParams<{ tenant: string | string[] }>();
  const tenant = resolveTenantParam(params.tenant);
  const locale = useLocale();
  const t = useTranslations('dashboard.tenant');
  const [adminPeriod, setAdminPeriod] = useState(() => getCurrentQuarterSelection());
  const [memberRange, setMemberRange] = useState<TenantDashboardMemberRange>('last_week');
  const dashboardFilter: TenantDashboardOverviewQuery = {
    adminYear: adminPeriod.year,
    adminQuarter: adminPeriod.quarter,
    memberRange,
  };
  const dashboardQuery = useDashboardOverview(dashboardFilter);
  const dashboard = dashboardQuery.data;
  const queryControls = dashboardQuery.raw as {
    refetch?: () => Promise<unknown>;
  };

  if (dashboardQuery.isPending) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <LoaderCircle className="h-5 w-5 animate-spin text-indigo-600" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('loadingTitle')}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('loadingDescription')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (dashboardQuery.isError || !dashboard) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="max-w-lg rounded-xl border border-slate-200 bg-white px-6 py-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
              <TriangleAlert className="h-5 w-5" />
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('errorTitle')}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('errorDescription')}</p>
              </div>
              <Button
                type="button"
                onClick={() => {
                  void queryControls.refetch?.();
                }}
              >
                {t('retry')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const kpiCards = getKpiCards(dashboard, locale, t);

  return (
    <div>
      <DashboardHeader
        dashboard={dashboard}
        tenant={tenant}
        t={t}
        adminQuarter={adminPeriod.quarter}
        adminYear={adminPeriod.year}
        memberRange={memberRange}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((item) => (
          <KpiCard key={item.label} {...item} />
        ))}
      </div>

      <DashboardOverview
        dashboard={dashboard}
        locale={locale}
        tenant={tenant}
        t={t}
        adminQuarter={adminPeriod.quarter}
        adminYear={adminPeriod.year}
        onAdminQuarterChange={(quarter) => {
          setAdminPeriod((previous) => ({ ...previous, quarter }));
        }}
        onAdminYearChange={(delta) => {
          setAdminPeriod((previous) => ({ ...previous, year: previous.year + delta }));
        }}
        memberRange={memberRange}
        onMemberRangeChange={setMemberRange}
      />
      <BottomTable dashboard={dashboard} locale={locale} tenant={tenant} t={t} />
    </div>
  );
}
