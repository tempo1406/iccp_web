'use client';

import { useParams, usePathname } from 'next/navigation';
import { Sidebar, TenantHeader } from '@/components/layout';
import { ROUTES } from '@/common/constant/routes';
import { cn } from '@/lib/utils';
import { TenantRouteAccessGuard } from './tenant-route-access-guard';

interface TenantDashboardShellProps {
  children: React.ReactNode;
}

export function TenantDashboardShell({ children }: TenantDashboardShellProps) {
  const pathname = usePathname();
  const params = useParams<{ tenant?: string }>();
  const tenant = typeof params.tenant === 'string' ? params.tenant : '';
  const isWorkspacePage =
    tenant.length > 0 &&
    (pathname === ROUTES.tenant.notifications(tenant) ||
      pathname.startsWith(ROUTES.tenant.teamChat(tenant)) ||
      pathname === ROUTES.tenant.organizationLandingPage(tenant));

  return (
    <div
      className={cn(
        'bg-background flex',
        isWorkspacePage ? 'h-screen overflow-hidden' : 'min-h-screen',
      )}
    >
      <Sidebar />
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col',
          isWorkspacePage && 'overflow-hidden',
        )}
      >
        <TenantHeader className="sticky top-0 z-20 border-slate-200/50 bg-white/80 backdrop-blur-md dark:border-slate-800/50 dark:bg-[#0b0e14]/80" />
        <main
          className={cn(
            'flex min-h-0 min-w-0 flex-1 flex-col p-6',
            isWorkspacePage && 'overflow-hidden',
          )}
        >
          <TenantRouteAccessGuard>{children}</TenantRouteAccessGuard>
        </main>
      </div>
    </div>
  );
}
