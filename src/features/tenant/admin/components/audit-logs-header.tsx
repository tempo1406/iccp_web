import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function AuditLogsPageHeader() {
  return (
    <PageHeader
      title="Audit Logs"
      description="Track and monitor all system activities and security events."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin', href: '/admin' },
        { label: 'Audit Logs' },
      ]}
      actions={
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      }
    />
  );
}
