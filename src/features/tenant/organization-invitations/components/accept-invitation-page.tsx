'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
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
import { useAcceptInvitation } from '../hooks/use-accept-invitation';

function getFriendlyError(
  message: string | null,
  t: ReturnType<typeof useTranslations<'organizationManagement.invitationAccept'>>,
): string {
  if (!message) return t('errors.invalidOrExpired');

  const normalized = message.toLowerCase();
  if (normalized.includes('expired')) {
    return t('errors.expired');
  }

  if (normalized.includes('invalid') || normalized.includes('token')) {
    return t('errors.invalid');
  }

  return message;
}

export function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('organizationManagement.invitationAccept');
  const token = searchParams.get('token') ?? '';
  const attemptedTokenRef = useRef<string | null>(null);
  const redirectPathRef = useRef(`${ROUTES.dashboard}?invite=accepted`);

  const { acceptInvitation, isAccepting, isAccepted, hasAcceptError, acceptErrorMessage } =
    useAcceptInvitation();

  const normalizedToken = token.trim();
  const isTokenMissing = normalizedToken.length === 0;
  const hasErrorState = isTokenMissing || hasAcceptError;
  const isProcessing = !isTokenMissing && (isAccepting || (!hasAcceptError && !isAccepted));

  const displayError = useMemo(
    () => getFriendlyError(isTokenMissing ? t('errors.missingToken') : acceptErrorMessage, t),
    [acceptErrorMessage, isTokenMissing, t],
  );

  const runAccept = useCallback(
    async (rawToken: string) => {
      const result = await acceptInvitation(rawToken);
      if (!result.ok) {
        return;
      }

      const nextSearchParams = new URLSearchParams({ invite: 'accepted' });
      if (result.acceptedOrgId) {
        nextSearchParams.set('inviteOrg', result.acceptedOrgId);
      }
      redirectPathRef.current = `${ROUTES.dashboard}?${nextSearchParams.toString()}`;
      void router.prefetch(redirectPathRef.current);
    },
    [acceptInvitation, router],
  );

  useEffect(() => {
    if (isTokenMissing) {
      return;
    }

    if (attemptedTokenRef.current === normalizedToken) {
      return;
    }

    attemptedTokenRef.current = normalizedToken;
    void runAccept(normalizedToken);
  }, [isTokenMissing, normalizedToken, runAccept]);

  useEffect(() => {
    if (!isAccepted) {
      return;
    }

    const redirectTimer = setTimeout(() => {
      router.replace(redirectPathRef.current);
    }, 1800);

    return () => clearTimeout(redirectTimer);
  }, [isAccepted, router]);

  return (
    <div className="relative flex min-h-screen min-h-[100dvh] w-full items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),transparent_45%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.1),transparent_50%)]" />
      <div className="pointer-events-none absolute -top-24 right-1/4 -z-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/5 -z-10 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

      {isAccepted ? (
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
              {hasErrorState ? t('card.errorTitle') : t('card.processingTitle')}
            </CardTitle>
            <CardDescription>
              {hasErrorState ? t('card.errorDescription') : t('card.processingDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isProcessing && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>{t('alerts.processingTitle')}</AlertTitle>
                <AlertDescription>{t('alerts.processingDescription')}</AlertDescription>
              </Alert>
            )}

            {hasErrorState && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('alerts.failedTitle')}</AlertTitle>
                <AlertDescription>{displayError}</AlertDescription>
              </Alert>
            )}

            {hasErrorState && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void runAccept(normalizedToken)}
                  disabled={!normalizedToken || isAccepting}
                >
                  {isAccepting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {t('actions.retry')}
                </Button>
                <Button type="button" onClick={() => router.push(ROUTES.login)}>
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
