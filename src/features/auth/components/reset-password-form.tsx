'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Loader2, KeyRound } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROUTES } from '@/common/constant/routes';
import { createResetPasswordSchema } from '../validation/auth.schema';
import type { ResetPasswordInput } from '../validation/auth.schema';
import { useResetPassword } from '../hooks/use-reset-password';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const t = useTranslations('auth.resetPassword');
  const tValidation = useTranslations('auth.validation');
  const { resetPassword, isPending, isError, error } = useResetPassword();

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(createResetPasswordSchema(tValidation)) as any,
    defaultValues: { email, otp: '', newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (email) form.setValue('email', email);
  }, [email, form]);

  const onSubmit = (values: ResetPasswordInput) => {
    resetPassword(values);
  };

  return (
    <Card className="border-0 shadow-none lg:border lg:shadow-sm">
      <CardHeader className="space-y-1 text-center lg:text-left">
        <div className="mb-2 flex justify-center lg:justify-start">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <KeyRound className="h-7 w-7 text-[#1337ec]" />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight">{t('title')}</CardTitle>
        <CardDescription className="text-base">
          {t.rich('description', {
            email: () => (
              <span className="text-foreground font-medium">
                {email || t('emailFallback')}
              </span>
            ),
          })}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <input type="hidden" {...form.register('email')} />

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="reset-otp">{t('otpLabel')}</Label>
            <Input
              id="reset-otp"
              type="text"
              inputMode="numeric"
              placeholder={t('otpPlaceholder')}
              maxLength={6}
              className="h-12 text-center font-mono text-lg tracking-[0.5em]"
              {...form.register('otp')}
            />
            {form.formState.errors.otp && (
              <p className="text-destructive text-sm">
                {form.formState.errors.otp.message}
              </p>
            )}
            {isError && (
              <p className="text-destructive text-sm">
                {error?.message?.toLowerCase().includes('otp') ||
                error?.message?.includes('U008')
                  ? t('invalidOtp')
                  : (error?.message ?? t('genericError'))}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('newPasswordLabel')}</Label>
            <PasswordInput
              id="newPassword"
              placeholder={t('newPasswordPlaceholder')}
              className="h-12"
              {...form.register('newPassword')}
            />
            {form.formState.errors.newPassword && (
              <p className="text-destructive text-sm">
                {form.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmPasswordLabel')}</Label>
            <PasswordInput
              id="confirmPassword"
              placeholder={t('confirmPasswordPlaceholder')}
              className="h-12"
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-destructive text-sm">
                {form.formState.errors.confirmPassword.message}
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
