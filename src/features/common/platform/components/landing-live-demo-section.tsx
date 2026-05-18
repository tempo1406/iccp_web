'use client';

import { useTranslations } from 'next-intl';
import { LandingLiveDemo3D } from './landing-live-demo-3d';

export function LandingLiveDemoSection() {
  const t = useTranslations('landing.liveDemo');

  return (
    <section id="live-demo" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="text-primary mb-3 text-sm font-semibold tracking-[0.18em] uppercase">
            {t('eyebrow')}
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">{t('title')}</h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-2xl">{t('description')}</p>
        </div>

        <LandingLiveDemo3D />
      </div>
    </section>
  );
}
