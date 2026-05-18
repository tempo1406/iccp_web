import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { useServiceContext } from '@/lib/use-service-context';
import { OrganizationService } from '@/services/organizations/organization.service';
import type { CreateOrganizationDto, OrganizationDto } from '@/services/organizations/types';

export const ORG_QUERY_KEYS = {
  myOrgs: ['organizations', 'my-orgs'] as const,
};

export function useMyOrgsQuery(
  options?: Omit<UseQueryOptions<OrganizationDto[], Error>, 'queryKey' | 'queryFn'>,
) {
  const ctx = useServiceContext();
  return useQuery({
    queryKey: ORG_QUERY_KEYS.myOrgs,
    queryFn: () => new OrganizationService(ctx).getMyOrgs(),
    staleTime: 60_000,
    ...options,
  });
}

export function useCreateOrgMutation(
  options?: Omit<UseMutationOptions<void, Error, CreateOrganizationDto>, 'mutationFn'>,
) {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateOrganizationDto) => new OrganizationService(ctx).createOrg(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ORG_QUERY_KEYS.myOrgs });
    },
    ...options,
  });
}
