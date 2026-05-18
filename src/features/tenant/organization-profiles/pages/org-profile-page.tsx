'use client';

import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  Building2,
  Palette,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { OrgProfileHeader } from '../components/org-profile-header';
import { OrgGeneralForm } from '../components/org-general-form';
import { OrgBrandingForm } from '../components/org-branding-form';
import { useOrgProfilePage } from '../hooks/use-org-profile-page';

export function OrgProfilePage() {
  const t = useTranslations('orgConfig.organizationProfile');
  const {
    profile,
    isPending,
    isError,
    isSubmittingGeneral,
    isSubmittingBranding,
    setPreviewBranding,
    handleSubmitGeneral,
    handleSubmitBranding,
  } = useOrgProfilePage();

  return (
    <div className="space-y-6">
      <OrgProfileHeader profile={profile} isLoading={isPending} />

      {isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('page.loadFailed')}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <div className="flex justify-start">
          <TabsList className="inline-flex h-11 overflow-hidden rounded-full border border-[var(--brand-muted)] bg-[var(--brand-light)] p-[2px]">
            <TabsTrigger
              value="general"
              className="h-full min-w-[148px] gap-2 rounded-full px-5 py-0 text-muted-foreground transition data-[state=active]:border data-[state=active]:border-[var(--brand-muted)] data-[state=active]:bg-background data-[state=active]:text-[var(--brand)] data-[state=active]:shadow-none"
            >
              <Building2 className="h-4 w-4" />
              {t('page.tabs.general')}
            </TabsTrigger>
            <TabsTrigger
              value="branding"
              className="h-full min-w-[148px] gap-2 rounded-full px-5 py-0 text-muted-foreground transition data-[state=active]:border data-[state=active]:border-[var(--brand-muted)] data-[state=active]:bg-background data-[state=active]:text-[var(--brand)] data-[state=active]:shadow-none"
            >
              <Palette className="h-4 w-4" />
              {t('page.tabs.branding')}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="mt-0">
          <Card className="gap-0 overflow-hidden border-slate-200/80 shadow-sm dark:border-slate-800">
            <CardHeader className="border-b bg-slate-50/70 dark:bg-slate-950/60">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>{t('page.generalCard.title')}</CardTitle>
                  <Badge
                    variant="outline"
                    className="rounded-full border-[var(--brand-muted)] bg-[var(--brand-light)] text-[var(--brand)]"
                  >
                    {t('page.generalCard.badge')}
                  </Badge>
                </div>
              <CardDescription>
                {t('page.generalCard.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <OrgGeneralForm
                defaultValues={profile}
                isSubmitting={isSubmittingGeneral}
                onSubmit={handleSubmitGeneral}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="mt-0">
          <Card className="gap-0 overflow-hidden border-slate-200/80 shadow-sm dark:border-slate-800">
            <CardHeader className="border-b bg-slate-50/70 dark:bg-slate-950/60">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{t('page.brandingCard.title')}</CardTitle>
                <Badge
                  variant="outline"
                  className="rounded-full border-[var(--brand-muted)] bg-[var(--brand-light)] text-[var(--brand)]"
                >
                  {t('page.brandingCard.badge')}
                </Badge>
              </div>
              <CardDescription>
                {t('page.brandingCard.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <OrgBrandingForm
                defaultValues={profile?.branding}
                isSubmitting={isSubmittingBranding}
                onSubmit={handleSubmitBranding}
                onPreviewChange={setPreviewBranding}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
