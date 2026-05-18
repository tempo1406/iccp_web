export type AccessScope =
  | 'private'
  | 'organization'
  | 'project'
  | 'role'
  | 'user'
  | 'system';

export type AccessType = 'user' | 'role' | 'project';

export type ResourcePermission = 'view' | 'download' | 'upload' | 'edit' | 'manage';

export type DocumentStatus =
  | 'not_indexed'
  | 'pending'
  | 'processing'
  | 'indexed'
  | 'failed';

export interface DocumentListParams {
  projectId?: string;
  folderId?: string;
  categoryId?: string;
}

export interface UploadDocumentBody {
  file: File;
  title: string;
  description?: string;
  folderId?: string;
  categoryId?: string;
  accessScope?: AccessScope;
  rules?: AccessRuleItem[];
}

export interface UpdateDocumentBody {
  title?: string;
  description?: string;
  folderId?: string | null;
  categoryId?: string | null;
  accessScope?: AccessScope;
}

export interface MoveDocumentBody {
  folderId: string | null;
}

export interface CreateFolderBody {
  name: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
  projectId?: string;
}

export interface UpdateFolderBody {
  name?: string;
  description?: string;
  sortOrder?: number;
}

export interface MoveFolderBody {
  parentId?: string | null;
  sortOrder?: number;
}

export interface ReorderFolderItem {
  id: string;
  sortOrder: number;
}

export interface ReorderFoldersBody {
  items: ReorderFolderItem[];
}

export interface CreateCategoryBody {
  name: string;
  description?: string;
}

export interface UpdateCategoryBody {
  name?: string;
  description?: string;
}

export interface AccessRuleItem {
  accessType: AccessType;
  accessId: string;
  permission?: ResourcePermission;
}

export interface CreateAccessRuleBody {
  rules: AccessRuleItem[];
}

export interface FolderResponse {
  id: string;
  organizationId?: string | null;
  projectId?: string | null;
  name: string;
  description?: string | null;
  parentId?: string | null;
  originalParentId?: string | null;
  path?: string | null;
  isSystem: boolean;
  sortOrder: number;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentSummaryResponse {
  id: string;
  title: string;
  fileType?: string | null;
  fileSize?: number | string | null;
  isActive?: boolean;
  description?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentResponse extends DocumentSummaryResponse {
  organizationId?: string | null;
  folderId?: string | null;
  categoryId?: string | null;
  title: string;
  description?: string | null;
  fileName?: string | null;
  filePath: string;
  mimeType?: string | null;
  uploadedBy?: string | null;
  status?: DocumentStatus | string;
  accessScope?: AccessScope | string;
  metadata?: Record<string, unknown> | null;
  indexedAt?: string | null;
  accessRules?: AccessRuleResponse[];
}

export interface FolderTreeResponse {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  isSystem: boolean;
  sortOrder: number;
  documents: DocumentSummaryResponse[];
  children: FolderTreeResponse[];
}

export interface DocumentTreeResponse {
  folders: FolderTreeResponse[];
  rootDocuments: DocumentSummaryResponse[];
}

export interface CategoryResponse {
  id: string;
  organizationId?: string | null;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentVersionResponse {
  id: string;
  documentId: string;
  version: number;
  filePath: string;
  fileName?: string | null;
  fileSize?: number | null;
  uploadedBy?: string | null;
  changeNotes?: string | null;
  createdAt: string;
}

export interface UploadVersionBody {
  file: File;
  changeNotes?: string;
}

export interface DocumentChunkResponse {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AccessRuleResponse {
  id: string;
  accessType: AccessType;
  accessId: string;
  permission: ResourcePermission;
  createdAt?: string;
}

export type DocumentChunkApiResponse = DocumentChunkResponse;

export type ExplorerItemType = 'folder' | 'file';

export interface ExplorerItem {
  id: string;
  type: ExplorerItemType;
  name: string;
  size?: number | string | null;
  updatedAt?: string;
  originalData:
    | FolderResponse
    | FolderTreeResponse
    | DocumentResponse
    | DocumentSummaryResponse;
}
