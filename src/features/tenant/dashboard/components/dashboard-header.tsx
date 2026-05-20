'use client';

import { PageHeader } from '@/components/layout';
import { useAppSelector } from '@/store';

export function DashboardPageHeader() {
  const profile = useAppSelector((state) => state.user.profile);

  const profileName = profile
    ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || profile.email
    : '';

  const description =
    profileName.length > 0
      ? `Welcome  ${profileName}! Here's an overview of your platform.`
      : "Welcome back! Here's an overview of your platform.";

  return (
    <PageHeader
      title="Dashboard"
      description={description}
    />
  );
}
