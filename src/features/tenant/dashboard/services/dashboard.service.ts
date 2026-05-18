import { BaseService } from '@/services/base-service';
import type {
  TenantDashboardOverviewQuery,
  TenantDashboardResponse,
} from '../types/dashboard.types';

export class DashboardService extends BaseService {
  private readonly base = '/v1/dashboard';

  overview(query: TenantDashboardOverviewQuery): Promise<TenantDashboardResponse> {
    const search = new URLSearchParams({
      adminYear: String(query.adminYear),
      adminQuarter: String(query.adminQuarter),
      memberRange: query.memberRange,
    });

    return this.get(`${this.base}/overview?${search.toString()}`);
  }
}
