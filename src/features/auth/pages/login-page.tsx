'use client';

import { useTranslations } from 'next-intl';
import { AuthLayout } from '../components/layout/auth-layout';
import { LoginForm } from '../components/login-form';

export function LoginPage() {
  const t = useTranslations('auth.branding');

  return (
    <AuthLayout
      brandingHeading={t('loginHeading')}
      brandingFeatures={[
        t('loginFeatureOne'),
        t('loginFeatureTwo'),
        t('loginFeatureThree'),
      ]}
      showTrustBadges={true}
    >
      <LoginForm />
    </AuthLayout>
  );
}
