'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { SOCKET_CLIENT_EVENTS, SOCKET_EVENTS, SOCKET_NAMESPACES } from '@/common/constant/socket.constant';
import type {
  ProjectMemberInvitePayload,
  ProjectMemberPayload,
  ProjectMemberRemovedPayload,
  ProjectRoleDeletedPayload,
  ProjectRoleMemberAssignmentPayload,
  ProjectRolePayload,
  ProjectStatusPayload,
  ProjectTaskAttachmentPayload,
  ProjectTaskCommentPayload,
  ProjectTaskDeletedPayload,
  ProjectTaskPayload,
  ProjectTaskTagPayload,
  ProjectUpdatedPayload,
} from '@/lib/socket/events';
import { useServiceContext } from '@/lib/use-service-context';
import { useSocket, useSocketEvent } from '@/providers/socket-provider';
import { kpiKeys } from '@/features/tenant/analytics/query/kpi-keys';
import { projectKeys } from '../query/project-keys';

interface ProjectRealtimeBridgeProps {
  projectId: string;
}

function removeTaskScopedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  tenantId: string | null | undefined,
  projectId: string,
  taskId: string,
) {
  queryClient.removeQueries({
    queryKey: projectKeys.taskById(tenantId, projectId, taskId),
  });
  queryClient.removeQueries({
    queryKey: projectKeys.taskHistory(tenantId, projectId, taskId),
  });
  queryClient.removeQueries({
    queryKey: projectKeys.taskComments(tenantId, projectId, taskId),
  });
  queryClient.removeQueries({
    queryKey: projectKeys.taskTags(tenantId, projectId, taskId),
  });
  queryClient.removeQueries({
    queryKey: projectKeys.taskAttachments(tenantId, projectId, taskId),
  });
}

export function ProjectRealtimeBridge({ projectId }: ProjectRealtimeBridgeProps) {
  const queryClient = useQueryClient();
  const { tenantId } = useServiceContext();
  const { emit } = useSocket();
  const enabled = Boolean(projectId);

  const invalidateProjectLists = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: projectKeys.all(tenantId),
    });
  }, [queryClient, tenantId]);

  const invalidateProjectDetail = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: projectKeys.detailRoot(tenantId),
    });
  }, [queryClient, tenantId]);

  const invalidateProjectInsights = useCallback(() => {
    if (!projectId) return;
    void queryClient.invalidateQueries({
      queryKey: projectKeys.dashboardRoot(tenantId, projectId),
    });
    void queryClient.invalidateQueries({
      queryKey: kpiKeys.projectRoot(tenantId, projectId),
    });
  }, [projectId, queryClient, tenantId]);

  const invalidateTaskCollections = useCallback(() => {
    if (!projectId) return;
    void queryClient.invalidateQueries({
      queryKey: projectKeys.tasksRoot(tenantId, projectId),
    });
    void queryClient.invalidateQueries({
      queryKey: projectKeys.taskMemberProgressRoot(tenantId, projectId),
    });
    invalidateProjectInsights();
    invalidateProjectDetail();
  }, [invalidateProjectDetail, invalidateProjectInsights, projectId, queryClient, tenantId]);

  const invalidateTaskScopedQueries = useCallback(
    (taskId: string) => {
      if (!projectId || !taskId) return;
      void queryClient.invalidateQueries({
        queryKey: projectKeys.taskById(tenantId, projectId, taskId),
      });
      void queryClient.invalidateQueries({
        queryKey: projectKeys.taskHistory(tenantId, projectId, taskId),
      });
    },
    [projectId, queryClient, tenantId],
  );

  const invalidateTaskComments = useCallback(
    (taskId: string) => {
      if (!projectId || !taskId) return;
      void queryClient.invalidateQueries({
        queryKey: projectKeys.taskComments(tenantId, projectId, taskId),
      });
      void queryClient.invalidateQueries({
        queryKey: projectKeys.taskHistory(tenantId, projectId, taskId),
      });
    },
    [projectId, queryClient, tenantId],
  );

  const invalidateTaskTags = useCallback(
    (taskId: string) => {
      if (!projectId || !taskId) return;
      void queryClient.invalidateQueries({
        queryKey: projectKeys.taskTags(tenantId, projectId, taskId),
      });
      void queryClient.invalidateQueries({
        queryKey: projectKeys.taskHistory(tenantId, projectId, taskId),
      });
    },
    [projectId, queryClient, tenantId],
  );

  const invalidateTaskAttachments = useCallback(
    (taskId: string) => {
      if (!projectId || !taskId) return;
      void queryClient.invalidateQueries({
        queryKey: projectKeys.taskAttachments(tenantId, projectId, taskId),
      });
      void queryClient.invalidateQueries({
        queryKey: projectKeys.taskHistory(tenantId, projectId, taskId),
      });
    },
    [projectId, queryClient, tenantId],
  );

  const invalidateStatuses = useCallback(() => {
    if (!projectId) return;
    void queryClient.invalidateQueries({
      queryKey: projectKeys.statusesRoot(tenantId, projectId),
    });
    invalidateTaskCollections();
  }, [invalidateTaskCollections, projectId, queryClient, tenantId]);

  const invalidateMembers = useCallback(() => {
    if (!projectId) return;
    void queryClient.invalidateQueries({
      queryKey: projectKeys.membersRoot(tenantId, projectId),
    });
    void queryClient.invalidateQueries({
      queryKey: projectKeys.roles(tenantId, projectId),
    });
    void queryClient.invalidateQueries({
      queryKey: projectKeys.taskMemberProgressRoot(tenantId, projectId),
    });
    invalidateProjectInsights();
    invalidateProjectDetail();
    invalidateProjectLists();
  }, [
    invalidateProjectDetail,
    invalidateProjectInsights,
    invalidateProjectLists,
    projectId,
    queryClient,
    tenantId,
  ]);

  const invalidateRoles = useCallback(() => {
    if (!projectId) return;
    void queryClient.invalidateQueries({
      queryKey: projectKeys.roles(tenantId, projectId),
    });
    void queryClient.invalidateQueries({
      queryKey: projectKeys.membersRoot(tenantId, projectId),
    });
    invalidateProjectInsights();
  }, [invalidateProjectInsights, projectId, queryClient, tenantId]);

  useEffect(() => {
    if (!projectId) return;

    emit(SOCKET_NAMESPACES.PROJECTS, SOCKET_CLIENT_EVENTS.PROJECT_SUBSCRIBE, {
      projectId,
    });

    return () => {
      emit(SOCKET_NAMESPACES.PROJECTS, SOCKET_CLIENT_EVENTS.PROJECT_UNSUBSCRIBE, {
        projectId,
      });
    };
  }, [emit, projectId]);

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_UPDATED,
    (payload: ProjectUpdatedPayload) => {
      queryClient.setQueriesData(
        { queryKey: projectKeys.detailRoot(tenantId) },
        (existing) => {
          if (!existing || typeof existing !== 'object') return existing;
          const current = existing as { id?: string | null };
          if (current.id && current.id !== payload.project.id) return existing;
          return payload.project;
        },
      );
      invalidateProjectInsights();
      invalidateProjectDetail();
      invalidateProjectLists();
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_TASK_CREATED,
    (payload: ProjectTaskPayload) => {
      invalidateTaskCollections();
      invalidateTaskScopedQueries(payload.task.id);
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_TASK_UPDATED,
    (payload: ProjectTaskPayload) => {
      invalidateTaskCollections();
      invalidateTaskScopedQueries(payload.task.id);
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_TASK_STATUS_CHANGED,
    (payload: ProjectTaskPayload) => {
      invalidateTaskCollections();
      invalidateTaskScopedQueries(payload.task.id);
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_TASK_DELETED,
    (payload: ProjectTaskDeletedPayload) => {
      invalidateTaskCollections();
      if (!projectId) return;
      removeTaskScopedQueries(queryClient, tenantId, projectId, payload.taskId);
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_TASK_COMMENT_CREATED,
    (payload: ProjectTaskCommentPayload) => {
      invalidateTaskComments(payload.taskId);
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_TASK_COMMENT_REACTION_UPDATED,
    (payload: ProjectTaskCommentPayload) => {
      invalidateTaskComments(payload.taskId);
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_TASK_TAG_ADDED,
    (payload: ProjectTaskTagPayload) => {
      invalidateTaskTags(payload.taskId);
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_TASK_TAG_REMOVED,
    (payload: ProjectTaskTagPayload) => {
      invalidateTaskTags(payload.taskId);
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_TASK_ATTACHMENT_ADDED,
    (payload: ProjectTaskAttachmentPayload) => {
      invalidateTaskAttachments(payload.taskId);
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_TASK_ATTACHMENT_REMOVED,
    (payload: ProjectTaskAttachmentPayload) => {
      invalidateTaskAttachments(payload.taskId);
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_STATUS_CREATED,
    (payload: ProjectStatusPayload) => {
      queryClient.setQueriesData(
        { queryKey: projectKeys.statusesRoot(tenantId, projectId) },
        payload.statuses,
      );
      invalidateTaskCollections();
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_STATUS_UPDATED,
    (payload: ProjectStatusPayload) => {
      queryClient.setQueriesData(
        { queryKey: projectKeys.statusesRoot(tenantId, projectId) },
        payload.statuses,
      );
      invalidateTaskCollections();
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_STATUS_DELETED,
    (payload: ProjectStatusPayload) => {
      queryClient.setQueriesData(
        { queryKey: projectKeys.statusesRoot(tenantId, projectId) },
        payload.statuses,
      );
      invalidateTaskCollections();
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_MEMBER_INVITED,
    (_payload: ProjectMemberInvitePayload) => {
      invalidateMembers();
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_MEMBER_JOINED,
    (_payload: ProjectMemberPayload) => {
      invalidateMembers();
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_MEMBER_UPDATED,
    (_payload: ProjectMemberPayload) => {
      invalidateMembers();
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_MEMBER_REMOVED,
    (_payload: ProjectMemberRemovedPayload) => {
      invalidateMembers();
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_ROLE_CREATED,
    (_payload: ProjectRolePayload) => {
      invalidateRoles();
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_ROLE_UPDATED,
    (_payload: ProjectRolePayload) => {
      invalidateRoles();
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_ROLE_PERMISSIONS_UPDATED,
    (_payload: ProjectRolePayload) => {
      invalidateRoles();
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_ROLE_DELETED,
    (_payload: ProjectRoleDeletedPayload) => {
      invalidateRoles();
    },
    enabled,
  );

  useSocketEvent(
    SOCKET_NAMESPACES.PROJECTS,
    SOCKET_EVENTS.PROJECT_ROLE_MEMBER_ASSIGNMENT_UPDATED,
    (_payload: ProjectRoleMemberAssignmentPayload) => {
      invalidateRoles();
      invalidateMembers();
    },
    enabled,
  );

  return null;
}
