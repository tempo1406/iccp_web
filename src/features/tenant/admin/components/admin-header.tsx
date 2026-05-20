import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export function AdminPageHeader() {
  return (
    <PageHeader
      title="Admin Control Center"
      description="Monitor system health, manage tenancy, and specific configurations."
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Admin' }]}
      actions={
        <Button variant="destructive">
          <AlertTriangle className="mr-2 h-4 w-4" />
          System Maintenance Mode
        </Button>
      }
    />
  );
}
