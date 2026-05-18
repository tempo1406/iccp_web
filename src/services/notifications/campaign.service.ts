import { BaseService } from '@/services/base-service';
import type { CampaignDto, CampaignsListResult, CreateCampaignDto } from './types';

export interface CampaignsListQuery {
  page?: number;
  limit?: number;
  status?: string;
}

export class CampaignService extends BaseService {
  private readonly base = '/v1/organizations/manage/notifications/campaigns';

  list(query: CampaignsListQuery = {}): Promise<CampaignsListResult> {
    const qs = new URLSearchParams({
      page: String(query.page ?? 1),
      limit: String(query.limit ?? 20),
    });
    if (query.status) qs.set('status', query.status);
    return this.get<CampaignsListResult>(`${this.base}?${qs.toString()}`);
  }

  getById(id: string): Promise<CampaignDto> {
    return this.get<CampaignDto>(`${this.base}/${id}`);
  }

  create(body: CreateCampaignDto): Promise<void> {
    return this.post<void, CreateCampaignDto>(this.base, body);
  }
}
