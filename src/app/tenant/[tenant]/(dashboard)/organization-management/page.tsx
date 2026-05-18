import { redirect } from 'next/navigation';

export default async function OrganizationManagementPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  redirect(`/tenant/${tenant}/organization-management/invite-members`);
}
