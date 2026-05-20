import {
  addDays,
  format,
  isToday,
  isTomorrow,
  nextMonday,
  setHours,
  setMilliseconds,
  setMinutes,
  setSeconds,
} from 'date-fns';
import type {
  ConversationKey,
  ConversationKind,
  ConversationMessageContentFormat,
  DirectMessageContact,
  WorkspaceChannel,
} from './team-chat-ui-data';

export type DraftHubTab = 'drafts' | 'scheduled';

export interface TeamChatDraftHubConversationTarget {
  key: ConversationKey;
  kind: ConversationKind;
  title: string;
  visibility: 'public' | 'private';
  avatarUrl?: string;
}

export interface TeamChatDraftItem {
  id: string;
  roomId: string;
  conversationKey: ConversationKey;
  conversationKind: ConversationKind;
  conversationTitle: string;
  conversationVisibility: 'public' | 'private';
  avatarUrl?: string;
  content: string;
  contentFormat?: ConversationMessageContentFormat;
  richContent?: Record<string, unknown> | null;
  preview: string;
  updatedAtIso?: string;
  updatedAtLabel: string;
  threadRootMessageId?: string;
  parentMessageId?: string;
  draftSource?: string;
  attachmentHint?: 'snippet' | 'image';
}

export interface TeamChatScheduledItem extends TeamChatDraftItem {
  scheduledForIso: string;
  scheduledForLabel: string;
  scheduledTimezone?: string;
  status?: string;
  sourceDraftId?: string;
  lastErrorMessage?: string;
}

interface DraftSeedTemplate {
  id: string;
  kind: 'draft' | 'scheduled';
  preferredConversationKind?: ConversationKind;
  content: string;
  attachmentHint?: TeamChatDraftItem['attachmentHint'];
  updatedAt: Date;
  scheduledFor?: Date;
}

function nextCalendarDay(reference: Date) {
  return addDays(
    setMilliseconds(setSeconds(setMinutes(setHours(reference, 0), 0), 0), 0),
    1,
  );
}

function atNine(reference: Date) {
  return setMilliseconds(setSeconds(setMinutes(setHours(reference, 9), 0), 0), 0);
}

const DEFAULT_TOMORROW_AT_NINE = atNine(nextCalendarDay(new Date()));
const DEFAULT_NEXT_MONDAY_AT_NINE = atNine(nextMonday(new Date()));

const seedTemplates: DraftSeedTemplate[] = [
  {
    id: 'draft-seed-1',
    kind: 'draft',
    preferredConversationKind: 'dm',
    content: 'Da cho em gui nha thay',
    updatedAt: addDays(new Date(), 0),
  },
  {
    id: 'draft-seed-2',
    kind: 'draft',
    preferredConversationKind: 'channel',
    content: '',
    attachmentHint: 'snippet',
    updatedAt: addDays(new Date(), 0),
  },
  {
    id: 'scheduled-seed-1',
    kind: 'scheduled',
    preferredConversationKind: 'dm',
    content: 'Check task di ban',
    updatedAt: addDays(new Date(), 0),
    scheduledFor: DEFAULT_TOMORROW_AT_NINE,
  },
  {
    id: 'scheduled-seed-2',
    kind: 'scheduled',
    preferredConversationKind: 'channel',
    content:
      'Toi muon ban fix theo huong performance-first: co lap input composer khoi cac re-render khong can thiet.',
    updatedAt: addDays(new Date(), 0),
    scheduledFor: DEFAULT_NEXT_MONDAY_AT_NINE,
  },
];

function buildPreview(content: string) {
  const normalized = content.trim();
  if (!normalized) return 'No message';
  return normalized;
}

function formatUpdatedAtLabel(reference: Date) {
  return format(reference, 'h:mm a');
}

export function formatScheduledForLabel(reference: Date) {
  return `${formatScheduledDayLabel(reference)} at ${format(reference, 'HH:mm')}`;
}

export function formatScheduledDateOptionLabel(reference: Date) {
  return `${formatScheduledDayLabel(reference)}, ${format(reference, 'd MMMM')}`;
}

export function formatScheduledForHintLabel(reference: Date) {
  return `${formatScheduledDayLabel(reference)} at ${format(reference, 'h:mm a')}`;
}

function formatScheduledDayLabel(reference: Date) {
  if (isToday(reference)) return 'Today';
  if (isTomorrow(reference)) return 'Tomorrow';
  return format(reference, 'EEEE');
}

function buildConversationOptions(params: {
  activeConversation: TeamChatDraftHubConversationTarget;
  channels: WorkspaceChannel[];
  directMessages: DirectMessageContact[];
}) {
  const { activeConversation, channels, directMessages } = params;
  const directMessageOptions: TeamChatDraftHubConversationTarget[] = directMessages
    .map((contact) => ({
      key: `dm:${contact.roomId ?? contact.id}` as ConversationKey,
      kind: 'dm' as const,
      title: contact.name,
      visibility: 'private' as const,
      avatarUrl: contact.avatarUrl,
    }))
    .filter((item) => item.title.trim().length > 0);
  const channelOptions: TeamChatDraftHubConversationTarget[] = channels
    .map((channel) => ({
      key: `channel:${channel.id}` as ConversationKey,
      kind: 'channel' as const,
      title: channel.name,
      visibility: channel.visibility,
    }))
    .filter((item) => item.title.trim().length > 0);

  const deduped = new Map<ConversationKey, TeamChatDraftHubConversationTarget>();

  [activeConversation, ...directMessageOptions, ...channelOptions].forEach((item) => {
    if (!deduped.has(item.key)) {
      deduped.set(item.key, item);
    }
  });

  return Array.from(deduped.values());
}

function pickConversation(
  options: TeamChatDraftHubConversationTarget[],
  kind: ConversationKind | undefined,
  fallbackIndex: number,
) {
  const matchingOption = kind
    ? options.find((option) => option.kind === kind) ?? null
    : null;
  if (matchingOption) return matchingOption;

  return options[fallbackIndex % options.length] ?? null;
}

export function createDraftHubItemId(prefix: 'draft' | 'scheduled') {
  const generatedId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${generatedId}`;
}

export function createTeamChatDraftItem(params: {
  id?: string;
  roomId?: string;
  conversation: TeamChatDraftHubConversationTarget;
  content: string;
  contentFormat?: ConversationMessageContentFormat;
  richContent?: Record<string, unknown> | null;
  updatedAt?: Date;
  updatedAtIso?: string;
  threadRootMessageId?: string;
  parentMessageId?: string;
  draftSource?: string;
  attachmentHint?: TeamChatDraftItem['attachmentHint'];
}): TeamChatDraftItem {
  return {
    id: params.id ?? createDraftHubItemId('draft'),
    roomId: params.roomId ?? params.conversation.key.split(':')[1] ?? '',
    conversationKey: params.conversation.key,
    conversationKind: params.conversation.kind,
    conversationTitle: params.conversation.title,
    conversationVisibility: params.conversation.visibility,
    avatarUrl: params.conversation.avatarUrl,
    content: params.content,
    contentFormat: params.contentFormat,
    richContent: params.richContent,
    preview: buildPreview(params.content),
    updatedAtIso: params.updatedAtIso ?? params.updatedAt?.toISOString(),
    updatedAtLabel: formatUpdatedAtLabel(params.updatedAt ?? new Date()),
    threadRootMessageId: params.threadRootMessageId,
    parentMessageId: params.parentMessageId,
    draftSource: params.draftSource,
    attachmentHint: params.attachmentHint,
  };
}

export function createTeamChatScheduledItem(params: {
  id?: string;
  roomId?: string;
  conversation: TeamChatDraftHubConversationTarget;
  content: string;
  contentFormat?: ConversationMessageContentFormat;
  richContent?: Record<string, unknown> | null;
  scheduledFor: Date;
  updatedAt?: Date;
  updatedAtIso?: string;
  threadRootMessageId?: string;
  parentMessageId?: string;
  draftSource?: string;
  scheduledTimezone?: string;
  status?: string;
  sourceDraftId?: string;
  lastErrorMessage?: string;
  attachmentHint?: TeamChatDraftItem['attachmentHint'];
}): TeamChatScheduledItem {
  const baseItem = createTeamChatDraftItem({
    id: params.id ?? createDraftHubItemId('scheduled'),
    roomId: params.roomId,
    conversation: params.conversation,
    content: params.content,
    contentFormat: params.contentFormat,
    richContent: params.richContent,
    updatedAt: params.updatedAt,
    updatedAtIso: params.updatedAtIso,
    threadRootMessageId: params.threadRootMessageId,
    parentMessageId: params.parentMessageId,
    draftSource: params.draftSource,
    attachmentHint: params.attachmentHint,
  });

  return {
    ...baseItem,
    scheduledForIso: params.scheduledFor.toISOString(),
    scheduledForLabel: formatScheduledForLabel(params.scheduledFor),
    scheduledTimezone: params.scheduledTimezone,
    status: params.status,
    sourceDraftId: params.sourceDraftId,
    lastErrorMessage: params.lastErrorMessage,
  };
}

export function createTeamChatScheduledItemFromDraft(
  draft: TeamChatDraftItem,
  scheduledFor: Date,
) {
  return createTeamChatScheduledItem({
    conversation: {
      key: draft.conversationKey,
      kind: draft.conversationKind,
      title: draft.conversationTitle,
      visibility: draft.conversationVisibility,
      avatarUrl: draft.avatarUrl,
    },
    content: draft.content,
    contentFormat: draft.contentFormat,
    richContent: draft.richContent,
    scheduledFor,
    attachmentHint: draft.attachmentHint,
  });
}

export function createTeamChatDraftItemFromScheduled(scheduledItem: TeamChatScheduledItem) {
  return createTeamChatDraftItem({
    conversation: {
      key: scheduledItem.conversationKey,
      kind: scheduledItem.conversationKind,
      title: scheduledItem.conversationTitle,
      visibility: scheduledItem.conversationVisibility,
      avatarUrl: scheduledItem.avatarUrl,
    },
    content: scheduledItem.content,
    contentFormat: scheduledItem.contentFormat,
    richContent: scheduledItem.richContent,
    attachmentHint: scheduledItem.attachmentHint,
  });
}

export function createMockTeamChatDraftHubSeed(params: {
  activeConversation: TeamChatDraftHubConversationTarget;
  channels: WorkspaceChannel[];
  directMessages: DirectMessageContact[];
}) {
  const conversationOptions = buildConversationOptions(params);
  if (!conversationOptions.length) {
    return {
      drafts: [] as TeamChatDraftItem[],
      scheduled: [] as TeamChatScheduledItem[],
    };
  }

  const drafts: TeamChatDraftItem[] = [];
  const scheduled: TeamChatScheduledItem[] = [];

  seedTemplates.forEach((template, index) => {
    const conversation = pickConversation(
      conversationOptions,
      template.preferredConversationKind,
      index,
    );

    if (!conversation) return;

    if (template.kind === 'draft') {
      drafts.push(
        createTeamChatDraftItem({
          id: template.id,
          conversation,
          content: template.content,
          updatedAt: template.updatedAt,
          attachmentHint: template.attachmentHint,
        }),
      );
      return;
    }

    scheduled.push(
      createTeamChatScheduledItem({
        id: template.id,
        conversation,
        content: template.content,
        updatedAt: template.updatedAt,
        scheduledFor: template.scheduledFor ?? DEFAULT_TOMORROW_AT_NINE,
        attachmentHint: template.attachmentHint,
      }),
    );
  });

  return {
    drafts,
    scheduled,
  };
}
