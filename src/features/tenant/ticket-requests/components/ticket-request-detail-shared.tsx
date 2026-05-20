'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TICKET_REQUEST_ACTIVITY_COLORS: Record<string, string> = {
  created:
    'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-300',
  submitted:
    'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  updated:
    'border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  approved:
    'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  rejected:
    'border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  changes_requested:
    'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  canceled:
    'border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-400',
  commented:
    'border-purple-200 bg-purple-100 text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  cc_added:
    'border-teal-200 bg-teal-100 text-teal-700 dark:border-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  cc_removed:
    'border-pink-200 bg-pink-100 text-pink-700 dark:border-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
};

export function formatTicketRequestActivityAction(
  action: string,
  t?: (key: string) => string,
): string {
  if (t) {
    try {
      return t(action);
    } catch {
      // Fall back to normalized code when the key is missing.
    }
  }

  return action
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function DetailMetricCard({
  icon: Icon,
  label,
  value,
  hint,
  valueClassName,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  valueClassName?: string;
}) {
  return (
    <div className="space-y-1.5 rounded-lg bg-muted/30 p-3.5">
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className={cn('text-sm font-semibold text-foreground', valueClassName)}>{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function CompactInfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="max-w-[62%] text-right text-sm font-semibold leading-6 text-foreground">
        {value}
      </span>
    </div>
  );
}

export function DetailFieldCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium leading-7 whitespace-pre-wrap text-foreground">{value}</p>
    </div>
  );
}

export function EmptyPanelState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/10 px-6 py-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
