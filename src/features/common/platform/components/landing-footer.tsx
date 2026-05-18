'use client';

import { useTranslations } from 'next-intl';
import { Network } from 'lucide-react';

export function LandingFooter() {
  const t = useTranslations('landing.footer');

  return (
    <footer className="border-t py-10">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-6 text-center lg:px-8">
        <div className="flex items-center gap-2">
          <Network className="text-primary h-4 w-4" />
          <p className="text-muted-foreground text-xs">{t('copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
