import { BaseService } from '../base-service';
import type {
  AccessRuleResponse,
  CategoryResponse,
  CreateAccessRuleBody,
  CreateCategoryBody,
  CreateFolderBody,
  DocumentChunkResponse,
  DocumentListParams,
  DocumentResponse,
  DocumentTreeResponse,
  DocumentVersionResponse,
  FolderResponse,
  MoveDocumentBody,
  MoveFolderBody,
  ReorderFoldersBody,
  UpdateCategoryBody,
  UpdateDocumentBody,
  UpdateFolderBody,
  UploadDocumentBody,
  UploadVersionBody,
} from './types/documents.types';

export class DocumentsService extends BaseService {
  private readonly base = '/v1/documents';
  private readonly folderBase = '/v1/documents/folders';
  private readonly categoryBase = '/v1/documents/categories';
  private readonly accessBase = '/v1/access';

  getTree(projectId?: string): Promise<DocumentTreeResponse> {
    const qs = this.buildQuery({ projectId });
    return this.get<DocumentTreeResponse>(`${this.base}/tree${qs}`);
  }

  list(params?: DocumentListParams): Promise<DocumentResponse[]> {
    const qs = this.buildQuery(params);
    return this.get<DocumentResponse[]>(`${this.base}${qs}`);
  }

  getRecovery(): Promise<DocumentResponse[]> {
    return this.get<DocumentResponse[]>(`${this.base}/recovery`);
  }

  byId(id: string): Promise<DocumentResponse> {
    return this.get<DocumentResponse>(`${this.base}/${id}`);
  }

  upload(body: UploadDocumentBody): Promise<DocumentResponse> {
    const form = new FormData();
    const normalizedRules = this.normalizeAccessRules(body.accessScope, body.rules);

    form.append('file', body.file);
    form.append('title', body.title);

    if (body.description) form.append('description', body.description);
    if (body.folderId) form.append('folderId', body.folderId);
    if (body.categoryId) form.append('categoryId', body.categoryId);
    if (body.accessScope) {
      form.append('accessScope', this.normalizeAccessScope(body.accessScope));
    }
    if (normalizedRules.length) {
      form.append('rules', JSON.stringify(normalizedRules));
    }

    return this.post<DocumentResponse, FormData>(this.base, form);
  }

  update(id: string, body: UpdateDocumentBody): Promise<DocumentResponse> {
    const normalizedAccessScope = body.accessScope
      ? this.normalizeAccessScope(body.accessScope)
      : undefined;

    return this.patch<DocumentResponse, UpdateDocumentBody>(`${this.base}/${id}`, {
      ...body,
      accessScope: normalizedAccessScope,
    });
  }

  moveDocument(id: string, body: MoveDocumentBody): Promise<DocumentResponse> {
    return this.patch<DocumentResponse, MoveDocumentBody>(`${this.base}/${id}`, body);
  }

  remove(id: string): Promise<void> {
    return this.delete<void>(`${this.base}/${id}`);
  }

  restoreDocument(id: string): Promise<DocumentResponse> {
    return this.post<DocumentResponse, Record<string, never>>(
      `${this.base}/${id}/restore`,
      {},
    );
  }

  deletePermanent(id: string): Promise<void> {
    return this.delete<void>(`${this.base}/${id}/permanent`);
  }

  getVersions(id: string): Promise<DocumentVersionResponse[]> {
    return this.get<DocumentVersionResponse[]>(`${this.base}/${id}/versions`);
  }

  uploadVersion(id: string, body: UploadVersionBody): Promise<DocumentVersionResponse> {
    const form = new FormData();

    form.append('file', body.file);
    if (body.changeNotes) form.append('changeNotes', body.changeNotes);

    return this.post<DocumentVersionResponse, FormData>(
      `${this.base}/${id}/versions`,
      form,
    );
  }

  getChunks(id: string): Promise<DocumentChunkResponse[]> {
    return this.get<DocumentChunkResponse[]>(`${this.base}/${id}/chunks`);
  }

  createFolder(body: CreateFolderBody): Promise<FolderResponse> {
    return this.post<FolderResponse, CreateFolderBody>(this.folderBase, body);
  }

  updateFolder(id: string, body: UpdateFolderBody): Promise<FolderResponse> {
    return this.patch<FolderResponse, UpdateFolderBody>(`${this.folderBase}/${id}`, body);
  }

  moveFolder(id: string, body: MoveFolderBody): Promise<FolderResponse> {
    return this.patch<FolderResponse, MoveFolderBody>(
      `${this.folderBase}/${id}/move`,
      body,
    );
  }

  reorderFolders(body: ReorderFoldersBody): Promise<void> {
    return this.patch<void, ReorderFoldersBody>(`${this.folderBase}/reorder`, body);
  }

  deleteFolder(id: string): Promise<void> {
    return this.delete<void>(`${this.folderBase}/${id}`);
  }

  deleteFolderPermanent(id: string): Promise<void> {
    return this.delete<void>(`${this.folderBase}/${id}/permanent`);
  }

  restoreFolder(id: string): Promise<FolderResponse> {
    return this.post<FolderResponse, Record<string, never>>(
      `${this.folderBase}/${id}/restore`,
      {},
    );
  }

  listCategories(): Promise<CategoryResponse[]> {
    return this.get<CategoryResponse[]>(this.categoryBase);
  }

  createCategory(body: CreateCategoryBody): Promise<CategoryResponse> {
    return this.post<CategoryResponse, CreateCategoryBody>(this.categoryBase, body);
  }

  updateCategory(id: string, body: UpdateCategoryBody): Promise<CategoryResponse> {
    return this.put<CategoryResponse, UpdateCategoryBody>(
      `${this.categoryBase}/${id}`,
      body,
    );
  }

  deleteCategory(id: string): Promise<void> {
    return this.delete<void>(`${this.categoryBase}/${id}`);
  }

  getDocumentAccess(documentId: string): Promise<AccessRuleResponse[]> {
    return this.get<AccessRuleResponse[]>(`${this.accessBase}/documents/${documentId}`);
  }

  grantDocumentAccess(
    documentId: string,
    body: CreateAccessRuleBody,
  ): Promise<AccessRuleResponse[]> {
    return this.post<AccessRuleResponse[], CreateAccessRuleBody>(
      `${this.accessBase}/documents/${documentId}`,
      body,
    );
  }

  revokeDocumentAccess(
    documentId: string,
    accessType: string,
    accessId: string,
    permission?: string,
  ): Promise<void> {
    const qs = permission ? `?permission=${permission}` : '';
    return this.delete<void>(
      `${this.accessBase}/documents/${documentId}/${accessType}/${accessId}${qs}`,
    );
  }

  getFolderAccess(folderId: string): Promise<AccessRuleResponse[]> {
    return this.get<AccessRuleResponse[]>(`${this.accessBase}/folders/${folderId}`);
  }

  grantFolderAccess(
    folderId: string,
    body: CreateAccessRuleBody,
  ): Promise<AccessRuleResponse[]> {
    return this.post<AccessRuleResponse[], CreateAccessRuleBody>(
      `${this.accessBase}/folders/${folderId}`,
      body,
    );
  }

  revokeFolderAccess(
    folderId: string,
    accessType: string,
    accessId: string,
    permission?: string,
  ): Promise<void> {
    const qs = permission ? `?permission=${permission}` : '';
    return this.delete<void>(
      `${this.accessBase}/folders/${folderId}/${accessType}/${accessId}${qs}`,
    );
  }

  private buildQuery(
    params?:
      | DocumentListParams
      | Record<string, string | number | boolean | null | undefined>,
  ) {
    if (!params) return '';

    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
      if (value === undefined || value === null || value === '') continue;
      searchParams.set(key, String(value));
    }

    const query = searchParams.toString();
    return query.length > 0 ? `?${query}` : '';
  }

  private normalizeAccessScope(
    scope?: UploadDocumentBody['accessScope'],
  ): NonNullable<UploadDocumentBody['accessScope']> {
    return (scope ?? 'organization') as NonNullable<UploadDocumentBody['accessScope']>;
  }

  private normalizeAccessRules(
    scope: UploadDocumentBody['accessScope'],
    rules?: UploadDocumentBody['rules'],
  ) {
    if (!rules?.length) return [];

    switch (scope) {
      case 'private':
      case 'organization':
      case 'system':
        return [];
      case 'user':
        return rules.filter((rule) => rule.accessType === 'user');
      case 'role':
        return rules.filter((rule) => rule.accessType === 'role');
      case 'project':
        return rules.filter((rule) => rule.accessType === 'project');
      default:
        return rules;
    }
  }
}
