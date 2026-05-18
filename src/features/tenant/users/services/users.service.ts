/**
 * src/services/features/users.service.ts
 */
import { BaseService } from '@/services/base-service';

export interface TenantMemberDto {
  id: string;
  userId: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

export interface UserListResponse {
  data: TenantMemberDto[];
  total: number;
  page: number;
  limit: number;
}

export class UsersService extends BaseService {
  private readonly base = '/users';

  /** GET /users?page=1&limit=20&search=... */
  list(
    params: { page?: number; limit?: number; search?: string } = {},
  ): Promise<UserListResponse> {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.search) qs.set('search', params.search);
    return this.get<UserListResponse>(`${this.base}?${qs}`);
  }

  /** GET /users/:id */
  byId(id: string): Promise<TenantMemberDto | null> {
    return this.get<TenantMemberDto | null>(`${this.base}/${id}`);
  }

  /** POST /users/invite */
  invite(body: {
    email: string;
    role: string;
  }): Promise<{ success: boolean; inviteId: string }> {
    return this.post(`${this.base}/invite`, body);
  }

  /** DELETE /users/:id */
  remove(id: string): Promise<{ success: boolean }> {
    return this.delete(`${this.base}/${id}`);
  }
}
