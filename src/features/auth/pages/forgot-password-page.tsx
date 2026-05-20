'use client';

import { useTranslations } from 'next-intl';
import { AuthLayout } from '../components/layout/auth-layout';
import { ForgotPasswordForm } from '../components/forgot-password-form';

export function ForgotPasswordPage() {
  const t = useTranslations('auth.branding');

  return (
    <AuthLayout
      brandingHeading={t('forgotPasswordHeading')}
      brandingDescription={t('forgotPasswordDescription')}
      showTrustBadges={false}
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
