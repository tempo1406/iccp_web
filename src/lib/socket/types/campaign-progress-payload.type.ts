import type { CampaignStatus } from '@/services/notifications/types';

export interface CampaignProgressPayload {
  campaignId: string;
  status: CampaignStatus;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
}
