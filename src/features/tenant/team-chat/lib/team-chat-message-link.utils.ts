'use client';

const TEAM_CHAT_PATH_SEGMENT = '/team-chat';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface TeamChatMessageLinkReference {
  roomId: string;
  messageId: string;
  url: string;
  deepLinkUrl: string;
}

function splitTrailingUrlPunctuation(value: string) {
  const match = value.match(/^(.*?)([),.;!?]+)?$/);
  if (!match) {
    return { url: value, trailing: '' };
  }

  return {
    url: match[1] ?? value,
    trailing: match[2] ?? '',
  };
}

function getBrowserOrigin() {
  if (typeof window === 'undefined') return 'http://localhost';
  return window.location.origin;
}

function resolveTeamChatBasePath(currentPathname?: string) {
  const normalizedPathname =
    currentPathname?.trim() ||
    (typeof window !== 'undefined' ? window.location.pathname : TEAM_CHAT_PATH_SEGMENT);
  const teamChatIndex = normalizedPathname.toLowerCase().indexOf(TEAM_CHAT_PATH_SEGMENT);

  if (teamChatIndex < 0) {
    return normalizedPathname || TEAM_CHAT_PATH_SEGMENT;
  }

  return normalizedPathname.slice(0, teamChatIndex + TEAM_CHAT_PATH_SEGMENT.length);
}

function normalizeMessageLinkUrl(rawUrl: string, currentPathname?: string) {
  const trimmedUrl = rawUrl.trim();
  if (!trimmedUrl) return null;

  const { url } = splitTrailingUrlPunctuation(trimmedUrl);
  if (!url) return null;

  try {
    const basePath = resolveTeamChatBasePath(currentPathname);
    return new URL(url, `${getBrowserOrigin()}${basePath}`);
  } catch {
    return null;
  }
}

function isValidUuid(value?: string | null) {
  if (!value) return false;
  return UUID_PATTERN.test(value.trim());
}

export function buildTeamChatMessageDeepLink(params: {
  roomId: string;
  messageId: string;
  currentPathname?: string;
}) {
  const basePath = resolveTeamChatBasePath(params.currentPathname);
  const searchParams = new URLSearchParams();
  searchParams.set('roomId', params.roomId);
  searchParams.set('messageId', params.messageId);
  return `${basePath}?${searchParams.toString()}`;
}

export function buildAbsoluteTeamChatMessageDeepLink(params: {
  roomId: string;
  messageId: string;
  currentPathname?: string;
}) {
  const relativePath = buildTeamChatMessageDeepLink(params);
  return `${getBrowserOrigin()}${relativePath}`;
}

export function resolveTenantAwareTeamChatMessageLinkHref(params: {
  deepLinkUrl?: string | null;
  roomId: string;
  messageId: string;
  currentPathname?: string;
}) {
  const basePath = resolveTeamChatBasePath(params.currentPathname);
  const normalizedDeepLinkUrl = params.deepLinkUrl?.trim();
  if (!normalizedDeepLinkUrl) {
    return buildTeamChatMessageDeepLink(params);
  }

  const normalizedUrl = normalizeMessageLinkUrl(normalizedDeepLinkUrl, params.currentPathname);
  if (!normalizedUrl) {
    return buildTeamChatMessageDeepLink(params);
  }

  const normalizedPath = normalizedUrl.pathname.toLowerCase();
  const resolvedPath =
    normalizedPath === TEAM_CHAT_PATH_SEGMENT
      ? basePath
      : normalizedPath.includes(TEAM_CHAT_PATH_SEGMENT)
        ? normalizedUrl.pathname
        : basePath;

  return `${resolvedPath}${normalizedUrl.search}`;
}

export function parseTeamChatMessageLink(
  rawUrl: string,
  options?: { currentPathname?: string },
): TeamChatMessageLinkReference | null {
  const normalizedUrl = normalizeMessageLinkUrl(rawUrl, options?.currentPathname);
  if (!normalizedUrl) return null;
  if (!normalizedUrl.pathname.toLowerCase().includes(TEAM_CHAT_PATH_SEGMENT)) return null;

  const roomId = normalizedUrl.searchParams.get('roomId')?.trim() ?? '';
  const messageId = normalizedUrl.searchParams.get('messageId')?.trim() ?? '';
  if (!isValidUuid(roomId) || !isValidUuid(messageId)) return null;

  return {
    roomId,
    messageId,
    url: normalizedUrl.toString(),
    deepLinkUrl: resolveTenantAwareTeamChatMessageLinkHref({
      deepLinkUrl: `${normalizedUrl.pathname}${normalizedUrl.search}`,
      roomId,
      messageId,
      currentPathname: options?.currentPathname,
    }),
  };
}

export function extractTeamChatMessageLinksFromText(
  text: string,
  options?: { currentPathname?: string },
) {
  if (!text || !text.includes('http')) return [];
  const matches = text.match(/https?:\/\/[^\s<]+/gi) ?? [];
  const dedupedLinks = new Map<string, TeamChatMessageLinkReference>();

  matches.forEach((rawUrl) => {
    const parsedLink = parseTeamChatMessageLink(rawUrl, options);
    if (!parsedLink) return;

    const dedupeKey = `${parsedLink.roomId}:${parsedLink.messageId}`;
    if (!dedupedLinks.has(dedupeKey)) {
      dedupedLinks.set(dedupeKey, parsedLink);
    }
  });

  return Array.from(dedupedLinks.values());
}
