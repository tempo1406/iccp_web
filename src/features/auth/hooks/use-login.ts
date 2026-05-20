'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from '@/lib/toast';
import { authTokens } from '@/services/local-storage/auth.storage';
import { UsersService } from '@/services/users/users.service';
import { useAppDispatch } from '@/store';
import { setCredentials } from '../../../store/slices/auth/auth.slice';
import { setProfile } from '../../../store/slices/user/user.slice';
import { ROUTES } from '@/common/constant/routes';
import type { LoginInput } from '../validation/auth.schema';
import { useLoginMutation } from '../query';

export interface UseLoginOptions {
  onSuccess?: () => void;
  onEmailNotVerified?: (email: string) => void;
}

export function useLogin(options: UseLoginOptions = {}) {
  const t = useTranslations('auth.toasts.login');
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const getLoginErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('no system role')) return t('noSystemRole');
      if (msg.includes('not verified') || msg.includes('email not verified')) {
        return t('notVerified');
      }
      if (msg.includes('inactive')) return t('inactive');
      if (
        msg.includes('invalid login') ||
        msg.includes('unauthorized') ||
        msg.includes('invalid credentials')
      ) {
        return t('invalidCredentials');
      }
      return error.message || t('generic');
    }
    return t('unexpected');
  };

  const mutation = useLoginMutation({
    onSuccess: async (data, variables) => {
      authTokens.save(data.accessToken, data.refreshToken);
      dispatch(
        setCredentials({
          email: variables.email,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }),
      );

      try {
        const svc = new UsersService({ accessToken: data.accessToken });
        const profile = await svc.getMe();
        if (profile) {
          dispatch(setProfile(profile));
          queryClient.setQueryData(['profile', 'me'], profile);
        }
      } catch (err) {
        console.error('Failed to fetch profile during login:', err);
      }

      options.onSuccess?.();
      router.push(searchParams.get('redirect') || ROUTES.dashboard);
    },
    onError: (error: Error, variables) => {
      toast.danger(getLoginErrorMessage(error));
      const msg = error.message.toLowerCase();
      if (msg.includes('not verified') || msg.includes('email not verified')) {
        options.onEmailNotVerified?.(variables.email);
        router.push(`${ROUTES.verifyEmail}?email=${encodeURIComponent(variables.email)}`);
      }
    },
  });

  return {
    login: (input: LoginInput) =>
      mutation.mutate({ email: input.email, password: input.password }),
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
