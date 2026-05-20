'use client';

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { AbstractIntlMessages } from 'next-intl';
import { NextIntlClientProvider } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { useAppDispatch, useAppSelector } from '@/store';
import { setProfile } from '@/store/slices/user/user.slice';
import { UsersService } from '@/services/users/users.service';
import type { UserProfileDto } from '@/services/users/types';
import { authTokens } from '@/services/local-storage/auth.storage';
import {
  APP_LOCALES,
  DEFAULT_LOCALE,
  DEFAULT_TIME_ZONE,
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
  normalizeLocale,
  type AppLocale,
} from './config';
import { getMessagesForLocale } from './messages';

interface LocaleContextValue {
  locale: AppLocale;
  locales: readonly AppLocale[];
  isUpdating: boolean;
  setLocale: (locale: AppLocale) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps extends PropsWithChildren {
  initialLocale: AppLocale;
  initialMessages: AbstractIntlMessages;
}

function writeLocaleCookie(locale: AppLocale) {
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

function mergeLocaleUpdatedProfile(
  currentProfile: UserProfileDto | null,
  updatedProfile: UserProfileDto,
  locale: AppLocale,
): UserProfileDto {
  if (!currentProfile) {
    return {
      ...updatedProfile,
      locale,
    };
  }

  return {
    ...currentProfile,
    ...updatedProfile,
    email: updatedProfile.email ?? currentProfile.email,
    firstName: updatedProfile.firstName ?? currentProfile.firstName,
    lastName: updatedProfile.lastName ?? currentProfile.lastName,
    avatarUrl: updatedProfile.avatarUrl ?? currentProfile.avatarUrl,
    locale,
  };
}

export function LocaleProvider({
  children,
  initialLocale,
  initialMessages,
}: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);
  const [messages, setMessages] = useState<AbstractIntlMessages>(initialMessages);
  const [isUpdating, setIsUpdating] = useState(false);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const currentProfile = useAppSelector((state) => state.user.profile);
  const profileLocale = normalizeLocale(useAppSelector((state) => state.user.profile?.locale));
  const syncFailedTitle = 'Could not sync language preference';
  const syncFailedDescription =
    'Your language changed on this device, but we could not save it to your account yet.';

  useEffect(() => {
    document.documentElement.lang = locale;
    writeLocaleCookie(locale);
  }, [locale]);

  useEffect(() => {
    if (!profileLocale || profileLocale === locale) return;

    startTransition(() => {
      setLocaleState(profileLocale);
      setMessages(getMessagesForLocale(profileLocale));
    });
  }, [locale, profileLocale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      locales: APP_LOCALES,
      isUpdating,
      async setLocale(nextLocale) {
        const normalizedLocale = normalizeLocale(nextLocale) ?? DEFAULT_LOCALE;

        startTransition(() => {
          setLocaleState(normalizedLocale);
          setMessages(getMessagesForLocale(normalizedLocale));
        });

        writeLocaleCookie(normalizedLocale);

        const accessToken = authTokens.getAccess();
        if (!accessToken) {
          return;
        }

        setIsUpdating(true);

        try {
          const updatedProfile = await new UsersService({
            accessToken,
          }).updateMe({ locale: normalizedLocale });
          const mergedProfile = mergeLocaleUpdatedProfile(
            currentProfile,
            updatedProfile,
            normalizedLocale,
          );

          dispatch(setProfile(mergedProfile));
          queryClient.setQueryData(['profile', 'me'], mergedProfile);
        } catch (error) {
          console.error('Failed to persist locale preference:', error);
          toast.warning(syncFailedTitle, syncFailedDescription);
        } finally {
          setIsUpdating(false);
        }
      },
    }),
    [currentProfile, dispatch, isUpdating, locale, queryClient],
  );

  return (
    <LocaleContext.Provider value={value}>
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone={DEFAULT_TIME_ZONE}
      >
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useAppLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error('useAppLocale must be used inside LocaleProvider');
  }

  return context;
}
