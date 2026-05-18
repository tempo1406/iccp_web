'use client';

import { useTranslations } from 'next-intl';
import { LandingHowRagWorks } from './landing-how-rag-works';

export function LandingRagEngineSection() {
  const t = useTranslations('landing.rag');

  return (
    <section id="rag-engine" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="border-border bg-muted/50 text-primary mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-primary relative inline-flex h-2 w-2 rounded-full" />
            </span>
            {t('badge')}
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            {t('titleBefore')}{' '}
            <span className="from-primary bg-gradient-to-r to-cyan-400 bg-clip-text text-transparent">
              {t('titleHighlight')}
            </span>{' '}
            {t('titleAfter')}
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-2xl">{t('description')}</p>
        </div>
        <LandingHowRagWorks />
      </div>
    </section>
  );
}
