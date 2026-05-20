import { GDriveSyncFoldersCard } from '@/features/tenant/admin/components/gdrive-sync-folders-card';
import { GDriveSyncPageHeader } from '@/features/tenant/admin/components/gdrive-sync-header';
import { GDriveSyncSettingsCard } from '@/features/tenant/admin/components/gdrive-sync-settings-card';
import { GDriveSyncStatusCard } from '@/features/tenant/admin/components/gdrive-sync-status-card';

export default function GDriveSyncPage() {
  return (
    <div className="space-y-6">
      <GDriveSyncPageHeader />

      <div className="grid gap-6 md:grid-cols-2">
        <GDriveSyncSettingsCard />
        <GDriveSyncStatusCard />
        <div className="md:col-span-2">
          <GDriveSyncFoldersCard />
        </div>
      </div>
    </div>
  );
}
