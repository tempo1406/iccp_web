import { notFound } from 'next/navigation';

export default function IntegrationsPage() {
  /*
  import { RefreshCw } from 'lucide-react';
  import { ROUTES } from '@/common/constant/routes';
  import { PageHeader } from '@/components/layout';
  import { Button } from '@/components/ui/button';
  import { integrations } from '@/features/common/settings/components/integrations-data';
  import { IntegrationsGrid } from '@/features/common/settings/components/integrations-grid';
  import { useTenant } from '@/providers';

  export default function IntegrationsPage() {
    const { tenantSlug } = useTenant();
    return (
      <div className="space-y-6">
        <PageHeader
          title="Integrations"
          description="Connect your favorite tools to enhance your workflow."
          breadcrumbs={[
            { label: 'Dashboard', href: ROUTES.tenant.dashboard(tenantSlug) },
            { label: 'Settings', href: ROUTES.tenant.settings(tenantSlug) },
            { label: 'Integrations' },
          ]}
          actions={
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync All
            </Button>
          }
        />

        <IntegrationsGrid integrations={integrations} />
      </div>
    );
  }
  */

  // Tenant settings pages are temporarily disabled, but the previous code is kept above.
  notFound();
}
