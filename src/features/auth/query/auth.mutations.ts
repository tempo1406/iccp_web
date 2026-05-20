'use client';

/**
 * src/features/auth/query/auth.mutations.ts
 *
 * Pure TanStack Query mutation definitions cho auth.
 * Chỉ chứa mutationFn — không có UI logic (toast, redirect, dispatch).
 *
 * Hooks trong ../hooks/ sẽ wrap các mutations này với onSuccess/onError handlers.
 */

import { useMutation } from '@tanstack/react-query';
import {
  loginApi,
  registerApi,
  verifyEmailApi,
  resendOtpApi,
  forgotPasswordApi,
  resetPasswordApi,
} from '@/services/auth/auth.service';
import type {
  LoginPayload,
  RegisterPayload,
  VerifyEmailPayload,
  ResendOtpPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '@/services/auth/types/auth.types';

// ── Mutation hooks (bare — no UI side effects) ────────────────────────────────

export function useLoginMutation(options?: Parameters<typeof useMutation<Awaited<ReturnType<typeof loginApi>>, Error, LoginPayload>>[0]) {
  return useMutation({
    mutationFn: loginApi,
    ...options,
  });
}

export function useRegisterMutation(options?: Parameters<typeof useMutation<Awaited<ReturnType<typeof registerApi>>, Error, RegisterPayload>>[0]) {
  return useMutation({
    mutationFn: registerApi,
    ...options,
  });
}

export function useVerifyEmailMutation(options?: Parameters<typeof useMutation<Awaited<ReturnType<typeof verifyEmailApi>>, Error, VerifyEmailPayload>>[0]) {
  return useMutation({
    mutationFn: verifyEmailApi,
    ...options,
  });
}

export function useResendOtpMutation(options?: Parameters<typeof useMutation<Awaited<ReturnType<typeof resendOtpApi>>, Error, ResendOtpPayload>>[0]) {
  return useMutation({
    mutationFn: resendOtpApi,
    ...options,
  });
}

export function useForgotPasswordMutation(options?: Parameters<typeof useMutation<Awaited<ReturnType<typeof forgotPasswordApi>>, Error, ForgotPasswordPayload>>[0]) {
  return useMutation({
    mutationFn: forgotPasswordApi,
    ...options,
  });
}

export function useResetPasswordMutation(options?: Parameters<typeof useMutation<Awaited<ReturnType<typeof resetPasswordApi>>, Error, ResetPasswordPayload>>[0]) {
  return useMutation({
    mutationFn: resetPasswordApi,
    ...options,
  });
}

export function useLogoutMutation(options?: Parameters<typeof useMutation<void, Error, void>>[0]) {
  return useMutation({
    mutationFn: async () => {
      // Logout is stateless (JWT) — no server call needed
    },
    ...options,
  });
}
