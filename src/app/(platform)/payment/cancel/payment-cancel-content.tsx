'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  clearPendingPaymentContext,
  getPendingPaymentContext,
} from '@/features/common/billing/lib/pending-payment-context';
import { BillingService } from '@/services/billing/billing.service';
import { useAppSelector } from '@/store';
import { ROUTES } from '@/common/constant/routes';

export function PaymentCancelContent() {
  const t = useTranslations('billing.paymentCancel');
  const searchParams = useSearchParams();
  const [pendingPayment] = useState(getPendingPaymentContext);
  const orderCode =
    searchParams.get('orderCode') ??
    (pendingPayment.orderCode ? String(pendingPayment.orderCode) : null);
  const tenantId = pendingPayment.tenantId;
  const [done, setDone] = useState(() => !orderCode || !tenantId);

  const tenantSlug = useAppSelector((state) => state.app.tenantSlug ?? '');
  const billingTenantSlug =
    tenantSlug || searchParams.get('tenant') || pendingPayment.tenantId || '';
  const billingHref = billingTenantSlug
    ? ROUTES.tenant.billing(billingTenantSlug)
    : ROUTES.dashboard;

  useEffect(() => {
    if (!orderCode || !tenantId) return;

    void (async () => {
      try {
        const svc = new BillingService({ tenantId });
        await svc.cancelPayment(Number(orderCode));
      } catch {
        // Payment may already be cancelled or expired — ignore
      } finally {
        clearPendingPaymentContext();
        setDone(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!done) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          {t('loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-2">
          <XCircle className="text-muted-foreground mx-auto mb-2 size-12" />
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">{t('description')}</p>
          <Button asChild className="w-full">
            <Link href={billingHref}>{t('backToBilling')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
