import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Lock,
  Monitor,
  User,
} from 'lucide-react';
import { AuditLog, getAuditActionIcon } from './audit-logs-data';

interface AuditLogDetailsSheetProps {
  selectedLog: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCopy: (value: string) => void;
}

export function AuditLogDetailsSheet({
  selectedLog,
  open,
  onOpenChange,
  onCopy,
}: AuditLogDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[450px] overflow-y-auto sm:w-[540px]">
        {selectedLog && (
          <>
            <SheetHeader>
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle className="flex items-center gap-2">
                    {getAuditActionIcon(selectedLog.action)}
                    {selectedLog.action}
                  </SheetTitle>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Log ID: {selectedLog.id}
                  </p>
                </div>
                <Badge
                  variant={selectedLog.status === 'success' ? 'secondary' : 'destructive'}
                  className={
                    selectedLog.status === 'success'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : ''
                  }
                >
                  {selectedLog.status === 'success' ? (
                    <CheckCircle className="mr-1 h-3 w-3" />
                  ) : (
                    <AlertTriangle className="mr-1 h-3 w-3" />
                  )}
                  {selectedLog.status}
                </Badge>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <div className="grid gap-4">
                <div className="bg-muted flex items-start gap-3 rounded-lg p-3">
                  <Clock className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Timestamp</p>
                    <p className="text-muted-foreground text-sm">
                      {selectedLog.timestamp}
                    </p>
                  </div>
                </div>

                <div className="bg-muted flex items-start gap-3 rounded-lg p-3">
                  <User className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Actor</p>
                    <p className="text-muted-foreground text-sm">{selectedLog.actor}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {selectedLog.role}
                    </Badge>
                  </div>
                </div>

                <div className="bg-muted flex items-start gap-3 rounded-lg p-3">
                  <Globe className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Location & IP</p>
                    <p className="text-muted-foreground text-sm">
                      {selectedLog.location}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="bg-background rounded px-2 py-0.5 text-xs">
                        {selectedLog.ip}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onCopy(selectedLog.ip)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-muted flex items-start gap-3 rounded-lg p-3">
                  <Monitor className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Device / User Agent</p>
                    <p className="text-muted-foreground text-xs break-all">
                      {selectedLog.userAgent}
                    </p>
                  </div>
                </div>

                {selectedLog.sessionId && selectedLog.sessionId !== '-' && (
                  <div className="bg-muted flex items-start gap-3 rounded-lg p-3">
                    <Lock className="text-muted-foreground mt-0.5 h-5 w-5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Session ID</p>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="bg-background rounded px-2 py-0.5 font-mono text-xs">
                          {selectedLog.sessionId}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onCopy(selectedLog.sessionId ?? '')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedLog.details && (
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Event Details</h4>
                  <Card>
                    <CardContent className="space-y-3 p-4">
                      {Object.entries(selectedLog.details).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-start justify-between border-b py-2 last:border-0"
                        >
                          <span className="text-muted-foreground text-sm">{key}</span>
                          <span className="max-w-[60%] text-right text-sm font-medium">
                            {value}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="flex gap-3 border-t pt-4">
                <Button variant="outline" className="flex-1">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Related Logs
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Export Details
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
