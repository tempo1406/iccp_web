'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from '@/lib/toast';
import type { UpdateMyProfileDto } from '@/services/users/types';
import { ImageKitService } from '@/services/imagekit/imagekit.service';
import { useForgotPasswordMutation, useResetPasswordMutation } from '@/features/auth/query';
import { resetPasswordSchema } from '@/features/auth/validation/auth.schema';
import { useUpdateProfile } from '../query/use-profile';

interface ActionResult {
  ok: boolean;
  error?: string;
}

export function useProfileUpdateAction() {
  const t = useTranslations('profile.toasts');
  const updateProfileMutation = useUpdateProfile();

  const saveProfile = async (payload: UpdateMyProfileDto): Promise<ActionResult> => {
    const result = await updateProfileMutation.mutateAsync(payload);
    if (result.ok) {
      toast.success(t('profileUpdated'));
      return { ok: true };
    }

    const error = result.error.message || t('profileUpdateFailed');
    toast.danger(error);
    return { ok: false, error };
  };

  return {
    saveProfile,
    isPending: updateProfileMutation.isPending,
  };
}

export function useAvatarUploadAction() {
  const t = useTranslations('profile.toasts');
  const { saveProfile } = useProfileUpdateAction();
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const uploadAvatar = async (file: File): Promise<{ ok: boolean; url?: string }> => {
    setIsUploading(true);
    try {
      const svc = new ImageKitService();
      const { url } = await svc.upload(file, 'avatars');
      const result = await saveProfile({ avatarUrl: url });
      if (result.ok) {
        return { ok: true, url };
      }
      return { ok: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : t('avatarUploadFailed');
      toast.danger(message);
      return { ok: false };
    } finally {
      setIsUploading(false);
    }
  };

  const removeAvatar = async (): Promise<{ ok: boolean }> => {
    setIsRemoving(true);
    try {
      const result = await saveProfile({ avatarUrl: null });
      if (result.ok) {
        return { ok: true };
      }
      return { ok: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : t('avatarRemoveFailed');
      toast.danger(message);
      return { ok: false };
    } finally {
      setIsRemoving(false);
    }
  };

  return { uploadAvatar, isUploading, removeAvatar, isRemoving };
}

export function useProfilePasswordAction() {
  const t = useTranslations('profile.toasts');
  const forgotPasswordMutation = useForgotPasswordMutation();
  const resetPasswordMutation = useResetPasswordMutation();

  const sendOtp = async (email?: string): Promise<ActionResult> => {
    if (!email) {
      const error = t('otpEmailMissing');
      toast.danger(error);
      return { ok: false, error };
    }

    try {
      await forgotPasswordMutation.mutateAsync({ email });
      toast.success(t('otpSent'));
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : t('otpSendFailed');
      toast.danger(message);
      return { ok: false, error: message };
    }
  };

  const resetPassword = async (input: {
    email?: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ActionResult> => {
    if (!input.email) {
      const error = t('resetEmailMissing');
      toast.danger(error);
      return { ok: false, error };
    }

    const parsed = resetPasswordSchema.safeParse({
      email: input.email,
      otp: input.otp,
      newPassword: input.newPassword,
      confirmPassword: input.confirmPassword,
    });

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? t('resetInvalidPayload'),
      };
    }

    try {
      await resetPasswordMutation.mutateAsync({
        email: parsed.data.email,
        otp: parsed.data.otp,
        newPassword: parsed.data.newPassword,
      });
      toast.success(t('passwordUpdated'));
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('passwordUpdateFailed');
      return { ok: false, error: message };
    }
  };

  return {
    sendOtp,
    resetPassword,
    isSendingOtp: forgotPasswordMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
  };
}
