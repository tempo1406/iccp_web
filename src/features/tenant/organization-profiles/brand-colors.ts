export interface BrandColorDef {
  readonly id: string;
  readonly name: string;
  readonly hex: string;
  /** Text color to use ON TOP of this brand color (for badges, buttons) */
  readonly fg: string;
  /** 10% tint — for active background highlights */
  readonly light: string;
  /** 20% tint — for borders / hover states */
  readonly muted: string;
}

export const BRAND_COLORS: readonly BrandColorDef[] = [
  { id: 'ocean-blue', name: 'Ocean Blue', hex: '#3B82F6', fg: '#ffffff', light: '#3B82F61A', muted: '#3B82F633' },
  { id: 'indigo',     name: 'Indigo',     hex: '#6366F1', fg: '#ffffff', light: '#6366F11A', muted: '#6366F133' },
  { id: 'emerald',    name: 'Emerald',    hex: '#10B981', fg: '#ffffff', light: '#10B9811A', muted: '#10B98133' },
  { id: 'amber',      name: 'Amber',      hex: '#F59E0B', fg: '#1a1a1a', light: '#F59E0B1A', muted: '#F59E0B33' },
  { id: 'rose',       name: 'Rose',       hex: '#F43F5E', fg: '#ffffff', light: '#F43F5E1A', muted: '#F43F5E33' },
  { id: 'violet',     name: 'Violet',     hex: '#8B5CF6', fg: '#ffffff', light: '#8B5CF61A', muted: '#8B5CF633' },
  { id: 'slate',      name: 'Slate',      hex: '#475569', fg: '#ffffff', light: '#4755691A', muted: '#47556933' },
] as const;

export const DEFAULT_BRAND = BRAND_COLORS[0]; // Ocean Blue

/**
 * Returns the matching preset for a stored hex string.
 * Falls back to DEFAULT_BRAND so the UI always has a valid value.
 */
export function resolveBrandColor(hex?: string | null): BrandColorDef {
  if (!hex) return DEFAULT_BRAND;
  return (
    BRAND_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase()) ?? DEFAULT_BRAND
  );
}
