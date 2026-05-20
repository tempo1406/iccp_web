'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { CssRule, Editor } from 'grapesjs';

const DEFAULT_THEME = {
  primary: '#7c3aed',
  secondary: '#3b82f6',
  accent: '#f59e0b',
  success: '#22c55e',
  warning: '#ffc107',
  error: '#ef4444',
  bodyBg: '#ffffff',
  bodyColor: '#1c1c1e',
  bodySize: '1',
  bodyLh: '1.75',
  bodyFont: 'Inter, sans-serif',
  headingColor: '#1c1c1e',
  headingSize: '3',
  headingLh: '1.2',
  headingFont: 'inherit',
  subColor: '#1c1c1e',
  subSize: '2',
  subLh: '1.4',
  subFont: 'inherit',
  btnBg: '#7c3aed',
  btnColor: '#ffffff',
  btnRadius: '6',
  linkColor: '#3b82f6',
  linkDecoration: 'none',
  borderRadius: '4',
  borderColor: '#e5e5ea',
};

type Theme = typeof DEFAULT_THEME;

function GsColorRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const swatchRef = useRef<HTMLInputElement>(null);
  const safeColor = /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : '#000000';

  return (
    <div className="gjs-gs-row">
      <span className="gjs-gs-label">{label}</span>
      <div className="gjs-gs-color-wrap">
        <div className="gjs-gs-swatch" style={{ background: value }}>
          <input ref={swatchRef} type="color" value={safeColor} onChange={(event) => onChange(event.target.value)} className="gjs-gs-native-color" />
        </div>
        <input type="text" value={value} onChange={(event) => onChange(event.target.value)} className="gjs-gs-hex-input" spellCheck={false} />
      </div>
    </div>
  );
}

function GsNumRow({
  label,
  value,
  unit,
  step = '0.1',
  onChange,
}: {
  label: string;
  value: string;
  unit: string;
  step?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="gjs-gs-row">
      <span className="gjs-gs-label">{label}</span>
      <div className="gjs-gs-inline">
        <input type="number" className="gjs-gs-number-input" step={step} min="0" value={value} onChange={(event) => onChange(event.target.value)} />
        <span className="gjs-gs-unit">{unit}</span>
      </div>
    </div>
  );
}

function GsSelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { v: string; l: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="gjs-gs-row">
      <span className="gjs-gs-label">{label}</span>
      <select className="gjs-gs-select" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.v} value={option.v}>{option.l}</option>)}
      </select>
    </div>
  );
}

const FONT_OPTIONS = [
  { v: 'Inter, sans-serif', l: 'Inter' },
  { v: 'system-ui, sans-serif', l: 'System UI' },
  { v: 'Georgia, serif', l: 'Georgia' },
  { v: '"Times New Roman", serif', l: 'Times New Roman' },
  { v: '"Courier New", monospace', l: 'Courier New' },
  { v: 'inherit', l: '— Inherit —' },
];

const DECORATION_OPTIONS = [
  { v: 'none', l: 'None' },
  { v: 'underline', l: 'Underline' },
  { v: 'line-through', l: 'Line-through' },
  { v: 'overline', l: 'Overline' },
];

function GsSection({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="gjs-gs-section">
      <button className="gjs-gs-section-title" onClick={() => setOpen((previous) => !previous)}>
        <span>{title}</span>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && <div className="gjs-gs-section-body">{children}</div>}
    </div>
  );
}

function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '';

  const toHex = (value: string) => parseInt(value, 10).toString(16).padStart(2, '0');
  return `#${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`;
}

function pxToRem(px: string): string {
  const number = parseFloat(px);
  if (isNaN(number) || number === 0) return '1';
  return (number / 16).toFixed(2).replace(/\.?0+$/, '');
}

function normalizeNumber(value: string): string {
  const number = parseFloat(value);
  if (isNaN(number)) return '';
  return number.toFixed(2).replace(/\.?0+$/, '');
}

function normalizeCssUnitValue(value: string, unit: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const normalized = trimmed.toLowerCase();
  return normalized.endsWith(unit)
    ? normalizeNumber(normalized.slice(0, -unit.length))
    : normalizeNumber(trimmed);
}

function extractFirstColor(value: string): string {
  if (!value || value === 'transparent' || value === 'none') return '';

  const hex = value.match(/#(?:[0-9a-fA-F]{3,8})\b/)?.[0];
  if (hex) return hex;

  const rgb = value.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/)?.[0];
  return rgb ? rgbToHex(rgb) : '';
}

function mapFontFamilyToOption(fontFamily: string, fallback: string): string {
  const normalized = fontFamily.toLowerCase();
  if (!normalized) return fallback;
  if (normalized.includes('inter')) return 'Inter, sans-serif';
  if (normalized.includes('helvetica')) return '"Helvetica Neue", Helvetica, Arial, sans-serif';
  if (normalized.includes('georgia')) return 'Georgia, serif';
  if (normalized.includes('times new roman')) return '"Times New Roman", serif';
  if (normalized.includes('courier new')) return '"Courier New", monospace';
  if (
    normalized.includes('system-ui')
    || normalized.includes('segoe ui')
    || normalized.includes('-apple-system')
    || normalized.includes('blinkmacsystemfont')
  ) {
    return 'system-ui, sans-serif';
  }

  return fallback;
}

function toUnitlessLineHeight(lineHeight: string, fontSize: string, fallback: string): string {
  const trimmed = lineHeight.trim();
  if (!trimmed || trimmed === 'normal') return fallback;

  if (trimmed.endsWith('px')) {
    const lineHeightNumber = parseFloat(trimmed);
    const fontSizeNumber = parseFloat(fontSize);
    if (!isNaN(lineHeightNumber) && !isNaN(fontSizeNumber) && fontSizeNumber > 0) {
      return normalizeNumber(String(lineHeightNumber / fontSizeNumber));
    }
  }

  return normalizeNumber(trimmed) || fallback;
}

function normalizeSelectorText(selector: string): string {
  return selector
    .split(',')
    .map((part) => part.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .join(', ');
}

function getRuleBySelector(editor: Editor, selector: string): CssRule | undefined {
  const normalizedTarget = normalizeSelectorText(selector);
  return editor.Css.getRules().find(
    (rule) => normalizeSelectorText(rule.selectorsToString({ skipState: true })) === normalizedTarget,
  );
}

function readCanvasTheme(editor: Editor): Partial<Theme> {
  try {
    const canvasWindow = editor.Canvas.getWindow();
    if (!canvasWindow) return {};

    const document = canvasWindow.document;
    const getStyle = (element: Element | null) => (element ? canvasWindow.getComputedStyle(element) : null);
    const getValue = (style: CSSStyleDeclaration | null, property: string) => style?.getPropertyValue(property).trim() ?? '';
    const readColor = (style: CSSStyleDeclaration | null, properties: string[]) => {
      for (const property of properties) {
        const color = extractFirstColor(getValue(style, property));
        if (color) return color;
      }
      return '';
    };

    const bodyStyle = getStyle(document.body);
    if (!bodyStyle) return {};

    const headingStyle = getStyle(document.querySelector('h1'));
    const subheadingStyle = getStyle(document.querySelector('h3, h4, h5, h6'));
    const linkStyle = getStyle(document.querySelector('a'));
    const rootStyle = getStyle(document.documentElement);

    const buttonCandidates = Array.from(document.querySelectorAll<HTMLElement>('.btn, button, a[class*="btn"]'));
    const buttonElement = buttonCandidates.find((button) => {
      const buttonStyle = getStyle(button);
      const background = readColor(buttonStyle, ['background-image', 'background-color']);
      return Boolean(background && background.toLowerCase() !== '#ffffff');
    }) ?? buttonCandidates[0] ?? null;
    const buttonStyle = getStyle(buttonElement);

    const borderCandidates = Array.from(document.querySelectorAll<HTMLElement>('.btn, button, input, select, textarea, img, iframe, [style*="border"]'));
    const borderedElement = borderCandidates.find((candidate) => {
      const candidateStyle = getStyle(candidate);
      return Boolean(readColor(candidateStyle, ['border-top-color', 'border-color']));
    }) ?? buttonElement;
    const borderedStyle = getStyle(borderedElement);

    return {
      primary: extractFirstColor(getValue(rootStyle, '--theme-primary')) || DEFAULT_THEME.primary,
      secondary: extractFirstColor(getValue(rootStyle, '--theme-secondary')) || DEFAULT_THEME.secondary,
      accent: extractFirstColor(getValue(rootStyle, '--theme-accent')) || DEFAULT_THEME.accent,
      success: extractFirstColor(getValue(rootStyle, '--theme-success')) || DEFAULT_THEME.success,
      warning: extractFirstColor(getValue(rootStyle, '--theme-warning')) || DEFAULT_THEME.warning,
      error: extractFirstColor(getValue(rootStyle, '--theme-danger')) || DEFAULT_THEME.error,
      bodyBg: readColor(bodyStyle, ['background-image', 'background-color']) || DEFAULT_THEME.bodyBg,
      bodyColor: readColor(bodyStyle, ['color']) || DEFAULT_THEME.bodyColor,
      bodyFont: mapFontFamilyToOption(getValue(bodyStyle, 'font-family'), DEFAULT_THEME.bodyFont),
      bodySize: pxToRem(getValue(bodyStyle, 'font-size')),
      bodyLh: toUnitlessLineHeight(getValue(bodyStyle, 'line-height'), getValue(bodyStyle, 'font-size'), DEFAULT_THEME.bodyLh),
      headingColor: readColor(headingStyle, ['color']) || DEFAULT_THEME.headingColor,
      headingSize: headingStyle ? pxToRem(getValue(headingStyle, 'font-size')) : DEFAULT_THEME.headingSize,
      headingLh: headingStyle ? toUnitlessLineHeight(getValue(headingStyle, 'line-height'), getValue(headingStyle, 'font-size'), DEFAULT_THEME.headingLh) : DEFAULT_THEME.headingLh,
      headingFont: headingStyle ? mapFontFamilyToOption(getValue(headingStyle, 'font-family'), DEFAULT_THEME.headingFont) : DEFAULT_THEME.headingFont,
      subColor: readColor(subheadingStyle, ['color']) || DEFAULT_THEME.subColor,
      subSize: subheadingStyle ? pxToRem(getValue(subheadingStyle, 'font-size')) : DEFAULT_THEME.subSize,
      subLh: subheadingStyle ? toUnitlessLineHeight(getValue(subheadingStyle, 'line-height'), getValue(subheadingStyle, 'font-size'), DEFAULT_THEME.subLh) : DEFAULT_THEME.subLh,
      subFont: subheadingStyle ? mapFontFamilyToOption(getValue(subheadingStyle, 'font-family'), DEFAULT_THEME.subFont) : DEFAULT_THEME.subFont,
      linkColor: readColor(linkStyle, ['color']) || DEFAULT_THEME.linkColor,
      linkDecoration: ((getValue(linkStyle, 'text-decoration-line') || getValue(linkStyle, 'text-decoration')).includes('underline') ? 'underline' : 'none') as Theme['linkDecoration'],
      btnBg: readColor(buttonStyle, ['background-image', 'background-color']) || DEFAULT_THEME.btnBg,
      btnColor: readColor(buttonStyle, ['color']) || DEFAULT_THEME.btnColor,
      btnRadius: normalizeNumber(getValue(buttonStyle, 'border-radius')) || DEFAULT_THEME.btnRadius,
      borderRadius: normalizeNumber(getValue(borderedStyle, 'border-radius')) || DEFAULT_THEME.borderRadius,
      borderColor: readColor(borderedStyle, ['border-top-color', 'border-color']) || DEFAULT_THEME.borderColor,
    };
  } catch {
    return {};
  }
}

function readThemeFromRules(editor: Editor): Partial<Theme> {
  const rootStyle = getRuleBySelector(editor, ':root')?.getStyle() ?? {};
  const bodyStyle = getRuleBySelector(editor, 'body')?.getStyle() ?? {};
  const headingStyle = getRuleBySelector(editor, 'h1, h2')?.getStyle() ?? {};
  const subheadingStyle = getRuleBySelector(editor, 'h3, h4, h5, h6')?.getStyle() ?? {};
  const linkStyle = getRuleBySelector(editor, 'a')?.getStyle() ?? {};
  const buttonStyle = getRuleBySelector(editor, '.btn')?.getStyle() ?? {};
  const borderStyle = getRuleBySelector(editor, 'input, select, textarea, img, iframe')?.getStyle() ?? {};

  const getRuleValue = (style: Record<string, unknown>, property: string) => String(style[property] ?? '').trim();

  return {
    primary: extractFirstColor(getRuleValue(rootStyle, '--theme-primary')),
    secondary: extractFirstColor(getRuleValue(rootStyle, '--theme-secondary')),
    accent: extractFirstColor(getRuleValue(rootStyle, '--theme-accent')),
    success: extractFirstColor(getRuleValue(rootStyle, '--theme-success')),
    warning: extractFirstColor(getRuleValue(rootStyle, '--theme-warning')),
    error: extractFirstColor(getRuleValue(rootStyle, '--theme-danger')),
    bodyBg: extractFirstColor(getRuleValue(bodyStyle, 'background-color') || getRuleValue(bodyStyle, 'background')),
    bodyColor: extractFirstColor(getRuleValue(bodyStyle, 'color')),
    bodyFont: getRuleValue(bodyStyle, 'font-family')
      ? mapFontFamilyToOption(getRuleValue(bodyStyle, 'font-family'), getRuleValue(bodyStyle, 'font-family'))
      : '',
    bodySize: normalizeCssUnitValue(getRuleValue(bodyStyle, 'font-size'), 'rem'),
    bodyLh: normalizeNumber(getRuleValue(bodyStyle, 'line-height')),
    headingColor: extractFirstColor(getRuleValue(headingStyle, 'color')),
    headingSize: normalizeCssUnitValue(getRuleValue(headingStyle, 'font-size'), 'rem'),
    headingLh: normalizeNumber(getRuleValue(headingStyle, 'line-height')),
    headingFont: getRuleValue(headingStyle, 'font-family')
      ? mapFontFamilyToOption(getRuleValue(headingStyle, 'font-family'), getRuleValue(headingStyle, 'font-family'))
      : '',
    subColor: extractFirstColor(getRuleValue(subheadingStyle, 'color')),
    subSize: normalizeCssUnitValue(getRuleValue(subheadingStyle, 'font-size'), 'rem'),
    subLh: normalizeNumber(getRuleValue(subheadingStyle, 'line-height')),
    subFont: getRuleValue(subheadingStyle, 'font-family')
      ? mapFontFamilyToOption(getRuleValue(subheadingStyle, 'font-family'), getRuleValue(subheadingStyle, 'font-family'))
      : '',
    linkColor: extractFirstColor(getRuleValue(linkStyle, 'color')),
    linkDecoration: (getRuleValue(linkStyle, 'text-decoration') || getRuleValue(linkStyle, 'text-decoration-line')) as Theme['linkDecoration'],
    btnBg: extractFirstColor(getRuleValue(buttonStyle, 'background') || getRuleValue(buttonStyle, 'background-color')),
    btnColor: extractFirstColor(getRuleValue(buttonStyle, 'color')),
    btnRadius: normalizeCssUnitValue(getRuleValue(buttonStyle, 'border-radius'), 'px'),
    borderRadius: normalizeCssUnitValue(getRuleValue(borderStyle, 'border-radius'), 'px'),
    borderColor: extractFirstColor(getRuleValue(borderStyle, 'border-color')),
  };
}

function compactThemeValues(themePatch: Partial<Theme>): Partial<Theme> {
  return Object.fromEntries(
    Object.entries(themePatch).filter(([, value]) => typeof value !== 'string' || value.trim() !== ''),
  ) as Partial<Theme>;
}

export function GlobalStylesPanel({ editor }: { editor: Editor | null }) {
  const t = useTranslations('siteStudio.globalStyles');
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const fontOptions = FONT_OPTIONS.map((option) => ({
    ...option,
    l: option.v === 'system-ui, sans-serif'
      ? t('options.systemUi')
      : option.v === 'inherit'
        ? t('options.inherit')
        : option.l,
  }));
  const decorationOptions = DECORATION_OPTIONS.map((option) => ({
    ...option,
    l: option.v === 'none'
      ? t('options.none')
      : option.v === 'underline'
        ? t('options.underline')
        : option.v === 'line-through'
          ? t('options.lineThrough')
          : option.v === 'overline'
            ? t('options.overline')
            : option.l,
  }));

  const applyThemeGroup = useCallback((nextTheme: Theme, changedKey?: keyof Theme) => {
    if (!editor) return;

    const shouldApply = (keys: (keyof Theme)[]) => !changedKey || keys.includes(changedKey);

    if (shouldApply(['primary', 'secondary', 'accent', 'success', 'warning', 'error'])) {
      editor.Css.setRule(':root', {
        '--theme-primary': nextTheme.primary,
        '--theme-secondary': nextTheme.secondary,
        '--theme-accent': nextTheme.accent,
        '--theme-success': nextTheme.success,
        '--theme-warning': nextTheme.warning,
        '--theme-danger': nextTheme.error,
      }, { addStyles: true });
    }

    if (shouldApply(['bodyBg', 'bodyColor', 'bodyFont', 'bodySize', 'bodyLh'])) {
      editor.Css.setRule('body', {
        'background-color': nextTheme.bodyBg,
        color: nextTheme.bodyColor,
        'font-family': nextTheme.bodyFont,
        'font-size': `${nextTheme.bodySize}rem`,
        'line-height': nextTheme.bodyLh,
      }, { addStyles: true });
    }

    if (shouldApply(['headingColor', 'headingSize', 'headingLh', 'headingFont'])) {
      editor.Css.setRule('h1, h2', {
        color: nextTheme.headingColor,
        'font-size': `${nextTheme.headingSize}rem`,
        'line-height': nextTheme.headingLh,
        'font-family': nextTheme.headingFont,
      }, { addStyles: true });
    }

    if (shouldApply(['subColor', 'subSize', 'subLh', 'subFont'])) {
      editor.Css.setRule('h3, h4, h5, h6', {
        color: nextTheme.subColor,
        'font-size': `${nextTheme.subSize}rem`,
        'line-height': nextTheme.subLh,
        'font-family': nextTheme.subFont,
      }, { addStyles: true });
    }

    if (shouldApply(['linkColor', 'linkDecoration'])) {
      editor.Css.setRule('a', {
        color: nextTheme.linkColor,
        'text-decoration': nextTheme.linkDecoration,
      }, { addStyles: true });
    }

    if (shouldApply(['btnBg', 'btnColor', 'btnRadius'])) {
      editor.Css.setRule('.btn', {
        background: nextTheme.btnBg,
        color: nextTheme.btnColor,
        'border-radius': `${nextTheme.btnRadius}px`,
      }, { addStyles: true });
    }

    if (shouldApply(['borderRadius', 'borderColor'])) {
      editor.Css.setRule('input, select, textarea, img, iframe', {
        'border-radius': `${nextTheme.borderRadius}px`,
        'border-color': nextTheme.borderColor,
      }, { addStyles: true });
    }
  }, [editor]);

  const hydrateTheme = useCallback(() => {
    if (!editor) return;

    const mergedTheme = {
      ...DEFAULT_THEME,
      ...readCanvasTheme(editor),
      ...compactThemeValues(readThemeFromRules(editor)),
    } as Theme;

    setTheme(mergedTheme);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const refreshTheme = () => {
      requestAnimationFrame(() => {
        hydrateTheme();
      });
    };

    refreshTheme();
    editor.on('canvas:frame:load', refreshTheme);
    editor.on('load', refreshTheme);

    const canvasDocument = editor.Canvas.getDocument();
    void canvasDocument?.fonts?.ready
      ?.then(() => refreshTheme())
      .catch(() => undefined);

    return () => {
      editor.off('canvas:frame:load', refreshTheme);
      editor.off('load', refreshTheme);
    };
  }, [editor, hydrateTheme]);

  const updateThemeValue = (key: keyof Theme, value: string) => {
    const nextTheme = { ...theme, [key]: value };
    setTheme(nextTheme);
    applyThemeGroup(nextTheme, key);
  };

  return (
    <div className="gjs-global-styles">
      <GsSection title={t('sections.colors')}>
        <GsColorRow label={t('labels.primary')} value={theme.primary} onChange={(value) => updateThemeValue('primary', value)} />
        <GsColorRow label={t('labels.secondary')} value={theme.secondary} onChange={(value) => updateThemeValue('secondary', value)} />
        <GsColorRow label={t('labels.accent')} value={theme.accent} onChange={(value) => updateThemeValue('accent', value)} />
        <GsColorRow label={t('labels.success')} value={theme.success} onChange={(value) => updateThemeValue('success', value)} />
        <GsColorRow label={t('labels.warning')} value={theme.warning} onChange={(value) => updateThemeValue('warning', value)} />
        <GsColorRow label={t('labels.error')} value={theme.error} onChange={(value) => updateThemeValue('error', value)} />
      </GsSection>

      <GsSection title={t('sections.body')}>
        <GsColorRow label={t('labels.background')} value={theme.bodyBg} onChange={(value) => updateThemeValue('bodyBg', value)} />
        <GsColorRow label={t('labels.color')} value={theme.bodyColor} onChange={(value) => updateThemeValue('bodyColor', value)} />
        <GsNumRow label={t('labels.fontSize')} value={theme.bodySize} unit="rem" step="0.1" onChange={(value) => updateThemeValue('bodySize', value)} />
        <GsNumRow label={t('labels.lineHeight')} value={theme.bodyLh} unit="" step="0.05" onChange={(value) => updateThemeValue('bodyLh', value)} />
        <GsSelectRow label={t('labels.fontFamily')} value={theme.bodyFont} options={fontOptions} onChange={(value) => updateThemeValue('bodyFont', value)} />
      </GsSection>

      <GsSection title={t('sections.heading')}>
        <GsColorRow label={t('labels.color')} value={theme.headingColor} onChange={(value) => updateThemeValue('headingColor', value)} />
        <GsNumRow label={t('labels.fontSize')} value={theme.headingSize} unit="rem" step="0.5" onChange={(value) => updateThemeValue('headingSize', value)} />
        <GsNumRow label={t('labels.lineHeight')} value={theme.headingLh} unit="" step="0.1" onChange={(value) => updateThemeValue('headingLh', value)} />
        <GsSelectRow label={t('labels.fontFamily')} value={theme.headingFont} options={fontOptions} onChange={(value) => updateThemeValue('headingFont', value)} />
      </GsSection>

      <GsSection title={t('sections.subheading')}>
        <GsColorRow label={t('labels.color')} value={theme.subColor} onChange={(value) => updateThemeValue('subColor', value)} />
        <GsNumRow label={t('labels.fontSize')} value={theme.subSize} unit="rem" step="0.25" onChange={(value) => updateThemeValue('subSize', value)} />
        <GsNumRow label={t('labels.lineHeight')} value={theme.subLh} unit="" step="0.1" onChange={(value) => updateThemeValue('subLh', value)} />
        <GsSelectRow label={t('labels.fontFamily')} value={theme.subFont} options={fontOptions} onChange={(value) => updateThemeValue('subFont', value)} />
      </GsSection>

      <GsSection title={t('sections.buttons')}>
        <GsColorRow label={t('labels.background')} value={theme.btnBg} onChange={(value) => updateThemeValue('btnBg', value)} />
        <GsColorRow label={t('labels.color')} value={theme.btnColor} onChange={(value) => updateThemeValue('btnColor', value)} />
        <GsNumRow label={t('labels.borderRadius')} value={theme.btnRadius} unit="px" step="1" onChange={(value) => updateThemeValue('btnRadius', value)} />
      </GsSection>

      <GsSection title={t('sections.links')}>
        <GsColorRow label={t('labels.color')} value={theme.linkColor} onChange={(value) => updateThemeValue('linkColor', value)} />
        <GsSelectRow label={t('labels.decoration')} value={theme.linkDecoration} options={decorationOptions} onChange={(value) => updateThemeValue('linkDecoration', value)} />
      </GsSection>

      <GsSection title={t('sections.borders')}>
        <GsNumRow label={t('labels.borderRadius')} value={theme.borderRadius} unit="px" step="1" onChange={(value) => updateThemeValue('borderRadius', value)} />
        <GsColorRow label={t('labels.borderColor')} value={theme.borderColor} onChange={(value) => updateThemeValue('borderColor', value)} />
      </GsSection>
    </div>
  );
}
