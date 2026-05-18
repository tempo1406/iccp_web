import { AuthGuard } from '@/components/auth/auth-guard';
import { Suspense } from 'react';
import type { ReactNode } from 'react';

/**
 * Platform layout: shared wrapper cho landing page và login.
 * Không có sidebar/header – giao diện public.
 */
export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AuthGuard>{children}</AuthGuard>
    </Suspense>
  );
}
