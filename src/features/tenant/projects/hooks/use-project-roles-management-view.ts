'use client';

import { useMemo, useState } from 'react';
import { toast } from '@/lib/toast';
import type {
  ProjectAvailablePermissionResponse,
} from '../services/projects.service';
import {
  useAssignProjectRolePermissions,
  useCreateProjectRole,
  useDeleteProjectRole,
  useProjectRoleAvailablePermissions,
  useProjectRoleById,
  useProjectRoles,
  useRevokeProjectRolePermissions,
  useUpdateProjectRole,
} from '../query/use-projects';
import type { ConfirmAlertDialogOptions } from './use-confirm-alert-dialog';

export interface PermissionItemNode extends ProjectAvailablePermissionResponse {
  moduleLabel: string;
  parentKey: string;
  parentLabel: string;
  childLabel: string;
}

export interface PermissionGroupNode {
  key: string;
  label: string;
  permissions: PermissionItemNode[];
}

export interface PermissionModuleNode {
  key: string;
  label: string;
  groups: PermissionGroupNode[];
}

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

function toTitleCase(value: string): string {
  return value
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function buildPermissionNode(permission: ProjectAvailablePermissionResponse): PermissionItemNode {
  const segments = permission.code.split('.').filter(Boolean);
  const moduleKey = permission.module?.trim() || segments[0] || 'general';
  const moduleLabel = toTitleCase(moduleKey);

  let parentKey = 'general';
  let childSegments = segments;

  if (segments.length >= 3) {
    parentKey = segments[1];
    childSegments = segments.slice(2);
  } else if (segments.length === 2) {
    parentKey = 'general';
    childSegments = segments.slice(1);
  }

  return {
    ...permission,
    moduleLabel,
    parentKey,
    parentLabel: parentKey === 'general' ? 'General' : toTitleCase(parentKey),
    childLabel: toTitleCase(childSegments.join('.')) || toTitleCase(permission.code),
  };
}

function groupPermissionsByHierarchy(
  permissions: ProjectAvailablePermissionResponse[],
  keyword: string,
): PermissionModuleNode[] {
  const normalizedKeyword = normalizeValue(keyword);
  const nodes = permissions
    .map(buildPermissionNode)
    .filter((permission) => {
      if (!normalizedKeyword) return true;
      const haystack = [
        permission.code,
        permission.name,
        permission.module,
        permission.moduleLabel,
        permission.parentLabel,
        permission.childLabel,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedKeyword);
    });

  const moduleMap = new Map<string, Map<string, PermissionGroupNode>>();
  const moduleLabelByKey = new Map<string, string>();

  for (const node of nodes) {
    const moduleKey = normalizeValue(node.module || node.moduleLabel || 'general');
    moduleLabelByKey.set(moduleKey, node.moduleLabel);
    const groups = moduleMap.get(moduleKey) ?? new Map<string, PermissionGroupNode>();
    const group = groups.get(node.parentKey) ?? {
      key: node.parentKey,
      label: node.parentLabel,
      permissions: [],
    };
    group.permissions.push(node);
    groups.set(node.parentKey, group);
    moduleMap.set(moduleKey, groups);
  }

  return [...moduleMap.entries()]
    .map(([moduleKey, groups]) => ({
      key: moduleKey,
      label: moduleLabelByKey.get(moduleKey) ?? toTitleCase(moduleKey),
      groups: [...groups.values()]
        .map((group) => ({
          ...group,
          permissions: [...group.permissions].sort((a, b) =>
            a.childLabel.localeCompare(b.childLabel),
          ),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function getCheckedState(
  selectedCodes: string[],
  permissionCodes: string[],
): boolean | 'indeterminate' {
  if (permissionCodes.length === 0) return false;
  const selectedSet = new Set(selectedCodes.map(normalizeValue));
  const selectedCount = permissionCodes.filter((code) => selectedSet.has(normalizeValue(code))).length;

  if (selectedCount === 0) return false;
  if (selectedCount === permissionCodes.length) return true;
  return 'indeterminate';
}

function addPermissionCodes(previous: string[], permissionCodes: string[]): string[] {
  const codeMap = new Map(previous.map((code) => [normalizeValue(code), code]));
  for (const code of permissionCodes) {
    codeMap.set(normalizeValue(code), code);
  }
  return [...codeMap.values()];
}

function removePermissionCodes(previous: string[], permissionCodes: string[]): string[] {
  const blocked = new Set(permissionCodes.map(normalizeValue));
  return previous.filter((code) => !blocked.has(normalizeValue(code)));
}

type PermissionMutationAction = 'assign' | 'revoke' | 'save';

function isProjectOwnerRole(roleName?: string | null): boolean {
  const normalized = normalizeValue(roleName ?? '').replace(/[\s-]+/g, '_');
  return normalized === 'project_owner';
}

function toProjectRolePermissionErrorMessage(
  message: string | undefined,
  action: PermissionMutationAction,
  roleName?: string | null,
  fallback = 'Failed to update permissions.',
) {
  const normalizedMessage = normalizeValue(message ?? '');

  if (isProjectOwnerRole(roleName)) {
    return 'The Project Owner role is protected. Project managers cannot change its permissions.';
  }

  if (
    normalizedMessage.includes('permissions you do not have') ||
    normalizedMessage.includes('permission you do not have')
  ) {
    if (action === 'assign') {
      return 'You can only grant permissions that are already included in your own project role.';
    }

    if (action === 'revoke') {
      return 'You can only remove permissions that your project role is allowed to manage.';
    }

    return 'Some selected permissions are outside your project role. Please adjust the selection and try again.';
  }

  return message?.trim() || fallback;
}

interface UseProjectRolesManagementViewParams {
  projectId: string;
  confirmAction: (options: ConfirmAlertDialogOptions) => Promise<boolean>;
}

export function useProjectRolesManagementView({
  projectId,
  confirmAction,
}: UseProjectRolesManagementViewParams) {
  const [searchQuery, setSearchQuery] = useState('');
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createSelectedPermissionCodes, setCreateSelectedPermissionCodes] = useState<string[]>([]);
  const [createPermissionSearchQuery, setCreatePermissionSearchQuery] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isRoleMetadataDirty, setRoleMetadataDirty] = useState(false);
  const [selectedPermissionCodes, setSelectedPermissionCodes] = useState<string[]>([]);
  const [isRolePermissionsDirty, setRolePermissionsDirty] = useState(false);
  const [permissionSearchQuery, setPermissionSearchQuery] = useState('');

  const rolesQuery = useProjectRoles(projectId);
  const roleDetailQuery = useProjectRoleById(projectId, selectedRoleId ?? '');
  const availablePermissionsQuery = useProjectRoleAvailablePermissions(projectId);

  const createRoleMutation = useCreateProjectRole();
  const updateRoleMutation = useUpdateProjectRole();
  const deleteRoleMutation = useDeleteProjectRole();
  const assignPermissionsMutation = useAssignProjectRolePermissions();
  const revokePermissionsMutation = useRevokeProjectRolePermissions();

  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const selectedRole =
    roleDetailQuery.data ?? roles.find((role) => role.id === selectedRoleId) ?? null;
  const currentPermissions = useMemo(
    () =>
      [
        ...(selectedRole?.permissionCodes ?? []),
        ...(((selectedRole as { permissions?: string[] } | null)?.permissions) ?? []),
      ]
        .map((item) => item.trim())
        .filter(Boolean),
    [selectedRole],
  );
  const currentPermissionSet = useMemo(
    () => new Set(currentPermissions.map(normalizeValue)),
    [currentPermissions],
  );

  const effectiveEditName = isRoleMetadataDirty ? editName : (selectedRole?.name ?? '');
  const effectiveEditDescription = isRoleMetadataDirty
    ? editDescription
    : (selectedRole?.description ?? '');
  const effectiveSelectedPermissionCodes = isRolePermissionsDirty
    ? selectedPermissionCodes
    : currentPermissions;

  const filteredRoles = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return roles;
    return roles.filter((role) => {
      return (
        role.name.toLowerCase().includes(keyword) ||
        (role.description ?? '').toLowerCase().includes(keyword)
      );
    });
  }, [roles, searchQuery]);

  const createGroupedPermissions = useMemo(() => {
    const available = availablePermissionsQuery.data ?? [];
    return groupPermissionsByHierarchy(available, createPermissionSearchQuery);
  }, [availablePermissionsQuery.data, createPermissionSearchQuery]);

  const groupedPermissions = useMemo(() => {
    const available = availablePermissionsQuery.data ?? [];
    return groupPermissionsByHierarchy(available, permissionSearchQuery);
  }, [availablePermissionsQuery.data, permissionSearchQuery]);

  const isSaving =
    createRoleMutation.isPending ||
    updateRoleMutation.isPending ||
    deleteRoleMutation.isPending ||
    assignPermissionsMutation.isPending ||
    revokePermissionsMutation.isPending;

  const openRoleDetail = (roleId: string) => {
    setSelectedRoleId(roleId);
    setDetailOpen(true);
    setRoleMetadataDirty(false);
    setRolePermissionsDirty(false);
    setEditName('');
    setEditDescription('');
    setSelectedPermissionCodes([]);
    setPermissionSearchQuery('');
  };

  const closeRoleDetail = () => {
    setDetailOpen(false);
    setSelectedRoleId(null);
    setRoleMetadataDirty(false);
    setRolePermissionsDirty(false);
    setEditName('');
    setEditDescription('');
    setSelectedPermissionCodes([]);
    setPermissionSearchQuery('');
  };

  const onDetailOpenChange = (open: boolean) => {
    if (open) {
      setDetailOpen(true);
      return;
    }
    closeRoleDetail();
  };

  const setEditNameValue = (value: string) => {
    setRoleMetadataDirty(true);
    setEditName(value);
  };

  const setEditDescriptionValue = (value: string) => {
    setRoleMetadataDirty(true);
    setEditDescription(value);
  };

  const isCreatePermissionChecked = (permissionCode: string) =>
    createSelectedPermissionCodes.some(
      (item) => normalizeValue(item) === normalizeValue(permissionCode),
    );

  const getCreatePermissionGroupState = (permissionCodes: string[]) =>
    getCheckedState(createSelectedPermissionCodes, permissionCodes);

  const toggleCreatePermission = (permissionCode: string, checked: boolean) => {
    setCreateSelectedPermissionCodes((previous) =>
      checked
        ? addPermissionCodes(previous, [permissionCode])
        : removePermissionCodes(previous, [permissionCode]),
    );
  };

  const toggleCreatePermissionGroup = (permissionCodes: string[], checked: boolean) => {
    setCreateSelectedPermissionCodes((previous) =>
      checked
        ? addPermissionCodes(previous, permissionCodes)
        : removePermissionCodes(previous, permissionCodes),
    );
  };

  const isPermissionChecked = (permissionCode: string) =>
    effectiveSelectedPermissionCodes.some(
      (item) => normalizeValue(item) === normalizeValue(permissionCode),
    );

  const getPermissionGroupState = (permissionCodes: string[]) =>
    getCheckedState(effectiveSelectedPermissionCodes, permissionCodes);

  const togglePermission = (permissionCode: string, checked: boolean) => {
    setRolePermissionsDirty(true);
    setSelectedPermissionCodes((previous) => {
      const base = isRolePermissionsDirty ? previous : effectiveSelectedPermissionCodes;
      return checked
        ? addPermissionCodes(base, [permissionCode])
        : removePermissionCodes(base, [permissionCode]);
    });
  };

  const togglePermissionGroup = (permissionCodes: string[], checked: boolean) => {
    setRolePermissionsDirty(true);
    setSelectedPermissionCodes((previous) => {
      const base = isRolePermissionsDirty ? previous : effectiveSelectedPermissionCodes;
      return checked
        ? addPermissionCodes(base, permissionCodes)
        : removePermissionCodes(base, permissionCodes);
    });
  };

  const handleCreateRole = async () => {
    const name = createName.trim();
    if (!name) return;

    const permissionCodes = [...new Set(createSelectedPermissionCodes.map((item) => item.trim()))]
      .filter(Boolean);
    const result = await createRoleMutation.mutateAsync({
      projectId,
      body: {
        name,
        description: createDescription.trim() || undefined,
        permissionCodes: permissionCodes.length > 0 ? permissionCodes : undefined,
      },
    });
    if (!result.ok) {
      toast.danger(
        toProjectRolePermissionErrorMessage(
          result.error.message,
          'assign',
          name,
          'Failed to create role.',
        ),
      );
      return;
    }
    toast.success('Role created.');
    setCreateName('');
    setCreateDescription('');
    setCreateSelectedPermissionCodes([]);
    setCreatePermissionSearchQuery('');
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    const confirmed = await confirmAction({
      title: 'Delete role',
      description: `Delete role "${roleName}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    });
    if (!confirmed) return;
    const result = await deleteRoleMutation.mutateAsync({ projectId, roleId });
    if (!result.ok) {
      toast.danger(result.error.message || 'Failed to delete role.');
      return;
    }
    toast.success('Role deleted.');
    if (selectedRoleId === roleId) {
      closeRoleDetail();
    }
  };

  const handleSaveRoleMetadata = async () => {
    if (!selectedRoleId) return;
    const name = effectiveEditName.trim();
    if (!name) {
      toast.warning('Role name is required.');
      return;
    }

    const result = await updateRoleMutation.mutateAsync({
      projectId,
      roleId: selectedRoleId,
      body: {
        name,
        description: effectiveEditDescription.trim() || undefined,
      },
    });
    if (!result.ok) {
      toast.danger(
        toProjectRolePermissionErrorMessage(
          result.error.message,
          'save',
          selectedRole?.name,
          'Failed to update role.',
        ),
      );
      return;
    }
    toast.success('Role updated.');
    setRoleMetadataDirty(false);
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRoleId) return;

    const nextSet = new Set(effectiveSelectedPermissionCodes.map(normalizeValue));
    const toAssign = effectiveSelectedPermissionCodes.filter(
      (code) => !currentPermissionSet.has(normalizeValue(code)),
    );
    const toRevoke = currentPermissions.filter((code) => !nextSet.has(normalizeValue(code)));

    if (toAssign.length > 0) {
      const result = await assignPermissionsMutation.mutateAsync({
        projectId,
        body: {
          roleId: selectedRoleId,
          permissionCodes: toAssign,
        },
      });
      if (!result.ok) {
        toast.danger(
          toProjectRolePermissionErrorMessage(
            result.error.message,
            'assign',
            selectedRole?.name,
            'Failed to assign permissions.',
          ),
        );
        return;
      }
    }

    if (toRevoke.length > 0) {
      const result = await revokePermissionsMutation.mutateAsync({
        projectId,
        body: {
          roleId: selectedRoleId,
          permissionCodes: toRevoke,
        },
      });
      if (!result.ok) {
        toast.danger(
          toProjectRolePermissionErrorMessage(
            result.error.message,
            'revoke',
            selectedRole?.name,
            'Failed to revoke permissions.',
          ),
        );
        return;
      }
    }

    toast.success('Permissions updated.');
    setRolePermissionsDirty(false);
  };

  return {
    searchQuery,
    setSearchQuery,
    createName,
    setCreateName,
    createDescription,
    setCreateDescription,
    createSelectedPermissionCodes,
    createPermissionSearchQuery,
    setCreatePermissionSearchQuery,
    createGroupedPermissions,
    detailOpen,
    onDetailOpenChange,
    permissionSearchQuery,
    setPermissionSearchQuery,
    effectiveEditName,
    effectiveEditDescription,
    effectiveSelectedPermissionCodes,
    selectedRoleId,
    selectedRole,
    filteredRoles,
    groupedPermissions,
    isSaving,
    rolesQuery,
    roleDetailQuery,
    availablePermissionsQuery,
    openRoleDetail,
    closeRoleDetail,
    setEditNameValue,
    setEditDescriptionValue,
    isCreatePermissionChecked,
    getCreatePermissionGroupState,
    toggleCreatePermission,
    toggleCreatePermissionGroup,
    isPermissionChecked,
    getPermissionGroupState,
    togglePermission,
    togglePermissionGroup,
    handleCreateRole,
    handleDeleteRole,
    handleSaveRoleMetadata,
    handleSaveRolePermissions,
  };
}

