import { BaseService } from '@/services/base-service';
import type {
  CreateOrganizationDto,
  ListMembersQueryDto,
  ListMembersResponseData,
  MemberDetailsResponseData,
  OrganizationDto,
  UpdateMemberStatusDto,
} from './types';

export class OrganizationService extends BaseService {
  private readonly base = '/v1/organizations';
  private readonly memberManageBase = '/v1/organizations/manage/members';

  getMyOrgs(): Promise<OrganizationDto[]> {
    return this.get<OrganizationDto[]>(`${this.base}/my-orgs`);
  }

  createOrg(body: CreateOrganizationDto): Promise<void> {
    return this.post<void, CreateOrganizationDto>(this.base, body);
  }

  getMembers(params: ListMembersQueryDto = {}): Promise<ListMembersResponseData> {
    const searchParams = new URLSearchParams();

    if (typeof params.page === 'number') {
      searchParams.set('page', String(params.page));
    }
    if (typeof params.limit === 'number') {
      searchParams.set('limit', String(params.limit));
    }
    if (params.sortBy) {
      searchParams.set('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      searchParams.set('sortOrder', params.sortOrder);
    }
    if (params.search) {
      searchParams.set('search', params.search);
    }
    if (typeof params.isActive === 'boolean') {
      searchParams.set('isActive', String(params.isActive));
    }

    const query = searchParams.toString();
    const endpoint = query.length > 0 ? `${this.memberManageBase}?${query}` : this.memberManageBase;

    return this.get<ListMembersResponseData>(endpoint);
  }

  getMemberById(memberId: string): Promise<MemberDetailsResponseData> {
    return this.get<MemberDetailsResponseData>(`${this.memberManageBase}/${memberId}`);
  }

  removeMember(memberId: string): Promise<void> {
    return this.delete<void>(`${this.memberManageBase}/${memberId}`);
  }

  updateMemberStatus(memberId: string, body: UpdateMemberStatusDto): Promise<void> {
    return this.put<void, UpdateMemberStatusDto>(`${this.memberManageBase}/${memberId}/status`, body);
  }
}
