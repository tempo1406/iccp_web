const MB = 1024 * 1024;

export type TeamChatUploadKind = 'image' | 'video' | 'audio' | 'file';

const ALLOWED_UPLOAD_EXTENSIONS_BY_KIND = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'aac'],
  file: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'txt', 'zip', 'rar', '7z', 'json', 'md'],
} as const;

const MIME_PREFIX_BY_KIND = {
  image: 'image/',
  video: 'video/',
  audio: 'audio/',
} as const;

const DEFAULT_EXTENSION_BY_MIME_TYPE = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'video/x-matroska': 'mkv',
  'video/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
} as const;

const DIRECT_UPLOAD_THRESHOLD_BY_KIND = {
  image: 8 * MB,
  video: 1,
  audio: 8 * MB,
  file: 12 * MB,
} as const;

const MAX_UPLOAD_SIZE_BY_KIND = {
  image: 15 * MB,
  video: 250 * MB,
  audio: 50 * MB,
  file: 100 * MB,
} as const;

export const TEAM_CHAT_UPLOAD_ACCEPT = Object.values(ALLOWED_UPLOAD_EXTENSIONS_BY_KIND)
  .flat()
  .map((extension) => `.${extension}`)
  .join(',');

export const TEAM_CHAT_UPLOAD_LIMIT_SUMMARY =
  'Images up to 15MB, videos up to 250MB, audio up to 50MB, files up to 100MB.';

function formatUploadLimitLabel(bytes: number) {
  if (bytes % MB === 0) {
    return `${bytes / MB}MB`;
  }

  return `${(bytes / MB).toFixed(1)}MB`;
}

function getFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex < 0) return '';
  return fileName.slice(lastDotIndex + 1).trim().toLowerCase();
}

const GENERIC_CLIPBOARD_FILE_NAMES = new Set([
  '',
  'image.png',
  'image.jpg',
  'image.jpeg',
  'image.webp',
  'image.gif',
  'image.bmp',
  'screenshot.png',
]);

function isClipboardLikeFileName(fileName: string) {
  const normalizedName = fileName.trim().toLowerCase();
  if (GENERIC_CLIPBOARD_FILE_NAMES.has(normalizedName)) return true;
  return normalizedName.startsWith('pasted-');
}

function buildClipboardFileName(kind: TeamChatUploadKind, extension: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const prefix =
    kind === 'image'
      ? 'pasted-image'
      : kind === 'video'
        ? 'pasted-video'
        : kind === 'audio'
          ? 'pasted-audio'
          : 'pasted-file';

  return `${prefix}-${stamp}.${extension}`;
}

function isMimeKind(fileType: string, prefix: string) {
  return fileType.trim().toLowerCase().startsWith(prefix);
}

function isExtensionAllowed(kind: TeamChatUploadKind, extension: string) {
  return ALLOWED_UPLOAD_EXTENSIONS_BY_KIND[kind].includes(extension as never);
}

function formatAllowedExtensions(kind: TeamChatUploadKind) {
  return ALLOWED_UPLOAD_EXTENSIONS_BY_KIND[kind].map((extension) => `.${extension}`).join(', ');
}

export function inferTeamChatUploadKind(file: Pick<File, 'name' | 'type'>): TeamChatUploadKind {
  const fileType = file.type.trim().toLowerCase();
  const extension = getFileExtension(file.name);

  if (isMimeKind(fileType, 'image/') || isExtensionAllowed('image', extension)) return 'image';
  if (isMimeKind(fileType, 'video/') || isExtensionAllowed('video', extension)) return 'video';
  if (isMimeKind(fileType, 'audio/') || isExtensionAllowed('audio', extension)) return 'audio';
  return 'file';
}

function validateMimeType(kind: TeamChatUploadKind, fileType: string) {
  if (kind === 'file') return true;
  if (!fileType.trim()) return true;
  return isMimeKind(fileType, MIME_PREFIX_BY_KIND[kind]);
}

export function createTeamChatClientUploadId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `upload-${crypto.randomUUID()}`;
  }

  return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function shouldUseDirectTeamChatUpload(file: File) {
  const attachmentKind = inferTeamChatUploadKind(file);
  return file.size >= DIRECT_UPLOAD_THRESHOLD_BY_KIND[attachmentKind];
}

export function normalizeTeamChatClipboardFiles(files: File[]) {
  return files.map((file) => {
    const currentName = file.name.trim();
    if (getFileExtension(currentName)) {
      return file;
    }

    const normalizedMimeType = file.type.trim().toLowerCase();
    const attachmentKind = inferTeamChatUploadKind({
      name: currentName,
      type: normalizedMimeType,
    });
    const inferredExtension = DEFAULT_EXTENSION_BY_MIME_TYPE[
      normalizedMimeType as keyof typeof DEFAULT_EXTENSION_BY_MIME_TYPE
    ];

    if (!inferredExtension || typeof File === 'undefined') {
      return file;
    }

    try {
      return new File([file], buildClipboardFileName(attachmentKind, inferredExtension), {
        type: file.type,
        lastModified: file.lastModified || Date.now(),
      });
    } catch {
      return file;
    }
  });
}

export function buildTeamChatUploadDedupKey(
  file: Pick<File, 'name' | 'size' | 'type' | 'lastModified'>,
) {
  const normalizedName = file.name.trim().toLowerCase();
  const normalizedType = file.type.trim().toLowerCase();
  const extension = getFileExtension(normalizedName);
  const isClipboardLike = isClipboardLikeFileName(normalizedName);
  const nameKey = isClipboardLike
    ? `clipboard:${normalizedType || extension || 'bin'}`
    : normalizedName || `unnamed.${extension || normalizedType || 'bin'}`;
  const modifiedKey = isClipboardLike ? 'clipboard' : String(file.lastModified || 0);

  return `${nameKey}:${file.size}:${normalizedType}:${modifiedKey}`;
}

export function validateTeamChatUploadFile(file: File): string | null {
  const attachmentKind = inferTeamChatUploadKind(file);
  const extension = getFileExtension(file.name);
  const maxSize = MAX_UPLOAD_SIZE_BY_KIND[attachmentKind];

  if (!isExtensionAllowed(attachmentKind, extension)) {
    return `${file.name} has an unsupported extension for ${attachmentKind} uploads. Allowed: ${formatAllowedExtensions(attachmentKind)}`;
  }

  if (!validateMimeType(attachmentKind, file.type ?? '')) {
    const mimePrefix =
      attachmentKind === 'image'
        ? MIME_PREFIX_BY_KIND.image
        : attachmentKind === 'video'
          ? MIME_PREFIX_BY_KIND.video
          : MIME_PREFIX_BY_KIND.audio;

    return `${file.name} must use a valid ${mimePrefix}* MIME type`;
  }

  if (file.size > maxSize) {
    return `${file.name} exceeds the ${formatUploadLimitLabel(maxSize)} limit for ${attachmentKind} files`;
  }

  return null;
}
