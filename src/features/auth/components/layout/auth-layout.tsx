'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import React from 'react';
import { useTranslations } from 'next-intl';
import { GuestGuard } from '@/components/auth/guest-guard';
import { LanguageSwitcher } from '@/components/shared/language-switcher';

interface AuthLayoutProps {
  children: React.ReactNode;
  brandingHeading: React.ReactNode;
  brandingDescription?: React.ReactNode;
  brandingFeatures?: string[];
  showTrustBadges?: boolean;
}

export function AuthLayout({
  children,
  brandingHeading,
  brandingDescription,
  brandingFeatures,
}: AuthLayoutProps) {
  const t = useTranslations('auth.branding');

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYkava-jqgvXJD87IGjO3DnB_eEWJ70JC4NSUiRh3mEOFnhblR51HtumKb9Hd82_CHCEnAPgLeLVk2CzpRnzTQKkmK7Qfvh0IcFJiU_z6YDTS4SSy9OkKcoIx15v5VOpyu_dwAFxVasGRiXlEw3ge3zv-tnbRk_TT_-VhyEjAk0v0hzKRixAE0S-JsIIGpgakE7_JdEJ7ZVz0BgGsYIFALzs6Jumc6QW_9rVyT2poKsZd-RoBD8AvWy6GyPH14dSn5GJE2w8u-GDY"
            alt={t('backgroundAlt')}
            fill
            className="object-cover opacity-90"
            unoptimized
          />
          <div
            className="absolute inset-0 bg-linear-to-t from-[#1337ec]/90 to-[#1337ec]/40"
            style={{ mixBlendMode: 'multiply' }}
          />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/30 bg-white/20 text-white backdrop-blur-sm">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              {t('logo')}
            </span>
          </Link>
        </div>

        <div className="relative z-10 mb-12 max-w-lg space-y-8">
          <div>
            <h1 className="mb-6 text-4xl leading-tight font-bold tracking-tight text-white">
              {brandingHeading}
            </h1>

            {brandingDescription && (
              <p className="text-lg text-white/80">{brandingDescription}</p>
            )}

            {brandingFeatures && brandingFeatures.length > 0 && (
              <div className="space-y-4">
                {brandingFeatures.map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <span className="mt-1 text-white/80">✓</span>
                    <p className="text-lg font-bold text-white/90">{text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm font-medium text-white/60">{t('footer')}</p>
        </div>
      </div>

      <div className="flex w-full flex-col px-4 lg:w-1/2 lg:px-12">
        <div className="flex justify-end py-6 lg:py-8">
          <LanguageSwitcher triggerClassName="w-36" />
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
              <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-xl">
                <MessageSquare className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold">{t('logo')}</span>
            </div>

            <GuestGuard>{children}</GuestGuard>
          </div>
        </div>
      </div>
    </div>
  );
}
