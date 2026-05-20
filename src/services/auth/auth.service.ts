import { apiFetch } from '@/config/http/api-client';
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  ForgotPasswordPayload,
  VerifyEmailPayload,
  ResendOtpPayload,
  ResetPasswordPayload,
} from './types/auth.types';

export async function loginApi(payload: LoginPayload): Promise<LoginResponse> {
  return apiFetch<LoginResponse, LoginPayload>('/v1/auth/login', {
    method: 'POST',
    body: payload,
  });
}

/**
 * register — POST /api/v1/auth/register
 */
export async function registerApi(payload: RegisterPayload): Promise<void> {
  return apiFetch<void, RegisterPayload>('/v1/auth/register', {
    method: 'POST',
    body: payload,
  });
}

/**
 * verifyEmail — POST /api/v1/auth/verify-email
 */
export async function verifyEmailApi(payload: VerifyEmailPayload): Promise<void> {
  return apiFetch<void, VerifyEmailPayload>('/v1/auth/verify-email', {
    method: 'POST',
    body: payload,
  });
}

/**
 * resendOtp — POST /api/v1/auth/resend-otp
 */
export async function resendOtpApi(payload: ResendOtpPayload): Promise<void> {
  return apiFetch<void, ResendOtpPayload>('/v1/auth/resend-otp', {
    method: 'POST',
    body: payload,
  });
}

/**
 * forgotPassword — POST /api/v1/auth/forgot-password
 */
export async function forgotPasswordApi(payload: ForgotPasswordPayload): Promise<void> {
  return apiFetch<void, ForgotPasswordPayload>('/v1/auth/forgot-password', {
    method: 'POST',
    body: payload,
  });
}

/**
 * resetPassword — POST /api/v1/auth/reset-password
 */
export async function resetPasswordApi(payload: ResetPasswordPayload): Promise<void> {
  return apiFetch<void, ResetPasswordPayload>('/v1/auth/reset-password', {
    method: 'POST',
    body: payload,
  });
}
