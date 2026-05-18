'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check, Loader2, AlertCircle, Clock, CreditCard } from 'lucide-react';
import { useMySubscription, useCancelSubscription } from '../query/use-billing';
import type { SubscriptionDto } from '@/services/billing/types/billing.types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveLocale(locale: string): string {
  return locale.startsWith('vi') ? 'vi-VN' : 'en-US';
}

function formatVnd(amount: number, locale: string): string {
  return new Intl.NumberFormat(resolveLocale(locale), { style: 'currency', currency: 'VND' }).format(amount);
}

function isFreePlan(plan: SubscriptionDto['plan']): boolean {
  return plan.code === 'free' || (Number(plan.priceMonthly) === 0 && Number(plan.priceYearly) === 0);
}

type SubState = 'ACTIVE' | 'PENDING_PAYMENT' | 'FREE_TRIAL' | 'EXPIRED' | 'CANCELLED';

function getSubscriptionState(sub: SubscriptionDto): SubState {
  if (sub.status === 'active') return 'ACTIVE';
  if (sub.status === 'pending_payment') return 'PENDING_PAYMENT';
  if (sub.status === 'trial' && sub.trialEndsAt === null) return 'PENDING_PAYMENT';
  if (sub.status === 'trial' && sub.trialEndsAt !== null) return 'FREE_TRIAL';
  if (sub.status === 'expired') return 'EXPIRED';
  return 'CANCELLED';
}

function stateBadge(state: SubState) {
  switch (state) {
    case 'ACTIVE':
      return { className: 'bg-emerald-500/10 text-emerald-600', key: 'active' as const };
    case 'FREE_TRIAL':
      return { className: 'bg-blue-500/10 text-blue-600', key: 'freeTrial' as const };
    case 'PENDING_PAYMENT':
      return { className: 'bg-amber-500/10 text-amber-600', key: 'pendingPayment' as const };
    case 'EXPIRED':
      return { className: 'bg-red-500/10 text-red-500', key: 'expired' as const };
    case 'CANCELLED':
      return { className: 'bg-muted text-muted-foreground', key: 'cancelled' as const };
  }
}

function trialDaysRemaining(trialEndsAt: string): number {
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ── Component ────────────────────────────────────────────────────────────────

export function BillingCurrentPlanUsage() {
  const t = useTranslations('billing.currentPlan');
  const locale = useLocale();
  const subscriptionQuery = useMySubscription();
  const cancelMutation = useCancelSubscription();

  const subscription = subscriptionQuery.data ?? null;
  const plan = subscription?.plan;
  const subState = subscription ? getSubscriptionState(subscription) : null;
  const isFreeCurrentPlan = plan ? isFreePlan(plan) : false;

  const canCancel =
    !isFreeCurrentPlan &&
    (subState === 'ACTIVE' || subState === 'FREE_TRIAL' || subState === 'PENDING_PAYMENT');

  function handleCancel() {
    if (!canCancel) return;
    void cancelMutation.mutate(undefined);
  }

  const badge = subState ? stateBadge(subState) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t('title')}
            </CardTitle>
            {badge ? (
              <Badge variant="secondary" className={badge.className}>
                {t(`status.${badge.key}`)}
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                {t('noPlan')}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {subscriptionQuery.isPending ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              {t('loading')}
            </div>
          ) : subscriptionQuery.isError ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <AlertCircle className="size-4" />
              {t('loadFailed')}
            </div>
          ) : !subscription || !plan ? (
            <p className="text-muted-foreground text-sm">
              {t('empty')}
            </p>
          ) : (
            <div className="space-y-4">
              {/* Plan price & name */}
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    {subscription.billingCycle === 'monthly'
                      ? formatVnd(Number(plan.priceMonthly), locale)
                      : formatVnd(Number(plan.priceYearly), locale)}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    /{subscription.billingCycle === 'monthly' ? t('monthShort') : t('yearShort')}
                  </span>
                </div>
                <p className="text-lg font-semibold">{plan.name}</p>
              </div>

              {/* State-specific banners */}
              {subState === 'PENDING_PAYMENT' && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                  <CreditCard className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-700 dark:text-amber-400">
                      {t('pendingPaymentTitle')}
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      {t('pendingPaymentDescription')}
                    </p>
                  </div>
                </div>
              )}

              {subState === 'FREE_TRIAL' && subscription.trialEndsAt && (
                <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                  <Clock className="mt-0.5 size-4 shrink-0 text-blue-600" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-700 dark:text-blue-400">
                      {t('trialRemaining', {
                        days: trialDaysRemaining(subscription.trialEndsAt),
                      })}
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      {t('trialEndsOn', {
                        date: new Date(subscription.trialEndsAt).toLocaleDateString(resolveLocale(locale)),
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Plan features */}
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  {t('users', { count: plan.maxUsers })}
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  {t('documents', { count: plan.maxDocuments })}
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  {t('storage', { count: plan.maxStorageGb })}
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  {t('projects', { count: plan.maxProjects })}
                </li>
              </ul>

              {/* Dates */}
              {!isFreeCurrentPlan && (
                <div className="text-muted-foreground space-y-1 text-xs">
                  <p>
                    {t('start', {
                      date: new Date(subscription.startDate).toLocaleDateString(resolveLocale(locale)),
                    })}
                  </p>
                  <p>
                    {t('expires', {
                      date: new Date(subscription.endDate).toLocaleDateString(resolveLocale(locale)),
                    })}
                  </p>
                </div>
              )}

              {/* Actions */}
              {canCancel && (
                <Button
                  variant="outline"
                  className="w-full text-red-500 hover:text-red-600"
                  disabled={cancelMutation.isPending}
                  onClick={handleCancel}
                >
                  {cancelMutation.isPending && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {t('cancelSubscription')}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t('planDetails')}</CardTitle>
          <CardDescription>
            {plan
              ? t('planDescription', { name: plan.name, description: plan.description })
              : t('selectPlanHint')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plan ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: t('usersLabel'), value: t('users', { count: plan.maxUsers }) },
                { label: t('documentsLabel'), value: t('documents', { count: plan.maxDocuments }) },
                { label: t('storageLabel'), value: `${plan.maxStorageGb} GB` },
                { label: t('projectsLabel'), value: t('projects', { count: plan.maxProjects }) },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">{label}</p>
                  <p className="font-semibold">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t('noInfo')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
