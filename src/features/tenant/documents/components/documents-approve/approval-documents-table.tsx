'use client';

import { File, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatBytes } from '@/common/utils/format-bytes';
import { DocumentStatusBadge } from '../common/documents-file-badges';
import type { DocumentResponse } from '@/services/documents';

function FileTypeIcon({ type }: { type: string }) {
  if (type === 'pdf') return <FileText className="h-5 w-5" />;
  if (type === 'xlsx') return <FileSpreadsheet className="h-5 w-5" />;
  return <File className="h-5 w-5" />;
}

function fileTypeColor(type: string) {
  if (type === 'pdf') return 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400';
  if (type === 'xlsx')
    return 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400';
  return 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400';
}

interface ApprovalDocumentsTableProps {
  documents: DocumentResponse[];
  selectedIds: string[];
  onToggleAll: () => void;
  onToggleOne: (id: string) => void;
}

export function ApprovalDocumentsTable({
  documents,
  selectedIds,
  onToggleAll,
  onToggleOne,
}: ApprovalDocumentsTableProps) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={documents.length > 0 && selectedIds.length === documents.length}
                onCheckedChange={onToggleAll}
              />
            </TableHead>
            <TableHead className="min-w-[240px]">Document Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-muted-foreground py-8 text-center text-sm"
              >
                No documents found.
              </TableCell>
            </TableRow>
          )}
          {documents.map((document) => (
            <TableRow key={document.id} className="group">
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(document.id)}
                  onCheckedChange={() => onToggleOne(document.id)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${fileTypeColor(document.fileType ?? '')}`}>
                    <FileTypeIcon type={document.fileType ?? ''} />
                  </div>
                  <div>
                    <p className="group-hover:text-primary font-semibold transition-colors">
                      {document.title}
                    </p>
                    <p className="text-muted-foreground text-xs uppercase">
                      {document.mimeType}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-xs font-medium uppercase">
                {document.fileType ?? 'file'}
              </TableCell>
              <TableCell>
                <DocumentStatusBadge status={document.status ?? ''} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {document.fileSize ? formatBytes(Number(document.fileSize)) : '—'}
              </TableCell>
              <TableCell className="text-muted-foreground">v{document.version}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(document.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="sm" className="text-primary">
                    Review
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
