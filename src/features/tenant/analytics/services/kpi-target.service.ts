import { BaseService } from '@/services/base-service';
import type {
  CloneKpiTargetBody,
  KpiTargetApiResponse,
  KpiTargetListQuery,
  KpiTargetResponse,
  UpdateKpiTargetBody,
  UpsertKpiTargetBody,
} from '../types/kpi.types';

function toQueryString(params: KpiTargetListQuery = {}) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

export class KpiTargetService extends BaseService {
  private readonly base = '/v1/kpi-targets';

  bulkAssign(
    body: UpsertKpiTargetBody,
  ): Promise<KpiTargetApiResponse<KpiTargetResponse[]>> {
    return this.post<KpiTargetApiResponse<KpiTargetResponse[]>, UpsertKpiTargetBody>(
      this.base,
      body,
      { returnEnvelope: true },
    );
  }

  clone(
    body: CloneKpiTargetBody,
  ): Promise<KpiTargetApiResponse<KpiTargetResponse[]>> {
    return this.post<KpiTargetApiResponse<KpiTargetResponse[]>, CloneKpiTargetBody>(
      `${this.base}/clone`,
      body,
      { returnEnvelope: true },
    );
  }

  list(params: KpiTargetListQuery = {}): Promise<KpiTargetResponse[]> {
    return this.get<KpiTargetResponse[]>(`${this.base}${toQueryString(params)}`);
  }

  mine(): Promise<KpiTargetResponse[]> {
    return this.get<KpiTargetResponse[]>(`${this.base}/me`);
  }

  detail(id: string): Promise<KpiTargetResponse> {
    return this.get<KpiTargetResponse>(`${this.base}/${id}`);
  }

  update(
    id: string,
    body: UpdateKpiTargetBody,
  ): Promise<KpiTargetApiResponse<KpiTargetResponse>> {
    return this.patch<KpiTargetApiResponse<KpiTargetResponse>, UpdateKpiTargetBody>(
      `${this.base}/${id}`,
      body,
      { returnEnvelope: true },
    );
  }

  remove(id: string): Promise<void> {
    return this.delete<void>(`${this.base}/${id}`);
  }
}
