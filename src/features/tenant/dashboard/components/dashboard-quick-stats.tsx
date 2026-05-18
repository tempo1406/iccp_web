import { Card, CardContent } from '@/components/ui/card';
import { quickStats } from './dashboard-data';

export function DashboardQuickStats() {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {quickStats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <stat.icon className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-muted-foreground text-xs">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
