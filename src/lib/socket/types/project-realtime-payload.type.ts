import type {
  ProjectInviteResponse,
  ProjectMemberResponse,
  ProjectResponse,
  ProjectRoleResponse,
  StatusTaskResponse,
  TaskAttachmentResponse,
  TaskCommentResponse,
  TaskResponse,
  TaskTagResponse,
} from '@/features/tenant/projects/services/projects.service';

export interface ProjectRealtimeBasePayload {
  projectId: string;
  actorUserId?: string | null;
  occurredAt?: string;
}

export interface ProjectUpdatedPayload extends ProjectRealtimeBasePayload {
  project: ProjectResponse;
}

export interface ProjectTaskPayload extends ProjectRealtimeBasePayload {
  task: TaskResponse;
}

export interface ProjectTaskDeletedPayload extends ProjectRealtimeBasePayload {
  taskId: string;
}

export interface ProjectTaskCommentPayload extends ProjectRealtimeBasePayload {
  taskId: string;
  comment: TaskCommentResponse;
}

export interface ProjectTaskTagPayload extends ProjectRealtimeBasePayload {
  taskId: string;
  tag: TaskTagResponse;
}

export interface ProjectTaskAttachmentPayload extends ProjectRealtimeBasePayload {
  taskId: string;
  attachment: TaskAttachmentResponse;
}

export interface ProjectStatusPayload extends ProjectRealtimeBasePayload {
  statuses: StatusTaskResponse[];
  deletedStatusId?: string;
}

export interface ProjectMemberInvitePayload extends ProjectRealtimeBasePayload {
  invite: ProjectInviteResponse;
}

export interface ProjectMemberPayload extends ProjectRealtimeBasePayload {
  member: ProjectMemberResponse;
}

export interface ProjectMemberRemovedPayload extends ProjectRealtimeBasePayload {
  memberId: string;
  userId: string;
}

export interface ProjectRolePayload extends ProjectRealtimeBasePayload {
  role: ProjectRoleResponse;
}

export interface ProjectRoleDeletedPayload extends ProjectRealtimeBasePayload {
  roleId: string;
}

export interface ProjectRoleMemberAssignmentPayload extends ProjectRealtimeBasePayload {
  userId: string;
  roleIds: string[];
}

export interface ProjectSocketRoomPayload {
  projectId: string;
}

export interface ProjectSocketSubscribeAck {
  ok: boolean;
  projectId: string;
  room?: string;
}

export interface ProjectSocketUnsubscribeAck {
  ok: boolean;
  projectId: string;
}
