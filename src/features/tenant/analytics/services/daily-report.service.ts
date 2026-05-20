import { BaseService } from '@/services/base-service';
import type {
  AddDailyReportCommentRequest,
  DailyReportCommentResponse,
  DailyReportListResponse,
  DailyReportQuery,
  DailyReportResponse,
  DailyReportTeamQuery,
  UpdateDailyReportRequest,
} from '../types/daily-report.types';
import { DEFAULT_DAILY_REPORT_LIST_META } from '../types/daily-report.types';

function appendQueryParam(
  params: URLSearchParams,
  key: string,
  value: string | number | undefined,
) {
  if (value === undefined || value === null || value === '') return;
  params.set(key, String(value));
}

export class DailyReportService extends BaseService {
  getMyReport(projectId: string, query: DailyReportQuery = {}): Promise<DailyReportResponse> {
    const params = new URLSearchParams();
    appendQueryParam(params, 'date', query.date);
    const suffix = params.toString();
    return this.get(`/v1/projects/${projectId}/daily-reports/me${suffix ? `?${suffix}` : ''}`);
  }

  generateMyReport(projectId: string, query: DailyReportQuery = {}): Promise<DailyReportResponse> {
    const params = new URLSearchParams();
    appendQueryParam(params, 'date', query.date);
    const suffix = params.toString();
    return this.post(
      `/v1/projects/${projectId}/daily-reports/me/generate${suffix ? `?${suffix}` : ''}`,
    );
  }

  updateReport(
    projectId: string,
    reportId: string,
    body: UpdateDailyReportRequest,
  ): Promise<DailyReportResponse> {
    return this.put(`/v1/projects/${projectId}/daily-reports/${reportId}`, body);
  }

  submitReport(projectId: string, reportId: string): Promise<DailyReportResponse> {
    return this.post(`/v1/projects/${projectId}/daily-reports/${reportId}/submit`);
  }

  getReportComments(projectId: string, reportId: string): Promise<DailyReportCommentResponse[]> {
    return this.get(`/v1/projects/${projectId}/daily-reports/${reportId}/comments`);
  }

  addReportComment(
    projectId: string,
    reportId: string,
    body: AddDailyReportCommentRequest,
  ): Promise<DailyReportCommentResponse> {
    return this.post(`/v1/projects/${projectId}/daily-reports/${reportId}/comments`, body);
  }

  markReportSeen(projectId: string, reportId: string): Promise<DailyReportResponse> {
    return this.post(`/v1/projects/${projectId}/daily-reports/${reportId}/mark-seen`);
  }

  getTeamReports(
    projectId: string,
    query: DailyReportTeamQuery = {},
  ): Promise<DailyReportListResponse> {
    const params = new URLSearchParams();
    appendQueryParam(params, 'date', query.date);
    appendQueryParam(params, 'userId', query.userId);
    appendQueryParam(params, 'status', query.status);
    appendQueryParam(params, 'search', query.search);
    appendQueryParam(params, 'page', query.page);
    appendQueryParam(params, 'limit', query.limit);
    appendQueryParam(params, 'sortBy', query.sortBy);
    appendQueryParam(params, 'sortOrder', query.sortOrder);
    const suffix = params.toString();
    return this.get<DailyReportListResponse | DailyReportResponse[]>(
      `/v1/projects/${projectId}/daily-reports${suffix ? `?${suffix}` : ''}`,
    ).then((response) => {
      if (!Array.isArray(response)) return response;

      return {
        data: response,
        meta: {
          ...DEFAULT_DAILY_REPORT_LIST_META,
          total: response.length,
          limit: response.length || DEFAULT_DAILY_REPORT_LIST_META.limit,
        },
      };
    });
  }
}
