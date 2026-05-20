'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeMutation, useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { InvitationsService } from '@/services/invitations';
import type {
  AcceptInvitationDto,
  CreateInvitationsDto,
  ListInvitationsQueryDto,
} from '@/services/invitations';

export const invitationKeys = {
  all: (tenantId: string | null | undefined) => ['organization', 'invitations', tenantId] as const,
  analytics: (tenantId: string | null | undefined) =>
    ['organization', 'invitations', tenantId, 'analytics'] as const,
  list: (tenantId: string | null | undefined, input: ListInvitationsQueryDto) =>
    ['organization', 'invitations', tenantId, 'list', input] as const,
  byId: (tenantId: string | null | undefined, id: string) =>
    ['organization', 'invitations', tenantId, 'byId', id] as const,
};

export function useInvitationAnalyticsQuery() {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: invitationKeys.analytics(ctx.tenantId),
      queryFn: () => new InvitationsService(ctx).analytics(),
      enabled: Boolean(ctx.tenantId),
      staleTime: 5 * 60_000,
    }),
  );
}

export function useInvitationsQuery(input: ListInvitationsQueryDto) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: invitationKeys.list(ctx.tenantId, input),
      queryFn: () => new InvitationsService(ctx).list(input),
      enabled: Boolean(ctx.tenantId),
      staleTime: 30_000,
    }),
  );
}

export function useInvitationByIdQuery(id: string, enabled = true) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: invitationKeys.byId(ctx.tenantId, id),
      queryFn: () => new InvitationsService(ctx).byId(id),
      enabled: Boolean(ctx.tenantId) && Boolean(id) && enabled,
      staleTime: 30_000,
    }),
  );
}

export function useCreateInvitationsMutation() {
  const ctx = useServiceContext();
  const qc = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (body: CreateInvitationsDto) => new InvitationsService(ctx).create(body),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: invitationKeys.all(ctx.tenantId) });
      },
    }),
  );
}

export function useAcceptInvitationMutation() {
  const ctx = useServiceContext();
  const qc = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (body: AcceptInvitationDto) => new InvitationsService(ctx).accept(body),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: invitationKeys.all(ctx.tenantId) });
      },
    }),
  );
}

export function useResendInvitationMutation() {
  const ctx = useServiceContext();
  const qc = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (id: string) => new InvitationsService(ctx).resend(id),
      onSuccess: (_data, id) => {
        void qc.invalidateQueries({ queryKey: invitationKeys.all(ctx.tenantId) });
        void qc.invalidateQueries({ queryKey: invitationKeys.byId(ctx.tenantId, id) });
      },
    }),
  );
}

export function useCancelInvitationMutation() {
  const ctx = useServiceContext();
  const qc = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (id: string) => new InvitationsService(ctx).cancel(id),
      onSuccess: (_data, id) => {
        void qc.invalidateQueries({ queryKey: invitationKeys.all(ctx.tenantId) });
        void qc.invalidateQueries({ queryKey: invitationKeys.byId(ctx.tenantId, id) });
      },
    }),
  );
}
