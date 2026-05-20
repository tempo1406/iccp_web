'use client';

import Image from 'next/image';
import type { ChangeEvent, RefObject } from 'react';
import { FileUp, Link2, Loader2, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TaskAttachmentResponse } from '../services/projects.service';
import type { TaskAttachmentAddMode } from './project-task-detail-dialog.types';
import {
  isImageAttachment,
  resolveAttachmentAccessUrl,
  resolveAttachmentName,
  resolveAttachmentType,
  toAbsoluteApiUrl,
  toRelativeTimeLabel,
} from './project-task-detail-dialog.utils';

interface ProjectTaskAttachmentsSectionProps {
  projectId: string;
  taskId: string;
  attachments: TaskAttachmentResponse[];
  isLoadingAttachments: boolean;
  attachmentsErrorMessage?: string;
  attachmentAddMode: TaskAttachmentAddMode;
  setAttachmentAddMode: (mode: TaskAttachmentAddMode) => void;
  attachmentLocalFileInputRef: RefObject<HTMLInputElement | null>;
  attachmentLocalFile: File | null;
  setAttachmentLocalFile: (file: File | null) => void;
  attachmentLocalFolder: string;
  setAttachmentLocalFolder: (value: string) => void;
  attachmentWebLinkName: string;
  setAttachmentWebLinkName: (value: string) => void;
  attachmentWebLinkUrl: string;
  setAttachmentWebLinkUrl: (value: string) => void;
  attachmentWebLinkMimeType: string;
  setAttachmentWebLinkMimeType: (value: string) => void;
  attachmentPreviewUrls: Record<string, string>;
  deletingAttachmentId: string | null;
  openingAttachmentId: string | null;
  isAddingAttachment: boolean;
  isDeletingAttachment: boolean;
  isUploadingLocalFile: boolean;
  isAddingWebLink: boolean;
  onAttachmentLocalFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenAttachment: (attachment: TaskAttachmentResponse) => void;
  onRemoveAttachment: (attachment: TaskAttachmentResponse) => void;
  onAddAttachmentLocalFile: () => void;
  onAddAttachmentWebLink: () => void;
}

export function ProjectTaskAttachmentsSection({
  projectId,
  taskId,
  attachments,
  isLoadingAttachments,
  attachmentsErrorMessage,
  attachmentAddMode,
  setAttachmentAddMode,
  attachmentLocalFileInputRef,
  attachmentLocalFile,
  setAttachmentLocalFile,
  attachmentLocalFolder,
  setAttachmentLocalFolder,
  attachmentWebLinkName,
  setAttachmentWebLinkName,
  attachmentWebLinkUrl,
  setAttachmentWebLinkUrl,
  attachmentWebLinkMimeType,
  setAttachmentWebLinkMimeType,
  attachmentPreviewUrls,
  deletingAttachmentId,
  openingAttachmentId,
  isAddingAttachment,
  isDeletingAttachment,
  isUploadingLocalFile,
  isAddingWebLink,
  onAttachmentLocalFileChange,
  onOpenAttachment,
  onRemoveAttachment,
  onAddAttachmentLocalFile,
  onAddAttachmentWebLink,
}: ProjectTaskAttachmentsSectionProps) {
  const isBusy = isAddingAttachment || isDeletingAttachment;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Attachments</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={isBusy}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setAttachmentAddMode('local_file');
                setAttachmentLocalFile(null);
                setAttachmentLocalFolder('');
                if (attachmentLocalFileInputRef.current) {
                  attachmentLocalFileInputRef.current.value = '';
                  attachmentLocalFileInputRef.current.click();
                }
              }}
            >
              <FileUp className="mr-2 h-4 w-4" />
              Add attachment
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setAttachmentAddMode('web_link');
                setAttachmentLocalFolder('');
              }}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Add web link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <input
        ref={attachmentLocalFileInputRef}
        type="file"
        className="hidden"
        onChange={onAttachmentLocalFileChange}
        disabled={isBusy}
      />
      <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border p-2">
        {isLoadingAttachments ? (
          <p className="text-muted-foreground text-xs">Loading attachments...</p>
        ) : attachmentsErrorMessage ? (
          <p className="text-destructive text-xs">{attachmentsErrorMessage}</p>
        ) : attachments.length === 0 ? (
          <p className="text-muted-foreground text-xs">No attachment.</p>
        ) : (
          attachments.map((attachment) => {
            const attachmentType = resolveAttachmentType(attachment);
            const attachmentName = resolveAttachmentName(attachment.fileName, attachment.fileUrl);
            const isImage = isImageAttachment(attachment);
            const previewUrl = isImage
              ? attachmentType === 'local_file'
                ? attachmentPreviewUrls[attachment.id]
                : toAbsoluteApiUrl(resolveAttachmentAccessUrl(projectId, taskId, attachment))
              : undefined;

            return (
              <div
                key={attachment.id}
                className="bg-muted/30 flex items-start justify-between gap-2 rounded-md border p-2"
              >
                <button
                  type="button"
                  className="hover:text-primary min-w-0 flex-1 text-left"
                  onClick={() => onOpenAttachment(attachment)}
                  disabled={openingAttachmentId === attachment.id || isBusy}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt={attachmentName}
                        width={40}
                        height={40}
                        unoptimized
                        className="h-10 w-10 shrink-0 rounded border object-cover"
                      />
                    ) : (
                      <Link2 className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <p className="truncate text-sm font-medium">{attachmentName}</p>
                        <Badge variant="outline" className="rounded-sm text-[10px] uppercase">
                          {attachmentType === 'web_link' ? 'Web link' : 'File'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
                        {toRelativeTimeLabel(attachment.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  disabled={isBusy}
                  onClick={() => onRemoveAttachment(attachment)}
                >
                  {deletingAttachmentId === attachment.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            );
          })
        )}
      </div>

      {attachmentAddMode === 'local_file' && (
        <div className="space-y-2 rounded-md border p-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => attachmentLocalFileInputRef.current?.click()}
              disabled={isBusy}
            >
              Choose file
            </Button>
            <p className="text-muted-foreground truncate text-sm">
              {attachmentLocalFile?.name ?? 'No file selected'}
            </p>
          </div>
          <Input
            value={attachmentLocalFolder}
            onChange={(event) => setAttachmentLocalFolder(event.target.value)}
            placeholder="ImageKit folder (optional)"
            disabled={isBusy}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAttachmentAddMode('none');
                setAttachmentLocalFile(null);
                setAttachmentLocalFolder('');
                if (attachmentLocalFileInputRef.current) {
                  attachmentLocalFileInputRef.current.value = '';
                }
              }}
              disabled={isBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onAddAttachmentLocalFile}
              disabled={!attachmentLocalFile || isBusy}
            >
              {isUploadingLocalFile && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Upload
            </Button>
          </div>
        </div>
      )}

      {attachmentAddMode === 'web_link' && (
        <div className="space-y-2 rounded-md border p-2">
          <Input
            value={attachmentWebLinkName}
            onChange={(event) => setAttachmentWebLinkName(event.target.value)}
            placeholder="File name (optional)"
            disabled={isBusy}
          />
          <Input
            value={attachmentWebLinkUrl}
            onChange={(event) => setAttachmentWebLinkUrl(event.target.value)}
            placeholder="https://example.com/document"
            disabled={isBusy}
          />
          <Input
            value={attachmentWebLinkMimeType}
            onChange={(event) => setAttachmentWebLinkMimeType(event.target.value)}
            placeholder="mime/type (optional)"
            disabled={isBusy}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAttachmentAddMode('none')}
              disabled={isBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onAddAttachmentWebLink}
              disabled={!attachmentWebLinkUrl.trim() || isBusy}
            >
              {isAddingWebLink && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Add web link
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
