'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Clock,
  ClipboardList,
  Plus,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { ROUTES } from '@/common/constant/routes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { useTenant } from '@/providers';
import { useAppSelector } from '@/store';
import type {
  TicketRequestListMeta,
  TicketRequestListQuery,
} from '../../../../services/ticket/types/ticket-request.types';
import { TicketRequestCreateForm } from './ticket-request-create-form';
import { TicketRequestFilters } from './ticket-request-filters';
import { TicketRequestListTable } from './ticket-request-list-table';
import {
  dateInputToIso,
  getTicketEffortOwners,
  isOrgAdminRoleName,
  shouldUseDedicatedOtPage,
} from './ticket-request-utils';
import {
  useTicketRequestActions,
  useTicketRequestCatalogData,
  useTicketRequestMemberOptions,
  useTicketRequestsData,
} from '../hooks/use-ticket-requests';
import { useOtProjectOptionsQuery } from '../query/ticket-requests.queries';

const DEFAULT_FILTERS: TicketRequestListQuery = {
  page: 1,
  limit: 10,
  sortBy: 'updatedAt',
  sortOrder: 'DESC',
  search: '',
  status: undefined,
  type: undefined,
  workflowCode: undefined,
  currentStepCode: undefined,
  requestTypeCode: undefined,
  fromDate: undefined,
  toDate: undefined,
};

const SKELETON_META: TicketRequestListMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

type WorkspaceTab = 'list' | 'create' | 'create-ot';

interface TicketRequestsWorkspaceProps {
  initialWorkspaceTab?: 'list' | 'create';
}

interface TicketRequestsListLoadingStateProps {
  showScopeTabs: boolean;
  showCreateButton: boolean;
  showCreateOtButton: boolean;
}

function TicketRequestsListLoadingState({
  showScopeTabs,
  showCreateButton,
  showCreateOtButton,
}: TicketRequestsListLoadingStateProps) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="bg-card flex items-center justify-between rounded-lg border px-4 py-6"
          >
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-14" />
            </div>
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {showScopeTabs && (
            <div className="flex items-center gap-2 rounded-lg border p-1">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showCreateButton && <Skeleton className="h-9 w-28" />}
          {showCreateOtButton && <Skeleton className="h-9 w-32" />}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
        <Skeleton className="h-4 w-28" />
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Skeleton className="h-10 w-full md:w-[200px]" />
          <Skeleton className="h-10 w-full md:w-[350px]" />
          <div className="hidden flex-1 md:block" />
          <div className="flex w-full gap-2 md:w-auto">
            <Skeleton className="h-10 flex-1 md:w-[350px]" />
            <Skeleton className="h-10 w-10 shrink-0" />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-44" />
        </CardHeader>
        <CardContent>
          <TicketRequestListTable
            tickets={[]}
            meta={SKELETON_META}
            selectedTicketId={null}
            canView={false}
            isPending
            isError={false}
            errorMessage={null}
            onView={() => undefined}
            onPageChange={() => undefined}
          />
        </CardContent>
      </Card>
    </>
  );
}

export function TicketRequestsWorkspace({
  initialWorkspaceTab = 'list',
}: TicketRequestsWorkspaceProps) {
  const t = useTranslations('ticket');
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { tenantSlug } = useTenant();
  const profile = useAppSelector((state) => state.user.profile);
  const hasSystemRole = useAppSelector((state) => state.user.rbacHasSystemRole);
  const rbacPermissionsLoaded = useAppSelector((state) => state.user.rbacPermissionsLoaded);

  const canListOwn = useCan(PERMISSIONS.TICKET_REQUESTS_LIST_OWN);
  const canListOrg = useCan(PERMISSIONS.TICKET_REQUESTS_LIST_ORG);
  const canView = useCan(PERMISSIONS.TICKET_REQUESTS_VIEW);
  const canDelegate = useCan(PERMISSIONS.TICKET_REQUESTS_DELEGATE);
  const canCreateOvertime = useCan(PERMISSIONS.TICKET_REQUESTS_CREATE_OVERTIME);

  const isManageOnlyOrgAdmin = hasSystemRole && canListOrg;
  const isOrgAdmin = isOrgAdminRoleName(profile?.role);
  const canCreate = useCan(PERMISSIONS.TICKET_REQUESTS_CREATE);
  const canReadTicketList = canListOwn || canListOrg;
  const canAccessWorkspace = canCreate || canReadTicketList;

  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>(initialWorkspaceTab);
  const [scopePreference, setScopePreference] = useState<'my' | 'all'>(
    isManageOnlyOrgAdmin ? 'all' : 'my',
  );
  const [filters, setFilters] = useState<TicketRequestListQuery>(() => {
    return {
      ...DEFAULT_FILTERS,
      search: searchParams.get('search') ?? DEFAULT_FILTERS.search,
      status: (searchParams.get('status') as TicketRequestListQuery['status']) || DEFAULT_FILTERS.status,
      fromDate: searchParams.get('fromDate') ?? DEFAULT_FILTERS.fromDate,
      toDate: searchParams.get('toDate') ?? DEFAULT_FILTERS.toDate,
      page: Number(searchParams.get('page')) || DEFAULT_FILTERS.page,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    let hasChanges = false;

    const setOrDelete = (key: string, value: string | number | undefined | null) => {
      const current = params.get(key);
      const strValue = value ? String(value) : '';

      if (strValue && current !== strValue) {
        params.set(key, strValue);
        hasChanges = true;
      } else if (!strValue && current) {
        params.delete(key);
        hasChanges = true;
      }
    };

    setOrDelete('search', filters.search);
    setOrDelete('status', filters.status);
    setOrDelete('fromDate', filters.fromDate);
    setOrDelete('toDate', filters.toDate);
    setOrDelete('page', (filters.page ?? 1) > 1 ? filters.page : null);

    if (hasChanges) {
      const nextQuery = params.toString();
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      const currentUrl = `${window.location.pathname}${window.location.search}`;

      if (currentUrl !== nextUrl) {
        window.history.replaceState(window.history.state, '', nextUrl);
      }
    }
  }, [filters, pathname, searchParams]);

  const canOpenCreatePage = canCreate && !isManageOnlyOrgAdmin;
  const { data: projectOptions = [], isPending: isProjectOptionsLoading } =
    useOtProjectOptionsQuery(
      rbacPermissionsLoaded &&
        canAccessWorkspace &&
        canCreateOvertime &&
        !isOrgAdmin,
    );
  const canShowCreateOtButton = canCreateOvertime && !isOrgAdmin;
  const canOpenCreateOtPage = canShowCreateOtButton && projectOptions.length > 0;

  useEffect(() => {
    setWorkspaceTab(initialWorkspaceTab);
  }, [initialWorkspaceTab]);

  useEffect(() => {
    if (!rbacPermissionsLoaded) return;

    if (!canOpenCreatePage && workspaceTab === 'create') {
      setWorkspaceTab('list');
    }

    if (
      !isProjectOptionsLoading &&
      !canOpenCreateOtPage &&
      workspaceTab === 'create-ot'
    ) {
      setWorkspaceTab('list');
    }
  }, [
    rbacPermissionsLoaded,
    canOpenCreateOtPage,
    canOpenCreatePage,
    isProjectOptionsLoading,
    workspaceTab,
  ]);

  useEffect(() => {
    if (isManageOnlyOrgAdmin && scopePreference !== 'all') {
      setScopePreference('all');
    }
  }, [isManageOnlyOrgAdmin, scopePreference]);

  const scope = useMemo<'my' | 'all'>(() => {
    if (isManageOnlyOrgAdmin) return 'all';
    return scopePreference;
  }, [isManageOnlyOrgAdmin, scopePreference]);

  const normalizedFilters = useMemo<TicketRequestListQuery>(() => {
    const fromDate = filters.fromDate
      ? dateInputToIso(filters.fromDate, 'start')
      : undefined;
    const toDate = filters.toDate ? dateInputToIso(filters.toDate, 'end') : undefined;

    return { ...filters, fromDate, toDate };
  }, [filters]);

  const listQueryScope: 'my' | 'manage' =
    isManageOnlyOrgAdmin || canListOrg ? 'manage' : 'my';

  const scopedFilters = useMemo<TicketRequestListQuery>(() => {
    if (scope === 'my') {
      return { ...normalizedFilters, requesterId: profile?.id ?? undefined };
    }

    return { ...normalizedFilters, requesterId: undefined };
  }, [normalizedFilters, profile?.id, scope]);

  const listData = useTicketRequestsData(
    listQueryScope,
    scopedFilters,
    canListOrg,
    rbacPermissionsLoaded && canReadTicketList,
  );
  const needsMemberOptions = workspaceTab === 'create' || workspaceTab === 'create-ot';
  const memberOptionsData = useTicketRequestMemberOptions(
    rbacPermissionsLoaded && needsMemberOptions,
    hasSystemRole,
  );
  const catalogData = useTicketRequestCatalogData(
    rbacPermissionsLoaded && needsMemberOptions,
  );
  const actions = useTicketRequestActions();

  const pendingCount = useMemo(
    () => listData.tickets.filter((ticket) => ticket.status === 'pending_approval').length,
    [listData.tickets],
  );

  const needActionCount = useMemo(
    () =>
      listData.tickets.filter(
        (ticket) =>
          (ticket.status === 'pending_approval' && ticket.delegate?.id === profile?.id) ||
          (ticket.status === 'changes_requested' &&
            (ticket.requester.id === profile?.id ||
              (getTicketEffortOwners(ticket).length > 0
                ? getTicketEffortOwners(ticket).some((owner) => owner.id === profile?.id)
                : ticket.requester.id === profile?.id))),
      ).length,
    [listData.tickets, profile?.id],
  );

  const handleViewTicket = (ticketId: string) => {
    if (!canView || !tenantSlug) return;
    const ticket = listData.tickets.find((item) => item.id === ticketId);
    if (ticket && shouldUseDedicatedOtPage(ticket)) {
      router.push(ROUTES.tenant.ticketDeclareOt(tenantSlug, ticketId));
      return;
    }

    router.push(ROUTES.tenant.ticketDetail(tenantSlug, ticketId));
  };

  const handleCreateSuccess = (ticketId: string) => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    setWorkspaceTab('list');

    if (tenantSlug) {
      router.push(
        canView
          ? workspaceTab === 'create-ot'
            ? ROUTES.tenant.ticketDeclareOt(tenantSlug, ticketId)
            : ROUTES.tenant.ticketDetail(tenantSlug, ticketId)
          : ROUTES.tenant.ticketList(tenantSlug),
      );
    }
  };

  const isListView =
    workspaceTab === 'list' || (!canOpenCreatePage && !canOpenCreateOtPage);
  const listTitle =
    scope === 'my'
      ? t('workspace.scopeTabs.my')
      : t('workspace.scopeTabs.all');

  if (!rbacPermissionsLoaded) {
    return (
      <div className="space-y-4">
        <TicketRequestsListLoadingState
          showScopeTabs={false}
          showCreateButton={false}
          showCreateOtButton={false}
        />
      </div>
    );
  }

  if (!canAccessWorkspace) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>{t('workspace.permissions.title')}</AlertTitle>
        <AlertDescription>
          {t('pages.detail.requiredPermission')} <code>{PERMISSIONS.TICKET_REQUESTS_CREATE}</code>,{' '}
          <code>{PERMISSIONS.TICKET_REQUESTS_LIST_OWN}</code> or{' '}
          <code>{PERMISSIONS.TICKET_REQUESTS_LIST_ORG}</code>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {isListView && listData.isPending ? (
        <TicketRequestsListLoadingState
          showScopeTabs={!isManageOnlyOrgAdmin}
          showCreateButton={canOpenCreatePage}
          showCreateOtButton={canShowCreateOtButton}
        />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="bg-card flex items-center justify-between rounded-lg border px-4 py-6">
              <div>
                <p className="text-muted-foreground text-xs">{t('workspace.stats.total')}</p>
                <p className="text-lg leading-tight font-semibold">{listData.meta.total}</p>
              </div>
              <ClipboardList className="text-muted-foreground h-4 w-4" />
            </div>
            <div className="bg-card flex items-center justify-between rounded-lg border px-4 py-6">
              <div>
                <p className="text-muted-foreground text-xs">{t('workspace.stats.pending')}</p>
                <p className="text-lg leading-tight font-semibold">{pendingCount}</p>
              </div>
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
              >
                {t('workspace.stats.pending')}
              </Badge>
            </div>
            <div className="bg-card flex items-center justify-between rounded-lg border px-4 py-6">
              <div>
                <p className="text-muted-foreground text-xs">{t('workspace.stats.changesRequested')}</p>
                <p className="text-lg leading-tight font-semibold">{needActionCount}</p>
              </div>
              <Users
                className={`h-4 w-4 ${needActionCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {!isManageOnlyOrgAdmin && isListView && (
                <Tabs
                  value={scope}
                  onValueChange={(value) => {
                    setScopePreference(value as 'my' | 'all');
                    setFilters((prev) => ({ ...prev, page: 1 }));
                  }}
                >
                  <TabsList>
                    <TabsTrigger value="my">{t('workspace.scopeTabs.my')}</TabsTrigger>
                    <TabsTrigger value="all">{t('workspace.scopeTabs.all')}</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}

              {!isListView && (
                <Button variant="outline" size="sm" onClick={() => setWorkspaceTab('list')}>
                  {t('pages.detail.backToList')}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {canOpenCreatePage && isListView && (
                <Button size="sm" variant="outline" onClick={() => setWorkspaceTab('create')}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  {t('workspace.actions.newRequest')}
                </Button>
              )}
              {canOpenCreateOtPage && isListView && (
                <Button size="sm" onClick={() => setWorkspaceTab('create-ot')}>
                  <Clock className="mr-1.5 h-4 w-4" />
                  {t('workspace.actions.newOtRequest')}
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {isListView && !listData.isPending && (
        <>
          {/* {(memberOptionsData.isError || catalogData.isError) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('workspace.metadataUnavailableTitle')}</AlertTitle>
              <AlertDescription>
                {memberOptionsData.errorMessage ??
                  catalogData.errorMessage ??
                  'Cannot load ticket metadata right now.'}
              </AlertDescription>
            </Alert>
          )} */}

          <TicketRequestFilters
            filters={filters}
            isPending={listData.isPending}
            onFiltersChange={setFilters}
          />

          <Card>
            <CardHeader>
              <CardTitle>{listTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketRequestListTable
                tickets={listData.tickets}
                meta={listData.meta}
                selectedTicketId={null}
                canView={canView}
                isPending={listData.isPending}
                isError={listData.isError}
                errorMessage={listData.errorMessage}
                onView={handleViewTicket}
                onPageChange={(nextPage) =>
                  setFilters((prev) => ({ ...prev, page: nextPage }))
                }
              />
            </CardContent>
          </Card>
        </>
      )}

      {canOpenCreatePage && workspaceTab === 'create' && (
        <>
          {/* {(memberOptionsData.isError || catalogData.isError) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('workspace.metadataUnavailableTitle')}</AlertTitle>
              <AlertDescription>
                {memberOptionsData.errorMessage ??
                  catalogData.errorMessage ??
                  'Cannot load ticket metadata right now.'}
              </AlertDescription>
            </Alert>
          )} */}

          <TicketRequestCreateForm
            mode="normal"
            requesterId={profile?.id ?? null}
            isPending={actions.isCreating}
            canDelegate={canDelegate}
            memberOptions={memberOptionsData.options}
            requestTypes={catalogData.requestTypes}
            reasonOptions={catalogData.reasons}
            onSubmit={actions.createTicket}
            onSuccess={handleCreateSuccess}
          />
        </>
      )}

      {canOpenCreateOtPage && workspaceTab === 'create-ot' && (
        <>
          {/* {(memberOptionsData.isError || catalogData.isError) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('workspace.metadataUnavailableTitle')}</AlertTitle>
              <AlertDescription>
                {memberOptionsData.errorMessage ??
                  catalogData.errorMessage ??
                  'Cannot load ticket metadata right now.'}
              </AlertDescription>
            </Alert>
          )} */}

          <TicketRequestCreateForm
            mode="overtime"
            requesterId={profile?.id ?? null}
            isPending={actions.isCreatingOvertime}
            memberOptions={memberOptionsData.options}
            requestTypes={catalogData.requestTypes}
            reasonOptions={catalogData.reasons}
            projectOptions={projectOptions}
            isProjectOptionsLoading={isProjectOptionsLoading}
            onSubmit={actions.createTicket}
            onSubmitOvertime={actions.createOvertimeTicket}
            onSuccess={handleCreateSuccess}
          />
        </>
      )}
    </div>
  );
}
