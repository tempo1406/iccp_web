'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Mail, Phone, Calendar, MapPin, Crown, Trash2, UserPlus } from 'lucide-react';
import { isErr, isOk } from '@/lib/safe-query';
import { toast } from '@/lib/toast';
import { useTenant } from '@/providers';
import type { MemberDto, RoleDto } from '@/services/organizations/types';
import { RoleAssignmentMultiSelect } from '@/features/tenant/organization-roles/components/role-assignment-multi-select';
import { useProjectList } from '@/features/tenant/projects/query/use-project-core';
import {
  isProtectedRole,
  useOrganizationMemberRoles,
  useOrganizationRolesData,
} from '@/features/tenant/organization-roles/hooks/use-organization-roles';
import {
  useAssignMemberRoleMutation,
  useRevokeMemberRoleMutation,
} from '@/features/tenant/organization-roles/query/organization-roles.queries';
import { organizationMemberKeys } from '../query/members.queries';

function formatDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

function getInitials(firstName?: string | null, lastName?: string | null): string {
  return [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
}

interface RolesTabProps {
  member: MemberDto;
  canManageRoles: boolean;
}

function RolesTab({ member, canManageRoles }: RolesTabProps) {
  const t = useTranslations('organizationManagement.members.details');
  const assignmentT = useTranslations('organizationManagement.rolesPermissions.memberAssignment');
  const commonT = useTranslations('organizationManagement.common');
  const rolesToastT = useTranslations('organizationManagement.rolesPermissions.toasts');
  const { tenantId } = useTenant();
  const qc = useQueryClient();
  const [revokingRoleId, setRevokingRoleId] = useState<string | null>(null);

  const { roles: allRoles, isPending: isRolesPending } = useOrganizationRolesData();
  const projectListQuery = useProjectList({}, true);
  const projectNameMap = useMemo(() => {
    const projects = Array.isArray(projectListQuery.data) ? projectListQuery.data : [];
    const map = new Map<string, string>();
    for (const project of projects) {
      if (project.id) {
        map.set(project.id, project.name);
      }
    }
    return map;
  }, [projectListQuery.data]);
  const {
    memberRoles,
    isPending: isMemberRolesPending,
    isError: isMemberRolesError,
    error: memberRolesError,
  } = useOrganizationMemberRoles(member.userId, Boolean(member.userId));
  const assignMutation = useAssignMemberRoleMutation();
  const revokeMutation = useRevokeMemberRoleMutation();

  const allAssignableRoles = useMemo(
    () => allRoles.filter((r) => r.name && !isProtectedRole(r)),
    [allRoles],
  );

  // Match member's assigned roles against allAssignableRoles by id OR name
  // (API may return different ID formats across endpoints)
  const assignedIds = useMemo(() => {
    const memberRoleIds = new Set((member.roles ?? []).map((r) => r.id));
    const memberRoleNames = new Set((member.roles ?? []).map((r) => (r.name ?? '').toLowerCase()));
    return new Set(
      allAssignableRoles
        .filter((r) => memberRoleIds.has(r.id) || memberRoleNames.has((r.name ?? '').toLowerCase()))
        .map((r) => r.id),
    );
  }, [member.roles, allAssignableRoles]);

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(() => [...assignedIds]);

  const stagedRoleIds = useMemo(
    () => selectedRoleIds.filter((id) => !assignedIds.has(id)),
    [selectedRoleIds, assignedIds],
  );

  const isAssigning = assignMutation.isPending;
  const isRevoking = revokeMutation.isPending;

  async function handleAssign() {
    if (stagedRoleIds.length === 0) return;

    let anyFailed = false;
    for (const roleId of stagedRoleIds) {
      const result = await assignMutation.mutateAsync({ userId: member.userId, roleId });
      if (isErr(result)) {
        anyFailed = true;
        toast.danger(result.error instanceof Error ? result.error.message : 'Failed to assign role.');
      }
    }

    if (!anyFailed) {
      toast.success(
        stagedRoleIds.length === 1 ? 'Role assigned successfully.' : 'Roles assigned successfully.',
      );
    }

    // Invalidate using userId — matches the query key registered in organization-members-page
    void qc.invalidateQueries({ queryKey: organizationMemberKeys.byId(tenantId, member.userId) });
  }

  async function handleRevoke(role: RoleDto) {
    setRevokingRoleId(role.id);
    // Look up the proper role id from allAssignableRoles by name (handles id mismatch)
    const resolvedRoleId =
      allAssignableRoles.find(
        (r) => r.id === role.id || (r.name ?? '').toLowerCase() === (role.name ?? '').toLowerCase(),
      )?.id ?? role.id;
    const result = await revokeMutation.mutateAsync({ userId: member.userId, roleId: resolvedRoleId });
    setRevokingRoleId(null);

    if (isOk(result)) {
      setSelectedRoleIds((current) => current.filter((id) => id !== resolvedRoleId));
      toast.success(rolesToastT('memberRoleRevoked'));
      void qc.invalidateQueries({ queryKey: organizationMemberKeys.byId(tenantId, member.userId) });
    } else if (isErr(result)) {
      toast.danger(result.error instanceof Error ? result.error.message : 'Failed to revoke role.');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canManageRoles && (
        <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-card p-3">
          <div className="flex-1">
            <RoleAssignmentMultiSelect
              roles={allAssignableRoles}
              selectedRoleIds={selectedRoleIds}
              disabled={isRolesPending || isAssigning}
              onChange={setSelectedRoleIds}
            />
          </div>
          <Button
            size="sm"
            className="shrink-0 gap-1.5"
            disabled={stagedRoleIds.length === 0 || isAssigning}
            onClick={() => void handleAssign()}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Assign
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{assignmentT('headers.role')}</TableHead>
            <TableHead>{assignmentT('headers.type')}</TableHead>
            <TableHead>{assignmentT('headers.scope')}</TableHead>
            <TableHead className="w-20 text-right">{assignmentT('headers.action')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isMemberRolesPending &&
            ['member-role-1', 'member-role-2', 'member-role-3'].map((key) => (
              <TableRow key={key}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-6 w-32 rounded-full" /></TableCell>
                <TableCell><div className="ml-auto h-8 w-8 rounded-md bg-muted" /></TableCell>
              </TableRow>
            ))}

          {!isMemberRolesPending && isMemberRolesError && (
            <TableRow>
              <TableCell colSpan={4} className="py-4">
                <Alert variant="destructive">
                  <AlertTitle>{assignmentT('loadFailed')}</AlertTitle>
                  <AlertDescription>{memberRolesError?.message ?? commonT('unknownError')}</AlertDescription>
                </Alert>
              </TableCell>
            </TableRow>
          )}

          {!isMemberRolesPending && !isMemberRolesError && memberRoles.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                {assignmentT('empty')}
              </TableCell>
            </TableRow>
          )}

          {!isMemberRolesPending && !isMemberRolesError && memberRoles.map((assignment) => {
            const matchedRole =
              allRoles.find(
                (role) =>
                  role.id === assignment.roleId ||
                  (role.name ?? '').toLowerCase() === assignment.roleName.toLowerCase(),
              ) ?? null;
            const roleForRevoke: RoleDto = {
              id: assignment.roleId,
              name: assignment.roleName,
              description: matchedRole?.description ?? null,
            };
            const roleIsProtected = matchedRole ? isProtectedRole(matchedRole) : false;
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
                    <Badge className="bg-amber-500/10 text-amber-600">{commonT('protected')}</Badge>
                  ) : (
                    <Badge variant="outline">{commonT('custom')}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {isProjectScope ? (
                    <Badge variant="secondary">
                      {projectName
                        ? assignmentT('scopeProject', { name: projectName })
                        : assignmentT('scopeProjectFallback')}
                    </Badge>
                  ) : (
                    <Badge variant="outline">{assignmentT('scopeOrganization')}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {canManageRoles ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        disabled={roleIsProtected || (isRevoking && revokingRoleId === assignment.roleId)}
                        onClick={() => void handleRevoke(roleForRevoke)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

interface OrganizationMemberDetailsDialogProps {
  open: boolean;
  member: MemberDto | null;
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
  canManageRoles?: boolean;
  getMemberDisplayName: (userId?: string | null) => string;
  getOrganizationDisplayName: (organizationId?: string | null) => string;
  onOpenChange: (open: boolean) => void;
}

export function OrganizationMemberDetailsDialog({
  open,
  member,
  isPending,
  isError,
  errorMessage,
  canManageRoles = false,
  getMemberDisplayName,
  onOpenChange,
}: Readonly<OrganizationMemberDetailsDialogProps>) {
  const fullName = [member?.firstName, member?.lastName].filter(Boolean).join(' ') || '-';

  return (
    <>
      {/* Manual backdrop — needed because modal={false} disables Radix's built-in overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[50] bg-black/50"
          aria-hidden="true"
          onClick={() => onOpenChange(false)}
        />
      )}
      <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
        <DialogContent className="gap-0 p-0 overflow-hidden sm:max-w-4xl max-h-[110vh] flex flex-col top-[15vh] translate-y-0">
          <DialogTitle className="sr-only">Member Details</DialogTitle>
          {isPending && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
              <Skeleton className="h-48 w-full" />
            </div>
          )}

          {isError && (
            <div className="p-6 text-sm text-destructive">
              {errorMessage ?? 'Failed to load member details.'}
            </div>
          )}

          {!isPending && !isError && member && (
            <>
              {/* Header */}
              <div className="relative bg-background border-b border-border/70 px-6 pt-6 pb-7">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 ring-2 ring-white/30 shrink-0">
                    <AvatarImage src={member.avatarUrl ?? undefined} alt={fullName} />
                    <AvatarFallback className="text-lg font-semibold bg-muted text-muted-foreground">
                      {getInitials(member.firstName, member.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-semibold leading-tight">{fullName}</h2>
                      {member.isOwner && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Crown className="h-3 w-3" />
                          Owner
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{member.email}</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="flex flex-col flex-1 overflow-hidden">
                <TabsList className="rounded-none border-b bg-transparent h-auto px-4 py-2 justify-start gap-1 shrink-0">
                  <TabsTrigger
                    value="overview"
                    className="rounded-md px-4 py-1.5 text-sm data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="roles"
                    className="rounded-md px-4 py-1.5 text-sm data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    Roles &amp; Permissions
                  </TabsTrigger>
                </TabsList>

                {/* Overview */}
                <TabsContent value="overview" className="flex-1 overflow-y-auto p-5 mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Contact Information */}
                    <div className="rounded-lg border border-border/70 bg-card p-4 space-y-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Contact Information
                      </p>
                      <div className="space-y-2.5">
                        <div className="flex items-start gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">Email Address</p>
                            <p className="text-sm font-medium break-all">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">Phone Number</p>
                            <p className="text-sm font-medium">{member.phone ?? '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">Date of Birth</p>
                            <p className="text-sm font-medium">{formatDate(member.dateOfBirth)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">Address</p>
                            <p className="text-sm font-medium">-</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Organization Context */}
                    <div className="rounded-lg border border-border/70 bg-card p-4 space-y-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Organization Context
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Member Status</p>
                          <Badge variant={member.isActive ? 'default' : 'secondary'} className="text-xs mt-0.5">
                            {member.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Invited By</p>
                          <p className="text-sm font-medium mt-0.5">{getMemberDisplayName(member.invitedBy)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Join Date</p>
                          <p className="text-sm font-medium mt-0.5">{formatDate(member.joinedAt)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Accepted Invite</p>
                          <p className="text-sm font-medium mt-0.5">
                            {formatDate(member.invitationAcceptedAt)}
                          </p>
                        </div>
                        {member.leftAt && (
                          <div>
                            <p className="text-[10px] text-muted-foreground">Left At</p>
                            <p className="text-sm font-medium mt-0.5">{formatDate(member.leftAt)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Roles & Permissions */}
                <TabsContent value="roles" className="flex-1 overflow-y-auto mt-0 px-6 py-4">
                  <RolesTab key={member.id} member={member} canManageRoles={canManageRoles} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
