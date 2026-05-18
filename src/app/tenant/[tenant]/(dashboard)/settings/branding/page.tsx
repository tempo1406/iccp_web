import { notFound } from 'next/navigation';

export default function BrandingPage() {
  /*
  "use client"

  import { useState } from 'react';
  import { ROUTES } from '@/common/constant/routes';
  import { PageHeader } from '@/components/layout/page-header';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
  import { Button } from '@/components/ui/button';
  import { BrandingEditor } from '@/features/common/settings/components/branding-editor';
  import { BrandingLivePreview } from '@/features/common/settings/components/branding-live-preview';
  import { type BotPersonaId } from '@/features/common/settings/components/branding-data';
  import { SettingsEmptyTab } from '@/features/common/settings/components/settings-empty-tab';
  import { useTenant } from '@/providers';

  export default function BrandingPage() {
    const { tenantSlug } = useTenant();
    const [primaryColor, setPrimaryColor] = useState('#1337EC');
    const [botName, setBotName] = useState('Consulting Assistant');
    const [selectedPersona, setSelectedPersona] = useState<BotPersonaId>('friendly');
    const [ssoEnabled, setSsoEnabled] = useState(true);
    const [ipWhitelist, setIpWhitelist] = useState(true);

    return (
      <div className="space-y-6">
        <PageHeader
          title="Organization Settings"
          description="Manage your company details, branding customization, and security preferences for the internal chatbot."
          breadcrumbs={[
            { label: 'Dashboard', href: ROUTES.tenant.dashboard(tenantSlug) },
            { label: 'Settings', href: ROUTES.tenant.settings(tenantSlug) },
            { label: 'Organization' },
          ]}
          actions={
            <div className="flex gap-3">
              <Button variant="outline">Cancel</Button>
              <Button>Save Changes</Button>
            </div>
          }
        />

        <Tabs defaultValue="branding">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="mt-6">
            <div className="grid gap-8 lg:grid-cols-3">
              <BrandingEditor
                primaryColor={primaryColor}
                botName={botName}
                selectedPersona={selectedPersona}
                ssoEnabled={ssoEnabled}
                ipWhitelist={ipWhitelist}
                onPrimaryColorChange={setPrimaryColor}
                onBotNameChange={setBotName}
                onPersonaChange={setSelectedPersona}
                onSsoEnabledChange={setSsoEnabled}
                onIpWhitelistChange={setIpWhitelist}
              />
              <BrandingLivePreview primaryColor={primaryColor} botName={botName} />
            </div>
          </TabsContent>

          <TabsContent value="general" className="mt-6">
            <SettingsEmptyTab message="General organization settings would go here." />
          </TabsContent>
          <TabsContent value="security" className="mt-6">
            <SettingsEmptyTab message="Security settings would go here." />
          </TabsContent>
          <TabsContent value="integrations" className="mt-6">
            <SettingsEmptyTab message="Integration settings would go here." />
          </TabsContent>
          <TabsContent value="billing" className="mt-6">
            <SettingsEmptyTab message="Billing settings would go here." />
          </TabsContent>
        </Tabs>
      </div>
    );
  }
  */

  // Tenant settings pages are temporarily disabled, but the previous code is kept above.
  notFound();
}
