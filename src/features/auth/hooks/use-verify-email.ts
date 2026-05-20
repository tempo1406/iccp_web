'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/common/constant/routes';
import type { VerifyEmailInput } from '../validation/auth.schema';
import { useVerifyEmailMutation } from '../query';

export function useVerifyEmail() {
  const t = useTranslations('auth.toasts.verifyEmail');
  const router = useRouter();

  const mutation = useVerifyEmailMutation({
    onSuccess: () => {
      toast.success(t('success'));
      router.push(ROUTES.login);
    },
    onError: (error: Error) => {
      const msg = error.message.toLowerCase();
      if (msg.includes('u009') || msg.includes('already verified')) {
        toast.infor(t('alreadyVerified'));
        router.push(ROUTES.login);
      }
    },
  });

  return {
    verifyEmail: (input: VerifyEmailInput) =>
      mutation.mutate({ email: input.email, otp: input.otp }),
    isPending: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
}
