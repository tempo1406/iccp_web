'use client';

import { useTranslations } from 'next-intl';
import { Zap, Brain, BadgeCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  { key: 'instantIngestion', icon: Zap },
  { key: 'contextualAwareness', icon: Brain },
  { key: 'verifiableCitations', icon: BadgeCheck },
] as const;

export function LandingFeaturesSection() {
  const t = useTranslations('landing.features');

  return (
    <section id="capabilities" className="bg-muted/30 scroll-mt-24 border-y py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-primary mb-3 text-sm font-semibold tracking-[0.18em] uppercase">
            {t('eyebrow')}
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">{t('title')}</h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-2xl">{t('description')}</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.key} className="border-border/60 bg-card/70">
              <CardContent className="p-8">
                <div className="bg-primary/15 text-primary mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-xl font-bold">{t(`cards.${feature.key}.title`)}</h3>
                <p className="text-muted-foreground">{t(`cards.${feature.key}.description`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
