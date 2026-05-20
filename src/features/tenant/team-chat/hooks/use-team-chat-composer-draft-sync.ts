'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { TeamChatComposerDraftPayload } from '../lib/team-chat-screen.shared';
import {
  areTeamChatComposerDraftPayloadEqual,
  cloneTeamChatComposerDraftPayload,
} from '../lib/team-chat-composer-draft-payload.utils';

interface UseTeamChatComposerDraftSyncParams {
  draftPayload: TeamChatComposerDraftPayload;
  draftSeedPayload: TeamChatComposerDraftPayload;
  onDraftChange: (payload: TeamChatComposerDraftPayload) => void;
}

export function useTeamChatComposerDraftSync({
  draftPayload,
  draftSeedPayload,
  onDraftChange,
}: UseTeamChatComposerDraftSyncParams) {
  const latestDraftRef = useRef(cloneTeamChatComposerDraftPayload(draftSeedPayload));
  const lastSyncedDraftRef = useRef(cloneTeamChatComposerDraftPayload(draftSeedPayload));
  const onDraftChangeRef = useRef(onDraftChange);

  const markDraftAsSynced = useCallback((payload: TeamChatComposerDraftPayload) => {
    const nextPayload = cloneTeamChatComposerDraftPayload(payload);
    latestDraftRef.current = nextPayload;
    lastSyncedDraftRef.current = nextPayload;
  }, []);

  const syncDraftNow = useCallback((payload: TeamChatComposerDraftPayload) => {
    if (areTeamChatComposerDraftPayloadEqual(payload, lastSyncedDraftRef.current)) return;
    const nextPayload = cloneTeamChatComposerDraftPayload(payload);
    latestDraftRef.current = nextPayload;
    lastSyncedDraftRef.current = nextPayload;
    onDraftChangeRef.current(nextPayload);
  }, []);

  useEffect(() => {
    latestDraftRef.current = cloneTeamChatComposerDraftPayload(draftPayload);
  }, [draftPayload]);

  useEffect(() => {
    onDraftChangeRef.current = onDraftChange;
  }, [onDraftChange]);

  useEffect(() => {
    syncDraftNow(draftPayload);
  }, [draftPayload, syncDraftNow]);

  return {
    markDraftAsSynced,
    syncDraftNow,
  };
}
