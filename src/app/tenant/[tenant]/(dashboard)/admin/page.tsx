import { AdminAlertsGrid } from '@/features/tenant/admin/components/admin-alerts-grid';
import { AdminPageHeader } from '@/features/tenant/admin/components/admin-header';
import { AdminQuickAccessGrid } from '@/features/tenant/admin/components/admin-quick-access-grid';
import { AdminServiceHealthCard } from '@/features/tenant/admin/components/admin-service-health-card';
import { AdminSystemHealthGrid } from '@/features/tenant/admin/components/admin-system-health-grid';

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader />
      <AdminQuickAccessGrid />
      <AdminSystemHealthGrid />
      <AdminAlertsGrid />
      <AdminServiceHealthCard />
    </div>
  );
}
