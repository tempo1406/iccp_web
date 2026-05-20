'use client';

import { Bot, MessageCircle, Palette, Sparkles, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { BotPersona } from '../types/org-profile.types';

interface OrgBrandingPreviewProps {
  brandColor?: string;
  botName?: string;
  botPersona?: BotPersona;
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const safeHex = normalized.length === 3
    ? normalized
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
    : normalized;

  if (!/^[0-9A-Fa-f]{6}$/.test(safeHex)) {
    return `rgba(59, 130, 246, ${alpha})`;
  }

  const red = Number.parseInt(safeHex.slice(0, 2), 16);
  const green = Number.parseInt(safeHex.slice(2, 4), 16);
  const blue = Number.parseInt(safeHex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function OrgBrandingPreview({
  brandColor,
  botName,
  botPersona,
}: OrgBrandingPreviewProps) {
  const t = useTranslations('orgConfig.organizationProfile.brandingPreview');
  const color = brandColor || '#3B82F6';
  const name = botName || t('assistantFallback');
  const persona: BotPersona = botPersona ?? 'friendly';

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-card shadow-sm dark:border-slate-800">
      <div className="border-b bg-slate-50/70 px-5 py-4 dark:bg-slate-950/60">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-base font-semibold">{t('title')}</p>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {t('description')}
            </p>
          </div>
          <Badge
            variant="outline"
            className="rounded-full border-[var(--brand-muted)] bg-[var(--brand-light)] text-[var(--brand)]"
          >
            {t('badge')}
          </Badge>
        </div>
      </div>

      <div
        className="p-5"
        style={{
          backgroundImage: `radial-gradient(circle at top, ${hexToRgba(color, 0.18)}, transparent 58%)`,
        }}
      >
        <div className="mx-auto max-w-sm overflow-hidden rounded-[26px] border border-black/5 bg-white shadow-[0_22px_50px_-24px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-slate-950">
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ backgroundColor: color }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{name}</p>
                <p className="text-xs text-white/75">{t('widget.subtitle')}</p>
              </div>
            </div>
            <button className="text-white/70 transition hover:text-white" type="button">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 bg-slate-50 px-4 py-5 dark:bg-slate-900/70">
            <div className="flex items-start gap-2.5">
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: color }}
              >
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div className="max-w-[220px] rounded-2xl rounded-tl-none bg-white px-3 py-2 text-sm leading-6 text-slate-700 shadow-sm dark:bg-slate-950 dark:text-slate-200">
                {t(`widget.messages.${persona}`)}
              </div>
            </div>

            <div className="flex justify-end">
              <div className="max-w-[220px] rounded-2xl rounded-tr-none bg-slate-900 px-3 py-2 text-sm leading-6 text-white dark:bg-slate-800">
                {t('widget.userMessage')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t px-4 py-3 dark:border-slate-800">
            <div className="flex-1 rounded-full border bg-slate-50 px-3 py-2 text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
              {t('widget.placeholder')}
            </div>
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: color }}
            >
              <MessageCircle className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-t px-5 py-4 sm:grid-cols-2 dark:border-slate-800">
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/50">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Palette className="h-4 w-4 text-primary" />
            {t('primaryColor')}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-2xl border border-white/70 shadow-inner"
              style={{ backgroundColor: color }}
            />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{color}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/50">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Sparkles className="h-4 w-4 text-primary" />
            {t('conversationTone')}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            {t(`personaLabels.${persona}`)}
          </p>
        </div>
      </div>
    </div>
  );
}
