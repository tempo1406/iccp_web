export interface DashboardCards {
  completedLast7Days: number;
  updatedLast7Days: number;
  createdLast7Days: number;
  dueSoonCount: number;
}

export interface TaskByStatus {
  statusId: string;
  statusName: string;
  orderIndex: number;
  count: number;
}

export interface ActiveTask {
  id: string;
  title: string;
  slug?: string;
  priority: string;
  statusId?: string;
  statusName?: string;
  assignedTo?: string;
  assigneeName?: string;
  dueDate?: string;
  dueState: string;
  updatedAt: string;
}

export interface TaskByPriority {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  count: number;
}

export interface TaskByType {
  type: 'task' | 'subtask';
  count: number;
}

export interface WorkloadMemberStatus {
  statusId: string;
  statusName: string;
  count: number;
}

export interface WorkloadMember {
  userId: string;
  fullName?: string;
  email?: string;
  avatar?: string;
  totalTasks: number;
  tasksByStatus: WorkloadMemberStatus[];
}

export interface Workload {
  unassignedCount: number;
  members: WorkloadMember[];
}

export interface MemberRoleStat {
  roleId: string;
  roleName: string;
  count: number;
}

export interface MemberStats {
  total: number;
  byRole: MemberRoleStat[];
}

export interface ProjectDashboardResponse {
  cards: DashboardCards;
  tasksByStatus: TaskByStatus[];
  activeTasks: ActiveTask[];
  tasksByPriority: TaskByPriority[];
  tasksByType: TaskByType[];
  workload: Workload;
  memberStats: MemberStats;
}

export interface ProjectDashboardQuery {
  dateFrom?: string;
  dateTo?: string;
}
