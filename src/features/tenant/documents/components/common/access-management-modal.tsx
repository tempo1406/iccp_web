'use client';

import { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Search, Shield, Trash2, UserRound, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/lib/toast';
import { useAppSelector } from '@/store/hooks';
import { usePermissionChecker } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { useOrganizationMembersQuery } from '@/features/tenant/organization-members/query/members.queries';
import { useOrganizationRolesQuery } from '@/features/tenant/organization-roles/query/organization-roles.queries';
import { useProjectList } from '@/features/tenant/projects/query/use-projects';
import { useProjectMembers } from '@/features/tenant/projects/query/use-project-members';
import { useProjectRoles } from '@/features/tenant/projects/query/use-project-roles';
import {
  useDocumentAccess,
  useDocumentById,
  useFolderAccess,
  useGrantDocumentAccess,
  useGrantFolderAccess,
  useRevokeDocumentAccess,
  useRevokeFolderAccess,
  useUpdateDocument,
} from '../../query/use-documents';
import type {
  AccessRuleItem,
  AccessRuleResponse,
  AccessScope,
  AccessType,
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

// ── Permission helpers ─────────────────────────────────────────────────────────

const PERMISSION_OPTIONS: {
  value: ResourcePermission;
  label: string;
  description: string;
}[] = [
  { value: 'view', label: 'View', description: 'Read-only access' },
  { value: 'download', label: 'Download', description: 'View and download files' },
  { value: 'upload', label: 'Upload', description: 'Upload new versions' },
  { value: 'edit', label: 'Edit', description: 'Edit metadata and content' },
  {
    value: 'manage',
    label: 'Manage',
    description: 'Full control including access rules',
  },
];

function getPermissionBadgeClass(permission: string): string {
  switch (permission) {
    case 'manage':
      return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800';
    case 'edit':
      return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800';
    case 'upload':
      return 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800';
    case 'download':
      return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

// ── Project-scoped normalizers ─────────────────────────────────────────────────

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

// ── Component interfaces ───────────────────────────────────────────────────────

interface AccessManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: 'document' | 'folder';
  targetId: string;
  targetName: string;
  /** When set, scope user/role options to this project (hides the 'project' access type). */
  projectId?: string;
}

interface AccessOption {
  id: string;
  label: string;
  description?: string;
}

type ScopedRule = AccessRuleItem | AccessRuleResponse;

// ── Normalizers ────────────────────────────────────────────────────────────────

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

function getAccessIconLg(accessType: AccessType) {
  switch (accessType) {
    case 'user':
      return <UserRound className="size-4" />;
    case 'role':
      return <Shield className="size-4" />;
    case 'project':
      return <BriefcaseBusiness className="size-4" />;
  }
}

function normalizeAccessScope(scope?: string | null): AccessScope {
  switch (scope) {
    case 'private':
    case 'organization':
    case 'project':
    case 'role':
    case 'user':
    case 'system':
      return scope;
    default:
      return 'organization';
  }
}

function getRulesForScope<T extends ScopedRule>(scope: AccessScope, rules: T[]) {
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

function getAccessScopeDescription(scope: AccessScope, projectId?: string) {
  switch (scope) {
    case 'private':
      return 'Only you can access this document until you share it later.';
    case 'organization':
      return 'Everyone in the organization can access this document.';
    case 'project':
      return projectId
        ? 'Members of the current project can access this document. No extra project rule is required.'
        : 'Grant access to one or more projects for this document.';
    case 'role':
      return 'Grant access to users through one or more roles.';
    case 'user':
      return projectId
        ? 'Grant access to specific members of the current project.'
        : 'Grant access to specific users.';
    case 'system':
      return 'This scope is managed by the system and cannot be edited here.';
    default:
      return '';
  }
}

function getAccessScopeLabel(scope: AccessScope, projectId?: string) {
  switch (scope) {
    case 'private':
      return 'Private (only me)';
    case 'organization':
      return 'Organization';
    case 'project':
      return projectId ? 'Current project' : 'Project';
    case 'role':
      return 'Role';
    case 'user':
      return projectId ? 'Project members' : 'Specific users';
    case 'system':
      return 'System';
    default:
      return scope;
  }
}

// ── SearchSection ──────────────────────────────────────────────────────────────

interface SearchSectionProps {
  title: string;
  icon: React.ReactNode;
  search: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  options: AccessOption[];
  isLoading: boolean;
  unavailableSubjectKeys: Set<string>;
  accessType: AccessType;
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
  unavailableSubjectKeys,
  accessType,
  onAdd,
}: SearchSectionProps) {
  const available = options.filter(
    (o) => !unavailableSubjectKeys.has(`${accessType}:${o.id}`),
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
          <div className="text-muted-foreground flex items-center justify-center py-4 text-xs">
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

// ── Main component ─────────────────────────────────────────────────────────────

export function AccessManagementModal({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetName,
  projectId,
}: AccessManagementModalProps) {
  const currentUserId = useAppSelector((state) => state.user.profile?.id);
  const [pendingRules, setPendingRules] = useState<AccessRuleItem[]>([]);
  const [pendingPermission, setPendingPermission] = useState<ResourcePermission>('view');
  const [userSearch, setUserSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedAccessType, setSelectedAccessType] = useState<AccessType | ''>('');
  const [documentScopeOverride, setDocumentScopeOverride] = useState<AccessScope | null>(
    null,
  );

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
  const canConfigureProjectRules = !projectId && canManageAccess && canViewProjects;
  const canConfigureProjectScope = canManageAccess && (projectId ? true : canViewProjects);
  const documentQuery = useDocumentById(targetType === 'document' ? targetId : '', {
    enabled: open && targetType === 'document',
  });
  const isDocumentTarget = targetType === 'document';
  const currentDocumentScope = normalizeAccessScope(documentQuery.data?.accessScope);
  const isSystemScopedDocument =
    isDocumentTarget && currentDocumentScope === 'system';
  const selectedDocumentScope =
    isDocumentTarget ? documentScopeOverride ?? currentDocumentScope : 'organization';
  const activeScope = isDocumentTarget ? selectedDocumentScope : undefined;
  const allowedAccessTypes = useMemo<AccessType[]>(() => {
    const byPermission: AccessType[] = [];

    if (canConfigureUserAccess) byPermission.push('user');
    if (canConfigureRoleAccess) byPermission.push('role');
    if (canConfigureProjectRules) byPermission.push('project');

    if (!activeScope) return byPermission;

    switch (activeScope) {
      case 'user':
        return byPermission.filter((type) => type === 'user');
      case 'role':
        return byPermission.filter((type) => type === 'role');
      case 'project':
        return byPermission.filter((type) => type === 'project');
      default:
        return [];
    }
  }, [
    activeScope,
    canConfigureProjectRules,
    canConfigureRoleAccess,
    canConfigureUserAccess,
  ]);
  const effectiveRuleType =
    isDocumentTarget && allowedAccessTypes.length === 1
      ? allowedAccessTypes[0]
      : selectedAccessType && allowedAccessTypes.includes(selectedAccessType)
        ? selectedAccessType
        : (allowedAccessTypes[0] ?? '');

  // ── Org-scoped data sources (used when projectId is not set) ─────────────────
  const orgMembersQuery = useOrganizationMembersQuery(
    { limit: 20, search: deferredUserSearch || undefined },
    {
      enabled:
        !projectId &&
        open &&
        canConfigureUserAccess &&
        effectiveRuleType === 'user',
    },
  );
  const orgRolesQuery = useOrganizationRolesQuery(
    { search: deferredRoleSearch || undefined },
    {
      enabled:
        !projectId &&
        open &&
        canConfigureRoleAccess &&
        effectiveRuleType === 'role',
    },
  );
  const projectsQuery = useProjectList(
    { page: 1, limit: 100 },
    !projectId &&
      open &&
      canConfigureProjectRules &&
      effectiveRuleType === 'project',
  );

  // ── Project-scoped data sources (used when projectId is set) ─────────────────
  const projectMembersQuery = useProjectMembers(
    projectId ?? '',
    {},
    Boolean(projectId) &&
      open &&
      canConfigureUserAccess &&
      effectiveRuleType === 'user',
  );
  const projectRolesQuery = useProjectRoles(
    projectId ?? '',
    Boolean(projectId) &&
      open &&
      canConfigureRoleAccess &&
      effectiveRuleType === 'role',
  );

  const documentAccessQuery = useDocumentAccess(
    targetType === 'document' ? targetId : '',
    { enabled: open && targetType === 'document' },
  );
  const folderAccessQuery = useFolderAccess(targetType === 'folder' ? targetId : '', {
    enabled: open && targetType === 'folder',
  });

  const grantDocumentAccess = useGrantDocumentAccess(
    targetType === 'document' ? targetId : '',
  );
  const grantFolderAccess = useGrantFolderAccess(targetType === 'folder' ? targetId : '');
  const revokeDocumentAccess = useRevokeDocumentAccess(
    targetType === 'document' ? targetId : '',
  );
  const revokeFolderAccess = useRevokeFolderAccess(
    targetType === 'folder' ? targetId : '',
  );
  const updateDocument = useUpdateDocument();

  const currentRules = useMemo(
    () =>
      targetType === 'document'
        ? (documentAccessQuery.data ?? [])
        : (folderAccessQuery.data ?? []),
    [documentAccessQuery.data, folderAccessQuery.data, targetType],
  );
  const isLoadingRules =
    targetType === 'document'
      ? documentAccessQuery.isPending
      : folderAccessQuery.isPending;

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

  const scopedCurrentRules = useMemo(
    () =>
      activeScope ? getRulesForScope(activeScope, currentRules) : currentRules,
    [activeScope, currentRules],
  );
  const scopedPendingRules = useMemo(
    () =>
      activeScope ? getRulesForScope(activeScope, pendingRules) : pendingRules,
    [activeScope, pendingRules],
  );
  const incompatibleCurrentRules = useMemo(
    () =>
      activeScope
        ? currentRules.filter(
            (rule) => !getRulesForScope(activeScope, [rule]).length,
          )
        : [],
    [activeScope, currentRules],
  );
  const unavailableSubjectKeys = useMemo(
    () =>
      new Set(
        [...scopedCurrentRules, ...scopedPendingRules].map(
          (rule) => `${rule.accessType}:${rule.accessId}`,
        ),
      ),
    [scopedCurrentRules, scopedPendingRules],
  );

  const activeAccessConfig = useMemo(() => {
    switch (effectiveRuleType) {
      case 'user':
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
    effectiveRuleType,
    userSearch,
  ]);

  function resolveRuleLabel(rule: AccessRuleResponse | AccessRuleItem) {
    const pool =
      rule.accessType === 'user'
        ? memberOptions
        : rule.accessType === 'role'
          ? roleOptions
          : allProjectOptions;
    return pool.find((option) => option.id === rule.accessId)?.label ?? rule.accessId;
  }

  function handleAddPending(accessType: AccessType, option: AccessOption) {
    const key = `${accessType}:${option.id}`;
    if (unavailableSubjectKeys.has(key)) return;
    setPendingRules((current) => [
      ...current,
      { accessType, accessId: option.id, permission: pendingPermission },
    ]);
  }

  function handleRemovePending(rule: AccessRuleItem) {
    setPendingRules((current) =>
      current.filter(
        (item) =>
          item.accessId !== rule.accessId ||
          item.accessType !== rule.accessType ||
          (item.permission ?? 'view') !== (rule.permission ?? 'view'),
      ),
    );
  }

  async function handleSavePendingRules() {
    const hasScopeChange =
      isDocumentTarget &&
      selectedDocumentScope !== currentDocumentScope &&
      !isSystemScopedDocument;
    const visibleExistingCount = scopedCurrentRules.length;
    const nextRuleCount = visibleExistingCount + scopedPendingRules.length;

    if (isDocumentTarget && !isSystemScopedDocument) {
      if (selectedDocumentScope === 'user' && nextRuleCount === 0) {
        toast.danger('Select at least one user, or choose Private if only you should access it.');
        return;
      }

      if (selectedDocumentScope === 'role' && nextRuleCount === 0) {
        toast.danger('Select at least one role for role-scoped access.');
        return;
      }

      if (selectedDocumentScope === 'project' && !projectId && nextRuleCount === 0) {
        toast.danger('Select at least one project for project-scoped access.');
        return;
      }
    }

    if (!hasScopeChange && incompatibleCurrentRules.length === 0 && scopedPendingRules.length === 0) {
      return;
    }

    if (isDocumentTarget && incompatibleCurrentRules.length > 0) {
      const revokeTargets = Array.from(
        new Map(
          incompatibleCurrentRules.map((rule) => [
            `${rule.accessType}:${rule.accessId}`,
            rule,
          ]),
        ).values(),
      );

      for (const rule of revokeTargets) {
        const revokeResult = await revokeDocumentAccess.mutateAsync({
          accessType: rule.accessType,
          accessId: rule.accessId,
          permission: undefined,
        });

        if (!revokeResult.ok) {
          toast.danger(revokeResult.error.message);
          return;
        }
      }
    }

    if (hasScopeChange) {
      const updateResult = await updateDocument.mutateAsync({
        id: targetId,
        accessScope: selectedDocumentScope === 'system' ? undefined : selectedDocumentScope,
      });

      if (!updateResult.ok) {
        toast.danger(updateResult.error.message);
        return;
      }
    }

    if (scopedPendingRules.length > 0) {
      const mutation = targetType === 'document' ? grantDocumentAccess : grantFolderAccess;
      const result = await mutation.mutateAsync({ rules: scopedPendingRules });

      if (!result.ok) {
        toast.danger(result.error.message);
        return;
      }
    }

    toast.success('Access updated.');
    setPendingRules([]);
  }

  async function handleRevokeRule(rule: AccessRuleResponse) {
    const mutation =
      targetType === 'document' ? revokeDocumentAccess : revokeFolderAccess;
    const result = await mutation.mutateAsync({
      accessType: rule.accessType,
      accessId: rule.accessId,
      permission: rule.permission,
    });

    if (!result.ok) {
      toast.danger(result.error.message);
      return;
    }

    toast.success('Access rule removed.');
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setPendingRules([]);
          setPendingPermission('view');
          setUserSearch('');
          setRoleSearch('');
          setProjectSearch('');
          setSelectedAccessType('');
          setDocumentScopeOverride(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="border-border/70 bg-background !flex max-h-[92vh] !w-[96vw] !max-w-[1120px] flex-col gap-0 overflow-hidden rounded-2xl border p-0 shadow-2xl sm:!max-w-[1120px] xl:!w-[1120px]">
        <DialogHeader className="border-border/70 bg-card shrink-0 border-b px-6 py-5">
          <DialogTitle className="text-foreground text-base">Access control</DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            <span className="text-foreground font-medium">{targetName}</span> — manage
            access for this {targetType}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          {/* Left — active rules */}
          <div className="border-border/70 flex min-h-0 min-w-0 flex-col overflow-y-auto border-b p-6 lg:border-r lg:border-b-0">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-foreground text-sm font-semibold">Active rules</p>
              <Badge
                variant="outline"
                className="border-border bg-muted/50 text-muted-foreground text-xs"
              >
                {scopedCurrentRules.length}
              </Badge>
            </div>

            <ScrollArea className="border-border/70 bg-muted/20 min-h-[320px] flex-1 rounded-lg border p-3">
              {isLoadingRules ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                </div>
              ) : scopedCurrentRules.length === 0 ? (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center">
                  <Shield className="text-muted-foreground/50 size-8" />
                  <p className="text-muted-foreground text-sm">No explicit rules</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scopedCurrentRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="border-border/70 bg-background flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="bg-primary/8 text-primary shrink-0 rounded-md p-1.5">
                          {getAccessIconLg(rule.accessType)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-foreground truncate text-sm font-medium">
                            {resolveRuleLabel(rule)}
                          </p>
                          <p className="text-muted-foreground text-xs capitalize">
                            {rule.accessType}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${getPermissionBadgeClass(rule.permission ?? 'view')}`}
                        >
                          {rule.permission ?? 'view'}
                        </span>
                        {canManageAccess ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                            onClick={() => void handleRevokeRule(rule)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right — add rules */}
          <div className="bg-muted/20 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto p-5">
            {canManageAccess ? (
              <div className="space-y-5">
                <div className="border-border/70 bg-background space-y-4 rounded-lg border p-4">
                  <p className="text-foreground text-sm font-semibold">
                    {isDocumentTarget ? 'Scope & rules' : 'Add rules'}
                  </p>

                  {isDocumentTarget ? (
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground text-xs font-medium">
                        Access scope
                      </label>
                      <Select
                        value={selectedDocumentScope}
                        onValueChange={(value) =>
                          setDocumentScopeOverride(value as AccessScope)
                        }
                        disabled={isSystemScopedDocument}
                      >
                        <SelectTrigger className="border-border bg-background text-foreground h-9 w-full text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">
                            {getAccessScopeLabel('private', projectId)}
                          </SelectItem>
                          <SelectItem value="organization">
                            {getAccessScopeLabel('organization', projectId)}
                          </SelectItem>
                          {canConfigureProjectScope || selectedDocumentScope === 'project' ? (
                            <SelectItem
                              value="project"
                              disabled={!canConfigureProjectScope}
                            >
                              {getAccessScopeLabel('project', projectId)}
                            </SelectItem>
                          ) : null}
                          {canConfigureRoleAccess || selectedDocumentScope === 'role' ? (
                            <SelectItem value="role" disabled={!canConfigureRoleAccess}>
                              {getAccessScopeLabel('role', projectId)}
                            </SelectItem>
                          ) : null}
                          {canConfigureUserAccess || selectedDocumentScope === 'user' ? (
                            <SelectItem value="user" disabled={!canConfigureUserAccess}>
                              {getAccessScopeLabel('user', projectId)}
                            </SelectItem>
                          ) : null}
                          {selectedDocumentScope === 'system' ? (
                            <SelectItem value="system" disabled>
                              {getAccessScopeLabel('system', projectId)}
                            </SelectItem>
                          ) : null}
                        </SelectContent>
                      </Select>
                      <p className="text-muted-foreground text-[11px]">
                        {getAccessScopeDescription(selectedDocumentScope, projectId)}
                      </p>
                    </div>
                  ) : null}

                  {isDocumentTarget && incompatibleCurrentRules.length > 0 ? (
                    <div className="border-border bg-muted/20 text-muted-foreground rounded-lg border px-3 py-2 text-xs">
                      {incompatibleCurrentRules.length} existing rule
                      {incompatibleCurrentRules.length > 1 ? 's are' : ' is'} outside the
                      selected scope and will be removed when you save.
                    </div>
                  ) : null}

                  {allowedAccessTypes.length > 0 && !isSystemScopedDocument ? (
                    <div className="space-y-3">
                      {/* Rule type */}
                      {!isDocumentTarget ? (
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground text-xs font-medium">
                            Rule type
                          </label>
                          <Select
                            value={effectiveRuleType || undefined}
                            onValueChange={(value) =>
                              setSelectedAccessType(value as AccessType)
                            }
                          >
                            <SelectTrigger className="border-border bg-background text-foreground h-9 w-full text-sm">
                              <SelectValue placeholder="Choose rule type" />
                            </SelectTrigger>
                            <SelectContent>
                              {canConfigureUserAccess ? (
                                <SelectItem value="user">
                                  {projectId ? 'Project members' : 'Users'}
                                </SelectItem>
                              ) : null}
                              {canConfigureRoleAccess ? (
                                <SelectItem value="role">
                                  {projectId ? 'Project roles' : 'Roles'}
                                </SelectItem>
                              ) : null}
                              {canConfigureProjectRules ? (
                                <SelectItem value="project">Projects</SelectItem>
                              ) : null}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : null}

                      {/* Permission level */}
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

                      {activeAccessConfig ? (
                        <SearchSection
                          title={activeAccessConfig.title}
                          icon={activeAccessConfig.icon}
                          search={activeAccessConfig.search}
                          onSearchChange={activeAccessConfig.onSearchChange}
                          placeholder={activeAccessConfig.placeholder}
                          options={activeAccessConfig.options}
                          isLoading={activeAccessConfig.isLoading}
                          unavailableSubjectKeys={unavailableSubjectKeys}
                          accessType={activeAccessConfig.accessType}
                          onAdd={(option) =>
                            handleAddPending(activeAccessConfig.accessType, option)
                          }
                        />
                      ) : isDocumentTarget &&
                        selectedDocumentScope === 'project' &&
                        Boolean(projectId) ? (
                        <div className="border-border bg-muted/20 text-muted-foreground rounded-lg border px-3 py-3 text-xs">
                          This document will follow the current project&apos;s access. You
                          don&apos;t need to add a separate project rule here.
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {!canConfigureUserAccess &&
                  !canConfigureRoleAccess &&
                  !canConfigureProjectRules &&
                  !isDocumentTarget ? (
                    <p className="text-muted-foreground text-xs">
                      You don&apos;t have permission to view members, roles, or projects.
                    </p>
                  ) : null}
                </div>

                {/* Pending chips */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-foreground text-sm font-semibold">Pending</p>
                    <Badge
                      variant="outline"
                      className="border-border bg-muted/50 text-muted-foreground text-xs"
                    >
                      {scopedPendingRules.length}
                    </Badge>
                  </div>

                  {scopedPendingRules.length === 0 ? (
                    <div className="border-border bg-muted/20 text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-xs">
                      Select a rule type, then tick an item to move it here
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {scopedPendingRules.map((rule) => (
                        <span
                          key={`${rule.accessType}:${rule.accessId}:${rule.permission ?? 'view'}`}
                          className="border-primary/20 bg-primary/8 text-primary inline-flex items-center gap-1 rounded-full border py-1 pr-1 pl-2 text-xs font-medium"
                        >
                          {getAccessIcon(rule.accessType)}
                          <span className="max-w-[100px] truncate">
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
                            onClick={() => handleRemovePending(rule)}
                          >
                            <X className="size-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center">
                <Shield className="text-muted-foreground/50 size-8" />
                <p className="text-muted-foreground text-sm">
                  You don&apos;t have permission to manage access.
                </p>
              </div>
            )}
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
          {canManageAccess ? (
            <Button
              size="sm"
              disabled={
                (isDocumentTarget && isLoadingRules) ||
                (!isDocumentTarget && pendingRules.length === 0) ||
                (isDocumentTarget &&
                  scopedPendingRules.length === 0 &&
                  incompatibleCurrentRules.length === 0 &&
                  selectedDocumentScope === currentDocumentScope)
              }
              onClick={() => void handleSavePendingRules()}
            >
              Save access
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
