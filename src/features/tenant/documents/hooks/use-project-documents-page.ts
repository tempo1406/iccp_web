'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/common/constant/routes';
import { toast } from '@/lib/toast';
import { useTenant } from '@/providers';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { usePermissionChecker } from '@/features/tenant/access-control/hooks/use-can';
import { useIsMobile } from '@/components/ui/use-mobile';
import type {
  DocumentResponse,
  DocumentSummaryResponse,
  ExplorerItem,
  FolderTreeResponse,
} from '@/services/documents';
import {
  buildFolderAncestors,
  findFolderById,
  splitRecoveryTree,
} from '@/utils/document-utils';
import {
  extractFilesFromDrop,
  hasExternalFiles,
} from '../../../../utils/external-file-drop';
import {
  useDeleteDocument,
  useDeleteDocumentPermanent,
  useDeleteFolder,
  useDeleteFolderPermanent,
  useDocumentById,
  useDocumentList,
  useDocumentTree,
  useMoveDocument,
  useMoveFolder,
  useRecoveryDocuments,
  useRestoreDocument,
  useRestoreFolder,
} from '../query/use-documents';

export type ResourceDialogState =
  | { mode: 'create-folder'; folderDraft?: { parentId?: string | null } }
  | {
      mode: 'rename-folder';
      folderDraft: { id: string; name?: string; description?: string | null };
    }
  | { mode: 'edit-document'; documentId: string };

export type DragPayload =
  | { kind: 'folder'; id: string; name: string }
  | { kind: 'document'; id: string; title: string };

export type ConfirmDialogState = {
  title: string;
  description: string;
  confirmLabel: string;
  action: () => Promise<boolean>;
};

export type UploadDialogState = {
  folderId?: string | null;
  initialFiles?: File[];
};

export function encodeDragPayload(
  event: React.DragEvent<HTMLElement>,
  payload: DragPayload,
) {
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('application/json', JSON.stringify(payload));
}

export function decodeDragPayload(
  event: React.DragEvent<HTMLElement>,
): DragPayload | null {
  const raw = event.dataTransfer.getData('application/json');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DragPayload;
  } catch {
    return null;
  }
}

function toFileExplorerItem(
  document: DocumentSummaryResponse | DocumentResponse,
): ExplorerItem {
  return {
    id: document.id,
    type: 'file',
    name: document.title,
    size: document.fileSize,
    updatedAt: document.updatedAt,
    originalData: document,
  };
}

function toFolderExplorerItem(folder: FolderTreeResponse): ExplorerItem {
  return {
    id: folder.id,
    type: 'folder',
    name: folder.name,
    updatedAt: undefined,
    originalData: folder,
  };
}

export function useProjectDocumentsPage(projectId: string) {
  const router = useRouter();
  const { tenantSlug } = useTenant();
  const isMobile = useIsMobile();
  const hasPermission = usePermissionChecker();

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [recoverySelected, setRecoverySelected] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropTargetActive, setDropTargetActive] = useState(false);
  const [uploadDialogState, setUploadDialogState] = useState<UploadDialogState | null>(
    null,
  );
  const [confirmDialogState, setConfirmDialogState] = useState<ConfirmDialogState | null>(
    null,
  );
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);
  const [accessDialogState, setAccessDialogState] = useState<{
    targetType: 'document' | 'folder';
    targetId: string;
    targetName: string;
  } | null>(null);
  const [resourceDialogState, setResourceDialogState] =
    useState<ResourceDialogState | null>(null);

  const deferredSearch = useDeferredValue(searchQuery);

  const canListDocuments = hasPermission(PERMISSIONS.DOCUMENTS_LIST);
  const canUploadDocuments = hasPermission(PERMISSIONS.DOCUMENTS_UPLOAD);
  const canEditDocuments =
    hasPermission(PERMISSIONS.DOCUMENTS_UPDATE) ||
    hasPermission(PERMISSIONS.DOCUMENTS_UPDATE_METADATA);
  const canDeleteDocuments = hasPermission(PERMISSIONS.DOCUMENTS_DELETE);
  const canManageAccess =
    hasPermission(PERMISSIONS.DOCUMENTS_MANAGE_ACCESS) ||
    hasPermission(PERMISSIONS.DOCUMENTS_ACCESS_MANAGE);
  const canCreateFolders = hasPermission(PERMISSIONS.DOCUMENTS_FOLDERS_CREATE);
  const canEditFolders = hasPermission(PERMISSIONS.DOCUMENTS_FOLDERS_UPDATE);
  const canDeleteFolders = hasPermission(PERMISSIONS.DOCUMENTS_FOLDERS_DELETE);

  const treeQuery = useDocumentTree(projectId, {
    enabled: canListDocuments && Boolean(projectId),
  });
  const folderDocumentsQuery = useDocumentList(
    selectedFolderId ? { folderId: selectedFolderId, projectId } : undefined,
    {
      enabled: canListDocuments && !recoverySelected && Boolean(selectedFolderId),
    },
  );
  const recoveryDocumentsQuery = useRecoveryDocuments({ enabled: canListDocuments });

  const deleteDocument = useDeleteDocument();
  const restoreDocument = useRestoreDocument();
  const deleteDocumentPermanent = useDeleteDocumentPermanent();
  const deleteFolder = useDeleteFolder();
  const deleteFolderPermanent = useDeleteFolderPermanent();
  const restoreFolder = useRestoreFolder();
  const moveFolder = useMoveFolder();
  const moveDocument = useMoveDocument();

  const tree = treeQuery.data;
  const { recoveryFolder, regularFolders } = splitRecoveryTree(tree);
  const recoveryFolderIds = useMemo(() => {
    if (!recoveryFolder) return new Set<string>();

    const ids = new Set<string>();
    const stack = [recoveryFolder];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;
      ids.add(current.id);
      stack.push(...(current.children ?? []));
    }

    return ids;
  }, [recoveryFolder]);
  const recoveryDocuments = useMemo(() => {
    const allRecoveryDocuments = recoveryDocumentsQuery.data ?? [];
    if (!projectId) return allRecoveryDocuments;
    if (recoveryFolderIds.size === 0) return [];

    return allRecoveryDocuments.filter(
      (document) =>
        Boolean(document.folderId) &&
        recoveryFolderIds.has(String(document.folderId)),
    );
  }, [projectId, recoveryDocumentsQuery.data, recoveryFolderIds]);
  const canViewRecovery = Boolean(recoveryFolder);

  const editingDocumentId =
    resourceDialogState?.mode === 'edit-document' ? resourceDialogState.documentId : null;
  const editingDocumentQuery = useDocumentById(editingDocumentId ?? '', {
    enabled: Boolean(editingDocumentId),
  });

  const selectedFolderNode = useMemo(
    () => findFolderById(tree?.folders ?? [], selectedFolderId),
    [selectedFolderId, tree?.folders],
  );

  const isSelectedFolderInRecovery = useMemo(() => {
    if (!selectedFolderId || !recoveryFolder) return false;
    const ancestors = buildFolderAncestors(tree?.folders ?? [], selectedFolderId);
    return ancestors.some((folder) => folder.id === recoveryFolder.id);
  }, [recoveryFolder, selectedFolderId, tree?.folders]);

  const currentExplorerItems = useMemo<ExplorerItem[]>(() => {
    if (!canListDocuments) return [];

    const foldersForView = recoverySelected
      ? selectedFolderNode && isSelectedFolderInRecovery
        ? (selectedFolderNode.children ?? [])
        : (recoveryFolder?.children ?? [])
      : selectedFolderId
        ? (selectedFolderNode?.children ?? [])
        : regularFolders;

    const documentsForView: Array<DocumentSummaryResponse | DocumentResponse> =
      recoverySelected
        ? selectedFolderNode && isSelectedFolderInRecovery && !selectedFolderNode.isSystem
          ? (selectedFolderNode.documents ?? [])
          : recoveryDocuments
        : selectedFolderId
          ? (folderDocumentsQuery.data ?? selectedFolderNode?.documents ?? [])
          : (tree?.rootDocuments ?? []);

    const folderItems = [...foldersForView]
      .sort((l, r) => l.sortOrder - r.sortOrder || l.name.localeCompare(r.name))
      .map((folder) => toFolderExplorerItem(folder));
    const fileItems = [...documentsForView]
      .sort((l, r) => new Date(r.updatedAt).getTime() - new Date(l.updatedAt).getTime())
      .map((document) => toFileExplorerItem(document));

    return [...folderItems, ...fileItems];
  }, [
    canListDocuments,
    folderDocumentsQuery.data,
    isSelectedFolderInRecovery,
    recoveryFolder,
    recoveryDocuments,
    recoverySelected,
    regularFolders,
    selectedFolderId,
    selectedFolderNode,
    tree?.rootDocuments,
  ]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = deferredSearch.trim().toLowerCase();
    if (!normalizedQuery) return currentExplorerItems;
    return currentExplorerItems.filter((item) =>
      item.name.toLowerCase().includes(normalizedQuery),
    );
  }, [currentExplorerItems, deferredSearch]);

  const currentPanelLabel = useMemo(() => {
    if (recoverySelected) {
      if (isSelectedFolderInRecovery && selectedFolderNode) {
        return `${selectedFolderNode.name} recovery contents`;
      }
      return 'Recovery';
    }
    if (!selectedFolderId) return 'Project library';
    return selectedFolderNode?.name ?? 'Folder';
  }, [
    isSelectedFolderInRecovery,
    recoverySelected,
    selectedFolderId,
    selectedFolderNode,
  ]);

  function closeMobileSidebar() {
    if (isMobile) setSidebarOpen(false);
  }

  function openUploadDialog(options?: UploadDialogState) {
    setUploadDialogState(options ?? {});
  }

  function handleOpenFolder(folderId: string) {
    setSelectedFolderId(folderId);
    const nextIsRecovery = Boolean(
      recoveryFolder &&
      buildFolderAncestors(tree?.folders ?? [], folderId).some(
        (folder) => folder.id === recoveryFolder.id,
      ),
    );
    setRecoverySelected(nextIsRecovery);
    closeMobileSidebar();
  }

  function handleOpenDocument(documentId: string) {
    closeMobileSidebar();
    router.push(ROUTES.tenant.document(tenantSlug, documentId));
  }

  async function handleConfirmAction() {
    if (!confirmDialogState || isConfirmingAction) return;
    setIsConfirmingAction(true);
    const ok = await confirmDialogState.action();
    setIsConfirmingAction(false);
    if (ok) setConfirmDialogState(null);
  }

  function handleDeleteDocument(documentId: string) {
    setConfirmDialogState({
      title: 'Move document to recovery?',
      description:
        'The document will leave the active library and appear in Recovery until it is restored or deleted permanently.',
      confirmLabel: 'Move to recovery',
      action: async () => {
        const result = await deleteDocument.mutateAsync(documentId);
        if (!result.ok) {
          toast.danger(result.error.message);
          return false;
        }
        toast.success('Document moved to recovery.');
        return true;
      },
    });
  }

  async function handleRestoreDocument(documentId: string) {
    const result = await restoreDocument.mutateAsync(documentId);
    if (!result.ok) {
      toast.danger(result.error.message);
      return;
    }
    toast.success('Document restored.');
  }

  function handleDeleteDocumentPermanent(documentId: string) {
    setConfirmDialogState({
      title: 'Delete document permanently?',
      description:
        'This action cannot be undone. The document will be removed from Recovery and the active library.',
      confirmLabel: 'Delete permanently',
      action: async () => {
        const result = await deleteDocumentPermanent.mutateAsync(documentId);
        if (!result.ok) {
          toast.danger(result.error.message);
          return false;
        }
        toast.success('Document deleted permanently.');
        return true;
      },
    });
  }

  function handleDeleteFolder(folderId: string) {
    setConfirmDialogState({
      title: 'Move folder to recovery?',
      description:
        'The folder and its current contents will move under Recovery. You can restore them later.',
      confirmLabel: 'Move folder',
      action: async () => {
        const result = await deleteFolder.mutateAsync(folderId);
        if (!result.ok) {
          toast.danger(result.error.message);
          return false;
        }
        toast.success('Folder moved to recovery.');
        return true;
      },
    });
  }

  async function handleRestoreFolder(folderId: string) {
    const result = await restoreFolder.mutateAsync(folderId);
    if (!result.ok) {
      toast.danger(result.error.message);
      return;
    }
    toast.success('Folder restored.');
  }

  function handleDeleteFolderPermanent(folderId: string) {
    setConfirmDialogState({
      title: 'Delete folder permanently?',
      description:
        'This action cannot be undone. The folder, all subfolders, and contained documents will be deleted permanently.',
      confirmLabel: 'Delete permanently',
      action: async () => {
        const result = await deleteFolderPermanent.mutateAsync(folderId);
        if (!result.ok) {
          toast.danger(result.error.message);
          return false;
        }
        toast.success('Folder deleted permanently.');
        return true;
      },
    });
  }

  async function handleDropIntoFolder(
    event: React.DragEvent<HTMLElement>,
    targetFolderId: string | null,
  ) {
    event.preventDefault();
    const payload = decodeDragPayload(event);
    if (!payload) return;

    if (payload.kind === 'folder') {
      if (payload.id === targetFolderId) return;

      const draggedFolder = findFolderById(tree?.folders ?? [], payload.id);
      const targetFolder = findFolderById(tree?.folders ?? [], targetFolderId);

      if (targetFolder && draggedFolder) {
        const targetAncestors = buildFolderAncestors(
          tree?.folders ?? [],
          targetFolder.id,
        );
        if (targetAncestors.some((f) => f.id === draggedFolder.id)) {
          toast.danger('A folder cannot be moved into its own descendant.');
          return;
        }
      }

      const result = await moveFolder.mutateAsync({
        id: payload.id,
        parentId: targetFolderId,
      });
      if (!result.ok) {
        toast.danger(result.error.message);
        return;
      }
      toast.success(`Moved folder "${payload.name}".`);
      return;
    }

    const result = await moveDocument.mutateAsync({
      id: payload.id,
      folderId: targetFolderId,
    });
    if (!result.ok) {
      toast.danger(result.error.message);
      return;
    }
    toast.success(`Moved document "${payload.title}".`);
  }

  function handleLibraryDragOver(event: React.DragEvent<HTMLElement>) {
    if (!canUploadDocuments || recoverySelected || !hasExternalFiles(event)) return;
    event.preventDefault();
    setDropTargetActive(true);
  }

  function handleLibraryDragLeave(event: React.DragEvent<HTMLElement>) {
    const relatedTarget = event.relatedTarget;
    if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget))
      return;
    setDropTargetActive(false);
  }

  async function handleLibraryDrop(event: React.DragEvent<HTMLElement>) {
    if (!canUploadDocuments || recoverySelected || !hasExternalFiles(event)) return;
    event.preventDefault();
    setDropTargetActive(false);

    const files = await extractFilesFromDrop(event);
    if (files.length === 0) {
      toast.danger('No supported files were found in the dropped selection.');
      return;
    }

    openUploadDialog({ folderId: selectedFolderId, initialFiles: files });
    toast.success(
      files.length === 1
        ? 'File loaded into upload form.'
        : `${files.length} files loaded into the upload form.`,
    );
  }

  return {
    // state
    selectedFolderId,
    setSelectedFolderId,
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
    // computed
    isMobile,
    filteredItems,
    currentPanelLabel,
    tree,
    recoveryDocuments,
    recoveryFolder,
    canViewRecovery,
    selectedFolderNode,
    isSelectedFolderInRecovery,
    editingDocumentQuery,
    // query loading states
    isLoading: treeQuery.isPending,
    // permissions
    canListDocuments,
    canUploadDocuments,
    canEditDocuments,
    canDeleteDocuments,
    canManageAccess,
    canCreateFolders,
    canEditFolders,
    canDeleteFolders,
    // handlers
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
    handleDropIntoFolder,
    handleLibraryDragOver,
    handleLibraryDragLeave,
    handleLibraryDrop,
  };
}
