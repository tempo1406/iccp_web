'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppSelector } from '@/store';
import { useLogout } from '@/features/auth';
import { ROUTES } from '@/common/constant/routes';

interface UserMenuProps {
  tenant?: string;
}

export function UserMenu({ tenant }: UserMenuProps) {
  const t = useTranslations('common.userMenu');
  const [open, setOpen] = useState(false);

  const profile = useAppSelector((state) => state.user.profile);
  const authUser = useAppSelector((state) => state.auth.user);
  const { logout, isPending: isLoggingOut } = useLogout();

  const nameParts = [profile?.firstName, profile?.lastName].filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 0,
  );
  const fullName =
    nameParts.join(' ') || profile?.email || authUser?.email || t('unknownUser');
  const email = profile?.email ?? authUser?.email ?? '--';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const profileHref = tenant ? ROUTES.tenant.profile(tenant) : ROUTES.dashboardProfile;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full cursor-pointer">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatarUrl ?? undefined} alt={fullName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{fullName}</p>
            <p className="text-muted-foreground text-xs">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href={profileHref}>
          <DropdownMenuItem className="cursor-pointer">{t('profile')}</DropdownMenuItem>
        </Link>
        <Link href={ROUTES.dashboard}>
          <DropdownMenuItem className="cursor-pointer">{t('dashboard')}</DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive cursor-pointer font-bold"
          onClick={logout}
          disabled={isLoggingOut}
        >
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
