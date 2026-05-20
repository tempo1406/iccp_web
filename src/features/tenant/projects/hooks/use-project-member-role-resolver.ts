'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useServiceContext } from '@/lib/use-service-context';
import { projectKeys } from '../query/project-keys';
import { ProjectsService } from '../services/projects.service';
import type {
  ProjectMemberResponse,
  ProjectMemberRoleResponse,
  ProjectRoleResponse,
} from '../services/projects.service';

export function createProjectRoleNameById(
  roles: ProjectRoleResponse[],
): Map<string, string> {
  return new Map(roles.map((role) => [role.id, role.name]));
}

export function resolveFallbackProjectMemberRoleName(
  member: ProjectMemberResponse,
  roleNameById: Map<string, string>,
): string {
  const roleId = typeof member.roleId === 'string' ? member.roleId.trim() : '';
  if (roleId) {
    const mapped = roleNameById.get(roleId);
    if (mapped) return mapped;
  }

  if (typeof member.roleName === 'string' && member.roleName.trim().length > 0) {
    return member.roleName.trim();
  }

  if (typeof member.role === 'string' && member.role.trim().length > 0) {
    return member.role.trim();
  }

  return 'No role';
}

function resolveEmbeddedProjectMemberRoles(
  member: ProjectMemberResponse,
): ProjectMemberRoleResponse[] {
  if (Array.isArray(member.roles) && member.roles.length > 0) {
    return member.roles.filter(
      (role): role is ProjectMemberRoleResponse =>
        Boolean(role) &&
        typeof role.roleId === 'string' &&
        role.roleId.trim().length > 0,
    );
  }

  if (Array.isArray(member.roleIds) && member.roleIds.length > 0) {
    return member.roleIds
      .map((roleId, index) => ({
        id: `${member.userId}-${roleId}`,
        roleId,
        roleName: member.roleNames?.[index] ?? '',
      }))
      .filter((role) => role.roleId.trim().length > 0);
  }

  return [];
}

export function resolveAssignedProjectMemberRoleNames(
  member: ProjectMemberResponse,
  roleNameById: Map<string, string>,
  memberRolesByUserId: Map<string, ProjectMemberRoleResponse[]>,
): string[] {
  const assigned = memberRolesByUserId.has(member.userId)
    ? (memberRolesByUserId.get(member.userId) ?? [])
    : resolveEmbeddedProjectMemberRoles(member);

  if (assigned.length > 0) {
    return [
      ...new Set(
        assigned
          .map((item) => item.roleName?.trim() || roleNameById.get(item.roleId) || '')
          .filter((value) => value.length > 0),
      ),
    ];
  }

  const fallback = resolveFallbackProjectMemberRoleName(member, roleNameById);
  return fallback === 'No role' ? [] : [fallback];
}

export function useProjectMemberRolesByUserId(
  projectId: string,
  members: ProjectMemberResponse[],
  enabled = true,
): Map<string, ProjectMemberRoleResponse[]> {
  const ctx = useServiceContext();

  const memberRolesQueries = useQueries({
    queries: members.map((member) => ({
      queryKey: projectKeys.memberRoles(ctx.tenantId, projectId, member.userId),
      queryFn: () => new ProjectsService(ctx).getProjectMemberRoles(projectId, member.userId),
      enabled: enabled && Boolean(projectId) && Boolean(member.userId),
      staleTime: 30_000,
    })),
  });

  return useMemo(() => {
    const map = new Map<string, ProjectMemberRoleResponse[]>();
    members.forEach((member, index) => {
      map.set(member.userId, resolveEmbeddedProjectMemberRoles(member));
      const data = memberRolesQueries[index]?.data;
      if (Array.isArray(data)) {
        map.set(member.userId, data);
      }
    });
    return map;
  }, [memberRolesQueries, members]);
}
