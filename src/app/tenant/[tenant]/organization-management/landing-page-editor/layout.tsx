import { TenantProvider } from '@/providers/tenant-context';
import { AuthGuard } from '@/components/auth/auth-guard';
import { RbacLoader } from '@/components/auth/rbac-loader';

/**
 * Full-screen editor route - NO dashboard shell (no sidebar, no header).
 * Uses its own minimal layout with only auth + tenant context.
 */
export default async function EditorLayout({
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
        <RbacLoader>{children}</RbacLoader>
      </TenantProvider>
    </AuthGuard>
  );
}
