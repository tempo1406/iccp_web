'use client';

import { useSyncExternalStore } from 'react';

const PENDING_ORDER_KEY = 'pending_order';
const PENDING_ORDER_TENANT_KEY = 'pending_order_tenant';
const PENDING_CHECKOUT_URL_KEY = 'pending_checkout_url';
const PENDING_PAYMENT_CONTEXT_EVENT = 'pending-payment-context-change';

export interface PendingPaymentContext {
  orderCode: number | null;
  tenantId: string | null;
  checkoutUrl: string | null;
}

const EMPTY_PENDING_PAYMENT_CONTEXT: PendingPaymentContext = {
  orderCode: null,
  tenantId: null,
  checkoutUrl: null,
};

let cachedPendingPaymentContext = EMPTY_PENDING_PAYMENT_CONTEXT;

function readPendingPaymentContext(): PendingPaymentContext {
  if (typeof window === 'undefined') {
    return EMPTY_PENDING_PAYMENT_CONTEXT;
  }

  const rawOrderCode = localStorage.getItem(PENDING_ORDER_KEY);
  const parsedOrderCode = rawOrderCode ? Number(rawOrderCode) : null;

  return {
    orderCode: Number.isFinite(parsedOrderCode) ? parsedOrderCode : null,
    tenantId: localStorage.getItem(PENDING_ORDER_TENANT_KEY),
    checkoutUrl: localStorage.getItem(PENDING_CHECKOUT_URL_KEY),
  };
}

function isSamePendingPaymentContext(
  left: PendingPaymentContext,
  right: PendingPaymentContext,
): boolean {
  return (
    left.orderCode === right.orderCode &&
    left.tenantId === right.tenantId &&
    left.checkoutUrl === right.checkoutUrl
  );
}

function emitPendingPaymentContextChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(PENDING_PAYMENT_CONTEXT_EVENT));
}

export function getPendingPaymentContext(): PendingPaymentContext {
  const nextSnapshot = readPendingPaymentContext();

  if (isSamePendingPaymentContext(cachedPendingPaymentContext, nextSnapshot)) {
    return cachedPendingPaymentContext;
  }

  cachedPendingPaymentContext = nextSnapshot;
  return cachedPendingPaymentContext;
}

export function savePendingPaymentContext(input: {
  orderCode?: number | null;
  tenantId?: string | null;
  checkoutUrl?: string | null;
}) {
  if (typeof window === 'undefined') return;

  if (input.orderCode !== undefined) {
    if (input.orderCode === null) {
      localStorage.removeItem(PENDING_ORDER_KEY);
    } else {
      localStorage.setItem(PENDING_ORDER_KEY, String(input.orderCode));
    }
  }

  if (input.tenantId !== undefined) {
    if (input.tenantId) {
      localStorage.setItem(PENDING_ORDER_TENANT_KEY, input.tenantId);
    } else {
      localStorage.removeItem(PENDING_ORDER_TENANT_KEY);
    }
  }

  if (input.checkoutUrl !== undefined) {
    if (input.checkoutUrl) {
      localStorage.setItem(PENDING_CHECKOUT_URL_KEY, input.checkoutUrl);
    } else {
      localStorage.removeItem(PENDING_CHECKOUT_URL_KEY);
    }
  }

  emitPendingPaymentContextChange();
}

export function clearPendingPaymentContext() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(PENDING_ORDER_KEY);
  localStorage.removeItem(PENDING_ORDER_TENANT_KEY);
  localStorage.removeItem(PENDING_CHECKOUT_URL_KEY);
  emitPendingPaymentContextChange();
}

function subscribePendingPaymentContext(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleChange = () => onStoreChange();

  window.addEventListener('storage', handleChange);
  window.addEventListener('focus', handleChange);
  window.addEventListener(PENDING_PAYMENT_CONTEXT_EVENT, handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener('focus', handleChange);
    window.removeEventListener(PENDING_PAYMENT_CONTEXT_EVENT, handleChange);
  };
}

export function usePendingPaymentContext() {
  return useSyncExternalStore(
    subscribePendingPaymentContext,
    getPendingPaymentContext,
    () => EMPTY_PENDING_PAYMENT_CONTEXT,
  );
}
