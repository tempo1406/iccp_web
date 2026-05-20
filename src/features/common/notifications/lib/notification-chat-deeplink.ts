import { ROUTES } from '@/common/constant/routes';
import type { NotificationDto } from '@/services/notifications/types';

interface ChatNotificationData {
  roomId: string;
  messageId?: string;
  mentionId?: string;
  contextScope?: TeamChatDeeplinkScope;
  contextId?: string;
}

export type NotificationInvitationSource = 'organization' | 'chatbox';
export type TeamChatDeeplinkScope = 'organization' | 'project';

export interface TeamChatRoomDeeplinkParams {
  roomId?: string | null;
  messageId?: string | null;
  mentionId?: string | null;
  contextScope?: string | null;
  contextId?: string | null;
  projectId?: string | null;
}

export interface NotificationInvitationData {
  source: NotificationInvitationSource;
  invitationId?: string;
  token?: string;
}

export type NotificationInvitationStatus = 'pending' | 'accepted' | 'declined' | 'canceled';

function getStringValue(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeInvitationStatus(value: string | undefined): NotificationInvitationStatus | null {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'pending') return 'pending';
  if (normalized === 'accepted') return 'accepted';
  if (normalized === 'declined') return 'declined';
  if (normalized === 'canceled' || normalized === 'cancelled') return 'canceled';
  return null;
}

function normalizeTeamChatDeeplinkScope(
  value: string | null | undefined,
): TeamChatDeeplinkScope | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'project') return 'project';
  if (normalized === 'organization' || normalized === 'org') return 'organization';
  return null;
}

function appendTeamChatContextToQuery(
  query: URLSearchParams,
  params: Pick<TeamChatRoomDeeplinkParams, 'contextScope' | 'contextId' | 'projectId'>,
) {
  const normalizedProjectId = (params.projectId ?? params.contextId)?.trim() ?? '';
  const normalizedScope =
    normalizeTeamChatDeeplinkScope(params.contextScope) ??
    (normalizedProjectId ? 'project' : null);

  if (normalizedScope === 'project' && normalizedProjectId) {
    query.set('scope', 'project');
    query.set('projectId', normalizedProjectId);
    return;
  }

  if (normalizedScope === 'organization') {
    query.set('scope', 'organization');
  }
}

function resolveNotificationInvitationSource(
  notification: NotificationDto,
  data: Record<string, unknown>,
  invitationId: string | undefined,
  token: string | undefined,
): NotificationInvitationSource | null {
  const eventType = getStringValue(data, 'eventType');

  if (eventType?.startsWith('chat.invitation')) {
    return invitationId ? 'chatbox' : null;
  }

  if (notification.type === 'invitation' || token) {
    return 'organization';
  }

  if (invitationId) {
    return 'chatbox';
  }

  return null;
}

export function extractNotificationInvitationData(
  notification: NotificationDto,
): NotificationInvitationData | null {
  if (!notification.data || typeof notification.data !== 'object') return null;

  const data = notification.data as Record<string, unknown>;
  const invitationId = getStringValue(data, 'invitationId');
  const token = getStringValue(data, 'token');
  const source = resolveNotificationInvitationSource(notification, data, invitationId, token);

  if (!source) return null;

  return {
    source,
    invitationId: source === 'chatbox' ? invitationId : undefined,
    token: source === 'organization' ? token : undefined,
  };
}

export function isInvitationNotification(notification: NotificationDto): boolean {
  return Boolean(extractNotificationInvitationData(notification));
}

export function extractNotificationInvitationStatus(
  notification: NotificationDto,
): NotificationInvitationStatus | null {
  if (!notification.data || typeof notification.data !== 'object') return null;
  if (!extractNotificationInvitationData(notification)) return null;

  const data = notification.data as Record<string, unknown>;
  const status =
    getStringValue(data, 'invitationStatus') ??
    getStringValue(data, 'status') ??
    getStringValue(data, 'inviteStatus');

  return normalizeInvitationStatus(status);
}

export function extractChatNotificationData(
  notification: NotificationDto,
): ChatNotificationData | null {
  if (!notification.data || typeof notification.data !== 'object') return null;
  if (extractNotificationInvitationData(notification)) return null;

  const data = notification.data as Record<string, unknown>;
  const roomId = getStringValue(data, 'roomId');
  if (!roomId) return null;

  const contextScope =
    normalizeTeamChatDeeplinkScope(getStringValue(data, 'contextScope')) ??
    normalizeTeamChatDeeplinkScope(getStringValue(data, 'scope'));
  const contextId = getStringValue(data, 'contextId') ?? getStringValue(data, 'projectId');

  return {
    roomId,
    messageId: getStringValue(data, 'messageId'),
    mentionId: getStringValue(data, 'mentionId'),
    contextScope: contextScope ?? undefined,
    contextId,
  };
}

export function buildTeamChatHrefFromRoomContext(
  tenant: string | undefined,
  params: TeamChatRoomDeeplinkParams,
): string | null {
  if (!tenant) return null;

  const normalizedRoomId = params.roomId?.trim() ?? '';
  if (!normalizedRoomId) return null;

  const query = new URLSearchParams();
  query.set('roomId', normalizedRoomId);

  const normalizedMessageId = params.messageId?.trim() ?? '';
  if (normalizedMessageId) {
    query.set('messageId', normalizedMessageId);
  }

  const normalizedMentionId = params.mentionId?.trim() ?? '';
  if (normalizedMentionId) {
    query.set('mentionId', normalizedMentionId);
  }

  appendTeamChatContextToQuery(query, params);

  const baseHref = ROUTES.tenant.teamChat(tenant);
  const queryString = query.toString();
  return queryString ? `${baseHref}?${queryString}` : baseHref;
}

export function buildTeamChatHrefFromNotification(
  notification: NotificationDto,
  tenant: string | undefined,
): string | null {
  const chatNotificationData = extractChatNotificationData(notification);
  if (!chatNotificationData) return null;
  return buildTeamChatHrefFromRoomContext(tenant, chatNotificationData);
}
