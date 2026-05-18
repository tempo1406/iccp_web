import type { ReactNode } from 'react';
import { appConfig } from '@/common/constant/app';
import type {
  TaskAttachmentResponse,
  TaskCommentResponse,
  TaskHistoryResponse,
  TaskResponse,
} from '../services/projects.service';
import type { ProjectTaskDetailFormState } from './project-task-detail-dialog.types';

export const COMMENT_REACTION_OPTIONS = [
  { reaction: 'heart', label: 'Heart', emoji: '\u2764\ufe0f' },
  { reaction: 'clap', label: 'Clapping Hands', emoji: '\ud83d\udc4f' },
  { reaction: 'laugh', label: 'Laugh', emoji: '\ud83d\ude04' },
  { reaction: 'rocket', label: 'Rocket', emoji: '\ud83d\ude80' },
  { reaction: 'eyes', label: 'Eyes', emoji: '\ud83d\udc40' },
];

export function toDateInputValue(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildInitialFormState(task: TaskResponse | null): ProjectTaskDetailFormState {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    statusId: task?.statusId ?? '',
    priority: task?.priority ?? 'medium',
    assignedTo: task?.assignedTo ?? '',
    startedAt: toDateInputValue(task?.startedAt),
    dueDate: toDateInputValue(task?.dueDate),
    actualStart: toDateInputValue(task?.actualStart),
    actualEnd: toDateInputValue(task?.actualEnd),
    estimatedPoint: task?.estimatedPoint != null ? String(task.estimatedPoint) : '',
    estimatedHours: task?.estimatedHours != null ? String(task.estimatedHours) : '',
  };
}

export function getInitials(label: string): string {
  return label
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function toDateLabel(value?: string): string {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not available';
  return parsed.toLocaleString();
}

export function toRelativeTimeLabel(value?: string): string {
  if (!value) return 'Unknown time';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown time';

  const diffMs = Date.now() - parsed.getTime();
  if (diffMs < 0) return toDateLabel(value);

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  return toDateLabel(value);
}

export function resolveAttachmentName(
  fileName?: string | null,
  fileUrl?: string | null,
): string {
  const normalizedName = fileName?.trim();
  if (normalizedName) return normalizedName;

  const normalizedUrl = fileUrl?.trim();
  if (!normalizedUrl) return 'Attachment';
  try {
    const parsed = new URL(normalizedUrl);
    const segment = parsed.pathname.split('/').filter(Boolean).at(-1);
    if (segment) {
      const decoded = decodeURIComponent(segment).trim();
      if (decoded) return decoded;
    }
  } catch {
    const segment = normalizedUrl.split('/').filter(Boolean).at(-1);
    if (segment) return segment;
  }
  return 'Attachment';
}

export function resolveAttachmentType(
  attachment: TaskAttachmentResponse,
): 'local_file' | 'web_link' {
  const source = attachment as TaskAttachmentResponse & { attachmentType?: string | null };
  const rawType = source.attachmentType?.trim().toLowerCase();
  if (rawType === 'web_link') return 'web_link';
  return 'local_file';
}

export function isImageAttachment(attachment: TaskAttachmentResponse): boolean {
  const mimeType = attachment.mimeType?.trim().toLowerCase();
  if (mimeType?.startsWith('image/')) return true;

  const fileName = resolveAttachmentName(attachment.fileName, attachment.fileUrl).toLowerCase();
  return /\.(png|jpe?g|gif|bmp|webp|svg|ico|avif|heic|heif)$/i.test(fileName);
}

export function resolveAttachmentAccessUrl(
  projectId: string,
  taskId: string,
  attachment: TaskAttachmentResponse,
): string {
  const source = attachment as TaskAttachmentResponse & { accessUrl?: string | null };
  const rawAccessUrl = source.accessUrl?.trim();
  if (rawAccessUrl) return rawAccessUrl;
  if (resolveAttachmentType(attachment) === 'web_link') {
    return attachment.fileUrl;
  }
  return `/v1/projects/${projectId}/tasks/${taskId}/attachments/${attachment.id}/content`;
}

export function toAbsoluteApiUrl(url: string): string {
  const normalized = url.trim();
  if (!normalized) return normalized;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  const path = normalized.startsWith('/') ? normalized : `/${normalized}`;
  const baseUrl = appConfig.apiBaseUrl.trim().replace(/\/$/, '');
  if (!baseUrl) return path;

  if (/^https?:\/\//i.test(baseUrl)) {
    try {
      const parsedBaseUrl = new URL(baseUrl);
      const basePath = parsedBaseUrl.pathname.replace(/\/$/, '');
      if (basePath && (path === basePath || path.startsWith(`${basePath}/`))) {
        return `${parsedBaseUrl.origin}${path}`;
      }
    } catch {
      // Fallback to default concatenation below.
    }
  } else {
    const normalizedBasePath = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
    if (path === normalizedBasePath || path.startsWith(`${normalizedBasePath}/`)) {
      return path;
    }
  }

  return `${baseUrl}${path}`;
}

export function resolveTaskSlug(task: TaskResponse | null): string {
  if (!task) return '';
  const slugSource = task.slug;
  if (typeof slugSource === 'string' && slugSource.trim().length > 0) {
    return slugSource.trim().toUpperCase();
  }
  return `TS-${task.id.replace(/-/g, '').slice(0, 4).toUpperCase()}`;
}

function readHistoryField(
  item: TaskHistoryResponse,
  keys: string[],
): string | undefined {
  const source = item as unknown as Record<string, unknown>;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
  }
  return undefined;
}

export function getHistoryTransition(item: TaskHistoryResponse): {
  from?: string;
  to?: string;
} {
  return {
    from: readHistoryField(item, ['fromValue', 'from_value', 'oldValue']),
    to: readHistoryField(item, ['toValue', 'to_value', 'newValue']),
  };
}

export function getHistoryActorId(item: TaskHistoryResponse): string | null {
  return item.actorId ?? item.actorUserId ?? null;
}

export function getHistoryActorDisplayName(item: TaskHistoryResponse): string | null {
  return item.actorDisplayName ?? null;
}

export function formatTransitionLabel(value: string): string {
  return value.replace(/_/g, ' ').trim().toUpperCase();
}

export function isStatusChangeAction(action?: string): boolean {
  return Boolean(action && action.toLowerCase().includes('status'));
}

const HISTORY_ACTION_LABELS: Record<string, string> = {
  create: 'created the task',
  description_change: 'updated the description',
  status_change: 'changed the status',
  comment_add: 'added a comment',
  tag_add: 'added a tag',
  tag_remove: 'removed a tag',
  attachment_add: 'added an attachment',
  attachment_remove: 'removed an attachment',
};

export function toHistoryActionLabel(action?: string): string {
  const normalized = action?.trim().toLowerCase();
  if (!normalized) return 'updated the task';
  const mapped = HISTORY_ACTION_LABELS[normalized];
  if (mapped) return mapped;
  return normalized.replace(/[_-]+/g, ' ');
}

export function isTodoStatusName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return (
    normalized.includes('todo') ||
    normalized.includes('to do') ||
    normalized.includes('backlog')
  );
}

export function formatPriorityLabel(priority?: string | null): string {
  if (!priority) return 'Medium';
  const normalized = priority.toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function getMentionContext(
  content: string,
  caret: number | null,
): { start: number; query: string; caret: number } | null {
  if (caret == null || caret < 0) return null;
  const textBeforeCaret = content.slice(0, caret);
  const match = textBeforeCaret.match(/(^|\s)@([^\s@]*)$/);
  if (!match) return null;
  const query = match[2] ?? '';
  const start = caret - query.length - 1;
  if (start < 0) return null;
  return { start, query, caret };
}

export function renderCommentContentWithMentions(
  content: string,
  mentionUserIds: string[] | null | undefined,
  resolveMentionLabel: (userId: string) => string,
): ReactNode {
  if (!content) return null;

  const mentionTokens = [...new Set(
    (mentionUserIds ?? [])
      .map((userId) => resolveMentionLabel(userId).trim())
      .filter(Boolean)
      .map((label) => `@${label}`),
  )];

  if (mentionTokens.length === 0) return content;

  const orderedTokens = [...mentionTokens].sort((a, b) => b.length - a.length);
  const source = content;
  const sourceLower = source.toLowerCase();
  const pieces: ReactNode[] = [];

  let cursor = 0;
  let key = 0;

  while (cursor < source.length) {
    let nextIndex = -1;
    let nextToken = '';

    for (const token of orderedTokens) {
      const tokenLower = token.toLowerCase();
      const foundIndex = sourceLower.indexOf(tokenLower, cursor);
      if (foundIndex < 0) continue;
      if (nextIndex === -1 || foundIndex < nextIndex) {
        nextIndex = foundIndex;
        nextToken = token;
      }
    }

    if (nextIndex === -1) {
      pieces.push(source.slice(cursor));
      break;
    }

    if (nextIndex > cursor) {
      pieces.push(source.slice(cursor, nextIndex));
    }

    const mentionText = source.slice(nextIndex, nextIndex + nextToken.length);
    pieces.push(
      <span
        key={`mention-${key}`}
        className="bg-muted mx-0.5 inline-flex rounded-full px-2 py-0.5"
      >
        {mentionText}
      </span>,
    );
    key += 1;
    cursor = nextIndex + nextToken.length;
  }

  return pieces;
}

export function getCommentAuthorId(comment: TaskCommentResponse): string | null {
  const source = comment as TaskCommentResponse & { authorId?: string | null };
  return source.authorId ?? source.authorUserId ?? null;
}

export function getCommentReactions(comment: TaskCommentResponse): {
  reaction: string;
  count: number;
  reactedByMe: boolean;
}[] {
  const source = comment as TaskCommentResponse & {
    reactions?: Array<{
      reaction?: unknown;
      count?: unknown;
      reactedByMe?: unknown;
    }> | null;
  };
  if (!Array.isArray(source.reactions)) return [];

  return source.reactions
    .map((item) => ({
      reaction: typeof item.reaction === 'string' ? item.reaction : '',
      count: typeof item.count === 'number' ? item.count : 0,
      reactedByMe: Boolean(item.reactedByMe),
    }))
    .filter((item) => item.reaction.length > 0);
}
