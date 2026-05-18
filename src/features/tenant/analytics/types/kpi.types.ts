// ─── Org KPI ─────────────────────────────────────────────────────────────────

export interface OrgKpiOverviewResponse {
  organizationId: string;
  totalMembers: number;
  activeMembers: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  cancelledProjects: number;
  avgProjectProgress: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalEstimatePoints: number;
  totalActualPoints: number;
  completionRate: number;
  pointCompletionRate: number;
  onTimeRate: number;
  totalTickets: number;
  pendingTickets: number;
  approvedTickets: number;
  rejectedTickets: number;
  totalApprovedOtTickets: number;
  totalOtHours: number;
}

export interface OrgKpiMembersQuery {
  userId?: string;
  sortBy?:
    | 'performanceScore'
    | 'completionRate'
    | 'onTimeRate'
    | 'totalAssigned'
    | 'projectCount'
    | 'pointCompletionRate'
    | 'totalOtHours';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface OrgMemberKpiResponse {
  userId: string;
  fullName?: string;
  email?: string;
  avatar?: string;
  projectCount: number;
  activeProjectCount: number;
  totalAssigned: number;
  completedTasks: number;
  openTasks: number;
  onTimeTasks: number;
  lateTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
  totalEstimatePoints: number;
  totalActualPoints: number;
  openPoints: number;
  pointCompletionRate: number;
  totalEstimatedHours?: number;
  expectedWorkingHours?: number;
  approvedOtTickets: number;
  totalOtHours: number;
  effectiveOtHours: number;
  completionRate: number;
  onTimeRate: number;
  overdueRate: number;
  performanceScore: number;
  totalTickets: number;
  pendingTickets: number;
  approvedTickets: number;
  rejectedTickets: number;
}

export interface OrgKpiMembersResponse {
  data: OrgMemberKpiResponse[];
  meta: { total: number; page: number; limit: number };
}

export interface OrgMemberKpiDetailByProject {
  projectId: string;
  projectName: string;
  projectStatus: string;
  totalAssigned: number;
  completedTasks: number;
  openTasks: number;
  onTimeTasks: number;
  lateTasks: number;
  overdueTasks: number;
  totalEstimatePoints: number;
  totalActualPoints: number;
  openPoints: number;
  pointCompletionRate: number;
  completionRate: number;
  onTimeRate: number;
  overdueRate: number;
  performanceScore: number;
}

export interface OrgMemberOtBreakdownItem {
  ticketId: string;
  ticketCode: string;
  date: string;
  hours: number;
  multiplier: number;
  effectiveHours: number;
}

export interface OrgMemberKpiDetailResponse {
  userId: string;
  fullName?: string;
  email?: string;
  avatar?: string;
  aggregate: OrgMemberKpiResponse;
  byProject: OrgMemberKpiDetailByProject[];
  ot: {
    approvedOtTickets: number;
    totalOtHours: number;
    effectiveOtHours: number;
    breakdown: OrgMemberOtBreakdownItem[];
  };
  tickets: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byType: {
      leave: number;
      wfh: number;
      overtime: number;
      advance: number;
      general: number;
    };
  };
}

// ─── Project KPI ──────────────────────────────────────────────────────────────

export interface ProjectKpiOverviewResponse {
  projectId: string;
  projectName: string;
  status: string;
  priority: string;
  startDate?: string;
  endDate?: string;
  daysRemaining?: number;
  progress: number;
  isPointComplete: boolean;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
  projectTotalEstimatePoints: number;
  projectTotalActualPoints: number;
  projectOpenPoints: number;
  pointBasedProgress: number;
  totalEstimatedHours?: number;
  completedEstimatedHours?: number;
  completionRate: number;
  pointCompletionRate: number;
  onTimeRate: number;
  overdueRate: number;
  totalMembers: number;
  activeMembers: number;
}

export interface ProjectKpiMembersQuery {
  userId?: string;
  sortBy?:
    | 'performanceScore'
    | 'completionRate'
    | 'onTimeRate'
    | 'totalAssigned'
    | 'pointCompletionRate';
  sortOrder?: 'ASC' | 'DESC';
  dateFrom?: string;
  dateTo?: string;
}

export interface ProjectKpiSelfQuery {
  dateFrom?: string;
  dateTo?: string;
}

// ─── KPI Targets ───────────────────────────────────────────────────────────

export type KpiTargetPeriod = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type KpiTargetStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type KpiTargetScopeType = 'USER' | 'ROLE' | 'PROJECT_ROLE';

export interface KpiTargetSnapshotResponse {
  actualScore?: number;
  actualOnTimeRate?: number;
  actualPointCompletionRate?: number;
  actualOtHours?: number;
  actualCompletedTasks?: number;
  actualOverdueTasks?: number;
  actualPayload?: Record<string, unknown>;
  archivedAt: string;
}

export interface KpiTargetResolvedFromResponse {
  targetId: string;
  scopeType: KpiTargetScopeType;
  projectId?: string | null;
  userId?: string | null;
  roleId?: string | null;
}

export interface KpiTargetResponse {
  id: string;
  organizationId: string;
  projectId?: string | null;
  scopeType: KpiTargetScopeType;
  userId?: string | null;
  roleId?: string | null;
  period: KpiTargetPeriod;
  periodStart: string;
  periodEnd: string;
  targetScore?: number | null;
  targetPointCompletionRate?: number | null;
  targetOnTimeRate?: number | null;
  targetOtHours?: number | null;
  targetCompletedTasks?: number | null;
  maxOverdueTasks?: number | null;
  requireZeroOverdue: boolean;
  status: KpiTargetStatus;
  note?: string | null;
  assignedBy?: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
  snapshot?: KpiTargetSnapshotResponse;
  resolvedFrom?: KpiTargetResolvedFromResponse;
  createdAt: string;
  updatedAt: string;
}

export interface KpiTargetApiResponse<T> {
  statusCode: number;
  message?: string;
  data?: T;
  warnings?: string[];
}

export interface UpsertKpiTargetBody {
  scopeType: KpiTargetScopeType;
  userIds?: string[];
  roleIds?: string[];
  projectId?: string;
  period: KpiTargetPeriod;
  periodStart: string;
  periodEnd: string;
  targetScore?: number | null;
  targetPointCompletionRate?: number | null;
  targetOnTimeRate?: number | null;
  targetOtHours?: number | null;
  targetCompletedTasks?: number | null;
  maxOverdueTasks?: number | null;
  requireZeroOverdue?: boolean;
  status?: KpiTargetStatus;
  note?: string;
}

export interface CloneKpiTargetBody {
  fromPeriodStart: string;
  toPeriodStart: string;
  userIds?: string[];
  projectId?: string;
}

export interface KpiTargetListQuery {
  userId?: string;
  roleId?: string;
  projectId?: string;
  scopeType?: KpiTargetScopeType;
  period?: KpiTargetPeriod;
  status?: KpiTargetStatus;
  activeOn?: string;
}

export type UpdateKpiTargetBody = Partial<
  Pick<
    UpsertKpiTargetBody,
    | 'targetScore'
    | 'targetPointCompletionRate'
    | 'targetOnTimeRate'
    | 'targetOtHours'
    | 'targetCompletedTasks'
    | 'maxOverdueTasks'
    | 'requireZeroOverdue'
    | 'status'
    | 'note'
  >
>;

export interface ProjectMemberKpiTargetSummary {
  id: string;
  period: KpiTargetPeriod | string;
  periodStart: string;
  periodEnd: string;
  targetScore?: number;
  targetPointCompletionRate?: number;
  targetOnTimeRate?: number;
  targetOtHours?: number;
  targetCompletedTasks?: number;
  maxOverdueTasks?: number;
  requireZeroOverdue: boolean;
}

export interface KpiAchievement {
  score?: number;
  onTimeRate?: number;
  pointCompletionRate?: number;
  otHours?: number;
  completedTasks?: number;
  overdueTasks?: number;
}

export interface KpiAchievementAdjustment {
  completedTasksFactor?: number;
  adjustedByCompletedTasksTarget?: boolean;
}

export interface ProjectMemberKpiResponse {
  userId: string;
  fullName?: string;
  email?: string;
  avatar?: string;
  totalAssigned: number;
  completedTasks: number;
  openTasks: number;
  onTimeTasks: number;
  lateTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
  totalEstimatePoints: number;
  totalActualPoints: number;
  openPoints: number;
  pointCompletionRate: number;
  totalEstimatedHours?: number;
  completedEstimatedHours?: number;
  allocatedHoursPerDay?: number;
  expectedWorkingHours?: number;
  approvedOtTickets: number;
  totalOtHours: number;
  effectiveOtHours: number;
  completionRate: number;
  onTimeRate: number;
  overdueRate: number;
  performanceScore: number;
  target?: ProjectMemberKpiTargetSummary;
  achievement?: KpiAchievement;
  achievementAdjustment?: KpiAchievementAdjustment;
  achievementRate?: number;
}

export type DueState = 'no_due_date' | 'on_time' | 'late' | 'overdue' | 'upcoming';

export interface RecentTask {
  taskId: string;
  title: string;
  slug?: string;
  statusName: string;
  priority: string;
  estimatedPoint?: number;
  estimatedHours?: number;
  dueDate?: string;
  dueState: DueState;
  completedAt?: string;
}

export interface ProjectMemberKpiDetailResponse extends ProjectMemberKpiResponse {
  tasksByPriority: { urgent: number; high: number; medium: number; low: number };
  pointsByPriority: { urgent: number; high: number; medium: number; low: number };
  recentTasks: RecentTask[];
}
