import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { MemberDto } from '@/services/organizations/types';
import { OrganizationMembersTable } from './organization-members-table';

interface OrganizationMembersContentProps {
  members: MemberDto[];
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
  canUpdateMembers: boolean;
  canRemoveMembers: boolean;
  isUpdatingStatus: boolean;
  getMemberDisplayName: (userId?: string | null) => string;
  onViewDetails: (member: MemberDto) => void;
  onToggleMemberStatus: (member: MemberDto, nextIsActive: boolean) => void;
  onRemoveMember: (member: MemberDto) => void;
}

export function OrganizationMembersContent({
  members,
  isPending,
  isError,
  errorMessage,
  canUpdateMembers,
  canRemoveMembers,
  isUpdatingStatus,
  getMemberDisplayName,
  onViewDetails,
  onToggleMemberStatus,
  onRemoveMember,
}: Readonly<OrganizationMembersContentProps>) {
  if (isPending) {
    return (
      <div className="space-y-3 py-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Failed to load organization members</AlertTitle>
        <AlertDescription>{errorMessage ?? 'Unknown error.'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <OrganizationMembersTable
      members={members}
      canUpdateMembers={canUpdateMembers}
      canRemoveMembers={canRemoveMembers}
      isUpdatingStatus={isUpdatingStatus}
      getMemberDisplayName={getMemberDisplayName}
      onViewDetails={onViewDetails}
      onToggleMemberStatus={onToggleMemberStatus}
      onRemoveMember={onRemoveMember}
    />
  );
}
