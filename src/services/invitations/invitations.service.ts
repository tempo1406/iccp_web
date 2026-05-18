import { BaseService } from '@/services/base-service';
import type {
  AcceptInvitationDto,
  CreateInvitationsDto,
  InvitationAnalyticsDto,
  InvitationDetailDto,
  ListInvitationsQueryDto,
  ListInvitationsResponseData,
} from './types/invitation.types';

export class InvitationsService extends BaseService {
  private readonly base = '/v1/organizations';

  list(params: ListInvitationsQueryDto = {}): Promise<ListInvitationsResponseData> {
    const qs = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
      sortBy: params.sortBy ?? 'createdAt',
      sortOrder: params.sortOrder ?? 'DESC',
    });

    if (params.status) {
      qs.set('status', params.status);
    }

    return this.get<ListInvitationsResponseData>(`${this.base}/invitations?${qs}`);
  }

  analytics(): Promise<InvitationAnalyticsDto> {
    return this.get<InvitationAnalyticsDto>(`${this.base}/invitations/analytics`);
  }

  byId(id: string): Promise<InvitationDetailDto> {
    return this.get<InvitationDetailDto>(`${this.base}/invitations/${id}`);
  }

  create(body: CreateInvitationsDto): Promise<void> {
    return this.post<void, CreateInvitationsDto>(`${this.base}/invitations`, body);
  }

  accept(body: AcceptInvitationDto): Promise<void> {
    return this.post<void, AcceptInvitationDto>(`${this.base}/invitations/accept`, body);
  }

  resend(id: string): Promise<InvitationDetailDto> {
    return this.post<InvitationDetailDto>(`${this.base}/invitations/${id}/resend`);
  }

  cancel(id: string): Promise<void> {
    return this.patch<void>(`${this.base}/invitations/${id}/cancel`);
  }
}
