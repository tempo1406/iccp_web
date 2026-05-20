import type { TeamChatSupportedContextScope } from '../services/types/team-chat.types';

export interface TeamChatProjectOption {
  id: string;
  name: string;
  status?: string;
}

export interface TeamChatRoomScopeFilterControls {
  scope: TeamChatSupportedContextScope;
  projectId: string;
  projects: TeamChatProjectOption[];
  loadingProjects: boolean;
  projectErrorMessage?: string | null;
  onScopeChange: (scope: TeamChatSupportedContextScope) => void;
  onProjectChange: (projectId: string) => void;
}

export function resolveTeamChatScopeRequest(params: {
  scope: TeamChatSupportedContextScope;
  projectId?: string | null;
}) {
  const normalizedProjectId = params.projectId?.trim() ?? '';
  if (params.scope === 'project' && normalizedProjectId) {
    return {
      contextScope: 'project' as const,
      contextId: normalizedProjectId,
    };
  }

  return {
    contextScope: 'organization' as const,
    contextId: undefined,
  };
}
