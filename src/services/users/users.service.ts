import { BaseService } from '@/services/base-service';
import type { UserProfileDto, UpdateMyProfileDto } from './types';

export class UsersService extends BaseService {
  private readonly base = '/v1/users';

  /**
   * getMe — GET /api/v1/users/me
   */
  getMe(): Promise<UserProfileDto> {
    return this.get<UserProfileDto>(`${this.base}/me`);
  }

  /**
   * updateMe — PUT /api/v1/users/me
   */
  updateMe(body: UpdateMyProfileDto): Promise<UserProfileDto> {
    return this.put<UserProfileDto, UpdateMyProfileDto>(`${this.base}/me`, body);
  }
}
