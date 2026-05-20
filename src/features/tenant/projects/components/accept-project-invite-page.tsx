'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AlertTriangle, CheckCircle2, Loader2, LogIn, RefreshCw } from 'lucide-react';
import { ROUTES } from '@/common/constant/routes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { authTokens } from '@/services/local-storage/auth.storage';
import { useAcceptProjectInviteFlow } from '../hooks/use-accept-project-invite';

const PROJECT_INVITE_TOKEN_KEY = 'project_invite_accept_token';
const REDIRECT_DELAY_MS = 1800;

function getFriendlyError(
  message: string | null,
  t: ReturnType<typeof useTranslations<'project.inviteAccept'>>,
): string {
  if (!message) return t('errors.invalidOrExpired');

  const normalized = message.toLowerCase();
  if (normalized.includes('expired')) {
    return t('errors.expired');
  }

  if (normalized.includes('invalid') || normalized.includes('token')) {
    return t('errors.invalid');
  }

  if (normalized.includes('sign in')) {
    return t('errors.signInRequired');
  }

  return message;
}

export function AcceptProjectInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('project.inviteAccept');
  const attemptedTokenRef = useRef<string | null>(null);
  const redirectPathRef = useRef(`${ROUTES.dashboard}?projectInvite=accepted`);
  const [isAcceptedState, setIsAcceptedState] = useState(false);

  const { acceptProjectInvite, isAccepting, hasAcceptError, acceptErrorMessage } =
    useAcceptProjectInviteFlow();

  const queryToken = useMemo(() => (searchParams.get('token') ?? '').trim(), [searchParams]);
  const queryOrgId = useMemo(() => (searchParams.get('orgId') ?? '').trim(), [searchParams]);
  const queryProjectSlug = useMemo(
    () => (searchParams.get('projectSlug') ?? '').trim(),
    [searchParams],
  );

  const resolvedToken = useMemo(() => {
    if (queryToken.length > 0) return queryToken;
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem(PROJECT_INVITE_TOKEN_KEY)?.trim() ?? '';
  }, [queryToken]);

  const hasAccessToken = typeof window !== 'undefined' && Boolean(authTokens.getAccess());
  const normalizedToken = resolvedToken.trim();
  const isTokenMissing = normalizedToken.length === 0;
  const shouldRedirectToLogin = !isTokenMissing && !hasAccessToken;
  const hasErrorState = isTokenMissing || hasAcceptError;
  const isProcessing =
    !isTokenMissing &&
    hasAccessToken &&
    !isAcceptedState &&
    (isAccepting || !hasAcceptError);

  const loginRedirectUrl = useMemo(() => {
    const params = new URLSearchParams({ token: normalizedToken });
    if (queryOrgId) {
      params.set('orgId', queryOrgId);
    }
    if (queryProjectSlug) {
      params.set('projectSlug', queryProjectSlug);
    }

    return `${ROUTES.projectInviteAccept}?${params.toString()}`;
  }, [normalizedToken, queryOrgId, queryProjectSlug]);

  const displayError = useMemo(
    () =>
      getFriendlyError(
        isTokenMissing ? t('errors.missingToken') : acceptErrorMessage,
        t,
      ),
    [acceptErrorMessage, isTokenMissing, t],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!queryToken) return;
    sessionStorage.setItem(PROJECT_INVITE_TOKEN_KEY, queryToken);
  }, [queryToken]);

  const runAccept = useCallback(
    async (rawToken: string) => {
      const result = await acceptProjectInvite(rawToken);
      if (!result.ok) {
        setIsAcceptedState(false);
        return;
      }

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(PROJECT_INVITE_TOKEN_KEY);
      }

      const redirectUrl =
        queryOrgId && queryProjectSlug
          ? ROUTES.tenant.project(queryOrgId, queryProjectSlug)
          : `${ROUTES.dashboard}?projectInvite=accepted`;

      redirectPathRef.current = redirectUrl;
      void router.prefetch(redirectUrl);
      setIsAcceptedState(true);
    },
    [acceptProjectInvite, queryOrgId, queryProjectSlug, router],
  );

  useEffect(() => {
    if (!shouldRedirectToLogin) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }

    sessionStorage.setItem(PROJECT_INVITE_TOKEN_KEY, normalizedToken);

    const redirectTimer = window.setTimeout(() => {
      router.replace(`${ROUTES.login}?redirect=${encodeURIComponent(loginRedirectUrl)}`);
    }, REDIRECT_DELAY_MS);

    return () => window.clearTimeout(redirectTimer);
  }, [loginRedirectUrl, normalizedToken, router, shouldRedirectToLogin]);

  useEffect(() => {
    if (isTokenMissing) {
      return;
    }
    if (!hasAccessToken) {
      return;
    }
    if (attemptedTokenRef.current === normalizedToken) {
      return;
    }

    attemptedTokenRef.current = normalizedToken;
    void runAccept(normalizedToken);
  }, [hasAccessToken, isTokenMissing, normalizedToken, runAccept]);

  useEffect(() => {
    if (!isAcceptedState) {
      return;
    }

    const redirectTimer = window.setTimeout(() => {
      router.replace(redirectPathRef.current);
    }, REDIRECT_DELAY_MS);

    return () => window.clearTimeout(redirectTimer);
  }, [isAcceptedState, router]);

  return (
    <div className="relative flex min-h-screen min-h-[100dvh] w-full items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),transparent_45%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.1),transparent_50%)]" />
      <div className="pointer-events-none absolute -top-24 right-1/4 -z-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/5 -z-10 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

      {isAcceptedState ? (
        <div className="animate-in fade-in zoom-in-95 w-full max-w-md rounded-3xl border border-emerald-200/40 bg-background/90 px-8 py-9 text-center shadow-2xl backdrop-blur-xl">
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-lg shadow-emerald-500/25">
            <span className="absolute inset-0 rounded-full border border-emerald-300/60" />
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t('success.title')}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {t('success.description')}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t('success.badge')}
          </div>
        </div>
      ) : (
        <Card className="w-full max-w-xl rounded-3xl border border-slate-200/70 bg-background/80 shadow-xl backdrop-blur-xl dark:border-slate-800/70">
          <CardHeader>
            <CardTitle className="text-2xl">
              {shouldRedirectToLogin
                ? t('card.signInTitle')
                : hasErrorState
                  ? t('card.errorTitle')
                  : t('card.processingTitle')}
            </CardTitle>
            <CardDescription>
              {shouldRedirectToLogin
                ? t('card.signInDescription')
                : hasErrorState
                  ? t('card.errorDescription')
                  : t('card.processingDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {shouldRedirectToLogin && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>{t('alerts.redirectTitle')}</AlertTitle>
                <AlertDescription>{t('alerts.redirectDescription')}</AlertDescription>
              </Alert>
            )}

            {isProcessing && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>{t('alerts.processingTitle')}</AlertTitle>
                <AlertDescription>{t('alerts.processingDescription')}</AlertDescription>
              </Alert>
            )}

            {hasErrorState && !shouldRedirectToLogin && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('alerts.failedTitle')}</AlertTitle>
                <AlertDescription>{displayError}</AlertDescription>
              </Alert>
            )}

            {(hasErrorState || shouldRedirectToLogin) && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {!isTokenMissing && !shouldRedirectToLogin && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void runAccept(normalizedToken)}
                    disabled={isAccepting}
                  >
                    {isAccepting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {t('actions.retry')}
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={() =>
                    shouldRedirectToLogin
                      ? router.push(
                          `${ROUTES.login}?redirect=${encodeURIComponent(loginRedirectUrl)}`,
                        )
                      : router.push(ROUTES.login)
                  }
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {t('actions.signInAnother')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
