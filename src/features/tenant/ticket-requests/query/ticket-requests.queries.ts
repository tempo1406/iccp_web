'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeMutation, useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { TicketRequestsService } from '../../../../services/ticket/ticket-requests.service';
import type {
  AddTicketCcMembersBody,
  AddTicketCommentBody,
  CreateOvertimeTicketRequestBody,
  CreateTicketRequestBody,
  DeclareOtEffortBody,
  OtProjectOption,
  TicketDecisionNoteBody,
  TicketDecisionReasonBody,
  TicketRequestListQuery,
  TicketRequestSortBy,
  TicketRequestSortOrder,
  TicketRequestUserSummary,
  UpdateTicketRequestBody,
} from '../../../../services/ticket/types/ticket-request.types';

interface RequiredTicketListQuery {
  page: number;
  limit: number;
  sortBy: TicketRequestSortBy;
  sortOrder: TicketRequestSortOrder;
  status?: TicketRequestListQuery['status'];
  type?: TicketRequestListQuery['type'];
  workflowCode?: TicketRequestListQuery['workflowCode'];
  currentStepCode?: TicketRequestListQuery['currentStepCode'];
  requestTypeCode?: string;
  requesterId?: string;
  delegateId?: string;

  search?: string;
  fromDate?: string;
  toDate?: string;
}

const DEFAULT_TICKET_LIST_QUERY: Required<
  Pick<RequiredTicketListQuery, 'page' | 'limit' | 'sortBy' | 'sortOrder'>
> = {
  page: 1,
  limit: 10,
  sortBy: 'updatedAt',
  sortOrder: 'DESC',
};

function resolveTicketListQuery(
  params: TicketRequestListQuery = {},
): RequiredTicketListQuery {
  return {
    page: params.page ?? DEFAULT_TICKET_LIST_QUERY.page,
    limit: params.limit ?? DEFAULT_TICKET_LIST_QUERY.limit,
    sortBy: params.sortBy ?? DEFAULT_TICKET_LIST_QUERY.sortBy,
    sortOrder: params.sortOrder ?? DEFAULT_TICKET_LIST_QUERY.sortOrder,
    status: params.status,
    type: params.type,
    workflowCode: params.workflowCode,
    currentStepCode: params.currentStepCode,
    requestTypeCode: params.requestTypeCode,
    requesterId: params.requesterId,
    delegateId: params.delegateId,

    search: params.search,
    fromDate: params.fromDate,
    toDate: params.toDate,
  };
}

const ticketRequestRootKey = (tenantId: string | null | undefined) =>
  ['ticket-requests', tenantId] as const;

export const ticketRequestQueryKeys = {
  root: ticketRequestRootKey,
  myList: (tenantId: string | null | undefined, params: RequiredTicketListQuery) =>
    [...ticketRequestRootKey(tenantId), 'my', params] as const,
  manageList: (tenantId: string | null | undefined, params: RequiredTicketListQuery) =>
    [...ticketRequestRootKey(tenantId), 'manage', params] as const,
  detail: (tenantId: string | null | undefined, ticketId: string) =>
    [...ticketRequestRootKey(tenantId), 'detail', ticketId] as const,
  comments: (tenantId: string | null | undefined, ticketId: string) =>
    [...ticketRequestRootKey(tenantId), 'comments', ticketId] as const,
  requestTypes: (tenantId: string | null | undefined) =>
    [...ticketRequestRootKey(tenantId), 'request-types'] as const,
  reasons: (tenantId: string | null | undefined) =>
    [...ticketRequestRootKey(tenantId), 'reasons'] as const,
  delegateOptions: (tenantId: string | null | undefined) =>
    [...ticketRequestRootKey(tenantId), 'delegate-options'] as const,
  ccMemberOptions: (tenantId: string | null | undefined) =>
    [...ticketRequestRootKey(tenantId), 'cc-member-options'] as const,
  otProjectOptions: (tenantId: string | null | undefined) =>
    [...ticketRequestRootKey(tenantId), 'ot-project-options'] as const,
  otEffortOwnerOptions: (tenantId: string | null | undefined, projectId?: string) =>
    [...ticketRequestRootKey(tenantId), 'ot-effort-owner-options', projectId ?? 'all'] as const,
};

export function useMyTicketRequestsQuery(
  params: TicketRequestListQuery = {},
  enabled = true,
) {
  const ctx = useServiceContext();
  const resolvedParams = resolveTicketListQuery(params);

  return useSafeQuery(
    useQuery({
      queryKey: ticketRequestQueryKeys.myList(ctx.tenantId, resolvedParams),
      queryFn: () => new TicketRequestsService(ctx).listMy(resolvedParams),
      enabled: Boolean(ctx.tenantId) && enabled,
      staleTime: 20_000,
    }),
  );
}

export function useManageTicketRequestsQuery(
  params: TicketRequestListQuery = {},
  enabled = true,
) {
  const ctx = useServiceContext();
  const resolvedParams = resolveTicketListQuery(params);

  return useSafeQuery(
    useQuery({
      queryKey: ticketRequestQueryKeys.manageList(ctx.tenantId, resolvedParams),
      queryFn: () => new TicketRequestsService(ctx).listManage(resolvedParams),
      enabled: Boolean(ctx.tenantId) && enabled,
      staleTime: 20_000,
    }),
  );
}

export function useTicketRequestDetailQuery(ticketId: string | null, enabled = true) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: ticketRequestQueryKeys.detail(ctx.tenantId, ticketId ?? ''),
      queryFn: () => new TicketRequestsService(ctx).getDetail(ticketId ?? ''),
      enabled: Boolean(ctx.tenantId) && Boolean(ticketId) && enabled,
    }),
  );
}

export function useTicketRequestCommentsQuery(ticketId: string | null, enabled = true) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: ticketRequestQueryKeys.comments(ctx.tenantId, ticketId ?? ''),
      queryFn: () => new TicketRequestsService(ctx).getComments(ticketId ?? ''),
      enabled: Boolean(ctx.tenantId) && Boolean(ticketId) && enabled,
      staleTime: 5_000,
    }),
  );
}

export function useTicketRequestCatalogRequestTypesQuery(enabled = true) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: ticketRequestQueryKeys.requestTypes(ctx.tenantId),
      queryFn: () => new TicketRequestsService(ctx).listRequestTypes(),
      enabled: Boolean(ctx.tenantId) && enabled,
      staleTime: 60_000,
    }),
  );
}

export function useTicketRequestReasonOptionsQuery(enabled = true) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: ticketRequestQueryKeys.reasons(ctx.tenantId),
      queryFn: () => new TicketRequestsService(ctx).listReasonOptions(),
      enabled: Boolean(ctx.tenantId) && enabled,
      staleTime: 60_000,
    }),
  );
}

export function useTicketRequestDelegateOptionsQuery(enabled = true) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: ticketRequestQueryKeys.delegateOptions(ctx.tenantId),
      queryFn: () => new TicketRequestsService(ctx).listDelegateOptions(),
      enabled: Boolean(ctx.tenantId) && enabled,
      staleTime: 60_000,
    }),
  );
}

export function useTicketRequestCcMemberOptionsQuery(enabled = true) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: ticketRequestQueryKeys.ccMemberOptions(ctx.tenantId),
      queryFn: () => new TicketRequestsService(ctx).listCcMemberOptions(),
      enabled: Boolean(ctx.tenantId) && enabled,
      staleTime: 60_000,
    }),
  );
}

export function useCreateTicketRequestMutation() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (body: CreateTicketRequestBody) =>
        new TicketRequestsService(ctx).create(body),
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.root(ctx.tenantId),
        });
      },
    }),
  );
}

export function useCreateOvertimeTicketRequestMutation() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (body: CreateOvertimeTicketRequestBody) =>
        new TicketRequestsService(ctx).createOvertime(body),
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.root(ctx.tenantId),
        });
      },
    }),
  );
}

export function useDeclareOtEffortMutation() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({ ticketId, body }: { ticketId: string; body: DeclareOtEffortBody }) =>
        new TicketRequestsService(ctx).declareOtEffort(ticketId, body),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.root(ctx.tenantId),
        });
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.detail(ctx.tenantId, variables.ticketId),
        });
      },
    }),
  );
}

export function useUpdateTicketRequestMutation() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        ticketId,
        body,
      }: {
        ticketId: string;
        body: UpdateTicketRequestBody;
      }) => new TicketRequestsService(ctx).update(ticketId, body),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.root(ctx.tenantId),
        });
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.detail(ctx.tenantId, variables.ticketId),
        });
      },
    }),
  );
}

export function useCancelTicketRequestMutation() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (ticketId: string) => new TicketRequestsService(ctx).cancel(ticketId),
      onSuccess: (_data, ticketId) => {
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.root(ctx.tenantId),
        });
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.detail(ctx.tenantId, ticketId),
        });
      },
    }),
  );
}

export function useApproveTicketRequestMutation() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        ticketId,
        body,
      }: {
        ticketId: string;
        body: TicketDecisionNoteBody;
      }) => new TicketRequestsService(ctx).approve(ticketId, body),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.root(ctx.tenantId),
        });
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.detail(ctx.tenantId, variables.ticketId),
        });
      },
      // The backend approve may succeed (ticket advances in DB) but the subsequent
      // getTicketDetail call returns 403 when the actor is no longer the delegate.
      // Invalidate the list on error so the UI reflects the actual ticket state.
      onError: () => {
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.root(ctx.tenantId),
        });
      },
    }),
  );
}

export function useRejectTicketRequestMutation() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        ticketId,
        body,
      }: {
        ticketId: string;
        body: TicketDecisionReasonBody;
      }) => new TicketRequestsService(ctx).reject(ticketId, body),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.root(ctx.tenantId),
        });
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.detail(ctx.tenantId, variables.ticketId),
        });
      },
      onError: () => {
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.root(ctx.tenantId),
        });
      },
    }),
  );
}

export function useRequestChangesTicketRequestMutation() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        ticketId,
        body,
      }: {
        ticketId: string;
        body: TicketDecisionReasonBody;
      }) => new TicketRequestsService(ctx).requestChanges(ticketId, body),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.root(ctx.tenantId),
        });
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.detail(ctx.tenantId, variables.ticketId),
        });
      },
      onError: () => {
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.root(ctx.tenantId),
        });
      },
    }),
  );
}

export function useAddTicketCommentMutation() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        ticketId,
        body,
      }: {
        ticketId: string;
        body: AddTicketCommentBody;
      }) => new TicketRequestsService(ctx).addComment(ticketId, body),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.comments(ctx.tenantId, variables.ticketId),
        });
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.detail(ctx.tenantId, variables.ticketId),
        });
      },
    }),
  );
}

export function useAddTicketCcMembersMutation() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        ticketId,
        body,
      }: {
        ticketId: string;
        body: AddTicketCcMembersBody;
      }) => new TicketRequestsService(ctx).addCcMembers(ticketId, body),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.root(ctx.tenantId),
        });
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.detail(ctx.tenantId, variables.ticketId),
        });
      },
    }),
  );
}

export function useRemoveTicketCcMemberMutation() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({ ticketId, memberId }: { ticketId: string; memberId: string }) =>
        new TicketRequestsService(ctx).removeCcMember(ticketId, memberId),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.root(ctx.tenantId),
        });
        void queryClient.invalidateQueries({
          queryKey: ticketRequestQueryKeys.detail(ctx.tenantId, variables.ticketId),
        });
      },
    }),
  );
}

export function useOtProjectOptionsQuery(enabled = true) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: ticketRequestQueryKeys.otProjectOptions(ctx.tenantId),
      queryFn: () => new TicketRequestsService(ctx).listOtProjectOptions(),
      enabled: Boolean(ctx.tenantId) && enabled,
      staleTime: 60_000,
      retry: false,
    }),
  );
}

export function useOtEffortOwnerOptionsQuery(projectId: string | undefined, enabled = true) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: ticketRequestQueryKeys.otEffortOwnerOptions(ctx.tenantId, projectId),
      queryFn: () => new TicketRequestsService(ctx).listOtEffortOwnerOptions(projectId),
      enabled: Boolean(ctx.tenantId) && enabled,
      staleTime: 30_000,
    }),
  );
}
