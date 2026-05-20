'use client';

import { useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Loader2, Pencil, Shield, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/lib/toast';
import { useProjectMembersManagementView } from '../hooks/use-project-members-management-view';
import {
  createProjectRoleNameById,
  resolveAssignedProjectMemberRoleNames,
} from '../hooks/use-project-member-role-resolver';
import { useConfirmAlertDialog } from '../hooks/use-confirm-alert-dialog';
import { resolveProjectMemberDisplayName } from '../lib/project-member-display';
import type { ProjectMemberResponse } from '../services/projects.service';

interface ProjectMembersManagementViewProps {
  projectId: string;
  members: ProjectMemberResponse[];
  isPending: boolean;
  errorMessage?: string | null;
  userDisplayNameById?: Map<string, string>;
  currentUserId?: string;
  canViewMembers: boolean;
  canViewProjectRoles: boolean;
  canRemoveMember: boolean;
  canEditAllocatedHours: boolean;
  canAssignRoleToMember: boolean;
  canRevokeRoleFromMember: boolean;
  page: number;
  limit: number;
  pageItemCount: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

function formatDate(value?: string | null, locale?: string): string {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString(locale);
}

export function ProjectMembersManagementView({
  projectId,
  members,
  isPending,
  errorMessage,
  userDisplayNameById,
  currentUserId,
  canViewMembers,
  canViewProjectRoles,
  canRemoveMember,
  canEditAllocatedHours,
  canAssignRoleToMember,
  canRevokeRoleFromMember,
  page,
  limit,
  pageItemCount,
  canGoPrevious,
  canGoNext,
  onPageChange,
  onLimitChange,
}: ProjectMembersManagementViewProps) {
  const locale = useLocale();
  const t = useTranslations('project.members');
  const commonT = useTranslations('project.common');
  const canManageRoleAssignments = canAssignRoleToMember && canRevokeRoleFromMember;
  const { confirm, confirmDialog } = useConfirmAlertDialog();
  const {
    searchQuery,
    setSearchQuery,
    filteredMembers,
    manageRolesMember,
    editAllocationMember,
    roles,
    rolesQuery,
    memberRolesQuery,
    memberRolesByUserId,
    isSavingRoleAssignments,
    isSavingAllocatedHours,
    effectiveDraftRoleIds,
    draftAllocatedHours,
    setDraftAllocatedHours,
    removeMemberMutation,
    openManageRoles,
    closeManageRoles,
    openEditAllocatedHours,
    closeEditAllocatedHours,
    toggleDraftRole,
    handleRemoveMember,
    handleSaveRoleAssignments,
    handleSaveAllocatedHours,
  } = useProjectMembersManagementView({
    projectId,
    members,
    userDisplayNameById,
    canLoadRoles: canViewProjectRoles || canManageRoleAssignments,
    confirmAction: confirm,
  });
  const loadErrorToastRef = useRef<string | null>(null);
  const roleNameById = createProjectRoleNameById(roles);

  useEffect(() => {
    if (!errorMessage) {
      loadErrorToastRef.current = null;
      return;
    }
    const message = errorMessage.trim() || t('toasts.loadFailed');
    if (loadErrorToastRef.current === message) return;
    loadErrorToastRef.current = message;
    toast.danger(message);
  }, [errorMessage, t]);

  const showProjectRoleColumn = canViewProjectRoles;
  const showRoleAssignmentsColumn = canManageRoleAssignments;
  const showAllocatedHoursColumn = canViewMembers;
  const columnCount =
    2 +
    (showProjectRoleColumn ? 1 : 0) +
    (showRoleAssignmentsColumn ? 1 : 0) +
    (showAllocatedHoursColumn ? 1 : 0) +
    1;

  if (!canViewMembers) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
        {t('permissionDenied')}
      </div>
    );
  }

  return (
    <>
      {confirmDialog}
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
          {isPending ? (
            <p className="text-muted-foreground text-sm">{t('loading')}</p>
          ) : errorMessage ? (
            <div className="text-destructive rounded-md border border-dashed border-current/40 p-3 text-sm">
              {errorMessage}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.member')}</TableHead>
                  {showProjectRoleColumn && <TableHead>{t('table.projectRole')}</TableHead>}
                  {showRoleAssignmentsColumn && <TableHead>{t('table.roleAssignments')}</TableHead>}
                  {showAllocatedHoursColumn && <TableHead>{t('table.allocatedHoursPerDay')}</TableHead>}
                  <TableHead>{t('table.joined')}</TableHead>
                  <TableHead className="w-36 text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columnCount} className="text-muted-foreground py-8 text-center">
                      {t('empty')}
                    </TableCell>
                  </TableRow>
                )}
                {filteredMembers.map((member) => {
                  const displayName = resolveProjectMemberDisplayName(
                    member,
                    userDisplayNameById,
                  );
                  const assignedRoleNames = resolveAssignedProjectMemberRoleNames(
                    member,
                    roleNameById,
                    memberRolesByUserId,
                  );

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{displayName}</p>
                        </div>
                      </TableCell>
                      {showProjectRoleColumn && (
                        <TableCell>
                          {assignedRoleNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {assignedRoleNames.map((roleName) => (
                                <Badge key={`${member.id}-${roleName}`} variant="outline">
                                  {roleName}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">{t('noRole')}</span>
                          )}
                        </TableCell>
                      )}
                      {showRoleAssignmentsColumn && (
                        <TableCell>
                          {(canAssignRoleToMember || canRevokeRoleFromMember) && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openManageRoles(member)}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              {t('manageRoles')}
                            </Button>
                          )}
                        </TableCell>
                      )}
                      {showAllocatedHoursColumn && (
                        <TableCell>
                          <span className="text-muted-foreground text-sm">
                            {member.allocatedHoursPerDay != null
                              ? `${member.allocatedHoursPerDay}h`
                              : '-'}
                          </span>
                        </TableCell>
                      )}
                      <TableCell>{formatDate(member.joinedAt, locale)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canEditAllocatedHours && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title={t('editAllocatedHoursTitle')}
                              onClick={() => openEditAllocatedHours(member)}
                              disabled={isSavingAllocatedHours}
                            >
                              {isSavingAllocatedHours && editAllocationMember?.id === member.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Pencil className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {canRemoveMember && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              disabled={
                                removeMemberMutation.isPending || member.userId === currentUserId
                              }
                              title={
                                member.userId === currentUserId
                                  ? t('cannotRemoveSelf')
                                  : undefined
                              }
                              onClick={() => void handleRemoveMember(member)}
                            >
                              {removeMemberMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {!isPending && !errorMessage && (
            <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                {t('pagination.summary', {
                  shown: filteredMembers.length,
                  pageItemCount,
                  page,
                })}
              </p>

              <div className="flex items-center gap-2">
                <Select
                  value={String(limit)}
                  onValueChange={(value) => {
                    onLimitChange(Number(value));
                  }}
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">{t('pagination.perPage', { count: 10 })}</SelectItem>
                    <SelectItem value="20">{t('pagination.perPage', { count: 20 })}</SelectItem>
                    <SelectItem value="50">{t('pagination.perPage', { count: 50 })}</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={!canGoPrevious || isPending}
                  onClick={() => onPageChange(Math.max(page - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={!canGoNext || isPending}
                  onClick={() => onPageChange(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {showRoleAssignmentsColumn && (
        <Dialog
          open={Boolean(manageRolesMember)}
          onOpenChange={(open) => {
            if (open) return;
            closeManageRoles();
          }}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{t('manageRolesDialog.title')}</DialogTitle>
              <DialogDescription>
                {manageRolesMember
                  ? t('manageRolesDialog.description', {
                      member: resolveProjectMemberDisplayName(manageRolesMember, userDisplayNameById),
                    })
                  : t('manageRolesDialog.descriptionFallback')}
              </DialogDescription>
            </DialogHeader>

            {rolesQuery.isPending || memberRolesQuery.isPending ? (
              <p className="text-muted-foreground text-sm">{t('manageRolesDialog.loading')}</p>
            ) : (
              <div className="space-y-4">
                {roles.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t('manageRolesDialog.empty')}</p>
                ) : (
                  <ScrollArea className="h-60 rounded-md border p-2">
                    <div className="space-y-1.5 pr-1">
                      {roles.map((role) => {
                        const checked = effectiveDraftRoleIds.includes(role.id);
                        return (
                          <label
                            key={role.id}
                            className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm"
                          >
                            <Checkbox
                              checked={checked}
                              disabled={
                                (!checked && !canAssignRoleToMember) ||
                                (checked && !canRevokeRoleFromMember) ||
                                isSavingRoleAssignments
                              }
                              onCheckedChange={(nextChecked) =>
                                toggleDraftRole(role.id, Boolean(nextChecked))
                              }
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium">{role.name}</p>
                              {role.description && (
                                <p className="text-muted-foreground truncate text-xs">
                                  {role.description}
                                </p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeManageRoles}
                disabled={isSavingRoleAssignments}
              >
                {commonT('cancel')}
              </Button>
              {(canAssignRoleToMember || canRevokeRoleFromMember) && (
                <Button
                  type="button"
                  onClick={() => void handleSaveRoleAssignments()}
                  disabled={
                    isSavingRoleAssignments ||
                    memberRolesQuery.isPending ||
                    rolesQuery.isPending
                  }
                >
                  {isSavingRoleAssignments && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {commonT('save')}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {canEditAllocatedHours && (
        <Dialog
          open={Boolean(editAllocationMember)}
          onOpenChange={(open) => {
            if (open) return;
            closeEditAllocatedHours();
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('allocatedHoursDialog.title')}</DialogTitle>
              <DialogDescription>
                {editAllocationMember
                  ? t('allocatedHoursDialog.description', {
                      member: resolveProjectMemberDisplayName(editAllocationMember, userDisplayNameById),
                    })
                  : t('allocatedHoursDialog.descriptionFallback')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="edit-allocated-hours">{t('allocatedHoursDialog.label')}</Label>
              <Input
                id="edit-allocated-hours"
                type="number"
                min="0"
                step="0.5"
                value={draftAllocatedHours}
                onChange={(event) => setDraftAllocatedHours(event.target.value)}
                disabled={isSavingAllocatedHours}
                placeholder={t('allocatedHoursDialog.placeholder')}
              />
              <p className="text-muted-foreground text-xs">{t('allocatedHoursDialog.hint')}</p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeEditAllocatedHours}
                disabled={isSavingAllocatedHours}
              >
                {commonT('cancel')}
              </Button>
              <Button
                type="button"
                onClick={() => void handleSaveAllocatedHours()}
                disabled={isSavingAllocatedHours}
              >
                {isSavingAllocatedHours && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {commonT('save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
