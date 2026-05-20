import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export interface ApprovalStat {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconColor: string;
  change?: string;
  changeType?: 'positive' | 'neutral';
}

interface ApprovalStatsCardsProps {
  stats: ApprovalStat[];
}

export function ApprovalStatsCards({ stats }: ApprovalStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-5">
            <div className="text-foreground flex items-center gap-2">
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              <span className="font-medium">{stat.label}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold">{stat.value}</span>
              <Badge
                variant="secondary"
                className={
                  stat.changeType === 'positive'
                    ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }
              >
                {stat.change}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
