'use client';
import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authTokens } from '@/services/local-storage/auth.storage';
import { UsersService } from '@/services/users/users.service';
import { HttpError } from '@/config/http/errors';
import { ROUTES } from '@/common/constant/routes';
import { useAppDispatch } from '@/store';
import {
  setProfile,
  setProfileLoading,
  clearProfile,
} from '@/store/slices/user/user.slice';

/**
 * AuthGuard ensures that only AUTHENTICATED users can access the route.
 * If the user IS NOT logged in, they are redirected to /login.
 * Use this for wrapping protected pages or layouts.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const hasToken = Boolean(authTokens.getAccess());

  // 1. Check token in localStorage first
  useEffect(() => {
    if (!hasToken) {
      dispatch(clearProfile());
      const loginUrl = new URL(ROUTES.login, window.location.origin);
      if (pathname && pathname !== '/') {
        const queryString = searchParams.toString();
        const redirectPath = queryString.length > 0 ? `${pathname}?${queryString}` : pathname;
        loginUrl.searchParams.set('redirect', redirectPath);
      }
      router.replace(loginUrl.pathname + loginUrl.search);
    }
  }, [hasToken, router, pathname, searchParams, dispatch]);

  // 2. Fetch profile if token exists — using UsersService directly
  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => new UsersService({}).getMe(),
    enabled: hasToken,
    retry: false,
  });

  useEffect(() => {
    if (isLoading) {
      dispatch(setProfileLoading(true));
    }

    if (profile) {
      dispatch(setProfile(profile));
    }

    if (isError && error) {
      const isUnauth =
        error instanceof HttpError
          ? error.status === 401
          : error.message?.toLowerCase().includes('unauthorized');

      if (isUnauth) {
        dispatch(clearProfile());
        authTokens.clear();
        router.replace(ROUTES.login);
      }
    }
  }, [profile, isLoading, isError, error, dispatch, router]);

  if (!hasToken || isLoading) {
    return null;
  }

  return <>{children}</>;
}
