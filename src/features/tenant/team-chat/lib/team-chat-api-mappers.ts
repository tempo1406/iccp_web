import type {
  ChannelDetailTabItem,
  ChannelMember,
} from '../data/team-chat-channel-details';
import type {
  ConversationKey,
  ConversationKind,
  ConversationMessageContentFormat,
  ConversationMessage,
  ConversationMessageAttachment,
  DiscoverableChannel,
  DirectMessageContact,
  GroupDirectMessageConversation,
  InvitationStatus,
  LinkPreview,
  MessageReaction,
  MessageReactionReactor,
  PersonalFeedItem,
  PresenceStatus,
  SharedFile,
  SharedPhoto,
  WorkspaceChannel,
} from '../data/team-chat-ui-data';
import type {
  TeamChatMentionResponse,
  TeamChatForwardedSnapshot,
  TeamChatForwardedSnapshotAttachment,
  TeamChatMessageAttachmentResponse,
  TeamChatMessageReplyPreview,
  TeamChatMessageLinkPreviewResponse,
  TeamChatMessageReactionReactorResponse,
  TeamChatMessageReactionSummaryResponse,
  TeamChatNotificationResponse,
  TeamChatPresenceResponse,
  TeamChatRoomPreviewResponse,
  TeamChatRoomAttachmentResponse,
  TeamChatDiscoverRoomSummaryResponse,
  TeamChatRoomDetailResponse,
  TeamChatRoomMemberResponse,
  TeamChatRoomMessageResponse,
  TeamChatRoomSummaryPreviewUserResponse,
  TeamChatRoomSummaryResponse,
  TeamChatUnreadRoomSummaryResponse,
  TeamChatUnreadAggregates,
  TeamChatUnreadSummaryResponse,
} from '../services/types/team-chat.types';
import {
  hasExplicitTeamChatLinkPreviewAssetState,
  resolveTeamChatAttachmentThumbnailUrls,
} from './team-chat-preview-state.utils';
import { parseTeamChatMessageLink } from './team-chat-message-link.utils';

function formatTimeLabel(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatDateLabel(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatMonthLabel(value?: string | null): string {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeTeamChatMessageContentFormat(
  value: unknown,
): ConversationMessageContentFormat | undefined {
  if (typeof value !== 'string') return undefined;
  const normalizedValue = value.trim().toLowerCase();
  if (normalizedValue === 'plain_text') return 'plain_text';
  if (normalizedValue === 'rich_text_v1') return 'rich_text_v1';
  return undefined;
}

function normalizeRichContentPayload(
  value: unknown,
): Record<string, unknown> | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  return value;
}

function withTeamChatAttachmentDownloadQuery(url: string) {
  const [urlWithoutHash, hash = ''] = url.split('#', 2);
  const [path, query = ''] = urlWithoutHash.split('?', 2);
  const searchParams = new URLSearchParams(query);
  searchParams.set('ik-attachment', 'true');
  const nextQuery = searchParams.toString();

  return path + (nextQuery ? '?' + nextQuery : '') + (hash ? '#' + hash : '');
}

function resolveAttachmentOpenUrl(params: {
  openUrl?: string | null;
  previewUrl?: string | null;
  fileUrl?: string | null;
}) {
  return (
    toNonEmptyString(params.openUrl) ??
    toNonEmptyString(params.previewUrl) ??
    toNonEmptyString(params.fileUrl)
  );
}

function resolveAttachmentDownloadUrl(params: {
  downloadUrl?: string | null;
  fileUrl?: string | null;
}) {
  const explicitDownloadUrl = toNonEmptyString(params.downloadUrl);
  if (explicitDownloadUrl) return explicitDownloadUrl;

  const normalizedFileUrl = toNonEmptyString(params.fileUrl);
  if (!normalizedFileUrl) return undefined;

  return withTeamChatAttachmentDownloadQuery(normalizedFileUrl);
}

function normalizeInvitationStatus(value?: string): InvitationStatus | undefined {
  if (!value) return undefined;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'pending') return 'pending';
  if (normalized === 'accepted') return 'accepted';
  if (normalized === 'declined') return 'declined';
  if (normalized === 'canceled' || normalized === 'cancelled') return 'canceled';
  return normalized;
}

function toDisplayName(member: TeamChatRoomMemberResponse): string {
  const fullName = [member.firstName, member.lastName].filter(Boolean).join(' ').trim();
  return fullName || member.email || member.userId;
}

function toSummaryPreviewDisplayName(
  member?: TeamChatRoomSummaryPreviewUserResponse | null,
): string {
  if (!member) return '';
  const fullName = [member.firstName, member.lastName].filter(Boolean).join(' ').trim();
  return fullName || member.displayName || member.email || member.userId;
}

function toPresenceDisplayName(presence: TeamChatPresenceResponse): string {
  const fullName = [presence.firstName, presence.lastName].filter(Boolean).join(' ').trim();
  return fullName || presence.email || presence.userId;
}

function toPresenceStatus(status?: string | null): PresenceStatus {
  if (status === 'online') return 'online';
  if (status === 'dnd') return 'busy';
  if (status === 'offline') return 'offline';
  return 'away';
}

function normalizeViewerMembershipStatus(
  value?: string | null,
): DiscoverableChannel['viewerState']['membershipStatus'] {
  if (value === 'member' || value === 'invited' || value === 'non_member') {
    return value;
  }
  return 'non_member';
}

function normalizeDocumentType(
  value?: string | null,
): ConversationMessageAttachment['documentType'] | SharedFile['documentType'] {
  if (!value) return 'unknown';

  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'word' ||
    normalized === 'excel' ||
    normalized === 'powerpoint' ||
    normalized === 'pdf' ||
    normalized === 'text' ||
    normalized === 'archive' ||
    normalized === 'unknown'
  ) {
    return normalized;
  }

  return normalized;
}

function normalizePreviewStatus(
  value?: string | null,
): ConversationMessageAttachment['previewStatus'] | SharedFile['previewStatus'] {
  if (!value) return undefined;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'pending' || normalized === 'ready' || normalized === 'failed') {
    return normalized;
  }

  return normalized;
}


function normalizeAttachmentPreviewAssetSource(
  value?: string | null,
): ConversationMessageAttachment['previewAssetSource'] | SharedFile['previewAssetSource'] {
  if (!value) return undefined;

  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'rendered' ||
    normalized === 'derived' ||
    normalized === 'fallback' ||
    normalized === 'none'
  ) {
    return normalized;
  }

  return normalized;
}

function normalizeLinkPreviewAssetStatus(
  value?: string | null,
): LinkPreview['previewAssetStatus'] {
  if (!value) return undefined;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'pending' || normalized === 'ready' || normalized === 'failed') {
    return normalized;
  }

  return normalized;
}

function normalizeLinkPreviewAssetSource(
  value?: string | null,
): LinkPreview['previewAssetSource'] {
  if (!value) return undefined;

  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'rendered' ||
    normalized === 'proxied' ||
    normalized === 'cached' ||
    normalized === 'external' ||
    normalized === 'fallback'
  ) {
    return normalized;
  }

  return normalized;
}


function normalizeFileKind(
  mimeType?: string | null,
  documentType?: string | null,
): SharedFile['kind'] {
  const normalizedDocumentType = normalizeDocumentType(documentType);

  if (!mimeType) {
    if (normalizedDocumentType === 'excel') return 'spreadsheet';
    if (normalizedDocumentType === 'powerpoint') return 'presentation';
    if (normalizedDocumentType === 'archive') return 'archive';
    return 'document';
  }

  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (normalizedDocumentType === 'excel') return 'spreadsheet';
  if (normalizedDocumentType === 'powerpoint') return 'presentation';
  if (normalizedDocumentType === 'archive') return 'archive';
  if (normalizedDocumentType === 'pdf') return 'document';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('tar') ||
    mimeType.includes('7z')
  ) {
    return 'archive';
  }
  return 'document';
}

function formatFileSize(value?: string | null): string {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed <= 0) return '--';

  if (parsed < 1024) return `${parsed} B`;
  if (parsed < 1024 * 1024) return `${(parsed / 1024).toFixed(1)} KB`;
  if (parsed < 1024 * 1024 * 1024) return `${(parsed / (1024 * 1024)).toFixed(1)} MB`;
  return `${(parsed / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function buildMessageAuthorName(message: TeamChatRoomMessageResponse): string {
  const fullName = [message.senderFirstName, message.senderLastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (fullName) return fullName;
  return message.senderEmail ?? 'Unknown user';
}

function buildReplyPreviewAuthor(
  replyPreview?: TeamChatMessageReplyPreview | null,
): string {
  if (!replyPreview) return 'Unknown user';

  const fullName = [replyPreview.senderFirstName, replyPreview.senderLastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return fullName || replyPreview.senderEmail || replyPreview.senderId || 'Unknown user';
}

function normalizeConversationKey(value: unknown): ConversationKey | undefined {
  const normalized = toNonEmptyString(value);
  if (!normalized) return undefined;

  if (
    normalized.startsWith('channel:') ||
    normalized.startsWith('dm:') ||
    normalized.startsWith('group_dm:')
  ) {
    return normalized as ConversationKey;
  }

  return undefined;
}

function normalizeForwardedSourceConversationLabel(
  key: ConversationKey,
  rawLabel?: string | null,
): string {
  const normalizedLabel = toNonEmptyString(rawLabel);
  if (normalizedLabel) {
    if (key.startsWith('channel:')) {
      return normalizedLabel.replace(/^#\s*/, '');
    }
    if (key.startsWith('dm:')) {
      return normalizedLabel.replace(/^@\s*/, '');
    }
    return normalizedLabel;
  }

  const fallbackLabel = key.slice(key.indexOf(':') + 1).trim();
  if (fallbackLabel.length > 0) return fallbackLabel;
  return 'Conversation';
}

function resolveForwardedSourceConversationVisibility(
  snapshot?: TeamChatForwardedSnapshot | null,
): 'public' | 'private' | undefined {
  if (!snapshot) return undefined;

  const rawVisibility =
    toNonEmptyString(snapshot['sourceConversationVisibility']) ??
    toNonEmptyString(snapshot['sourceRoomVisibility']) ??
    toNonEmptyString(snapshot['roomVisibility']);

  if (rawVisibility === 'public' || rawVisibility === 'private') {
    return rawVisibility;
  }

  return undefined;
}

function resolveForwardedMetadataAuthor(message: TeamChatRoomMessageResponse): string | undefined {
  const metadata = isRecord(message.metadata) ? message.metadata : undefined;
  if (!metadata) return undefined;

  const authorCandidateKeys = [
    'forwardedFromSenderDisplayName',
    'forwardedFromSenderName',
    'forwardedFromSenderEmail',
    'forwardedFromDisplayName',
    'forwardedFromUserDisplayName',
    'forwardedFromUserName',
    'forwardedFromEmail',
    'forwardedFromAuthor',
    'forwardedOriginalAuthor',
    'originalSenderDisplayName',
    'originalSenderName',
    'originalSenderEmail',
    'originalAuthorDisplayName',
    'originalAuthorEmail',
    'originalAuthorId',
    'originalAuthor',
  ];

  for (const key of authorCandidateKeys) {
    const candidate = toNonEmptyString(metadata[key]);
    if (candidate) return candidate;
  }

  return undefined;
}

function buildForwardedSnapshotAuthor(
  message: TeamChatRoomMessageResponse,
  params: {
    snapshot?: TeamChatForwardedSnapshot | null;
    replyPreview?: TeamChatMessageReplyPreview | null;
    sourceConversationKey: ConversationKey;
    sourceConversationLabel: string;
  },
): string {
  const { snapshot, replyPreview, sourceConversationKey, sourceConversationLabel } = params;

  if (snapshot) {
    const senderFullName = [snapshot.originalSenderFirstName, snapshot.originalSenderLastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    const legacyAuthorFullName = [snapshot['originalAuthorFirstName'], snapshot['originalAuthorLastName']]
      .filter((value): value is string => Boolean(toNonEmptyString(value)))
      .join(' ')
      .trim();
    const fullName = senderFullName || legacyAuthorFullName;
    if (fullName) return fullName;
    if (snapshot.originalSenderDisplayName?.trim()) return snapshot.originalSenderDisplayName;
    const legacyAuthorDisplayName = toNonEmptyString(snapshot['originalAuthorDisplayName']);
    if (legacyAuthorDisplayName) return legacyAuthorDisplayName;
    if (snapshot.originalSenderEmail?.trim()) return snapshot.originalSenderEmail;
    const legacyAuthorEmail = toNonEmptyString(snapshot['originalAuthorEmail']);
    if (legacyAuthorEmail) return legacyAuthorEmail;
    if (snapshot.originalSenderId?.trim()) return snapshot.originalSenderId;
    const legacyAuthorId = toNonEmptyString(snapshot['originalAuthorId']);
    if (legacyAuthorId) return legacyAuthorId;

    const snapshotAuthorCandidateKeys = [
      'originalAuthor',
      'originalAuthorDisplayName',
      'originalAuthorEmail',
      'originalAuthorId',
      'originalSenderName',
      'senderDisplayName',
      'senderName',
      'authorDisplayName',
      'authorName',
    ];

    for (const key of snapshotAuthorCandidateKeys) {
      const candidate = toNonEmptyString(snapshot[key]);
      if (candidate) return candidate;
    }
  }

  const metadataAuthor = resolveForwardedMetadataAuthor(message);
  if (metadataAuthor) return metadataAuthor;

  const replyPreviewAuthor = buildReplyPreviewAuthor(replyPreview);
  if (replyPreviewAuthor !== 'Unknown user') return replyPreviewAuthor;

  if (sourceConversationKey.startsWith('dm:') && sourceConversationLabel.trim().length > 0) {
    return sourceConversationLabel;
  }

  return 'Unknown user';
}

function resolveForwardedSnapshot(
  message: TeamChatRoomMessageResponse,
): TeamChatForwardedSnapshot | null | undefined {
  const rootSnapshot = message.forwardedSnapshot;
  const metadataSnapshotRaw = isRecord(message.metadata)
    ? message.metadata['forwardedSnapshot']
    : undefined;
  const metadataSnapshot = isRecord(metadataSnapshotRaw)
    ? (metadataSnapshotRaw as TeamChatForwardedSnapshot)
    : undefined;

  if (rootSnapshot && metadataSnapshot) {
    return {
      ...metadataSnapshot,
      ...rootSnapshot,
    };
  }

  return rootSnapshot ?? metadataSnapshot;
}

function buildForwardedSourceConversationKey(
  message: TeamChatRoomMessageResponse,
  snapshot?: TeamChatForwardedSnapshot | null,
): ConversationKey {
  const snapshotKey = normalizeConversationKey(snapshot?.sourceConversationKey);
  if (snapshotKey) return snapshotKey;

  const snapshotRoomId = toNonEmptyString(snapshot?.['originalRoomId']);
  if (snapshotRoomId) {
    return `channel:${snapshotRoomId}` as ConversationKey;
  }

  const metadataKey = normalizeConversationKey(message.metadata?.forwardedFromConversationKey);
  if (metadataKey) return metadataKey;

  const metadataRoomId = toNonEmptyString(message.metadata?.forwardedFromRoomId);
  if (metadataRoomId) {
    const metadataRoomType = toNonEmptyString(message.metadata?.forwardedFromRoomType);
    if (metadataRoomType === 'dm' || metadataRoomType == 'group_dm') {
      return `${metadataRoomType}:${metadataRoomId}` as ConversationKey;
    }
    return `channel:${metadataRoomId}` as ConversationKey;
  }

  return `channel:${message.roomId}` as ConversationKey;
}

function buildSystemMessageFallbackContent(message: TeamChatRoomMessageResponse): string {
  const metadata = message.metadata ?? {};
  const memberDisplayName =
    toNonEmptyString(metadata.memberDisplayName) ??
    toNonEmptyString(metadata.memberUserId) ??
    'A member';
  const actorDisplayName =
    toNonEmptyString(metadata.actorDisplayName) ??
    toNonEmptyString(metadata.actorUserId) ??
    'A member';

  switch (metadata.systemEventType) {
    case 'room.member.joined':
      return `${memberDisplayName} joined the room`;
    case 'room.member.left':
      return `${memberDisplayName} left the room`;
    case 'room.member.removed':
      return metadata.removedBySelf
        ? `${memberDisplayName} left the room`
        : `${memberDisplayName} was removed by ${actorDisplayName}`;
    default:
      return 'System update';
  }
}

function resolveMessageContent(message: TeamChatRoomMessageResponse): string {
  const content = message.content?.trim();
  if (message.messageType !== 'system') {
    return content || message.content;
  }

  return content || buildSystemMessageFallbackContent(message);
}

function normalizeForwardedBodySegment(value?: string | null): string {
  return value?.replace(/\r\n/g, '\n').trim() ?? '';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildForwardedSourceBodyStripCandidates(params: {
  visibleContent?: string | null;
  rawContent?: string | null;
  nestedForwardedContent?: string | null;
  resolvedForwardedContent?: string | null;
}): string[] {
  const normalizedVisibleContent = normalizeForwardedBodySegment(params.visibleContent);
  const normalizedRawContent = normalizeForwardedBodySegment(params.rawContent);
  const normalizedNestedForwardedContent = normalizeForwardedBodySegment(params.nestedForwardedContent);
  const normalizedResolvedForwardedContent = normalizeForwardedBodySegment(params.resolvedForwardedContent);
  const candidates = new Set<string>();

  const addCandidate = (value?: string | null) => {
    const normalizedValue = normalizeForwardedBodySegment(value);
    if (!normalizedValue) return;
    candidates.add(normalizedValue);
  };

  addCandidate(normalizedRawContent);
  addCandidate(normalizedVisibleContent);
  addCandidate(normalizedResolvedForwardedContent);
  addCandidate(normalizedNestedForwardedContent);

  if (normalizedVisibleContent && normalizedNestedForwardedContent) {
    addCandidate(`${normalizedVisibleContent}\n${normalizedNestedForwardedContent}`);
    addCandidate(`${normalizedVisibleContent}\n\n${normalizedNestedForwardedContent}`);
  }

  if (normalizedRawContent && normalizedNestedForwardedContent && !normalizedRawContent.endsWith(normalizedNestedForwardedContent)) {
    addCandidate(`${normalizedRawContent}\n${normalizedNestedForwardedContent}`);
    addCandidate(`${normalizedRawContent}\n\n${normalizedNestedForwardedContent}`);
  }

  return Array.from(candidates).sort((left, right) => right.length - left.length);
}

function buildForwardedSourceBodyStripGroups(params: {
  visibleContent?: string | null;
  rawContent?: string | null;
  nestedForwardedContent?: string | null;
}): string[][] {
  const normalizedVisibleContent = normalizeForwardedBodySegment(params.visibleContent);
  const normalizedRawContent = normalizeForwardedBodySegment(params.rawContent);
  const normalizedNestedForwardedContent = normalizeForwardedBodySegment(params.nestedForwardedContent);
  const groups: string[][] = [];

  if (normalizedVisibleContent && normalizedNestedForwardedContent) {
    groups.push([normalizedVisibleContent, normalizedNestedForwardedContent]);
  }

  if (
    normalizedRawContent &&
    normalizedNestedForwardedContent &&
    normalizedRawContent !== normalizedVisibleContent &&
    !normalizedRawContent.endsWith(normalizedNestedForwardedContent)
  ) {
    groups.push([normalizedRawContent, normalizedNestedForwardedContent]);
  }

  return groups.sort(
    (left, right) =>
      right.join('\n\n').length - left.join('\n\n').length,
  );
}

function stripForwardedSourceContentFromMessageBody(
  messageContent?: string | null,
  forwardedContentCandidates: Array<string | null | undefined> = [],
  forwardedContentGroups: string[][] = [],
): string {
  const normalizedMessageContent = normalizeForwardedBodySegment(messageContent);

  if (!normalizedMessageContent) return '';

  for (const group of forwardedContentGroups) {
    const normalizedGroup = group.map((value) => normalizeForwardedBodySegment(value)).filter((value) => value.length > 0);
    if (normalizedGroup.length === 0) continue;

    const groupPattern = normalizedGroup.map((value) => escapeRegExp(value)).join('\\s+');
    const groupRegex = new RegExp(`${groupPattern}$`);
    const groupMatch = normalizedMessageContent.match(groupRegex);
    if (groupMatch && typeof groupMatch.index === 'number' && groupMatch.index > 0) {
      return normalizedMessageContent.slice(0, groupMatch.index).replace(/\s+$/, '');
    }
  }

  const normalizedForwardedCandidates = Array.from(
    new Set(
      forwardedContentCandidates
        .map((value) => normalizeForwardedBodySegment(value))
        .filter((value) => value.length > 0 && value !== normalizedMessageContent),
    ),
  ).sort((left, right) => right.length - left.length);

  for (const forwardedContent of normalizedForwardedCandidates) {
    if (normalizedMessageContent.endsWith(forwardedContent)) {
      return normalizedMessageContent
        .slice(0, normalizedMessageContent.length - forwardedContent.length)
        .replace(/\s+$/, '');
    }
  }

  return normalizedMessageContent;
}

function shouldApplyLegacyForwardedBodyStrip(params: {
  messageContent?: string | null;
  sourceVisibleContent?: string | null;
  sourceRawContent?: string | null;
  sourceNestedForwardedContent?: string | null;
  resolvedForwardedContent?: string | null;
}): boolean {
  const normalizedMessageContent = normalizeForwardedBodySegment(params.messageContent);
  if (!normalizedMessageContent) return false;

  const normalizedSourceVisibleContent = normalizeForwardedBodySegment(
    params.sourceVisibleContent,
  );
  const normalizedSourceRawContent = normalizeForwardedBodySegment(params.sourceRawContent);
  const normalizedSourceNestedForwardedContent = normalizeForwardedBodySegment(
    params.sourceNestedForwardedContent,
  );
  const normalizedResolvedForwardedContent = normalizeForwardedBodySegment(
    params.resolvedForwardedContent,
  );

  const knownForwardedSegments = [
    normalizedSourceNestedForwardedContent,
    normalizedSourceVisibleContent,
    normalizedSourceRawContent,
    normalizedResolvedForwardedContent,
  ].filter((segment): segment is string => segment.length > 0);

  const endsWithKnownForwardedSegment = knownForwardedSegments.some(
    (segment) =>
      normalizedMessageContent !== segment &&
      normalizedMessageContent.endsWith(segment),
  );

  if (
    normalizedSourceRawContent &&
    normalizedSourceRawContent !== normalizedSourceVisibleContent &&
    normalizedMessageContent === normalizedSourceRawContent
  ) {
    return true;
  }

  if (normalizedSourceVisibleContent && normalizedSourceNestedForwardedContent) {
    const combinedCandidates = new Set([
      `${normalizedSourceVisibleContent} ${normalizedSourceNestedForwardedContent}`,
      `${normalizedSourceVisibleContent}\n${normalizedSourceNestedForwardedContent}`,
      `${normalizedSourceVisibleContent}\n\n${normalizedSourceNestedForwardedContent}`,
    ]);
    if (combinedCandidates.has(normalizedMessageContent)) {
      return true;
    }
  }

  if (normalizedMessageContent.includes('\n') && endsWithKnownForwardedSegment) {
    return true;
  }

  return false;
}

function resolveLegacyForwardedSnapshotVisibleContent(params: {
  snapshotContent?: string | null;
  sourceVisibleContent?: string | null;
  sourceRawContent?: string | null;
  sourceNestedForwardedContent?: string | null;
}): string {
  const normalizedSnapshotContent = normalizeForwardedBodySegment(params.snapshotContent);
  const normalizedSourceVisibleContent = normalizeForwardedBodySegment(
    params.sourceVisibleContent,
  );
  const normalizedSourceRawContent = normalizeForwardedBodySegment(params.sourceRawContent);
  const normalizedSourceNestedForwardedContent = normalizeForwardedBodySegment(
    params.sourceNestedForwardedContent,
  );

  if (normalizedSnapshotContent) {
    if (
      normalizedSourceVisibleContent &&
      normalizedSourceRawContent &&
      normalizedSnapshotContent === normalizedSourceRawContent
    ) {
      return normalizedSourceVisibleContent;
    }

    if (normalizedSourceVisibleContent && normalizedSourceNestedForwardedContent) {
      const strippedSnapshotContent = stripForwardedSourceContentFromMessageBody(
        normalizedSnapshotContent,
        [normalizedSourceNestedForwardedContent],
      );

      if (
        strippedSnapshotContent &&
        strippedSnapshotContent !== normalizedSnapshotContent &&
        strippedSnapshotContent === normalizedSourceVisibleContent
      ) {
        return normalizedSourceVisibleContent;
      }
    }

    return normalizedSnapshotContent;
  }

  if (normalizedSourceVisibleContent) return normalizedSourceVisibleContent;

  if (normalizedSourceRawContent) {
    const normalizedSourceBody = normalizedSourceNestedForwardedContent
      ? stripForwardedSourceContentFromMessageBody(normalizedSourceRawContent, [
          normalizedSourceNestedForwardedContent,
        ])
      : normalizedSourceRawContent;

    return normalizedSourceBody || normalizedSourceRawContent;
  }

  return normalizedSourceNestedForwardedContent;
}

interface ForwardedSourceLookupRecord {
  content?: string;
  rawContent?: string;
  nestedForwardedContent?: string;
  forwardedOriginalMessageId?: string;
  contentFormat?: ConversationMessageContentFormat;
  richContent?: Record<string, unknown> | null;
}

interface ForwardedRenderOverride {
  bodyContent: string;
  forwardedMessage?: {
    originalMessageId: string;
    originalAuthor: string;
    originalContent: string;
    originalContentFormat?: ConversationMessageContentFormat;
    originalRichContent?: Record<string, unknown> | null;
    originalAvatarUrl?: string;
    originalSentAt?: string;
    attachments?: ConversationMessageAttachment[];
  };
}

function buildRecursiveForwardedSourceChain(
  startingMessageId: string | null | undefined,
  resolveForwardedSourceMessageByMessageId?: (
    messageId: string,
  ) => ForwardedSourceLookupRecord | undefined,
): string[] {
  const normalizedStartingMessageId = toNonEmptyString(startingMessageId);
  if (!normalizedStartingMessageId || !resolveForwardedSourceMessageByMessageId) return [];

  const chain: string[] = [];
  const seenMessageIds = new Set<string>();
  let currentMessageId: string | undefined = normalizedStartingMessageId;

  while (currentMessageId && !seenMessageIds.has(currentMessageId)) {
    seenMessageIds.add(currentMessageId);
    const sourceMessage = resolveForwardedSourceMessageByMessageId(currentMessageId);
    if (!sourceMessage) break;

    const normalizedVisibleContent = normalizeForwardedBodySegment(
      sourceMessage.content ?? sourceMessage.rawContent,
    );
    if (normalizedVisibleContent) {
      chain.push(normalizedVisibleContent);
    }

    currentMessageId = toNonEmptyString(sourceMessage.forwardedOriginalMessageId) ?? undefined;
  }

  return chain;
}

function buildRecursiveForwardedSourceBodyStripCandidates(chain: string[]): string[] {
  if (chain.length === 0) return [];

  const candidates = new Set<string>();

  chain.forEach((segment) => {
    const normalizedSegment = normalizeForwardedBodySegment(segment);
    if (normalizedSegment) {
      candidates.add(normalizedSegment);
    }
  });

  for (let length = 2; length <= chain.length; length += 1) {
    const normalizedSegments = chain
      .slice(0, length)
      .map((segment) => normalizeForwardedBodySegment(segment))
      .filter((segment) => segment.length > 0);
    if (normalizedSegments.length !== length) continue;
    candidates.add(normalizedSegments.join('\n'));
    candidates.add(normalizedSegments.join('\n\n'));
  }

  return Array.from(candidates).sort((left, right) => right.length - left.length);
}

function buildRecursiveForwardedSourceBodyStripGroups(chain: string[]): string[][] {
  if (chain.length < 2) return [];

  const groups: string[][] = [];

  for (let length = chain.length; length >= 2; length -= 1) {
    const normalizedSegments = chain
      .slice(0, length)
      .map((segment) => normalizeForwardedBodySegment(segment))
      .filter((segment) => segment.length > 0);
    if (normalizedSegments.length === length) {
      groups.push(normalizedSegments);
    }
  }

  return groups;
}

function buildEffectiveForwardedBodyStripChain(params: {
  resolvedForwardedContent?: string | null;
  forwardedSourceVisibleContent?: string | null;
  recursiveChain?: string[];
}): string[] {
  const normalizedResolvedForwardedContent = normalizeForwardedBodySegment(
    params.resolvedForwardedContent,
  );
  const normalizedForwardedSourceVisibleContent = normalizeForwardedBodySegment(
    params.forwardedSourceVisibleContent,
  );
  const normalizedRecursiveChain = (params.recursiveChain ?? [])
    .map((segment) => normalizeForwardedBodySegment(segment))
    .filter((segment) => segment.length > 0);

  const chain: string[] = [];
  const addSegment = (value?: string | null) => {
    const normalizedValue = normalizeForwardedBodySegment(value);
    if (!normalizedValue) return;
    if (chain[chain.length - 1] === normalizedValue) return;
    chain.push(normalizedValue);
  };

  addSegment(normalizedResolvedForwardedContent);

  if (
    normalizedForwardedSourceVisibleContent &&
    normalizedForwardedSourceVisibleContent !== normalizedResolvedForwardedContent
  ) {
    addSegment(normalizedForwardedSourceVisibleContent);
  }

  normalizedRecursiveChain.forEach((segment) => {
    addSegment(segment);
  });

  return chain;
}

export function mapAttachmentToConversationMessageAttachment(
  attachment: TeamChatMessageAttachmentResponse,
): ConversationMessageAttachment {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    fileUrl: attachment.fileUrl,
    attachmentType: attachment.attachmentType,
    mimeType: attachment.mimeType,
    fileSize: attachment.fileSize,
    documentType: normalizeDocumentType(attachment.documentType),
    previewStatus: normalizePreviewStatus(attachment.previewStatus),
    thumbnailUrl: attachment.thumbnailUrl ?? undefined,
    thumbnailUrlSmall: attachment.thumbnailUrlSmall ?? undefined,
    thumbnailUrlMedium: attachment.thumbnailUrlMedium ?? undefined,
    previewUrl: attachment.previewUrl ?? undefined,
    openUrl: resolveAttachmentOpenUrl(attachment),
    downloadUrl: resolveAttachmentDownloadUrl(attachment),
    previewWidth: attachment.previewWidth ?? undefined,
    previewHeight: attachment.previewHeight ?? undefined,
    previewPage: attachment.previewPage ?? undefined,
    pageCount: attachment.pageCount ?? undefined,
    previewUpdatedAt: attachment.previewUpdatedAt ?? undefined,
    previewErrorCode: attachment.previewErrorCode ?? undefined,
    previewVersion: attachment.previewVersion ?? undefined,
    previewAssetSource: normalizeAttachmentPreviewAssetSource(attachment.previewAssetSource),
  };
}

const FORWARDED_SNAPSHOT_IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg']);
const FORWARDED_SNAPSHOT_VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'avi', 'mkv', 'webm']);
const FORWARDED_SNAPSHOT_AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac']);
const FORWARDED_SNAPSHOT_WORD_EXTENSIONS = new Set(['doc', 'docx']);
const FORWARDED_SNAPSHOT_SPREADSHEET_EXTENSIONS = new Set(['xls', 'xlsx', 'csv']);
const FORWARDED_SNAPSHOT_PRESENTATION_EXTENSIONS = new Set(['ppt', 'pptx']);
const FORWARDED_SNAPSHOT_ARCHIVE_EXTENSIONS = new Set(['zip', 'rar', '7z', 'tar', 'gz']);
const FORWARDED_SNAPSHOT_TEXT_EXTENSIONS = new Set(['txt', 'md', 'json']);

function getForwardedSnapshotAttachmentExtension(fileName?: string | null) {
  const normalizedName = fileName?.trim();
  if (!normalizedName) return '';

  const lastDotIndex = normalizedName.lastIndexOf('.');
  if (lastDotIndex < 0) return '';

  return normalizedName.slice(lastDotIndex + 1).trim().toLowerCase();
}

function inferForwardedSnapshotAttachmentType(
  attachment: TeamChatForwardedSnapshotAttachment,
): ConversationMessageAttachment['attachmentType'] {
  const normalizedMimeType = attachment.mimeType?.trim().toLowerCase() ?? '';
  const extension = getForwardedSnapshotAttachmentExtension(attachment.fileName);

  if (
    normalizedMimeType.startsWith('image/') ||
    FORWARDED_SNAPSHOT_IMAGE_EXTENSIONS.has(extension)
  ) {
    return 'image';
  }

  if (
    normalizedMimeType.startsWith('video/') ||
    FORWARDED_SNAPSHOT_VIDEO_EXTENSIONS.has(extension)
  ) {
    return 'video';
  }

  if (
    normalizedMimeType.startsWith('audio/') ||
    FORWARDED_SNAPSHOT_AUDIO_EXTENSIONS.has(extension)
  ) {
    return 'audio';
  }

  return 'file';
}

function inferForwardedSnapshotDocumentType(
  attachment: TeamChatForwardedSnapshotAttachment,
): ConversationMessageAttachment['documentType'] {
  const normalizedMimeType = attachment.mimeType?.trim().toLowerCase() ?? '';
  const extension = getForwardedSnapshotAttachmentExtension(attachment.fileName);

  if (normalizedMimeType.includes('pdf') || extension === 'pdf') return 'pdf';
  if (
    normalizedMimeType.includes('msword') ||
    normalizedMimeType.includes('wordprocessingml') ||
    FORWARDED_SNAPSHOT_WORD_EXTENSIONS.has(extension)
  ) {
    return 'word';
  }
  if (
    normalizedMimeType.includes('spreadsheet') ||
    normalizedMimeType.includes('excel') ||
    FORWARDED_SNAPSHOT_SPREADSHEET_EXTENSIONS.has(extension)
  ) {
    return 'excel';
  }
  if (
    normalizedMimeType.includes('presentation') ||
    normalizedMimeType.includes('powerpoint') ||
    FORWARDED_SNAPSHOT_PRESENTATION_EXTENSIONS.has(extension)
  ) {
    return 'powerpoint';
  }
  if (
    normalizedMimeType.includes('zip') ||
    normalizedMimeType.includes('rar') ||
    normalizedMimeType.includes('tar') ||
    normalizedMimeType.includes('7z') ||
    FORWARDED_SNAPSHOT_ARCHIVE_EXTENSIONS.has(extension)
  ) {
    return 'archive';
  }
  if (
    normalizedMimeType.includes('json') ||
    normalizedMimeType.includes('markdown') ||
    normalizedMimeType.includes('text/plain') ||
    normalizedMimeType.includes('text/csv') ||
    FORWARDED_SNAPSHOT_TEXT_EXTENSIONS.has(extension)
  ) {
    return 'text';
  }

  return 'unknown';
}

function mapForwardedSnapshotAttachmentToConversationMessageAttachment(
  attachment: TeamChatForwardedSnapshotAttachment,
  params: { fallbackMessageId: string; index: number },
): ConversationMessageAttachment {
  const fileName =
    toNonEmptyString(attachment.fileName) ?? `Attachment ${params.index + 1}`;
  const fileUrl = toNonEmptyString(attachment.fileUrl) ?? '';

  return {
    id: `forwarded-${params.fallbackMessageId}-${params.index}`,
    fileName,
    fileUrl,
    attachmentType: inferForwardedSnapshotAttachmentType(attachment),
    mimeType: attachment.mimeType ?? undefined,
    fileSize: undefined,
    documentType: inferForwardedSnapshotDocumentType(attachment),
    previewStatus: undefined,
    thumbnailUrl: undefined,
    thumbnailUrlSmall: undefined,
    thumbnailUrlMedium: undefined,
    previewUrl: undefined,
    openUrl: resolveAttachmentOpenUrl({ fileUrl }),
    downloadUrl: resolveAttachmentDownloadUrl({ fileUrl }),
    previewWidth: undefined,
    previewHeight: undefined,
    previewPage: undefined,
    pageCount: undefined,
    previewUpdatedAt: undefined,
    previewErrorCode: undefined,
    previewVersion: undefined,
    previewAssetSource: undefined,
  };
}
function mapMessageLinkPreview(
  preview: TeamChatMessageLinkPreviewResponse,
) {
  const normalizedTitle =
    preview.resourceTitle?.trim() ||
    preview.title?.trim() ||
    preview.displayUrl?.trim() ||
    preview.url;
  const normalizedDescription = preview.description?.trim() || preview.excerpt?.trim() || undefined;
  const thumbnailUrl = toNonEmptyString(preview.thumbnailUrl);
  const imageUrl = toNonEmptyString(preview.imageUrl);
  const previewAssetStatus = normalizeLinkPreviewAssetStatus(preview.previewAssetStatus);
  const previewAssetSource = normalizeLinkPreviewAssetSource(preview.previewAssetSource);
  const explicitAssetState = hasExplicitTeamChatLinkPreviewAssetState(preview);
  const previewImageUrl = explicitAssetState
    ? toNonEmptyString(preview.previewImageUrl)
    : toNonEmptyString(preview.previewImageUrl) ?? imageUrl ?? thumbnailUrl;

  return {
    url: preview.url,
    canonicalUrl: preview.canonicalUrl?.trim() || undefined,
    displayUrl: preview.displayUrl?.trim() || undefined,
    title: normalizedTitle,
    resourceTitle: preview.resourceTitle?.trim() || undefined,
    caption:
      preview.resourceTypeLabel?.trim() ||
      preview.providerName?.trim() ||
      preview.siteName?.trim() ||
      preview.provider?.trim() ||
      preview.url,
    description: normalizedDescription,
    excerpt: preview.excerpt?.trim() || undefined,
    imageUrl,
    thumbnailUrl,
    previewImageUrl,
    previewImageAlt: preview.previewImageAlt?.trim() || normalizedTitle,
    previewImageWidth: preview.previewImageWidth ?? preview.width ?? undefined,
    previewImageHeight: preview.previewImageHeight ?? preview.height ?? undefined,
    provider: preview.provider ?? undefined,
    providerName: preview.providerName?.trim() || undefined,
    providerIconUrl: preview.providerIconUrl?.trim() || undefined,
    siteName: preview.siteName?.trim() || undefined,
    type: preview.type ?? undefined,
    mediaType: preview.mediaType ?? undefined,
    mimeType: preview.mimeType ?? undefined,
    resourceType: preview.resourceType ?? undefined,
    resourceTypeLabel: preview.resourceTypeLabel?.trim() || undefined,
    embedUrl: preview.embedUrl?.trim() || undefined,
    width: preview.width ?? preview.previewImageWidth ?? undefined,
    height: preview.height ?? preview.previewImageHeight ?? undefined,
    durationMs: preview.durationMs ?? undefined,
    status: preview.status ?? undefined,
    fetchedAt: preview.fetchedAt ?? undefined,
    previewAssetId: preview.previewAssetId?.trim() || undefined,
    previewAssetStatus,
    previewAssetSource,
    previewAssetErrorCode: preview.previewAssetErrorCode?.trim() || undefined,
    previewVersion: preview.previewVersion?.trim() || undefined,
    internalReference: preview.internalReference
      ? {
          kind: preview.internalReference.kind,
          roomId: preview.internalReference.roomId,
          messageId: preview.internalReference.messageId,
          deepLinkUrl: preview.internalReference.deepLinkUrl?.trim() || undefined,
          previewState: preview.internalReference.previewState?.trim() || undefined,
          roomSnapshot: preview.internalReference.roomSnapshot
            ? {
                id: preview.internalReference.roomSnapshot.id,
                roomType: preview.internalReference.roomSnapshot.roomType ?? undefined,
                visibility: preview.internalReference.roomSnapshot.visibility ?? undefined,
                name: preview.internalReference.roomSnapshot.name?.trim() || undefined,
                roomKey: preview.internalReference.roomSnapshot.roomKey?.trim() || undefined,
              }
            : undefined,
          messageSnapshot: preview.internalReference.messageSnapshot
            ? {
                id: preview.internalReference.messageSnapshot.id,
                authorId: preview.internalReference.messageSnapshot.authorId?.trim() || undefined,
                authorName:
                  preview.internalReference.messageSnapshot.authorName?.trim() || undefined,
                authorAvatarUrl:
                  preview.internalReference.messageSnapshot.authorAvatarUrl?.trim() || undefined,
                contentPreview:
                  preview.internalReference.messageSnapshot.contentPreview?.trim() || undefined,
                createdAt:
                  preview.internalReference.messageSnapshot.createdAt?.trim() || undefined,
                isDeleted:
                  preview.internalReference.messageSnapshot.isDeleted ?? undefined,
                hasAttachments:
                  preview.internalReference.messageSnapshot.hasAttachments ?? undefined,
              }
            : undefined,
        }
      : undefined,
  };
}

export function buildConversationKeyFromRoom(room: TeamChatRoomSummaryResponse): ConversationKey {
  if (room.roomType === 'channel') return `channel:${room.id}`;
  if (room.roomType === 'group_dm') return `group_dm:${room.id}`;
  return `dm:${room.id}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseUnreadAggregateCount(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.trunc(parsed));
}

function toUnreadAggregatesPayload(value: unknown): TeamChatUnreadAggregates | null {
  if (!isRecord(value)) return null;

  const roomUnreadMessageCount = parseUnreadAggregateCount(value.roomUnreadMessageCount);
  const myInboxUnreadItemCount = parseUnreadAggregateCount(value.myInboxUnreadItemCount);
  const myInboxUnreadMessageCount = parseUnreadAggregateCount(value.myInboxUnreadMessageCount);
  const notificationUnreadCount = parseUnreadAggregateCount(value.notificationUnreadCount);

  if (
    roomUnreadMessageCount === null ||
    myInboxUnreadItemCount === null ||
    myInboxUnreadMessageCount === null ||
    notificationUnreadCount === null
  ) {
    return null;
  }

  return {
    roomUnreadMessageCount,
    myInboxUnreadItemCount,
    myInboxUnreadMessageCount,
    notificationUnreadCount,
  };
}

function toUnreadSummaryPayload(unreadSummary: unknown): TeamChatUnreadSummaryResponse | null {
  if (!isRecord(unreadSummary)) return null;

  if (Array.isArray(unreadSummary.rooms)) {
    return {
      totalUnread: parseUnreadCount(unreadSummary.totalUnread),
      rooms: extractUnreadRoomSummaries(unreadSummary),
      aggregates: toUnreadAggregatesPayload(unreadSummary.aggregates),
    };
  }

  if (isRecord(unreadSummary.data)) {
    return toUnreadSummaryPayload(unreadSummary.data);
  }

  return null;
}

function parseUnreadCount(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.trunc(parsed));
}

function buildReactionReactorDisplayName(
  reactor: TeamChatMessageReactionReactorResponse,
): string {
  const fullName = [reactor.firstName, reactor.lastName].filter(Boolean).join(' ').trim();
  return fullName || reactor.displayName || reactor.email || reactor.userId;
}

function mapReactionReactor(
  reactor: TeamChatMessageReactionReactorResponse,
): MessageReactionReactor {
  return {
    userId: reactor.userId,
    displayName: buildReactionReactorDisplayName(reactor),
    avatarUrl: reactor.avatarUrl ?? undefined,
    email: reactor.email ?? undefined,
    reactedAt: reactor.reactedAt ?? undefined,
  };
}

function resolveRoomAttachmentId(attachment: TeamChatRoomAttachmentResponse): string {
  return attachment.attachmentId ?? attachment.id ?? `${attachment.messageId}-${attachment.fileName}`;
}

export function extractUnreadRoomSummaries(
  unreadSummary?: TeamChatUnreadSummaryResponse | null | unknown,
): TeamChatUnreadRoomSummaryResponse[] {
  const parseRooms = (roomsPayload: unknown[]): TeamChatUnreadRoomSummaryResponse[] =>
    roomsPayload.reduce<TeamChatUnreadRoomSummaryResponse[]>((rooms, room) => {
      if (!isRecord(room)) return rooms;
      if (typeof room.roomId !== 'string' || !room.roomId) return rooms;

    const roomType =
      room.roomType === 'channel' || room.roomType === 'dm' || room.roomType === 'group_dm'
        ? room.roomType
        : 'channel';

    rooms.push({
      roomId: room.roomId,
      roomName: typeof room.roomName === 'string' ? room.roomName : '',
      roomType,
      unreadCount: parseUnreadCount(room.unreadCount),
      lastReadMessageId:
        typeof room.lastReadMessageId === 'string' ? room.lastReadMessageId : null,
      lastReadAt: typeof room.lastReadAt === 'string' ? room.lastReadAt : null,
      lastMessageAt: typeof room.lastMessageAt === 'string' ? room.lastMessageAt : null,
    });

      return rooms;
    }, []);

  if (isRecord(unreadSummary) && Array.isArray(unreadSummary.rooms)) {
    return parseRooms(unreadSummary.rooms);
  }

  const payload = toUnreadSummaryPayload(unreadSummary);
  if (!payload?.rooms) return [];
  return parseRooms(payload.rooms);
}

export function buildUnreadCountMap(unreadSummary?: TeamChatUnreadSummaryResponse | null) {
  const unreadMap = new Map<string, number>();
  extractUnreadRoomSummaries(unreadSummary).forEach((room) => {
    unreadMap.set(room.roomId, room.unreadCount);
  });
  return unreadMap;
}

export function buildPresenceMap(presenceList?: TeamChatPresenceResponse[] | null) {
  const presenceMap = new Map<string, TeamChatPresenceResponse>();
  presenceList?.forEach((presence) => {
    presenceMap.set(presence.userId, presence);
  });
  return presenceMap;
}

export function mapRoomToWorkspaceChannel(
  room: TeamChatRoomSummaryResponse,
  unreadCountMap: Map<string, number>,
): WorkspaceChannel {
  return {
    id: room.id,
    name: room.name || room.roomKey || 'Untitled channel',
    unread: unreadCountMap.get(room.id) ?? 0,
    visibility: room.visibility,
    memberCount: room.memberCount,
    topic: room.topic ?? room.description ?? 'Channel conversation',
    lastMessageSnippet: room.lastMessageSnippet ?? undefined,
  };
}

function resolveInternalMessageLinkPreviewBody(
  preview: LinkPreview,
): string | undefined {
  const internalReference = preview.internalReference;
  if (internalReference?.kind !== 'team_chat_message') return undefined;

  const previewState = internalReference.previewState?.trim().toLowerCase();
  if (previewState === 'forbidden') {
    return 'You do not have access to preview the linked message.';
  }

  if (
    previewState === 'message_deleted' ||
    previewState === 'message_not_found' ||
    internalReference.messageSnapshot?.isDeleted
  ) {
    return 'This message was deleted.';
  }

  const snapshotPreview = internalReference.messageSnapshot?.contentPreview?.trim();
  return snapshotPreview || undefined;
}

function resolveForwardedInternalMessageLinkContent(
  content: string | undefined,
  linkPreviews: LinkPreview[],
): string | undefined {
  const normalizedContent = content?.trim();
  if (!normalizedContent) return undefined;

  const parsedMessageLink = parseTeamChatMessageLink(normalizedContent);
  if (!parsedMessageLink) return undefined;

  const matchedPreview = linkPreviews.find((preview) => {
    const internalReference = preview.internalReference;
    if (internalReference?.kind !== 'team_chat_message') return false;

    return (
      internalReference.roomId.trim() === parsedMessageLink.roomId &&
      internalReference.messageId.trim() === parsedMessageLink.messageId
    );
  });
  if (!matchedPreview) return undefined;

  return resolveInternalMessageLinkPreviewBody(matchedPreview);
}

function shouldKeepForwardedMessageLinkPreview(
  preview: LinkPreview,
  visibleMessageContent: string,
): boolean {
  const internalReference = preview.internalReference;
  if (internalReference?.kind !== 'team_chat_message') return true;

  const normalizedMessageContent = visibleMessageContent.trim().toLowerCase();
  if (!normalizedMessageContent) return false;

  const previewUrlCandidates = [preview.url, preview.canonicalUrl, preview.displayUrl]
    .map((value) => toNonEmptyString(value)?.toLowerCase())
    .filter((value): value is string => Boolean(value));
  if (previewUrlCandidates.length === 0) return false;

  return previewUrlCandidates.some((candidate) => normalizedMessageContent.includes(candidate));
}

export function mapDiscoverRoomToChannel(
  room: TeamChatDiscoverRoomSummaryResponse,
): DiscoverableChannel {
  return {
    id: room.id,
    name: room.name || room.roomKey || 'Untitled channel',
    roomKey: room.roomKey ?? undefined,
    visibility: room.visibility,
    topic: room.topic ?? undefined,
    description: room.description ?? undefined,
    memberCount: room.memberCount,
    lastMessageAt: room.lastMessageAt ?? undefined,
    updatedAt: room.updatedAt,
    viewerState: {
      membershipStatus: normalizeViewerMembershipStatus(room.viewerState?.membershipStatus),
      isInvited: Boolean(room.viewerState?.isInvited),
      canViewPreview: Boolean(room.viewerState?.canViewPreview),
      canJoin: Boolean(room.viewerState?.canJoin),
    },
  };
}

export function mapRoomPreviewToDiscoverChannel(
  room: TeamChatRoomPreviewResponse,
): DiscoverableChannel {
  return {
    id: room.id,
    name: room.name || room.roomKey || 'Untitled channel',
    roomKey: room.roomKey ?? undefined,
    visibility: room.visibility,
    topic: room.topic ?? undefined,
    description: room.description ?? undefined,
    memberCount: room.memberCount,
    updatedAt: room.updatedAt,
    createdByDisplayName: room.createdByDisplayName ?? undefined,
    isArchived: room.isArchived,
    viewerState: {
      membershipStatus: normalizeViewerMembershipStatus(room.viewerState?.membershipStatus),
      isInvited: Boolean(room.viewerState?.isInvited),
      canViewPreview: Boolean(room.viewerState?.canViewPreview),
      canJoin: Boolean(room.viewerState?.canJoin),
    },
  };
}

export function mapRoomToDirectMessageContact(
  room: TeamChatRoomDetailResponse | TeamChatRoomSummaryResponse,
  options: {
    currentUserId?: string | null;
    currentUserDisplayName?: string | null;
    currentUserEmail?: string | null;
    unreadCountMap: Map<string, number>;
    presenceMap: Map<string, TeamChatPresenceResponse>;
  },
): DirectMessageContact {
  const members = 'members' in room ? room.members : [];
  const summaryCounterpart = room.dmCounterpart;
  const isSelfDmByMembers =
    Boolean(options.currentUserId) &&
    members.length > 0 &&
    members.every((member) => member.userId === options.currentUserId);
  const isSelfDmBySummary =
    Boolean(options.currentUserId) &&
    room.roomType === 'dm' &&
    room.memberCount <= 1 &&
    room.ownerId === options.currentUserId;
  const isSelfDm = isSelfDmByMembers || isSelfDmBySummary;
  const counterpart =
    members.find((member) => member.userId !== options.currentUserId) ?? members[0] ?? null;
  const counterpartDisplayName = toSummaryPreviewDisplayName(summaryCounterpart);
  const selfPresence = options.currentUserId
    ? options.presenceMap.get(options.currentUserId)
    : undefined;
  const summaryCounterpartPresence = summaryCounterpart?.userId
    ? options.presenceMap.get(summaryCounterpart.userId)
    : undefined;
  const counterpartPresence = counterpart
    ? options.presenceMap.get(counterpart.userId)
    : undefined;
  const realtimeCounterpartPresence = counterpartPresence ?? summaryCounterpartPresence;
  const resolvedSelfDmName =
    options.currentUserDisplayName?.trim() ||
    options.currentUserEmail?.trim() ||
    counterpartDisplayName ||
    (counterpart ? toDisplayName(counterpart) : '') ||
    room.name ||
    'Direct message';

  return {
    id: room.id,
    source: 'room',
    roomId: room.id,
    userId:
      isSelfDm
        ? options.currentUserId ?? summaryCounterpart?.userId ?? counterpart?.userId
        : summaryCounterpart?.userId ?? counterpart?.userId,
    name: isSelfDm
      ? resolvedSelfDmName
      : counterpartDisplayName || (counterpart ? toDisplayName(counterpart) : room.name || 'Direct message'),
    unread: options.unreadCountMap.get(room.id) ?? 0,
    status: toPresenceStatus(
      isSelfDm
        ? selfPresence?.presenceStatus
        : realtimeCounterpartPresence?.presenceStatus ?? summaryCounterpart?.presenceStatus,
    ),
    avatarUrl: summaryCounterpart?.avatarUrl ?? counterpart?.avatarUrl ?? undefined,
    role: isSelfDm ? 'Message yourself' : counterpart?.memberRole ?? undefined,
    email: summaryCounterpart?.email ?? counterpart?.email ?? undefined,
    localTime:
      formatTimeLabel(
        isSelfDm
          ? selfPresence?.lastActivityAt
          : realtimeCounterpartPresence?.lastActivityAt ?? summaryCounterpart?.lastActivityAt,
      ) || '--',
    lastMessageSnippet: room.lastMessageSnippet ?? undefined,
  };
}


function buildGroupDirectMessageFallbackName(
  room: TeamChatRoomDetailResponse | TeamChatRoomSummaryResponse,
  currentUserId?: string | null,
): string {
  if (room.name?.trim()) return room.name.trim();

  const previewNames =
    room.groupMemberPreview
      ?.map((member) => toSummaryPreviewDisplayName(member))
      .filter(Boolean) ?? [];
  if (previewNames.length > 0) {
    if (previewNames.length <= 3) {
      return previewNames.join(', ');
    }

    return `${previewNames.slice(0, 2).join(', ')} +${previewNames.length - 2}`;
  }

  const members = 'members' in room ? room.members : [];
  const visibleMembers = members.filter((member) => member.userId !== currentUserId);
  const visibleNames = visibleMembers.map(toDisplayName).filter(Boolean);

  if (visibleNames.length === 0) {
    return 'Group chat';
  }

  if (visibleNames.length <= 3) {
    return visibleNames.join(', ');
  }

  return `${visibleNames.slice(0, 2).join(', ')} +${visibleNames.length - 2}`;
}

export function mapRoomToGroupDirectMessageConversation(
  room: TeamChatRoomDetailResponse | TeamChatRoomSummaryResponse,
  options: {
    currentUserId?: string | null;
    unreadCountMap: Map<string, number>;
  },
): GroupDirectMessageConversation {
  const memberCount = room.memberCount > 0 ? room.memberCount : 'members' in room ? room.members.length : 0;
  const memberPreview =
    room.groupMemberPreview?.map((member) => ({
      id: member.userId,
      name: toSummaryPreviewDisplayName(member) || member.userId,
      avatarUrl: member.avatarUrl ?? undefined,
    })) ?? [];

  return {
    id: room.id,
    roomId: room.id,
    name: buildGroupDirectMessageFallbackName(room, options.currentUserId),
    unread: options.unreadCountMap.get(room.id) ?? 0,
    topic: room.topic ?? undefined,
    description: room.description ?? undefined,
    memberCount,
    isArchived: room.isArchived,
    myRole: room.myRole,
    lastMessageSnippet: room.lastMessageSnippet ?? undefined,
    memberPreview,
    memberPreviewOverflowCount:
      room.groupMemberPreviewHasMore && memberCount > memberPreview.length
        ? Math.max(0, memberCount - memberPreview.length)
        : undefined,
  };
}

export function mapPresenceToDirectMessageContact(
  presence: TeamChatPresenceResponse,
): DirectMessageContact {
  return {
    id: `user:${presence.userId}`,
    source: 'directory',
    userId: presence.userId,
    roomId: undefined,
    name: toPresenceDisplayName(presence),
    unread: 0,
    status: toPresenceStatus(presence.presenceStatus),
    avatarUrl: undefined,
    role: undefined,
    email: presence.email ?? undefined,
    localTime: formatTimeLabel(presence.lastActivityAt) || '--',
  };
}

export function mapMemberToChannelMember(
  member: TeamChatRoomMemberResponse,
  presenceMap: Map<string, TeamChatPresenceResponse>,
): ChannelMember {
  const presence = presenceMap.get(member.userId);
  return {
    id: member.userId,
    name: toDisplayName(member),
    displayName: member.email ?? undefined,
    role: member.memberRole,
    status: toPresenceStatus(presence?.presenceStatus),
    email: member.email ?? '--',
    localTime: formatTimeLabel(presence?.lastActivityAt) || '--',
    avatarUrl: member.avatarUrl ?? undefined,
  };
}

export function defaultChannelTabs(): ChannelDetailTabItem[] {
  return [
    { id: 'messages', label: 'Messages' },
    { id: 'files', label: 'Files' },
    { id: 'photos', label: 'Photos' },
    { id: 'pins', label: 'Pins' },
  ];
}

export function mapReactionSummaryToMessageReaction(
  reaction: TeamChatMessageReactionSummaryResponse,
): MessageReaction {
  return {
    emoji: reaction.emoji,
    count: reaction.count,
    reacted: reaction.reactedByMe,
    reactors: reaction.reactors?.map(mapReactionReactor),
  };
}

export function mapMessageToConversationMessage(
  message: TeamChatRoomMessageResponse,
  options: {
    currentUserId?: string | null;
    reactions?: TeamChatMessageReactionSummaryResponse[];
    attachments?: TeamChatMessageAttachmentResponse[];
    isPinned?: boolean;
    resolveForwardedAuthorByMessageId?: (messageId: string) => string | undefined;
    resolveForwardedSourceMessageByMessageId?: (messageId: string) =>
      | {
          author?: string;
          content?: string;
          rawContent?: string;
          nestedForwardedContent?: string;
          forwardedOriginalMessageId?: string;
          contentFormat?: ConversationMessageContentFormat;
          richContent?: Record<string, unknown> | null;
          sentAt?: string;
          avatarUrl?: string;
          isForwarded?: boolean;
        }
      | undefined;
    resolveForwardedRenderOverrideByMessageId?: (
      messageId: string,
    ) => ForwardedRenderOverride | undefined;
  },
): ConversationMessage {
  const replyPreview = message.replyPreview;
  const forwardedSnapshot = resolveForwardedSnapshot(message);
  const metadata = isRecord(message.metadata) ? message.metadata : undefined;
  const forwardedConversationKey = buildForwardedSourceConversationKey(message, forwardedSnapshot);
  const forwardedConversationKind: ConversationKind = forwardedConversationKey.startsWith('channel:')
    ? 'channel'
    : forwardedConversationKey.startsWith('group_dm:')
      ? 'group_dm'
      : 'dm';
  const forwardedConversationLabel = normalizeForwardedSourceConversationLabel(
    forwardedConversationKey,
    toNonEmptyString(forwardedSnapshot?.sourceConversationLabel) ??
      toNonEmptyString(metadata?.['forwardedFromConversationLabel']) ??
      toNonEmptyString(metadata?.['sourceConversationLabel']) ??
      null,
  );
  const forwardedConversationVisibility =
    forwardedConversationKind === 'channel'
      ? resolveForwardedSourceConversationVisibility(forwardedSnapshot)
      : undefined;
  const forwardedSnapshotAuthor = buildForwardedSnapshotAuthor(message, {
    snapshot: forwardedSnapshot,
    replyPreview,
    sourceConversationKey: forwardedConversationKey,
    sourceConversationLabel: forwardedConversationLabel,
  });
  const forwardedSourceMessageId = toNonEmptyString(message.metadata?.forwardedFromMessageId);
  const snapshotOriginalMessageId = toNonEmptyString(forwardedSnapshot?.originalMessageId);
  const forwardedSourceLookupMessageId = forwardedSourceMessageId ?? snapshotOriginalMessageId;
  const forwardedOriginalMessageId =
    forwardedSourceMessageId ??
    snapshotOriginalMessageId ??
    message.id;
  const forwardedSourceMessage =
    forwardedSourceLookupMessageId && options.resolveForwardedSourceMessageByMessageId
      ? options.resolveForwardedSourceMessageByMessageId(forwardedSourceLookupMessageId)
      : undefined;
  const forwardedAuthorFromLookup =
    options
      .resolveForwardedAuthorByMessageId?.(forwardedOriginalMessageId)
      ?.trim() || undefined;
  const forwardedSourceAuthor = forwardedSourceMessage?.author?.trim() || undefined;
  const normalizedSnapshotForwardedContent = forwardedSnapshot?.originalContent?.trim();
  const shouldFlattenForwardedSource = Boolean(
    !normalizedSnapshotForwardedContent &&
    forwardedSourceLookupMessageId &&
    forwardedSourceMessage &&
    (forwardedSourceMessage.isForwarded ||
      (snapshotOriginalMessageId && snapshotOriginalMessageId !== forwardedSourceLookupMessageId)),
  );
  const shouldPreferLookupAuthor =
    Boolean(forwardedAuthorFromLookup) &&
    (shouldFlattenForwardedSource ||
      forwardedSnapshotAuthor === 'Unknown user' ||
      (forwardedConversationKind === 'dm' &&
        forwardedSnapshotAuthor.trim() === forwardedConversationLabel.trim()));
  const resolvedForwardedAuthor = shouldFlattenForwardedSource
    ? forwardedSnapshotAuthor !== 'Unknown user'
      ? forwardedSnapshotAuthor
      : forwardedSourceAuthor ?? forwardedAuthorFromLookup ?? forwardedSnapshotAuthor
    : shouldPreferLookupAuthor
      ? forwardedAuthorFromLookup
      : forwardedSnapshotAuthor;
  const resolvedForwardedSourceContent = resolveLegacyForwardedSnapshotVisibleContent({
    snapshotContent: normalizedSnapshotForwardedContent,
    sourceVisibleContent: forwardedSourceMessage?.content,
    sourceRawContent: forwardedSourceMessage?.rawContent,
    sourceNestedForwardedContent: forwardedSourceMessage?.nestedForwardedContent,
  });
  const resolvedForwardedContentRaw =
    resolvedForwardedSourceContent ||
    forwardedSourceMessage?.nestedForwardedContent?.trim() ||
    message.content;
  const snapshotForwardedSentAt =
    toNonEmptyString(forwardedSnapshot?.originalSentAt) ??
    toNonEmptyString(forwardedSnapshot?.['originalTime']) ??
    toNonEmptyString(forwardedSnapshot?.['originalCreatedAt']);
  const snapshotForwardedAvatarUrl =
    toNonEmptyString(forwardedSnapshot?.originalSenderAvatarUrl) ??
    toNonEmptyString(forwardedSnapshot?.['originalAvatarUrl']);
  const resolvedForwardedSentAt =
    snapshotForwardedSentAt ?? forwardedSourceMessage?.sentAt ?? message.sentAt;
  const resolvedForwardedAvatarUrl =
    snapshotForwardedAvatarUrl ??
    forwardedSourceMessage?.avatarUrl ??
    replyPreview?.senderAvatarUrl ??
    undefined;
  const linkPreviews = (message.linkPreviews ?? [])
    .filter((preview) => typeof preview.url === 'string' && preview.url.trim().length > 0)
    .map(mapMessageLinkPreview);
  const resolvedForwardedContent =
    resolveForwardedInternalMessageLinkContent(resolvedForwardedContentRaw, linkPreviews) ??
    resolvedForwardedContentRaw;
  const forwardedBodyStripCandidates = buildForwardedSourceBodyStripCandidates({
    visibleContent: forwardedSourceMessage?.content,
    rawContent: forwardedSourceMessage?.rawContent,
    nestedForwardedContent: forwardedSourceMessage?.nestedForwardedContent,
    resolvedForwardedContent,
  });
  const forwardedBodyStripGroups = buildForwardedSourceBodyStripGroups({
    visibleContent: forwardedSourceMessage?.content,
    rawContent: forwardedSourceMessage?.rawContent,
    nestedForwardedContent: forwardedSourceMessage?.nestedForwardedContent,
  });
  const recursiveForwardedBodyStripChain = buildRecursiveForwardedSourceChain(
    forwardedSourceLookupMessageId,
    options.resolveForwardedSourceMessageByMessageId,
  );
  const effectiveForwardedBodyStripChain = buildEffectiveForwardedBodyStripChain({
    resolvedForwardedContent: shouldFlattenForwardedSource
      ? resolvedForwardedContent
      : undefined,
    forwardedSourceVisibleContent: forwardedSourceMessage?.content,
    recursiveChain: recursiveForwardedBodyStripChain,
  });
  const recursiveForwardedBodyStripCandidates =
    buildRecursiveForwardedSourceBodyStripCandidates(effectiveForwardedBodyStripChain);
  const recursiveForwardedBodyStripGroups =
    buildRecursiveForwardedSourceBodyStripGroups(effectiveForwardedBodyStripChain);
  const forwardedRenderOverride = options.resolveForwardedRenderOverrideByMessageId?.(message.id);
  const overrideForwardedMessage = forwardedRenderOverride?.forwardedMessage;
  const hasForwardedPreview = Boolean(forwardedSnapshot || overrideForwardedMessage);
  const resolvedMessageContent = resolveMessageContent(message);
  const shouldStripLegacyForwardedBody =
    hasForwardedPreview &&
    shouldApplyLegacyForwardedBodyStrip({
      messageContent: resolvedMessageContent,
      sourceVisibleContent: forwardedSourceMessage?.content,
      sourceRawContent: forwardedSourceMessage?.rawContent,
      sourceNestedForwardedContent: forwardedSourceMessage?.nestedForwardedContent,
      resolvedForwardedContent,
    });
  const visibleForwardedBodyContent = hasForwardedPreview
    ? shouldStripLegacyForwardedBody
      ? stripForwardedSourceContentFromMessageBody(
        resolvedMessageContent,
        [
          ...forwardedBodyStripCandidates,
          ...recursiveForwardedBodyStripCandidates,
          overrideForwardedMessage?.originalContent,
        ],
        [...forwardedBodyStripGroups, ...recursiveForwardedBodyStripGroups],
      )
      : resolvedMessageContent
    : resolvedMessageContent;
  const normalizedOverrideBodyContent = forwardedRenderOverride?.bodyContent.trim() ?? '';
  const shouldUseForwardedRenderOverrideBody =
    Boolean(forwardedRenderOverride) &&
    !Boolean(message.isEdited) &&
    normalizedOverrideBodyContent !== visibleForwardedBodyContent;
  const visibleMessageContent = message.isDeleted
    ? 'This message was deleted.'
    : shouldUseForwardedRenderOverrideBody
      ? forwardedRenderOverride?.bodyContent ?? visibleForwardedBodyContent
      : visibleForwardedBodyContent;
  const visibleLinkPreviews = hasForwardedPreview
    ? linkPreviews.filter((preview) =>
        shouldKeepForwardedMessageLinkPreview(preview, visibleMessageContent),
      )
    : linkPreviews;
  const linkPreviewStatus = toNonEmptyString(message.metadata?.linkPreviewStatus);
  const linkPreviewPendingUrls = Array.isArray(message.metadata?.linkPreviewPendingUrls)
    ? message.metadata.linkPreviewPendingUrls
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    : [];
  const linkPreviewFailedUrls = Array.isArray(message.metadata?.linkPreviewFailedUrls)
    ? message.metadata.linkPreviewFailedUrls
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    : [];
  const linkPreviewVersion = toNonEmptyString(message.metadata?.linkPreviewVersion);

  const mappedMessageAttachments = (message.attachments ?? options.attachments)?.map(
    mapAttachmentToConversationMessageAttachment,
  ) ?? [];
  const mappedReactions = (options.reactions ?? message.reactionSummaries)?.map(
    mapReactionSummaryToMessageReaction,
  );
  const mappedForwardedSnapshotAttachments = (forwardedSnapshot?.attachments ?? [])
    .filter(
      (attachment) =>
        Boolean(toNonEmptyString(attachment.fileUrl)) ||
        Boolean(toNonEmptyString(attachment.fileName)),
    )
    .map((attachment, index) =>
      mapForwardedSnapshotAttachmentToConversationMessageAttachment(attachment, {
        fallbackMessageId: forwardedOriginalMessageId,
        index,
      }),
    );
  const visibleMessageAttachments = hasForwardedPreview ? [] : mappedMessageAttachments;
  const visibleForwardedAttachments = hasForwardedPreview
    ? overrideForwardedMessage
      ? overrideForwardedMessage.attachments ?? []
      : mappedMessageAttachments.length > 0
        ? mappedMessageAttachments
        : mappedForwardedSnapshotAttachments
    : [];
  const resolvedMessageContentFormat = normalizeTeamChatMessageContentFormat(message.contentFormat);
  const resolvedMessageRichContent = normalizeRichContentPayload(message.richContent) ?? null;
  const resolvedForwardedOriginalContentFormat =
    normalizeTeamChatMessageContentFormat(overrideForwardedMessage?.originalContentFormat) ??
    normalizeTeamChatMessageContentFormat(forwardedSnapshot?.originalContentFormat) ??
    normalizeTeamChatMessageContentFormat(forwardedSourceMessage?.contentFormat);
  const resolvedForwardedOriginalRichContent =
    normalizeRichContentPayload(overrideForwardedMessage?.originalRichContent) ??
    normalizeRichContentPayload(forwardedSnapshot?.originalRichContent) ??
    normalizeRichContentPayload(forwardedSourceMessage?.richContent) ??
    null;

  return {
    id: message.id,
    clientMessageId: message.clientMessageId ?? undefined,
    parentMessageId: message.parentMessageId ?? undefined,
    author: buildMessageAuthorName(message),
    handle: (message.senderEmail ?? 'user').split('@')[0] ?? 'user',
    time: formatTimeLabel(message.sentAt),
    sentAt: message.sentAt,
    messageType: message.messageType,
    isSystem: message.messageType === 'system',
    isDeleted: Boolean(message.isDeleted),
    isEdited: Boolean(message.isEdited),
    content: visibleMessageContent,
    contentFormat: resolvedMessageContentFormat,
    richContent: resolvedMessageRichContent,
    avatarUrl: message.senderAvatarUrl ?? undefined,
    isOwn: message.senderId === options.currentUserId,
    quote: replyPreview
      ? {
          author: buildReplyPreviewAuthor(replyPreview),
          time: formatTimeLabel(replyPreview.sentAt),
          content: replyPreview.content?.trim() || 'Original message',
        }
      : undefined,
    reactions: mappedReactions,
    attachments: visibleMessageAttachments.length > 0 ? visibleMessageAttachments : undefined,
    isPinned: options.isPinned,
    linkPreviews: visibleLinkPreviews,
    linkPreview: visibleLinkPreviews[0],
    linkPreviewStatus,
    linkPreviewPendingUrls,
    linkPreviewFailedUrls,
    linkPreviewVersion,
    forwardedMessage: hasForwardedPreview
      ? {
          sourceConversationKey: forwardedConversationKey,
          sourceConversationKind: forwardedConversationKind,
          sourceConversationVisibility: forwardedConversationVisibility,
          sourceConversationLabel: forwardedConversationLabel,
          sourceConversationContext: forwardedConversationLabel,
          sourceDateLabel:
            formatDateLabel(overrideForwardedMessage?.originalSentAt ?? resolvedForwardedSentAt) || '--',
          originalMessageId:
            overrideForwardedMessage?.originalMessageId ?? forwardedOriginalMessageId,
          originalAuthor:
            overrideForwardedMessage?.originalAuthor ??
            resolvedForwardedAuthor ??
            'Unknown user',
          originalTime: formatTimeLabel(overrideForwardedMessage?.originalSentAt ?? resolvedForwardedSentAt),
          originalContent: overrideForwardedMessage?.originalContent ?? resolvedForwardedContent,
          originalContentFormat: resolvedForwardedOriginalContentFormat,
          originalRichContent: resolvedForwardedOriginalRichContent,
          originalAvatarUrl: overrideForwardedMessage?.originalAvatarUrl ?? resolvedForwardedAvatarUrl,
          attachments: visibleForwardedAttachments.length > 0 ? visibleForwardedAttachments : undefined,
        }
      : undefined,
    isAttachmentPlaceholder: Boolean(message.metadata?.attachmentOnly),
  };
}

export function mapAttachmentToSharedFile(
  attachment: TeamChatMessageAttachmentResponse,
  sharedBy: string,
): SharedFile {
  const thumbnailUrls = resolveTeamChatAttachmentThumbnailUrls({
    previewStatus: attachment.previewStatus,
    previewAssetSource: attachment.previewAssetSource,
    thumbnailUrl: attachment.thumbnailUrl,
    thumbnailUrlSmall: attachment.thumbnailUrlSmall,
    thumbnailUrlMedium: attachment.thumbnailUrlMedium,
  });
  const openUrl = resolveAttachmentOpenUrl(attachment);
  const downloadUrl = resolveAttachmentDownloadUrl(attachment);

  return {
    id: attachment.id,
    name: attachment.fileName,
    kind: normalizeFileKind(attachment.mimeType, attachment.documentType),
    sharedBy,
    uploadedAt: formatDateLabel(attachment.createdAt),
    sizeLabel: formatFileSize(attachment.fileSize),
    fileUrl: attachment.fileUrl,
    openUrl,
    downloadUrl,
    viewerSrc: openUrl ?? attachment.fileUrl,
    thumbnailSrc: thumbnailUrls.thumbnailUrlSmall ?? thumbnailUrls.thumbnailUrl,
    thumbnailSrcMedium: thumbnailUrls.thumbnailUrlMedium ?? thumbnailUrls.thumbnailUrl,
    documentType: normalizeDocumentType(attachment.documentType),
    previewStatus: normalizePreviewStatus(attachment.previewStatus),
    previewErrorCode: attachment.previewErrorCode ?? undefined,
    previewVersion: attachment.previewVersion ?? undefined,
    previewAssetSource: normalizeAttachmentPreviewAssetSource(attachment.previewAssetSource),
    messageId: attachment.messageId,
    attachmentType: attachment.attachmentType,
  };
}

export function mapRoomAttachmentToSharedFile(
  attachment: TeamChatRoomAttachmentResponse,
): SharedFile {
  const thumbnailUrls = resolveTeamChatAttachmentThumbnailUrls({
    previewStatus: attachment.previewStatus,
    previewAssetSource: attachment.previewAssetSource,
    thumbnailUrl: attachment.thumbnailUrl,
    thumbnailUrlSmall: attachment.thumbnailUrlSmall,
    thumbnailUrlMedium: attachment.thumbnailUrlMedium,
  });
  const openUrl = resolveAttachmentOpenUrl(attachment);
  const downloadUrl = resolveAttachmentDownloadUrl(attachment);

  return {
    id: resolveRoomAttachmentId(attachment),
    name: attachment.fileName,
    kind: normalizeFileKind(attachment.mimeType, attachment.documentType),
    sharedBy: attachment.sharedByName || attachment.sharedByEmail || 'Unknown user',
    uploadedAt: formatDateLabel(attachment.messageSentAt ?? attachment.createdAt),
    sizeLabel: formatFileSize(attachment.fileSize),
    fileUrl: attachment.fileUrl,
    openUrl,
    downloadUrl,
    viewerSrc: openUrl ?? attachment.fileUrl,
    thumbnailSrc: thumbnailUrls.thumbnailUrlSmall ?? thumbnailUrls.thumbnailUrl,
    thumbnailSrcMedium: thumbnailUrls.thumbnailUrlMedium ?? thumbnailUrls.thumbnailUrl,
    documentType: normalizeDocumentType(attachment.documentType),
    previewStatus: normalizePreviewStatus(attachment.previewStatus),
    previewErrorCode: attachment.previewErrorCode ?? undefined,
    previewVersion: attachment.previewVersion ?? undefined,
    previewAssetSource: normalizeAttachmentPreviewAssetSource(attachment.previewAssetSource),
    messageId: attachment.messageId,
    attachmentType: attachment.attachmentType,
  };
}

export function mapAttachmentToSharedPhoto(
  attachment: TeamChatMessageAttachmentResponse,
): SharedPhoto | null {
  const mimeType = attachment.mimeType ?? '';
  if (!mimeType.startsWith('image/')) return null;

  const thumbnailUrls = resolveTeamChatAttachmentThumbnailUrls({
    previewStatus: attachment.previewStatus,
    previewAssetSource: attachment.previewAssetSource,
    thumbnailUrl: attachment.thumbnailUrl,
    thumbnailUrlSmall: attachment.thumbnailUrlSmall,
    thumbnailUrlMedium: attachment.thumbnailUrlMedium,
  });
  const monthLabel = formatMonthLabel(attachment.createdAt);
  const openUrl = resolveAttachmentOpenUrl(attachment);

  return {
    id: attachment.id,
    src:
      thumbnailUrls.thumbnailUrlSmall ??
      thumbnailUrls.thumbnailUrlMedium ??
      thumbnailUrls.thumbnailUrl ??
      attachment.previewUrl ??
      attachment.fileUrl,
    viewerSrc: openUrl ?? attachment.fileUrl,
    alt: attachment.fileName,
    monthLabel,
    uploadedAt: formatDateLabel(attachment.createdAt),
    messageId: attachment.messageId,
  };
}

export function mapRoomAttachmentToSharedPhoto(
  attachment: TeamChatRoomAttachmentResponse,
): SharedPhoto | null {
  const mimeType = attachment.mimeType ?? '';
  if (!mimeType.startsWith('image/')) return null;

  const thumbnailUrls = resolveTeamChatAttachmentThumbnailUrls({
    previewStatus: attachment.previewStatus,
    previewAssetSource: attachment.previewAssetSource,
    thumbnailUrl: attachment.thumbnailUrl,
    thumbnailUrlSmall: attachment.thumbnailUrlSmall,
    thumbnailUrlMedium: attachment.thumbnailUrlMedium,
  });
  const openUrl = resolveAttachmentOpenUrl(attachment);

  return {
    id: resolveRoomAttachmentId(attachment),
    src:
      thumbnailUrls.thumbnailUrlSmall ??
      thumbnailUrls.thumbnailUrlMedium ??
      thumbnailUrls.thumbnailUrl ??
      attachment.previewUrl ??
      attachment.fileUrl,
    viewerSrc: openUrl ?? attachment.fileUrl,
    alt: attachment.fileName,
    monthLabel: formatMonthLabel(attachment.messageSentAt ?? attachment.createdAt),
    uploadedAt: formatDateLabel(attachment.messageSentAt ?? attachment.createdAt),
    messageId: attachment.messageId,
    sharedBy: attachment.sharedByName || attachment.sharedByEmail || 'Unknown user',
  };
}

function resolveMentionFeedContext(
  mentionType?: string | null,
  specialMentionType?: string | null,
) {
  const normalizedSpecialMentionType = specialMentionType?.trim().toLowerCase();
  if (normalizedSpecialMentionType === 'channel') return '@channel mention';
  if (normalizedSpecialMentionType === 'everyone') return '@everyone mention';

  const normalizedMentionType = mentionType?.trim().toLowerCase();
  if (normalizedMentionType === 'channel') return '@channel mention';
  if (normalizedMentionType === 'group') return '@everyone mention';
  return 'Mentioned you';
}

export function mapMentionToPersonalFeedItem(mention: TeamChatMentionResponse): PersonalFeedItem {
  return {
    id: mention.mentionId,
    mentionId: mention.mentionId,
    messageId: mention.messageId,
    kind: 'mentions',
    isUnread: !mention.isRead,
    occurredAt: mention.messageSentAt,
    channelId: mention.roomId,
    channelName: mention.roomName ?? mention.roomId,
    channelRoomType: undefined,
    channelVisibility: mention.roomVisibility === 'public' ? 'public' : 'private',
    actor:
      [mention.senderFirstName, mention.senderLastName].filter(Boolean).join(' ').trim() ||
      mention.senderEmail ||
      'User',
    actorAvatarUrl: mention.senderAvatarUrl ?? undefined,
    time: formatTimeLabel(mention.messageSentAt),
    dateLabel: formatDateLabel(mention.messageSentAt),
    context: resolveMentionFeedContext(mention.mentionType),
    preview: mention.messageContent,
    detailContent: mention.messageContent,
  };
}

export function mapNotificationToPersonalFeedItem(
  notification: TeamChatNotificationResponse,
): PersonalFeedItem | null {
  const notificationData = notification.data ?? {};
  const roomId = toNonEmptyString(notificationData.roomId) ?? '';
  const invitationId = toNonEmptyString(notificationData.invitationId);
  if (!roomId && !invitationId) return null;

  const eventType = toNonEmptyString(notificationData.eventType) ?? notification.type;
  const normalizedEventType = eventType.trim().toLowerCase();
  const invitationStatus = normalizeInvitationStatus(
    toNonEmptyString(notificationData.invitationStatus) ??
      toNonEmptyString(notificationData.status) ??
      toNonEmptyString(notificationData.inviteStatus),
  );
  const isInvitation = Boolean(invitationId);
  let inferredKind: PersonalFeedItem['kind'] | null = null;
  if (
    normalizedEventType === 'chat.reaction' ||
    normalizedEventType.includes('reaction')
  ) {
    inferredKind = 'reactions';
  } else if (
    normalizedEventType === 'chat.mention' ||
    normalizedEventType.includes('mention')
  ) {
    inferredKind = 'mentions';
  } else if (
    normalizedEventType === 'chat.thread.reply' ||
    normalizedEventType.includes('thread.reply')
  ) {
    inferredKind = 'threads';
  } else if (
    normalizedEventType === 'chat.message.new' ||
    normalizedEventType.includes('message.new')
  ) {
    inferredKind = 'unread';
  }

  if (!isInvitation && !inferredKind) {
    return null;
  }

  const context = isInvitation
    ? invitationStatus === 'accepted'
      ? 'Invitation accepted'
      : invitationStatus === 'declined'
        ? 'Invitation declined'
        : invitationStatus === 'canceled'
          ? 'Invitation canceled'
          : 'Invitation pending'
    : inferredKind === 'mentions'
      ? resolveMentionFeedContext(
          toNonEmptyString(notificationData.mentionType),
          toNonEmptyString(notificationData.specialMentionType),
        )
      : inferredKind === 'unread'
        ? 'Unread message'
        : eventType;

  const roomType = toNonEmptyString(notificationData.roomType);
  const notificationRead =
    typeof notification.read === 'boolean' ? notification.read : Boolean(notification.isRead);
  const previewText =
    typeof notificationData.previewText === 'string' && notificationData.previewText.trim().length > 0
      ? notificationData.previewText
      : notification.message;
  const fullMessageContent =
    typeof notificationData.fullMessageContent === 'string' &&
    notificationData.fullMessageContent.trim().length > 0
      ? notificationData.fullMessageContent
      : undefined;
  const organizationId =
    toNonEmptyString(notificationData.organizationId) ??
    toNonEmptyString(notificationData.orgId) ??
    undefined;

  return {
    id: notification.id,
    notificationId: notification.id,
    messageId: toNonEmptyString(notificationData.messageId),
    mentionId: toNonEmptyString(notificationData.mentionId),
    invitationId,
    invitationStatus,
    invitationMemberRole: toNonEmptyString(notificationData.memberRole),
    invitationAcceptedAt: toNonEmptyString(notificationData.acceptedAt),
    notificationType: notification.type,
    kind: isInvitation ? 'unread' : inferredKind ?? 'threads',
    isUnread: !notificationRead,
    occurredAt: notification.createdAt,
    channelId: roomId || `invitation:${invitationId ?? notification.id}`,
    channelName: (toNonEmptyString(notificationData.roomName) ?? roomId) || 'Invitation',
    channelRoomType:
      roomType === 'channel' || roomType === 'dm' || roomType === 'group_dm'
        ? roomType
        : undefined,
    channelVisibility: notificationData.roomVisibility === 'public' ? 'public' : 'private',
    organizationId,
    actor:
      toNonEmptyString(notificationData.actorName) ??
      toNonEmptyString(notificationData.invitedByDisplayName) ??
      toNonEmptyString(notificationData.invitedByUserId) ??
      notification.title,
    actorAvatarUrl:
      typeof notificationData.actorAvatarUrl === 'string'
        ? notificationData.actorAvatarUrl
        : undefined,
    time: formatTimeLabel(notification.createdAt),
    dateLabel: formatDateLabel(notification.createdAt),
    context,
    preview: previewText,
    detailContent: fullMessageContent ?? previewText,
    reactionEmoji:
      typeof notificationData.reactionEmoji === 'string'
        ? notificationData.reactionEmoji
        : undefined,
    reactionCount:
      typeof notificationData.reactionCount === 'number'
        ? notificationData.reactionCount
        : undefined,
  };
}

