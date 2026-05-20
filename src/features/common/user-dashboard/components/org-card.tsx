'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { OrganizationDto } from '@/services/organizations/types';

const COLORS = [
  {
    icon: 'border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 dark:border-blue-900/50 dark:from-blue-900/30 dark:to-blue-800/30',
    dot: 'bg-blue-500',
    glow: 'from-blue-500/10 via-blue-400/5 to-transparent',
  },
  {
    icon: 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 dark:border-emerald-900/50 dark:from-emerald-900/30 dark:to-emerald-800/30',
    dot: 'bg-emerald-500',
    glow: 'from-emerald-500/10 via-emerald-400/5 to-transparent',
  },
  {
    icon: 'border-violet-100 bg-gradient-to-br from-violet-50 to-violet-100 text-violet-600 dark:border-violet-900/50 dark:from-violet-900/30 dark:to-violet-800/30',
    dot: 'bg-violet-500',
    glow: 'from-violet-500/10 via-violet-400/5 to-transparent',
  },
  {
    icon: 'border-amber-100 bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 dark:border-amber-900/50 dark:from-amber-900/30 dark:to-amber-800/30',
    dot: 'bg-amber-500',
    glow: 'from-amber-500/10 via-amber-400/5 to-transparent',
  },
  {
    icon: 'border-rose-100 bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600 dark:border-rose-900/50 dark:from-rose-900/30 dark:to-rose-800/30',
    dot: 'bg-rose-500',
    glow: 'from-rose-500/10 via-rose-400/5 to-transparent',
  },
] as const;

function getColor(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getOrgInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'ORG';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

interface OrgCardProps {
  org: OrganizationDto;
  onClick: (org: OrganizationDto) => void;
  isHighlighted?: boolean;
}

export function OrgCard({ org, onClick, isHighlighted = false }: OrgCardProps) {
  const t = useTranslations('dashboard.workspace');
  const c = getColor(org.slug);
  const initials = getOrgInitials(org.name);

  return (
    <button
      type="button"
      onClick={() => onClick(org)}
      className={`group relative flex min-h-[110px] flex-col justify-between overflow-hidden rounded-2xl border bg-white/70 p-3 text-left backdrop-blur-lg transition-all duration-300 ease-out hover:-translate-y-1 hover:border-indigo-400/50 hover:shadow-lg hover:shadow-indigo-500/10 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-900/60 dark:hover:border-indigo-500/40 ${
        isHighlighted
          ? 'border-emerald-300 ring-2 ring-emerald-200/70 dark:border-emerald-700/80 dark:ring-emerald-900/50'
          : 'border-slate-200/60 dark:border-slate-800/60'
      }`}
    >
      {isHighlighted && (
        <span className="absolute top-2 right-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
          {t('newBadge')}
        </span>
      )}

      <div
        className={`pointer-events-none absolute inset-0 -z-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${c.glow}`}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div
          className={`flex size-8 shrink-0 items-center justify-center rounded-xl border shadow-sm transition-all duration-300 group-hover:scale-105 ${c.icon}`}
        >
          <Avatar className="size-full rounded-xl">
            <AvatarImage src={org.logoUrl ?? undefined} alt={org.name} />
            <AvatarFallback className="rounded-xl bg-transparent text-xs font-extrabold tracking-wide">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
        {!isHighlighted && <span className={`mt-1 h-2.5 w-2.5 rounded-full ${c.dot}`} />}
      </div>

      <div className="relative z-10 mt-3 space-y-1">
        <h4 className="line-clamp-2 text-xs font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">
          {org.name}
        </h4>
        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
          {org.industry ?? org.slug}
        </p>
      </div>

      <div className="relative z-10 mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 transition group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-400">
          <span>{t('openWorkspace')}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
        <a
          href={`/org/${org.slug}/landing-page`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] text-slate-400 hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400"
        >
          {t('viewLandingPage')}
        </a>
      </div>
    </button>
  );
}

export function OrgListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex min-h-[110px] flex-col justify-between rounded-2xl border border-slate-100 bg-white/60 p-3 dark:border-slate-800/60 dark:bg-slate-900/40"
        >
          <div className="flex items-start justify-between">
            <div className="size-8 animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800/60" />
            <div className="mt-1 h-2.5 w-2.5 animate-pulse rounded-full bg-slate-300 dark:bg-slate-700" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200/70 dark:bg-slate-800/60" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200/60 dark:bg-slate-800/50" />
          </div>

          <div className="h-3 w-24 animate-pulse rounded bg-slate-200/60 dark:bg-slate-800/50" />
        </div>
      ))}
    </div>
  );
}
