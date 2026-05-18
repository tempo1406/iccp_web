import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Archive,
  AtSign,
  Bell,
  FileText,
  Files,
  Image as ImageIcon,
  MessageSquare,
  Pin,
  Smile,
  Table2,
  Video,
} from 'lucide-react';
import type {
  ConversationKey,
  ConversationKind,
  ConversationMessage,
  ConversationTab,
  FileKind,
  PersonalFeedKind,
  PersonalItemId,
  PresenceStatus,
} from '../data/team-chat-ui-data';

export type PersonalFilter = 'mentions' | 'threads' | 'reactions' | 'unread';
export type TeamChatView = 'channel' | 'personal' | 'drafts' | 'browse';

export interface TeamChatOpenSections {
  personal: boolean;
  starred: boolean;
  channels: boolean;
  groupChats: boolean;
  directMessages: boolean;
  hidden: boolean;
  archived: boolean;
}

export interface ComposerState {
  mode: 'reply';
  message: ConversationMessage;
}

export interface StarredConversationItem {
  key: ConversationKey;
  kind: ConversationKind;
  id: string;
  name: string;
  subtitle?: string;
  unread?: number;
  visibility?: 'public' | 'private';
  avatarUrl?: string;
  status?: PresenceStatus;
  memberPreview?: {
    id: string;
    name: string;
    avatarUrl?: string;
  }[];
  memberPreviewOverflowCount?: number;
}

export interface SidebarDraftIndicator {
  preview: string;
}

export interface RecoverableConversationItem {
  key: ConversationKey;
  roomId: string;
  kind: ConversationKind;
  name: string;
  visibility?: 'public' | 'private';
  avatarUrl?: string;
  status?: PresenceStatus;
}

export interface ActiveConversationDisplay {
  title: string;
  subtitle: string;
  unread: number;
  visibility: 'public' | 'private';
  memberCount: number;
  avatarUrl?: string;
  status?: PresenceStatus;
}

export interface MentionCandidate {
  id: string;
  name: string;
  displayName?: string;
  role?: string;
  status?: PresenceStatus;
  avatarUrl?: string;
  inCurrentConversation: boolean;
  kind?: 'user' | 'special';
  specialMentionType?: 'channel' | 'everyone';
}

export type ComposerAttachmentKind = 'file' | 'image' | 'video' | 'audio';

export interface ComposerAttachmentDraft {
  id: string;
  file: File;
  fileName: string;
  mimeType: string;
  attachmentType: ComposerAttachmentKind;
  fileSizeLabel: string;
  previewUrl?: string;
  previewProgress: number;
  previewStatus: 'preparing' | 'ready' | 'failed';
  width?: number;
  height?: number;
  durationMs?: number;
  error?: string;
}

export interface UploadingAttachmentDraft {
  id: string;
  file: File;
  fileName: string;
  mimeType: string;
  attachmentType: ComposerAttachmentKind;
  fileSizeLabel: string;
  previewUrl?: string;
  progress: number;
  status: 'uploading' | 'failed';
  clientUploadId?: string;
  attemptCount?: number;
  width?: number;
  height?: number;
  durationMs?: number;
  error?: string;
}

export interface TeamChatComposerDraftPayload {
  content: string;
  contentFormat: 'plain_text' | 'rich_text_v1';
  richContent?: Record<string, unknown> | null;
}

export const focusRingClass =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40';

export const personalItemIcons: Record<PersonalItemId, LucideIcon> = {
  mentions: AtSign,
  threads: MessageSquare,
  reactions: Smile,
  unread: Bell,
  drafts: FileText,
};

export const personalFilterMeta: Record<
  PersonalFilter,
  { label: string; icon: LucideIcon }
> = {
  mentions: { label: 'Mentions', icon: AtSign },
  threads: { label: 'Threads', icon: MessageSquare },
  reactions: { label: 'Reactions', icon: Smile },
  unread: { label: 'Unread', icon: Bell },
};

export const personalFeedKindMeta: Record<
  PersonalFeedKind,
  { label: string; icon: LucideIcon }
> = {
  mentions: { label: 'Mention', icon: AtSign },
  threads: { label: 'Thread', icon: MessageSquare },
  reactions: { label: 'Reaction', icon: Smile },
  unread: { label: 'Unread', icon: Bell },
};

export const tabMeta: Record<ConversationTab, { label: string; icon: LucideIcon }> = {
  messages: { label: 'Messages', icon: MessageSquare },
  files: { label: 'Files', icon: Files },
  photos: { label: 'Photos', icon: ImageIcon },
  pins: { label: 'Pins', icon: Pin },
};

export const fileKindIconMap: Record<FileKind, LucideIcon> = {
  document: FileText,
  spreadsheet: Table2,
  presentation: Files,
  archive: Archive,
  image: ImageIcon,
  video: Video,
};

export const emojiPickerStyle = {
  '--epr-bg-color': 'var(--popover)',
  '--epr-category-label-bg-color': 'var(--popover)',
  '--epr-hover-bg-color': 'var(--accent)',
  '--epr-focus-bg-color': 'var(--accent)',
  '--epr-text-color': 'var(--foreground)',
  '--epr-search-border-color': 'var(--border)',
  '--epr-picker-border-color': 'var(--border)',
  '--epr-highlight-color': 'var(--primary)',
  '--epr-emoji-size': '22px',
} as CSSProperties;

export function initials(name?: string | null) {
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  if (!normalizedName) return '?';

  return normalizedName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function presenceDotClass(status: PresenceStatus) {
  if (status === 'online') return 'bg-emerald-500';
  if (status === 'busy') return 'bg-red-500';
  if (status === 'offline') return 'bg-slate-400';
  return 'bg-amber-500';
}

export function fileKindLabel(kind: FileKind) {
  if (kind === 'spreadsheet') return 'Spreadsheet';
  if (kind === 'presentation') return 'Presentation';
  if (kind === 'archive') return 'Archive';
  if (kind === 'image') return 'Image';
  if (kind === 'video') return 'Video';
  return 'Document';
}

export function formatSearchPreview(message: ConversationMessage, query: string) {
  const text = `${message.author} ${message.content}`;
  const normalized = text.toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();
  const index = normalized.indexOf(normalizedQuery);

  if (index < 0) return text.slice(0, 100);

  const start = Math.max(0, index - 26);
  const end = Math.min(text.length, index + normalizedQuery.length + 38);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';

  return `${prefix}${text.slice(start, end)}${suffix}`;
}

export function sectionBodyClass(isOpen: boolean) {
  return isOpen
    ? 'mt-1 grid min-w-0 grid-rows-[1fr] overflow-hidden opacity-100 transition-[grid-template-rows,opacity,margin] duration-300 ease-out motion-reduce:transition-none'
    : 'mt-0 grid min-w-0 grid-rows-[0fr] overflow-hidden opacity-0 transition-[grid-template-rows,opacity,margin] duration-300 ease-out motion-reduce:transition-none';
}
