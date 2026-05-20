import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { analyticsKpis } from './analytics-data';

export function AnalyticsKpiGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {analyticsKpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {kpi.title}
            </CardTitle>
            <kpi.icon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div
              className={`flex items-center gap-1 text-xs ${
                kpi.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {kpi.trend === 'up' ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {kpi.change} from last period
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
