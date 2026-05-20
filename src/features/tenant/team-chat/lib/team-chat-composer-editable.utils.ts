'use client';

export interface ComposerSelectionRange {
  start: number;
  end: number;
}

export function normalizeComposerPlainText(value: string) {
  return value.replace(/\r\n?/g, '\n').replace(/\u00A0/g, ' ');
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderComposerMentionsHtml(value: string, mentionNames: string[]): string {
  if (!value.length) return '';
  if (!value.includes('@')) return escapeHtml(value);
  if (!mentionNames.length) return escapeHtml(value);

  const pattern = new RegExp(
    `@(?:${mentionNames.map(escapeRegExp).join('|')})(?=$|\\s|[.,!?;:])`,
    'gi',
  );

  let html = '';
  let lastIndex = 0;

  for (const match of value.matchAll(pattern)) {
    if (!match.index && match.index !== 0) continue;

    if (match.index > lastIndex) {
      html += escapeHtml(value.slice(lastIndex, match.index));
    }

    html += `<span data-mention-token="true" class="box-decoration-clone rounded-md bg-sky-500/16 text-sky-300 ring-1 ring-inset ring-sky-500/20">${escapeHtml(match[0])}</span>`;
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < value.length) {
    html += escapeHtml(value.slice(lastIndex));
  }

  return html.length ? html : escapeHtml(value);
}

export function readEditableSelectionRange(
  element: HTMLElement,
): ComposerSelectionRange | null {
  if (typeof window === 'undefined') return null;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  if (!element.contains(range.startContainer) || !element.contains(range.endContainer)) return null;

  const startRange = range.cloneRange();
  startRange.selectNodeContents(element);
  startRange.setEnd(range.startContainer, range.startOffset);

  const endRange = range.cloneRange();
  endRange.selectNodeContents(element);
  endRange.setEnd(range.endContainer, range.endOffset);

  return {
    start: startRange.toString().length,
    end: endRange.toString().length,
  };
}

function resolveSelectionPoint(element: HTMLElement, targetOffset: number) {
  const normalizedOffset = Math.max(0, targetOffset);
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let traversedLength = 0;
  let currentNode = walker.nextNode();

  while (currentNode) {
    const textLength = currentNode.textContent?.length ?? 0;
    if (normalizedOffset <= traversedLength + textLength) {
      return {
        node: currentNode,
        offset: normalizedOffset - traversedLength,
      };
    }

    traversedLength += textLength;
    currentNode = walker.nextNode();
  }

  return {
    node: element,
    offset: element.childNodes.length,
  };
}

export function restoreEditableSelection(
  element: HTMLElement,
  selectionRange: ComposerSelectionRange,
) {
  if (typeof window === 'undefined') return;

  const selection = window.getSelection();
  if (!selection) return;

  const start = Math.max(0, Math.min(selectionRange.start, selectionRange.end));
  const end = Math.max(start, Math.max(selectionRange.start, selectionRange.end));
  const startPoint = resolveSelectionPoint(element, start);
  const endPoint = resolveSelectionPoint(element, end);
  const range = document.createRange();

  range.setStart(startPoint.node, startPoint.offset);
  range.setEnd(endPoint.node, endPoint.offset);

  selection.removeAllRanges();
  selection.addRange(range);
}

export function scrollComposerCaretIntoView(element: HTMLElement) {
  if (typeof window === 'undefined') return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0).cloneRange();
  if (!element.contains(range.startContainer) || !element.contains(range.endContainer)) return;

  range.collapse(false);

  const fallbackRect =
    selection.focusNode instanceof Element
      ? selection.focusNode.getBoundingClientRect()
      : selection.focusNode?.parentElement?.getBoundingClientRect();
  const caretRect = range.getClientRects()[0] ?? fallbackRect;

  if (!caretRect) return;

  const elementRect = element.getBoundingClientRect();
  const verticalPadding = 18;
  const horizontalPadding = 16;

  if (caretRect.bottom > elementRect.bottom - verticalPadding) {
    element.scrollTop += caretRect.bottom - elementRect.bottom + verticalPadding;
  } else if (caretRect.top < elementRect.top + verticalPadding) {
    element.scrollTop -= elementRect.top + verticalPadding - caretRect.top;
  }

  if (caretRect.right > elementRect.right - horizontalPadding) {
    element.scrollLeft += caretRect.right - elementRect.right + horizontalPadding;
  } else if (caretRect.left < elementRect.left + horizontalPadding) {
    element.scrollLeft -= elementRect.left + horizontalPadding - caretRect.left;
  }
}
