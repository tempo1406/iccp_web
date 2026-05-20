'use client';

import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { useTranslations } from 'next-intl';
import type { ProjectColumn, ProjectTask } from '../components/project-detail-data';
import type { ConfirmAlertDialogOptions } from './use-confirm-alert-dialog';

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

interface ProjectMemberOption {
  userId: string;
  label: string;
  subtitle?: string;
}

interface CreateTaskInput {
  statusId: string;
  title: string;
  dueDate?: string;
  assignedTo?: string | null;
}

interface UseProjectKanbanBoardStateParams {
  columns: ProjectColumn[];
  searchQuery: string;
  memberOptions: ProjectMemberOption[];
  canCreateStatus: boolean;
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
  confirmAction?: (options: ConfirmAlertDialogOptions) => Promise<boolean>;
  isCreatingTask: boolean;
  isUpdatingTask: boolean;
  isCreatingStatus: boolean;
  isMutatingStatus: boolean;
}

export function useProjectKanbanBoardState({
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
  confirmAction,
  isCreatingTask,
  isUpdatingTask,
  isCreatingStatus,
  isMutatingStatus,
}: UseProjectKanbanBoardStateParams) {
  const t = useTranslations('project');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState('');
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [columnDropTargetId, setColumnDropTargetId] = useState<string | null>(null);
  const [creatingTaskColumnId, setCreatingTaskColumnId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');
  const [isDueDatePickerOpen, setIsDueDatePickerOpen] = useState(false);
  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);
  const [taskAssigneePickerId, setTaskAssigneePickerId] = useState<string | null>(null);
  const [taskAssigneeOverrides, setTaskAssigneeOverrides] = useState<
    Record<string, string | null>
  >({});
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [renamingTaskId, setRenamingTaskId] = useState<string | null>(null);
  const [duplicatingTaskId, setDuplicatingTaskId] = useState<string | null>(null);
  const [taskOrderByColumn, setTaskOrderByColumn] = useState<Record<string, string[]>>({});
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [tagDialogTaskId, setTagDialogTaskId] = useState<string | null>(null);
  const [tagDialogTaskSlug, setTagDialogTaskSlug] = useState('');
  const [tagDialogInput, setTagDialogInput] = useState('');
  const [tagDialogSelected, setTagDialogSelected] = useState<string[]>([]);
  const [isApplyingTag, setIsApplyingTag] = useState(false);
  const taskComposerRef = useRef<HTMLDivElement | null>(null);

  const isDraggingColumn = Boolean(draggedColumnId);

  const resetAddColumnForm = () => {
    setIsAddingColumn(false);
    setNewColumnName('');
  };

  const beginEditColumn = (columnId: string, currentName: string) => {
    setEditingColumnId(columnId);
    setEditingColumnName(currentName);
  };

  const cancelEditColumn = () => {
    setEditingColumnId(null);
    setEditingColumnName('');
  };

  const resetTaskComposer = () => {
    setCreatingTaskColumnId(null);
    setNewTaskTitle('');
    setNewTaskDueDate('');
    setNewTaskAssignedTo('');
    setIsDueDatePickerOpen(false);
    setIsMemberPickerOpen(false);
  };

  const openTaskComposer = (columnId: string) => {
    setCreatingTaskColumnId(columnId);
    setNewTaskTitle('');
    setNewTaskDueDate('');
    setNewTaskAssignedTo('');
    setIsDueDatePickerOpen(false);
    setIsMemberPickerOpen(false);
  };

  const handleSubmitNewColumn = async () => {
    const nextName = newColumnName.trim();
    if (!nextName || !onCreateStatus || isCreatingStatus || isMutatingStatus) return;

    const isSuccess = await onCreateStatus(nextName);
    if (isSuccess) {
      resetAddColumnForm();
    }
  };

  const handleSubmitRenameColumn = async () => {
    if (!editingColumnId || !onRenameStatus || isMutatingStatus) return;
    const nextName = editingColumnName.trim();
    if (!nextName) return;

    const isSuccess = await onRenameStatus(editingColumnId, nextName);
    if (isSuccess) {
      cancelEditColumn();
    }
  };

  const handleCreateTaskSubmit = async (statusId: string) => {
    if (!onCreateTask || isCreatingTask) return;
    const title = newTaskTitle.trim();
    if (!title) return;

    const isSuccess = await onCreateTask({
      statusId,
      title,
      dueDate: newTaskDueDate || undefined,
      assignedTo: newTaskAssignedTo || null,
    });

    if (isSuccess) {
      resetTaskComposer();
    }
  };

  const handleColumnDragStart = (event: DragEvent<HTMLDivElement>, columnId: string) => {
    if (!canCreateStatus || !onReorderStatus || isMutatingStatus) return;

    setDraggedColumnId(columnId);
    setColumnDropTargetId(columnId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', columnId);
  };

  const handleColumnDragEnd = () => {
    setDraggedColumnId(null);
    setColumnDropTargetId(null);
  };

  const handleColumnDrop = async (targetColumnId: string) => {
    if (!draggedColumnId || !onReorderStatus || draggedColumnId === targetColumnId) {
      handleColumnDragEnd();
      return;
    }

    const targetIndex = columns.findIndex((column) => column.id === targetColumnId);
    if (targetIndex < 0) {
      handleColumnDragEnd();
      return;
    }

    await onReorderStatus(draggedColumnId, targetIndex);
    handleColumnDragEnd();
  };

  const handleMoveColumn = async (columnId: string, offset: number) => {
    if (!onReorderStatus || isMutatingStatus) return;
    const currentIndex = columns.findIndex((column) => column.id === columnId);
    if (currentIndex < 0) return;
    const targetIndex = currentIndex + offset;
    if (targetIndex < 0 || targetIndex >= columns.length) return;
    await onReorderStatus(columnId, targetIndex);
  };

  const handleDeleteColumn = async (columnId: string, columnTitle: string) => {
    if (!onDeleteStatus || isMutatingStatus) return;

    const confirmed = confirmAction
      ? await confirmAction({
          title: t('kanban.confirmDeleteColumn.title'),
          description: t('kanban.confirmDeleteColumn.description', { column: columnTitle }),
          confirmText: t('common.delete'),
          cancelText: t('common.cancel'),
          destructive: true,
        })
      : true;
    if (!confirmed) return;

    await onDeleteStatus(columnId);
  };

  const selectedMemberLabel =
    memberOptions.find((member) => member.userId === newTaskAssignedTo)?.label ||
    t('kanban.labels.unassigned');

  const getInitials = (label: string) =>
    label
      .split(' ')
      .map((part) => part[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const handleAssignTaskMember = async (taskId: string, assigneeUserId?: string) => {
    if (!onAssignTask || isUpdatingTask) return;

    setTaskAssigneeOverrides((previous) => ({
      ...previous,
      [taskId]: assigneeUserId ?? null,
    }));
    setAssigningTaskId(taskId);
    const isSuccess = await onAssignTask(taskId, assigneeUserId);
    if (isSuccess) {
      setTaskAssigneePickerId(null);
    } else {
      setTaskAssigneeOverrides((previous) => {
        const next = { ...previous };
        delete next[taskId];
        return next;
      });
    }
    setAssigningTaskId(null);
  };

  const beginEditTask = (task: ProjectTask) => {
    if (!onRenameTask || isUpdatingTask) return;
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditingTaskTitle('');
    setRenamingTaskId(null);
  };

  const handleRenameTaskSubmit = async (taskId: string) => {
    if (!onRenameTask || isUpdatingTask) return;
    const nextTitle = editingTaskTitle.trim();
    if (!nextTitle) return;

    setRenamingTaskId(taskId);
    const isSuccess = await onRenameTask(taskId, nextTitle);
    if (isSuccess) {
      cancelEditTask();
      return;
    }
    setRenamingTaskId(null);
  };

  const taskById = useMemo(() => {
    const map = new Map<string, ProjectTask>();
    for (const column of columns) {
      for (const task of column.tasks) {
        map.set(task.id, task);
      }
    }
    return map;
  }, [columns]);

  useEffect(() => {
    setTaskAssigneeOverrides((previous) => {
      const next: Record<string, string | null> = {};
      let hasChanged = false;

      for (const [taskId, override] of Object.entries(previous)) {
        const currentTask = taskById.get(taskId);
        const currentAssignee = currentTask?.assigneeUserId ?? null;

        if (!currentTask || currentAssignee === override) {
          hasChanged = true;
          continue;
        }

        next[taskId] = override;
      }

      return hasChanged ? next : previous;
    });
  }, [taskById]);

  const allTagSuggestions = useMemo(() => {
    const names = [
      ...TAG_SUGGESTIONS,
      ...columns.flatMap((column) => column.tasks.flatMap((task) => task.tags)),
    ];
    return [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  }, [columns]);

  const filteredTagSuggestions = useMemo(() => {
    const keyword = tagDialogInput.trim().toLowerCase();
    if (!keyword) return allTagSuggestions;
    return allTagSuggestions.filter((name) => name.toLowerCase().includes(keyword));
  }, [allTagSuggestions, tagDialogInput]);

  const getOrderedTasks = (column: ProjectColumn) => {
    const visibleTasks = column.tasks.filter((task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    if (visibleTasks.length <= 1) return visibleTasks;

    const order = taskOrderByColumn[column.id];
    if (!order || order.length === 0) return visibleTasks;

    const indexById = new Map(order.map((taskId, index) => [taskId, index]));
    return [...visibleTasks].sort((a, b) => {
      const aIndex = indexById.get(a.id);
      const bIndex = indexById.get(b.id);
      if (aIndex == null && bIndex == null) return 0;
      if (aIndex == null) return 1;
      if (bIndex == null) return -1;
      return aIndex - bIndex;
    });
  };

  const moveTaskInColumn = (
    columnId: string,
    taskId: string,
    direction: 'top' | 'up' | 'down' | 'bottom',
  ) => {
    const column = columns.find((item) => item.id === columnId);
    if (!column) return;

    const baseOrder = taskOrderByColumn[columnId]?.length
      ? [...taskOrderByColumn[columnId]]
      : column.tasks.map((task) => task.id);
    const currentIndex = baseOrder.indexOf(taskId);
    if (currentIndex < 0) return;

    let targetIndex = currentIndex;
    if (direction === 'top') targetIndex = 0;
    if (direction === 'up') targetIndex = Math.max(0, currentIndex - 1);
    if (direction === 'down') targetIndex = Math.min(baseOrder.length - 1, currentIndex + 1);
    if (direction === 'bottom') targetIndex = baseOrder.length - 1;
    if (targetIndex === currentIndex) return;

    const [movedTaskId] = baseOrder.splice(currentIndex, 1);
    baseOrder.splice(targetIndex, 0, movedTaskId);

    setTaskOrderByColumn((previous) => ({
      ...previous,
      [columnId]: baseOrder,
    }));
  };

  const handleChangeStatusFromMenu = async (taskId: string, nextStatusId: string) => {
    if (!onChangeTaskStatus || isUpdatingTask) return;
    await onChangeTaskStatus(taskId, nextStatusId);
  };

  const openAddTagDialog = (task: ProjectTask) => {
    setTagDialogTaskId(task.id);
    setTagDialogTaskSlug(
      task.slug || `TS-${task.id.replace(/-/g, '').slice(0, 4).toUpperCase()}`,
    );
    setTagDialogInput('');
    setTagDialogSelected([...new Set(task.tags.map((name) => name.trim()).filter(Boolean))]);
    setIsTagDialogOpen(true);
  };

  const closeAddTagDialog = () => {
    if (isApplyingTag) return;
    setIsTagDialogOpen(false);
    setTagDialogTaskId(null);
    setTagDialogTaskSlug('');
    setTagDialogInput('');
    setTagDialogSelected([]);
  };

  const toggleTagSelection = (tagName: string) => {
    const normalized = tagName.trim();
    if (!normalized) return;
    setTagDialogSelected((previous) => {
      const exists = previous.some(
        (item) => item.toLowerCase() === normalized.toLowerCase(),
      );
      if (exists) {
        return previous.filter((item) => item.toLowerCase() !== normalized.toLowerCase());
      }
      return [...previous, normalized];
    });
  };

  const handleAppendTypedTag = () => {
    const next = tagDialogInput.trim();
    if (!next) return;
    const exists = tagDialogSelected.some(
      (item) => item.toLowerCase() === next.toLowerCase(),
    );
    if (!exists) {
      setTagDialogSelected((previous) => [...previous, next]);
    }
    setTagDialogInput('');
  };

  const handleApplyTags = async () => {
    if (!onAddTaskTag || !tagDialogTaskId || isApplyingTag) return;

    const task = taskById.get(tagDialogTaskId);
    if (!task) {
      closeAddTagDialog();
      return;
    }

    const existingLower = new Set(task.tags.map((name) => name.trim().toLowerCase()));
    const toCreate = tagDialogSelected.filter(
      (name) => !existingLower.has(name.trim().toLowerCase()),
    );

    if (toCreate.length === 0) {
      closeAddTagDialog();
      return;
    }

    setIsApplyingTag(true);
    let hasFailure = false;
    for (const tagName of toCreate) {
      const isSuccess = await onAddTaskTag(tagDialogTaskId, tagName);
      if (!isSuccess) {
        hasFailure = true;
      }
    }
    setIsApplyingTag(false);

    if (!hasFailure) {
      closeAddTagDialog();
    }
  };

  const handleDeleteTaskFromMenu = async (taskId: string) => {
    if (!onDeleteTask || isUpdatingTask) return;
    const task = taskById.get(taskId);
    const taskSlug =
      task?.slug || `TS-${taskId.replace(/-/g, '').slice(0, 4).toUpperCase()}`;
    const taskLabel = task ? `"${task.title}" (${taskSlug})` : `task ${taskSlug}`;
    const confirmed = confirmAction
      ? await confirmAction({
          title: 'Delete task',
          description: `Delete ${taskLabel}? This action cannot be undone.`,
          confirmText: 'Delete',
          cancelText: 'Cancel',
          destructive: true,
        })
      : true;
    if (!confirmed) return;
    await onDeleteTask(taskId);
  };

  const handleDuplicateTaskFromMenu = async (taskId: string) => {
    if (!onDuplicateTask || isUpdatingTask) return;
    setDuplicatingTaskId(taskId);
    try {
      await onDuplicateTask(taskId);
    } finally {
      setDuplicatingTaskId(null);
    }
  };

  useEffect(() => {
    if (!creatingTaskColumnId) return;

    const handlePointerDownOutside = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      if (taskComposerRef.current?.contains(target)) return;
      if (target.closest('[data-task-composer-popover="true"]')) return;

      resetTaskComposer();
    };

    document.addEventListener('pointerdown', handlePointerDownOutside);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside);
    };
  }, [creatingTaskColumnId]);

  return {
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
  };
}

