import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save } from 'lucide-react';

export function GDriveSyncSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync Settings</CardTitle>
        <CardDescription>Control when and how sync occurs.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Auto-Sync</Label>
            <p className="text-muted-foreground text-sm">
              Automatically sync changes from Drive every hour.
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Sync Deletions</Label>
            <p className="text-muted-foreground text-sm">
              Remove documents from platform when deleted in Drive.
            </p>
          </div>
          <Switch />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Sync Permissions</Label>
            <p className="text-muted-foreground text-sm">
              Mirror Google Drive folder permissions to users.
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <Button className="w-full">
          <Save className="mr-2 h-4 w-4" />
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
}
