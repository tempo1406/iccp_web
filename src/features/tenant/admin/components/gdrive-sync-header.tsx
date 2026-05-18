import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function GDriveSyncPageHeader() {
  return (
    <PageHeader
      title="Google Drive Sync Config"
      description="Configure how documents are synced from Google Drive."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin', href: '/admin' },
        { label: 'GDrive Sync' },
      ]}
      actions={
        <Button>
          <RefreshCw className="mr-2 h-4 w-4" />
          Force Sync Now
        </Button>
      }
    />
  );
}
