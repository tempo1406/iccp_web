
'use client';

import { BillingCurrentPlanUsage } from '@/features/common/billing/components/billing-current-plan-usage';
import { BillingHistoryCard } from '@/features/common/billing/components/billing-history-card';
import { BillingPageHeader } from '@/features/common/billing/components/billing-header';
import { BillingPlansGrid } from '@/features/common/billing/components/billing-plans-grid';
import { BillingRealtimeBridge } from '@/features/common/billing/realtime/billing-realtime-bridge';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';

export default function BillingPage() {
  const canListInvoices = useCan(PERMISSIONS.BILLING_INVOICES_LIST);

  return (
    <div className="space-y-6">
      <BillingRealtimeBridge />
      <BillingPageHeader />
      <BillingCurrentPlanUsage />
      <BillingPlansGrid />
      {canListInvoices ? <BillingHistoryCard /> : null}
    </div>
  );
}
