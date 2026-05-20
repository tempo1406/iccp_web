import { BaseService } from '@/services/base-service';
import type {
  PeriodicReportDispatchRequest,
  PeriodicReportHistoryDetail,
  PeriodicReportHistoryListQuery,
  PeriodicReportHistoryListResponse,
} from '../types/quarterly-report.types';

function appendQueryParam(
  params: URLSearchParams,
  key: string,
  value: string | number | undefined,
) {
  if (value === undefined || value === null || value === '') return;
  params.set(key, String(value));
}

export class PeriodicReportService extends BaseService {
  private readonly base = '/v1/analytics/reports/periodic';

  dispatch(
    body: PeriodicReportDispatchRequest,
  ): Promise<PeriodicReportHistoryDetail> {
    return this.post(`${this.base}/dispatch`, body);
  }

  getHistory(
    query: PeriodicReportHistoryListQuery = {},
  ): Promise<PeriodicReportHistoryListResponse> {
    const params = new URLSearchParams();
    appendQueryParam(params, 'page', query.page);
    appendQueryParam(params, 'limit', query.limit);
    appendQueryParam(params, 'sortBy', query.sortBy);
    appendQueryParam(params, 'sortOrder', query.sortOrder);
    appendQueryParam(params, 'periodKey', query.periodKey);
    appendQueryParam(params, 'frequency', query.frequency);
    appendQueryParam(params, 'status', query.status);
    const suffix = params.toString();
    return this.get(`${this.base}/history${suffix ? `?${suffix}` : ''}`);
  }

  getHistoryDetail(runId: string): Promise<PeriodicReportHistoryDetail> {
    return this.get(`${this.base}/history/${runId}`);
  }
}
