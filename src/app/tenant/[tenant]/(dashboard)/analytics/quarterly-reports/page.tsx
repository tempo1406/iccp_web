import { redirect } from 'next/navigation';
import { ROUTES } from '@/common/constant/routes';

export default async function Page({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  redirect(ROUTES.tenant.analyticsPeriodicReports(tenant));
}
