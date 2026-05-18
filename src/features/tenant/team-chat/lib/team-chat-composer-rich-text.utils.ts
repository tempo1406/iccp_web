'use client';

import type { Editor, JSONContent } from '@tiptap/react';
import type { TeamChatComposerDraftPayload } from './team-chat-screen.shared';
import { normalizeComposerPlainText } from './team-chat-composer-editable.utils';
import { normalizeTeamChatComposerDraftPayload } from './team-chat-composer-draft-payload.utils';

export interface TeamChatComposerMentionMatch {
  from: number;
  to: number;
  query: string;
}

export interface TeamChatRichTextMentionToken {
  id: string;
  label: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRichTextMarkList(value: unknown): value is Array<{ type?: string }> {
  return Array.isArray(value);
}

function normalizeSpecialMentionLabel(value: unknown): '@channel' | '@everyone' | null {
  if (typeof value !== 'string') return null;
  const normalizedValue = value.trim().replace(/^@+/, '').toLowerCase();
  if (normalizedValue === 'channel') return '@channel';
  if (normalizedValue === 'everyone') return '@everyone';
  return null;
}

function sanitizeSpecialMentionNode(node: JSONContent): JSONContent | null {
  if (node.type !== 'mention') return null;

  const attrs = isRecord(node.attrs) ? node.attrs : null;
  const mentionId = typeof attrs?.id === 'string' ? attrs.id.trim() : '';
  const mentionLabel =
    normalizeSpecialMentionLabel(attrs?.label) ||
    normalizeSpecialMentionLabel(attrs?.displayName) ||
    normalizeSpecialMentionLabel(attrs?.name) ||
    normalizeSpecialMentionLabel(attrs?.id);

  if (!mentionLabel || UUID_PATTERN.test(mentionId)) {
    return null;
  }

  return {
    type: 'text',
    text: mentionLabel,
    ...(isRichTextMarkList(node.marks) && node.marks.length > 0
      ? { marks: node.marks }
      : {}),
  };
}

function sanitizeRichTextNode(node: JSONContent): JSONContent {
  const specialMentionReplacement = sanitizeSpecialMentionNode(node);
  if (specialMentionReplacement) return specialMentionReplacement;
  if (!Array.isArray(node.content) || node.content.length === 0) {
    return node;
  }

  const nextChildren = node.content.map((child) => sanitizeRichTextNode(child));
  return {
    ...node,
    content: nextChildren,
  };
}

export function sanitizeTeamChatRichTextDocument(value: JSONContent | null): JSONContent | null {
  if (!value) return null;
  return sanitizeRichTextNode(value);
}

function isMeaningfulRichNode(node: JSONContent): boolean {
  const normalizedType = typeof node.type === 'string' ? node.type.trim() : '';
  if (
    normalizedType === 'bulletList' ||
    normalizedType === 'orderedList' ||
    normalizedType === 'listItem' ||
    normalizedType === 'hardBreak' ||
    normalizedType === 'mention'
  ) {
    return true;
  }

  if (normalizedType === 'paragraph' && Array.isArray(node.content) && node.content.length > 1) {
    const hasMarks = node.content.some((child) => isMeaningfulRichNode(child));
    if (hasMarks) {
      return true;
    }
  }

  if (isRichTextMarkList(node.marks) && node.marks.length > 0) {
    return node.marks.some((mark) => {
      const normalizedMarkType = typeof mark?.type === 'string' ? mark.type.trim() : '';
      return (
        normalizedMarkType === 'bold' ||
        normalizedMarkType === 'italic' ||
        normalizedMarkType === 'underline' ||
        normalizedMarkType === 'strike' ||
        normalizedMarkType === 'code' ||
        normalizedMarkType === 'link'
      );
    });
  }

  if (Array.isArray(node.content)) {
    return node.content.some((child) => isMeaningfulRichNode(child));
  }

  return false;
}

export function normalizeTeamChatRichTextDocument(value: unknown): JSONContent | null {
  if (!isRecord(value)) return null;
  const normalizedType = typeof value.type === 'string' ? value.type.trim() : '';
  if (normalizedType !== 'doc') return null;
  return value as JSONContent;
}

export function buildTeamChatPlainTextDocument(text: string): JSONContent {
  const normalizedText = normalizeComposerPlainText(text);
  const paragraphs = normalizedText.split('\n');
  const content = paragraphs.map<JSONContent>((paragraph) => {
    const paragraphContent = paragraph.length > 0 ? [{ type: 'text', text: paragraph }] : [];
    return {
      type: 'paragraph',
      ...(paragraphContent.length > 0 ? { content: paragraphContent } : {}),
    };
  });

  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph' }],
  };
}

export function extractPlainTextFromRichTextDocument(value: JSONContent | null | undefined): string {
  if (!value) return '';

  if (value.type === 'text') {
    return typeof value.text === 'string' ? value.text : '';
  }

  if (value.type === 'hardBreak') {
    return '\n';
  }

  if (value.type === 'mention') {
    const attrs = isRecord(value.attrs) ? value.attrs : null;
    const rawLabel =
      (typeof attrs?.label === 'string' && attrs.label.trim()) ||
      (typeof attrs?.displayName === 'string' && attrs.displayName.trim()) ||
      (typeof attrs?.name === 'string' && attrs.name.trim()) ||
      (typeof attrs?.id === 'string' && attrs.id.trim()) ||
      '';
    if (!rawLabel) return '';
    return rawLabel.startsWith('@') ? rawLabel : `@${rawLabel}`;
  }

  const children = Array.isArray(value.content) ? value.content : [];
  if (children.length === 0) return '';

  const childTexts = children.map((child) => extractPlainTextFromRichTextDocument(child));
  if (value.type === 'paragraph') {
    return childTexts.join('');
  }

  if (value.type === 'bulletList' || value.type === 'orderedList' || value.type === 'doc') {
    return childTexts.filter(Boolean).join('\n');
  }

  if (value.type === 'listItem') {
    return childTexts.join('');
  }

  return childTexts.join('');
}

export function extractMentionTokensFromRichTextDocument(
  value: JSONContent | null | undefined,
): TeamChatRichTextMentionToken[] {
  if (!value) return [];

  if (value.type === 'mention') {
    const attrs = isRecord(value.attrs) ? value.attrs : null;
    const rawId = typeof attrs?.id === 'string' ? attrs.id.trim() : '';
    const rawLabel =
      (typeof attrs?.label === 'string' && attrs.label.trim()) ||
      (typeof attrs?.displayName === 'string' && attrs.displayName.trim()) ||
      (typeof attrs?.name === 'string' && attrs.name.trim()) ||
      rawId;

    if (!rawId || !rawLabel) return [];
    return [
      {
        id: rawId,
        label: rawLabel.startsWith('@') ? rawLabel : `@${rawLabel}`,
      },
    ];
  }

  const children = Array.isArray(value.content) ? value.content : [];
  if (children.length === 0) return [];

  return children.flatMap((child) => extractMentionTokensFromRichTextDocument(child));
}

export function hasMeaningfulTeamChatRichFormatting(value: JSONContent | null | undefined) {
  if (!value || !Array.isArray(value.content) || value.content.length === 0) return false;
  if (value.content.length > 1) {
    const hasMultiParagraphText = value.content.some((node) => {
      const normalizedType = typeof node.type === 'string' ? node.type.trim() : '';
      return normalizedType === 'paragraph' || normalizedType === 'bulletList' || normalizedType === 'orderedList';
    });
    if (hasMultiParagraphText) {
      return true;
    }
  }

  return value.content.some((node) => isMeaningfulRichNode(node));
}

export function createTeamChatComposerPayloadFromEditor(
  editor: Editor,
): TeamChatComposerDraftPayload {
  const richDocument = sanitizeTeamChatRichTextDocument(
    normalizeTeamChatRichTextDocument(editor.getJSON()),
  );
  const content = normalizeComposerPlainText(
    richDocument
      ? extractPlainTextFromRichTextDocument(richDocument)
      : editor.getText({ blockSeparator: '\n' }),
  ).trimEnd();
  const hasMeaningfulFormatting = hasMeaningfulTeamChatRichFormatting(richDocument);

  if (!hasMeaningfulFormatting) {
    return {
      content,
      contentFormat: 'plain_text',
      richContent: null,
    };
  }

  return {
    content,
    contentFormat: 'rich_text_v1',
    richContent: richDocument,
  };
}

export function resolveTeamChatComposerEditorContent(
  payload: TeamChatComposerDraftPayload,
): JSONContent {
  const normalizedPayload = normalizeTeamChatComposerDraftPayload(payload);
  if (normalizedPayload.contentFormat === 'rich_text_v1') {
    const richDocument = sanitizeTeamChatRichTextDocument(
      normalizeTeamChatRichTextDocument(normalizedPayload.richContent),
    );
    if (richDocument) {
      return richDocument;
    }
  }

  return buildTeamChatPlainTextDocument(normalizedPayload.content);
}

export function getTeamChatComposerMentionMatch(
  editor: Editor | null,
): TeamChatComposerMentionMatch | null {
  if (!editor) return null;

  const { selection } = editor.state;
  if (!selection.empty) return null;

  const parentText = selection.$from.parent.textContent;
  const parentOffset = selection.$from.parentOffset;
  const beforeCaret = parentText.slice(0, parentOffset);
  const atIndex = beforeCaret.lastIndexOf('@');
  if (atIndex < 0) return null;

  const previousChar = beforeCaret[atIndex - 1];
  if (previousChar && !/[\s([{]/.test(previousChar)) return null;

  const token = beforeCaret.slice(atIndex + 1);
  if (/\s/.test(token) || token.includes('@')) return null;

  return {
    from: selection.$from.start() + atIndex,
    to: selection.from,
    query: token,
  };
}
