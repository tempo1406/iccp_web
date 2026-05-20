'use client';

import { useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import type { OrganizationRoleDto } from '@/services/organization-roles';
import { Loader2, Shield, ShieldAlert } from 'lucide-react';
import { groupPermissionCodes } from './role-permissions-utils';
import { RoleTypeBadge } from './role-type-badge';

interface RoleEditDialogProps {
  open: boolean;
  role: OrganizationRoleDto | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isProtected: boolean;
  assignedPermissions: string[];
  manageablePermissionCodes: string[];
  canUpdate: boolean;
  canAssignPerm: boolean;
  canRevokePerm: boolean;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (name: string, description: string) => Promise<void> | void;
  onUpdatePermissions: (codes: string[]) => Promise<void> | void;
}

export function RoleEditDialog({
  open,
  role,
  isLoading,
  isError,
  errorMessage,
  isProtected,
  assignedPermissions,
  manageablePermissionCodes,
  canUpdate,
  canAssignPerm,
  canRevokePerm,
  isSaving,
  onOpenChange,
  onUpdate,
  onUpdatePermissions,
}: Readonly<RoleEditDialogProps>) {
  const normalizedAssignedPermissions = useMemo(
    () => Array.from(new Set(assignedPermissions)).sort(),
    [assignedPermissions],
  );
  const normalizedManageablePermissions = useMemo(
    () => Array.from(new Set(manageablePermissionCodes)).sort(),
    [manageablePermissionCodes],
  );
  const currentManageablePermissionSet = useMemo(
    () =>
      new Set(
        normalizedAssignedPermissions.filter((code) =>
          normalizedManageablePermissions.includes(code),
        ),
      ),
    [normalizedAssignedPermissions, normalizedManageablePermissions],
  );
  const lockedPermissionCodes = useMemo(
    () =>
      normalizedAssignedPermissions.filter(
        (code) => !normalizedManageablePermissions.includes(code),
      ),
    [normalizedAssignedPermissions, normalizedManageablePermissions],
  );
  const [editName, setEditName] = useState(role?.name ?? '');
  const [editDescription, setEditDescription] = useState(role?.description ?? '');
  const [permissionFilter, setPermissionFilter] = useState('');
  const [selectedPermissionCodes, setSelectedPermissionCodes] = useState<string[]>(() =>
    normalizedAssignedPermissions.filter((code) =>
      normalizedManageablePermissions.includes(code),
    ),
  );

  const selectedPermissionSet = useMemo(
    () => new Set(selectedPermissionCodes),
    [selectedPermissionCodes],
  );

  const filteredPermissionCodes = useMemo(() => {
    const normalizedFilter = permissionFilter.trim().toLowerCase();
    if (normalizedFilter.length === 0) return normalizedManageablePermissions;
    return normalizedManageablePermissions.filter((code) =>
      code.toLowerCase().includes(normalizedFilter),
    );
  }, [normalizedManageablePermissions, permissionFilter]);

  const groupedPermissionCodes = useMemo(
    () => groupPermissionCodes(filteredPermissionCodes),
    [filteredPermissionCodes],
  );

  const sortedSelectedPermissionCodes = useMemo(
    () => [...selectedPermissionCodes].sort(),
    [selectedPermissionCodes],
  );

  const permissionCodesToAdd = useMemo(
    () =>
      sortedSelectedPermissionCodes.filter(
        (code) => !currentManageablePermissionSet.has(code),
      ),
    [sortedSelectedPermissionCodes, currentManageablePermissionSet],
  );
  const permissionCodesToRemove = useMemo(
    () =>
      Array.from(currentManageablePermissionSet).filter(
        (code) => !selectedPermissionSet.has(code),
      ),
    [currentManageablePermissionSet, selectedPermissionSet],
  );
  const hasPermissionChanges =
    permissionCodesToAdd.length > 0 || permissionCodesToRemove.length > 0;

  const normalizedName = editName.trim();
  const normalizedDescription = editDescription.trim();
  const hasMetadataChanges =
    normalizedName !== (role?.name ?? '') ||
    normalizedDescription !== (role?.description ?? '');
  const canUpdateMetadata = canUpdate && hasMetadataChanges;
  const canSavePermissions =
    hasPermissionChanges &&
    (permissionCodesToAdd.length === 0 || canAssignPerm) &&
    (permissionCodesToRemove.length === 0 || canRevokePerm);
  const canSubmit =
    !isProtected &&
    !isSaving &&
    normalizedName.length > 0 &&
    (canUpdateMetadata || canSavePermissions);

  const togglePermission = (code: string, checked: boolean) => {
    setSelectedPermissionCodes((previous) => {
      if (checked) {
        if (!canAssignPerm) return previous;
        if (previous.includes(code)) return previous;
        return [...previous, code];
      }

      if (!canRevokePerm) return previous;
      return previous.filter((item) => item !== code);
    });
  };

  const togglePermissionGroup = (codes: string[], checked: boolean) => {
    setSelectedPermissionCodes((previous) => {
      if (checked) {
        if (!canAssignPerm) return previous;
        return Array.from(new Set([...previous, ...codes]));
      }

      if (!canRevokePerm) return previous;
      const codeSet = new Set(codes);
      return previous.filter((item) => !codeSet.has(item));
    });
  };

  const handleSave = async () => {
    if (!role || !canSubmit) return;
    if (canUpdateMetadata) {
      await onUpdate(normalizedName, normalizedDescription);
    }
    if (canSavePermissions) {
      await onUpdatePermissions(sortedSelectedPermissionCodes);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl"
      >
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-xl tracking-tight">
            <Shield className="text-primary h-5 w-5" />
            {role?.isSystemRole ? 'Update System Role' : 'Update Role'}
          </DialogTitle>
          <DialogDescription>Edit role metadata and permission codes.</DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3 px-6 py-5">
            {['name', 'description', 'permissions', 'selection'].map((key) => (
              <Skeleton key={key} className="h-8 w-full" />
            ))}
          </div>
        )}

        {isError && (
          <div className="px-6 py-5">
            <Alert variant="destructive">
              <AlertTitle>Failed to load role details</AlertTitle>
              <AlertDescription>{errorMessage ?? 'Unknown error.'}</AlertDescription>
            </Alert>
          </div>
        )}

        {!isLoading && role && (
          <div className="relative min-h-0 flex-1">
            <div className="bg-border/40 pointer-events-none absolute inset-y-0 left-80 hidden w-px lg:block" />
            <div className="grid h-full min-h-0 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Role Info</h3>
                  <RoleTypeBadge role={role} />
                </div>

                {isProtected && (
                  <Alert>
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Protected Role</AlertTitle>
                    <AlertDescription>
                      This role is protected by organization policy. Editing and
                      permission changes are disabled.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="edit-role-name">Role Name</Label>
                  <Input
                    id="edit-role-name"
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    disabled={!canUpdate || isProtected || isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-role-desc">Description</Label>
                  <Textarea
                    id="edit-role-desc"
                    value={editDescription}
                    onChange={(event) => setEditDescription(event.target.value)}
                    disabled={!canUpdate || isProtected || isSaving}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Selected Manageable Permissions</Label>
                    <Badge variant="secondary">
                      {sortedSelectedPermissionCodes.length}
                    </Badge>
                  </div>
                  <ScrollArea className="h-44 rounded-md border">
                    <div className="flex flex-wrap gap-1.5 p-2">
                      {sortedSelectedPermissionCodes.length === 0 ? (
                        <p className="text-muted-foreground py-2 text-xs">
                          No permissions selected.
                        </p>
                      ) : (
                        sortedSelectedPermissionCodes.map((code) => (
                          <Badge
                            key={code}
                            variant="secondary"
                            className="font-mono text-xs"
                          >
                            {code}
                          </Badge>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {lockedPermissionCodes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Read-only Assigned Permissions</Label>
                      <Badge variant="outline">{lockedPermissionCodes.length}</Badge>
                    </div>
                    <Alert>
                      <AlertTitle>Some permissions are outside your scope</AlertTitle>
                      <AlertDescription>
                        These permissions are already attached to the role, but your
                        current account cannot modify them.
                      </AlertDescription>
                    </Alert>
                    <ScrollArea className="h-32 rounded-md border">
                      <div className="flex flex-wrap gap-1.5 p-2">
                        {lockedPermissionCodes.map((code) => (
                          <Badge
                            key={code}
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            {code}
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Manageable Permission Codes</h3>
                  <span className="text-muted-foreground text-xs">
                    {filteredPermissionCodes.length} items
                  </span>
                </div>

                <Input
                  value={permissionFilter}
                  onChange={(event) => setPermissionFilter(event.target.value)}
                  placeholder="Filter manageable permissions..."
                  disabled={isSaving}
                />

                <div className="rounded-lg border">
                  <ScrollArea className="h-[42vh]">
                    <div className="space-y-2 p-3">
                      {groupedPermissionCodes.map((group) => {
                        const groupCodes = group.children.map((item) => item.code);
                        const selectedChildrenCount = groupCodes.filter((code) =>
                          selectedPermissionSet.has(code),
                        ).length;
                        const groupCheckedState: boolean | 'indeterminate' =
                          selectedChildrenCount === 0
                            ? false
                            : selectedChildrenCount === groupCodes.length
                              ? true
                              : 'indeterminate';
                        const nextGroupState = groupCheckedState === true ? false : true;
                        const canToggleGroup =
                          !isProtected &&
                          !isSaving &&
                          (nextGroupState ? canAssignPerm : canRevokePerm);

                        return (
                          <div key={group.parent} className="rounded-md border p-3">
                            <label
                              className={`flex items-center gap-3 ${
                                canToggleGroup
                                  ? 'cursor-pointer'
                                  : 'cursor-not-allowed opacity-60'
                              }`}
                            >
                              <Checkbox
                                checked={groupCheckedState}
                                disabled={!canToggleGroup}
                                onCheckedChange={(checked) =>
                                  togglePermissionGroup(groupCodes, checked === true)
                                }
                              />
                              <span className="font-medium">{group.parent}</span>
                            </label>

                            <div className="mt-2 ml-7 space-y-1.5">
                              {group.children.map((item) => {
                                const isChecked = selectedPermissionSet.has(item.code);
                                const canToggleChild =
                                  !isProtected &&
                                  !isSaving &&
                                  (isChecked ? canRevokePerm : canAssignPerm);

                                return (
                                  <label
                                    key={item.code}
                                    className={`flex items-start gap-3 rounded-md px-2 py-1.5 ${
                                      canToggleChild
                                        ? 'hover:bg-muted/30 cursor-pointer'
                                        : 'cursor-not-allowed opacity-60'
                                    }`}
                                  >
                                    <Checkbox
                                      checked={isChecked}
                                      disabled={!canToggleChild}
                                      onCheckedChange={(checked) =>
                                        togglePermission(item.code, checked === true)
                                      }
                                    />
                                    <div className="min-w-0">
                                      <p className="truncate text-sm">{item.child}</p>
                                      <p className="text-muted-foreground truncate font-mono text-xs">
                                        {item.code}
                                      </p>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {groupedPermissionCodes.length === 0 && (
                        <p className="text-muted-foreground col-span-full py-4 text-center text-sm">
                          No manageable permissions found for current filter.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="relative px-6 py-4">
          <div className="bg-border/40 pointer-events-none absolute inset-y-0 left-80 hidden w-px lg:block" />
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={!canSubmit}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Update Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
