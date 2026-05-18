'use client';

import { isErr, isOk } from '@/lib/safe-query';
import { toast } from '@/lib/toast';
import type {
  CreateInvitationsDto,
  InvitationAnalyticsDto,
  InvitationDetailDto,
  InvitationSortBy,
  InvitationSortOrder,
  InvitationStatus,
  ListInvitationsQueryDto,
} from '@/services/invitations';
import {
  useCancelInvitationMutation,
  useCreateInvitationsMutation,
  useInvitationAnalyticsQuery,
  useInvitationByIdQuery,
  useInvitationsQuery,
  useResendInvitationMutation,
} from '../query/invitations.queries';

export type { InvitationStatus } from '@/services/invitations';
export type OrganizationInvitation = InvitationDetailDto;

export interface InvitationListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UseOrganizationInvitationsInput {
  status?: InvitationStatus;
  page?: number;
  limit?: number;
  sortBy?: InvitationSortBy;
  sortOrder?: InvitationSortOrder;
}

export const invitationStatusOptions: Array<{ label: string; value: InvitationStatus }> = [
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Expired', value: 'expired' },
  { label: 'Cancelled', value: 'cancelled' },
];

const EMPTY_META: InvitationListMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

const EMPTY_ANALYTICS: InvitationAnalyticsDto = {
  total: 0,
  pending: 0,
  accepted: 0,
  needsAttention: 0,
  expired: 0,
  cancelled: 0,
  acceptanceRate: 0,
};

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

export function useOrganizationInvitationsData(input: UseOrganizationInvitationsInput) {
  const queryInput: ListInvitationsQueryDto = {
    status: input.status,
    page: input.page ?? 1,
    limit: input.limit ?? 10,
    sortBy: input.sortBy ?? 'createdAt',
    sortOrder: input.sortOrder ?? 'DESC',
  };

  const invitationsQuery = useInvitationsQuery(queryInput);
  const invitations = invitationsQuery.data?.data ?? [];
  const meta = invitationsQuery.data?.meta ?? EMPTY_META;

  return {
    invitations,
    meta,
    isPending: invitationsQuery.isPending,
    isError: invitationsQuery.isError,
    error: invitationsQuery.error,
  };
}

export function useOrganizationInvitationAnalytics() {
  const analyticsQuery = useInvitationAnalyticsQuery();

  return {
    analytics: analyticsQuery.data ?? EMPTY_ANALYTICS,
    isPending: analyticsQuery.isPending,
    isError: analyticsQuery.isError,
    error: analyticsQuery.error,
  };
}

export function useOrganizationInvitationDetail(id: string, enabled: boolean) {
  return useInvitationByIdQuery(id, enabled);
}

export function useOrganizationInvitationsActions() {
  const createMutation = useCreateInvitationsMutation();
  const resendMutation = useResendInvitationMutation();
  const cancelMutation = useCancelInvitationMutation();

  const sendInvitations = async (payload: CreateInvitationsDto) => {
    const result = await createMutation.mutateAsync(payload);
    if (isOk(result)) {
      toast.success(`Sent ${payload.emails.length} invitation(s).`);
      return { ok: true as const };
    }

    const message = toErrorMessage(
      isErr(result) ? result.error : undefined,
      'Failed to send invitations.',
    );
    toast.danger(message);
    return { ok: false as const, error: message };
  };

  const resendInvitation = async (invitationId: string, inviteeEmail?: string) => {
    const result = await resendMutation.mutateAsync(invitationId);
    if (isOk(result)) {
      toast.infor('Invitation resent successfully.', inviteeEmail);
      return { ok: true as const };
    }

    const message = toErrorMessage(
      isErr(result) ? result.error : undefined,
      'Failed to resend invitation.',
    );
    toast.danger(message);
    return { ok: false as const, error: message };
  };

  const cancelInvitation = async (invitationId: string, inviteeEmail?: string) => {
    const result = await cancelMutation.mutateAsync(invitationId);
    if (isOk(result)) {
      toast.warning('Invitation cancelled.', inviteeEmail);
      return { ok: true as const };
    }

    const message = toErrorMessage(
      isErr(result) ? result.error : undefined,
      'Failed to cancel invitation.',
    );
    toast.danger(message);
    return { ok: false as const, error: message };
  };

  const resendPendingInvitations = async (
    pendingInvitations: OrganizationInvitation[],
  ): Promise<{ successCount: number; failedCount: number }> => {
    if (pendingInvitations.length === 0) {
      toast.warning('No pending invitations to resend on this page.');
      return { successCount: 0, failedCount: 0 };
    }

    const results = await Promise.all(
      pendingInvitations.map((invitation) => resendMutation.mutateAsync(invitation.id)),
    );

    const successCount = results.filter((result) => isOk(result)).length;
    const failedCount = results.length - successCount;

    if (failedCount === 0) {
      toast.success(`Resent ${successCount} invitation(s).`);
    } else if (successCount > 0) {
      toast.warning(`Resent ${successCount}, failed ${failedCount}.`);
    } else {
      toast.danger('Failed to resend pending invitations.');
    }

    return { successCount, failedCount };
  };

  return {
    sendInvitations,
    resendInvitation,
    cancelInvitation,
    resendPendingInvitations,
    isCreating: createMutation.isPending,
    isResending: resendMutation.isPending,
    isCancelling: cancelMutation.isPending,
  };
}
