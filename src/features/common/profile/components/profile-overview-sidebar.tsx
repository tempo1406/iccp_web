'use client';

import { useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Edit, Loader2, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { UserProfileDto } from '@/services/users/types';
import { useAvatarUploadAction } from '../hooks/use-profile-actions';

interface ProfileOverviewSidebarProps {
  profile?: UserProfileDto;
}

function getFullName(profile: UserProfileDto | undefined, fallback: string): string {
  if (!profile) return fallback;
  return `${profile.firstName} ${profile.lastName}`.trim() || profile.email;
}

function formatMonthYear(dateIso: string | undefined, locale: string): string {
  if (!dateIso) return '--';
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'short',
    year: 'numeric',
  });
}

export function ProfileOverviewSidebar({ profile }: ProfileOverviewSidebarProps) {
  const t = useTranslations('profile.sidebar');
  const locale = useLocale();
  const { uploadAvatar, isUploading, removeAvatar, isRemoving } = useAvatarUploadAction();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fullName = getFullName(profile, t('unknownUser'));
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((namePart) => namePart[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="xl:sticky xl:top-6">
      <CardContent className="flex flex-col items-center p-6 text-center">
        <div className="group relative mb-4">
          <div className="border-background h-32 w-32 overflow-hidden rounded-full border-4 shadow-inner">
            <Avatar className="h-full w-full">
              <AvatarImage src={profile?.avatarUrl ?? undefined} />
              <AvatarFallback className="text-2xl">{initials || 'U'}</AvatarFallback>
            </Avatar>
            {profile?.avatarUrl && (
              <button
                type="button"
                aria-label={t('removeAvatar')}
                disabled={isRemoving || isUploading}
                onClick={() => removeAvatar()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed"
              >
                {isRemoving ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <Trash2 className="h-6 w-6 text-white" />
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) await uploadAvatar(file);
              e.target.value = '';
            }}
          />
          <Button
            size="icon"
            variant="outline"
            className="absolute right-0 bottom-0 h-8 w-8 rounded-full shadow-lg"
            disabled={isUploading || isRemoving || !profile}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Edit className="h-4 w-4" />
            )}
          </Button>
        </div>

        <h2 className="text-xl font-bold">{fullName}</h2>
        <p className="text-muted-foreground mb-4 text-sm font-medium">
          {profile?.email ?? '--'}
        </p>

        <div className="my-4 w-full border-t" />

        <div className="mb-2 flex w-full items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('status')}</span>
          <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {profile?.isActive ? t('active') : t('inactive')}
          </span>
        </div>
        <div className="flex w-full items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('joined')}</span>
          <span>{formatMonthYear(profile?.createdAt, locale)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
