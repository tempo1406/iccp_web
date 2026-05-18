'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { AppError } from '@/lib/safe-query';
import { isErr, isOk } from '@/lib/safe-query';
import { toast } from '@/lib/toast';
import { useAcceptProjectInvite } from '../query/use-project-core';

const PROJECT_QUERY_KEY = ['projects'] as const;
const NOTIFICATIONS_QUERY_KEY = ['notifications', 'list'] as const;

function getStatusCode(error: AppError | null): number | null {
  const cause = error?.cause;
  if (!cause || typeof cause !== 'object') {
    return null;
  }

  const status = (cause as { status?: unknown }).status;
  return typeof status === 'number' ? status : null;
}

function toFriendlyError(
  error: AppError | null,
  t: ReturnType<typeof useTranslations<'project.inviteAccept'>>,
): string {
  if (!error) {
    return t('errors.acceptFailed');
  }

  const statusCode = getStatusCode(error);
  if (statusCode === 404) {
    return t('errors.status404');
  }
  if (statusCode === 403) {
    return t('errors.status403');
  }
  if (statusCode === 400) {
    return t('errors.status400');
  }
  if (statusCode === 401) {
    return t('errors.status401');
  }

  return error.message || t('errors.acceptFailed');
}

function isAlreadyAcceptedError(error: AppError | null): boolean {
  const normalized = (error?.message ?? '').toLowerCase();
  return normalized.includes('already accepted');
}

export function useAcceptProjectInviteFlow() {
  const queryClient = useQueryClient();
  const acceptMutation = useAcceptProjectInvite();
  const t = useTranslations('project.inviteAccept');

  const invalidateRelatedQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
    ]);
  };

  const acceptProjectInvite = async (token: string) => {
    const normalizedToken = token.trim();
    if (!normalizedToken) {
      const message = t('errors.missingToken');
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    const result = await acceptMutation.mutateAsync({ token: normalizedToken });
    if (isOk(result)) {
      await invalidateRelatedQueries();
      toast.success(t('toasts.accepted'));
      return { ok: true as const };
    }

    if (isErr(result)) {
      if (isAlreadyAcceptedError(result.error)) {
        await invalidateRelatedQueries();
        toast.infor(t('toasts.alreadyAccepted'));
        return { ok: true as const };
      }

      const message = toFriendlyError(result.error, t);
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    const fallback = t('errors.acceptFailed');
    toast.danger(fallback);
    return { ok: false as const, error: fallback };
  };

  return {
    acceptProjectInvite,
    isAccepting: acceptMutation.isPending,
    isAccepted: acceptMutation.isSuccess,
    hasAcceptError: acceptMutation.isError,
    acceptErrorMessage: toFriendlyError((acceptMutation.error as AppError | null) ?? null, t),
  };
}
