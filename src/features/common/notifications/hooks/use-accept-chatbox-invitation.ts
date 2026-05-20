'use client';

import { useTranslations } from 'next-intl';
import { isErr, isOk } from '@/lib/safe-query';
import { toast } from '@/lib/toast';
import { useAcceptTeamChatInvitation } from '@/features/tenant/team-chat/query/use-team-chat';

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim().length > 0
  ) {
    return error.message;
  }

  return fallback;
}

export function useAcceptChatboxInvitation() {
  const acceptMutation = useAcceptTeamChatInvitation();
  const t = useTranslations('teamChat.invitationAccept.toasts');

  const acceptChatboxInvitation = async (invitationId: string) => {
    const normalizedInvitationId = invitationId.trim();
    if (!normalizedInvitationId) {
      const message = t('missingId');
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    const result = await acceptMutation.mutateAsync(normalizedInvitationId);

    if (isOk(result)) {
      if (result.data.alreadyAccepted) {
        toast.infor(t('alreadyAccepted'));
      } else {
        toast.success(t('accepted'));
      }

      return {
        ok: true as const,
        data: result.data,
      };
    }

    if (isErr(result)) {
      const message = toErrorMessage(result.error, t('acceptFailed'));
      toast.danger(message);
      return {
        ok: false as const,
        error: message,
      };
    }

    return {
      ok: false as const,
      error: t('unknown'),
    };
  };

  return {
    acceptChatboxInvitation,
    isAccepting: acceptMutation.isPending,
    isAccepted: acceptMutation.isSuccess,
    hasAcceptError: acceptMutation.isError,
    acceptErrorMessage: acceptMutation.error?.message ?? null,
  };
}
