'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/layout';
import { ROUTES } from '@/common/constant/routes';
import { useTenant } from '@/providers';

export function BillingPageHeader() {
  const t = useTranslations('billing.header');
  const { tenantId } = useTenant();

  return (
    <PageHeader
      title={t('title')}
      description={t('description')}
      breadcrumbs={[
        { label: t('dashboardCrumb'), href: ROUTES.tenant.dashboard(tenantId) },
        { label: t('billingCrumb') },
      ]}
    />
  );
}
