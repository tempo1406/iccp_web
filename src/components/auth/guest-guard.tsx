'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authTokens } from '@/services/local-storage/auth.storage';
import { ROUTES } from '@/common/constant/routes';

/**
 * GuestGuard ensures that only UNauthenticated users can access the route.
 * If the user IS logged in (has accessToken), they are redirected to /dashboard (or /).
 * Use this for wrapping pages like /login, /register, etc.
 */
export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isBrowser = typeof window !== 'undefined';
  const hasToken = Boolean(authTokens.getAccess());

  useEffect(() => {
    if (hasToken) {
      router.replace(ROUTES.dashboard);
    }
  }, [hasToken, router]);

  // Avoid flashing guest pages during server render/hydration redirect check.
  if (!isBrowser || hasToken) {
    return null;
  }

  return <>{children}</>;
}
