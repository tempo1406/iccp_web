import type { TaskResponse } from '../services/projects.service';

export interface StatusOption {
  id: string;
  name: string;
}

export interface MemberOption {
  userId: string;
  label: string;
  subtitle?: string;
  avatarUrl?: string;
}

export interface ProjectTaskDetailFormState {
  title: string;
  description: string;
  statusId: string;
  priority: string;
  assignedTo: string;
  startedAt: string;
  dueDate: string;
  actualStart: string;
  actualEnd: string;
  estimatedPoint: string;
  estimatedHours: string;
}

export type ProjectTaskDetailActivityTab = 'all' | 'comments' | 'history';

export type TaskAttachmentAddMode = 'none' | 'local_file' | 'web_link';

export interface ProjectTaskDetailDialogProps {
  open: boolean;
  projectId: string;
  task: TaskResponse | null;
  projectTasks: TaskResponse[];
  statuses: StatusOption[];
  members: MemberOption[];
  userDisplayNameById?: Map<string, string>;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenTask?: (taskId: string) => void;
  onSubmit: (input: {
    taskId: string;
    title: string;
    description: string;
    statusId: string;
    priority: string;
    assignedTo: string | null;
    startedAt: string;
    dueDate: string;
    actualStart: string;
    actualEnd: string;
    estimatedPoint: string;
    estimatedHours: string;
  }) => Promise<boolean>;
}
