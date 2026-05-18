import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChart } from 'lucide-react';
import { ragSources } from './analytics-data';

export function AnalyticsChartsRow() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Query Volume
          </CardTitle>
          <Badge variant="secondary">Last 7 days</Badge>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 flex h-[240px] items-center justify-center rounded-lg border-2 border-dashed">
            <div className="text-center">
              <BarChart3 className="text-muted-foreground/50 mx-auto h-12 w-12" />
              <p className="text-muted-foreground mt-2 text-sm">
                Chart visualization would go here
              </p>
              <p className="text-muted-foreground text-xs">
                (Integration with Recharts or similar)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            RAG Source Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ragSources.map((source) => (
              <div key={source.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{source.name}</span>
                  <span className="font-medium">{source.percentage}%</span>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full transition-all"
                    style={{ width: `${source.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
