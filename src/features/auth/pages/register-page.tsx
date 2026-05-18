'use client';

import { useTranslations } from 'next-intl';
import { AuthLayout } from '../components/layout/auth-layout';
import { RegisterForm } from '../components/register-form';

export function RegisterPage() {
  const t = useTranslations('auth.branding');

  return (
    <AuthLayout
      brandingHeading={t('registerHeading')}
      brandingDescription={t('registerDescription')}
      showTrustBadges={false}
    >
      <RegisterForm />
    </AuthLayout>
  );
}
