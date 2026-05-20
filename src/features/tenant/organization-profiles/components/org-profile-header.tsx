'use client';

import {
  Building2,
  ExternalLink,
  Globe2,
  Mail,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { OrgProfileResponse } from '../types/org-profile.types';

interface OrgProfileHeaderProps {
  profile: OrgProfileResponse | undefined;
  isLoading: boolean;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDate(iso: string | undefined, fallback: string): string {
  if (!iso) return fallback;
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatWebsiteLabel(website: string | undefined, fallback: string): string {
  if (!website) return fallback;

  try {
    return new URL(website).hostname.replace(/^www\./, '');
  } catch {
    return website;
  }
}

function formatCategory(profile: OrgProfileResponse, fallback: string, teamLabel: string): string {
  const size = profile.size
    ? `${profile.size.charAt(0).toUpperCase()}${profile.size.slice(1)} ${teamLabel}`
    : null;

  return [profile.industry, size].filter(Boolean).join(' / ') || fallback;
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function FactTile({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="bg-white/85 px-5 py-4 dark:bg-slate-950/65">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-[var(--brand-light)] p-2 text-[var(--brand)]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 transition hover:text-primary dark:text-slate-100"
            >
              <span className="truncate">{value}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          ) : (
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {value}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function OrgProfileHeader({ profile, isLoading }: OrgProfileHeaderProps) {
  const t = useTranslations('orgConfig.organizationProfile.header');

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-card shadow-sm dark:border-slate-800">
        <div className="space-y-6 px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-3">
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className="h-9 w-72" />
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-4 w-[28rem]" />
              </div>
            </div>
            <Skeleton className="h-32 w-full rounded-3xl xl:w-[22rem]" />
          </div>

          <div className="grid gap-px rounded-3xl border border-slate-200/70 bg-slate-200/70 sm:grid-cols-2 xl:grid-cols-4 dark:border-slate-800 dark:bg-slate-800/70">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-card px-5 py-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-3 h-5 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-card shadow-sm dark:border-slate-800">
      <div className="relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="bg-primary/14 dark:bg-primary/18 absolute top-0 left-0 h-56 w-56 rounded-full blur-3xl" />
          <div className="bg-primary/10 dark:bg-primary/14 absolute right-[-3rem] bottom-[-5rem] h-64 w-64 rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
            <Avatar className="h-20 w-20 rounded-full ring-4 ring-white/80 shadow-lg dark:ring-slate-900/80">
              {profile.logoUrl && <AvatarImage src={profile.logoUrl} alt={profile.name} />}
              <AvatarFallback className="rounded-full bg-primary/10 text-xl font-semibold text-primary">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="rounded-full border-[var(--brand-muted)] bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]"
                >
                  {t('badge')}
                </Badge>
                <Badge
                  className={
                    profile.isActive
                      ? 'rounded-full bg-emerald-600 text-white hover:bg-emerald-600'
                      : 'rounded-full bg-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-800'
                  }
                >
                  {profile.isActive ? t('activeWorkspace') : t('inactiveWorkspace')}
                </Badge>
                {profile.industry && (
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    {profile.industry}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
                  {profile.name}
                </h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  @{profile.slug}
                </p>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {profile.description?.trim() ||
                    t('fallbackDescription')}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-3xl border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/80">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">{t('summary.title')}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t('summary.description')}
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <SummaryField label={t('summary.created')} value={formatDate(profile.createdAt, t('notAvailable'))} />
              <SummaryField label={t('summary.updated')} value={formatDate(profile.updatedAt, t('notAvailable'))} />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="grid gap-px sm:grid-cols-2 xl:grid-cols-4">
          <FactTile
            icon={Globe2}
            label={t('facts.website')}
            value={formatWebsiteLabel(profile.website, t('notConfigured'))}
            href={profile.website}
          />
          <FactTile
            icon={Mail}
            label={t('facts.contact')}
            value={profile.contactEmail || t('notConfigured')}
          />
          <FactTile
            icon={Building2}
            label={t('facts.category')}
            value={formatCategory(profile, t('notCategorized'), t('team'))}
          />
        </div>
      </div>
    </div>
  );
}
