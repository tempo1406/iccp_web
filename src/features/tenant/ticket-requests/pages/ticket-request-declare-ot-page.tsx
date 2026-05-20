'use client';

import Link from 'next/link';
import { startTransition, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  FolderOpen,
  Loader2,
  Plus,
  ShieldAlert,
  Trash2,
  User,
} from 'lucide-react';
import { ROUTES } from '@/common/constant/routes';
import { PageHeader } from '@/components/layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { useTenant } from '@/providers';
import { useAppSelector } from '@/store';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import {
  useTicketRequestActions,
  useTicketRequestCatalogData,
  useTicketRequestDetail,
  useTicketRequestMemberOptions,
} from '../hooks/use-ticket-requests';
import {
  type TicketDecisionDelegateOption,
  TicketRequestDecisionDialog,
} from '../components/ticket-request-decision-dialog';
import { TicketRequestEditorDialog } from '../components/ticket-request-editor-dialog';
import {
  TicketRequestRequestTypeBadge,
  TicketRequestStatusBadge,
} from '../components/ticket-request-badges';
import {
  formatTicketDate,
  formatTicketDateTime,
  formatTicketUser,
  formatTicketUsers,
  getTicketActionAccess,
  getTicketEffortOwners,
  getTicketStepLabel,
  resolveTicketDelegate,
} from '../components/ticket-request-utils';
import type {
  DeclareOtEffortBody,
  OtEffortEntry,
  UpdateTicketRequestBody,
} from '@/services/ticket/types/ticket-request.types';

interface TicketRequestDeclareOtPageProps {
  ticketId: string;
}

interface EntryRow extends OtEffortEntry {
  _key: string;
}

function makeKey(): string {
  return Math.random().toString(36).slice(2);
}

function emptyEntry(): EntryRow {
  return {
    _key: makeKey(),
    date: '',
    hours: 0,
    taskDescription: '',
    workDescription: '',
  };
}

function fmtH(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
}

function toDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getTodayDateString(): string {
  return toDateOnly(new Date().toISOString()) ?? '';
}

function showValidationError(
  setErrorMessage: (message: string | null) => void,
  message: string,
): void {
  setErrorMessage(message);
  toast.danger(message);
}

function SummaryStat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="rounded-[22px] border border-border/70 bg-background/90 px-3 py-3 text-center shadow-sm">
      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className={cn('mt-2 text-xl font-semibold tabular-nums text-foreground', className)}>
        {value}
      </p>
    </div>
  );
}

function MetaTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FolderOpen;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-border/70 bg-background/90 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function TicketRequestDeclareOtPage({
  ticketId,
}: TicketRequestDeclareOtPageProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('ticket');
  const tSteps = useTranslations('ticket.labels.steps');
  const { tenantSlug } = useTenant();
  const tenantRoute = tenantSlug ?? '';
  const profile = useAppSelector((state) => state.user.profile);
  const hasSystemRole = useAppSelector((state) => state.user.rbacHasSystemRole);
  const rbacPermissionsLoaded = useAppSelector(
    (state) => state.user.rbacPermissionsLoaded,
  );

  const canView = useCan(PERMISSIONS.TICKET_REQUESTS_VIEW);
  const canDelegate = useCan(PERMISSIONS.TICKET_REQUESTS_DELEGATE);

  const detailData = useTicketRequestDetail(ticketId, rbacPermissionsLoaded && canView);
  const memberOptionsData = useTicketRequestMemberOptions(
    rbacPermissionsLoaded && canView,
    hasSystemRole,
  );
  const catalogData = useTicketRequestCatalogData(rbacPermissionsLoaded && canView);
  const actions = useTicketRequestActions();

  const [entries, setEntries] = useState<EntryRow[]>([emptyEntry()]);
  const [effortDetail, setEffortDetail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openResubmit, setOpenResubmit] = useState(false);
  const [openReject, setOpenReject] = useState(false);
  const [openRequestChanges, setOpenRequestChanges] = useState(false);
  const [hasActioned, setHasActioned] = useState(false);

  const autoSum = useMemo(
    () =>
      entries.reduce((sum, entry) => {
        const hours = Number(entry.hours);
        return sum + (Number.isFinite(hours) && hours > 0 ? hours : 0);
      }, 0),
    [entries],
  );

  const navigateToList = () => {
    if (!tenantSlug) return;
    startTransition(() => {
      router.push(ROUTES.tenant.ticketList(tenantSlug));
    });
  };

  if (!rbacPermissionsLoaded) {
    return (
      <Card className="border-border/70">
        <CardContent className="py-14 text-center text-sm text-muted-foreground">
          {t('pages.declareOt.loadingPermissions')}
        </CardContent>
      </Card>
    );
  }

  if (!canView) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>{t('pages.declareOt.noPermissionTitle')}</AlertTitle>
        <AlertDescription>
          {t('pages.detail.requiredPermission')} <code>{PERMISSIONS.TICKET_REQUESTS_VIEW}</code>
        </AlertDescription>
      </Alert>
    );
  }

  if (detailData.isPending || !detailData.ticket) {
    return (
      <Card className="border-border/70">
        <CardContent className="py-14 text-center text-sm text-muted-foreground">
          {detailData.isPending
            ? t('pages.declareOt.loadingDetails')
            : (detailData.errorMessage ?? t('pages.declareOt.loadFailedDescription'))}
        </CardContent>
      </Card>
    );
  }

  const ticket = detailData.ticket;
  if (ticket.type !== 'overtime') {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>{t('pages.declareOt.notOvertimeTitle')}</AlertTitle>
        <AlertDescription>
          {t('pages.declareOt.notOvertimeDescription')}
        </AlertDescription>
      </Alert>
    );
  }

  const actionAccess = getTicketActionAccess({
    ticket,
    currentUserId: profile?.id ?? null,
    currentUserEmail: profile?.email ?? null,
    canDelegatePermission: canDelegate,
    canManageCcPermission: false,
  });
  const currentDelegate = resolveTicketDelegate(ticket);
  const effortOwners = getTicketEffortOwners(ticket);
  const requestTypeLabel =
    ticket.requestTypeName ??
    catalogData.requestTypes.find((item) => item.code === ticket.requestTypeCode)?.label ??
    ticket.requestTypeCode ??
    '-';
  const existingEntries = ticket.otMetadata?.effortEntries ?? [];
  const loggedHours = actionAccess.canDeclareOt
    ? autoSum
    : (ticket.otMetadata?.totalActualHours ?? 0);
  const plannedHours = ticket.otMetadata?.plannedHours ?? null;
  const plannedDelta = plannedHours != null ? loggedHours - plannedHours : null;
  const isOver = plannedDelta != null && plannedDelta > 0;
  const isUnder = plannedDelta != null && plannedDelta < 0;
  const ticketStartDate = toDateOnly(ticket.startAt);
  const ticketEndDate = toDateOnly(ticket.endAt);
  const todayDate = getTodayDateString();
  const minEntryDate =
    ticketStartDate && ticketStartDate > todayDate ? ticketStartDate : todayDate;
  const maxEntryDate = ticketEndDate;
  const delegateDecisionOptions = memberOptionsData.options
    .filter((member) => member.canApprove && member.id !== (currentDelegate?.id ?? ''))
    .map<TicketDecisionDelegateOption>((member) => ({
      id: member.id,
      label: member.label,
    }));
  const hasActions =
    actionAccess.canDeclareOt ||
    actionAccess.canResubmit ||actionAccess.canDeclareOt ||
    actionAccess.canCancel ||
    actionAccess.canApprove ||
    actionAccess.canReject ||
    actionAccess.canRequestChanges;

  const updateEntry = (
    key: string,
    field: keyof OtEffortEntry,
    value: string | number,
  ) => {
    setEntries((previous) =>
      previous.map((entry) => (entry._key === key ? { ...entry, [field]: value } : entry)),
    );
  };

  const handleSubmit = async () => {
    const validEntries = entries.filter(
      (entry) => entry.date.trim() && entry.hours > 0 && entry.taskDescription.trim(),
    );
    if (validEntries.length === 0) {
      showValidationError(setErrorMessage, t('declareOt.validation.entryRequired'));
      return;
    }

    if (!autoSum || autoSum <= 0) {
      showValidationError(setErrorMessage, t('declareOt.validation.totalHoursRequired'));
      return;
    }

    const perDayHours = new Map<string, number>();

    for (const entry of validEntries) {
      if (entry.hours > 4) {
        showValidationError(setErrorMessage, t('declareOt.validation.singleDayExceeded'));
        return;
      }

      if (entry.date < minEntryDate || (maxEntryDate && entry.date > maxEntryDate)) {
        showValidationError(setErrorMessage, t('declareOt.validation.dateOutOfRange'));
        return;
      }

      perDayHours.set(entry.date, (perDayHours.get(entry.date) ?? 0) + entry.hours);
    }

    if ([...perDayHours.values()].some((hours) => hours > 4)) {
      showValidationError(setErrorMessage, t('declareOt.validation.perDayExceeded'));
      return;
    }

    const body: DeclareOtEffortBody = {
      effortEntries: validEntries.map((entry) => ({
        date: entry.date,
        hours: Number(entry.hours),
        taskDescription: entry.taskDescription.trim(),
        workDescription: entry.workDescription?.trim() || undefined,
      })),
      totalActualHours: autoSum,
      effortDetail: effortDetail.trim() || undefined,
    };

    setErrorMessage(null);
    const result = await actions.declareOtEffort(ticket.id, body);
    if (result.ok) {
      setEntries([emptyEntry()]);
      setEffortDetail('');
    }
  };

  const handleApprove = async () => {
    const result = await actions.approveTicket(ticket.id, {});
    if (result.ok) {
      setHasActioned(true);
      navigateToList();
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <PageHeader
        title={t('pages.declareOt.workspaceTitle')}
        description={`${ticket.code} | ${ticket.title} | ${formatTicketUser(ticket.requester)}`}
        breadcrumbs={[
          { label: t('common.dashboard'), href: ROUTES.tenant.dashboard(tenantRoute) },
          { label: t('common.ticket'), href: ROUTES.tenant.ticketList(tenantRoute) },
          { label: ticket.code },
          { label: t('pages.declareOt.breadcrumb') },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href={ROUTES.tenant.ticketList(tenantRoute)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('pages.declareOt.backToList')}
            </Link>
          </Button>
        }
      />

      <section className="overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-sm">
        <div className="border-b border-border/70 bg-gradient-to-br from-primary/8 via-transparent to-emerald-500/8 px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <TicketRequestStatusBadge status={ticket.status} />
                <TicketRequestRequestTypeBadge
                  type={ticket.type}
                  label={requestTypeLabel}
                  className="rounded-full px-3 py-1 text-xs"
                />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-[2rem]">
                  {ticket.title}
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {ticket.code} | {formatTicketDate(ticket.startAt, locale)} {t('common.to')}{' '}
                  {formatTicketDate(ticket.endAt, locale)}
                  {' | '}
                  {t('common.updated')} {formatTicketDateTime(ticket.updatedAt, locale)}
                </p>
              </div>
            </div>

            <div className="grid min-w-[280px] gap-2.5 sm:grid-cols-3">
              <SummaryStat label={t('declareOt.logged')} value={`${fmtH(loggedHours)}${t('common.hoursSuffix')}`} />
              <SummaryStat
                label={t('declareOt.planned')}
                value={
                  plannedHours != null
                    ? `${fmtH(plannedHours)}${t('common.hoursSuffix')}`
                    : t('common.notAvailable')
                }
              />
              <SummaryStat
                label={t('declareOt.variance')}
                value={
                  plannedDelta == null
                    ? t('common.notAvailable')
                    : plannedDelta > 0
                      ? `+${fmtH(plannedDelta)}${t('common.hoursSuffix')}`
                      : plannedDelta < 0
                        ? `-${fmtH(Math.abs(plannedDelta))}${t('common.hoursSuffix')}`
                        : `0${t('common.hoursSuffix')}`
                }
                className={
                  isOver
                    ? 'text-amber-600 dark:text-amber-400'
                    : isUnder
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : undefined
                }
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          {!actionAccess.canDeclareOt ? (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>
                {t('declareOt.readonlyAlertTitle', {
                  step: getTicketStepLabel(ticket.currentStepCode, tSteps),
                })}
              </AlertTitle>
              <AlertDescription>
                {existingEntries.length > 0
                  ? t('declareOt.readonlyAlertExisting')
                  : t('declareOt.readonlyAlertPending')}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetaTile
              icon={FolderOpen}
              label={t('declareOt.project')}
              value={
                ticket.otMetadata?.projectName ||
                ticket.otMetadata?.projectId ||
                t('common.notAvailable')
              }
            />
            <MetaTile
              icon={User}
              label={t('declareOt.requester')}
              value={formatTicketUser(ticket.requester)}
            />
            <MetaTile
              icon={User}
              label={t(
                effortOwners.length > 1 ? 'declareOt.effortOwners' : 'declareOt.effortOwner',
              )}
              value={formatTicketUsers(effortOwners)}
            />
            <MetaTile
              icon={Clock}
              label={t('declareOt.currentStep')}
              value={getTicketStepLabel(ticket.currentStepCode, tSteps)}
            />
          </div>

          <section className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {actionAccess.canDeclareOt
                  ? t('declareOt.sectionTitle')
                  : t('declareOt.readonlySectionTitle')}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {actionAccess.canDeclareOt
                  ? t('declareOt.sectionDescription')
                  : t('declareOt.readonlySectionDescription')}
              </p>
            </div>
            {actionAccess.canDeclareOt ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <CalendarDays className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {t('declareOt.entriesTitle')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('declareOt.entriesDescription')}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setEntries((previous) => [...previous, emptyEntry()])}
                    disabled={actions.isDeclaring}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('declareOt.addEntry')}
                  </Button>
                </div>

                <div className="space-y-4">
                  {entries.map((entry, index) => (
                    <div
                      key={entry._key}
                      className="rounded-[20px] border border-border/70 bg-background/90 p-3.5 shadow-sm"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                          {t('declareOt.entry', { index: index + 1 })}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            setEntries((previous) =>
                              previous.filter((item) => item._key !== entry._key),
                            )
                          }
                          disabled={actions.isDeclaring || entries.length <= 1}
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          {t('declareOt.remove')}
                        </Button>
                      </div>

                      <div className="grid gap-3 lg:grid-cols-[180px_120px_minmax(0,1fr)]">
                        <div className="space-y-1.5">
                          <Label>{t('declareOt.date')} <span className="text-destructive">*</span></Label>
                          <DatePicker
                            value={entry.date}
                            onChange={(value) => updateEntry(entry._key, 'date', value)}
                            disabled={actions.isDeclaring}
                            minDate={minEntryDate}
                            maxDate={maxEntryDate}
                            className="h-11"
                            placeholder={t('declareOt.pickDate')}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>{t('declareOt.hours')} <span className="text-destructive">*</span></Label>
                          <Input
                            type="number"
                            min={0.5}
                            max={4}
                            step={0.5}
                            value={entry.hours || ''}
                            onChange={(event) =>
                              updateEntry(entry._key, 'hours', parseFloat(event.target.value) || 0)
                            }
                            disabled={actions.isDeclaring}
                            className="h-11"
                            placeholder={t('declareOt.hoursPlaceholder')}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>{t('declareOt.taskCompleted')} <span className="text-destructive">*</span></Label>
                          <Input
                            value={entry.taskDescription}
                            onChange={(event) =>
                              updateEntry(entry._key, 'taskDescription', event.target.value)
                            }
                            disabled={actions.isDeclaring}
                            className="h-11"
                            placeholder={t('declareOt.taskPlaceholder')}
                          />
                        </div>
                      </div>

                      <div className="mt-2.5 space-y-1.5">
                        <Label>{t('declareOt.workDetails')}</Label>
                        <Textarea
                          value={entry.workDescription ?? ''}
                          onChange={(event) =>
                            updateEntry(entry._key, 'workDescription', event.target.value)
                          }
                          disabled={actions.isDeclaring}
                          placeholder={t('declareOt.workDetailsPlaceholder')}
                          rows={3}
                          className="resize-none rounded-2xl"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ot-effort-summary-page">{t('declareOt.effortSummary')}</Label>
                  <Textarea
                    id="ot-effort-summary-page"
                    value={effortDetail}
                    onChange={(event) => setEffortDetail(event.target.value)}
                    disabled={actions.isDeclaring}
                    placeholder={t('declareOt.effortSummaryPlaceholder')}
                    rows={5}
                    className="resize-none rounded-2xl"
                  />
                  <p className="text-xs leading-6 text-muted-foreground">
                    {t('declareOt.autoCalculated')}{' '}
                    <span className="font-medium">
                      {fmtH(autoSum)}
                      {t('common.hoursSuffix')}
                    </span>
                  </p>
                </div>
              </div>
            ) : existingEntries.length > 0 ? (
              <div className="space-y-4">
                {ticket.otMetadata?.effortDetail ? (
                  <div className="rounded-2xl border border-border/70 bg-background/90 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {t('declareOt.effortSummary')}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground">
                      {ticket.otMetadata.effortDetail}
                    </p>
                  </div>
                ) : null}

                {existingEntries.map((entry, index) => (
                  <div
                    key={`${entry.date}-${index}`}
                    className="rounded-[20px] border border-border/70 bg-background/90 p-3.5 shadow-sm"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <Badge variant="outline" className="rounded-full px-3 py-1">
                        {t('declareOt.entry', { index: index + 1 })}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">
                        {formatTicketDate(entry.date, locale)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {t('declareOt.logged')} {entry.hours}
                        {t('common.hoursSuffix')}
                      </span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5">
                        <p className="text-xs text-muted-foreground">
                          {t('declareOt.taskCompleted')}
                        </p>
                        <p className="mt-2 text-sm text-foreground">{entry.taskDescription}</p>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5">
                        <p className="text-xs text-muted-foreground">{t('declareOt.workDetails')}</p>
                        <p className="mt-2 text-sm text-foreground">
                          {entry.workDescription?.trim() || t('detailPanel.noAdditionalWorkDetail')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-border/70 bg-muted/10 px-5 py-8 text-sm text-muted-foreground">
                {t('declareOt.emptyReadonly')}
              </div>
            )}
          </section>

          {hasActions && !hasActioned ? (
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border/70 pt-4">
              {actionAccess.canApprove ? (
                <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={actions.isMutating}
                  onClick={() => void handleApprove()}
                >
                  {actions.isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t('sidebar.actions.approve')}
                </Button>
              ) : null}
              {actionAccess.canReject ? (
                <Button
                  className="bg-rose-600 text-white hover:bg-rose-700"
                  disabled={actions.isMutating}
                  onClick={() => setOpenReject(true)}
                >
                  {actions.isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t('sidebar.actions.reject')}
                </Button>
              ) : null}
              {actionAccess.canRequestChanges ? (
                <Button
                  className="bg-sky-600 text-white hover:bg-sky-700"
                  disabled={actions.isMutating}
                  onClick={() => setOpenRequestChanges(true)}
                >
                  {actions.isRequestingChanges ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {t('sidebar.actions.requestChanges')}
                </Button>
              ) : null}
              {actionAccess.canResubmit ? (
                <Button
                  disabled={actions.isMutating}
                  onClick={() => setOpenResubmit(true)}
                >
                  {t('sidebar.actions.updateResubmit')}
                </Button>
              ) : null}
              {actionAccess.canCancel ? (
                <Button
                  variant="outline"
                  disabled={actions.isMutating}
                  onClick={() => void actions.cancelTicket(ticket.id).then((result) => {
                    if (result.ok) navigateToList();
                  })}
                >
                  {t('declareOt.cancelRequest')}
                </Button>
              ) : null}
              {actionAccess.canDeclareOt ? (
                <Button
                  onClick={() => void handleSubmit()}
                  disabled={actions.isDeclaring}
                  className="min-w-40"
                >
                  {actions.isDeclaring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t('declareOt.submit')}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <TicketRequestEditorDialog
        key={`ot-resubmit-${ticket.id}-${openResubmit ? 'open' : 'closed'}`}
        open={openResubmit}
        mode="resubmit"
        ticket={ticket}
        requesterId={ticket.requester.id}
        isPending={actions.isMutating}
        memberOptions={memberOptionsData.options}
        requestTypes={catalogData.requestTypes.filter((item) => item.type === 'overtime')}
        reasonOptions={catalogData.reasons}
        onOpenChange={setOpenResubmit}
        onSubmit={(payload) => actions.updateTicket(ticket.id, payload as UpdateTicketRequestBody)}
      />

      <TicketRequestDecisionDialog
        open={openReject}
        title={t('declareOt.dialogs.rejectTitle')}
        description={t('declareOt.dialogs.rejectDescription')}
        confirmLabel={t('declareOt.dialogs.rejectConfirm')}
        inputLabel={t('declareOt.dialogs.rejectInputLabel')}
        inputPlaceholder={t('declareOt.dialogs.rejectInputPlaceholder')}
        isPending={actions.isRejecting}
        delegateOptions={delegateDecisionOptions}
        onOpenChange={setOpenReject}
        onConfirm={async (payload) => {
          const result = await actions.rejectTicket(ticket.id, {
            reason: payload.value,
            nextDelegateId: payload.nextDelegateId,
          });
          if (result.ok) {
            setHasActioned(true);
            navigateToList();
          }
          return result;
        }}
      />

      <TicketRequestDecisionDialog
        open={openRequestChanges}
        title={t('declareOt.dialogs.requestChangesTitle')}
        description={t('declareOt.dialogs.requestChangesDescription')}
        confirmLabel={t('declareOt.dialogs.requestChangesConfirm')}
        inputLabel={t('declareOt.dialogs.requestChangesInputLabel')}
        inputPlaceholder={t('declareOt.dialogs.requestChangesInputPlaceholder')}
        isPending={actions.isRequestingChanges}
        onOpenChange={setOpenRequestChanges}
        onConfirm={async (payload) => {
          const result = await actions.requestChanges(ticket.id, { reason: payload.value });
          if (result.ok) {
            setHasActioned(true);
            navigateToList();
          }
          return result;
        }}
      />
    </div>
  );
}

