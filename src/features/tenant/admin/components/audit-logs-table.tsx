import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { AuditLog, getAuditActionIcon, getAuditCategoryColor } from './audit-logs-data';

interface AuditLogsTableProps {
  logs: AuditLog[];
  onRowClick: (log: AuditLog) => void;
}

export function AuditLogsTable({ logs, onRowClick }: AuditLogsTableProps) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">IP Address</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow
              key={log.id}
              className="hover:bg-muted/50 cursor-pointer"
              onClick={() => onRowClick(log)}
            >
              <TableCell className="text-muted-foreground font-mono text-xs">
                {log.timestamp}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getAuditActionIcon(log.action)}
                  <span className="font-medium">{log.action}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getAuditCategoryColor(log.category)}>
                  {log.category}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{log.actor}</span>
                  <span className="text-muted-foreground text-xs">{log.role}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{log.target}</TableCell>
              <TableCell>
                <Badge
                  variant={log.status === 'success' ? 'secondary' : 'destructive'}
                  className={
                    log.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : ''
                  }
                >
                  {log.status === 'success' ? (
                    <CheckCircle className="mr-1 h-3 w-3" />
                  ) : (
                    <AlertTriangle className="mr-1 h-3 w-3" />
                  )}
                  {log.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-right font-mono text-xs">
                {log.ip}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
