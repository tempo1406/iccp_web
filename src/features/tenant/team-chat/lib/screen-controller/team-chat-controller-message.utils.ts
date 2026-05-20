'use client';

import type { ChannelMember } from '../../data/team-chat-channel-details';
import type {
  ConversationKind,
  ConversationMessage,
  ConversationMessageAttachment,
} from '../../data/team-chat-ui-data';
import type { MentionCandidate } from '../team-chat-screen.shared';
import type {
  TeamChatPresenceResponse,
  TeamChatRoomAttachmentResponse,
  TeamChatRoomMessageResponse,
  TeamChatRoomMessageSearchItemResponse,
} from '../../services/types/team-chat.types';
import { mapPresenceToUiStatus } from './team-chat-controller-room.utils';
import { parseTeamChatMessageLink } from '../team-chat-message-link.utils';
import {
  extractPlainTextFromRichTextDocument,
  extractMentionTokensFromRichTextDocument,
  normalizeTeamChatRichTextDocument,
} from '../team-chat-composer-rich-text.utils';

const richContentSignatureCache = new WeakMap<Record<string, unknown>, string>();

function buildRichContentSignature(value?: Record<string, unknown> | null): string {
  if (!value) return '';
  const cached = richContentSignatureCache.get(value);
  if (cached !== undefined) return cached;

  try {
    const signature = JSON.stringify(value);
    richContentSignatureCache.set(value, signature);
    return signature;
  } catch {
    return '';
  }
}

export interface ForwardedMessageRenderOverride {
  bodyContent: string;
  forwardedMessage?: {
    originalMessageId: string;
    originalAuthor: string;
    originalContent: string;
    originalContentFormat?: ConversationMessage['contentFormat'];
    originalRichContent?: ConversationMessage['richContent'];
    originalAvatarUrl?: string;
    originalSentAt?: string;
    attachments?: ConversationMessageAttachment[];
  };
}

export function extractRoomAttachmentItems(
  payload: unknown,
): TeamChatRoomAttachmentResponse[] {
  const parse = (
    value: unknown,
    depth: number,
  ): TeamChatRoomAttachmentResponse[] | null => {
    if (Array.isArray(value)) {
      return value as TeamChatRoomAttachmentResponse[];
    }

    if (!value || typeof value !== 'object' || depth >= 4) {
      return null;
    }

    const record = value as Record<string, unknown>;
    const candidateKeys = ['items', 'results', 'data'] as const;

    for (const key of candidateKeys) {
      const candidate = record[key];
      if (Array.isArray(candidate)) {
        return candidate as TeamChatRoomAttachmentResponse[];
      }
    }

    for (const key of candidateKeys) {
      const nested = parse(record[key], depth + 1);
      if (nested) return nested;
    }

    return null;
  };

  return parse(payload, 0) ?? [];
}

export function formatMessageTime(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function mapSearchResultToConversationMessage(
  item: TeamChatRoomMessageSearchItemResponse,
): ConversationMessage {
  const author =
    [item.senderFirstName, item.senderLastName].filter(Boolean).join(' ').trim() ||
    item.senderEmail ||
    'Unknown user';

  return {
    id: item.messageId,
    author,
    handle: (item.senderEmail ?? author).split('@')[0] ?? 'user',
    time: formatMessageTime(item.sentAt),
    content: item.snippet?.trim() || item.content,
    avatarUrl: item.senderAvatarUrl ?? undefined,
    sentAt: item.sentAt,
  };
}

export function resolveRawMessageAuthor(message: {
  senderFirstName?: string | null;
  senderLastName?: string | null;
  senderEmail?: string | null;
  senderId?: string | null;
}): string | null {
  const fullName = [message.senderFirstName, message.senderLastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (fullName) return fullName;

  const normalizedEmail = message.senderEmail?.trim();
  if (normalizedEmail) return normalizedEmail;

  const normalizedSenderId = message.senderId?.trim();
  if (normalizedSenderId) return normalizedSenderId;

  return null;
}

export function buildMentionCandidateFromMessage(
  message: Pick<
    TeamChatRoomMessageResponse,
    'senderId' | 'senderEmail' | 'senderFirstName' | 'senderLastName' | 'senderAvatarUrl'
  >,
  presenceMap: Map<string, TeamChatPresenceResponse>,
): Omit<MentionCandidate, 'inCurrentConversation'> | null {
  const senderId = message.senderId?.trim() ?? '';
  const senderEmail = message.senderEmail?.trim() ?? '';
  const candidateId = senderId || senderEmail;
  if (!candidateId) return null;

  const resolvedName = resolveRawMessageAuthor(message);
  if (!resolvedName) return null;

  return {
    id: candidateId,
    name: resolvedName,
    displayName:
      senderEmail && senderEmail.toLowerCase() !== resolvedName.toLowerCase()
        ? senderEmail
        : undefined,
    role: 'Recent participant',
    status: senderId ? mapPresenceToUiStatus(presenceMap.get(senderId)?.presenceStatus) : undefined,
    avatarUrl: message.senderAvatarUrl ?? undefined,
  };
}

export function buildForwardedDisplayContentPreview(
  primaryContent?: string | null,
  forwardedContent?: string | null,
  options?: {
    enableLegacyStrip?: boolean;
  },
): string {
  const normalizedPrimary = primaryContent?.trim() ?? '';
  const normalizedForwarded = forwardedContent?.trim() ?? '';

  if (!normalizedPrimary) return normalizedForwarded;
  if (!normalizedForwarded || normalizedForwarded === normalizedPrimary) return normalizedPrimary;
  if (!options?.enableLegacyStrip) return normalizedPrimary;

  const legacySuffixPattern = new RegExp(`\\s+${escapeRegExp(normalizedForwarded)}$`);
  const legacySuffixMatch = normalizedPrimary.match(legacySuffixPattern);
  if (legacySuffixMatch && typeof legacySuffixMatch.index === 'number') {
    return (
      normalizedPrimary
        .slice(0, legacySuffixMatch.index)
        .replace(/\s+$/, '') || normalizedPrimary
    );
  }

  if (normalizedPrimary.endsWith(normalizedForwarded)) {
    return (
      normalizedPrimary
        .slice(0, normalizedPrimary.length - normalizedForwarded.length)
        .replace(/\s+$/, '') || normalizedPrimary
    );
  }

  return normalizedPrimary;
}

function resolveConversationMessageInternalLinkPreviewBody(
  preview?: NonNullable<ConversationMessage['linkPreviews']>[number],
) {
  const internalReference = preview?.internalReference;
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

  return internalReference.messageSnapshot?.contentPreview?.trim() || undefined;
}

export function resolveConversationMessageForwardPreview(message: Pick<
  ConversationMessage,
  'author' | 'avatarUrl' | 'content' | 'sentAt' | 'linkPreviews'
>) {
  const normalizedContent = message.content.trim();
  const parsedMessageLink = parseTeamChatMessageLink(normalizedContent);
  if (!parsedMessageLink) {
    return {
      author: message.author.trim() || 'Unknown user',
      avatarUrl: message.avatarUrl,
      content: normalizedContent || 'Attachment',
      sentAt: message.sentAt,
    };
  }

  const matchedPreview = message.linkPreviews?.find((preview) => {
    const internalReference = preview.internalReference;
    if (internalReference?.kind !== 'team_chat_message') return false;

    return (
      internalReference.roomId.trim() === parsedMessageLink.roomId &&
      internalReference.messageId.trim() === parsedMessageLink.messageId
    );
  });
  const linkedPreviewContent = resolveConversationMessageInternalLinkPreviewBody(matchedPreview);
  const linkedPreviewAuthor =
    matchedPreview?.internalReference?.messageSnapshot?.authorName?.trim() || undefined;
  const linkedPreviewAvatarUrl =
    matchedPreview?.internalReference?.messageSnapshot?.authorAvatarUrl?.trim() || undefined;
  const linkedPreviewSentAt =
    matchedPreview?.internalReference?.messageSnapshot?.createdAt?.trim() || undefined;

  return {
    author: linkedPreviewAuthor || message.author.trim() || 'Unknown user',
    avatarUrl: linkedPreviewAvatarUrl ?? message.avatarUrl,
    content: linkedPreviewContent || normalizedContent || 'Attachment',
    sentAt: linkedPreviewSentAt ?? message.sentAt,
  };
}

export function buildForwardedRenderOverrideFromMessage(
  message: ConversationMessage,
  note: string,
  overrideAttachments?: ConversationMessageAttachment[],
): ForwardedMessageRenderOverride {
  const bodyContent = note.trim();
  const preview = resolveConversationMessageForwardPreview(message);
  const immediateAttachments = message.forwardedMessage
    ? undefined
    : (overrideAttachments?.map<ConversationMessageAttachment>((attachment) => ({
        ...attachment,
      })) ??
      message.attachments?.map<ConversationMessageAttachment>((attachment) => ({
        ...attachment,
      })));

  return {
    bodyContent,
    forwardedMessage: {
      originalMessageId: message.id,
      originalAuthor: preview.author,
      originalContent: preview.content,
      originalContentFormat: message.contentFormat,
      originalRichContent: message.richContent,
      originalAvatarUrl: preview.avatarUrl,
      originalSentAt: preview.sentAt,
      attachments: immediateAttachments?.length ? immediateAttachments : undefined,
    },
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsSpecialMentionToken(content: string, token: 'channel' | 'everyone'): boolean {
  if (!content.trim()) return false;
  const pattern = new RegExp(
    `(?:^|\\s|[([{])@${token}(?=$|\\s|[.,!?;:)\\]}])`,
    'i',
  );
  return pattern.test(content);
}

export interface TeamChatSpecialMentionMetadata {
  type: 'channel' | 'everyone';
}

export function extractSpecialMentionMetadata(
  content: string,
  mentionContextKind: ConversationKind,
  richContent?: Record<string, unknown> | null,
): TeamChatSpecialMentionMetadata[] {
  if (mentionContextKind === 'dm') return [];

  const normalizedContent = content.trim();
  const richContentText = extractPlainTextFromRichTextDocument(
    normalizeTeamChatRichTextDocument(richContent),
  ).trim();
  const searchableContent =
    richContentText && richContentText !== normalizedContent
      ? `${normalizedContent}\n${richContentText}`
      : normalizedContent;
  if (!searchableContent) return [];

  const specialMentions = new Set<'channel' | 'everyone'>();
  if (
    mentionContextKind === 'channel' &&
    containsSpecialMentionToken(searchableContent, 'channel')
  ) {
    specialMentions.add('channel');
  }
  if (
    mentionContextKind === 'group_dm' &&
    containsSpecialMentionToken(searchableContent, 'everyone')
  ) {
    specialMentions.add('everyone');
  }

  return Array.from(specialMentions).map((type) => ({ type }));
}

export function extractMentionedUserIds(
  content: string,
  members: Pick<ChannelMember, 'id' | 'name'>[],
  richContent?: Record<string, unknown> | null,
): string[] {
  const normalizedContent = content.toLowerCase();
  const mentionedUserIds = new Set<string>();
  const memberIdsByName = new Map<string, string>();
  const memberIdsById = new Set<string>();

  members.forEach((member) => {
    const normalizedMemberId = member.id.trim();
    const normalizedName = member.name.trim().toLowerCase();
    if (normalizedMemberId) {
      memberIdsById.add(normalizedMemberId);
    }
    if (normalizedName) {
      memberIdsByName.set(normalizedName, normalizedMemberId);
    }
  });

  const mentionTokens = extractMentionTokensFromRichTextDocument(
    normalizeTeamChatRichTextDocument(richContent),
  );
  mentionTokens.forEach((token) => {
    const normalizedTokenId = token.id.trim();
    if (normalizedTokenId && memberIdsById.has(normalizedTokenId)) {
      mentionedUserIds.add(normalizedTokenId);
      return;
    }

    const normalizedLabel = token.label.replace(/^@+/, '').trim().toLowerCase();
    const matchedMemberId = memberIdsByName.get(normalizedLabel);
    if (matchedMemberId) {
      mentionedUserIds.add(matchedMemberId);
    }
  });

  members.forEach((member) => {
    const normalizedName = member.name.trim().toLowerCase();
    if (!normalizedName) return;

    const mentionPattern = new RegExp(
      `@${escapeRegExp(normalizedName)}(?=$|\\s|[.,!?;:])`,
      'i',
    );

    if (mentionPattern.test(normalizedContent)) {
      mentionedUserIds.add(member.id);
    }
  });

  return Array.from(mentionedUserIds);
}

export function normalizeMessageAttachmentSignature(
  attachments?: ConversationMessage['attachments'],
): string {
  return (attachments ?? [])
    .map(
      (attachment) =>
        [
          attachment.id,
          attachment.fileName,
          attachment.fileUrl,
          attachment.thumbnailUrl,
          attachment.thumbnailUrlSmall,
          attachment.thumbnailUrlMedium,
          attachment.previewUrl,
          attachment.previewStatus,
          attachment.previewErrorCode,
          attachment.previewUpdatedAt,
          attachment.previewVersion,
          attachment.previewAssetSource,
          attachment.documentType,
        ].join(':'),
    )
    .join('|');
}

export function normalizeMessageSignature(message: ConversationMessage): string {
  const reactionsSignature = (message.reactions ?? [])
    .map((reaction) => {
      const reactorsSignature = (reaction.reactors ?? [])
        .map((reactor) => `${reactor.userId}:${reactor.displayName}`)
        .join(',');
      return `${reaction.emoji}:${reaction.count}:${reaction.reacted ? '1' : '0'}:${reactorsSignature}`;
    })
    .join('|');
  const attachmentsSignature = normalizeMessageAttachmentSignature(message.attachments);
  const forwardedAttachmentsSignature = normalizeMessageAttachmentSignature(
    message.forwardedMessage?.attachments,
  );
  const forwardedMessageSignature = message.forwardedMessage
    ? [
        message.forwardedMessage.sourceConversationKey,
        message.forwardedMessage.sourceConversationKind,
        message.forwardedMessage.sourceConversationVisibility,
        message.forwardedMessage.sourceConversationLabel,
        message.forwardedMessage.sourceConversationContext,
        message.forwardedMessage.sourceDateLabel,
        message.forwardedMessage.originalMessageId,
        message.forwardedMessage.originalAuthor,
        message.forwardedMessage.originalTime,
        message.forwardedMessage.originalContent,
        message.forwardedMessage.originalContentFormat,
        buildRichContentSignature(message.forwardedMessage.originalRichContent),
        message.forwardedMessage.originalAvatarUrl,
        forwardedAttachmentsSignature,
      ].join(':')
    : '';
  const linkPreviewSignature = (message.linkPreviews ?? [])
    .map((preview) =>
      [
        preview.url,
        preview.canonicalUrl,
        preview.status,
        preview.previewImageUrl,
        preview.imageUrl,
        preview.thumbnailUrl,
        preview.previewAssetId,
        preview.previewAssetStatus,
        preview.previewAssetSource,
        preview.previewAssetErrorCode,
        preview.previewVersion,
        preview.fetchedAt,
      ].join(':'),
    )
    .join('|');

  return [
    message.id,
    message.clientMessageId,
    message.parentMessageId,
    message.author,
    message.handle,
    message.time,
    message.content,
    message.contentFormat,
    buildRichContentSignature(message.richContent),
    message.deliveryStatus,
    message.isOptimistic ? '1' : '0',
    message.errorMessage,
    message.isOwn ? '1' : '0',
    message.isEdited ? '1' : '0',
    message.isPinned ? '1' : '0',
    message.isDeleted ? '1' : '0',
    message.linkPreviewStatus,
    message.linkPreviewVersion,
    reactionsSignature,
    attachmentsSignature,
    forwardedMessageSignature,
    linkPreviewSignature,
  ].join('~');
}

export function areConversationMessagesEqual(
  current: ConversationMessage[],
  next: ConversationMessage[],
): boolean {
  if (current.length !== next.length) return false;

  for (let index = 0; index < current.length; index += 1) {
    const currentItem = current[index];
    const nextItem = next[index];
    if (!currentItem || !nextItem) return false;
    if (normalizeMessageSignature(currentItem) !== normalizeMessageSignature(nextItem)) {
      return false;
    }
  }

  return true;
}

export function toConversationMessageTimestamp(message: ConversationMessage): number {
  if (!message.sentAt) return Number.MAX_SAFE_INTEGER;
  const timestamp = new Date(message.sentAt).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
}

export function compareConversationMessagesBySentAt(
  left: ConversationMessage,
  right: ConversationMessage,
): number {
  const leftTime = toConversationMessageTimestamp(left);
  const rightTime = toConversationMessageTimestamp(right);
  if (leftTime === rightTime) {
    return left.id.localeCompare(right.id);
  }
  return leftTime - rightTime;
}
