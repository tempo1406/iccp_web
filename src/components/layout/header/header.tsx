'use client';

import { useParams, usePathname } from 'next/navigation';
import { Search, Moon, Sun } from 'lucide-react';
import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/common/constant/routes';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { TeamChatGlobalSearch } from '@/features/tenant/team-chat/components/team-chat-global-search';
import { TenantNotificationBell } from './tenant-notification-bell';
import { UserDashboardNotificationBell } from './user-dashboard-notification-bell';
import { UserMenu } from './user-menu';

interface HeaderBaseProps {
  className?: string;
  notificationBell: ReactNode;
  tenant?: string;
}

function HeaderBase({ className, notificationBell, tenant }: HeaderBaseProps) {
  const t = useTranslations('common.header');
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const isTeamChatRoute = pathname?.includes('/team-chat');
  const shouldShowSearch = Boolean(tenant);

  return (
    <header
      className={cn(
        'bg-background flex h-16 items-center gap-4 border-b px-6',
        className,
      )}
    >
      {isTeamChatRoute && tenant ? (
        <div className="mr-auto min-w-0 max-w-2xl flex-1">
          <TeamChatGlobalSearch tenant={tenant} />
        </div>
      ) : shouldShowSearch ? (
        <div className="mr-auto relative w-full max-w-md">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder={t('searchPlaceholder')}
            className="bg-muted/50 w-full border-0 pl-9 focus-visible:ring-1"
          />
        </div>
      ) : (
        <div className="mr-auto" />
      )}

      <div className="flex items-center gap-2">
        <LanguageSwitcher
          className="w-auto min-w-0"
          triggerClassName="h-10 w-[140px]  border-border/70 bg-background/80"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={t('toggleTheme')}
        >
          <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">{t('toggleTheme')}</span>
        </Button>

        {notificationBell}
        <UserMenu tenant={tenant} />
      </div>
    </header>
  );
}

interface HeaderProps {
  className?: string;
}

export function TenantHeader({ className }: HeaderProps) {
  const params = useParams();
  const pathname = usePathname();
  const tenantParam = params?.tenant;
  const tenant = Array.isArray(tenantParam)
    ? tenantParam[0]
    : (tenantParam as string | undefined);
  const isTeamChatRoute = pathname?.includes('/team-chat') ?? false;
  const notificationsHref = tenant
    ? isTeamChatRoute
      ? `${ROUTES.tenant.notifications(tenant)}?feed=activity`
      : ROUTES.tenant.notifications(tenant)
    : ROUTES.dashboardNotifications;

  return (
    <HeaderBase
      className={className}
      tenant={tenant}
      notificationBell={<TenantNotificationBell notificationsHref={notificationsHref} />}
    />
  );
}

export function UserDashboardHeader({ className }: HeaderProps) {
  return (
    <HeaderBase
      className={className}
      notificationBell={
        <UserDashboardNotificationBell notificationsHref={ROUTES.dashboardNotifications} />
      }
    />
  );
}

export function Header({ className }: HeaderProps) {
  const params = useParams();
  const tenantParam = params?.tenant;
  const tenant = Array.isArray(tenantParam)
    ? tenantParam[0]
    : (tenantParam as string | undefined);

  return tenant ? <TenantHeader className={className} /> : <UserDashboardHeader className={className} />;
}
