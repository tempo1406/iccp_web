import { BaseService } from '@/services/base-service';
import type {
  OrgKpiOverviewResponse,
  OrgKpiMembersQuery,
  OrgKpiMembersResponse,
  OrgMemberKpiDetailResponse,
  ProjectKpiOverviewResponse,
  ProjectKpiMembersQuery,
  ProjectKpiSelfQuery,
  ProjectMemberKpiResponse,
  ProjectMemberKpiDetailResponse,
} from '../types/kpi.types';

export class KpiService extends BaseService {
  // ─── Org KPI ───────────────────────────────────────────────────────────────

  getOrgOverview(): Promise<OrgKpiOverviewResponse> {
    return this.get('/v1/org-kpi/overview');
  }

  getOrgMembers(query: OrgKpiMembersQuery = {}): Promise<OrgKpiMembersResponse> {
    const qs = new URLSearchParams();
    if (query.userId) qs.set('userId', query.userId);
    if (query.sortBy) qs.set('sortBy', query.sortBy);
    if (query.sortOrder) qs.set('sortOrder', query.sortOrder);
    if (query.page) qs.set('page', String(query.page));
    if (query.limit) qs.set('limit', String(query.limit));
    if (query.dateFrom) qs.set('dateFrom', query.dateFrom);
    if (query.dateTo) qs.set('dateTo', query.dateTo);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return this.get(`/v1/org-kpi/members${suffix}`);
  }

  getOrgMemberDetail(userId: string): Promise<OrgMemberKpiDetailResponse> {
    return this.get(`/v1/org-kpi/members/${userId}`);
  }

  // ─── Project KPI ───────────────────────────────────────────────────────────

  getProjectOverview(projectId: string): Promise<ProjectKpiOverviewResponse> {
    return this.get(`/v1/projects/${projectId}/kpi/overview`);
  }

  getProjectMembers(
    projectId: string,
    query: ProjectKpiMembersQuery = {},
  ): Promise<ProjectMemberKpiResponse[]> {
    const qs = new URLSearchParams();
    if (query.userId) qs.set('userId', query.userId);
    if (query.sortBy) qs.set('sortBy', query.sortBy);
    if (query.sortOrder) qs.set('sortOrder', query.sortOrder);
    if (query.dateFrom) qs.set('dateFrom', query.dateFrom);
    if (query.dateTo) qs.set('dateTo', query.dateTo);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return this.get(`/v1/projects/${projectId}/kpi/members${suffix}`);
  }

  getProjectMyKpi(
    projectId: string,
    query: ProjectKpiSelfQuery = {},
  ): Promise<ProjectMemberKpiDetailResponse> {
    const qs = new URLSearchParams();
    if (query.dateFrom) qs.set('dateFrom', query.dateFrom);
    if (query.dateTo) qs.set('dateTo', query.dateTo);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return this.get(`/v1/projects/${projectId}/kpi/me${suffix}`);
  }

  getProjectMemberDetail(
    projectId: string,
    userId: string,
  ): Promise<ProjectMemberKpiDetailResponse> {
    return this.get(`/v1/projects/${projectId}/kpi/members/${userId}`);
  }
}
