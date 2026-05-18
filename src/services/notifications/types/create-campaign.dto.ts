import type { CampaignTargetType } from './campaign.dto';

export interface CreateCampaignDto {
  title: string;
  message: string;
  content: string;
  type?: string;
  targetType: CampaignTargetType;
  targetRoleIds?: string[];
  targetUserIds?: string[];
  sendEmail?: boolean;
}
