'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ROUTES } from '@/common/constant/routes';
import { PageContainer } from '@/components/layout';
import { PageHeader } from '@/components/layout/page-header';
import { useProfile } from '@/features/common/profile/query/use-profile';
import { ProfileOverviewSidebar } from './profile-overview-sidebar';
import { ProfilePersonalInfoCard } from './profile-personal-info-card';
import { ProfileSecurityCard } from './profile-security-card';

export function ProfilePage() {
  const t = useTranslations('profile.page');
  const params = useParams<{ tenant?: string }>();
  const tenantId = typeof params.tenant === 'string' ? params.tenant : null;
  const profileQuery = useProfile();
  const profile = profileQuery.data;
  const breadcrumbs = tenantId
    ? [
        { label: t('dashboardCrumb'), href: ROUTES.tenant.dashboard(tenantId) },
        { label: t('profileCrumb') },
      ]
    : [
        { label: t('dashboardCrumb'), href: ROUTES.dashboard },
        { label: t('profileCrumb') },
      ];

  return (
    <PageContainer contained={false}>
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={breadcrumbs}
      />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <ProfileOverviewSidebar profile={profile} />

        <div className="space-y-6">
          <ProfilePersonalInfoCard
            key={profile?.updatedAt ?? profile?.id ?? 'profile-empty'}
            profile={profile}
          />
          <ProfileSecurityCard email={profile?.email} />
        </div>
      </div>
    </PageContainer>
  );
}
