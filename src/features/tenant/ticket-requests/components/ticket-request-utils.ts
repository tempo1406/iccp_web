import type {
  KnownTicketRequestStatus,
  KnownTicketRequestType,
  KnownTicketRequestWorkflowCode,
  KnownTicketRequestWorkflowStepCode,
  TicketRequestCcMember,
  TicketRequestCatalogReason,
  TicketRequestDetail,
  TicketRequestStatus,
  TicketRequestSummary,
  TicketRequestType,
  TicketRequestUserSummary,
  TicketRequestWorkflowCode,
  TicketRequestWorkflowStepCode,
} from '../../../../services/ticket/types/ticket-request.types';

type TicketLabelTranslator = ((key: string) => string) | undefined;

export const ticketTypeLabels: Record<KnownTicketRequestType, string> = {
  leave: 'Leave',
  wfh: 'WFH',
  overtime: 'Overtime',
  advance: 'Advance',
  general: 'General',
};

export const ticketStatusLabels: Record<KnownTicketRequestStatus, string> = {
  pending_approval: 'Pending Approval',
  pending_submission: 'Pending Submission',
  changes_requested: 'Changes Requested',
  approved: 'Approved',
  rejected: 'Rejected',
  canceled: 'Canceled',
};

export const ticketWorkflowLabels: Record<KnownTicketRequestWorkflowCode, string> = {
  working_time: 'Working Time',
  working_time_direct: 'Working Time',
  overtime_opic: 'Overtime OPIC',
  overtime_standard_direct: 'Overtime Standard',
};

export const ticketStepLabels: Record<KnownTicketRequestWorkflowStepCode, string> = {
  emp_create_request: 'Employee Submit',
  supervisor_confirm: 'Supervisor Confirm',
  ORG_approve: 'Org Approve',
  pm_create_request: 'PM Submit',
  ORG_confirm: 'Org Confirm',
  opic_approve_pre: 'OPIC Pre-Approve',
  project_member_declare_ot: 'Declare OT Effort',
  pm_confirm: 'PM Confirm',
  opic_approve_post: 'OPIC Post-Approve',
  ORG_approve_pre: 'Org Pre-Approve',
  ORG_approve_post: 'Org Post-Approve',
  hr_baseline: 'HR Baseline',
  completed: 'Completed',
  rejected: 'Rejected',
  canceled: 'Canceled',
};

const SUBMIT_STEPS = new Set<TicketRequestWorkflowStepCode>([
  'emp_create_request',
  'pm_create_request',
  'project_member_declare_ot',
]);

export const OT_REASON_CODES = new Set<string>([
  'ot_project_deadline',
  'ot_release_support',
  'ot_incident_support',
  'ot_maintenance_migration',
  'ot_client_commitment',
  'ot_cross_team_support',
  'ot_other',
]);

export function isOrgAdminRoleName(role: string | null | undefined): boolean {
  if (!role) return false;

  const normalized = role.trim().toLowerCase();
  return (
    normalized === 'org_admin' ||
    normalized === 'organization_admin' ||
    normalized === 'organization admin'
  );
}

function normalizeDisplayCode(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getTicketTypeLabel(
  type: TicketRequestType,
  t?: TicketLabelTranslator,
): string {
  if (type in ticketTypeLabels) {
    return t?.(type) ?? ticketTypeLabels[type as KnownTicketRequestType];
  }

  return normalizeDisplayCode(type);
}

export function getTicketStatusLabel(
  status: TicketRequestStatus,
  t?: TicketLabelTranslator,
): string {
  if (status in ticketStatusLabels) {
    return t?.(status) ?? ticketStatusLabels[status as KnownTicketRequestStatus];
  }

  return normalizeDisplayCode(status);
}

export function getTicketWorkflowLabel(
  workflowCode: TicketRequestWorkflowCode,
  t?: TicketLabelTranslator,
): string {
  if (workflowCode in ticketWorkflowLabels) {
    return t?.(workflowCode) ?? ticketWorkflowLabels[workflowCode as KnownTicketRequestWorkflowCode];
  }

  return normalizeDisplayCode(workflowCode);
}

export function getTicketStepLabel(
  stepCode: TicketRequestWorkflowStepCode,
  t?: TicketLabelTranslator,
): string {
  if (stepCode in ticketStepLabels) {
    return t?.(stepCode) ?? ticketStepLabels[stepCode as KnownTicketRequestWorkflowStepCode];
  }

  return normalizeDisplayCode(stepCode);
}

export function formatTicketUser(
  user: TicketRequestUserSummary | null | undefined,
): string {
  if (!user) return '-';

  const fullName = [user.firstName, user.lastName]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(' ')
    .trim();

  return fullName.length > 0 ? fullName : user.email;
}

export function getTicketEffortOwners(
  ticket: Pick<TicketRequestSummary, 'effortOwner' | 'effortOwners' | 'requester'>,
): TicketRequestUserSummary[] {
  if (Array.isArray(ticket.effortOwners) && ticket.effortOwners.length > 0) {
    return ticket.effortOwners;
  }

  if (ticket.effortOwner) {
    return [ticket.effortOwner];
  }

  return [];
}

export function shouldUseDedicatedOtPage(
  ticket: Pick<TicketRequestSummary, 'type' | 'currentStepCode'>,
): boolean {
  return ticket.type === 'overtime';
}

export function getOvertimeReasonOptions(
  reasonOptions: TicketRequestCatalogReason[],
): TicketRequestCatalogReason[] {
  return reasonOptions.filter((option) => OT_REASON_CODES.has(option.code));
}

export function getNonOvertimeReasonOptions(
  reasonOptions: TicketRequestCatalogReason[],
): TicketRequestCatalogReason[] {
  return reasonOptions.filter((option) => !OT_REASON_CODES.has(option.code));
}

export function formatTicketUsers(
  users: Array<TicketRequestUserSummary | null | undefined>,
): string {
  const labels = users
    .filter((user): user is TicketRequestUserSummary => Boolean(user))
    .map((user) => formatTicketUser(user))
    .filter((value) => value !== '-');

  return labels.length > 0 ? labels.join(', ') : '-';
}

function resolveTicketLocale(locale?: string): string {
  return locale === 'vi' ? 'vi-VN' : 'en-GB';
}

export function formatTicketDateTime(
  value: string | null | undefined,
  locale?: string,
): string {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat(resolveTicketLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatTicketDate(
  value: string | null | undefined,
  locale?: string,
): string {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat(resolveTicketLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

export function toDateInputIso(value: string | null | undefined): string {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toDateTimeInputIso(value: string | null | undefined): string {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function dateInputToIso(value: string, mode: 'start' | 'end'): string {
  if (!value) return '';

  if (mode === 'start') {
    return new Date(`${value}T00:00:00`).toISOString();
  }

  return new Date(`${value}T23:59:59`).toISOString();
}

export function dateTimeInputToIso(value: string): string {
  if (!value) return '';
  return new Date(value).toISOString();
}

export function resolveCcMember(
  member: TicketRequestCcMember,
): TicketRequestUserSummary | null {
  if (member.member && member.member.id && member.member.email) {
    return member.member;
  }

  if (member.id && member.email) {
    return {
      id: member.id,
      email: member.email,
      firstName: member.firstName ?? null,
      lastName: member.lastName ?? null,
    };
  }

  return null;
}

export function resolveTicketDelegate(
  ticket: Pick<TicketRequestDetail, 'delegate'>,
): TicketRequestUserSummary | null {
  return ticket.delegate ?? null;
}

interface UserIdentity {
  id: string;
  email: string;
}

function getUserIdentity(
  user: TicketRequestUserSummary | null | undefined,
): UserIdentity | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email.trim().toLowerCase(),
  };
}

function matchesIdentity(
  candidate: TicketRequestUserSummary | null | undefined,
  currentUserId: string | null,
  currentUserEmail: string | null,
): boolean {
  const identity = getUserIdentity(candidate);
  if (!identity) {
    return false;
  }

  if (currentUserId && identity.id === currentUserId) {
    return true;
  }

  if (!currentUserEmail) {
    return false;
  }

  return identity.email === currentUserEmail.trim().toLowerCase();
}

function isSubmitStep(stepCode: TicketRequestWorkflowStepCode): boolean {
  return SUBMIT_STEPS.has(stepCode);
}

function canSubmitCurrentStep(
  ticket: TicketRequestDetail,
  currentUserId: string | null,
  currentUserEmail: string | null,
): boolean {
  if (!isSubmitStep(ticket.currentStepCode)) {
    return false;
  }

  if (ticket.currentStepCode === 'project_member_declare_ot') {
    const effortOwners = getTicketEffortOwners(ticket);
    if (effortOwners.length > 0) {
      return effortOwners.some((owner) =>
        matchesIdentity(owner, currentUserId, currentUserEmail),
      );
    }

    return matchesIdentity(ticket.requester, currentUserId, currentUserEmail);
  }

  return matchesIdentity(ticket.requester, currentUserId, currentUserEmail);
}

export type MyAction = 'NEED_APPROVE' | 'NEED_DECLARE_OT' | 'NEED_RESUBMIT' | null;

export function getMyAction(
  ticket: TicketRequestSummary,
  currentUserId: string | null,
): MyAction {
  if (!currentUserId) return null;

  const isApprover = ticket.delegate?.id === currentUserId;
  const effortOwners = getTicketEffortOwners(ticket);
  const isEffortOwner =
    (effortOwners.length > 0
      ? effortOwners.some((owner) => owner.id === currentUserId)
      : ticket.requester.id === currentUserId);
  const isRequester = ticket.requester.id === currentUserId;

  // At pm_confirm, backend sets delegate = requester, so isApprover covers that case too.
  if (isApprover && ticket.status === 'pending_approval') {
    return 'NEED_APPROVE';
  }

  if (
    isEffortOwner &&
    ticket.status === 'changes_requested' &&
    ticket.currentStepCode === 'project_member_declare_ot'
  ) {
    return 'NEED_DECLARE_OT';
  }

  if (
    isRequester &&
    ticket.status === 'changes_requested' &&
    ticket.currentStepCode !== 'project_member_declare_ot'
  ) {
    return 'NEED_RESUBMIT';
  }

  return null;
}

export interface TicketActionAccess {
  isRequester: boolean;
  isDelegate: boolean;
  isEffortOwner: boolean;
  canResubmit: boolean;
  canDeclareOt: boolean;
  canCancel: boolean;
  canApprove: boolean;
  canReject: boolean;
  canRequestChanges: boolean;
  canManageCc: boolean;
}

export function getTicketActionAccess(options: {
  ticket: TicketRequestDetail;
  currentUserId: string | null;
  currentUserEmail: string | null;
  canDelegatePermission: boolean;
  canManageCcPermission: boolean;
}): TicketActionAccess {
  const {
    ticket,
    currentUserId,
    currentUserEmail,
    canDelegatePermission,
    canManageCcPermission,
  } = options;

  const isRequester = matchesIdentity(ticket.requester, currentUserId, currentUserEmail);
  // Broader match (ID or email) used for CC/UI visibility checks.
  const isDelegate = matchesIdentity(
    resolveTicketDelegate(ticket),
    currentUserId,
    currentUserEmail,
  );
  // Strict ID-only match per backend spec 17.2:
  // "Chi show khi ticket.delegate?.id === currentUser.id"
  // Backend service check is also strict ID (ticket.delegateId === currentUserId),
  // so we must use the same rule to avoid showing a button that results in 403.
  const isDelegateStrict =
    Boolean(currentUserId) &&
    Boolean(ticket.delegate?.id) &&
    ticket.delegate!.id === currentUserId;

  const effortOwners = getTicketEffortOwners(ticket);
  const isEffortOwner =
    (effortOwners.length > 0
      ? effortOwners.some((owner) =>
          matchesIdentity(owner, currentUserId, currentUserEmail),
        )
      : matchesIdentity(ticket.requester, currentUserId, currentUserEmail));

  const isDeclareOtStep = ticket.currentStepCode === 'project_member_declare_ot';

  const canResubmit =
    ticket.status === 'changes_requested' &&
    !isDeclareOtStep &&
    canSubmitCurrentStep(ticket, currentUserId, currentUserEmail);

  const canDeclareOt =
    (ticket.status === 'pending_submission' || ticket.status === 'changes_requested') &&
    isDeclareOtStep &&
    isEffortOwner;

  const canCancel =
    isRequester &&
    (ticket.status === 'pending_approval' ||
      ticket.status === 'pending_submission' ||
      ticket.status === 'changes_requested');

  // Only the currently assigned delegate can approve/reject/request-changes.
  // At pm_confirm the backend sets delegate = requester, so isDelegateStrict handles that too.
  const canProcess =
    canDelegatePermission &&
    ticket.status === 'pending_approval' &&
    !isSubmitStep(ticket.currentStepCode) &&
    isDelegateStrict;

  const canManageCc = isRequester || isDelegate || isEffortOwner || canManageCcPermission;

  return {
    isRequester,
    isDelegate,
    isEffortOwner,
    canResubmit,
    canDeclareOt,
    canCancel,
    canApprove: canProcess,
    canReject: canProcess,
    canRequestChanges: canProcess,
    canManageCc,
  };
}
