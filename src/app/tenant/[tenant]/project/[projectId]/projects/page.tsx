import { redirect } from 'next/navigation';
import { ROUTES } from '@/common/constant/routes';

interface Props {
  params: Promise<{ tenant: string }>;
}

export default async function LegacyProjectListRedirect({ params }: Props) {
  const { tenant } = await params;
  redirect(ROUTES.tenant.projects(tenant));
}
