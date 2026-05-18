'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ChevronUp,
  Clock,
  Loader2,
  ShieldCheck,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  TicketRequestRequestTypeBadge,
  TicketRequestStatusBadge,
} from './ticket-request-badges';
import {
  type TicketDecisionDelegateOption,
  TicketRequestDecisionDialog,
} from './ticket-request-decision-dialog';
import { TicketRequestEditorDialog } from './ticket-request-editor-dialog';
import {
  formatTicketUsers,
  formatTicketDate,
  formatTicketDateTime,
  formatTicketUser,
  getTicketEffortOwners,
  getTicketActionAccess,
  getTicketStepLabel,
  getTicketWorkflowLabel,
  resolveCcMember,
  resolveTicketDelegate,
} from './ticket-request-utils';
import type { TicketRequestMemberOption } from '../hooks/use-ticket-requests';
import type {
  TicketDecisionNoteBody,
  TicketDecisionReasonBody,
  TicketRequestCatalogReason,
  TicketRequestCatalogType,
  TicketRequestDetail,
  TicketRequestUserSummary,
  UpdateTicketRequestBody,
} from '@/services/ticket/types/ticket-request.types';

export interface TicketRequestSidebarProps {
  ticket: TicketRequestDetail;
  requestTypeLabel: string;
  reasonLabel: string;
  currentUserId: string | null;
  currentUserEmail: string | null;
  canDelegate: boolean;
  canManageCcPermission: boolean;
  declareOtHref?: string;
  isMutating: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  isRequestingChanges: boolean;
  isUpdatingCc: boolean;
  memberOptions: TicketRequestMemberOption[];
  requestTypes: TicketRequestCatalogType[];
  reasonOptions: TicketRequestCatalogReason[];
  onCancel: (ticketId: string) => Promise<{ ok: boolean }>;
  onApprove: (ticketId: string, body: TicketDecisionNoteBody) => Promise<{ ok: boolean }>;
  onReject: (ticketId: string, body: TicketDecisionReasonBody) => Promise<{ ok: boolean }>;
  onRequestChanges: (ticketId: string, body: TicketDecisionReasonBody) => Promise<{ ok: boolean }>;
  onResubmit: (ticketId: string, payload: UpdateTicketRequestBody) => Promise<{ ok: boolean }>;
  onAddCcMembers: (ticketId: string, memberIds: string[]) => Promise<{ ok: boolean }>;
  onRemoveCcMember: (ticketId: string, memberId: string) => Promise<{ ok: boolean }>;
}

function SidebarSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
        {label}
      </p>
      {children}
    </div>
  );
}

function SidebarRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2 py-1">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className={cn('max-w-[58%] text-right text-sm font-medium text-foreground', valueClassName)}>
        {value}
      </span>
    </div>
  );
}

export function TicketRequestSidebar({
  ticket,
  requestTypeLabel,
  reasonLabel,
  currentUserId,
  currentUserEmail,
  canDelegate,
  canManageCcPermission,
  declareOtHref,
  isMutating,
  isApproving,
  isRejecting,
  isRequestingChanges,
  isUpdatingCc,
  memberOptions,
  requestTypes,
  reasonOptions,
  onCancel,
  onApprove,
  onReject,
  onRequestChanges,
  onResubmit,
  onAddCcMembers,
  onRemoveCcMember,
}: TicketRequestSidebarProps) {
  const locale = useLocale();
  const t = useTranslations('ticket');
  const tSteps = useTranslations('ticket.labels.steps');
  const tWorkflows = useTranslations('ticket.labels.workflows');
  const [openResubmit, setOpenResubmit] = useState(false);
  const [openReject, setOpenReject] = useState(false);
  const [openRequestChanges, setOpenRequestChanges] = useState(false);
  const [hasActioned, setHasActioned] = useState(false);
  const [showCcAdd, setShowCcAdd] = useState(false);
  const [selectedCcIds, setSelectedCcIds] = useState<string[]>([]);

  const actionAccess = getTicketActionAccess({
    ticket,
    currentUserId,
    currentUserEmail,
    canDelegatePermission: canDelegate,
    canManageCcPermission,
  });

  const currentDelegate = resolveTicketDelegate(ticket);
  const effortOwners = getTicketEffortOwners(ticket);
  const memberOptionMap = new Map(memberOptions.map((m) => [m.id, m]));

  const delegateDecisionOptions = memberOptions
    .filter((m) => m.canApprove && m.id !== (currentDelegate?.id ?? ''))
    .map<TicketDecisionDelegateOption>((m) => ({ id: m.id, label: m.label }));

  const blockedCcIdSet = new Set(
    [ticket.requester.id, currentDelegate?.id, ...effortOwners.map((owner) => owner.id)].filter(
      (v): v is string => Boolean(v),
    ),
  );

  const resolvedCcMembers = ticket.ccMembers
    .map((entry) => ({ raw: entry, member: resolveCcMember(entry) }))
    .filter(
      (entry): entry is {
        raw: TicketRequestDetail['ccMembers'][number];
        member: TicketRequestUserSummary;
      } => entry.member != null && !blockedCcIdSet.has(entry.member.id),
    );

  const existingCcIdSet = new Set(resolvedCcMembers.map((e) => e.member.id));
  const ccCandidates = memberOptions.filter((m) => {
    if (m.isOrganizationAdmin) return false;
    if (m.id === ticket.requester.id || m.id === currentDelegate?.id) return false;
    if (effortOwners.some((owner) => owner.id === m.id)) return false;
    return !existingCcIdSet.has(m.id);
  });

  const reviewLead = formatTicketUser(ticket.delegate ?? ticket.approver ?? null);
  const effortOwner = formatTicketUsers(effortOwners);
  const reasonDetail = ticket.reasonDetail?.trim() || null;
  const decisionTimestamp = ticket.decidedAt ?? ticket.canceledAt ?? null;
  const decisionBy = ticket.decidedBy ?? ticket.canceledBy ?? null;
  const decisionOwner = !decisionBy
    ? null
    : typeof decisionBy !== 'string'
      ? formatTicketUser(decisionBy)
      : (memberOptionMap.get(decisionBy)?.label ??
          (decisionBy === ticket.requester.id ? formatTicketUser(ticket.requester) : null) ??
          (decisionBy === ticket.delegate?.id ? formatTicketUser(ticket.delegate) : null) ??
          (decisionBy === ticket.approver?.id ? formatTicketUser(ticket.approver) : null) ??
          (effortOwners.some((owner) => owner.id === decisionBy)
            ? formatTicketUser(
                effortOwners.find((owner) => owner.id === decisionBy) ?? null,
              )
            : null) ??
          t('common.notAvailable'));

  const hasActions =
    actionAccess.canResubmit ||
    actionAccess.canDeclareOt ||
    actionAccess.canCancel ||
    actionAccess.canApprove ||
    actionAccess.canReject ||
    actionAccess.canRequestChanges;

  const handleApprove = async (ticketId: string, body: TicketDecisionNoteBody) => {
    const result = await onApprove(ticketId, body);
    if (result.ok) setHasActioned(true);
    return result;
  };

  const handleReject = async (ticketId: string, body: TicketDecisionReasonBody) => {
    const result = await onReject(ticketId, body);
    if (result.ok) setHasActioned(true);
    return result;
  };

  const handleRequestChanges = async (ticketId: string, body: TicketDecisionReasonBody) => {
    const result = await onRequestChanges(ticketId, body);
    if (result.ok) setHasActioned(true);
    return result;
  };

  const handleAddCcMembers = async () => {
    if (selectedCcIds.length === 0) return;

    const filteredIds = selectedCcIds.filter((id) => !memberOptionMap.get(id)?.isOrganizationAdmin);
    if (filteredIds.length === 0) return;

    const result = await onAddCcMembers(ticket.id, filteredIds);
    if (result.ok) {
      setSelectedCcIds([]);
      setShowCcAdd(false);
    }
  };

  return (
    <>
      <div className="sticky top-4 overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <TicketRequestStatusBadge status={ticket.status} />
            <TicketRequestRequestTypeBadge type={ticket.type} label={requestTypeLabel} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {ticket.code} | {formatTicketDateTime(ticket.updatedAt, locale)}
          </p>
        </div>

        {hasActions && !hasActioned ? (
          <div className="border-t border-border/60 p-4 space-y-1.5">
            {actionAccess.canApprove ? (
              <Button
                size="sm"
                className="w-full bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                disabled={isMutating}
                onClick={() => void handleApprove(ticket.id, {})}
              >
                {isApproving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                {t('sidebar.actions.approve')}
              </Button>
            ) : null}
            {actionAccess.canReject ? (
              <Button
                size="sm"
                className="w-full bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-500 dark:bg-rose-500 dark:hover:bg-rose-600"
                disabled={isMutating}
                onClick={() => setOpenReject(true)}
              >
                {isRejecting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                {t('sidebar.actions.reject')}
              </Button>
            ) : null}
            {actionAccess.canRequestChanges ? (
              <Button
                size="sm"
                className="w-full bg-sky-600 text-white shadow-sm hover:bg-sky-700 focus-visible:ring-sky-500 dark:bg-sky-500 dark:hover:bg-sky-600"
                disabled={isMutating}
                onClick={() => setOpenRequestChanges(true)}
              >
                {isRequestingChanges ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : null}
                {t('sidebar.actions.requestChanges')}
              </Button>
            ) : null}
            {actionAccess.canDeclareOt && declareOtHref ? (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                disabled={isMutating}
                asChild
              >
                <Link href={declareOtHref}>
                  <Clock className="mr-1.5 h-3.5 w-3.5" />
                  {t('sidebar.actions.declareOtEffort')}
                </Link>
              </Button>
            ) : null}
            {actionAccess.canResubmit ? (
              <Button
                size="sm"
                className="w-full"
                disabled={isMutating}
                onClick={() => setOpenResubmit(true)}
              >
                {t('sidebar.actions.updateResubmit')}
              </Button>
            ) : null}
            {actionAccess.canCancel ? (
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
                disabled={isMutating}
                onClick={() => void onCancel(ticket.id)}
              >
                {t('sidebar.actions.cancelRequest')}
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="divide-y divide-border/50">
          <div className="px-4 py-3">
            <SidebarSection label={t('sidebar.sections.request')}>
              <SidebarRow label={t('sidebar.rows.requestType')} value={requestTypeLabel} />
              <SidebarRow label={t('sidebar.rows.reason')} value={reasonLabel} />
              {reasonDetail ? (
                <p className="mt-1 text-sm leading-6 text-foreground/80">{reasonDetail}</p>
              ) : null}
            </SidebarSection>
          </div>

          <div className="px-4 py-3">
            <SidebarSection label={t('sidebar.sections.people')}>
              <SidebarRow
                label={t('sidebar.rows.requester')}
                value={formatTicketUser(ticket.requester)}
              />
              <SidebarRow label={t('sidebar.rows.reviewer')} value={reviewLead} />
              {effortOwner !== t('common.notAvailable') ? (
                <SidebarRow
                  label={t(
                    effortOwners.length > 1
                      ? 'sidebar.rows.effortOwners'
                      : 'sidebar.rows.effortOwner',
                  )}
                  value={effortOwner}
                />
              ) : null}
            </SidebarSection>
          </div>

          <div className="px-4 py-3">
            <SidebarSection label={t('sidebar.sections.schedule')}>
              <SidebarRow
                label={t('sidebar.rows.startAt')}
                value={formatTicketDate(ticket.startAt, locale)}
              />
              <SidebarRow
                label={t('sidebar.rows.endAt')}
                value={formatTicketDate(ticket.endAt, locale)}
              />
            </SidebarSection>
          </div>

          <div className="px-4 py-3">
            <SidebarSection label={t('sidebar.sections.workflow')}>
              <SidebarRow
                label={t('sidebar.rows.step')}
                value={getTicketStepLabel(ticket.currentStepCode, tSteps)}
              />
              <SidebarRow
                label={t('sidebar.rows.flow')}
                value={getTicketWorkflowLabel(ticket.workflowCode, tWorkflows)}
              />
            </SidebarSection>
          </div>

          {decisionOwner || decisionTimestamp ? (
            <div className="px-4 py-3">
              <SidebarSection label={t('sidebar.sections.decision')}>
                {decisionOwner ? (
                  <SidebarRow label={t('sidebar.rows.by')} value={decisionOwner} />
                ) : null}
                {decisionTimestamp ? (
                  <SidebarRow
                    label={t('sidebar.rows.at')}
                    value={formatTicketDateTime(decisionTimestamp, locale)}
                  />
                ) : null}
              </SidebarSection>
            </div>
          ) : null}

          <div className="px-4 py-3">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {resolvedCcMembers.length > 0
                  ? t('ccTab.members', { count: resolvedCcMembers.length })
                  : t('sidebar.sections.ccMembers')}
              </p>
              {actionAccess.canManageCc && ccCandidates.length > 0 ? (
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                  onClick={() => setShowCcAdd((v) => !v)}
                >
                  {showCcAdd ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <UserPlus className="h-3 w-3" />
                  )}
                  {showCcAdd ? t('sidebar.cc.hideForm') : t('sidebar.cc.showForm')}
                </button>
              ) : null}
            </div>

            {resolvedCcMembers.length === 0 && !showCcAdd ? (
              <p className="text-sm text-muted-foreground">{t('sidebar.cc.noCcMembers')}</p>
            ) : null}

            <div className="space-y-0.5">
              {resolvedCcMembers.map(({ raw, member }) => {
                const isOrgAdminCc =
                  memberOptionMap.get(member.id)?.isOrganizationAdmin === true ||
                  raw.isDefault === true;

                return (
                  <div key={member.id} className="flex items-center justify-between gap-1 py-0.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm text-foreground">
                          {formatTicketUser(member)}
                        </span>
                        {isOrgAdminCc ? (
                          <ShieldCheck className="h-3 w-3 shrink-0 text-cyan-600" />
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    {actionAccess.canManageCc && !isOrgAdminCc ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-rose-600"
                        disabled={isUpdatingCc}
                        onClick={() => void onRemoveCcMember(ticket.id, member.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {showCcAdd && ccCandidates.length > 0 ? (
              <div className="mt-3 space-y-2">
                <ScrollArea className="max-h-36 rounded-md border border-border/60">
                  <div className="space-y-0.5 p-2">
                    {ccCandidates.map((candidate) => (
                      <label
                        key={candidate.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedCcIds.includes(candidate.id)}
                          onCheckedChange={(checked) => {
                            setSelectedCcIds((prev) =>
                              checked
                                ? Array.from(new Set([...prev, candidate.id]))
                                : prev.filter((id) => id !== candidate.id),
                            );
                          }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-foreground">{candidate.label}</p>
                          <p className="text-xs text-muted-foreground">{candidate.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
                {selectedCcIds.length > 0 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={isUpdatingCc}
                    onClick={() => void handleAddCcMembers()}
                  >
                    {isUpdatingCc ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {t('sidebar.actions.addMembersCount', {
                      count: selectedCcIds.length,
                      plural: selectedCcIds.length !== 1 ? 's' : '',
                    })}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <TicketRequestEditorDialog
        key={`resubmit-${ticket.id}-${openResubmit ? 'open' : 'closed'}`}
        open={openResubmit}
        mode="resubmit"
        ticket={ticket}
        requesterId={ticket.requester.id}
        isPending={isMutating}
        memberOptions={memberOptions}
        requestTypes={requestTypes}
        reasonOptions={reasonOptions}
        onOpenChange={setOpenResubmit}
        onSubmit={async (payload) => onResubmit(ticket.id, payload as UpdateTicketRequestBody)}
      />
      <TicketRequestDecisionDialog
        open={openReject}
        title={t('sidebar.dialogs.rejectTitle')}
        description={t('sidebar.dialogs.rejectDescription')}
        confirmLabel={t('sidebar.dialogs.rejectConfirm')}
        inputLabel={t('sidebar.dialogs.rejectInputLabel')}
        inputPlaceholder={t('sidebar.dialogs.rejectInputPlaceholder')}
        isPending={isRejecting}
        delegateOptions={delegateDecisionOptions}
        onOpenChange={setOpenReject}
        onConfirm={(payload) =>
          handleReject(ticket.id, {
            reason: payload.value,
            nextDelegateId: payload.nextDelegateId,
          })
        }
      />

      <TicketRequestDecisionDialog
        open={openRequestChanges}
        title={t('sidebar.dialogs.requestChangesTitle')}
        description={t('sidebar.dialogs.requestChangesDescription')}
        confirmLabel={t('sidebar.dialogs.requestChangesConfirm')}
        inputLabel={t('sidebar.dialogs.requestChangesInputLabel')}
        inputPlaceholder={t('sidebar.dialogs.requestChangesInputPlaceholder')}
        isPending={isRequestingChanges}
        onOpenChange={setOpenRequestChanges}
        onConfirm={(payload) => handleRequestChanges(ticket.id, { reason: payload.value })}
      />
    </>
  );
}
