export interface NotificationSender {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  message: string;
  content: string | null;
  campaignId: string | null;
  read: boolean;
  sender: NotificationSender | null;
  data?: Record<string, unknown>;
  createdAt: string;
}
