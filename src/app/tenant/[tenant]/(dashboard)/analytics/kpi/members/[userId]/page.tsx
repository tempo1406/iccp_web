import { OrgKpiMemberDetail } from '@/features/tenant/analytics/components/org-kpi/org-kpi-member-detail';

interface Props {
  params: Promise<{ tenant: string; userId: string }>;
}

export default async function OrgMemberKpiDetailPage({ params }: Props) {
  const { userId } = await params;
  return <OrgKpiMemberDetail userId={userId} />;
}
