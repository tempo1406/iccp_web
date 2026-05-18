'use client';

import { use } from 'react';
import { useProjectById, useProjectMembers, useProjectTaskMemberProgress, useProjectRoles } from '@/features/tenant/projects';
import {
  createProjectRoleNameById,
  resolveAssignedProjectMemberRoleNames,
  useProjectMemberRolesByUserId,
} from '@/features/tenant/projects/hooks/use-project-member-role-resolver';
import { ProjectTeamProgressView } from '@/features/tenant/projects/components/project-team-progress-view';
import type { ProjectMemberResponse } from '@/features/tenant/projects/services/projects.service';
import type { ProjectTeamProgressMember, ProjectTeamProgressTask } from '@/features/tenant/projects/components/project-detail-data';

interface Props {
  params: Promise<{ tenant: string; id: string }>;
}

function toDisplayName(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

function readString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return '';
}

function resolveIdentity(member: ProjectMemberResponse & Record<string, unknown>) {
  const user = (member.user ?? {}) as Record<string, unknown>;
  const firstName =
    readString(user, ['firstName', 'first_name', 'userFirstName', 'user_firstName']) ||
    readString(member, ['firstName', 'first_name', 'userFirstName', 'user_firstName']);
  const lastName =
    readString(user, ['lastName', 'last_name', 'userLastName', 'user_lastName']) ||
    readString(member, ['lastName', 'last_name', 'userLastName', 'user_lastName']);
  const email =
    readString(user, ['email', 'userEmail', 'user_email', 'mail']) ||
    readString(member, ['email', 'userEmail', 'user_email', 'mail']);
  const displayName =
    readString(member, ['fullName', 'full_name', 'displayName', 'display_name', 'name']) ||
    readString(user, ['fullName', 'full_name', 'displayName', 'display_name', 'name']) ||
    toDisplayName(firstName, lastName);

  return { displayName: displayName || undefined, email: email || undefined };
}

function isEmailLike(value?: string | null): boolean {
  return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()));
}

function resolveAvatarUrl(member: ProjectMemberResponse & Record<string, unknown>): string | undefined {
  const user = (member.user ?? {}) as Record<string, unknown>;
  const candidates = [
    member.avatarUrl,
    member.avatar,
    user.avatarUrl,
    user.avatar,
    user.photoUrl,
    user.imageUrl,
  ];
  const avatar = candidates.find(
    (value): value is string => typeof value === 'string' && value.trim().length > 0,
  );
  return avatar?.trim();
}

export default function ProjectTeamPage({ params }: Props) {
  const { id: projectSlug } = use(params);
  const projectQuery = useProjectById(projectSlug);
  const projectId = projectQuery.data?.id ?? '';
  const membersQuery = useProjectMembers(projectId);
  const progressQuery = useProjectTaskMemberProgress(projectId);
  const rolesQuery = useProjectRoles(projectId);
  const members = membersQuery.data ?? [];
  const memberRolesByUserId = useProjectMemberRolesByUserId(projectId, members);

  const roleNameById = createProjectRoleNameById(rolesQuery.data ?? []);

  const teamMembers: ProjectTeamProgressMember[] = members.map((member) => {
    const m = member as ProjectMemberResponse & Record<string, unknown>;
    const { displayName, email } = resolveIdentity(m);
    const progress = (progressQuery.data ?? []).find((p) => p.userId === member.userId);
    const memberRoles = resolveAssignedProjectMemberRoleNames(
      member,
      roleNameById,
      memberRolesByUserId,
    );

    return {
      id: member.userId,
      name:
        displayName ??
        (progress?.fullName && !isEmailLike(progress.fullName) ? progress.fullName : undefined) ??
        email ??
        member.userId,
      email,
      avatar: resolveAvatarUrl(m) ?? progress?.avatar ?? undefined,
      role: memberRoles[0] ?? 'No role',
      roles: memberRoles,
      tasksCompleted: progress?.doneTasks ?? 0,
      tasksTotal: progress?.totalAssignedTasks ?? 0,
      tasksInProgress: progress?.openTasks ?? 0,
      doneOnTimeTasks: progress?.doneOnTimeTasks ?? 0,
      doneLateTasks: progress?.doneLateTasks ?? 0,
      overdueOpenTasks: progress?.overdueOpenTasks ?? 0,
      dueSoonTasks: progress?.dueSoonTasks ?? 0,
      completionRate: progress?.completionRate ?? 0,
      onTimeRate: progress?.onTimeRate ?? 0,
      progressScore: progress?.progressScore ?? 0,
      lastActive: '',
      tasks: [] as ProjectTeamProgressTask[],
    };
  });

  return <ProjectTeamProgressView teamMembers={teamMembers} />;
}
