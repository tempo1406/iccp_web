'use client';

import { useEffect, useMemo, useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { HEADER_KEY } from '@/common/constant/header';
import { toast } from '@/lib/toast';
import { useServiceContext } from '@/lib/use-service-context';
import { authTokens } from '@/services/local-storage/auth.storage';
import { useProjectTaskDetailData } from '../hooks/use-project-task-detail-data';
import { useProjectTaskDetailDialogUiState } from '../hooks/use-project-task-detail-dialog-ui-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type {
  TaskCommentResponse,
} from '../services/projects.service';

import { ProjectTaskActivitySection } from './project-task-activity-section';
import { ProjectTaskAttachmentsSection } from './project-task-attachments-section';
import { ProjectTaskMetadataSidebar } from './project-task-metadata-sidebar';
import { ProjectTaskRelatedWorkSection } from './project-task-related-work-section';
import { ProjectTaskWorklogSection } from './project-task-worklog-section';
import type {
  MemberOption,
  ProjectTaskDetailActivityTab as ActivityTab,
  ProjectTaskDetailDialogProps,
  ProjectTaskDetailFormState as FormState,
} from './project-task-detail-dialog.types';
import {
  buildInitialFormState,
  getCommentAuthorId,
  getMentionContext,
  isImageAttachment,
  resolveAttachmentAccessUrl,
  resolveAttachmentType,
  toAbsoluteApiUrl,
} from './project-task-detail-dialog.utils';
import { useProjectTaskDetailAttachmentActions } from '../hooks/use-project-task-detail-attachment-actions';
import { useProjectTaskDetailSubtaskActions } from '../hooks/use-project-task-detail-subtask-actions';
import { useConfirmAlertDialog } from '../hooks/use-confirm-alert-dialog';
import { useAppSelector } from '@/store';

function normalizeFormStateForCompare(formState: FormState) {
  return {
    title: formState.title.trim(),
    description: formState.description.trim(),
    statusId: formState.statusId,
    priority: formState.priority,
    assignedTo: formState.assignedTo,
    startedAt: formState.startedAt,
    dueDate: formState.dueDate,
    actualStart: formState.actualStart,
    actualEnd: formState.actualEnd,
    estimatedPoint: formState.estimatedPoint,
    estimatedHours: formState.estimatedHours,
  };
}

export function ProjectTaskDetailDialog({
  open,
  projectId,
  task,
  projectTasks,
  statuses,
  members,
  userDisplayNameById,
  isSubmitting = false,
  onOpenChange,
  onOpenTask,
  onSubmit,
}: ProjectTaskDetailDialogProps) {
  const taskDetailT = useTranslations('project.taskDetailDialog');
  const commonT = useTranslations('project.common');
  const serviceContext = useServiceContext();
  const { confirm, confirmDialog } = useConfirmAlertDialog();
  const currentUserProfile = useAppSelector((state) => state.user.profile);
  const currentUserId = currentUserProfile?.id ?? null;
  const currentUserAvatarUrl = currentUserProfile?.avatarUrl ?? null;
  const initialFormState = useMemo(() => buildInitialFormState(task), [task]);
  const wasOpenRef = useRef(false);
  const isClosingAfterSaveRef = useRef(false);
  const {
    formState,
    setFormState,
    activityTab,
    setActivityTab,
    newComment,
    setNewComment,
    replyToCommentId,
    setReplyToCommentId,
    replyToCommentAuthor,
    setReplyToCommentAuthor,
    editingCommentId,
    setEditingCommentId,
    editingCommentContent,
    setEditingCommentContent,
    isMentionMenuOpen,
    setIsMentionMenuOpen,
    mentionQuery,
    setMentionQuery,
    mentionStart,
    setMentionStart,
    mentionCaret,
    setMentionCaret,
    mentionActiveIndex,
    setMentionActiveIndex,
    pickedMentionUserIds,
    setPickedMentionUserIds,
    newSubtaskTitle,
    setNewSubtaskTitle,
    editingSubtaskId,
    setEditingSubtaskId,
    editingSubtaskTitle,
    setEditingSubtaskTitle,
    isTagPickerOpen,
    setIsTagPickerOpen,
    tagInput,
    setTagInput,
    attachmentAddMode,
    setAttachmentAddMode,
    attachmentWebLinkName,
    setAttachmentWebLinkName,
    attachmentWebLinkUrl,
    setAttachmentWebLinkUrl,
    attachmentWebLinkMimeType,
    setAttachmentWebLinkMimeType,
    attachmentLocalFile,
    setAttachmentLocalFile,
    attachmentLocalFolder,
    setAttachmentLocalFolder,
    deletingAttachmentId,
    setDeletingAttachmentId,
    openingAttachmentId,
    setOpeningAttachmentId,
    attachmentPreviewUrls,
    setAttachmentPreviewUrls,
    commentInputRef,
    attachmentLocalFileInputRef,
    attachmentPreviewUrlsRef,
  } = useProjectTaskDetailDialogUiState<FormState, ActivityTab>({
    initialFormState,
    initialActivityTab: 'all',
  });

  const {
    commentsQuery,
    historyQuery,
    attachmentsQuery,
    addCommentMutation,
    updateCommentMutation,
    deleteCommentMutation,
    thumbsUpCommentMutation,
    addCommentReactionMutation,
    removeCommentReactionMutation,
    addAttachmentLocalFileMutation,
    addAttachmentWebLinkMutation,
    deleteAttachmentMutation,
    createTaskMutation,
    deleteTaskMutation,
    addTagMutation,
    deleteTagMutation,
    updateTaskMutation,
    repliesByParentId,
    rootComments,
    history,
    taskTags,
    attachments,
    isAddingAttachment,
    filteredTagNames,
    taskSlug,
    isSubtask,
    subtasks,
    subtaskDoneCount,
    subtaskProgress,
    selectedMember,
    membersByUserId,
    mentionCandidates,
    mergedActivity,
    resolveActorLabel,
    resolveActorAvatarUrl,
    resolveAssigneeLabel,
    resolveMentionLabel,
    resolveMentionUserIdsFromContent,
    getThumbsUpActorLabels,
    getReactionActorLabels,
  } = useProjectTaskDetailData({
    open,
    projectId,
    task,
    projectTasks,
    statuses,
    members,
    userDisplayNameById,
    currentUserId,
    currentUserAvatarUrl,
    mentionQuery,
    tagInput,
    assignedTo: formState.assignedTo,
  });

  const {
    handleAttachmentLocalFileChange,
    handleAddAttachmentWebLink,
    handleAddAttachmentLocalFile,
    handleOpenAttachment,
    handleRemoveAttachment,
  } = useProjectTaskDetailAttachmentActions({
    projectId,
    taskId: task?.id,
    accessToken: serviceContext.accessToken,
    tenantId: serviceContext.tenantId,
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
  });

  const {
    handleDeleteSubtask,
    handleCreateSubtask,
    handleRenameSubtask,
    handleUpdateSubtaskAssignee,
    handleUpdateSubtaskStatus,
  } = useProjectTaskDetailSubtaskActions({
    projectId,
    parentTaskId: task?.id,
    statuses,
    newSubtaskTitle,
    setNewSubtaskTitle,
    editingSubtaskId,
    setEditingSubtaskId,
    editingSubtaskTitle,
    setEditingSubtaskTitle,
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
  });

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setFormState(initialFormState);
    }
    wasOpenRef.current = open;
  }, [initialFormState, open, setFormState]);

  useEffect(() => {
    attachmentPreviewUrlsRef.current = attachmentPreviewUrls;
  }, [attachmentPreviewUrls, attachmentPreviewUrlsRef]);

  useEffect(() => {
    return () => {
      for (const url of Object.values(attachmentPreviewUrlsRef.current)) {
        URL.revokeObjectURL(url);
      }
    };
  }, [attachmentPreviewUrlsRef]);

  useEffect(() => {
    if (!open || !task?.id) {
      setAttachmentPreviewUrls((previous) => {
        for (const url of Object.values(previous)) {
          URL.revokeObjectURL(url);
        }
        return {};
      });
      return;
    }

    const imageLocalAttachments = attachments.filter(
      (attachment) =>
        resolveAttachmentType(attachment) === 'local_file' && isImageAttachment(attachment),
    );
    const imageLocalAttachmentIdSet = new Set(imageLocalAttachments.map((attachment) => attachment.id));

    setAttachmentPreviewUrls((previous) => {
      const next: Record<string, string> = {};
      for (const [attachmentId, previewUrl] of Object.entries(previous)) {
        if (imageLocalAttachmentIdSet.has(attachmentId)) {
          next[attachmentId] = previewUrl;
          continue;
        }
        URL.revokeObjectURL(previewUrl);
      }
      return next;
    });

    const accessToken = serviceContext.accessToken ?? authTokens.getAccess() ?? '';
    const baseHeaders: HeadersInit = {};
    if (accessToken) {
      baseHeaders.Authorization = `Bearer ${accessToken}`;
    }
    if (serviceContext.tenantId) {
      baseHeaders[HEADER_KEY.X_ORGANIZATION_ID] = serviceContext.tenantId;
    }

    let isDisposed = false;
    const abortControllers: AbortController[] = [];

    const fetchMissingImagePreviews = async () => {
      for (const attachment of imageLocalAttachments) {
        if (attachmentPreviewUrlsRef.current[attachment.id]) continue;

        const accessUrl = resolveAttachmentAccessUrl(projectId, task.id, attachment);
        const requestUrl = toAbsoluteApiUrl(accessUrl);
        const controller = new AbortController();
        abortControllers.push(controller);

        try {
          const response = await fetch(requestUrl, {
            method: 'GET',
            headers: baseHeaders,
            signal: controller.signal,
          });
          if (!response.ok) continue;

          const previewBlob = await response.blob();
          const previewUrl = URL.createObjectURL(previewBlob);
          if (isDisposed) {
            URL.revokeObjectURL(previewUrl);
            break;
          }

          setAttachmentPreviewUrls((previous) => {
            if (previous[attachment.id]) {
              URL.revokeObjectURL(previewUrl);
              return previous;
            }
            return {
              ...previous,
              [attachment.id]: previewUrl,
            };
          });
        } catch {
          // Skip preview if fetching fails; keep current attachment behavior unchanged.
        }
      }
    };

    void fetchMissingImagePreviews();

    return () => {
      isDisposed = true;
      for (const controller of abortControllers) {
        controller.abort();
      }
    };
  }, [
    attachments,
    attachmentPreviewUrlsRef,
    open,
    projectId,
    setAttachmentPreviewUrls,
    serviceContext.accessToken,
    serviceContext.tenantId,
    task?.id,
  ]);

  const resetTransientDialogState = () => {
    setEditingSubtaskId(null);
    setEditingSubtaskTitle('');
    setNewComment('');
    setReplyToCommentId(null);
    setReplyToCommentAuthor('');
    setEditingCommentId(null);
    setEditingCommentContent('');
    setIsMentionMenuOpen(false);
    setMentionQuery('');
    setMentionStart(null);
    setMentionCaret(null);
    setMentionActiveIndex(0);
    setPickedMentionUserIds([]);
    setAttachmentAddMode('none');
    setAttachmentWebLinkName('');
    setAttachmentWebLinkUrl('');
    setAttachmentWebLinkMimeType('');
    setAttachmentLocalFile(null);
    setAttachmentLocalFolder('');
    if (attachmentLocalFileInputRef.current) {
      attachmentLocalFileInputRef.current.value = '';
    }
    setDeletingAttachmentId(null);
    setOpeningAttachmentId(null);
  };

  const closeDialog = () => {
    resetTransientDialogState();
    onOpenChange(false);
  };

  const isFormDirty =
    JSON.stringify(normalizeFormStateForCompare(formState)) !==
    JSON.stringify(normalizeFormStateForCompare(initialFormState));

  const handleMainDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    if (isSubmitting || isClosingAfterSaveRef.current) {
      return;
    }

    if (isFormDirty) {
      isClosingAfterSaveRef.current = true;
      void (async () => {
        const isSuccess = await handleSubmit(true);
        if (!isSuccess) {
          closeDialog();
        }
      })();
      return;
    }

    closeDialog();
  };

  const shouldCloseFromOutsideTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest('[data-slot="dialog-overlay"]'));
  };

  const handleReplyToComment = (comment: TaskCommentResponse) => {
    const authorId = getCommentAuthorId(comment);
    const authorLabel = resolveActorLabel(authorId);
    if (authorId && currentUserId && authorId === currentUserId) {
      setReplyToCommentId(comment.id);
      setReplyToCommentAuthor(authorLabel);
      window.requestAnimationFrame(() => {
        const input = commentInputRef.current;
        if (!input) return;
        input.focus();
        const cursor = input.value.length;
        input.setSelectionRange(cursor, cursor);
      });
      return;
    }
    const mentionLabel = authorId
      ? (membersByUserId.get(authorId)?.label ?? userDisplayNameById?.get(authorId) ?? '').trim()
      : '';
    const mentionText = mentionLabel ? `@${mentionLabel} ` : '';

    setReplyToCommentId(comment.id);
    setReplyToCommentAuthor(authorLabel);
    setNewComment((previous) => {
      if (!mentionText) return previous;
      const normalizedPrevious = previous.trimStart().toLowerCase();
      const normalizedMention = mentionText.trim().toLowerCase();
      if (normalizedPrevious.startsWith(normalizedMention)) {
        return previous;
      }
      return previous.trim().length > 0 ? `${mentionText}${previous}` : mentionText;
    });
    if (authorId) {
      setPickedMentionUserIds((previous) =>
        previous.includes(authorId) ? previous : [...previous, authorId],
      );
    }
    closeMentionMenu();

    window.requestAnimationFrame(() => {
      const input = commentInputRef.current;
      if (!input) return;
      input.focus();
      const cursor = mentionText.length > 0 ? mentionText.length : input.value.length;
      input.setSelectionRange(cursor, cursor);
    });
  };

  const clearReplyTarget = () => {
    setReplyToCommentId(null);
    setReplyToCommentAuthor('');
  };

  const closeMentionMenu = () => {
    setIsMentionMenuOpen(false);
    setMentionQuery('');
    setMentionStart(null);
    setMentionCaret(null);
    setMentionActiveIndex(0);
  };

  const syncMentionMenu = (content: string, caret: number | null) => {
    const mention = getMentionContext(content, caret);
    if (!mention) {
      closeMentionMenu();
      return;
    }

    setIsMentionMenuOpen(true);
    setMentionQuery(mention.query);
    setMentionStart(mention.start);
    setMentionCaret(mention.caret);
    setMentionActiveIndex(0);
  };

  const applyMentionSelection = (member: MemberOption) => {
    if (mentionStart == null || mentionCaret == null) return;
    const mentionText = `@${member.label} `;
    const nextComment =
      `${newComment.slice(0, mentionStart)}${mentionText}${newComment.slice(mentionCaret)}`;
    const nextCursor = mentionStart + mentionText.length;

    setNewComment(nextComment);
    setPickedMentionUserIds((previous) =>
      previous.includes(member.userId) ? previous : [...previous, member.userId],
    );
    closeMentionMenu();

    window.requestAnimationFrame(() => {
      const input = commentInputRef.current;
      if (!input) return;
      input.focus();
      input.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleAddComment = async () => {
    if (!task?.id) return;
    const content = newComment.trim();
    if (!content) return;

    const resolvedMentionUserIds = resolveMentionUserIdsFromContent(
      content,
      pickedMentionUserIds,
    );

    const result = await addCommentMutation.mutateAsync({
      projectId,
      taskId: task.id,
      body: {
        content,
        parentCommentId: replyToCommentId ?? undefined,
        mentionUserIds: resolvedMentionUserIds.length > 0 ? resolvedMentionUserIds : undefined,
      },
    });

    if (!result.ok) {
      toast.danger(result.error.message || taskDetailT('toasts.addCommentFailed'));
      return;
    }

    setNewComment('');
    setPickedMentionUserIds([]);
    closeMentionMenu();
    clearReplyTarget();
  };

  const beginEditComment = (comment: TaskCommentResponse) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const handleSaveEditedComment = async (comment: TaskCommentResponse) => {
    if (!task?.id) return;
    const content = editingCommentContent.trim();
    if (!content) {
      toast.warning(taskDetailT('toasts.commentContentRequired'));
      return;
    }

    const resolvedMentionUserIds = resolveMentionUserIdsFromContent(content);
    const result = await updateCommentMutation.mutateAsync({
      projectId,
      taskId: task.id,
      commentId: comment.id,
      body: {
        content,
        mentionUserIds:
          resolvedMentionUserIds.length > 0 ? resolvedMentionUserIds : undefined,
      },
    });
    if (!result.ok) {
      toast.danger(result.error.message || taskDetailT('toasts.updateCommentFailed'));
      return;
    }

    cancelEditComment();
  };

  const handleDeleteComment = async (comment: TaskCommentResponse) => {
    if (!task?.id) return;
    const confirmed = await confirm({
      title: taskDetailT('deleteComment.title'),
      description: taskDetailT('deleteComment.description'),
      confirmText: commonT('delete'),
      cancelText: commonT('cancel'),
      destructive: true,
    });
    if (!confirmed) return;

    const result = await deleteCommentMutation.mutateAsync({
      projectId,
      taskId: task.id,
      commentId: comment.id,
    });
    if (!result.ok) {
      toast.danger(result.error.message || taskDetailT('toasts.deleteCommentFailed'));
      return;
    }

    if (replyToCommentId === comment.id) {
      clearReplyTarget();
    }
    if (editingCommentId === comment.id) {
      cancelEditComment();
    }
  };

  const handleToggleCommentThumbsUp = async (commentId: string) => {
    if (!task?.id) return;
    const result = await thumbsUpCommentMutation.mutateAsync({
      projectId,
      taskId: task.id,
      commentId,
    });
    if (!result.ok) {
      toast.danger(result.error.message || taskDetailT('toasts.toggleThumbsUpFailed'));
    }
  };

  const handleToggleCommentReaction = async (
    commentId: string,
    reaction: string,
    reactedByMe: boolean,
  ) => {
    if (!task?.id) return;
    const result = reactedByMe
      ? await removeCommentReactionMutation.mutateAsync({
          projectId,
          taskId: task.id,
          commentId,
          reaction,
        })
      : await addCommentReactionMutation.mutateAsync({
          projectId,
          taskId: task.id,
          commentId,
          body: { reaction },
        });

    if (!result.ok) {
      toast.danger(result.error.message || taskDetailT('toasts.updateReactionFailed'));
    }
  };

  const handleAddTag = async (rawName: string) => {
    if (!task?.id) return;
    const name = rawName.trim();
    if (!name) return;

    const isExists = taskTags.some(
      (tag) => tag.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (isExists) {
      setTagInput('');
      return;
    }

    const result = await addTagMutation.mutateAsync({
      projectId,
      taskId: task.id,
      body: { name },
    });
    if (!result.ok) {
      toast.danger(result.error.message || taskDetailT('toasts.addTagFailed'));
      return;
    }
    setTagInput('');
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!task?.id) return;

    const result = await deleteTagMutation.mutateAsync({
      projectId,
      taskId: task.id,
      tagId,
    });
    if (!result.ok) {
      toast.danger(result.error.message || taskDetailT('toasts.removeTagFailed'));
    }
  };

  const handleCommentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    const caret = event.target.selectionStart ?? value.length;
    setNewComment(value);
    setPickedMentionUserIds((previous) =>
      previous.filter((userId) => {
        const member = membersByUserId.get(userId);
        if (!member) return false;
        return value.toLowerCase().includes(`@${member.label.toLowerCase()}`);
      }),
    );
    syncMentionMenu(value, caret);
  };

  const handleCommentCursorUpdate = (target: HTMLTextAreaElement) => {
    syncMentionMenu(target.value, target.selectionStart ?? target.value.length);
  };

  const handleCommentKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isMentionMenuOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (mentionCandidates.length === 0) return;
        setMentionActiveIndex((previous) =>
          previous >= mentionCandidates.length - 1 ? 0 : previous + 1,
        );
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (mentionCandidates.length === 0) return;
        setMentionActiveIndex((previous) =>
          previous <= 0 ? mentionCandidates.length - 1 : previous - 1,
        );
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        if (mentionCandidates.length > 0) {
          event.preventDefault();
          applyMentionSelection(mentionCandidates[mentionActiveIndex] ?? mentionCandidates[0]);
          return;
        }
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMentionMenu();
        return;
      }
    }

    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void handleAddComment();
    }
  };

  const handleTagInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleAddTag(tagInput);
    }
  };

  const handleSubmit = async (closeAfterSuccess = false) => {
    if (!task) {
      isClosingAfterSaveRef.current = false;
      return false;
    }
    const title = formState.title.trim();
    if (!title) {
      toast.warning(taskDetailT('toasts.taskTitleRequired'));
      isClosingAfterSaveRef.current = false;
      return false;
    }

    const isSuccess = await onSubmit({
      taskId: task.id,
      title,
      description: formState.description,
      statusId: formState.statusId,
      priority: formState.priority,
      assignedTo: formState.assignedTo || null,
      startedAt: formState.startedAt,
      dueDate: formState.dueDate,
      actualStart: formState.actualStart,
      actualEnd: formState.actualEnd,
      estimatedPoint: formState.estimatedPoint,
      estimatedHours: formState.estimatedHours,
    });
    if (isSuccess && closeAfterSuccess) {
      isClosingAfterSaveRef.current = false;
      closeDialog();
      return true;
    }
    isClosingAfterSaveRef.current = false;
    return isSuccess;
  };

  const handleCancelReplyComposer = () => {
    clearReplyTarget();
    setNewComment('');
    setPickedMentionUserIds([]);
    closeMentionMenu();
  };

  const handleOpenSubtaskTask = (subtaskId: string) => {
    setEditingSubtaskId(null);
    setEditingSubtaskTitle('');
    onOpenTask?.(subtaskId);
  };
  return (
    <>
      {confirmDialog}
      <Dialog open={open} onOpenChange={handleMainDialogOpenChange}>
        <DialogContent
          className="max-h-[88vh] w-[96vw] overflow-y-auto md:flex md:flex-col md:overflow-hidden sm:max-w-[1400px]"
          onPointerDownOutside={(event) => {
            const outsideTarget = event.detail.originalEvent.target;
            if (!shouldCloseFromOutsideTarget(outsideTarget)) {
              event.preventDefault();
              return;
            }

            event.preventDefault();
            handleMainDialogOpenChange(false);
          }}
          onInteractOutside={(event) => {
            const outsideTarget = event.detail.originalEvent.target;
            if (shouldCloseFromOutsideTarget(outsideTarget)) {
              event.preventDefault();
              return;
            }

            event.preventDefault();
          }}
        >
        <DialogHeader>
          <DialogTitle>{taskSlug || task?.title || taskDetailT('titleFallback')}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:min-h-0 md:flex-1 md:grid-cols-[minmax(0,1fr)_320px] md:overflow-hidden">
          <div className="space-y-4 md:min-h-0 md:overflow-y-auto md:pr-2">
            <div className="space-y-2">
              <Label htmlFor="task-detail-title">Title</Label>
              <Input
                id="task-detail-title"
                className="focus-visible:ring-0"
                value={formState.title}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    title: event.target.value,
                  }))
                }
                disabled={isSubmitting}
              />
            </div>

            <ProjectTaskAttachmentsSection
              projectId={projectId}
              taskId={task?.id ?? ''}
              attachments={attachments}
              isLoadingAttachments={attachmentsQuery.isPending}
              attachmentsErrorMessage={attachmentsQuery.error?.message}
              attachmentAddMode={attachmentAddMode}
              setAttachmentAddMode={setAttachmentAddMode}
              attachmentLocalFileInputRef={attachmentLocalFileInputRef}
              attachmentLocalFile={attachmentLocalFile}
              setAttachmentLocalFile={setAttachmentLocalFile}
              attachmentLocalFolder={attachmentLocalFolder}
              setAttachmentLocalFolder={setAttachmentLocalFolder}
              attachmentWebLinkName={attachmentWebLinkName}
              setAttachmentWebLinkName={setAttachmentWebLinkName}
              attachmentWebLinkUrl={attachmentWebLinkUrl}
              setAttachmentWebLinkUrl={setAttachmentWebLinkUrl}
              attachmentWebLinkMimeType={attachmentWebLinkMimeType}
              setAttachmentWebLinkMimeType={setAttachmentWebLinkMimeType}
              attachmentPreviewUrls={attachmentPreviewUrls}
              deletingAttachmentId={deletingAttachmentId}
              openingAttachmentId={openingAttachmentId}
              isAddingAttachment={isAddingAttachment}
              isDeletingAttachment={deleteAttachmentMutation.isPending}
              isUploadingLocalFile={addAttachmentLocalFileMutation.isPending}
              isAddingWebLink={addAttachmentWebLinkMutation.isPending}
              onAttachmentLocalFileChange={handleAttachmentLocalFileChange}
              onOpenAttachment={(attachment) => void handleOpenAttachment(attachment)}
              onRemoveAttachment={(attachment) => void handleRemoveAttachment(attachment)}
              onAddAttachmentLocalFile={() => void handleAddAttachmentLocalFile()}
              onAddAttachmentWebLink={() => void handleAddAttachmentWebLink()}
            />

            <div className="space-y-2">
              <Label htmlFor="task-detail-description">Description</Label>
              <Textarea
                id="task-detail-description"
                className="min-h-45 focus-visible:border-ring focus-visible:ring-0 focus-visible:ring-offset-0"
                value={formState.description}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                placeholder="Add a description..."
                disabled={isSubmitting}
              />
            </div>

            <ProjectTaskRelatedWorkSection
              isSubtask={isSubtask}
              newSubtaskTitle={newSubtaskTitle}
              setNewSubtaskTitle={setNewSubtaskTitle}
              isCreateSubtaskPending={createTaskMutation.isPending}
              isUpdateTaskPending={updateTaskMutation.isPending}
              isDeleteTaskPending={deleteTaskMutation.isPending}
              isSubmitting={isSubmitting}
              subtasks={subtasks}
              subtaskDoneCount={subtaskDoneCount}
              subtaskProgress={subtaskProgress}
              editingSubtaskId={editingSubtaskId}
              setEditingSubtaskId={setEditingSubtaskId}
              editingSubtaskTitle={editingSubtaskTitle}
              setEditingSubtaskTitle={setEditingSubtaskTitle}
              statuses={statuses}
              members={members}
              resolveAssigneeLabel={resolveAssigneeLabel}
              onCreateSubtask={() => void handleCreateSubtask()}
              onRenameSubtask={(subtaskId) => void handleRenameSubtask(subtaskId)}
              onUpdateSubtaskAssignee={(subtaskId, value) =>
                void handleUpdateSubtaskAssignee(subtaskId, value)
              }
              onUpdateSubtaskStatus={(subtaskId, statusId) =>
                void handleUpdateSubtaskStatus(subtaskId, statusId)
              }
              onDeleteSubtask={(subtaskId) => void handleDeleteSubtask(subtaskId)}
              onOpenTask={handleOpenSubtaskTask}
            />

            <ProjectTaskWorklogSection
              projectId={projectId}
              task={task}
              members={members}
              userDisplayNameById={userDisplayNameById}
            />

            <ProjectTaskActivitySection
              activityTab={activityTab}
              onActivityTabChange={setActivityTab}
              mergedActivity={mergedActivity}
              rootComments={rootComments}
              repliesByParentId={repliesByParentId}
              history={history}
              commentsPending={commentsQuery.isPending}
              historyPending={historyQuery.isPending}
              replyToCommentId={replyToCommentId}
              replyToCommentAuthor={replyToCommentAuthor}
              newComment={newComment}
              commentInputRef={commentInputRef}
              editingCommentId={editingCommentId}
              editingCommentContent={editingCommentContent}
              setEditingCommentContent={setEditingCommentContent}
              isMentionMenuOpen={isMentionMenuOpen}
              mentionCandidates={mentionCandidates}
              mentionActiveIndex={mentionActiveIndex}
              isAddCommentPending={addCommentMutation.isPending}
              isUpdateCommentPending={updateCommentMutation.isPending}
              isDeleteCommentPending={deleteCommentMutation.isPending}
              isThumbsUpPending={thumbsUpCommentMutation.isPending}
              isAddReactionPending={addCommentReactionMutation.isPending}
              isRemoveReactionPending={removeCommentReactionMutation.isPending}
              onCommentChange={handleCommentChange}
              onCommentKeyDown={handleCommentKeyDown}
              onCommentCursorUpdate={handleCommentCursorUpdate}
              onMentionSelect={applyMentionSelection}
              onAddComment={() => void handleAddComment()}
              onReplyComment={handleReplyToComment}
              onCancelReplyComposer={handleCancelReplyComposer}
              onBeginEditComment={beginEditComment}
              onCancelEditComment={cancelEditComment}
              onSaveEditedComment={(comment) => void handleSaveEditedComment(comment)}
              onDeleteComment={(comment) => void handleDeleteComment(comment)}
              onToggleCommentThumbsUp={(commentId) =>
                void handleToggleCommentThumbsUp(commentId)
              }
              onToggleCommentReaction={(commentId, reaction, reactedByMe) =>
                void handleToggleCommentReaction(commentId, reaction, reactedByMe)
              }
              currentUserAvatarUrl={currentUserAvatarUrl ?? undefined}
              resolveActorLabel={resolveActorLabel}
              resolveActorAvatarUrl={resolveActorAvatarUrl}
              resolveMentionLabel={resolveMentionLabel}
              getThumbsUpActorLabels={getThumbsUpActorLabels}
              getReactionActorLabels={getReactionActorLabels}
            />
          </div>

          <div className="md:min-h-0 md:overflow-y-auto md:pr-1">
            <ProjectTaskMetadataSidebar
              formState={formState}
              setFormState={setFormState}
              statuses={statuses}
              members={members}
              selectedMember={selectedMember}
              actualLoggedMinutes={task?.actualLoggedMinutes}
              isSubmitting={isSubmitting}
              isTagPickerOpen={isTagPickerOpen}
              setIsTagPickerOpen={setIsTagPickerOpen}
              taskTags={taskTags}
              tagInput={tagInput}
              setTagInput={setTagInput}
              filteredTagNames={filteredTagNames}
              isAddTagPending={addTagMutation.isPending}
              isDeleteTagPending={deleteTagMutation.isPending}
              onTagInputKeyDown={handleTagInputKeyDown}
              onAddTag={(name) => void handleAddTag(name)}
              onRemoveTag={(tagId) => void handleRemoveTag(tagId)}
            />
          </div>
        </div>

        </DialogContent>
      </Dialog>
    </>
  );
}

