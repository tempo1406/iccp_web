'use client';

import type {
  ComposerAttachmentDraft,
  ComposerAttachmentKind,
} from './team-chat-screen.shared';
import { inferTeamChatUploadKind } from './team-chat-upload.utils';

function createAttachmentDraftId() {
  return `composer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readFileWithProgress(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const progress = Math.min(100, Math.max(0, Math.round((event.loaded / event.total) * 100)));
      onProgress?.(progress);
    };

    reader.onload = () => resolve();
    reader.onerror = () => reject(reader.error ?? new Error('Failed to prepare attachment preview'));
    reader.readAsArrayBuffer(file);
  });
}

function loadImageMetadata(url: string): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({});
    image.src = url;
  });
}

function loadVideoMetadata(
  url: string,
): Promise<{ width?: number; height?: number; durationMs?: number }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        durationMs: Number.isFinite(video.duration) ? Math.round(video.duration * 1000) : undefined,
      });
    };
    video.onerror = () => resolve({});
    video.src = url;
  });
}

export function inferComposerAttachmentKind(file: File): ComposerAttachmentKind {
  return inferTeamChatUploadKind(file) as ComposerAttachmentKind;
}

export function formatAttachmentSizeLabel(value?: number | string | null): string {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed <= 0) return '--';

  if (parsed < 1024) return `${parsed} B`;
  if (parsed < 1024 * 1024) return `${(parsed / 1024).toFixed(1)} KB`;
  if (parsed < 1024 * 1024 * 1024) return `${(parsed / (1024 * 1024)).toFixed(1)} MB`;
  return `${(parsed / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function isMediaAttachmentKind(kind: ComposerAttachmentKind): boolean {
  return kind === 'image' || kind === 'video';
}

export function createComposerAttachmentPlaceholder(
  file: File,
  options?: { id?: string },
): ComposerAttachmentDraft {
  const attachmentType = inferComposerAttachmentKind(file);
  const previewUrl = isMediaAttachmentKind(attachmentType) ? URL.createObjectURL(file) : undefined;

  return {
    id: options?.id ?? createAttachmentDraftId(),
    file,
    fileName: file.name,
    mimeType: file.type,
    attachmentType,
    fileSizeLabel: formatAttachmentSizeLabel(file.size),
    previewUrl,
    previewProgress: previewUrl ? 0 : 100,
    previewStatus: previewUrl ? 'preparing' : 'ready',
  };
}

export async function createComposerAttachmentDraft(
  file: File,
  onProgress?: (progress: number) => void,
  options?: { id?: string; previewUrl?: string },
): Promise<ComposerAttachmentDraft> {
  const draft = createComposerAttachmentPlaceholder(file, { id: options?.id });
  if (options?.previewUrl) {
    draft.previewUrl = options.previewUrl;
  }

  if (!draft.previewUrl) {
    return draft;
  }

  try {
    await readFileWithProgress(file, onProgress);
    onProgress?.(100);

    if (draft.attachmentType === 'image') {
      return {
        ...draft,
        ...((await loadImageMetadata(draft.previewUrl)) ?? {}),
        previewProgress: 100,
        previewStatus: 'ready',
      };
    }

    if (draft.attachmentType === 'video') {
      return {
        ...draft,
        ...((await loadVideoMetadata(draft.previewUrl)) ?? {}),
        previewProgress: 100,
        previewStatus: 'ready',
      };
    }

    return {
      ...draft,
      previewProgress: 100,
      previewStatus: 'ready',
    };
  } catch (error) {
    return {
      ...draft,
      previewProgress: 100,
      previewStatus: 'failed',
      error: error instanceof Error ? error.message : 'Failed to prepare attachment preview',
    };
  }
}
