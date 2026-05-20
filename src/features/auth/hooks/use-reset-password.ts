'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/common/constant/routes';
import type { ResetPasswordInput } from '../validation/auth.schema';
import { useResetPasswordMutation } from '../query';

export function useResetPassword() {
  const t = useTranslations('auth.toasts.resetPassword');
  const router = useRouter();

  const mutation = useResetPasswordMutation({
    onSuccess: () => {
      toast.success(t('success'));
      router.push(ROUTES.login);
    },
    onError: (error: Error) => {
      const msg = error.message.toLowerCase();
      if (msg.includes('u008') || msg.includes('otp') || msg.includes('expired')) {
        return;
      }
      toast.danger(error.message || t('generic'));
    },
  });

  return {
    resetPassword: (input: ResetPasswordInput) =>
      mutation.mutate({
        email: input.email,
        otp: input.otp,
        newPassword: input.newPassword,
      }),
    isPending: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
}
