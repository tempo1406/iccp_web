import { UserDashboard } from '@/features/common/user-dashboard/components/layouts/user-dashboard';

export default function DashboardLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <UserDashboard>{children}</UserDashboard>;
}
