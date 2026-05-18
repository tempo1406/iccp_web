'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeQuery, useSafeMutation } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { SettingsService } from '../services/settings.service';
import type { UserProfileDto, TenantSettingsDto } from '../services/settings.service';

export function useMySettings() {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: ['settings', 'profile'],
      queryFn: () => new SettingsService(ctx).getProfile(),
      staleTime: 5 * 60_000,
    }),
  );
}

export function useUpdateProfile() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: Partial<Omit<UserProfileDto, 'id' | 'email'>>) =>
        new SettingsService(ctx).updateProfile(body),
      onSuccess: () => void qc.invalidateQueries({ queryKey: ['settings', 'profile'] }),
    }),
  );
}

export function useChangePassword() {
  const ctx = useServiceContext();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: { currentPassword: string; newPassword: string }) =>
        new SettingsService(ctx).changePassword(body),
    }),
  );
}

export function useTenantSettings() {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: ['settings', 'tenant'],
      queryFn: () => new SettingsService(ctx).getTenantSettings(),
      staleTime: 5 * 60_000,
    }),
  );
}

export function useUpdateTenantSettings() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: Partial<TenantSettingsDto>) =>
        new SettingsService(ctx).updateTenantSettings(body),
      onSuccess: () => void qc.invalidateQueries({ queryKey: ['settings', 'tenant'] }),
    }),
  );
}
