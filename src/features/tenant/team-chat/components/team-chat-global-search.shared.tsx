'use client';

import { format } from 'date-fns';
import type { ReactNode } from 'react';
import { ROUTES } from '@/common/constant/routes';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { focusRingClass } from '../lib/team-chat-screen.shared';
import type {
  TeamChatGlobalSearchCountsResponse,
  TeamChatGlobalSearchFileItemResponse,
  TeamChatGlobalSearchMessageItemResponse,
  TeamChatGlobalSearchPersonItemResponse,
  TeamChatGlobalSearchRoomItemResponse,
  TeamChatGlobalSearchSectionsResponse,
  TeamChatGlobalSearchSort,
} from '../services/types/team-chat-global-search.types';

type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

export type TeamChatGlobalSearchTab = 'all' | 'people' | 'channels' | 'messages' | 'files';
export type TeamChatGlobalSearchScope = 'workspace' | 'room';

export interface TeamChatGlobalSearchPersonResult {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  presenceStatus: 'online' | 'away' | 'busy' | 'offline';
  isSelf: boolean;
  dmRoomId?: string;
}

export interface TeamChatGlobalSearchRoomResult {
  id: string;
  roomId: string;
  roomType: 'channel' | 'dm' | 'group_dm';
  name: string;
  roomKey?: string | null;
  topic?: string | null;
  visibility: 'public' | 'private';
  memberCount: number;
  lastMessageAt?: string | null;
}

export interface TeamChatGlobalSearchMessageResult {
  id: string;
  messageId: string;
  roomId: string;
  roomName: string;
  roomType: 'channel' | 'dm' | 'group_dm';
  senderDisplayName: string;
  senderAvatarUrl?: string | null;
  snippet: string;
  sentAt: string;
  hasAttachments?: boolean;
}

export interface TeamChatGlobalSearchFileResult {
  id: string;
  attachmentId: string;
  messageId: string;
  roomId: string;
  roomName: string;
  fileName: string;
  attachmentType: string;
  documentType?: string | null;
  uploaderDisplayName?: string | null;
  sentAt?: string | null;
}

export interface TeamChatGlobalSearchSection<TItem> {
  count: number;
  hasMore: boolean;
  items: TItem[];
}

export type TeamChatGlobalSearchSections = {
  people: TeamChatGlobalSearchSection<TeamChatGlobalSearchPersonResult>;
  rooms: TeamChatGlobalSearchSection<TeamChatGlobalSearchRoomResult>;
  messages: TeamChatGlobalSearchSection<TeamChatGlobalSearchMessageResult>;
  files: TeamChatGlobalSearchSection<TeamChatGlobalSearchFileResult>;
};

export type TeamChatGlobalSearchCounts = TeamChatGlobalSearchCountsResponse;

export type TeamChatGlobalSearchAction =
  | { id: string; kind: 'all-results'; label: string }
  | { id: string; kind: 'room-scope'; label: string }
  | { id: string; kind: 'recent-query'; label: string; query: string }
  | { id: string; kind: 'person'; label: string; person: TeamChatGlobalSearchPersonResult }
  | { id: string; kind: 'room'; label: string; room: TeamChatGlobalSearchRoomResult }
  | { id: string; kind: 'message'; label: string; message: TeamChatGlobalSearchMessageResult }
  | { id: string; kind: 'file'; label: string; file: TeamChatGlobalSearchFileResult };

export const MAX_RECENT_QUERIES = 5;
export const PREVIEW_LIMIT = 5;
export const FULL_RESULTS_LIMIT = 20;
export const GLOBAL_RESULTS_ALL_LIMIT = 8;

export function createFileTypeOptions(t: TranslateFn) {
  return [
    { label: t('globalSearch.fileTypeOptions.all'), value: 'all' },
    { label: t('globalSearch.fileTypeOptions.pdf'), value: 'pdf' },
    { label: t('globalSearch.fileTypeOptions.word'), value: 'word' },
    { label: t('globalSearch.fileTypeOptions.excel'), value: 'excel' },
    { label: t('globalSearch.fileTypeOptions.powerpoint'), value: 'powerpoint' },
    { label: t('globalSearch.fileTypeOptions.text'), value: 'text' },
    { label: t('globalSearch.fileTypeOptions.archive'), value: 'archive' },
    { label: t('globalSearch.fileTypeOptions.image'), value: 'image' },
    { label: t('globalSearch.fileTypeOptions.video'), value: 'video' },
  ] as const;
}

export function createSortOptions(t: TranslateFn): Array<{ label: string; value: TeamChatGlobalSearchSort }> {
  return [
    { label: t('globalSearch.sortOptions.bestMatch'), value: 'best_match' },
    { label: t('globalSearch.sortOptions.recent'), value: 'recent' },
  ];
}

const RECENT_QUERY_STORAGE_PREFIX = 'team-chat:global-search:recent:v1';

function buildRecentQueryStorageKey(tenant: string) {
  return `${RECENT_QUERY_STORAGE_PREFIX}:${tenant}`;
}

function coerceSearchText(value: unknown, fallback = '') {
  if (typeof value !== 'string') return fallback;

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : fallback;
}

export function formatTimestampLabel(
  value: string | null | undefined,
  locale: string,
  fallback: string,
) {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return format(parsed, locale === 'vi' ? 'd MMM' : 'MMM d');
}

export function highlightText(text: string, query: string, keyPrefix: string): ReactNode[] {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [text];

  const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(`(${escapedQuery})`, 'gi');
  return text.split(matcher).map((part, index) => {
    const isMatch = part.toLowerCase() === normalizedQuery.toLowerCase();
    if (!isMatch) {
      return <span key={`${keyPrefix}-text-${index}`}>{part}</span>;
    }

    return (
      <mark
        key={`${keyPrefix}-mark-${index}`}
        className="rounded-sm bg-primary/15 px-0.5 text-foreground"
      >
        {part}
      </mark>
    );
  });
}

export function readRecentQueries(tenant: string) {
  if (typeof window === 'undefined') return [];

  try {
    const rawValue = window.localStorage.getItem(buildRecentQueryStorageKey(tenant));
    if (!rawValue) return [];
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter((value) => value.length > 0)
      .slice(0, MAX_RECENT_QUERIES);
  } catch {
    return [];
  }
}

export function persistRecentQueries(tenant: string, values: string[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      buildRecentQueryStorageKey(tenant),
      JSON.stringify(values.slice(0, MAX_RECENT_QUERIES)),
    );
  } catch {
    // Ignore localStorage quota/unavailable errors for this light preference.
  }
}

export function buildConversationHref(params: {
  tenant: string;
  roomId: string;
  messageId?: string;
}) {
  const searchParams = new URLSearchParams();
  searchParams.set('roomId', params.roomId);
  if (params.messageId) {
    searchParams.set('messageId', params.messageId);
  }

  return `${ROUTES.tenant.teamChat(params.tenant)}?${searchParams.toString()}`;
}

export function normalizePresenceStatus(
  status?: string | null,
): TeamChatGlobalSearchPersonResult['presenceStatus'] {
  if (status === 'online') return 'online';
  if (status === 'offline') return 'offline';
  if (status === 'dnd' || status === 'busy') return 'busy';
  return 'away';
}

export function mapPersonSearchItem(
  item: TeamChatGlobalSearchPersonItemResponse,
  t: TranslateFn,
): TeamChatGlobalSearchPersonResult {
  const email = coerceSearchText(item.email);
  const displayName = coerceSearchText(item.displayName, email || t('globalSearch.unknownUser'));

  return {
    id: item.userId,
    userId: item.userId,
    displayName,
    email,
    avatarUrl: item.avatarUrl,
    presenceStatus: normalizePresenceStatus(item.presenceStatus),
    isSelf: Boolean(item.isSelf),
    dmRoomId: item.dmRoomId,
  };
}

export function mapRoomSearchItem(
  item: TeamChatGlobalSearchRoomItemResponse,
  t: TranslateFn,
): TeamChatGlobalSearchRoomResult {
  return {
    id: item.roomId,
    roomId: item.roomId,
    roomType: item.roomType,
    name: coerceSearchText(item.name, t('globalSearch.untitledConversation')),
    roomKey: coerceSearchText(item.roomKey),
    topic: coerceSearchText(item.topic),
    visibility: item.visibility,
    memberCount: item.memberCount,
    lastMessageAt: item.lastMessageAt,
  };
}

export function mapMessageSearchItem(
  item: TeamChatGlobalSearchMessageItemResponse,
  t: TranslateFn,
): TeamChatGlobalSearchMessageResult {
  return {
    id: item.messageId,
    messageId: item.messageId,
    roomId: item.roomId,
    roomName: coerceSearchText(item.roomName, t('globalSearch.unknownRoom')),
    roomType: item.roomType,
    senderDisplayName: coerceSearchText(item.senderDisplayName, t('globalSearch.unknownSender')),
    senderAvatarUrl: item.senderAvatarUrl,
    snippet: coerceSearchText(item.snippet),
    sentAt: item.sentAt,
    hasAttachments: item.hasAttachments,
  };
}

export function mapFileSearchItem(
  item: TeamChatGlobalSearchFileItemResponse,
  t: TranslateFn,
): TeamChatGlobalSearchFileResult {
  return {
    id: item.attachmentId,
    attachmentId: item.attachmentId,
    messageId: item.messageId,
    roomId: item.roomId,
    roomName: coerceSearchText(item.roomName, t('globalSearch.unknownRoom')),
    fileName: coerceSearchText(item.fileName, t('globalSearch.untitledFile')),
    attachmentType: item.attachmentType,
    documentType: item.documentType,
    uploaderDisplayName: coerceSearchText(item.uploaderDisplayName),
    sentAt: item.sentAt,
  };
}

export function mapSectionsResponse(
  sections?: TeamChatGlobalSearchSectionsResponse | null,
  t?: TranslateFn,
): TeamChatGlobalSearchSections {
  const translate = t ?? ((key: string) => key);
  return {
    people: {
      count: sections?.people.count ?? 0,
      hasMore: sections?.people.hasMore ?? false,
      items: sections?.people.items.map((item) => mapPersonSearchItem(item, translate)) ?? [],
    },
    rooms: {
      count: sections?.rooms.count ?? 0,
      hasMore: sections?.rooms.hasMore ?? false,
      items: sections?.rooms.items.map((item) => mapRoomSearchItem(item, translate)) ?? [],
    },
    messages: {
      count: sections?.messages.count ?? 0,
      hasMore: sections?.messages.hasMore ?? false,
      items: sections?.messages.items.map((item) => mapMessageSearchItem(item, translate)) ?? [],
    },
    files: {
      count: sections?.files.count ?? 0,
      hasMore: sections?.files.hasMore ?? false,
      items: sections?.files.items.map((item) => mapFileSearchItem(item, translate)) ?? [],
    },
  };
}

export function createEmptySections(): TeamChatGlobalSearchSections {
  return {
    people: { count: 0, hasMore: false, items: [] },
    rooms: { count: 0, hasMore: false, items: [] },
    messages: { count: 0, hasMore: false, items: [] },
    files: { count: 0, hasMore: false, items: [] },
  };
}

export function createEmptyCounts(): TeamChatGlobalSearchCounts {
  return {
    people: 0,
    rooms: 0,
    messages: 0,
    files: 0,
  };
}

export function tabToApiTab(tab: TeamChatGlobalSearchTab) {
  if (tab === 'channels') return 'rooms' as const;
  return tab;
}

export function countForTab(counts: TeamChatGlobalSearchCounts, tab: TeamChatGlobalSearchTab) {
  if (tab === 'all') {
    return counts.people + counts.rooms + counts.messages + counts.files;
  }
  if (tab === 'channels') return counts.rooms;
  if (tab === 'people') return counts.people;
  if (tab === 'messages') return counts.messages;
  return counts.files;
}

export function SearchPreviewRow({
  active,
  icon,
  title,
  subtitle,
  meta,
  onClick,
  onPointerEnter,
}: {
  active?: boolean;
  icon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  onClick: () => void;
  onPointerEnter?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      className={cn(
        'flex w-full cursor-pointer items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-muted/70',
        active && 'bg-muted/80 ring-1 ring-inset ring-primary/25',
        focusRingClass,
      )}
    >
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{title}</div>
            {subtitle ? (
              <div className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</div>
            ) : null}
          </div>
          {meta ? <div className="shrink-0 text-xs text-muted-foreground">{meta}</div> : null}
        </div>
      </div>
    </button>
  );
}

export function SearchSection({
  title,
  badge,
  hintLabel,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  badge?: ReactNode;
  hintLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {title}
          </h3>
          {badge}
        </div>
        {actionLabel && onAction ? (
          <div className="flex items-center gap-2">
            {hintLabel ? <span className="text-[11px] text-muted-foreground">{hintLabel}</span> : null}
            <button
              type="button"
              onClick={onAction}
              className={cn(
                'cursor-pointer text-xs font-medium text-primary transition-colors hover:text-primary/80',
                focusRingClass,
              )}
            >
              {actionLabel}
            </button>
          </div>
        ) : null}
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

export function SearchSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-2xl px-3 py-2.5">
          <Skeleton className="h-9 w-9 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2 rounded-md" />
            <Skeleton className="h-3 w-2/3 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
