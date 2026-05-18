'use client';

import { useCallback, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ROUTES } from '@/common/constant/routes';
import { useMyOrgsQuery } from '@/features/common/user-dashboard/query/org.queries';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { useTenant } from '@/providers';
import type { MemberDto } from '@/services/organizations/types';
import { ShieldAlert } from 'lucide-react';
import {
  useOrganizationMemberDetails,
  useOrganizationMembersActions,
  useOrganizationMembersData,
} from '../hooks/use-organization-members';
import { OrganizationMemberDetailsDialog } from './organization-member-details-dialog';
import { OrganizationMemberRemoveDialog } from './organization-member-remove-dialog';
import { OrganizationMembersContent } from './organization-members-content';
import {
  OrganizationMembersFilters,
  type MemberStatusFilter,
} from './organization-members-filters';

export function OrganizationMembersPage() {
  const { tenantSlug } = useTenant();

  const canListMembers = useCan(PERMISSIONS.TENANT_MEMBERS_LIST);
  const canViewMembers = useCan(PERMISSIONS.TENANT_MEMBERS_VIEW);
  const canUpdateMembers = useCan(PERMISSIONS.TENANT_MEMBERS_UPDATE);
  const canRemoveMembers = useCan(PERMISSIONS.TENANT_MEMBERS_REMOVE);
  const canManageRoles = useCan(PERMISSIONS.RBAC_USER_ROLES_ASSIGN);

  const { members, isPending, isError, error } = useOrganizationMembersData();
  const { removeMember, updateMemberStatus, isRemoving, isUpdatingStatus, isSaving } =
    useOrganizationMembersActions();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<MemberDto | null>(null);

  const {
    member: selectedMember,
    isPending: isMemberDetailsPending,
    isError: isMemberDetailsError,
    error: memberDetailsError,
  } = useOrganizationMemberDetails(
    selectedMemberId,
    detailsOpen && Boolean(selectedMemberId) && (canViewMembers || canListMembers),
  );

  const myOrgsQuery = useMyOrgsQuery();

  const filteredMembers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return members.filter((member) => {
      const fullName = [member.firstName, member.lastName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 ||
        member.email.toLowerCase().includes(normalizedQuery) ||
        member.userId.toLowerCase().includes(normalizedQuery) ||
        fullName.includes(normalizedQuery);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? member.isActive : !member.isActive);

      return matchesQuery && matchesStatus;
    });
  }, [members, searchQuery, statusFilter]);

  const memberNameMap = useMemo(
    () =>
      new Map(
        members.map((member) => {
          const fullName = [member.firstName, member.lastName]
            .filter(Boolean)
            .join(' ')
            .trim();
          return [member.userId, fullName || member.email || 'Unknown user'];
        }),
      ),
    [members],
  );

  const organizationNameMap = useMemo(
    () => new Map((myOrgsQuery.data ?? []).map((org) => [org.id, org.name])),
    [myOrgsQuery.data],
  );

  const getMemberDisplayName = useCallback(
    (userId?: string | null) => {
      if (!userId) return '-';
      return memberNameMap.get(userId) ?? 'Unknown user';
    },
    [memberNameMap],
  );

  const getOrganizationDisplayName = useCallback(
    (organizationId?: string | null) => {
      if (!organizationId) return '-';
      return organizationNameMap.get(organizationId) ?? 'Unknown organization';
    },
    [organizationNameMap],
  );

  const handleViewDetails = (member: MemberDto) => {
    if (!canViewMembers && !canListMembers) return;
    setSelectedMemberId(member.userId);
    setDetailsOpen(true);
  };

  const handleToggleMemberStatus = async (
    member: MemberDto,
    nextIsActive: boolean,
  ) => {
    await updateMemberStatus(member.userId, nextIsActive, member.email);
  };

  const handleRemoveConfirmed = async () => {
    if (!removeTarget) return;
    await removeMember(removeTarget.userId, removeTarget.email);
    setRemoveTarget(null);
  };

  if (!canListMembers) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Organization Members"
          description="View and manage members in your organization."
          breadcrumbs={[
            { label: 'Dashboard', href: ROUTES.tenant.dashboard(tenantSlug) },
            { label: 'Organization Management' },
            { label: 'Members' },
          ]}
        />

        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>You do not have permission to access this page.</AlertTitle>
          <AlertDescription>
            Required permission: <code>{PERMISSIONS.TENANT_MEMBERS_LIST}</code>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader       
        title="Organization Members"
        description="Manage organization members and inspect membership details."
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.tenant.dashboard(tenantSlug) },
          { label: 'Organization Management' },
          { label: 'Members' },
        ]}
      />

      <div className="space-y-4">
        <OrganizationMembersFilters
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onSearchQueryChange={setSearchQuery}
          onStatusFilterChange={setStatusFilter}
        />

        <OrganizationMembersContent
          members={filteredMembers}
          isPending={isPending}
          isError={isError}
          errorMessage={error?.message}
          canUpdateMembers={canUpdateMembers}
          canRemoveMembers={canRemoveMembers}
          isUpdatingStatus={isUpdatingStatus}
          getMemberDisplayName={getMemberDisplayName}
          onViewDetails={handleViewDetails}
          onToggleMemberStatus={(member, nextIsActive) =>
            void handleToggleMemberStatus(member, nextIsActive)
          }
          onRemoveMember={setRemoveTarget}
        />
      </div>

      <OrganizationMemberDetailsDialog
        open={detailsOpen}
        member={selectedMember}
        isPending={isMemberDetailsPending}
        isError={isMemberDetailsError}
        errorMessage={memberDetailsError?.message}
        canManageRoles={canManageRoles}
        getMemberDisplayName={getMemberDisplayName}
        getOrganizationDisplayName={getOrganizationDisplayName}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) {
            setSelectedMemberId(null);
          }
        }}
      />

      <OrganizationMemberRemoveDialog
        open={Boolean(removeTarget)}
        target={removeTarget}
        isSaving={isSaving}
        isRemoving={isRemoving}
        canRemoveMembers={canRemoveMembers}
        onConfirm={() => void handleRemoveConfirmed()}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveTarget(null);
          }
        }}
      />
    </div>
  );
}
