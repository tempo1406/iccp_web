'use client';

import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ORG_QUERY_KEYS } from '@/features/common/user-dashboard/query/org.queries';
import { isOk, isErr } from '@/lib/safe-query';
import { toast } from '@/lib/toast';
import { OrganizationService } from '@/services/organizations/organization.service';
import type { OrganizationDto } from '@/services/organizations/types';
import { useAcceptInvitationMutation } from '../query/invitations.queries';

const NOTIFICATIONS_QUERY_KEY = ['notifications', 'list'] as const;

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

function isAlreadyAcceptedError(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes('already accepted');
}

function detectAcceptedOrgId(
  previousOrgs: OrganizationDto[] | null,
  nextOrgs: OrganizationDto[],
): string | null {
  if (!previousOrgs) {
    return null;
  }

  const previousOrgIds = new Set(previousOrgs.map((org) => org.id));
  const acceptedOrg = nextOrgs.find((org) => !previousOrgIds.has(org.id));
  return acceptedOrg?.id ?? null;
}

async function loadMyOrgsSnapshot(
  queryClient: QueryClient,
): Promise<OrganizationDto[] | null> {
  const cached = queryClient.getQueryData<OrganizationDto[]>(ORG_QUERY_KEYS.myOrgs);
  if (cached) {
    return cached;
  }

  try {
    return await queryClient.fetchQuery({
      queryKey: ORG_QUERY_KEYS.myOrgs,
      queryFn: () => new OrganizationService({}).getMyOrgs(),
    });
  } catch {
    return null;
  }
}

async function refreshMyOrgsAndDetectAcceptedOrg(
  queryClient: QueryClient,
  previousOrgs: OrganizationDto[] | null,
): Promise<string | null> {
  await queryClient.invalidateQueries({ queryKey: ORG_QUERY_KEYS.myOrgs });

  try {
    const latestOrgs = await queryClient.fetchQuery({
      queryKey: ORG_QUERY_KEYS.myOrgs,
      queryFn: () => new OrganizationService({}).getMyOrgs(),
    });
    return detectAcceptedOrgId(previousOrgs, latestOrgs);
  } catch {
    return null;
  }
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  const acceptMutation = useAcceptInvitationMutation();
  const t = useTranslations('organizationManagement.invitationAccept');

  const acceptInvitation = async (token: string) => {
    const normalizedToken = token.trim();
    if (!normalizedToken) {
      const message = t('errors.missingToken');
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    const previousOrgs = await loadMyOrgsSnapshot(queryClient);
    const result = await acceptMutation.mutateAsync({ token: normalizedToken });

    if (isOk(result)) {
      toast.success(t('toasts.accepted'));
      const acceptedOrgId = await refreshMyOrgsAndDetectAcceptedOrg(
        queryClient,
        previousOrgs,
      );
      await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      return { ok: true as const, acceptedOrgId };
    }

    if (isErr(result)) {
      const message = toErrorMessage(result.error, t('toasts.acceptFailed'));

      if (isAlreadyAcceptedError(message)) {
        toast.infor(t('toasts.alreadyAccepted'));
        const acceptedOrgId = await refreshMyOrgsAndDetectAcceptedOrg(
          queryClient,
          previousOrgs,
        );
        await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
        return { ok: true as const, acceptedOrgId };
      }

      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: t('errors.unknown') };
  };

  return {
    acceptInvitation,
    isAccepting: acceptMutation.isPending,
    isAccepted: acceptMutation.isSuccess,
    hasAcceptError: acceptMutation.isError,
    acceptErrorMessage: acceptMutation.error?.message ?? null,
  };
}
