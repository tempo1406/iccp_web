'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeMutation, useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { OrganizationService } from '@/services/organizations/organization.service';
import type { ListMembersQueryDto } from '@/services/organizations/types';

const memberRootKey = (tenantId: string | null | undefined) =>
  ['organization', 'members', tenantId] as const;

const myOrgsKey = () => ['organization', 'my-orgs'] as const;

/** Fetches all orgs the current user belongs to — accessible to every member. */
export function useMyOrgs() {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: myOrgsKey(),
      queryFn: () => new OrganizationService(ctx).getMyOrgs(),
      staleTime: 120_000,
    }),
  );
}

export const organizationMemberKeys = {
  root: memberRootKey,
  all: (tenantId: string | null | undefined, params: ListMembersQueryDto) =>
    [
      ...memberRootKey(tenantId),
      params.page ?? 1,
      params.limit ?? 100,
      params.sortBy ?? 'createdAt',
      params.sortOrder ?? 'DESC',
      params.search ?? '',
      typeof params.isActive === 'boolean' ? String(params.isActive) : 'all',
    ] as const,
  byId: (tenantId: string | null | undefined, memberId: string) =>
    [...memberRootKey(tenantId), 'detail', memberId] as const,
};

const DEFAULT_MEMBERS_QUERY: ListMembersQueryDto = {
  page: 1,
  limit: 100,
  sortBy: 'createdAt',
  sortOrder: 'DESC',
};

export function useOrganizationMembersQuery(
  params: ListMembersQueryDto = {},
  options?: { enabled?: boolean },
) {
  const ctx = useServiceContext();
  const resolvedParams: ListMembersQueryDto = { ...DEFAULT_MEMBERS_QUERY, ...params };

  return useSafeQuery(
    useQuery({
      queryKey: organizationMemberKeys.all(ctx.tenantId, resolvedParams),
      queryFn: () => new OrganizationService(ctx).getMembers(resolvedParams),
      enabled: Boolean(ctx.tenantId) && (options?.enabled ?? true),
      staleTime: 30_000,
    }),
  );
}

export function useOrganizationMemberDetailQuery(memberId: string | null, enabled = true) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: organizationMemberKeys.byId(ctx.tenantId, memberId ?? ''),
      queryFn: () => new OrganizationService(ctx).getMemberById(memberId ?? ''),
      enabled: Boolean(ctx.tenantId) && Boolean(memberId) && enabled,
    }),
  );
}

export function useRemoveOrganizationMemberMutation() {
  const ctx = useServiceContext();
  const qc = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (userId: string) => new OrganizationService(ctx).removeMember(userId),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: organizationMemberKeys.root(ctx.tenantId) });
      },
    }),
  );
}

export function useUpdateOrganizationMemberStatusMutation() {
  const ctx = useServiceContext();
  const qc = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
        new OrganizationService(ctx).updateMemberStatus(userId, { isActive }),
      onSuccess: (_data, variables) => {
        void qc.invalidateQueries({ queryKey: organizationMemberKeys.root(ctx.tenantId) });
        void qc.invalidateQueries({
          queryKey: organizationMemberKeys.byId(ctx.tenantId, variables.userId),
        });
      },
    }),
  );
}
