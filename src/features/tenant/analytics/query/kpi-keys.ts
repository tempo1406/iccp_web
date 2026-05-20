import type {
  KpiTargetListQuery,
  OrgKpiMembersQuery,
  ProjectKpiMembersQuery,
  ProjectKpiSelfQuery,
} from '../types/kpi.types';

export const kpiKeys = {
  // ─── Org ─────────────────────────────────────────────────────────────────
  orgRoot: (tenantId: string | null | undefined) =>
    ['kpi', 'org', tenantId] as const,

  orgOverview: (tenantId: string | null | undefined) =>
    ['kpi', 'org', tenantId, 'overview'] as const,

  orgMembers: (tenantId: string | null | undefined, query: OrgKpiMembersQuery) =>
    ['kpi', 'org', tenantId, 'members', query] as const,

  orgMemberDetail: (tenantId: string | null | undefined, userId: string) =>
    ['kpi', 'org', tenantId, 'members', userId] as const,

  // ─── Project ─────────────────────────────────────────────────────────────
  projectTenantRoot: (tenantId: string | null | undefined) =>
    ['kpi', 'project', tenantId] as const,

  projectRoot: (tenantId: string | null | undefined, projectId: string) =>
    ['kpi', 'project', tenantId, projectId] as const,

  projectOverview: (tenantId: string | null | undefined, projectId: string) =>
    ['kpi', 'project', tenantId, projectId, 'overview'] as const,

  projectMembers: (
    tenantId: string | null | undefined,
    projectId: string,
    query: ProjectKpiMembersQuery,
  ) => ['kpi', 'project', tenantId, projectId, 'members', query] as const,

  projectMe: (
    tenantId: string | null | undefined,
    projectId: string,
    query: ProjectKpiSelfQuery,
  ) => ['kpi', 'project', tenantId, projectId, 'me', query] as const,

  projectMemberDetail: (
    tenantId: string | null | undefined,
    projectId: string,
    userId: string,
  ) => ['kpi', 'project', tenantId, projectId, 'members', userId] as const,

  targetRoot: (tenantId: string | null | undefined) =>
    ['kpi', 'targets', tenantId] as const,

  targetList: (tenantId: string | null | undefined, query: KpiTargetListQuery) =>
    ['kpi', 'targets', tenantId, 'list', query] as const,

  targetMine: (tenantId: string | null | undefined) =>
    ['kpi', 'targets', tenantId, 'me'] as const,

  targetDetail: (tenantId: string | null | undefined, id: string) =>
    ['kpi', 'targets', tenantId, 'detail', id] as const,
};
