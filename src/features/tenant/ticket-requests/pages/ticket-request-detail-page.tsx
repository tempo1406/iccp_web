'use client';

import Link from 'next/link';
import { startTransition, useEffect } from 'react';
import { ArrowLeft, ClipboardList, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ROUTES } from '@/common/constant/routes';
import { PageHeader } from '@/components/layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { useTenant } from '@/providers';
import { useAppSelector } from '@/store';
import { useOtProjectOptionsQuery } from '../query/ticket-requests.queries';
import {
  useTicketRequestActions,
  useTicketRequestCatalogData,
  useTicketRequestComments,
  useTicketRequestDetail,
  useTicketRequestMemberOptions,
} from '../hooks/use-ticket-requests';
import {
  TicketRequestRequestTypeBadge,
  TicketRequestStatusBadge,
} from '../components/ticket-request-badges';
import { TicketRequestDetailPanel } from '../components/ticket-request-detail-panel';
import { TicketRequestSidebar } from '../components/ticket-request-sidebar';
import {
  formatTicketDateTime,
  formatTicketUser,
  isOrgAdminRoleName,
  shouldUseDedicatedOtPage,
} from '../components/ticket-request-utils';

interface TicketRequestDetailPageProps {
  ticketId: string;
}

export function TicketRequestDetailPage({ ticketId }: TicketRequestDetailPageProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('ticket');
  const { tenantSlug } = useTenant();
  const tenantRoute = tenantSlug ?? '';
  const profile = useAppSelector((state) => state.user.profile);
  const hasSystemRole = useAppSelector((state) => state.user.rbacHasSystemRole);
  const rbacPermissionsLoaded = useAppSelector(
    (state) => state.user.rbacPermissionsLoaded,
  );

  const canView = useCan(PERMISSIONS.TICKET_REQUESTS_VIEW);
  const canDelegate = useCan(PERMISSIONS.TICKET_REQUESTS_DELEGATE);
  const canComment = useCan(PERMISSIONS.TICKET_REQUESTS_COMMENT);
  const canCreate = useCan(PERMISSIONS.TICKET_REQUESTS_CREATE);
  const canCreateOvertime = useCan(PERMISSIONS.TICKET_REQUESTS_CREATE_OVERTIME);
  const isOrgAdmin = isOrgAdminRoleName(profile?.role);
  const canShowCreateOtEntry = canCreateOvertime && !isOrgAdmin;

  const detailData = useTicketRequestDetail(ticketId, rbacPermissionsLoaded && canView);
  const commentsData = useTicketRequestComments(ticketId, rbacPermissionsLoaded && canView);
  const memberOptionsData = useTicketRequestMemberOptions(
    rbacPermissionsLoaded && canView,
    hasSystemRole,
  );
  const catalogData = useTicketRequestCatalogData(rbacPermissionsLoaded && canView);
  const actions = useTicketRequestActions();
  const { data: projectOptions = [] } = useOtProjectOptionsQuery(
    rbacPermissionsLoaded && canShowCreateOtEntry,
  );
  const ticketSummary = detailData.ticket;
  const shouldRedirectToOt =
    Boolean(tenantSlug) &&
    (ticketSummary ? shouldUseDedicatedOtPage(ticketSummary) : false);

  useEffect(() => {
    if (!tenantSlug || !ticketSummary) return;
    if (!shouldUseDedicatedOtPage(ticketSummary)) return;

    startTransition(() => {
      router.replace(ROUTES.tenant.ticketDeclareOt(tenantSlug, ticketSummary.id));
    });
  }, [router, tenantSlug, ticketSummary]);

  const navigateToList = () => {
    if (!tenantSlug) return;
    startTransition(() => {
      router.push(ROUTES.tenant.ticketList(tenantSlug));
    });
  };

  if (!rbacPermissionsLoaded) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('pages.detail.title')}
          description={t('common.loading')}
          breadcrumbs={[
            { label: t('common.dashboard'), href: ROUTES.tenant.dashboard(tenantRoute) },
            { label: t('common.ticket'), href: ROUTES.tenant.ticketList(tenantRoute) },
            { label: t('common.detail') },
          ]}
        />
        <Card className="border-border/70">
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            {t('pages.detail.loadingPermissions')}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canView) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>{t('pages.detail.noPermissionTitle')}</AlertTitle>
        <AlertDescription>
          {t('pages.detail.requiredPermission')} <code>{PERMISSIONS.TICKET_REQUESTS_VIEW}</code>
        </AlertDescription>
      </Alert>
    );
  }

  if (detailData.isPending) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('pages.detail.title')}
          description={t('common.loading')}
          breadcrumbs={[
            { label: t('common.dashboard'), href: ROUTES.tenant.dashboard(tenantRoute) },
            { label: t('common.ticket'), href: ROUTES.tenant.ticketList(tenantRoute) },
            { label: t('common.detail') },
          ]}
        />
        <Card className="border-border/70">
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            {t('pages.detail.loadingDetails')}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (detailData.isError || !detailData.ticket) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('pages.detail.title')}
          breadcrumbs={[
            { label: t('common.dashboard'), href: ROUTES.tenant.dashboard(tenantRoute) },
            { label: t('common.ticket'), href: ROUTES.tenant.ticketList(tenantRoute) },
            { label: t('common.detail') },
          ]}
          actions={
            <Button variant="outline" asChild>
              <Link href={ROUTES.tenant.ticketList(tenantRoute)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('pages.detail.backToList')}
              </Link>
            </Button>
          }
        />
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>{t('pages.detail.loadFailedTitle')}</AlertTitle>
          <AlertDescription>
            {detailData.errorMessage ?? t('pages.detail.loadFailedDescription')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (shouldRedirectToOt) {
    return (
      <Card className="border-border/70">
        <CardContent className="py-14 text-center text-sm text-muted-foreground">
          {t('pages.detail.redirectingOt')}
        </CardContent>
      </Card>
    );
  }

  const ticket = detailData.ticket;

  const requestTypeLabel =
    ticket.requestTypeName ??
    catalogData.requestTypes.find((item) => item.code === ticket.requestTypeCode)?.label ??
    ticket.requestTypeCode ??
    '-';

  const reasonLabel =
    catalogData.reasons.find((item) => item.code === ticket.reasonCode)?.label ??
    ticket.reasonCode ??
    '-';

  return (
    <div className="space-y-4 pb-6">
      <PageHeader
        title={ticket.title}
        description={`${ticket.code} | ${formatTicketUser(ticket.requester)} | ${formatTicketDateTime(ticket.createdAt, locale)}`}
        breadcrumbs={[
          { label: t('common.dashboard'), href: ROUTES.tenant.dashboard(tenantRoute) },
          { label: t('common.ticket'), href: ROUTES.tenant.ticketList(tenantRoute) },
          { label: ticket.code },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canCreate ? (
              <Button variant="outline" asChild>
                <Link href={ROUTES.tenant.ticketCreate(tenantRoute)}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  {t('pages.detail.newRequest')}
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link href={ROUTES.tenant.ticketList(tenantRoute)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('pages.detail.backToList')}
              </Link>
            </Button>
          </div>
        }
      />

      {/* Status + type badges row */}
      <div className="flex flex-wrap items-center gap-2">
        <TicketRequestStatusBadge status={ticket.status} />
        <TicketRequestRequestTypeBadge
          type={ticket.type}
          label={requestTypeLabel}
          className="text-xs"
        />
      </div>

      {/* Main layout */}
      <div className="grid gap-6 xl:grid-cols-12 xl:items-start">
        {/* Left: ticket content + activity feed */}
        <div className="xl:col-span-8">
          <TicketRequestDetailPanel
            key={ticket.id}
            ticket={ticket}
            comments={commentsData.comments}
            isCommentsPending={commentsData.isPending}
            canComment={canComment}
            isAddingComment={actions.isAddingComment}
            projectOptions={projectOptions}
            onAddComment={actions.addComment}
          />
        </div>

        {/* Right: sidebar â€” status, actions, properties, CC */}
        <div className="xl:col-span-4">
          <TicketRequestSidebar
            ticket={ticket}
            requestTypeLabel={requestTypeLabel}
            reasonLabel={reasonLabel}
            currentUserId={profile?.id ?? null}
            currentUserEmail={profile?.email ?? null}
            canDelegate={canDelegate}
            canManageCcPermission={false}
            declareOtHref={
              tenantSlug ? ROUTES.tenant.ticketDeclareOt(tenantSlug, ticket.id) : undefined
            }
            isMutating={actions.isMutating}
            isApproving={actions.isApproving}
            isRejecting={actions.isRejecting}
            isRequestingChanges={actions.isRequestingChanges}
            isUpdatingCc={actions.isUpdatingCc}
            memberOptions={memberOptionsData.options}
            requestTypes={catalogData.requestTypes}
            reasonOptions={catalogData.reasons}
            onResubmit={actions.updateTicket}
            onCancel={async (nextTicketId) => {
              const result = await actions.cancelTicket(nextTicketId);
              if (result.ok) navigateToList();
              return result;
            }}
            onApprove={async (nextTicketId, body) => {
              const result = await actions.approveTicket(nextTicketId, body);
              if (result.ok) navigateToList();
              return result;
            }}
            onReject={async (nextTicketId, body) => {
              const result = await actions.rejectTicket(nextTicketId, body);
              if (result.ok) navigateToList();
              return result;
            }}
            onRequestChanges={async (nextTicketId, body) => {
              const result = await actions.requestChanges(nextTicketId, body);
              if (result.ok) navigateToList();
              return result;
            }}
            onAddCcMembers={actions.addCcMembers}
            onRemoveCcMember={actions.removeCcMember}
          />
        </div>
      </div>
    </div>
  );
}
