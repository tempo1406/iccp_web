'use client';

import { useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/lib/toast';
import { ProjectRolePermissionTree } from './project-role-permission-tree';
import { useProjectRolesManagementView } from '../hooks/use-project-roles-management-view';
import { useConfirmAlertDialog } from '../hooks/use-confirm-alert-dialog';

interface ProjectRolesManagementViewProps {
  projectId: string;
  canViewRoles: boolean;
  canCreateRole: boolean;
  canUpdateRole: boolean;
  canDeleteRole: boolean;
  canAssignPermissions: boolean;
  canRevokePermissions: boolean;
}

export function ProjectRolesManagementView({
  projectId,
  canViewRoles,
  canCreateRole,
  canUpdateRole,
  canDeleteRole,
  canAssignPermissions,
  canRevokePermissions,
}: ProjectRolesManagementViewProps) {
  const locale = useLocale();
  const t = useTranslations('project.roles');
  const commonT = useTranslations('project.common');
  const { confirm, confirmDialog } = useConfirmAlertDialog();
  const {
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
  } = useProjectRolesManagementView({ projectId, confirmAction: confirm });
  const loadErrorToastRef = useRef<string | null>(null);
  const roleNotFoundToastShownRef = useRef(false);

  useEffect(() => {
    if (!rolesQuery.error) {
      loadErrorToastRef.current = null;
      return;
    }
    const message = rolesQuery.error.message?.trim() || t('toasts.loadFailed');
    if (loadErrorToastRef.current === message) return;
    loadErrorToastRef.current = message;
    toast.danger(message);
  }, [rolesQuery.error?.message, t]);

  useEffect(() => {
    if (!detailOpen || roleDetailQuery.isPending || selectedRole) {
      roleNotFoundToastShownRef.current = false;
      return;
    }
    if (roleNotFoundToastShownRef.current) return;
    roleNotFoundToastShownRef.current = true;
    toast.warning(t('toasts.roleMissing'));
  }, [detailOpen, roleDetailQuery.isPending, selectedRole, t]);

  if (!canViewRoles) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
        {t('permissionDenied')}
      </div>
    );
  }

  return (
    <>
      {confirmDialog}
      {canCreateRole && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('createTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-role-name">{t('name')}</Label>
                <Input
                  id="project-role-name"
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                  placeholder={t('namePlaceholder')}
                  disabled={!canCreateRole || isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-role-description">{t('description')}</Label>
                <Input
                  id="project-role-description"
                  value={createDescription}
                  onChange={(event) => setCreateDescription(event.target.value)}
                  placeholder={t('descriptionPlaceholder')}
                  disabled={!canCreateRole || isSaving}
                />
              </div>
            </div>
            <div className="space-y-2">
              <ProjectRolePermissionTree
                title={t('permissionsOptional')}
                selectedCount={createSelectedPermissionCodes.length}
                searchQuery={createPermissionSearchQuery}
                onSearchQueryChange={setCreatePermissionSearchQuery}
                modules={createGroupedPermissions}
                isLoading={availablePermissionsQuery.isPending}
                isPermissionChecked={isCreatePermissionChecked}
                getGroupState={getCreatePermissionGroupState}
                onTogglePermission={toggleCreatePermission}
                onToggleGroup={toggleCreatePermissionGroup}
                isPermissionDisabled={() => !canCreateRole || isSaving}
                isGroupDisabled={() => !canCreateRole || isSaving}
              />
            </div>
            <Button
              type="button"
              onClick={() => void handleCreateRole()}
              disabled={isSaving || !createName.trim()}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {t('createAction')}
            </Button>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">{t('title')}</CardTitle>
          <div className="w-full max-w-sm">
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {rolesQuery.isPending ? (
            <p className="text-muted-foreground text-sm">{t('loading')}</p>
          ) : rolesQuery.error ? (
            <div className="text-destructive rounded-md border border-dashed border-current/40 p-3 text-sm">
              {rolesQuery.error.message}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.role')}</TableHead>
                  <TableHead>{t('table.updated')}</TableHead>
                  <TableHead className="w-32 text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground py-8 text-center">
                      {t('empty')}
                    </TableCell>
                  </TableRow>
                )}
                {filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <p className="font-medium">{role.name}</p>
                      {role.description && (
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {role.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {role.updatedAt ? new Date(role.updatedAt).toLocaleDateString(locale) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => openRoleDetail(role.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {canDeleteRole && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={isSaving}
                            onClick={() => void handleDeleteRole(role.id, role.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={onDetailOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              {t('detailTitle')}
            </DialogTitle>
            <DialogDescription>{t('detailDescription')}</DialogDescription>
          </DialogHeader>

          {roleDetailQuery.isPending ? (
            <p className="text-muted-foreground text-sm">{t('detailLoading')}</p>
          ) : !selectedRole ? (
            <div className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
              {t('detailMissing')}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-project-role-name">{t('name')}</Label>
                  <Input
                    id="edit-project-role-name"
                    value={effectiveEditName}
                    onChange={(event) => setEditNameValue(event.target.value)}
                    disabled={!canUpdateRole || isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-project-role-description">{t('description')}</Label>
                  <Input
                    id="edit-project-role-description"
                    value={effectiveEditDescription}
                    onChange={(event) => setEditDescriptionValue(event.target.value)}
                    disabled={!canUpdateRole || isSaving}
                  />
                </div>
              </div>

              {canUpdateRole && (
                <Button
                  type="button"
                  onClick={() => void handleSaveRoleMetadata()}
                  disabled={isSaving || !effectiveEditName.trim()}
                >
                  {t('saveMetadata')}
                </Button>
              )}

              <div className="space-y-2">
                <ProjectRolePermissionTree
                  title={t('permissions')}
                  selectedCount={effectiveSelectedPermissionCodes.length}
                  searchQuery={permissionSearchQuery}
                  onSearchQueryChange={setPermissionSearchQuery}
                  modules={groupedPermissions}
                  isLoading={availablePermissionsQuery.isPending}
                  isPermissionChecked={isPermissionChecked}
                  getGroupState={getPermissionGroupState}
                  onTogglePermission={togglePermission}
                  onToggleGroup={togglePermissionGroup}
                  isPermissionDisabled={(checked) =>
                    isSaving ||
                    (!checked && !canAssignPermissions) ||
                    (checked && !canRevokePermissions)
                  }
                  isGroupDisabled={(state) =>
                    isSaving ||
                    (state === false && !canAssignPermissions) ||
                    (state === true && !canRevokePermissions) ||
                    (state === 'indeterminate' &&
                      !canAssignPermissions &&
                      !canRevokePermissions)
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeRoleDetail}
              disabled={isSaving}
            >
              {commonT('close')}
            </Button>
            {(canAssignPermissions || canRevokePermissions) && (
              <Button
                type="button"
                onClick={() => void handleSaveRolePermissions()}
                disabled={isSaving || !selectedRoleId}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('savePermissions')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
