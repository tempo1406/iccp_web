'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LockKeyhole, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfilePasswordUpdateDialog } from './profile-password-update-dialog';

interface ProfileSecurityCardProps {
  email?: string | null;
}

export function ProfileSecurityCard({ email }: ProfileSecurityCardProps) {
  const t = useTranslations('profile.security');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="text-primary h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/60 flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border">
                <LockKeyhole className="text-primary h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">{t('password')}</p>
                <p className="text-muted-foreground text-sm">{t('passwordDescription')}</p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(true)}
              disabled={!email}
              className="sm:self-start"
            >
              {t('updatePassword')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ProfilePasswordUpdateDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
        email={email ?? undefined}
      />
    </>
  );
}
