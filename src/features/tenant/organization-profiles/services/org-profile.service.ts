import { BaseService } from '@/services/base-service';
import type {
  OrgBranding,
  OrgProfileResponse,
  UpdateOrgBrandingBody,
  UpdateOrgGeneralBody,
} from '../types/org-profile.types';

export class OrgProfileService extends BaseService {
  private readonly base = '/v1/organizations/profile';

  getProfile(): Promise<OrgProfileResponse> {
    return this.get<OrgProfileResponse>(this.base);
  }

  updateGeneral(body: UpdateOrgGeneralBody): Promise<OrgProfileResponse> {
    return this.patch<OrgProfileResponse, UpdateOrgGeneralBody>(
      `${this.base}/general`,
      body,
    );
  }

  updateBranding(body: UpdateOrgBrandingBody): Promise<OrgProfileResponse> {
    return this.patch<OrgProfileResponse, UpdateOrgBrandingBody>(
      `${this.base}/branding`,
      body,
    );
  }

  /**
   * GET /v1/organizations/branding
   * Accessible by all members (chatbot.use permission).
   * Returns only the branding subset — used to inject CSS vars for all users.
   */
  getBranding(): Promise<OrgBranding> {
    return this.get<OrgBranding>('/v1/organizations/profile/branding');
  }
}
