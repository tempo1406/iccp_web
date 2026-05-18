// Pages (Server Components)
export { LoginPage } from './pages/login-page';
export { RegisterPage } from './pages/register-page';
export { ForgotPasswordPage } from './pages/forgot-password-page';
export { VerifyEmailPage } from './pages/verify-email-page';
export { ResetPasswordPage } from './pages/reset-password-page';

// Components (Client Components)
export { LoginForm } from './components/login-form';
export { RegisterForm } from './components/register-form';
export { ForgotPasswordForm } from './components/forgot-password-form';
export { VerifyEmailView } from './components/verify-email-view';
export { ResetPasswordForm } from './components/reset-password-form';

// Hooks (UI layer — toast, redirect, dispatch)
export { useLogin } from './hooks/use-login';
export { useRegister } from './hooks/use-register';
export { useForgotPassword } from './hooks/use-forgot-password';
export { useVerifyEmail } from './hooks/use-verify-email';
export { useResendOtp } from './hooks/use-resend-otp';
export { useResetPassword } from './hooks/use-reset-password';
export { useLogout } from './hooks/use-logout';

// Query mutations (pure — no UI side effects)
export {
  useLoginMutation,
  useRegisterMutation,
  useVerifyEmailMutation,
  useResendOtpMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutMutation,
} from './query';

// Validation schemas
export {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  verifyEmailSchema,
  resetPasswordSchema,
  resetPasswordPayloadSchema,
} from './validation/auth.schema';

// Types
export type { AuthUser, AuthSession, AuthTokens } from './types';
