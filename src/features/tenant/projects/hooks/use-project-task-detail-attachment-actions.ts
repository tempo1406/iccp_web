'use client';

import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from 'react';
import { HEADER_KEY } from '@/common/constant/header';
import { toast } from '@/lib/toast';
import { authTokens } from '@/services/local-storage/auth.storage';
import type { TaskAttachmentResponse } from '../services/projects.service';
import type { TaskAttachmentAddMode } from '../components/project-task-detail-dialog.types';
import {
  resolveAttachmentAccessUrl,
  resolveAttachmentName,
  resolveAttachmentType,
  toAbsoluteApiUrl,
} from '../components/project-task-detail-dialog.utils';

type MutationResult<TData = unknown> = {
  ok: boolean;
  data?: TData;
  error?: { message?: string };
};

interface MutationLike<TInput> {
  mutateAsync: (input: TInput) => Promise<unknown>;
  isPending?: boolean;
}

interface UseProjectTaskDetailAttachmentActionsParams {
  projectId: string;
  taskId?: string | null;
  accessToken?: string | null;
  tenantId?: string | null;
  attachmentLocalFile: File | null;
  attachmentLocalFolder: string;
  attachmentWebLinkName: string;
  attachmentWebLinkUrl: string;
  attachmentWebLinkMimeType: string;
  setAttachmentLocalFile: (file: File | null) => void;
  setAttachmentLocalFolder: (value: string) => void;
  setAttachmentWebLinkName: (value: string) => void;
  setAttachmentWebLinkUrl: (value: string) => void;
  setAttachmentWebLinkMimeType: (value: string) => void;
  setAttachmentAddMode: (mode: TaskAttachmentAddMode) => void;
  setOpeningAttachmentId: Dispatch<SetStateAction<string | null>>;
  setDeletingAttachmentId: Dispatch<SetStateAction<string | null>>;
  attachmentLocalFileInputRef: RefObject<HTMLInputElement | null>;
  addAttachmentLocalFileMutation: MutationLike<{
    projectId: string;
    taskId: string;
    file: File;
    folder?: string;
  }>;
  addAttachmentWebLinkMutation: MutationLike<{
    projectId: string;
    taskId: string;
    body: {
      fileName: string;
      fileUrl: string;
      mimeType?: string;
    };
  }>;
  deleteAttachmentMutation: MutationLike<{
    projectId: string;
    taskId: string;
    attachmentId: string;
  }>;
}

export function useProjectTaskDetailAttachmentActions({
  projectId,
  taskId,
  accessToken,
  tenantId,
  attachmentLocalFile,
  attachmentLocalFolder,
  attachmentWebLinkName,
  attachmentWebLinkUrl,
  attachmentWebLinkMimeType,
  setAttachmentLocalFile,
  setAttachmentLocalFolder,
  setAttachmentWebLinkName,
  setAttachmentWebLinkUrl,
  setAttachmentWebLinkMimeType,
  setAttachmentAddMode,
  setOpeningAttachmentId,
  setDeletingAttachmentId,
  attachmentLocalFileInputRef,
  addAttachmentLocalFileMutation,
  addAttachmentWebLinkMutation,
  deleteAttachmentMutation,
}: UseProjectTaskDetailAttachmentActionsParams) {
  const handleAttachmentLocalFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setAttachmentLocalFile(selectedFile);
  };

  const handleAddAttachmentWebLink = async () => {
    if (!taskId) return;

    const rawUrl = attachmentWebLinkUrl.trim();
    if (!rawUrl) {
      toast.warning('Web link URL is required.');
      return;
    }

    let normalizedUrl = rawUrl;
    try {
      const parsed = new URL(rawUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('INVALID_PROTOCOL');
      }
      normalizedUrl = parsed.toString();
    } catch {
      toast.warning('Web link URL must be a valid http/https URL.');
      return;
    }

    const fileName = resolveAttachmentName(attachmentWebLinkName, normalizedUrl);
    const mimeType = attachmentWebLinkMimeType.trim();
    const result = (await addAttachmentWebLinkMutation.mutateAsync({
      projectId,
      taskId,
      body: {
        fileName,
        fileUrl: normalizedUrl,
        mimeType: mimeType || undefined,
      },
    })) as MutationResult;
    if (!result.ok) {
      toast.danger(result.error?.message || 'Failed to add attachment.');
      return;
    }

    setAttachmentWebLinkName('');
    setAttachmentWebLinkUrl('');
    setAttachmentWebLinkMimeType('');
    setAttachmentAddMode('none');
  };

  const handleAddAttachmentLocalFile = async () => {
    if (!taskId) return;
    if (!attachmentLocalFile) {
      toast.warning('Please select a file.');
      return;
    }

    const result = (await addAttachmentLocalFileMutation.mutateAsync({
      projectId,
      taskId,
      file: attachmentLocalFile,
      folder: attachmentLocalFolder.trim() || undefined,
    })) as MutationResult;
    if (!result.ok) {
      toast.danger(result.error?.message || 'Failed to upload file.');
      return;
    }

    setAttachmentLocalFile(null);
    setAttachmentLocalFolder('');
    setAttachmentAddMode('none');
    if (attachmentLocalFileInputRef.current) {
      attachmentLocalFileInputRef.current.value = '';
    }
  };

  const handleOpenAttachment = async (attachment: TaskAttachmentResponse) => {
    if (!taskId) return;
    const attachmentType = resolveAttachmentType(attachment);
    const accessUrl = resolveAttachmentAccessUrl(projectId, taskId, attachment);

    if (attachmentType === 'web_link') {
      const targetUrl = /^https?:\/\//i.test(accessUrl)
        ? accessUrl
        : toAbsoluteApiUrl(accessUrl);
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const requestUrl = toAbsoluteApiUrl(accessUrl);
    const effectiveAccessToken = accessToken ?? authTokens.getAccess() ?? '';
    const headers: HeadersInit = {};
    if (effectiveAccessToken) {
      headers.Authorization = `Bearer ${effectiveAccessToken}`;
    }
    if (tenantId) {
      headers[HEADER_KEY.X_ORGANIZATION_ID] = tenantId;
    }

    setOpeningAttachmentId(attachment.id);
    try {
      const response = await fetch(requestUrl, { method: 'GET', headers });
      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch {
      toast.danger('Failed to open attachment.');
    } finally {
      setOpeningAttachmentId(null);
    }
  };

  const handleRemoveAttachment = async (attachment: TaskAttachmentResponse) => {
    if (!taskId) return;

    setDeletingAttachmentId(attachment.id);
    try {
      const result = (await deleteAttachmentMutation.mutateAsync({
        projectId,
        taskId,
        attachmentId: attachment.id,
      })) as MutationResult;
      if (!result.ok) {
        toast.danger(result.error?.message || 'Failed to delete attachment.');
      }
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  return {
    handleAttachmentLocalFileChange,
    handleAddAttachmentWebLink,
    handleAddAttachmentLocalFile,
    handleOpenAttachment,
    handleRemoveAttachment,
  };
}
