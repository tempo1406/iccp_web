'use client';

import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const SPECIAL_MENTION_TOKEN_PATTERN = /@(?:channel|everyone)(?=$|\s|[.,!?;:)\]}])/gi;

function isSpecialMentionBoundary(text: string, startIndex: number) {
  if (startIndex <= 0) return true;
  const previousCharacter = text[startIndex - 1] ?? '';
  return /[\s([{]/.test(previousCharacter);
}

export const TeamChatComposerSpecialMentionHighlight = Extension.create({
  name: 'teamChatComposerSpecialMentionHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];

            state.doc.descendants((node, position) => {
              if (!node.isText) return;

              const text = node.text ?? '';
              if (!text.includes('@')) return;

              SPECIAL_MENTION_TOKEN_PATTERN.lastIndex = 0;
              for (const match of text.matchAll(SPECIAL_MENTION_TOKEN_PATTERN)) {
                const startIndex = match.index ?? -1;
                if (startIndex < 0) continue;
                if (!isSpecialMentionBoundary(text, startIndex)) continue;

                const from = position + startIndex;
                const to = from + match[0].length;
                decorations.push(
                  Decoration.inline(from, to, {
                    class:
                      'team-chat-special-mention-token box-decoration-clone rounded-md bg-sky-500/16 px-1 py-0.5 font-medium text-sky-300 ring-1 ring-inset ring-sky-500/25',
                  }),
                );
              }
            });

            return decorations.length
              ? DecorationSet.create(state.doc, decorations)
              : DecorationSet.empty;
          },
        },
      }),
    ];
  },
});
