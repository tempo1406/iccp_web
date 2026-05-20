'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useServiceContext } from '@/lib/use-service-context';
import { BillingService } from '@/services/billing/billing.service';
import type { BillingPlanDto } from '@/services/billing/types/billing.types';

export const BILLING_PLAN_QUERY_KEYS = {
  all: ['billing', 'plans'] as const,
};

export function useBillingPlansQuery(
  options?: Omit<
    UseQueryOptions<BillingPlanDto[], Error, BillingPlanDto[]>,
    'queryKey' | 'queryFn'
  >,
) {
  const ctx = useServiceContext();

  return useQuery({
    queryKey: BILLING_PLAN_QUERY_KEYS.all,
    queryFn: () => new BillingService(ctx).getPlans(),
    select: (plans) => plans.filter((plan) => plan.isActive),
    staleTime: 5 * 60_000,
    ...options,
  });
}
