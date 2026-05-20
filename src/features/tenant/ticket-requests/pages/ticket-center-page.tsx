'use client';

import { useTranslations } from 'next-intl';
import { ROUTES } from '@/common/constant/routes';
import { PageHeader } from '@/components/layout';
import { useTenant } from '@/providers';
import { TicketRequestsWorkspace } from '../components/ticket-requests-workspace';

interface TicketCenterPageProps {
  initialTab?: 'list' | 'create';
}

export function TicketCenterPage({ initialTab = 'list' }: TicketCenterPageProps) {
  const { tenantSlug } = useTenant();
  const t = useTranslations('ticket');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pages.center.title')}
        description={t('pages.center.description')}
        breadcrumbs={[
          { label: t('common.dashboard'), href: ROUTES.tenant.dashboard(tenantSlug) },
          { label: t('common.ticket') },
        ]}
      />

      <TicketRequestsWorkspace initialWorkspaceTab={initialTab} />
    </div>
  );
}
