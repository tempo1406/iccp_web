/**
 * Socket namespaces. Keep these values aligned with backend gateway namespaces.
 */
export const SOCKET_NAMESPACES = {
  NOTIFICATIONS: 'notifications',
  CHAT: 'chat',
  // CHAT: 'chat',
  BILLING: 'billing',
  PROJECTS: 'projects',
} as const;

export type SocketNamespace = (typeof SOCKET_NAMESPACES)[keyof typeof SOCKET_NAMESPACES];

/**
 * Socket event names. Keep these values aligned with backend WsEvents.
 */
export const SOCKET_EVENTS = {
  // Notifications namespace
  NOTIFICATION_NEW: 'notification.new',
  NOTIFICATION_UPDATED: 'notification.updated',
  CAMPAIGN_PROGRESS: 'campaign.progress',
  // Chat client events (emit from FE)
  CHAT_ROOM_SUBSCRIBE: 'chat.room.subscribe',
  CHAT_ROOM_UNSUBSCRIBE: 'chat.room.unsubscribe',
  CHAT_TYPING_START: 'chat.typing.start',
  CHAT_TYPING_STOP: 'chat.typing.stop',

  // Chat server events (listen on FE)
  CHAT_MESSAGE_CREATED: 'chat.message.created',
  CHAT_MESSAGE_UPDATED: 'chat.message.updated',
  CHAT_MESSAGE_DELETED: 'chat.message.deleted',
  CHAT_MESSAGE_REACTION_UPDATED: 'chat.message.reaction.updated',
  CHAT_MESSAGE_PIN_UPDATED: 'chat.message.pin.updated',
  CHAT_MESSAGE_ATTACHMENT_ADDED: 'chat.message.attachment.added',
  CHAT_MESSAGE_ATTACHMENT_REMOVED: 'chat.message.attachment.removed',
  CHAT_MESSAGE_ATTACHMENT_PREVIEW_UPDATED: 'chat.message.attachment-preview.updated',
  CHAT_MESSAGE_LINK_PREVIEW_UPDATED: 'chat.message.link-preview.updated',
  CHAT_TYPING_STARTED: 'chat.typing.started',
  CHAT_TYPING_STOPPED: 'chat.typing.stopped',
  CHAT_ROOM_INVITATION_CREATED: 'chat.room.invitation.created',
  CHAT_ROOM_MEMBER_JOINED: 'chat.room.member.joined',
  CHAT_ROOM_VISIBILITY_CHANGED: 'chat.room.visibility.changed',
  CHAT_ROOM_MEMBER_ROLE_UPDATED: 'chat.room.member.role.updated',
  CHAT_ROOM_MEMBER_REMOVED: 'chat.room.member.removed',
  CHAT_ROOM_READ_STATE_UPDATED: 'chat.room.read-state.updated',
  CHAT_PERSONAL_INBOX_ROOM_READ_UPDATED: 'chat.personal-inbox.room-read.updated',
  CHAT_ROOM_UPDATED: 'chat.room.updated',
  CHAT_PRESENCE_UPDATED: 'chat.presence.updated',

  // Internal/shared
  TICKET_REQUEST_UPDATED: 'ticket-request.updated',

  PROJECT_UPDATED: 'project.updated',
  PROJECT_TASK_CREATED: 'project.task.created',
  PROJECT_TASK_UPDATED: 'project.task.updated',
  PROJECT_TASK_DELETED: 'project.task.deleted',
  PROJECT_TASK_STATUS_CHANGED: 'project.task.status_changed',
  PROJECT_TASK_COMMENT_CREATED: 'project.task.comment.created',
  PROJECT_TASK_COMMENT_REACTION_UPDATED: 'project.task.comment.reaction_updated',
  PROJECT_TASK_TAG_ADDED: 'project.task.tag.added',
  PROJECT_TASK_TAG_REMOVED: 'project.task.tag.removed',
  PROJECT_TASK_ATTACHMENT_ADDED: 'project.task.attachment.added',
  PROJECT_TASK_ATTACHMENT_REMOVED: 'project.task.attachment.removed',
  PROJECT_STATUS_CREATED: 'project.status.created',
  PROJECT_STATUS_UPDATED: 'project.status.updated',
  PROJECT_STATUS_DELETED: 'project.status.deleted',
  PROJECT_MEMBER_INVITED: 'project.member.invited',
  PROJECT_MEMBER_JOINED: 'project.member.joined',
  PROJECT_MEMBER_UPDATED: 'project.member.updated',
  PROJECT_MEMBER_REMOVED: 'project.member.removed',
  PROJECT_ROLE_CREATED: 'project.role.created',
  PROJECT_ROLE_UPDATED: 'project.role.updated',
  PROJECT_ROLE_DELETED: 'project.role.deleted',
  PROJECT_ROLE_PERMISSIONS_UPDATED: 'project.role.permissions_updated',
  PROJECT_ROLE_MEMBER_ASSIGNMENT_UPDATED: 'project.role.member_assignment_updated',

  // Billing namespace
  BILLING_PAYMENT_SUCCESS: 'billing.payment.success',
  BILLING_PAYMENT_FAILED: 'billing.payment.failed',
  BILLING_SUBSCRIPTION_UPDATED: 'billing.subscription.updated',
  BILLING_SUBSCRIPTION_RENEWAL_REMINDER: 'billing.subscription.renewal_reminder',

  // Future:
  // CHAT_MESSAGE: 'chat.message',
  // CHAT_TYPING: 'chat.typing',
  EXCEPTION: 'exception',
} as const;
export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

/**
 * Client event names.
 */
export const SOCKET_CLIENT_EVENTS = {
  PROJECT_SUBSCRIBE: 'project.subscribe',
  PROJECT_UNSUBSCRIBE: 'project.unsubscribe',
} as const;

export type SocketClientEventName =
  (typeof SOCKET_CLIENT_EVENTS)[keyof typeof SOCKET_CLIENT_EVENTS];
