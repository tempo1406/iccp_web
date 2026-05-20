'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  useBillingPlans,
  useCreatePaymentLink,
  useChangePlan,
  useMySubscription,
} from '../query/use-billing';
import type { BillingCycle } from '@/services/billing/types/billing.types';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';

function humanizeFeatureName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveLocale(locale: string): string {
  return locale.startsWith('vi') ? 'vi-VN' : 'en-US';
}

function formatVnd(value: string | number, locale: string, freeLabel: string): string {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  if (!num || isNaN(num)) return freeLabel;
  return new Intl.NumberFormat(resolveLocale(locale), { style: 'currency', currency: 'VND' }).format(num);
}

export function BillingPlansGrid() {
  const t = useTranslations('billing.plans');
  const locale = useLocale();
  const [cycle, setCycle] = useState<BillingCycle>('monthly');

  const canCreateSubscription = useCan(PERMISSIONS.BILLING_SUBSCRIPTIONS_CREATE);
  const canChangePlan = useCan(PERMISSIONS.BILLING_SUBSCRIPTIONS_CHANGE_PLAN);
  const plansQuery = useBillingPlans();
  const subscriptionQuery = useMySubscription();
  const createLink = useCreatePaymentLink();
  const changePlan = useChangePlan();

  const plans = plansQuery.data ?? [];
  const subscription = subscriptionQuery.data ?? null;
  const hasActiveSub =
    subscription?.status === 'active' ||
    subscription?.status === 'trial' ||
    subscription?.status === 'pending_payment';
  const currentPlanId = hasActiveSub ? subscription!.planId : null;

  const isFree = (plan: { priceMonthly: string }) => parseInt(plan.priceMonthly, 10) === 0;
  const isPending = createLink.isPending || changePlan.isPending;

  function handleSelectPlan(planId: string) {
    if (hasActiveSub) {
      changePlan.mutate({ planId, billingCycle: cycle });
    } else {
      createLink.mutate({ planId, billingCycle: cycle });
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('title')}</h2>

        <div className="bg-muted flex items-center gap-1 rounded-lg p-1 text-sm">
          <button
            onClick={() => setCycle('monthly')}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              cycle === 'monthly'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('monthly')}
          </button>
          <button
            onClick={() => setCycle('yearly')}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              cycle === 'yearly'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('yearly')}
            <Badge variant="secondary" className="ml-1.5 bg-emerald-500/10 text-emerald-600 text-xs">
              {t('save20')}
            </Badge>
          </button>
        </div>
      </div>

      {plansQuery.isPending ? (
        <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
          <Loader2 className="size-4 animate-spin" />
          {t('loading')}
        </div>
      ) : plansQuery.isError ? (
        <p className="text-muted-foreground py-8 text-sm">
          {t('loadFailed')}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const price = cycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
            const isFreePlan = isFree(plan);
            const isCurrentPlan = plan.id === currentPlanId;
            const enabledFeatures = Object.entries(plan.features ?? {})
              .filter(([, isEnabled]) => isEnabled)
              .map(([featureName]) => humanizeFeatureName(featureName));

            const isDisabled = isFreePlan || isCurrentPlan || isPending;

            const hasTrial = plan.trialDays > 0;

            let buttonLabel: string;
            if (isFreePlan) {
              buttonLabel = t('free');
            } else if (isCurrentPlan) {
              buttonLabel = t('currentPlan');
            } else if (hasActiveSub) {
              buttonLabel = t('changePlan');
            } else if (hasTrial) {
              buttonLabel = t('tryDaysFree', { days: plan.trialDays });
            } else {
              buttonLabel = t('upgrade');
            }
            const canUsePlanAction = hasActiveSub ? canChangePlan : canCreateSubscription;
            const showPlanAction = canUsePlanAction;

            return (
              <Card
                key={plan.id}
                className={`h-full ${
                  isCurrentPlan ? 'border-primary ring-primary ring-1' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="flex items-center gap-1.5">
                      {hasTrial && !isCurrentPlan && (
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 text-xs">
                          {t('trialBadge', { days: plan.trialDays })}
                        </Badge>
                      )}
                      {isCurrentPlan && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          {t('current')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{formatVnd(price, locale, t('free'))}</span>
                    {!isFreePlan && (
                      <span className="text-muted-foreground text-sm">
                        /{cycle === 'monthly' ? t('monthShort') : t('yearShort')}
                      </span>
                    )}
                  </div>

                  <ul className="flex-1 space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      {t('users', { count: plan.maxUsers })}
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      {t('documents', { count: plan.maxDocuments })}
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      {t('storage', { count: plan.maxStorageGb })}
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      {t('projects', { count: plan.maxProjects })}
                    </li>
                    {enabledFeatures.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {showPlanAction ? (
                    <Button
                      className="mt-auto w-full"
                      variant={isCurrentPlan ? 'outline' : 'default'}
                      disabled={isDisabled}
                      onClick={() => !isDisabled && handleSelectPlan(plan.id)}
                    >
                      {isPending && !isCurrentPlan && !isFreePlan ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {buttonLabel}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
