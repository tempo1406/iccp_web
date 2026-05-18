import { PageHeader } from '@/components/layout';

export function SettingsPageHeader() {
  return (
    <PageHeader
      title="Settings"
      description="Manage your account preferences and application settings."
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]}
    />
  );
}
