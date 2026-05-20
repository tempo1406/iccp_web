import {
  FileImage,
  FileSpreadsheet,
  FileText,
  Globe,
  PlayCircle,
  Presentation,
  type LucideIcon,
} from 'lucide-react';
import { appConfig } from '@/common/constant/app';
import type { LinkPreview } from '../data/team-chat-ui-data';
import { resolveTeamChatProviderIconAsset } from './team-chat-icon-assets';
import { hasExplicitTeamChatLinkPreviewAssetState } from './team-chat-preview-state.utils';

export type TeamChatLinkPreviewKind =
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'image'
  | 'video'
  | 'website';

export interface ResolvedTeamChatLinkPreview {
  title: string;
  description?: string;
  hostLabel: string;
  sourceLabel: string;
  kind: TeamChatLinkPreviewKind;
  icon: LucideIcon;
  providerLabel: string;
  providerIconUrl?: string;
  subtitle: string;
  fallbackLabel: string;
  previewImageUrl?: string;
  previewImageAlt: string;
  durationLabel?: string;
  embedUrl?: string;
  status?: string;
}

function isAbsoluteAssetUrl(url: string) {
  return /^[a-z][a-z0-9+\-.]*:/i.test(url);
}

function normalizePreviewUrl(url: string) {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;

  try {
    return new URL(trimmedUrl);
  } catch {
    if (trimmedUrl.startsWith('//')) {
      try {
        return new URL(`https:${trimmedUrl}`);
      } catch {
        return null;
      }
    }

    if (/^[a-z0-9.-]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(trimmedUrl)) {
      try {
        return new URL(`https://${trimmedUrl}`);
      } catch {
        return null;
      }
    }

    return null;
  }
}

function resolveAssetBaseUrl() {
  const configuredBaseUrl = appConfig.apiBaseUrl?.trim();
  if (configuredBaseUrl) return configuredBaseUrl;
  if (typeof window !== 'undefined') return window.location.origin;
  return undefined;
}

export function resolveTeamChatAssetUrl(url?: string | null) {
  const normalizedUrl = url?.trim();
  if (!normalizedUrl) return undefined;

  if (
    normalizedUrl.startsWith('data:') ||
    normalizedUrl.startsWith('blob:') ||
    isAbsoluteAssetUrl(normalizedUrl)
  ) {
    return normalizedUrl;
  }

  if (normalizedUrl.startsWith('//')) {
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}${normalizedUrl}`;
    }

    return `https:${normalizedUrl}`;
  }

  const baseUrl = resolveAssetBaseUrl();
  if (!baseUrl) return normalizedUrl;

  try {
    return new URL(normalizedUrl, baseUrl).toString();
  } catch {
    return normalizedUrl;
  }
}

export function isProtectedTeamChatAssetUrl(url?: string | null) {
  const resolvedUrl = resolveTeamChatAssetUrl(url);
  if (!resolvedUrl) return false;

  const matchesProtectedPath = (value: string) =>
    value.includes('/api/v1/chat-box/link-previews/google-assets/') ||
    value.includes('/api/v1/chat-box/rooms/');

  try {
    const parsedUrl = new URL(resolvedUrl);
    return matchesProtectedPath(parsedUrl.pathname);
  } catch {
    return matchesProtectedPath(resolvedUrl);
  }
}

function normalizeText(value?: string | null) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
}

function coalesceText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalizedValue = normalizeText(value);
    if (normalizedValue) return normalizedValue;
  }

  return undefined;
}

function getPreviewUrlValue(preview: LinkPreview) {
  return coalesceText(preview.displayUrl, preview.canonicalUrl, preview.url) ?? preview.url;
}

function getHostLabel(url: string) {
  const parsedUrl = normalizePreviewUrl(url);
  if (!parsedUrl) return url;
  return parsedUrl.hostname.replace(/^www\./i, '');
}

function getSourceLabel(url: string) {
  const parsedUrl = normalizePreviewUrl(url);
  if (!parsedUrl) return url;

  const normalizedPath = `${parsedUrl.hostname}${parsedUrl.pathname}`.replace(/\/$/, '');
  const trimmedSearch = parsedUrl.search.replace(/^\?/, '');
  if (!trimmedSearch) return normalizedPath;

  return `${normalizedPath}?${trimmedSearch}`.slice(0, 112);
}

function inferGoogleWorkspaceKind(url: string): TeamChatLinkPreviewKind | null {
  const parsedUrl = normalizePreviewUrl(url);
  if (!parsedUrl) return null;

  if (!/docs\.google\.com$/i.test(parsedUrl.hostname)) return null;

  if (parsedUrl.pathname.includes('/spreadsheets/')) return 'spreadsheet';
  if (parsedUrl.pathname.includes('/presentation/')) return 'presentation';
  if (parsedUrl.pathname.includes('/document/')) return 'document';

  return null;
}

function inferLinkPreviewKind(preview: LinkPreview): TeamChatLinkPreviewKind {
  const previewUrl = getPreviewUrlValue(preview);
  const tokens = [
    preview.resourceType,
    preview.resourceTypeLabel,
    preview.mediaType,
    preview.mimeType,
    preview.type,
    preview.provider,
    preview.providerName,
    preview.siteName,
  ]
    .map((value) => value?.toLowerCase())
    .filter(Boolean);

  const googleWorkspaceKind = inferGoogleWorkspaceKind(previewUrl);
  if (googleWorkspaceKind) return googleWorkspaceKind;

  if (tokens.some((token) => token?.includes('spreadsheet') || token?.includes('sheet'))) {
    return 'spreadsheet';
  }

  if (tokens.some((token) => token?.includes('presentation') || token?.includes('slide'))) {
    return 'presentation';
  }

  if (tokens.some((token) => token?.includes('document') || token?.includes('doc'))) {
    return 'document';
  }

  if (
    tokens.some(
      (token) =>
        token?.includes('video') ||
        token?.includes('youtube') ||
        token?.includes('vimeo') ||
        token?.includes('loom'),
    )
  ) {
    return 'video';
  }

  if (tokens.some((token) => token?.includes('image') || token?.startsWith('image/'))) {
    return 'image';
  }

  return 'website';
}

function resolveKindFallbackTitle(kind: TeamChatLinkPreviewKind): string {
  if (kind === 'spreadsheet') return 'Google spreadsheet';
  if (kind === 'presentation') return 'Google presentation';
  if (kind === 'document') return 'Google document';
  if (kind === 'image') return 'Image preview';
  if (kind === 'video') return 'Video preview';
  return 'Website preview';
}

function resolveKindSubtitle(kind: TeamChatLinkPreviewKind, providerLabel: string): string {
  if (kind === 'spreadsheet') return 'Spreadsheet in Google Sheets';
  if (kind === 'presentation') return 'Presentation in Google Slides';
  if (kind === 'document') return 'Document in Google Docs';
  if (kind === 'image') return `Image shared from ${providerLabel}`;
  if (kind === 'video') return `Video preview from ${providerLabel}`;
  return `Shared from ${providerLabel}`;
}

function resolveKindIcon(kind: TeamChatLinkPreviewKind): LucideIcon {
  if (kind === 'spreadsheet') return FileSpreadsheet;
  if (kind === 'presentation') return Presentation;
  if (kind === 'document') return FileText;
  if (kind === 'image') return FileImage;
  if (kind === 'video') return PlayCircle;
  return Globe;
}

function resolveProviderLabel(kind: TeamChatLinkPreviewKind, preview: LinkPreview) {
  if (kind === 'spreadsheet') return coalesceText(preview.providerName, 'Google Sheets') ?? 'Google Sheets';
  if (kind === 'presentation') return coalesceText(preview.providerName, 'Google Slides') ?? 'Google Slides';
  if (kind === 'document') return coalesceText(preview.providerName, 'Google Docs') ?? 'Google Docs';

  return (
    coalesceText(preview.providerName, preview.siteName, preview.provider) ??
    getHostLabel(getPreviewUrlValue(preview))
  );
}

function shouldReplaceGenericTitle(title: string, kind: TeamChatLinkPreviewKind) {
  const normalizedTitle = title.trim().toLowerCase();
  if (!normalizedTitle) return true;

  const genericTitles = new Set([
    'google document',
    'google spreadsheet',
    'google presentation',
    'image preview',
    'video preview',
    'website preview',
  ]);

  if (kind === 'website') {
    return normalizedTitle === 'website preview';
  }

  return genericTitles.has(normalizedTitle);
}

function formatDurationLabel(durationMs?: number) {
  if (!Number.isFinite(durationMs) || !durationMs || durationMs <= 0) return undefined;

  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}



export function resolveTeamChatLinkPreviewHeroImageUrl(preview: LinkPreview) {
  const directPreviewImageUrl = coalesceText(preview.previewImageUrl);
  if (directPreviewImageUrl) return directPreviewImageUrl;
  if (hasExplicitTeamChatLinkPreviewAssetState(preview)) return undefined;
  return coalesceText(preview.imageUrl, preview.thumbnailUrl);
}
export function resolveTeamChatLinkPreview(
  preview: LinkPreview,
): ResolvedTeamChatLinkPreview {
  const previewUrl = getPreviewUrlValue(preview);
  const kind = inferLinkPreviewKind(preview);
  const providerLabel = resolveProviderLabel(kind, preview);
  const normalizedTitle = coalesceText(preview.resourceTitle, preview.title);
  const subtitle =
    coalesceText(preview.resourceTypeLabel) ?? resolveKindSubtitle(kind, providerLabel);
  const hostLabel = getHostLabel(previewUrl);
  const caption = normalizeText(preview.caption);
  const normalizedDescription = coalesceText(preview.description, preview.excerpt);
  const title =
    !normalizedTitle || shouldReplaceGenericTitle(normalizedTitle, kind)
      ? resolveKindFallbackTitle(kind)
      : normalizedTitle;
  const description =
    normalizedDescription && normalizedDescription !== subtitle
      ? normalizedDescription
      : caption && caption !== providerLabel && caption !== hostLabel && caption !== subtitle
        ? caption
        : undefined;
  const previewImageUrl = resolveTeamChatLinkPreviewHeroImageUrl(preview);
  const providerIconUrl =
    resolveTeamChatProviderIconAsset({
      provider: preview.provider,
      providerName: preview.providerName,
      siteName: preview.siteName,
      url: previewUrl,
    }) ?? coalesceText(preview.providerIconUrl);

  return {
    title,
    description,
    hostLabel,
    sourceLabel: getSourceLabel(previewUrl),
    kind,
    icon: resolveKindIcon(kind),
    providerLabel,
    providerIconUrl,
    subtitle,
    fallbackLabel: kind.toUpperCase(),
    previewImageUrl,
    previewImageAlt: coalesceText(preview.previewImageAlt, normalizedTitle, title) ?? title,
    durationLabel: formatDurationLabel(preview.durationMs),
    embedUrl: coalesceText(preview.embedUrl),
    status: coalesceText(preview.status),
  };
}


