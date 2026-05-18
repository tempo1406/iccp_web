'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { authTokens } from '@/services/local-storage/auth.storage';
import { useAppSelector } from '@/store';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot() {
  return Boolean(authTokens.getAccess());
}

function getServerSnapshot() {
  return false;
}

export function useLandingAuth() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const hasToken = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return useMemo(
    () => ({
      isLoggedIn: isAuthenticated || hasToken,
    }),
    [isAuthenticated, hasToken],
  );
}
