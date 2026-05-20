'use client';

import { type CSSProperties, useEffect, useMemo } from 'react';
import { resolveBrandColor } from '@/features/tenant/organization-profiles/brand-colors';
import { useOrgBranding } from '@/features/tenant/organization-profiles/query/use-org-profile';

const BRAND_SCOPE_KEYS = [
  '--brand',
  '--brand-fg',
  '--brand-light',
  '--brand-muted',
  '--primary',
  '--primary-foreground',
  '--color-primary',
  '--color-primary-foreground',
  '--accent',
  '--accent-foreground',
  '--color-accent',
  '--color-accent-foreground',
  '--ring',
  '--color-ring',
  '--sidebar-primary',
  '--sidebar-primary-foreground',
  '--sidebar-accent',
  '--sidebar-accent-foreground',
  '--sidebar-ring',
  '--color-sidebar-primary',
  '--color-sidebar-primary-foreground',
  '--color-sidebar-accent',
  '--color-sidebar-accent-foreground',
  '--color-sidebar-ring',
] as const;

type BrandScopeKey = (typeof BRAND_SCOPE_KEYS)[number];
type BrandScopeStyle = CSSProperties & Record<BrandScopeKey, string>;

function buildBrandScopeStyle(hex: string, fg: string, light: string, muted: string): BrandScopeStyle {
  return {
    '--brand': hex,
    '--brand-fg': fg,
    '--brand-light': light,
    '--brand-muted': muted,
    '--primary': hex,
    '--primary-foreground': fg,
    '--color-primary': hex,
    '--color-primary-foreground': fg,
    '--accent': light,
    '--accent-foreground': hex,
    '--color-accent': light,
    '--color-accent-foreground': hex,
    '--ring': hex,
    '--color-ring': hex,
    '--sidebar-primary': hex,
    '--sidebar-primary-foreground': fg,
    '--sidebar-accent': light,
    '--sidebar-accent-foreground': hex,
    '--sidebar-ring': hex,
    '--color-sidebar-primary': hex,
    '--color-sidebar-primary-foreground': fg,
    '--color-sidebar-accent': light,
    '--color-sidebar-accent-foreground': hex,
    '--color-sidebar-ring': hex,
  };
}

function applyBrandScope(target: HTMLElement, style: BrandScopeStyle) {
  for (const key of BRAND_SCOPE_KEYS) {
    target.style.setProperty(key, style[key]);
  }
}

function clearBrandScope(target: HTMLElement) {
  for (const key of BRAND_SCOPE_KEYS) {
    target.style.removeProperty(key);
  }
}

/**
 * BrandColorProvider
 *
 * Loads the active tenant brand and scopes the accent tokens to the tenant tree.
 * The same tokens are mirrored onto <body> while the tenant workspace is mounted
 * so portaled UI (dialogs, popovers, sheets) uses the same brand color without
 * leaking it once the provider unmounts.
 */
export function BrandColorProvider({ children }: { children: React.ReactNode }) {
  const { data: branding } = useOrgBranding();
  const resolved = resolveBrandColor(branding?.brandColor);

  const style = useMemo(
    () =>
      buildBrandScopeStyle(
        resolved.hex,
        resolved.fg,
        resolved.light,
        resolved.muted,
      ),
    [resolved.fg, resolved.hex, resolved.light, resolved.muted],
  );

  useEffect(() => {
    applyBrandScope(document.body, style);
    return () => {
      clearBrandScope(document.body);
    };
  }, [style]);

  return (
    <div data-brand-scope="tenant" style={style}>
      {children}
    </div>
  );
}
