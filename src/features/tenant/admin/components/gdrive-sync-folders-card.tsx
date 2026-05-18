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
import { FolderOpen, Plus } from 'lucide-react';
import { monitoredFolders } from './gdrive-sync-data';

export function GDriveSyncFoldersCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitored Folders</CardTitle>
        <CardDescription>Select which Google Drive folders to index.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {monitoredFolders.map((folder) => (
            <div
              key={folder.path}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="text-primary h-5 w-5" />
                <div>
                  <p className="font-medium">{folder.name}</p>
                  <p className="text-muted-foreground text-xs">{folder.path}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="secondary">{folder.status}</Badge>
                <Switch defaultChecked={folder.status === 'Synced'} />
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full border-dashed">
            <Plus className="mr-2 h-4 w-4" />
            Add Folder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
