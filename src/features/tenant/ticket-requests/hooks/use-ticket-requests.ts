'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { isErr, isOk } from '@/lib/safe-query';
import { toast } from '@/lib/toast';
import { useOrganizationMembersData } from '@/features/tenant/organization-members/hooks/use-organization-members';
import {
  useAddTicketCcMembersMutation,
  useAddTicketCommentMutation,
  useApproveTicketRequestMutation,
  useCancelTicketRequestMutation,
  useCreateOvertimeTicketRequestMutation,
  useCreateTicketRequestMutation,
  useDeclareOtEffortMutation,
  useManageTicketRequestsQuery,
  useMyTicketRequestsQuery,
  useRejectTicketRequestMutation,
  useRemoveTicketCcMemberMutation,
  useRequestChangesTicketRequestMutation,
  useTicketRequestDelegateOptionsQuery,
  useTicketRequestCcMemberOptionsQuery,
  useTicketRequestCatalogRequestTypesQuery,
  useTicketRequestDetailQuery,
  useTicketRequestCommentsQuery,
  useTicketRequestReasonOptionsQuery,
  useUpdateTicketRequestMutation,
} from '../query/ticket-requests.queries';
import type {
  CreateOvertimeTicketRequestBody,
  CreateTicketRequestBody,
  DeclareOtEffortBody,
  TicketDecisionNoteBody,
  TicketDecisionReasonBody,
  TicketRequestApproverOption,
  TicketRequestCatalogReason,
  TicketRequestCatalogType,
  TicketRequestComment,
  TicketRequestListMeta,
  TicketRequestListQuery,
  TicketRequestSummary,
  UpdateTicketRequestBody,
} from '../../../../services/ticket/types/ticket-request.types';
import { DEFAULT_TICKET_REQUEST_META } from '../../../../services/ticket/types/ticket-request.types';

export interface TicketRequestMemberOption {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  label: string;
  roles: string[];
  canApprove: boolean;
  isOrganizationAdmin: boolean;
  isDefaultApprover: boolean;
}

interface TicketListDataResult {
  tickets: TicketRequestSummary[];
  meta: TicketRequestListMeta;
  isPending: boolean;
  isError: boolean;
  errorMessage: string | null;
}

function toErrorMessage(error: unknown, fallback: string): string {
  const payload = (error as { payload?: { details?: Array<{ message?: string }>; message?: string } } | null)?.payload;
  const detailMessage = payload?.details?.find((detail) => detail?.message?.trim())?.message?.trim();
  if (detailMessage) {
    return detailMessage;
  }

  if (typeof payload?.message === 'string' && payload.message.trim().length > 0) {
    return payload.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

function toListDataResult(
  query: ReturnType<typeof useMyTicketRequestsQuery>,
): TicketListDataResult {
  return {
    tickets: query.data?.data ?? [],
    meta: query.data?.meta ?? DEFAULT_TICKET_REQUEST_META,
    isPending: query.isPending,
    isError: query.isError,
    errorMessage: query.error?.message ?? null,
  };
}

function isOrganizationAdminRole(role: string): boolean {
  const normalized = role.trim().toLowerCase();
  return (
    normalized === 'org_admin' ||
    normalized === 'organization_admin' ||
    normalized === 'organization admin' ||
    normalized === 'system_admin' ||
    normalized === 'system admin'
  );
}

function buildMemberLabel(
  firstName: string | null,
  lastName: string | null,
  email: string,
): string {
  const fullName = [firstName, lastName]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(' ')
    .trim();

  return fullName.length > 0 ? `${fullName} (${email})` : email;
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readNullableString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }

  return undefined;
}

function normalizeApproverOptions(raw: unknown): TicketRequestApproverOption[] {
  const source = raw as
    | TicketRequestApproverOption[]
    | { data?: unknown }
    | { data?: { data?: unknown } }
    | undefined;

  const rows = Array.isArray(source)
    ? source
    : Array.isArray(source?.data)
      ? source.data
      : Array.isArray((source as { data?: { data?: unknown } } | undefined)?.data?.data)
        ? ((source as { data?: { data?: unknown[] } })?.data?.data ?? [])
        : [];

  return rows
    .map((item) => {
      const row = item as Record<string, unknown> | null;
      if (!row || typeof row !== 'object') {
        return null;
      }

      const user = row.user as Record<string, unknown> | undefined;

      const id =
        readString(row.id) ??
        readString(row.userId) ??
        readString(row.user_id) ??
        readString(row.memberId) ??
        readString(row.member_id) ??
        readString(user?.id);

      const email =
        readString(row.email) ??
        readString(row.userEmail) ??
        readString(row.user_email) ??
        readString(user?.email);

      if (!id || !email) {
        return null;
      }

      const firstName =
        readNullableString(row.firstName) ??
        readNullableString(row.userFirstName) ??
        readNullableString(row.user_firstName) ??
        readNullableString(user?.firstName);

      const lastName =
        readNullableString(row.lastName) ??
        readNullableString(row.userLastName) ??
        readNullableString(row.user_lastName) ??
        readNullableString(user?.lastName);

      const isOrgAdmin =
        readBoolean(row.isOrgAdmin) ??
        readBoolean(row.is_org_admin) ??
        readBoolean(row.orgAdmin) ??
        readBoolean(row.isOrganizationAdmin) ??
        readBoolean(user?.isOrgAdmin) ??
        readBoolean(user?.is_org_admin) ??
        false;

      const isDefault =
        readBoolean(row.isDefault) ??
        readBoolean(row.is_default) ??
        readBoolean(row.default) ??
        readBoolean(user?.isDefault) ??
        readBoolean(user?.is_default) ??
        false;

      return {
        id,
        email,
        firstName,
        lastName,
        isOrgAdmin,
        isDefault,
      };
    })
    .filter((item): item is TicketRequestApproverOption => item !== null);
}

export function useTicketRequestsData(
  scope: 'my' | 'manage',
  params: TicketRequestListQuery,
  canManage = false,
  enabled = true,
) {
  const myQuery = useMyTicketRequestsQuery(params, enabled && scope === 'my');
  const manageQuery = useManageTicketRequestsQuery(
    params,
    enabled && scope === 'manage' && canManage,
  );

  if (scope === 'my') {
    return toListDataResult(myQuery);
  }

  return toListDataResult(manageQuery);
}

export function useTicketRequestDetail(ticketId: string | null, enabled = true) {
  const detailQuery = useTicketRequestDetailQuery(ticketId, enabled);

  return {
    ticket: detailQuery.data ?? null,
    isPending: detailQuery.isPending,
    isError: detailQuery.isError,
    errorMessage: detailQuery.error?.message ?? null,
  };
}

export function useTicketRequestComments(ticketId: string | null, enabled = true) {
  const commentsQuery = useTicketRequestCommentsQuery(ticketId, enabled);

  return {
    comments: commentsQuery.data ?? ([] as TicketRequestComment[]),
    isPending: commentsQuery.isPending,
    isError: commentsQuery.isError,
    errorMessage: commentsQuery.error?.message ?? null,
  };
}

export function useTicketRequestCatalogData(enabled = true) {
  const requestTypesQuery = useTicketRequestCatalogRequestTypesQuery(enabled);
  const reasonOptionsQuery = useTicketRequestReasonOptionsQuery(enabled);

  return {
    requestTypes: requestTypesQuery.data ?? ([] as TicketRequestCatalogType[]),
    reasons: reasonOptionsQuery.data ?? ([] as TicketRequestCatalogReason[]),
    isPending: requestTypesQuery.isPending || reasonOptionsQuery.isPending,
    isError: requestTypesQuery.isError || reasonOptionsQuery.isError,
    errorMessage:
      requestTypesQuery.error?.message ?? reasonOptionsQuery.error?.message ?? null,
  };
}

export function useTicketRequestMemberOptions(
  enabled = true,
  canFetchOrgMembers = false,
) {
  const membersQuery = useOrganizationMembersData(
    {
      page: 1,
      limit: 100,
      sortBy: undefined,
      sortOrder: undefined,
    },
    enabled && canFetchOrgMembers,
  );

  const delegateOptionsQuery = useTicketRequestDelegateOptionsQuery(enabled);
  const ccMemberOptionsQuery = useTicketRequestCcMemberOptionsQuery(enabled);

  const ccMemberOptions = useMemo(
    () => (ccMemberOptionsQuery.data ?? []),
    [ccMemberOptionsQuery.data],
  );

  const normalizedDelegateOptions = useMemo(
    () => normalizeApproverOptions(delegateOptionsQuery.data),
    [delegateOptionsQuery.data],
  );

  const delegateIdentitySet = useMemo(() => {
    const values = new Set<string>();
    normalizedDelegateOptions.forEach((item) => {
      values.add(item.id);
      values.add(item.email.trim().toLowerCase());
    });
    return values;
  }, [normalizedDelegateOptions]);

  const mergedOptions = useMemo<TicketRequestMemberOption[]>(() => {
    const memberMap = new Map<string, TicketRequestMemberOption>();
    const memberIdByEmail = new Map<string, string>();

    // Populate from CC member options API (all active org members excluding self)
    ccMemberOptions.forEach((member) => {
      const normalizedEmail = member.email.trim().toLowerCase();
      memberMap.set(member.id, {
        id: member.id,
        email: member.email,
        firstName: member.firstName ?? null,
        lastName: member.lastName ?? null,
        label: buildMemberLabel(member.firstName ?? null, member.lastName ?? null, member.email),
        roles: [],
        canApprove: delegateIdentitySet.has(member.id) || delegateIdentitySet.has(normalizedEmail),
        isOrganizationAdmin: false,
        isDefaultApprover: false,
      });
      memberIdByEmail.set(normalizedEmail, member.id);
    });

    // Enrich with org member data if available (system admins)
    membersQuery.members.forEach((member) => {
      if (!member.isActive) {
        return;
      }
      const roles = Array.isArray(member.roles) ? member.roles : [];
      const isOrganizationAdmin =
        member.isOwner === true || roles.some((role) => isOrganizationAdminRole(typeof role === 'string' ? role : role.name));
      const normalizedEmail = member.email.trim().toLowerCase();

      const existing = memberMap.get(member.userId);
      if (existing) {
        existing.roles = roles.map((r) => (typeof r === 'string' ? r : r.name));
        existing.isOrganizationAdmin = isOrganizationAdmin;
      } else {
        memberMap.set(member.userId, {
          id: member.userId,
          email: member.email,
          firstName: member.firstName ?? null,
          lastName: member.lastName ?? null,
          label: buildMemberLabel(
            member.firstName ?? null,
            member.lastName ?? null,
            member.email,
          ),
          roles: roles.map((r) => (typeof r === 'string' ? r : r.name)),
          canApprove:
            delegateIdentitySet.has(member.userId) ||
            delegateIdentitySet.has(normalizedEmail),
          isOrganizationAdmin,
          isDefaultApprover: false,
        });
        memberIdByEmail.set(normalizedEmail, member.userId);
      }
    });

    normalizedDelegateOptions.forEach((approver) => {
      const existingById = memberMap.get(approver.id);
      if (existingById) {
        existingById.canApprove = true;
        existingById.isOrganizationAdmin =
          existingById.isOrganizationAdmin || approver.isOrgAdmin === true;
        existingById.isDefaultApprover =
          existingById.isDefaultApprover || approver.isDefault === true;
        return;
      }

      const existingMemberIdByEmail = memberIdByEmail.get(
        approver.email.trim().toLowerCase(),
      );
      if (existingMemberIdByEmail) {
        const existingByEmail = memberMap.get(existingMemberIdByEmail);
        if (existingByEmail) {
          existingByEmail.canApprove = true;
          existingByEmail.isOrganizationAdmin =
            existingByEmail.isOrganizationAdmin || approver.isOrgAdmin === true;
          existingByEmail.isDefaultApprover =
            existingByEmail.isDefaultApprover || approver.isDefault === true;
        }
        return;
      }

      memberMap.set(approver.id, {
        id: approver.id,
        email: approver.email,
        firstName: approver.firstName ?? null,
        lastName: approver.lastName ?? null,
        label: buildMemberLabel(
          approver.firstName ?? null,
          approver.lastName ?? null,
          approver.email,
        ),
        roles: [],
        canApprove: true,
        isOrganizationAdmin: approver.isOrgAdmin === true,
        isDefaultApprover: approver.isDefault === true,
      });
    });

    return Array.from(memberMap.values()).sort((first, second) =>
      first.label.localeCompare(second.label),
    );
  }, [ccMemberOptions, membersQuery.members, normalizedDelegateOptions, delegateIdentitySet]);

  return {
    options: mergedOptions,
    isPending: membersQuery.isPending || delegateOptionsQuery.isPending || ccMemberOptionsQuery.isPending,
    isError: membersQuery.isError || delegateOptionsQuery.isError || ccMemberOptionsQuery.isError,
    errorMessage:
      membersQuery.error?.message ?? delegateOptionsQuery.error?.message ?? ccMemberOptionsQuery.error?.message ?? null,
  };
}

export function useTicketRequestActions() {
  const t = useTranslations('ticket.toasts');
  const createMutation = useCreateTicketRequestMutation();
  const createOvertimeMutation = useCreateOvertimeTicketRequestMutation();
  const declareOtEffortMutation = useDeclareOtEffortMutation();
  const updateMutation = useUpdateTicketRequestMutation();
  const cancelMutation = useCancelTicketRequestMutation();
  const approveMutation = useApproveTicketRequestMutation();
  const rejectMutation = useRejectTicketRequestMutation();
  const requestChangesMutation = useRequestChangesTicketRequestMutation();
  const addCommentMutation = useAddTicketCommentMutation();
  const addCcMembersMutation = useAddTicketCcMembersMutation();
  const removeCcMemberMutation = useRemoveTicketCcMemberMutation();

  const createTicket = async (payload: CreateTicketRequestBody) => {
    const result = await createMutation.mutateAsync(payload);

    if (isOk(result)) {
      toast.success(t('created'));
      return { ok: true as const, data: result.data };
    }

    if (isErr(result)) {
      const message = toErrorMessage(result.error, t('createFailed'));
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  const createOvertimeTicket = async (payload: CreateOvertimeTicketRequestBody) => {
    const result = await createOvertimeMutation.mutateAsync(payload);

    if (isOk(result)) {
      toast.success(t('overtimeCreated'));
      return { ok: true as const, data: result.data };
    }

    if (isErr(result)) {
      const message = toErrorMessage(result.error, t('overtimeCreateFailed'));
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  const declareOtEffort = async (ticketId: string, body: DeclareOtEffortBody) => {
    const result = await declareOtEffortMutation.mutateAsync({ ticketId, body });

    if (isOk(result)) {
      toast.success(t('otDeclared'));
      return { ok: true as const, data: result.data };
    }

    if (isErr(result)) {
      const message = toErrorMessage(result.error, t('otDeclareFailed'));
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  const updateTicket = async (ticketId: string, body: UpdateTicketRequestBody) => {
    const result = await updateMutation.mutateAsync({ ticketId, body });

    if (isOk(result)) {
      toast.success(t('resubmitted'));
      return { ok: true as const, data: result.data };
    }

    if (isErr(result)) {
      const message = toErrorMessage(result.error, t('resubmitFailed'));
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  const cancelTicket = async (ticketId: string) => {
    const result = await cancelMutation.mutateAsync(ticketId);

    if (isOk(result)) {
      toast.success(t('canceled'));
      return { ok: true as const, data: result.data };
    }

    if (isErr(result)) {
      const message = toErrorMessage(result.error, t('cancelFailed'));
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  const approveTicket = async (ticketId: string, body: TicketDecisionNoteBody) => {
    const result = await approveMutation.mutateAsync({ ticketId, body });

    if (isOk(result)) {
      toast.success(t('approved'));
      return { ok: true as const, data: result.data };
    }

    if (isErr(result)) {
      // Backend bug: approve succeeds in DB (ticket advances) but the subsequent
      // getTicketDetail call returns 403 because the actor is no longer the delegate.
      // Treat "not allowed to view" as a successful decision — the list will refresh.
      if (result.error.message?.toLowerCase().includes('not allowed to view')) {
        toast.success(t('approved'));
        return { ok: true as const };
      }
      const message = toErrorMessage(result.error, t('approveFailed'));
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  const rejectTicket = async (ticketId: string, body: TicketDecisionReasonBody) => {
    const result = await rejectMutation.mutateAsync({ ticketId, body });

    if (isOk(result)) {
      toast.success(t('rejected'));
      return { ok: true as const, data: result.data };
    }

    if (isErr(result)) {
      if (result.error.message?.toLowerCase().includes('not allowed to view')) {
        toast.success(t('rejected'));
        return { ok: true as const };
      }
      const message = toErrorMessage(result.error, t('rejectFailed'));
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  const requestChanges = async (ticketId: string, body: TicketDecisionReasonBody) => {
    const result = await requestChangesMutation.mutateAsync({ ticketId, body });

    if (isOk(result)) {
      toast.success(t('changesRequested'));
      return { ok: true as const, data: result.data };
    }

    if (isErr(result)) {
      if (result.error.message?.toLowerCase().includes('not allowed to view')) {
        toast.success(t('changesRequested'));
        return { ok: true as const };
      }
      const message = toErrorMessage(result.error, t('changesRequestFailed'));
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  const addComment = async (ticketId: string, content: string) => {
    const result = await addCommentMutation.mutateAsync({
      ticketId,
      body: { content },
    });

    if (isOk(result)) {
      toast.success(t('commentAdded'));
      return { ok: true as const, data: result.data };
    }

    if (isErr(result)) {
      const message = toErrorMessage(result.error, t('commentAddFailed'));
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  const addCcMembers = async (ticketId: string, memberIds: string[]) => {
    const uniqueIds = Array.from(new Set(memberIds));
    const result = await addCcMembersMutation.mutateAsync({
      ticketId,
      body: { memberIds: uniqueIds },
    });

    if (isOk(result)) {
      toast.success(t('ccUpdated'));
      return { ok: true as const, data: result.data };
    }

    if (isErr(result)) {
      const message = toErrorMessage(result.error, t('ccAddFailed'));
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  const removeCcMember = async (ticketId: string, memberId: string) => {
    const result = await removeCcMemberMutation.mutateAsync({ ticketId, memberId });

    if (isOk(result)) {
      toast.success(t('ccRemoved'));
      return { ok: true as const, data: result.data };
    }

    if (isErr(result)) {
      const message = toErrorMessage(result.error, t('ccRemoveFailed'));
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  return {
    createTicket,
    createOvertimeTicket,
    updateTicket,
    cancelTicket,
    approveTicket,
    rejectTicket,
    requestChanges,
    declareOtEffort,
    addComment,
    addCcMembers,
    removeCcMember,
    isCreating: createMutation.isPending,
    isCreatingOvertime: createOvertimeMutation.isPending,
    isUpdating: updateMutation.isPending,
    isCanceling: cancelMutation.isPending,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isRequestingChanges: requestChangesMutation.isPending,
    isDeclaring: declareOtEffortMutation.isPending,
    isAddingComment: addCommentMutation.isPending,
    isUpdatingCc: addCcMembersMutation.isPending || removeCcMemberMutation.isPending,
    isMutating:
      createMutation.isPending ||
      createOvertimeMutation.isPending ||
      updateMutation.isPending ||
      cancelMutation.isPending ||
      approveMutation.isPending ||
      rejectMutation.isPending ||
      requestChangesMutation.isPending ||
      declareOtEffortMutation.isPending ||
      addCommentMutation.isPending ||
      addCcMembersMutation.isPending ||
      removeCcMemberMutation.isPending,
  };
}
