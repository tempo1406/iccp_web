'use client';

import { startTransition } from 'react';
import { LayoutGrid, List, Menu, Search, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { findFolderById } from '@/utils/document-utils';
import { useDocumentsPage, encodeDragPayload } from '../hooks/use-documents-page';
import { DocumentsCategorySidebar } from '../components/documents-page/documents-category-sidebar';
import { DocumentsGrid } from '../components/documents-page/documents-grid';
import { DocumentsTable } from '../components/documents-page/documents-table';
import { UploadDocumentModal } from '../components/documents-page/upload-document-modal';
import { AccessManagementModal } from '../components/common/access-management-modal';
import { DocumentActionConfirmDialog } from '../components/common/document-action-confirm-dialog';
import { DocumentResourceDialog } from '../components/common/document-resource-dialog';

export function DocumentsPage() {
  const {
    sidebarMode,
    setSidebarMode,
    selectedFolderId,
    setSelectedFolderId,
    selectedCategoryId,
    setSelectedCategoryId,
    recoverySelected,
    setRecoverySelected,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    sidebarOpen,
    setSidebarOpen,
    dropTargetActive,
    uploadDialogState,
    setUploadDialogState,
    confirmDialogState,
    setConfirmDialogState,
    isConfirmingAction,
    accessDialogState,
    setAccessDialogState,
    resourceDialogState,
    setResourceDialogState,
    isMobile,
    filteredItems,
    currentPanelLabel,
    categories,
    tree,
    recoveryDocuments,
    canViewRecovery,
    editingDocumentQuery,
    isLoading,
    canListDocuments,
    canUploadDocuments,
    canEditDocuments,
    canDeleteDocuments,
    canManageAccess,
    canCreateFolders,
    canEditFolders,
    canDeleteFolders,
    canCreateCategories,
    canEditCategories,
    canDeleteCategories,
    openUploadDialog,
    handleOpenFolder,
    handleOpenDocument,
    handleConfirmAction,
    handleDeleteDocument,
    handleRestoreDocument,
    handleDeleteDocumentPermanent,
    handleDeleteFolder,
    handleRestoreFolder,
    handleDeleteFolderPermanent,
    handleDeleteCategory,
    handleDropIntoFolder,
    handleLibraryDragOver,
    handleLibraryDragLeave,
    handleLibraryDrop,
  } = useDocumentsPage();

  if (!canListDocuments) {
    return (
      <div className="border-border/70 bg-card rounded-xl border p-6 shadow-sm">
        <div className="max-w-xl">
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 text-amber-700"
          >
            Permission required
          </Badge>
          <h1 className="text-foreground mt-3 text-lg font-semibold">
            Document library is locked for this account.
          </h1>
        </div>
      </div>
    );
  }

  const sidebar = (
    <DocumentsCategorySidebar
      mode={sidebarMode}
      tree={tree}
      categories={categories}
      recoveryDocuments={recoveryDocuments}
      showRecovery={canViewRecovery}
      selectedFolderId={selectedFolderId}
      selectedCategoryId={selectedCategoryId}
      recoverySelected={recoverySelected}
      canCreateFolder={canCreateFolders}
      canCreateCategory={canCreateCategories}
      canEditFolder={canEditFolders}
      canDeleteFolder={canDeleteFolders}
      canEditCategory={canEditCategories}
      canDeleteCategory={canDeleteCategories}
      canUpload={canUploadDocuments}
      canEditDocument={canEditDocuments}
      canDeleteDocument={canDeleteDocuments}
      canManageAccess={canManageAccess}
      onModeChange={(nextMode) =>
        startTransition(() => {
          setSidebarMode(nextMode);
          setRecoverySelected(false);
          setSelectedFolderId(null);
          setSelectedCategoryId(null);
        })
      }
      onSelectRoot={() => {
        setSelectedFolderId(null);
        setRecoverySelected(false);
        if (isMobile) setSidebarOpen(false);
      }}
      onSelectFolder={handleOpenFolder}
      onSelectCategory={(categoryId) => {
        setSelectedCategoryId(categoryId);
        setRecoverySelected(false);
        if (isMobile) setSidebarOpen(false);
      }}
      onSelectRecovery={() => {
        setRecoverySelected(true);
        setSelectedFolderId(null);
        if (isMobile) setSidebarOpen(false);
      }}
      onCreateFolder={(parentId) =>
        setResourceDialogState({ mode: 'create-folder', folderDraft: { parentId } })
      }
      onRenameFolder={(folderId) => {
        const folder = findFolderById(tree?.folders ?? [], folderId);
        if (!folder) return;
        setResourceDialogState({
          mode: 'rename-folder',
          folderDraft: {
            id: folder.id,
            name: folder.name,
            description: folder.description ?? undefined,
          },
        });
      }}
      onDeleteFolder={(folderId) => void handleDeleteFolder(folderId)}
      onRestoreFolder={(folderId) => void handleRestoreFolder(folderId)}
      onDeleteFolderPermanent={(folderId) => void handleDeleteFolderPermanent(folderId)}
      onManageFolderAccess={(folderId, folderName) =>
        setAccessDialogState({
          targetType: 'folder',
          targetId: folderId,
          targetName: folderName,
        })
      }
      onCreateCategory={() => setResourceDialogState({ mode: 'create-category' })}
      onRenameCategory={(categoryId) => {
        const category = categories.find((item) => item.id === categoryId);
        if (!category) return;
        setResourceDialogState({
          mode: 'rename-category',
          categoryDraft: {
            id: category.id,
            name: category.name,
            description: category.description ?? undefined,
          },
        });
      }}
      onDeleteCategory={(categoryId) => void handleDeleteCategory(categoryId)}
      onUploadDocument={(options) => openUploadDialog(options)}
      onOpenDocument={handleOpenDocument}
      onEditDocument={(documentId) =>
        setResourceDialogState({ mode: 'edit-document', documentId })
      }
      onDeleteDocument={(documentId) => void handleDeleteDocument(documentId)}
      onRestoreDocument={(documentId) => void handleRestoreDocument(documentId)}
      onDeleteDocumentPermanent={(documentId) =>
        void handleDeleteDocumentPermanent(documentId)
      }
      onManageDocumentAccess={(documentId, documentTitle) =>
        setAccessDialogState({
          targetType: 'document',
          targetId: documentId,
          targetName: documentTitle,
        })
      }
      onDragFolderStart={(event, folder) =>
        encodeDragPayload(event, { kind: 'folder', id: folder.id, name: folder.name })
      }
      onDragDocumentStart={(event, document) =>
        encodeDragPayload(event, {
          kind: 'document',
          id: document.id,
          title: document.title,
        })
      }
      onDragEnd={() => undefined}
      onDropIntoFolder={(event, folderId) => void handleDropIntoFolder(event, folderId)}
    />
  );

  return (
    <>
      <div className="text-foreground flex h-full min-h-0 flex-col gap-4 overflow-hidden">
        <header className="border-border/70 bg-card rounded-xl border px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center">
              <h1 className="text-foreground text-lg font-semibold tracking-tight">
                Document manager
              </h1>
            </div>

            <div className="flex flex-wrap gap-2">
              {isMobile ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border bg-background"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="size-4" />
                </Button>
              ) : null}
              {canUploadDocuments ? (
                <Button size="sm" onClick={() => openUploadDialog({})}>
                  <UploadCloud className="size-4" />
                  Upload
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden xl:grid-cols-[280px_minmax(0,1fr)]">
          {!isMobile ? sidebar : null}

          <section className="flex min-h-0 flex-col gap-3 overflow-hidden">
            <div className="border-border/70 bg-card rounded-xl border px-4 py-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-foreground text-sm font-semibold">
                  {currentPanelLabel}
                </h2>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    className="h-7 w-7 p-0"
                    title="Grid view"
                    onClick={() => startTransition(() => setViewMode('grid'))}
                  >
                    <LayoutGrid className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    className="h-7 w-7 p-0"
                    title="List view"
                    onClick={() => startTransition(() => setViewMode('list'))}
                  >
                    <List className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="mt-3">
                <div className="relative">
                  <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="border-border bg-background text-foreground placeholder:text-muted-foreground h-8 pl-9 text-sm"
                    placeholder="Search folders and documents..."
                  />
                </div>
              </div>
            </div>

            <div
              className={cn(
                'relative min-h-0 flex-1 overflow-hidden transition',
                dropTargetActive && 'scale-[0.998]',
              )}
              onDragOver={handleLibraryDragOver}
              onDragLeave={handleLibraryDragLeave}
              onDrop={(event) => void handleLibraryDrop(event)}
            >
              {dropTargetActive && canUploadDocuments && !recoverySelected ? (
                <div className="border-primary bg-primary/6 pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed p-6 text-center shadow-sm backdrop-blur-[1px]">
                  <p className="text-foreground text-sm font-semibold">
                    Drop files to upload
                  </p>
                </div>
              ) : null}

              {isLoading ? (
                <div className="border-border/70 bg-card text-muted-foreground flex h-full min-h-[320px] items-center rounded-xl border p-6 text-sm shadow-sm">
                  Loading...
                </div>
              ) : (
                <div className="h-full overflow-auto pr-1">
                  {viewMode === 'grid' ? (
                    <DocumentsGrid
                      items={filteredItems}
                      categories={categories}
                      enableDrag={sidebarMode === 'folder' && !recoverySelected}
                      isRecoveryView={recoverySelected}
                      canEdit={canEditDocuments}
                      canDelete={canDeleteDocuments}
                      canEditFolders={canEditFolders}
                      canDeleteFolders={canDeleteFolders}
                      canManageAccess={canManageAccess}
                      onOpenFolder={handleOpenFolder}
                      onOpenDocument={handleOpenDocument}
                      onRenameFolder={(folderId) => {
                        const folder = findFolderById(tree?.folders ?? [], folderId);
                        if (!folder) return;
                        setResourceDialogState({
                          mode: 'rename-folder',
                          folderDraft: {
                            id: folder.id,
                            name: folder.name,
                            description: folder.description ?? undefined,
                          },
                        });
                      }}
                      onDeleteFolder={(folderId) => void handleDeleteFolder(folderId)}
                      onRestoreFolder={(folderId) => void handleRestoreFolder(folderId)}
                      onDeleteFolderPermanent={(folderId) =>
                        void handleDeleteFolderPermanent(folderId)
                      }
                      onManageFolderAccess={(folderId, folderName) =>
                        setAccessDialogState({
                          targetType: 'folder',
                          targetId: folderId,
                          targetName: folderName,
                        })
                      }
                      onEditDocument={(documentId) =>
                        setResourceDialogState({ mode: 'edit-document', documentId })
                      }
                      onDeleteDocument={(documentId) =>
                        void handleDeleteDocument(documentId)
                      }
                      onRestoreDocument={(documentId) =>
                        void handleRestoreDocument(documentId)
                      }
                      onDeleteDocumentPermanent={(documentId) =>
                        void handleDeleteDocumentPermanent(documentId)
                      }
                      onManageAccess={(documentId, documentTitle) =>
                        setAccessDialogState({
                          targetType: 'document',
                          targetId: documentId,
                          targetName: documentTitle,
                        })
                      }
                      onDragStart={(event, item) =>
                        encodeDragPayload(
                          event,
                          item.type === 'folder'
                            ? { kind: 'folder', id: item.id, name: item.name }
                            : { kind: 'document', id: item.id, title: item.name },
                        )
                      }
                    />
                  ) : (
                    <DocumentsTable
                      items={filteredItems}
                      categories={categories}
                      enableDrag={sidebarMode === 'folder' && !recoverySelected}
                      isRecoveryView={recoverySelected}
                      canEdit={canEditDocuments}
                      canDelete={canDeleteDocuments}
                      canEditFolders={canEditFolders}
                      canDeleteFolders={canDeleteFolders}
                      canManageAccess={canManageAccess}
                      onOpenFolder={handleOpenFolder}
                      onOpenDocument={handleOpenDocument}
                      onRenameFolder={(folderId) => {
                        const folder = findFolderById(tree?.folders ?? [], folderId);
                        if (!folder) return;
                        setResourceDialogState({
                          mode: 'rename-folder',
                          folderDraft: {
                            id: folder.id,
                            name: folder.name,
                            description: folder.description ?? undefined,
                          },
                        });
                      }}
                      onDeleteFolder={(folderId) => void handleDeleteFolder(folderId)}
                      onRestoreFolder={(folderId) => void handleRestoreFolder(folderId)}
                      onDeleteFolderPermanent={(folderId) =>
                        void handleDeleteFolderPermanent(folderId)
                      }
                      onManageFolderAccess={(folderId, folderName) =>
                        setAccessDialogState({
                          targetType: 'folder',
                          targetId: folderId,
                          targetName: folderName,
                        })
                      }
                      onEditDocument={(documentId) =>
                        setResourceDialogState({ mode: 'edit-document', documentId })
                      }
                      onDeleteDocument={(documentId) =>
                        void handleDeleteDocument(documentId)
                      }
                      onRestoreDocument={(documentId) =>
                        void handleRestoreDocument(documentId)
                      }
                      onDeleteDocumentPermanent={(documentId) =>
                        void handleDeleteDocumentPermanent(documentId)
                      }
                      onManageAccess={(documentId, documentTitle) =>
                        setAccessDialogState({
                          targetType: 'document',
                          targetId: documentId,
                          targetName: documentTitle,
                        })
                      }
                      onDragStart={(event, item) =>
                        encodeDragPayload(
                          event,
                          item.type === 'folder'
                            ? { kind: 'folder', id: item.id, name: item.name }
                            : { kind: 'document', id: item.id, title: item.name },
                        )
                      }
                    />
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="w-[92vw] max-w-[360px] border-r-0 bg-transparent p-0 shadow-none"
          showCloseButton={false}
        >
          <div className="h-full min-h-0 overflow-hidden p-4">{sidebar}</div>
        </SheetContent>
      </Sheet>

      {uploadDialogState ? (
        <UploadDocumentModal
          open={Boolean(uploadDialogState)}
          onOpenChange={(open) => {
            if (!open) setUploadDialogState(null);
          }}
          categories={categories}
          folders={tree?.folders ?? []}
          defaultFolderId={uploadDialogState.folderId}
          defaultCategoryId={uploadDialogState.categoryId}
          initialFiles={uploadDialogState.initialFiles}
        />
      ) : null}

      {resourceDialogState ? (
        <DocumentResourceDialog
          key={
            resourceDialogState.mode === 'edit-document'
              ? `${resourceDialogState.mode}:${resourceDialogState.documentId}`
              : resourceDialogState.mode === 'rename-folder'
                ? `${resourceDialogState.mode}:${resourceDialogState.folderDraft.id}`
                : resourceDialogState.mode === 'rename-category'
                  ? `${resourceDialogState.mode}:${resourceDialogState.categoryDraft.id}`
                  : resourceDialogState.mode
          }
          open={Boolean(resourceDialogState)}
          onOpenChange={(open) => {
            if (!open) setResourceDialogState(null);
          }}
          mode={resourceDialogState.mode}
          categories={categories}
          folderDraft={
            resourceDialogState.mode === 'create-folder' ||
            resourceDialogState.mode === 'rename-folder'
              ? resourceDialogState.folderDraft
              : undefined
          }
          categoryDraft={
            resourceDialogState.mode === 'rename-category'
              ? resourceDialogState.categoryDraft
              : undefined
          }
          documentDraft={
            resourceDialogState.mode === 'edit-document'
              ? editingDocumentQuery.data
              : undefined
          }
        />
      ) : null}

      {accessDialogState ? (
        <AccessManagementModal
          open={Boolean(accessDialogState)}
          onOpenChange={(open) => {
            if (!open) setAccessDialogState(null);
          }}
          targetType={accessDialogState.targetType}
          targetId={accessDialogState.targetId}
          targetName={accessDialogState.targetName}
        />
      ) : null}

      {confirmDialogState ? (
        <DocumentActionConfirmDialog
          open={Boolean(confirmDialogState)}
          onOpenChange={(open) => {
            if (!open && !isConfirmingAction) setConfirmDialogState(null);
          }}
          title={confirmDialogState.title}
          description={confirmDialogState.description}
          confirmLabel={confirmDialogState.confirmLabel}
          confirming={isConfirmingAction}
          onConfirm={handleConfirmAction}
        />
      ) : null}
    </>
  );
}
