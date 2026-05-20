import { BaseService } from '@/services/base-service';
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
  ProjectListQuery,
  ProjectMemberListQuery,
  ProjectMemberResponse,
  ProjectMemberRoleResponse,
  ProjectResponse,
  ProjectRoleDetailResponse,
  ProjectRoleResponse,
  ProjectStatusListQuery,
  ProjectTaskListQuery,
  RevokePermissionsFromProjectRoleRequest,
  RevokeRoleFromProjectMemberRequest,
  StatusTaskResponse,
  TaskWorklogListQuery,
  TaskWorklogResponse,
  TaskAttachmentResponse,
  TaskCommentResponse,
  TaskHistoryResponse,
  TaskResponse,
  TaskTagResponse,
  CreateTaskWorklogRequest,
  UpdateProjectMemberRoleRequest,
  UpdateProjectRequest,
  UpdateProjectRoleRequest,
  UpdateProjectStatusRequest,
  UpdateTaskCommentRequest,
  UpdateTaskRequest,
  UpdateTaskWorklogRequest,
  UpdateTaskStatusRequest,
} from './types/project.types';

function toQueryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs.length > 0 ? `?${qs}` : '';
}

export class ProjectsService extends BaseService {
  private readonly base = '/v1/projects';
  private readonly inviteBase = '/v1/project-invites';

  // Core project APIs
  createProject(body: CreateProjectRequest): Promise<ProjectResponse> {
    return this.post<ProjectResponse, CreateProjectRequest>(this.base, body);
  }

  listProjects(params: ProjectListQuery = {}): Promise<ProjectResponse[]> {
    const qs = toQueryString({
      page: params.page,
      limit: params.limit,
    });
    return this.get<ProjectResponse[]>(`${this.base}${qs}`);
  }

  getProjectById(projectId: string): Promise<ProjectResponse> {
    return this.get<ProjectResponse>(`${this.base}/${projectId}`);
  }

  updateProject(projectId: string, body: UpdateProjectRequest): Promise<ProjectResponse> {
    return this.put<ProjectResponse, UpdateProjectRequest>(
      `${this.base}/${projectId}`,
      body,
    );
  }

  deleteProject(projectId: string): Promise<void> {
    return this.delete<void>(`${this.base}/${projectId}`);
  }

  inviteProjectPm(
    projectId: string,
    body: CreateProjectInviteRequest,
  ): Promise<ProjectInviteResponse> {
    return this.post<ProjectInviteResponse, CreateProjectInviteRequest>(
      `${this.base}/${projectId}/invites`,
      body,
    );
  }

  listMyProjectInvites(params: ProjectInviteMeQuery = {}): Promise<ProjectInviteResponse[]> {
    const qs = toQueryString({ status: params.status });
    return this.get<ProjectInviteResponse[]>(`${this.inviteBase}/me${qs}`);
  }

  acceptProjectInvite(body: AcceptProjectInviteTokenRequest): Promise<void> {
    return this.post<void, AcceptProjectInviteTokenRequest>(`${this.inviteBase}/accept`, body);
  }

  rejectProjectInvite(inviteId: string): Promise<void> {
    return this.post<void>(`${this.inviteBase}/${inviteId}/reject`);
  }

  cancelProjectInvite(inviteId: string): Promise<void> {
    return this.post<void>(`${this.inviteBase}/${inviteId}/cancel`);
  }

  // Project member APIs
  listProjectMembers(
    projectId: string,
    params: ProjectMemberListQuery = {},
  ): Promise<ProjectMemberResponse[]> {
    const qs = toQueryString({
      page: params.page,
      limit: params.limit,
    });
    return this.get<ProjectMemberResponse[]>(`${this.base}/${projectId}/members${qs}`);
  }

  inviteProjectMember(
    projectId: string,
    body: InviteProjectMemberRequest,
  ): Promise<ProjectInviteResponse> {
    return this.post<ProjectInviteResponse, InviteProjectMemberRequest>(
      `${this.base}/${projectId}/members/invites`,
      body,
    );
  }

  updateProjectMemberRole(
    projectId: string,
    memberId: string,
    body: UpdateProjectMemberRoleRequest,
  ): Promise<ProjectMemberResponse> {
    return this.patch<ProjectMemberResponse, UpdateProjectMemberRoleRequest>(
      `${this.base}/${projectId}/members/${memberId}`,
      body,
    );
  }

  removeProjectMember(projectId: string, memberId: string): Promise<void> {
    return this.delete<void>(`${this.base}/${projectId}/members/${memberId}`);
  }

  // Status task APIs
  listProjectStatuses(
    projectId: string,
    params: ProjectStatusListQuery = {},
  ): Promise<StatusTaskResponse[]> {
    const qs = toQueryString({
      page: params.page,
      limit: params.limit,
    });
    return this.get<StatusTaskResponse[]>(`${this.base}/${projectId}/statuses${qs}`);
  }

  createProjectStatus(
    projectId: string,
    body: CreateProjectStatusRequest,
  ): Promise<StatusTaskResponse> {
    return this.post<StatusTaskResponse, CreateProjectStatusRequest>(
      `${this.base}/${projectId}/statuses`,
      body,
    );
  }

  updateProjectStatus(
    projectId: string,
    statusId: string,
    body: UpdateProjectStatusRequest,
  ): Promise<StatusTaskResponse> {
    return this.patch<StatusTaskResponse, UpdateProjectStatusRequest>(
      `${this.base}/${projectId}/statuses/${statusId}`,
      body,
    );
  }

  deleteProjectStatus(
    projectId: string,
    statusId: string,
    body?: DeleteProjectStatusRequest,
  ): Promise<void> {
    return this.call<void, DeleteProjectStatusRequest>(
      `${this.base}/${projectId}/statuses/${statusId}`,
      {
        method: 'DELETE',
        body,
      },
    );
  }

  // Task management APIs
  createTask(projectId: string, body: CreateTaskRequest): Promise<TaskResponse> {
    return this.post<TaskResponse, CreateTaskRequest>(
      `${this.base}/${projectId}/tasks`,
      body,
    );
  }

  listTasks(projectId: string, params: ProjectTaskListQuery = {}): Promise<TaskResponse[]> {
    const qs = toQueryString({
      page: params.page,
      limit: params.limit,
    });
    return this.get<TaskResponse[]>(`${this.base}/${projectId}/tasks${qs}`);
  }

  getTaskById(projectId: string, taskId: string): Promise<TaskResponse> {
    return this.get<TaskResponse>(`${this.base}/${projectId}/tasks/${taskId}`);
  }

  updateTask(projectId: string, taskId: string, body: UpdateTaskRequest): Promise<TaskResponse> {
    return this.put<TaskResponse, UpdateTaskRequest>(
      `${this.base}/${projectId}/tasks/${taskId}`,
      body,
    );
  }

  duplicateTask(
    projectId: string,
    taskId: string,
    body: DuplicateTaskRequest,
  ): Promise<TaskResponse> {
    return this.post<TaskResponse, DuplicateTaskRequest>(
      `${this.base}/${projectId}/tasks/${taskId}/duplicate`,
      body,
    );
  }

  updateTaskStatus(
    projectId: string,
    taskId: string,
    body: UpdateTaskStatusRequest,
  ): Promise<TaskResponse> {
    return this.put<TaskResponse, UpdateTaskStatusRequest>(
      `${this.base}/${projectId}/tasks/${taskId}/status`,
      body,
    );
  }

  deleteTask(projectId: string, taskId: string): Promise<void> {
    return this.delete<void>(`${this.base}/${projectId}/tasks/${taskId}`);
  }

  createTaskWorklog(
    projectId: string,
    taskId: string,
    body: CreateTaskWorklogRequest,
  ): Promise<TaskWorklogResponse> {
    return this.post<TaskWorklogResponse, CreateTaskWorklogRequest>(
      `${this.base}/${projectId}/tasks/${taskId}/worklogs`,
      body,
    );
  }

  listTaskWorklogs(
    projectId: string,
    taskId: string,
    params: TaskWorklogListQuery = {},
  ): Promise<TaskWorklogResponse[]> {
    const qs = toQueryString({
      workDate: params.workDate,
      userId: params.userId,
    });
    return this.get<TaskWorklogResponse[]>(`${this.base}/${projectId}/tasks/${taskId}/worklogs${qs}`);
  }

  updateTaskWorklog(
    projectId: string,
    taskId: string,
    worklogId: string,
    body: UpdateTaskWorklogRequest,
  ): Promise<TaskWorklogResponse> {
    return this.put<TaskWorklogResponse, UpdateTaskWorklogRequest>(
      `${this.base}/${projectId}/tasks/${taskId}/worklogs/${worklogId}`,
      body,
    );
  }

  deleteTaskWorklog(projectId: string, taskId: string, worklogId: string): Promise<void> {
    return this.delete<void>(`${this.base}/${projectId}/tasks/${taskId}/worklogs/${worklogId}`);
  }

  getTaskHistory(projectId: string, taskId: string): Promise<TaskHistoryResponse[]> {
    return this.get<TaskHistoryResponse[]>(`${this.base}/${projectId}/tasks/${taskId}/history`);
  }

  listTaskTags(projectId: string, taskId: string): Promise<TaskTagResponse[]> {
    return this.get<TaskTagResponse[]>(`${this.base}/${projectId}/tasks/${taskId}/tags`);
  }

  addTaskTag(
    projectId: string,
    taskId: string,
    body: AddTaskTagRequest,
  ): Promise<TaskTagResponse> {
    return this.post<TaskTagResponse, AddTaskTagRequest>(
      `${this.base}/${projectId}/tasks/${taskId}/tags`,
      body,
    );
  }

  deleteTaskTag(projectId: string, taskId: string, tagId: string): Promise<void> {
    return this.delete<void>(`${this.base}/${projectId}/tasks/${taskId}/tags/${tagId}`);
  }

  listTaskAttachments(projectId: string, taskId: string): Promise<TaskAttachmentResponse[]> {
    return this.get<TaskAttachmentResponse[]>(
      `${this.base}/${projectId}/tasks/${taskId}/attachments`,
    );
  }

  addTaskAttachmentFile(
    projectId: string,
    taskId: string,
    file: File,
    folder?: string,
  ): Promise<TaskAttachmentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const normalizedFolder = folder?.trim();
    if (normalizedFolder) {
      formData.append('folder', normalizedFolder);
    }
    return this.post<TaskAttachmentResponse, FormData>(
      `${this.base}/${projectId}/tasks/${taskId}/attachments`,
      formData,
    );
  }

  addTaskAttachmentWebLink(
    projectId: string,
    taskId: string,
    body: AddTaskAttachmentRequest,
  ): Promise<TaskAttachmentResponse> {
    return this.post<TaskAttachmentResponse, AddTaskAttachmentRequest>(
      `${this.base}/${projectId}/tasks/${taskId}/attachments/web-link`,
      body,
    );
  }

  // Backward-compatible alias for old callers.
  addTaskAttachment(
    projectId: string,
    taskId: string,
    body: AddTaskAttachmentRequest,
  ): Promise<TaskAttachmentResponse> {
    return this.addTaskAttachmentWebLink(projectId, taskId, body);
  }

  deleteTaskAttachment(projectId: string, taskId: string, attachmentId: string): Promise<void> {
    return this.delete<void>(
      `${this.base}/${projectId}/tasks/${taskId}/attachments/${attachmentId}`,
    );
  }

  listTaskComments(projectId: string, taskId: string): Promise<TaskCommentResponse[]> {
    return this.get<TaskCommentResponse[]>(`${this.base}/${projectId}/tasks/${taskId}/comments`);
  }

  addTaskComment(
    projectId: string,
    taskId: string,
    body: CreateTaskCommentRequest,
  ): Promise<TaskCommentResponse> {
    return this.post<TaskCommentResponse, CreateTaskCommentRequest>(
      `${this.base}/${projectId}/tasks/${taskId}/comments`,
      body,
    );
  }

  updateTaskComment(
    projectId: string,
    taskId: string,
    commentId: string,
    body: UpdateTaskCommentRequest,
  ): Promise<TaskCommentResponse> {
    return this.put<TaskCommentResponse, UpdateTaskCommentRequest>(
      `${this.base}/${projectId}/tasks/${taskId}/comments/${commentId}`,
      body,
    );
  }

  deleteTaskComment(
    projectId: string,
    taskId: string,
    commentId: string,
  ): Promise<void> {
    return this.delete<void>(`${this.base}/${projectId}/tasks/${taskId}/comments/${commentId}`);
  }

  toggleTaskCommentThumbsUp(
    projectId: string,
    taskId: string,
    commentId: string,
  ): Promise<TaskCommentResponse> {
    return this.post<TaskCommentResponse>(
      `${this.base}/${projectId}/tasks/${taskId}/comments/${commentId}/thumbs-up`,
    );
  }

  addTaskCommentReaction(
    projectId: string,
    taskId: string,
    commentId: string,
    body: AddCommentReactionRequest,
  ): Promise<TaskCommentResponse> {
    return this.post<TaskCommentResponse, AddCommentReactionRequest>(
      `${this.base}/${projectId}/tasks/${taskId}/comments/${commentId}/reactions`,
      body,
    );
  }

  removeTaskCommentReaction(
    projectId: string,
    taskId: string,
    commentId: string,
    reaction: string,
  ): Promise<TaskCommentResponse> {
    return this.delete<TaskCommentResponse>(
      `${this.base}/${projectId}/tasks/${taskId}/comments/${commentId}/reactions/${reaction}`,
    );
  }

  // Project role management APIs
  getMyProjectRoles(projectId: string): Promise<ProjectMemberRoleResponse[]> {
    return this.get<ProjectMemberRoleResponse[]>(`${this.base}/${projectId}/roles/me`);
  }

  createProjectRole(projectId: string, body: CreateProjectRoleRequest): Promise<void> {
    return this.post<void, CreateProjectRoleRequest>(`${this.base}/${projectId}/roles`, body);
  }

  listProjectRoles(projectId: string): Promise<ProjectRoleResponse[]> {
    return this.get<ProjectRoleResponse[]>(`${this.base}/${projectId}/roles`);
  }

  listAvailableProjectRolePermissions(
    projectId: string,
  ): Promise<ProjectAvailablePermissionResponse[]> {
    return this.get<ProjectAvailablePermissionResponse[]>(
      `${this.base}/${projectId}/roles/available-permissions`,
    );
  }

  getProjectRoleById(projectId: string, roleId: string): Promise<ProjectRoleDetailResponse> {
    return this.get<ProjectRoleDetailResponse>(`${this.base}/${projectId}/roles/${roleId}`);
  }

  updateProjectRole(
    projectId: string,
    roleId: string,
    body: UpdateProjectRoleRequest,
  ): Promise<void> {
    return this.put<void, UpdateProjectRoleRequest>(
      `${this.base}/${projectId}/roles/${roleId}`,
      body,
    );
  }

  deleteProjectRole(projectId: string, roleId: string): Promise<void> {
    return this.delete<void>(`${this.base}/${projectId}/roles/${roleId}`);
  }

  assignPermissionsToProjectRole(
    projectId: string,
    body: AssignPermissionsToProjectRoleRequest,
  ): Promise<void> {
    return this.post<void, AssignPermissionsToProjectRoleRequest>(
      `${this.base}/${projectId}/roles/permissions/assign`,
      body,
    );
  }

  revokePermissionsFromProjectRole(
    projectId: string,
    body: RevokePermissionsFromProjectRoleRequest,
  ): Promise<void> {
    return this.post<void, RevokePermissionsFromProjectRoleRequest>(
      `${this.base}/${projectId}/roles/permissions/revoke`,
      body,
    );
  }

  getProjectMemberRoles(projectId: string, memberId: string): Promise<ProjectMemberRoleResponse[]> {
    return this.get<ProjectMemberRoleResponse[]>(
      `${this.base}/${projectId}/roles/members/${memberId}`,
    );
  }

  assignRoleToProjectMember(
    projectId: string,
    body: AssignRoleToProjectMemberRequest,
  ): Promise<void> {
    return this.post<void, AssignRoleToProjectMemberRequest>(
      `${this.base}/${projectId}/roles/members/assign`,
      body,
    );
  }

  revokeRoleFromProjectMember(
    projectId: string,
    body: RevokeRoleFromProjectMemberRequest,
  ): Promise<void> {
    return this.post<void, RevokeRoleFromProjectMemberRequest>(
      `${this.base}/${projectId}/roles/members/revoke`,
      body,
    );
  }
}
