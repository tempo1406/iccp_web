'use client';

import { useEffect, useState } from 'react';
import {
  Bold,
  Check,
  Italic,
  List,
  ListOrdered,
  Play,
  Underline,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  ConversationMessage,
  ConversationMessageAttachment,
  FileKind,
  LinkPreview,
} from '../data/team-chat-ui-data';
import { fileKindLabel, focusRingClass } from '../lib/team-chat-screen.shared';
import { formatAttachmentSizeLabel, isMediaAttachmentKind } from '../lib/team-chat-media.utils';
import { resolveTeamChatLinkPreview } from '../lib/team-chat-link-preview.utils';
import { TeamChatConfirmActionDialog } from './team-chat-confirm-action-dialog';
import { TeamChatFileTypeIcon } from './team-chat-file-type-icon';
import { TeamChatProviderIcon } from './team-chat-provider-icon';

interface TeamChatInlineEditPanelProps {
  allowsEmptyDraft: boolean;
  draft: string;
  message: ConversationMessage;
  removedAttachmentIds?: string[];
  onCancel: () => void;
  onRemoveAttachment?: (attachmentId: string) => void;
  onSave: (value: string) => void;
}

function resolveAttachmentFileKind(attachment: ConversationMessageAttachment): FileKind {
  const documentType = attachment.documentType?.toLowerCase();

  if (attachment.attachmentType === 'image') return 'image';
  if (attachment.attachmentType === 'video') return 'video';
  if (documentType === 'excel') return 'spreadsheet';
  if (documentType === 'powerpoint') return 'presentation';
  if (documentType === 'archive') return 'archive';

  return 'document';
}

function resolveAttachmentTitle(attachment: ConversationMessageAttachment) {
  const documentType = attachment.documentType?.toLowerCase();
  if (attachment.attachmentType === 'image') return 'Image attachment';
  if (attachment.attachmentType === 'video') return 'Video attachment';
  if (documentType === 'word') return 'Word document';
  if (documentType === 'excel') return 'Spreadsheet';
  if (documentType === 'powerpoint') return 'Presentation';
  if (documentType === 'pdf') return 'PDF document';

  return fileKindLabel(resolveAttachmentFileKind(attachment));
}

function AttachmentSummaryCard({
  attachment,
  onRemove,
}: {
  attachment: ConversationMessageAttachment;
  onRemove?: () => void;
}) {
  const isMedia = isMediaAttachmentKind(attachment.attachmentType);
  const previewSrc =
    attachment.thumbnailUrlMedium ??
    attachment.thumbnailUrlSmall ??
    attachment.thumbnailUrl ??
    attachment.previewUrl;
  const fileKind = resolveAttachmentFileKind(attachment);

  return (
    <div className="group bg-card/80 relative flex items-center gap-3 rounded-2xl border border-border/70 px-3 py-3">
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            'bg-background/92 text-foreground hover:bg-background absolute top-2.5 right-2.5 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-border/80 opacity-0 shadow-sm transition-all duration-200 group-hover:opacity-100 focus:opacity-100',
            focusRingClass,
          )}
          aria-label={`Remove ${attachment.fileName} from this message`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted/40">
        {isMedia && previewSrc ? (
          <>
            {attachment.attachmentType === 'image' ? (
              <img
                src={previewSrc}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <video
                src={previewSrc}
                className="h-full w-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
            )}
            {attachment.attachmentType === 'video' ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white">
                  <Play className="ml-0.5 h-3.5 w-3.5" />
                </span>
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-primary inline-flex h-full w-full items-center justify-center">
            <TeamChatFileTypeIcon
              attachmentType={attachment.attachmentType}
              className="h-[64%] w-[64%]"
              documentType={attachment.documentType}
              fileName={attachment.fileName}
              fileUrl={attachment.fileUrl}
              kind={fileKind}
              mimeType={attachment.mimeType}
            />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 pr-8">
        <p className="truncate text-sm font-semibold text-foreground">{attachment.fileName}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{resolveAttachmentTitle(attachment)}</span>
          {attachment.fileSize ? <span>{formatAttachmentSizeLabel(attachment.fileSize)}</span> : null}
        </div>
      </div>
    </div>
  );
}

function LinkPreviewSummaryCard({ preview }: { preview: LinkPreview }) {
  const resolvedPreview = resolveTeamChatLinkPreview(preview);
  const PreviewIcon = resolvedPreview.icon;

  return (
    <div className="bg-card/80 flex items-center gap-3 rounded-2xl border border-border/70 px-3 py-3">
      <TeamChatProviderIcon
        className="text-foreground h-14 w-14 shrink-0 rounded-xl"
        icon={PreviewIcon}
        label={resolvedPreview.providerLabel}
        providerIconUrl={resolvedPreview.providerIconUrl}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{resolvedPreview.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{resolvedPreview.providerLabel}</span>
          <span className="truncate">{resolvedPreview.subtitle}</span>
        </div>
      </div>
    </div>
  );
}

export function TeamChatInlineEditPanel({
  allowsEmptyDraft,
  draft,
  message,
  removedAttachmentIds = [],
  onCancel,
  onRemoveAttachment,
  onSave,
}: TeamChatInlineEditPanelProps) {
  const [localDraft, setLocalDraft] = useState(draft);
  const [attachmentToRemove, setAttachmentToRemove] =
    useState<ConversationMessageAttachment | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalDraft(draft);
  }, [draft, message.id]);

  const removedAttachmentIdSet = new Set(removedAttachmentIds);
  const attachments = (message.attachments ?? []).filter(
    (attachment) => !removedAttachmentIdSet.has(attachment.id),
  );
  const linkPreviews = message.linkPreviews ?? [];
  const hasRetainedContext = attachments.length > 0 || linkPreviews.length > 0;
  const placeholder =
    allowsEmptyDraft && hasRetainedContext ? 'Add a note to this attachment' : 'Update your message';

  return (
    <div className="border-primary/30 bg-background/98 mt-2.5 max-w-2xl overflow-hidden rounded-[22px] border shadow-[0_18px_40px_-24px_rgba(15,23,42,0.65)]">
      <div className="border-border/80 flex items-center gap-1 border-b px-2.5 py-2">
        {[Bold, Italic, Underline, ListOrdered, List].map((Icon, index) => (
          <button
            key={`inline-edit-toolbar-${index}`}
            type="button"
            className={cn(
              'text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl transition-colors',
              focusRingClass,
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <div className="space-y-4 px-4 py-4">
        <textarea
          value={localDraft}
          onChange={(event) => setLocalDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              onCancel();
              return;
            }

            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault();
              onSave(localDraft);
            }
          }}
          rows={hasRetainedContext ? 3 : 2}
          placeholder={placeholder}
          className="text-foreground min-h-20 w-full resize-none border-0 bg-transparent px-0 py-0 text-[15px] leading-7 outline-none placeholder:text-muted-foreground/75"
        />

        {hasRetainedContext ? (
          <div className="space-y-3">
            {attachments.length ? (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <AttachmentSummaryCard
                    key={attachment.id}
                    attachment={attachment}
                    onRemove={
                      onRemoveAttachment ? () => setAttachmentToRemove(attachment) : undefined
                    }
                  />
                ))}
              </div>
            ) : null}

            {linkPreviews.length ? (
              <div className="space-y-2">
                {linkPreviews.slice(0, 2).map((preview) => (
                  <LinkPreviewSummaryCard key={preview.url} preview={preview} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="border-border/80 bg-muted/15 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">
          {allowsEmptyDraft && hasRetainedContext
            ? 'Keep the attachment or link context and update the note only.'
            : 'Press Ctrl+Enter to save or Esc to cancel.'}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="h-9 cursor-pointer rounded-xl px-3"
            onClick={onCancel}
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
          <Button
            type="button"
            className="h-9 cursor-pointer rounded-xl px-3"
            onClick={() => onSave(localDraft)}
          >
            <Check className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </div>

      <TeamChatConfirmActionDialog
        open={Boolean(attachmentToRemove)}
        onOpenChange={(open) => {
          if (!open) setAttachmentToRemove(null);
        }}
        title={
          attachmentToRemove
            ? `Remove ${attachmentToRemove.fileName} from this message?`
            : 'Remove attachment from this message?'
        }
        description="The attachment will be removed from the edited message when you save your changes."
        confirmLabel="Remove attachment"
        onConfirm={async () => {
          if (!attachmentToRemove || !onRemoveAttachment) return;
          onRemoveAttachment(attachmentToRemove.id);
          setAttachmentToRemove(null);
        }}
      />
    </div>
  );
}
