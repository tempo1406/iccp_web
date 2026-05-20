'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeQuery, useSafeMutation } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';

// NOTE: Admin endpoints — placeholder implementations until backend admin API is available.

export function useAdminTenants(input?: { page?: number; limit?: number; search?: string }) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: ['admin', 'tenants', input],
      queryFn: async () => ({
        data: [] as { id: string; name: string; status: string }[],
        total: 0,
        page: input?.page ?? 1,
        limit: input?.limit ?? 20,
      }),
      staleTime: 30_000,
    }),
  );
}

export function useAdminTenant(id: string) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: ['admin', 'tenant', id],
      queryFn: async () => null as { id: string; name: string; status: string } | null,
      enabled: Boolean(id),
    }),
  );
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: async (_body: { name: string }) => ({ tenantId: '' }),
      onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'tenants'] }),
    }),
  );
}

export function useSetTenantStatus() {
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: async (_body: { id: string; status: string }) => ({ success: true }),
      onSuccess: (_d, v) => {
        void qc.invalidateQueries({ queryKey: ['admin', 'tenant', v.id] });
        void qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      },
    }),
  );
}

export function usePlatformStats() {
  return useSafeQuery(
    useQuery({
      queryKey: ['admin', 'platformStats'],
      queryFn: async () => ({
        totalTenants: 0,
        activeTenants: 0,
        totalUsers: 0,
        totalDocuments: 0,
      }),
      staleTime: 60_000,
    }),
  );
}
