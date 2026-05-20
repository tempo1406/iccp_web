'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { useAppLocale } from '@/i18n/provider';
import type { AppLocale } from '@/i18n/config';

interface LanguageSwitcherProps {
  className?: string;
  triggerClassName?: string;
}

const LANGUAGE_META: Record<AppLocale, { iconSrc: string }> = {
  en: { iconSrc: '/icons/united-kingdom.svg' },
  vi: { iconSrc: '/icons/vietnam.svg' },
};

export function LanguageSwitcher({
  className,
  triggerClassName,
}: LanguageSwitcherProps) {
  const t = useTranslations('common.language');
  const { locale, locales, setLocale, isUpdating } = useAppLocale();
  const currentLanguage = LANGUAGE_META[locale];

  return (
    <div className={cn('min-w-32', className)}>
      <Select
        value={locale}
        onValueChange={(value) => void setLocale(value as AppLocale)}
        disabled={isUpdating}
      >
        <SelectTrigger
          aria-label={t('ariaLabel')}
          className={cn('gap-2', triggerClassName)}
        >
          <div className="flex min-w-0 items-center gap-2">
            <Image
              src={currentLanguage.iconSrc}
              alt=""
              aria-hidden="true"
              width={16}
              height={16}
              className="h-4 w-4 shrink-0 rounded-full object-cover"
            />
            <span className="truncate">{t(`options.${locale}`)}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {locales.map((item) => (
            <SelectItem key={item} value={item} textValue={t(`options.${item}`)}>
              <span className="flex items-center gap-2">
                <Image
                  src={LANGUAGE_META[item].iconSrc}
                  alt=""
                  aria-hidden="true"
                  width={16}
                  height={16}
                  className="h-4 w-4 shrink-0 rounded-full object-cover"
                />
                <span>{t(`options.${item}`)}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
