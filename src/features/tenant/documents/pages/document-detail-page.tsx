'use client';

import { Loader2, WandSparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useDocumentDetail } from '../hooks/use-document-detail';
import { useTriggerChunking } from '../query/use-documents';
import { DocumentDetailHeader } from '../components/documents-detail/document-detail-header';
import { DocumentViewerPanel } from '../components/documents-detail/document-viewer-panel';
import { DocumentVersionPanel } from '../components/documents-detail/document-version-panel';
import { UploadVersionModal } from '../components/documents-detail/upload-version-modal';
import { AccessManagementModal } from '../components/common/access-management-modal';
import { DocumentResourceDialog } from '../components/common/document-resource-dialog';
import { DocumentActionConfirmDialog } from '../components/common/document-action-confirm-dialog';

interface DocumentDetailPageProps {
  id: string;
}

export function DocumentDetailPage({ id }: DocumentDetailPageProps) {
  const {
    canView,
    canEdit,
    canDelete,
    canDownload,
    canManageAccess,
    canUploadVersion,
    document,
    versions,
    categories,
    previewDocument,
    isPending,
    activeTab,
    setActiveTab,
    uploadVersionOpen,
    setUploadVersionOpen,
    accessDialogOpen,
    setAccessDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    isDeleting,
    previewVersion,
    setPreviewVersion,
    handleDeleteDocument,
  } = useDocumentDetail({ id });

  const { mutate: triggerChunking, isPending: isTriggering } = useTriggerChunking();

  const canTrigger = ['not_indexed', 'pending', 'failed'].includes(document?.status ?? '');

  if (!canView) {
    return (
      <div className="border-border/70 bg-card rounded-xl border p-6 shadow-sm">
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
          Permission required
        </Badge>
        <h1 className="text-foreground mt-3 text-base font-semibold">
          You cannot open this document.
        </h1>
      </div>
    );
  }

  if (isPending || !document || !previewDocument) {
    return (
      <div className="border-border/70 bg-card text-muted-foreground rounded-xl border p-6 text-sm shadow-sm">
        Loading...
      </div>
    );
  }

  return (
    <>
      <div className="text-foreground space-y-4">
        <DocumentDetailHeader
          document={document}
          canEdit={canEdit}
          canDelete={canDelete}
          canDownload={canDownload}
          canManageAccess={canManageAccess}
          canUploadVersion={canUploadVersion}
          isPreviewingHistoricVersion={previewVersion !== null}
          onEdit={() => setEditDialogOpen(true)}
          onDelete={() => setDeleteConfirmOpen(true)}
          onManageAccess={() => setAccessDialogOpen(true)}
          onOpenUploadVersion={() => setUploadVersionOpen(true)}
          onExitVersionPreview={() => setPreviewVersion(null)}
        />

        <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-3">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as typeof activeTab)}
              className="border-border/70 bg-card rounded-xl border p-3 shadow-sm"
            >
              <TabsList variant="line" className="border-border w-full border-b pb-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="versions">Versions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="pt-3">
                <div className="border-border/70 bg-muted/20 rounded-lg border p-3 space-y-2">
                  {(canTrigger || document.status === 'processing') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border bg-background text-foreground hover:bg-muted w-full"
                      disabled={isTriggering || document.status === 'processing'}
                      onClick={() => triggerChunking(document.id)}
                    >
                      {isTriggering || document.status === 'processing' ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <WandSparkles className="size-3.5" />
                          Kích hoạt AI Index
                        </>
                      )}
                    </Button>
                  )}
                  {document.status === 'indexed' && (
                    <div className="text-muted-foreground text-xs text-center py-1">
                      ✓ Đã index thành công
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="versions" className="pt-4">
                <DocumentVersionPanel
                  versions={versions}
                  currentVersion={document.version}
                  previewedVersionId={previewVersion?.id ?? null}
                  onPreviewVersion={(version) => setPreviewVersion(version)}
                  onOpenUploadVersion={() => setUploadVersionOpen(true)}
                />
              </TabsContent>
            </Tabs>
          </aside>

          <DocumentViewerPanel document={previewDocument} />
        </div>
      </div>

      <UploadVersionModal
        open={uploadVersionOpen}
        onOpenChange={setUploadVersionOpen}
        documentId={document.id}
        currentVersion={document.version}
      />

      <AccessManagementModal
        open={accessDialogOpen}
        onOpenChange={setAccessDialogOpen}
        targetType="document"
        targetId={document.id}
        targetName={document.title}
      />

      {editDialogOpen ? (
        <DocumentResourceDialog
          key={`detail-edit:${document.id}`}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          mode="edit-document"
          categories={categories}
          documentDraft={document}
        />
      ) : null}

      <DocumentActionConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          if (!isDeleting) setDeleteConfirmOpen(open);
        }}
        title="Move document to recovery?"
        description="The active document will be removed from the library view and kept in Recovery until a restore or permanent delete happens."
        confirmLabel="Move to recovery"
        confirming={isDeleting}
        onConfirm={handleDeleteDocument}
      />
    </>
  );
}
