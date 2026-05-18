'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Check, Loader2, Palette, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  createUpdateOrgBrandingSchema,
  type UpdateOrgBrandingForm,
} from '../validation/org-profile.validation';
import { BRAND_COLORS, resolveBrandColor } from '../brand-colors';
import type { BotPersona, OrgBranding } from '../types/org-profile.types';

const PERSONA_OPTIONS: BotPersona[] = ['friendly', 'professional', 'concise'];

interface OrgBrandingFormProps {
  defaultValues: OrgBranding | undefined;
  isSubmitting: boolean;
  onSubmit: (values: UpdateOrgBrandingForm) => Promise<boolean>;
  onPreviewChange?: (values: UpdateOrgBrandingForm) => void;
}

export function OrgBrandingForm({
  defaultValues,
  isSubmitting,
  onSubmit,
  onPreviewChange,
}: OrgBrandingFormProps) {
  const t = useTranslations('orgConfig.organizationProfile.brandingForm');
  const validationT = useTranslations('orgConfig.organizationProfile.validation');
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateOrgBrandingForm>({
    resolver: zodResolver(
      createUpdateOrgBrandingSchema({
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
      brandColor: defaultValues?.brandColor ?? BRAND_COLORS[0].hex,
      botName: defaultValues?.botName ?? '',
      botPersona: defaultValues?.botPersona ?? 'friendly',
    },
  });

  const brandColor = watch('brandColor');
  const botPersona = watch('botPersona');

  // Resolve the active preset (for color swatch highlight)
  const activePreset = resolveBrandColor(brandColor);

  useEffect(() => {
    if (defaultValues) {
      reset({
        brandColor: defaultValues.brandColor ?? BRAND_COLORS[0].hex,
        botName: defaultValues.botName ?? '',
        botPersona: defaultValues.botPersona ?? 'friendly',
      });
    }
  }, [defaultValues, reset]);

  // Propagate live changes to parent for preview
  useEffect(() => {
    if (!onPreviewChange) return;
    const sub = watch((values) => {
      onPreviewChange(values as UpdateOrgBrandingForm);
    });
    return () => sub.unsubscribe();
  }, [watch, onPreviewChange]);

  const handleFormSubmit = handleSubmit(async (values) => {
    const ok = await onSubmit(values);
    if (ok) reset(values);
  });

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* ── Brand Color ── */}
      <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-5 dark:border-slate-800 dark:from-slate-950 dark:to-slate-950/60">
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Palette className="text-primary h-4 w-4" />
          <p className="text-base font-semibold">{t('color.title')}</p>
        </div>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          {t('color.description')}
        </p>

        {/* 7 Preset Swatches */}
        <div className="mt-5 flex flex-wrap gap-3">
          {BRAND_COLORS.map((color) => {
            const isSelected = activePreset.id === color.id;
            return (
              <button
                key={color.id}
                type="button"
                onClick={() => setValue('brandColor', color.hex, { shouldDirty: true })}
                title={color.name}
                aria-label={`${color.name}${isSelected ? ' (selected)' : ''}`}
                className={cn(
                  'relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  isSelected
                    ? 'scale-110 ring-2 ring-offset-2 ring-offset-background shadow-md'
                    : 'hover:scale-105 hover:shadow-sm',
                )}
                style={{
                  backgroundColor: color.hex,
                  ['--tw-ring-color' as any]: color.hex,
                }}
              >
                {isSelected && (
                  <Check
                    className="h-5 w-5 drop-shadow"
                    style={{ color: color.fg }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected color label + hex */}
        <div className="mt-4 flex items-center gap-2.5">
          <div
            className="h-5 w-5 rounded-full border border-white/70 shadow-sm"
            style={{ backgroundColor: activePreset.hex }}
            aria-hidden
          />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {activePreset.name}
          </span>
          <span className="font-mono text-xs text-muted-foreground">{activePreset.hex}</span>
        </div>

        {/* Hidden input keeps the value in RHF */}
        <input type="hidden" {...register('brandColor')} />

        {errors.brandColor && (
          <p className="mt-3 text-sm text-destructive">{errors.brandColor.message}</p>
        )}
      </div>

      {/* ── Assistant Identity ── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/50">
        <div className="mb-5 space-y-1">
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t('assistant.title')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('assistant.description')}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bot-name">{t('fields.botName')}</Label>
          <Input
            id="bot-name"
            placeholder={t('placeholders.botName')}
            maxLength={100}
            {...register('botName')}
          />
          {errors.botName && (
            <p className="text-sm text-destructive">{errors.botName.message}</p>
          )}
        </div>
      </div>

      {/* ── Conversation Style ── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/50">
        <div className="mb-5 space-y-1">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Sparkles className="text-primary h-4 w-4" />
            <p className="text-base font-semibold">{t('persona.title')}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('persona.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {PERSONA_OPTIONS.map((option) => {
            const isSelected = botPersona === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setValue('botPersona', option, { shouldDirty: true })}
                className={cn(
                  'rounded-2xl border p-4 text-left transition-all',
                  isSelected
                    ? 'shadow-sm'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-slate-700 dark:hover:bg-slate-900/60',
                )}
                style={
                  isSelected
                    ? {
                        borderColor: 'var(--brand-muted)',
                        backgroundColor: 'var(--brand-light)',
                      }
                    : undefined
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {t(`persona.options.${option}.label`)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {t(`persona.options.${option}.description`)}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'mt-1 h-4 w-4 shrink-0 rounded-full border-2 transition-colors',
                      !isSelected && 'border-slate-300 dark:border-slate-600',
                    )}
                    style={
                      isSelected
                        ? { borderColor: 'var(--brand)', backgroundColor: 'var(--brand)' }
                        : undefined
                    }
                  />
                </div>
              </button>
            );
          })}
        </div>

        {errors.botPersona && (
          <p className="mt-3 text-sm text-destructive">{errors.botPersona.message}</p>
        )}
      </div>

      {/* ── Submit ── */}
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
