'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  ExternalLink,
  Play,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ConversationMessageAttachment, FileKind } from '../data/team-chat-ui-data';
import {
  fileKindLabel,
  focusRingClass,
  type UploadingAttachmentDraft,
} from '../lib/team-chat-screen.shared';
import { formatAttachmentSizeLabel, isMediaAttachmentKind } from '../lib/team-chat-media.utils';
import { resolveTeamChatAssetUrl } from '../lib/team-chat-link-preview.utils';
import {
  hasRealTeamChatAttachmentThumbnail,
  isTeamChatAttachmentPreviewPending,
  resolveTeamChatAttachmentDocumentPreviewUrl,
} from '../lib/team-chat-preview-state.utils';
import { useTeamChatProtectedAssetUrl } from '../hooks/use-team-chat-protected-asset-url';
import { TeamChatConfirmActionDialog } from './team-chat-confirm-action-dialog';
import {
  TeamChatMediaViewerDialog,
  type TeamChatMediaViewerItem,
} from './team-chat-media-viewer-dialog';
import { TeamChatFileTypeIcon } from './team-chat-file-type-icon';
import { TeamChatTextDocumentPreviewSurface } from './team-chat-text-document-preview-surface';

interface TeamChatMessageAttachmentsProps {
  attachments?: ConversationMessageAttachment[];
  isOwn?: boolean;
  messageId: string;
  onDeleteAttachment: (messageId: string, attachmentId: string) => void;
  onRetryUploadingAttachment?: (messageId: string, attachmentId: string) => void;
  onRemoveUploadingAttachment?: (messageId: string, attachmentId: string) => void;
  uploadingAttachments?: UploadingAttachmentDraft[];
  displayMode?: 'default' | 'compact';
}

interface AttachmentCardItem {
  id: string;
  fileName: string;
  kind: 'file' | 'image' | 'video' | 'audio';
  mimeType: string;
  sizeLabel?: string;
  src?: string;
  thumbnailSrcSmall?: string;
  thumbnailSrc?: string;
  thumbnailSrcMedium?: string;
  fileHref?: string;
  previewHref?: string;
  openHref?: string;
  downloadHref?: string;
  isUploading: boolean;
  progress?: number;
  error?: string;
  isRemote: boolean;
  documentType?: string;
  previewStatus?: string;
  previewErrorCode?: string;
  previewVersion?: string;
  previewAssetSource?: string;
  previewUpdatedAt?: string;
}

function normalizeDocumentKind(item: AttachmentCardItem): FileKind {
  const documentType = item.documentType?.trim().toLowerCase();

  if (item.kind === 'image') return 'image';
  if (item.kind === 'video') return 'video';
  if (documentType === 'excel') return 'spreadsheet';
  if (documentType === 'powerpoint') return 'presentation';
  if (documentType === 'archive') return 'archive';
  if (item.mimeType.includes('spreadsheet') || item.mimeType.includes('excel')) return 'spreadsheet';
  if (item.mimeType.includes('presentation') || item.mimeType.includes('powerpoint')) return 'presentation';
  if (
    item.mimeType.includes('zip') ||
    item.mimeType.includes('rar') ||
    item.mimeType.includes('tar') ||
    item.mimeType.includes('7z')
  ) {
    return 'archive';
  }

  return 'document';
}

const TEXT_DOCUMENT_PREVIEW_EXTENSIONS = new Set(['txt', 'md', 'csv', 'json']);

function getAttachmentFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex < 0) return '';
  return fileName.slice(lastDotIndex + 1).trim().toLowerCase();
}

function isTextLikeDocumentPreview(item: AttachmentCardItem) {
  const documentType = item.documentType?.trim().toLowerCase();
  const mimeType = item.mimeType.trim().toLowerCase();
  const extension = getAttachmentFileExtension(item.fileName);

  return (
    documentType === 'text' ||
    TEXT_DOCUMENT_PREVIEW_EXTENSIONS.has(extension) ||
    mimeType.includes('application/json') ||
    mimeType.includes('text/plain') ||
    mimeType.includes('text/markdown') ||
    mimeType.includes('text/csv')
  );
}

const TEXT_DOCUMENT_PREVIEW_CHAR_LIMIT = 3200;
const TEXT_DOCUMENT_PREVIEW_LINE_LIMIT = 12;
const textDocumentPreviewCache = new Map<string, string>();
const textDocumentPreviewRequestCache = new Map<string, Promise<string>>();

function normalizeTextDocumentPreviewContent(
  rawText: string,
  params: {
    fileName: string;
    mimeType: string;
  },
) {
  const normalizedText = rawText.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const extension = getAttachmentFileExtension(params.fileName);
  const normalizedMimeType = params.mimeType.trim().toLowerCase();
  const shouldPrettyPrintJson =
    (extension === 'json' || normalizedMimeType.includes('json')) &&
    normalizedText.length <= 20000;

  if (shouldPrettyPrintJson) {
    try {
      return JSON.stringify(JSON.parse(normalizedText), null, 2);
    } catch {
      return normalizedText;
    }
  }

  return normalizedText;
}

function buildTextDocumentPreviewLines(content: string) {
  return content
    .replace(/\t/g, '  ')
    .split('\n')
    .map((line) => line.replace(/\s+$/g, ''))
    .slice(0, TEXT_DOCUMENT_PREVIEW_LINE_LIMIT)
    .map((line) => {
      if (!line.length) return ' ';
      return line.length > 96 ? line.slice(0, 93) + '...' : line;
    });
}

async function fetchTextDocumentPreviewContent(
  url: string,
  params: {
    fileName: string;
    mimeType: string;
  },
) {
  const cacheKey = `${url}:${params.fileName}:${params.mimeType}`;
  const cachedContent = textDocumentPreviewCache.get(cacheKey);
  if (cachedContent) return cachedContent;

  const cachedRequest = textDocumentPreviewRequestCache.get(cacheKey);
  if (cachedRequest) return cachedRequest;

  const request = fetch(url, {
    cache: 'force-cache',
    credentials: 'omit',
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Text preview request failed with status ${response.status}`);
      }

      const rawText = await response.text();
      const normalizedPreview = normalizeTextDocumentPreviewContent(rawText, params)
        .trim()
        .slice(0, TEXT_DOCUMENT_PREVIEW_CHAR_LIMIT);

      if (!normalizedPreview.length) {
        throw new Error('Text preview content is empty');
      }

      textDocumentPreviewCache.set(cacheKey, normalizedPreview);
      return normalizedPreview;
    })
    .finally(() => {
      textDocumentPreviewRequestCache.delete(cacheKey);
    });

  textDocumentPreviewRequestCache.set(cacheKey, request);
  return request;
}
function isDocumentPreviewSupported(item: AttachmentCardItem) {
  const documentType = item.documentType?.trim().toLowerCase();

  if (documentType) {
    return (
      documentType === 'word' ||
      documentType === 'excel' ||
      documentType === 'powerpoint' ||
      documentType === 'pdf' ||
      documentType === 'text'
    );
  }

  return (
    item.mimeType.includes('pdf') ||
    item.mimeType.includes('msword') ||
    item.mimeType.includes('wordprocessingml') ||
    item.mimeType.includes('spreadsheet') ||
    item.mimeType.includes('excel') ||
    item.mimeType.includes('presentation') ||
    item.mimeType.includes('powerpoint') ||
    item.mimeType.includes('text/plain') ||
    item.mimeType.includes('text/markdown') ||
    item.mimeType.includes('text/csv') ||
    item.mimeType.includes('application/json')
  );
}

function canRenderReadyDocumentPreview(item: AttachmentCardItem) {
  if (!item.isRemote || item.kind !== 'file') return false;
  if (!isDocumentPreviewSupported(item)) return false;

  return hasRealTeamChatAttachmentThumbnail({
    previewStatus: item.previewStatus,
    previewAssetSource: item.previewAssetSource,
    thumbnailUrl: item.thumbnailSrc,
    thumbnailUrlMedium: item.thumbnailSrcMedium,
  });
}

function canRenderPendingDocumentPreview(item: AttachmentCardItem) {
  if (!item.isRemote || item.kind !== 'file') return false;
  if (!isDocumentPreviewSupported(item)) return false;

  return isTeamChatAttachmentPreviewPending({
    previewStatus: item.previewStatus,
  });
}

function openInNewTab(href?: string) {
  if (!href || typeof window === 'undefined') return;
  window.open(href, '_blank', 'noopener,noreferrer');
}

function DocumentPreviewCard({
  item,
  displayMode = 'default',
}: {
  item: AttachmentCardItem;
  displayMode?: 'default' | 'compact';
}) {
  const isCompact = displayMode === 'compact';
  const displayKind = normalizeDocumentKind(item);
  const previewSrc = resolveTeamChatAttachmentDocumentPreviewUrl({
    previewStatus: item.previewStatus,
    previewAssetSource: item.previewAssetSource,
    thumbnailUrl: item.thumbnailSrc,
    thumbnailUrlMedium: item.thumbnailSrcMedium,
  });
  const versionToken = item.previewVersion ?? item.previewUpdatedAt;
  const isTextPreview = isTextLikeDocumentPreview(item);
  const previewFileHref = item.fileHref ?? item.openHref ?? item.downloadHref;
  const { assetUrl: previewAssetUrl, isLoading: isPreviewLoading } = useTeamChatProtectedAssetUrl(
    previewSrc,
    versionToken,
  );
  const {
    assetUrl: textPreviewAssetUrl,
    isLoading: isTextPreviewAssetLoading,
  } = useTeamChatProtectedAssetUrl(isTextPreview ? previewFileHref : undefined, versionToken);
  const previewAssetKey = previewAssetUrl ?? '';
  const [imageState, setImageState] = useState({
    assetKey: '',
    loaded: false,
    failed: false,
  });
  const [textPreviewState, setTextPreviewState] = useState<{
    assetKey: string;
    content: string;
    status: 'idle' | 'loading' | 'ready' | 'failed';
  }>({
    assetKey: '',
    content: '',
    status: 'idle',
  });
  const imageLoaded = imageState.assetKey === previewAssetKey && imageState.loaded;
  const imageFailed = imageState.assetKey === previewAssetKey && imageState.failed;

  const currentTextPreviewAssetKey = textPreviewAssetUrl
    ? textPreviewAssetUrl + ':' + (versionToken ?? 'base')
    : '';

  useEffect(() => {
    if (!isTextPreview || !textPreviewAssetUrl) {
      return;
    }

    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) return;
      setTextPreviewState((current) => {
        if (
          current.assetKey === currentTextPreviewAssetKey &&
          (current.status === 'ready' || current.status === 'loading')
        ) {
          return current;
        }

        return {
          assetKey: currentTextPreviewAssetKey,
          content: '',
          status: 'loading',
        };
      });
    });

    void fetchTextDocumentPreviewContent(textPreviewAssetUrl, {
      fileName: item.fileName,
      mimeType: item.mimeType,
    })
      .then((nextContent) => {
        if (isCancelled) return;
        setTextPreviewState((current) => {
          if (
            current.assetKey === currentTextPreviewAssetKey &&
            current.status === 'ready' &&
            current.content === nextContent
          ) {
            return current;
          }

          return {
            assetKey: currentTextPreviewAssetKey,
            content: nextContent,
            status: 'ready',
          };
        });
      })
      .catch(() => {
        if (isCancelled) return;
        setTextPreviewState((current) => {
          if (
            current.assetKey === currentTextPreviewAssetKey &&
            current.status === 'failed' &&
            current.content === ''
          ) {
            return current;
          }

          return {
            assetKey: currentTextPreviewAssetKey,
            content: '',
            status: 'failed',
          };
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [
    currentTextPreviewAssetKey,
    isTextPreview,
    item.fileName,
    item.mimeType,
    textPreviewAssetUrl,
  ]);

  const textPreviewLines = useMemo(
    () => buildTextDocumentPreviewLines(textPreviewState.content),
    [textPreviewState.content],
  );
  const isTextPreviewReady =
    isTextPreview &&
    textPreviewState.assetKey === currentTextPreviewAssetKey &&
    textPreviewState.status === 'ready' &&
    textPreviewLines.length > 0;
  const isTextPreviewLoading =
    isTextPreview &&
    (isTextPreviewAssetLoading ||
      (textPreviewState.assetKey === currentTextPreviewAssetKey && textPreviewState.status === 'loading'));
  const shouldRenderImagePreview = !isTextPreviewReady && !isTextPreviewLoading;

  if (((!previewAssetUrl && !isPreviewLoading) || imageFailed) && !isTextPreviewReady && !isTextPreviewLoading) {
    return <GenericAttachmentRow item={item} displayMode={displayMode} />;
  }

  return (
    <div
      className={cn(
        'group/document-card bg-card/70 relative overflow-hidden border border-border/70',
        isCompact ? 'rounded-[20px]' : 'rounded-[24px]',
      )}
    >
      <button
        type="button"
        onClick={() => openInNewTab(item.openHref)}
        className={cn('block w-full cursor-pointer text-left', focusRingClass)}
      >
        <div
          className={cn(
            'flex items-start gap-3 border-b border-border/70',
            isCompact ? 'px-3 py-2.5' : 'px-4 py-3',
          )}
        >
          <span
            className={cn(
              'bg-primary/10 text-primary inline-flex shrink-0 items-center justify-center rounded-2xl border border-primary/15',
              isCompact ? 'h-9 w-9' : 'h-11 w-11',
            )}
          >
            <TeamChatFileTypeIcon
              className={cn(isCompact && 'h-[58%] w-[58%]')}
              attachmentType={item.kind}
              documentType={item.documentType}
              fileName={item.fileName}
              fileUrl={item.fileHref ?? item.openHref ?? item.downloadHref}
              kind={displayKind}
              mimeType={item.mimeType}
            />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'truncate font-semibold text-foreground',
                isCompact ? 'text-sm' : 'text-base',
              )}
            >
              {item.fileName}
            </p>
            <p className={cn('mt-1 text-muted-foreground', isCompact ? 'text-xs' : 'text-sm')}>
              {fileKindLabel(displayKind)}
            </p>
          </div>
        </div>
        <div
          className={cn(
            'relative overflow-hidden bg-[#081224]',
            'aspect-[16/9]',
          )}
        >
          {isTextPreviewReady || isTextPreviewLoading ? (
            <TeamChatTextDocumentPreviewSurface
              fileName={item.fileName}
              isLoading={isTextPreviewLoading && !isTextPreviewReady}
              lines={textPreviewLines}
            />
          ) : null}

          {shouldRenderImagePreview && previewAssetUrl ? (
            <img
              key={previewAssetKey}
              src={previewAssetUrl}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className={cn(
                isCompact
                  ? 'h-full w-full object-cover transition-[opacity,transform] duration-300'
                  : 'h-full w-full object-cover transition-[opacity,transform] duration-300 group-hover/document-card:scale-[1.01]',
                imageLoaded ? 'opacity-100' : 'opacity-0',
              )}
              onLoad={() =>
                setImageState({
                  assetKey: previewAssetKey,
                  loaded: true,
                  failed: false,
                })
              }
              onError={() =>
                setImageState({
                  assetKey: previewAssetKey,
                  loaded: false,
                  failed: true,
                })
              }
            />
          ) : null}

          {((!imageLoaded && shouldRenderImagePreview && previewAssetUrl) ||
            (!isTextPreviewReady && !shouldRenderImagePreview && isTextPreviewLoading) ||
            (isPreviewLoading && !isTextPreviewReady && shouldRenderImagePreview)) ? (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800" />
          ) : null}
        </div>
        {item.sizeLabel ? (
          <div
            className={cn(
              'border-t border-border/70 text-xs text-muted-foreground',
              isCompact ? 'px-3 py-2' : 'px-4 py-3',
            )}
          >
            {item.sizeLabel}
          </div>
        ) : null}
      </button>

      {item.isRemote && item.downloadHref ? (
        <a
          href={item.downloadHref}
          download={item.fileName}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className={cn(
            'bg-background/92 text-foreground hover:bg-background absolute top-3 right-14 z-10 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border/80 opacity-0 shadow-sm backdrop-blur transition-all duration-200 group-hover/document-card:opacity-100 focus:opacity-100',
            isCompact && 'top-2.5 right-12 h-8 w-8',
            focusRingClass,
          )}
          aria-label={'Download ' + item.fileName}
        >
          <Download className="h-4 w-4" />
        </a>
      ) : null}

      {item.isRemote && item.openHref ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openInNewTab(item.openHref);
          }}
          className={cn(
            'bg-background/92 text-foreground hover:bg-background absolute top-3 right-3 z-10 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border/80 opacity-0 shadow-sm backdrop-blur transition-all duration-200 group-hover/document-card:opacity-100 focus:opacity-100',
            isCompact && 'top-2.5 right-2.5 h-8 w-8',
            focusRingClass,
          )}
          aria-label={'Open ' + item.fileName}
        >
          <ExternalLink className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

function PendingDocumentPreviewCard({
  item,
  displayMode = 'default',
}: {
  item: AttachmentCardItem;
  displayMode?: 'default' | 'compact';
}) {
  const isCompact = displayMode === 'compact';
  return (
    <div
      className={cn(
        'group/document-card bg-card/70 relative overflow-hidden border border-border/70',
        isCompact ? 'rounded-[20px]' : 'rounded-[24px]',
      )}
    >
      <div
        className={cn(
          'flex items-start gap-3 border-b border-border/70',
          isCompact ? 'px-3 py-2.5' : 'px-4 py-3',
        )}
      >
        <span
          className={cn(
            'bg-primary/10 text-primary inline-flex shrink-0 items-center justify-center rounded-2xl border border-primary/15',
            isCompact ? 'h-9 w-9' : 'h-11 w-11',
          )}
        >
          <TeamChatFileTypeIcon
            attachmentType={item.kind}
            className={cn(isCompact && 'h-[58%] w-[58%]')}
            documentType={item.documentType}
            fileName={item.fileName}
            fileUrl={item.fileHref ?? item.openHref ?? item.downloadHref}
            kind={normalizeDocumentKind(item)}
            mimeType={item.mimeType}
          />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate font-semibold text-foreground',
              isCompact ? 'text-sm' : 'text-base',
            )}
          >
            {item.fileName}
          </p>
        </div>
      </div>

      <div
        className={cn(
          'relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_28%),linear-gradient(160deg,#091225_0%,#0d1730_50%,#111c38_100%)]',
          'aspect-[16/9]',
        )}
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_28%)]" />
        <div
          className={cn(
            'relative flex h-full items-center justify-center',
            isCompact ? 'p-3 sm:p-3.5' : 'p-5 sm:p-6',
          )}
        >
          <div
            className={cn(
              'w-full overflow-hidden border border-slate-200/80 bg-white shadow-[0_24px_70px_-36px_rgba(15,23,42,0.9)]',
              isCompact
                ? 'h-full max-h-[252px] max-w-[452px] rounded-[28px]'
                : 'h-full max-h-[252px] max-w-[452px] rounded-[28px]',
            )}
          >
            <div
              className={cn(
                'flex items-center gap-2 border-b border-slate-100',
                isCompact ? 'px-3 py-2' : 'px-5 py-3.5',
              )}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
              <div className={cn('ml-3 h-2.5 rounded-full bg-slate-200', isCompact ? 'w-20' : 'w-24')} />
            </div>
            <div
              className={cn(
                'grid h-[calc(100%-57px)] grid-cols-[minmax(0,1.55fr)_minmax(0,0.9fr)]',
                isCompact ? 'gap-2.5 p-3' : 'gap-4 p-5',
              )}
            >
              <div className="flex min-h-0 flex-col gap-3">
                <div className="h-3 w-4/5 rounded-full bg-slate-100" />
                <div className="h-3 w-full rounded-full bg-slate-100" />
                <div className="h-3 w-11/12 rounded-full bg-slate-100" />
                <div className="h-3 w-8/12 rounded-full bg-slate-100" />
                <div className="mt-auto h-20 rounded-[18px] bg-slate-50" />
              </div>
              <div className="flex min-h-0 flex-col gap-3">
                <div className="h-20 rounded-[18px] bg-slate-100" />
                <div className="rounded-[18px] bg-slate-50 p-3">
                  <div className="space-y-2">
                    <div className="h-2.5 w-full rounded-full bg-slate-200" />
                    <div className="h-2.5 w-4/5 rounded-full bg-slate-200" />
                    <div className="h-2.5 w-3/5 rounded-full bg-slate-200" />
                  </div>
                </div>
                <div className="mt-auto h-12 rounded-[18px] bg-slate-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {item.sizeLabel ? (
        <div
          className={cn(
            'border-t border-border/70 text-xs text-muted-foreground',
            isCompact ? 'px-3 py-2' : 'px-4 py-3',
          )}
        >
          {item.sizeLabel}
        </div>
      ) : null}

      {item.isRemote && item.downloadHref ? (
        <a
          href={item.downloadHref}
          download={item.fileName}
          target="_blank"
          rel="noreferrer"
          className={cn(
            'bg-background/92 text-foreground hover:bg-background absolute top-3 right-14 z-10 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border/80 opacity-0 shadow-sm backdrop-blur transition-all duration-200 group-hover/document-card:opacity-100 focus:opacity-100',
            isCompact && 'top-2.5 right-12 h-8 w-8',
            focusRingClass,
          )}
          aria-label={`Download ${item.fileName}`}
        >
          <Download className="h-4 w-4" />
        </a>
      ) : null}

      {item.isRemote && item.openHref ? (
        <button
          type="button"
          onClick={() => openInNewTab(item.openHref)}
          className={cn(
            'bg-background/92 text-foreground hover:bg-background absolute top-3 right-3 z-10 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border/80 opacity-0 shadow-sm backdrop-blur transition-all duration-200 group-hover/document-card:opacity-100 focus:opacity-100',
            isCompact && 'top-2.5 right-2.5 h-8 w-8',
            focusRingClass,
          )}
          aria-label={`Open ${item.fileName}`}
        >
          <ExternalLink className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

function GenericAttachmentRow({
  item,
  onRetryFailedUpload,
  onRemoveFailedUpload,
  displayMode = 'default',
}: {
  item: AttachmentCardItem;
  onRetryFailedUpload?: (attachmentId: string) => void;
  onRemoveFailedUpload?: (attachmentId: string) => void;
  displayMode?: 'default' | 'compact';
}) {
  const isCompact = displayMode === 'compact';
  const displayKind = normalizeDocumentKind(item);
  const hasUploadError = Boolean(item.error?.trim()) && !item.isRemote;
  const errorLabel = hasUploadError ? item.error?.trim() : undefined;

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-xl border border-border bg-card/60',
        isCompact ? 'gap-2.5 px-3 py-2' : 'gap-3 px-3 py-2.5',
      )}
    >
      <div className="min-w-0 flex items-center gap-3">
        <span
          className={cn(
            'bg-primary/12 text-primary inline-flex shrink-0 items-center justify-center rounded-2xl',
            isCompact ? 'h-9 w-9' : 'h-10 w-10',
          )}
        >
          <TeamChatFileTypeIcon
            attachmentType={item.kind}
            className="h-[60%] w-[60%]"
            documentType={item.documentType}
            fileName={item.fileName}
            fileUrl={item.fileHref ?? item.openHref ?? item.downloadHref}
            kind={displayKind}
            mimeType={item.mimeType}
          />
        </span>
        <div className="min-w-0">
          {item.isRemote && item.openHref ? (
            <button
              type="button"
              onClick={() => openInNewTab(item.openHref)}
              className={cn(
                'cursor-pointer truncate text-left text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline hover:underline-offset-2',
                focusRingClass,
              )}
            >
              {item.fileName}
            </button>
          ) : (
            <p className="truncate text-sm font-medium text-foreground">{item.fileName}</p>
          )}
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{item.kind === 'audio' ? 'Audio' : fileKindLabel(displayKind)}</span>
            {item.sizeLabel ? <span>{item.sizeLabel}</span> : null}
            {item.isUploading ? <span>{item.progress ?? 0}%</span> : null}
          </div>
          {item.isUploading ? (
            <Progress value={item.progress ?? 0} className="mt-2 h-1.5 max-w-[220px]" />
          ) : null}
          {errorLabel ? (
            <div role="alert" className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="font-medium text-rose-300/90" title={errorLabel}>{errorLabel}</span>
              {onRetryFailedUpload ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRetryFailedUpload(item.id)}
                  className="text-foreground/85 hover:text-foreground h-6 rounded-full px-2.5 text-[11px]"
                >
                  Retry
                </Button>
              ) : null}
              {onRemoveFailedUpload ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveFailedUpload(item.id)}
                  className="text-muted-foreground hover:text-foreground h-6 rounded-full px-2.5 text-[11px]"
                >
                  Remove
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {item.isRemote && item.downloadHref ? (
          <a
            href={item.downloadHref}
            download={item.fileName}
            target="_blank"
            rel="noreferrer"
            className={cn(
              'text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors',
              focusRingClass,
            )}
            aria-label={`Download ${item.fileName}`}
          >
            <Download className="h-4 w-4" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function TeamChatMessageAttachments({
  attachments,
  isOwn: _isOwn,
  messageId,
  onDeleteAttachment: _onDeleteAttachment,
  onRetryUploadingAttachment,
  onRemoveUploadingAttachment,
  uploadingAttachments,
  displayMode = 'default',
}: TeamChatMessageAttachmentsProps) {
  const isCompact = displayMode === 'compact';
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [attachmentToRemove, setAttachmentToRemove] = useState<AttachmentCardItem | null>(null);

  const cardItems = useMemo<AttachmentCardItem[]>(() => {
    const remoteItems = (attachments ?? []).map((attachment) => {
      const fileUrl = resolveTeamChatAssetUrl(attachment.fileUrl) ?? attachment.fileUrl;
      const previewUrl = resolveTeamChatAssetUrl(attachment.previewUrl ?? undefined);
      const openUrl =
        resolveTeamChatAssetUrl(attachment.openUrl ?? undefined) ??
        previewUrl ??
        fileUrl;
      const downloadUrl =
        resolveTeamChatAssetUrl(attachment.downloadUrl ?? undefined) ??
        attachment.downloadUrl ??
        fileUrl;
      const thumbnailUrlSmall = resolveTeamChatAssetUrl(attachment.thumbnailUrlSmall ?? undefined);
      const thumbnailUrlMedium = resolveTeamChatAssetUrl(attachment.thumbnailUrlMedium ?? undefined);
      const thumbnailUrl = resolveTeamChatAssetUrl(attachment.thumbnailUrl ?? undefined);
      const isRemoteMedia = isMediaAttachmentKind(attachment.attachmentType);

      return {
        id: attachment.id,
        fileName: attachment.fileName,
        kind: attachment.attachmentType,
        mimeType: attachment.mimeType ?? '',
        sizeLabel: formatAttachmentSizeLabel(attachment.fileSize),
        src: isRemoteMedia ? previewUrl ?? fileUrl : undefined,
        thumbnailSrcSmall: thumbnailUrlSmall,
        thumbnailSrc: thumbnailUrl,
        thumbnailSrcMedium: thumbnailUrlMedium,
        fileHref: fileUrl,
        previewHref: previewUrl,
        openHref: openUrl,
        downloadHref: downloadUrl,
        isUploading: false,
        progress: 100,
        error: undefined,
        isRemote: true,
        documentType: attachment.documentType ?? undefined,
        previewStatus: attachment.previewStatus ?? undefined,
        previewErrorCode: attachment.previewErrorCode ?? undefined,
        previewVersion: attachment.previewVersion ?? undefined,
        previewAssetSource: attachment.previewAssetSource ?? undefined,
        previewUpdatedAt: attachment.previewUpdatedAt ?? undefined,
      };
    });

    const localItems = (uploadingAttachments ?? []).map((attachment) => {
      const localPreviewUrl = resolveTeamChatAssetUrl(attachment.previewUrl);
      const isLocalMedia =
        isMediaAttachmentKind(attachment.attachmentType) && Boolean(localPreviewUrl);

      return {
        id: attachment.id,
        fileName: attachment.fileName,
        kind: attachment.attachmentType,
        mimeType: attachment.mimeType,
        sizeLabel: attachment.fileSizeLabel,
        src: isLocalMedia ? localPreviewUrl : undefined,
        thumbnailSrcSmall: isLocalMedia ? localPreviewUrl : undefined,
        thumbnailSrc: isLocalMedia ? localPreviewUrl : undefined,
        thumbnailSrcMedium: isLocalMedia ? localPreviewUrl : undefined,
        fileHref: localPreviewUrl,
        previewHref: undefined,
        openHref: localPreviewUrl,
        downloadHref: localPreviewUrl,
        isUploading: attachment.status === 'uploading',
        progress: attachment.progress,
        error: attachment.error,
        isRemote: false,
        documentType: undefined,
        previewStatus: attachment.status === 'failed' ? 'failed' : undefined,
        previewErrorCode: undefined,
        previewVersion: undefined,
        previewAssetSource: undefined,
        previewUpdatedAt: undefined,
      };
    });

    return [...localItems, ...remoteItems];
  }, [attachments, uploadingAttachments]);

  const handleRetryFailedUpload = (attachmentId: string) => {
    onRetryUploadingAttachment?.(messageId, attachmentId);
  };

  const handleRemoveFailedUpload = (attachmentId: string) => {
    const target = cardItems.find((item) => item.id === attachmentId && !item.isRemote);
    if (!target) return;
    setAttachmentToRemove(target);
  };

  const mediaItems = useMemo<TeamChatMediaViewerItem[]>(
    () =>
      cardItems
        .filter((item) => isMediaAttachmentKind(item.kind) && Boolean(item.src))
        .map((item) => ({
          id: item.id,
          type: item.kind === 'video' ? 'video' : 'image',
          src: item.src!,
          alt: item.fileName,
          fileName: item.fileName,
          sizeLabel: item.sizeLabel,
          statusLabel: item.isUploading ? `Uploading ${item.progress ?? 0}%` : item.error,
        })),
    [cardItems],
  );

  const openViewer = (attachmentId: string) => {
    const nextIndex = mediaItems.findIndex((item) => item.id === attachmentId);
    if (nextIndex < 0) return;
    setViewerIndex(nextIndex);
    setViewerOpen(true);
  };

  if (!cardItems.length) {
    return null;
  }

  const mediaCards = cardItems.filter((item) => isMediaAttachmentKind(item.kind) && item.src);
  const nonMediaCards = cardItems.filter((item) => !isMediaAttachmentKind(item.kind) || !item.src);
  const readyDocumentCards = nonMediaCards.filter(canRenderReadyDocumentPreview);
  const pendingDocumentCards = nonMediaCards.filter(
    (item) => !canRenderReadyDocumentPreview(item) && canRenderPendingDocumentPreview(item),
  );
  const genericFileCards = nonMediaCards.filter(
    (item) => !canRenderReadyDocumentPreview(item) && !canRenderPendingDocumentPreview(item),
  );

  return (
    <>
      <div className={cn(isCompact ? 'mt-2 space-y-2' : 'mt-3 space-y-3')}>
        {mediaCards.length ? (
          <div
            className={cn(
              'grid gap-3',
              isCompact
                ? 'max-w-full grid-cols-1'
                : mediaCards.length === 1
                  ? 'max-w-[560px] grid-cols-1'
                  : 'max-w-[720px] grid-cols-2',
            )}
          >
            {mediaCards.map((item) => (
              <div
                key={item.id}
                className="group/media-card bg-card/70 relative overflow-hidden rounded-[24px] border border-border/70"
              >
                <button
                  type="button"
                  onClick={() => openViewer(item.id)}
                  aria-label={`Open ${item.fileName}`}
                  className={cn(
                    'relative block w-full cursor-pointer overflow-hidden bg-black/85 text-left',
                    isCompact ? 'max-h-[132px] aspect-[16/9]' : 'aspect-[4/3]',
                    focusRingClass,
                  )}
                >
                  {item.kind === 'image' ? (
                    <img
                      src={item.thumbnailSrcSmall ?? item.thumbnailSrcMedium ?? item.thumbnailSrc ?? item.src}
                      alt=""
                      aria-hidden="true"
                      className="h-full w-full object-cover transition-transform duration-200 group-hover/media-card:scale-[1.015]"
                    />
                  ) : (
                    <video
                      src={item.thumbnailSrcSmall ?? item.thumbnailSrcMedium ?? item.thumbnailSrc ?? item.src}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/10 to-black/10 opacity-85 transition-opacity duration-200 group-hover/media-card:opacity-100" />
                  {item.kind === 'video' ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-black/58 text-white shadow-lg backdrop-blur">
                        <Play className="ml-0.5 h-5 w-5" />
                      </span>
                    </span>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 px-4 pb-3 pt-10">
                    <p className="truncate text-sm font-semibold text-white">{item.fileName}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-white/80">
                      {item.sizeLabel ? <span>{item.sizeLabel}</span> : null}
                      {item.isUploading ? <span>{item.progress ?? 0}%</span> : null}
                    </div>
                    {item.isUploading ? (
                      <Progress value={item.progress ?? 0} className="mt-2 h-1.5 bg-white/20" />
                    ) : null}
                    {!item.isRemote && item.error ? (
                      <div role="alert" className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-white/85">
                        <span className="line-clamp-1 font-medium text-rose-200" title={item.error}>{item.error}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRetryFailedUpload(item.id);
                          }}
                          className="h-6 rounded-full bg-white/10 px-2.5 text-[11px] text-white hover:bg-white/18 hover:text-white"
                        >
                          Retry
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRemoveFailedUpload(item.id);
                          }}
                          className="h-6 rounded-full bg-white/6 px-2.5 text-[11px] text-white/80 hover:bg-white/14 hover:text-white"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </button>

                {item.isRemote && item.src ? (
                  <a
                    href={item.downloadHref ?? item.openHref ?? item.src}
                    download={item.fileName}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className={cn(
                      'bg-background/92 text-foreground hover:bg-background pointer-events-none absolute top-3 left-3 z-10 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border/80 opacity-0 shadow-sm backdrop-blur transition-all duration-200 group-hover/media-card:pointer-events-auto group-hover/media-card:opacity-100 focus:pointer-events-auto focus:opacity-100',
                      focusRingClass,
                    )}
                    aria-label={`Download ${item.fileName}`}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {readyDocumentCards.length ? (
          <div className={cn(isCompact ? 'max-w-full space-y-2' : 'max-w-[560px] space-y-3')}>
            {readyDocumentCards.map((item) => (
              <DocumentPreviewCard key={item.id} item={item} displayMode={displayMode} />
            ))}
          </div>
        ) : null}

        {pendingDocumentCards.length ? (
          <div className={cn(isCompact ? 'max-w-full space-y-2' : 'max-w-[560px] space-y-3')}>
            {pendingDocumentCards.map((item) => (
              <PendingDocumentPreviewCard key={item.id} item={item} displayMode={displayMode} />
            ))}
          </div>
        ) : null}

        {genericFileCards.length ? (
          <div className={cn(isCompact ? 'space-y-1.5' : 'space-y-2')}>
            {genericFileCards.map((item) => (
              <GenericAttachmentRow
                key={item.id}
                item={item}
                displayMode={displayMode}
                onRetryFailedUpload={!item.isRemote && item.error ? handleRetryFailedUpload : undefined}
                onRemoveFailedUpload={!item.isRemote && item.error ? handleRemoveFailedUpload : undefined}
              />
            ))}
          </div>
        ) : null}
      </div>

      <TeamChatMediaViewerDialog
        activeIndex={viewerIndex}
        items={mediaItems}
        open={viewerOpen}
        onActiveIndexChange={setViewerIndex}
        onOpenChange={setViewerOpen}
      />

      <TeamChatConfirmActionDialog
        open={Boolean(attachmentToRemove)}
        onOpenChange={(open) => {
          if (!open) setAttachmentToRemove(null);
        }}
        title={
          attachmentToRemove
            ? `Remove ${attachmentToRemove.fileName}?`
            : 'Remove attachment?'
        }
        description="This failed upload will be removed from the message composer area."
        confirmLabel="Remove attachment"
        onConfirm={async () => {
          if (!attachmentToRemove) return;
          onRemoveUploadingAttachment?.(messageId, attachmentToRemove.id);
          setAttachmentToRemove(null);
        }}
      />
    </>
  );
}

