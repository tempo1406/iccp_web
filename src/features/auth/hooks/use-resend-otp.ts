'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from '@/lib/toast';
import { useResendOtpMutation } from '../query';

const RESEND_COOLDOWN_SECONDS = 60;

export interface UseResendOtpOptions {
  onResendSuccess?: () => void;
}

export function useResendOtp(options: UseResendOtpOptions = {}) {
  const t = useTranslations('auth.toasts.resendOtp');
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback(() => setCooldown(RESEND_COOLDOWN_SECONDS), []);

  useEffect(() => {
    if (cooldown <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cooldown]);

  const mutation = useResendOtpMutation({
    onSuccess: () => {
      toast.success(t('success'));
      startCooldown();
      options.onResendSuccess?.();
    },
    onError: (error: Error) => {
      const msg = error.message.toLowerCase();
      if (msg.includes('u009') || msg.includes('already verified')) {
        toast.infor(t('alreadyVerified'));
      } else {
        toast.danger(error.message || t('generic'));
      }
    },
  });

  return {
    resendOtp: (email: string) => {
      if (cooldown > 0 || mutation.isPending) return;
      mutation.mutate({ email });
    },
    isPending: mutation.isPending,
    canResend: cooldown === 0 && !mutation.isPending,
    cooldownSeconds: cooldown,
  };
}
