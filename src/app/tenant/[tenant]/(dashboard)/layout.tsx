import type { Metadata } from 'next';
import { TenantProvider } from '@/providers/tenant-context';
import { BrandColorProvider } from '@/providers/brand-color-provider';
import { AuthGuard } from '@/components/auth/auth-guard';
import { RbacLoader } from '@/components/auth/rbac-loader';
import { TenantDashboardShell } from '@/features/tenant/access-control/components/tenant-dashboard-shell';
import {
  buildTenantDescription,
  buildTenantTitle,
  formatTenantLabel,
} from '@/common/constant/metadata';

/**
 * Tenant Dashboard Layout
 *
 * – Receives [tenant] param from the URL and stores it in TenantContext
 *   so every Client Component in the tree can call useTenant().
 * – RbacLoader runs inside TenantProvider so it can inject X-Organization-Id
 *   when calling GET /api/v1/rbac/me.
 */
export default async function TenantDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;

  return (
    <AuthGuard>
      <TenantProvider tenantSlug={tenant}>
        <BrandColorProvider>
          <RbacLoader>
            <TenantDashboardShell>{children}</TenantDashboardShell>
          </RbacLoader>
        </BrandColorProvider>
      </TenantProvider>
    </AuthGuard>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;
  const label = formatTenantLabel(tenant);

  return {
    title: buildTenantTitle(label),
    description: buildTenantDescription(label),
  };
}

