'use client';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/common/constant/routes';
import { useRouter } from 'next/navigation';
import type { CreateOrganizationDto } from '@/services/organizations/types';
import {
  useMyOrgsQuery,
  useCreateOrgMutation,
  ORG_QUERY_KEYS,
} from '../query/org.queries';

export function useMyOrgs() {
  const { data: orgs, isLoading, isError, error } = useMyOrgsQuery();

  return {
    orgs: orgs ?? [],
    isLoading,
    isError,
    error,
    hasOrgs: (orgs?.length ?? 0) > 0,
  };
}

export function useCreateOrg() {
  const t = useTranslations('dashboard.createOrganization.toasts');
  const router = useRouter();
  const qc = useQueryClient();

  const mutation = useCreateOrgMutation({
    onSuccess: async () => {
      toast.success(t('created'));
      await qc.invalidateQueries({ queryKey: ORG_QUERY_KEYS.myOrgs });
      router.push(ROUTES.dashboard);
    },
    onError: (error: Error) => {
      const msg = error.message.toLowerCase();
      if (msg.includes('o002') || msg.includes('slug')) {
        toast.danger(t('slugTaken'));
      } else if (msg.includes('o009') || msg.includes('subscription')) {
        toast.danger(t('subscriptionUnavailable'));
      } else {
        toast.danger(error.message || t('createFailed'));
      }
    },
  });

  return {
    createOrg: (data: CreateOrganizationDto) => mutation.mutate(data),
    isPending: mutation.isPending,
  };
}
