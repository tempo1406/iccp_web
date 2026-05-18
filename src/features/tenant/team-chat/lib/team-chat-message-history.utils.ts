import type {
  TeamChatMessageCursorResponse,
  TeamChatRoomMessageResponse,
} from '../services/types/team-chat.types';

export interface RoomMessageHistoryState extends TeamChatMessageCursorResponse {
  nextCursor: string | null;
  isLoadingOlder: boolean;
}

function mergeNullableField<T>(incoming: T | null | undefined, current: T | null | undefined) {
  return incoming ?? current ?? incoming;
}

export function mergeRoomHistoryMessage(
  current: TeamChatRoomMessageResponse,
  incoming: TeamChatRoomMessageResponse,
): TeamChatRoomMessageResponse {
  const nextContentFormat = mergeNullableField(incoming.contentFormat, current.contentFormat);
  const shouldClearStaleRichContent =
    nextContentFormat === 'plain_text' &&
    !Object.prototype.hasOwnProperty.call(incoming, 'richContent');

  return {
    ...current,
    ...incoming,
    contentFormat: nextContentFormat,
    richContent: shouldClearStaleRichContent
      ? null
      : mergeNullableField(incoming.richContent, current.richContent),
    metadata: incoming.metadata ?? current.metadata,
    clientMessageId: mergeNullableField(incoming.clientMessageId, current.clientMessageId),
    parentMessageId: mergeNullableField(incoming.parentMessageId, current.parentMessageId),
    threadRootMessageId: mergeNullableField(
      incoming.threadRootMessageId,
      current.threadRootMessageId,
    ),
    replyPreview: incoming.replyPreview ?? current.replyPreview,
    forwardedSnapshot: incoming.forwardedSnapshot ?? current.forwardedSnapshot,
    senderEmail: mergeNullableField(incoming.senderEmail, current.senderEmail),
    senderFirstName: mergeNullableField(incoming.senderFirstName, current.senderFirstName),
    senderLastName: mergeNullableField(incoming.senderLastName, current.senderLastName),
    senderAvatarUrl: mergeNullableField(incoming.senderAvatarUrl, current.senderAvatarUrl),
    attachments: Array.isArray(incoming.attachments) ? incoming.attachments : current.attachments,
    linkPreviews: Array.isArray(incoming.linkPreviews) ? incoming.linkPreviews : current.linkPreviews,
    reactionSummaries: Array.isArray(incoming.reactionSummaries)
      ? incoming.reactionSummaries
      : current.reactionSummaries,
  };
}

function toRawMessageTimestamp(message: Pick<TeamChatRoomMessageResponse, 'sentAt'>): number {
  const timestamp = new Date(message.sentAt).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
}

function compareRawMessagesBySentAt(
  left: TeamChatRoomMessageResponse,
  right: TeamChatRoomMessageResponse,
): number {
  const leftTime = toRawMessageTimestamp(left);
  const rightTime = toRawMessageTimestamp(right);

  if (leftTime === rightTime) {
    return left.id.localeCompare(right.id);
  }

  return leftTime - rightTime;
}

export function mergeRoomHistoryItems(
  current: TeamChatRoomMessageResponse[],
  incoming: TeamChatRoomMessageResponse[],
): TeamChatRoomMessageResponse[] {
  const mergedById = new Map<string, TeamChatRoomMessageResponse>();

  [...current, ...incoming].forEach((message) => {
    if (!message?.id) return;
    const previousMessage = mergedById.get(message.id);
    mergedById.set(
      message.id,
      previousMessage ? mergeRoomHistoryMessage(previousMessage, message) : message,
    );
  });

  return Array.from(mergedById.values()).sort(compareRawMessagesBySentAt);
}

export function buildTypingSummary(names: string[]): string | null {
  if (names.length === 0) return null;
  if (names.length === 1) return names[0] + ' is typing...';
  if (names.length === 2) return names[0] + ' and ' + names[1] + ' are typing...';
  return names[0] + ' and ' + String(names.length - 1) + ' others are typing...';
}

