'use client';

import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import { authTokens } from '@/services/local-storage/auth.storage';
import { useAppDispatch } from '@/store';
import { logoutUser } from '../../../store/slices/auth/auth.slice';
import { ROUTES } from '@/common/constant/routes';
import { useLogoutMutation } from '../query';

export function useLogout() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const mutation = useLogoutMutation({
    onSuccess: () => {
      authTokens.clear();
      dispatch(logoutUser());
      router.push(ROUTES.login);
      toast.success('Signed out successfully');
    },
    onError: () => {
      authTokens.clear();
      dispatch(logoutUser());
      router.push(ROUTES.login);
    },
  });

  return {
    logout: () => mutation.mutate(),
    isPending: mutation.isPending,
  };
}
