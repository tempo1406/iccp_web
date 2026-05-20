'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeQuery, useSafeMutation } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { UsersService } from '../services/users.service';

export function useUserList(input?: { page?: number; limit?: number; search?: string }) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: ['users', 'list', input],
      queryFn: () => new UsersService(ctx).list(input ?? {}),
      staleTime: 30_000,
    }),
  );
}

export function useUserById(id: string) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: ['users', 'byId', id],
      queryFn: () => new UsersService(ctx).byId(id),
      enabled: Boolean(id),
    }),
  );
}

export function useInviteUser() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: { email: string; role: string }) =>
        new UsersService(ctx).invite(body),
      onSuccess: () => void qc.invalidateQueries({ queryKey: ['users', 'list'] }),
    }),
  );
}

export function useRemoveUser() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (id: string) => new UsersService(ctx).remove(id),
      onSuccess: () => void qc.invalidateQueries({ queryKey: ['users', 'list'] }),
    }),
  );
}
