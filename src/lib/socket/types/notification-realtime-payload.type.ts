export interface NotificationRealtimeSender {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface NotificationRealtimeData {
  eventType?: string;
  module?: string;
  mentionType?: 'user' | 'channel' | 'group' | 'here' | string;
  specialMentionType?: 'channel' | 'everyone' | 'here' | string;
  realtimeDeliveryMode?: 'normal' | 'silent' | string;
  realtimeDeliveryReason?: string;
  [key: string]: unknown;
}

export interface NotificationRealtimePayload {
  id: string;
  type: string;
  title: string;
  message: string;
  content?: string | null;
  campaignId?: string | null;
  sender?: NotificationRealtimeSender | null;
  read?: boolean;
  isRead?: boolean;
  data?: NotificationRealtimeData;
  createdAt: string;
}
