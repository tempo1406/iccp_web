'use client';

import type { TeamChatComposerDraftPayload } from './team-chat-screen.shared';

const richContentSignatureCache = new WeakMap<Record<string, unknown>, string>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneRichContent(
  value: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  try {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getRichContentSignature(value: Record<string, unknown> | null | undefined) {
  if (!isRecord(value)) return 'null';

  const cachedSignature = richContentSignatureCache.get(value);
  if (cachedSignature) {
    return cachedSignature;
  }

  try {
    const signature = JSON.stringify(value);
    richContentSignatureCache.set(value, signature);
    return signature;
  } catch {
    return 'invalid-json';
  }
}

export function createEmptyTeamChatComposerDraftPayload(): TeamChatComposerDraftPayload {
  return {
    content: '',
    contentFormat: 'plain_text',
    richContent: null,
  };
}

export function normalizeTeamChatComposerDraftPayload(
  payload: Partial<TeamChatComposerDraftPayload> | null | undefined,
): TeamChatComposerDraftPayload {
  const content = typeof payload?.content === 'string' ? payload.content : '';
  const normalizedRichContent = cloneRichContent(payload?.richContent ?? null);
  const shouldUseRichFormat =
    payload?.contentFormat === 'rich_text_v1' && normalizedRichContent !== null;

  return {
    content,
    contentFormat: shouldUseRichFormat ? 'rich_text_v1' : 'plain_text',
    richContent: shouldUseRichFormat ? normalizedRichContent : null,
  };
}

export function cloneTeamChatComposerDraftPayload(
  payload: TeamChatComposerDraftPayload,
): TeamChatComposerDraftPayload {
  return normalizeTeamChatComposerDraftPayload(payload);
}

export function areTeamChatComposerDraftPayloadEqual(
  left: TeamChatComposerDraftPayload,
  right: TeamChatComposerDraftPayload,
) {
  if (left.content !== right.content) return false;
  if (left.contentFormat !== right.contentFormat) return false;
  if (left.contentFormat === 'plain_text') return true;

  return getRichContentSignature(left.richContent) === getRichContentSignature(right.richContent);
}

