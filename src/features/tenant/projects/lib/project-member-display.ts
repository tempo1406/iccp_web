'use client';

import type { ProjectMemberResponse } from '../services/projects.service';

export function resolveProjectMemberDisplayName(
  member: ProjectMemberResponse,
  userDisplayNameById?: Map<string, string>,
): string {
  const fromMap = userDisplayNameById?.get(member.userId)?.trim();
  if (fromMap) return fromMap;

  const source = member as ProjectMemberResponse & {
    fullName?: string | null;
    email?: string | null;
    user?: {
      fullName?: string | null;
      email?: string | null;
    } | null;
  };

  const fullName = source.fullName?.trim() || source.user?.fullName?.trim();
  if (fullName) return fullName;

  const email = source.email?.trim() || source.user?.email?.trim();
  if (email) return email;

  return member.userId;
}
