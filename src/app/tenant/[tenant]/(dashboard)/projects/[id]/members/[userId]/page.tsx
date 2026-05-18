import { ProjectKpiMemberDetail } from '@/features/tenant/analytics/components/project-kpi/project-kpi-member-detail';

interface Props {
  params: Promise<{ tenant: string; projectId: string; userId: string }>;
}

export default async function ProjectMemberKpiDetailPage({ params }: Props) {
  const { projectId, userId } = await params;
  return <ProjectKpiMemberDetail projectId={projectId} userId={userId} />;
}
