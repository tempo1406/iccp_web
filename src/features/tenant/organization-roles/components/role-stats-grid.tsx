import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface RoleStatsGridProps {
  isPending: boolean;
  stats: { total: number; custom: number; protected: number };
}

function RoleStatCard({
  label,
  value,
}: Readonly<{ label: string; value: number }>) {
  return (
    <Card className="h-[88px]">
      <CardHeader className="flex h-full justify-between p-3">
        <CardDescription className="text-xs">{label}</CardDescription>
        <CardTitle className="text-2xl leading-none">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

export function RoleStatsGrid({ isPending, stats }: Readonly<RoleStatsGridProps>) {
  if (isPending) {
    return (
      <div className="grid gap-2 sm:grid-cols-3">
        {['total', 'custom', 'protected'].map((key) => (
          <Skeleton key={key} className="h-[88px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <RoleStatCard label="Total Roles" value={stats.total} />
      <RoleStatCard label="Custom Roles" value={stats.custom} />
      <RoleStatCard label="Protected Roles" value={stats.protected} />
    </div>
  );
}
