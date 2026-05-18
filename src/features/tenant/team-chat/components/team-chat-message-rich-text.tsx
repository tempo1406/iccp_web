import type { ReactNode } from 'react';
import { Fragment } from 'react';
import type { ConversationMessageContentFormat } from '../data/team-chat-ui-data';
import {
  extractPlainTextFromRichTextDocument,
  normalizeTeamChatRichTextDocument,
} from '../lib/team-chat-composer-rich-text.utils';
import { focusRingClass } from '../lib/team-chat-screen.shared';
import {
  parseTeamChatMessageLink,
  resolveTenantAwareTeamChatMessageLinkHref,
} from '../lib/team-chat-message-link.utils';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function splitTrailingUrlPunctuation(value: string) {
  const match = value.match(/^(.*?)([),.;!?]+)?$/);
  if (!match) {
    return { url: value, trailing: '' };
  }

  return {
    url: match[1] ?? value,
    trailing: match[2] ?? '',
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type RichTextMark = {
  type?: string;
  attrs?: Record<string, unknown>;
};

type RichTextNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: RichTextMark[];
  content?: RichTextNode[];
};

interface TeamChatMessageRichTextProps {
  mentionNames: string[];
  onOpenMessageLink?: (href: string) => void;
  text: string;
  contentFormat?: ConversationMessageContentFormat;
  richContent?: Record<string, unknown> | null;
}

function buildTokenPattern(mentionNames: string[], options?: { disableUrlLinks?: boolean }) {
  const normalizedMentionNames = Array.from(
    new Set(
      mentionNames
        .map((name) => name.trim())
        .filter((name) => name.length > 0),
    ),
  ).sort((left, right) => right.length - left.length);

  const mentionPattern = normalizedMentionNames.length
    ? `@(?:${normalizedMentionNames.map(escapeRegExp).join('|')})(?=$|\\s|[.,!?;:])`
    : '@[a-z0-9._-]+(?=$|\\s|[.,!?;:])';

  if (options?.disableUrlLinks) {
    return new RegExp(mentionPattern, 'gi');
  }

  return new RegExp(`https?:\\/\\/[^\\s<]+|${mentionPattern}`, 'gi');
}

function renderPlainTextTokens(params: {
  text: string;
  mentionNames: string[];
  onOpenMessageLink?: (href: string) => void;
  keyPrefix: string;
  disableUrlLinks?: boolean;
}): ReactNode[] {
  const { disableUrlLinks, keyPrefix, mentionNames, onOpenMessageLink, text } = params;
  if (!text.length) return [];

  const tokenPattern = buildTokenPattern(mentionNames, { disableUrlLinks });
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let tokenIndex = 0;

  for (const match of text.matchAll(tokenPattern)) {
    if (match.index === undefined) continue;

    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const rawToken = match[0];
    if (!disableUrlLinks && /^https?:\/\//i.test(rawToken)) {
      const { url, trailing } = splitTrailingUrlPunctuation(rawToken);
      const internalLink = parseTeamChatMessageLink(url);
      const href = internalLink
        ? resolveTenantAwareTeamChatMessageLinkHref({
            deepLinkUrl: internalLink.deepLinkUrl,
            roomId: internalLink.roomId,
            messageId: internalLink.messageId,
          })
        : url;
      nodes.push(
        <a
          key={`${keyPrefix}-link-${tokenIndex}`}
          href={href}
          target={internalLink ? undefined : '_blank'}
          rel={internalLink ? undefined : 'noreferrer'}
          onClick={(event) => {
            if (!internalLink || !onOpenMessageLink) return;
            event.preventDefault();
            onOpenMessageLink(href);
          }}
          className={`cursor-pointer break-all text-sky-400 transition-colors hover:underline hover:underline-offset-2 focus-visible:text-sky-300 ${focusRingClass}`}
        >
          {url}
        </a>,
      );
      if (trailing) {
        nodes.push(trailing);
      }
    } else {
      nodes.push(
        <span
          key={`${keyPrefix}-mention-${tokenIndex}`}
          className="rounded-md bg-sky-500/15 px-1 py-0.5 text-sky-300"
        >
          {rawToken}
        </span>,
      );
    }

    tokenIndex += 1;
    lastIndex = match.index + rawToken.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function normalizeRichTextDocument(value: unknown): RichTextNode | null {
  if (!isRecord(value)) return null;
  const normalizedType = typeof value.type === 'string' ? value.type.trim() : '';
  if (normalizedType !== 'doc') return null;

  return value as RichTextNode;
}

function normalizeComparableText(value: string) {
  return value.replace(/\r\n/g, '\n').trim();
}

function resolveRichTextLinkHref(value: unknown) {
  const href = typeof value === 'string' ? value.trim() : '';
  if (!href) return null;

  const internalLink = parseTeamChatMessageLink(href);
  return {
    href: internalLink
      ? resolveTenantAwareTeamChatMessageLinkHref({
          deepLinkUrl: internalLink.deepLinkUrl,
          roomId: internalLink.roomId,
          messageId: internalLink.messageId,
        })
      : href,
    internalLink,
  };
}

function applyRichTextMarks(params: {
  content: ReactNode;
  marks?: RichTextMark[];
  keyPrefix: string;
  onOpenMessageLink?: (href: string) => void;
}): ReactNode {
  const { content, keyPrefix, marks, onOpenMessageLink } = params;

  return (marks ?? []).reduce<ReactNode>((currentNode, mark, index) => {
    const normalizedType = typeof mark?.type === 'string' ? mark.type.trim() : '';
    const key = `${keyPrefix}-mark-${index}-${normalizedType}`;

    if (normalizedType === 'bold') {
      return <strong key={key}>{currentNode}</strong>;
    }

    if (normalizedType === 'italic') {
      return <em key={key}>{currentNode}</em>;
    }

    if (normalizedType === 'underline') {
      return <u key={key}>{currentNode}</u>;
    }

    if (normalizedType === 'strike') {
      return <s key={key}>{currentNode}</s>;
    }

    if (normalizedType === 'code') {
      return (
        <code
          key={key}
          className="rounded-md border border-amber-400/20 bg-[#221b12] px-1.5 py-0.5 font-mono text-[0.92em] text-amber-200"
        >
          {currentNode}
        </code>
      );
    }

    if (normalizedType === 'link') {
      const markHref = isRecord(mark?.attrs) ? mark.attrs['href'] : undefined;
      const resolvedLink = resolveRichTextLinkHref(markHref);
      if (!resolvedLink) return currentNode;

      return (
        <a
          key={key}
          href={resolvedLink.href}
          target={resolvedLink.internalLink ? undefined : '_blank'}
          rel={resolvedLink.internalLink ? undefined : 'noreferrer'}
          onClick={(event) => {
            if (!resolvedLink.internalLink || !onOpenMessageLink) return;
            event.preventDefault();
            onOpenMessageLink(resolvedLink.href);
          }}
          className={`cursor-pointer break-all text-sky-400 underline underline-offset-2 transition-colors hover:text-sky-300 ${focusRingClass}`}
        >
          {currentNode}
        </a>
      );
    }

    return currentNode;
  }, content);
}

function renderRichTextNodes(params: {
  nodes?: RichTextNode[];
  mentionNames: string[];
  onOpenMessageLink?: (href: string) => void;
  keyPrefix: string;
}): ReactNode[] {
  const { keyPrefix, mentionNames, nodes, onOpenMessageLink } = params;
  if (!Array.isArray(nodes) || nodes.length === 0) return [];

  return nodes.flatMap((node, index) => {
    const renderedNode = renderRichTextNode({
      node,
      mentionNames,
      onOpenMessageLink,
      keyPrefix: `${keyPrefix}-${index}`,
    });

    return renderedNode === null ? [] : [renderedNode];
  });
}

function renderRichTextNode(params: {
  node: RichTextNode;
  mentionNames: string[];
  onOpenMessageLink?: (href: string) => void;
  keyPrefix: string;
}): ReactNode | null {
  const { keyPrefix, mentionNames, node, onOpenMessageLink } = params;
  const normalizedType = typeof node.type === 'string' ? node.type.trim() : '';

  if (normalizedType === 'text') {
    const textValue = typeof node.text === 'string' ? node.text : '';
    if (!textValue.length) return null;

    const hasCodeOrLinkMark = (node.marks ?? []).some((mark) => {
      const normalizedMarkType = typeof mark?.type === 'string' ? mark.type.trim() : '';
      return normalizedMarkType === 'code' || normalizedMarkType === 'link';
    });
    const content = hasCodeOrLinkMark
      ? textValue
      : renderPlainTextTokens({
          text: textValue,
          mentionNames,
          onOpenMessageLink,
          keyPrefix,
        });

    return applyRichTextMarks({
      content: <Fragment key={`${keyPrefix}-text-content`}>{content}</Fragment>,
      marks: node.marks,
      keyPrefix,
      onOpenMessageLink,
    });
  }

  if (normalizedType === 'hardBreak') {
    return <br key={`${keyPrefix}-break`} />;
  }

  if (normalizedType === 'mention') {
    const rawLabel = typeof node.attrs?.['label'] === 'string'
      ? node.attrs['label'].trim()
      : typeof node.attrs?.['displayName'] === 'string'
        ? node.attrs['displayName'].trim()
        : typeof node.attrs?.['name'] === 'string'
          ? node.attrs['name'].trim()
          : typeof node.attrs?.['id'] === 'string'
            ? node.attrs['id'].trim()
            : '';
    if (!rawLabel) return null;

    const mentionLabel = rawLabel.startsWith('@') ? rawLabel : `@${rawLabel}`;
    const mentionNode = (
      <span
        key={`${keyPrefix}-mention`}
        className="rounded-md bg-sky-500/15 px-1 py-0.5 text-sky-300"
      >
        {mentionLabel}
      </span>
    );

    return applyRichTextMarks({
      content: mentionNode,
      marks: node.marks,
      keyPrefix,
      onOpenMessageLink,
    });
  }

  if (normalizedType === 'paragraph') {
    const children = renderRichTextNodes({
      nodes: node.content,
      mentionNames,
      onOpenMessageLink,
      keyPrefix: `${keyPrefix}-paragraph`,
    });

    return (
      <p key={`${keyPrefix}-paragraph`} className="min-h-[1.5rem] break-words whitespace-pre-wrap">
        {children.length > 0 ? children : <br />}
      </p>
    );
  }

  if (normalizedType === 'bulletList') {
    const children = renderRichTextNodes({
      nodes: node.content,
      mentionNames,
      onOpenMessageLink,
      keyPrefix: `${keyPrefix}-bullet-list`,
    });

    if (children.length === 0) return null;
    return (
      <ul key={`${keyPrefix}-bullet-list`} className="list-disc space-y-1 pl-5">
        {children}
      </ul>
    );
  }

  if (normalizedType === 'orderedList') {
    const children = renderRichTextNodes({
      nodes: node.content,
      mentionNames,
      onOpenMessageLink,
      keyPrefix: `${keyPrefix}-ordered-list`,
    });

    if (children.length === 0) return null;
    return (
      <ol key={`${keyPrefix}-ordered-list`} className="list-decimal space-y-1 pl-5">
        {children}
      </ol>
    );
  }

  if (normalizedType === 'listItem') {
    const children = renderRichTextNodes({
      nodes: node.content,
      mentionNames,
      onOpenMessageLink,
      keyPrefix: `${keyPrefix}-list-item`,
    });

    if (children.length === 0) return null;
    return (
      <li key={`${keyPrefix}-list-item`} className="break-words">
        {children}
      </li>
    );
  }

  if (normalizedType === 'doc') {
    const children = renderRichTextNodes({
      nodes: node.content,
      mentionNames,
      onOpenMessageLink,
      keyPrefix: `${keyPrefix}-doc`,
    });

    if (children.length === 0) return null;
    return (
      <div key={`${keyPrefix}-doc`} className="space-y-1">
        {children}
      </div>
    );
  }

  const fallbackChildren = renderRichTextNodes({
    nodes: node.content,
    mentionNames,
    onOpenMessageLink,
    keyPrefix: `${keyPrefix}-fallback`,
  });

  if (fallbackChildren.length === 0) return null;
  return <Fragment key={`${keyPrefix}-fallback`}>{fallbackChildren}</Fragment>;
}

export function TeamChatMessageRichText({
  mentionNames,
  onOpenMessageLink,
  text,
  contentFormat,
  richContent,
}: TeamChatMessageRichTextProps) {
  if (!text.length && !richContent) return null;

  const normalizedRichDocument =
    contentFormat === 'rich_text_v1' ? normalizeTeamChatRichTextDocument(richContent) : null;
  const shouldPreferPlainText =
    Boolean(normalizedRichDocument) &&
    normalizeComparableText(extractPlainTextFromRichTextDocument(normalizedRichDocument)) !==
      normalizeComparableText(text);
  const richDocument =
    contentFormat === 'rich_text_v1' && !shouldPreferPlainText
      ? normalizeRichTextDocument(richContent)
      : null;
  if (richDocument) {
    const richNodes = renderRichTextNodes({
      nodes: richDocument.content,
      mentionNames,
      onOpenMessageLink,
      keyPrefix: 'rich-text',
    });

    if (richNodes.length > 0) {
      return <div className="space-y-1">{richNodes}</div>;
    }
  }

  const plainNodes = renderPlainTextTokens({
    text,
    mentionNames,
    onOpenMessageLink,
    keyPrefix: 'plain-text',
  });

  return <>{plainNodes}</>;
}
