'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  clearPendingPaymentContext,
  getPendingPaymentContext,
} from '@/features/common/billing/lib/pending-payment-context';
import { BillingService } from '@/services/billing/billing.service';
import { useAppSelector } from '@/store';
import { ROUTES } from '@/common/constant/routes';
import type { PaymentLinkStatus } from '@/services/billing/types/billing.types';

export function PaymentSuccessContent() {
  const t = useTranslations('billing.paymentSuccess');
  const searchParams = useSearchParams();
  const orderCode = searchParams.get('orderCode');
  const [pendingPayment] = useState(getPendingPaymentContext);
  const resolvedOrderCode =
    orderCode ?? (pendingPayment.orderCode ? String(pendingPayment.orderCode) : null);
  const [status, setStatus] = useState<PaymentLinkStatus | 'loading'>('loading');

  const tenantSlug = useAppSelector((state) => state.app.tenantSlug ?? '');
  const billingTenantSlug =
    tenantSlug || searchParams.get('tenant') || pendingPayment.tenantId || '';
  const billingHref = billingTenantSlug
    ? ROUTES.tenant.billing(billingTenantSlug)
    : ROUTES.dashboard;

  useEffect(() => {
    if (!resolvedOrderCode) return;

    const tenantId = pendingPayment.tenantId;

    void (async () => {
      try {
        const svc = new BillingService({ tenantId });
        const result = await svc.confirmPayment(Number(resolvedOrderCode));
        clearPendingPaymentContext();
        setStatus(result.status);
      } catch {
        setStatus('CANCELLED');
      }
    })();
  }, [pendingPayment.tenantId, resolvedOrderCode]);

  const effectiveStatus = resolvedOrderCode ? status : 'CANCELLED';

  if (effectiveStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-2">
          {effectiveStatus === 'PAID' ? (
            <CheckCircle2 className="mx-auto mb-2 size-12 text-emerald-500" />
          ) : effectiveStatus === 'PENDING' ? (
            <Clock className="text-amber-500 mx-auto mb-2 size-12" />
          ) : (
            <XCircle className="mx-auto mb-2 size-12 text-red-500" />
          )}
          <CardTitle>
            {effectiveStatus === 'PAID'
              ? t('paidTitle')
              : effectiveStatus === 'PENDING'
                ? t('pendingTitle')
                : t('failedTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {effectiveStatus === 'PAID'
              ? t('paidDescription')
              : effectiveStatus === 'PENDING'
                ? t('pendingDescription')
                : t('failedDescription')}
          </p>
          <Button asChild className="w-full">
            <Link href={billingHref}>{t('backToBilling')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
