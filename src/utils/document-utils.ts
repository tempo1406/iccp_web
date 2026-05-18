import type {
  AccessRuleResponse,
  CategoryResponse,
  DocumentResponse,
  DocumentStatus,
  DocumentSummaryResponse,
  DocumentTreeResponse,
  FolderTreeResponse,
} from '@/services/documents';

export type DocumentLike = DocumentResponse | DocumentSummaryResponse;

export function formatDocumentSize(size?: number | string | null) {
  if (size === undefined || size === null || size === '') return 'Unknown size';

  const value = typeof size === 'string' ? Number(size) : size;
  if (Number.isNaN(value) || value <= 0) return 'Unknown size';

  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatDocumentDate(value?: string | null) {
  if (!value) return 'Unknown date';

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function getDocumentStatusLabel(status?: string | null) {
  switch (status as DocumentStatus | undefined) {
    case 'not_indexed':
      return 'Not indexed';
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'Processing';
    case 'indexed':
      return 'Indexed';
    case 'failed':
      return 'Failed';
    default:
      return 'Unknown';
  }
}

export function getDocumentStatusTone(status?: string | null) {
  switch (status as DocumentStatus | undefined) {
    case 'indexed':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    case 'processing':
      return 'bg-sky-50 text-sky-700 ring-sky-200';
    case 'pending':
    case 'not_indexed':
      return 'bg-amber-50 text-amber-700 ring-amber-200';
    case 'failed':
      return 'bg-rose-50 text-rose-700 ring-rose-200';
    default:
      return 'bg-slate-100 text-slate-600 ring-slate-200';
  }
}

export function getAccessScopeLabel(
  scope?: string | null,
  accessRules?: AccessRuleResponse[] | null,
) {
  if (!scope) return 'Unknown scope';

  const explicitRuleCount = accessRules?.length ?? 0;

  switch (scope) {
    case 'private':
      return explicitRuleCount > 0 ? 'Private + shared' : 'Private';
    case 'organization':
      return 'Organization';
    case 'project':
      return 'Project';
    case 'role':
      return 'Role';
    case 'user':
      return explicitRuleCount > 0 ? 'Specific users' : 'Private';
    case 'system':
      return 'System';
    default:
      return scope;
  }
}

export function getCategoryLabel(
  categoryId: string | null | undefined,
  categories: CategoryResponse[],
) {
  if (!categoryId) return 'Uncategorized';
  return categories.find((category) => category.id === categoryId)?.name ?? 'Unknown category';
}

export function getPreviewKind(document: Pick<DocumentResponse, 'mimeType' | 'fileType'>) {
  const mimeType = document.mimeType?.toLowerCase() ?? '';
  const fileType = document.fileType?.toLowerCase() ?? '';

  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(fileType)) {
    return 'image';
  }

  if (mimeType.includes('pdf') || fileType === 'pdf') {
    return 'pdf';
  }

  if (mimeType.startsWith('text/') || ['txt', 'md', 'json', 'csv'].includes(fileType)) {
    return 'text';
  }

  if (
    mimeType.includes('word') ||
    mimeType.includes('sheet') ||
    mimeType.includes('presentation') ||
    ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileType)
  ) {
    return 'office';
  }

  return 'download';
}

export function flattenFolderTree(nodes: FolderTreeResponse[], depth = 0): Array<FolderTreeResponse & { depth: number }> {
  const result: Array<FolderTreeResponse & { depth: number }> = [];

  for (const node of nodes) {
    result.push({ ...node, depth });
    result.push(...flattenFolderTree(node.children ?? [], depth + 1));
  }

  return result;
}

export function findFolderById(nodes: FolderTreeResponse[], folderId: string | null): FolderTreeResponse | null {
  if (!folderId) return null;

  for (const node of nodes) {
    if (node.id === folderId) return node;

    const found = findFolderById(node.children ?? [], folderId);
    if (found) return found;
  }

  return null;
}

export function buildFolderAncestors(nodes: FolderTreeResponse[], folderId: string | null): FolderTreeResponse[] {
  if (!folderId) return [];

  function walk(currentNodes: FolderTreeResponse[], trail: FolderTreeResponse[]): FolderTreeResponse[] | null {
    for (const node of currentNodes) {
      const nextTrail = [...trail, node];

      if (node.id === folderId) {
        return nextTrail;
      }

      const found = walk(node.children ?? [], nextTrail);
      if (found) return found;
    }

    return null;
  }

  return walk(nodes, []) ?? [];
}

export function isFolderInsideParent(parent: FolderTreeResponse | null, folderId: string | null) {
  if (!parent || !folderId) return false;
  if (parent.id === folderId) return true;
  return findFolderById(parent.children ?? [], folderId) !== null;
}

export function splitRecoveryTree(tree: DocumentTreeResponse | undefined) {
  const recoveryFolder = tree?.folders.find((folder) => folder.isSystem) ?? null;
  const regularFolders = (tree?.folders ?? []).filter((folder) => !folder.isSystem);

  return {
    regularFolders,
    recoveryFolder,
  };
}
