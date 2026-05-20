'use client';

import type {
  ConversationKey,
  ConversationKind,
  DiscoverableChannel,
} from '../../data/team-chat-ui-data';
import type {
  RecoverableConversationItem,
} from '../team-chat-screen.shared';
import {
  mapRoomToDirectMessageContact,
  mapRoomToGroupDirectMessageConversation,
  mapRoomToWorkspaceChannel,
} from '../team-chat-api-mappers';
import type {
  TeamChatPresenceResponse,
  TeamChatRoomSummaryResponse,
} from '../../services/types/team-chat.types';

const COMPANY_ANNOUNCEMENTS_ROOM_KEY = 'company-announcements';
const UUID_LIKE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeTeamChatRoomKey(value?: string | null) {
  return value?.trim().toLowerCase() ?? '';
}

export function isTeamChatNotFoundErrorMessage(message: string) {
  const normalizedMessage = message.trim().toLowerCase();
  return (
    normalizedMessage.includes('404') ||
    normalizedMessage.includes('not found') ||
    normalizedMessage.includes('no longer exists')
  );
}

export function isUuidLikeValue(value?: string | null) {
  return Boolean(value && UUID_LIKE_PATTERN.test(value.trim()));
}

export function shouldFetchRoomMembersForIdentity(
  room?: Pick<TeamChatRoomSummaryResponse, 'roomType' | 'name'> | null,
) {
  if (!room) return true;
  if (room.roomType === 'channel') return false;
  return (room.name?.trim() ?? '').length === 0;
}

export function shouldHydratePrivateRoomSidebarDetail(
  room: TeamChatRoomSummaryResponse | undefined,
  options: {
    currentUserId?: string | null;
    currentUserDisplayName?: string;
    currentUserEmail?: string | null;
  },
) {
  if (!room) return true;
  const normalizedRoomName = room.name?.trim() ?? '';
  if (room.roomType === 'dm') {
    const canResolveSelfDmFromSummary =
      Boolean(options.currentUserId) &&
      room.memberCount <= 1 &&
      room.ownerId === options.currentUserId &&
      Boolean(options.currentUserDisplayName?.trim() || options.currentUserEmail?.trim());

    return !room.dmCounterpart && !normalizedRoomName && !canResolveSelfDmFromSummary;
  }

  if (room.roomType === 'group_dm') {
    return !normalizedRoomName && !(room.groupMemberPreview?.length ?? 0);
  }

  return false;
}

export function resolveTeamChatScopeGuardErrorMessage(message: string, fallback: string) {
  const normalizedMessage = message.trim().toLowerCase();
  const looksLikeProjectScopeGuard =
    normalizedMessage.includes('project') &&
    (normalizedMessage.includes('scope') ||
      normalizedMessage.includes('member') ||
      normalizedMessage.includes('membership') ||
      normalizedMessage.includes('access') ||
      normalizedMessage.includes('belong') ||
      normalizedMessage.includes('invit') ||
      normalizedMessage.includes('join'));

  return looksLikeProjectScopeGuard ? fallback : message;
}

export function resolveTeamChatProjectRoomAccessMessage(message: string) {
  if (isTeamChatNotFoundErrorMessage(message)) {
    return 'This room is no longer available.';
  }

  return resolveTeamChatScopeGuardErrorMessage(
    message,
    'You are not allowed to access this project room.',
  );
}

export function isCompanyAnnouncementsReadOnlyForRole(
  roomKey?: string | null,
  memberRole?: string | null,
) {
  if (normalizeTeamChatRoomKey(roomKey) !== COMPANY_ANNOUNCEMENTS_ROOM_KEY) {
    return false;
  }

  const normalizedRole = memberRole?.trim().toLowerCase();
  return normalizedRole !== 'owner' && normalizedRole !== 'admin';
}

export function resolveEffectiveCanSendMessage(options: {
  roomKey?: string | null;
  memberRole?: string | null;
  canSendMessage?: boolean;
}) {
  if (options.canSendMessage === false) return false;
  if (isCompanyAnnouncementsReadOnlyForRole(options.roomKey, options.memberRole)) {
    return false;
  }
  return options.canSendMessage ?? true;
}

export function resolveFallbackPersonalConversationLabel(kind?: ConversationKind) {
  if (kind === 'group_dm') return 'Group chat';
  if (kind === 'dm') return 'Direct message';
  if (kind === 'channel') return 'Channel';
  return 'Conversation';
}

export function buildConversationKey(kind: ConversationKind, id: string): ConversationKey {
  return `${kind}:${id}` as ConversationKey;
}

export function mergeDiscoverableChannels(
  current: DiscoverableChannel[],
  incoming: DiscoverableChannel[],
): DiscoverableChannel[] {
  const incomingById = new Map(incoming.map((channel) => [channel.id, channel] as const));
  const nextCurrent = current.map((channel) => incomingById.get(channel.id) ?? channel);
  const seenIds = new Set(nextCurrent.map((channel) => channel.id));

  return [...nextCurrent, ...incoming.filter((channel) => !seenIds.has(channel.id))];
}

export function mapRoomSummaryToRecoverableItem(
  room: TeamChatRoomSummaryResponse,
  options: {
    currentUserId?: string | null;
    currentUserDisplayName?: string | null;
    currentUserEmail?: string | null;
    unreadCountMap: Map<string, number>;
    presenceMap: Map<string, TeamChatPresenceResponse>;
  },
): RecoverableConversationItem {
  if (room.roomType === 'channel') {
    const channel = mapRoomToWorkspaceChannel(room, options.unreadCountMap);
    return {
      key: buildConversationKey('channel', room.id),
      roomId: room.id,
      kind: 'channel',
      name: channel.name,
      visibility: channel.visibility,
    };
  }

  if (room.roomType === 'group_dm') {
    const groupConversation = mapRoomToGroupDirectMessageConversation(room, {
      currentUserId: options.currentUserId,
      unreadCountMap: options.unreadCountMap,
    });

    return {
      key: buildConversationKey('group_dm', room.id),
      roomId: room.id,
      kind: 'group_dm',
      name: groupConversation.name,
      visibility: 'private',
    };
  }

  const contact = mapRoomToDirectMessageContact(room, {
    currentUserId: options.currentUserId,
    currentUserDisplayName: options.currentUserDisplayName,
    currentUserEmail: options.currentUserEmail,
    unreadCountMap: options.unreadCountMap,
    presenceMap: options.presenceMap,
  });

  return {
    key: buildConversationKey('dm', room.id),
    roomId: room.id,
    kind: 'dm',
    name: contact.name,
    visibility: 'private',
    avatarUrl: contact.avatarUrl,
    status: contact.status,
  };
}

export function mapNotifyLevelToPreference(level?: string | null): 'all-posts' | 'mentions' | 'muted' {
  if (level === 'mentions') return 'mentions';
  if (level === 'mute') return 'muted';
  return 'all-posts';
}

export function mapPreferenceToNotifyLevel(
  preference: 'all-posts' | 'mentions' | 'muted',
): 'all' | 'mentions' | 'mute' {
  if (preference === 'mentions') return 'mentions';
  if (preference === 'muted') return 'mute';
  return 'all';
}

export function mapPresenceToUiStatus(status?: string | null): 'online' | 'away' | 'busy' | 'offline' {
  if (status === 'online') return 'online';
  if (status === 'dnd') return 'busy';
  if (status === 'offline') return 'offline';
  return 'away';
}

export function mapUiStatusToPresenceStatus(
  status: 'online' | 'away' | 'busy' | 'offline',
): 'online' | 'away' | 'dnd' | 'offline' {
  if (status === 'busy') return 'dnd';
  return status;
}

export function normalizeContactIdentity(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}
