'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueries } from '@tanstack/react-query';
import { Edit, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useServiceContext } from '@/lib/use-service-context';
import { toast } from '@/lib/toast';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { useOrganizationMembersData } from '@/features/tenant/organization-members/hooks/use-organization-members';
import { useOrganizationRolesData } from '@/features/tenant/organization-roles/hooks/use-organization-roles';
import { useProjectList } from '@/features/tenant/projects/query/use-project-core';
import { useConfirmAlertDialog } from '@/features/tenant/projects/hooks/use-confirm-alert-dialog';
import { OrganizationService } from '@/services/organizations/organization.service';
import { OrganizationRolesService } from '@/services/organization-roles';
import { ProjectsService } from '@/services/projects';
import {
  useBulkAssignKpiTargets,
  useCloneKpiTargets,
  useDeleteKpiTarget,
  useKpiTargets,
  useUpdateKpiTarget,
} from '../../query/use-kpi-targets';
import type {
  CloneKpiTargetBody,
  KpiTargetListQuery,
  KpiTargetPeriod,
  KpiTargetResponse,
  KpiTargetScopeType,
  KpiTargetStatus,
  UpdateKpiTargetBody,
  UpsertKpiTargetBody,
} from '../../types/kpi.types';
import { KpiTargetCloneDialog } from './kpi-target-clone-dialog';
import {
  formatDate,
  getPeriodLabel,
  ScopeBadge,
  StatusBadge,
  TargetMetricsSummary,
} from './kpi-target-display';
import { KpiTargetFormDialog } from './kpi-target-form-dialog';

const ALL_VALUE = '__all__';

function memberLabel(firstName?: string | null, lastName?: string | null, email?: string) {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  return name || email || '';
}

function memberNameFromUnknownPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') return '';

  const item = payload as {
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
    user_email?: string;
    user_firstName?: string | null;
    user_lastName?: string | null;
    user?: {
      email?: string;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  };

  return memberLabel(
    item.user_firstName ?? item.firstName ?? item.user?.firstName,
    item.user_lastName ?? item.lastName ?? item.user?.lastName,
    item.user_email ?? item.email ?? item.user?.email,
  );
}

function nameFromUnknownPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') return '';

  const item = payload as {
    name?: string | null;
    projectName?: string | null;
    roleName?: string | null;
    title?: string | null;
  };

  return item.name ?? item.projectName ?? item.roleName ?? item.title ?? '';
}

function emptyToUndefined(value: string) {
  return value === ALL_VALUE ? undefined : value;
}

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function KpiTargetsManager() {
  const t = useTranslations('analytics');
  const ctx = useServiceContext();
  const canManageTargets = useCan(PERMISSIONS.ANALYTICS_KPI_TARGET_MANAGE);
  const canManage = canManageTargets;
  const [query, setQuery] = useState<KpiTargetListQuery>({});
  const [formOpen, setFormOpen] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<KpiTargetResponse | null>(null);
  const { confirm, confirmDialog } = useConfirmAlertDialog();

  const targetsQuery = useKpiTargets(query);
  const createMutation = useBulkAssignKpiTargets();
  const cloneMutation = useCloneKpiTargets();
  const updateMutation = useUpdateKpiTarget();
  const deleteMutation = useDeleteKpiTarget();
  const members = useOrganizationMembersData({ page: 1, limit: 1000 });
  const roles = useOrganizationRolesData();
  const projects = useProjectList({ page: 1, limit: 1000 });

  const memberByUserId = useMemo(() => {
    return new Map(
      members.members.map((member) => [
        member.userId,
        memberLabel(member.firstName, member.lastName, member.email) || member.userId,
      ]),
    );
  }, [members.members]);

  const roleById = useMemo(
    () => new Map(roles.roles.map((role) => [role.id, role.name])),
    [roles.roles],
  );

  const projectById = useMemo(
    () => new Map((projects.data ?? []).map((project) => [project.id, project.name])),
    [projects.data],
  );

  const targets = useMemo(() => targetsQuery.data ?? [], [targetsQuery.data]);

  const unresolvedProjectIds = useMemo(
    () =>
      Array.from(
        new Set(
          targets
            .map((target) => target.projectId)
            .filter(isNonEmptyString)
            .filter((projectId) => !projectById.has(projectId)),
        ),
      ),
    [projectById, targets],
  );

  const unresolvedUserIds = useMemo(
    () =>
      Array.from(
        new Set(
          targets
            .filter((target) => target.scopeType === 'USER')
            .map((target) => target.userId)
            .filter(isNonEmptyString)
            .filter((userId) => !memberByUserId.has(userId)),
        ),
      ),
    [memberByUserId, targets],
  );

  const unresolvedOrgRoleIds = useMemo(
    () =>
      Array.from(
        new Set(
          targets
            .filter((target) => target.scopeType === 'ROLE')
            .map((target) => target.roleId)
            .filter(isNonEmptyString)
            .filter((roleId) => !roleById.has(roleId)),
        ),
      ),
    [roleById, targets],
  );

  const projectIdsWithProjectRoles = useMemo(
    () =>
      Array.from(
        new Set(
          targets
            .filter((target) => target.scopeType === 'PROJECT_ROLE')
            .map((target) => target.projectId)
            .filter((projectId): projectId is string => Boolean(projectId)),
        ),
      ),
    [targets],
  );

  const unresolvedProjectRolePairs = useMemo(
    () =>
      Array.from(
        new Set(
          targets
            .filter(
              (target) =>
                target.scopeType === 'PROJECT_ROLE' &&
                Boolean(target.projectId) &&
                Boolean(target.roleId),
            )
            .map((target) => `${target.projectId}:${target.roleId}`),
        ),
      ),
    [targets],
  );

  const missingUserQueries = useQueries({
    queries: unresolvedUserIds.map((userId) => ({
      queryKey: ['kpi-targets', 'member-detail', ctx.tenantId, userId],
      queryFn: () => new OrganizationService(ctx).getMemberById(userId),
      enabled: Boolean(ctx.tenantId) && Boolean(userId),
      staleTime: 60_000,
    })),
  });

  const missingOrgRoleQueries = useQueries({
    queries: unresolvedOrgRoleIds.map((roleId) => ({
      queryKey: ['kpi-targets', 'org-role-detail', ctx.tenantId, roleId],
      queryFn: () => new OrganizationRolesService(ctx).getRoleById(roleId),
      enabled: Boolean(ctx.tenantId) && Boolean(roleId),
      staleTime: 60_000,
    })),
  });

  const projectRoleQueries = useQueries({
    queries: projectIdsWithProjectRoles.map((projectId) => ({
      queryKey: ['kpi-targets', 'project-roles', ctx.tenantId, projectId],
      queryFn: () => new ProjectsService(ctx).listProjectRoles(projectId),
      enabled: Boolean(ctx.tenantId) && Boolean(projectId),
      staleTime: 60_000,
    })),
  });

  const missingProjectQueries = useQueries({
    queries: unresolvedProjectIds.map((projectId) => ({
      queryKey: ['kpi-targets', 'project-detail', ctx.tenantId, projectId],
      queryFn: () => new ProjectsService(ctx).getProjectById(projectId),
      enabled: Boolean(ctx.tenantId) && Boolean(projectId),
      staleTime: 60_000,
    })),
  });

  const missingProjectRoleQueries = useQueries({
    queries: unresolvedProjectRolePairs.map((pair) => {
      const [projectId, roleId] = pair.split(':');
      return {
        queryKey: ['kpi-targets', 'project-role-detail', ctx.tenantId, projectId, roleId],
        queryFn: () => new ProjectsService(ctx).getProjectRoleById(projectId, roleId),
        enabled: Boolean(ctx.tenantId) && Boolean(projectId) && Boolean(roleId),
        staleTime: 60_000,
      };
    }),
  });

  const fallbackMemberByUserId = useMemo(() => {
    const memberMap = new Map<string, string>();

    missingUserQueries.forEach((query, index) => {
      const userId = unresolvedUserIds[index];
      if (!userId || !query.data) return;

      const payload =
        typeof query.data === 'object' &&
        query.data !== null &&
        'data' in query.data &&
        (query.data as { data?: unknown }).data
          ? (query.data as { data?: unknown }).data
          : query.data;

      const displayName = memberNameFromUnknownPayload(payload);
      if (displayName) {
        memberMap.set(userId, displayName);
      }
    });

    return memberMap;
  }, [missingUserQueries, unresolvedUserIds]);

  const fallbackOrgRoleById = useMemo(() => {
    const fallbackMap = new Map<string, string>();

    missingOrgRoleQueries.forEach((query, index) => {
      const roleId = unresolvedOrgRoleIds[index];
      if (!roleId || !query.data?.name) return;
      fallbackMap.set(roleId, query.data.name);
    });

    return fallbackMap;
  }, [missingOrgRoleQueries, unresolvedOrgRoleIds]);

  const projectRoleByCompositeKey = useMemo(() => {
    const roleMap = new Map<string, string>();

    projectRoleQueries.forEach((query, index) => {
      const projectId = projectIdsWithProjectRoles[index];
      if (!projectId || !query.data) return;

      query.data.forEach((role) => {
        const roleName = nameFromUnknownPayload(role);
        if (roleName) {
          roleMap.set(`${projectId}:${role.id}`, roleName);
        }
      });
    });

    return roleMap;
  }, [projectIdsWithProjectRoles, projectRoleQueries]);

  const fallbackProjectById = useMemo(() => {
    const projectMap = new Map<string, string>();

    missingProjectQueries.forEach((query, index) => {
      const projectId = unresolvedProjectIds[index];
      const projectName = nameFromUnknownPayload(query.data);
      if (!projectId || !projectName) return;
      projectMap.set(projectId, projectName);
    });

    return projectMap;
  }, [missingProjectQueries, unresolvedProjectIds]);

  const fallbackProjectRoleByCompositeKey = useMemo(() => {
    const fallbackMap = new Map<string, string>();

    missingProjectRoleQueries.forEach((query, index) => {
      const pair = unresolvedProjectRolePairs[index];
      const roleName = nameFromUnknownPayload(query.data);
      if (!pair || !roleName) return;
      fallbackMap.set(pair, roleName);
    });

    return fallbackMap;
  }, [missingProjectRoleQueries, unresolvedProjectRolePairs]);

  const resolveAssigneeOrRoleName = (target: KpiTargetResponse) => {
    if (target.scopeType === 'USER') {
      return (
        memberByUserId.get(target.userId ?? '') ??
        fallbackMemberByUserId.get(target.userId ?? '') ??
        t('common.unknownUser')
      );
    }

    if (target.scopeType === 'ROLE') {
      return (
        roleById.get(target.roleId ?? '') ??
        fallbackOrgRoleById.get(target.roleId ?? '') ??
        t('common.unknownRole')
      );
    }

    if (target.scopeType === 'PROJECT_ROLE') {
      const projectRoleName =
        target.projectId && target.roleId
          ? projectRoleByCompositeKey.get(`${target.projectId}:${target.roleId}`)
          : undefined;

      const fallbackProjectRoleName =
        target.projectId && target.roleId
          ? fallbackProjectRoleByCompositeKey.get(`${target.projectId}:${target.roleId}`)
          : undefined;

      return (
        projectRoleName ??
        fallbackProjectRoleName ??
        roleById.get(target.roleId ?? '') ??
        fallbackOrgRoleById.get(target.roleId ?? '') ??
        t('common.unknownRole')
      );
    }

    return t('common.unknownAssignee');
  };

  const userFilterOptions = useMemo(() => {
    const options = new Map<string, string>();

    members.members.forEach((member) => {
      options.set(
        member.userId,
        memberLabel(member.firstName, member.lastName, member.email) || member.userId,
      );
    });

    targets.forEach((target) => {
      if (target.userId) {
        options.set(
          target.userId,
          memberByUserId.get(target.userId) ??
            fallbackMemberByUserId.get(target.userId) ??
            t('common.unknownUser'),
        );
      }
    });

    return Array.from(options.entries()).sort(([, firstLabel], [, secondLabel]) =>
      firstLabel.localeCompare(secondLabel),
    );
  }, [fallbackMemberByUserId, memberByUserId, members.members, targets]);

  const roleFilterOptions = useMemo(() => {
    const options = new Map<string, string>();

    roles.roles.forEach((role) => {
      options.set(role.id, role.name);
    });

    targets.forEach((target) => {
      if (!target.roleId) return;

      const projectRoleName =
        target.scopeType === 'PROJECT_ROLE' && target.projectId
          ? projectRoleByCompositeKey.get(`${target.projectId}:${target.roleId}`) ??
            fallbackProjectRoleByCompositeKey.get(`${target.projectId}:${target.roleId}`)
          : undefined;

      options.set(
        target.roleId,
        projectRoleName ??
          roleById.get(target.roleId) ??
          fallbackOrgRoleById.get(target.roleId) ??
          t('common.unknownRole'),
      );
    });

    return Array.from(options.entries()).sort(([, firstLabel], [, secondLabel]) =>
      firstLabel.localeCompare(secondLabel),
    );
  }, [
    fallbackOrgRoleById,
    fallbackProjectRoleByCompositeKey,
    projectRoleByCompositeKey,
    roleById,
    roles.roles,
    targets,
  ]);

  const isMutating =
    createMutation.isPending ||
    cloneMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const showMutationResult = () => {
    toast.success(t('kpiTargets.savedSuccess'));
  };

  const handleCreate = async (body: UpsertKpiTargetBody) => {
    const result = await createMutation.mutateAsync(body);
    if (!result.ok) {
      toast.danger(result.error.message);
      return false;
    }

    showMutationResult();
    return true;
  };

  const handleUpdate = async (id: string, body: UpdateKpiTargetBody) => {
    const result = await updateMutation.mutateAsync({ id, body });
    if (!result.ok) {
      toast.danger(result.error.message);
      return false;
    }

    showMutationResult();
    setEditingTarget(null);
    return true;
  };

  const handleClone = async (body: CloneKpiTargetBody) => {
    const result = await cloneMutation.mutateAsync(body);
    if (!result.ok) {
      toast.danger(result.error.message);
      return false;
    }

    showMutationResult();
    return true;
  };

  const handleDelete = async (target: KpiTargetResponse) => {
    const confirmed = await confirm({
      title: t('kpiTargets.deleteTitle'),
      description: t('kpiTargets.deleteDescription'),
      confirmText: t('kpiTargets.deleteConfirm'),
      destructive: true,
    });
    if (!confirmed) return;

    const result = await deleteMutation.mutateAsync(target.id);
    if (!result.ok) {
      toast.danger(result.error.message);
      return;
    }

    toast.success(t('kpiTargets.deletedSuccess'));
  };

  return (
    <div className="space-y-4">
      {confirmDialog}

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{t('kpiTargets.title')}</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {t('kpiTargets.description')}
            </p>
          </div>
          {canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setCloneOpen(true)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('kpiTargets.clonePeriod')}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setEditingTarget(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('kpiTargets.assignTarget')}
              </Button>
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-8">
            <Select
              value={query.scopeType ?? ALL_VALUE}
              onValueChange={(value) =>
                setQuery((prev) => ({
                  ...prev,
                  scopeType: emptyToUndefined(value) as KpiTargetScopeType | undefined,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('common.scope')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>{t('kpiTargets.allScopes')}</SelectItem>
                {(['USER', 'ROLE', 'PROJECT_ROLE'] as const).map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`scope.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={query.period ?? ALL_VALUE}
              onValueChange={(value) =>
                setQuery((prev) => ({
                  ...prev,
                  period: emptyToUndefined(value) as KpiTargetPeriod | undefined,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('common.period')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>{t('kpiTargets.allPeriods')}</SelectItem>
                {(['MONTHLY', 'QUARTERLY', 'YEARLY'] as const).map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`periodLabel.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={query.status ?? ALL_VALUE}
              onValueChange={(value) =>
                setQuery((prev) => ({
                  ...prev,
                  status: emptyToUndefined(value) as KpiTargetStatus | undefined,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>{t('kpiTargets.allStatuses')}</SelectItem>
                {(['DRAFT', 'ACTIVE', 'ARCHIVED'] as const).map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`targetStatus.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={query.projectId ?? ALL_VALUE}
              onValueChange={(value) =>
                setQuery((prev) => ({ ...prev, projectId: emptyToUndefined(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('common.project')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>{t('kpiTargets.allProjects')}</SelectItem>
                {(projects.data ?? []).map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={query.userId ?? ALL_VALUE}
              onValueChange={(value) =>
                setQuery((prev) => ({ ...prev, userId: emptyToUndefined(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('kpiTargetForm.user')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>{t('kpiTargets.allUsers')}</SelectItem>
                {userFilterOptions.map(([userId, label]) => (
                  <SelectItem key={userId} value={userId}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={query.roleId ?? ALL_VALUE}
              onValueChange={(value) =>
                setQuery((prev) => ({ ...prev, roleId: emptyToUndefined(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('kpiTargetForm.organizationRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>{t('kpiTargets.allRoles')}</SelectItem>
                {roleFilterOptions.map(([roleId, label]) => (
                  <SelectItem key={roleId} value={roleId}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DatePicker
              value={query.activeOn ?? ''}
              onChange={(value) => setQuery((prev) => ({ ...prev, activeOn: value || undefined }))}
              placeholder={t('kpiTargets.activeOn')}
            />

            <Button type="button" variant="outline" onClick={() => setQuery({})}>
              {t('kpiTargets.resetFilters')}
            </Button>
          </div>

          {targetsQuery.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {targetsQuery.error?.message ?? t('kpiTargets.failedToLoad')}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.scope')}</TableHead>
                  <TableHead>{t('kpiTargets.assigneeRole')}</TableHead>
                  <TableHead>{t('kpiTargets.projectScope')}</TableHead>
                  <TableHead>{t('common.period')}</TableHead>
                  <TableHead>{t('common.metrics')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('kpiTargets.updated')}</TableHead>
                  {canManage ? <TableHead className="w-24 text-right">{t('common.actions')}</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {targetsQuery.isPending ? (
                  Array.from({ length: 5 }).map((_, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Array.from({ length: canManage ? 8 : 7 }).map((__, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : targets.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canManage ? 8 : 7}
                      className="text-muted-foreground py-8 text-center text-sm"
                    >
                      {t('kpiTargets.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  targets.map((target) => (
                    <TableRow key={target.id}>
                      <TableCell>
                        <ScopeBadge scopeType={target.scopeType} />
                      </TableCell>
                      <TableCell className="min-w-44">
                        <p className="font-medium">{resolveAssigneeOrRoleName(target)}</p>
                      </TableCell>
                      <TableCell>
                        {target.projectId
                          ? projectById.get(target.projectId) ??
                            fallbackProjectById.get(target.projectId) ??
                            t('common.unknownProject')
                          : target.scopeType === 'ROLE'
                            ? t('common.noProjectOrgRoleTarget')
                            : target.scopeType === 'USER'
                              ? t('common.noProjectOrgUserTarget')
                              : t('common.noProject')}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{getPeriodLabel(target.period, t)}</p>
                        <p className="text-muted-foreground text-xs">
                          {formatDate(target.periodStart)} - {formatDate(target.periodEnd)}
                        </p>
                      </TableCell>
                      <TableCell className="min-w-60">
                        <TargetMetricsSummary target={target} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={target.status} />
                      </TableCell>
                      <TableCell>{formatDate(target.updatedAt)}</TableCell>
                      {canManage ? (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={isMutating}
                              onClick={() => {
                                setEditingTarget(target);
                                setFormOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={isMutating}
                              className="text-destructive hover:text-destructive"
                              onClick={() => void handleDelete(target)}
                            >
                              {deleteMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {canManage ? (
        <>
          <KpiTargetFormDialog
            open={formOpen}
            target={editingTarget}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            onOpenChange={(open) => {
              setFormOpen(open);
              if (!open) setEditingTarget(null);
            }}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
          />
          <KpiTargetCloneDialog
            open={cloneOpen}
            isSubmitting={cloneMutation.isPending}
            onOpenChange={setCloneOpen}
            onClone={handleClone}
          />
        </>
      ) : null}
    </div>
  );
}
