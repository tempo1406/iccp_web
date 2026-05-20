'use client';

import { useTranslations } from 'next-intl';
import { ROUTES } from '@/common/constant/routes';
import { PageContainer } from '@/components/layout';
import { PageHeader } from '@/components/layout/page-header';
import { CreateOrgForm } from '../components/create-org-form';

export function CreateOrgPage() {
  const t = useTranslations('dashboard.createOrganization');
  const tProfilePage = useTranslations('profile.page');

  return (
    <PageContainer className="space-y-8">
      <PageHeader
        title={t('pageTitle')}
        description={t('pageDescription')}
        breadcrumbs={[
          { label: tProfilePage('dashboardCrumb'), href: ROUTES.dashboard },
          { label: t('breadcrumb') },
        ]}
      />

      <CreateOrgForm />
    </PageContainer>
  );
}
