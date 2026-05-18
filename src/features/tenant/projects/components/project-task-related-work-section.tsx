'use client';

import { ArrowUpRight, Check, Loader2, Plus, SquarePen, UserRound, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TaskResponse } from '../services/projects.service';
import type { MemberOption, StatusOption } from './project-task-detail-dialog.types';
import {
  formatPriorityLabel,
  getInitials,
  resolveTaskSlug,
} from './project-task-detail-dialog.utils';

interface ProjectTaskRelatedWorkSectionProps {
  isSubtask: boolean;
  newSubtaskTitle: string;
  setNewSubtaskTitle: (value: string) => void;
  isCreateSubtaskPending: boolean;
  isUpdateTaskPending: boolean;
  isDeleteTaskPending: boolean;
  isSubmitting: boolean;
  subtasks: TaskResponse[];
  subtaskDoneCount: number;
  subtaskProgress: number;
  editingSubtaskId: string | null;
  setEditingSubtaskId: (value: string | null) => void;
  editingSubtaskTitle: string;
  setEditingSubtaskTitle: (value: string) => void;
  statuses: StatusOption[];
  members: MemberOption[];
  resolveAssigneeLabel: (userId?: string | null) => string;
  onCreateSubtask: () => void;
  onRenameSubtask: (subtaskId: string) => void;
  onUpdateSubtaskAssignee: (subtaskId: string, value: string) => void;
  onUpdateSubtaskStatus: (subtaskId: string, statusId: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onOpenTask?: (taskId: string) => void;
}

export function ProjectTaskRelatedWorkSection({
  isSubtask,
  newSubtaskTitle,
  setNewSubtaskTitle,
  isCreateSubtaskPending,
  isUpdateTaskPending,
  isDeleteTaskPending,
  isSubmitting,
  subtasks,
  subtaskDoneCount,
  subtaskProgress,
  editingSubtaskId,
  setEditingSubtaskId,
  editingSubtaskTitle,
  setEditingSubtaskTitle,
  statuses,
  members,
  resolveAssigneeLabel,
  onCreateSubtask,
  onRenameSubtask,
  onUpdateSubtaskAssignee,
  onUpdateSubtaskStatus,
  onDeleteSubtask,
  onOpenTask,
}: ProjectTaskRelatedWorkSectionProps) {
  if (isSubtask) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Related work</p>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={newSubtaskTitle}
            onChange={(event) => setNewSubtaskTitle(event.target.value)}
            placeholder="Name this subtask"
            disabled={isCreateSubtaskPending || isSubmitting}
          />
          <Button
            type="button"
            variant="outline"
            onClick={onCreateSubtask}
            disabled={!newSubtaskTitle.trim() || isCreateSubtaskPending || isSubmitting}
          >
            {isCreateSubtaskPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="space-y-1.5">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${subtaskProgress}%` }}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            {subtaskDoneCount}/{subtasks.length} done
          </p>
        </div>

        <div className="overflow-hidden rounded-md border">
          <div className="grid grid-cols-[1.8fr_0.9fr_1fr_1fr_auto] border-b bg-muted/30 px-3 py-2 text-xs font-semibold uppercase">
            <span>Work</span>
            <span>Priority</span>
            <span>Assignee</span>
            <span>Status</span>
            <span></span>
          </div>
          {subtasks.length === 0 ? (
            <p className="text-muted-foreground px-3 py-4 text-sm">No subtasks yet.</p>
          ) : (
            <div className="divide-y">
              {subtasks.map((subtask) => {
                const isEditingSubtask = editingSubtaskId === subtask.id;
                const subtaskSlug = resolveTaskSlug(subtask);
                const selectedMember = members.find(
                  (member) => member.userId === subtask.assignedTo,
                );

                return (
                  <div
                    key={subtask.id}
                    className="grid grid-cols-[1.8fr_0.9fr_1fr_1fr_auto] items-center gap-2 px-3 py-2 text-sm"
                  >
                    <div className="group/work relative min-w-0 pr-10">
                      {isEditingSubtask ? (
                        <div className="space-y-1">
                          <Input
                            value={editingSubtaskTitle}
                            onChange={(event) => setEditingSubtaskTitle(event.target.value)}
                            autoFocus
                            className="h-8"
                            disabled={isUpdateTaskPending || isSubmitting}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                onRenameSubtask(subtask.id);
                              }
                              if (event.key === 'Escape') {
                                event.preventDefault();
                                setEditingSubtaskId(null);
                                setEditingSubtaskTitle('');
                              }
                            }}
                          />
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              disabled={
                                !editingSubtaskTitle.trim() || isUpdateTaskPending || isSubmitting
                              }
                              onClick={() => onRenameSubtask(subtask.id)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              disabled={isUpdateTaskPending || isSubmitting}
                              onClick={() => {
                                setEditingSubtaskId(null);
                                setEditingSubtaskTitle('');
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex min-w-0 items-center gap-1">
                            <p className="truncate font-medium">
                              <span className="text-primary">{subtaskSlug}</span> {subtask.title}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 transition-opacity group-hover/work:opacity-100"
                              disabled={isUpdateTaskPending || isSubmitting}
                              onClick={() => {
                                setEditingSubtaskId(subtask.id);
                                setEditingSubtaskTitle(subtask.title);
                              }}
                            >
                              <SquarePen className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="absolute top-1/2 right-0 h-8 w-8 -translate-y-1/2 opacity-0 transition-opacity group-hover/work:opacity-100"
                            title="Open work item"
                            disabled={!onOpenTask}
                            onClick={() => onOpenTask?.(subtask.id)}
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>

                    <span className="text-muted-foreground">
                      {formatPriorityLabel(subtask.priority)}
                    </span>

                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar className="h-6 w-6">
                        {selectedMember?.avatarUrl ? (
                          <AvatarImage src={selectedMember.avatarUrl} alt={selectedMember.label} />
                        ) : null}
                        <AvatarFallback className="text-[10px]">
                          {subtask.assignedTo ? (
                            getInitials(resolveAssigneeLabel(subtask.assignedTo))
                          ) : (
                            <UserRound className="h-3 w-3" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <Select
                        value={subtask.assignedTo ?? 'unassigned'}
                        onValueChange={(value) => onUpdateSubtaskAssignee(subtask.id, value)}
                        disabled={isUpdateTaskPending || isSubmitting}
                      >
                        <SelectTrigger className="h-8 min-w-0">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {members.map((member) => (
                            <SelectItem key={member.userId} value={member.userId}>
                              {member.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Select
                      value={subtask.statusId}
                      onValueChange={(value) => onUpdateSubtaskStatus(subtask.id, value)}
                      disabled={isUpdateTaskPending || isSubmitting}
                    >
                      <SelectTrigger className="h-8 w-fit min-w-[120px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            {status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onDeleteSubtask(subtask.id)}
                      disabled={isUpdateTaskPending || isDeleteTaskPending || isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
