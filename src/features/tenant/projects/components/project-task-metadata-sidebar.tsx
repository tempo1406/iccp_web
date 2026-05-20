'use client';

import type { Dispatch, KeyboardEvent, SetStateAction } from 'react';
import { UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TaskTagResponse } from '../services/projects.service';
import type {
  MemberOption,
  ProjectTaskDetailFormState,
  StatusOption,
} from './project-task-detail-dialog.types';
import { getInitials } from './project-task-detail-dialog.utils';

const TASK_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;

function formatLoggedTime(value?: number | null): string {
  const totalMinutes = Number(value ?? 0);
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '0m';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

interface ProjectTaskMetadataSidebarProps {
  formState: ProjectTaskDetailFormState;
  setFormState: Dispatch<SetStateAction<ProjectTaskDetailFormState>>;
  statuses: StatusOption[];
  members: MemberOption[];
  selectedMember?: MemberOption;
  actualLoggedMinutes?: number | null;
  isSubmitting: boolean;
  isTagPickerOpen: boolean;
  setIsTagPickerOpen: (open: boolean) => void;
  taskTags: TaskTagResponse[];
  tagInput: string;
  setTagInput: (value: string) => void;
  filteredTagNames: string[];
  isAddTagPending: boolean;
  isDeleteTagPending: boolean;
  onTagInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onAddTag: (name: string) => void;
  onRemoveTag: (tagId: string) => void;
}

export function ProjectTaskMetadataSidebar({
  formState,
  setFormState,
  statuses,
  members,
  selectedMember,
  actualLoggedMinutes,
  isSubmitting,
  isTagPickerOpen,
  setIsTagPickerOpen,
  taskTags,
  tagInput,
  setTagInput,
  filteredTagNames,
  isAddTagPending,
  isDeleteTagPending,
  onTagInputKeyDown,
  onAddTag,
  onRemoveTag,
}: ProjectTaskMetadataSidebarProps) {
  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={formState.statusId}
          onValueChange={(value) =>
            setFormState((previous) => ({ ...previous, statusId: value }))
          }
          disabled={isSubmitting}
        >
          <SelectTrigger>
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
      </div>

      <div className="space-y-2">
        <Label>Assignee</Label>
        <Select
          value={formState.assignedTo || 'unassigned'}
          onValueChange={(value) =>
            setFormState((previous) => ({
              ...previous,
              assignedTo: value === 'unassigned' ? '' : value,
            }))
          }
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select assignee" />
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

        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Avatar className="h-5 w-5">
            {selectedMember?.avatarUrl ? (
              <AvatarImage src={selectedMember.avatarUrl} alt={selectedMember.label} />
            ) : null}
            <AvatarFallback className="text-[10px]">
              {selectedMember ? (
                getInitials(selectedMember.label)
              ) : (
                <UserRound className="h-3 w-3" />
              )}
            </AvatarFallback>
          </Avatar>
          <span>{selectedMember?.label ?? 'Unassigned'}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Priority</Label>
        <Select
          value={formState.priority || 'medium'}
          onValueChange={(value) =>
            setFormState((previous) => ({ ...previous, priority: value }))
          }
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            {TASK_PRIORITY_OPTIONS.map((priority) => (
              <SelectItem key={priority.value} value={priority.value}>
                {priority.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <Popover open={isTagPickerOpen} onOpenChange={setIsTagPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-10 w-full justify-between px-2 py-1.5"
              disabled={isAddTagPending || isDeleteTagPending}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                {taskTags.length > 0 ? (
                  taskTags.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="rounded-sm">
                      {tag.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">Select tags</span>
                )}
              </div>
              <span className="text-muted-foreground text-xs">Edit</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[320px] space-y-2 p-2"
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {taskTags.length > 0 ? (
                  taskTags.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="rounded-sm">
                      {tag.name}
                      <button
                        type="button"
                        className="ml-1 text-xs leading-none"
                        disabled={isDeleteTagPending}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          onRemoveTag(tag.id);
                        }}
                      >
                        x
                      </button>
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground text-xs">No tag selected.</p>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={onTagInputKeyDown}
                  placeholder="Type tag name..."
                  disabled={isAddTagPending}
                />
                <Button
                  type="button"
                  onClick={() => onAddTag(tagInput)}
                  disabled={!tagInput.trim() || isAddTagPending}
                >
                  Add
                </Button>
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium">All tags</p>
                <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                  {filteredTagNames.length > 0 ? (
                    filteredTagNames.map((tagName) => {
                      const selected = taskTags.some(
                        (tag) =>
                          tag.name.trim().toLowerCase() ===
                          tagName.trim().toLowerCase(),
                      );
                      return (
                        <button
                          key={tagName}
                          type="button"
                          className={cn(
                            'hover:bg-muted flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm',
                            selected && 'bg-muted',
                          )}
                          disabled={selected || isAddTagPending}
                          onClick={() => onAddTag(tagName)}
                        >
                          <Badge variant="outline" className="rounded-sm">
                            {tagName}
                          </Badge>
                          {selected && (
                            <span className="text-muted-foreground text-xs">
                              Selected
                            </span>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground px-2 py-1 text-sm">
                      No matching tags.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-3 rounded-md border p-3">
        <p className="text-sm font-medium">Estimate time</p>
        <div className="space-y-2">
          <Label htmlFor="task-detail-started-at">Start date</Label>
          <DatePicker
            id="task-detail-started-at"
            value={formState.startedAt}
            onChange={(value) =>
              setFormState((previous) => ({
                ...previous,
                startedAt: value,
              }))
            }
            disabled={isSubmitting}
            placeholder="Select start date"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-detail-due-date">Due date</Label>
          <DatePicker
            id="task-detail-due-date"
            value={formState.dueDate}
            onChange={(value) =>
              setFormState((previous) => ({
                ...previous,
                dueDate: value,
              }))
            }
            disabled={isSubmitting}
            placeholder="Select due date"
          />
        </div>
      </div>

      <div className="space-y-3 rounded-md border p-3">
        <p className="text-sm font-medium">Actual time</p>
        <div className="rounded-md bg-muted/40 p-2">
          <p className="text-muted-foreground text-xs">Logged time</p>
          <p className="text-sm font-medium">{formatLoggedTime(actualLoggedMinutes)}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="task-detail-actual-start">Actual start</Label>
          <DatePicker
            id="task-detail-actual-start"
            value={formState.actualStart}
            onChange={(value) =>
              setFormState((previous) => ({
                ...previous,
                actualStart: value,
              }))
            }
            disabled={isSubmitting}
            placeholder="Select actual start"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-detail-actual-end">Actual end</Label>
          <DatePicker
            id="task-detail-actual-end"
            value={formState.actualEnd}
            onChange={(value) =>
              setFormState((previous) => ({
                ...previous,
                actualEnd: value,
              }))
            }
            disabled={isSubmitting}
            placeholder="Select actual end"
          />
        </div>
      </div>

      <div className="space-y-3 rounded-md border p-3">
        <p className="text-sm font-medium">Estimation</p>
        <div className="space-y-2">
          <Label htmlFor="task-detail-estimated-point">Story Points</Label>
          <Input
            id="task-detail-estimated-point"
            type="number"
            min="0"
            step="1"
            value={formState.estimatedPoint}
            onChange={(event) =>
              setFormState((previous) => ({
                ...previous,
                estimatedPoint: event.target.value,
              }))
            }
            disabled={isSubmitting}
            placeholder="e.g. 3"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-detail-estimated-hours">Estimated Hours</Label>
          <Input
            id="task-detail-estimated-hours"
            type="number"
            min="0"
            step="0.5"
            value={formState.estimatedHours}
            onChange={(event) =>
              setFormState((previous) => ({
                ...previous,
                estimatedHours: event.target.value,
              }))
            }
            disabled={isSubmitting}
            placeholder="e.g. 4.5"
          />
        </div>
      </div>
    </div>
  );
}
