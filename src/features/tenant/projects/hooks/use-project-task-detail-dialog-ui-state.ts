'use client';

import { useRef, useState } from 'react';

interface BaseFormState {
  title: string;
  description: string;
  statusId: string;
  assignedTo: string;
  dueDate: string;
}

interface UseProjectTaskDetailDialogUiStateParams<
  TFormState extends BaseFormState,
  TActivityTab extends string,
> {
  initialFormState: TFormState;
  initialActivityTab: TActivityTab;
}

export function useProjectTaskDetailDialogUiState<
  TFormState extends BaseFormState,
  TActivityTab extends string,
>({
  initialFormState,
  initialActivityTab,
}: UseProjectTaskDetailDialogUiStateParams<TFormState, TActivityTab>) {
  const [formState, setFormState] = useState<TFormState>(initialFormState);
  const [activityTab, setActivityTab] = useState<TActivityTab>(initialActivityTab);
  const [newComment, setNewComment] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyToCommentAuthor, setReplyToCommentAuthor] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [isMentionMenuOpen, setIsMentionMenuOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionCaret, setMentionCaret] = useState<number | null>(null);
  const [mentionActiveIndex, setMentionActiveIndex] = useState(0);
  const [pickedMentionUserIds, setPickedMentionUserIds] = useState<string[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');
  const [isTagPickerOpen, setIsTagPickerOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [attachmentAddMode, setAttachmentAddMode] = useState<
    'none' | 'local_file' | 'web_link'
  >('none');
  const [attachmentWebLinkName, setAttachmentWebLinkName] = useState('');
  const [attachmentWebLinkUrl, setAttachmentWebLinkUrl] = useState('');
  const [attachmentWebLinkMimeType, setAttachmentWebLinkMimeType] = useState('');
  const [attachmentLocalFile, setAttachmentLocalFile] = useState<File | null>(null);
  const [attachmentLocalFolder, setAttachmentLocalFolder] = useState('');
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  const [openingAttachmentId, setOpeningAttachmentId] = useState<string | null>(null);
  const [attachmentPreviewUrls, setAttachmentPreviewUrls] = useState<Record<string, string>>({});

  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const attachmentLocalFileInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentPreviewUrlsRef = useRef<Record<string, string>>({});

  return {
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
  };
}
