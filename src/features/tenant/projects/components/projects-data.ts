export interface ProjectTeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  tasksCompleted: number;
  tasksTotal: number;
}

export interface ProjectItem {
  id: string;
  slug?: string;
  name: string;
  description: string;
  status: 'active' | 'on-hold' | 'completed' | 'planning';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  startDate: string;
  dueDate: string;
  team: ProjectTeamMember[];
  tasksCompleted: number;
  tasksTotal: number;
  tags: string[];
}

export const projectStatusConfig = {
  active: {
    label: 'Active',
    color: 'bg-primary/10 text-primary',
  },
  'on-hold': {
    label: 'On Hold',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  completed: {
    label: 'Completed',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  planning: {
    label: 'Planning',
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
} as const;

export const projectPriorityConfig = {
  low: { label: 'Low', color: 'text-gray-500' },
  medium: { label: 'Medium', color: 'text-primary' },
  high: { label: 'High', color: 'text-amber-500' },
  critical: { label: 'Critical', color: 'text-red-500' },
} as const;
