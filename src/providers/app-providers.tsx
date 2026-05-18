'use client';
import { QueryProvider } from './query-provider';
import { ReduxProvider } from './redux-provider';
import { ThemeProvider } from './theme-provider';
import { ToastProvider } from './toast-provider';
import { SocketProvider } from './socket-provider';
import { NotificationRealtimeBridge } from '@/features/common/notifications/realtime/notification-realtime-bridge';
import { LocaleProvider } from '@/i18n/provider';
import type { AppLocale } from '@/i18n/config';
import type { AbstractIntlMessages } from 'next-intl';

interface AppProvidersProps {
  children: React.ReactNode;
  initialLocale: AppLocale;
  initialMessages: AbstractIntlMessages;
}

export function AppProviders({
  children,
  initialLocale,
  initialMessages,
}: AppProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <ReduxProvider>
        <QueryProvider>
          <LocaleProvider
            initialLocale={initialLocale}
            initialMessages={initialMessages}
          >
            <SocketProvider>
              <NotificationRealtimeBridge />
              {children}
              <ToastProvider />
            </SocketProvider>
          </LocaleProvider>
        </QueryProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}
