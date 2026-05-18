'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FolderClosed,
  FolderGit2,
  FolderOpen,
  FolderPlus,
  Grid3x3,
  KeyRound,
  Layers3,
  PencilLine,
  Plus,
  RotateCcw,
  ShieldAlert,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { splitRecoveryTree } from '@/utils/document-utils';
import type {
  CategoryResponse,
  DocumentSummaryResponse,
  DocumentTreeResponse,
  FolderTreeResponse,
} from '@/services/documents';

interface DocumentsSidebarProps {
  mode: 'folder' | 'category';
  tree?: DocumentTreeResponse;
  categories: CategoryResponse[];
  recoveryDocuments: DocumentSummaryResponse[];
  showRecovery: boolean;
  selectedFolderId: string | null;
  selectedCategoryId: string | null;
  recoverySelected: boolean;
  canCreateFolder: boolean;
  canCreateCategory: boolean;
  canEditFolder: boolean;
  canDeleteFolder: boolean;
  canEditCategory: boolean;
  canDeleteCategory: boolean;
  canUpload: boolean;
  canEditDocument: boolean;
  canDeleteDocument: boolean;
  canManageAccess: boolean;
  onModeChange: (mode: 'folder' | 'category') => void;
  onSelectRoot: () => void;
  onSelectFolder: (folderId: string) => void;
  onSelectCategory: (categoryId: string | null) => void;
  onSelectRecovery: () => void;
  onCreateFolder: (parentId?: string | null) => void;
  onRenameFolder: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onRestoreFolder: (folderId: string) => void;
  onDeleteFolderPermanent: (folderId: string) => void;
  onManageFolderAccess: (folderId: string, folderName: string) => void;
  onCreateCategory: () => void;
  onRenameCategory: (categoryId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onUploadDocument: (options?: {
    folderId?: string | null;
    categoryId?: string | null;
  }) => void;
  onOpenDocument: (documentId: string) => void;
  onEditDocument: (documentId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onRestoreDocument: (documentId: string) => void;
  onDeleteDocumentPermanent: (documentId: string) => void;
  onManageDocumentAccess: (documentId: string, documentTitle: string) => void;
  onDragFolderStart: (
    event: React.DragEvent<HTMLElement>,
    folder: FolderTreeResponse,
  ) => void;
  onDragDocumentStart: (
    event: React.DragEvent<HTMLElement>,
    document: DocumentSummaryResponse,
  ) => void;
  onDragEnd: () => void;
  onDropIntoFolder: (
    event: React.DragEvent<HTMLElement>,
    folderId: string | null,
  ) => void;
}

interface FolderNodeProps {
  folder: FolderTreeResponse;
  depth: number;
  isSelected: boolean;
  inRecovery: boolean;
  selectedFolderId: string | null;
  expandedState: Record<string, boolean>;
  onToggleExpand: (folderId: string) => void;
  canCreateFolder: boolean;
  canEditFolder: boolean;
  canDeleteFolder: boolean;
  canUpload: boolean;
  canEditDocument: boolean;
  canDeleteDocument: boolean;
  canManageAccess: boolean;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (parentId?: string | null) => void;
  onRenameFolder: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onRestoreFolder: (folderId: string) => void;
  onDeleteFolderPermanent: (folderId: string) => void;
  onManageFolderAccess: (folderId: string, folderName: string) => void;
  onUploadDocument: (options?: {
    folderId?: string | null;
    categoryId?: string | null;
  }) => void;
  onOpenDocument: (documentId: string) => void;
  onEditDocument: (documentId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onRestoreDocument: (documentId: string) => void;
  onDeleteDocumentPermanent: (documentId: string) => void;
  onManageDocumentAccess: (documentId: string, documentTitle: string) => void;
  onDragFolderStart: (
    event: React.DragEvent<HTMLElement>,
    folder: FolderTreeResponse,
  ) => void;
  onDragDocumentStart: (
    event: React.DragEvent<HTMLElement>,
    document: DocumentSummaryResponse,
  ) => void;
  onDragEnd: () => void;
  onDropIntoFolder: (
    event: React.DragEvent<HTMLElement>,
    folderId: string | null,
  ) => void;
}

function sectionButtonClass(active: boolean) {
  return cn(
    'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition',
    active
      ? 'bg-primary/6 text-foreground ring-primary/10 ring-1'
      : 'text-foreground/72 hover:bg-muted/55 hover:text-foreground',
  );
}

function ModeSwitchButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md transition',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {icon}
    </button>
  );
}

function SidebarDocumentNode({
  document,
  depth,
  inRecovery,
  canEditDocument,
  canDeleteDocument,
  canManageAccess,
  onOpenDocument,
  onEditDocument,
  onDeleteDocument,
  onRestoreDocument,
  onDeleteDocumentPermanent,
  onManageDocumentAccess,
  onDragDocumentStart,
  onDragEnd,
}: {
  document: DocumentSummaryResponse;
  depth: number;
  inRecovery: boolean;
  canEditDocument: boolean;
  canDeleteDocument: boolean;
  canManageAccess: boolean;
  onOpenDocument: (documentId: string) => void;
  onEditDocument: (documentId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onRestoreDocument: (documentId: string) => void;
  onDeleteDocumentPermanent: (documentId: string) => void;
  onManageDocumentAccess: (documentId: string, documentTitle: string) => void;
  onDragDocumentStart: (
    event: React.DragEvent<HTMLElement>,
    document: DocumentSummaryResponse,
  ) => void;
  onDragEnd: () => void;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          type="button"
          draggable={!inRecovery}
          onDragStart={(event) => onDragDocumentStart(event, document)}
          onDragEnd={onDragEnd}
          onClick={() => onOpenDocument(document.id)}
          className={cn(
            'text-foreground/76 hover:bg-muted/55 hover:text-foreground flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition',
            !inRecovery && 'cursor-grab active:cursor-grabbing',
          )}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
        >
          <div className="bg-primary/45 size-1.5 rounded-full" />
          <span className="truncate">{document.title}</span>
          <Badge
            variant="outline"
            className="border-border/70 bg-background text-muted-foreground ml-auto h-5 min-w-5 rounded-md px-1.5 text-[10px]"
          >
            v{document.version}
          </Badge>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onSelect={() => onOpenDocument(document.id)}>
          View detail
        </ContextMenuItem>
        {canEditDocument && !inRecovery ? (
          <ContextMenuItem onSelect={() => onEditDocument(document.id)}>
            <PencilLine className="size-4" />
            Edit metadata
          </ContextMenuItem>
        ) : null}
        {canManageAccess && !inRecovery ? (
          <ContextMenuItem
            onSelect={() => onManageDocumentAccess(document.id, document.title)}
          >
            <KeyRound className="size-4" />
            Manage access
          </ContextMenuItem>
        ) : null}
        {canDeleteDocument ? <ContextMenuSeparator /> : null}
        {inRecovery ? (
          <>
            <ContextMenuItem onSelect={() => onRestoreDocument(document.id)}>
              <RotateCcw className="size-4" />
              Restore document
            </ContextMenuItem>
            <ContextMenuItem
              variant="destructive"
              onSelect={() => onDeleteDocumentPermanent(document.id)}
            >
              <Trash2 className="size-4" />
              Delete permanently
            </ContextMenuItem>
          </>
        ) : canDeleteDocument ? (
          <ContextMenuItem
            variant="destructive"
            onSelect={() => onDeleteDocument(document.id)}
          >
            <Trash2 className="size-4" />
            Move to recovery
          </ContextMenuItem>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function FolderNode({
  folder,
  depth,
  isSelected,
  inRecovery,
  selectedFolderId,
  expandedState,
  onToggleExpand,
  canCreateFolder,
  canEditFolder,
  canDeleteFolder,
  canUpload,
  canEditDocument,
  canDeleteDocument,
  canManageAccess,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onRestoreFolder,
  onDeleteFolderPermanent,
  onManageFolderAccess,
  onUploadDocument,
  onOpenDocument,
  onEditDocument,
  onDeleteDocument,
  onRestoreDocument,
  onDeleteDocumentPermanent,
  onManageDocumentAccess,
  onDragFolderStart,
  onDragDocumentStart,
  onDragEnd,
  onDropIntoFolder,
}: FolderNodeProps) {
  const isExpanded = expandedState[folder.id] ?? true;

  return (
    <div className="space-y-1">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            type="button"
            draggable={!folder.isSystem && !inRecovery}
            onDragStart={(event) => onDragFolderStart(event, folder)}
            onDragEnd={onDragEnd}
            onDragOver={(event) => {
              if (folder.isSystem) return;
              event.preventDefault();
            }}
            onDrop={(event) => {
              if (folder.isSystem) return;
              onDropIntoFolder(event, folder.id);
            }}
            onClick={() => onSelectFolder(folder.id)}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition',
              isSelected
                ? 'bg-primary/6 text-foreground ring-primary/10 ring-1'
                : 'text-foreground/72 hover:bg-muted/55 hover:text-foreground',
              !folder.isSystem && !inRecovery && 'cursor-grab active:cursor-grabbing',
            )}
            style={{ paddingLeft: `${depth * 14 + 10}px` }}
          >
            <span
              onClick={(event) => {
                event.stopPropagation();
                onToggleExpand(folder.id);
              }}
              className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-4 shrink-0 items-center justify-center rounded-md"
            >
              {isExpanded ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
            </span>
            <span className="shrink-0">
              {folder.isSystem ? (
                <ShieldAlert className="size-3.5 text-amber-500" />
              ) : isExpanded ? (
                <FolderOpen className="text-primary size-3.5" />
              ) : (
                <FolderClosed className="text-primary size-3.5" />
              )}
            </span>
            <span className="truncate">{folder.name}</span>
            {folder.documents.length > 0 ? (
              <Badge
                variant="outline"
                className="border-border/70 bg-background text-muted-foreground ml-auto h-5 min-w-5 rounded-md px-1.5 text-[10px]"
              >
                {folder.documents.length}
              </Badge>
            ) : null}
          </button>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-60">
          <ContextMenuItem onSelect={() => onSelectFolder(folder.id)}>
            Open folder
          </ContextMenuItem>
          {!folder.isSystem && !inRecovery && canCreateFolder ? (
            <ContextMenuItem onSelect={() => onCreateFolder(folder.id)}>
              <FolderPlus className="size-4" />
              Create subfolder
            </ContextMenuItem>
          ) : null}
          {!folder.isSystem && !inRecovery && canUpload ? (
            <ContextMenuItem onSelect={() => onUploadDocument({ folderId: folder.id })}>
              <Upload className="size-4" />
              Upload document
            </ContextMenuItem>
          ) : null}
          {!folder.isSystem && !inRecovery && canEditFolder ? (
            <ContextMenuItem onSelect={() => onRenameFolder(folder.id)}>
              <PencilLine className="size-4" />
              Rename folder
            </ContextMenuItem>
          ) : null}
          {!folder.isSystem && !inRecovery && canManageAccess ? (
            <ContextMenuItem
              onSelect={() => onManageFolderAccess(folder.id, folder.name)}
            >
              <KeyRound className="size-4" />
              Manage access
            </ContextMenuItem>
          ) : null}
          {(canDeleteFolder || inRecovery) && !folder.isSystem ? (
            <ContextMenuSeparator />
          ) : null}
          {inRecovery ? (
            <>
              <ContextMenuItem onSelect={() => onRestoreFolder(folder.id)}>
                <RotateCcw className="size-4" />
                Restore folder
              </ContextMenuItem>
              <ContextMenuItem
                variant="destructive"
                onSelect={() => onDeleteFolderPermanent(folder.id)}
              >
                <Trash2 className="size-4" />
                Delete permanently
              </ContextMenuItem>
            </>
          ) : canDeleteFolder && !folder.isSystem ? (
            <ContextMenuItem
              variant="destructive"
              onSelect={() => onDeleteFolder(folder.id)}
            >
              <Trash2 className="size-4" />
              Move to recovery
            </ContextMenuItem>
          ) : null}
        </ContextMenuContent>
      </ContextMenu>

      {isExpanded ? (
        <div className="space-y-1">
          {folder.documents.map((document) => (
            <SidebarDocumentNode
              key={document.id}
              document={document}
              depth={depth + 1}
              inRecovery={inRecovery}
              canEditDocument={canEditDocument}
              canDeleteDocument={canDeleteDocument}
              canManageAccess={canManageAccess}
              onOpenDocument={onOpenDocument}
              onEditDocument={onEditDocument}
              onDeleteDocument={onDeleteDocument}
              onRestoreDocument={onRestoreDocument}
              onDeleteDocumentPermanent={onDeleteDocumentPermanent}
              onManageDocumentAccess={onManageDocumentAccess}
              onDragDocumentStart={onDragDocumentStart}
              onDragEnd={onDragEnd}
            />
          ))}
          {folder.children.map((childFolder) => (
            <FolderNode
              key={childFolder.id}
              folder={childFolder}
              depth={depth + 1}
              isSelected={selectedFolderId === childFolder.id}
              inRecovery={inRecovery}
              selectedFolderId={selectedFolderId}
              expandedState={expandedState}
              onToggleExpand={onToggleExpand}
              canCreateFolder={canCreateFolder}
              canEditFolder={canEditFolder}
              canDeleteFolder={canDeleteFolder}
              canUpload={canUpload}
              canEditDocument={canEditDocument}
              canDeleteDocument={canDeleteDocument}
              canManageAccess={canManageAccess}
              onSelectFolder={onSelectFolder}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onRestoreFolder={onRestoreFolder}
              onDeleteFolderPermanent={onDeleteFolderPermanent}
              onManageFolderAccess={onManageFolderAccess}
              onUploadDocument={onUploadDocument}
              onOpenDocument={onOpenDocument}
              onEditDocument={onEditDocument}
              onDeleteDocument={onDeleteDocument}
              onRestoreDocument={onRestoreDocument}
              onDeleteDocumentPermanent={onDeleteDocumentPermanent}
              onManageDocumentAccess={onManageDocumentAccess}
              onDragFolderStart={onDragFolderStart}
              onDragDocumentStart={onDragDocumentStart}
              onDragEnd={onDragEnd}
              onDropIntoFolder={onDropIntoFolder}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DocumentsCategorySidebar({
  mode,
  tree,
  categories,
  recoveryDocuments,
  showRecovery,
  selectedFolderId,
  selectedCategoryId,
  recoverySelected,
  canCreateFolder,
  canCreateCategory,
  canEditFolder,
  canDeleteFolder,
  canEditCategory,
  canDeleteCategory,
  canUpload,
  canEditDocument,
  canDeleteDocument,
  canManageAccess,
  onModeChange,
  onSelectRoot,
  onSelectFolder,
  onSelectCategory,
  onSelectRecovery,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onRestoreFolder,
  onDeleteFolderPermanent,
  onManageFolderAccess,
  onCreateCategory,
  onRenameCategory,
  onDeleteCategory,
  onUploadDocument,
  onOpenDocument,
  onEditDocument,
  onDeleteDocument,
  onRestoreDocument,
  onDeleteDocumentPermanent,
  onManageDocumentAccess,
  onDragFolderStart,
  onDragDocumentStart,
  onDragEnd,
  onDropIntoFolder,
}: DocumentsSidebarProps) {
  const { regularFolders, recoveryFolder } = splitRecoveryTree(tree);
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});

  function toggleExpand(folderId: string) {
    setExpandedState((current) => ({
      ...current,
      [folderId]: !(current[folderId] ?? true),
    }));
  }

  return (
    <div className="border-border/70 bg-card text-foreground flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border shadow-sm">
      <div className="border-border/70 border-b p-3.5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-foreground text-sm font-semibold tracking-tight">
            Document library
          </h2>

          <div className="border-border/70 bg-muted/40 inline-flex items-center gap-1 rounded-lg border p-1">
            <ModeSwitchButton
              active={mode === 'folder'}
              icon={<FolderGit2 className="size-3.5" />}
              label="Folder mode"
              onClick={() => onModeChange('folder')}
            />
            <ModeSwitchButton
              active={mode === 'category'}
              icon={<Layers3 className="size-3.5" />}
              label="Category mode"
              onClick={() => onModeChange('category')}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {mode === 'folder' && canCreateFolder ? (
            <Button
              size="sm"
              className="h-8 rounded-lg px-2.5 text-xs font-medium"
              onClick={() => onCreateFolder(null)}
            >
              <FolderPlus className="size-3.5" />
              New folder
            </Button>
          ) : null}
          {mode === 'category' && canCreateCategory ? (
            <Button
              size="sm"
              className="h-8 rounded-lg px-2.5 text-xs font-medium"
              onClick={onCreateCategory}
            >
              <Plus className="size-3.5" />
              New category
            </Button>
          ) : null}
          {canUpload ? (
            <Button
              size="sm"
              variant="outline"
              className="border-border bg-background text-foreground hover:bg-muted h-8 rounded-lg px-2.5 text-xs font-medium"
              onClick={() =>
                onUploadDocument(
                  mode === 'folder'
                    ? { folderId: selectedFolderId }
                    : { categoryId: selectedCategoryId ?? undefined },
                )
              }
            >
              <Upload className="size-3.5" />
              Upload
            </Button>
          ) : null}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-2.5 py-3">
        {mode === 'folder' ? (
          <div className="space-y-3">
            <div
              className={sectionButtonClass(!selectedFolderId && !recoverySelected)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onDropIntoFolder(event, null)}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 text-left text-[13px]"
                onClick={onSelectRoot}
              >
                <FolderOpen className="text-primary size-3.5" />
                <span className="font-medium">Root library</span>
                <Badge
                  variant="outline"
                  className="border-border/70 bg-background text-muted-foreground ml-auto h-5 min-w-5 rounded-md px-1.5 text-[10px]"
                >
                  {tree?.rootDocuments.length ?? 0}
                </Badge>
              </button>
            </div>

            {tree?.rootDocuments.map((document) => (
              <SidebarDocumentNode
                key={document.id}
                document={document}
                depth={1}
                inRecovery={false}
                canEditDocument={canEditDocument}
                canDeleteDocument={canDeleteDocument}
                canManageAccess={canManageAccess}
                onOpenDocument={onOpenDocument}
                onEditDocument={onEditDocument}
                onDeleteDocument={onDeleteDocument}
                onRestoreDocument={onRestoreDocument}
                onDeleteDocumentPermanent={onDeleteDocumentPermanent}
                onManageDocumentAccess={onManageDocumentAccess}
                onDragDocumentStart={onDragDocumentStart}
                onDragEnd={onDragEnd}
              />
            ))}

            <div className="space-y-1">
              {regularFolders.map((folder) => (
                <FolderNode
                  key={folder.id}
                  folder={folder}
                  depth={0}
                  isSelected={selectedFolderId === folder.id && !recoverySelected}
                  inRecovery={false}
                  selectedFolderId={selectedFolderId}
                  expandedState={expandedState}
                  onToggleExpand={toggleExpand}
                  canCreateFolder={canCreateFolder}
                  canEditFolder={canEditFolder}
                  canDeleteFolder={canDeleteFolder}
                  canUpload={canUpload}
                  canEditDocument={canEditDocument}
                  canDeleteDocument={canDeleteDocument}
                  canManageAccess={canManageAccess}
                  onSelectFolder={onSelectFolder}
                  onCreateFolder={onCreateFolder}
                  onRenameFolder={onRenameFolder}
                  onDeleteFolder={onDeleteFolder}
                  onRestoreFolder={onRestoreFolder}
                  onDeleteFolderPermanent={onDeleteFolderPermanent}
                  onManageFolderAccess={onManageFolderAccess}
                  onUploadDocument={onUploadDocument}
                  onOpenDocument={onOpenDocument}
                  onEditDocument={onEditDocument}
                  onDeleteDocument={onDeleteDocument}
                  onRestoreDocument={onRestoreDocument}
                  onDeleteDocumentPermanent={onDeleteDocumentPermanent}
                  onManageDocumentAccess={onManageDocumentAccess}
                  onDragFolderStart={onDragFolderStart}
                  onDragDocumentStart={onDragDocumentStart}
                  onDragEnd={onDragEnd}
                  onDropIntoFolder={onDropIntoFolder}
                />
              ))}
            </div>

            {showRecovery && recoverySelected && recoveryFolder ? (
              <div className="border-border/60 mt-3 space-y-1 border-t pt-3">
                {recoveryFolder.children.map((folder) => (
                  <FolderNode
                    key={folder.id}
                    folder={folder}
                    depth={0}
                    isSelected={selectedFolderId === folder.id}
                    inRecovery
                    selectedFolderId={selectedFolderId}
                    expandedState={expandedState}
                    onToggleExpand={toggleExpand}
                    canCreateFolder={canCreateFolder}
                    canEditFolder={canEditFolder}
                    canDeleteFolder={canDeleteFolder}
                    canUpload={canUpload}
                    canEditDocument={canEditDocument}
                    canDeleteDocument={canDeleteDocument}
                    canManageAccess={canManageAccess}
                    onSelectFolder={onSelectFolder}
                    onCreateFolder={onCreateFolder}
                    onRenameFolder={onRenameFolder}
                    onDeleteFolder={onDeleteFolder}
                    onRestoreFolder={onRestoreFolder}
                    onDeleteFolderPermanent={onDeleteFolderPermanent}
                    onManageFolderAccess={onManageFolderAccess}
                    onUploadDocument={onUploadDocument}
                    onOpenDocument={onOpenDocument}
                    onEditDocument={onEditDocument}
                    onDeleteDocument={onDeleteDocument}
                    onRestoreDocument={onRestoreDocument}
                    onDeleteDocumentPermanent={onDeleteDocumentPermanent}
                    onManageDocumentAccess={onManageDocumentAccess}
                    onDragFolderStart={onDragFolderStart}
                    onDragDocumentStart={onDragDocumentStart}
                    onDragEnd={onDragEnd}
                    onDropIntoFolder={onDropIntoFolder}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              className={sectionButtonClass(
                selectedCategoryId === null && !recoverySelected,
              )}
              onClick={() => onSelectCategory(null)}
            >
              <div className="bg-primary/8 text-primary rounded-md p-1.5">
                <Grid3x3 className="size-3.5" />
              </div>
              <span className="truncate text-[13px] font-medium">All documents</span>
            </button>

            {categories.map((category) => (
              <ContextMenu key={category.id}>
                <ContextMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition',
                      selectedCategoryId === category.id && !recoverySelected
                        ? 'bg-primary/6 text-foreground ring-primary/10 ring-1'
                        : 'text-foreground/72 hover:bg-muted/55 hover:text-foreground',
                    )}
                    onClick={() => onSelectCategory(category.id)}
                  >
                    <div className="bg-primary/8 text-primary rounded-md p-1.5">
                      <Layers3 className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{category.name}</p>
                    </div>
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-60">
                  <ContextMenuItem onSelect={() => onSelectCategory(category.id)}>
                    Open category
                  </ContextMenuItem>
                  {canUpload ? (
                    <ContextMenuItem
                      onSelect={() => onUploadDocument({ categoryId: category.id })}
                    >
                      <Upload className="size-4" />
                      Upload into category
                    </ContextMenuItem>
                  ) : null}
                  {canEditCategory ? (
                    <ContextMenuItem onSelect={() => onRenameCategory(category.id)}>
                      <PencilLine className="size-4" />
                      Edit category
                    </ContextMenuItem>
                  ) : null}
                  {canDeleteCategory ? <ContextMenuSeparator /> : null}
                  {canDeleteCategory ? (
                    <ContextMenuItem
                      variant="destructive"
                      onSelect={() => onDeleteCategory(category.id)}
                    >
                      <Trash2 className="size-4" />
                      Delete category
                    </ContextMenuItem>
                  ) : null}
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        )}
      </ScrollArea>

      {showRecovery ? (
        <div className="border-border/70 border-t px-2.5 py-2.5">
          <button
            type="button"
            onClick={onSelectRecovery}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition',
              recoverySelected
                ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80'
                : 'text-foreground/72 hover:text-foreground hover:bg-amber-50/70',
            )}
          >
            <div className="rounded-md bg-amber-100 p-1.5 text-amber-700">
              <Trash2 className="size-3.5" />
            </div>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
              Recovery
            </span>
            <Badge
              variant="outline"
              className="border-border/70 bg-background text-muted-foreground h-5 min-w-5 rounded-md px-1.5 text-[10px]"
            >
              {mode === 'folder'
                ? (recoveryFolder?.children.length ?? 0) + recoveryDocuments.length
                : recoveryDocuments.length}
            </Badge>
          </button>
        </div>
      ) : null}
    </div>
  );
}
