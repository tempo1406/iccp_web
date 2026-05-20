'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROUTES } from '@/common/constant/routes';
import { createForgotPasswordSchema } from '../validation/auth.schema';
import type { ForgotPasswordInput } from '../validation/auth.schema';
import { useForgotPassword } from '../hooks/use-forgot-password';

export function ForgotPasswordForm() {
  const t = useTranslations('auth.forgotPassword');
  const tValidation = useTranslations('auth.validation');
  const { forgotPassword, isPending } = useForgotPassword();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(createForgotPasswordSchema(tValidation)) as any,
    defaultValues: { email: '' },
  });

  return (
    <Card className="border-0 shadow-none lg:border lg:shadow-sm">
      <CardHeader className="space-y-1 text-center lg:text-left">
        <CardTitle className="text-3xl font-bold tracking-tight">{t('title')}</CardTitle>
        <CardDescription className="text-base">{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((v) => forgotPassword(v))}
        >
          <div className="space-y-2">
            <Label htmlFor="email">{t('emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('emailPlaceholder')}
              className="h-12"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-destructive text-sm">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="mt-2 h-12 w-full bg-[#1337ec] hover:bg-[#0f2cb8]"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('submitting')}
              </>
            ) : (
              t('submit')
            )}
          </Button>
        </form>

        <p className="text-muted-foreground text-center text-sm">
          {t('loginPrompt')}{' '}
          <Link
            href={ROUTES.login}
            className="font-semibold text-[#1337ec] hover:text-[#0f2cb8]"
          >
            {t('loginLink')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
