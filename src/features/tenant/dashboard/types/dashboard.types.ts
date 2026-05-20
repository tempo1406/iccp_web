export type TenantDashboardRoleVariant = 'org_admin' | 'member';
export type TenantDashboardMemberRange = 'today' | 'last_week' | 'last_month';

export type TenantDashboardPriorityTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger';

export type TenantDashboardProjectStatus =
  | 'planning'
  | 'active'
  | 'on_hold'
  | 'completed'
  | 'cancelled';

export type TenantDashboardTicketStatus =
  | 'pending_approval'
  | 'pending_submission'
  | 'changes_requested'
  | 'approved'
  | 'rejected'
  | 'canceled';

export type TenantDashboardTicketType =
  | 'leave'
  | 'wfh'
  | 'overtime'
  | 'advance'
  | 'general';

export type TenantDashboardTaskDueState =
  | 'no_due_date'
  | 'on_track'
  | 'due_soon'
  | 'overdue'
  | 'done_on_time'
  | 'done_late';

export type TenantDashboardKpiPeriod = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface TenantDashboardViewer {
  userId: string;
  displayName: string;
  organizationId: string;
  roleVariant: TenantDashboardRoleVariant;
}

export interface TenantDashboardHero {
  greetingName: string;
  organizationName: string;
  unreadNotifications: number;
  unreadChat: number;
  pendingActions: number;
}

export interface TenantDashboardOrgKpiSnapshot {
  totalMembers: number;
  activeMembers: number;
  activeProjects: number;
  completionRate: number;
  pendingTickets: number;
  totalOtHours: number;
}

export interface TenantDashboardInvitationSummary {
  pending: number;
  needsAttention: number;
  acceptanceRate: number;
}

export interface TenantDashboardDocumentHealth {
  total: number;
  indexed: number;
  processing: number;
  failed: number;
}

export interface TenantDashboardApprovalQueue {
  pendingTickets: number;
  processingDocuments: number;
  failedDocuments: number;
}

export interface TenantDashboardProjectPortfolio {
  total: number;
  active: number;
  completed: number;
  onHold: number;
}

export interface TenantDashboardProjectBudgetSummary {
  currency: 'USD' | 'VND';
  estimatedTotal: number;
  actualTotal: number;
  variance: number;
}

export interface TenantDashboardAdminOverview {
  orgKpi?: TenantDashboardOrgKpiSnapshot;
  invitations?: TenantDashboardInvitationSummary;
  documents?: TenantDashboardDocumentHealth;
  approvals?: TenantDashboardApprovalQueue;
  projects?: TenantDashboardProjectPortfolio;
  budgets?: TenantDashboardProjectBudgetSummary[];
}

export interface TenantDashboardAssignedWorkSummary {
  assignedTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
  activeProjects: number;
}

export interface TenantDashboardMyTicketsSummary {
  myOpen: number;
  pendingApproval: number;
  changesRequested: number;
  pendingSubmission: number;
}

export interface TenantDashboardMyKpiSummary {
  activeTargets: number;
  currentPeriod?: TenantDashboardKpiPeriod;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  metricsTracked: number;
}

export interface TenantDashboardMyProjectsSummary {
  total: number;
  active: number;
  completed: number;
}

export interface TenantDashboardMemberOverview {
  assignedWork: TenantDashboardAssignedWorkSummary;
  tickets: TenantDashboardMyTicketsSummary;
  myKpi?: TenantDashboardMyKpiSummary;
  projects: TenantDashboardMyProjectsSummary;
}

export interface TenantDashboardPriorityAction {
  code: string;
  tone: TenantDashboardPriorityTone;
  count: number;
  href: string;
}

export interface TenantDashboardNotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
  href: string;
}

export interface TenantDashboardProjectFocusItem {
  id: string;
  name: string;
  slug: string;
  status: TenantDashboardProjectStatus;
  progress: number;
  href: string;
}

export interface TenantDashboardTicketFocusItem {
  id: string;
  code: string;
  title: string;
  status: TenantDashboardTicketStatus;
  type: TenantDashboardTicketType;
  updatedAt: string;
  href: string;
}

export interface TenantDashboardTaskFocusItem {
  id: string;
  title: string;
  projectName: string;
  projectSlug: string;
  dueDate?: string;
  dueState: TenantDashboardTaskDueState;
  priority: string;
  href: string;
}

export interface TenantDashboardQuickLink {
  key: string;
  href: string;
}

export interface TenantDashboardLists {
  priorityActions: TenantDashboardPriorityAction[];
  recentNotifications: TenantDashboardNotificationItem[];
  projectFocus: TenantDashboardProjectFocusItem[];
  ticketFocus: TenantDashboardTicketFocusItem[];
  taskFocus: TenantDashboardTaskFocusItem[];
}

export interface TenantDashboardResponse {
  viewer: TenantDashboardViewer;
  hero: TenantDashboardHero;
  adminOverview?: TenantDashboardAdminOverview;
  memberOverview?: TenantDashboardMemberOverview;
  lists: TenantDashboardLists;
  quickLinks: TenantDashboardQuickLink[];
}

export interface TenantDashboardOverviewQuery {
  adminYear: number;
  adminQuarter: number;
  memberRange: TenantDashboardMemberRange;
}
