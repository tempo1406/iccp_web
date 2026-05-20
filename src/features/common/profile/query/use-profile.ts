'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeQuery, useSafeMutation } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { UsersService } from '@/services/users/users.service';
import type { UpdateMyProfileDto } from '@/services/users/types';

export function useProfile() {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: ['profile', 'me'],
      queryFn: () => new UsersService(ctx).getMe(),
      staleTime: 5 * 60_000,
    }),
  );
}

export function useUpdateProfile() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: UpdateMyProfileDto) => new UsersService(ctx).updateMe(body),
      onSuccess: () => void qc.invalidateQueries({ queryKey: ['profile', 'me'] }),
    }),
  );
}
