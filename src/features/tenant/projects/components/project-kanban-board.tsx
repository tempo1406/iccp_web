'use client';

import { useRef, type DragEvent } from 'react';
import { format, parseISO } from 'date-fns';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  ChevronsUp,
  CornerDownLeft,
  Loader2,
  MoreHorizontal,
  Plus,
  SquarePen,
  UserRound,
  Workflow,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as UiCalendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useProjectKanbanBoardState } from '../hooks/use-project-kanban-board-state';
import { useConfirmAlertDialog } from '../hooks/use-confirm-alert-dialog';
import {
  type ProjectColumn,
  type ProjectTask,
} from './project-detail-data';

interface ProjectMemberOption {
  userId: string;
  label: string;
  subtitle?: string;
  avatarUrl?: string;
}

interface CreateTaskInput {
  statusId: string;
  title: string;
  dueDate?: string;
  assignedTo?: string | null;
}

interface ProjectKanbanBoardProps {
  columns: ProjectColumn[];
  draggedTaskId?: string;
  movingTaskId?: string | null;
  dragOverColumnId: string | null;
  searchQuery: string;
  memberOptions: ProjectMemberOption[];
  canCreateTask?: boolean;
  canCreateStatus?: boolean;
  onTaskClick?: (taskId: string) => void;
  onDragStart: (
    event: DragEvent<HTMLDivElement>,
    task: ProjectTask,
    columnId: string,
  ) => void;
  onDragEnd: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>, columnId: string) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>, columnId: string) => void;
  onCreateTask?: (input: CreateTaskInput) => Promise<boolean>;
  onAssignTask?: (taskId: string, assigneeUserId?: string) => Promise<boolean>;
  onRenameTask?: (taskId: string, title: string) => Promise<boolean>;
  onDeleteTask?: (taskId: string) => Promise<boolean>;
  onDuplicateTask?: (taskId: string) => Promise<boolean>;
  onAddTaskTag?: (taskId: string, tagName: string) => Promise<boolean>;
  onChangeTaskStatus?: (taskId: string, statusId: string) => Promise<boolean>;
  onCreateStatus?: (name: string) => Promise<boolean>;
  onRenameStatus?: (statusId: string, name: string) => Promise<boolean>;
  onDeleteStatus?: (statusId: string) => Promise<boolean>;
  onReorderStatus?: (statusId: string, targetIndex: number) => Promise<boolean>;
  isCreatingTask?: boolean;
  isUpdatingTask?: boolean;
  isCreatingStatus?: boolean;
  isMutatingStatus?: boolean;
}

function parseDateValue(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function toTaskPriorityTitle(
  priorityT: (key: string) => string,
  priority?: string,
): string {
  const normalized = (priority ?? 'medium').trim().toLowerCase();
  if (normalized === 'low') return priorityT('low');
  if (normalized === 'high') return priorityT('high');
  if (normalized === 'urgent') return priorityT('urgent');
  return priorityT('medium');
}

function renderTaskPriorityIcon(priority?: string) {
  const normalized = (priority ?? 'medium').trim().toLowerCase();

  if (normalized === 'urgent') {
    return <ChevronsUp className="h-3.5 w-3.5 text-rose-500" strokeWidth={2.25} />;
  }

  if (normalized === 'high') {
    return <ChevronUp className="h-3.5 w-3.5 text-orange-500" strokeWidth={2.25} />;
  }

  if (normalized === 'low') {
    return <ChevronDown className="h-3.5 w-3.5 text-blue-500" strokeWidth={2.25} />;
  }

  return (
    <span className="flex flex-col gap-0.5" aria-hidden>
      <span className="h-0.5 w-3 rounded-full bg-amber-500" />
      <span className="h-0.5 w-3 rounded-full bg-amber-500" />
    </span>
  );
}

export function ProjectKanbanBoard({
  columns,
  draggedTaskId,
  movingTaskId = null,
  dragOverColumnId,
  searchQuery,
  memberOptions,
  canCreateTask = true,
  canCreateStatus = true,
  onTaskClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onCreateTask,
  onAssignTask,
  onRenameTask,
  onDeleteTask,
  onDuplicateTask,
  onAddTaskTag,
  onChangeTaskStatus,
  onCreateStatus,
  onRenameStatus,
  onDeleteStatus,
  onReorderStatus,
  isCreatingTask = false,
  isUpdatingTask = false,
  isCreatingStatus = false,
  isMutatingStatus = false,
}: ProjectKanbanBoardProps) {
  const t = useTranslations('project.kanban');
  const commonT = useTranslations('project.common');
  const priorityT = useTranslations('project.dashboard.priority');
  const blockedTaskOpenIdRef = useRef<string | null>(null);
  const { confirm, confirmDialog } = useConfirmAlertDialog();

  const blockTaskOpenForAssigneeInteraction = (taskId: string) => {
    blockedTaskOpenIdRef.current = taskId;
    window.setTimeout(() => {
      if (blockedTaskOpenIdRef.current === taskId) {
        blockedTaskOpenIdRef.current = null;
      }
    }, 220);
  };

  const {
    isAddingColumn,
    setIsAddingColumn,
    newColumnName,
    setNewColumnName,
    editingColumnId,
    editingColumnName,
    setEditingColumnName,
    columnDropTargetId,
    setColumnDropTargetId,
    creatingTaskColumnId,
    newTaskTitle,
    setNewTaskTitle,
    newTaskDueDate,
    setNewTaskDueDate,
    newTaskAssignedTo,
    setNewTaskAssignedTo,
    isDueDatePickerOpen,
    setIsDueDatePickerOpen,
    isMemberPickerOpen,
    setIsMemberPickerOpen,
    taskAssigneePickerId,
    setTaskAssigneePickerId,
    taskAssigneeOverrides,
    editingTaskId,
    editingTaskTitle,
    setEditingTaskTitle,
    assigningTaskId,
    renamingTaskId,
    duplicatingTaskId,
    isTagDialogOpen,
    tagDialogTaskSlug,
    tagDialogInput,
    setTagDialogInput,
    tagDialogSelected,
    isApplyingTag,
    taskComposerRef,
    isDraggingColumn,
    selectedMemberLabel,
    filteredTagSuggestions,
    resetAddColumnForm,
    beginEditColumn,
    cancelEditColumn,
    resetTaskComposer,
    openTaskComposer,
    handleSubmitNewColumn,
    handleSubmitRenameColumn,
    handleCreateTaskSubmit,
    handleColumnDragStart,
    handleColumnDragEnd,
    handleColumnDrop,
    handleMoveColumn,
    handleDeleteColumn,
    getInitials,
    handleAssignTaskMember,
    beginEditTask,
    cancelEditTask,
    handleRenameTaskSubmit,
    getOrderedTasks,
    moveTaskInColumn,
    handleChangeStatusFromMenu,
    openAddTagDialog,
    closeAddTagDialog,
    toggleTagSelection,
    handleAppendTypedTag,
    handleApplyTags,
    handleDeleteTaskFromMenu,
    handleDuplicateTaskFromMenu,
  } = useProjectKanbanBoardState({
    columns,
    searchQuery,
    memberOptions,
    canCreateStatus,
    onCreateTask,
    onAssignTask,
    onRenameTask,
    onDeleteTask,
    onDuplicateTask,
    onAddTaskTag,
    onChangeTaskStatus,
    onCreateStatus,
    onRenameStatus,
    onDeleteStatus,
    onReorderStatus,
    confirmAction: confirm,
    isCreatingTask,
    isUpdatingTask,
    isCreatingStatus,
    isMutatingStatus,
  });

  return (
    <>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {columns.map((column, index) => {
            const isEditingColumn = editingColumnId === column.id;
            const isTaskDragTarget = !isDraggingColumn && dragOverColumnId === column.id;
            const isColumnDragTarget = isDraggingColumn && columnDropTargetId === column.id;
            const isCreatingTaskInColumn = creatingTaskColumnId === column.id;
            const orderedTasks = getOrderedTasks(column);

            return (
              <div
                key={column.id}
                className={cn(
                  'bg-muted/40 flex w-70 shrink-0 flex-col rounded-lg border transition-colors',
                  isTaskDragTarget && 'border-primary/50 bg-primary/5',
                  isColumnDragTarget && 'border-primary/50 bg-primary/5',
                )}
                onDragOver={(event) => {
                  if (isDraggingColumn) {
                    event.preventDefault();
                    setColumnDropTargetId(column.id);
                    return;
                  }
                  onDragOver(event, column.id);
                }}
                onDragLeave={() => {
                  if (isDraggingColumn) {
                    if (columnDropTargetId === column.id) {
                      setColumnDropTargetId(null);
                    }
                    return;
                  }
                  onDragLeave();
                }}
                onDrop={(event) => {
                  if (isDraggingColumn) {
                    event.preventDefault();
                    void handleColumnDrop(column.id);
                    return;
                  }
                  onDrop(event, column.id);
                }}
              >
                <div className="px-2.5 py-2">
                  {isEditingColumn ? (
                    <div className="space-y-2">
                      <Input
                        value={editingColumnName}
                        onChange={(event) => setEditingColumnName(event.target.value)}
                        autoFocus
                        disabled={isMutatingStatus}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            void handleSubmitRenameColumn();
                          }
                          if (event.key === 'Escape') {
                            event.preventDefault();
                            cancelEditColumn();
                          }
                        }}
                      />
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={!editingColumnName.trim() || isMutatingStatus}
                          onClick={() => void handleSubmitRenameColumn()}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={isMutatingStatus}
                          onClick={cancelEditColumn}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          'flex items-center gap-1.5',
                          canCreateStatus &&
                          Boolean(onReorderStatus) &&
                          !isMutatingStatus &&
                          'cursor-grab active:cursor-grabbing',
                        )}
                        draggable={
                          canCreateStatus && Boolean(onReorderStatus) && !isMutatingStatus
                        }
                        onDragStart={(event) => handleColumnDragStart(event, column.id)}
                        onDragEnd={handleColumnDragEnd}
                      >
                        <span
                          className="text-xs font-semibold"
                          onDoubleClick={(event) => {
                            event.stopPropagation();
                            if (!canCreateStatus || isMutatingStatus) return;
                            beginEditColumn(column.id, column.title);
                          }}
                        >
                          {column.title}
                        </span>
                        <span className="bg-muted text-muted-foreground flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium">
                          {column.tasks.length}
                        </span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          {canCreateStatus && (
                            <>
                              <DropdownMenuItem
                                disabled={index === 0 || isMutatingStatus}
                                onClick={() => void handleMoveColumn(column.id, -1)}
                              >
                                {t('actions.moveColumnLeft')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={index === columns.length - 1 || isMutatingStatus}
                                onClick={() => void handleMoveColumn(column.id, 1)}
                              >
                                {t('actions.moveColumnRight')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                disabled={isMutatingStatus}
                                onClick={() => void handleDeleteColumn(column.id, column.title)}
                              >
                                {commonT('delete')}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>

                <ScrollArea className="flex-1">
                  <div className="flex flex-col gap-1.5 px-2 pb-2">
                    {isCreatingTaskInColumn && (
                      <div
                        ref={taskComposerRef}
                        className="bg-background border-primary/70 space-y-3 rounded-md border p-2"
                      >
                        <textarea
                          value={newTaskTitle}
                          onChange={(event) => setNewTaskTitle(event.target.value)}
                          placeholder={t('fields.taskTitlePlaceholder')}
                          className="border-input bg-background focus-visible:ring-ring min-h-23 w-full resize-none rounded-md border px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none md:text-sm"
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                              event.preventDefault();
                              resetTaskComposer();
                            }
                            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                              event.preventDefault();
                              void handleCreateTaskSubmit(column.id);
                            }
                          }}
                          autoFocus
                          disabled={isCreatingTask}
                        />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-11 gap-2 px-3"
                              disabled
                            >
                              <CheckSquare className="text-primary h-5 w-5" />
                              <ChevronDown className="h-4 w-4" />
                            </Button>

                            <Popover
                              open={isDueDatePickerOpen}
                              onOpenChange={setIsDueDatePickerOpen}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className={cn(
                                    'h-11 w-11',
                                    newTaskDueDate && 'border-primary text-primary',
                                  )}
                                  disabled={isCreatingTask}
                                >
                                  <Calendar className="h-5 w-5" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                align="start"
                                className="w-72 space-y-3 p-3"
                                data-task-composer-popover="true"
                              >
                                <p className="text-sm font-medium">{t('fields.dueDate')}</p>
                                <div className="rounded-md border">
                                  <UiCalendar
                                    mode="single"
                                    selected={parseDateValue(newTaskDueDate)}
                                    onSelect={(date) =>
                                      setNewTaskDueDate(date ? format(date, 'yyyy-MM-dd') : '')
                                    }
                                    initialFocus
                                  />
                                </div>
                                <div className="flex justify-between">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setNewTaskDueDate('')}
                                  >
                                    {commonT('clear')}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsDueDatePickerOpen(false)}
                                  >
                                    {commonT('close')}
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>

                            <Popover
                              open={isMemberPickerOpen}
                              onOpenChange={setIsMemberPickerOpen}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className={cn(
                                    'h-11 w-11',
                                    newTaskAssignedTo && 'border-primary text-primary',
                                  )}
                                  disabled={isCreatingTask}
                                >
                                  <UserRound className="h-5 w-5" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                align="start"
                                className="w-72 p-2"
                                data-task-composer-popover="true"
                              >
                                <div className="space-y-1">
                                  <button
                                    type="button"
                                    className={cn(
                                      'flex w-full items-center gap-2 rounded-md border border-transparent px-3 py-2.5 text-left text-sm transition-[background-color,border-color,box-shadow] hover:border-border/60 hover:bg-muted/70 focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] focus-visible:outline-none',
                                      !newTaskAssignedTo && 'border-border/60 bg-muted',
                                    )}
                                    onClick={() => {
                                      setNewTaskAssignedTo('');
                                      setIsMemberPickerOpen(false);
                                    }}
                                  >
                                    <UserRound className="h-4 w-4 shrink-0" />
                                    <span>{t('labels.unassigned')}</span>
                                  </button>
                                  {memberOptions.map((member) => (
                                    <button
                                      key={member.userId}
                                      type="button"
                                      className={cn(
                                        'flex w-full items-center gap-2 rounded-md border border-transparent px-3 py-2.5 text-left text-sm transition-[background-color,border-color,box-shadow] hover:border-border/60 hover:bg-muted/70 focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] focus-visible:outline-none',
                                        newTaskAssignedTo === member.userId && 'border-border/60 bg-muted',
                                      )}
                                      onClick={() => {
                                        setNewTaskAssignedTo(member.userId);
                                        setIsMemberPickerOpen(false);
                                      }}
                                    >
                                      <Avatar className="h-6 w-6 shrink-0">
                                        {member.avatarUrl ? (
                                          <AvatarImage src={member.avatarUrl} alt={member.label} />
                                        ) : null}
                                        <AvatarFallback className="text-[10px]">
                                          {member.label
                                            .split(' ')
                                            .map((part) => part[0] ?? '')
                                            .join('')
                                            .slice(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="min-w-0">
                                        <p className="truncate">{member.label}</p>
                                        {member.subtitle && (
                                          <p className="text-muted-foreground truncate text-xs">
                                            {member.subtitle}
                                          </p>
                                        )}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-11 w-11"
                            disabled={!newTaskTitle.trim() || isCreatingTask}
                            onClick={() => void handleCreateTaskSubmit(column.id)}
                            title={t('labels.createTask', { assignee: selectedMemberLabel })}
                          >
                            <CornerDownLeft className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {orderedTasks.map((task) => {
                      const taskIndexInColumn = orderedTasks.findIndex(
                        (item) => item.id === task.id,
                      );
                      const hasAssigneeOverride = Object.prototype.hasOwnProperty.call(
                        taskAssigneeOverrides,
                        task.id,
                      );
                      const overriddenAssigneeUserId = hasAssigneeOverride
                        ? taskAssigneeOverrides[task.id]
                        : undefined;
                      const resolvedAssigneeUserId = hasAssigneeOverride
                        ? overriddenAssigneeUserId ?? undefined
                        : task.assigneeUserId;
                      const selectedMember = memberOptions.find(
                        (member) => member.userId === resolvedAssigneeUserId,
                      );
                      const fallbackAssignee = hasAssigneeOverride ? undefined : task.assignees[0];
                      const assigneeLabel =
                        selectedMember?.label || fallbackAssignee?.name || t('labels.unassigned');
                      const assigneeSubtitle = selectedMember?.subtitle;
                      const assigneeAvatarUrl =
                        selectedMember?.avatarUrl || fallbackAssignee?.avatar || undefined;
                      const isUnassigned = !resolvedAssigneeUserId;
                      const taskSlug =
                        task.slug ||
                        `TS-${task.id.replace(/-/g, '').slice(0, 4).toUpperCase()}`;
                      const isEditingTask = editingTaskId === task.id;
                      const isMovingTask = movingTaskId === task.id;
                      const isTaskUpdating =
                        assigningTaskId === task.id ||
                        renamingTaskId === task.id ||
                        duplicatingTaskId === task.id;
                      const primaryTag = task.tags[0];
                      const extraTagCount = Math.max(task.tags.length - 1, 0);
                      const hasSubtasks = (task.subtaskCount ?? 0) > 0;
                      const hasDueDate = Boolean(task.dueDate);
                      const isOverdue = task.dueState === 'overdue';
                      const hasTaskMeta = Boolean(primaryTag || hasDueDate);

                      return (
                        <Card
                          key={task.id}
                          draggable={!isEditingTask && !isMovingTask}
                          onDragStart={(event) => {
                            if (isEditingTask || isMovingTask) return;
                            onDragStart(event, task, column.id);
                          }}
                          onDragEnd={onDragEnd}
                          className={cn(
                            'group w-[260px] cursor-grab overflow-hidden border-border/60 bg-card/95 transition-all hover:shadow-sm active:cursor-grabbing',
                            hasTaskMeta ? 'min-h-[100px]' : 'min-h-[76px]',
                            draggedTaskId === task.id && 'opacity-50',
                            isMovingTask &&
                              'cursor-progress opacity-55 ring-1 ring-primary/30 pointer-events-none',
                          )}
                          onClick={() => {
                            if (isEditingTask) return;
                            if (isMovingTask) return;
                            if (blockedTaskOpenIdRef.current === task.id) return;
                            onTaskClick?.(task.id);
                          }}
                        >
                          <CardContent className="px-3">
                            {isEditingTask ? (
                              <div className="space-y-1">
                                <Input
                                  value={editingTaskTitle}
                                  onChange={(event) => setEditingTaskTitle(event.target.value)}
                                  autoFocus
                                  disabled={isUpdatingTask}
                                  className="h-7 px-1.5 text-sm"
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                      event.preventDefault();
                                      void handleRenameTaskSubmit(task.id);
                                    }
                                    if (event.key === 'Escape') {
                                      event.preventDefault();
                                      cancelEditTask();
                                    }
                                  }}
                                />
                                <div className="flex items-center justify-between">
                                  <div className="text-muted-foreground flex items-center gap-1.5">
                                    <CheckSquare className="text-primary h-3 w-3" />
                                    <span className="text-[11px] font-semibold">{taskSlug}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-6 w-6"
                                      disabled={!editingTaskTitle.trim() || isUpdatingTask}
                                      onClick={() => void handleRenameTaskSubmit(task.id)}
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-6 w-6"
                                      disabled={isUpdatingTask}
                                      onClick={cancelEditTask}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1.5">
                                <div className="space-y-1.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex min-w-0 items-start gap-1.5">
                                      <p className="min-w-0 whitespace-normal break-words text-[15px] leading-[1.2] font-medium">
                                        {task.title}
                                      </p>
                                      {onRenameTask && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="text-muted-foreground h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                                          disabled={isUpdatingTask}
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            beginEditTask(task);
                                          }}
                                        >
                                          <SquarePen className="h-2.5 w-2.5" />
                                        </Button>
                                      )}
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="text-muted-foreground h-5 w-5 shrink-0"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                          }}
                                        >
                                          <MoreHorizontal className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        align="end"
                                        className="min-w-52"
                                        onClick={(event) => event.stopPropagation()}
                                      >
                                        <DropdownMenuSub>
                                          <DropdownMenuSubTrigger>
                                            Move work item
                                          </DropdownMenuSubTrigger>
                                          <DropdownMenuSubContent>
                                            <DropdownMenuItem
                                              disabled={taskIndexInColumn <= 0}
                                              onClick={() =>
                                                moveTaskInColumn(column.id, task.id, 'top')
                                              }
                                            >
                                              To the top
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              disabled={taskIndexInColumn <= 0}
                                              onClick={() =>
                                                moveTaskInColumn(column.id, task.id, 'up')
                                              }
                                            >
                                              Up
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              disabled={taskIndexInColumn >= orderedTasks.length - 1}
                                              onClick={() =>
                                                moveTaskInColumn(column.id, task.id, 'down')
                                              }
                                            >
                                              Down
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              disabled={taskIndexInColumn >= orderedTasks.length - 1}
                                              onClick={() =>
                                                moveTaskInColumn(column.id, task.id, 'bottom')
                                              }
                                            >
                                              To the bottom
                                            </DropdownMenuItem>
                                          </DropdownMenuSubContent>
                                        </DropdownMenuSub>

                                        <DropdownMenuSub>
                                          <DropdownMenuSubTrigger disabled={!onChangeTaskStatus}>
                                            Change status
                                          </DropdownMenuSubTrigger>
                                          <DropdownMenuSubContent>
                                            {columns.map((statusColumn) => (
                                              <DropdownMenuItem
                                                key={statusColumn.id}
                                                disabled={
                                                  !onChangeTaskStatus ||
                                                  statusColumn.id === column.id ||
                                                  isUpdatingTask
                                                }
                                                onClick={() =>
                                                  void handleChangeStatusFromMenu(
                                                    task.id,
                                                    statusColumn.id,
                                                  )
                                                }
                                              >
                                                {statusColumn.title}
                                              </DropdownMenuItem>
                                            ))}
                                          </DropdownMenuSubContent>
                                        </DropdownMenuSub>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem
                                          disabled={!onDuplicateTask || isTaskUpdating || isUpdatingTask}
                                          onClick={() =>
                                            void handleDuplicateTaskFromMenu(task.id)
                                          }
                                        >
                                          {duplicatingTaskId === task.id && (
                                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                          )}
                                          Duplicate
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                          disabled={!onAddTaskTag}
                                          onClick={() => openAddTagDialog(task)}
                                        >
                                          Add tag
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem
                                          className="text-destructive"
                                          disabled={!onDeleteTask || isUpdatingTask}
                                          onClick={() =>
                                            void handleDeleteTaskFromMenu(task.id)
                                          }
                                        >
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>

                                  {(primaryTag || hasDueDate) && (
                                    <div className="space-y-1">
                                      {primaryTag && (
                                        <div className="flex items-center gap-1.5">
                                          <span className="rounded-[6px] border border-black px-2 py-1 text-[10px] leading-none text-black dark:border-white dark:text-white">
                                            {primaryTag}
                                          </span>
                                          {extraTagCount > 0 && (
                                            <span className="text-muted-foreground text-[10px]">+{extraTagCount}</span>
                                          )}
                                        </div>
                                      )}

                                      {hasDueDate && (
                                        <div
                                          className={cn(
                                            'inline-flex w-fit items-center gap-1 rounded-[6px] border px-2 py-1 text-[10px] leading-none',
                                            isOverdue
                                              ? 'border-rose-400/90 text-rose-400'
                                              : 'border-border text-foreground',
                                          )}
                                        >
                                          {isOverdue ? (
                                            <AlertTriangle className="h-3 w-3" />
                                          ) : (
                                            <Calendar className="text-muted-foreground h-3 w-3" />
                                          )}
                                          <span>{task.dueDate}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="mt-auto flex items-center justify-between gap-2 pt-0">
                                  <div className="text-muted-foreground flex min-w-0 items-center gap-1.5">
                                    <CheckSquare className="text-primary h-4 w-4 shrink-0" />
                                    <span className="truncate text-[12px] font-semibold">{taskSlug}</span>
                                  </div>

                                  <div className="flex shrink-0 items-center gap-2">
                                    {hasSubtasks && (
                                      <div
                                        className="text-muted-foreground flex items-center gap-1"
                                        title={t('labels.subtasks', { count: task.subtaskCount ?? 0 })}
                                      >
                                        <Workflow className="h-3.5 w-3.5" />
                                        <span className="text-[10px]">
                                          {task.subtaskCount}
                                        </span>
                                      </div>
                                    )}

                                      <div
                                        className="flex h-6.5 w-6.5 shrink-0 items-center justify-center"
                                        title={t('labels.priority', {
                                          value: toTaskPriorityTitle(priorityT, task.priority),
                                        })}
                                      >
                                      {renderTaskPriorityIcon(task.priority)}
                                    </div>

                                    <Popover
                                      open={taskAssigneePickerId === task.id}
                                      onOpenChange={(open) => {
                                        if (open) {
                                          blockTaskOpenForAssigneeInteraction(task.id);
                                        }
                                        setTaskAssigneePickerId(open ? task.id : null);
                                      }}
                                    >
                                      <PopoverTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 rounded-full p-0"
                                          disabled={!onAssignTask || isUpdatingTask}
                                          onPointerDown={(event) => {
                                            event.stopPropagation();
                                            blockTaskOpenForAssigneeInteraction(task.id);
                                          }}
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            blockTaskOpenForAssigneeInteraction(task.id);
                                          }}
                                        >
                                          {isUnassigned ? (
                                            <span className="bg-muted text-muted-foreground flex h-6.5 w-6.5 items-center justify-center rounded-full">
                                              <UserRound className="h-3.5 w-3.5" />
                                            </span>
                                          ) : (
                                            <Avatar
                                              key={resolvedAssigneeUserId}
                                              className="h-6.5 w-6.5"
                                            >
                                              {assigneeAvatarUrl ? (
                                                <AvatarImage src={assigneeAvatarUrl} alt={assigneeLabel} />
                                              ) : null}
                                              <AvatarFallback className="text-[12px]">
                                                {getInitials(assigneeLabel)}
                                              </AvatarFallback>
                                            </Avatar>
                                          )}
                                        </Button>
                                      </PopoverTrigger>

                                      <PopoverContent
                                        align="end"
                                        className="w-80 p-2"
                                        onPointerDown={(event) => {
                                          event.stopPropagation();
                                          blockTaskOpenForAssigneeInteraction(task.id);
                                        }}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          blockTaskOpenForAssigneeInteraction(task.id);
                                        }}
                                      >
                                        <div className="border-input mb-2 flex items-center gap-2 rounded-md border px-2 py-2">
                                          {isUnassigned ? (
                                            <span className="bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                                              <UserRound className="h-4 w-4" />
                                            </span>
                                          ) : (
                                            <Avatar key={resolvedAssigneeUserId} className="h-8 w-8">
                                              {assigneeAvatarUrl ? (
                                                <AvatarImage src={assigneeAvatarUrl} alt={assigneeLabel} />
                                              ) : null}
                                              <AvatarFallback className="text-[11px]">
                                                {getInitials(assigneeLabel)}
                                              </AvatarFallback>
                                            </Avatar>
                                          )}
                                          <div className="min-w-0">
                                            <p className="truncate text-sm">{assigneeLabel}</p>
                                            {assigneeSubtitle && (
                                              <p className="text-muted-foreground truncate text-xs">
                                                {assigneeSubtitle}
                                              </p>
                                            )}
                                          </div>
                                        </div>

                                        <div className="space-y-1">
                                          <button
                                            type="button"
                                            className={cn(
                                              'flex w-full items-center gap-2 rounded-md border border-transparent px-3 py-2.5 text-left text-sm transition-[background-color,border-color,box-shadow] hover:border-border/60 hover:bg-muted/70 focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] focus-visible:outline-none',
                                              !resolvedAssigneeUserId &&
                                                'border-border/60 bg-muted',
                                            )}
                                            disabled={isUpdatingTask}
                                            onClick={() => {
                                              blockTaskOpenForAssigneeInteraction(task.id);
                                              void handleAssignTaskMember(task.id, undefined);
                                            }}
                                          >
                                            <UserRound className="h-4 w-4 shrink-0" />
                                            <span>{t('actions.automatic')}</span>
                                          </button>
                                          {memberOptions.map((member) => (
                                            <button
                                              key={member.userId}
                                              type="button"
                                              className={cn(
                                                'flex w-full items-center gap-2 rounded-md border border-transparent px-3 py-2.5 text-left text-sm transition-[background-color,border-color,box-shadow] hover:border-border/60 hover:bg-muted/70 focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] focus-visible:outline-none',
                                                resolvedAssigneeUserId === member.userId &&
                                                  'border-border/60 bg-muted',
                                              )}
                                              disabled={isUpdatingTask}
                                              onClick={() => {
                                                blockTaskOpenForAssigneeInteraction(task.id);
                                                void handleAssignTaskMember(task.id, member.userId);
                                              }}
                                            >
                                              <Avatar className="h-6 w-6 shrink-0">
                                                {member.avatarUrl ? (
                                                  <AvatarImage src={member.avatarUrl} alt={member.label} />
                                                ) : null}
                                                <AvatarFallback className="text-[10px]">
                                                  {getInitials(member.label)}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className="min-w-0">
                                                <p className="truncate">{member.label}</p>
                                                {member.subtitle && (
                                                  <p className="text-muted-foreground truncate text-xs">
                                                    {member.subtitle}
                                                  </p>
                                                )}
                                              </div>
                                            </button>
                                          ))}
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                </div>
                              </div>
                            )}

                            {isTaskUpdating && (
                              <p className="text-muted-foreground text-[10px]">
                                {t('labels.updatingTask')}
                              </p>
                            )}

                            {isMovingTask && (
                              <p className="text-primary/80 flex items-center gap-1 text-[10px]">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {t('labels.movingTask')}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}

                    {!isDraggingColumn && dragOverColumnId === column.id && draggedTaskId && (
                      <div className="border-primary/40 bg-primary/5 flex h-10 items-center justify-center rounded-md border-2 border-dashed">
                        <p className="text-primary/60 text-[10px]">
                          {t('labels.dropToMove', { column: column.title })}
                        </p>
                      </div>
                    )}

                    {canCreateTask && !isCreatingTaskInColumn && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground mt-0.5 h-7 w-full justify-start gap-1 text-xs"
                        onClick={() => openTaskComposer(column.id)}
                      >
                        <Plus className="h-3 w-3" />
                        {t('actions.create')}
                      </Button>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}

          {canCreateStatus &&
            (isAddingColumn ? (
              <div className="bg-muted/40 w-70 shrink-0 self-start rounded-lg border p-3">
                <Input
                  value={newColumnName}
                  onChange={(event) => setNewColumnName(event.target.value)}
                  placeholder={t('fields.columnName')}
                  autoFocus
                  disabled={isCreatingStatus || isMutatingStatus}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleSubmitNewColumn();
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      resetAddColumnForm();
                    }
                  }}
                />

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-muted-foreground flex items-center gap-1.5 text-sm font-medium">
                    <Plus className="h-4 w-4" />
                    {t('actions.create')}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      disabled={
                        !newColumnName.trim() || isCreatingStatus || isMutatingStatus
                      }
                      onClick={() => void handleSubmitNewColumn()}
                    >
                      <Check className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      disabled={isCreatingStatus || isMutatingStatus}
                      onClick={resetAddColumnForm}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 shrink-0 self-start text-xs"
                onClick={() => setIsAddingColumn(true)}
              >
                <Plus className="mr-1 h-3 w-3" />
                {t('actions.addColumn')}
              </Button>
            ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {confirmDialog}

      <Dialog
        open={isTagDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeAddTagDialog();
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {t('tagDialog.title', {
                task: tagDialogTaskSlug || t('tagDialog.taskFallback'),
              })}
            </DialogTitle>
            <DialogDescription>
              {t('tagDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={tagDialogInput}
                onChange={(event) => setTagDialogInput(event.target.value)}
                placeholder={t('fields.tags')}
                disabled={isApplyingTag}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAppendTypedTag();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={!tagDialogInput.trim() || isApplyingTag}
                onClick={handleAppendTypedTag}
              >
                {t('actions.add')}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {tagDialogSelected.length > 0 ? (
                tagDialogSelected.map((tagName) => (
                  <Badge key={tagName} variant="outline" className="rounded-sm">
                    {tagName}
                    <button
                      type="button"
                      className="ml-1 text-xs"
                      onClick={() => toggleTagSelection(tagName)}
                    >
                      x
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">{t('tagDialog.empty')}</p>
              )}
            </div>

            <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
              {filteredTagSuggestions.length > 0 ? (
                filteredTagSuggestions.map((tagName) => {
                  const isSelected = tagDialogSelected.some(
                    (item) => item.toLowerCase() === tagName.toLowerCase(),
                  );
                  return (
                    <button
                      key={tagName}
                      type="button"
                      className={cn(
                        'hover:bg-muted flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm',
                        isSelected && 'bg-muted',
                      )}
                      disabled={isApplyingTag}
                      onClick={() => toggleTagSelection(tagName)}
                    >
                      <span>{tagName}</span>
                      {isSelected && <span className="text-xs">{t('tagDialog.selected')}</span>}
                    </button>
                  );
                })
              ) : (
                <p className="text-muted-foreground px-2 py-1 text-sm">
                  {t('tagDialog.noMatch')}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={isApplyingTag}
              onClick={closeAddTagDialog}
            >
              {commonT('cancel')}
            </Button>
            <Button
              type="button"
              disabled={isApplyingTag || !onAddTaskTag || tagDialogSelected.length === 0}
              onClick={() => void handleApplyTags()}
            >
              {isApplyingTag && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {commonT('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


