'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { AuthLayout } from '../components/layout/auth-layout';
import { ResetPasswordForm } from '../components/reset-password-form';

export function ResetPasswordPage() {
  const tBranding = useTranslations('auth.branding');
  const tCommon = useTranslations('common.loading');

  return (
    <AuthLayout
      brandingHeading={tBranding('resetPasswordHeading')}
      brandingDescription={tBranding('resetPasswordDescription')}
      showTrustBadges={false}
    >
      <Suspense
        fallback={
          <div className="text-muted-foreground py-10 text-center">{tCommon('generic')}</div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
