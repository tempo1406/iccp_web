import { ProjectsService as CoreProjectsService } from '@/services/projects';
import type {
  AcceptProjectInviteTokenRequest,
  AddCommentReactionRequest,
  AddTaskAttachmentRequest,
  AddTaskTagRequest,
  AssignPermissionsToProjectRoleRequest,
  AssignRoleToProjectMemberRequest,
  CreateProjectInviteRequest,
  CreateProjectRequest,
  CreateProjectRoleRequest,
  CreateProjectStatusRequest,
  CreateTaskCommentRequest,
  CreateTaskRequest,
  DeleteProjectStatusRequest,
  DuplicateTaskRequest,
  InviteProjectMemberRequest,
  ProjectAvailablePermissionResponse,
  ProjectInviteMeQuery,
  ProjectInviteResponse,
  ProjectInviteRole,
  ProjectInviteStatus,
  ProjectListQuery,
  ProjectMemberListQuery,
  ProjectMemberResponse,
  ProjectMemberRole,
  ProjectMemberRoleResponse,
  ProjectPriority,
  ProjectResponse,
  ProjectRoleDetailResponse,
  ProjectRoleResponse,
  ProjectStatus,
  ProjectStatusListQuery,
  RevokePermissionsFromProjectRoleRequest,
  RevokeRoleFromProjectMemberRequest,
  StatusTaskResponse,
  TaskWorklogListQuery,
  TaskWorklogResponse,
  TaskAttachmentResponse,
  TaskCommentReactionSummary,
  TaskCommentResponse,
  TaskHistoryResponse,
  TaskPriority,
  TaskResponse as CoreTaskResponse,
  TaskTagResponse,
  CreateTaskWorklogRequest,
  UpdateProjectMemberRoleRequest,
  UpdateProjectRequest,
  UpdateProjectRoleRequest,
  UpdateProjectStatusRequest,
  UpdateTaskCommentRequest,
  UpdateTaskRequest as CoreUpdateTaskRequest,
  UpdateTaskWorklogRequest,
  UpdateTaskStatusRequest,
  ProjectTaskListQuery as CoreProjectTaskListQuery,
} from '@/services/projects';

export type {
  AcceptProjectInviteTokenRequest,
  AddCommentReactionRequest,
  AddTaskAttachmentRequest,
  AddTaskTagRequest,
  AssignPermissionsToProjectRoleRequest,
  AssignRoleToProjectMemberRequest,
  CreateProjectInviteRequest,
  CreateProjectRequest,
  CreateProjectRoleRequest,
  CreateProjectStatusRequest,
  CreateTaskCommentRequest,
  CreateTaskRequest,
  DeleteProjectStatusRequest,
  DuplicateTaskRequest,
  InviteProjectMemberRequest,
  ProjectAvailablePermissionResponse,
  ProjectInviteMeQuery,
  ProjectInviteResponse,
  ProjectInviteRole,
  ProjectInviteStatus,
  ProjectListQuery,
  ProjectMemberListQuery,
  ProjectMemberResponse,
  ProjectMemberRole,
  ProjectMemberRoleResponse,
  ProjectPriority,
  ProjectResponse,
  ProjectRoleDetailResponse,
  ProjectRoleResponse,
  ProjectStatus,
  ProjectStatusListQuery,
  RevokePermissionsFromProjectRoleRequest,
  RevokeRoleFromProjectMemberRequest,
  StatusTaskResponse,
  TaskWorklogListQuery,
  TaskWorklogResponse,
  TaskAttachmentResponse,
  TaskCommentReactionSummary,
  TaskCommentResponse,
  TaskHistoryResponse,
  TaskPriority,
  TaskTagResponse,
  CreateTaskWorklogRequest,
  UpdateProjectMemberRoleRequest,
  UpdateProjectRequest,
  UpdateProjectRoleRequest,
  UpdateProjectStatusRequest,
  UpdateTaskCommentRequest,
  UpdateTaskWorklogRequest,
  UpdateTaskStatusRequest,
};

export type TaskDueState =
  | 'no_due_date'
  | 'on_track'
  | 'due_soon'
  | 'overdue'
  | 'done_on_time'
  | 'done_late';

export interface ProjectTaskListQuery extends CoreProjectTaskListQuery {
  assigneeId?: string;
  dueState?: TaskDueState;
}

export interface TaskResponse extends CoreTaskResponse {
  dueState?: TaskDueState | null;
  startedAt?: string | null;
  completedAt?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  actualLoggedMinutes?: number | null;
}

export interface MemberTaskProgressQuery {
  targetUserId?: string;
}

export interface MemberTaskProgressResponse {
  userId: string;
  fullName: string;
  email?: string | null;
  avatar?: string | null;
  roleId?: string | null;
  roleName?: string | null;
  roleIds?: string[];
  roleNames?: string[];
  totalAssignedTasks: number;
  doneTasks: number;
  openTasks: number;
  doneOnTimeTasks: number;
  doneLateTasks: number;
  overdueOpenTasks: number;
  dueSoonTasks: number;
  completionRate: number;
  onTimeRate: number;
  progressScore: number;
}

export interface UpdateTaskRequest extends CoreUpdateTaskRequest {
  startedAt?: string | null;
  completedAt?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
}

function toQueryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export class ProjectsService extends CoreProjectsService {
  listTasks(projectId: string, params: ProjectTaskListQuery = {}): Promise<TaskResponse[]> {
    const qs = toQueryString({
      page: params.page,
      limit: params.limit,
      assigneeId: params.assigneeId,
      dueState: params.dueState,
    });
    return this.get<TaskResponse[]>(`/v1/projects/${projectId}/tasks${qs}`);
  }

  listTaskMemberProgress(
    projectId: string,
    params: MemberTaskProgressQuery = {},
  ): Promise<MemberTaskProgressResponse[]> {
    const qs = toQueryString({ targetUserId: params.targetUserId });
    return this.get<MemberTaskProgressResponse[]>(
      `/v1/projects/${projectId}/tasks/member-progress${qs}`,
    );
  }

  updateTask(
    projectId: string,
    taskId: string,
    body: UpdateTaskRequest,
  ): Promise<TaskResponse> {
    return this.put<TaskResponse, UpdateTaskRequest>(
      `/v1/projects/${projectId}/tasks/${taskId}`,
      body,
    );
  }

  getProjectDashboard(
    projectId: string,
    params: { dateFrom?: string; dateTo?: string } = {},
  ): Promise<import('../types/project-dashboard.types').ProjectDashboardResponse> {
    const qs = toQueryString({ dateFrom: params.dateFrom, dateTo: params.dateTo });
    return this.get(`/v1/projects/${projectId}/dashboard${qs}`);
  }
}
