'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  Save,
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Smartphone,
  Play,
  Code2,
  Maximize,
  Layers,
  Paintbrush,
  Plus,
  Image as ImageIcon,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  X,
  Loader2,
  Check,
  SquareDashedBottom,
  Upload,
  FileText,
  Eye,
  EyeOff,
  GripVertical,
  Type,
  Link2,
  Square,
  Film,
  Layout,
  Navigation,
  Key,
  Send,
  LocateFixed,
  Mic,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Component, Editor } from 'grapesjs';
import type { Extension } from '@codemirror/state';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { toast } from '@/lib/toast';
import { isOk, isErr } from '@/lib/safe-query';
import { useTenant } from '@/providers';
import { useServiceContext } from '@/lib/use-service-context';
import { chatbotKeys } from '@/features/common/chatbot/query/use-chatbot';
import { LandingPageService } from '../services/landing-page.service';
import {
  LandingPageAiService,
  type LandingPageConversationMessage,
  type OrgContext,
} from '../services/landing-page-ai.service';
import { useQueryClient } from '@tanstack/react-query';
import {
  useUpsertLandingPageMutation,
  useLandingPageDraftQuery,
  useUpsertLandingPageDraftMutation,
  useLandingPageQuery,
  useTemplatesQuery,
  useCreateTemplateMutation,
  useMediaAssetsQuery,
} from '../query/use-landing-page';
import { autoMarkLeadForms } from '../utils/public-html';
import { CanvasMediaLibrary } from './canvas-media-library';
import { BlocksPanel } from './blocks-panel';
import { GlobalStylesPanel } from './global-styles-panel';
import { StyleManagerPanel, syncStyleManagerTarget } from './style-manager-panel';
import type { MediaAsset } from '../utils/media-library.storage';
import {
  LANDING_PAGE_TEMPLATE_ID_META_KEY,
} from '../types/landing-page.types';
import type {
  LandingPageAiConversationRole,
  LandingPageAiConversationStatus,
  LandingPageAiGenerationMode,
  LandingPageEditorSource,
  LandingPagePendingDraftDto,
  UpsertLandingPageDraftBody,
} from '../types/landing-page.types';

// CodeMirror loaded client-side only (uses window/document internally)
const CodeMirrorEditor = dynamic(() => import('@uiw/react-codemirror'), { ssr: false });

function getPublicLandingPagePath(orgSlug: string): string {
  return `/org/${orgSlug}/landing-page`;
}

const MAX_TEMPLATE_NAME_LENGTH = 30;

function normalizeTemplateNameInput(raw: string): string {
  const collapsed = raw.replace(/\s+/g, ' ').trim();
  return collapsed.slice(0, MAX_TEMPLATE_NAME_LENGTH);
}

function buildTemplateNameCandidate(baseName: string, index: number): string {
  const suffix = index <= 1 ? '' : ` (${index})`;
  const allowedBaseLength = Math.max(1, MAX_TEMPLATE_NAME_LENGTH - suffix.length);
  return `${baseName.slice(0, allowedBaseLength).trimEnd()}${suffix}`;
}

function resolveUniqueTemplateName(
  requestedName: string,
  existingNames: string[],
  options?: { excludeName?: string | null; fallbackName?: string },
): string {
  const baseName = normalizeTemplateNameInput(requestedName) || options?.fallbackName || 'Untitled Page';
  const normalizedExisting = new Set(
    existingNames
      .map((name) => normalizeTemplateNameInput(name).toLowerCase())
      .filter(Boolean),
  );

  const excludedName = options?.excludeName
    ? normalizeTemplateNameInput(options.excludeName).toLowerCase()
    : null;
  if (excludedName) {
    normalizedExisting.delete(excludedName);
  }

  let index = 1;
  while (true) {
    const candidate = buildTemplateNameCandidate(baseName, index);
    if (!normalizedExisting.has(candidate.toLowerCase())) {
      return candidate;
    }
    index += 1;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripMarkdownFences(raw: string): string {
  const trimmed = raw
    .replace(/\r\n/g, '\n')
    .replace(/^\uFEFF/, '')
    .replace(/^\s*>+\s?/gm, '')
    .trim();
  const fenced = trimmed.match(/^```(?:html)?\s*\n?([\s\S]*?)\n?```\s*$/i);
  if (fenced) return fenced[1].trim();
  const fencedAnywhere = trimmed.match(/```(?:html)?\s*\n?([\s\S]*?)\n?```/i);
  if (fencedAnywhere) return fencedAnywhere[1].trim();
  return trimmed;
}

function stripAiHtmlArtifacts(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/^\uFEFF/, '')
    .replace(/```(?:html)?/gi, '')
    .replace(/```/g, '')
    .trim();
}

function stripLeadingArtifactText(fragment: string): string {
  const normalized = stripAiHtmlArtifacts(fragment).trimStart();
  const firstTagIndex = normalized.search(/<[a-z!][^>]*>/i);
  if (firstTagIndex <= 0) return normalized.trim();

  const prefix = normalized.slice(0, firstTagIndex).trim();
  if (!prefix) return normalized.slice(firstTagIndex).trim();

  if (prefix.length <= 240 || /^(html|title|doctype)/i.test(prefix)) {
    return normalized.slice(firstTagIndex).trim();
  }

  return normalized.trim();
}

function extractFirstHtmlDocument(raw: string): string {
  const fencedCandidate = raw.match(/```(?:html)?\s*\n?([\s\S]*?)\n?```/i)?.[1];
  const candidates = [fencedCandidate, raw].filter((value): value is string =>
    Boolean(value),
  );

  for (const candidate of candidates) {
    const cleaned = stripAiHtmlArtifacts(stripMarkdownFences(candidate));
    if (!cleaned) continue;

    const lower = cleaned.toLowerCase();
    const structuralTagPatterns = [
      '<!doctype',
      '<html',
      '<body',
      '<main',
      '<header',
      '<nav',
      '<section',
      '<article',
      '<aside',
      '<div',
      '<style',
      '<script',
    ];
    const startCandidates = structuralTagPatterns
      .map((pattern) => lower.indexOf(pattern))
      .filter((index) => index >= 0);
    const genericTagIndex = cleaned.search(/<[a-z][^>]*>/i);
    if (genericTagIndex >= 0) startCandidates.push(genericTagIndex);
    const startIndex = startCandidates.length > 0 ? Math.min(...startCandidates) : -1;
    const sliced = startIndex >= 0 ? cleaned.slice(startIndex).trim() : cleaned;
    const lowerSliced = sliced.toLowerCase();
    const endIndex = lowerSliced.indexOf('</html>');
    const bodyEndIndex = lowerSliced.lastIndexOf('</body>');

    if (endIndex >= 0) {
      return stripLeadingArtifactText(sliced.slice(0, endIndex + '</html>'.length));
    }

    if (bodyEndIndex >= 0) {
      return stripLeadingArtifactText(sliced.slice(0, bodyEndIndex + '</body>'.length));
    }

    if (startIndex >= 0) {
      return stripLeadingArtifactText(sliced);
    }
  }

  return stripLeadingArtifactText(stripMarkdownFences(raw));
}

function normalizeCssDeclarationBlock(styleText: string): string {
  const normalized = styleText.trim().replace(/\s*;\s*$/, '');
  return normalized ? `${normalized};` : '';
}

function stripNonRenderableTags(
  fragment: string,
  options: { preserveScripts?: boolean } = {},
): string {
  const nonRenderableTagPattern = options.preserveScripts
    ? /<(?:style|noscript)\b[\s\S]*?<\/(?:style|noscript)>/gi
    : /<(?:style|script|noscript)\b[\s\S]*?<\/(?:style|script|noscript)>/gi;

  return fragment
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(?:meta|title|link|base)\b[^>]*>/gi, '')
    .replace(nonRenderableTagPattern, '')
    .trim();
}

function hasRenderableMarkup(fragment: string): boolean {
  return Boolean(stripNonRenderableTags(fragment).trim());
}

function appendNoScriptVisibilityOverrides(css: string): string {
  const override = `
.fade-in,
.fade-up,
.fade-down,
.fade-left,
.fade-right,
.reveal,
.reveal-up,
.reveal-down,
.reveal-left,
.reveal-right,
.scroll-reveal,
.animate-on-scroll,
.aos-init,
[data-aos],
[data-animate],
[data-reveal] {
  opacity: 1 !important;
  visibility: visible !important;
  transform: none !important;
  filter: none !important;
  clip-path: none !important;
  animation: none !important;
}
  `.trim();

  if (!css.trim()) return override;
  return `${css.trim()}\n\n${override}`;
}

function hoistInlineStyles(doc: Document, baseCss: string): string {
  const extraRules: string[] = [];

  const htmlStyle = doc.documentElement.getAttribute('style');
  if (htmlStyle?.trim()) {
    extraRules.push(`html { ${normalizeCssDeclarationBlock(htmlStyle)} }`);
    doc.documentElement.removeAttribute('style');
  }

  const bodyStyle = doc.body?.getAttribute('style');
  if (bodyStyle?.trim()) {
    extraRules.push(`body { ${normalizeCssDeclarationBlock(bodyStyle)} }`);
    doc.body.removeAttribute('style');
  }

  const inlineClassByStyle = new Map<string, string>();
  let inlineClassIndex = 0;

  doc.body?.querySelectorAll<HTMLElement>('[style]').forEach((element) => {
    const inlineStyle = element.getAttribute('style')?.trim();
    if (!inlineStyle) return;

    let className = inlineClassByStyle.get(inlineStyle);
    if (!className) {
      inlineClassIndex += 1;
      className = `ai-inline-${inlineClassIndex}`;
      inlineClassByStyle.set(inlineStyle, className);
      extraRules.push(`.${className} { ${normalizeCssDeclarationBlock(inlineStyle)} }`);
    }

    const existingClasses = (element.getAttribute('class') ?? '')
      .split(/\s+/)
      .filter(Boolean);
    if (!existingClasses.includes(className)) {
      existingClasses.push(className);
    }

    element.setAttribute('class', existingClasses.join(' '));
    element.removeAttribute('style');
  });

  return appendNoScriptVisibilityOverrides(
    [baseCss.trim(), extraRules.join('\n')].filter(Boolean).join('\n\n').trim(),
  );
}

function splitHtmlAndCss(fullHtml: string): { html: string; css: string } {
  if (!fullHtml.trim()) return { html: '', css: '' };
  const cleaned = extractFirstHtmlDocument(fullHtml);
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleaned, 'text/html');
  doc.querySelectorAll('script').forEach((tag) => tag.remove());
  const styleTags = doc.querySelectorAll('style');
  let css = '';
  styleTags.forEach((tag) => {
    const text = tag.textContent?.trim();
    if (text) css += `${text}\n`;
    tag.remove();
  });
  css = hoistInlineStyles(doc, css);
  const parsedBodyHtml = stripNonRenderableTags(doc.body?.innerHTML?.trim() ?? '');
  const regexBodyHtml = stripNonRenderableTags(
    cleaned.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1]?.trim() ?? '',
  );
  const fragmentHtml = stripNonRenderableTags(
    cleaned
      .replace(/<!DOCTYPE[\s\S]*?>/i, '')
      .replace(/<html\b[^>]*>/i, '')
      .replace(/<\/html>/i, '')
      .replace(/<head\b[\s\S]*?<\/head>/i, '')
      .replace(/<body\b[^>]*>/i, '')
      .replace(/<\/body>/i, '')
      .replace(/<style\b[\s\S]*?<\/style>/gi, '')
      .trim(),
  );
  const html = parsedBodyHtml || regexBodyHtml || fragmentHtml;
  return { html: html.trim(), css: css.trim() };
}

function extractDocumentShellAttributes(fullHtml: string): {
  htmlAttributes: Record<string, string>;
  bodyAttributes: Record<string, string>;
} {
  if (!fullHtml.trim()) {
    return { htmlAttributes: {}, bodyAttributes: {} };
  }

  const cleaned = extractFirstHtmlDocument(fullHtml);
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleaned, 'text/html');

  const collectAttributes = (element: Element | null): Record<string, string> => {
    if (!element) return {};

    return Array.from(element.attributes).reduce<Record<string, string>>((acc, attr) => {
      if (attr.name.toLowerCase() === 'style') return acc;
      acc[attr.name] = attr.value;
      return acc;
    }, {});
  };

  return {
    htmlAttributes: collectAttributes(doc.documentElement),
    bodyAttributes: collectAttributes(doc.body),
  };
}

function resolveRenderableDraftHtml(fullHtml: string): string | null {
  if (!fullHtml.trim()) return null;

  const cleaned = extractFirstHtmlDocument(fullHtml);
  const { html, css } = splitHtmlAndCss(cleaned);
  if (!hasRenderableMarkup(html)) return null;

  return combineHtmlCss(html, css);
}

function resolveRenderableSelectionDraftHtml(fragment: string): string | null {
  if (!fragment.trim()) return null;

  const cleaned = stripLeadingArtifactText(stripMarkdownFences(fragment));
  const { html, css } = splitHtmlAndCss(cleaned);
  if (!hasRenderableMarkup(html)) return null;

  return combineHtmlCss(html, css);
}

function getRenderableDraftMetrics(
  fullHtml: string,
): { htmlLength: number; textLength: number } | null {
  const renderable = resolveRenderableDraftHtml(fullHtml);
  if (!renderable) return null;

  const { html } = splitHtmlAndCss(renderable);
  const renderableHtml = stripNonRenderableTags(html);
  const textLength = renderableHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;

  return {
    htmlLength: renderableHtml.length,
    textLength,
  };
}

function getCanvasDocument(editor: Editor): Document | undefined {
  try {
    return (editor as any).Canvas?.getBody?.()?.ownerDocument;
  } catch {
    return undefined;
  }
}

function bindCanvasAnchorNavigation(editor: Editor): void {
  const canvasDoc = getCanvasDocument(editor);
  const canvasWin = canvasDoc?.defaultView;
  if (!canvasDoc || !canvasWin) return;

  const state = canvasDoc as Document & {
    __iccpAnchorHandler?: (event: MouseEvent) => void;
  };

  if (state.__iccpAnchorHandler) {
    canvasDoc.removeEventListener('click', state.__iccpAnchorHandler, true);
  }

  state.__iccpAnchorHandler = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const target = event.target;
    if (!(target instanceof canvasWin.Element)) return;

    const anchor = target.closest('a[href]');
    if (!(anchor instanceof canvasWin.HTMLAnchorElement)) return;

    const href = anchor.getAttribute('href')?.trim() ?? '';
    if (!href.startsWith('#')) return;

    event.preventDefault();

    if (href === '#') {
      canvasWin.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const targetId = decodeURIComponent(href.slice(1));
    if (!targetId) return;

    const targetElement = canvasDoc.getElementById(targetId);
    if (!targetElement) return;

    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  canvasDoc.addEventListener('click', state.__iccpAnchorHandler, true);
}

function syncCanvasInteractiveRuntime(editor: Editor): void {
  bindCanvasAnchorNavigation(editor);
  injectCanvasSelectionHighlightCss(editor);
}

function injectCanvasSelectionHighlightCss(editor: Editor): void {
  const canvasDoc = getCanvasDocument(editor);
  if (!canvasDoc) return;

  const existing = canvasDoc.getElementById('iccp-canvas-selection-highlights');
  if (existing) return;

  const style = canvasDoc.createElement('style');
  style.id = 'iccp-canvas-selection-highlights';
  style.textContent = `
[data-iccp-editor-selected] {
  outline: 2px solid #7c5cfc !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 4px rgba(124, 92, 252, 0.14) !important;
}

[data-iccp-editor-selected="secondary"] {
  outline-style: dashed !important;
}
  `.trim();

  canvasDoc.head?.appendChild(style);
}

function syncCanvasSelectedComponentState(editor: Editor): void {
  const canvasDoc = getCanvasDocument(editor);
  if (!canvasDoc) return;

  canvasDoc.querySelectorAll('[data-iccp-editor-selected]').forEach((element) => {
    element.removeAttribute('data-iccp-editor-selected');
  });

  const selected = normalizeSelectedComponents(
    (editor.getSelectedAll() as Component[]) ?? [],
  );
  selected.forEach((component, index) => {
    component
      .getEl()
      ?.setAttribute('data-iccp-editor-selected', index === 0 ? 'primary' : 'secondary');
  });
}

function getCanvasInjectedCss(editor: Editor): string {
  return (
    getCanvasDocument(editor)
      ?.getElementById('gjs-ai-injected-css')
      ?.textContent?.trim() ?? ''
  );
}

function syncCanvasDocumentShell(editor: Editor, fullHtml: string): void {
  const canvasDoc = getCanvasDocument(editor);
  if (!canvasDoc) return;

  const { htmlAttributes, bodyAttributes } = extractDocumentShellAttributes(fullHtml);
  const applyAttributes = (element: HTMLElement, attributes: Record<string, string>) => {
    Object.entries(attributes).forEach(([name, value]) => {
      if (name === 'class') {
        const mergedClassNames = new Set([
          ...(element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean),
          ...value.split(/\s+/).filter(Boolean),
        ]);
        if (mergedClassNames.size > 0) {
          element.setAttribute('class', Array.from(mergedClassNames).join(' '));
        }
        return;
      }

      element.setAttribute(name, value);
    });
  };

  applyAttributes(canvasDoc.documentElement, htmlAttributes);
  applyAttributes(canvasDoc.body, bodyAttributes);
}

function injectCanvasEditorOverrides(editor: Editor): void {
  const canvasDoc = getCanvasDocument(editor);
  if (!canvasDoc) return;

  const existing = canvasDoc.getElementById('gjs-editor-canvas-overrides');
  if (existing) return;

  const style = canvasDoc.createElement('style');
  style.id = 'gjs-editor-canvas-overrides';
  style.textContent = `
html, body {
  min-height: 100%;
}

body > [data-gjs-type="wrapper"] {
  background: transparent !important;
  background-color: transparent !important;
  min-height: 100%;
  color: inherit;
}
  `.trim();
  canvasDoc.head?.appendChild(style);
}

function getCanvasWrapperElement(editor: Editor): HTMLElement | null {
  const canvasDoc = getCanvasDocument(editor);
  if (!canvasDoc) return null;

  const wrapperFromModel = (
    editor.getWrapper() as unknown as { getEl?: () => HTMLElement | null }
  )?.getEl?.();
  if (wrapperFromModel) return wrapperFromModel;

  return canvasDoc.body?.firstElementChild instanceof HTMLElement
    ? canvasDoc.body.firstElementChild
    : null;
}

function syncCanvasWrapperTheme(editor: Editor): void {
  const canvasDoc = getCanvasDocument(editor);
  const wrapperEl = getCanvasWrapperElement(editor);
  const canvasWin = canvasDoc?.defaultView;
  if (!canvasDoc || !wrapperEl || !canvasWin) return;

  const computedBody = canvasWin.getComputedStyle(canvasDoc.body);
  const computedHtml = canvasWin.getComputedStyle(canvasDoc.documentElement);
  const backgroundImage =
    computedBody.backgroundImage !== 'none'
      ? computedBody.backgroundImage
      : computedHtml.backgroundImage;
  const backgroundColor =
    computedBody.backgroundColor !== 'rgba(0, 0, 0, 0)'
      ? computedBody.backgroundColor
      : computedHtml.backgroundColor;

  wrapperEl.style.minHeight = '100%';
  wrapperEl.style.color = computedBody.color;
  wrapperEl.style.backgroundColor = backgroundColor;
  wrapperEl.style.backgroundImage = backgroundImage !== 'none' ? backgroundImage : '';
  wrapperEl.style.backgroundRepeat =
    backgroundImage !== 'none' ? computedBody.backgroundRepeat : '';
  wrapperEl.style.backgroundPosition =
    backgroundImage !== 'none' ? computedBody.backgroundPosition : '';
  wrapperEl.style.backgroundSize =
    backgroundImage !== 'none' ? computedBody.backgroundSize : '';
  wrapperEl.style.backgroundAttachment =
    backgroundImage !== 'none' ? computedBody.backgroundAttachment : '';
}

function getPersistedCanvasCss(editor: Editor): string {
  return (
    (editor as Editor & { __iccpInjectedCss?: string }).__iccpInjectedCss ?? ''
  ).trim();
}

function getEditorDocumentCss(editor: Editor): string {
  const injectedCss = getCanvasInjectedCss(editor) || getPersistedCanvasCss(editor);
  const composerCss = (editor.getCss() ?? '').trim();

  // The iframe copy is the canonical raw stylesheet we want to persist/export.
  // CssComposer only exists to let GrapesJS Style Manager read/edit the rules.
  // Concatenating both causes the stylesheet to duplicate on every restore/save cycle.
  return injectedCss || composerCss;
}

function injectCanvasCss(editor: Editor, css: string): void {
  const normalizedCss = css.trim();
  (editor as Editor & { __iccpInjectedCss?: string }).__iccpInjectedCss = normalizedCss;
  setTimeout(() => {
    try {
      const canvasDoc = getCanvasDocument(editor);
      if (canvasDoc) {
        injectCanvasEditorOverrides(editor);
        const existing = canvasDoc.getElementById('gjs-ai-injected-css');
        if (existing) existing.remove();
        if (normalizedCss) {
          const style = canvasDoc.createElement('style');
          style.id = 'gjs-ai-injected-css';
          style.textContent = normalizedCss;
          canvasDoc.head?.appendChild(style);
        }
        syncCanvasWrapperTheme(editor);
      }
    } catch {
      // fall through to Grapes CSS composer sync below
    }

    // Keep the raw CSS in the iframe for accurate rendering, but also sync a
    // Grapes-parsable copy into CssComposer so Style Manager can read/edit it.
    const resolvedComposerCss = resolveCssVars(normalizedCss);
    const editorState = editor as Editor & { __iccpComposerCss?: string };
    if ((editorState.__iccpComposerCss ?? '') !== resolvedComposerCss) {
      editor.setStyle(resolvedComposerCss);
      editorState.__iccpComposerCss = resolvedComposerCss;
    }
    requestAnimationFrame(() => {
      syncStyleManagerTarget(editor);
    });
  }, 50);
}

function scheduleCanvasCssRefresh(editor: Editor, css: string): void {
  injectCanvasCss(editor, css);
  requestAnimationFrame(() => {
    injectCanvasCss(editor, css);
    requestAnimationFrame(() => {
      injectCanvasCss(editor, css);
      requestAnimationFrame(() => {
        syncCanvasWrapperTheme(editor);
      });
    });
  });
  window.setTimeout(() => {
    injectCanvasCss(editor, css);
    syncCanvasWrapperTheme(editor);
  }, 180);
}

/**
 * Apply AI-generated HTML to the GrapesJS canvas.
 * Uses direct iframe <head> injection for CSS so that @import, :root,
 * CSS variables, @media queries, etc. are preserved (editor.setStyle() drops them).
 */
function applyAiHtmlToCanvas(editor: Editor, fullHtml: string): void {
  const { html, css } = splitHtmlAndCss(fullHtml);
  syncCanvasInteractiveRuntime(editor);
  const safeHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  editor.setComponents(safeHtml);
  syncCanvasDocumentShell(editor, fullHtml);
  scheduleCanvasCssRefresh(editor, css);
  requestAnimationFrame(() => {
    syncCanvasInteractiveRuntime(editor);
  });
}

/**
 * GrapesJS's CSS parser cannot handle `var(--x)` inside values like
 * `linear-gradient(135deg, var(--primary), var(--primary-dark))` — it silently
 * drops those properties. Pre-resolving the variables before passing CSS to
 * `editor.setStyle()` ensures nothing is lost.
 *
 * This is display-only: the original HTML (with variables intact) is always
 * saved separately, so exports still carry the variables.
 */
function resolveCssVars(css: string): string {
  // 1. Collect all :root variable declarations
  const vars: Record<string, string> = {};
  css.replace(/:root\s*\{([^}]+)\}/g, (_, block: string) => {
    block.replace(
      /--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g,
      (_m: string, name: string, val: string) => {
        vars[name.trim()] = val.trim();
        return _m;
      },
    );
    return _;
  });
  if (Object.keys(vars).length === 0) return css;

  // 2. Substitute var(--name[, fallback]) — one pass per variable, up to 5 rounds for nesting
  let resolved = css;
  for (let round = 0; round < 5; round++) {
    let changed = false;
    resolved = resolved.replace(
      /var\(\s*--([a-zA-Z0-9_-]+)(?:\s*,[^)]+)?\s*\)/g,
      (_m, name: string) => {
        if (vars[name] !== undefined) {
          changed = true;
          return vars[name];
        }
        return _m;
      },
    );
    if (!changed) break;
  }
  return resolved;
}

export function combineHtmlCss(html: string, css: string): string {
  const sanitizedHtml = stripLeadingArtifactText(html);
  return autoMarkLeadForms(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${css}</style>
</head>
 <body>${sanitizedHtml}</body>
</html>`);
}

type AiGenerationMode = LandingPageAiGenerationMode;
type AiConversationRole = LandingPageAiConversationRole;
type AiConversationStatus = LandingPageAiConversationStatus;

interface AiConversationMessage {
  id: string;
  role: AiConversationRole;
  content: string;
  mode?: AiGenerationMode;
  status?: AiConversationStatus;
  tokensUsed?: number;
  selectionLabel?: string;
}

type AiTargetScope = 'page' | 'selection';

interface AiSelectionTarget {
  componentIds: string[];
  count: number;
  label: string;
  promptLabel: string;
  parentId: string | null;
}

interface PendingAiDraftState extends LandingPagePendingDraftDto {
  scope: AiTargetScope;
  selectionTarget?: AiSelectionTarget | null;
}

interface StyleSelectionMeta {
  tagName?: string;
  id?: string;
  classNames: string[];
}

function createAiMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function hasMeaningfulEditorContent(html: string): boolean {
  if (!html.trim()) return false;

  const textContent = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    textContent.length >= 80 ||
    /<(section|header|footer|main|nav|article|aside|form)\b/i.test(html)
  );
}

function normalizeSelectedComponents(components: Component[]): Component[] {
  const unique = Array.from(new Set(components.filter(Boolean)));

  return unique.filter((component) => {
    let parent = component.parent();
    while (parent) {
      if (unique.includes(parent)) return false;
      parent = parent.parent();
    }

    return true;
  });
}

function getComponentDisplayName(component: Component): string {
  const raw =
    component.getName({ noCustom: false }) || component.get('type') || 'Component';
  return raw.replace(/\s+/g, ' ').trim() || 'Component';
}

function buildAiSelectionTarget(components: Component[]): AiSelectionTarget | null {
  const normalized = normalizeSelectedComponents(components);
  if (!normalized.length) return null;

  const parent = normalized[0]?.parent() ?? null;
  const sharesSameParent = normalized.every((component) => component.parent() === parent);
  const count = normalized.length;

  return {
    componentIds: normalized.map((component) => component.getId()),
    count,
    label: count === 1 ? getComponentDisplayName(normalized[0]) : `${count} Components`,
    promptLabel:
      count === 1
        ? `the selected ${getComponentDisplayName(normalized[0])} block`
        : `the ${count} selected sibling blocks`,
    parentId: sharesSameParent ? (parent?.getId() ?? null) : null,
  };
}

function serializeSelectedComponentsHtml(components: Component[]): string {
  return normalizeSelectedComponents(components)
    .map((component) => component.toHTML())
    .join('\n');
}

function resolveStyleSelectionMeta(
  component?: Component | null,
): StyleSelectionMeta | null {
  if (!component) return null;

  const attributes = (component.getAttributes?.() ?? {}) as Record<string, string>;
  const classNames = (attributes.class ?? '')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const tagName = String(component.get?.('tagName') ?? '').toLowerCase() || undefined;
  const id = attributes.id?.trim() || component.getId?.() || undefined;

  return {
    tagName,
    id,
    classNames,
  };
}

function findComponentById(root: Component, id: string): Component | null {
  if (root.getId() === id) return root;

  const children = root.components().models as Component[];
  for (const child of children) {
    const match = findComponentById(child, id);
    if (match) return match;
  }

  return null;
}

function resolveSelectionTargetFromIds(
  editor: Editor,
  componentIds: string[],
): Component[] {
  const root = editor.getWrapper();
  if (!root) return [];

  return componentIds
    .map((id) => findComponentById(root, id))
    .filter((component): component is Component => Boolean(component));
}

function buildLandingPageAiPrompt(
  userPrompt: string,
  _mode: AiGenerationMode,
  target?: AiSelectionTarget | null,
  selectionHtml?: string,
): string {
  const normalizedPrompt = userPrompt.trim();

  if (target) {
    const selectionBrief = [
      `You are editing only ${target.promptLabel}, not the whole landing page.`,
      'Return only the replacement HTML fragment for the selected block(s).',
      `Return exactly ${target.count} top-level HTML element${target.count > 1 ? 's' : ''} in the same order as the selected block(s).`,
      'Do not wrap the result in html, head, or body tags.',
      'Do not output Markdown fences, backticks, explanations, or any prose outside the HTML.',
      'You may include a small <style> block only if it is required for the selected block(s).',
      'Keep the edit scoped to the selected block(s) and preserve the surrounding page structure.',
    ].join(' ');

    return `${selectionBrief}\n\nSelected block HTML:\n${selectionHtml ?? ''}\n\nSpecific request:\n${normalizedPrompt}`;
  }

  return normalizedPrompt;
}

function appendAiMessageLine(content: string, line: string): string {
  const normalizeLine = (value: string): string[] => {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.flatMap((item) => normalizeLine(String(item))).filter(Boolean);
      }
      if (typeof parsed === 'string') {
        return normalizeLine(parsed);
      }
    } catch {
      // Ignore non-JSON status lines.
    }

    return trimmed
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.replace(/^["']|["']$/g, '').trim())
      .filter(Boolean);
  };

  const nextLines = normalizeLine(line);
  if (nextLines.length === 0) return content;

  const existingLines = new Set(
    content
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
  );

  const uniqueLines = nextLines.filter((item) => !existingLines.has(item));
  if (uniqueLines.length === 0) return content;

  return content ? `${content}\n${uniqueLines.join('\n')}` : uniqueLines.join('\n');
}

function buildAiCompletionMessage(
  mode: AiGenerationMode,
  partial = false,
  target?: AiSelectionTarget | null,
  messages?: {
    targetPartial: (values: { label: string }) => string;
    targetDone: (values: { label: string }) => string;
    modifyPartial: () => string;
    modifyDone: () => string;
    generatePartial: () => string;
    generateDone: () => string;
  },
): string {
  if (target) {
    return partial
      ? (messages?.targetPartial({ label: target.label }) ?? `Stopped early. The partial draft for ${target.label} is ready. Click Apply to canvas if you want to use it.`)
      : (messages?.targetDone({ label: target.label }) ?? `The updated draft for ${target.label} is ready. Click Apply to canvas when you want to use it.`);
  }

  if (mode === 'modify') {
    return partial
      ? (messages?.modifyPartial() ?? 'Stopped early. The partial redesign draft is ready. Click Apply to canvas if you want to use it.')
      : (messages?.modifyDone() ?? 'The redesigned landing page draft is ready. Click Apply to canvas when you want to use it.');
  }

  return partial
    ? (messages?.generatePartial() ?? 'Stopped early. The partial landing page draft is ready. Click Apply to canvas if you want to use it.')
    : (messages?.generateDone() ?? 'The new landing page draft is ready. Click Apply to canvas when you want to use it.');
}

function buildAiAppliedMessage(
  mode: AiGenerationMode,
  partial = false,
  target?: AiSelectionTarget | null,
  messages?: {
    targetPartial: (values: { label: string }) => string;
    targetDone: (values: { label: string }) => string;
    modifyPartial: () => string;
    modifyDone: () => string;
    generatePartial: () => string;
    generateDone: () => string;
  },
): string {
  if (target) {
    return partial
      ? (messages?.targetPartial({ label: target.label }) ?? `Stopped early and applied the partial AI update to ${target.label}.`)
      : (messages?.targetDone({ label: target.label }) ?? `Applied the AI update to ${target.label}.`);
  }

  if (mode === 'modify') {
    return partial
      ? (messages?.modifyPartial() ?? 'Stopped early and applied the partial redesign to the canvas.')
      : (messages?.modifyDone() ?? 'Applied the redesigned landing page to the canvas.');
  }

  return partial
    ? (messages?.generatePartial() ?? 'Stopped early and applied the partial landing page to the canvas.')
    : (messages?.generateDone() ?? 'Applied the new landing page to the canvas.');
}

function serializeConversation(
  messages: AiConversationMessage[],
): LandingPageConversationMessage[] {
  return messages
    .filter((message) => message.role === 'user' && message.content.trim())
    .slice(-10)
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));
}

interface ScratchDraftSessionSnapshot {
  rawHtml?: string | null;
  projectData?: string | null;
}

interface AiConversationSessionSnapshot {
  messages: AiConversationMessage[];
  pendingDraft?: PendingAiDraftState | null;
}

function getScratchDraftSessionStorageKey(scope: string): string {
  return `iccp-landing-page-scratch:${scope}`;
}

function getScratchDraftReloadStorageKey(scope: string): string {
  return `iccp-landing-page-scratch-reload:${scope}`;
}

function getAiConversationSessionStorageKey(scope: string): string {
  return `iccp-landing-page-ai-conversation:${scope}`;
}

function getAiConversationReloadStorageKey(scope: string): string {
  return `iccp-landing-page-ai-conversation-reload:${scope}`;
}

function readScratchDraftSessionSnapshot(
  scope: string,
): ScratchDraftSessionSnapshot | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(getScratchDraftSessionStorageKey(scope));
    if (!raw) return null;
    return JSON.parse(raw) as ScratchDraftSessionSnapshot;
  } catch {
    return null;
  }
}

function writeScratchDraftSessionSnapshot(
  scope: string,
  snapshot: ScratchDraftSessionSnapshot,
): void {
  if (typeof window === 'undefined') return;

  window.sessionStorage.setItem(
    getScratchDraftSessionStorageKey(scope),
    JSON.stringify(snapshot),
  );
}

function clearScratchDraftSessionSnapshot(scope: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(getScratchDraftSessionStorageKey(scope));
  window.sessionStorage.removeItem(getScratchDraftReloadStorageKey(scope));
}

function normalizeRestoredAiMessages(
  messages: AiConversationMessage[],
): AiConversationMessage[] {
  return messages.map((message) => {
    if (message.role !== 'assistant' || message.status !== 'streaming') {
      return message;
    }

    return {
      ...message,
      content: appendAiMessageLine(
        message.content,
        'Generation was interrupted by a page reload.',
      ),
      status: 'stopped',
    };
  });
}

function readAiConversationSessionSnapshot(
  scope: string,
): AiConversationSessionSnapshot | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(getAiConversationSessionStorageKey(scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AiConversationSessionSnapshot;
    return {
      messages: Array.isArray(parsed.messages)
        ? normalizeRestoredAiMessages(parsed.messages)
        : [],
      pendingDraft: parsed.pendingDraft ?? null,
    };
  } catch {
    return null;
  }
}

function buildSerializedProjectData(
  projectData: Record<string, unknown>,
  options?: { templateId?: string | null },
): string {
  const normalizedTemplateId = options?.templateId?.trim();

  return JSON.stringify({
    ...projectData,
    ...(normalizedTemplateId
      ? { [LANDING_PAGE_TEMPLATE_ID_META_KEY]: normalizedTemplateId }
      : {}),
  });
}

function writeAiConversationSessionSnapshot(
  scope: string,
  snapshot: AiConversationSessionSnapshot,
): void {
  if (typeof window === 'undefined') return;

  window.sessionStorage.setItem(
    getAiConversationSessionStorageKey(scope),
    JSON.stringify(snapshot),
  );
}

function clearAiConversationSessionSnapshot(scope: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(getAiConversationSessionStorageKey(scope));
  window.sessionStorage.removeItem(getAiConversationReloadStorageKey(scope));
}

/** Simple HTML/CSS formatting for code editor */
function formatCode(code: string): string {
  let formatted = '';
  let indent = 0;
  const lines = code
    .replace(/>\s*</g, '>\n<')
    .replace(/{\s*/g, '{\n')
    .replace(/;\s*/g, ';\n')
    .replace(/}\s*/g, '}\n')
    .split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('</') || line === '}') indent = Math.max(0, indent - 1);
    formatted += '  '.repeat(indent) + line + '\n';
    if (
      (line.endsWith('>') &&
        !line.startsWith('</') &&
        !line.endsWith('/>') &&
        !line.includes('</')) ||
      line.endsWith('{')
    )
      indent++;
  }
  return formatted.trim();
}

function restoreEditorDocument(
  editor: Editor,
  rawHtml?: string | null,
  projectData?: string | null,
): void {
  if (projectData) {
    try {
      if (shouldSkipBootstrapProjectData(projectData)) {
        console.warn(
          '[landing-page-editor] Skipping oversized projectData restore and falling back to rawHtml.',
        );
      } else {
        const parsedProjectData = JSON.parse(projectData) as Parameters<
          Editor['loadProjectData']
        >[0] & { __rawCss?: string };
        editor.loadProjectData(parsedProjectData);
        const fallbackCss =
          parsedProjectData.__rawCss?.trim() ||
          (rawHtml ? splitHtmlAndCss(rawHtml).css : '');
        if (fallbackCss) injectCanvasCss(editor, fallbackCss);
        return;
      }
    } catch {
      // fall back to raw HTML restore below
    }
  }

  if (rawHtml) {
    applyAiHtmlToCanvas(editor, rawHtml);
  }
}

interface EditorDocumentSnapshot {
  rawHtml: string;
  projectData: string;
}

const MAX_LANDING_PAGE_PAYLOAD_BYTES = 18 * 1024 * 1024;
const MAX_BOOTSTRAP_PROJECT_DATA_BYTES = 8 * 1024 * 1024;
const MAX_BOOTSTRAP_RAW_HTML_BYTES = 12 * 1024 * 1024;

function getUtf8ByteLength(value: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).length;
  }

  return unescape(encodeURIComponent(value)).length;
}

function isLandingPagePayloadTooLarge(payload: string): boolean {
  return getUtf8ByteLength(payload) > MAX_LANDING_PAGE_PAYLOAD_BYTES;
}

function shouldSkipBootstrapProjectData(projectData?: string | null): boolean {
  return Boolean(
    projectData && getUtf8ByteLength(projectData) > MAX_BOOTSTRAP_PROJECT_DATA_BYTES,
  );
}

function shouldSkipBootstrapRawHtml(rawHtml?: string | null): boolean {
  return Boolean(rawHtml && getUtf8ByteLength(rawHtml) > MAX_BOOTSTRAP_RAW_HTML_BYTES);
}

function captureEditorDocumentSnapshot(editor: Editor): EditorDocumentSnapshot {
  const html = editor.getHtml() ?? '';
  const css = getEditorDocumentCss(editor);
  return {
    rawHtml: combineHtmlCss(html, css),
    projectData: JSON.stringify({
      ...editor.getProjectData(),
      __rawCss: css,
    }),
  };
}

// ─── Custom blocks ────────────────────────────────────────────────────────────

const CUSTOM_BLOCKS = [
  {
    id: 'cust-spacer',
    label: 'Spacer',
    category: 'Basic',
    media:
      '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l-1-1V6L8 5zm8 0l1 1v12l-1 1V5zm-7 6h6v2H9v-2z"/></svg>',
    content: '<div style="height:60px;width:100%"></div>',
  },
  {
    id: 'cust-divider',
    label: 'Divider',
    category: 'Basic',
    media: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 11h18v2H3z"/></svg>',
    content: '<hr style="border:none;border-top:1px solid #e5e5ea;margin:24px 0" />',
  },
  {
    id: 'cust-card',
    label: 'Card',
    category: 'Basic',
    media:
      '<svg viewBox="0 0 24 24"><rect fill="currentColor" x="3" y="4" width="18" height="16" rx="2" opacity=".2"/><rect fill="currentColor" x="3" y="4" width="18" height="5" rx="2"/></svg>',
    content: `<div style="border:1px solid #e5e5ea;border-radius:12px;overflow:hidden;background:#fff;max-width:380px">
  <div style="background:#f4f4f6;height:180px;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:13px">Image</div>
  <div style="padding:20px">
    <h3 style="margin:0 0 8px;font-size:18px;font-weight:700">Card Title</h3>
    <p style="margin:0 0 16px;color:#666;font-size:14px;line-height:1.5">A short description of the card content goes here.</p>
    <a href="#" style="display:inline-block;padding:9px 20px;background:#7c3aed;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px">Learn More</a>
  </div>
</div>`,
  },
  // Layout
  {
    id: 'sect-1col',
    label: '1 Column',
    category: 'Layout',
    media:
      '<svg viewBox="0 0 24 24"><rect fill="currentColor" x="3" y="5" width="18" height="14" rx="2" opacity=".8"/></svg>',
    content: `<section style="padding:60px 24px"><div style="max-width:1100px;margin:0 auto"><p>Your content here.</p></div></section>`,
  },
  {
    id: 'sect-2col',
    label: '2 Columns',
    category: 'Layout',
    media:
      '<svg viewBox="0 0 24 24"><rect fill="currentColor" x="3" y="5" width="8" height="14" rx="1.5"/><rect fill="currentColor" x="13" y="5" width="8" height="14" rx="1.5"/></svg>',
    content: `<section style="padding:60px 24px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;max-width:1100px;margin:0 auto"><div><p>Left column</p></div><div><p>Right column</p></div></div></section>`,
  },
  {
    id: 'sect-3col',
    label: '3 Columns',
    category: 'Layout',
    media:
      '<svg viewBox="0 0 24 24"><rect fill="currentColor" x="2" y="5" width="6" height="14" rx="1.5"/><rect fill="currentColor" x="9" y="5" width="6" height="14" rx="1.5"/><rect fill="currentColor" x="16" y="5" width="6" height="14" rx="1.5"/></svg>',
    content: `<section style="padding:60px 24px"><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;max-width:1100px;margin:0 auto"><div><p>Col 1</p></div><div><p>Col 2</p></div><div><p>Col 3</p></div></div></section>`,
  },
  {
    id: 'sect-2col-37',
    label: '2 Columns 3/7',
    category: 'Layout',
    media:
      '<svg viewBox="0 0 24 24"><rect fill="currentColor" x="2" y="5" width="6" height="14" rx="1.5"/><rect fill="currentColor" x="10" y="5" width="12" height="14" rx="1.5"/></svg>',
    content: `<section style="padding:60px 24px"><div style="display:grid;grid-template-columns:3fr 7fr;gap:32px;max-width:1100px;margin:0 auto"><div><p>Sidebar</p></div><div><p>Main content</p></div></div></section>`,
  },
  {
    id: 'sect-section',
    label: 'Section',
    category: 'Layout',
    media:
      '<svg viewBox="0 0 24 24"><rect fill="currentColor" x="2" y="6" width="20" height="12" rx="2" opacity=".3"/><path fill="currentColor" d="M4 10h16v2H4z"/></svg>',
    content: `<section style="padding:60px 24px"><div style="max-width:1100px;margin:0 auto"><h2 style="font-size:32px;font-weight:800;margin:0 0 16px">Section Title</h2><p style="color:#666;font-size:16px;line-height:1.7;margin:0">Add your content here.</p></div></section>`,
  },
  // Typography
  {
    id: 'block-heading',
    label: 'Heading',
    category: 'Basic',
    media:
      '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 4v3h5.5v12h3V7H19V4z"/></svg>',
    content: '<h1 style="font-size:42px;font-weight:800;margin:0 0 16px">Heading</h1>',
  },
  {
    id: 'block-text',
    label: 'Text',
    category: 'Basic',
    media:
      '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z"/></svg>',
    content:
      '<p style="font-size:16px;line-height:1.7;color:#333;margin:0">Type your text here. Click to edit this text block. You can change the font, size, color and more.</p>',
  },
  {
    id: 'block-link',
    label: 'Link',
    category: 'Basic',
    media:
      '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>',
    content:
      '<a href="#" style="color:#7c3aed;font-weight:600;text-decoration:underline">Link text</a>',
  },
  {
    id: 'block-linkbox',
    label: 'Link Box',
    category: 'Basic',
    media:
      '<svg viewBox="0 0 24 24"><rect fill="currentColor" x="3" y="5" width="18" height="14" rx="3" opacity=".15"/><path fill="currentColor" d="M8 13h8v-2H8v2z"/></svg>',
    content:
      '<a href="#" style="display:inline-block;padding:12px 28px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Button</a>',
  },
  {
    id: 'block-image',
    label: 'Image',
    category: 'Basic',
    media:
      '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>',
    content:
      '<img src="https://placehold.co/600x400/e8e8ed/aaa?text=Image" alt="Image" style="max-width:100%;height:auto;display:block" />',
  },
  {
    id: 'block-imagebox',
    label: 'Image Box',
    category: 'Basic',
    media:
      '<svg viewBox="0 0 24 24"><rect fill="currentColor" x="3" y="3" width="18" height="18" rx="3" opacity=".15"/><path fill="currentColor" d="M8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>',
    content: `<div style="border:1px solid #e5e5ea;border-radius:12px;overflow:hidden;display:inline-block">
  <img src="https://placehold.co/400x300/e8e8ed/aaa?text=Image" alt="Image" style="display:block;width:100%;height:auto" />
</div>`,
  },
  {
    id: 'block-video',
    label: 'Video',
    category: 'Basic',
    media:
      '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>',
    content:
      '<video controls style="max-width:100%;display:block"><source src="" type="video/mp4" />Your browser does not support video.</video>',
  },
  {
    id: 'block-map',
    label: 'Map',
    category: 'Basic',
    media:
      '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>',
    content:
      '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1959.3!2d106.7!3d10.8!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ4JzAwLjAiTiAxMDbCsDQyJzAwLjAiRQ!5e0!3m2!1sen!2s!4v1" width="100%" height="300" style="border:0;display:block" allowfullscreen loading="lazy"></iframe>',
  },
  // Sections
  {
    id: 'hero-gradient',
    label: 'Hero',
    category: 'Sections',
    media:
      '<svg viewBox="0 0 24 24"><rect fill="currentColor" x="2" y="3" width="20" height="18" rx="2" opacity=".15"/><path fill="currentColor" d="M12 8l3 4H9l3-4zm-1 6h2v2h-2v-2z"/></svg>',
    content: `<section style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:80vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:80px 24px">
  <div style="max-width:640px">
    <h1 style="color:#fff;font-size:52px;font-weight:800;margin:0 0 16px;line-height:1.1">Your Amazing Headline</h1>
    <p style="color:rgba(255,255,255,.85);font-size:18px;line-height:1.6;margin:0 0 36px">Describe your value proposition here in a short, compelling sentence.</p>
    <a href="#" style="display:inline-block;background:#fff;color:#764ba2;padding:15px 36px;border-radius:50px;font-weight:700;font-size:16px;text-decoration:none;box-shadow:0 8px 30px rgba(0,0,0,.2)">Get Started →</a>
  </div>
</section>`,
  },
  {
    id: 'features-3col',
    label: 'Features',
    category: 'Sections',
    media:
      '<svg viewBox="0 0 24 24"><circle cx="6" cy="8" r="2" fill="currentColor"/><rect fill="currentColor" x="10" y="7" width="10" height="2" rx="1"/><circle cx="6" cy="14" r="2" fill="currentColor"/><rect fill="currentColor" x="10" y="13" width="10" height="2" rx="1"/></svg>',
    content: `<section style="padding:80px 24px;background:#f9f9fb">
  <div style="max-width:1100px;margin:0 auto;text-align:center">
    <h2 style="font-size:36px;font-weight:800;margin:0 0 12px">Everything you need</h2>
    <p style="color:#666;font-size:16px;margin:0 0 56px">Powerful features to help you grow faster.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:32px;text-align:left">
      <div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e5ea">
        <div style="width:44px;height:44px;background:#ede9fe;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:22px">⚡</div>
        <h3 style="font-size:17px;font-weight:700;margin:0 0 8px">Lightning Fast</h3>
        <p style="color:#666;font-size:14px;line-height:1.6;margin:0">Blazing fast performance optimized for the best user experience.</p>
      </div>
      <div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e5ea">
        <div style="width:44px;height:44px;background:#ede9fe;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:22px">🔒</div>
        <h3 style="font-size:17px;font-weight:700;margin:0 0 8px">Secure by Default</h3>
        <p style="color:#666;font-size:14px;line-height:1.6;margin:0">Enterprise-grade security built in from the ground up.</p>
      </div>
      <div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e5ea">
        <div style="width:44px;height:44px;background:#ede9fe;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:22px">📊</div>
        <h3 style="font-size:17px;font-weight:700;margin:0 0 8px">Analytics Built-in</h3>
        <p style="color:#666;font-size:14px;line-height:1.6;margin:0">Track everything that matters with real-time dashboards.</p>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    id: 'cta-banner',
    label: 'CTA Banner',
    category: 'Sections',
    media:
      '<svg viewBox="0 0 24 24"><rect fill="currentColor" x="2" y="6" width="20" height="12" rx="2"/><path fill="white" d="M8 12l2-2v4l-2-2zm5 1h4v-2h-4v2z"/></svg>',
    content: `<section style="padding:72px 24px;background:#7c3aed;text-align:center">
  <div style="max-width:600px;margin:0 auto">
    <h2 style="color:#fff;font-size:36px;font-weight:800;margin:0 0 14px">Ready to get started?</h2>
    <p style="color:rgba(255,255,255,.8);font-size:17px;margin:0 0 36px">Join thousands of teams already using our platform.</p>
    <a href="#" style="display:inline-block;background:#fff;color:#7c3aed;padding:14px 36px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none">Start for Free</a>
  </div>
</section>`,
  },
  {
    id: 'navbar-block',
    label: 'Navbar',
    category: 'Navigation',
    media:
      '<svg viewBox="0 0 24 24"><rect fill="currentColor" x="2" y="4" width="20" height="4" rx="1"/><rect fill="currentColor" x="2" y="10" width="12" height="2" rx="1" opacity=".4"/></svg>',
    content: `<nav style="display:flex;align-items:center;justify-content:space-between;padding:16px 32px;background:#fff;border-bottom:1px solid #e5e5ea;position:sticky;top:0;z-index:100">
  <a href="#" style="font-size:20px;font-weight:800;color:#1c1c1e;text-decoration:none">Brand</a>
  <div style="display:flex;gap:28px">
    <a href="#" style="color:#555;text-decoration:none;font-size:14px;font-weight:500">Features</a>
    <a href="#" style="color:#555;text-decoration:none;font-size:14px;font-weight:500">Pricing</a>
    <a href="#" style="color:#555;text-decoration:none;font-size:14px;font-weight:500">About</a>
  </div>
  <a href="#" style="padding:9px 20px;background:#7c3aed;color:#fff;border-radius:7px;text-decoration:none;font-size:14px;font-weight:600">Sign Up</a>
</nav>`,
  },
  {
    id: 'footer-block',
    label: 'Footer',
    category: 'Navigation',
    media:
      '<svg viewBox="0 0 24 24"><rect fill="currentColor" x="2" y="16" width="20" height="4" rx="1"/><rect fill="currentColor" x="2" y="11" width="12" height="2" rx="1" opacity=".4"/></svg>',
    content: `<footer style="background:#1c1c1e;color:#ccc;padding:60px 32px 32px">
  <div style="max-width:1100px;margin:0 auto">
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:48px">
      <div>
        <p style="color:#fff;font-size:20px;font-weight:800;margin:0 0 12px">Brand</p>
        <p style="font-size:14px;line-height:1.6;margin:0;color:#999">A short description of your company.</p>
      </div>
      <div>
        <p style="color:#fff;font-weight:700;font-size:14px;margin:0 0 14px">Product</p>
        <a href="#" style="display:block;color:#999;font-size:13px;text-decoration:none;margin-bottom:8px">Features</a>
        <a href="#" style="display:block;color:#999;font-size:13px;text-decoration:none">Pricing</a>
      </div>
      <div>
        <p style="color:#fff;font-weight:700;font-size:14px;margin:0 0 14px">Company</p>
        <a href="#" style="display:block;color:#999;font-size:13px;text-decoration:none;margin-bottom:8px">About</a>
        <a href="#" style="display:block;color:#999;font-size:13px;text-decoration:none">Blog</a>
      </div>
      <div>
        <p style="color:#fff;font-weight:700;font-size:14px;margin:0 0 14px">Legal</p>
        <a href="#" style="display:block;color:#999;font-size:13px;text-decoration:none;margin-bottom:8px">Privacy</a>
        <a href="#" style="display:block;color:#999;font-size:13px;text-decoration:none">Terms</a>
      </div>
    </div>
    <div style="border-top:1px solid #333;padding-top:24px">
      <p style="font-size:13px;color:#666;margin:0">© 2024 Brand. All rights reserved.</p>
    </div>
  </div>
</footer>`,
  },
  {
    id: 'contact-form',
    label: 'Contact Form',
    category: 'Forms',
    media:
      '<svg viewBox="0 0 24 24"><rect fill="currentColor" x="3" y="5" width="18" height="3" rx="1"/><rect fill="currentColor" x="3" y="10" width="18" height="3" rx="1"/><rect fill="currentColor" x="3" y="15" width="12" height="3" rx="1"/></svg>',
    content: `<section style="padding:80px 24px;background:#fff">
  <div style="max-width:560px;margin:0 auto">
    <h2 style="font-size:32px;font-weight:800;text-align:center;margin:0 0 8px">Get in touch</h2>
    <p style="text-align:center;color:#888;font-size:15px;margin:0 0 40px">We'd love to hear from you.</p>
    <form data-iccp-form="lead" data-iccp-form-name="contact-form">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
        <div><label style="display:block;font-size:13px;font-weight:600;color:#444;margin-bottom:6px">First name</label><input type="text" name="firstName" placeholder="John" style="width:100%;padding:10px 12px;border:1px solid #e5e5ea;border-radius:7px;font-size:14px;box-sizing:border-box;outline:none" /></div>
        <div><label style="display:block;font-size:13px;font-weight:600;color:#444;margin-bottom:6px">Last name</label><input type="text" name="lastName" placeholder="Doe" style="width:100%;padding:10px 12px;border:1px solid #e5e5ea;border-radius:7px;font-size:14px;box-sizing:border-box;outline:none" /></div>
      </div>
      <div style="margin-bottom:16px"><label style="display:block;font-size:13px;font-weight:600;color:#444;margin-bottom:6px">Email</label><input type="email" name="email" placeholder="john@example.com" style="width:100%;padding:10px 12px;border:1px solid #e5e5ea;border-radius:7px;font-size:14px;box-sizing:border-box;outline:none" /></div>
      <div style="margin-bottom:24px"><label style="display:block;font-size:13px;font-weight:600;color:#444;margin-bottom:6px">Message</label><textarea rows="5" name="message" placeholder="Your message..." style="width:100%;padding:10px 12px;border:1px solid #e5e5ea;border-radius:7px;font-size:14px;box-sizing:border-box;resize:vertical;outline:none"></textarea></div>
      <button type="submit" style="width:100%;padding:13px;background:#7c3aed;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer">Send Message</button>
    </form>
  </div>
</section>`,
  },
];

// ─── Pages Panel ──────────────────────────────────────────────────────────────

function PagesPanel({ editor }: { editor: Editor | null }) {
  const t = useTranslations('siteStudio.editor.pagesPanel');
  const [pages, setPages] = useState<Array<{ id: string; name: string }>>([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (!editor) return;
    const refresh = () => {
      const all = editor.Pages.getAll().map((p) => ({
        id: p.getId(),
        name: p.getName() || t('untitledPage'),
      }));
      setPages(all);
      setActiveId(editor.Pages.getSelected()?.getId() ?? '');
    };
    refresh();
    editor.on('page:add page:remove page:select page:update', refresh);
    return () => {
      editor.off('page:add page:remove page:select page:update', refresh);
    };
  }, [editor]);

  const addPage = () => {
    if (!editor) return;
    const page = editor.Pages.add({ name: t('generatedName', { number: pages.length + 1 }) });
    if (page) editor.Pages.select(page.getId());
  };

  return (
    <div className="gjs-pages-panel">
      <div className="gjs-pages-panel__header">
        <span>{t('title')}</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button className="gjs-pages-panel__add" onClick={addPage} title={t('addPage')}>
            <Plus size={12} />
          </button>
        </div>
      </div>
      <div className="gjs-pages-panel__list">
        {pages.map((p) => (
          <div
            key={p.id}
            className={`gjs-pages-panel__item ${p.id === activeId ? 'active' : ''}`}
            onClick={() => editor?.Pages.select(p.id)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={12} style={{ opacity: 0.5 }} />
              {p.name}
            </span>
            {pages.length > 1 && (
              <button
                className="gjs-pages-panel__delete"
                onClick={(e) => {
                  e.stopPropagation();
                  editor?.Pages.remove(p.id);
                }}
                title={t('removePage')}
              >
                <X size={11} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Custom Layers Tree ───────────────────────────────────────────────────────

const LAYER_TYPES: Record<string, { color: string; icon: React.ReactNode }> = {
  wrapper: { color: '#6366f1', icon: <Square size={11} /> },
  header: { color: '#3b82f6', icon: <Layout size={11} /> },
  footer: { color: '#64748b', icon: <Layout size={11} /> },
  nav: { color: '#f59e0b', icon: <Navigation size={11} /> },
  section: { color: '#8b5cf6', icon: <Layout size={11} /> },
  container: { color: '#14b8a6', icon: <Square size={11} /> },
  row: { color: '#f59e0b', icon: <Square size={11} /> },
  column: { color: '#3b82f6', icon: <Square size={11} /> },
  cell: { color: '#3b82f6', icon: <Square size={11} /> },
  text: { color: '#64748b', icon: <Type size={11} /> },
  heading: { color: '#6366f1', icon: <Type size={11} /> },
  link: { color: '#10b981', icon: <Link2 size={11} /> },
  image: { color: '#ec4899', icon: <ImageIcon size={11} /> },
  video: { color: '#8b5cf6', icon: <Film size={11} /> },
  default: { color: '#f97316', icon: <Square size={11} /> },
};

const TAG_TO_TYPE: Record<string, string> = {
  body: 'wrapper',
  header: 'header',
  footer: 'footer',
  nav: 'nav',
  section: 'section',
  main: 'container',
  article: 'container',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
  a: 'link',
  img: 'image',
  video: 'video',
  tr: 'row',
  td: 'column',
  th: 'column',
};

const TYPE_LABELS: Record<string, string> = {
  wrapper: 'Body',
  header: 'Header',
  footer: 'Footer',
  nav: 'Nav',
  section: 'Section',
  container: 'Container',
  row: 'Row',
  column: 'Column',
  cell: 'Column',
  text: 'Text',
  heading: 'Heading',
  link: 'Link',
  image: 'Image',
  video: 'Video',
};

function resolveLayer(comp: any): {
  label: string;
  color: string;
  icon: React.ReactNode;
} {
  const type: string = comp.getType?.() ?? comp.get?.('type') ?? 'default';
  const tag: string = (comp.get?.('tagName') ?? '').toLowerCase();
  const customName: string = comp.getName?.() ?? '';

  const mappedType = TAG_TO_TYPE[tag] ?? type;
  const config = LAYER_TYPES[mappedType] ?? LAYER_TYPES.default;
  const label =
    customName ||
    TYPE_LABELS[mappedType] ||
    (tag ? tag.charAt(0).toUpperCase() + tag.slice(1) : 'Element');
  return { label, color: config.color, icon: config.icon };
}

type LayerNode = {
  id: string;
  label: string;
  color: string;
  icon: React.ReactNode;
  visible: boolean;
  hasChildren: boolean;
  childCount: number;
  level: number;
};

function buildLayerFlat(comp: any, level: number, expanded: Set<string>): LayerNode[] {
  const id: string = comp.getId?.() ?? String(Math.random());
  const visible: boolean = comp.get?.('visible') !== false;
  const children = comp.components?.();
  const childCount: number = children?.length ?? 0;
  const { label, color, icon } = resolveLayer(comp);

  const node: LayerNode = {
    id,
    label,
    color,
    icon,
    visible,
    hasChildren: childCount > 0,
    childCount,
    level,
  };
  const result: LayerNode[] = [node];

  if (childCount > 0 && expanded.has(id)) {
    children.forEach((child: any) =>
      result.push(...buildLayerFlat(child, level + 1, expanded)),
    );
  }
  return result;
}

function CustomLayersTree({ editor }: { editor: Editor | null }) {
  const t = useTranslations('siteStudio.editor.layers');
  const [nodes, setNodes] = useState<LayerNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['wrapper']));
  const [selectedId, setSelectedId] = useState('');

  const rebuild = useCallback(() => {
    if (!editor) return;
    const wrapper = editor.DomComponents.getWrapper();
    if (!wrapper) return;
    setSelectedId(editor.getSelected()?.getId() ?? '');
    setNodes(buildLayerFlat(wrapper, 0, expanded));
  }, [editor, expanded]);

  useEffect(() => {
    if (!editor) return;
    const frame = requestAnimationFrame(() => {
      rebuild();
    });
    const evts = [
      'component:add',
      'component:remove',
      'component:update:components',
      'component:select',
      'component:deselect',
      'component:toggled',
      'load',
    ];
    evts.forEach((ev) => editor.on(ev, rebuild));
    return () => {
      cancelAnimationFrame(frame);
      evts.forEach((ev) => editor.off(ev, rebuild));
    };
  }, [editor, rebuild]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleVisible = (node: LayerNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editor) return;
    const comp = editor.DomComponents.getById(node.id);
    if (!comp) return;
    comp.set('visible', !node.visible);
    rebuild();
  };

  const selectComp = (node: LayerNode) => {
    if (!editor) return;
    const comp = editor.DomComponents.getById(node.id);
    if (comp) editor.select(comp);
    setSelectedId(node.id);
  };

  if (!editor || nodes.length === 0) {
    return <div className="gjs-cl-empty">{t('empty')}</div>;
  }

  return (
    <div className="gjs-custom-layers">
      {nodes.map((node) => (
        <div
          key={node.id}
          className={`gjs-cl-item${selectedId === node.id ? 'gjs-cl-item--selected' : ''}`}
          style={{ paddingLeft: node.level * 14 + 6 }}
          onClick={() => selectComp(node)}
        >
          <button
            className="gjs-cl-eye"
            onClick={(e) => toggleVisible(node, e)}
            title={node.visible ? t('hide') : t('show')}
          >
            {node.visible ? (
              <Eye size={12} />
            ) : (
              <EyeOff size={12} style={{ opacity: 0.35 }} />
            )}
          </button>
          <button
            className={`gjs-cl-chevron${!node.hasChildren ? 'gjs-cl-chevron--empty' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (node.hasChildren) toggle(node.id);
            }}
          >
            {node.hasChildren &&
              (expanded.has(node.id) ? (
                <ChevronDown size={11} />
              ) : (
                <ChevronRight size={11} />
              ))}
          </button>
          <span className="gjs-cl-icon" style={{ color: node.color }}>
            {node.icon}
          </span>
          <span className="gjs-cl-name" style={{ color: node.color }}>
            {node.label}
          </span>
          {node.hasChildren && <span className="gjs-cl-count">{node.childCount}</span>}
          <span className="gjs-cl-drag">
            <GripVertical size={12} />
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Code Editor (bottom drawer with CodeMirror) ─────────────────────────────

function CodeEditorModal({
  html,
  css,
  onClose,
  onApply,
}: {
  html: string;
  css: string;
  onClose: () => void;
  onApply: (html: string, css: string) => void;
}) {
  const t = useTranslations('siteStudio.editor.codeEditor');
  const commonT = useTranslations('common');
  const [localHtml, setLocalHtml] = useState(() => formatCode(html));
  const [localCss, setLocalCss] = useState(() => formatCode(css));
  const [fullMode, setFullMode] = useState(false);
  // fullMode = single pane showing the complete combined HTML document
  const [localFull, setLocalFull] = useState('');
  const [panelHeight, setPanelHeight] = useState(55);
  const [splitPct, setSplitPct] = useState(60);
  const [extensions, setExtensions] = useState<{ html: Extension[]; css: Extension[] }>({
    html: [],
    css: [],
  });
  const draggingV = useRef(false);
  const draggingH = useRef(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void Promise.all([
      import('@codemirror/lang-html').then((m) => m.html({ autoCloseTags: true })),
      import('@codemirror/lang-css').then((m) => m.css()),
      import('@codemirror/autocomplete').then((m) => m.autocompletion()),
    ]).then(([htmlExt, cssExt, autoExt]) => {
      setExtensions({ html: [htmlExt, autoExt], css: [cssExt, autoExt] });
    });
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (draggingV.current) {
        const vh = window.innerHeight;
        setPanelHeight(Math.max(20, Math.min(90, ((vh - e.clientY) / vh) * 100)));
      }
      if (draggingH.current && bodyRef.current) {
        const rect = bodyRef.current.getBoundingClientRect();
        setSplitPct(
          Math.max(20, Math.min(80, ((e.clientX - rect.left) / rect.width) * 100)),
        );
      }
    };
    const onUp = () => {
      draggingV.current = false;
      draggingH.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Switch to full-document mode: combine body HTML + CSS into one pane
  const enterFullMode = () => {
    setLocalFull(combineHtmlCss(localHtml, localCss));
    setFullMode(true);
  };

  // Switch back: split combined document back into HTML + CSS panes
  const exitFullMode = () => {
    const { html: h, css: c } = splitHtmlAndCss(localFull);
    setLocalHtml(h);
    setLocalCss(c);
    setFullMode(false);
  };

  const handleApply = () => {
    if (fullMode) {
      // Full document in single pane — pass as-is; handleApplyCode will split it
      onApply(localFull, '');
    } else {
      onApply(localHtml, localCss);
    }
  };

  const cmStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    fontSize: 13,
  };

  return (
    <div
      className="gjs-code-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="gjs-code-root" style={{ height: `${panelHeight}vh` }}>
        <div
          className="gjs-code-drag-handle"
          onMouseDown={(e) => {
            e.preventDefault();
            draggingV.current = true;
          }}
        />
        <div className="gjs-code-header">
          <span className="gjs-code-title">
            <Code2 size={14} /> {t('title')}
          </span>
          <div className="gjs-code-header-actions">
            {/* Toggle split ↔ full-document mode */}
            <button
              className="gjs-code-cancel"
              title={
                fullMode
                  ? t('switchToSplitView')
                  : t('switchToFullView')
              }
              onClick={fullMode ? exitFullMode : enterFullMode}
            >
              {fullMode ? t('splitView') : t('fullHtml')}
            </button>
            <button className="gjs-code-cancel" onClick={onClose}>
              {commonT('cancel')}
            </button>
            <button className="gjs-code-apply" onClick={handleApply}>
              {t('applyChanges')}
            </button>
          </div>
        </div>
        <div className="gjs-code-body" ref={bodyRef}>
          {fullMode ? (
            /* ── single pane: full HTML document ── */
            <div className="gjs-code-pane" style={{ flex: 1 }}>
              <div className="gjs-code-pane-label">
                {t('fullHtmlLabel')}
              </div>
              <CodeMirrorEditor
                value={localFull}
                onChange={(v: string) => setLocalFull(v)}
                extensions={extensions.html}
                theme={dracula}
                style={cmStyle}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: true,
                  autocompletion: true,
                  closeBrackets: true,
                  indentOnInput: true,
                  bracketMatching: true,
                  tabSize: 2,
                }}
              />
            </div>
          ) : (
            /* ── split pane: HTML + CSS ── */
            <>
              <div className="gjs-code-pane" style={{ width: `${splitPct}%` }}>
                <div className="gjs-code-pane-label">{t('html')}</div>
                <CodeMirrorEditor
                  value={localHtml}
                  onChange={(v: string) => setLocalHtml(v)}
                  extensions={extensions.html}
                  theme={dracula}
                  style={cmStyle}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLine: true,
                    autocompletion: true,
                    closeBrackets: true,
                    indentOnInput: true,
                    bracketMatching: true,
                    tabSize: 2,
                  }}
                />
              </div>
              <div
                className="gjs-code-divider"
                onMouseDown={(e) => {
                  e.preventDefault();
                  draggingH.current = true;
                }}
              />
              <div className="gjs-code-pane" style={{ flex: 1 }}>
                <div className="gjs-code-pane-label">{t('css')}</div>
                <CodeMirrorEditor
                  value={localCss}
                  onChange={(v: string) => setLocalCss(v)}
                  extensions={extensions.css}
                  theme={dracula}
                  style={cmStyle}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLine: true,
                    autocompletion: true,
                    closeBrackets: true,
                    tabSize: 2,
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type LeftPanelId = 'blocks' | 'layers' | 'global-styles' | 'assets' | 'ai' | null;
type RightTabId = 'styles' | 'properties';
type DeviceType = 'Desktop' | 'Tablet' | 'Mobile';

const LEFT_SIDEBAR_ITEMS: {
  id: Exclude<LeftPanelId, null>;
  icon: React.ElementType;
  labelKey: string;
}[] = [
    { id: 'blocks', icon: Plus, labelKey: 'leftPanels.blocks' },
    { id: 'layers', icon: Layers, labelKey: 'leftPanels.layers' },
    { id: 'global-styles', icon: Paintbrush, labelKey: 'leftPanels.globalStyles' },
    { id: 'assets', icon: ImageIcon, labelKey: 'leftPanels.assets' },
    { id: 'ai', icon: Sparkles, labelKey: 'leftPanels.ai' },
  ];

// ─── Component trait definitions ─────────────────────────────────────────────
// GrapesJS shows a "Properties" tab per selected element. By default most
// element types have few or no traits. This function extends every built-in
// type so users see sensible, editable fields for every element they click.

function setupComponentTraits(editor: Editor) {
  const dc = editor.DomComponents;

  // ── shared helpers ──
  const T = {
    id: { type: 'text', name: 'id', label: 'ID', placeholder: 'element-id' },
    title: {
      type: 'text',
      name: 'title',
      label: 'Title',
      placeholder: 'Tooltip / title',
    },
    href: { type: 'text', name: 'href', label: 'URL', placeholder: 'https://…' },
    src: { type: 'text', name: 'src', label: 'Source URL', placeholder: 'https://…' },
    alt: {
      type: 'text',
      name: 'alt',
      label: 'Alt Text',
      placeholder: 'Image description',
    },
    poster: {
      type: 'text',
      name: 'poster',
      label: 'Poster Image',
      placeholder: 'https://…',
    },
    rel: { type: 'text', name: 'rel', label: 'Rel', placeholder: 'noopener noreferrer' },
    name: { type: 'text', name: 'name', label: 'Name', placeholder: 'field-name' },
    placeholder: {
      type: 'text',
      name: 'placeholder',
      label: 'Placeholder',
      placeholder: 'eg. Type here…',
    },
    autoplay: { type: 'checkbox', name: 'autoplay', label: 'Autoplay' },
    controls: { type: 'checkbox', name: 'controls', label: 'Show Controls' },
    loop: { type: 'checkbox', name: 'loop', label: 'Loop' },
    muted: { type: 'checkbox', name: 'muted', label: 'Muted' },
    required: { type: 'checkbox', name: 'required', label: 'Required' },
    target: {
      type: 'select',
      name: 'target',
      label: 'Open In',
      options: [
        { id: '', name: 'Same Tab' },
        { id: '_blank', name: 'New Tab' },
        { id: '_parent', name: 'Parent' },
      ],
    },
    loading: {
      type: 'select',
      name: 'loading',
      label: 'Loading',
      options: [
        { id: '', name: 'Default' },
        { id: 'lazy', name: 'Lazy' },
        { id: 'eager', name: 'Eager' },
      ],
    },
    inputType: {
      type: 'select',
      name: 'type',
      label: 'Input Type',
      options: [
        { id: 'text', name: 'Text' },
        { id: 'email', name: 'Email' },
        { id: 'password', name: 'Password' },
        { id: 'number', name: 'Number' },
        { id: 'tel', name: 'Tel' },
        { id: 'url', name: 'URL' },
        { id: 'search', name: 'Search' },
        { id: 'date', name: 'Date' },
        { id: 'checkbox', name: 'Checkbox' },
        { id: 'radio', name: 'Radio' },
        { id: 'file', name: 'File' },
        { id: 'hidden', name: 'Hidden' },
      ],
    },
    formMethod: {
      type: 'select',
      name: 'method',
      label: 'Method',
      options: [
        { id: 'get', name: 'GET' },
        { id: 'post', name: 'POST' },
      ],
    },
    enctype: {
      type: 'select',
      name: 'enctype',
      label: 'Encoding',
      options: [
        { id: 'application/x-www-form-urlencoded', name: 'Default' },
        { id: 'multipart/form-data', name: 'Multipart (files)' },
        { id: 'text/plain', name: 'Text Plain' },
      ],
    },
  };

  // ── default (div, section, article, header, footer, nav, aside, main …) ──
  dc.addType('default', {
    model: { defaults: { traits: [T.id, T.title] } },
  });

  // ── text (h1–h6, p, span, li, td, th, label, strong, em …) ──
  dc.addType('text', {
    model: { defaults: { traits: [T.id, T.title] } },
  });

  // ── link (a) ──
  dc.addType('link', {
    model: { defaults: { traits: [T.href, T.target, T.rel, T.id, T.title] } },
  });

  // ── image (img) ──
  dc.addType('image', {
    model: { defaults: { traits: [T.src, T.alt, T.loading, T.id, T.title] } },
  });

  // ── video ──
  dc.addType('video', {
    model: {
      defaults: {
        traits: [T.src, T.poster, T.controls, T.autoplay, T.loop, T.muted, T.id],
      },
    },
  });

  // ── map (iframe embed) ──
  dc.addType('map', {
    model: { defaults: { traits: [T.src, T.id, T.title] } },
  });

  // ── input ──
  dc.addType('input', {
    model: {
      defaults: { traits: [T.inputType, T.name, T.placeholder, T.required, T.id] },
    },
  });

  // ── textarea ──
  dc.addType('textarea', {
    model: { defaults: { traits: [T.name, T.placeholder, T.required, T.id] } },
  });

  // ── select ──
  dc.addType('select', {
    model: { defaults: { traits: [T.name, T.required, T.id] } },
  });

  // ── form ──
  dc.addType('form', {
    model: {
      defaults: {
        traits: [
          { type: 'text', name: 'action', label: 'Action URL', placeholder: 'https://…' },
          T.formMethod,
          T.enctype,
          T.id,
        ],
      },
    },
  });

  // ── button ──
  dc.addType('button', {
    model: {
      defaults: {
        traits: [
          {
            type: 'select',
            name: 'type',
            label: 'Type',
            options: [
              { id: 'button', name: 'Button' },
              { id: 'submit', name: 'Submit' },
              { id: 'reset', name: 'Reset' },
            ],
          },
          T.name,
          T.id,
          T.title,
        ],
      },
    },
  });
}

function syncTraitFieldAccessibility(root: HTMLDivElement | null) {
  if (!root) return;

  root.querySelectorAll<HTMLElement>('.gjs-trt-trait').forEach((traitEl, index) => {
    const field = traitEl.querySelector<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >('input, select, textarea');
    if (!field) return;

    const labelText =
      traitEl
        .querySelector<HTMLElement>('.gjs-label, .gjs-trt-trait__label, .gjs-label-wrp')
        ?.textContent?.trim() ?? '';

    if (!labelText) return;
    applyStudioFieldMetadata(field, index, 'trait', labelText);
  });
}

function normalizeStudioFieldToken(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'field'
  );
}

function getStudioFieldLabel(
  field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  index: number,
) {
  const wrapper = field.closest<HTMLElement>(
    '.gjs-sm-property, .gjs-trt-trait, .gjs-clm-tag',
  );
  const labelText = wrapper
    ?.querySelector<HTMLElement>(
      '.gjs-sm-label, .gjs-label, .gjs-trt-trait__label, .gjs-label-wrp',
    )
    ?.textContent?.trim();

  return (
    labelText ||
    field.getAttribute('aria-label') ||
    field.getAttribute('placeholder') ||
    field.getAttribute('name') ||
    field.getAttribute('id') ||
    (field instanceof HTMLInputElement ? field.type : field.tagName.toLowerCase()) ||
    `field-${index}`
  );
}

function applyStudioFieldMetadata(
  field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  index: number,
  scope: 'style' | 'trait' | 'selector',
  explicitLabel?: string,
) {
  if (field instanceof HTMLInputElement && field.dataset.iccpNativeColor === 'true')
    return;

  const label = explicitLabel?.trim() || getStudioFieldLabel(field, index);
  const shouldPreserveNativeChoiceIds =
    field instanceof HTMLInputElement && ['radio', 'checkbox'].includes(field.type);

  if (!shouldPreserveNativeChoiceIds) {
    const token = normalizeStudioFieldToken(label);
    const fieldId = `gjs-${scope}-${token}-${index}`;
    field.id = fieldId;
    field.setAttribute('name', fieldId);
  }

  field.setAttribute('autocomplete', 'off');
  field.setAttribute('autocorrect', 'off');
  field.setAttribute('autocapitalize', 'off');
  field.setAttribute('spellcheck', 'false');
  field.setAttribute('data-form-type', 'other');
  field.setAttribute('data-lpignore', 'true');
  field.setAttribute('data-1p-ignore', 'true');
  field.setAttribute('data-bwignore', 'true');
  field.setAttribute('aria-label', label);
}

function syncStudioFieldMetadata(
  root: HTMLElement | null,
  scope: 'style' | 'trait' | 'selector',
) {
  if (!root) return;

  root.setAttribute('autocomplete', 'off');

  root
    .querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >('input, select, textarea')
    .forEach((field, index) => {
      applyStudioFieldMetadata(field, index, scope);
    });
}

function bindStudioFieldMetadataRuntime(
  root: HTMLElement | null,
  scope: 'style' | 'trait' | 'selector',
) {
  if (!root) return () => { };

  let frameId = 0;
  const sync = () => {
    frameId = 0;
    syncStudioFieldMetadata(root, scope);
  };
  const scheduleSync = () => {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(sync);
  };

  const observer = new MutationObserver(scheduleSync);
  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  scheduleSync();

  return () => {
    if (frameId) cancelAnimationFrame(frameId);
    observer.disconnect();
  };
}

function isStudioTextLikeField(
  field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
): field is HTMLInputElement | HTMLTextAreaElement {
  if (field instanceof HTMLTextAreaElement) return true;
  if (!(field instanceof HTMLInputElement)) return false;

  return !['checkbox', 'radio', 'range', 'color', 'file'].includes(field.type);
}

function syncStudioTextFieldVisualState(root: HTMLElement | null) {
  if (!root) return;

  root
    .querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >('input, textarea, select')
    .forEach((field) => {
      if (!isStudioTextLikeField(field)) return;

      const value = field.value ?? '';
      const hasValue = value.trim().length > 0;
      const currentPlaceholder = field.getAttribute('placeholder') ?? '';
      const originalPlaceholder =
        field.getAttribute('data-gjs-original-placeholder') ?? currentPlaceholder;

      if (originalPlaceholder) {
        field.setAttribute('data-gjs-original-placeholder', originalPlaceholder);
      }

      field.toggleAttribute('data-gjs-has-value', hasValue);
      field.style.color = '#111';
      field.style.webkitTextFillColor = '#111';
      field.style.caretColor = '#111';
      field.style.fontStyle = 'normal';
      field.style.fontWeight = hasValue ? '500' : '400';
      field.style.opacity = '1';

      if (hasValue) {
        field.removeAttribute('placeholder');
      } else if (originalPlaceholder) {
        field.setAttribute('placeholder', originalPlaceholder);
      }

      if (field instanceof HTMLInputElement) {
        if (hasValue) {
          field.setAttribute('value', value);
        } else {
          field.removeAttribute('value');
        }
      }
    });
}

function bindStudioTextFieldVisualRuntime(root: HTMLElement | null) {
  if (!root) return () => { };

  let frameId = 0;
  const sync = () => {
    frameId = 0;
    syncStudioTextFieldVisualState(root);
  };
  const scheduleSync = () => {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(sync);
  };
  const handleFieldUpdate = (event: Event) => {
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    ) {
      syncStudioTextFieldVisualState(root);
    }
  };

  const observer = new MutationObserver(scheduleSync);
  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  root.addEventListener('input', handleFieldUpdate, true);
  root.addEventListener('change', handleFieldUpdate, true);
  root.addEventListener('focusin', handleFieldUpdate, true);
  root.addEventListener('focusout', handleFieldUpdate, true);

  scheduleSync();

  return () => {
    if (frameId) cancelAnimationFrame(frameId);
    observer.disconnect();
    root.removeEventListener('input', handleFieldUpdate, true);
    root.removeEventListener('change', handleFieldUpdate, true);
    root.removeEventListener('focusin', handleFieldUpdate, true);
    root.removeEventListener('focusout', handleFieldUpdate, true);
  };
}

function isStudioEnterCommitField(
  field: EventTarget | null,
): field is HTMLInputElement | HTMLSelectElement {
  if (field instanceof HTMLSelectElement) return true;
  if (!(field instanceof HTMLInputElement)) return false;

  return ![
    'checkbox',
    'radio',
    'range',
    'color',
    'file',
    'hidden',
    'submit',
    'button',
    'reset',
  ].includes(field.type);
}

function syncStudioRadioFieldVisualState(root: HTMLElement | null) {
  if (!root) return;

  root.querySelectorAll<HTMLElement>('.gjs-radio-item').forEach((item) => {
    const input = item.querySelector<HTMLInputElement>('input[type="radio"]');
    const label = item.querySelector<HTMLElement>('label');
    const isChecked = Boolean(input?.checked);

    item.setAttribute('data-gjs-checked', isChecked ? 'true' : 'false');
    label?.setAttribute('aria-pressed', isChecked ? 'true' : 'false');
  });
}

function bindStudioRadioFieldRuntime(root: HTMLElement | null) {
  if (!root) return () => { };

  let frameId = 0;
  const sync = () => {
    frameId = 0;
    syncStudioRadioFieldVisualState(root);
  };
  const scheduleSync = () => {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(sync);
  };

  const handleRadioUpdate = () => {
    scheduleSync();
  };

  const observer = new MutationObserver(scheduleSync);
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['checked', 'class'],
  });

  root.addEventListener('change', handleRadioUpdate, true);
  root.addEventListener('click', handleRadioUpdate, true);
  root.addEventListener('focusin', handleRadioUpdate, true);

  scheduleSync();

  return () => {
    if (frameId) cancelAnimationFrame(frameId);
    observer.disconnect();
    root.removeEventListener('change', handleRadioUpdate, true);
    root.removeEventListener('click', handleRadioUpdate, true);
    root.removeEventListener('focusin', handleRadioUpdate, true);
  };
}

function syncStudioColorFieldVisualState(root: HTMLElement | null) {
  if (!root) return;

  root.querySelectorAll<HTMLElement>('.gjs-field-color').forEach((field) => {
    const input = field.querySelector<HTMLInputElement>(
      'input:not([data-iccp-native-color="true"])',
    );
    const nativeInput = field.querySelector<HTMLInputElement>(
      'input[data-iccp-native-color="true"]',
    );
    const preview = field.querySelector<HTMLElement>('.sp-preview');
    const previewInner = field.querySelector<HTMLElement>('.sp-preview-inner');
    const picker = field.querySelector<HTMLElement>('.gjs-field-color-picker');
    const pickerHolder = field.querySelector<HTMLElement>('.gjs-field-colorp-c');
    const rawValue = (input?.value ?? picker?.style.backgroundColor ?? '').trim();
    const colorValue =
      rawValue && rawValue !== 'none' && rawValue !== 'transparent'
        ? rawValue
        : 'transparent';

    if (picker) {
      picker.style.setProperty('background-color', colorValue, 'important');
    }
    if (pickerHolder) {
      pickerHolder.style.setProperty('background-color', colorValue, 'important');
    }
    if (preview) {
      preview.style.setProperty('background-color', colorValue, 'important');
    }
    if (previewInner) {
      previewInner.style.setProperty('background-color', colorValue, 'important');
    }
    if (nativeInput) {
      const normalizedColor = normalizeStudioColorToHex(colorValue) ?? '#000000';
      if (nativeInput.value !== normalizedColor) {
        nativeInput.value = normalizedColor;
      }
    }
  });
}

function componentToHex(channel: number): string {
  return Math.max(0, Math.min(255, Math.round(channel)))
    .toString(16)
    .padStart(2, '0');
}

function rgbStringToHex(value: string): string | null {
  const match = value.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+\s*)?\)/i,
  );
  if (!match) return null;

  const [, r, g, b] = match;
  return `#${componentToHex(Number(r))}${componentToHex(Number(g))}${componentToHex(Number(b))}`;
}

function normalizeStudioColorToHex(value: string): string | null {
  const normalized = value.trim();
  if (!normalized || normalized === 'transparent' || normalized === 'none') return null;

  const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      return `#${hex
        .split('')
        .map((char) => `${char}${char}`)
        .join('')}`.toLowerCase();
    }
    return `#${hex.slice(0, 6)}`.toLowerCase();
  }

  const rgbHex = rgbStringToHex(normalized);
  if (rgbHex) return rgbHex;

  if (typeof document === 'undefined') return null;

  const probe = document.createElement('div');
  probe.style.color = '';
  probe.style.color = normalized;
  if (!probe.style.color) return null;
  document.body.appendChild(probe);
  const resolved = window.getComputedStyle(probe).color;
  probe.remove();
  return rgbStringToHex(resolved);
}

function ensureStudioNativeColorInputs(root: HTMLElement | null) {
  if (!root) return;

  root.querySelectorAll<HTMLElement>('.gjs-field-color').forEach((field) => {
    const sourceInput = field.querySelector<HTMLInputElement>(
      'input:not([data-iccp-native-color="true"])',
    );
    if (!sourceInput) return;

    let nativeInput = field.querySelector<HTMLInputElement>(
      'input[data-iccp-native-color="true"]',
    );
    if (!nativeInput) {
      nativeInput = document.createElement('input');
      nativeInput.type = 'color';
      nativeInput.className = 'gjs-native-color-input';
      nativeInput.dataset.iccpNativeColor = 'true';
      nativeInput.tabIndex = 0;
      nativeInput.addEventListener('input', () => {
        sourceInput.value = nativeInput?.value ?? '#000000';
        sourceInput.setAttribute('value', sourceInput.value);
        sourceInput.dispatchEvent(new Event('input', { bubbles: true }));
        sourceInput.dispatchEvent(new Event('change', { bubbles: true }));
      });
      if (sourceInput.parentElement) {
        sourceInput.parentElement.insertBefore(nativeInput, sourceInput);
      } else {
        field.prepend(nativeInput);
      }
    }

    const normalizedColor = normalizeStudioColorToHex(sourceInput.value) ?? '#000000';
    if (nativeInput.value !== normalizedColor) {
      nativeInput.value = normalizedColor;
    }
  });
}

function bindStudioColorFieldRuntime(root: HTMLElement | null) {
  if (!root) return () => { };

  let frameId = 0;
  const sync = () => {
    frameId = 0;
    ensureStudioNativeColorInputs(root);
    syncStudioColorFieldVisualState(root);
  };
  const scheduleSync = () => {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(sync);
  };

  const observer = new MutationObserver(scheduleSync);
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'value', 'class'],
  });

  root.addEventListener('input', scheduleSync, true);
  root.addEventListener('change', scheduleSync, true);
  root.addEventListener('click', scheduleSync, true);
  root.addEventListener('focusin', scheduleSync, true);

  scheduleSync();

  return () => {
    if (frameId) cancelAnimationFrame(frameId);
    observer.disconnect();
    root.removeEventListener('input', scheduleSync, true);
    root.removeEventListener('change', scheduleSync, true);
    root.removeEventListener('click', scheduleSync, true);
    root.removeEventListener('focusin', scheduleSync, true);
  };
}

function bindStudioEnterCommitRuntime(root: HTMLElement | null) {
  if (!root) return () => { };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || event.isComposing) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

    const target = event.target;
    if (!isStudioEnterCommitField(target)) return;
    if (target instanceof HTMLInputElement && target.closest('.gjs-field-color')) return;

    event.preventDefault();
    event.stopPropagation();

    target.dispatchEvent(new Event('change', { bubbles: true }));
    requestAnimationFrame(() => {
      target.blur();
    });
  };

  root.addEventListener('keydown', handleKeyDown, true);

  return () => {
    root.removeEventListener('keydown', handleKeyDown, true);
  };
}

// GrapesJS style manager sector config matching the reference screenshots
// ─── SVG icon helpers for style property radio buttons ───────────────────────
// GrapesJS renders option.name as innerHTML of <label>, so SVG strings work.

function svgIcon(path: string, w = 14, h = 14) {
  return `<svg width="${w}" height="${h}" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">${path}</svg>`;
}

const SI = {
  // flex-direction
  flexRow: svgIcon(
    '<path d="M4 11h12.17l-5.59-5.59L12 4l8 8-8 8-1.41-1.41L16.17 13H4v-2z"/>',
  ),
  flexCol: svgIcon(
    '<path d="M13 4v12.17l5.59-5.59L20 12l-8 8-8-8 1.41-1.41L11 16.17V4h2z"/>',
  ),
  flexRowRev: svgIcon(
    '<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>',
  ),
  flexColRev: svgIcon(
    '<path d="M11 20V7.83l-5.59 5.59L4 12l8-8 8 8-1.41 1.41L13 7.83V20h-2z"/>',
  ),
  // justify-content (horizontal item placement)
  jcStart: svgIcon(
    '<rect x="2" y="5" width="7" height="14" rx="1.5"/><rect x="11" y="5" width="7" height="14" rx="1.5"/>',
  ),
  jcCenter: svgIcon(
    '<rect x="2.5" y="5" width="7" height="14" rx="1.5"/><rect x="14.5" y="5" width="7" height="14" rx="1.5"/>',
  ),
  jcEnd: svgIcon(
    '<rect x="8" y="5" width="7" height="14" rx="1.5"/><rect x="17" y="5" width="7" height="14" rx="1.5"/>',
  ),
  jcBetween: svgIcon(
    '<rect x="2" y="5" width="7" height="14" rx="1.5"/><rect x="15" y="5" width="7" height="14" rx="1.5"/>',
  ),
  jcAround: svgIcon(
    '<rect x="2" y="5" width="5.5" height="14" rx="1.5"/><rect x="9.5" y="5" width="5.5" height="14" rx="1.5"/><rect x="17" y="5" width="5.5" height="14" rx="1.5"/>',
  ),
  // align-items (cross-axis / vertical alignment)
  aiStart: svgIcon(
    '<rect x="3" y="2" width="7" height="15" rx="1.5"/><rect x="14" y="2" width="7" height="10" rx="1.5"/>',
  ),
  aiCenter: svgIcon(
    '<rect x="3" y="5" width="7" height="14" rx="1.5"/><rect x="14" y="8" width="7" height="8" rx="1.5"/>',
  ),
  aiEnd: svgIcon(
    '<rect x="3" y="7" width="7" height="15" rx="1.5"/><rect x="14" y="12" width="7" height="10" rx="1.5"/>',
  ),
  aiStretch: svgIcon(
    '<rect x="3" y="2" width="7" height="20" rx="1.5"/><rect x="14" y="2" width="7" height="20" rx="1.5"/>',
  ),
  // text-align
  taLeft: svgIcon(
    '<rect x="3" y="4" width="14" height="2.5" rx="1"/><rect x="3" y="9" width="18" height="2.5" rx="1"/><rect x="3" y="14" width="10" height="2.5" rx="1"/>',
  ),
  taCenter: svgIcon(
    '<rect x="5" y="4" width="14" height="2.5" rx="1"/><rect x="3" y="9" width="18" height="2.5" rx="1"/><rect x="6.5" y="14" width="11" height="2.5" rx="1"/>',
  ),
  taRight: svgIcon(
    '<rect x="7" y="4" width="14" height="2.5" rx="1"/><rect x="3" y="9" width="18" height="2.5" rx="1"/><rect x="11" y="14" width="10" height="2.5" rx="1"/>',
  ),
  taJustify: svgIcon(
    '<rect x="3" y="4" width="18" height="2.5" rx="1"/><rect x="3" y="9" width="18" height="2.5" rx="1"/><rect x="3" y="14" width="13" height="2.5" rx="1"/>',
  ),
};

const STYLE_SECTORS = [
  {
    name: 'Layout',
    open: true,
    properties: [
      {
        property: 'display',
        type: 'select',
        options: [
          { id: 'block', name: 'Block' },
          { id: 'flex', name: 'Flex' },
          { id: 'grid', name: 'Grid' },
          { id: 'inline-flex', name: 'Inline Flex' },
          { id: 'inline-block', name: 'Inline Block' },
          { id: 'inline', name: 'Inline' },
          { id: 'none', name: 'Hidden' },
        ],
      },
      {
        property: 'flex-direction',
        type: 'radio',
        options: [
          { id: 'row', name: SI.flexRow },
          { id: 'column', name: SI.flexCol },
          { id: 'row-reverse', name: SI.flexRowRev },
          { id: 'column-reverse', name: SI.flexColRev },
        ],
      },
      {
        property: 'justify-content',
        type: 'radio',
        options: [
          { id: 'flex-start', name: SI.jcStart },
          { id: 'center', name: SI.jcCenter },
          { id: 'flex-end', name: SI.jcEnd },
          { id: 'space-between', name: SI.jcBetween },
          { id: 'space-around', name: SI.jcAround },
        ],
      },
      {
        property: 'align-items',
        type: 'radio',
        options: [
          { id: 'flex-start', name: SI.aiStart },
          { id: 'center', name: SI.aiCenter },
          { id: 'flex-end', name: SI.aiEnd },
          { id: 'stretch', name: SI.aiStretch },
        ],
      },
      {
        property: 'flex-wrap',
        type: 'select',
        options: [
          { id: 'nowrap', name: 'No Wrap' },
          { id: 'wrap', name: 'Wrap' },
          { id: 'wrap-reverse', name: 'Wrap Reverse' },
        ],
      },
      { property: 'gap', type: 'integer' },
      {
        property: 'position',
        type: 'select',
        options: [
          { id: 'static', name: 'Static' },
          { id: 'relative', name: 'Relative' },
          { id: 'absolute', name: 'Absolute' },
          { id: 'fixed', name: 'Fixed' },
          { id: 'sticky', name: 'Sticky' },
        ],
      },
      { property: 'top', type: 'integer' },
      { property: 'right', type: 'integer' },
      { property: 'bottom', type: 'integer' },
      { property: 'left', type: 'integer' },
      { property: 'z-index', type: 'integer' },
    ],
  },
  {
    name: 'Size',
    open: true,
    properties: [
      'width',
      'height',
      'min-width',
      'max-width',
      'min-height',
      'max-height',
      {
        property: 'overflow',
        type: 'select',
        options: [
          { id: 'visible', name: 'Visible' },
          { id: 'hidden', name: 'Hidden' },
          { id: 'scroll', name: 'Scroll' },
          { id: 'auto', name: 'Auto' },
        ],
      },
    ],
  },
  {
    name: 'Space',
    open: true,
    properties: ['margin', 'padding'],
  },
  {
    name: 'Typography',
    open: true,
    properties: [
      { property: 'color', type: 'color' },
      { property: 'font-size', type: 'base' },
      {
        property: 'font-weight',
        type: 'select',
        options: [
          { id: '', name: 'Default' },
          { id: '300', name: 'Light' },
          { id: '400', name: 'Normal' },
          { id: '500', name: 'Medium' },
          { id: '600', name: 'SemiBold' },
          { id: '700', name: 'Bold' },
          { id: '800', name: 'ExtraBold' },
        ],
      },
      { property: 'line-height', type: 'base' },
      { property: 'letter-spacing', type: 'base' },
      {
        property: 'text-align',
        type: 'radio',
        options: [
          { id: 'left', name: SI.taLeft },
          { id: 'center', name: SI.taCenter },
          { id: 'right', name: SI.taRight },
          { id: 'justify', name: SI.taJustify },
        ],
      },
      {
        property: 'vertical-align',
        type: 'select',
        options: [
          { id: '', name: 'Default' },
          { id: 'baseline', name: 'Baseline' },
          { id: 'top', name: 'Top' },
          { id: 'middle', name: 'Middle' },
          { id: 'bottom', name: 'Bottom' },
        ],
      },
      {
        property: 'text-transform',
        type: 'select',
        options: [
          { id: '', name: 'Default' },
          { id: 'none', name: 'None' },
          { id: 'uppercase', name: 'UPPERCASE' },
          { id: 'lowercase', name: 'lowercase' },
          { id: 'capitalize', name: 'Capitalize' },
        ],
      },
      {
        property: 'text-decoration',
        type: 'select',
        options: [
          { id: '', name: 'Default' },
          { id: 'none', name: 'None' },
          { id: 'underline', name: 'Underline' },
          { id: 'line-through', name: 'Strikethrough' },
        ],
      },
      { property: 'font-family', type: 'base' },
    ],
  },
  {
    name: 'Background',
    open: true,
    properties: [{ property: 'background-color', type: 'color' }],
  },
  {
    name: 'Borders',
    open: true,
    properties: [
      { property: 'border-radius', type: 'integer' },
      'border',
      'border-top',
      'border-right',
      'border-bottom',
      'border-left',
    ],
  },
  {
    name: 'Effects',
    open: true,
    properties: [
      { property: 'filter', type: 'base' },
      { property: 'transition', type: 'base' },
      { property: 'transform', type: 'base' },
      { property: 'opacity', type: 'slider', min: 0, max: 1, step: 0.01 },
      { property: 'box-shadow', type: 'base' },
      {
        property: 'cursor',
        type: 'select',
        options: [
          { id: 'default', name: 'Default' },
          { id: 'pointer', name: 'Pointer' },
          { id: 'text', name: 'Text' },
          { id: 'grab', name: 'Grab' },
          { id: 'not-allowed', name: 'Not Allowed' },
        ],
      },
    ],
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function LandingPageEditorFullscreen() {
  const t = useTranslations('siteStudio.editor');
  const commonT = useTranslations('common');
  const mediaT = useTranslations('siteStudio.media');
  const { tenantSlug, tenantId } = useTenant();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');
  const fromActive = searchParams.get('fromActive') === 'true';
  const initialEditorSource: LandingPageEditorSource = fromActive
    ? 'active'
    : templateId
      ? 'template'
      : 'scratch';

  const ctx = useServiceContext();
  const qc = useQueryClient();
  const templatesQuery = useTemplatesQuery(tenantId);
  const landingPageQuery = useLandingPageQuery(tenantSlug);
  const landingPageDraftQuery = useLandingPageDraftQuery(tenantId);
  const mediaAssetsQuery = useMediaAssetsQuery(tenantSlug);
  const upsertMutation = useUpsertLandingPageMutation(tenantSlug);
  const upsertDraftMutation = useUpsertLandingPageDraftMutation(tenantId);
  const createTemplateMutation = useCreateTemplateMutation(tenantId);

  const initialTemplateIdRef = useRef(templateId);
  const initialFromActiveRef = useRef(fromActive);
  const initialEditorSourceRef = useRef(initialEditorSource);
  const currentTemplateIdRef = useRef<string | null>(templateId);
  const sessionScopeRef = useRef(tenantId ?? tenantSlug ?? 'unknown-tenant');
  const scratchSessionScopeRef = sessionScopeRef;
  const scratchSessionReloadRef = useRef(false);
  const scratchSessionBootstrapRef = useRef<ScratchDraftSessionSnapshot | null>(null);
  const aiConversationSessionReloadRef = useRef(false);
  const draftBootstrapRef = useRef(landingPageDraftQuery.data ?? null);
  const landingPageBootstrapRef = useRef(landingPageQuery.data ?? null);
  const templatesBootstrapRef = useRef(templatesQuery.data ?? null);
  const defaultTemplateName = t('defaultTemplateName');
  const aiAssistantPlaceholder = t('aiPlaceholder');
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(templateId);
  const [editorSource, setEditorSource] =
    useState<LandingPageEditorSource>(initialEditorSource);

  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [rightTab, setRightTab] = useState<RightTabId>('styles');
  const [leftPanel, setLeftPanel] = useState<LeftPanelId>('blocks');
  const [device, setDevice] = useState<DeviceType>('Desktop');
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [showSaveNameDialog, setShowSaveNameDialog] = useState(false);
  const [pendingTemplateName, setPendingTemplateName] = useState(defaultTemplateName);
  const [isRenamingTemplate, setIsRenamingTemplate] = useState(false);
  const [templateNameEdit, setTemplateNameEdit] = useState('');
  const [codeHtml, setCodeHtml] = useState('');
  const [codeCss, setCodeCss] = useState('');
  const [editorReady, setEditorReady] = useState(false);
  const [showOutlines, setShowOutlines] = useState(false);
  const [styleSelectionMeta, setStyleSelectionMeta] = useState<StyleSelectionMeta | null>(
    null,
  );
  const [currentTemplateName, setCurrentTemplateName] = useState(defaultTemplateName);
  const rightTabRef = useRef<RightTabId>('styles');

  // ─── AI panel state ───────────────────────────────────────────────────────
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState<AiConversationMessage[]>([]);
  const [aiStreaming, setAiStreaming] = useState(false);
  const [aiSelectionTarget, setAiSelectionTarget] = useState<AiSelectionTarget | null>(
    null,
  );
  const [customApiKey, setCustomApiKey] = useState<string>(() =>
    typeof window !== 'undefined'
      ? (localStorage.getItem('iccp_gemini_custom_key') ?? '')
      : '',
  );
  const [showKeyInput, setShowKeyInput] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const htmlAccumRef = useRef('');
  const pendingAiDraftRef = useRef<PendingAiDraftState | null>(null);
  const aiScrollRef = useRef<HTMLDivElement>(null);
  const saveNameInputRef = useRef<HTMLInputElement>(null);
  const renameTemplateInputRef = useRef<HTMLInputElement>(null);
  const [pendingAiDraftMessageId, setPendingAiDraftMessageId] = useState<string | null>(
    null,
  );
  const [draftRevision, setDraftRevision] = useState(0);
  const [aiConversationSessionHydrated, setAiConversationSessionHydrated] =
    useState(false);
  const lastDraftSnapshotRef = useRef('');
  const lastOversizedDraftSnapshotRef = useRef('');
  const documentUndoSnapshotRef = useRef<EditorDocumentSnapshot | null>(null);
  const documentRedoSnapshotRef = useRef<EditorDocumentSnapshot | null>(null);
  const documentReplacementStateRef = useRef<'idle' | 'applied' | 'undone'>('idle');
  const documentReplacementGuardRef = useRef(false);

  const mediaAssets: MediaAsset[] = mediaAssetsQuery.data ?? [];
  const canModifyCurrentPage = hasMeaningfulEditorContent(
    editorRef.current?.getHtml() ?? '',
  );
  const publicLandingPagePath = tenantSlug ? getPublicLandingPagePath(tenantSlug) : null;
  const getDeviceLabel = useCallback(
    (value: DeviceType) => {
      switch (value) {
        case 'Desktop':
          return t('topbar.desktop');
        case 'Tablet':
          return t('topbar.tablet');
        case 'Mobile':
          return t('topbar.mobile');
      }
    },
    [t],
  );
  const aiCompletionMessages = {
    targetPartial: (values: { label: string }) => t('ai.messages.completion.targetPartial', values),
    targetDone: (values: { label: string }) => t('ai.messages.completion.targetDone', values),
    modifyPartial: () => t('ai.messages.completion.modifyPartial'),
    modifyDone: () => t('ai.messages.completion.modifyDone'),
    generatePartial: () => t('ai.messages.completion.generatePartial'),
    generateDone: () => t('ai.messages.completion.generateDone'),
  };
  const aiAppliedMessages = {
    targetPartial: (values: { label: string }) => t('ai.messages.applied.targetPartial', values),
    targetDone: (values: { label: string }) => t('ai.messages.applied.targetDone', values),
    modifyPartial: () => t('ai.messages.applied.modifyPartial'),
    modifyDone: () => t('ai.messages.applied.modifyDone'),
    generatePartial: () => t('ai.messages.applied.generatePartial'),
    generateDone: () => t('ai.messages.applied.generateDone'),
  };

  // Mount refs for GrapesJS managers — ALWAYS in DOM (hidden via CSS when inactive)
  const stylesMountRef = useRef<HTMLDivElement>(null);
  const traitsMountRef = useRef<HTMLDivElement>(null);
  const layersMountRef = useRef<HTMLDivElement>(null);
  const blocksMountRef = useRef<HTMLDivElement>(null);
  const selectorMountRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [streamingEllipsis, setStreamingEllipsis] = useState(1);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    currentTemplateIdRef.current = currentTemplateId;
  }, [currentTemplateId]);
  useEffect(() => {
    rightTabRef.current = rightTab;
  }, [rightTab]);
  useEffect(() => {
    const templateRecord = templatesQuery.data?.find(
      (template) => template.id === currentTemplateId,
    );
    if (templateRecord?.name) {
      setCurrentTemplateName(templateRecord.name);
      return;
    }

    if (!currentTemplateId) {
      setCurrentTemplateName(defaultTemplateName);
    }
  }, [currentTemplateId, defaultTemplateName, templatesQuery.data]);
  useEffect(() => {
    if (!showSaveNameDialog) return;

    window.setTimeout(() => {
      saveNameInputRef.current?.focus();
      saveNameInputRef.current?.select();
    }, 0);
  }, [showSaveNameDialog]);
  useEffect(() => {
    if (!isRenamingTemplate) return;

    window.setTimeout(() => {
      renameTemplateInputRef.current?.focus();
      renameTemplateInputRef.current?.select();
    }, 0);
  }, [isRenamingTemplate]);
  draftBootstrapRef.current = landingPageDraftQuery.data ?? null;
  landingPageBootstrapRef.current = landingPageQuery.data ?? null;
  templatesBootstrapRef.current = templatesQuery.data ?? null;
  useEffect(() => {
    if (!mounted) return;
    if (initialEditorSourceRef.current !== 'scratch') return;

    const scope = scratchSessionScopeRef.current;
    const reloadKey = getScratchDraftReloadStorageKey(scope);
    const preservedForReload = window.sessionStorage.getItem(reloadKey) === '1';
    window.sessionStorage.removeItem(reloadKey);
    scratchSessionReloadRef.current = false;

    if (preservedForReload) {
      scratchSessionBootstrapRef.current = readScratchDraftSessionSnapshot(scope);
    } else {
      scratchSessionBootstrapRef.current = null;
      clearScratchDraftSessionSnapshot(scope);
    }

    const handleBeforeUnload = () => {
      scratchSessionReloadRef.current = true;
      window.sessionStorage.setItem(reloadKey, '1');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (!scratchSessionReloadRef.current) {
        scratchSessionBootstrapRef.current = null;
        clearScratchDraftSessionSnapshot(scope);
      }
    };
  }, [mounted]);
  useEffect(() => {
    if (!mounted) return;

    const scope = sessionScopeRef.current;
    const reloadKey = getAiConversationReloadStorageKey(scope);
    const preservedForReload = window.sessionStorage.getItem(reloadKey) === '1';
    window.sessionStorage.removeItem(reloadKey);
    aiConversationSessionReloadRef.current = false;

    if (preservedForReload) {
      const snapshot = readAiConversationSessionSnapshot(scope);
      if (snapshot) {
        setAiMessages(snapshot.messages);
        pendingAiDraftRef.current = snapshot.pendingDraft ?? null;
        setPendingAiDraftMessageId(snapshot.pendingDraft?.messageId ?? null);
      } else {
        pendingAiDraftRef.current = null;
        setPendingAiDraftMessageId(null);
      }
    } else {
      pendingAiDraftRef.current = null;
      setPendingAiDraftMessageId(null);
      clearAiConversationSessionSnapshot(scope);
    }
    setAiConversationSessionHydrated(true);

    const handleBeforeUnload = () => {
      aiConversationSessionReloadRef.current = true;
      window.sessionStorage.setItem(reloadKey, '1');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (!aiConversationSessionReloadRef.current) {
        pendingAiDraftRef.current = null;
        clearAiConversationSessionSnapshot(scope);
      }
    };
  }, [mounted]);
  useEffect(() => {
    const el = aiScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [aiMessages]);
  useEffect(() => {
    if (!mounted || !aiConversationSessionHydrated) return;

    const scope = sessionScopeRef.current;
    const pendingDraft = pendingAiDraftRef.current;
    if (aiMessages.length === 0 && !pendingDraft) {
      clearAiConversationSessionSnapshot(scope);
      return;
    }

    writeAiConversationSessionSnapshot(scope, {
      messages: aiMessages,
      pendingDraft,
    });
  }, [aiConversationSessionHydrated, aiMessages, mounted, pendingAiDraftMessageId]);
  useEffect(() => {
    if (!aiStreaming) {
      setStreamingEllipsis(1);
      return;
    }

    const interval = window.setInterval(() => {
      setStreamingEllipsis((current) => (current >= 3 ? 1 : current + 1));
    }, 420);

    return () => {
      window.clearInterval(interval);
    };
  }, [aiStreaming]);

  const syncCanvasFrameLayout = useCallback(
    (targetDevice: DeviceType = device) => {
      const editor = editorRef.current;
      const canvasArea = canvasAreaRef.current;
      if (!editor || !canvasArea) return;

      const framesRoot = editor.Canvas.getFramesEl();
      const frameWrapper = framesRoot?.querySelector<HTMLElement>('.gjs-frame-wrapper');
      const frameElement = editor.Canvas.getFrameEl();
      if (!frameWrapper || !frameElement) return;

      if (targetDevice === 'Desktop') {
        const availableWidth = Math.max(canvasArea.clientWidth - 36, 320);
        const previewWidth = Math.min(1366, availableWidth);

        frameWrapper.style.width = `${previewWidth}px`;
        frameWrapper.style.maxWidth = '1366px';
        frameWrapper.style.left = '0';
        frameWrapper.style.right = '0';
        frameWrapper.style.margin = '0 auto';
        frameWrapper.style.height = '100%';
        frameElement.style.width = '100%';
        frameElement.style.maxWidth = '100%';
      } else {
        frameWrapper.style.removeProperty('width');
        frameWrapper.style.removeProperty('max-width');
        frameWrapper.style.removeProperty('left');
        frameWrapper.style.removeProperty('right');
        frameWrapper.style.removeProperty('margin');
        frameWrapper.style.removeProperty('height');
        frameElement.style.removeProperty('width');
        frameElement.style.removeProperty('max-width');
      }

      editor.Canvas.setZoom(100, { from: 'iccp-frame-layout' });
      editor.Canvas.setCoords(0, 0);
      editor.Canvas.refresh({ all: true });
    },
    [device],
  );

  // ─── AI handlers ──────────────────────────────────────────────────────────

  const handleAiSubmit = useCallback(() => {
    if (!aiPrompt.trim() || aiStreaming) return;

    const editor = editorRef.current;
    const selectionTarget = aiSelectionTarget;
    if (selectionTarget && selectionTarget.count > 1 && !selectionTarget.parentId) {
      toast.danger(t('ai.messages.multiBlockSameParent'));
      return;
    }
    const resolvedSelectionComponents =
      selectionTarget && editor
        ? normalizeSelectedComponents(
          resolveSelectionTargetFromIds(editor, selectionTarget.componentIds),
        )
        : [];
    if (selectionTarget && resolvedSelectionComponents.length === 0) {
      toast.danger(t('ai.messages.selectionMissing'));
      return;
    }
    const selectionHtml =
      selectionTarget && resolvedSelectionComponents.length > 0
        ? serializeSelectedComponentsHtml(resolvedSelectionComponents)
        : undefined;

    const editorSnapshot = editor ? captureEditorDocumentSnapshot(editor) : null;
    const editorHtml = editor?.getHtml() ?? '';
    const submittedPrompt = aiPrompt.trim();
    const targetScope: AiTargetScope = selectionTarget ? 'selection' : 'page';
    const requestedMode: AiGenerationMode =
      targetScope === 'selection'
        ? 'modify'
        : hasMeaningfulEditorContent(editorHtml)
          ? 'modify'
          : 'generate';
    const currentHtml =
      targetScope === 'selection'
        ? selectionHtml
        : requestedMode === 'modify' && editorSnapshot
          ? editorSnapshot.rawHtml
          : undefined;
    const userMessageId = createAiMessageId();
    const assistantMessageId = createAiMessageId();
    const priorConversation = serializeConversation(aiMessages);

    const detectedPrimaryColor = (() => {
      if (!editor) return null;
      try {
        // 1. Try CSS rules first (most reliable — set by GlobalStylesPanel)
        const rootRule = editor.Css.getRules().find(
          (rule) => rule.selectorsToString({ skipState: true }).trim() === ':root',
        );
        if (rootRule) {
          const style = rootRule.getStyle() as Record<string, string>;
          const color = style['--theme-primary'] || style['--primary'];
          if (color && /^#[0-9a-fA-F]{3,8}$/.test(color.trim())) return color.trim();
        }
        // 2. Fallback: computed style from canvas iframe
        const canvasWin = editor.Canvas.getWindow();
        if (canvasWin) {
          const computed = canvasWin.getComputedStyle(canvasWin.document.documentElement);
          for (const prop of [
            '--theme-primary',
            '--primary',
            '--primary-color',
            '--color-primary',
            '--brand',
          ]) {
            const color = computed.getPropertyValue(prop).trim();
            if (color && /^#[0-9a-fA-F]{3,8}$/.test(color)) return color;
          }
        }
        // 3. Last resort: scan the CSS text for first :root variable that looks like a hex color
        if (currentHtml) {
          const rootBlock = currentHtml.match(/:root\s*\{([^}]+)\}/)?.[1] ?? '';
          const match = rootBlock.match(
            /--(?:primary|brand|accent|color)[^:]*:\s*(#[0-9a-fA-F]{3,8})/i,
          );
          if (match) return match[1];
        }
      } catch {
        // ignore
      }
      return null;
    })();

    const orgContext: OrgContext = {
      name: tenantSlug,
      slug: tenantSlug,
      primary_color: detectedPrimaryColor,
    };

    abortRef.current = new AbortController();
    htmlAccumRef.current = '';
    pendingAiDraftRef.current = null;
    setPendingAiDraftMessageId(null);
    setAiStreaming(true);
    setAiPrompt('');
    if (selectionTarget && editor) {
      editor.select();
      setAiSelectionTarget(null);
    }
    setAiMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: 'user',
        content: submittedPrompt,
        mode: requestedMode,
        selectionLabel: selectionTarget?.label,
      },
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        mode: requestedMode,
        status: 'streaming',
      },
    ]);

    const svc = new LandingPageAiService(ctx);
    svc.streamGenerate(
      {
        org_context: orgContext,
        conversation: priorConversation,
        mode: requestedMode,
        user_prompt: buildLandingPageAiPrompt(
          submittedPrompt,
          requestedMode,
          selectionTarget,
          selectionHtml,
        ),
        current_html: currentHtml,
        custom_api_key: customApiKey || undefined,
      },
      (token) => {
        htmlAccumRef.current += token;
      },
      (result) => {
        abortRef.current = null;
        setAiStreaming(false);
        void qc.invalidateQueries({ queryKey: chatbotKeys.quota(ctx.tenantId) });
        const renderableHtml =
          targetScope === 'selection'
            ? resolveRenderableSelectionDraftHtml(htmlAccumRef.current)
            : resolveRenderableDraftHtml(htmlAccumRef.current);
        const tokensUsed = result?.tokensUsed;
        pendingAiDraftRef.current = renderableHtml
          ? {
            messageId: assistantMessageId,
            mode: requestedMode,
            html: renderableHtml,
            partial: false,
            scope: targetScope,
            selectionTarget,
            ...(typeof tokensUsed === 'number' ? { tokensUsed } : {}),
          }
          : null;
        setPendingAiDraftMessageId(renderableHtml ? assistantMessageId : null);
        setAiMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId
              ? {
                ...message,
                content: appendAiMessageLine(
                  message.content,
                  renderableHtml
                    ? buildAiCompletionMessage(
                      requestedMode,
                      false,
                      selectionTarget,
                      aiCompletionMessages,
                    )
                    : t('ai.messages.modelStopped'),
                ),
                status: renderableHtml ? 'done' : 'error',
                ...(typeof tokensUsed === 'number' ? { tokensUsed } : {}),
              }
              : message,
          ),
        );
      },
      (msg) => {
        abortRef.current = null;
        setAiStreaming(false);
        pendingAiDraftRef.current = null;
        setPendingAiDraftMessageId(null);
        setAiMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId
              ? {
                ...message,
                content: appendAiMessageLine(message.content, msg),
                status: 'error',
              }
              : message,
          ),
        );
      },
      abortRef.current.signal,
      (statusMessage) => {
        setAiMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId
              ? {
                ...message,
                content: appendAiMessageLine(message.content, statusMessage),
                status: 'streaming',
              }
              : message,
          ),
        );
      },
      // onReplace: backend sanitized the full HTML (fixed DOCTYPE, stripped fences)
      (sanitizedHtml) => {
        if (targetScope === 'selection') return;

        const currentMetrics = getRenderableDraftMetrics(htmlAccumRef.current);
        const sanitizedMetrics = getRenderableDraftMetrics(sanitizedHtml);

        if (!sanitizedMetrics && currentMetrics) {
          return;
        }

        if (
          currentMetrics &&
          sanitizedMetrics &&
          sanitizedMetrics.htmlLength < currentMetrics.htmlLength * 0.2 &&
          sanitizedMetrics.textLength < currentMetrics.textLength * 0.2
        ) {
          return;
        }

        htmlAccumRef.current = sanitizedHtml;
      },
    );
  }, [
    aiSelectionTarget,
    aiMessages,
    aiPrompt,
    aiStreaming,
    ctx,
    customApiKey,
    qc,
    tenantSlug,
  ]);

  const handleAiStop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setAiStreaming(false);
    setAiMessages((prev) => {
      const next = [...prev];
      for (let index = next.length - 1; index >= 0; index -= 1) {
        const message = next[index];
        if (message.role === 'assistant' && message.status === 'streaming') {
          const renderableHtml = aiSelectionTarget
            ? resolveRenderableSelectionDraftHtml(htmlAccumRef.current)
            : resolveRenderableDraftHtml(htmlAccumRef.current);
          if (renderableHtml) {
            pendingAiDraftRef.current = {
              messageId: message.id,
              mode: message.mode ?? 'generate',
              html: renderableHtml,
              partial: true,
              scope: aiSelectionTarget ? 'selection' : 'page',
              selectionTarget: aiSelectionTarget,
            };
            setPendingAiDraftMessageId(message.id);
          } else {
            pendingAiDraftRef.current = null;
            setPendingAiDraftMessageId(null);
          }
          next[index] = {
            ...message,
            content: appendAiMessageLine(
              message.content,
              renderableHtml
                ? buildAiCompletionMessage(
                  message.mode ?? 'generate',
                  true,
                  aiSelectionTarget,
                  aiCompletionMessages,
                )
                : t('ai.messages.generationStoppedInvalid'),
            ),
            status: 'stopped',
          };
          break;
        }
      }
      return next;
    });
  }, [aiSelectionTarget]);

  const scheduleReplacementGuardRelease = useCallback(() => {
    window.setTimeout(() => {
      documentReplacementGuardRef.current = false;
    }, 250);
  }, []);

  const replaceCanvasDocument = useCallback(
    (fullHtml: string, options?: { allowEmpty?: boolean }) => {
      const editor = editorRef.current;
      if (!editor) return false;
      const renderableHtml = resolveRenderableDraftHtml(fullHtml);
      if (!options?.allowEmpty && !renderableHtml) {
        toast.danger(t('ai.messages.missingRenderablePage'));
        return false;
      }

      documentUndoSnapshotRef.current = captureEditorDocumentSnapshot(editor);
      documentReplacementGuardRef.current = true;
      applyAiHtmlToCanvas(editor, renderableHtml ?? fullHtml);
      documentRedoSnapshotRef.current = captureEditorDocumentSnapshot(editor);
      documentReplacementStateRef.current = 'applied';
      requestAnimationFrame(() => {
        syncStyleManagerTarget(editor);
      });
      scheduleReplacementGuardRelease();
      return true;
    },
    [scheduleReplacementGuardRelease],
  );

  const replaceSelectedComponents = useCallback(
    (selectionTarget: AiSelectionTarget, fullHtml: string) => {
      const editor = editorRef.current;
      if (!editor) return false;

      const targetComponents = normalizeSelectedComponents(
        resolveSelectionTargetFromIds(editor, selectionTarget.componentIds),
      );

      if (!targetComponents.length) {
        toast.danger(t('ai.messages.selectionMissing'));
        return false;
      }

      const parent = targetComponents[0]?.parent();
      if (
        !parent ||
        targetComponents.some((component) => component.parent() !== parent)
      ) {
        toast.danger(t('ai.messages.multiBlockUpdateSameParent'));
        return false;
      }

      const { html: fragmentHtml, css: fragmentCss } = splitHtmlAndCss(fullHtml);
      if (!hasRenderableMarkup(fragmentHtml)) {
        toast.danger(t('ai.messages.missingRenderableBlock'));
        return false;
      }

      const collection = parent.components();
      const orderedTargets = [...targetComponents].sort(
        (left, right) =>
          collection.models.indexOf(left) - collection.models.indexOf(right),
      );
      const insertAt = collection.models.indexOf(orderedTargets[0]);

      documentUndoSnapshotRef.current = captureEditorDocumentSnapshot(editor);
      documentReplacementGuardRef.current = true;

      [...orderedTargets]
        .sort(
          (left, right) =>
            collection.models.indexOf(right) - collection.models.indexOf(left),
        )
        .forEach((component) => component.remove());

      const inserted = collection.add(fragmentHtml, { at: insertAt });
      if (fragmentCss.trim()) {
        const existingCss = getEditorDocumentCss(editor);
        injectCanvasCss(editor, [existingCss, fragmentCss].filter(Boolean).join('\n\n'));
      }

      const insertedComponents = Array.isArray(inserted) ? inserted : [inserted];
      editor.select(insertedComponents);
      documentRedoSnapshotRef.current = captureEditorDocumentSnapshot(editor);
      documentReplacementStateRef.current = 'applied';
      requestAnimationFrame(() => {
        syncStyleManagerTarget(editor);
      });
      scheduleReplacementGuardRelease();
      return true;
    },
    [scheduleReplacementGuardRelease],
  );

  const handleEditorUndo = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (
      documentReplacementStateRef.current === 'applied' &&
      documentUndoSnapshotRef.current
    ) {
      documentReplacementGuardRef.current = true;
      restoreEditorDocument(
        editor,
        documentUndoSnapshotRef.current.rawHtml,
        documentUndoSnapshotRef.current.projectData,
      );
      documentReplacementStateRef.current = 'undone';
      requestAnimationFrame(() => {
        syncStyleManagerTarget(editor);
      });
      scheduleReplacementGuardRelease();
      return;
    }

    editor.UndoManager.undo();
    requestAnimationFrame(() => {
      syncStyleManagerTarget(editor);
    });
  }, [scheduleReplacementGuardRelease]);

  const handleEditorRedo = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (
      documentReplacementStateRef.current === 'undone' &&
      documentRedoSnapshotRef.current
    ) {
      documentReplacementGuardRef.current = true;
      restoreEditorDocument(
        editor,
        documentRedoSnapshotRef.current.rawHtml,
        documentRedoSnapshotRef.current.projectData,
      );
      documentReplacementStateRef.current = 'applied';
      requestAnimationFrame(() => {
        syncStyleManagerTarget(editor);
      });
      scheduleReplacementGuardRelease();
      return;
    }

    editor.UndoManager.redo();
    requestAnimationFrame(() => {
      syncStyleManagerTarget(editor);
    });
  }, [scheduleReplacementGuardRelease]);

  const handleApplyAiDraft = useCallback(() => {
    const draft = pendingAiDraftRef.current;
    if (!draft) return;

    const applied =
      draft.scope === 'selection' && draft.selectionTarget
        ? replaceSelectedComponents(draft.selectionTarget, draft.html)
        : replaceCanvasDocument(draft.html);
    if (!applied) return;

    pendingAiDraftRef.current = null;
    setPendingAiDraftMessageId(null);
    setAiMessages((prev) =>
      prev.map((message) =>
        message.id === draft.messageId
          ? {
            ...message,
            content: appendAiMessageLine(
              message.content,
              buildAiAppliedMessage(
                draft.mode,
                draft.partial,
                draft.selectionTarget,
                aiAppliedMessages,
              ),
            ),
            status: 'done',
          }
          : message,
      ),
    );
  }, [replaceCanvasDocument, replaceSelectedComponents]);

  const buildDraftPayload = useCallback((): UpsertLandingPageDraftBody | null => {
    const editor = editorRef.current;
    if (!editor) return null;
    if (editorSource === 'scratch') return null;

    const html = editor.getHtml() ?? '';
    const css = getEditorDocumentCss(editor);
    const rawHtml = combineHtmlCss(html, css);
    const projectData = JSON.stringify({
      ...editor.getProjectData(),
      __rawCss: css,
    });

    const hasCanvasContent = Boolean(html.trim() || css.trim());
    const hasTemplateContext = Boolean(currentTemplateIdRef.current);

    if (!hasCanvasContent && !hasTemplateContext) {
      return null;
    }

    return {
      rawHtml,
      projectData,
      currentTemplateId: currentTemplateIdRef.current,
      source: editorSource,
    };
  }, [editorSource]);

  const handleAiKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAiSubmit();
      }
    },
    [handleAiSubmit],
  );

  useEffect(() => {
    if (!editorReady || !tenantId) return;

    const timeoutId = window.setTimeout(() => {
      if (upsertDraftMutation.isPending) return;

      const payload = buildDraftPayload();
      const serializedPayload = payload ? JSON.stringify(payload) : '';

      if (serializedPayload === lastDraftSnapshotRef.current) return;

      if (!payload) {
        lastDraftSnapshotRef.current = '';
        return;
      }

      if (isLandingPagePayloadTooLarge(serializedPayload)) {
        if (lastOversizedDraftSnapshotRef.current !== serializedPayload) {
          lastOversizedDraftSnapshotRef.current = serializedPayload;
          toast.danger(
            t('toasts.draftTooLarge'),
          );
        }
        return;
      }

      lastOversizedDraftSnapshotRef.current = '';

      void upsertDraftMutation.mutateAsync(payload).then((result) => {
        if (isOk(result)) {
          lastDraftSnapshotRef.current = serializedPayload;
        }
      });
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    buildDraftPayload,
    currentTemplateId,
    draftRevision,
    editorReady,
    editorSource,
    tenantId,
    upsertDraftMutation,
  ]);

  useEffect(() => {
    if (!editorReady) return;
    if (initialEditorSourceRef.current !== 'scratch') return;

    const scope = scratchSessionScopeRef.current;
    if (editorSource !== 'scratch') {
      clearScratchDraftSessionSnapshot(scope);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const editor = editorRef.current;
      if (!editor) return;

      const html = editor.getHtml() ?? '';
      const css = getEditorDocumentCss(editor);
      const rawHtml = combineHtmlCss(html, css);
      const projectData = JSON.stringify({
        ...editor.getProjectData(),
        __rawCss: css,
      });

      const hasCanvasContent = Boolean(html.trim() || css.trim());

      if (!hasCanvasContent) {
        clearScratchDraftSessionSnapshot(scope);
        return;
      }

      writeScratchDraftSessionSnapshot(scope, {
        rawHtml,
        projectData,
      });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draftRevision, editorReady, editorSource]);

  const isDataPending =
    landingPageDraftQuery.isPending ||
    (templateId && templatesQuery.isPending) ||
    (fromActive && landingPageQuery.isPending);

  useEffect(() => {
    const editor = editorRef.current;
    if (rightTab !== 'styles' || !editorReady || !editor) return;
    requestAnimationFrame(() => {
      syncStyleManagerTarget(editor);
    });
  }, [editorReady, rightTab]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editorReady || !editor) return;

    const syncAiSelection = () => {
      requestAnimationFrame(() => {
        const selected = normalizeSelectedComponents(
          (editor.getSelectedAll() as Component[]) ?? [],
        );
        syncCanvasSelectedComponentState(editor);
        setAiSelectionTarget(buildAiSelectionTarget(selected));
        setStyleSelectionMeta(
          resolveStyleSelectionMeta(selected[0] ?? editor.getSelected()),
        );
      });
    };

    syncAiSelection();
    editor.on('component:selected', syncAiSelection);
    editor.on('component:deselected', syncAiSelection);
    editor.on('load', syncAiSelection);

    return () => {
      editor.off('component:selected', syncAiSelection);
      editor.off('component:deselected', syncAiSelection);
      editor.off('load', syncAiSelection);
    };
  }, [editorReady]);

  // ─── Init GrapesJS ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mounted) return;
    if (!containerRef.current) return;
    if (editorRef.current) return;
    if (isDataPending) return;

    const initialTemplateId = initialTemplateIdRef.current;
    const initialFromActive = initialFromActiveRef.current;
    const initialEditorSourceValue = initialEditorSourceRef.current;

    let destroyed = false;
    let traitsObserver: MutationObserver | null = null;
    let syncTraitsA11y: (() => void) | null = null;
    let handleDraftDirty: (() => void) | null = null;
    let handleFrameCssRestore: (() => void) | null = null;
    requestAnimationFrame(() => {
      if (destroyed) return;
      void (async () => {
        const [grapesjs, presetWebpage] = await Promise.all([
          import('grapesjs').then((m) => m.default),
          import('grapesjs-preset-webpage').then((m) => m.default),
        ]);
        if (destroyed || !containerRef.current) return;

        const editor = grapesjs.init({
          container: containerRef.current,
          height: '100%',
          width: '100%',
          fromElement: false,
          storageManager: false,
          avoidInlineStyle: true,
          multipleSelection: true,
          parser: {
            optionsHtml: { allowScripts: false },
          },
          plugins: [presetWebpage],
          pluginsOpts: {
            [presetWebpage as unknown as string]: {
              modalImportTitle: 'Import HTML',
              modalImportButton: 'Import',
              modalImportLabel: '',
            },
          },
          canvas: {
            styles: [
              'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
            ],
          },
          deviceManager: {
            devices: [
              { id: 'desktop', name: 'Desktop', width: '' },
              { id: 'tablet', name: 'Tablet', width: '768px', widthMedia: '992px' },
              { id: 'mobile', name: 'Mobile', width: '375px', widthMedia: '480px' },
            ],
          },
          selectorManager: { appendTo: selectorMountRef.current! },
          styleManager: {
            appendTo: stylesMountRef.current!,
            sectors: STYLE_SECTORS,
          },
          traitManager: { appendTo: traitsMountRef.current! },
          layerManager: { appendTo: layersMountRef.current ?? undefined },
          blockManager: { appendTo: blocksMountRef.current! },
          panels: { defaults: [] },
        });

        editorRef.current = editor;
        syncCanvasInteractiveRuntime(editor);

        // ── Register custom blocks ──
        CUSTOM_BLOCKS.forEach((blk) => {
          editor.BlockManager.add(blk.id, {
            label: blk.label,
            category: blk.category,
            content: blk.content,
            ...(blk.media ? { media: blk.media } : {}),
          });
        });

        // ── Load content ──
        const draft = draftBootstrapRef.current;
        const shouldUseDraft = Boolean(
          draft &&
          ((initialFromActive && draft.source === 'active') ||
            (initialTemplateId && draft.currentTemplateId === initialTemplateId)),
        );
        const shouldSkipDraftBootstrap =
          shouldUseDraft &&
          (shouldSkipBootstrapProjectData(draft?.projectData) ||
            shouldSkipBootstrapRawHtml(draft?.rawHtml));

        if (draft && shouldUseDraft && !shouldSkipDraftBootstrap) {
          restoreEditorDocument(editor, draft.rawHtml, draft.projectData);
          currentTemplateIdRef.current = draft.currentTemplateId ?? null;
          setCurrentTemplateId(draft.currentTemplateId ?? null);
          setEditorSource(draft.source ?? initialEditorSourceValue);
          lastDraftSnapshotRef.current = JSON.stringify({
            rawHtml: draft.rawHtml ?? null,
            projectData: draft.projectData ?? null,
            currentTemplateId: draft.currentTemplateId ?? null,
            source: draft.source ?? initialEditorSourceValue,
          });
        } else if (draft && shouldSkipDraftBootstrap) {
          console.warn(
            '[landing-page-editor] Ignoring oversized draft bootstrap and falling back to base source.',
          );
          toast.danger(
            'Stored draft was too large, so the editor loaded the base version instead.',
          );
          lastDraftSnapshotRef.current = '';
        } else if (initialFromActive) {
          const lp = landingPageBootstrapRef.current;
          if (lp) {
            restoreEditorDocument(
              editor,
              shouldSkipBootstrapRawHtml(lp.rawHtml) ? null : lp.rawHtml,
              shouldSkipBootstrapProjectData(lp.projectData) ? null : lp.projectData,
            );
            setEditorSource('active');
          }
        } else if (initialTemplateId) {
          const tpl = templatesBootstrapRef.current?.find(
            (t) => t.id === initialTemplateId,
          );
          if (tpl) {
            restoreEditorDocument(
              editor,
              shouldSkipBootstrapRawHtml(tpl.html) ? null : tpl.html,
              shouldSkipBootstrapProjectData(tpl.projectData) ? null : tpl.projectData,
            );
            setEditorSource('template');
          }
        } else if (initialEditorSourceValue === 'scratch') {
          const scratchSnapshot = scratchSessionBootstrapRef.current;
          if (scratchSnapshot) {
            if (scratchSnapshot.rawHtml || scratchSnapshot.projectData) {
              restoreEditorDocument(
                editor,
                shouldSkipBootstrapRawHtml(scratchSnapshot.rawHtml)
                  ? null
                  : scratchSnapshot.rawHtml,
                shouldSkipBootstrapProjectData(scratchSnapshot.projectData)
                  ? null
                  : scratchSnapshot.projectData,
              );
            }
          }
          setEditorSource('scratch');
        }

        // ── Define traits for every HTML element type ──────────────────────
        setupComponentTraits(editor);

        syncTraitsA11y = () => {
          requestAnimationFrame(() => {
            syncTraitFieldAccessibility(traitsMountRef.current);
          });
        };
        syncTraitsA11y();

        if (traitsMountRef.current) {
          traitsObserver = new MutationObserver(() => {
            syncTraitsA11y?.();
          });
          traitsObserver.observe(traitsMountRef.current, {
            childList: true,
            subtree: true,
          });
        }
        editor.on('component:selected', syncTraitsA11y);
        editor.on('component:update:attributes', syncTraitsA11y);
        editor.on('component:update:traits', syncTraitsA11y);
        editor.on('load', syncTraitsA11y);

        // Match the Style panel target to the most specific CSS rule affecting
        // the selected component, so imported templates reflect their current CSS.
        editor.on('component:selected', (component: Component) => {
          if (rightTabRef.current !== 'styles') return;
          requestAnimationFrame(() => {
            syncStyleManagerTarget(editor, component);
          });
        });
        handleFrameCssRestore = () => {
          syncCanvasInteractiveRuntime(editor);
          syncCanvasSelectedComponentState(editor);
          const persistedCss = getPersistedCanvasCss(editor);
          if (persistedCss) {
            injectCanvasCss(editor, persistedCss);
          }
        };
        editor.on('load', handleFrameCssRestore);
        editor.on('canvas:frame:load', handleFrameCssRestore);
        editor.on('canvas:frame:load', () => {
          requestAnimationFrame(() => {
            syncCanvasFrameLayout(device);
          });
        });
        handleDraftDirty = () => {
          if (
            !documentReplacementGuardRef.current &&
            documentReplacementStateRef.current !== 'idle'
          ) {
            documentUndoSnapshotRef.current = null;
            documentRedoSnapshotRef.current = null;
            documentReplacementStateRef.current = 'idle';
          }
          setDraftRevision((revision) => revision + 1);
        };
        editor.on('update', handleDraftDirty);

        requestAnimationFrame(() => {
          syncStyleManagerTarget(editor);
          syncCanvasFrameLayout(device);
        });

        editor.UndoManager.clear();
        setLoading(false);
        setEditorReady(true);
      })();
    });

    return () => {
      destroyed = true;
      traitsObserver?.disconnect();
      if (editorRef.current && syncTraitsA11y) {
        editorRef.current.off('component:selected', syncTraitsA11y);
        editorRef.current.off('component:update:attributes', syncTraitsA11y);
        editorRef.current.off('component:update:traits', syncTraitsA11y);
        editorRef.current.off('load', syncTraitsA11y);
      }
      if (editorRef.current && handleFrameCssRestore) {
        editorRef.current.off('load', handleFrameCssRestore);
        editorRef.current.off('canvas:frame:load', handleFrameCssRestore);
      }
      if (editorRef.current && handleDraftDirty) {
        editorRef.current.off('update', handleDraftDirty);
      }
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [device, isDataPending, mounted, syncCanvasFrameLayout]);

  // ─── Inject style fix: keep GrapesJS inputs and placeholders readable in the light theme.
  // The grapes.min.css sets dark-theme colors on these controls, so we override them last.
  // We must inject a <style> tag AFTER GrapesJS initialises so it comes last in the cascade.
  useEffect(() => {
    const id = 'gjs-input-color-fix';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      /* Keep actual values black and placeholders visibly different when fields are empty */
      .gjs-sm-field input, .gjs-sm-field select, .gjs-sm-field textarea,
      .gjs-clm-field input, .gjs-clm-field select,
      .gjs-clm-select input, .gjs-clm-select select {
        color: #111 !important;
        -webkit-text-fill-color: #111 !important;
        caret-color: #222 !important;
        opacity: 1 !important;
      }
      .gjs-field select, .gjs-sm-field select, .gjs-sm-select select,
      .gjs-field-select select, .gjs-clm-select select, .gjs-trt-trait select {
        background: #fff !important;
        background-color: #fff !important;
        color: #111 !important;
        -webkit-text-fill-color: #111 !important;
        appearance: none !important;
        -webkit-appearance: none !important;
        opacity: 1 !important;
        font-weight: 500 !important;
      }
      .gjs-field select option, .gjs-sm-field select option, .gjs-sm-select select option,
      .gjs-field-select select option, .gjs-clm-select select option, .gjs-trt-trait select option {
        color: #111 !important;
        background: #fff !important;
      }
      .gjs-sm-field input::placeholder, .gjs-sm-field textarea::placeholder,
      .gjs-clm-field input::placeholder, .gjs-clm-select input::placeholder,
      .gjs-field input::placeholder, .gjs-field textarea::placeholder {
        color: #444 !important;
        -webkit-text-fill-color: #444 !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  useEffect(() => {
    if (!editorReady) return;

    const cleanups = [
      bindStudioFieldMetadataRuntime(stylesMountRef.current, 'style'),
      bindStudioFieldMetadataRuntime(traitsMountRef.current, 'trait'),
      bindStudioFieldMetadataRuntime(selectorMountRef.current, 'selector'),
      bindStudioTextFieldVisualRuntime(stylesMountRef.current),
      bindStudioTextFieldVisualRuntime(traitsMountRef.current),
      bindStudioTextFieldVisualRuntime(selectorMountRef.current),
      bindStudioRadioFieldRuntime(stylesMountRef.current),
      bindStudioRadioFieldRuntime(traitsMountRef.current),
      bindStudioColorFieldRuntime(stylesMountRef.current),
      bindStudioColorFieldRuntime(traitsMountRef.current),
      bindStudioEnterCommitRuntime(stylesMountRef.current),
      bindStudioEnterCommitRuntime(traitsMountRef.current),
      bindStudioEnterCommitRuntime(selectorMountRef.current),
    ];

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [editorReady]);

  useEffect(() => {
    if (!editorReady || !canvasAreaRef.current) return;

    const sync = () => {
      requestAnimationFrame(() => {
        syncCanvasFrameLayout(device);
      });
    };

    const observer = new ResizeObserver(sync);
    observer.observe(canvasAreaRef.current);
    window.addEventListener('resize', sync);
    sync();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, [device, editorReady, syncCanvasFrameLayout]);

  // ─── Media helpers ────────────────────────────────────────────────────────

  const handleAssetsChange = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['landing-page-media', tenantSlug] });
  }, [qc, tenantSlug]);

  const handleInsertAsset = useCallback((asset: MediaAsset) => {
    const editor = editorRef.current;
    if (!editor) return;
    // Always add at the bottom of the body wrapper
    const wrapper = editor.getWrapper();
    if (!wrapper) return;
    if (asset.kind === 'image') {
      wrapper.append(
        `<img src="${asset.url}" alt="${asset.name}" style="max-width:100%;height:auto;display:block" />`,
      );
    } else {
      wrapper.append(
        `<video src="${asset.url}" controls style="max-width:100%;display:block"></video>`,
      );
    }
    toast.success(mediaT('toasts.inserted'));
  }, [mediaT]);

  // ─── Save ─────────────────────────────────────────────────────────────────

  const getTemplateNamePool = useCallback(
    (excludeId?: string | null) =>
      (templatesQuery.data ?? [])
        .filter((template) => template.id !== excludeId)
        .map((template) => template.name),
    [templatesQuery.data],
  );

  const openCreateTemplateDialog = useCallback(() => {
    setPendingTemplateName(
      resolveUniqueTemplateName(defaultTemplateName, getTemplateNamePool(), {
        fallbackName: defaultTemplateName,
      }),
    );
    setShowSaveNameDialog(true);
  }, [defaultTemplateName, getTemplateNamePool]);

  const persistTemplateSnapshot = useCallback(
    async (options?: { createName?: string }) => {
      const editor = editorRef.current;
      if (!editor) return false;

      setSaving(true);
      try {
        const html = editor.getHtml() ?? '';
        const css = getEditorDocumentCss(editor);
        const fullHtml = combineHtmlCss(html, css);
        const projectData = {
          ...editor.getProjectData(),
          __rawCss: css,
        };
        const serializedProjectData = buildSerializedProjectData(projectData);
        const savePayload = JSON.stringify({
          html: fullHtml,
          projectData: serializedProjectData,
        });

        if (isLandingPagePayloadTooLarge(savePayload)) {
          toast.danger(t('toasts.saveTooLarge'));
          return false;
        }

        const activeId = currentTemplateIdRef.current;
        if (activeId) {
          try {
            await new LandingPageService(ctx).updateTemplate(ctx.tenantId!, activeId, {
              html: fullHtml,
              projectData: serializedProjectData,
            });
            void qc.invalidateQueries({
              queryKey: ['landing-page-templates', ctx.tenantId],
            });
            toast.success(t('toasts.saved'));
            return true;
          } catch (error: unknown) {
            toast.danger(error instanceof Error ? error.message : t('toasts.saveFailed'));
            return false;
          }
        }

        const templateName = resolveUniqueTemplateName(
          options?.createName ?? defaultTemplateName,
          getTemplateNamePool(),
          { fallbackName: defaultTemplateName },
        );
        const result = await createTemplateMutation.mutateAsync({
          name: templateName,
          html: fullHtml,
          projectData: serializedProjectData,
        });

        if (isOk(result)) {
          currentTemplateIdRef.current = result.data.id;
          setCurrentTemplateId(result.data.id);
          setCurrentTemplateName(templateName);
          setEditorSource('template');
          const url = new URL(window.location.href);
          url.searchParams.set('templateId', result.data.id);
          url.searchParams.delete('fromActive');
          window.history.replaceState({}, '', url.toString());
          toast.success(t('toasts.newPageCreated'));
          return true;
        }

        if (isErr(result)) {
          toast.danger(result.error.message ?? t('toasts.createPageFailed'));
        }
        return false;
      } finally {
        setSaving(false);
      }
    },
    [createTemplateMutation, ctx, getTemplateNamePool, qc],
  );

  const commitTemplateRename = useCallback(async () => {
    if (!currentTemplateId) return;

    const resolvedName = resolveUniqueTemplateName(
      templateNameEdit || currentTemplateName,
      getTemplateNamePool(currentTemplateId),
    );

    setSaving(true);
    try {
      await new LandingPageService(ctx).updateTemplate(ctx.tenantId!, currentTemplateId, {
        name: resolvedName,
      });
      setCurrentTemplateName(resolvedName);
      setTemplateNameEdit(resolvedName);
      setIsRenamingTemplate(false);
      void qc.invalidateQueries({
        queryKey: ['landing-page-templates', ctx.tenantId],
      });
      toast.success(t('toasts.renameSuccess'));
    } catch (error: unknown) {
      toast.danger(error instanceof Error ? error.message : t('toasts.renameFailed'));
    } finally {
      setSaving(false);
    }
  }, [
    ctx,
    currentTemplateId,
    currentTemplateName,
    getTemplateNamePool,
    qc,
    templateNameEdit,
  ]);

  const handleSave = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    setSaving(true);
    try {
      const html = editor.getHtml() ?? '';
      const css = getEditorDocumentCss(editor);
      const fullHtml = combineHtmlCss(html, css);
      const projectData = {
        ...editor.getProjectData(),
        __rawCss: css,
      };
      const serializedProjectData = buildSerializedProjectData(projectData);
      const savePayload = JSON.stringify({
        html: fullHtml,
        projectData: serializedProjectData,
      });

      if (isLandingPagePayloadTooLarge(savePayload)) {
        toast.danger(t('toasts.saveTooLarge'));
        return;
      }
      const activeId = currentTemplateIdRef.current;

      if (activeId) {
        try {
          await new LandingPageService(ctx).updateTemplate(ctx.tenantId!, activeId, {
            html: fullHtml,
            projectData: serializedProjectData,
          });
          toast.success(t('toasts.saved'));
        } catch (e: unknown) {
          toast.danger(e instanceof Error ? e.message : t('toasts.saveFailed'));
        }
      } else {
        const result = await createTemplateMutation.mutateAsync({
          name: defaultTemplateName,
          html: fullHtml,
          projectData: serializedProjectData,
        });
        if (isOk(result)) {
          currentTemplateIdRef.current = result.data.id;
          setCurrentTemplateId(result.data.id);
          setEditorSource('template');
          const url = new URL(window.location.href);
          url.searchParams.set('templateId', result.data.id);
          url.searchParams.delete('fromActive');
          window.history.replaceState({}, '', url.toString());
          toast.success(t('toasts.newPageCreated'));
        } else if (isErr(result)) {
          toast.danger(result.error.message ?? t('toasts.createPageFailed'));
        }
      }
    } finally {
      setSaving(false);
    }
  }, [ctx, createTemplateMutation]);

  // ─── Publish ──────────────────────────────────────────────────────────────

  const handleSaveAction = useCallback(async () => {
    if (!currentTemplateIdRef.current) {
      openCreateTemplateDialog();
      return;
    }

    await handleSave();
  }, [handleSave, openCreateTemplateDialog]);

  const handlePublish = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    setPublishing(true);
    try {
      if (currentTemplateIdRef.current) {
        await handleSaveAction();
      }
      const html = editor.getHtml() ?? '';
      const css = getEditorDocumentCss(editor);
      const fullHtml = combineHtmlCss(html, css);
      const projectData = JSON.stringify({
        ...editor.getProjectData(),
        __rawCss: css,
        ...(currentTemplateIdRef.current
          ? { [LANDING_PAGE_TEMPLATE_ID_META_KEY]: currentTemplateIdRef.current }
          : {}),
      });
      const publishPayload = JSON.stringify({
        rawHtml: fullHtml,
        projectData,
        isPublished: true,
      });

      if (isLandingPagePayloadTooLarge(publishPayload)) {
        toast.danger(t('toasts.publishTooLarge'));
        return;
      }

      const result = await upsertMutation.mutateAsync({
        rawHtml: fullHtml,
        projectData,
        isPublished: true,
      });
      if (isOk(result)) {
        toast.success(t('toasts.publishSuccess'));
        if (publicLandingPagePath) {
          window.open(publicLandingPagePath, '_blank', 'noopener,noreferrer');
        }
      } else if (isErr(result)) toast.danger(result.error.message ?? t('toasts.publishFailed'));
    } finally {
      setPublishing(false);
    }
  }, [handleSaveAction, publicLandingPagePath, upsertMutation]);

  // ─── Code editor ──────────────────────────────────────────────────────────

  const handleOpenCode = () => {
    const editor = editorRef.current;
    if (!editor) return;
    setCodeHtml(editor.getHtml() ?? '');
    setCodeCss(getEditorDocumentCss(editor));
    setShowCodeEditor(true);
  };

  const handleApplyCode = (rawHtml: string, rawCss: string) => {
    // If the user pasted a full HTML document (has <html> or <!DOCTYPE>),
    // extract body content + embedded <style> CSS before applying.
    // Otherwise treat HTML tab as body HTML and CSS tab as the stylesheet.
    const isFullDoc = /<!doctype|<html[\s>]/i.test(rawHtml.trimStart());
    const fullHtml = isFullDoc ? rawHtml : combineHtmlCss(rawHtml, rawCss);
    if (!replaceCanvasDocument(fullHtml, { allowEmpty: true })) return;
    setShowCodeEditor(false);
    toast.success(t('toasts.codeApplied'));
  };

  // ─── Device ───────────────────────────────────────────────────────────────

  const handleDevice = (d: DeviceType) => {
    setDevice(d);
    setShowDeviceMenu(false);
    const map: Record<DeviceType, string> = {
      Desktop: 'desktop',
      Tablet: 'tablet',
      Mobile: 'mobile',
    };
    editorRef.current?.setDevice(map[d]);
    requestAnimationFrame(() => {
      syncCanvasFrameLayout(d);
    });
  };

  const handleToggleOutlines = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const nextActive = !showOutlines;
    if (nextActive) {
      editor.runCommand('core:component-outline');
    } else {
      editor.stopCommand('core:component-outline');
    }

    setShowOutlines(nextActive);
  }, [showOutlines]);

  const toggleLeftPanel = (id: LeftPanelId) => {
    setLeftPanel((prev) => (prev === id ? null : id));
  };

  // ─── Loading guard ────────────────────────────────────────────────────────

  const handleConfirmCreateTemplate = useCallback(async () => {
    const resolvedName = resolveUniqueTemplateName(
      pendingTemplateName || defaultTemplateName,
      getTemplateNamePool(),
      { fallbackName: defaultTemplateName },
    );
    setPendingTemplateName(resolvedName);
    setShowSaveNameDialog(false);
    await persistTemplateSnapshot({ createName: resolvedName });
  }, [defaultTemplateName, getTemplateNamePool, pendingTemplateName, persistTemplateSnapshot]);

  const handleTemplateNameKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void handleConfirmCreateTemplate();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setShowSaveNameDialog(false);
      }
    },
    [handleConfirmCreateTemplate],
  );

  const handleRenameTemplateKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void commitTemplateRename();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setIsRenamingTemplate(false);
        setTemplateNameEdit(currentTemplateName);
      }
    },
    [commitTemplateRename, currentTemplateName],
  );

  if (isDataPending) {
    return (
      <div
        className="gjs-studio-root"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Loader2 className="gjs-spin" style={{ width: 24, height: 24 }} />
      </div>
    );
  }

  const isLeftOpen = leftPanel !== null;
  const templateName = currentTemplateId
    ? currentTemplateName || defaultTemplateName
    : editorSource === 'active'
      ? t('activePage')
      : defaultTemplateName;

  return (
    <div className="gjs-studio-root">
      {showCodeEditor && (
        <CodeEditorModal
          html={codeHtml}
          css={codeCss}
          onClose={() => setShowCodeEditor(false)}
          onApply={handleApplyCode}
        />
      )}

      {/* ═══════════ TOP BAR ═══════════ */}
      {showSaveNameDialog && (
        <div className="gjs-template-dialog-backdrop">
          <div className="gjs-template-dialog" role="dialog" aria-modal="true">
            <div className="gjs-template-dialog__header">
              <h3>{t('saveDialog.title')}</h3>
              <p>{t('saveDialog.description')}</p>
            </div>
            <input
              ref={saveNameInputRef}
              value={pendingTemplateName}
              maxLength={MAX_TEMPLATE_NAME_LENGTH}
              onChange={(event) =>
                setPendingTemplateName(normalizeTemplateNameInput(event.target.value))
              }
              onKeyDown={handleTemplateNameKeyDown}
              className="gjs-template-dialog__input"
              placeholder={defaultTemplateName}
            />
            <div className="gjs-template-dialog__actions">
              <button
                type="button"
                className="gjs-topbar__code-btn"
                onClick={() => setShowSaveNameDialog(false)}
              >
                {commonT('cancel')}
              </button>
              <button
                type="button"
                className="gjs-topbar__publish-btn"
                onClick={() => void handleConfirmCreateTemplate()}
                disabled={saving}
              >
                {saving ? t('saveDialog.saving') : t('topbar.save')}
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="gjs-topbar">
        <div className="gjs-topbar__left">
          <button
            className="gjs-topbar__code-btn"
            onClick={() =>
              router.push(`/tenant/${tenantSlug}/organization-management/landing-page`)
            }
          >
            <ArrowLeft size={14} />
            <span>{t('topbar.back')}</span>
          </button>
          <button className="gjs-topbar__code-btn" onClick={handleOpenCode}>
            <Code2 size={14} />
            <span>{t('topbar.code')}</span>
          </button>
          {currentTemplateId && isRenamingTemplate ? (
            <input
              ref={renameTemplateInputRef}
              value={templateNameEdit}
              maxLength={MAX_TEMPLATE_NAME_LENGTH}
              onChange={(event) =>
                setTemplateNameEdit(normalizeTemplateNameInput(event.target.value))
              }
              onKeyDown={handleRenameTemplateKeyDown}
              onBlur={() => {
                setIsRenamingTemplate(false);
                setTemplateNameEdit(currentTemplateName);
              }}
              className="gjs-topbar__page-name-input"
            />
          ) : (
            <span
              className={`gjs-topbar__page-name ${currentTemplateId ? 'gjs-topbar__page-name--editable' : ''}`}
              onDoubleClick={() => {
                if (!currentTemplateId) return;
                setTemplateNameEdit(templateName);
                setIsRenamingTemplate(true);
              }}
              title={currentTemplateId ? t('topbar.renameHint') : undefined}
            >
              {templateName}
            </span>
          )}
        </div>

        <div className="gjs-topbar__center">
          <div
            className="gjs-device-dropdown"
            onClick={() => setShowDeviceMenu(!showDeviceMenu)}
          >
            {device === 'Desktop' && <Monitor size={14} />}
            {device === 'Tablet' && <Tablet size={14} />}
            {device === 'Mobile' && <Smartphone size={14} />}
            <span>{getDeviceLabel(device)}</span>
            <ChevronDown size={12} />
            {showDeviceMenu && (
              <div
                className="gjs-device-dropdown__menu"
                onClick={(e) => e.stopPropagation()}
              >
                {(['Desktop', 'Tablet', 'Mobile'] as DeviceType[]).map((d) => (
                  <button
                    key={d}
                    className="gjs-device-dropdown__item"
                    onClick={() => handleDevice(d)}
                  >
                    <span className="gjs-device-dropdown__item-left">
                      {d === 'Desktop' && <Monitor size={14} />}
                      {d === 'Tablet' && <Tablet size={14} />}
                      {d === 'Mobile' && <Smartphone size={14} />}
                      {getDeviceLabel(d)}
                    </span>
                    {device === d && (
                      <Check size={14} className="gjs-device-dropdown__check" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="gjs-topbar__right">
          <div className="gjs-topbar__actions">
            <button
              className="gjs-topbar__icon-btn"
              title={t('topbar.outlines')}
              onClick={handleToggleOutlines}
              style={
                showOutlines
                  ? { background: 'rgba(37,99,235,0.12)', color: '#2563eb' }
                  : undefined
              }
            >
              <SquareDashedBottom size={15} />
            </button>
            <button
              className="gjs-topbar__icon-btn"
              title={t('topbar.preview')}
              onClick={() => editorRef.current?.runCommand('preview')}
            >
              <Play size={15} />
            </button>
            <button
              className="gjs-topbar__icon-btn"
              title={t('topbar.fullscreen')}
              onClick={() => document.documentElement.requestFullscreen()}
            >
              <Maximize size={15} />
            </button>
            <div className="gjs-topbar__divider" />
            <button
              className="gjs-topbar__icon-btn"
              title={t('topbar.undo')}
              onClick={handleEditorUndo}
            >
              <Undo2 size={15} />
            </button>
            <button
              className="gjs-topbar__icon-btn"
              title={t('topbar.redo')}
              onClick={handleEditorRedo}
            >
              <Redo2 size={15} />
            </button>
            <div className="gjs-topbar__divider" />
            <button
              className="gjs-topbar__icon-btn"
              title={t('topbar.save')}
              onClick={() => void handleSaveAction()}
              disabled={saving}
            >
              {saving ? <Loader2 size={15} className="gjs-spin" /> : <Save size={15} />}
            </button>
          </div>

          <button
            className="gjs-topbar__publish-btn"
            onClick={() => void handlePublish()}
            disabled={publishing}
          >
            {publishing ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Loader2 size={12} className="gjs-spin" /> {t('topbar.publishing')}
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Upload size={12} /> {t('topbar.publish')}
              </span>
            )}
          </button>

          <div className="gjs-topbar__tabs">
            <button
              className={`gjs-topbar__tab ${rightTab === 'styles' ? 'gjs-topbar__tab--active' : ''}`}
              onClick={() => setRightTab('styles')}
            >
              {t('rightTabs.styles')}
            </button>
            <button
              className={`gjs-topbar__tab ${rightTab === 'properties' ? 'gjs-topbar__tab--active' : ''}`}
              onClick={() => setRightTab('properties')}
            >
              {t('rightTabs.properties')}
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════ MAIN ═══════════ */}
      <div className="gjs-main">
        {/* ── Left icon bar ── */}
        <nav className="gjs-sidebar">
          <div className="gjs-sidebar__top">
            {LEFT_SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  title={t(item.labelKey)}
                  className={`gjs-sidebar__btn ${leftPanel === item.id ? 'gjs-sidebar__btn--active' : ''}`}
                  onClick={() => toggleLeftPanel(item.id)}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
          <div style={{ flex: 1 }} />
        </nav>

        {/* ── Left panel ── */}
        {isLeftOpen && (
          <aside className="gjs-left-panel">
            <div className="gjs-left-panel__header">
              <span className="gjs-left-panel__title">
                {leftPanel
                  ? t(
                    LEFT_SIDEBAR_ITEMS.find((i) => i.id === leftPanel)?.labelKey ?? '',
                  )
                  : ''}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {leftPanel === 'ai' && (
                  <button
                    onClick={() => setShowKeyInput((value) => !value)}
                    title={showKeyInput ? t('ai.toggleApiKey.hide') : t('ai.toggleApiKey.show')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      color: showKeyInput
                        ? 'var(--gjs-studio-accent, #7c3aed)'
                        : 'inherit',
                      opacity: showKeyInput ? 1 : 0.6,
                    }}
                  >
                    <Key size={15} strokeWidth={2.5} />
                  </button>
                )}
                <button
                  className="gjs-left-panel__close"
                  onClick={() => setLeftPanel(null)}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="gjs-left-panel__body">
              {/* ── Blocks ── */}
              <div
                style={{
                  display: leftPanel === 'blocks' ? 'block' : 'none',
                  height: '100%',
                }}
              >
                <BlocksPanel editorReady={editorReady} blocksMountRef={blocksMountRef} />
              </div>

              {/* ── Layers (+ Pages above) ── */}
              <div style={{ display: leftPanel === 'layers' ? 'block' : 'none' }}>
                <PagesPanel editor={editorReady ? editorRef.current : null} />
                <div className="gjs-layers-section-label">{t('layers.title')}</div>
                <CustomLayersTree editor={editorReady ? editorRef.current : null} />
              </div>

              {/* ── Global Styles ── */}
              <div style={{ display: leftPanel === 'global-styles' ? 'block' : 'none' }}>
                <GlobalStylesPanel editor={editorReady ? editorRef.current : null} />
              </div>

              {/* ── Assets ── */}
              <div
                style={{
                  display: leftPanel === 'assets' ? 'block' : 'none',
                  padding: 12,
                }}
              >
                {tenantSlug && (
                  <CanvasMediaLibrary
                    orgSlug={tenantSlug}
                    assets={mediaAssets}
                    onAssetsChange={handleAssetsChange}
                    onInsert={handleInsertAsset}
                  />
                )}
              </div>

              {/* ── Data Sources ── */}
              <div style={{ display: 'none' }}>
                <div className="gjs-left-panel__placeholder">
                  <div />
                  <p>{t('ai.dataSourcesSoon')}</p>
                </div>
              </div>

              {/* ── AI ── */}
              <div
                style={{
                  display: leftPanel === 'ai' ? 'flex' : 'none',
                  flexDirection: 'column',
                  height: '100%',
                  minHeight: 0,
                }}
              >
                <div
                  ref={aiScrollRef}
                  style={{
                    flex: '1 1 auto',
                    minHeight: 0,
                    overflowY: 'auto',
                    padding: '12px 12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  {aiMessages.length === 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                        gap: 20,
                        padding: '8px 4px',
                      }}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 14,
                          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
                        }}
                      >
                        <Sparkles size={24} color="#fff" />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#0f172a',
                          }}
                        >
                          {t('ai.emptyTitle')}
                        </p>
                        <p
                          style={{
                            margin: '6px 0 0',
                            fontSize: 12,
                            color: '#f59e0b',
                            fontWeight: 500,
                          }}
                        >
                          {t('ai.emptyDescription')}
                        </p>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          width: '100%',
                        }}
                      >
                        {[
                          t('ai.quickPrompts.hero'),
                          t('ai.quickPrompts.features'),
                          t('ai.quickPrompts.contact'),
                          t('ai.quickPrompts.testimonials'),
                        ].map((chip) => (
                          <button
                            key={chip}
                            onClick={() => setAiPrompt(chip)}
                            style={{
                              padding: '9px 14px',
                              borderRadius: 10,
                              border: '1px solid rgba(148,163,184,0.25)',
                              background: 'rgba(248,250,252,0.9)',
                              cursor: 'pointer',
                              fontSize: 12,
                              color: '#334155',
                              textAlign: 'left',
                              lineHeight: 1.4,
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = 'rgba(241,245,249,1)')
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = 'rgba(248,250,252,0.9)')
                            }
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    aiMessages.map((message) => {
                      const isUser = message.role === 'user';
                      return (
                        <div
                          key={message.id}
                          style={{
                            alignSelf: isUser ? 'flex-end' : 'stretch',
                            maxWidth: isUser ? '88%' : '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: 'rgba(148,163,184,0.88)',
                              paddingInline: isUser ? 8 : 0,
                            }}
                          >
                            {isUser ? t('ai.labels.you') : t('ai.labels.assistant')}
                          </span>

                          {isUser ? (
                            <>
                              <div
                                style={{
                                  borderRadius: 16,
                                  padding: '10px 12px',
                                  border: '1px solid rgba(59,130,246,0.28)',
                                  background:
                                    'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,245,249,0.94))',
                                  color: '#0f172a',
                                  boxShadow: '0 8px 20px rgba(15,23,42,0.08)',
                                }}
                              >
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: 13,
                                    lineHeight: 1.65,
                                    whiteSpace: 'pre-wrap',
                                  }}
                                >
                                  {message.content}
                                </p>
                              </div>
                              {message.selectionLabel && (
                                <div
                                  style={{
                                    alignSelf: 'flex-end',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    maxWidth: '100%',
                                    padding: '5px 10px',
                                    borderRadius: 999,
                                    background: 'rgba(124,92,252,0.12)',
                                    border: '1px solid rgba(124,92,252,0.18)',
                                    color: '#6d28d9',
                                    fontSize: 11,
                                    fontWeight: 600,
                                  }}
                                >
                                  <LocateFixed size={12} />
                                  <span
                                    style={{
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      maxWidth: 170,
                                    }}
                                  >
                                    {message.selectionLabel}
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div
                                style={{
                                  margin: 0,
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                  color:
                                    message.status === 'error' ||
                                      message.status === 'stopped'
                                      ? 'rgba(100, 116, 139, 0.9)'
                                      : message.status === 'streaming'
                                        ? 'rgba(100, 116, 139, 0.9)'
                                        : '#0f172a',
                                  lineHeight: 1.8,
                                }}
                              >
                                {message.content ||
                                  (message.status === 'streaming' ? t('ai.labels.thinking') : '')}
                                {message.status === 'streaming' && (
                                  <span
                                    style={{
                                      opacity: 0.7,
                                      color: 'rgba(100, 116, 139, 0.72)',
                                    }}
                                  >
                                    {'.'.repeat(streamingEllipsis)}
                                  </span>
                                )}
                              </div>
                              {pendingAiDraftMessageId === message.id && (
                                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                  <button
                                    onClick={handleApplyAiDraft}
                                    style={{
                                      border: 'none',
                                      borderRadius: 10,
                                      padding: '8px 12px',
                                      background:
                                        'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                      color: '#fff',
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      boxShadow: '0 6px 18px rgba(124,58,237,0.25)',
                                    }}
                                  >
                                    {t('ai.actions.applyToCanvas')}
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div
                  style={{
                    flex: '0 0 auto',
                    borderTop: '1px solid rgba(148,163,184,0.12)',
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    background: 'rgba(255,255,255,0.96)',
                  }}
                >
                  {showKeyInput && (
                    <input
                      type="password"
                      placeholder={t('ai.apiKeyPlaceholder')}
                      value={customApiKey}
                      onChange={(event) => {
                        setCustomApiKey(event.target.value);
                        localStorage.setItem(
                          'iccp_gemini_custom_key',
                          event.target.value,
                        );
                      }}
                      style={{
                        fontSize: 12,
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: '1px solid rgba(148,163,184,0.3)',
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#fff',
                        color: '#0f172a',
                      }}
                    />
                  )}

                  {aiSelectionTarget ? (
                    <div
                      className="gjs-selection-ai-composer"
                      style={{
                        position: 'static',
                        inset: 'auto',
                        width: '100%',
                        marginTop: 2,
                        boxSizing: 'border-box',
                        boxShadow: 'none',
                        backdropFilter: 'none',
                        padding: '10px 12px 8px',
                      }}
                    >
                      <div className="gjs-selection-ai-composer__target">
                        <button
                          type="button"
                          className="gjs-selection-ai-composer__chip"
                          onClick={() => setLeftPanel('ai')}
                        >
                          <LocateFixed size={12} />
                          <span>{aiSelectionTarget.label}</span>
                        </button>
                        <button
                          type="button"
                          className="gjs-selection-ai-composer__dismiss"
                          onClick={() => {
                            const editor = editorRef.current;
                            if (!editor) return;
                            editor.select();
                            setAiSelectionTarget(null);
                            setAiPrompt('');
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <textarea
                        value={aiPrompt}
                        onChange={(event) => setAiPrompt(event.target.value)}
                        onKeyDown={handleAiKeyDown}
                        placeholder={aiAssistantPlaceholder}
                        rows={3}
                        disabled={aiStreaming}
                        className="gjs-selection-ai-composer__input"
                        style={{ minHeight: 84 }}
                      />
                      <div className="gjs-selection-ai-composer__footer">
                        <button
                          type="button"
                          className="gjs-selection-ai-composer__icon"
                          onClick={() => setLeftPanel('ai')}
                          title={t('ai.actions.openPanel')}
                        >
                          <Plus size={16} />
                        </button>
                        <div className="gjs-selection-ai-composer__actions">
                          <button
                            type="button"
                            className="gjs-selection-ai-composer__icon"
                            title={t('ai.actions.voiceInput')}
                            disabled
                          >
                            <Mic size={16} />
                          </button>
                          {aiStreaming ? (
                            <button
                              type="button"
                              className="gjs-selection-ai-composer__send gjs-selection-ai-composer__send--stop"
                              onClick={handleAiStop}
                            >
                              <Square size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="gjs-selection-ai-composer__send"
                              onClick={handleAiSubmit}
                              disabled={!aiPrompt.trim()}
                            >
                              <Send size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <textarea
                        value={aiPrompt}
                        onChange={(event) => setAiPrompt(event.target.value)}
                        onKeyDown={handleAiKeyDown}
                        placeholder={aiAssistantPlaceholder}
                        rows={3}
                        disabled={aiStreaming}
                        className="gjs-ai-assistant-input"
                        style={{
                          resize: 'none',
                          fontSize: 13,
                          padding: '12px 56px 12px 12px',
                          borderRadius: 14,
                          border: '1px solid rgba(148,163,184,0.28)',
                          width: '100%',
                          boxSizing: 'border-box',
                          background: '#fff',
                          color: '#0f172a',
                          opacity: aiStreaming ? 0.7 : 1,
                          minHeight: 76,
                          outline: 'none',
                        }}
                      />

                      {aiStreaming ? (
                        <button
                          onClick={handleAiStop}
                          title={t('ai.actions.stopGeneration')}
                          style={{
                            position: 'absolute',
                            right: 10,
                            bottom: 10,
                            width: 34,
                            height: 34,
                            borderRadius: 999,
                            border: 'none',
                            background: '#ef4444',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: '0 0 auto',
                          }}
                        >
                          <Square size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={handleAiSubmit}
                          disabled={!aiPrompt.trim()}
                          title={t('ai.actions.send')}
                          style={{
                            position: 'absolute',
                            right: 10,
                            bottom: 10,
                            width: 34,
                            height: 34,
                            borderRadius: 999,
                            border: 'none',
                            background: !aiPrompt.trim()
                              ? 'rgba(148,163,184,0.9)'
                              : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                            color: '#fff',
                            cursor: aiPrompt.trim() ? 'pointer' : 'not-allowed',
                            opacity: aiPrompt.trim() ? 1 : 0.45,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: aiPrompt.trim()
                              ? '0 4px 12px rgba(124,58,237,0.4)'
                              : 'none',
                          }}
                        >
                          <Send size={15} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* ── Canvas ── */}
        <div ref={canvasAreaRef} className="gjs-canvas-area">
          {loading && (
            <div className="gjs-canvas-loader">
              <Loader2 className="gjs-spin" style={{ width: 20, height: 20 }} />
            </div>
          )}
          <div
            ref={containerRef}
            className="gjs-custom-editor"
            style={{ height: '100%', width: '100%' }}
          />
        </div>

        {/* ── Right panel ── */}
        <aside className="gjs-right-panel">
          <StyleManagerPanel
            visible={rightTab === 'styles'}
            selectorMountRef={selectorMountRef}
            stylesMountRef={stylesMountRef}
            selectedComponentMeta={styleSelectionMeta}
          />
          <div
            style={{
              display: rightTab === 'properties' ? 'flex' : 'none',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <div className="gjs-right-panel__traits-header">{t('rightTabs.properties')}</div>
            <div ref={traitsMountRef} className="gjs-right-panel__traits-mount" />
          </div>
        </aside>
      </div>
    </div>
  );
}
