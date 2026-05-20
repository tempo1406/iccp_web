'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/common/constant/routes';
import { toast } from '@/lib/toast';
import { useTenant } from '@/providers';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { usePermissionChecker } from '@/features/tenant/access-control/hooks/use-can';
import {
  useCategories,
  useDeleteDocument,
  useDocumentById,
  useDocumentChunks,
  useDocumentVersions,
} from '../query/use-documents';
import type { DocumentVersionResponse } from '@/services/documents';

interface UseDocumentDetailOptions {
  id: string;
}

export function useDocumentDetail({ id }: UseDocumentDetailOptions) {
  const router = useRouter();
  const { tenantSlug } = useTenant();
  const hasPermission = usePermissionChecker();

  const canView = hasPermission(PERMISSIONS.DOCUMENTS_VIEW);
  const canEdit =
    hasPermission(PERMISSIONS.DOCUMENTS_UPDATE) ||
    hasPermission(PERMISSIONS.DOCUMENTS_UPDATE_METADATA);
  const canDelete = hasPermission(PERMISSIONS.DOCUMENTS_DELETE);
  const canDownload = hasPermission(PERMISSIONS.DOCUMENTS_DOWNLOAD);
  const canManageAccess =
    hasPermission(PERMISSIONS.DOCUMENTS_MANAGE_ACCESS) ||
    hasPermission(PERMISSIONS.DOCUMENTS_ACCESS_MANAGE);
  const canUploadVersion =
    hasPermission(PERMISSIONS.DOCUMENTS_VERSIONS_UPLOAD) ||
    hasPermission(PERMISSIONS.DOCUMENTS_CREATE_VERSION);

  const documentQuery = useDocumentById(id, { enabled: canView });
  const versionsQuery = useDocumentVersions(id, {
    enabled: canView && hasPermission(PERMISSIONS.DOCUMENTS_LIST_VERSIONS),
  });
  const chunksQuery = useDocumentChunks(id, { enabled: canView });
  const categoriesQuery = useCategories({ enabled: canView });
  const deleteDocument = useDeleteDocument();

  const [activeTab, setActiveTab] = useState<'overview' | 'extraction' | 'versions'>(
    'overview',
  );
  const [uploadVersionOpen, setUploadVersionOpen] = useState(false);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<DocumentVersionResponse | null>(
    null,
  );

  const document = documentQuery.data;
  const versions = versionsQuery.data ?? [];
  const chunks = chunksQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const previewDocument = useMemo(() => {
    if (!document) return null;
    if (!previewVersion) return document;
    return {
      ...document,
      filePath: previewVersion.filePath,
      fileName: previewVersion.fileName ?? document.fileName,
      fileSize: previewVersion.fileSize ?? document.fileSize,
    };
  }, [document, previewVersion]);

  async function handleDeleteDocument() {
    if (!document || isDeleting) return;
    setIsDeleting(true);
    const result = await deleteDocument.mutateAsync(document.id);
    setIsDeleting(false);

    if (!result.ok) {
      toast.danger(result.error.message);
      return;
    }

    toast.success('Document moved to recovery.');
    setDeleteConfirmOpen(false);
    router.replace(ROUTES.tenant.documents(tenantSlug));
  }

  return {
    // permissions
    canView,
    canEdit,
    canDelete,
    canDownload,
    canManageAccess,
    canUploadVersion,
    // data
    document,
    versions,
    chunks,
    categories,
    previewDocument,
    // query state
    isPending: documentQuery.isPending,
    // ui state
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
    // handlers
    handleDeleteDocument,
  };
}
