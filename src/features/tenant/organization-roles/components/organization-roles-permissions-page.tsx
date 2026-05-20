'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROUTES } from '@/common/constant/routes';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { useOrganizationMembersData } from '@/features/tenant/organization-members/hooks/use-organization-members';
import { useTenant } from '@/providers';
import type { OrganizationRoleDto } from '@/services/organization-roles';
import { useAppSelector } from '@/store';
import {
  Eye,
  Loader2,
  Pencil,
  Plus,
  ShieldAlert,
  ShieldCheck,
  ShieldPlus,
  Trash2,
  UserCog,
} from 'lucide-react';
import { useProjectList } from '@/features/tenant/projects/query/use-project-core';
import {
  isProtectedRole,
  useOrganizationMemberRoles,
  useOrganizationRoleActions,
  useOrganizationRoleDetails,
  useOrganizationRolesData,
} from '../hooks/use-organization-roles';
import { RoleAssignmentMultiSelect } from './role-assignment-multi-select';
import { RoleEditDialog } from './role-edit-dialog';
import { formatDateTime } from './role-permissions-utils';
import { RoleStatsGrid } from './role-stats-grid';
import { RoleTypeBadge } from './role-type-badge';
import { RoleViewDialog } from './role-view-dialog';

export function OrganizationRolesPermissionsPage() {
  const { tenantSlug } = useTenant();

  const canListRoles = useCan(PERMISSIONS.RBAC_ROLES_LIST);
  const canViewRole = useCan(PERMISSIONS.RBAC_ROLES_VIEW);
  const canCreateRole = useCan(PERMISSIONS.RBAC_ROLES_CREATE);
  const canUpdateRole = useCan(PERMISSIONS.RBAC_ROLES_UPDATE);
  const canDeleteRole = useCan(PERMISSIONS.RBAC_ROLES_DELETE);
  const canAssignPermissions = useCan(PERMISSIONS.RBAC_ROLES_ASSIGN_PERMISSIONS);
  const canRevokePermissions = useCan(PERMISSIONS.RBAC_ROLES_REVOKE_PERMISSIONS);
  const canViewMemberRoles = useCan(PERMISSIONS.RBAC_USER_ROLES_VIEW);
  const canAssignMemberRole = useCan(PERMISSIONS.RBAC_USER_ROLES_ASSIGN);
  const canRevokeMemberRole = useCan(PERMISSIONS.RBAC_USER_ROLES_REVOKE);

  const { roles, isPending, isError, error } = useOrganizationRolesData();
  const { members } = useOrganizationMembersData();
  const projectListQuery = useProjectList({}, canViewMemberRoles);
  const projectNameMap = useMemo(() => {
    const projects = Array.isArray(projectListQuery.data) ? projectListQuery.data : [];
    const map = new Map<string, string>();
    for (const p of projects) {
      if (p.id) map.set(p.id, p.name);
    }
    return map;
  }, [projectListQuery.data]);
  const {
    createRole,
    updateRole,
    deleteRole,
    updateRolePermissions,
    assignMemberRole,
    revokeMemberRole,
    isSaving,
  } = useOrganizationRoleActions();
  const rbacPermissions = useAppSelector((state) => state.user.rbacPermissions);

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [viewRoleOpen, setViewRoleOpen] = useState(false);
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [memberRoleDrafts, setMemberRoleDrafts] = useState<Record<string, string[]>>({});
  const [deleteRoleTarget, setDeleteRoleTarget] = useState<OrganizationRoleDto | null>(
    null,
  );

  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  const selectedRoleFromList = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const isSelectedRoleProtected = selectedRoleFromList
    ? isProtectedRole(selectedRoleFromList)
    : false;
  const canLoadRoleDetail =
    (canViewRole || canUpdateRole) &&
    Boolean(selectedRoleId) &&
    !isSelectedRoleProtected &&
    (viewRoleOpen || editRoleOpen);

  const {
    role: selectedRoleFromApi,
    isPending: isRoleDetailsPending,
    isError: isRoleDetailsError,
    error: roleDetailsError,
  } = useOrganizationRoleDetails(selectedRoleId, canLoadRoleDetail);

  const selectedRole = selectedRoleFromApi ?? selectedRoleFromList;
  const selectedRolePermissions =
    selectedRole?.permissions ?? selectedRole?.permissionCodes ?? [];

  const resolvedSelectedMemberId = useMemo(() => {
    if (
      selectedMemberId &&
      members.some((member) => member.userId === selectedMemberId)
    ) {
      return selectedMemberId;
    }
    return members[0]?.userId ?? '';
  }, [members, selectedMemberId]);

  const canLoadMemberRoles = canViewMemberRoles && resolvedSelectedMemberId.length > 0;
  const {
    memberRoles,
    isPending: isMemberRolesPending,
    isError: isMemberRolesError,
    error: memberRolesError,
  } = useOrganizationMemberRoles(resolvedSelectedMemberId || null, canLoadMemberRoles);

  const assignableRoles = useMemo(
    () => roles.filter((role) => !isProtectedRole(role)),
    [roles],
  );
  const assignableRoleIdSet = useMemo(
    () => new Set(assignableRoles.map((role) => role.id)),
    [assignableRoles],
  );
  const roleStats = useMemo(() => {
    const protectedCount = roles.filter((r) => isProtectedRole(r)).length;
    return {
      total: roles.length,
      custom: roles.length - protectedCount,
      protected: protectedCount,
    };
  }, [roles]);

  const handleCreateRole = async () => {
    const roleName = newRoleName.trim();
    const roleDescription = newRoleDescription.trim();

    if (!roleName) return;

    const result = await createRole({
      name: roleName,
      description: roleDescription || undefined,
    });

    if (result.ok) {
      setNewRoleName('');
      setNewRoleDescription('');
    }
  };

  const handleUpdateRole = async (name: string, description: string) => {
    if (!selectedRole || !name) return;

    await updateRole({
      roleId: selectedRole.id,
      name,
      description: description || undefined,
    });
  };

  const handleDeleteRole = async () => {
    if (!deleteRoleTarget) return;
    await deleteRole(deleteRoleTarget.id);
    setDeleteRoleTarget(null);
  };

  const handleUpdateRolePermissions = async (codes: string[]) => {
    if (!selectedRole) return;
    await updateRolePermissions(selectedRole.id, codes);
  };

  const existingRoleIds = useMemo(
    () => memberRoles.map((mr) => mr.roleId),
    [memberRoles],
  );
  const selectedAssignRoleIds = resolvedSelectedMemberId
    ? (memberRoleDrafts[resolvedSelectedMemberId] ?? existingRoleIds)
    : existingRoleIds;
  const resolvedSelectedAssignRoleIds = useMemo(
    () => selectedAssignRoleIds.filter((roleId) => assignableRoleIdSet.has(roleId)),
    [selectedAssignRoleIds, assignableRoleIdSet],
  );

  const hasChanges = useMemo(() => {
    if (!memberRoles) return false;
    const existing = new Set(existingRoleIds);
    const selected = new Set(resolvedSelectedAssignRoleIds);
    if (existing.size !== selected.size) return true;
    for (const id of selected) {
      if (!existing.has(id)) return true;
    }
    return false;
  }, [existingRoleIds, resolvedSelectedAssignRoleIds, memberRoles]);

  const handleAssignMemberRole = async () => {
    if (!resolvedSelectedMemberId) return;

    const rolesToAssign = resolvedSelectedAssignRoleIds.filter(
      (id) => !existingRoleIds.includes(id),
    );
    const rolesToRevoke = existingRoleIds.filter(
      (id) => !resolvedSelectedAssignRoleIds.includes(id),
    );

    if (rolesToAssign.length === 0 && rolesToRevoke.length === 0) return;

    let allSucceeded = true;

    for (const roleId of rolesToAssign) {
      const result = await assignMemberRole(resolvedSelectedMemberId, roleId);
      allSucceeded = allSucceeded && result.ok;
    }

    for (const roleId of rolesToRevoke) {
      // Allow revocation if the role is assignable (not protected)
      if (assignableRoleIdSet.has(roleId)) {
        const result = await revokeMemberRole(resolvedSelectedMemberId, roleId);
        allSucceeded = allSucceeded && result.ok;
      }
    }

    if (allSucceeded) {
      setMemberRoleDrafts((previous) => {
        if (!previous[resolvedSelectedMemberId]) return previous;
        const next = { ...previous };
        delete next[resolvedSelectedMemberId];
        return next;
      });
    }
  };

  const handleRevokeMemberRole = async (roleId: string) => {
    if (!resolvedSelectedMemberId) return;
    const result = await revokeMemberRole(resolvedSelectedMemberId, roleId);
    if (!result.ok) return;

    setMemberRoleDrafts((previous) => {
      const currentDraft = previous[resolvedSelectedMemberId];
      if (!currentDraft) return previous;

      const nextRoleIds = currentDraft.filter((draftRoleId) => draftRoleId !== roleId);
      const next = { ...previous };

      if (nextRoleIds.length > 0) {
        next[resolvedSelectedMemberId] = nextRoleIds;
      } else {
        delete next[resolvedSelectedMemberId];
      }

      return next;
    });
  };

  const openRoleView = (role: OrganizationRoleDto) => {
    setSelectedRoleId(role.id);
    setViewRoleOpen(true);
    setEditRoleOpen(false);
  };

  const openRoleEdit = (role: OrganizationRoleDto) => {
    setSelectedRoleId(role.id);
    setEditRoleOpen(true);
    setViewRoleOpen(false);
  };

  if (!canListRoles) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Roles & Permissions"
          description="Manage organization roles, permissions, and member role assignments."
          breadcrumbs={[
            { label: 'Dashboard', href: ROUTES.tenant.dashboard(tenantSlug) },
            { label: 'Organization Management' },
            { label: 'Roles & Permissions' },
          ]}
        />
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>You do not have permission to access this page.</AlertTitle>
          <AlertDescription>
            Required permission: <code>{PERMISSIONS.RBAC_ROLES_LIST}</code>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Create custom roles, manage role permissions, and assign roles to organization members."
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.tenant.dashboard(tenantSlug) },
          { label: 'Organization Management' },
          { label: 'Roles & Permissions' },
        ]}
      />

      <RoleStatsGrid isPending={isPending} stats={roleStats} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="text-primary h-5 w-5" />
            Role Registry
          </CardTitle>
          <CardDescription>
            Create custom roles and manage existing ones. Click a role to view details and
            permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Plus className="h-4 w-4" />
              Create New Role
            </h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="new-role-name">Role Name</Label>
                <Input
                  id="new-role-name"
                  placeholder="e.g. project_manager"
                  value={newRoleName}
                  onChange={(event) => setNewRoleName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleCreateRole();
                    }
                  }}
                  disabled={!canCreateRole || isSaving}
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="new-role-desc">Description</Label>
                <Input
                  id="new-role-desc"
                  placeholder="Brief description of the role"
                  value={newRoleDescription}
                  onChange={(event) => setNewRoleDescription(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleCreateRole();
                    }
                  }}
                  disabled={!canCreateRole || isSaving}
                />
              </div>
              <Button
                type="button"
                onClick={() => void handleCreateRole()}
                disabled={!canCreateRole || isSaving || newRoleName.trim().length === 0}
                className="shrink-0"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create Role
              </Button>
            </div>
          </div>

          {isPending ? (
            <div className="space-y-3">
              {['a', 'b', 'c', 'd', 'e'].map((key) => (
                <Skeleton key={key} className="h-14 w-full rounded-md" />
              ))}
            </div>
          ) : null}

          {!isPending && isError && (
            <Alert variant="destructive">
              <AlertTitle>Failed to load roles</AlertTitle>
              <AlertDescription>{error?.message ?? 'Unknown error.'}</AlertDescription>
            </Alert>
          )}

          {!isPending && !isError && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-30 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground py-10 text-center"
                    >
                      No roles found. Create your first role above.
                    </TableCell>
                  </TableRow>
                )}

                {roles.map((role) => {
                  const roleProtected = isProtectedRole(role);
                  const canMutateRole =
                    canUpdateRole || canAssignPermissions || canRevokePermissions;

                  return (
                    <TableRow
                      key={role.id}
                      className="hover:bg-muted/40 cursor-pointer"
                      onClick={() => openRoleView(role)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{role.name}</p>
                          {role.description && (
                            <p className="text-muted-foreground mt-0.5 max-w-75 truncate text-xs">
                              {role.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <RoleTypeBadge role={role} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(role.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(role.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(event) => {
                              event.stopPropagation();
                              openRoleView(role);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={!canMutateRole || roleProtected || isSaving}
                            onClick={(event) => {
                              event.stopPropagation();
                              openRoleEdit(role);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={!canDeleteRole || roleProtected || isSaving}
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteRoleTarget(role);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="text-primary h-5 w-5" />
            Member Role Assignment
          </CardTitle>
          <CardDescription>
            Assign or revoke roles for organization members. Protected roles are not
            assignable from this UI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex min-w-0 flex-1 flex-col justify-end space-y-1.5">
                <Label>Member</Label>
                <div className="relative h-9 w-full">
                  <Combobox
                    items={members}
                    value={members.find((m) => m.userId === selectedMemberId) || null}
                    onValueChange={(val: any) => setSelectedMemberId(val?.userId || '')}
                    itemToStringLabel={(item: any) => {
                      if (!item) return '';
                      const fullName = [item.firstName, item.lastName]
                        .filter(Boolean)
                        .join(' ');
                      return fullName ? `${fullName} (${item.email})` : item.email;
                    }}
                  >
                    <ComboboxInput
                      placeholder="Select member..."
                      showClear
                      className="h-full w-full"
                    />
                    <ComboboxContent align="start">
                      <ComboboxEmpty>No members found.</ComboboxEmpty>
                      <ComboboxList>
                        {(item: any) => {
                          const fullName = [item.firstName, item.lastName]
                            .filter(Boolean)
                            .join(' ');
                          const display = fullName
                            ? `${fullName} (${item.email})`
                            : item.email;
                          return (
                            <ComboboxItem key={item.userId} value={item}>
                              <span className="truncate">{display}</span>
                            </ComboboxItem>
                          );
                        }}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-end space-y-1.5">
                <Label>Roles</Label>
                <div className="relative h-9 w-full">
                  <RoleAssignmentMultiSelect
                    roles={assignableRoles}
                    selectedRoleIds={resolvedSelectedAssignRoleIds}
                    disabled={!canAssignMemberRole || isSaving}
                    onChange={(roleIds) => {
                      if (!resolvedSelectedMemberId) return;
                      setMemberRoleDrafts((previous) => ({
                        ...previous,
                        [resolvedSelectedMemberId]: roleIds,
                      }));
                    }}
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={() => void handleAssignMemberRole()}
                disabled={
                  !canAssignMemberRole ||
                  isSaving ||
                  resolvedSelectedMemberId.length === 0 ||
                  !hasChanges
                }
                className="h-9 shrink-0"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldPlus className="mr-2 h-4 w-4" />
                )}
                Assign Roles
              </Button>
            </div>
          </div>

          {canViewMemberRoles && isMemberRolesPending && (
            <div className="space-y-3">
              {['role-a', 'role-b', 'role-c'].map((key) => (
                <Skeleton key={key} className="h-12 w-full rounded-md" />
              ))}
            </div>
          )}

          {canViewMemberRoles && isMemberRolesError && (
            <Alert variant="destructive">
              <AlertTitle>Failed to load member roles</AlertTitle>
              <AlertDescription>
                {memberRolesError?.message ?? 'Unknown error.'}
              </AlertDescription>
            </Alert>
          )}

          {!canViewMemberRoles && (
            <Alert>
              <AlertTitle>Member role view is restricted</AlertTitle>
              <AlertDescription>
                Required permission: <code>{PERMISSIONS.RBAC_USER_ROLES_VIEW}</code>
              </AlertDescription>
            </Alert>
          )}

          {canViewMemberRoles && !isMemberRolesPending && !isMemberRolesError && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Assigned At</TableHead>
                  <TableHead className="w-20 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberRoles.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground py-8 text-center"
                    >
                      This member has no assigned roles.
                    </TableCell>
                  </TableRow>
                )}
                {memberRoles.map((assignment) => {
                  const roleIsProtected = isProtectedRole({
                    name: assignment.roleName,
                    isSystemRole: false,
                  });
                  const isProjectScope = assignment.scopeType === 'project';
                  const projectName =
                    isProjectScope && assignment.scopeId
                      ? (projectNameMap.get(assignment.scopeId) ?? assignment.scopeId)
                      : null;
                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <span className="font-medium">{assignment.roleName}</span>
                      </TableCell>
                      <TableCell>
                        {roleIsProtected ? (
                          <Badge className="bg-amber-500/10 text-amber-600">
                            Protected
                          </Badge>
                        ) : (
                          <Badge variant="outline">Custom</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isProjectScope ? (
                          <Badge variant="secondary">
                            {projectName ? `Project: ${projectName}` : 'Project'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Organization</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(assignment.assignedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          disabled={!canRevokeMemberRole || isSaving || roleIsProtected}
                          onClick={() => void handleRevokeMemberRole(assignment.roleId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RoleViewDialog
        key={`view-${selectedRole?.id ?? 'none'}-${selectedRolePermissions.join('|')}`}
        open={viewRoleOpen}
        role={selectedRole}
        isLoading={isRoleDetailsPending && canLoadRoleDetail && viewRoleOpen}
        isError={isRoleDetailsError && canLoadRoleDetail && viewRoleOpen}
        errorMessage={roleDetailsError?.message}
        permissions={selectedRolePermissions}
        onOpenChange={(open) => {
          setViewRoleOpen(open);
          if (!open && !editRoleOpen) {
            setSelectedRoleId(null);
          }
        }}
      />

      <RoleEditDialog
        key={`edit-${selectedRole?.id ?? 'none'}-${selectedRole?.updatedAt ?? 'na'}-${selectedRole?.name ?? 'na'}-${selectedRole?.description ?? 'na'}-${selectedRolePermissions.join('|')}-${rbacPermissions.join('|')}`}
        open={editRoleOpen}
        role={selectedRole}
        isLoading={isRoleDetailsPending && canLoadRoleDetail && editRoleOpen}
        isError={isRoleDetailsError && canLoadRoleDetail && editRoleOpen}
        errorMessage={roleDetailsError?.message}
        isProtected={isSelectedRoleProtected}
        assignedPermissions={selectedRolePermissions}
        manageablePermissionCodes={rbacPermissions}
        canUpdate={canUpdateRole}
        canAssignPerm={canAssignPermissions}
        canRevokePerm={canRevokePermissions}
        isSaving={isSaving}
        onOpenChange={(open) => {
          setEditRoleOpen(open);
          if (!open && !viewRoleOpen) {
            setSelectedRoleId(null);
          }
        }}
        onUpdate={handleUpdateRole}
        onUpdatePermissions={handleUpdateRolePermissions}
      />

      <AlertDialog
        open={Boolean(deleteRoleTarget)}
        onOpenChange={(open) => !open && setDeleteRoleTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete role{' '}
              <span className="font-semibold">{deleteRoleTarget?.name ?? '-'}</span> and
              revoke all related assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteRole()}
              disabled={isSaving || !canDeleteRole}
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
