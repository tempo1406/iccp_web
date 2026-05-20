import { z } from 'zod';

type Translate = (key: string) => string;

const fallbackMessages: Record<string, string> = {
  emailRequired: 'Email is required',
  invalidEmail: 'Invalid email address',
  passwordRequired: 'Password is required',
  fullNameMin: 'Full name must be at least 2 characters',
  fullNameMax: 'Full name must be at most 80 characters',
  passwordMin: 'Password must be at least 8 characters',
  confirmPasswordRequired: 'Please confirm your password',
  passwordsDoNotMatch: 'Passwords do not match',
  otpLength: 'OTP must be exactly 6 characters',
  otpDigits: 'OTP must contain exactly 6 digits',
};

const fallbackTranslate: Translate = (key) => fallbackMessages[key] ?? key;

export function createLoginSchema(t: Translate) {
  return z.object({
    email: z.string().min(1, t('emailRequired')).email(t('invalidEmail')),
    password: z.string().min(1, t('passwordRequired')),
    rememberMe: z.boolean().default(false),
  });
}

export type LoginInput = z.infer<ReturnType<typeof createLoginSchema>>;

export function createRegisterSchema(t: Translate) {
  return z
    .object({
      fullName: z.string().min(2, t('fullNameMin')).max(80, t('fullNameMax')),
      email: z.string().min(1, t('emailRequired')).email(t('invalidEmail')),
      password: z.string().min(8, t('passwordMin')),
      confirmPassword: z.string().min(1, t('confirmPasswordRequired')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('passwordsDoNotMatch'),
      path: ['confirmPassword'],
    });
}

export type RegisterInput = z.infer<ReturnType<typeof createRegisterSchema>>;

export function createForgotPasswordSchema(t: Translate) {
  return z.object({
    email: z.string().min(1, t('emailRequired')).email(t('invalidEmail')),
  });
}

export type ForgotPasswordInput = z.infer<ReturnType<typeof createForgotPasswordSchema>>;

export function createVerifyEmailSchema(t: Translate) {
  return z.object({
    email: z.string().email(t('invalidEmail')),
    otp: z.string().length(6, t('otpLength')).regex(/^\d{6}$/, t('otpDigits')),
  });
}

export type VerifyEmailInput = z.infer<ReturnType<typeof createVerifyEmailSchema>>;

export function createResetPasswordPayloadSchema(t: Translate) {
  return z.object({
    email: z.string().email(t('invalidEmail')),
    otp: z.string().length(6, t('otpLength')).regex(/^\d{6}$/, t('otpDigits')),
    newPassword: z.string().min(8, t('passwordMin')),
  });
}

export function createResetPasswordSchema(t: Translate) {
  return createResetPasswordPayloadSchema(t)
    .extend({
      confirmPassword: z.string().min(1, t('confirmPasswordRequired')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('passwordsDoNotMatch'),
      path: ['confirmPassword'],
    });
}

export type ResetPasswordInput = z.infer<ReturnType<typeof createResetPasswordSchema>>;

export const loginSchema = createLoginSchema(fallbackTranslate);
export const registerSchema = createRegisterSchema(fallbackTranslate);
export const forgotPasswordSchema = createForgotPasswordSchema(fallbackTranslate);
export const verifyEmailSchema = createVerifyEmailSchema(fallbackTranslate);
export const resetPasswordPayloadSchema =
  createResetPasswordPayloadSchema(fallbackTranslate);
export const resetPasswordSchema = createResetPasswordSchema(fallbackTranslate);
