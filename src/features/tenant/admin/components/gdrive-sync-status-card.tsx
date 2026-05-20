import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle2, Clock, HardDrive } from 'lucide-react';

export function GDriveSyncStatusCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync Status</CardTitle>
        <CardDescription>Current connectivity and statistics.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="font-medium">Connected</p>
              <p className="text-muted-foreground text-xs">admin@company.com</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Reconnect
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="text-muted-foreground mb-2 flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Total Files</span>
            </div>
            <div className="text-2xl font-bold">14,205</div>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <div className="text-muted-foreground mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Last Sync</span>
            </div>
            <div className="text-2xl font-bold">12m ago</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
