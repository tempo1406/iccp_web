/**
 * src/services/features/analytics.service.ts
 */
import { BaseService } from '@/services/base-service';

export interface AnalyticsSummaryDto {
  totalQueries: number;
  totalDocuments: number;
  avgResponseTimeMs: number;
  successRate: number;
}

export interface TimeSeriesPoint {
  date: string;
  count: number;
}
export interface TopDocumentDto {
  documentId: string;
  fileName: string;
  queryCount: number;
}

export class AnalyticsService extends BaseService {
  private readonly base = '/analytics';

  summary(params: { from: string; to: string }): Promise<AnalyticsSummaryDto> {
    const qs = new URLSearchParams({ from: params.from, to: params.to });
    return this.get(`${this.base}/summary?${qs}`);
  }

  queriesOverTime(params: {
    from: string;
    to: string;
    granularity?: string;
  }): Promise<{ data: TimeSeriesPoint[] }> {
    const qs = new URLSearchParams({
      from: params.from,
      to: params.to,
      granularity: params.granularity ?? 'day',
    });
    return this.get(`${this.base}/queries-over-time?${qs}`);
  }

  topDocuments(params: { limit?: number }): Promise<{ data: TopDocumentDto[] }> {
    const qs = new URLSearchParams({ limit: String(params.limit ?? 5) });
    return this.get(`${this.base}/top-documents?${qs}`);
  }
}
