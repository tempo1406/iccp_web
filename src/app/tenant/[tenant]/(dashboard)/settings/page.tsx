import { notFound } from 'next/navigation';

export default function SettingsPage() {
  /*
  import { SettingsPageHeader } from '@/features/common/settings/components/settings-header';
  import { SettingsQuickLinks } from '@/features/common/settings/components/settings-quick-links';
  import { SettingsTabs } from '@/features/common/settings/components/settings-tabs';

  export default function SettingsPage() {
    return (
      <div className="space-y-6">
        <SettingsPageHeader />
        <SettingsQuickLinks />
        <SettingsTabs />
      </div>
    );
  }
  */

  // Tenant settings pages are temporarily disabled, but the previous code is kept above.
  notFound();
}
