import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export function AdminAlertsGrid() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Recent System Alerts</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((alert) => (
          <Card key={alert} className="bg-muted/50">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm font-medium">
                  High Latency Detected
                </CardTitle>
              </div>
              <span className="text-muted-foreground text-xs">10 min ago</span>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                API response time {'>'} 500ms in US-East region. Auto-scaling triggered.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
