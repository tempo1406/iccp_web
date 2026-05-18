'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeMutation, useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { toast } from '@/lib/toast';
import { DocumentsService } from '@/services/documents';
import { IngestAiService } from '@/services/ai';
import type {
  CreateAccessRuleBody,
  CreateCategoryBody,
  CreateFolderBody,
  DocumentListParams,
  MoveDocumentBody,
  MoveFolderBody,
  ReorderFoldersBody,
  UpdateCategoryBody,
  UpdateDocumentBody,
  UpdateFolderBody,
  UploadDocumentBody,
  UploadVersionBody,
} from '@/services/documents';

type TenantId = string | null | undefined;

const documentRootKey = (tenantId: TenantId) =>
  ['documents', tenantId ?? 'global'] as const;

export const DOCUMENT_QUERY_KEYS = {
  root: (tenantId?: TenantId) => documentRootKey(tenantId),
  tree: (tenantId?: TenantId, projectId?: string) =>
    [...documentRootKey(tenantId), 'tree', projectId ?? 'all'] as const,
  list: (tenantId?: TenantId, params?: DocumentListParams) =>
    [...documentRootKey(tenantId), 'list', params ?? {}] as const,
  recovery: (tenantId?: TenantId) => [...documentRootKey(tenantId), 'recovery'] as const,
  detail: (tenantId: TenantId | undefined, id: string) =>
    [...documentRootKey(tenantId), 'detail', id] as const,
  versions: (tenantId: TenantId | undefined, id: string) =>
    [...documentRootKey(tenantId), 'versions', id] as const,
  chunks: (tenantId: TenantId | undefined, id: string) =>
    [...documentRootKey(tenantId), 'chunks', id] as const,
  categories: (tenantId?: TenantId) =>
    [...documentRootKey(tenantId), 'categories'] as const,
  documentAccess: (tenantId: TenantId | undefined, id: string) =>
    [...documentRootKey(tenantId), 'access', 'document', id] as const,
  folderAccess: (tenantId: TenantId | undefined, id: string) =>
    [...documentRootKey(tenantId), 'access', 'folder', id] as const,
};

export function useDocumentTree(projectId?: string, options?: { enabled?: boolean }) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: DOCUMENT_QUERY_KEYS.tree(ctx.tenantId, projectId),
      queryFn: () => new DocumentsService(ctx).getTree(projectId),
      enabled: options?.enabled ?? true,
      staleTime: 60_000,
    }),
  );
}

export function useDocumentList(
  params?: DocumentListParams,
  options?: { enabled?: boolean },
) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: DOCUMENT_QUERY_KEYS.list(ctx.tenantId, params),
      queryFn: () => new DocumentsService(ctx).list(params),
      enabled: options?.enabled ?? true,
      staleTime: 30_000,
    }),
  );
}

export function useRecoveryDocuments(options?: { enabled?: boolean }) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: DOCUMENT_QUERY_KEYS.recovery(ctx.tenantId),
      queryFn: () => new DocumentsService(ctx).getRecovery(),
      enabled: options?.enabled ?? true,
      staleTime: 30_000,
    }),
  );
}

export function useDocumentById(id: string, options?: { enabled?: boolean }) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: DOCUMENT_QUERY_KEYS.detail(ctx.tenantId, id),
      queryFn: () => new DocumentsService(ctx).byId(id),
      enabled: Boolean(id) && (options?.enabled ?? true),
    }),
  );
}

export function useDocumentVersions(id: string, options?: { enabled?: boolean }) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: DOCUMENT_QUERY_KEYS.versions(ctx.tenantId, id),
      queryFn: () => new DocumentsService(ctx).getVersions(id),
      enabled: Boolean(id) && (options?.enabled ?? true),
      staleTime: 30_000,
    }),
  );
}

export function useDocumentChunks(id: string, options?: { enabled?: boolean }) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: DOCUMENT_QUERY_KEYS.chunks(ctx.tenantId, id),
      queryFn: () => new DocumentsService(ctx).getChunks(id),
      enabled: Boolean(id) && (options?.enabled ?? true),
      staleTime: 60_000,
    }),
  );
}

export function useCategories(options?: { enabled?: boolean }) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: DOCUMENT_QUERY_KEYS.categories(ctx.tenantId),
      queryFn: () => new DocumentsService(ctx).listCategories(),
      enabled: options?.enabled ?? true,
      staleTime: 120_000,
    }),
  );
}

export function useDocumentAccess(documentId: string, options?: { enabled?: boolean }) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: DOCUMENT_QUERY_KEYS.documentAccess(ctx.tenantId, documentId),
      queryFn: () => new DocumentsService(ctx).getDocumentAccess(documentId),
      enabled: Boolean(documentId) && (options?.enabled ?? true),
    }),
  );
}

export function useFolderAccess(folderId: string, options?: { enabled?: boolean }) {
  const ctx = useServiceContext();

  return useSafeQuery(
    useQuery({
      queryKey: DOCUMENT_QUERY_KEYS.folderAccess(ctx.tenantId, folderId),
      queryFn: () => new DocumentsService(ctx).getFolderAccess(folderId),
      enabled: Boolean(folderId) && (options?.enabled ?? true),
    }),
  );
}

function invalidateDocumentRoot(
  queryClient: ReturnType<typeof useQueryClient>,
  tenantId: TenantId,
) {
  return queryClient.invalidateQueries({ queryKey: DOCUMENT_QUERY_KEYS.root(tenantId) });
}

export function useUploadDocument() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (body: UploadDocumentBody) => new DocumentsService(ctx).upload(body),
      onSuccess: () => {
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
      },
    }),
  );
}

export function useUpdateDocument() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({ id, ...body }: { id: string } & UpdateDocumentBody) =>
        new DocumentsService(ctx).update(id, body),
      onSuccess: (_data, variables) => {
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
        void queryClient.invalidateQueries({
          queryKey: DOCUMENT_QUERY_KEYS.detail(ctx.tenantId, variables.id),
        });
      },
    }),
  );
}

export function useMoveDocument() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({ id, ...body }: { id: string } & MoveDocumentBody) =>
        new DocumentsService(ctx).moveDocument(id, body),
      onSuccess: () => {
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
      },
    }),
  );
}

export function useDeleteDocument() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (id: string) => new DocumentsService(ctx).remove(id),
      onSuccess: () => {
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
      },
    }),
  );
}

export function useRestoreDocument() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (id: string) => new DocumentsService(ctx).restoreDocument(id),
      onSuccess: () => {
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
      },
    }),
  );
}

export function useDeleteDocumentPermanent() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (id: string) => new DocumentsService(ctx).deletePermanent(id),
      onSuccess: () => {
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
      },
    }),
  );
}

export function useUploadDocumentVersion(documentId: string) {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (body: UploadVersionBody) =>
        new DocumentsService(ctx).uploadVersion(documentId, body),
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: DOCUMENT_QUERY_KEYS.detail(ctx.tenantId, documentId),
        });
        void queryClient.invalidateQueries({
          queryKey: DOCUMENT_QUERY_KEYS.versions(ctx.tenantId, documentId),
        });
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
      },
    }),
  );
}

export function useCreateFolder() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (body: CreateFolderBody) =>
        new DocumentsService(ctx).createFolder(body),
      onSuccess: () => {
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
      },
    }),
  );
}

export function useUpdateFolder() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({ id, ...body }: { id: string } & UpdateFolderBody) =>
        new DocumentsService(ctx).updateFolder(id, body),
      onSuccess: () => {
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
      },
    }),
  );
}

export function useMoveFolder() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({ id, ...body }: { id: string } & MoveFolderBody) =>
        new DocumentsService(ctx).moveFolder(id, body),
      onSuccess: () => {
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
      },
    }),
  );
}

export function useReorderFolders() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (body: ReorderFoldersBody) =>
        new DocumentsService(ctx).reorderFolders(body),
      onSuccess: () => {
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
      },
    }),
  );
}

export function useDeleteFolder() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (id: string) => new DocumentsService(ctx).deleteFolder(id),
      onSuccess: () => {
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
      },
    }),
  );
}

export function useDeleteFolderPermanent() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (id: string) => new DocumentsService(ctx).deleteFolderPermanent(id),
      onSuccess: () => {
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
      },
    }),
  );
}

export function useRestoreFolder() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (id: string) => new DocumentsService(ctx).restoreFolder(id),
      onSuccess: () => {
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
      },
    }),
  );
}

export function useCreateCategory() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (body: CreateCategoryBody) =>
        new DocumentsService(ctx).createCategory(body),
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: DOCUMENT_QUERY_KEYS.categories(ctx.tenantId),
        });
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
      },
    }),
  );
}

export function useUpdateCategory() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({ id, ...body }: { id: string } & UpdateCategoryBody) =>
        new DocumentsService(ctx).updateCategory(id, body),
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: DOCUMENT_QUERY_KEYS.categories(ctx.tenantId),
        });
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
      },
    }),
  );
}

export function useDeleteCategory() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (id: string) => new DocumentsService(ctx).deleteCategory(id),
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: DOCUMENT_QUERY_KEYS.categories(ctx.tenantId),
        });
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
      },
    }),
  );
}

export function useGrantDocumentAccess(documentId: string) {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (body: CreateAccessRuleBody) =>
        new DocumentsService(ctx).grantDocumentAccess(documentId, body),
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: DOCUMENT_QUERY_KEYS.documentAccess(ctx.tenantId, documentId),
        });
        void queryClient.invalidateQueries({
          queryKey: DOCUMENT_QUERY_KEYS.detail(ctx.tenantId, documentId),
        });
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
      },
    }),
  );
}

export function useRevokeDocumentAccess(documentId: string) {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        accessType,
        accessId,
        permission,
      }: {
        accessType: string;
        accessId: string;
        permission?: string;
      }) =>
        new DocumentsService(ctx).revokeDocumentAccess(
          documentId,
          accessType,
          accessId,
          permission,
        ),
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: DOCUMENT_QUERY_KEYS.documentAccess(ctx.tenantId, documentId),
        });
        void queryClient.invalidateQueries({
          queryKey: DOCUMENT_QUERY_KEYS.detail(ctx.tenantId, documentId),
        });
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
      },
    }),
  );
}

export function useGrantFolderAccess(folderId: string) {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (body: CreateAccessRuleBody) =>
        new DocumentsService(ctx).grantFolderAccess(folderId, body),
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: DOCUMENT_QUERY_KEYS.folderAccess(ctx.tenantId, folderId),
        });
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
      },
    }),
  );
}

export function useRevokeFolderAccess(folderId: string) {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: ({
        accessType,
        accessId,
        permission,
      }: {
        accessType: string;
        accessId: string;
        permission?: string;
      }) =>
        new DocumentsService(ctx).revokeFolderAccess(
          folderId,
          accessType,
          accessId,
          permission,
        ),
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: DOCUMENT_QUERY_KEYS.folderAccess(ctx.tenantId, folderId),
        });
        void invalidateDocumentRoot(queryClient, ctx.tenantId);
      },
    }),
  );
}

/**
 * Trigger AI indexing for a document.
 * Gọi be_ai POST /api/v1/ingest/documents/trigger.
 * Invalidates document detail để refetch status sau khi queue xong.
 */
export function useTriggerChunking() {
  const ctx = useServiceContext();
  const queryClient = useQueryClient();

  return useSafeMutation(
    useMutation({
      mutationFn: (documentId: string) =>
        new IngestAiService(ctx).triggerIngest(documentId),
      onSuccess: (_, documentId) => {
        void queryClient.invalidateQueries({
          queryKey: DOCUMENT_QUERY_KEYS.detail(ctx.tenantId, documentId),
        });
        toast.success(
          'Đã gửi yêu cầu xử lý tài liệu. Trạng thái sẽ cập nhật khi hoàn thành.',
        );
      },
      onError: () => {
        toast.danger('Không thể kích hoạt xử lý tài liệu. Vui lòng thử lại.');
      },
    }),
  );
}
