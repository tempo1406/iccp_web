'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBillingPlansQuery } from '../query/use-billing-plans';
import type { BillingPlanDto } from '@/services/billing/types/billing.types';

type BillingInterval = 'monthly' | 'yearly';

function parsePrice(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPriceVnd(value: string, locale: string): string {
  const amount = parsePrice(value);
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatLimit(value: number, locale: string, unlimitedLabel: string): string {
  if (value >= 9999) return unlimitedLabel;
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(value);
}

function humanizeFeatureName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getFeatureList(
  plan: BillingPlanDto,
  locale: string,
  t: ReturnType<typeof useTranslations<'landing.billing'>>,
): string[] {
  const featureFlags =
    plan.features && typeof plan.features === 'object' && !Array.isArray(plan.features)
      ? plan.features
      : {};

  const dynamicFeatures = Object.entries(featureFlags)
    .filter(([, isEnabled]) => isEnabled)
    .map(([name]) => humanizeFeatureName(name));

  return [
    `${formatLimit(plan.maxUsers, locale, t('unlimited'))} ${t('units.users')}`,
    `${formatLimit(plan.maxProjects, locale, t('unlimited'))} ${t('units.projects')}`,
    `${formatLimit(plan.maxDocuments, locale, t('unlimited'))} ${t('units.documents')}`,
    `${formatLimit(plan.maxStorageGb, locale, t('unlimited'))} ${t('units.storage')}`,
    ...dynamicFeatures,
  ];
}

export function LandingBillingSection() {
  const t = useTranslations('landing.billing');
  const locale = useLocale();
  const [interval, setInterval] = useState<BillingInterval>('monthly');
  const { data: plans = [], isLoading, isError } = useBillingPlansQuery();

  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => parsePrice(a.priceMonthly) - parsePrice(b.priceMonthly));
  }, [plans]);

  return (
    <section id="pricing" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-primary mb-3 text-xl font-bold tracking-[0.22em] uppercase md:text-2xl">
            {t('eyebrow')}
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">{t('title')}</h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-2xl">{t('description')}</p>

          <div className="mt-6 inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 p-1 dark:border-white/10 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setInterval('monthly')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                interval === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('monthly')}
            </button>
            <button
              type="button"
              onClick={() => setInterval('yearly')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                interval === 'yearly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('yearly')}
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 p-10 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('loading')}
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
            {t('error')}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {sortedPlans.map((plan) => {
              const features = getFeatureList(plan, locale, t);
              const isFeatured = plan.code === 'standard';
              const price =
                interval === 'monthly'
                  ? formatPriceVnd(plan.priceMonthly, locale)
                  : formatPriceVnd(plan.priceYearly, locale);

              return (
                <Card
                  key={plan.id}
                  className={`relative flex h-full flex-col border-border/60 bg-card/70 ${
                    isFeatured ? 'ring-primary border-primary/40 ring-1' : ''
                  }`}
                >
                  {isFeatured && (
                    <Badge className="absolute top-4 right-4 rounded-full">
                      {t('mostPopular')}
                    </Badge>
                  )}
                  <CardHeader className="space-y-3">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <p className="text-muted-foreground text-sm">{plan.description}</p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold">{price}</span>
                      <span className="text-muted-foreground mb-1 text-sm">
                        {interval === 'monthly' ? t('monthSuffix') : t('yearSuffix')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-5">
                    <ul className="flex-1 space-y-2.5">
                      {features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="mt-auto w-full"
                      variant={isFeatured ? 'default' : 'outline'}
                      asChild
                    >
                      <Link href="/login">{t('choosePlan', { plan: plan.name })}</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
