import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import type { Integration } from './integrations-data';

interface IntegrationsGridProps {
  integrations: Integration[];
}

export function IntegrationsGrid({ integrations }: IntegrationsGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {integrations.map((integration) => (
        <Card key={integration.id} className="flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-lg">
              <span className="text-muted-foreground text-xs font-bold uppercase">
                {integration.name.substring(0, 2)}
              </span>
            </div>
            <Badge
              variant={
                integration.status === 'connected'
                  ? 'default'
                  : integration.status === 'error'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {integration.status === 'connected'
                ? 'Active'
                : integration.status === 'error'
                  ? 'Error'
                  : 'Inactive'}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div className="mb-4 flex-1">
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <CardDescription className="mt-2 text-sm">
                {integration.description}
              </CardDescription>
            </div>

            {integration.lastSync && (
              <div className="text-muted-foreground mb-4 flex items-center text-xs">
                {integration.status === 'error' ? (
                  <AlertCircle className="text-destructive mr-1 h-3 w-3" />
                ) : (
                  <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-500" />
                )}
                {integration.lastSync}
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" className="mr-2 w-full">
                Configure
              </Button>
              <Switch checked={integration.status === 'connected'} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
