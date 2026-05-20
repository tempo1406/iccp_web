export const APP_LOCALES = ['en', 'vi'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'vi';
export const DEFAULT_TIME_ZONE = 'Asia/Saigon';
export const LOCALE_COOKIE_NAME = 'iccp_locale';
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function isAppLocale(value: string): value is AppLocale {
  return APP_LOCALES.includes(value as AppLocale);
}

export function normalizeLocale(input?: string | null): AppLocale | undefined {
  if (!input) return undefined;

  const normalized = input.trim().toLowerCase().replace('_', '-');
  const directMatch = normalized.split('-')[0];

  return isAppLocale(directMatch) ? directMatch : undefined;
}

export function resolveLocaleFromAcceptLanguage(
  acceptLanguage?: string | null,
): AppLocale | undefined {
  if (!acceptLanguage) return undefined;

  for (const token of acceptLanguage.split(',')) {
    const locale = normalizeLocale(token.split(';')[0]);
    if (locale) return locale;
  }

  return undefined;
}
