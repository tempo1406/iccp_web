'use client';

import { mergeAttributes, Node } from '@tiptap/core';

function normalizeMentionLabel(value: unknown) {
  if (typeof value !== 'string') return '';
  const normalized = value.trim();
  if (!normalized) return '';
  return normalized.startsWith('@') ? normalized : `@${normalized}`;
}

export const TeamChatComposerMentionToken = Node.create({
  name: 'mention',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: false,
  draggable: false,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      label: {
        default: null,
      },
      name: {
        default: null,
      },
      displayName: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-team-chat-mention-token]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const mentionLabel =
      normalizeMentionLabel(node.attrs.label) ||
      normalizeMentionLabel(node.attrs.displayName) ||
      normalizeMentionLabel(node.attrs.name) ||
      normalizeMentionLabel(node.attrs.id);

    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-team-chat-mention-token': 'true',
        class:
          'team-chat-mention-token box-decoration-clone rounded-md bg-sky-500/16 px-1 py-0.5 text-sky-300 ring-1 ring-inset ring-sky-500/25',
      }),
      mentionLabel,
    ];
  },

  renderText({ node }) {
    return (
      normalizeMentionLabel(node.attrs.label) ||
      normalizeMentionLabel(node.attrs.displayName) ||
      normalizeMentionLabel(node.attrs.name) ||
      normalizeMentionLabel(node.attrs.id)
    );
  },
});

