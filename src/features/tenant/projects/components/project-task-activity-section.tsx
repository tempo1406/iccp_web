'use client';

import type { ChangeEvent, KeyboardEvent, RefObject, ReactNode } from 'react';
import {
  ArrowRight,
  CornerUpLeft,
  Loader2,
  MoreHorizontal,
  SmilePlus,
  ThumbsUp,
  UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { TaskCommentResponse, TaskHistoryResponse } from '../services/projects.service';
import type {
  MemberOption,
  ProjectTaskDetailActivityTab,
} from './project-task-detail-dialog.types';
import {
  COMMENT_REACTION_OPTIONS,
  formatTransitionLabel,
  getCommentAuthorId,
  getCommentReactions,
  getHistoryActorDisplayName,
  getHistoryActorId,
  getHistoryTransition,
  getInitials,
  isStatusChangeAction,
  renderCommentContentWithMentions,
  toDateLabel,
  toHistoryActionLabel,
  toRelativeTimeLabel,
} from './project-task-detail-dialog.utils';

type ActivityItem =
  | { id: string; type: 'comment'; payload: TaskCommentResponse }
  | { id: string; type: 'history'; payload: TaskHistoryResponse };

interface ProjectTaskActivitySectionProps {
  activityTab: ProjectTaskDetailActivityTab;
  onActivityTabChange: (tab: ProjectTaskDetailActivityTab) => void;
  mergedActivity: ActivityItem[];
  rootComments: TaskCommentResponse[];
  repliesByParentId: Map<string, TaskCommentResponse[]>;
  history: TaskHistoryResponse[];
  commentsPending: boolean;
  historyPending: boolean;
  replyToCommentId: string | null;
  replyToCommentAuthor: string;
  newComment: string;
  commentInputRef: RefObject<HTMLTextAreaElement | null>;
  editingCommentId: string | null;
  editingCommentContent: string;
  setEditingCommentContent: (value: string) => void;
  isMentionMenuOpen: boolean;
  mentionCandidates: MemberOption[];
  mentionActiveIndex: number;
  isAddCommentPending: boolean;
  isUpdateCommentPending: boolean;
  isDeleteCommentPending: boolean;
  isThumbsUpPending: boolean;
  isAddReactionPending: boolean;
  isRemoveReactionPending: boolean;
  onCommentChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onCommentKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onCommentCursorUpdate: (target: HTMLTextAreaElement) => void;
  onMentionSelect: (member: MemberOption) => void;
  onAddComment: () => void;
  onReplyComment: (comment: TaskCommentResponse) => void;
  onCancelReplyComposer: () => void;
  onBeginEditComment: (comment: TaskCommentResponse) => void;
  onCancelEditComment: () => void;
  onSaveEditedComment: (comment: TaskCommentResponse) => void;
  onDeleteComment: (comment: TaskCommentResponse) => void;
  onToggleCommentThumbsUp: (commentId: string) => void;
  onToggleCommentReaction: (
    commentId: string,
    reaction: string,
    reactedByMe: boolean,
  ) => void;
  currentUserAvatarUrl?: string;
  resolveActorLabel: (userId?: string | null) => string;
  resolveActorAvatarUrl: (userId?: string | null) => string | undefined;
  resolveMentionLabel: (userId: string) => string;
  getThumbsUpActorLabels: (comment: TaskCommentResponse) => string[];
  getReactionActorLabels: (
    comment: TaskCommentResponse,
    reaction: string,
    reactedByMe: boolean,
  ) => string[];
}

export function ProjectTaskActivitySection({
  activityTab,
  onActivityTabChange,
  mergedActivity,
  rootComments,
  repliesByParentId,
  history,
  commentsPending,
  historyPending,
  replyToCommentId,
  replyToCommentAuthor,
  newComment,
  commentInputRef,
  editingCommentId,
  editingCommentContent,
  setEditingCommentContent,
  isMentionMenuOpen,
  mentionCandidates,
  mentionActiveIndex,
  isAddCommentPending,
  isUpdateCommentPending,
  isDeleteCommentPending,
  isThumbsUpPending,
  isAddReactionPending,
  isRemoveReactionPending,
  onCommentChange,
  onCommentKeyDown,
  onCommentCursorUpdate,
  onMentionSelect,
  onAddComment,
  onReplyComment,
  onCancelReplyComposer,
  onBeginEditComment,
  onCancelEditComment,
  onSaveEditedComment,
  onDeleteComment,
  onToggleCommentThumbsUp,
  onToggleCommentReaction,
  currentUserAvatarUrl,
  resolveActorLabel,
  resolveActorAvatarUrl,
  resolveMentionLabel,
  getThumbsUpActorLabels,
  getReactionActorLabels,
}: ProjectTaskActivitySectionProps) {
  const interactionPending =
    isAddCommentPending ||
    isUpdateCommentPending ||
    isDeleteCommentPending ||
    isAddReactionPending ||
    isRemoveReactionPending ||
    isThumbsUpPending;

  const renderHistoryTransition = (item: TaskHistoryResponse) => {
    if (!isStatusChangeAction(item.action)) return null;
    const transition = getHistoryTransition(item);
    if (!transition.from && !transition.to) return null;

    if (transition.from && transition.to) {
      return (
        <div className="mt-1 flex items-center gap-2">
          <Badge
            variant="outline"
            className="rounded-sm border-border/80 px-2 py-0.5 text-[13px] font-semibold uppercase"
          >
            {formatTransitionLabel(transition.from)}
          </Badge>
          <ArrowRight className="text-muted-foreground h-4 w-4" />
          <Badge
            variant="outline"
            className="rounded-sm border-emerald-400/70 px-2 py-0.5 text-[13px] font-semibold uppercase text-emerald-300"
          >
            {formatTransitionLabel(transition.to)}
          </Badge>
        </div>
      );
    }

    return (
      <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
        {`${transition.from ?? 'None'} -> ${transition.to ?? 'None'}`}
      </p>
    );
  };

  const renderHistoryCard = (item: TaskHistoryResponse, key: string) => {
    const actorLabel =
      getHistoryActorDisplayName(item) ?? resolveActorLabel(getHistoryActorId(item));
    const actorAvatarUrl =
      resolveActorAvatarUrl(getHistoryActorId(item)) ??
      (item as TaskHistoryResponse & { actorAvatarUrl?: string | null; avatarUrl?: string | null })
        .actorAvatarUrl ??
      (item as TaskHistoryResponse & { actorAvatarUrl?: string | null; avatarUrl?: string | null })
        .avatarUrl ??
      undefined;
    return (
    <div key={key} className="flex gap-3 rounded-md border p-3">
      <Avatar className="h-9 w-9">
        {actorAvatarUrl ? <AvatarImage src={actorAvatarUrl} alt={actorLabel} /> : null}
        <AvatarFallback>{getInitials(actorLabel)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 space-y-1.5">
        <p className="text-base leading-tight">
          <span className="font-semibold">{actorLabel}</span>{' '}
          {toHistoryActionLabel(item.action)}
        </p>
        <p className="text-muted-foreground text-sm">{toDateLabel(item.createdAt)}</p>
        <Badge variant="outline" className="rounded-sm uppercase">
          HISTORY
        </Badge>
        {renderHistoryTransition(item)}
      </div>
    </div>
    );
  };

  const renderCommentActions = (comment: TaskCommentResponse) => {
    const reactions = getCommentReactions(comment);
    const visibleReactions = reactions.filter(
      (item) => item.reaction !== 'thumbs_up' && item.count > 0,
    );
    const thumbsUpCount = comment.thumbsUpCount ?? 0;
    const hasThumbsUpByMe = Boolean(comment.hasThumbsUpByMe);
    const showThumbsUpChip = thumbsUpCount > 0 || hasThumbsUpByMe;
    const thumbsUpActors = getThumbsUpActorLabels(comment);

    return (
      <TooltipProvider delayDuration={200}>
        <div className="pt-1">
          <div className="text-muted-foreground flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="hover:text-foreground inline-flex h-8 w-8 items-center justify-center rounded-md"
              disabled={interactionPending}
              onClick={() => onReplyComment(comment)}
              title="Reply"
            >
              <CornerUpLeft className="h-4 w-4" />
            </button>

            {showThumbsUpChip ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-sm',
                      hasThumbsUpByMe
                        ? 'border-primary/70 bg-primary/10 text-primary'
                        : 'border-border/70 hover:bg-muted',
                    )}
                    disabled={interactionPending}
                    onClick={() => onToggleCommentThumbsUp(comment.id)}
                  >
                    <span className="text-base">{'\ud83d\udc4d'}</span>
                    <span>{thumbsUpCount}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-60">
                  <p className="font-medium">Thumbs Up</p>
                  {(thumbsUpActors.length > 0
                    ? thumbsUpActors
                    : [`${thumbsUpCount} participant(s)`]
                  ).map((name) => (
                    <p key={name}>{name}</p>
                  ))}
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                type="button"
                className="hover:text-foreground inline-flex h-8 w-8 items-center justify-center rounded-md"
                disabled={interactionPending}
                onClick={() => onToggleCommentThumbsUp(comment.id)}
                title="Thumbs up"
              >
                <ThumbsUp className="h-4 w-4" />
              </button>
            )}

            {visibleReactions.map((item) => {
              const option = COMMENT_REACTION_OPTIONS.find(
                (candidate) => candidate.reaction === item.reaction,
              );
              const displayLabel = option?.label ?? item.reaction;
              const displayEmoji = option?.emoji ?? ':)';
              const actors = getReactionActorLabels(comment, item.reaction, item.reactedByMe);

              return (
                <Tooltip key={item.reaction}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-sm',
                        item.reactedByMe
                          ? 'border-primary/70 bg-primary/10 text-primary'
                          : 'border-border/70 hover:bg-muted',
                      )}
                      disabled={interactionPending}
                      onClick={() =>
                        onToggleCommentReaction(comment.id, item.reaction, item.reactedByMe)
                      }
                    >
                      <span className="text-base">{displayEmoji}</span>
                      <span>{item.count}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-60">
                    <p className="font-medium">{displayLabel}</p>
                    {(actors.length > 0 ? actors : [`${item.count} participant(s)`]).map(
                      (name) => (
                        <p key={`${item.reaction}-${name}`}>{name}</p>
                      ),
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="hover:text-foreground inline-flex h-8 w-8 items-center justify-center rounded-md"
                  disabled={interactionPending}
                  title="Add reaction"
                >
                  <SmilePlus className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-40 space-y-1 p-1">
                {COMMENT_REACTION_OPTIONS.map((option) => {
                  const current = reactions.find((item) => item.reaction === option.reaction);
                  const reactedByMe = Boolean(current?.reactedByMe);

                  return (
                    <button
                      key={option.reaction}
                      type="button"
                      className={cn(
                        'hover:bg-muted flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm',
                        reactedByMe && 'bg-muted text-primary',
                      )}
                      disabled={interactionPending}
                      onClick={() =>
                        onToggleCommentReaction(comment.id, option.reaction, reactedByMe)
                      }
                    >
                      <span className="flex items-center gap-2">
                        <span>{option.emoji}</span>
                        <span>{option.label}</span>
                      </span>
                      {current && <span className="text-xs">{current.count}</span>}
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </TooltipProvider>
    );
  };

  const renderCommentComposer = ({
    submitLabel,
    replyAuthorLabel,
    onCancel,
  }: {
    submitLabel: string;
    replyAuthorLabel?: string;
    onCancel?: () => void;
  }) => (
    <div className="flex gap-3">
      <Avatar className="h-10 w-10">
        {currentUserAvatarUrl ? <AvatarImage src={currentUserAvatarUrl} alt="Your avatar" /> : null}
        <AvatarFallback>
          <UserRound className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        {replyAuthorLabel && (
          <p className="text-muted-foreground text-sm">
            Replying to <span className="text-foreground font-medium">{replyAuthorLabel}</span>
          </p>
        )}
        <div className="relative">
          <Textarea
            ref={commentInputRef}
            value={newComment}
            onChange={onCommentChange}
            onKeyDown={onCommentKeyDown}
            onKeyUp={(event) => onCommentCursorUpdate(event.currentTarget)}
            onClick={(event) => onCommentCursorUpdate(event.currentTarget)}
            placeholder="Add a comment... Type @ to mention project member"
            className="min-h-[120px]"
            disabled={isAddCommentPending}
          />
          {isMentionMenuOpen && (
            <div className="bg-popover absolute top-full right-0 left-0 z-50 mt-2 max-h-56 overflow-y-auto rounded-xl border border-border/80 p-2 shadow-2xl">
              {mentionCandidates.length > 0 ? (
                <div className="space-y-1">
                  {mentionCandidates.map((member, index) => {
                    const isActive = index === mentionActiveIndex;
                    return (
                      <button
                        key={member.userId}
                        type="button"
                        className={cn(
                          'hover:bg-muted flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                          isActive && 'bg-muted',
                        )}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => onMentionSelect(member)}
                      >
                        <Avatar className="h-9 w-9 shrink-0">
                          {member.avatarUrl ? (
                            <AvatarImage src={member.avatarUrl} alt={member.label} />
                          ) : null}
                          <AvatarFallback>{getInitials(member.label)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{member.label}</p>
                          {member.subtitle && (
                            <p className="text-muted-foreground truncate text-xs">
                              {member.subtitle}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground px-3 py-2 text-sm">
                  No project member matched.
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs">Press Ctrl+Enter to comment</p>
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isAddCommentPending}
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              onClick={onAddComment}
              disabled={
                !newComment.trim() ||
                isAddCommentPending ||
                isThumbsUpPending ||
                isAddReactionPending ||
                isRemoveReactionPending
              }
            >
              {isAddCommentPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCommentCard = (comment: TaskCommentResponse, depth: number) => (
    <div
      key={comment.id}
      className={cn(
        'group flex gap-3 rounded-md border border-border/70 bg-muted/10 px-3 py-2.5',
        depth > 0 && 'border-border/60',
      )}
    >
      <Avatar className="h-10 w-10 shrink-0">
        {(() => {
          const authorId = getCommentAuthorId(comment);
          const authorAvatarUrl =
            resolveActorAvatarUrl(authorId) ??
            (
              comment as TaskCommentResponse & {
                authorAvatarUrl?: string | null;
                avatarUrl?: string | null;
              }
            ).authorAvatarUrl ??
            (
              comment as TaskCommentResponse & {
                authorAvatarUrl?: string | null;
                avatarUrl?: string | null;
              }
            ).avatarUrl ??
            undefined;
          const authorLabel = resolveActorLabel(authorId);
          return authorAvatarUrl ? <AvatarImage src={authorAvatarUrl} alt={authorLabel} /> : null;
        })()}
        <AvatarFallback>
          {getInitials(resolveActorLabel(getCommentAuthorId(comment)))}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-base leading-tight">
              <span className="font-semibold">
                {resolveActorLabel(getCommentAuthorId(comment))}
              </span>
            </p>
            <p className="text-muted-foreground text-sm">
              {toRelativeTimeLabel(comment.createdAt)}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'text-muted-foreground hover:text-foreground inline-flex h-7 w-7 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100',
                  editingCommentId === comment.id && 'opacity-100',
                )}
                disabled={isUpdateCommentPending || isDeleteCommentPending}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onBeginEditComment(comment)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDeleteComment(comment)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {editingCommentId === comment.id ? (
          <div className="space-y-2 pt-1">
            <Textarea
              value={editingCommentContent}
              onChange={(event) => setEditingCommentContent(event.target.value)}
              className="min-h-[96px]"
              disabled={isUpdateCommentPending}
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancelEditComment}
                disabled={isUpdateCommentPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => onSaveEditedComment(comment)}
                disabled={!editingCommentContent.trim() || isUpdateCommentPending}
              >
                {isUpdateCommentPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap">
            {renderCommentContentWithMentions(
              comment.content,
              comment.mentionUserIds,
              resolveMentionLabel,
            )}
          </p>
        )}
        {editingCommentId !== comment.id && renderCommentActions(comment)}
      </div>
    </div>
  );

  const renderCommentThread = (comment: TaskCommentResponse, depth = 0): ReactNode => {
    const replies = repliesByParentId.get(comment.id) ?? [];
    const isReplyTarget = replyToCommentId === comment.id;
    const replyLabel = replyToCommentAuthor || resolveActorLabel(getCommentAuthorId(comment));

    return (
      <div key={comment.id} className="space-y-3">
        {renderCommentCard(comment, depth)}
        {(isReplyTarget || replies.length > 0) && (
          <div className="ml-5 space-y-3 pl-5">
            {replies.map((reply) => renderCommentThread(reply, depth + 1))}
            {isReplyTarget && (
              <div>
                {renderCommentComposer({
                  submitLabel: 'Save',
                  replyAuthorLabel: replyLabel,
                  onCancel: onCancelReplyComposer,
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Activity</p>
      <Tabs
        value={activityTab}
        onValueChange={(value) => onActivityTabChange(value as ProjectTaskDetailActivityTab)}
        className="space-y-3"
      >
        <TabsList
          className="h-auto rounded-md border border-border bg-transparent p-1"
          variant="line"
        >
          <TabsTrigger value="all" className="px-5 py-1.5 text-base">
            All
          </TabsTrigger>
          <TabsTrigger value="comments" className="px-5 py-1.5 text-base">
            Comments
          </TabsTrigger>
          <TabsTrigger value="history" className="px-5 py-1.5 text-base">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-3">
            {mergedActivity.length === 0 ? (
              <p className="text-muted-foreground rounded-md border p-3 text-sm">
                No activity yet.
              </p>
            ) : (
              mergedActivity.map((item) =>
                item.type === 'comment'
                  ? renderCommentCard(item.payload, 0)
                  : renderHistoryCard(item.payload, item.id),
              )
            )}
          </div>
        </TabsContent>

        <TabsContent value="comments">
          <div className="space-y-4">
            {replyToCommentId === null &&
              renderCommentComposer({
                submitLabel: 'Comment',
              })}

            <div className="space-y-4">
              {commentsPending ? (
                <p className="text-muted-foreground text-sm">Loading comments...</p>
              ) : rootComments.length === 0 ? (
                <p className="text-muted-foreground rounded-md border p-3 text-sm">
                  No comments yet.
                </p>
              ) : (
                rootComments.map((comment) => renderCommentThread(comment))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-3">
            {historyPending ? (
              <p className="text-muted-foreground text-sm">Loading history...</p>
            ) : history.length === 0 ? (
              <p className="text-muted-foreground rounded-md border p-3 text-sm">
                No history yet.
              </p>
            ) : (
              history.map((item) => renderHistoryCard(item, item.id))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
