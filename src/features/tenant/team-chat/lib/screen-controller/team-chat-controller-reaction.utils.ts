'use client';

import type { ConversationMessage } from '../../data/team-chat-ui-data';
import type { TeamChatMessageReactionSummaryResponse } from '../../services/types/team-chat.types';

export function sortTeamChatReactionSummaries(
  reactions: TeamChatMessageReactionSummaryResponse[],
): TeamChatMessageReactionSummaryResponse[] {
  return [...reactions].sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count;
    return left.emoji.localeCompare(right.emoji);
  });
}

export function mergeTeamChatReactionSummaryList(
  currentReactions: TeamChatMessageReactionSummaryResponse[] | undefined,
  nextReaction: TeamChatMessageReactionSummaryResponse,
) {
  const previousReaction = currentReactions?.find((reaction) => reaction.emoji === nextReaction.emoji);
  const resolvedReaction =
    nextReaction.count > 0 &&
    !(nextReaction.reactors?.length ?? 0) &&
    (previousReaction?.reactors?.length ?? 0) > 0
      ? {
          ...nextReaction,
          reactors: previousReaction?.reactors,
        }
      : nextReaction;

  const nextReactions = (currentReactions ?? []).filter(
    (reaction) => reaction.emoji !== nextReaction.emoji,
  );

  if (resolvedReaction.count > 0) {
    nextReactions.push(resolvedReaction);
  }

  return sortTeamChatReactionSummaries(nextReactions);
}

export function mapConversationReactionToSummary(
  reaction: NonNullable<ConversationMessage['reactions']>[number],
): TeamChatMessageReactionSummaryResponse {
  return {
    emoji: reaction.emoji,
    count: reaction.count,
    reactedByMe: Boolean(reaction.reacted),
    reactors: reaction.reactors?.map((reactor) => ({
      userId: reactor.userId,
      displayName: reactor.displayName,
      email: reactor.email,
      avatarUrl: reactor.avatarUrl,
      reactedAt: reactor.reactedAt,
    })),
  };
}
