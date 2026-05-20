export type ProjectStatus =
  | 'planning'
  | 'active'
  | 'on_hold'
  | 'completed'
  | 'cancelled';

export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';
export type BudgetCurrency = 'USD' | 'VND';

// Legacy alias kept for backward compatibility with old payloads.
export type ProjectMemberRole = string;
export type ProjectInviteRole = 'pm' | 'member';
export type ProjectInviteStatus = 'pending' | 'accepted' | 'rejected' | 'canceled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ProjectResponse {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  slug?: string | null;
  // Legacy fields kept for backward compat; removed from BE entity.
  code?: string | null;
  projectKey?: string | null;
  status: ProjectStatus;
  priority?: ProjectPriority | null;
  startDate?: string | null;
  endDate?: string | null;
  managerId?: string[] | null;
  estimatedBudget?: number | null;
  actualBudget?: number | null;
  budgetCurrency: BudgetCurrency;
  progress?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  code?: string;
  projectKey?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: string;
  endDate?: string;
  managerId?: string[];
  estimatedBudget?: number;
  actualBudget?: number;
  budgetCurrency?: BudgetCurrency;
  progress?: number;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  code?: string;
  projectKey?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: string;
  endDate?: string;
  managerId?: string[];
  estimatedBudget?: number;
  actualBudget?: number;
  budgetCurrency?: BudgetCurrency;
  progress?: number;
}

export interface ProjectListQuery {
  page?: number;
  limit?: number;
}

export interface ProjectInviteResponse {
  id: string;
  projectId: string;
  inviteeUserId: string;
  invitedByUserId?: string | null;
  role?: ProjectInviteRole | null;
  status: ProjectInviteStatus;
  createdAt?: string;
  updatedAt?: string;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  canceledAt?: string | null;
}

export interface ProjectInviteMeQuery {
  status?: ProjectInviteStatus;
}

export interface AcceptProjectInviteTokenRequest {
  token: string;
}

export interface CreateProjectInviteRequest {
  inviteeUserId?: string;
  inviteeUserIds?: string[];
}

export interface ProjectMemberResponse {
  id: string;
  projectId: string;
  userId: string;
  roleId?: string | null;
  roleName?: string | null;
  roleIds?: string[];
  roleNames?: string[];
  roles?: ProjectMemberRoleResponse[];
  // Legacy field returned by old backends.
  role?: ProjectMemberRole | null;
  joinedAt?: string | null;
  allocatedHoursPerDay?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectMemberListQuery {
  page?: number;
  limit?: number;
}

export interface InviteProjectMemberRequest {
  inviteeUserId?: string;
  inviteeUserIds?: string[];
}

export interface UpdateProjectMemberRoleRequest {
  roleId?: string;
  allocatedHoursPerDay?: number | null;
}

export interface StatusTaskResponse {
  id: string;
  projectId: string;
  name: string;
  orderIndex: number;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectStatusListQuery {
  page?: number;
  limit?: number;
}

export interface CreateProjectStatusRequest {
  name: string;
  orderIndex?: number;
}

export interface UpdateProjectStatusRequest {
  name?: string;
  orderIndex?: number;
  isDefault?: boolean;
}

export interface DeleteProjectStatusRequest {
  moveToStatusId?: string;
}

export interface TaskResponse {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  slug?: string | null;
  priority?: TaskPriority | null;
  statusId: string;
  status?: string | null;
  parentTaskId?: string | null;
  assignedTo?: string | null;
  startedAt?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  actualLoggedMinutes?: number | null;
  estimatedPoint?: number | null;
  estimatedHours?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectTaskListQuery {
  page?: number;
  limit?: number;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  statusId: string;
  parentTaskId?: string;
  assignedTo?: string | null;
  startedAt?: string;
  dueDate?: string;
  completedAt?: string;
  actualStart?: string;
  actualEnd?: string;
  estimatedPoint?: number;
  estimatedHours?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  statusId?: string;
  parentTaskId?: string | null;
  assignedTo?: string | null;
  startedAt?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  estimatedPoint?: number | null;
  estimatedHours?: number | null;
}

export interface DuplicateTaskRequest {
  assigneeUserId?: string;
  keepParentTask?: boolean;
  parentTaskId?: string;
  copyTags?: boolean;
  copyAttachments?: boolean;
}

export interface UpdateTaskStatusRequest {
  statusId: string;
}

export interface TaskWorklogResponse {
  id: string;
  projectId: string;
  organizationId: string;
  taskId: string;
  taskTitle: string;
  taskSlug?: string | null;
  userId: string;
  userDisplayName?: string | null;
  userEmail?: string | null;
  workDate: string;
  startedAt?: string | null;
  endedAt?: string | null;
  durationMinutes: number;
  description?: string | null;
  progressPercent?: number | null;
  isBlocker?: boolean | null;
  source?: string | null;
  reportedDailyReportId?: string | null;
  isSubmitted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskWorklogListQuery {
  workDate?: string;
  userId?: string;
}

export interface CreateTaskWorklogRequest {
  userId?: string;
  workDate: string;
  startedAt?: string;
  endedAt?: string;
  durationMinutes?: number;
  description?: string | null;
  progressPercent?: number | null;
  isBlocker?: boolean;
}

export interface UpdateTaskWorklogRequest {
  userId?: string;
  workDate?: string;
  startedAt?: string | null;
  endedAt?: string | null;
  durationMinutes?: number | null;
  description?: string | null;
  progressPercent?: number | null;
  isBlocker?: boolean;
}

export interface TaskHistoryResponse {
  id: string;
  taskId: string;
  action: string;
  actorId?: string | null;
  actorDisplayName?: string | null;
  fromValue?: string | null;
  toValue?: string | null;
  // Legacy aliases kept for backward compat with old payloads.
  actorUserId?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt?: string;
}

export interface TaskTagResponse {
  id: string;
  taskId: string;
  name: string;
  createdAt?: string;
}

export interface AddTaskTagRequest {
  name: string;
}

export interface TaskAttachmentResponse {
  id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  attachmentType?: 'local_file' | 'web_link' | null;
  accessUrl?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  uploadedBy?: string | null;
  createdAt?: string;
}

export interface AddTaskAttachmentRequest {
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  fileSize?: number;
}

export interface TaskCommentResponse {
  id: string;
  taskId: string;
  content: string;
  parentCommentId?: string | null;
  mentionUserIds?: string[] | null;
  reactions?: TaskCommentReactionSummary[] | null;
  thumbsUpCount?: number;
  hasThumbsUpByMe?: boolean;
  // authorId is the canonical BE field; authorUserId kept for backward compat.
  authorId?: string | null;
  authorUserId?: string | null;
  createdAt?: string;
}

export interface CreateTaskCommentRequest {
  content: string;
  parentCommentId?: string;
  mentionUserIds?: string[];
}

export interface UpdateTaskCommentRequest {
  content: string;
  mentionUserIds?: string[];
}

export interface TaskCommentReactionSummary {
  reaction: string;
  count: number;
  reactedByMe: boolean;
}

export interface AddCommentReactionRequest {
  reaction: string;
}

export interface ProjectMemberRoleResponse {
  id: string;
  roleId: string;
  roleName: string;
  roleDescription?: string | null;
  scopeType?: string;
  scopeId?: string;
  assignedAt?: string;
}

export interface ProjectRoleResponse {
  id: string;
  name: string;
  description?: string | null;
  permissionCodes?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectRoleDetailResponse extends ProjectRoleResponse {
  permissions?: string[];
}

export interface ProjectAvailablePermissionResponse {
  code: string;
  name: string;
  module: string;
}

export interface CreateProjectRoleRequest {
  name: string;
  description?: string;
  permissionCodes?: string[];
}

export interface UpdateProjectRoleRequest {
  name?: string;
  description?: string;
  permissionCodes?: string[];
}

export interface AssignPermissionsToProjectRoleRequest {
  roleId: string;
  permissionCodes: string[];
}

export interface RevokePermissionsFromProjectRoleRequest {
  roleId: string;
  permissionCodes: string[];
}

export interface AssignRoleToProjectMemberRequest {
  userId: string;
  roleId: string;
}

export interface RevokeRoleFromProjectMemberRequest {
  userId: string;
  roleId: string;
}

