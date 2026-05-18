'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from '@/lib/toast';
import { isErr } from '@/lib/safe-query';
import { useOrgProfile, useUpdateOrgBranding, useUpdateOrgGeneral } from '../query/use-org-profile';
import type { UpdateOrgBrandingForm, UpdateOrgGeneralForm } from '../validation/org-profile.validation';
import type { UpdateOrgBrandingForm as BrandingPreview } from '../validation/org-profile.validation';
import type { UpdateOrgBrandingBody, UpdateOrgGeneralBody } from '../types/org-profile.types';

/** Strip undefined values while preserving explicit empty strings for clearable fields. */
function stripUndefined<T extends object>(values: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(values as Record<string, unknown>).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

/** Strip empty strings for forms that should only submit populated branding values. */
function stripEmpty<T extends Record<string, unknown>>(values: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(values).filter(([, v]) => v !== undefined && v !== ''),
  ) as Partial<T>;
}

const GENERAL_NULLABLE_FIELDS = new Set<keyof UpdateOrgGeneralBody>([
  'description',
  'logoUrl',
  'website',
  'contactEmail',
]);

function toGeneralBody(values: UpdateOrgGeneralForm | UpdateOrgGeneralBody): UpdateOrgGeneralBody {
  return Object.fromEntries(
    Object.entries(values).flatMap(([key, rawValue]) => {
      if (rawValue === undefined) return [];
      if (rawValue === '' && GENERAL_NULLABLE_FIELDS.has(key as keyof UpdateOrgGeneralBody)) {
        return [[key, null]];
      }
      return [[key, rawValue]];
    }),
  ) as UpdateOrgGeneralBody;
}

interface SubmitGeneralOptions {
  successMessage?: string;
}

export function useOrgProfilePage() {
  const t = useTranslations('orgConfig.organizationProfile');
  const { data: profile, isPending, isError } = useOrgProfile();
  const updateGeneral = useUpdateOrgGeneral();
  const updateBranding = useUpdateOrgBranding();

  const [previewBranding, setPreviewBranding] = useState<BrandingPreview | undefined>(undefined);

  async function handleSubmitGeneral(
    values: UpdateOrgGeneralForm | UpdateOrgGeneralBody,
    options?: SubmitGeneralOptions,
  ): Promise<boolean> {
    const body = stripUndefined(toGeneralBody(values)) as UpdateOrgGeneralBody;
    const result = await updateGeneral.mutateAsync(body);
    if (isErr(result)) {
      toast.danger(result.error.message ?? t('toasts.generalUpdateFailed'));
      return false;
    }
    toast.success(options?.successMessage ?? t('toasts.generalUpdated'));
    return true;
  }

  async function handleSubmitBranding(values: UpdateOrgBrandingForm): Promise<boolean> {
    const body = stripEmpty(values) as UpdateOrgBrandingBody;
    const result = await updateBranding.mutateAsync(body);
    if (isErr(result)) {
      toast.danger(result.error.message ?? t('toasts.brandingUpdateFailed'));
      return false;
    }
    toast.success(t('toasts.brandingUpdated'));
    return true;
  }

  return {
    profile,
    isPending,
    isError,
    isSubmittingGeneral: updateGeneral.isPending,
    isSubmittingBranding: updateBranding.isPending,
    previewBranding,
    setPreviewBranding,
    handleSubmitGeneral,
    handleSubmitBranding,
  };
}
