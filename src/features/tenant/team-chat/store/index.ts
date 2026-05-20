'use client';

import { useSyncExternalStore } from 'react';
import type { ConversationKind } from '../data/team-chat-ui-data';
import type { TeamChatSupportedContextScope } from '../services/types/team-chat.types';

export interface TeamChatSearchContextSnapshot {
  activeRoomId: string;
  activeRoomName: string;
  activeConversationKind: ConversationKind | null;
  scope: TeamChatSupportedContextScope;
  projectId: string;
}

const defaultSnapshot: TeamChatSearchContextSnapshot = {
  activeRoomId: '',
  activeRoomName: '',
  activeConversationKind: null,
  scope: 'organization',
  projectId: '',
};

let snapshot: TeamChatSearchContextSnapshot = defaultSnapshot;

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function hasSnapshotChanged(nextSnapshot: TeamChatSearchContextSnapshot) {
  return (
    snapshot.activeRoomId !== nextSnapshot.activeRoomId ||
    snapshot.activeRoomName !== nextSnapshot.activeRoomName ||
    snapshot.activeConversationKind !== nextSnapshot.activeConversationKind ||
    snapshot.scope !== nextSnapshot.scope ||
    snapshot.projectId !== nextSnapshot.projectId
  );
}

export function setTeamChatSearchContext(nextSnapshot: TeamChatSearchContextSnapshot) {
  if (!hasSnapshotChanged(nextSnapshot)) return;
  snapshot = nextSnapshot;
  emitChange();
}

export function clearTeamChatSearchContext() {
  if (!hasSnapshotChanged(defaultSnapshot)) return;
  snapshot = defaultSnapshot;
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

export function useTeamChatSearchContext() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
