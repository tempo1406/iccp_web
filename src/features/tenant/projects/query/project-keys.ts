'use client';

import type {
  MemberTaskProgressQuery,
  ProjectInviteMeQuery,
  ProjectListQuery,
  ProjectMemberListQuery,
  ProjectStatusListQuery,
  ProjectTaskListQuery,
  TaskWorklogListQuery,
} from '../services/projects.service';

export const projectKeys = {
  all: (tenantId: string | null | undefined) => ['projects', tenantId] as const,

  list: (tenantId: string | null | undefined, input: ProjectListQuery) =>
    ['projects', tenantId, 'list', input] as const,
  detailRoot: (tenantId: string | null | undefined) => ['projects', tenantId, 'byId'] as const,
  byId: (tenantId: string | null | undefined, projectId: string) =>
    ['projects', tenantId, 'byId', projectId] as const,

  invitesMe: (tenantId: string | null | undefined, input: ProjectInviteMeQuery) =>
    ['projects', tenantId, 'invites', 'me', input] as const,

  membersRoot: (tenantId: string | null | undefined, projectId: string) =>
    ['projects', tenantId, projectId, 'members'] as const,

  members: (
    tenantId: string | null | undefined,
    projectId: string,
    input: ProjectMemberListQuery,
  ) => ['projects', tenantId, projectId, 'members', input] as const,

  statuses: (
    tenantId: string | null | undefined,
    projectId: string,
    input: ProjectStatusListQuery,
  ) => ['projects', tenantId, projectId, 'statuses', input] as const,
  statusesRoot: (tenantId: string | null | undefined, projectId: string) =>
    ['projects', tenantId, projectId, 'statuses'] as const,

  tasksRoot: (tenantId: string | null | undefined, projectId: string) =>
    ['projects', tenantId, projectId, 'tasks'] as const,

  tasks: (
    tenantId: string | null | undefined,
    projectId: string,
    input: ProjectTaskListQuery,
  ) => ['projects', tenantId, projectId, 'tasks', input] as const,
  taskMemberProgress: (
    tenantId: string | null | undefined,
    projectId: string,
    input: MemberTaskProgressQuery,
  ) => ['projects', tenantId, projectId, 'tasks', 'member-progress', input] as const,
  taskMemberProgressRoot: (tenantId: string | null | undefined, projectId: string) =>
    ['projects', tenantId, projectId, 'tasks', 'member-progress'] as const,
  taskById: (tenantId: string | null | undefined, projectId: string, taskId: string) =>
    ['projects', tenantId, projectId, 'tasks', 'byId', taskId] as const,
  taskHistory: (tenantId: string | null | undefined, projectId: string, taskId: string) =>
    ['projects', tenantId, projectId, 'tasks', taskId, 'history'] as const,
  taskTags: (tenantId: string | null | undefined, projectId: string, taskId: string) =>
    ['projects', tenantId, projectId, 'tasks', taskId, 'tags'] as const,
  taskAttachments: (tenantId: string | null | undefined, projectId: string, taskId: string) =>
    ['projects', tenantId, projectId, 'tasks', taskId, 'attachments'] as const,
  taskComments: (tenantId: string | null | undefined, projectId: string, taskId: string) =>
    ['projects', tenantId, projectId, 'tasks', taskId, 'comments'] as const,
  taskWorklogsRoot: (tenantId: string | null | undefined, projectId: string, taskId: string) =>
    ['projects', tenantId, projectId, 'tasks', taskId, 'worklogs'] as const,
  taskWorklogs: (
    tenantId: string | null | undefined,
    projectId: string,
    taskId: string,
    input: TaskWorklogListQuery,
  ) => ['projects', tenantId, projectId, 'tasks', taskId, 'worklogs', input] as const,

  roles: (tenantId: string | null | undefined, projectId: string) =>
    ['projects', tenantId, projectId, 'roles'] as const,
  rolesMe: (tenantId: string | null | undefined, projectId: string) =>
    ['projects', tenantId, projectId, 'roles', 'me'] as const,
  roleById: (tenantId: string | null | undefined, projectId: string, roleId: string) =>
    ['projects', tenantId, projectId, 'roles', 'byId', roleId] as const,
  rolePermissions: (tenantId: string | null | undefined, projectId: string) =>
    ['projects', tenantId, projectId, 'roles', 'available-permissions'] as const,
  memberRoles: (tenantId: string | null | undefined, projectId: string, memberId: string) =>
    ['projects', tenantId, projectId, 'roles', 'members', memberId] as const,

  settings: (tenantId: string | null | undefined, projectId: string) =>
    ['projects', tenantId, projectId, 'settings'] as const,

  dashboardRoot: (tenantId: string | null | undefined, projectId: string) =>
    ['projects', tenantId, projectId, 'dashboard'] as const,

  dashboard: (
    tenantId: string | null | undefined,
    projectId: string,
    query: { dateFrom?: string; dateTo?: string },
  ) => ['projects', tenantId, projectId, 'dashboard', query] as const,
};
