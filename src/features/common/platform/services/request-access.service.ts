import { BaseService } from '@/services/base-service';

export interface SubmitRequestAccessBody {
  email: string;
  source?: string;
  pageUrl?: string;
}

export interface RequestAccessDto {
  accepted: boolean;
  submittedAt: string;
  source?: string;
}

export class RequestAccessService extends BaseService {
  private readonly base = '/v1/platform/request-access';

  submit(body: SubmitRequestAccessBody): Promise<RequestAccessDto> {
    return this.post<RequestAccessDto, SubmitRequestAccessBody>(this.base, body);
  }
}
