import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight } from 'lucide-react';
import { kpiData } from './dashboard-data';

export function DashboardKpiGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi) => (
        <Card key={kpi.title} className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {kpi.title}
            </CardTitle>
            <kpi.icon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="flex items-center gap-1 text-xs text-emerald-500">
              <ArrowUpRight className="h-3 w-3" />
              {kpi.change} from last month
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
