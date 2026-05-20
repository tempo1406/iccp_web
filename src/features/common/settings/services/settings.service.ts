/**
 * src/services/features/settings.service.ts
 */
import { BaseService } from '@/services/base-service';

export interface UserProfileDto {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  timezone: string;
  bio?: string;
}
export interface TenantSettingsDto {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  customDomain?: string;
  allowedEmailDomains: string[];
  maxUsers: number;
}

export class SettingsService extends BaseService {
  private readonly base = '/settings';

  getProfile(): Promise<UserProfileDto> {
    return this.get(`${this.base}/profile`);
  }
  updateProfile(
    body: Partial<Omit<UserProfileDto, 'id' | 'email'>>,
  ): Promise<{ success: boolean }> {
    return this.patch(`${this.base}/profile`, body);
  }

  changePassword(body: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean }> {
    return this.post(`${this.base}/password`, body);
  }

  getTenantSettings(): Promise<TenantSettingsDto> {
    return this.get(`${this.base}/tenant`);
  }
  updateTenantSettings(body: Partial<TenantSettingsDto>): Promise<{ success: boolean }> {
    return this.patch(`${this.base}/tenant`, body);
  }
}
