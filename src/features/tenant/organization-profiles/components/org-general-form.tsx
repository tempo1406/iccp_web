'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import {
  createUpdateOrgGeneralSchema,
  type UpdateOrgGeneralForm,
} from '../validation/org-profile.validation';
import { OrgLogoUploader } from './org-logo-uploader';
import type { OrgProfileResponse, UpdateOrgGeneralBody } from '../types/org-profile.types';

interface OrgGeneralFormProps {
  defaultValues: OrgProfileResponse | undefined;
  isSubmitting: boolean;
  onSubmit: (
    values: UpdateOrgGeneralForm | UpdateOrgGeneralBody,
    options?: { successMessage?: string },
  ) => Promise<boolean>;
}

export function OrgGeneralForm({ defaultValues, isSubmitting, onSubmit }: OrgGeneralFormProps) {
  const t = useTranslations('orgConfig.organizationProfile.generalForm');
  const validationT = useTranslations('orgConfig.organizationProfile.validation');
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateOrgGeneralForm>({
    resolver: zodResolver(
      createUpdateOrgGeneralSchema({
        nameMax: validationT('nameMax'),
        websiteMax: validationT('websiteMax'),
        websiteUrl: validationT('websiteUrl'),
        emailMax: validationT('emailMax'),
        emailFormat: validationT('emailFormat'),
        brandColorHex: validationT('brandColorHex'),
        botNameMax: validationT('botNameMax'),
      }),
    ) as any,
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      logoUrl: defaultValues?.logoUrl ?? '',
      website: defaultValues?.website ?? '',
      contactEmail: defaultValues?.contactEmail ?? '',
    },
  });

  const logoUrl = watch('logoUrl');
  const orgName = watch('name');
  const normalizedLogoUrl = logoUrl?.trim() ? logoUrl : undefined;

  useEffect(() => {
    if (defaultValues) {
      reset(
        {
          name: defaultValues.name ?? '',
          description: defaultValues.description ?? '',
          logoUrl: defaultValues.logoUrl ?? '',
          website: defaultValues.website ?? '',
          contactEmail: defaultValues.contactEmail ?? '',
        },
        { keepDirtyValues: true },
      );
    }
  }, [defaultValues, reset]);

  const handleFormSubmit = handleSubmit(async (values) => {
    const ok = await onSubmit(values);
    if (ok) {
      reset(values);
    }
  });

  const handleLogoUpload = async (url: string) => {
    const ok = await onSubmit(
      { logoUrl: url },
      { successMessage: t('toasts.logoUpdated') },
    );

    if (ok) {
      setValue('logoUrl', url, { shouldDirty: false });
    }

    return ok;
  };

  const handleLogoRemove = async () => {
    const ok = await onSubmit(
      { logoUrl: null },
      { successMessage: t('toasts.logoRemoved') },
    );

    if (ok) {
      setValue('logoUrl', '', { shouldDirty: false });
    }

    return ok;
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="rounded-3xl border border-[var(--brand-muted)] bg-gradient-to-br from-[var(--brand-light)] to-white p-5 dark:to-slate-950/60">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t('logo.title')}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {t('logo.description')}
            </p>
          </div>
          <Badge
            variant="outline"
            className="rounded-full border-[var(--brand-muted)] bg-white/80 text-[var(--brand)]"
          >
            {t('logo.badge')}
          </Badge>
        </div>

        <OrgLogoUploader
          currentLogoUrl={normalizedLogoUrl}
          orgName={orgName || defaultValues?.name}
          onUpload={handleLogoUpload}
          onRemove={handleLogoRemove}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/50">
          <div className="mb-5 space-y-1">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t('identity.title')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('identity.description')}
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="org-name">{t('fields.name')}</Label>
              <Input id="org-name" placeholder={t('placeholders.name')} {...register('name')} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-description">{t('fields.description')}</Label>
              <Textarea
                id="org-description"
                placeholder={t('placeholders.description')}
                className="min-h-[150px] resize-none"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/50">
          <div className="mb-5 space-y-1">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t('contact.title')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('contact.description')}
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="org-website">{t('fields.website')}</Label>
              <Input
                id="org-website"
                placeholder={t('placeholders.website')}
                type="url"
                {...register('website')}
              />
              {errors.website && (
                <p className="text-sm text-destructive">{errors.website.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-contact-email">{t('fields.contactEmail')}</Label>
              <Input
                id="org-contact-email"
                placeholder={t('placeholders.contactEmail')}
                type="email"
                {...register('contactEmail')}
              />
              {errors.contactEmail && (
                <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
              )}
            </div>

          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950/40">
        <p className="text-sm leading-6 text-muted-foreground">
          {t('footerNote')}
        </p>
        <Button type="submit" disabled={isSubmitting || !isDirty} className="min-w-36">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('save')}
        </Button>
      </div>
    </form>
  );
}
