'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { VerifyEmailView } from '../components/verify-email-view';

export function VerifyEmailPage() {
  const tBranding = useTranslations('auth.branding');
  const tVerify = useTranslations('auth.verifyEmail');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 flex w-full max-w-4xl justify-end">
        <LanguageSwitcher triggerClassName="w-36" />
      </div>

      <Link href="/" className="mb-8 flex items-center gap-3">
        <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-xl">
          <MessageSquare className="h-6 w-6" />
        </div>
        <span className="text-2xl font-bold">{tBranding('logo')}</span>
      </Link>

      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div className="text-muted-foreground py-10 text-center">
              {tVerify('pageLoading')}
            </div>
          }
        >
          <VerifyEmailView />
        </Suspense>
      </div>

      <p className="text-muted-foreground mt-8 text-sm">{tBranding('footer')}</p>
    </div>
  );
}
