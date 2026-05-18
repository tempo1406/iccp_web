import type { Metadata } from 'next';
import { AuthGuard } from '@/components/auth/auth-guard';
import { RbacLoader } from '@/components/auth/rbac-loader';
import { TenantProvider } from '@/providers/tenant-context';
import {
  APP_LOADING_ICON,
  buildTenantDescription,
  buildTenantTitle,
  formatTenantLabel,
} from '@/common/constant/metadata';

interface TenantProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}

export default async function TenantProjectLayout({
  children,
  params,
}: TenantProjectLayoutProps) {
  const { tenant } = await params;

  return (
    <AuthGuard>
      <TenantProvider tenantSlug={tenant}>
        <RbacLoader>{children}</RbacLoader>
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
    icons: {
      icon: APP_LOADING_ICON,
      apple: APP_LOADING_ICON,
    },
  };
}
