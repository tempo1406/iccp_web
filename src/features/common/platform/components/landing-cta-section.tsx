'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';
import { useRequestAccessMutation } from '../query/use-request-access';

export function LandingCtaSection() {
  const t = useTranslations('landing.cta');
  const requestAccessMutation = useRequestAccessMutation();
  const [email, setEmail] = useState('');

  const handleSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

    if (!isValidEmail) {
      toast.warning(t('invalidEmail'));
      return;
    }

    const result = await requestAccessMutation.mutateAsync(normalizedEmail);

    if (!result.ok) {
      toast.danger(result.error.message || t('submitError'));
      return;
    }

    setEmail('');
    toast.success(t('submitSuccess'), t('submitSuccessDescription'));
  };

  return (
    <section id="contact" className="scroll-mt-24 pb-24">
      <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
        <Card className="border-primary/20 from-primary/10 to-card bg-gradient-to-b">
          <CardContent className="space-y-6 p-8 sm:p-10">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('title')}</h2>
            <p className="text-muted-foreground">{t('description')}</p>
            <div className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row">
              <Input
                type="email"
                placeholder={t('inputPlaceholder')}
                className="bg-background"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={requestAccessMutation.isPending}
                autoComplete="email"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleSubmit();
                  }
                }}
              />
              <Button
                className="whitespace-nowrap"
                onClick={() => void handleSubmit()}
                disabled={requestAccessMutation.isPending}
              >
                {requestAccessMutation.isPending ? t('submitting') : t('submit')}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">{t('footer')}</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
