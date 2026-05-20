'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useQueries } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppSelector } from '@/store/hooks';
import {
  useMyOrganizationRolesData,
  useOrganizationRolesData,
} from '@/features/tenant/organization-roles/hooks/use-organization-roles';
import { useOrganizationMembersData } from '@/features/tenant/organization-members/hooks/use-organization-members';
import { useProjectList } from '@/features/tenant/projects/query/use-project-core';
import { useServiceContext } from '@/lib/use-service-context';
import { OrganizationService } from '@/services/organizations/organization.service';
import { OrganizationRolesService } from '@/services/organization-roles';
import { ProjectsService } from '@/services/projects';
import { useMyKpiTargets } from '../../query/use-kpi-targets';
import type { KpiTargetResponse, KpiTargetScopeType } from '../../types/kpi.types';
import {
  formatDate,
  getPeriodLabel,
  ResolvedFromBadge,
  ScopeBadge,
  StatusBadge,
  TargetMetricsSummary,
} from './kpi-target-display';

function memberLabel(firstName?: string | null, lastName?: string | null, email?: string) {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  return name || email || '';
}

function memberNameFromUnknownPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') return '';

  const envelope = payload as { data?: unknown };
  const item =
    envelope.data && typeof envelope.data === 'object' && !Array.isArray(envelope.data)
      ? (envelope.data as Record<string, unknown>)
      : (payload as Record<string, unknown>);
  const user = item.user && typeof item.user === 'object' ? (item.user as Record<string, unknown>) : {};

  const firstName =
    item.user_firstName ?? item.user_first_name ?? item.firstName ?? item.first_name ?? user.firstName ?? user.first_name;
  const lastName =
    item.user_lastName ?? item.user_last_name ?? item.lastName ?? item.last_name ?? user.lastName ?? user.last_name;
  const fullName = item.fullName ?? item.displayName ?? item.name ?? user.fullName ?? user.displayName ?? user.name;
  const email = item.user_email ?? item.userEmail ?? item.email ?? user.email;

  if (typeof fullName === 'string' && fullName.trim().length > 0) {
    return fullName.trim();
  }

  return memberLabel(
    typeof firstName === 'string' ? firstName : null,
    typeof lastName === 'string' ? lastName : null,
    typeof email === 'string' ? email : undefined,
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

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.length > 0;
}

function getSourceScope(target: KpiTargetResponse): KpiTargetScopeType {
  return target.resolvedFrom?.scopeType ?? target.scopeType;
}

function getSourceProjectId(target: KpiTargetResponse) {
  return target.resolvedFrom?.projectId ?? target.projectId;
}

function getSourceRoleId(target: KpiTargetResponse) {
  return target.resolvedFrom?.roleId ?? target.roleId;
}

function getScopeContextLabel(target: KpiTargetResponse) {
  const scope = getSourceScope(target);

  if (scope === 'ROLE') return 'ROLE';
  if (scope === 'USER') return 'USER';
  return 'PROJECT';
}

export function MyKpiTargetsPage() {
  const t = useTranslations('analytics');
  const ctx = useServiceContext();
  const profile = useAppSelector((state) => state.user.profile);
  const targetsQuery = useMyKpiTargets();
  const projects = useProjectList({ page: 1, limit: 1000 });
  const roles = useOrganizationRolesData();
  const myOrgRoles = useMyOrganizationRolesData();

  const targets = useMemo(() => targetsQuery.data ?? [], [targetsQuery.data]);
  const projectNameById = useMemo(
    () => new Map((projects.data ?? []).map((project) => [project.id, project.name])),
    [projects.data],
  );
  const roleNameById = useMemo(
    () => new Map(roles.roles.map((role) => [role.id, role.name])),
    [roles.roles],
  );
  const myOrgRoleNameById = useMemo(
    () => new Map(myOrgRoles.memberRoles.map((role) => [role.roleId, role.roleName])),
    [myOrgRoles.memberRoles],
  );

  const unresolvedProjectIds = useMemo(
    () =>
      Array.from(
        new Set(
          targets
            .map(getSourceProjectId)
            .filter(isNonEmptyString)
            .filter((projectId) => !projectNameById.has(projectId)),
        ),
      ),
    [projectNameById, targets],
  );

  const projectRolePairs = useMemo(
    () =>
      Array.from(
        new Set(
          targets
            .filter((target) => getSourceScope(target) === 'PROJECT_ROLE')
            .map((target) => {
              const projectId = getSourceProjectId(target);
              const roleId = getSourceRoleId(target);
              return projectId && roleId ? `${projectId}:${roleId}` : '';
            })
            .filter(isNonEmptyString),
        ),
      ),
    [targets],
  );

  const unresolvedOrgRoleIds = useMemo(
    () =>
      Array.from(
        new Set(
          targets
            .filter((target) => getSourceScope(target) === 'ROLE')
            .map(getSourceRoleId)
            .filter(isNonEmptyString)
            .filter((roleId) => !roleNameById.has(roleId) && !myOrgRoleNameById.has(roleId)),
        ),
      ),
    [myOrgRoleNameById, roleNameById, targets],
  );

  const assignedByIds = useMemo(
    () => Array.from(new Set(targets.map((target) => target.assignedBy).filter(isNonEmptyString))),
    [targets],
  );
  const targetProjectIds = useMemo(
    () => Array.from(new Set(targets.map(getSourceProjectId).filter(isNonEmptyString))),
    [targets],
  );
  const organizationMembers = useOrganizationMembersData(
    { page: 1, limit: 1000 },
    assignedByIds.length > 0,
  );

  const projectDetailQueries = useQueries({
    queries: unresolvedProjectIds.map((projectId) => ({
      queryKey: ['my-kpi-targets', 'project-detail', ctx.tenantId, projectId],
      queryFn: () => new ProjectsService(ctx).getProjectById(projectId),
      enabled: Boolean(ctx.tenantId) && Boolean(projectId),
      staleTime: 60_000,
    })),
  });

  const projectRoleQueries = useQueries({
    queries: projectRolePairs.map((pair) => {
      const [projectId, roleId] = pair.split(':');
      return {
        queryKey: ['my-kpi-targets', 'project-role-detail', ctx.tenantId, projectId, roleId],
        queryFn: () => new ProjectsService(ctx).getProjectRoleById(projectId, roleId),
        enabled: Boolean(ctx.tenantId) && Boolean(projectId) && Boolean(roleId),
        staleTime: 60_000,
      };
    }),
  });

  const orgRoleDetailQueries = useQueries({
    queries: unresolvedOrgRoleIds.map((roleId) => ({
      queryKey: ['my-kpi-targets', 'org-role-detail', ctx.tenantId, roleId],
      queryFn: () => new OrganizationRolesService(ctx).getRoleById(roleId),
      enabled: Boolean(ctx.tenantId) && Boolean(roleId),
      staleTime: 60_000,
    })),
  });

  const assignedByQueries = useQueries({
    queries: assignedByIds.map((userId) => ({
      queryKey: ['my-kpi-targets', 'assigned-by', ctx.tenantId, userId],
      queryFn: () => new OrganizationService(ctx).getMemberById(userId),
      enabled: Boolean(ctx.tenantId) && Boolean(userId),
      staleTime: 60_000,
    })),
  });

  const targetProjectMemberQueries = useQueries({
    queries: targetProjectIds.map((projectId) => ({
      queryKey: ['my-kpi-targets', 'project-members', ctx.tenantId, projectId],
      queryFn: () => new ProjectsService(ctx).listProjectMembers(projectId, { page: 1, limit: 1000 }),
      enabled: Boolean(ctx.tenantId) && Boolean(projectId) && assignedByIds.length > 0,
      staleTime: 60_000,
    })),
  });

  const fallbackProjectNameById = useMemo(() => {
    const map = new Map<string, string>();
    projectDetailQueries.forEach((query, index) => {
      const projectId = unresolvedProjectIds[index];
      const projectName = nameFromUnknownPayload(query.data);
      if (projectId && projectName) map.set(projectId, projectName);
    });
    return map;
  }, [projectDetailQueries, unresolvedProjectIds]);

  const projectRoleNameByPair = useMemo(() => {
    const map = new Map<string, string>();
    projectRoleQueries.forEach((query, index) => {
      const pair = projectRolePairs[index];
      const roleName = nameFromUnknownPayload(query.data);
      if (pair && roleName) map.set(pair, roleName);
    });
    return map;
  }, [projectRolePairs, projectRoleQueries]);

  const fallbackOrgRoleNameById = useMemo(() => {
    const map = new Map<string, string>();
    orgRoleDetailQueries.forEach((query, index) => {
      const roleId = unresolvedOrgRoleIds[index];
      if (roleId && query.data?.name) map.set(roleId, query.data.name);
    });
    return map;
  }, [orgRoleDetailQueries, unresolvedOrgRoleIds]);

  const assignedByNameById = useMemo(() => {
    const map = new Map<string, string>();
    const currentUserName = memberLabel(profile?.firstName, profile?.lastName, profile?.email);
    if (profile?.id && currentUserName) {
      map.set(profile.id, currentUserName);
    }

    organizationMembers.members.forEach((member) => {
      const displayName = memberLabel(member.firstName, member.lastName, member.email);
      if (member.id && displayName) {
        map.set(member.id, displayName);
      }
      if (member.userId && displayName) {
        map.set(member.userId, displayName);
      }
    });

    targetProjectMemberQueries.forEach((query) => {
      if (!Array.isArray(query.data)) return;

      query.data.forEach((member) => {
        if (!member.userId) return;

        const displayName = memberNameFromUnknownPayload(member);
        if (displayName && displayName !== member.userId) {
          map.set(member.userId, displayName);
        }
      });
    });

    assignedByQueries.forEach((query, index) => {
      const userId = assignedByIds[index];
      if (!userId || !query.data) return;

      const displayName = memberNameFromUnknownPayload(query.data);
      if (displayName) map.set(userId, displayName);
    });

    return map;
  }, [
    assignedByIds,
    assignedByQueries,
    organizationMembers.members,
    profile,
    targetProjectMemberQueries,
  ]);

  const isLoadingAssignedBy = (userId: string) => {
    if (assignedByNameById.has(userId)) return false;
    const index = assignedByIds.indexOf(userId);
    return (
      organizationMembers.isPending ||
      targetProjectMemberQueries.some((query) => query.isPending) ||
      (index >= 0 && assignedByQueries[index]?.isPending)
    );
  };

  const resolveProjectName = (target: KpiTargetResponse) => {
    const projectId = getSourceProjectId(target);
    if (!projectId) {
      const scopeLabel = getScopeContextLabel(target);
      if (scopeLabel === 'ROLE') return t('common.noProjectOrgRoleTarget');
      if (scopeLabel === 'USER') return t('common.noProjectOrgUserTarget');
      return t('common.noProject');
    }
    return projectNameById.get(projectId) ?? fallbackProjectNameById.get(projectId) ?? t('common.unknownProject');
  };

  const resolveRoleName = (target: KpiTargetResponse) => {
    const roleId = getSourceRoleId(target);
    if (!roleId) return t('common.unknownRole');

    const projectId = getSourceProjectId(target);
    if (getSourceScope(target) === 'PROJECT_ROLE' && projectId) {
      return projectRoleNameByPair.get(`${projectId}:${roleId}`) ?? t('common.unknownRole');
    }

    return (
      roleNameById.get(roleId) ??
      myOrgRoleNameById.get(roleId) ??
      fallbackOrgRoleNameById.get(roleId) ??
      t('common.unknownRole')
    );
  };

  if (targetsQuery.isPending) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-56" />
        ))}
      </div>
    );
  }

  if (targetsQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {targetsQuery.error?.message ?? t('myKpi.failedToLoad')}
        </AlertDescription>
      </Alert>
    );
  }

  if (targets.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center">
          <p className="font-medium">{t('myKpi.emptyTitle')}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('myKpi.emptyDescription')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {targets.map((target) => (
        <Card key={target.id}>
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <ScopeBadge scopeType={target.scopeType} />
              <StatusBadge status={target.status} />
              <ResolvedFromBadge
                resolvedFrom={target.resolvedFrom}
                fallbackScope={target.scopeType}
              />
            </div>
            <CardTitle className="text-base">
              {getPeriodLabel(target.period, t)} KPI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-xs">{t('common.period')}</p>
                <p className="font-medium">
                  {formatDate(target.periodStart)} - {formatDate(target.periodEnd)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t('common.projectScope')}</p>
                <p className="font-medium">{resolveProjectName(target)}</p>
              </div>
              {getSourceRoleId(target) ? (
                <div>
                  <p className="text-muted-foreground text-xs">{t('common.roleSource')}</p>
                  <p className="font-medium">{resolveRoleName(target)}</p>
                </div>
              ) : null}
              {target.assignedBy ? (
                <div>
                  <p className="text-muted-foreground text-xs">{t('common.assignedBy')}</p>
                  <p className="font-medium">
                    {assignedByNameById.get(target.assignedBy) ??
                      (isLoadingAssignedBy(target.assignedBy) ? t('common.loadingUser') : t('common.unknownUser'))}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground text-xs">{t('common.targetMetrics')}</p>
              <TargetMetricsSummary target={target} />
            </div>

            {target.note ? (
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="text-muted-foreground text-xs">{t('common.note')}</p>
                <p>{target.note}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
