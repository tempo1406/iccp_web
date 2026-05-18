'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeQuery, useSafeMutation } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { BillingService } from '@/services/billing/billing.service';
import type {
  ChangePlanBody,
  CreatePaymentLinkBody,
  InvoiceQueryParams,
} from '@/services/billing/types/billing.types';
import { savePendingPaymentContext } from '../lib/pending-payment-context';

// ── Plans ────────────────────────────────────────────────────────────────────

export function useBillingPlans() {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: ['billing', 'plans'],
      queryFn: () => new BillingService(ctx).getPlans(),
      select: (plans) => plans.filter((plan) => plan.isActive),
      staleTime: 5 * 60_000,
    }),
  );
}

// ── Subscription ─────────────────────────────────────────────────────────────

export function useMySubscription() {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: ['billing', 'my-subscription', ctx.tenantId],
      queryFn: () => new BillingService(ctx).getMySubscription(),
      staleTime: 30_000,
    }),
  );
}

export function useCancelSubscription() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: () => new BillingService(ctx).cancelMySubscription(),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: ['billing', 'my-subscription'] });
      },
    }),
  );
}

// ── Invoices ─────────────────────────────────────────────────────────────────

export function useMyInvoices(params?: InvoiceQueryParams) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: ['billing', 'my-invoices', ctx.tenantId, params],
      queryFn: () => new BillingService(ctx).getMyInvoices(params),
      staleTime: 30_000,
    }),
  );
}

// ── Payment Mutations ────────────────────────────────────────────────────────

export function useCreatePaymentLink() {
  const ctx = useServiceContext();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: CreatePaymentLinkBody) =>
        new BillingService(ctx).createPaymentLink(body),
      onSuccess: (data) => {
        savePendingPaymentContext({
          orderCode: data.orderCode,
          tenantId: ctx.tenantId ?? null,
          checkoutUrl: data.checkoutUrl,
        });
        window.location.href = data.checkoutUrl;
      },
    }),
  );
}

export function useChangePlan() {
  const ctx = useServiceContext();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: ChangePlanBody) =>
        new BillingService(ctx).changePlan(body),
      onSuccess: (data) => {
        savePendingPaymentContext({
          orderCode: data.orderCode,
          tenantId: ctx.tenantId ?? null,
          checkoutUrl: data.checkoutUrl,
        });
        window.location.href = data.checkoutUrl;
      },
    }),
  );
}

export function useConfirmPayment() {
  const ctx = useServiceContext();
  return useSafeMutation(
    useMutation({
      mutationFn: (orderCode: number) => new BillingService(ctx).confirmPayment(orderCode),
    }),
  );
}

export function useCancelPayment() {
  const ctx = useServiceContext();
  return useSafeMutation(
    useMutation({
      mutationFn: (orderCode: number) => new BillingService(ctx).cancelPayment(orderCode),
    }),
  );
}

// ── Payment Status Query (read-only, no side effects) ────────────────────────

export function usePaymentStatus(orderCode: number | null, enabled = true) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: ['payment', 'status', orderCode],
      queryFn: () => new BillingService(ctx).getPaymentStatus(orderCode!),
      enabled: enabled && orderCode !== null,
      staleTime: 10_000,
    }),
  );
}
