'use client';

import { useCallback, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TipTapEditor } from '@/components/ui/tiptap-editor';
import { ROUTES } from '@/common/constant/routes';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { usePagination } from '@/hooks/use-pagination';
import { toast } from '@/lib/toast';
import { useTenant } from '@/providers';
import { useAppSelector } from '@/store';
import {
  BellRing,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MailPlus,
  Plus,
  Search,
  Send,
  ShieldAlert,
  UserPlus,
  X,
} from 'lucide-react';
import { InviteMemberDetailsSheet } from './invite-member-details-sheet';
import { InviteMembersTable } from './invite-members-table';
import { useMyOrgsQuery } from '@/features/common/user-dashboard/query/org.queries';
import { useOrganizationMembersData } from '@/features/tenant/organization-members/hooks/use-organization-members';
import {
  invitationStatusOptions,
  type InvitationStatus,
  type OrganizationInvitation,
  useOrganizationInvitationAnalytics,
  useOrganizationInvitationDetail,
  useOrganizationInvitationsActions,
  useOrganizationInvitationsData,
} from '../hooks/use-organization-invitations';

function parseEmailList(input: string): {
  validEmails: string[];
  invalidEmails: string[];
} {
  const rawEmails = input
    .split(/[\s,;]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const uniqueEmails = Array.from(new Set(rawEmails));
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validEmails = uniqueEmails.filter((email) => emailRegex.test(email));
  const invalidEmails = uniqueEmails.filter((email) => !emailRegex.test(email));

  return { validEmails, invalidEmails };
}

function getRichTextPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function InviteStatsGrid({
  isPending,
  stats,
}: {
  isPending: boolean;
  stats: { total: number; pending: number; accepted: number; needsAttention: number };
}) {
  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[80px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Invitations</CardDescription>
          <CardTitle className="text-2xl">{stats.total}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Pending Acceptance</CardDescription>
          <CardTitle className="text-2xl">{stats.pending}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Accepted Invitations</CardDescription>
          <CardTitle className="text-2xl">{stats.accepted}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Needs Attention</CardDescription>
          <CardTitle className="text-2xl">{stats.needsAttention}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

export function OrganizationInviteMembersPage() {
  const { tenantSlug } = useTenant();
  const profile = useAppSelector((state) => state.user.profile);
  const { page, limit, setPage, setLimit, reset } = usePagination({
    initialPage: 1,
    initialLimit: 10,
  });

  const canViewInvitations = useCan(PERMISSIONS.TENANT_INVITATIONS_LIST);
  const canCreateInvitationsByMembersAdd = useCan(PERMISSIONS.TENANT_MEMBERS_ADD);
  const canCreateInvitationsByLegacyPermission = useCan(
    PERMISSIONS.TENANT_INVITATIONS_CREATE,
  );
  const canCreateInvitations =
    canCreateInvitationsByMembersAdd || canCreateInvitationsByLegacyPermission;
  const canResendInvitations = useCan(PERMISSIONS.TENANT_INVITATIONS_RESEND);
  const canCancelInvitations = useCan(PERMISSIONS.TENANT_INVITATIONS_CANCEL);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvitationStatus>('all');
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emailTags, setEmailTags] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSendingAll, setIsSendingAll] = useState(false);

  const [selectedInvitationId, setSelectedInvitationId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { analytics, isPending: isAnalyticsPending } = useOrganizationInvitationAnalytics();
  const { invitations, meta, isPending, isError, error } = useOrganizationInvitationsData({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    limit,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });

  const detailQuery = useOrganizationInvitationDetail(
    selectedInvitationId ?? '',
    detailsOpen && Boolean(selectedInvitationId),
  );
  const myOrgsQuery = useMyOrgsQuery();
  const organizationMembersData = useOrganizationMembersData();

  const {
    sendInvitations,
    resendInvitation,
    cancelInvitation,
    resendPendingInvitations,
    isCreating,
    isResending,
    isCancelling,
  } = useOrganizationInvitationsActions();

  const stats = useMemo(
    () => ({
      total: analytics.total,
      pending: analytics.pending,
      accepted: analytics.accepted,
      needsAttention: analytics.needsAttention,
    }),
    [analytics],
  );

  const currentUserName = useMemo(() => {
    if (!profile) return 'Unknown user';
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
    return fullName || profile.email || 'Unknown user';
  }, [profile]);

  const organizationNameMap = useMemo(() => {
    return new Map((myOrgsQuery.data ?? []).map((org) => [org.id, org.name]));
  }, [myOrgsQuery.data]);

  const inviterNameMap = useMemo(() => {
    return new Map(
      organizationMembersData.members.map((member) => {
        const fullName = [member.firstName, member.lastName].filter(Boolean).join(' ').trim();
        return [member.userId, fullName || member.email || 'Unknown user'];
      }),
    );
  }, [organizationMembersData.members]);

  const getOrganizationName = useCallback((organizationId: string) => {
    return organizationNameMap.get(organizationId) ?? 'Unknown organization';
  }, [organizationNameMap]);

  const getInviterName = useCallback((invitedBy: string) => {
    if (!invitedBy) return '-';
    if (profile?.id === invitedBy) return currentUserName;
    return inviterNameMap.get(invitedBy) ?? 'Unknown user';
  }, [profile?.id, currentUserName, inviterNameMap]);

  const filteredInvitations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery.length === 0) return invitations;

    return invitations.filter((invitation) => {
      const invitedByName = getInviterName(invitation.invitedBy).toLowerCase();
      const organizationName = getOrganizationName(invitation.organizationId).toLowerCase();

      return (
        invitation.email.toLowerCase().includes(normalizedQuery) ||
        invitedByName.includes(normalizedQuery) ||
        organizationName.includes(normalizedQuery) ||
        invitation.id.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [invitations, searchQuery, getInviterName, getOrganizationName]);

  const pendingInvitationsOnPage = useMemo(
    () =>
      invitations.filter(
        (invitation) => invitation.status === 'pending' && !invitation.isExpired,
      ),
    [invitations],
  );

  const selectedInvitation = useMemo(() => {
    if (detailQuery.data) return detailQuery.data;
    if (!selectedInvitationId) return null;
    return invitations.find((item) => item.id === selectedInvitationId) ?? null;
  }, [detailQuery.data, invitations, selectedInvitationId]);
  const inviteMessagePlainTextLength = useMemo(
    () => getRichTextPlainText(inviteMessage).length,
    [inviteMessage],
  );

  const handleOpenDetails = (invitation: OrganizationInvitation) => {
    setSelectedInvitationId(invitation.id);
    setDetailsOpen(true);
  };

  const handleResend = async (invitationId: string) => {
    if (!canResendInvitations) {
      toast.danger('You do not have permission to resend invitations.');
      return;
    }

    const invitation = invitations.find((item) => item.id === invitationId);
    await resendInvitation(invitationId, invitation?.email);
  };

  const handleResendPending = async () => {
    if (!canResendInvitations) {
      toast.danger('You do not have permission to resend invitations.');
      return;
    }

    setIsSendingAll(true);
    try {
      await resendPendingInvitations(pendingInvitationsOnPage);
    } finally {
      setIsSendingAll(false);
    }
  };

  const handleCancel = async (invitationId: string) => {
    if (!canCancelInvitations) {
      toast.danger('You do not have permission to cancel invitations.');
      return;
    }

    const invitation = invitations.find((item) => item.id === invitationId);
    await cancelInvitation(invitationId, invitation?.email);
  };

  const handleInviteMembers = async () => {
    if (!canCreateInvitations) {
      toast.danger('You do not have permission to create invitations.');
      return;
    }

    setFormError(null);
    const { validEmails, invalidEmails } = parseEmailList(inviteEmails);

    if (validEmails.length === 0) {
      setFormError('Please enter at least one valid email address.');
      return;
    }

    if (validEmails.length > 50) {
      setFormError('You can invite at most 50 email addresses per request.');
      return;
    }

    if (invalidEmails.length > 0) {
      const preview = invalidEmails.slice(0, 3).join(', ');
      setFormError(`Invalid email(s): ${preview}`);
      return;
    }

    if (inviteMessagePlainTextLength > 2000) {
      setFormError('Invitation note must be 2000 text characters or fewer.');
      return;
    }

    if (inviteMessage.length > 8000) {
      setFormError('Invitation note markup is too long. Please simplify the formatting.');
      return;
    }

    const normalizedMessage =
      inviteMessagePlainTextLength > 0 ? inviteMessage.trim() : undefined;

    const result = await sendInvitations({
      emails: validEmails,
      message: normalizedMessage,
    });
    if (!result.ok) {
      setFormError(result.error ?? 'Failed to send invitations.');
      return;
    }

    setEmailInput('');
    setEmailTags([]);
    setInviteEmails('');
    setInviteMessage('');
  };

  const handleAddEmailTag = () => {
    const normalizedInput = emailInput.trim().toLowerCase();
    if (!normalizedInput) return;

    const { validEmails, invalidEmails } = parseEmailList(normalizedInput);
    if (validEmails.length === 0) {
      setFormError('Please enter at least one valid email address before adding.');
      return;
    }

    const existingEmailSet = new Set(emailTags);
    const nextUniqueEmails = validEmails.filter((email) => !existingEmailSet.has(email));

    if (nextUniqueEmails.length === 0) {
      setFormError('All valid email addresses in this input are already added.');
      return;
    }

    if (emailTags.length + nextUniqueEmails.length > 50) {
      setFormError('You can add at most 50 email addresses per request.');
      return;
    }

    const nextTags = [...emailTags, ...nextUniqueEmails];
    setEmailTags(nextTags);
    setInviteEmails(nextTags.join('\n'));
    setEmailInput('');

    if (invalidEmails.length > 0) {
      const preview = invalidEmails.slice(0, 3).join(', ');
      setFormError(`Some entries were skipped because they are invalid: ${preview}`);
      return;
    }

    setFormError(null);
  };

  const handleRemoveEmailTag = (email: string) => {
    const nextTags = emailTags.filter((item) => item !== email);
    setEmailTags(nextTags);
    setInviteEmails(nextTags.join('\n'));
  };

  if (!canViewInvitations) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Invite Members"
          description="Manage organization invitations and send member onboarding links."
          breadcrumbs={[
            { label: 'Dashboard', href: ROUTES.tenant.dashboard(tenantSlug) },
            { label: 'Organization Management' },
            { label: 'Invite Members' },
          ]}
        />

        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>You do not have permission to access this page.</AlertTitle>
          <AlertDescription>
            Required permission: <code>{PERMISSIONS.TENANT_INVITATIONS_LIST}</code>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invite Members"
        description="Send invitations and manage invitation lifecycle with live backend data."
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.tenant.dashboard(tenantSlug) },
          { label: 'Organization Management' },
          { label: 'Invite Members' },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => void handleResendPending()}
            disabled={
              isSendingAll ||
              isResending ||
              pendingInvitationsOnPage.length === 0 ||
              !canResendInvitations
            }
          >
            {isSendingAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BellRing className="mr-2 h-4 w-4" />
            )}
            Remind Pending In Page ({pendingInvitationsOnPage.length})
          </Button>
        }
      />

      <InviteStatsGrid isPending={isAnalyticsPending} stats={stats} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailPlus className="text-primary h-5 w-5" />
            Send New Invitations
          </CardTitle>
          <CardDescription>
            Enter multiple emails separated by comma, space, or new line. Backend accepts
            maximum 50 emails per request.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email-input">Add Email</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="invite-email-input"
                type="text"
                placeholder="name@example.com"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddEmailTag();
                  }
                }}
                disabled={!canCreateInvitations}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddEmailTag}
                disabled={!canCreateInvitations}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-emails">Email List</Label>
            <div
              id="invite-emails"
              className="bg-background flex min-h-[120px] flex-wrap content-start gap-2 rounded-md border p-3"
            >
              {emailTags.length === 0 && (
                <span className="text-muted-foreground text-sm">
                  Added emails will appear here as tags.
                </span>
              )}
              {emailTags.map((email) => (
                <Badge key={email} variant="secondary" className="h-fit pr-1">
                  <span>{email}</span>
                  <button
                    type="button"
                    className="ml-1 rounded-full p-0.5 hover:bg-black/10"
                    onClick={() => handleRemoveEmailTag(email)}
                    aria-label={`Remove ${email}`}
                    disabled={!canCreateInvitations}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-message">Invitation Note</Label>
            <TipTapEditor
              value={inviteMessage}
              onChange={setInviteMessage}
              placeholder="Dear team, welcome to our workspace..."
              disabled={!canCreateInvitations}
            />
            <p className="text-muted-foreground text-xs">
              Optional. This note is included in the invitation email and kept for future
              resends. {inviteMessagePlainTextLength}/2000 text characters
            </p>
          </div>

          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <p className="text-muted-foreground text-sm">
              Role assignment is handled after member joins organization.
            </p>
            <Button
              type="button"
              onClick={() => void handleInviteMembers()}
              disabled={isCreating || !canCreateInvitations}
            >
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Invitation
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="text-primary h-5 w-5" />
                Invitation Registry
              </CardTitle>
              <CardDescription className="mt-1">
                Track invitation status and perform resend/cancel actions.
              </CardDescription>
            </div>

            <div className="grid w-full gap-2 sm:grid-cols-3 md:w-auto">
              <div className="relative min-w-[230px] sm:col-span-2 md:min-w-[280px]">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by email, inviter, invite ID..."
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as 'all' | InvitationStatus);
                  reset();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  {invitationStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {isPending ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-md" />
              ))}
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertTitle>Failed to load invitations</AlertTitle>
              <AlertDescription>{error?.message ?? 'Unknown error.'}</AlertDescription>
            </Alert>
          ) : (
            <>
              <InviteMembersTable
                invitations={filteredInvitations}
                canResend={canResendInvitations && !isResending}
                canCancel={canCancelInvitations && !isCancelling}
                getOrganizationName={getOrganizationName}
                getInviterName={getInviterName}
                onViewDetails={handleOpenDetails}
                onResend={(id) => void handleResend(id)}
                onCancel={(id) => void handleCancel(id)}
              />

              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-sm">
                  Total {meta.total} invitations • Page {meta.page} / {meta.totalPages}
                </p>

                <div className="flex items-center gap-2">
                  <Select
                    value={String(limit)}
                    onValueChange={(value) => {
                      setLimit(Number(value));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 / page</SelectItem>
                      <SelectItem value="20">20 / page</SelectItem>
                      <SelectItem value="50">50 / page</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!meta.hasPreviousPage || isPending}
                    onClick={() => setPage((previous) => Math.max(previous - 1, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!meta.hasNextPage || isPending}
                    onClick={() => setPage((previous) => previous + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <InviteMemberDetailsSheet
        invitation={selectedInvitation}
        open={detailsOpen}
        isLoading={detailQuery.isPending}
        canResend={canResendInvitations && !isResending}
        canCancel={canCancelInvitations && !isCancelling}
        getOrganizationName={getOrganizationName}
        getInviterName={getInviterName}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelectedInvitationId(null);
        }}
        onResend={(id) => void handleResend(id)}
        onCancel={(id) => void handleCancel(id)}
      />
    </div>
  );
}
