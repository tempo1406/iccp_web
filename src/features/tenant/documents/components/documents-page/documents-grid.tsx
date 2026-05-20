'use client';

import {
  ChevronRight,
  Clock3,
  FileText,
  FolderClosed,
  FolderOpen,
  Grid2x2X,
  KeyRound,
  MoreHorizontal,
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
  DocumentSummaryResponse,
  ExplorerItem,
  FolderTreeResponse,
} from '@/services/documents';

interface DocumentsGridProps {
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
  onDragStart?: (event: React.DragEvent<HTMLElement>, item: ExplorerItem) => void;
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

export function DocumentsGrid({
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
}: DocumentsGridProps) {
  if (items.length === 0) {
    return (
      <div className="border-border bg-muted/20 flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center">
        <div className="bg-primary/8 text-primary mb-3 rounded-xl p-2.5">
          <Grid2x2X className="size-5" />
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
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {items.map((item) => {
        if (isFolderItem(item)) {
          const folder = item.originalData;

          return (
            <ContextMenu key={item.id}>
              <ContextMenuTrigger asChild>
                <article
                  draggable={enableDrag && !isRecoveryView}
                  onDragStart={(event) => onDragStart?.(event, item)}
                  onDragEnd={onDragEnd}
                  onClick={() => onOpenFolder(item.id)}
                  className={cn(
                    'group border-border/70 bg-card hover:border-primary/20 rounded-xl border p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                    enableDrag && !isRecoveryView && 'cursor-grab active:cursor-grabbing',
                    'cursor-pointer',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1.5 flex items-center gap-2">
                        <div className="bg-primary/8 text-primary rounded-lg p-1.5">
                          <FolderClosed className="size-3.5" />
                        </div>
                        <p className="text-foreground truncate text-[13px] font-semibold">
                          {folder.name}
                        </p>
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        {getFolderSummary(folder)}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 opacity-0 transition group-hover:opacity-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenFolder(item.id);
                      }}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge
                      variant="outline"
                      className="border-border bg-muted/40 text-muted-foreground rounded-md px-1.5 py-0 text-[9px]"
                    >
                      Folder
                    </Badge>
                    {isRecoveryView ? (
                      <Badge
                        variant="outline"
                        className="rounded-md border-0 bg-amber-50 px-1.5 py-0 text-[9px] text-amber-700 ring-1 ring-amber-200"
                      >
                        Recovery
                      </Badge>
                    ) : null}
                  </div>
                </article>
              </ContextMenuTrigger>

              <ContextMenuContent className="w-60">
                <ContextMenuItem onSelect={() => onOpenFolder(item.id)}>
                  <FolderOpen className="size-4" />
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

        const document = item.originalData as DocumentSummaryResponse;

        return (
          <ContextMenu key={item.id}>
            <ContextMenuTrigger asChild>
              <article
                draggable={enableDrag}
                onDragStart={(event) => onDragStart?.(event, item)}
                onDragEnd={onDragEnd}
                className={cn(
                  'group border-border/70 bg-card hover:border-primary/20 rounded-xl border p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                  enableDrag && 'cursor-grab active:cursor-grabbing',
                )}
                onDoubleClick={() => onOpenDocument(item.id)}
              >
                <div className="mb-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-foreground line-clamp-2 text-[13px] leading-5 font-semibold">
                      {document.title}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-[10px]">
                      {getCategoryLabel(
                        (document as { categoryId?: string | null }).categoryId,
                        categories,
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 opacity-0 transition group-hover:opacity-100"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenDocument(item.id);
                    }}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  <Badge
                    variant="outline"
                    className={cn(
                      'rounded-md border-0 px-1.5 py-0 text-[9px] ring-1',
                      getDocumentStatusTone((document as { status?: string }).status),
                    )}
                  >
                    {getDocumentStatusLabel((document as { status?: string }).status)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-border bg-muted/50 text-muted-foreground rounded-md px-1.5 py-0 text-[9px]"
                  >
                    v{document.version}
                  </Badge>
                </div>

                <div className="border-border/70 bg-muted/25 grid gap-1.5 rounded-lg border p-2 text-[11px]">
                  <div className="text-muted-foreground flex items-center justify-between gap-2">
                    <span>Size</span>
                    <span className="text-foreground font-medium">
                      {formatDocumentSize(document.fileSize)}
                    </span>
                  </div>
                  <div className="text-muted-foreground flex items-center justify-between gap-2">
                    <span>Updated</span>
                    <span className="text-foreground text-right font-medium">
                      {formatDocumentDate(document.updatedAt)}
                    </span>
                  </div>
                </div>

                <div className="text-muted-foreground mt-2.5 flex items-center justify-between text-[9px] tracking-[0.12em] uppercase">
                  <span className="flex items-center gap-1">
                    <Clock3 className="size-2.5" />
                    {isRecoveryView ? 'Recovery' : 'Active'}
                  </span>
                  <span>{(document.fileType ?? 'file').toString()}</span>
                </div>
              </article>
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
                <ContextMenuItem onSelect={() => onManageAccess(item.id, document.title)}>
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
    </div>
  );
}
