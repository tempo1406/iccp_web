export type CampaignStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type CampaignTargetType = 'ORG_ALL' | 'ORG_ROLE' | 'SPECIFIC_USERS';

export interface CampaignDto {
  id: string;
  senderId: string;
  title: string;
  message: string;
  content: string;
  type: string;
  targetType: CampaignTargetType;
  targetOrgId: string | null;
  targetRoleIds: string[] | null;
  targetUserIds: string[] | null;
  sendEmail: boolean;
  status: CampaignStatus;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignsListResult {
  data: CampaignDto[];
  total: number;
}
