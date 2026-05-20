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
import { Shield } from 'lucide-react';
import { formatDateTime, groupPermissionCodes } from './role-permissions-utils';
import { RoleTypeBadge } from './role-type-badge';

interface RoleViewDialogProps {
  open: boolean;
  role: OrganizationRoleDto | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  permissions: string[];
  onOpenChange: (open: boolean) => void;
}

export function RoleViewDialog({
  open,
  role,
  isLoading,
  isError,
  errorMessage,
  permissions,
  onOpenChange,
}: Readonly<RoleViewDialogProps>) {
  const [permissionFilter, setPermissionFilter] = useState('');
  const normalizedPermissions = useMemo(() => Array.from(new Set(permissions)).sort(), [permissions]);
  const filteredPermissions = useMemo(() => {
    const normalizedFilter = permissionFilter.trim().toLowerCase();
    if (normalizedFilter.length === 0) return normalizedPermissions;
    return normalizedPermissions.filter((code) => code.toLowerCase().includes(normalizedFilter));
  }, [normalizedPermissions, permissionFilter]);
  const groupedPermissions = useMemo(
    () => groupPermissionCodes(filteredPermissions),
    [filteredPermissions],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
      >
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-xl tracking-tight">
            <Shield className="text-primary h-5 w-5" />
            Role Details
          </DialogTitle>
          <DialogDescription>View role metadata and assigned permissions.</DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3 px-6 py-5">
            {['name', 'description', 'permissions'].map((key) => (
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
            <div className="pointer-events-none absolute inset-y-0 left-80 hidden w-px bg-border/40 lg:block" />
            <div className="grid h-full min-h-0 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Role Info</h3>
                  <RoleTypeBadge role={role} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="view-role-name">Role Name</Label>
                  <Input id="view-role-name" value={role.name} readOnly disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="view-role-desc">Description</Label>
                  <Textarea
                    id="view-role-desc"
                    value={role.description ?? '-'}
                    readOnly
                    disabled
                    className="bg-muted"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="view-role-created">Created At</Label>
                  <Input
                    id="view-role-created"
                    value={formatDateTime(role.createdAt)}
                    readOnly
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="view-role-updated">Updated At</Label>
                  <Input
                    id="view-role-updated"
                    value={formatDateTime(role.updatedAt)}
                    readOnly
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Assigned Permissions</h3>
                  <Badge variant="secondary">{normalizedPermissions.length}</Badge>
                </div>

                <Input
                  value={permissionFilter}
                  onChange={(event) => setPermissionFilter(event.target.value)}
                  placeholder="Filter permissions..."
                />

                <div className="rounded-lg border">
                  <ScrollArea className="h-[42vh]">
                    <div className="space-y-2 p-3">
                      {groupedPermissions.length === 0 ? (
                        <p className="text-muted-foreground py-4 text-center text-sm">
                          No permissions found.
                        </p>
                      ) : (
                        groupedPermissions.map((group) => (
                          <div key={group.parent} className="rounded-md border p-3">
                            <div className="flex items-center gap-3">
                              <Checkbox checked disabled className="disabled:opacity-100" />
                              <span className="font-medium">{group.parent}</span>
                            </div>

                            <div className="mt-2 ml-7 space-y-1.5">
                              {group.children.map((item) => (
                                <div key={item.code} className="flex items-start gap-3 rounded-md px-2 py-1.5">
                                  <Checkbox checked disabled className="disabled:opacity-100" />
                                  <div className="min-w-0">
                                    <p className="truncate text-sm">{item.child}</p>
                                    <p className="text-muted-foreground truncate font-mono text-xs">
                                      {item.code}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="relative px-6 py-4">
          <div className="pointer-events-none absolute inset-y-0 left-80 hidden w-px bg-border/40 lg:block" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
