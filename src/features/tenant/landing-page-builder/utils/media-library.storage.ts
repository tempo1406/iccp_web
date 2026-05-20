'use client';

export type MediaAssetKind = 'image' | 'video';

export interface MediaAsset {
  url: string;
  fileId: string;
  name: string;
  kind: MediaAssetKind;
}

function storageKey(orgSlug: string): string {
  return `iccp:landing-page:media-library:${orgSlug}`;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readMediaLibrary(orgSlug: string): MediaAsset[] {
  if (!orgSlug.trim() || !canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(storageKey(orgSlug));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is MediaAsset => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as Partial<MediaAsset>;
      return (
        typeof candidate.url === 'string' &&
        typeof candidate.fileId === 'string' &&
        typeof candidate.name === 'string' &&
        (candidate.kind === 'image' || candidate.kind === 'video')
      );
    });
  } catch {
    return [];
  }
}

export function writeMediaLibrary(orgSlug: string, assets: MediaAsset[]) {
  if (!orgSlug.trim() || !canUseStorage()) return;

  try {
    window.localStorage.setItem(storageKey(orgSlug), JSON.stringify(assets));
  } catch {
    // Ignore storage failures. Upload/delete should still continue.
  }
}
