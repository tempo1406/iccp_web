'use client';

import type { PersonalFeedItem } from '../../data/team-chat-ui-data';

function toTimestamp(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function comparePersonalFeedByNewest(left: PersonalFeedItem, right: PersonalFeedItem) {
  const diff = toTimestamp(right.occurredAt) - toTimestamp(left.occurredAt);
  if (diff !== 0) return diff;

  if (left.isUnread !== right.isUnread) {
    return left.isUnread ? -1 : 1;
  }

  return left.id.localeCompare(right.id);
}

export function sortPersonalFeedItemsByNewest(items: PersonalFeedItem[]) {
  return [...items].sort(comparePersonalFeedByNewest);
}

