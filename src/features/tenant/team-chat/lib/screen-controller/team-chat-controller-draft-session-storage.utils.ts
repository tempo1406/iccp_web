'use client';

import type { TeamChatComposerDraftPayload } from '../../lib/team-chat-screen.shared';
import {
  normalizeTeamChatComposerDraftPayload,
} from '../../lib/team-chat-composer-draft-payload.utils';

const COMPOSER_DRAFT_SESSION_STORAGE_KEY = 'team-chat:composer-draft-session:v1';
const MAX_STORED_CONTEXTS = 60;

interface ComposerDraftSessionStorageRecord {
  userId?: string | null;
  drafts?: Record<string, string>;
  payloads?: Record<string, TeamChatComposerDraftPayload>;
  scheduledEdits?: Record<string, string>;
  updatedAt?: string;
}

export interface TeamChatComposerDraftSessionCache {
  draftsByContext: Map<string, string>;
  payloadByContext: Map<string, TeamChatComposerDraftPayload>;
  scheduledEditByContext: Map<string, string>;
}

function createEmptyCache(): TeamChatComposerDraftSessionCache {
  return {
    draftsByContext: new Map<string, string>(),
    payloadByContext: new Map<string, TeamChatComposerDraftPayload>(),
    scheduledEditByContext: new Map<string, string>(),
  };
}

function normalizeNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function readDraftMap(value: unknown): Map<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return new Map<string, string>();
  }

  const nextMap = new Map<string, string>();
  Object.entries(value).forEach(([contextKey, content]) => {
    const normalizedContextKey = normalizeNonEmptyString(contextKey);
    if (!normalizedContextKey || typeof content !== 'string') return;
    if (content.trim().length === 0) return;
    nextMap.set(normalizedContextKey, content);
  });
  return nextMap;
}

function readPayloadMap(value: unknown): Map<string, TeamChatComposerDraftPayload> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return new Map<string, TeamChatComposerDraftPayload>();
  }

  const nextMap = new Map<string, TeamChatComposerDraftPayload>();
  Object.entries(value).forEach(([contextKey, payload]) => {
    const normalizedContextKey = normalizeNonEmptyString(contextKey);
    if (!normalizedContextKey || !payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return;
    }

    const normalizedPayload = normalizeTeamChatComposerDraftPayload(
      payload as Partial<TeamChatComposerDraftPayload>,
    );
    const shouldSkipPayload =
      normalizedPayload.content.trim().length === 0 &&
      normalizedPayload.contentFormat === 'plain_text' &&
      !normalizedPayload.richContent;
    if (shouldSkipPayload) return;
    nextMap.set(normalizedContextKey, normalizedPayload);
  });
  return nextMap;
}

function readScheduledEditMap(value: unknown): Map<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return new Map<string, string>();
  }

  const nextMap = new Map<string, string>();
  Object.entries(value).forEach(([contextKey, scheduledMessageId]) => {
    const normalizedContextKey = normalizeNonEmptyString(contextKey);
    const normalizedScheduledMessageId = normalizeNonEmptyString(scheduledMessageId);
    if (!normalizedContextKey || !normalizedScheduledMessageId) return;
    nextMap.set(normalizedContextKey, normalizedScheduledMessageId);
  });
  return nextMap;
}

function trimContextKeys(contextKeys: string[]) {
  if (contextKeys.length <= MAX_STORED_CONTEXTS) return contextKeys;
  return contextKeys.slice(contextKeys.length - MAX_STORED_CONTEXTS);
}

export function readComposerDraftSessionCacheFromStorage(
  currentUserId?: string | null,
): TeamChatComposerDraftSessionCache {
  if (typeof window === 'undefined') return createEmptyCache();

  try {
    const rawValue = window.sessionStorage.getItem(COMPOSER_DRAFT_SESSION_STORAGE_KEY);
    if (!rawValue) return createEmptyCache();

    const parsed = JSON.parse(rawValue) as ComposerDraftSessionStorageRecord | null;
    if (!parsed || typeof parsed !== 'object') return createEmptyCache();

    const normalizedCurrentUserId = normalizeNonEmptyString(currentUserId);
    const normalizedStoredUserId = normalizeNonEmptyString(parsed.userId);
    if (
      normalizedCurrentUserId &&
      normalizedStoredUserId &&
      normalizedCurrentUserId !== normalizedStoredUserId
    ) {
      return createEmptyCache();
    }

    const draftsByContext = readDraftMap(parsed.drafts);
    const payloadByContext = readPayloadMap(parsed.payloads);
    const scheduledEditByContext = readScheduledEditMap(parsed.scheduledEdits);
    const trimmedContextKeys = trimContextKeys(
      Array.from(
        new Set<string>([
          ...draftsByContext.keys(),
          ...payloadByContext.keys(),
          ...scheduledEditByContext.keys(),
        ]),
      ),
    );
    if (trimmedContextKeys.length === 0) return createEmptyCache();
    const allowedContextKeys = new Set(trimmedContextKeys);

    const nextDrafts = new Map<string, string>();
    const nextPayloads = new Map<string, TeamChatComposerDraftPayload>();
    const nextScheduledEdits = new Map<string, string>();

    trimmedContextKeys.forEach((contextKey) => {
      const draftValue = draftsByContext.get(contextKey);
      const payloadValue =
        payloadByContext.get(contextKey) ??
        (typeof draftValue === 'string'
          ? normalizeTeamChatComposerDraftPayload({ content: draftValue })
          : null);
      const scheduledValue = scheduledEditByContext.get(contextKey);

      if (typeof draftValue === 'string' && draftValue.trim().length > 0) {
        nextDrafts.set(contextKey, draftValue);
      }
      if (payloadValue) {
        const normalizedPayload = normalizeTeamChatComposerDraftPayload(payloadValue);
        const shouldPersistPayload =
          normalizedPayload.content.trim().length > 0 ||
          normalizedPayload.contentFormat === 'rich_text_v1' ||
          Boolean(normalizedPayload.richContent);
        if (shouldPersistPayload) {
          nextPayloads.set(contextKey, normalizedPayload);
        }
      }
      if (scheduledValue) {
        nextScheduledEdits.set(contextKey, scheduledValue);
      }
    });

    const hasAnyEntry =
      nextDrafts.size > 0 || nextPayloads.size > 0 || nextScheduledEdits.size > 0;
    if (!hasAnyEntry) return createEmptyCache();

    // Remove dangling scheduled-edit records when context no longer exists.
    nextScheduledEdits.forEach((_value, contextKey) => {
      if (!allowedContextKeys.has(contextKey)) {
        nextScheduledEdits.delete(contextKey);
      }
    });

    return {
      draftsByContext: nextDrafts,
      payloadByContext: nextPayloads,
      scheduledEditByContext: nextScheduledEdits,
    };
  } catch {
    return createEmptyCache();
  }
}

export function writeComposerDraftSessionCacheToStorage(params: {
  currentUserId?: string | null;
  draftsByContext: Map<string, string>;
  payloadByContext: Map<string, TeamChatComposerDraftPayload>;
  scheduledEditByContext: Map<string, string>;
}) {
  if (typeof window === 'undefined') return;

  const contextKeys = trimContextKeys(
    Array.from(
      new Set<string>([
        ...params.draftsByContext.keys(),
        ...params.payloadByContext.keys(),
        ...params.scheduledEditByContext.keys(),
      ]),
    ),
  );

  if (contextKeys.length === 0) {
    try {
      window.sessionStorage.removeItem(COMPOSER_DRAFT_SESSION_STORAGE_KEY);
    } catch {
      // no-op: storage may be unavailable.
    }
    return;
  }

  const drafts: Record<string, string> = {};
  const payloads: Record<string, TeamChatComposerDraftPayload> = {};
  const scheduledEdits: Record<string, string> = {};

  contextKeys.forEach((contextKey) => {
    const draftValue = params.draftsByContext.get(contextKey);
    const payloadValue = params.payloadByContext.get(contextKey);
    const scheduledValue = params.scheduledEditByContext.get(contextKey);

    if (typeof draftValue === 'string' && draftValue.trim().length > 0) {
      drafts[contextKey] = draftValue;
    }
    if (payloadValue) {
      const normalizedPayload = normalizeTeamChatComposerDraftPayload(payloadValue);
      const shouldPersistPayload =
        normalizedPayload.content.trim().length > 0 ||
        normalizedPayload.contentFormat === 'rich_text_v1' ||
        Boolean(normalizedPayload.richContent);
      if (shouldPersistPayload) {
        payloads[contextKey] = normalizedPayload;
      }
    }
    if (scheduledValue && scheduledValue.trim().length > 0) {
      scheduledEdits[contextKey] = scheduledValue;
    }
  });

  const nextRecord: ComposerDraftSessionStorageRecord = {
    userId: normalizeNonEmptyString(params.currentUserId),
    updatedAt: new Date().toISOString(),
    ...(Object.keys(drafts).length > 0 ? { drafts } : {}),
    ...(Object.keys(payloads).length > 0 ? { payloads } : {}),
    ...(Object.keys(scheduledEdits).length > 0 ? { scheduledEdits } : {}),
  };

  const hasAnyEntry =
    Boolean(nextRecord.drafts && Object.keys(nextRecord.drafts).length > 0) ||
    Boolean(nextRecord.payloads && Object.keys(nextRecord.payloads).length > 0) ||
    Boolean(nextRecord.scheduledEdits && Object.keys(nextRecord.scheduledEdits).length > 0);

  if (!hasAnyEntry) {
    try {
      window.sessionStorage.removeItem(COMPOSER_DRAFT_SESSION_STORAGE_KEY);
    } catch {
      // no-op: storage may be unavailable.
    }
    return;
  }

  try {
    window.sessionStorage.setItem(
      COMPOSER_DRAFT_SESSION_STORAGE_KEY,
      JSON.stringify(nextRecord),
    );
  } catch {
    // no-op: storage quota may be unavailable.
  }
}

