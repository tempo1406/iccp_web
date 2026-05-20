'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { Building2, Loader2 } from 'lucide-react';
import { useCreateOrg } from '../hooks/use-my-orgs';
import { CreateOrgLogoUploader } from './create-org-logo-uploader';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type FormValues = {
  name: string;
  slug: string;
  description?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  logoUrl?: string;
};

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function CreateOrgForm() {
  const t = useTranslations('dashboard.createOrganization');
  const { createOrg, isPending } = useCreateOrg();
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const schema = z.object({
    name: z
      .string()
      .min(1, t('validation.nameRequired'))
      .max(255, t('validation.nameMax')),
    slug: z
      .string()
      .min(1, t('validation.slugRequired'))
      .max(100, t('validation.slugMax'))
      .regex(slugRegex, t('validation.slugPattern')),
    description: z.string().max(500).optional(),
    industry: z.string().max(100).optional(),
    size: z.enum(['small', 'medium', 'large', 'enterprise']).optional(),
    logoUrl: z.string().optional(),
  });

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      logoUrl: '',
    },
  });

  const orgName = useWatch({ control, name: 'name' });
  const logoUrl = useWatch({ control, name: 'logoUrl' });

  function handleNameBlur(event: React.FocusEvent<HTMLInputElement>) {
    const generated = toSlug(event.target.value);
    if (generated) setValue('slug', generated, { shouldValidate: true });
  }

  function onSubmit(data: FormValues) {
    createOrg({
      name: data.name,
      slug: data.slug,
      description: data.description || undefined,
      logoUrl: data.logoUrl || undefined,
      industry: data.industry || undefined,
      size: data.size,
    });
  }

  const inputBase =
    'w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none backdrop-blur transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-primary';
  const labelBase = 'mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <CreateOrgLogoUploader
        value={logoUrl || undefined}
        organizationName={orgName}
        disabled={isPending}
        onUploadingChange={setIsUploadingLogo}
        onChange={(nextLogoUrl) => {
          setValue('logoUrl', nextLogoUrl ?? '', { shouldDirty: true });
        }}
      />

      <div className="rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        <div className="border-b border-slate-200/80 px-6 py-5 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t('detailsTitle')}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('detailsDescription')}
          </p>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div>
            <label className={labelBase}>{t('organizationName')}</label>
            <input
              {...register('name')}
              onBlur={handleNameBlur}
              placeholder={t('organizationNamePlaceholder')}
              className={inputBase}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs font-medium text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className={labelBase}>{t('slug')}</label>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white/80 backdrop-blur transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/60">
              <span className="pr-1 pl-4 text-sm text-slate-400 select-none dark:text-slate-500">
                iccp.platform/
              </span>
              <input
                {...register('slug')}
                placeholder={t('slugPlaceholder')}
                className="flex-1 rounded-r-xl bg-transparent py-3 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-slate-100 dark:placeholder-slate-500"
              />
            </div>
            {errors.slug ? (
              <p className="mt-1.5 text-xs font-medium text-red-500">{errors.slug.message}</p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                {t('slugHint')}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelBase}>{t('industry')}</label>
              <input
                {...register('industry')}
                placeholder={t('industryPlaceholder')}
                className={inputBase}
              />
            </div>
            <div>
              <label className={labelBase}>{t('size')}</label>
              <select
                {...register('size')}
                className={`${inputBase} cursor-pointer appearance-none`}
              >
                <option value="">{t('sizePlaceholder')}</option>
                <option value="small">{t('sizeSmall')}</option>
                <option value="medium">{t('sizeMedium')}</option>
                <option value="large">{t('sizeLarge')}</option>
                <option value="enterprise">{t('sizeEnterprise')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelBase}>{t('description')}</label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder={t('descriptionPlaceholder')}
              className={`${inputBase} resize-none`}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={isPending || isUploadingLogo}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> {t('creating')}
            </>
          ) : isUploadingLogo ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> {t('uploadingLogo')}
            </>
          ) : (
            <>
              <Building2 className="h-4 w-4" /> {t('submit')}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
