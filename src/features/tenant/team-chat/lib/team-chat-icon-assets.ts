import {
  Archive,
  FileImage,
  FileText,
  PlayCircle,
  Presentation,
  Table2,
  type LucideIcon,
} from 'lucide-react';
import type { FileKind } from '../data/team-chat-ui-data';

type TeamChatAttachmentKind = 'file' | 'image' | 'video' | 'audio';

interface ResolveTeamChatFileIconParams {
  attachmentType?: TeamChatAttachmentKind | null;
  kind?: FileKind | null;
  documentType?: string | null;
  fileName?: string | null;
  fileUrl?: string | null;
  mimeType?: string | null;
}

export interface TeamChatIconDescriptor {
  assetPath?: string;
  fallbackIcon: LucideIcon;
}

const ICON_ASSET_PATHS = {
  archive: '/icons/zip-icon.svg',
  calendar: '/icons/icon-calendar.svg',
  docs: '/icons/icon-ggdocs.svg',
  drive: '/icons/icon-ggdrive.svg',
  excel: '/icons/icon-excel.svg',
  file: '/icons/icon-file-generic.svg',
  gmail: '/icons/icon-gmail.svg',
  google: '/icons/icon-google.svg',
  json: '/icons/icon-json.svg',
  markdown: '/icons/icon-markdown.svg',
  pdf: '/icons/icon-pdf.svg',
  powerpoint: '/icons/icon-powerpoint.svg',
  rar: '/icons/rar-icon.svg',
  sheets: '/icons/icon-ggsheet.svg',
  slides: '/icons/icon-ggslides.svg',
  word: '/icons/icon-microsoftword.svg',
} as const;

function getFileExtension(fileName?: string | null) {
  const normalizedName = fileName?.trim();
  if (!normalizedName) return '';

  const lastDotIndex = normalizedName.lastIndexOf('.');
  if (lastDotIndex < 0) return '';

  return normalizedName.slice(lastDotIndex + 1).trim().toLowerCase();
}

function normalizePreviewUrl(url?: string | null) {
  const trimmedUrl = url?.trim();
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

function resolveFallbackIcon(
  kind?: FileKind | null,
  attachmentType?: TeamChatAttachmentKind | null,
): LucideIcon {
  if (attachmentType === 'image' || kind === 'image') return FileImage;
  if (attachmentType === 'video' || kind === 'video') return PlayCircle;
  if (kind === 'spreadsheet') return Table2;
  if (kind === 'presentation') return Presentation;
  if (kind === 'archive') return Archive;
  return FileText;
}

function resolveDocumentTypeAsset(documentType?: string | null) {
  const normalizedDocumentType = documentType?.trim().toLowerCase();

  if (normalizedDocumentType === 'pdf') return ICON_ASSET_PATHS.pdf;
  if (normalizedDocumentType === 'word') return ICON_ASSET_PATHS.word;
  if (normalizedDocumentType === 'excel') return ICON_ASSET_PATHS.excel;
  if (normalizedDocumentType === 'powerpoint') return ICON_ASSET_PATHS.powerpoint;
  if (normalizedDocumentType === 'archive') return ICON_ASSET_PATHS.archive;
  if (normalizedDocumentType === 'text') return ICON_ASSET_PATHS.file;

  return undefined;
}

function resolveMimeTypeAsset(mimeType?: string | null) {
  const normalizedMimeType = mimeType?.trim().toLowerCase();
  if (!normalizedMimeType) return undefined;

  if (normalizedMimeType.includes('pdf')) return ICON_ASSET_PATHS.pdf;
  if (
    normalizedMimeType.includes('msword') ||
    normalizedMimeType.includes('wordprocessingml')
  ) {
    return ICON_ASSET_PATHS.word;
  }
  if (
    normalizedMimeType.includes('spreadsheet') ||
    normalizedMimeType.includes('excel') ||
    normalizedMimeType.includes('csv')
  ) {
    return ICON_ASSET_PATHS.excel;
  }
  if (
    normalizedMimeType.includes('presentation') ||
    normalizedMimeType.includes('powerpoint')
  ) {
    return ICON_ASSET_PATHS.powerpoint;
  }
  if (normalizedMimeType.includes('json')) return ICON_ASSET_PATHS.json;
  if (normalizedMimeType.includes('markdown')) return ICON_ASSET_PATHS.markdown;
  if (
    normalizedMimeType.includes('rar') ||
    normalizedMimeType.includes('zip') ||
    normalizedMimeType.includes('tar') ||
    normalizedMimeType.includes('7z')
  ) {
    return ICON_ASSET_PATHS.archive;
  }

  return undefined;
}

function resolveExtensionAsset(extension: string) {
  if (extension === 'pdf') return ICON_ASSET_PATHS.pdf;
  if (extension === 'doc' || extension === 'docx') return ICON_ASSET_PATHS.word;
  if (extension === 'xls' || extension === 'xlsx' || extension === 'csv') {
    return ICON_ASSET_PATHS.excel;
  }
  if (extension === 'ppt' || extension === 'pptx') return ICON_ASSET_PATHS.powerpoint;
  if (extension === 'json') return ICON_ASSET_PATHS.json;
  if (extension === 'md') return ICON_ASSET_PATHS.markdown;
  if (extension === 'rar') return ICON_ASSET_PATHS.rar;
  if (extension === 'zip' || extension === '7z' || extension === 'tar' || extension === 'gz') {
    return ICON_ASSET_PATHS.archive;
  }
  if (extension === 'txt') return ICON_ASSET_PATHS.file;

  return undefined;
}

function resolveGoogleIconAsset(url?: string | null) {
  const parsedUrl = normalizePreviewUrl(url);
  if (!parsedUrl) return undefined;

  const hostname = parsedUrl.hostname.replace(/^www\./i, '').toLowerCase();
  const pathname = parsedUrl.pathname.toLowerCase();

  if (hostname === 'docs.google.com') {
    if (pathname.includes('/spreadsheets/')) return ICON_ASSET_PATHS.sheets;
    if (pathname.includes('/presentation/')) return ICON_ASSET_PATHS.slides;
    if (pathname.includes('/document/')) return ICON_ASSET_PATHS.docs;
  }

  if (hostname === 'drive.google.com') return ICON_ASSET_PATHS.drive;
  if (hostname === 'mail.google.com' || hostname === 'gmail.com') return ICON_ASSET_PATHS.gmail;
  if (hostname === 'calendar.google.com') return ICON_ASSET_PATHS.calendar;
  if (hostname.endsWith('google.com')) return ICON_ASSET_PATHS.google;

  return undefined;
}

export function resolveTeamChatFileIconDescriptor({
  attachmentType,
  kind,
  documentType,
  fileName,
  fileUrl,
  mimeType,
}: ResolveTeamChatFileIconParams): TeamChatIconDescriptor {
  const fallbackIcon = resolveFallbackIcon(kind, attachmentType);

  if (attachmentType === 'image' || attachmentType === 'video') {
    return { fallbackIcon };
  }

  return {
    assetPath:
      resolveGoogleIconAsset(fileUrl) ??
      resolveDocumentTypeAsset(documentType) ??
      resolveExtensionAsset(getFileExtension(fileName)) ??
      resolveMimeTypeAsset(mimeType) ??
      (kind === 'document' ? ICON_ASSET_PATHS.file : undefined),
    fallbackIcon,
  };
}

export function resolveTeamChatProviderIconAsset(params: {
  provider?: string | null;
  providerName?: string | null;
  siteName?: string | null;
  url?: string | null;
}) {
  const urlIconAsset = resolveGoogleIconAsset(params.url);
  if (urlIconAsset) return urlIconAsset;

  const tokens = [params.provider, params.providerName, params.siteName]
    .map((value) => value?.trim().toLowerCase())
    .filter((value): value is string => Boolean(value));

  if (tokens.some((token) => token.includes('google sheets'))) return ICON_ASSET_PATHS.sheets;
  if (tokens.some((token) => token.includes('google slides'))) return ICON_ASSET_PATHS.slides;
  if (tokens.some((token) => token.includes('google docs'))) return ICON_ASSET_PATHS.docs;
  if (tokens.some((token) => token.includes('google drive'))) return ICON_ASSET_PATHS.drive;
  if (tokens.some((token) => token.includes('gmail'))) return ICON_ASSET_PATHS.gmail;
  if (tokens.some((token) => token.includes('google calendar'))) return ICON_ASSET_PATHS.calendar;
  if (tokens.some((token) => token.includes('google'))) return ICON_ASSET_PATHS.google;

  return undefined;
}

