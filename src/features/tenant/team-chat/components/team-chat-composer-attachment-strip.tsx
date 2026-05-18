'use client';

import { useMemo, useState } from 'react';
import { FileText, Play, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { ComposerAttachmentDraft } from '../lib/team-chat-screen.shared';
import { focusRingClass } from '../lib/team-chat-screen.shared';
import { isMediaAttachmentKind } from '../lib/team-chat-media.utils';
import { TeamChatConfirmActionDialog } from './team-chat-confirm-action-dialog';
import {
  TeamChatMediaViewerDialog,
  type TeamChatMediaViewerItem,
} from './team-chat-media-viewer-dialog';

interface TeamChatComposerAttachmentStripProps {
  attachments: ComposerAttachmentDraft[];
  onRemove: (attachmentId: string) => void;
}

export function TeamChatComposerAttachmentStrip({
  attachments,
  onRemove,
}: TeamChatComposerAttachmentStripProps) {
  const t = useTranslations('teamChat');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [attachmentToRemove, setAttachmentToRemove] = useState<ComposerAttachmentDraft | null>(null);

  const viewerItems = useMemo<TeamChatMediaViewerItem[]>(
    () =>
      attachments
        .filter(
          (attachment) =>
            isMediaAttachmentKind(attachment.attachmentType) && Boolean(attachment.previewUrl),
        )
        .map((attachment) => ({
          id: attachment.id,
          type: attachment.attachmentType === 'video' ? 'video' : 'image',
          src: attachment.previewUrl!,
          alt: attachment.fileName,
          fileName: attachment.fileName,
          sizeLabel: attachment.fileSizeLabel,
          statusLabel:
            attachment.previewStatus === 'preparing'
              ? t('composer.attachments.preparingProgress', {
                  progress: attachment.previewProgress,
                })
              : undefined,
        })),
    [attachments, t],
  );

  const openViewer = (attachmentId: string) => {
    const nextIndex = viewerItems.findIndex((item) => item.id === attachmentId);
    if (nextIndex < 0) return;
    setViewerIndex(nextIndex);
    setViewerOpen(true);
  };

  if (!attachments.length) {
    return null;
  }

  return (
    <>
      <div className="mb-3 flex gap-3 overflow-x-auto pb-1">
        {attachments.map((attachment) => {
          const isMedia = isMediaAttachmentKind(attachment.attachmentType) && attachment.previewUrl;

          return (
            <div
              key={attachment.id}
              className="bg-muted/25 relative w-[148px] shrink-0 overflow-hidden rounded-2xl border border-border/70"
            >
              {isMedia ? (
                <button
                  type="button"
                  onClick={() => openViewer(attachment.id)}
                  className={cn(
                    'group relative block h-[116px] w-full cursor-pointer overflow-hidden bg-black/70 text-left',
                    focusRingClass,
                  )}
                >
                  {attachment.attachmentType === 'image' ? (
                    <img
                      src={attachment.previewUrl}
                      alt={attachment.fileName}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <video
                      src={attachment.previewUrl}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  )}
                  {attachment.attachmentType === 'video' ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur">
                        <Play className="ml-0.5 h-4 w-4" />
                      </span>
                    </span>
                  ) : null}
                  {attachment.previewStatus !== 'ready' ? (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8">
                      <p className="truncate text-[11px] font-medium text-white/85">
                        {attachment.previewStatus === 'failed'
                          ? t('composer.attachments.previewFailed')
                          : t('composer.attachments.preparingProgress', {
                              progress: attachment.previewProgress,
                            })}
                      </p>
                      <Progress
                        value={attachment.previewStatus === 'failed' ? 100 : attachment.previewProgress}
                        className="mt-2 h-1.5 bg-white/20"
                      />
                    </div>
                  ) : null}
                </button>
              ) : (
                <div className="flex h-[116px] w-full flex-col items-center justify-center gap-2 bg-card/70 px-3 text-center">
                  <span className="bg-primary/12 text-primary inline-flex h-10 w-10 items-center justify-center rounded-2xl">
                    <FileText className="h-4 w-4" />
                  </span>
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    {attachment.fileName.split('.').pop() ?? 'FILE'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t('composer.attachments.document')}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setAttachmentToRemove(attachment)}
                className={cn(
                  'bg-background/92 text-foreground hover:bg-background absolute top-2 right-2 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-border/80 shadow-sm backdrop-blur transition-colors',
                  focusRingClass,
                )}
                aria-label={t('composer.attachments.removeAria', { name: attachment.fileName })}
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className="space-y-1 px-3 py-2">
                <p className="truncate text-xs font-medium text-foreground">{attachment.fileName}</p>
                <p className="text-[11px] text-muted-foreground">{attachment.fileSizeLabel}</p>
                {attachment.error ? (
                  <p className="text-[11px] text-rose-400" role="alert">
                    {attachment.error}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <TeamChatMediaViewerDialog
        activeIndex={viewerIndex}
        items={viewerItems}
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
            ? t('composer.attachments.removeTitle', { name: attachmentToRemove.fileName })
            : t('composer.attachments.removeFallbackTitle')
        }
        description={t('composer.attachments.removeDescription')}
        confirmLabel={t('composer.attachments.removeConfirm')}
        onConfirm={async () => {
          if (!attachmentToRemove) return;
          onRemove(attachmentToRemove.id);
          setAttachmentToRemove(null);
        }}
      />
    </>
  );
}

