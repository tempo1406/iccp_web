export type TeamChatRoomType = 'channel' | 'dm' | 'group_dm';
export type TeamChatRoomVisibility = 'public' | 'private';
export type TeamChatContextScope = 'organization' | 'project' | 'department';
export type TeamChatSupportedContextScope = Extract<
  TeamChatContextScope,
  'organization' | 'project'
>;
export type TeamChatMemberRole = 'owner' | 'admin' | 'member' | 'guest';
export type TeamChatViewerMembershipStatus = 'member' | 'invited' | 'non_member';
export type TeamChatInvitationStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'canceled'
  | string;
export type TeamChatNotifyLevel = 'all' | 'mentions' | 'mute';
export type TeamChatPresenceStatus = 'online' | 'away' | 'dnd' | 'offline';
export type TeamChatLinkPreviewStatus =
  | 'pending'
  | 'partial'
  | 'ready'
  | 'failed'
  | 'disabled'
  | string;
export type TeamChatMessageType =
  | 'text'
  | 'system'
  | 'file'
  | 'image'
  | 'video'
  | 'audio';
export type TeamChatMessageContentFormat = 'plain_text' | 'rich_text_v1';
export type TeamChatAttachmentType = 'file' | 'image' | 'video' | 'audio';
export type TeamChatAttachmentDocumentType =
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'pdf'
  | 'text'
  | 'archive'
  | 'unknown'
  | string;
export type TeamChatAttachmentPreviewStatus = 'pending' | 'ready' | 'failed' | string;

export interface TeamChatPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TeamChatPaginatedResponse<TItem> {
  data: TItem[];
  meta: TeamChatPaginationMeta;
}

export interface TeamChatRoomPermissionResponse {
  canView: boolean;
  canSendMessage: boolean;
  canInviteMembers: boolean;
  canManageMembers: boolean;
  canPinMessages: boolean;
  canJoin?: boolean;
  canLeave?: boolean;
  canChangeVisibilityToPublic?: boolean;
  canChangeVisibilityToPrivate?: boolean;
}

export interface TeamChatViewerStateResponse {
  membershipStatus: TeamChatViewerMembershipStatus;
  isInvited: boolean;
  canViewPreview: boolean;
  canJoin: boolean;
}

export interface TeamChatRoomSummaryPreviewUserResponse {
  userId: string;
  displayName?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  presenceStatus?: TeamChatPresenceStatus | string | null;
  lastActivityAt?: string | null;
}

export interface TeamChatRoomSummaryResponse {
  id: string;
  organizationId: string;
  roomType: TeamChatRoomType;
  visibility: TeamChatRoomVisibility;
  name: string;
  roomKey?: string | null;
  topic?: string | null;
  description?: string | null;
  contextScope: TeamChatContextScope;
  contextId?: string | null;
  createdBy: string;
  createdByDisplayName?: string | null;
  ownerId: string;
  lastMessageAt?: string | null;
  isArchived: boolean;
  archivedAt?: string | null;
  archivedByUserId?: string | null;
  archivedByDisplayName?: string | null;
  allowMemberPinMessages: boolean;
  allowGuestPinMessages: boolean;
  myRole: TeamChatMemberRole;
  myNotifyLevel?: TeamChatNotifyLevel;
  isHiddenByUser?: boolean;
  hiddenReason?: string | null;
  hiddenAt?: string | null;
  canUnarchive?: boolean;
  canUnhide?: boolean;
  isManualUnreadByUser?: boolean;
  manualUnreadAt?: string | null;
  manualUnreadFromMessageId?: string | null;
  memberCount: number;
  dmCounterpart?: TeamChatRoomSummaryPreviewUserResponse | null;
  groupMemberPreview?: TeamChatRoomSummaryPreviewUserResponse[];
  groupMemberPreviewHasMore?: boolean;
  lastMessageSnippet?: string | null;
  isStarred?: boolean;
  starredAt?: string | null;
  viewerState?: TeamChatViewerStateResponse;
  myPermissions: TeamChatRoomPermissionResponse;
  createdAt: string;
  updatedAt: string;
}

export interface TeamChatRoomMemberResponse {
  userId: string;
  memberRole: TeamChatMemberRole;
  joinSource: string;
  notifyLevel: TeamChatNotifyLevel;
  isActive: boolean;
  isHidden: boolean;
  joinedAt: string;
  leftAt?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

export interface TeamChatRoomDetailResponse extends TeamChatRoomSummaryResponse {
  members: TeamChatRoomMemberResponse[];
}

export interface GetTeamChatRoomDetailParams {
  includeMembers?: boolean;
}

export interface GetTeamChatRoomBootstrapParams {
  includeMembers?: boolean;
  messageLimit?: number;
  pinnedLimit?: number;
}

export interface TeamChatRoomBootstrapResponse {
  room?: TeamChatRoomDetailResponse | null;
  tabs?: TeamChatRoomTabsResponse | null;
  messageCursor?: TeamChatMessageCursorResponse | null;
  draft?: TeamChatDraftResponse | null;
  pinnedMessages?: TeamChatPinnedMessageResponse[];
  readState?: TeamChatReadStateResponse | null;
}

export interface TeamChatRoomMutationSnapshotResponse {
  id: string;
  roomType?: TeamChatRoomType;
  visibility?: TeamChatRoomVisibility;
  name?: string | null;
  roomKey?: string | null;
  topic?: string | null;
  description?: string | null;
  memberCount?: number;
  isArchived?: boolean;
  allowMemberPinMessages?: boolean;
  allowGuestPinMessages?: boolean;
  ownerId?: string;
  myRole?: TeamChatMemberRole;
  updatedAt?: string | null;
  dmCounterpart?: TeamChatRoomSummaryPreviewUserResponse | null;
  groupMemberPreview?: TeamChatRoomSummaryPreviewUserResponse[];
  groupMemberPreviewHasMore?: boolean;
  lastMessageSnippet?: string | null;
  isManualUnreadByUser?: boolean;
  manualUnreadAt?: string | null;
  manualUnreadFromMessageId?: string | null;
  members?: TeamChatRoomMemberResponse[];
}

export interface TeamChatDiscoverRoomSummaryResponse {
  id: string;
  roomType: TeamChatRoomType;
  visibility: TeamChatRoomVisibility;
  name: string;
  roomKey?: string | null;
  topic?: string | null;
  description?: string | null;
  memberCount: number;
  lastMessageAt?: string | null;
  updatedAt: string;
  viewerState: TeamChatViewerStateResponse;
}

export interface TeamChatDiscoverRoomsMetaResponse {
  limit: number;
  nextCursor?: string | null;
}

export interface TeamChatDiscoverRoomsResponse {
  data: TeamChatDiscoverRoomSummaryResponse[];
  meta: TeamChatDiscoverRoomsMetaResponse;
}

export interface TeamChatRoomPreviewResponse {
  id: string;
  organizationId: string;
  roomType: TeamChatRoomType;
  visibility: TeamChatRoomVisibility;
  name: string;
  roomKey?: string | null;
  topic?: string | null;
  description?: string | null;
  memberCount: number;
  createdByDisplayName?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  viewerState: TeamChatViewerStateResponse;
}

export interface TeamChatRoomInvitationResponse {
  id: string;
  roomId: string;
  organizationId: string;
  invitedUserId: string;
  invitedBy: string;
  memberRole: TeamChatMemberRole;
  status: TeamChatInvitationStatus;
  inviteMessage?: string | null;
  acceptedAt?: string | null;
  createdAt: string;
}

export type TeamChatInviteCandidateBlockedReason =
  | 'already_member'
  | 'pending_invitation'
  | string;

export type TeamChatCreateCandidateBlockedReason = 'not_in_project' | string;

export interface TeamChatRoomInviteCandidateResponse {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  isAlreadyMember: boolean;
  hasPendingInvitation: boolean;
  reasonBlocked?: TeamChatInviteCandidateBlockedReason | null;
}

export interface TeamChatRoomInviteCandidatesResponse {
  roomId: string;
  items: TeamChatRoomInviteCandidateResponse[];
}

export interface TeamChatCreateRoomCandidateResponse {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  isEligible: boolean;
  reasonBlocked?: TeamChatCreateCandidateBlockedReason | null;
}

export interface TeamChatCreateRoomCandidatesResponse {
  roomType: Extract<TeamChatRoomType, 'group_dm'>;
  contextScope: TeamChatSupportedContextScope;
  contextId?: string | null;
  items: TeamChatCreateRoomCandidateResponse[];
}

export interface TeamChatAcceptInvitationResponse {
  invitationId: string;
  roomId: string;
  invitationStatus: TeamChatInvitationStatus;
  acceptedAt?: string | null;
  alreadyAccepted?: boolean;
  room?: {
    id: string;
    roomType: TeamChatRoomType;
    visibility?: TeamChatRoomVisibility;
    name?: string | null;
    contextScope?: TeamChatContextScope;
    contextId?: string | null;
    myRole?: TeamChatMemberRole;
  };
}

export interface TeamChatUpdateRoomPoliciesResponse {
  roomId: string;
  previousAllowMemberPinMessages: boolean;
  currentAllowMemberPinMessages: boolean;
  previousAllowGuestPinMessages: boolean;
  currentAllowGuestPinMessages: boolean;
  updated: boolean;
  room?: TeamChatRoomMutationSnapshotResponse;
}

export interface TeamChatUpdateRoomInfoResponse {
  roomId: string;
  updated: boolean;
  previousName?: string | null;
  currentName?: string | null;
  previousTopic?: string | null;
  currentTopic?: string | null;
  previousDescription?: string | null;
  currentDescription?: string | null;
  room?: {
    id: string;
    name: string;
    topic?: string | null;
    description?: string | null;
  };
}

export interface TeamChatUpdateChannelVisibilityResponse {
  roomId?: string;
  actorUserId?: string;
  previousVisibility?: TeamChatRoomVisibility;
  currentVisibility?: TeamChatRoomVisibility;
  updated: boolean;
  updatedAt?: string | null;
  room?: {
    id: string;
    visibility: TeamChatRoomVisibility;
    updatedAt?: string | null;
  };
}

export interface TeamChatToggleRoomStarResponse {
  roomId?: string;
  userId?: string;
  isStarred: boolean;
  starredAt?: string | null;
  updated: boolean;
}

export interface TeamChatUpdateRoomMemberRoleResponse {
  memberId: string;
  previousRole: TeamChatMemberRole;
  currentRole: TeamChatMemberRole;
  updated: boolean;
  room?: TeamChatRoomMutationSnapshotResponse;
}

export interface TeamChatTransferRoomOwnershipResponse {
  roomId: string;
  previousOwnerUserId?: string | null;
  currentOwnerUserId?: string | null;
  updated: boolean;
  room?: TeamChatRoomMutationSnapshotResponse;
}

export interface TeamChatUpdateMyRoomNotifySettingsResponse {
  roomId: string;
  userId: string;
  previousNotifyLevel: TeamChatNotifyLevel;
  currentNotifyLevel: TeamChatNotifyLevel;
  previousMuteUntil?: string | null;
  currentMuteUntil?: string | null;
  updated: boolean;
}

export interface TeamChatArchiveRoomResponse {
  roomId: string;
  actorUserId?: string;
  previousIsArchived: boolean;
  currentIsArchived: boolean;
  archivedAt?: string | null;
  archivedByUserId?: string | null;
  archivedByDisplayName?: string | null;
  updated: boolean;
  room?: TeamChatRoomMutationSnapshotResponse;
}

export interface TeamChatRemoveRoomMemberResponse {
  roomId: string;
  memberId: string;
  removedBySelf: boolean;
  previousOwnerUserId?: string | null;
  currentOwnerUserId?: string | null;
  transferredOwnerUserId?: string | null;
  room?: TeamChatRoomMutationSnapshotResponse;
}

export interface UpdateTeamChatRoomVisibilityBody {
  isHidden: boolean;
  hiddenReason?: string;
  source?: string;
}

export interface TeamChatUpdateMyRoomVisibilityResponse {
  roomId: string;
  userId: string;
  previousIsHidden: boolean;
  currentIsHidden: boolean;
  previousHiddenReason?: string | null;
  currentHiddenReason?: string | null;
  previousHiddenAt?: string | null;
  currentHiddenAt?: string | null;
  updated: boolean;
}

export interface TeamChatRoomTabItemResponse {
  id: string;
  order: number;
  hidden: boolean;
}

export interface TeamChatRoomTabsResponse {
  roomId: string;
  scope?: string;
  tabs: TeamChatRoomTabItemResponse[];
  updated: boolean;
  updatedAt?: string | null;
}

export interface UpdateTeamChatRoomTabsBody {
  tabs: TeamChatRoomTabItemResponse[];
}

export interface TeamChatMessageMetadata {
  systemEventType?:
    | 'room.member.joined'
    | 'room.member.left'
    | 'room.member.removed'
    | string;
  actorUserId?: string;
  actorDisplayName?: string;
  memberUserId?: string;
  memberDisplayName?: string;
  joinSource?: string;
  removedBySelf?: boolean;
  mentionedUserIds?: string[];
  specialMentions?: Array<{
    type: 'channel' | 'everyone' | string;
  }>;
  linkPreviewStatus?: TeamChatLinkPreviewStatus;
  linkPreviewPendingUrls?: string[];
  linkPreviewFailedUrls?: string[];
  linkPreviewVersion?: string;
  source?: string;
  locale?: string;
  editedFromClient?: string;
  forwardedFromConversationKey?: string;
  forwardedFromMessageId?: string;
  forwardedFromRoomId?: string;
  forwardedByUserId?: string;
  [key: string]: unknown;
}

export interface TeamChatMessageReplyPreview {
  id: string;
  content?: string | null;
  senderId?: string | null;
  senderEmail?: string | null;
  senderFirstName?: string | null;
  senderLastName?: string | null;
  senderAvatarUrl?: string | null;
  sentAt?: string | null;
}

export interface TeamChatForwardedSnapshotAttachment {
  attachmentType?: TeamChatAttachmentType;
  fileName?: string;
  fileUrl?: string;
  mimeType?: string | null;
}

export interface TeamChatForwardedSnapshot {
  originalMessageId?: string;
  originalContent?: string | null;
  originalContentFormat?: TeamChatMessageContentFormat | null;
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
  sourceConversationKind?: TeamChatRoomType | string | null;
  sourceConversationVisibility?: TeamChatRoomVisibility | string | null;
  attachments?: TeamChatForwardedSnapshotAttachment[];
  [key: string]: unknown;
}

export type TeamChatInternalReferenceKind = 'team_chat_message' | string;
export type TeamChatMessageLinkResolverState =
  | 'ready'
  | 'message_deleted'
  | 'message_not_found'
  | 'forbidden';

export interface TeamChatMessageLinkInternalReferenceResponse {
  kind: TeamChatInternalReferenceKind;
  roomId: string;
  messageId: string;
  deepLinkUrl?: string | null;
  previewState?: TeamChatMessageLinkResolverState | null;
  roomSnapshot?: TeamChatMessageLinkPreviewRoomResponse | null;
  messageSnapshot?: TeamChatMessageLinkPreviewMessageResponse | null;
}

export interface TeamChatMessageLinkPreviewResponse {
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
  previewAssetSource?:
    | 'rendered'
    | 'cached'
    | 'proxied'
    | 'external'
    | 'fallback'
    | string
    | null;
  previewAssetErrorCode?: string | null;
  previewVersion?: string | null;
  internalReference?: TeamChatMessageLinkInternalReferenceResponse | null;
}

export interface TeamChatMessageLinkPreviewRoomResponse {
  id: string;
  roomType: TeamChatRoomType;
  visibility: TeamChatRoomVisibility;
  name?: string | null;
  roomKey?: string | null;
}

export interface TeamChatMessageLinkPreviewMessageResponse {
  id: string;
  authorId?: string | null;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  contentPreview?: string | null;
  createdAt?: string | null;
  isDeleted?: boolean | null;
  hasAttachments?: boolean | null;
}

export interface TeamChatResolvedMessageLinkPreviewResponse {
  accessible: boolean;
  state: TeamChatMessageLinkResolverState;
  room: TeamChatMessageLinkPreviewRoomResponse;
  message?: TeamChatMessageLinkPreviewMessageResponse | null;
  deepLinkUrl?: string | null;
}

export interface TeamChatResolvedMessageContextResponse {
  accessible: boolean;
  state: TeamChatMessageLinkResolverState;
  room: TeamChatMessageLinkPreviewRoomResponse;
  targetMessageId?: string | null;
  items: TeamChatRoomMessageResponse[];
  olderCursor?: string | null;
  newerCursor?: string | null;
  hasOlder: boolean;
  hasNewer: boolean;
  deepLinkUrl?: string | null;
}

export interface TeamChatRoomMessageResponse {
  id: string;
  roomId: string;
  organizationId: string;
  senderId: string;
  messageType: TeamChatMessageType;
  content: string;
  contentFormat?: TeamChatMessageContentFormat | null;
  richContent?: Record<string, unknown> | null;
  metadata?: TeamChatMessageMetadata | null;
  clientMessageId?: string | null;
  parentMessageId?: string | null;
  threadRootMessageId?: string | null;
  replyPreview?: TeamChatMessageReplyPreview | null;
  forwardedSnapshot?: TeamChatForwardedSnapshot | null;
  isEdited: boolean;
  isDeleted: boolean;
  sentAt: string;
  senderEmail?: string | null;
  senderFirstName?: string | null;
  senderLastName?: string | null;
  senderAvatarUrl?: string | null;
  attachments?: TeamChatMessageAttachmentResponse[];
  linkPreviews?: TeamChatMessageLinkPreviewResponse[];
  reactionSummaries?: TeamChatMessageReactionSummaryResponse[];
}

export interface TeamChatMessageAttachmentResponse {
  id: string;
  organizationId: string;
  messageId: string;
  attachmentType: TeamChatAttachmentType;
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
  fileSize?: string | null;
  documentType?: TeamChatAttachmentDocumentType | null;
  previewStatus?: TeamChatAttachmentPreviewStatus | null;
  checksum?: string | null;
  thumbnailUrl?: string | null;
  thumbnailUrlSmall?: string | null;
  thumbnailUrlMedium?: string | null;
  previewUrl?: string | null;
  openUrl?: string | null;
  downloadUrl?: string | null;
  width?: number | null;
  height?: number | null;
  previewWidth?: number | null;
  previewHeight?: number | null;
  previewPage?: number | null;
  pageCount?: number | null;
  previewUpdatedAt?: string | null;
  previewErrorCode?: string | null;
  previewVersion?: string | null;
  previewAssetSource?: 'rendered' | 'derived' | 'fallback' | 'none' | string | null;
  durationMs?: number | null;
  createdAt: string;
}

export interface TeamChatMessageCursorResponse {
  items: TeamChatRoomMessageResponse[];
  hasMore: boolean;
  nextCursor?: string | null;
}

export interface TeamChatReadStateResponse {
  roomId: string;
  userId: string;
  lastReadMessageId?: string | null;
  lastReadAt?: string | null;
  unreadCount: number;
  isManualUnreadByUser?: boolean;
  manualUnreadAt?: string | null;
  manualUnreadFromMessageId?: string | null;
  afterAggregates?: TeamChatUnreadAggregates | null;
}

export interface TeamChatUnreadRoomSummaryResponse {
  roomId: string;
  roomName: string;
  roomType: TeamChatRoomType;
  unreadCount: number;
  lastReadMessageId?: string | null;
  lastReadAt?: string | null;
  lastMessageAt?: string | null;
}

export interface TeamChatUnreadSummaryResponse {
  totalUnread: number;
  rooms: TeamChatUnreadRoomSummaryResponse[];
  aggregates?: TeamChatUnreadAggregates | null;
}

export interface TeamChatUnreadAggregates {
  roomUnreadMessageCount: number;
  myInboxUnreadItemCount: number;
  myInboxUnreadMessageCount: number;
  notificationUnreadCount: number;
}

export interface TeamChatMessageReactionSummaryResponse {
  emoji: string;
  count: number;
  reactedByMe: boolean;
  reactors?: TeamChatMessageReactionReactorResponse[];
}

export interface TeamChatUpdateMessageReactionResponse extends TeamChatMessageReactionSummaryResponse {
  updated: boolean;
}

export interface TeamChatMessageReactionBatchItemResponse {
  messageId: string;
  reactionSummaries: TeamChatMessageReactionSummaryResponse[];
}

export interface TeamChatPinRecordResponse {
  id: string;
  roomId: string;
  messageId: string;
  pinnedBy: string;
  pinnedAt: string;
}

export interface TeamChatPinnedMessageResponse extends TeamChatPinRecordResponse {
  message: TeamChatRoomMessageResponse;
}

export interface TeamChatToggleMessagePinResponse {
  action: 'pinned' | 'unpinned' | string;
  roomId: string;
  messageId: string;
  updated: boolean;
  isPinned: boolean;
  roomPinVersion: number;
  pinnedCount: number;
  pin: TeamChatPinRecordResponse | null;
}

export interface TeamChatRoomPinStateResponse {
  roomId: string;
  roomPinVersion: number;
  pinnedCount: number;
  updatedAt?: string | null;
  lastEventId?: string | null;
}

export interface TeamChatPresenceResponse {
  userId: string;
  organizationId: string;
  presenceStatus: TeamChatPresenceStatus;
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

export interface TeamChatMentionResponse {
  mentionId: string;
  roomId: string;
  roomName?: string | null;
  roomVisibility?: TeamChatRoomVisibility | null;
  messageId: string;
  mentionType: 'user' | 'channel' | 'group' | string;
  isRead: boolean;
  readAt?: string | null;
  messageContent: string;
  messageSentAt: string;
  senderEmail?: string | null;
  senderFirstName?: string | null;
  senderLastName?: string | null;
  senderAvatarUrl?: string | null;
}

export interface TeamChatUpdateMentionReadResponse {
  updated: boolean;
  mention: TeamChatMentionResponse;
}

export interface TeamChatMarkMyMentionsReadResponse {
  updatedCount: number;
  roomId?: string | null;
}

export type TeamChatPersonalInboxReadKind = 'mentions' | 'notifications';

export interface TeamChatPersonalInboxRoomReadUpdatedCounts {
  mentions: number;
  notifications: number;
  total: number;
}

export interface TeamChatPersonalInboxRoomReadResponse {
  roomId: string;
  organizationId: string;
  updated: boolean;
  updatedCounts: TeamChatPersonalInboxRoomReadUpdatedCounts;
  lastReadAt?: string | null;
  afterAggregates?: TeamChatUnreadAggregates | null;
}

export interface TeamChatNotificationResponse {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read?: boolean;
  isRead?: boolean;
  data?: {
    eventType?: string;
    organizationId?: string;
    orgId?: string;
    roomId?: string;
    roomName?: string;
    roomType?: TeamChatRoomType;
    roomVisibility?: TeamChatRoomVisibility;
    messageId?: string;
    parentMessageId?: string;
    threadRootMessageId?: string;
    replySenderId?: string;
    mentionId?: string;
    mentionType?: 'user' | 'channel' | 'group' | 'here' | string;
    specialMentionType?: 'channel' | 'everyone' | 'here' | string;
    invitationId?: string;
    invitationStatus?: TeamChatInvitationStatus;
    status?: TeamChatInvitationStatus;
    inviteStatus?: TeamChatInvitationStatus;
    acceptedAt?: string | null;
    memberRole?: TeamChatMemberRole | string;
    invitedByUserId?: string;
    invitedByDisplayName?: string;
    actorUserId?: string;
    actorName?: string;
    actorAvatarUrl?: string;
    previewText?: string;
    fullMessageContent?: string;
    reactionEmoji?: string;
    reactionCount?: number;
    realtimeDeliveryMode?: 'normal' | 'silent' | string;
    realtimeDeliveryReason?: string;
    [key: string]: unknown;
  };
  createdAt: string;
}

export interface TeamChatNotificationsFeedResponse {
  data: TeamChatNotificationResponse[];
  total?: number;
  unreadCount?: number;
}

export type TeamChatNotificationsListResponse =
  | TeamChatNotificationResponse[]
  | TeamChatPaginatedResponse<TeamChatNotificationResponse>
  | { items: TeamChatNotificationResponse[] }
  | TeamChatNotificationsFeedResponse;

export interface TeamChatMarkNotificationsReadAllResponse {
  updatedCount: number;
}

export interface TeamChatJoinRoomResponse {
  joined: boolean;
  room: TeamChatRoomDetailResponse;
}

export interface CreateTeamChatRoomBody {
  roomType: TeamChatRoomType;
  visibility?: TeamChatRoomVisibility;
  name?: string;
  roomKey?: string;
  topic?: string;
  description?: string;
  contextScope?: TeamChatSupportedContextScope;
  contextId?: string;
  memberIds?: string[];
}

export interface ListTeamChatRoomsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
  search?: string;
  roomType?: TeamChatRoomType;
  visibility?: TeamChatRoomVisibility;
  starredOnly?: boolean;
  includeArchived?: boolean;
  archivedOnly?: boolean;
  includeHidden?: boolean;
  hiddenOnly?: boolean;
  contextScope?: TeamChatSupportedContextScope;
  contextId?: string;
}

export interface ListTeamChatDiscoverRoomsParams {
  search?: string;
  cursor?: string;
  sortBy?: 'recent' | 'members' | 'name';
  limit?: number;
  contextScope?: TeamChatSupportedContextScope;
  contextId?: string;
}

export interface GetTeamChatRoomInviteCandidatesParams {
  search?: string;
  limit?: number;
}

export interface GetTeamChatCreateRoomCandidatesParams {
  roomType: Extract<TeamChatRoomType, 'group_dm'>;
  contextScope?: TeamChatSupportedContextScope;
  contextId?: string;
  search?: string;
  limit?: number;
}

export interface UpdateTeamChatRoomInfoBody {
  name?: string;
  topic?: string;
  description?: string;
}

export interface UpdateTeamChatChannelVisibilityBody {
  visibility: TeamChatRoomVisibility;
  expectedUpdatedAt?: string;
}

export interface UpdateTeamChatRoomPoliciesBody {
  allowMemberPinMessages: boolean;
  allowGuestPinMessages: boolean;
}

export interface InviteTeamChatRoomMembersBody {
  userIds: string[];
  memberRole?: TeamChatMemberRole;
  inviteMessage?: string;
}

export interface UpdateTeamChatMemberRoleBody {
  memberRole: TeamChatMemberRole;
}

export interface UpdateTeamChatRoomOwnershipBody {
  newOwnerUserId: string;
}

export interface UpdateTeamChatNotifySettingsBody {
  notifyLevel: TeamChatNotifyLevel;
  muteUntil?: string | null;
}

export interface SendTeamChatMessageBody {
  content: string;
  contentFormat?: TeamChatMessageContentFormat;
  richContent?: Record<string, unknown>;
  messageType?: TeamChatMessageType;
  clientMessageId: string;
  parentMessageId?: string;
  metadata?: TeamChatMessageMetadata;
}

export interface ForwardTeamChatMessageBody {
  targetRoomIds: string[];
  note?: string;
  clientMessageIdPrefix?: string;
}

export interface TeamChatForwardMessageTargetResult {
  targetRoomId: string;
  forwarded: boolean;
  error?: string;
  message?: TeamChatRoomMessageResponse;
  attachments?: TeamChatMessageAttachmentResponse[];
}

export interface TeamChatForwardMessageResponse {
  sourceRoomId: string;
  sourceMessageId: string;
  requestedTargetCount: number;
  forwardedCount: number;
  failedCount: number;
  results: TeamChatForwardMessageTargetResult[];
}

export interface ListTeamChatMessagesParams {
  limit?: number;
  beforeSentAt?: string;
}

export interface ListTeamChatMessageCursorParams {
  limit?: number;
  cursor?: string;
}

export interface GetTeamChatMessageContextParams {
  before?: number;
  after?: number;
}

export interface ListTeamChatRoomMessageSearchParams {
  q: string;
  limit?: number;
  cursor?: string;
}

export interface TeamChatRoomMessageSearchItemResponse {
  messageId: string;
  roomId: string;
  senderId: string;
  senderEmail?: string | null;
  senderFirstName?: string | null;
  senderLastName?: string | null;
  senderAvatarUrl?: string | null;
  messageType: TeamChatMessageType;
  content: string;
  snippet?: string;
  sentAt: string;
}

export interface TeamChatRoomMessageSearchResponse {
  items: TeamChatRoomMessageSearchItemResponse[];
  hasMore: boolean;
  nextCursor?: string | null;
}

export interface UpdateTeamChatMessageBody {
  content: string;
  contentFormat?: TeamChatMessageContentFormat;
  richContent?: Record<string, unknown>;
  removeAttachmentIds?: string[];
  metadata?: TeamChatMessageMetadata;
}

export interface UploadTeamChatMessageAttachmentBody {
  file: File;
  attachmentType?: TeamChatAttachmentType;
  clientUploadId?: string;
  checksum?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  fileName?: string;
}

export interface TeamChatDirectUploadAuthBody {
  clientUploadId: string;
  fileName: string;
}

export interface TeamChatDirectUploadAuthResponse {
  folder: string;
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  uploadEndpoint: string;
  clientUploadId: string;
  fileName: string;
}

export interface CompleteTeamChatDirectUploadBody {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  clientUploadId: string;
  checksum?: string;
}

export interface UpdateTeamChatReadStateBody {
  mode?: 'mark_read' | 'mark_unread';
  lastReadMessageId?: string;
  fromMessageId?: string;
}

export interface TeamChatDraftMetadata {
  [key: string]: unknown;
}

export interface TeamChatDraftResponse {
  id: string;
  organizationId?: string;
  roomId: string;
  authorUserId?: string;
  threadRootMessageId?: string | null;
  parentMessageId?: string | null;
  content: string;
  contentFormat?: TeamChatMessageContentFormat | null;
  richContent?: Record<string, unknown> | null;
  metadata?: TeamChatDraftMetadata | null;
  draftSource?: string | null;
  lastComposerActivityAt?: string | null;
  createdAt?: string;
  updatedAt: string;
}

export interface UpdateTeamChatCurrentDraftBody {
  threadRootMessageId?: string;
  parentMessageId?: string;
  content: string;
  contentFormat?: TeamChatMessageContentFormat;
  richContent?: Record<string, unknown>;
  metadata?: TeamChatDraftMetadata;
  draftSource?: string;
}

export interface TeamChatCurrentDraftSaveResponse {
  updated: boolean;
  draftDeleted: boolean;
  draft?: TeamChatDraftResponse | null;
}

export interface GetTeamChatCurrentDraftParams {
  threadRootMessageId?: string;
  parentMessageId?: string;
}

export interface ListTeamChatDraftsParams {
  limit?: number;
  cursor?: string;
  roomId?: string;
}

export interface TeamChatDraftListResponse {
  items: TeamChatDraftResponse[];
  nextCursor?: string | null;
}

export interface TeamChatDeleteDraftResponse {
  draftId: string;
  deleted: boolean;
}

export type TeamChatScheduledMessageStatus =
  | 'pending'
  | 'processing'
  | 'failed'
  | 'sent'
  | 'cancelled'
  | 'converted_to_draft'
  | string;

export interface TeamChatScheduledMessageResponse {
  id: string;
  roomId: string;
  authorUserId?: string;
  threadRootMessageId?: string | null;
  parentMessageId?: string | null;
  content: string;
  contentFormat?: TeamChatMessageContentFormat | null;
  richContent?: Record<string, unknown> | null;
  metadata?: TeamChatDraftMetadata | null;
  scheduledForUtc: string;
  scheduledTimezone?: string | null;
  scheduledLocalDate?: string | null;
  scheduledLocalTime?: string | null;
  status: TeamChatScheduledMessageStatus;
  sourceDraftId?: string | null;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  sentMessageId?: string | null;
  sentAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTeamChatScheduledMessageBody {
  threadRootMessageId?: string;
  parentMessageId?: string;
  content: string;
  contentFormat?: TeamChatMessageContentFormat;
  richContent?: Record<string, unknown>;
  metadata?: TeamChatDraftMetadata;
  scheduledFor: string;
  timezone: string;
  sourceDraftId?: string;
}

export interface ListTeamChatScheduledMessagesParams {
  status?: TeamChatScheduledMessageStatus;
  limit?: number;
  cursor?: string;
}

export interface TeamChatScheduledMessageListResponse {
  items: TeamChatScheduledMessageResponse[];
  nextCursor?: string | null;
}

export interface UpdateTeamChatScheduledMessageBody {
  content: string;
  contentFormat?: TeamChatMessageContentFormat;
  richContent?: Record<string, unknown>;
  scheduledFor: string;
  timezone: string;
}

export interface TeamChatScheduledMessageSendResult {
  id: string;
  status: TeamChatScheduledMessageStatus;
  sentMessageId?: string | null;
  sentAt?: string | null;
  cancelledAt?: string | null;
}

export interface TeamChatScheduledMessageDraftResult {
  id: string;
  draftSource?: string | null;
  content: string;
  contentFormat?: TeamChatMessageContentFormat | null;
  richContent?: Record<string, unknown> | null;
}

export interface TeamChatCancelScheduledMessageToDraftResponse {
  scheduledMessage: TeamChatScheduledMessageSendResult;
  draft?: TeamChatScheduledMessageDraftResult | null;
}

export interface TeamChatSendScheduledMessageNowResponse {
  scheduledMessage: TeamChatScheduledMessageSendResult;
  sentMessage?: Pick<
    TeamChatRoomMessageResponse,
    'id' | 'roomId' | 'content' | 'contentFormat' | 'richContent'
  > | null;
}

export interface TeamChatDeleteScheduledMessageResponse {
  scheduledMessageId: string;
  deleted: boolean;
}

export interface AddTeamChatReactionBody {
  emoji: string;
}

export interface TeamChatMessageReactionReactorResponse {
  userId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  reactedAt?: string | null;
}

export interface ListTeamChatRoomAttachmentsParams {
  page?: number;
  limit?: number;
  type?: TeamChatAttachmentType;
  search?: string;
}

export interface TeamChatRoomAttachmentResponse {
  attachmentId?: string;
  id?: string;
  roomId: string;
  messageId: string;
  attachmentType: TeamChatAttachmentType;
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
  fileSize?: string | null;
  documentType?: TeamChatAttachmentDocumentType | null;
  previewStatus?: TeamChatAttachmentPreviewStatus | null;
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
  sharedByUserId?: string;
  sharedByName?: string;
  sharedByEmail?: string;
  messageSentAt?: string | null;
  createdAt?: string | null;
}

export interface TeamChatRoomAttachmentListResponse {
  items: TeamChatRoomAttachmentResponse[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface UpdateTeamChatPresenceBody {
  presenceStatus: TeamChatPresenceStatus;
  customStatus?: string;
  customEmoji?: string;
  source?: string;
}

export interface ListTeamChatMentionsParams {
  isRead?: boolean;
  limit?: number;
}

export interface MarkAllTeamChatMentionsReadBody {
  roomId?: string;
}

export interface MarkTeamChatPersonalInboxRoomReadBody {
  includeKinds?: TeamChatPersonalInboxReadKind[];
  source?: string;
  upToMessageId?: string;
}

export interface ListTeamChatNotificationsParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export interface MarkAllTeamChatNotificationsReadBody {
  organizationId?: string;
  roomId?: string;
}
