'use client';

import { useMemo } from 'react';
import {
  useAddProjectTaskAttachmentLocalFile,
  useAddProjectTaskAttachmentWebLink,
  useAddProjectTaskCommentReaction,
  useAddProjectTaskTag,
  useAddProjectTaskComment,
  useCreateProjectTask,
  useDeleteProjectTaskComment,
  useDeleteProjectTask,
  useDeleteProjectTaskAttachment,
  useDeleteProjectTaskTag,
  useProjectTaskAttachments,
  useRemoveProjectTaskCommentReaction,
  useToggleProjectTaskCommentThumbsUp,
  useUpdateProjectTaskComment,
  useUpdateProjectTask,
  useProjectTaskComments,
  useProjectTaskHistory,
  useProjectTaskTags,
} from '../query/use-project-tasks';
import type { TaskCommentResponse, TaskHistoryResponse, TaskResponse } from '../services/projects.service';

const TAG_SUGGESTIONS = [
  'Docs',
  'FE',
  'Admin',
  'Mapping',
  'BE',
  'Devops',
  'Mobile',
  'Figma',
];

interface StatusOption {
  id: string;
  name: string;
}

interface MemberOption {
  userId: string;
  label: string;
  subtitle?: string;
  avatarUrl?: string;
}

function toDateTimestamp(value?: string): number {
  if (!value) return 0;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 0;
  return parsed.getTime();
}

function formatUserLabelFallback(): string {
  return 'Unknown user';
}

function resolveTaskSlug(task: TaskResponse | null): string {
  if (!task) return '';
  const slugSource = task.slug;
  if (typeof slugSource === 'string' && slugSource.trim().length > 0) {
    return slugSource.trim().toUpperCase();
  }
  return `TS-${task.id.replace(/-/g, '').slice(0, 4).toUpperCase()}`;
}

function normalizeParentTaskId(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  const lowered = normalized.toLowerCase();
  if (lowered === 'null' || lowered === 'undefined') return null;
  return normalized;
}

function isDoneStatusName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return normalized.includes('done') || normalized.includes('complete');
}

function getCommentAuthorId(comment: TaskCommentResponse): string | null {
  const source = comment as TaskCommentResponse & { authorId?: string | null };
  return source.authorId ?? source.authorUserId ?? null;
}

interface UseProjectTaskDetailDataParams {
  open: boolean;
  projectId: string;
  task: TaskResponse | null;
  projectTasks: TaskResponse[];
  statuses: StatusOption[];
  members: MemberOption[];
  userDisplayNameById?: Map<string, string>;
  currentUserId?: string | null;
  currentUserAvatarUrl?: string | null;
  mentionQuery: string;
  tagInput: string;
  assignedTo: string;
}

export function useProjectTaskDetailData({
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
  assignedTo,
}: UseProjectTaskDetailDataParams) {
  const taskId = open && task?.id ? task.id : '';
  const commentsQuery = useProjectTaskComments(projectId, taskId);
  const historyQuery = useProjectTaskHistory(projectId, taskId);
  const tagsQuery = useProjectTaskTags(projectId, taskId);
  const attachmentsQuery = useProjectTaskAttachments(projectId, taskId);
  const addCommentMutation = useAddProjectTaskComment();
  const updateCommentMutation = useUpdateProjectTaskComment();
  const deleteCommentMutation = useDeleteProjectTaskComment();
  const thumbsUpCommentMutation = useToggleProjectTaskCommentThumbsUp();
  const addCommentReactionMutation = useAddProjectTaskCommentReaction();
  const removeCommentReactionMutation = useRemoveProjectTaskCommentReaction();
  const addAttachmentLocalFileMutation = useAddProjectTaskAttachmentLocalFile();
  const addAttachmentWebLinkMutation = useAddProjectTaskAttachmentWebLink();
  const deleteAttachmentMutation = useDeleteProjectTaskAttachment();
  const createTaskMutation = useCreateProjectTask();
  const deleteTaskMutation = useDeleteProjectTask();
  const addTagMutation = useAddProjectTaskTag();
  const deleteTagMutation = useDeleteProjectTaskTag();
  const updateTaskMutation = useUpdateProjectTask();

  const comments = useMemo(() => commentsQuery.data ?? [], [commentsQuery.data]);
  const commentsById = useMemo(
    () => new Map(comments.map((comment) => [comment.id, comment])),
    [comments],
  );
  const repliesByParentId = useMemo(() => {
    const map = new Map<string, TaskCommentResponse[]>();
    for (const comment of comments) {
      const parentCommentId = comment.parentCommentId ?? null;
      if (!parentCommentId || !commentsById.has(parentCommentId)) continue;
      const list = map.get(parentCommentId) ?? [];
      list.push(comment);
      map.set(parentCommentId, list);
    }
    for (const [key, list] of map.entries()) {
      map.set(
        key,
        [...list].sort((a, b) => toDateTimestamp(a.createdAt) - toDateTimestamp(b.createdAt)),
      );
    }
    return map;
  }, [comments, commentsById]);
  const rootComments = useMemo(
    () =>
      comments
        .filter((comment) => {
          const parentCommentId = comment.parentCommentId ?? null;
          if (!parentCommentId) return true;
          return !commentsById.has(parentCommentId);
        })
        .sort((a, b) => toDateTimestamp(a.createdAt) - toDateTimestamp(b.createdAt)),
    [comments, commentsById],
  );
  const history = useMemo(() => historyQuery.data ?? [], [historyQuery.data]);
  const taskTags = useMemo(() => tagsQuery.data ?? [], [tagsQuery.data]);
  const attachments = useMemo(() => attachmentsQuery.data ?? [], [attachmentsQuery.data]);
  const isAddingAttachment =
    addAttachmentLocalFileMutation.isPending || addAttachmentWebLinkMutation.isPending;
  const availableTagNames = useMemo(() => {
    const selected = taskTags.map((tag) => tag.name);
    const merged = [...selected, ...TAG_SUGGESTIONS];
    return [...new Set(merged)];
  }, [taskTags]);
  const filteredTagNames = useMemo(() => {
    const keyword = tagInput.trim().toLowerCase();
    if (!keyword) return availableTagNames;
    return availableTagNames.filter((name) => name.toLowerCase().includes(keyword));
  }, [availableTagNames, tagInput]);

  const taskSlug = resolveTaskSlug(task);
  const isSubtask = Boolean(normalizeParentTaskId(task?.parentTaskId));
  const subtasks = useMemo(() => {
    if (!task?.id) return [];
    return projectTasks.filter((item) => normalizeParentTaskId(item.parentTaskId) === task.id);
  }, [projectTasks, task]);
  const doneStatusIds = useMemo(
    () => new Set(statuses.filter((status) => isDoneStatusName(status.name)).map((status) => status.id)),
    [statuses],
  );
  const subtaskDoneCount = useMemo(
    () => subtasks.filter((item) => doneStatusIds.has(item.statusId)).length,
    [doneStatusIds, subtasks],
  );
  const subtaskProgress = useMemo(() => {
    if (subtasks.length === 0) return 0;
    return Math.round((subtaskDoneCount / subtasks.length) * 100);
  }, [subtaskDoneCount, subtasks.length]);

  const selectedMember = useMemo(
    () => members.find((member) => member.userId === assignedTo),
    [assignedTo, members],
  );
  const membersByUserId = useMemo(
    () => new Map(members.map((member) => [member.userId, member])),
    [members],
  );
  const mentionCandidates = useMemo(() => {
    const keyword = mentionQuery.trim().toLowerCase();
    return members.filter((member) => {
      if (currentUserId && member.userId === currentUserId) return false;
      if (!keyword) return true;
      const label = member.label.toLowerCase();
      const subtitle = (member.subtitle ?? '').toLowerCase();
      return label.includes(keyword) || subtitle.includes(keyword);
    });
  }, [currentUserId, members, mentionQuery]);

  const mergedActivity = useMemo(() => {
    type ActivityItem =
      | { id: string; type: 'comment'; createdAt?: string; payload: TaskCommentResponse }
      | { id: string; type: 'history'; createdAt?: string; payload: TaskHistoryResponse };

    const commentItems: ActivityItem[] = comments.map((comment) => ({
      id: `comment-${comment.id}`,
      type: 'comment',
      createdAt: comment.createdAt,
      payload: comment,
    }));
    const historyItems: ActivityItem[] = history.map((item) => ({
      id: `history-${item.id}`,
      type: 'history',
      createdAt: item.createdAt,
      payload: item,
    }));

    return [...commentItems, ...historyItems].sort(
      (a, b) => toDateTimestamp(b.createdAt) - toDateTimestamp(a.createdAt),
    );
  }, [comments, history]);

  const resolveActorLabel = (userId?: string | null) => {
    if (!userId) return 'System';
    return (
      userDisplayNameById?.get(userId) ??
      membersByUserId.get(userId)?.label ??
      formatUserLabelFallback()
    );
  };

  const resolveAssigneeLabel = (userId?: string | null) => {
    if (!userId) return 'Unassigned';
    return (
      userDisplayNameById?.get(userId) ??
      membersByUserId.get(userId)?.label ??
      formatUserLabelFallback()
    );
  };
  const resolveMentionLabel = (userId: string) =>
    userDisplayNameById?.get(userId) ??
    membersByUserId.get(userId)?.label ??
    formatUserLabelFallback();

  const resolveActorAvatarUrl = (userId?: string | null) => {
    if (userId && currentUserId && userId === currentUserId) {
      return currentUserAvatarUrl ?? undefined;
    }
    return membersByUserId.get(userId ?? '')?.avatarUrl;
  };

  const resolveMentionUserIdsFromContent = (content: string, includeUserIds: string[] = []) => {
    const normalizedContent = content.toLowerCase();
    const mentionUserIds = new Set<string>();
    for (const member of members) {
      if (currentUserId && member.userId === currentUserId) continue;
      if (normalizedContent.includes(`@${member.label.toLowerCase()}`)) {
        mentionUserIds.add(member.userId);
      }
    }
    for (const userId of includeUserIds) {
      if (currentUserId && userId === currentUserId) continue;
      mentionUserIds.add(userId);
    }
    return [...mentionUserIds];
  };

  const extractActorLabels = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];

    const labels: string[] = [];
    for (const item of value) {
      if (typeof item === 'string' && item.trim().length > 0) {
        const normalized = item.trim();
        labels.push(normalized.includes(' ') ? normalized : resolveActorLabel(normalized));
        continue;
      }

      if (item && typeof item === 'object') {
        const candidate = item as Record<string, unknown>;
        const directName =
          candidate.label ??
          candidate.name ??
          candidate.displayName ??
          candidate.fullName;
        if (typeof directName === 'string' && directName.trim().length > 0) {
          labels.push(directName.trim());
          continue;
        }

        const userId = candidate.userId ?? candidate.authorUserId ?? candidate.id;
        if (typeof userId === 'string' && userId.trim().length > 0) {
          labels.push(resolveActorLabel(userId.trim()));
        }
      }
    }

    return [...new Set(labels.filter(Boolean))];
  };

  const getThumbsUpActorLabels = (comment: TaskCommentResponse): string[] => {
    const source = comment as unknown as Record<string, unknown>;
    const labelSets = [
      extractActorLabels(source.thumbsUpUsers),
      extractActorLabels(source.thumbsUpActors),
      extractActorLabels(source.thumbsUpUserIds),
    ];
    const labels = [...new Set(labelSets.flat())];

    if (comment.hasThumbsUpByMe && !labels.includes('You')) {
      labels.push('You');
    }

    if (labels.length === 0) {
      const authorId = getCommentAuthorId(comment);
      if (authorId) {
        labels.push(resolveActorLabel(authorId));
      }
    }

    return labels;
  };

  const getReactionActorLabels = (
    comment: TaskCommentResponse,
    reaction: string,
    reactedByMe: boolean,
  ): string[] => {
    const source = comment as {
      reactions?: Array<Record<string, unknown>> | null;
    };
    if (!Array.isArray(source.reactions)) {
      return reactedByMe ? ['You'] : [];
    }

    const match = source.reactions.find(
      (item) => typeof item.reaction === 'string' && item.reaction === reaction,
    );
    if (!match) {
      return reactedByMe ? ['You'] : [];
    }

    const labels = [
      ...extractActorLabels(match.users),
      ...extractActorLabels(match.actors),
      ...extractActorLabels(match.userIds),
      ...extractActorLabels(match.reactedUsers),
      ...extractActorLabels(match.reactedBy),
    ];
    const unique = [...new Set(labels)];
    if (reactedByMe && !unique.includes('You')) {
      unique.push('You');
    }
    if (unique.length === 0) {
      const authorId = getCommentAuthorId(comment);
      if (authorId) unique.push(resolveActorLabel(authorId));
    }

    return unique;
  };

  return {
    taskId,
    commentsQuery,
    historyQuery,
    tagsQuery,
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
    comments,
    commentsById,
    repliesByParentId,
    rootComments,
    history,
    taskTags,
    attachments,
    isAddingAttachment,
    availableTagNames,
    filteredTagNames,
    taskSlug,
    isSubtask,
    subtasks,
    doneStatusIds,
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
  };
}
