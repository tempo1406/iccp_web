'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from '@/lib/toast';
import { useAppDispatch } from '@/store';
import { setPendingEmail } from '../../../store/slices/auth/auth.slice';
import { ROUTES } from '@/common/constant/routes';
import type { RegisterInput } from '../validation/auth.schema';
import { useRegisterMutation } from '../query';

export function useRegister() {
  const t = useTranslations('auth.toasts.register');
  const router = useRouter();
  const dispatch = useAppDispatch();

  const mutation = useRegisterMutation({
    onSuccess: (_data, variables) => {
      dispatch(setPendingEmail(variables.email));
      toast.success(t('success'));
      router.push(`${ROUTES.verifyEmail}?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (error: Error) => {
      const msg = error.message.toLowerCase();
      if (msg.includes('email') && msg.includes('exist')) {
        toast.danger(t('emailExists'));
      } else {
        toast.danger(error.message || t('generic'));
      }
    },
  });

  const register = (input: RegisterInput) => {
    const nameParts = input.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.slice(1).join(' ') || firstName;
    mutation.mutate({
      email: input.email,
      password: input.password,
      firstName,
      lastName,
    });
  };

  return {
    register,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
