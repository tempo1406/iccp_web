export interface ProjectTask {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueState?: 'no_due_date' | 'on_track' | 'due_soon' | 'overdue' | 'done_on_time' | 'done_late';
  assigneeUserId?: string;
  subtaskCount?: number;
  assignees: { name: string; avatar?: string }[];
  dueDate?: string;
  comments: number;
  attachments: number;
  tags: string[];
  status: string;
}

export interface ProjectColumn {
  id: string;
  title: string;
  color: string;
  tasks: ProjectTask[];
}

export interface ProjectTeamProgressTask {
  id: string;
  title: string;
  assignedTo?: string;
  statusId: string;
  statusName: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  dueState?: 'no_due_date' | 'on_track' | 'due_soon' | 'overdue' | 'done_on_time' | 'done_late';
}

export interface ProjectTeamProgressMember {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role: string;
  roles?: string[];
  tasksCompleted: number;
  tasksTotal: number;
  tasksInProgress: number;
  lastActive: string;
  doneOnTimeTasks?: number;
  doneLateTasks?: number;
  overdueOpenTasks?: number;
  dueSoonTasks?: number;
  completionRate?: number;
  onTimeRate?: number;
  progressScore?: number;
  tasks?: ProjectTeamProgressTask[];
}

export const projectPriorityColors: Record<string, string> = {
  low: 'bg-gray-500/10 text-gray-500',
  medium: 'bg-primary/10 text-primary',
  high: 'bg-amber-500/10 text-amber-500',
  urgent: 'bg-red-500/10 text-red-500',
};

export const projectTaskStatusColors: Record<string, string> = {
  todo: 'bg-gray-500',
  'in-progress': 'bg-primary',
  review: 'bg-amber-500',
  done: 'bg-emerald-500',
};
