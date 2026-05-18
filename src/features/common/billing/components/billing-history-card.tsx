'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useServiceContext } from '@/lib/use-service-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import {
  savePendingPaymentContext,
  usePendingPaymentContext,
} from '../lib/pending-payment-context';
import { useMyInvoices } from '../query/use-billing';
import type { InvoiceDto, InvoiceStatus } from '@/services/billing/types/billing.types';

function resolveLocale(locale: string): string {
  return locale.startsWith('vi') ? 'vi-VN' : 'en-US';
}

function formatVnd(amount: number, locale: string, currency = 'VND'): string {
  return new Intl.NumberFormat(resolveLocale(locale), { style: 'currency', currency }).format(amount);
}

function invoiceStatusClass(status: InvoiceStatus): string {
  switch (status) {
    case 'paid':
      return 'bg-emerald-500/10 text-emerald-600';
    case 'pending':
      return 'bg-amber-500/10 text-amber-600';
    case 'overdue':
      return 'bg-red-500/10 text-red-500';
    case 'cancelled':
      return 'bg-muted text-muted-foreground';
  }
}

function invoiceStatusLabel(status: InvoiceStatus, t: (key: string) => string): string {
  switch (status) {
    case 'paid':
      return t('statusLabel.paid');
    case 'pending':
      return t('statusLabel.pending');
    case 'overdue':
      return t('statusLabel.overdue');
    case 'cancelled':
      return t('statusLabel.cancelled');
  }
}

export function BillingHistoryCard() {
  const t = useTranslations('billing.history');
  const locale = useLocale();
  const ctx = useServiceContext();
  const invoicesQuery = useMyInvoices({ limit: 10 });
  const invoices = invoicesQuery.data?.data ?? [];
  const pendingPayment = usePendingPaymentContext();
  const resumablePendingInvoiceId =
    invoices.find(
      (invoice) =>
        invoice.status === 'pending' && (invoice.checkoutUrl ?? pendingPayment.checkoutUrl),
    )?.id ?? null;

  function handlePayNow(invoice: InvoiceDto) {
    const checkoutUrl = invoice.checkoutUrl ?? pendingPayment.checkoutUrl;
    if (!checkoutUrl) return;

    savePendingPaymentContext({
      orderCode: invoice.orderCode ?? pendingPayment.orderCode,
      tenantId: ctx.tenantId ?? pendingPayment.tenantId ?? null,
      checkoutUrl,
    });

    window.location.assign(checkoutUrl);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('title')}</CardTitle>
        {invoicesQuery.data && (
          <p className="text-muted-foreground text-sm">
            {t('invoiceCount', { count: invoicesQuery.data.meta.total })}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {invoicesQuery.isPending ? (
          <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
            <Loader2 className="size-4 animate-spin" />
            {t('loading')}
          </div>
        ) : invoicesQuery.isError ? (
          <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
            <AlertCircle className="size-4" />
            {t('loadFailed')}
          </div>
        ) : invoices.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            {t('empty')}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('invoice')}</TableHead>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('amount')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="text-right">{t('action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(invoice.issueDate).toLocaleDateString(resolveLocale(locale))}
                  </TableCell>
                  <TableCell>{formatVnd(invoice.totalAmount, locale, invoice.currency)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={invoiceStatusClass(invoice.status)}
                    >
                      {invoiceStatusLabel(invoice.status, t)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {invoice.id === resumablePendingInvoiceId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePayNow(invoice)}
                      >
                        <ExternalLink className="mr-1.5 size-3.5" />
                        {t('payNow')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
