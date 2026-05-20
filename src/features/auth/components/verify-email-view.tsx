'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Loader2, MailCheck, RefreshCcw, Timer } from 'lucide-react';
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
import { createVerifyEmailSchema } from '../validation/auth.schema';
import type { VerifyEmailInput } from '../validation/auth.schema';
import { useVerifyEmail } from '../hooks/use-verify-email';
import { useResendOtp } from '../hooks/use-resend-otp';

const OTP_TTL_SECONDS = 5 * 60;

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function useOtpCountdown() {
  const [remaining, setRemaining] = useState(OTP_TTL_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRemaining(OTP_TTL_SECONDS);
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [reset]);

  return { remaining, reset, isExpired: remaining === 0 };
}

export function VerifyEmailView() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const t = useTranslations('auth.verifyEmail');
  const tValidation = useTranslations('auth.validation');

  const { verifyEmail, isPending, isError, error } = useVerifyEmail();
  const { remaining, reset: resetCountdown, isExpired } = useOtpCountdown();
  const {
    resendOtp,
    isPending: isResending,
    canResend,
    cooldownSeconds,
  } = useResendOtp({
    onResendSuccess: resetCountdown,
  });

  const form = useForm<VerifyEmailInput>({
    resolver: zodResolver(createVerifyEmailSchema(tValidation)) as any,
    defaultValues: { email, otp: '' },
  });

  useEffect(() => {
    if (email) form.setValue('email', email);
  }, [email, form]);

  const onSubmit = (values: VerifyEmailInput) => {
    verifyEmail(values);
  };

  return (
    <Card className="border-0 shadow-none lg:border lg:shadow-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="mb-2 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <MailCheck className="h-7 w-7 text-[#1337ec]" />
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

      <CardContent className="space-y-5">
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <input type="hidden" {...form.register('email')} />

          <div className="space-y-2">
            <Label htmlFor="otp">{t('otpLabel')}</Label>
            <Input
              id="otp"
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
                {error?.message?.includes('U008') ||
                error?.message?.toLowerCase().includes('otp')
                  ? t('invalidOtp')
                  : (error?.message ?? t('genericError'))}
              </p>
            )}
          </div>

          <div className="text-muted-foreground flex items-center justify-center gap-1.5 text-sm">
            <Timer className="h-4 w-4" />
            {isExpired ? (
              <span className="text-destructive font-medium">{t('otpExpired')}</span>
            ) : (
              <span>
                {t('otpExpires')}{' '}
                <span className="text-foreground font-mono font-semibold">
                  {formatCountdown(remaining)}
                </span>
              </span>
            )}
          </div>

          <Button
            type="submit"
            className="h-12 w-full bg-[#1337ec] hover:bg-[#0f2cb8]"
            disabled={isPending || isExpired}
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

        <div className="text-center">
          <p className="text-muted-foreground text-sm">{t('resendPrompt')}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 text-[#1337ec] hover:text-[#0f2cb8]"
            disabled={!canResend || isResending}
            onClick={() => resendOtp(email)}
          >
            {isResending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                {t('resending')}
              </>
            ) : cooldownSeconds > 0 ? (
              <>
                <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                {t('resendIn', { seconds: cooldownSeconds })}
              </>
            ) : (
              <>
                <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                {t('resend')}
              </>
            )}
          </Button>
        </div>

        <p className="text-muted-foreground text-center text-sm">
          <Link
            href={ROUTES.login}
            className="font-semibold text-[#1337ec] hover:text-[#0f2cb8]"
          >
            {t('backToLogin')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
