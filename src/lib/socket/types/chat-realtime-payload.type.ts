export interface ChatRealtimeMessageAttachment {
  id: string;
  messageId: string;
  attachmentType: 'file' | 'image' | 'video' | 'audio' | string;
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
  fileSize?: string | null;
  documentType?: 'word' | 'excel' | 'powerpoint' | 'pdf' | 'text' | 'archive' | 'unknown' | string | null;
  previewStatus?: 'pending' | 'ready' | 'failed' | string | null;
  thumbnailUrl?: string | null;
  thumbnailUrlSmall?: string | null;
  thumbnailUrlMedium?: string | null;
  previewUrl?: string | null;
  openUrl?: string | null;
  downloadUrl?: string | null;
  previewWidth?: number | null;
  previewHeight?: number | null;
  previewPage?: number | null;
  pageCount?: number | null;
  previewUpdatedAt?: string | null;
  previewErrorCode?: string | null;
  previewVersion?: string | null;
  previewAssetSource?: 'rendered' | 'derived' | 'fallback' | 'none' | string | null;
}

export interface ChatRealtimeMessageReplyPreview {
  id: string;
  content?: string | null;
  senderId?: string | null;
  senderEmail?: string | null;
  senderFirstName?: string | null;
  senderLastName?: string | null;
  senderAvatarUrl?: string | null;
  sentAt?: string | null;
}

export interface ChatRealtimeForwardedSnapshotAttachment {
  attachmentType?: 'file' | 'image' | 'video' | 'audio' | string;
  fileName?: string;
  fileUrl?: string;
  mimeType?: string | null;
}

export interface ChatRealtimeForwardedSnapshot {
  originalMessageId?: string;
  originalContent?: string | null;
  originalContentFormat?: 'plain_text' | 'rich_text_v1' | string | null;
  originalRichContent?: Record<string, unknown> | null;
  originalSenderId?: string | null;
  originalSenderEmail?: string | null;
  originalSenderFirstName?: string | null;
  originalSenderLastName?: string | null;
  originalSenderDisplayName?: string | null;
  originalSenderAvatarUrl?: string | null;
  originalSentAt?: string | null;
  sourceConversationKey?: string | null;
  sourceConversationLabel?: string | null;
  sourceConversationKind?: 'channel' | 'dm' | 'group_dm' | string | null;
  sourceConversationVisibility?: 'public' | 'private' | string | null;
  attachments?: ChatRealtimeForwardedSnapshotAttachment[];
  [key: string]: unknown;
}

export interface ChatRealtimeLinkPreview {
  url: string;
  canonicalUrl?: string | null;
  displayUrl?: string | null;
  title?: string | null;
  resourceTitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  previewImageUrl?: string | null;
  previewImageAlt?: string | null;
  previewImageWidth?: number | null;
  previewImageHeight?: number | null;
  type?: string | null;
  mediaType?: string | null;
  mimeType?: string | null;
  provider?: string | null;
  providerName?: string | null;
  providerIconUrl?: string | null;
  siteName?: string | null;
  resourceType?: string | null;
  resourceTypeLabel?: string | null;
  embedUrl?: string | null;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
  status?: string | null;
  fetchedAt?: string | null;
  previewAssetId?: string | null;
  previewAssetStatus?: 'pending' | 'ready' | 'failed' | string | null;
  previewAssetSource?: 'rendered' | 'cached' | 'proxied' | 'external' | 'fallback' | string | null;
  previewAssetErrorCode?: string | null;
  previewVersion?: string | null;
}

export interface ChatRealtimeMessage {
  id: string;
  roomId: string;
  organizationId: string;
  senderId: string;
  messageType: 'text' | 'system' | 'file' | 'image' | string;
  content: string;
  contentFormat?: 'plain_text' | 'rich_text_v1' | string | null;
  richContent?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  clientMessageId?: string | null;
  parentMessageId?: string | null;
  threadRootMessageId?: string | null;
  replyPreview?: ChatRealtimeMessageReplyPreview | null;
  forwardedSnapshot?: ChatRealtimeForwardedSnapshot | null;
  isEdited: boolean;
  isDeleted: boolean;
  sentAt: string;
  senderEmail?: string | null;
  senderFirstName?: string | null;
  senderLastName?: string | null;
  senderAvatarUrl?: string | null;
  attachments?: ChatRealtimeMessageAttachment[];
  linkPreviews?: ChatRealtimeLinkPreview[];
}

interface ChatRealtimeBasePayload {
  organizationId: string;
  roomId: string;
  actorUserId?: string;
  occurredAt: string;
}

export interface ChatRealtimeRoomDelta {
  roomId: string;
  reason?: string;
  messageId?: string;
  lastMessageId?: string;
  lastMessageAt?: string | null;
  lastMessageSnippet?: string | null;
  shouldRefreshRoomSummary?: boolean;
}

interface ChatRealtimeRoomSnapshot {
  id: string;
  roomType?: 'channel' | 'dm' | 'group_dm' | string;
  visibility?: 'public' | 'private' | string;
  name?: string | null;
  roomKey?: string | null;
  topic?: string | null;
  description?: string | null;
  memberCount?: number;
  isArchived?: boolean;
  allowMemberPinMessages?: boolean;
  allowGuestPinMessages?: boolean;
  ownerId?: string;
  updatedAt?: string | null;
}

export interface ChatMessageCreatedPayload extends ChatRealtimeBasePayload {
  message: ChatRealtimeMessage;
  roomDelta?: ChatRealtimeRoomDelta | null;
}

export interface ChatMessageUpdatedPayload extends ChatRealtimeBasePayload {
  message: ChatRealtimeMessage;
  roomDelta?: ChatRealtimeRoomDelta | null;
}

export interface ChatMessageDeletedPayload extends ChatRealtimeBasePayload {
  messageId: string;
  isDeleted?: boolean;
  roomDelta?: ChatRealtimeRoomDelta | null;
}

interface ChatReactionReactor {
  userId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  reactedAt?: string | null;
}

export interface ChatMessageReactionUpdatedPayload extends ChatRealtimeBasePayload {
  messageId: string;
  emoji: string;
  count: number;
  reactedByMe: boolean;
  reactorUserIds?: string[];
  reactors?: ChatReactionReactor[];
  roomDelta?: ChatRealtimeRoomDelta | null;
  action: 'added' | 'removed' | string;
}

export interface ChatMessagePinRecordPayload {
  id: string;
  roomId: string;
  messageId: string;
  pinnedBy: string;
  pinnedAt: string;
}

export interface ChatMessagePinUpdatedPayload extends ChatRealtimeBasePayload {
  eventId?: string;
  messageId: string;
  action: 'pinned' | 'unpinned' | string;
  isPinned?: boolean;
  roomPinVersion?: number;
  pinnedCount?: number;
  pin?: ChatMessagePinRecordPayload | null;
}

export interface ChatMessageAttachmentChangePayload extends ChatRealtimeBasePayload {
  messageId: string;
  attachmentId: string;
}

export interface ChatMessageAttachmentPreviewUpdatedPayload extends ChatRealtimeBasePayload {
  messageId: string;
  attachmentId: string;
  attachment: ChatRealtimeMessageAttachment;
}

export interface ChatTypingClientPayload {
  organizationId: string;
  roomId: string;
}

export interface ChatTypingStartedPayload {
  organizationId: string;
  roomId: string;
  userId: string;
  occurredAt: string;
  expiresAt: string;
}

export interface ChatTypingStoppedPayload {
  organizationId: string;
  roomId: string;
  userId: string;
  occurredAt: string;
}

export interface ChatMessageLinkPreviewUpdatedPayload {
  organizationId: string;
  roomId: string;
  messageId: string;
  actorUserId?: string;
  linkPreviews: ChatRealtimeLinkPreview[];
  metadata?: {
    linkPreviewStatus?: string | null;
    linkPreviewPendingUrls?: string[] | null;
    linkPreviewFailedUrls?: string[] | null;
    linkPreviewVersion?: string | null;
    [key: string]: unknown;
  } | null;
  occurredAt: string;
}

export interface ChatRoomInvitationCreatedPayload extends ChatRealtimeBasePayload {
  invitationId: string;
  invitedUserId: string;
  inviteMessage?: string | null;
}

export interface ChatRoomMemberJoinedPayload extends ChatRealtimeBasePayload {
  member: {
    userId: string;
    memberRole: 'owner' | 'admin' | 'member' | 'guest' | string;
    joinedAt?: string;
    [key: string]: unknown;
  };
}

export interface ChatRoomVisibilityChangedPayload {
  organizationId: string;
  roomId: string;
  visibility: 'public' | 'private' | string;
  changedByUserId?: string;
  changedByDisplayName?: string | null;
  changedAt: string;
}

export interface ChatRoomMemberRoleUpdatedPayload extends ChatRealtimeBasePayload {
  memberId: string;
  previousRole?: 'owner' | 'admin' | 'member' | 'guest' | string;
  currentRole: 'owner' | 'admin' | 'member' | 'guest' | string;
}

export interface ChatRoomMemberRemovedPayload extends ChatRealtimeBasePayload {
  memberId: string;
  previousOwnerUserId?: string | null;
  currentOwnerUserId?: string | null;
}

export interface ChatRoomUpdatedPayload extends ChatRealtimeBasePayload {
  roomType?: 'channel' | 'dm' | 'group_dm' | string;
  updatedByUserId?: string;
  updatedAt?: string;
  changeType?:
    | 'room_info'
    | 'room_policies'
    | 'room_visibility'
    | 'room_archived'
    | 'room_unarchived'
    | 'member_role'
    | 'member_removed'
    | 'ownership_transferred'
    | string;
  room?: ChatRealtimeRoomSnapshot | null;
  previousOwnerUserId?: string | null;
  currentOwnerUserId?: string | null;
}

export interface ChatRoomReadStateUpdatedPayload {
  organizationId: string;
  roomId: string;
  userId: string;
  readStateMode?: 'mark_read' | 'mark_unread' | 'message_created' | string;
  lastReadMessageId?: string | null;
  lastReadAt?: string | null;
  unreadCount: number;
  isManualUnreadByUser?: boolean;
  manualUnreadAt?: string | null;
  manualUnreadFromMessageId?: string | null;
  occurredAt: string;
}

export interface ChatPersonalInboxRoomReadUpdatedPayload {
  organizationId: string;
  roomId: string;
  userId: string;
  updatedCounts: {
    mentions: number;
    notifications: number;
    total: number;
  };
  lastReadAt?: string | null;
  occurredAt: string;
}

export interface ChatPresencePayload {
  userId: string;
  organizationId: string;
  presenceStatus: 'online' | 'away' | 'dnd' | 'offline' | string;
  customStatus?: string | null;
  customEmoji?: string | null;
  source?: string | null;
  lastSeenAt?: string | null;
  lastActivityAt?: string | null;
  updatedAt?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export interface ChatPresenceUpdatedPayload {
  organizationId: string;
  actorUserId?: string;
  presence: ChatPresencePayload;
  occurredAt: string;
}
