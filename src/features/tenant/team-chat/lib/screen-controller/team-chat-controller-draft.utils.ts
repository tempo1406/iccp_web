'use client';

import type { ConversationMessage } from '../../data/team-chat-ui-data';
import { formatScheduledForHintLabel } from '../../data/team-chat-drafts-ui-data';

export function buildTeamChatDraftContextKey(params: {
  roomId?: string | null;
  threadRootMessageId?: string | null;
  parentMessageId?: string | null;
}) {
  return [params.roomId ?? '', params.threadRootMessageId ?? '', params.parentMessageId ?? ''].join('::');
}

export function formatScheduledComposerNoticeLabel(scheduledForIso: string) {
  return formatScheduledForHintLabel(new Date(scheduledForIso));
}

export function createDraftReplyPlaceholderMessage(params: {
  replyMessageId: string;
  threadRootMessageId?: string;
}): ConversationMessage {
  return {
    id: params.replyMessageId,
    parentMessageId:
      params.threadRootMessageId && params.threadRootMessageId !== params.replyMessageId
        ? params.threadRootMessageId
        : undefined,
    author: 'Original message',
    handle: '',
    time: '',
    content: 'Reply context restored from draft.',
  };
}
