'use client';

import { type RefObject, useEffect } from 'react';
import type { Component, CssRule, Editor } from 'grapesjs';

const TYPOGRAPHY_PROPERTIES = new Set([
  'color',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-align',
  'vertical-align',
  'text-transform',
  'text-decoration',
  'font-family',
]);

function normalizeSelectorText(selector: string): string {
  return selector
    .split(',')
    .map((part) => part.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .join(', ');
}

function getSelectorSpecificity(selector: string): number {
  const ids = (selector.match(/#[\w-]+/g) ?? []).length;
  const classesAttrsPseudos = (
    selector.match(/(\.[\w-]+|\[[^\]]+\]|:[^:\s][\w-]*(?:\([^)]*\))?)/g) ?? []
  ).length;
  const tags = (selector.match(/(^|[\s>+~])([a-z][a-z0-9-]*)/gi) ?? []).length;
  const combinators = (selector.match(/[\s>+~]+/g) ?? []).length;
  return ids * 100 + classesAttrsPseudos * 10 + tags + combinators;
}

function getBestMatchingRule(editor: Editor, component: Component): CssRule | null {
  const element = component.getEl();
  if (!element) return null;

  const matchingRules = editor.Css.getRules()
    .map((rule) => {
      const selectorText = normalizeSelectorText(
        rule.selectorsToString({ skipState: true }),
      );
      if (!selectorText) return null;

      const selectors = selectorText
        .split(',')
        .map((selector) => selector.trim())
        .filter(Boolean);
      const matchedSelectors = selectors.filter((selector) => {
        try {
          return element.matches(selector);
        } catch {
          return false;
        }
      });

      if (matchedSelectors.length === 0) return null;

      return {
        rule,
        score: Math.max(...matchedSelectors.map(getSelectorSpecificity)),
      };
    })
    .filter((entry): entry is { rule: CssRule; score: number } => Boolean(entry))
    .sort((left, right) => right.score - left.score);

  return matchingRules[0]?.rule ?? null;
}

function getStyleEntries(
  target: CssRule | Component | null | undefined,
): Record<string, unknown> {
  if (!target) return {};
  const style = target.getStyle?.();
  if (!style || typeof style !== 'object') return {};
  return style as Record<string, unknown>;
}

function hasTypographyStyle(target: CssRule | Component | null | undefined): boolean {
  const style = getStyleEntries(target);
  return Object.entries(style).some(([key, value]) => {
    if (!TYPOGRAPHY_PROPERTIES.has(key)) return false;
    return typeof value === 'string' ? value.trim().length > 0 : value != null;
  });
}

function isTextLikeComponent(component: Component): boolean {
  const type = String(component.getType?.() ?? component.get('type') ?? '').toLowerCase();
  const tag = String(component.get?.('tagName') ?? '').toLowerCase();

  return (
    ['text', 'textnode', 'heading', 'link'].includes(type) ||
    ['p', 'span', 'a', 'label', 'li', 'small', 'strong', 'em', 'blockquote'].includes(
      tag,
    ) ||
    /^h[1-6]$/.test(tag)
  );
}

function getComponentLineage(component: Component): Component[] {
  const lineage: Component[] = [];
  let current: Component | null | undefined = component;

  while (current) {
    lineage.push(current);
    current = current.parent();
  }

  return lineage;
}

function resolveStyleTarget(
  editor: Editor,
  selectedComponent: Component,
): CssRule | Component {
  const directRule = getBestMatchingRule(editor, selectedComponent);

  if (directRule && hasTypographyStyle(directRule)) return directRule;
  if (hasTypographyStyle(selectedComponent)) return selectedComponent;

  if (isTextLikeComponent(selectedComponent)) {
    const lineage = getComponentLineage(selectedComponent).slice(1);
    for (const candidate of lineage) {
      const rule = getBestMatchingRule(editor, candidate);
      if (rule && hasTypographyStyle(rule)) return rule;
      if (hasTypographyStyle(candidate)) return candidate;
    }
  }

  return directRule ?? selectedComponent;
}

export function syncStyleManagerTarget(editor: Editor, component?: Component | null) {
  const selectedComponent = component ?? editor.getSelected();
  if (!selectedComponent) return;

  const target = resolveStyleTarget(editor, selectedComponent);
  const selectOptions = {
    component: selectedComponent,
  } as NonNullable<Parameters<Editor['StyleManager']['select']>[1]>;

  editor.StyleManager.select(
    target as unknown as Parameters<Editor['StyleManager']['select']>[0],
    selectOptions,
  );
}

interface StyleManagerPanelProps {
  visible: boolean;
  selectorMountRef: RefObject<HTMLDivElement | null>;
  stylesMountRef: RefObject<HTMLDivElement | null>;
  selectedComponentMeta?: {
    tagName?: string;
    id?: string;
    classNames?: string[];
  } | null;
}

function syncSelectorFallbackTokens(
  root: HTMLDivElement | null,
  selectedComponentMeta?: StyleManagerPanelProps['selectedComponentMeta'],
) {
  if (!root) return;

  const classNames = selectedComponentMeta?.classNames ?? [];
  const existingGhostTags = Array.from(
    root.querySelectorAll<HTMLElement>('.iccp-selector-ghost-tag'),
  );
  const existingTokens = existingGhostTags
    .map((element) => element.textContent?.trim() ?? '')
    .filter(Boolean);

  if (classNames.length > 0) {
    if (existingGhostTags.length > 0) {
      existingGhostTags.forEach((element) => element.remove());
    }
    return;
  }

  const tokens = [
    selectedComponentMeta?.tagName ? `<${selectedComponentMeta.tagName}>` : null,
    selectedComponentMeta?.id ? `#${selectedComponentMeta.id}` : null,
  ].filter((token): token is string => Boolean(token));

  if (
    tokens.length === existingTokens.length &&
    tokens.every((token, index) => token === existingTokens[index])
  ) {
    return;
  }

  if (existingGhostTags.length > 0) {
    existingGhostTags.forEach((element) => element.remove());
  }

  if (tokens.length === 0) return;

  const tagContainer = root.querySelector<HTMLElement>('.gjs-clm-tags');
  if (!tagContainer) return;

  const insertionPoint = tagContainer.querySelector<HTMLElement>(
    '#gjs-clm-new, button, input',
  );

  tokens.forEach((token) => {
    const ghostTag = document.createElement('span');
    ghostTag.className = 'gjs-clm-tag iccp-selector-ghost-tag';
    ghostTag.textContent = token;
    if (insertionPoint) {
      let directChild: HTMLElement | null = insertionPoint;
      while (directChild && directChild.parentElement !== tagContainer) {
        directChild = directChild.parentElement;
      }

      if (directChild) {
        tagContainer.insertBefore(ghostTag, directChild);
      } else {
        tagContainer.appendChild(ghostTag);
      }
    } else {
      tagContainer.appendChild(ghostTag);
    }
  });
}

export function StyleManagerPanel({
  visible,
  selectorMountRef,
  stylesMountRef,
  selectedComponentMeta,
}: StyleManagerPanelProps) {
  useEffect(() => {
    const sync = () => {
      syncSelectorFallbackTokens(selectorMountRef.current, selectedComponentMeta);
    };

    sync();

    const root = selectorMountRef.current;
    if (!root) return;

    const observer = new MutationObserver(sync);
    observer.observe(root, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [selectedComponentMeta, selectorMountRef]);

  return (
    <div
      style={{
        display: visible ? 'flex' : 'none',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div className="gjs-right-panel__selection">
        <span className="gjs-right-panel__selection-label">Selection</span>
        <div ref={selectorMountRef} className="gjs-right-panel__selector-mount" />
      </div>
      <div ref={stylesMountRef} className="gjs-right-panel__styles-mount" />
    </div>
  );
}
