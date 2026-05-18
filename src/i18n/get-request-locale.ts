import { cookies, headers } from 'next/headers';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  normalizeLocale,
  resolveLocaleFromAcceptLanguage,
  type AppLocale,
} from './config';

export async function getRequestLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieLocale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  if (cookieLocale) {
    return cookieLocale;
  }

  const browserLocale = resolveLocaleFromAcceptLanguage(
    headerStore.get('accept-language'),
  );

  return browserLocale ?? DEFAULT_LOCALE;
}
