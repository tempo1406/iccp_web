'use client';

import {
  ChevronRight,
  FileText,
  FolderClosed,
  KeyRound,
  PencilLine,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  formatDocumentDate,
  formatDocumentSize,
  getCategoryLabel,
  getDocumentStatusLabel,
  getDocumentStatusTone,
} from '@/utils/document-utils';
import type {
  CategoryResponse,
  DocumentResponse,
  DocumentSummaryResponse,
  ExplorerItem,
  FolderTreeResponse,
} from '@/services/documents';

interface DocumentsTableProps {
  items: ExplorerItem[];
  categories: CategoryResponse[];
  enableDrag?: boolean;
  isRecoveryView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canEditFolders?: boolean;
  canDeleteFolders?: boolean;
  canManageAccess?: boolean;
  onOpenFolder: (folderId: string) => void;
  onOpenDocument: (documentId: string) => void;
  onRenameFolder: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onRestoreFolder: (folderId: string) => void;
  onDeleteFolderPermanent: (folderId: string) => void;
  onManageFolderAccess: (folderId: string, folderName: string) => void;
  onEditDocument: (documentId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onRestoreDocument: (documentId: string) => void;
  onDeleteDocumentPermanent: (documentId: string) => void;
  onManageAccess: (documentId: string, documentTitle: string) => void;
  onDragStart?: (event: React.DragEvent<HTMLTableRowElement>, item: ExplorerItem) => void;
  onDragEnd?: () => void;
}

function getFolderSummary(folder: FolderTreeResponse) {
  const parts: string[] = [];

  if (folder.children.length > 0) {
    parts.push(
      `${folder.children.length} folder${folder.children.length > 1 ? 's' : ''}`,
    );
  }
  if (folder.documents.length > 0) {
    parts.push(`${folder.documents.length} doc${folder.documents.length > 1 ? 's' : ''}`);
  }

  return parts.length > 0 ? parts.join(' • ') : 'Empty folder';
}

function isFolderItem(
  item: ExplorerItem,
): item is ExplorerItem & { originalData: FolderTreeResponse } {
  return item.type === 'folder';
}

export function DocumentsTable({
  items,
  categories,
  enableDrag = false,
  isRecoveryView = false,
  canEdit = false,
  canDelete = false,
  canEditFolders = false,
  canDeleteFolders = false,
  canManageAccess = false,
  onOpenFolder,
  onOpenDocument,
  onRenameFolder,
  onDeleteFolder,
  onRestoreFolder,
  onDeleteFolderPermanent,
  onManageFolderAccess,
  onEditDocument,
  onDeleteDocument,
  onRestoreDocument,
  onDeleteDocumentPermanent,
  onManageAccess,
  onDragStart,
  onDragEnd,
}: DocumentsTableProps) {
  if (items.length === 0) {
    return (
      <div className="border-border bg-muted/20 flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center">
        <div className="bg-primary/8 text-primary mb-3 rounded-xl p-2.5">
          <FileText className="size-5" />
        </div>
        <p className="text-foreground text-sm font-semibold">No items in this view</p>
        <p className="text-muted-foreground mt-1 max-w-md text-xs leading-5">
          Open another folder, switch category, or drop files here to preload the upload
          form.
        </p>
      </div>
    );
  }

  return (
    <div className="border-border/70 bg-card overflow-hidden rounded-2xl border shadow-sm">
      <Table className="min-w-[760px]">
        <TableHeader>
          <TableRow className="border-border/70 bg-muted/25 hover:bg-muted/25">
            <TableHead className="text-muted-foreground h-9 w-[34%] px-4 text-[11px] font-semibold tracking-[0.14em] uppercase">
              Name
            </TableHead>
            <TableHead className="text-muted-foreground h-9 w-[12%] text-[11px] font-semibold tracking-[0.14em] uppercase">
              Type
            </TableHead>
            <TableHead className="text-muted-foreground h-9 w-[20%] text-[11px] font-semibold tracking-[0.14em] uppercase">
              Details
            </TableHead>
            <TableHead className="text-muted-foreground h-9 w-[12%] text-[11px] font-semibold tracking-[0.14em] uppercase">
              Status
            </TableHead>
            <TableHead className="text-muted-foreground h-9 w-[10%] text-[11px] font-semibold tracking-[0.14em] uppercase">
              Size
            </TableHead>
            <TableHead className="text-muted-foreground h-9 w-[12%] text-right text-[11px] font-semibold tracking-[0.14em] uppercase">
              Updated
            </TableHead>
            <TableHead className="h-9 w-[44px]" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.map((item) => {
            if (isFolderItem(item)) {
              const folder = item.originalData;

              return (
                <ContextMenu key={item.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow
                      draggable={enableDrag && !isRecoveryView}
                      onDragStart={(event) => onDragStart?.(event, item)}
                      onDragEnd={onDragEnd}
                      onClick={() => onOpenFolder(item.id)}
                      className={cn(
                        'border-border/60 hover:bg-primary/5 cursor-pointer',
                        enableDrag &&
                          !isRecoveryView &&
                          'cursor-grab active:cursor-grabbing',
                      )}
                    >
                      <TableCell className="px-4 py-2.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="bg-primary/8 text-primary rounded-lg p-2">
                            <FolderClosed className="size-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-foreground truncate text-sm font-medium">
                              {folder.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge
                          variant="outline"
                          className="border-border bg-muted/35 text-muted-foreground rounded-md px-2 py-0.5 text-[10px]"
                        >
                          Folder
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground py-2.5 text-xs">
                        {getFolderSummary(folder)}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-md border-0 px-2 py-0.5 text-[10px] ring-1',
                            isRecoveryView
                              ? 'bg-amber-50 text-amber-700 ring-amber-200'
                              : 'bg-slate-100 text-slate-600 ring-slate-200',
                          )}
                        >
                          {isRecoveryView ? 'Recovery' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground py-2.5 text-xs">
                        {folder.children.length + folder.documents.length} items
                      </TableCell>
                      <TableCell className="text-muted-foreground py-2.5 text-right text-xs">
                        -
                      </TableCell>
                      <TableCell className="py-2.5 pr-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenFolder(item.id);
                          }}
                        >
                          <ChevronRight className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </ContextMenuTrigger>

                  <ContextMenuContent className="w-60">
                    <ContextMenuItem onSelect={() => onOpenFolder(item.id)}>
                      <FolderClosed className="size-4" />
                      Open folder
                    </ContextMenuItem>
                    {canEditFolders && !isRecoveryView ? (
                      <ContextMenuItem onSelect={() => onRenameFolder(item.id)}>
                        <PencilLine className="size-4" />
                        Rename folder
                      </ContextMenuItem>
                    ) : null}
                    {canManageAccess && !isRecoveryView ? (
                      <ContextMenuItem
                        onSelect={() => onManageFolderAccess(item.id, folder.name)}
                      >
                        <KeyRound className="size-4" />
                        Manage access
                      </ContextMenuItem>
                    ) : null}
                    {canDeleteFolders || isRecoveryView ? <ContextMenuSeparator /> : null}
                    {isRecoveryView ? (
                      <>
                        <ContextMenuItem onSelect={() => onRestoreFolder(item.id)}>
                          <RotateCcw className="size-4" />
                          Restore folder
                        </ContextMenuItem>
                        <ContextMenuItem
                          variant="destructive"
                          onSelect={() => onDeleteFolderPermanent(item.id)}
                        >
                          <Trash2 className="size-4" />
                          Delete permanently
                        </ContextMenuItem>
                      </>
                    ) : canDeleteFolders ? (
                      <ContextMenuItem
                        variant="destructive"
                        onSelect={() => onDeleteFolder(item.id)}
                      >
                        <Trash2 className="size-4" />
                        Move to recovery
                      </ContextMenuItem>
                    ) : null}
                  </ContextMenuContent>
                </ContextMenu>
              );
            }

            const document = item.originalData as
              | DocumentSummaryResponse
              | DocumentResponse;

            return (
              <ContextMenu key={item.id}>
                <ContextMenuTrigger asChild>
                  <TableRow
                    draggable={enableDrag}
                    onDragStart={(event) => onDragStart?.(event, item)}
                    onDragEnd={onDragEnd}
                    onDoubleClick={() => onOpenDocument(item.id)}
                    className={cn(
                      'border-border/60 hover:bg-primary/5 text-foreground text-sm',
                      enableDrag && 'cursor-grab active:cursor-grabbing',
                    )}
                  >
                    <TableCell className="px-4 py-2.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="bg-primary/8 text-primary rounded-lg p-2">
                          <FileText className="size-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-foreground truncate text-sm font-medium">
                            {document.title}
                          </p>
                          <p className="text-muted-foreground text-[11px]">
                            Double-click to open
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge
                        variant="outline"
                        className="border-border bg-muted/35 text-muted-foreground rounded-md px-2 py-0.5 text-[10px]"
                      >
                        {(document.fileType ?? 'File').toString().toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground py-2.5 text-xs">
                      {getCategoryLabel(
                        (document as { categoryId?: string | null }).categoryId,
                        categories,
                      )}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-md border-0 px-2 py-0.5 text-[10px] ring-1',
                          getDocumentStatusTone((document as { status?: string }).status),
                        )}
                      >
                        {getDocumentStatusLabel((document as { status?: string }).status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground py-2.5 text-xs">
                      {formatDocumentSize(document.fileSize)}
                    </TableCell>
                    <TableCell className="text-muted-foreground py-2.5 text-right text-xs">
                      {formatDocumentDate(document.updatedAt)}
                    </TableCell>
                    <TableCell className="py-2.5 pr-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenDocument(item.id);
                        }}
                      >
                        <ChevronRight className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-60">
                  <ContextMenuItem onSelect={() => onOpenDocument(item.id)}>
                    <FileText className="size-4" />
                    View detail
                  </ContextMenuItem>
                  {canEdit ? (
                    <ContextMenuItem onSelect={() => onEditDocument(item.id)}>
                      <PencilLine className="size-4" />
                      Edit metadata
                    </ContextMenuItem>
                  ) : null}
                  {canManageAccess ? (
                    <ContextMenuItem
                      onSelect={() => onManageAccess(item.id, document.title)}
                    >
                      <KeyRound className="size-4" />
                      Manage access
                    </ContextMenuItem>
                  ) : null}
                  {canDelete ? <ContextMenuSeparator /> : null}
                  {isRecoveryView ? (
                    <>
                      <ContextMenuItem onSelect={() => onRestoreDocument(item.id)}>
                        <RotateCcw className="size-4" />
                        Restore document
                      </ContextMenuItem>
                      <ContextMenuItem
                        variant="destructive"
                        onSelect={() => onDeleteDocumentPermanent(item.id)}
                      >
                        <Trash2 className="size-4" />
                        Delete permanently
                      </ContextMenuItem>
                    </>
                  ) : canDelete ? (
                    <ContextMenuItem
                      variant="destructive"
                      onSelect={() => onDeleteDocument(item.id)}
                    >
                      <Trash2 className="size-4" />
                      Move to recovery
                    </ContextMenuItem>
                  ) : null}
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
