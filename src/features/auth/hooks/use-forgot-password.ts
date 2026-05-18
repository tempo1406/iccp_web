'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from '@/lib/toast';
import { useAppDispatch } from '@/store';
import { setPendingEmail } from '../../../store/slices/auth/auth.slice';
import { ROUTES } from '@/common/constant/routes';
import type { ForgotPasswordInput } from '../validation/auth.schema';
import { useForgotPasswordMutation } from '../query';

export function useForgotPassword() {
  const t = useTranslations('auth.toasts.forgotPassword');
  const router = useRouter();
  const dispatch = useAppDispatch();

  const mutation = useForgotPasswordMutation({
    onSuccess: (_data, variables) => {
      dispatch(setPendingEmail(variables.email));
      router.push(`${ROUTES.resetPassword}?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (error: Error) => {
      const msg = error.message.toLowerCase();
      if (msg.includes('not found') || msg.includes('not exist')) {
        toast.danger(t('emailNotFound'));
      } else {
        toast.danger(error.message || t('generic'));
      }
    },
  });

  return {
    forgotPassword: (input: ForgotPasswordInput) => mutation.mutate({ email: input.email }),
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  };
}
