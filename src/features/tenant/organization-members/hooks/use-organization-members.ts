'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { isErr, isOk } from '@/lib/safe-query';
import { toast } from '@/lib/toast';
import { useServiceContext } from '@/lib/use-service-context';
import type {
  ListMembersQueryDto,
  ListMembersResponseData,
  MemberDetailsResponseData,
  MemberDto,
  OrganizationMemberApiDto,
  RoleDto,
} from '@/services/organizations/types';
import {
  useOrganizationMemberDetailQuery,
  useOrganizationMembersQuery,
  useRemoveOrganizationMemberMutation,
  useUpdateOrganizationMemberStatusMutation,
} from '../query/members.queries';
import { organizationMemberKeys } from '../query/members.queries';
import { OrganizationService } from '@/services/organizations/organization.service';

function normalizeOptionalId(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function mapMember(item: OrganizationMemberApiDto): MemberDto {
  const userId = item.userId ?? item.user_id ?? item.user?.id ?? '';
  const email = item.user_email ?? item.email ?? item.user?.email ?? '';
  const firstName = item.user_firstName ?? item.firstName ?? item.user?.firstName ?? null;
  const lastName = item.user_lastName ?? item.lastName ?? item.user?.lastName ?? null;
  const avatarUrl = item.user_avatarUrl ?? item.avatarUrl ?? item.user?.avatarUrl ?? null;
  const phone = item.user_phone ?? item.phone ?? item.user?.phone ?? null;
  const dateOfBirth = item.user_dateOfBirth ?? item.dateOfBirth ?? item.user?.dateOfBirth ?? null;

  const rawRoles = item.roles ?? [];
  const roles: RoleDto[] = rawRoles.map((r) =>
    typeof r === 'string' ? { id: r, name: r } : r,
  );

  return {
    id: item.id,
    organizationId: item.organizationId ?? item.organization_id ?? '',
    userId,
    email,
    invitedBy: normalizeOptionalId(item.invitedBy ?? item.invited_by),
    isActive: item.memberStatus ?? item.member_status ?? item.isActive ?? item.is_active ?? true,
    isOwner: item.isOwner ?? item.is_owner,
    joinedAt: item.joinedAt ?? item.joined_at ?? '',
    leftAt: item.leftAt ?? item.left_at ?? null,
    invitationAcceptedAt: item.invitationAcceptedAt ?? item.invitation_accepted_at ?? null,
    createdAt: item.createdAt ?? item.created_at,
    roles,
    firstName,
    lastName,
    avatarUrl,
    phone,
    dateOfBirth,
    userIsActive: item.user?.isActive ?? item.user_isActive,
    userIsVerified: item.user?.isVerified ?? item.user_isVerified,
  };
}

function normalizeMembers(raw: ListMembersResponseData | undefined): MemberDto[] {
  if (!raw) return [];

  const list = Array.isArray(raw)
    ? raw
    : 'data' in raw && Array.isArray(raw.data)
      ? raw.data
      : 'data' in raw && raw.data && typeof raw.data === 'object' && 'data' in raw.data && Array.isArray(raw.data.data)
        ? raw.data.data
        : 'items' in raw && Array.isArray(raw.items)
          ? raw.items
          : [];

  return list
    .map(mapMember)
    .filter((member) => member.userId.length > 0 && member.email.length > 0);
}

function isOrganizationMemberApiDto(value: unknown): value is OrganizationMemberApiDto {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'id' in value &&
      typeof (value as { id?: unknown }).id === 'string',
  );
}

function normalizeMemberDetails(raw: MemberDetailsResponseData | undefined): MemberDto | null {
  if (!raw) return null;

  const payload: unknown =
    'data' in raw && raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)
      ? raw.data
      : raw;

  if (!isOrganizationMemberApiDto(payload)) {
    return null;
  }

  return mapMember(payload);
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

export function useOrganizationMembersData(params: ListMembersQueryDto = {}, enabled = true) {
  const ctx = useServiceContext();
  const membersQuery = useOrganizationMembersQuery(params, { enabled });
  const members = useMemo(() => normalizeMembers(membersQuery.data), [membersQuery.data]);
  const membersMissingInviter = useMemo(
    () => members.filter((member) => !member.invitedBy),
    [members],
  );
  const missingInviterDetails = useQueries({
    queries: membersMissingInviter.map((member) => ({
      queryKey: organizationMemberKeys.byId(ctx.tenantId, member.userId),
      queryFn: () => new OrganizationService(ctx).getMemberById(member.userId),
      enabled: Boolean(ctx.tenantId) && enabled && membersQuery.isSuccess,
      staleTime: 30_000,
    })),
  });

  const enrichedMembers = useMemo(() => {
    if (membersMissingInviter.length === 0) return members;

    const detailByUserId = new Map<string, MemberDto>();
    missingInviterDetails.forEach((query, index) => {
      if (!query.data) return;

      const detail = normalizeMemberDetails(query.data);
      if (detail) {
        detailByUserId.set(membersMissingInviter[index].userId, detail);
      }
    });

    if (detailByUserId.size === 0) return members;

    return members.map((member) => {
      if (member.invitedBy) return member;

      const detail = detailByUserId.get(member.userId);
      if (!detail?.invitedBy) return member;

      return {
        ...member,
        invitedBy: detail.invitedBy,
      };
    });
  }, [members, membersMissingInviter, missingInviterDetails]);

  return {
    members: enrichedMembers,
    isPending: membersQuery.isPending,
    isError: membersQuery.isError,
    error: membersQuery.error,
  };
}

export function useOrganizationMemberDetails(memberId: string | null, enabled = true) {
  const memberDetailQuery = useOrganizationMemberDetailQuery(memberId, enabled);

  return {
    member: normalizeMemberDetails(memberDetailQuery.data),
    isPending: memberDetailQuery.isPending,
    isError: memberDetailQuery.isError,
    error: memberDetailQuery.error,
  };
}

export function useOrganizationMembersActions() {
  const removeMutation = useRemoveOrganizationMemberMutation();
  const updateStatusMutation = useUpdateOrganizationMemberStatusMutation();

  const removeMember = async (userId: string, email?: string) => {
    const result = await removeMutation.mutateAsync(userId);
    if (isOk(result)) {
      toast.success('Member removed from organization.', email);
      return { ok: true as const };
    }

    if (isErr(result)) {
      const message = toErrorMessage(result.error, 'Failed to remove member from organization.');
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  const updateMemberStatus = async (userId: string, isActive: boolean, email?: string) => {
    const result = await updateStatusMutation.mutateAsync({ userId, isActive });

    if (isOk(result)) {
      toast.success(
        isActive ? 'Member activated successfully.' : 'Member deactivated successfully.',
        email,
      );
      return { ok: true as const };
    }

    if (isErr(result)) {
      const message = toErrorMessage(result.error, 'Failed to update member status.');
      toast.danger(message);
      return { ok: false as const, error: message };
    }

    return { ok: false as const, error: 'Unknown error' };
  };

  return {
    removeMember,
    updateMemberStatus,
    isRemoving: removeMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isSaving: removeMutation.isPending || updateStatusMutation.isPending,
  };
}
