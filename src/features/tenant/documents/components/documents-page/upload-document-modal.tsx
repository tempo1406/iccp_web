'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BriefcaseBusiness,
  FileUp,
  ListFilter,
  Loader2,
  Paperclip,
  Search,
  Shield,
  UploadCloud,
  UserRound,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useAppSelector } from '@/store/hooks';
import { usePermissionChecker } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { useOrganizationMembersQuery } from '@/features/tenant/organization-members/query/members.queries';
import { useOrganizationRolesQuery } from '@/features/tenant/organization-roles/query/organization-roles.queries';
import { useProjectList } from '@/features/tenant/projects/query/use-projects';
import { useProjectMembers } from '@/features/tenant/projects/query/use-project-members';
import { useProjectRoles } from '@/features/tenant/projects/query/use-project-roles';
import { useUploadDocument } from '../../query/use-documents';
import { flattenFolderTree, formatDocumentSize } from '@/utils/document-utils';
import { appConfig, validateDocumentFile } from '@/common/constant/app';
import type {
  AccessRuleItem,
  AccessScope,
  AccessType,
  CategoryResponse,
  FolderTreeResponse,
  ResourcePermission,
} from '@/services/documents';
import type {
  ListMembersResponseData,
  OrganizationMemberApiDto,
} from '@/services/organizations/types/organization.types';
import type {
  ListOrganizationRolesResponseData,
  OrganizationRoleDto,
} from '@/services/organization-roles/types/organization-role.types';
import type { ProjectMemberResponse, ProjectRoleResponse } from '@/services/projects';

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryResponse[];
  folders: FolderTreeResponse[];
  defaultFolderId?: string | null;
  defaultCategoryId?: string | null;
  initialFiles?: File[];
  /** When set, scope user/role options to this project (hides the 'project' access type). */
  projectId?: string;
}

interface AccessOption {
  id: string;
  label: string;
  description?: string;
}

function getFileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function getDefaultTitle(file: File | null) {
  if (!file) return '';
  return file.name.replace(/\.[^.]+$/, '');
}

function normalizeMembers(raw: ListMembersResponseData | undefined): AccessOption[] {
  if (!raw) return [];
  let members: OrganizationMemberApiDto[] = [];
  if (Array.isArray(raw)) {
    members = raw;
  } else if ('items' in raw && Array.isArray(raw.items)) {
    members = raw.items;
  } else if ('data' in raw && Array.isArray(raw.data)) {
    members = raw.data;
  } else if (
    'data' in raw &&
    raw.data &&
    typeof raw.data === 'object' &&
    'data' in raw.data &&
    Array.isArray(raw.data.data)
  ) {
    members = raw.data.data;
  }
  return members.map((member) => {
    const userId = member.userId ?? member.user_id ?? member.id;
    const email = member.user?.email ?? member.user_email ?? member.email ?? userId;
    const firstName =
      member.user?.firstName ?? member.user_firstName ?? member.firstName ?? '';
    const lastName =
      member.user?.lastName ?? member.user_lastName ?? member.lastName ?? '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    return {
      id: userId,
      label: fullName.length > 0 ? fullName : email,
      description: email,
    };
  });
}

function normalizeRoles(
  raw: ListOrganizationRolesResponseData | undefined,
): AccessOption[] {
  if (!raw) return [];
  let roles: OrganizationRoleDto[] = [];
  if (Array.isArray(raw)) {
    roles = raw;
  } else if ('items' in raw && Array.isArray(raw.items)) {
    roles = raw.items;
  } else if ('data' in raw && Array.isArray(raw.data)) {
    roles = raw.data;
  }
  return roles.map((role) => ({
    id: role.id,
    label: role.name,
    description: role.description ?? undefined,
  }));
}

function normalizeProjects(
  raw: { id: string; name: string; description?: string | null }[] | undefined,
): AccessOption[] {
  if (!raw?.length) return [];
  return raw.map((project) => ({
    id: project.id,
    label: project.name,
    description: project.description ?? undefined,
  }));
}

function normalizeProjectMembers(
  raw: ProjectMemberResponse[] | undefined,
): AccessOption[] {
  if (!raw?.length) return [];
  return raw.map((member) => {
    const anyMember = member as unknown as Record<string, unknown>;
    const user = anyMember['user'] as Record<string, unknown> | undefined;
    const email = (user?.['email'] as string | undefined) ?? undefined;
    const firstName = (user?.['firstName'] as string | undefined) ?? '';
    const lastName = (user?.['lastName'] as string | undefined) ?? '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    return {
      id: member.userId,
      label: fullName || email || member.userId,
      description:
        email && (fullName || email !== member.userId)
          ? email
          : (member.roleName ?? undefined),
    };
  });
}

function normalizeProjectRoles(raw: ProjectRoleResponse[] | undefined): AccessOption[] {
  if (!raw?.length) return [];
  return raw.map((role) => ({
    id: role.id,
    label: role.name,
    description: role.description ?? undefined,
  }));
}

const PERMISSION_OPTIONS: {
  value: ResourcePermission;
  label: string;
  description: string;
}[] = [
  { value: 'view', label: 'View', description: 'Read-only access' },
  { value: 'download', label: 'Download', description: 'View and download files' },
  { value: 'upload', label: 'Upload', description: 'Upload new versions' },
  { value: 'edit', label: 'Edit', description: 'Edit metadata and content' },
  { value: 'manage', label: 'Manage', description: 'Full control' },
];

function getPermissionBadgeClass(permission: string): string {
  switch (permission) {
    case 'manage':
      return 'bg-red-50 text-red-600 border-red-200';
    case 'edit':
      return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'upload':
      return 'bg-purple-50 text-purple-600 border-purple-200';
    case 'download':
      return 'bg-blue-50 text-blue-600 border-blue-200';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

function getAccessIcon(accessType: AccessType) {
  switch (accessType) {
    case 'user':
      return <UserRound className="size-3.5" />;
    case 'role':
      return <Shield className="size-3.5" />;
    case 'project':
      return <BriefcaseBusiness className="size-3.5" />;
  }
}

function getRulesForScope(scope: AccessScope, rules: AccessRuleItem[]) {
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

function getBackendAccessScope(scope: AccessScope): AccessScope {
  return scope;
}

interface SearchSectionProps {
  title: string;
  icon: React.ReactNode;
  search: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  options: AccessOption[];
  isLoading: boolean;
  usedKeys: Set<string>;
  accessType: AccessType;
  selectedPermission: ResourcePermission;
  onAdd: (option: AccessOption) => void;
}

function SearchSection({
  title,
  icon,
  search,
  onSearchChange,
  placeholder,
  options,
  isLoading,
  usedKeys,
  accessType,
  selectedPermission,
  onAdd,
}: SearchSectionProps) {
  const available = options.filter(
    (o) => !usedKeys.has(`${accessType}:${o.id}:${selectedPermission}`),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">{icon}</span>
        <p className="text-foreground text-xs font-semibold">{title}</p>
      </div>
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border-border bg-background text-foreground placeholder:text-muted-foreground h-8 pl-7 text-xs"
          placeholder={placeholder}
        />
      </div>
      <div className="border-border/70 bg-background max-h-[220px] overflow-y-auto rounded-lg border">
        {isLoading ? (
          <div className="space-y-1 p-2">
            <Skeleton className="h-7 rounded" />
            <Skeleton className="h-7 rounded" />
          </div>
        ) : available.length === 0 ? (
          <div className="text-muted-foreground flex items-center justify-center py-3 text-xs">
            {search ? 'No results' : 'None available'}
          </div>
        ) : (
          <div className="p-1">
            {available.map((option) => (
              <button
                key={option.id}
                type="button"
                className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition"
                onClick={() => onAdd(option)}
              >
                <Checkbox
                  checked={false}
                  className="pointer-events-none mt-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-xs font-medium">
                    {option.label}
                  </p>
                  {option.description && option.description !== option.label ? (
                    <p className="text-muted-foreground truncate text-[10px]">
                      {option.description}
                    </p>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function UploadDocumentModal({
  open,
  onOpenChange,
  categories,
  folders,
  defaultFolderId,
  defaultCategoryId,
  initialFiles = [],
  projectId,
}: UploadDocumentModalProps) {
  const currentUserId = useAppSelector((state) => state.user.profile?.id);
  const uploadDocument = useUploadDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const defaultAccessScope: AccessScope = projectId ? 'project' : 'organization';
  const [isDragging, setIsDragging] = useState(false);
  const sanitizedInitialFiles = initialFiles.filter((file) => file.size > 0);
  const initialSelectedFile = sanitizedInitialFiles[0] ?? null;

  const [queuedFiles, setQueuedFiles] = useState<File[]>(sanitizedInitialFiles);
  const [selectedFileKey, setSelectedFileKey] = useState<string>(
    initialSelectedFile ? getFileKey(initialSelectedFile) : '',
  );
  const [title, setTitle] = useState(getDefaultTitle(initialSelectedFile));
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState<string>(defaultFolderId ?? '__root__');
  const [categoryId, setCategoryId] = useState<string>(defaultCategoryId ?? '__none__');
  const [accessScope, setAccessScope] = useState<AccessScope>(defaultAccessScope);

  // Access rules state
  const [pendingRules, setPendingRules] = useState<AccessRuleItem[]>([]);
  const [pendingPermission, setPendingPermission] = useState<ResourcePermission>('view');
  const [userSearch, setUserSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [deferredUserSearch, setDeferredUserSearch] = useState('');
  const [deferredRoleSearch, setDeferredRoleSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDeferredUserSearch(userSearch), 1000);
    return () => clearTimeout(t);
  }, [userSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDeferredRoleSearch(roleSearch), 1000);
    return () => clearTimeout(t);
  }, [roleSearch]);

  const hasPermission = usePermissionChecker();
  const canManageAccess =
    hasPermission(PERMISSIONS.DOCUMENTS_MANAGE_ACCESS) ||
    hasPermission(PERMISSIONS.DOCUMENTS_ACCESS_MANAGE);
  const canViewMembers = hasPermission(PERMISSIONS.TENANT_MEMBERS_LIST);
  const canViewRoles = hasPermission(PERMISSIONS.RBAC_ROLES_LIST);
  const canViewProjects = hasPermission(PERMISSIONS.PROJECTS_LIST);
  const canConfigureUserAccess = canManageAccess && (projectId ? true : canViewMembers);
  const canConfigureRoleAccess = canManageAccess && (projectId ? true : canViewRoles);
  const canConfigureProjectAccess = projectId ? true : canManageAccess && canViewProjects;

  // ── Org-scoped sources (no projectId) ────────────────────────────────────────
  const orgMembersQuery = useOrganizationMembersQuery(
    { limit: 20, search: deferredUserSearch || undefined },
    { enabled: !projectId && open && canManageAccess && canViewMembers },
  );
  const orgRolesQuery = useOrganizationRolesQuery(
    { search: deferredRoleSearch || undefined },
    { enabled: !projectId && open && canManageAccess && canViewRoles },
  );
  const projectsQuery = useProjectList(
    { page: 1, limit: 100 },
    !projectId && open && canManageAccess && canViewProjects,
  );

  // ── Project-scoped sources (projectId is set) ─────────────────────────────────
  const projectMembersQuery = useProjectMembers(
    projectId ?? '',
    {},
    Boolean(projectId) && open && canManageAccess,
  );
  const projectRolesQuery = useProjectRoles(
    projectId ?? '',
    Boolean(projectId) && open && canManageAccess,
  );

  const flatFolders = useMemo(() => flattenFolderTree(folders), [folders]);
  const projectFolderOptions = useMemo(
    () => flatFolders.filter((folder) => !folder.isSystem),
    [flatFolders],
  );
  const selectedFile = useMemo(
    () => queuedFiles.find((file) => getFileKey(file) === selectedFileKey) ?? null,
    [queuedFiles, selectedFileKey],
  );

  useEffect(() => {
    if (!open || !projectId || folderId !== '__root__') return;
    const firstFolder = projectFolderOptions[0];
    if (!firstFolder) return;
    const timer = window.setTimeout(() => setFolderId(firstFolder.id), 0);
    return () => window.clearTimeout(timer);
  }, [folderId, open, projectFolderOptions, projectId]);

  const memberOptions = useMemo(() => {
    if (projectId) {
      return normalizeProjectMembers(projectMembersQuery.data ?? undefined).filter(
        (member) => member.id !== currentUserId,
      );
    }
    return normalizeMembers(
      orgMembersQuery.data as ListMembersResponseData | undefined,
    ).filter((member) => member.id !== currentUserId);
  }, [currentUserId, orgMembersQuery.data, projectId, projectMembersQuery.data]);

  const roleOptions = useMemo(() => {
    if (projectId) {
      return normalizeProjectRoles(projectRolesQuery.data ?? undefined);
    }
    return normalizeRoles(
      orgRolesQuery.data as ListOrganizationRolesResponseData | undefined,
    );
  }, [orgRolesQuery.data, projectId, projectRolesQuery.data]);

  const allProjectOptions = useMemo(
    () => normalizeProjects(projectsQuery.data),
    [projectsQuery.data],
  );
  const projectOptions = useMemo(() => {
    if (!projectSearch) return allProjectOptions;
    const lower = projectSearch.toLowerCase();
    return allProjectOptions.filter((p) => p.label.toLowerCase().includes(lower));
  }, [allProjectOptions, projectSearch]);

  const scopedPendingRules = useMemo(
    () => getRulesForScope(accessScope, pendingRules),
    [accessScope, pendingRules],
  );

  const usedRuleKeys = useMemo(
    () =>
      new Set(
        scopedPendingRules.map(
          (rule) => `${rule.accessType}:${rule.accessId}:${rule.permission ?? 'view'}`,
        ),
      ),
    [scopedPendingRules],
  );

  const activeAccessConfig = useMemo(() => {
    switch (accessScope) {
      case 'user':
        if (!canConfigureUserAccess) return null;
        return {
          title: projectId ? 'Project members' : 'Users',
          icon: <UserRound className="size-3.5" />,
          search: userSearch,
          onSearchChange: setUserSearch,
          placeholder: 'Search by email or name...',
          options: memberOptions,
          isLoading:
            (projectId ? projectMembersQuery.isPending : orgMembersQuery.isPending) &&
            open,
          accessType: 'user' as const,
        };
      case 'role':
        if (!canConfigureRoleAccess) return null;
        return {
          title: projectId ? 'Project roles' : 'Roles',
          icon: <Shield className="size-3.5" />,
          search: roleSearch,
          onSearchChange: setRoleSearch,
          placeholder: 'Search by role name...',
          options: roleOptions,
          isLoading:
            (projectId ? projectRolesQuery.isPending : orgRolesQuery.isPending) && open,
          accessType: 'role' as const,
        };
      case 'project':
        if (!canConfigureProjectAccess || projectId) return null;
        return {
          title: 'Projects',
          icon: <BriefcaseBusiness className="size-3.5" />,
          search: projectSearch,
          onSearchChange: setProjectSearch,
          placeholder: 'Search by project name...',
          options: projectOptions,
          isLoading: projectsQuery.isPending && open,
          accessType: 'project' as const,
        };
      default:
        return null;
    }
  }, [
    accessScope,
    canConfigureProjectAccess,
    canConfigureRoleAccess,
    canConfigureUserAccess,
    memberOptions,
    orgMembersQuery.isPending,
    projectMembersQuery.isPending,
    open,
    projectId,
    projectOptions,
    projectSearch,
    projectsQuery.isPending,
    roleOptions,
    roleSearch,
    orgRolesQuery.isPending,
    projectRolesQuery.isPending,
    userSearch,
  ]);

  function resolveRuleLabel(rule: AccessRuleItem) {
    const pool =
      rule.accessType === 'user'
        ? memberOptions
        : rule.accessType === 'role'
          ? roleOptions
          : allProjectOptions;
    return pool.find((o) => o.id === rule.accessId)?.label ?? rule.accessId;
  }

  function handleAddPending(accessType: AccessType, option: AccessOption) {
    const key = `${accessType}:${option.id}:${pendingPermission}`;
    if (usedRuleKeys.has(key)) return;
    setPendingRules((current) => [
      ...current,
      { accessType, accessId: option.id, permission: pendingPermission },
    ]);
  }

  function applyFiles(nextFiles: File[]) {
    const accepted: File[] = [];
    const rejected: string[] = [];

    for (const file of nextFiles) {
      const err = validateDocumentFile(file);
      if (err) {
        rejected.push(`"${file.name}": ${err}`);
      } else {
        accepted.push(file);
      }
    }

    if (rejected.length > 0) {
      toast.danger(rejected.join('\n'));
    }

    if (accepted.length === 0) return;

    const nextSelectedFile = accepted[0];
    setQueuedFiles(accepted);
    setSelectedFileKey(getFileKey(nextSelectedFile));
    setTitle(getDefaultTitle(nextSelectedFile));
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(event.dataTransfer.files);
    if (droppedFiles.length > 0) applyFiles(droppedFiles);
  }

  function resetForm() {
    setQueuedFiles([]);
    setSelectedFileKey('');
    setTitle('');
    setDescription('');
    setFolderId('__root__');
    setCategoryId('__none__');
    setAccessScope(defaultAccessScope);
    setPendingRules([]);
    setPendingPermission('view');
    setUserSearch('');
    setRoleSearch('');
    setProjectSearch('');
  }

  function handleAccessScopeChange(value: AccessScope) {
    setAccessScope(value);
  }

  async function handleSubmit() {
    if (!selectedFile) {
      toast.danger('Select a file to upload.');
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.danger('Document title is required.');
      return;
    }

    if (projectId && folderId === '__root__') {
      toast.danger('Select a folder inside this project before uploading.');
      return;
    }

    if (accessScope === 'user' && scopedPendingRules.length === 0) {
      toast.danger('Select at least one user, or choose Private if only you should access it.');
      return;
    }

    if (accessScope === 'role' && scopedPendingRules.length === 0) {
      toast.danger('Select at least one role for role-scoped access.');
      return;
    }

    if (accessScope === 'project' && !projectId && scopedPendingRules.length === 0) {
      toast.danger('Select at least one project for project-scoped access.');
      return;
    }

    const currentFileKey = getFileKey(selectedFile);
    const result = await uploadDocument.mutateAsync({
      file: selectedFile,
      title: trimmedTitle,
      description: description.trim() || undefined,
      folderId: folderId === '__root__' ? undefined : folderId,
      categoryId: categoryId === '__none__' ? undefined : categoryId,
      accessScope: getBackendAccessScope(accessScope),
      rules: scopedPendingRules.length > 0 ? scopedPendingRules : undefined,
    });

    if (!result.ok) {
      toast.danger(result.error.message);
      return;
    }

    const remainingFiles = queuedFiles.filter(
      (file) => getFileKey(file) !== currentFileKey,
    );
    if (remainingFiles.length > 0) {
      const nextFile = remainingFiles[0];
      setQueuedFiles(remainingFiles);
      setSelectedFileKey(getFileKey(nextFile));
      setTitle(getDefaultTitle(nextFile));
      setPendingRules([]);
      toast.success(
        `Uploaded ${selectedFile.name}. ${remainingFiles.length} file(s) remain.`,
      );
      return;
    }

    toast.success('Document uploaded.');
    resetForm();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm();
        onOpenChange(next);
      }}
    >
      <DialogContent className="border-border/70 bg-background !flex max-h-[92vh] !w-[96vw] !max-w-[1180px] flex-col gap-0 overflow-hidden rounded-2xl border p-0 shadow-2xl sm:!max-w-[1180px] xl:!w-[1180px]">
        <DialogHeader className="border-border/70 bg-card shrink-0 border-b px-6 py-5">
          <DialogTitle className="text-foreground text-base">Upload document</DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Select files and set metadata before uploading.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
          {/* Left — file drop zone */}
          <div className="border-border/70 min-h-0 min-w-0 overflow-y-auto border-b p-6 lg:border-r lg:border-b-0">
            <div
              className={cn(
                'bg-primary/5 rounded-lg border border-dashed transition',
                isDragging ? 'border-primary/60 bg-primary/10' : 'border-primary/25',
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={appConfig.upload.acceptAttr}
                className="hidden"
                onChange={(event) => applyFiles(Array.from(event.target.files ?? []))}
              />
              <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="bg-primary/10 text-primary inline-flex rounded-xl p-3">
                  <FileUp className="size-5" />
                </div>
                <div className="max-w-[18rem]">
                  <p className="text-foreground text-sm font-semibold break-words">
                    {selectedFile ? selectedFile.name : 'Choose files'}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {appConfig.upload.acceptLabel} · up to {appConfig.upload.maxFileSizeMb} MB
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="size-3.5" />
                  Browse files
                </Button>
              </div>

              {selectedFile ? (
                <div className="border-primary/10 border-t px-4 py-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge
                      variant="outline"
                      className="border-border bg-background text-foreground text-xs"
                    >
                      <Paperclip className="mr-1 size-3" />
                      {formatDocumentSize(selectedFile.size)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-border bg-background text-muted-foreground text-xs"
                    >
                      {queuedFiles.length > 1
                        ? `${queuedFiles.length} selected`
                        : 'Single file'}
                    </Badge>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right — metadata + access rules */}
          <div className="bg-muted/20 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto p-6 lg:p-7">
            <div className="space-y-5">
              {/* Metadata section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-foreground text-xs font-semibold">Metadata</p>
                  <ListFilter className="text-muted-foreground size-3.5" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground text-xs font-medium">
                    Title <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="border-border bg-background text-foreground h-9 text-sm"
                    placeholder="Document title"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground text-xs font-medium">
                    Description
                  </label>
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="border-border bg-background text-foreground min-h-[80px] resize-none text-sm"
                    placeholder="Optional description"
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-muted-foreground text-xs font-medium">
                      Folder
                    </label>
                    <Select value={folderId} onValueChange={setFolderId}>
                      <SelectTrigger className="border-border bg-background text-foreground h-10 w-full text-sm">
                        <SelectValue placeholder="Root library" />
                      </SelectTrigger>
                      <SelectContent>
                        {!projectId ? (
                          <SelectItem value="__root__">Root library</SelectItem>
                        ) : null}
                        {projectFolderOptions.map((folder) => (
                            <SelectItem key={folder.id} value={folder.id}>
                              {`${'· '.repeat(folder.depth)}${folder.name}`}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-muted-foreground text-xs font-medium">
                      Category
                    </label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger className="border-border bg-background text-foreground h-10 w-full text-sm">
                        <SelectValue placeholder="Uncategorized" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Uncategorized</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground text-xs font-medium">
                    Access scope
                  </label>
                  <Select
                    value={accessScope}
                    onValueChange={(value) =>
                      handleAccessScopeChange(value as AccessScope)
                    }
                  >
                    <SelectTrigger className="border-border bg-background text-foreground h-10 w-full text-sm">
                      <SelectValue placeholder="Organization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private (only me)</SelectItem>
                      <SelectItem value="organization">Organization</SelectItem>
                      {canConfigureProjectAccess ? (
                        <SelectItem value="project">
                          {projectId ? 'Current project' : 'Project'}
                        </SelectItem>
                      ) : null}
                      {canConfigureRoleAccess ? <SelectItem value="role">Role</SelectItem> : null}
                      {canConfigureUserAccess ? (
                        <SelectItem value="user">Specific users</SelectItem>
                      ) : null}
                    </SelectContent>
                  </Select>
                  {accessScope === 'private' ? (
                    <p className="text-muted-foreground text-[11px]">
                      Only you can view and query this document in chat until you share it later.
                    </p>
                  ) : null}
                  {accessScope === 'project' && projectId ? (
                    <p className="text-muted-foreground text-[11px]">
                      This document will be visible to members of the current project.
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Access rules section */}
              {canManageAccess && activeAccessConfig ? (
                <div className="border-border/70 bg-background space-y-4 rounded-lg border p-4">
                  <p className="text-foreground text-xs font-semibold">
                    Access rules{' '}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </p>

                  {/* Permission level selector */}
                  <div className="space-y-1.5">
                    <label className="text-muted-foreground text-xs font-medium">
                      Permission
                    </label>
                    <Select
                      value={pendingPermission}
                      onValueChange={(value) =>
                        setPendingPermission(value as ResourcePermission)
                      }
                    >
                      <SelectTrigger className="border-border bg-background text-foreground h-9 w-full text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERMISSION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{opt.label}</span>
                              <span className="text-muted-foreground text-[10px]">
                                {opt.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <SearchSection
                    title={activeAccessConfig.title}
                    icon={activeAccessConfig.icon}
                    search={activeAccessConfig.search}
                    onSearchChange={activeAccessConfig.onSearchChange}
                    placeholder={activeAccessConfig.placeholder}
                    options={activeAccessConfig.options}
                    isLoading={activeAccessConfig.isLoading}
                    usedKeys={usedRuleKeys}
                    accessType={activeAccessConfig.accessType}
                    selectedPermission={pendingPermission}
                    onAdd={(option) =>
                      handleAddPending(activeAccessConfig.accessType, option)
                    }
                  />

                  <div>
                    <p className="text-muted-foreground mb-2 text-xs font-medium">
                      Pending ({scopedPendingRules.length})
                    </p>
                    {scopedPendingRules.length === 0 ? (
                      <div className="border-border bg-muted/20 text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-xs">
                        Tick items above to queue them here
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {scopedPendingRules.map((rule) => (
                          <span
                            key={`${rule.accessType}:${rule.accessId}:${rule.permission ?? 'view'}`}
                            className="border-primary/20 bg-primary/8 text-primary inline-flex items-center gap-1 rounded-full border py-1 pr-1 pl-2 text-xs font-medium"
                          >
                            {getAccessIcon(rule.accessType)}
                            <span className="max-w-[90px] truncate">
                              {resolveRuleLabel(rule)}
                            </span>
                            <span
                              className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold capitalize ${getPermissionBadgeClass(rule.permission ?? 'view')}`}
                            >
                              {rule.permission ?? 'view'}
                            </span>
                            <button
                              type="button"
                              className="text-primary/60 hover:bg-primary/20 hover:text-primary ml-0.5 flex size-4 shrink-0 items-center justify-center rounded-full transition"
                              onClick={() =>
                                setPendingRules((current) =>
                                  current.filter(
                                    (item) =>
                                      item.accessId !== rule.accessId ||
                                      item.accessType !== rule.accessType ||
                                      (item.permission ?? 'view') !==
                                        (rule.permission ?? 'view'),
                                  ),
                                )
                              }
                            >
                              <X className="size-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <DialogFooter className="border-border/70 bg-muted/20 shrink-0 border-t px-6 py-4">
          <Button
            size="sm"
            variant="outline"
            className="border-border bg-background text-foreground hover:bg-muted"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={uploadDocument.isPending || !selectedFile}
            onClick={() => void handleSubmit()}
          >
            {uploadDocument.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {uploadDocument.isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
