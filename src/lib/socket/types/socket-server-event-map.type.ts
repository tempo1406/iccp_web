import type { CampaignProgressPayload } from './campaign-progress-payload.type';
import type {
  ChatMessageAttachmentChangePayload,
  ChatMessageAttachmentPreviewUpdatedPayload,
  ChatMessageCreatedPayload,
  ChatMessageDeletedPayload,
  ChatMessageLinkPreviewUpdatedPayload,
  ChatMessagePinUpdatedPayload,
  ChatMessageReactionUpdatedPayload,
  ChatMessageUpdatedPayload,
  ChatPersonalInboxRoomReadUpdatedPayload,
  ChatPresenceUpdatedPayload,
  ChatRoomReadStateUpdatedPayload,
  ChatRoomInvitationCreatedPayload,
  ChatRoomMemberJoinedPayload,
  ChatRoomMemberRemovedPayload,
  ChatRoomMemberRoleUpdatedPayload,
  ChatRoomUpdatedPayload,
  ChatRoomVisibilityChangedPayload,
  ChatTypingStartedPayload,
  ChatTypingStoppedPayload,
} from './chat-realtime-payload.type';
import type { NotificationRealtimePayload } from './notification-realtime-payload.type';
import type {
  ProjectMemberInvitePayload,
  ProjectMemberPayload,
  ProjectMemberRemovedPayload,
  ProjectRoleDeletedPayload,
  ProjectRoleMemberAssignmentPayload,
  ProjectRolePayload,
  ProjectStatusPayload,
  ProjectTaskAttachmentPayload,
  ProjectTaskCommentPayload,
  ProjectTaskDeletedPayload,
  ProjectTaskPayload,
  ProjectTaskTagPayload,
  ProjectUpdatedPayload,
} from './project-realtime-payload.type';
import type { SocketExceptionPayload } from './socket-exception-payload.type';
import type { TicketRequestUpdatedRealtimePayload } from './ticket-request-updated-realtime-payload.type';
import type {
  BillingPaymentSuccessPayload,
  BillingPaymentFailedPayload,
  BillingSubscriptionUpdatedPayload,
  BillingSubscriptionRenewalReminderPayload,
} from './billing-realtime-payload.type';
import { SOCKET_EVENTS } from '@/common/constant/socket.constant';

export interface SocketServerEventMap {
  [SOCKET_EVENTS.NOTIFICATION_NEW]: NotificationRealtimePayload;
  [SOCKET_EVENTS.NOTIFICATION_UPDATED]: NotificationRealtimePayload;
  [SOCKET_EVENTS.CAMPAIGN_PROGRESS]: CampaignProgressPayload;
  [SOCKET_EVENTS.TICKET_REQUEST_UPDATED]: TicketRequestUpdatedRealtimePayload;

  [SOCKET_EVENTS.CHAT_MESSAGE_CREATED]: ChatMessageCreatedPayload;
  [SOCKET_EVENTS.CHAT_MESSAGE_UPDATED]: ChatMessageUpdatedPayload;
  [SOCKET_EVENTS.CHAT_MESSAGE_DELETED]: ChatMessageDeletedPayload;
  [SOCKET_EVENTS.CHAT_MESSAGE_REACTION_UPDATED]: ChatMessageReactionUpdatedPayload;
  [SOCKET_EVENTS.CHAT_MESSAGE_PIN_UPDATED]: ChatMessagePinUpdatedPayload;
  [SOCKET_EVENTS.CHAT_MESSAGE_ATTACHMENT_ADDED]: ChatMessageAttachmentChangePayload;
  [SOCKET_EVENTS.CHAT_MESSAGE_ATTACHMENT_REMOVED]: ChatMessageAttachmentChangePayload;
  [SOCKET_EVENTS.CHAT_MESSAGE_ATTACHMENT_PREVIEW_UPDATED]: ChatMessageAttachmentPreviewUpdatedPayload;
  [SOCKET_EVENTS.CHAT_MESSAGE_LINK_PREVIEW_UPDATED]: ChatMessageLinkPreviewUpdatedPayload;
  [SOCKET_EVENTS.CHAT_TYPING_STARTED]: ChatTypingStartedPayload;
  [SOCKET_EVENTS.CHAT_TYPING_START]: ChatTypingStartedPayload;
  [SOCKET_EVENTS.CHAT_TYPING_STOPPED]: ChatTypingStoppedPayload;
  [SOCKET_EVENTS.CHAT_TYPING_STOP]: ChatTypingStoppedPayload;
  [SOCKET_EVENTS.CHAT_ROOM_INVITATION_CREATED]: ChatRoomInvitationCreatedPayload;
  [SOCKET_EVENTS.CHAT_ROOM_MEMBER_JOINED]: ChatRoomMemberJoinedPayload;
  [SOCKET_EVENTS.CHAT_ROOM_VISIBILITY_CHANGED]: ChatRoomVisibilityChangedPayload;
  [SOCKET_EVENTS.CHAT_ROOM_MEMBER_ROLE_UPDATED]: ChatRoomMemberRoleUpdatedPayload;
  [SOCKET_EVENTS.CHAT_ROOM_MEMBER_REMOVED]: ChatRoomMemberRemovedPayload;
  [SOCKET_EVENTS.CHAT_ROOM_READ_STATE_UPDATED]: ChatRoomReadStateUpdatedPayload;
  [SOCKET_EVENTS.CHAT_PERSONAL_INBOX_ROOM_READ_UPDATED]: ChatPersonalInboxRoomReadUpdatedPayload;
  [SOCKET_EVENTS.CHAT_ROOM_UPDATED]: ChatRoomUpdatedPayload;
  [SOCKET_EVENTS.CHAT_PRESENCE_UPDATED]: ChatPresenceUpdatedPayload;

  [SOCKET_EVENTS.CAMPAIGN_PROGRESS]: CampaignProgressPayload;
  [SOCKET_EVENTS.BILLING_PAYMENT_SUCCESS]: BillingPaymentSuccessPayload;
  [SOCKET_EVENTS.BILLING_PAYMENT_FAILED]: BillingPaymentFailedPayload;
  [SOCKET_EVENTS.BILLING_SUBSCRIPTION_UPDATED]: BillingSubscriptionUpdatedPayload;
  [SOCKET_EVENTS.BILLING_SUBSCRIPTION_RENEWAL_REMINDER]: BillingSubscriptionRenewalReminderPayload;
  [SOCKET_EVENTS.PROJECT_UPDATED]: ProjectUpdatedPayload;
  [SOCKET_EVENTS.PROJECT_TASK_CREATED]: ProjectTaskPayload;
  [SOCKET_EVENTS.PROJECT_TASK_UPDATED]: ProjectTaskPayload;
  [SOCKET_EVENTS.PROJECT_TASK_DELETED]: ProjectTaskDeletedPayload;
  [SOCKET_EVENTS.PROJECT_TASK_STATUS_CHANGED]: ProjectTaskPayload;
  [SOCKET_EVENTS.PROJECT_TASK_COMMENT_CREATED]: ProjectTaskCommentPayload;
  [SOCKET_EVENTS.PROJECT_TASK_COMMENT_REACTION_UPDATED]: ProjectTaskCommentPayload;
  [SOCKET_EVENTS.PROJECT_TASK_TAG_ADDED]: ProjectTaskTagPayload;
  [SOCKET_EVENTS.PROJECT_TASK_TAG_REMOVED]: ProjectTaskTagPayload;
  [SOCKET_EVENTS.PROJECT_TASK_ATTACHMENT_ADDED]: ProjectTaskAttachmentPayload;
  [SOCKET_EVENTS.PROJECT_TASK_ATTACHMENT_REMOVED]: ProjectTaskAttachmentPayload;
  [SOCKET_EVENTS.PROJECT_STATUS_CREATED]: ProjectStatusPayload;
  [SOCKET_EVENTS.PROJECT_STATUS_UPDATED]: ProjectStatusPayload;
  [SOCKET_EVENTS.PROJECT_STATUS_DELETED]: ProjectStatusPayload;
  [SOCKET_EVENTS.PROJECT_MEMBER_INVITED]: ProjectMemberInvitePayload;
  [SOCKET_EVENTS.PROJECT_MEMBER_JOINED]: ProjectMemberPayload;
  [SOCKET_EVENTS.PROJECT_MEMBER_UPDATED]: ProjectMemberPayload;
  [SOCKET_EVENTS.PROJECT_MEMBER_REMOVED]: ProjectMemberRemovedPayload;
  [SOCKET_EVENTS.PROJECT_ROLE_CREATED]: ProjectRolePayload;
  [SOCKET_EVENTS.PROJECT_ROLE_UPDATED]: ProjectRolePayload;
  [SOCKET_EVENTS.PROJECT_ROLE_DELETED]: ProjectRoleDeletedPayload;
  [SOCKET_EVENTS.PROJECT_ROLE_PERMISSIONS_UPDATED]: ProjectRolePayload;
  [SOCKET_EVENTS.PROJECT_ROLE_MEMBER_ASSIGNMENT_UPDATED]: ProjectRoleMemberAssignmentPayload;

  [SOCKET_EVENTS.EXCEPTION]: SocketExceptionPayload;
}

export type SocketServerEventName = keyof SocketServerEventMap;
