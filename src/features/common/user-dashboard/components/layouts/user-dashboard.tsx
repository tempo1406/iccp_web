'use client';

import { usePathname } from 'next/navigation';
import { ROUTES } from '@/common/constant/routes';
import { AuthGuard } from '@/components/auth/auth-guard';
import { PageContainer, UserDashboardHeader } from '@/components/layout';
import { cn } from '@/lib/utils';

/**
 * UserDashboard - Shared layout wrapper for /dashboard routes.
 */
export function UserDashboard({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname();
  const isWidePage =
    pathname === ROUTES.dashboardNotifications || pathname === ROUTES.dashboardProfile;
  const isWorkspacePage = pathname === ROUTES.dashboardNotifications;

  return (
    <AuthGuard>
      <div
        className={cn(
          'flex w-full overflow-hidden bg-[#f6f6f8] font-sans text-slate-900 antialiased dark:bg-[#0b0e14] dark:text-slate-100',
          isWorkspacePage ? 'h-screen' : 'min-h-screen',
        )}
      >
        {/* Content Panel */}
        <div
          className={cn(
            'relative flex flex-1 flex-col bg-white/50 backdrop-blur-3xl dark:bg-[#0b0e14]/50',
            isWorkspacePage ? 'overflow-hidden' : 'overflow-y-auto',
          )}
        >
          <UserDashboardHeader
            className="sticky top-0 z-20 border-slate-200/50 bg-white/80 backdrop-blur-md dark:border-slate-800/50 dark:bg-[#0b0e14]/80"
          />

          <main
            className={cn(
              'flex w-full flex-1 flex-col px-6 pb-8 pt-4 sm:px-10 sm:pb-10 sm:pt-6',
              isWorkspacePage && 'min-h-0 overflow-hidden',
            )}
          >
            <PageContainer
              contained={!isWidePage}
              className={cn('flex-1 min-h-0', isWorkspacePage && 'overflow-hidden')}
            >
              {children}
            </PageContainer>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
