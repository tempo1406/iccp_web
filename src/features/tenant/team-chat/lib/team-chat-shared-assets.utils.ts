import type {
  ConversationMessage,
  ConversationMessageAttachment,
  LinkPreview,
  SharedFile,
  SharedPhoto,
} from '../data/team-chat-ui-data';
import type { TeamChatRoomAttachmentResponse } from '../services/types/team-chat.types';
import {
  mapRoomAttachmentToSharedFile,
  mapRoomAttachmentToSharedPhoto,
} from './team-chat-api-mappers';
import { resolveTeamChatLinkPreview } from './team-chat-link-preview.utils';
import { resolveTeamChatAttachmentThumbnailUrls } from './team-chat-preview-state.utils';

type SharedFileCandidate = {
  identity: string;
  item: SharedFile;
  sortTime: number;
};

type SharedPhotoCandidate = {
  identity: string;
  item: SharedPhoto;
  sortTime: number;
};

function toTimestamp(value?: string | null) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatDateLabel(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatMonthLabel(value?: string | null) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatFileSize(value?: string | null) {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed <= 0) return '--';

  if (parsed < 1024) return `${parsed} B`;
  if (parsed < 1024 * 1024) return `${(parsed / 1024).toFixed(1)} KB`;
  if (parsed < 1024 * 1024 * 1024) return `${(parsed / (1024 * 1024)).toFixed(1)} MB`;
  return `${(parsed / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function normalizeAttachmentKind(attachment: ConversationMessageAttachment): SharedFile['kind'] {
  const mimeType = attachment.mimeType ?? '';
  const documentType = attachment.documentType?.trim().toLowerCase();

  if (attachment.attachmentType === 'image' || mimeType.startsWith('image/')) return 'image';
  if (attachment.attachmentType === 'video' || mimeType.startsWith('video/')) return 'video';
  if (documentType === 'excel') return 'spreadsheet';
  if (documentType === 'powerpoint') return 'presentation';
  if (documentType === 'archive') return 'archive';
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

function isImageAttachment(attachment: ConversationMessageAttachment) {
  return attachment.attachmentType === 'image' || (attachment.mimeType ?? '').startsWith('image/');
}

function buildConversationAttachmentFileCandidate(
  message: ConversationMessage,
  attachment: ConversationMessageAttachment,
): SharedFileCandidate {
  const sortTime = toTimestamp(message.sentAt);
  const assetIdentity = attachment.id || attachment.fileUrl;
  const thumbnailUrls = resolveTeamChatAttachmentThumbnailUrls({
    previewStatus: attachment.previewStatus,
    previewAssetSource: attachment.previewAssetSource,
    thumbnailUrl: attachment.thumbnailUrl,
    thumbnailUrlSmall: attachment.thumbnailUrlSmall,
    thumbnailUrlMedium: attachment.thumbnailUrlMedium,
  });

  return {
    identity: `asset:${message.id}:${assetIdentity}`,
    sortTime,
    item: {
      id: attachment.id,
      name: attachment.fileName,
      kind: normalizeAttachmentKind(attachment),
      sharedBy: message.author,
      uploadedAt: formatDateLabel(message.sentAt),
      sizeLabel: formatFileSize(attachment.fileSize),
      fileUrl: attachment.fileUrl,
      openUrl: attachment.openUrl,
      downloadUrl: attachment.downloadUrl,
      viewerSrc: attachment.openUrl ?? attachment.previewUrl ?? attachment.fileUrl,
      thumbnailSrc: thumbnailUrls.thumbnailUrlSmall ?? thumbnailUrls.thumbnailUrl,
      thumbnailSrcMedium: thumbnailUrls.thumbnailUrlMedium ?? thumbnailUrls.thumbnailUrl,
      documentType: attachment.documentType,
      previewStatus: attachment.previewStatus,
      previewErrorCode: attachment.previewErrorCode,
      previewVersion: attachment.previewVersion,
      previewAssetSource: attachment.previewAssetSource,
      messageId: message.id,
      attachmentType: attachment.attachmentType,
    },
  };
}

function buildConversationAttachmentPhotoCandidate(
  message: ConversationMessage,
  attachment: ConversationMessageAttachment,
): SharedPhotoCandidate | null {
  if (!isImageAttachment(attachment)) return null;

  const thumbnailUrls = resolveTeamChatAttachmentThumbnailUrls({
    previewStatus: attachment.previewStatus,
    previewAssetSource: attachment.previewAssetSource,
    thumbnailUrl: attachment.thumbnailUrl,
    thumbnailUrlSmall: attachment.thumbnailUrlSmall,
    thumbnailUrlMedium: attachment.thumbnailUrlMedium,
  });
  const sortTime = toTimestamp(message.sentAt);
  const assetIdentity = attachment.id || attachment.fileUrl;

  return {
    identity: `photo:${message.id}:${assetIdentity}`,
    sortTime,
    item: {
      id: attachment.id,
      src:
        thumbnailUrls.thumbnailUrlSmall ??
        thumbnailUrls.thumbnailUrlMedium ??
        thumbnailUrls.thumbnailUrl ??
        attachment.previewUrl ??
        attachment.fileUrl,
      viewerSrc: attachment.openUrl ?? attachment.previewUrl ?? attachment.fileUrl,
      alt: attachment.fileName,
      monthLabel: formatMonthLabel(message.sentAt),
      uploadedAt: formatDateLabel(message.sentAt),
      messageId: message.id,
      sharedBy: message.author,
    },
  };
}

function buildLinkPreviewFileCandidate(
  message: ConversationMessage,
  preview: LinkPreview,
): SharedFileCandidate | null {
  const resolvedPreview = resolveTeamChatLinkPreview(preview);
  if (
    resolvedPreview.kind !== 'document' &&
    resolvedPreview.kind !== 'spreadsheet' &&
    resolvedPreview.kind !== 'presentation'
  ) {
    return null;
  }

  const linkUrl = preview.canonicalUrl ?? preview.url;
  const sortTime = toTimestamp(message.sentAt);

  return {
    identity: `link-preview:${message.id}:${linkUrl}`,
    sortTime,
    item: {
      id: `link-preview-${message.id}-${linkUrl}`,
      name: resolvedPreview.title,
      kind: resolvedPreview.kind,
      sharedBy: message.author,
      uploadedAt: formatDateLabel(message.sentAt),
      sizeLabel: 'Shared link',
      fileUrl: linkUrl,
      messageId: message.id,
    },
  };
}

function sortCandidatesByNewest<T extends { sortTime: number; item: { name?: string; alt?: string } }>(
  left: T,
  right: T,
) {
  if (right.sortTime !== left.sortTime) return right.sortTime - left.sortTime;

  const leftLabel = left.item.name ?? left.item.alt ?? '';
  const rightLabel = right.item.name ?? right.item.alt ?? '';
  return leftLabel.localeCompare(rightLabel);
}

export function buildTeamChatSharedFiles(params: {
  roomAttachments: TeamChatRoomAttachmentResponse[];
  messages: ConversationMessage[];
}): SharedFile[] {
  const candidates = new Map<string, SharedFileCandidate>();

  params.roomAttachments.forEach((attachment) => {
    const identity = `asset:${attachment.messageId}:${attachment.attachmentId ?? attachment.id ?? attachment.fileUrl}`;
    candidates.set(identity, {
      identity,
      sortTime: toTimestamp(attachment.messageSentAt ?? attachment.createdAt),
      item: mapRoomAttachmentToSharedFile(attachment),
    });
  });

  params.messages.forEach((message) => {
    (message.attachments ?? []).forEach((attachment) => {
      const candidate = buildConversationAttachmentFileCandidate(message, attachment);
      if (!candidates.has(candidate.identity)) {
        candidates.set(candidate.identity, candidate);
      }
    });

    (message.linkPreviews ?? []).forEach((preview) => {
      const candidate = buildLinkPreviewFileCandidate(message, preview);
      if (candidate && !candidates.has(candidate.identity)) {
        candidates.set(candidate.identity, candidate);
      }
    });
  });

  return Array.from(candidates.values())
    .sort(sortCandidatesByNewest)
    .map((candidate) => candidate.item);
}

export function buildTeamChatGroupedPhotos(params: {
  roomAttachments: TeamChatRoomAttachmentResponse[];
  messages: ConversationMessage[];
}): Record<string, SharedPhoto[]> {
  const candidates = new Map<string, SharedPhotoCandidate>();

  params.roomAttachments.forEach((attachment) => {
    const mappedPhoto = mapRoomAttachmentToSharedPhoto(attachment);
    if (!mappedPhoto) return;

    const identity = `photo:${attachment.messageId}:${attachment.attachmentId ?? attachment.id ?? attachment.fileUrl}`;
    candidates.set(identity, {
      identity,
      sortTime: toTimestamp(attachment.messageSentAt ?? attachment.createdAt),
      item: mappedPhoto,
    });
  });

  params.messages.forEach((message) => {
    (message.attachments ?? []).forEach((attachment) => {
      const candidate = buildConversationAttachmentPhotoCandidate(message, attachment);
      if (candidate && !candidates.has(candidate.identity)) {
        candidates.set(candidate.identity, candidate);
      }
    });
  });

  return Array.from(candidates.values())
    .sort(sortCandidatesByNewest)
    .reduce<Record<string, SharedPhoto[]>>((groups, candidate) => {
      const monthLabel = candidate.item.monthLabel;
      if (!groups[monthLabel]) groups[monthLabel] = [];
      groups[monthLabel].push(candidate.item);
      return groups;
    }, {});
}

