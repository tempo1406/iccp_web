import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/providers';
import { getRequestLocale } from '@/i18n/get-request-locale';
import { getMessagesForLocale } from '@/i18n/messages';
import {
  APP_DEFAULT_DESCRIPTION,
  APP_DEFAULT_ICON,
  APP_DEFAULT_TITLE,
} from '@/common/constant/metadata';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: APP_DEFAULT_TITLE,
  description: APP_DEFAULT_DESCRIPTION,
  icons: {
    icon: APP_DEFAULT_ICON,
    apple: APP_DEFAULT_ICON,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const messages = getMessagesForLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/material-symbols-outlined.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased overflow-x-hidden`}
        suppressHydrationWarning
      >
        <AppProviders initialLocale={locale} initialMessages={messages}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
