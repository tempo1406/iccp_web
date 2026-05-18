'use client';

import type { ChatMessageLinkPreviewUpdatedPayload } from '@/lib/socket/events';
import type { PersonalFeedItem } from '../../data/team-chat-ui-data';
import type { TeamChatNotificationResponse } from '../../services/types/team-chat.types';

export function buildPersonalMentionFeedDedupKey(
  item: Pick<PersonalFeedItem, 'kind' | 'channelId' | 'messageId' | 'mentionId'>,
) {
  if (item.kind !== 'mentions') return null;

  const normalizedChannelId = item.channelId?.trim() ?? '';
  const normalizedMessageId = item.messageId?.trim() ?? '';
  if (normalizedChannelId && normalizedMessageId) {
    return `mention-message:${normalizedChannelId}:${normalizedMessageId}`;
  }

  const normalizedMentionId = item.mentionId?.trim() ?? '';
  return normalizedMentionId ? `mention:${normalizedMentionId}` : null;
}

function normalizeLinkPreviewUrlList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function normalizeTeamChatNotificationList(value: unknown): TeamChatNotificationResponse[] {
  if (Array.isArray(value)) {
    return value.filter(
      (notification): notification is TeamChatNotificationResponse =>
        Boolean(notification) && typeof notification === 'object',
    );
  }

  if (!value || typeof value !== 'object') return [];

  const data = 'data' in value ? value.data : undefined;
  if (Array.isArray(data)) {
    return data.filter(
      (notification): notification is TeamChatNotificationResponse =>
        Boolean(notification) && typeof notification === 'object',
    );
  }

  const items = 'items' in value ? value.items : undefined;
  if (Array.isArray(items)) {
    return items.filter(
      (notification): notification is TeamChatNotificationResponse =>
        Boolean(notification) && typeof notification === 'object',
    );
  }

  return [];
}

export function resolveTeamChatNotificationOrganizationId(
  notification: TeamChatNotificationResponse,
): string | null {
  const organizationId = notification.data?.organizationId ?? notification.data?.orgId;
  if (typeof organizationId !== 'string') return null;

  const normalizedOrganizationId = organizationId.trim();
  return normalizedOrganizationId.length > 0 ? normalizedOrganizationId : null;
}

export function matchesTeamChatNotificationOrganization(
  notification: TeamChatNotificationResponse,
  organizationId?: string | null,
): boolean {
  if (!organizationId) return true;

  const notificationOrganizationId = resolveTeamChatNotificationOrganizationId(notification);
  if (!notificationOrganizationId) return true;

  return notificationOrganizationId === organizationId;
}

export function buildLinkPreviewMetadataPatch(payload: ChatMessageLinkPreviewUpdatedPayload) {
  const pendingUrls = normalizeLinkPreviewUrlList(payload.metadata?.linkPreviewPendingUrls);
  const failedUrls = normalizeLinkPreviewUrlList(payload.metadata?.linkPreviewFailedUrls);
  const nextStatus =
    typeof payload.metadata?.linkPreviewStatus === 'string' &&
    payload.metadata.linkPreviewStatus.trim().length > 0
      ? payload.metadata.linkPreviewStatus.trim()
      : payload.linkPreviews.length > 0
        ? failedUrls.length > 0
          ? 'partial'
          : 'ready'
        : failedUrls.length > 0
          ? 'failed'
          : pendingUrls.length > 0
            ? 'pending'
            : undefined;
  const nextVersion =
    typeof payload.metadata?.linkPreviewVersion === 'string' &&
    payload.metadata.linkPreviewVersion.trim().length > 0
      ? payload.metadata.linkPreviewVersion.trim()
      : undefined;

  return {
    linkPreviewStatus: nextStatus,
    linkPreviewPendingUrls: pendingUrls,
    linkPreviewFailedUrls: failedUrls,
    linkPreviewVersion: nextVersion,
  };
}
