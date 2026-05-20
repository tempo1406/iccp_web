import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { serviceHealthItems } from './admin-data';

export function AdminServiceHealthCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {serviceHealthItems.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`h-3 w-3 rounded-full ${
                    service.status === 'Operational' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-muted-foreground text-xs">
                    Uptime: {service.uptime}
                  </p>
                </div>
              </div>
              <Badge
                variant={service.status === 'Operational' ? 'outline' : 'secondary'}
                className={
                  service.status === 'Operational'
                    ? 'border-emerald-500/20 text-emerald-500'
                    : 'bg-amber-500/10 text-amber-500'
                }
              >
                {service.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
