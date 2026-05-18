import type { ApiPaginationParams } from '@/common/types/api';

type StringLiteralUnion<T extends string> = T | (string & {});

export const TICKET_REQUEST_TYPES = [
  'leave',
  'wfh',
  'overtime',
  'advance',
  'general',
] as const;

export type KnownTicketRequestType = (typeof TICKET_REQUEST_TYPES)[number];
export type TicketRequestType = StringLiteralUnion<KnownTicketRequestType>;

export const TICKET_REQUEST_STATUSES = [
  'pending_approval',
  'pending_submission',
  'changes_requested',
  'approved',
  'rejected',
  'canceled',
] as const;

export type KnownTicketRequestStatus = (typeof TICKET_REQUEST_STATUSES)[number];
export type TicketRequestStatus = StringLiteralUnion<KnownTicketRequestStatus>;

export const TICKET_REQUEST_ACTIVITY_ACTIONS = [
  'created',
  'submitted',
  'updated',
  'approved',
  'rejected',
  'changes_requested',
  'canceled',
  'commented',
  'cc_added',
  'cc_removed',
] as const;

export type TicketRequestActivityAction =
  (typeof TICKET_REQUEST_ACTIVITY_ACTIONS)[number];

export const TICKET_REQUEST_WORKFLOW_CODES = [
  'working_time',
  'working_time_direct',
  'overtime_opic',
  'overtime_standard_direct',
] as const;

export type KnownTicketRequestWorkflowCode =
  (typeof TICKET_REQUEST_WORKFLOW_CODES)[number];
export type TicketRequestWorkflowCode = StringLiteralUnion<KnownTicketRequestWorkflowCode>;

export const TICKET_REQUEST_WORKFLOW_STEP_CODES = [
  'emp_create_request',
  'supervisor_confirm',
  'ORG_approve',
  'pm_create_request',
  'ORG_confirm',
  'opic_approve_pre',
  'project_member_declare_ot',
  'pm_confirm',
  'opic_approve_post',
  'ORG_approve_pre',
  'ORG_approve_post',
  'hr_baseline',
  'completed',
  'rejected',
  'canceled',
] as const;

export type KnownTicketRequestWorkflowStepCode =
  (typeof TICKET_REQUEST_WORKFLOW_STEP_CODES)[number];
export type TicketRequestWorkflowStepCode = StringLiteralUnion<
  KnownTicketRequestWorkflowStepCode
>;

export interface TicketRequestUserSummary {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface TicketRequestSummary {
  id: string;
  code: string;
  type: TicketRequestType;
  workflowCode: TicketRequestWorkflowCode;
  currentStepCode: TicketRequestWorkflowStepCode;
  currentStepOrder?: number | null;
  requestTypeCode?: string | null;
  requestTypeName?: string | null;
  reasonCode?: string | null;
  title: string;
  status: TicketRequestStatus;
  requester: TicketRequestUserSummary;
  delegate?: TicketRequestUserSummary | null;
  approver?: TicketRequestUserSummary | null;
  effortOwner?: TicketRequestUserSummary | null;
  effortOwners?: TicketRequestUserSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketRequestCcMember {
  member?: TicketRequestUserSummary | null;
  id?: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  addedAt?: string;
  addedBy?: string | null;
  isDefault: boolean;
}

export interface TicketRequestActivityPayload {
  fromStepCode?: string;
  toStepCode?: string;
  nextDelegateId?: string;
  stagedDelegateId?: string;
  nextApproverId?: string;
  stagedApproverId?: string;
  reason?: string;
  note?: string;
  fields?: unknown;
  commentId?: string;
  memberIds?: string[];
  memberId?: string;
}

export interface TicketRequestActivity {
  id: string;
  action: TicketRequestActivityAction;
  fromStatus: TicketRequestStatus | string | null;
  toStatus: TicketRequestStatus | string | null;
  actorId: string | null;
  actor?: TicketRequestUserSummary | null;
  payload?: TicketRequestActivityPayload | null;
  createdAt: string;
}

export interface OtEffortEntry {
  date: string;
  hours: number;
  taskDescription: string;
  workDescription?: string;
}

export interface OtMetadata {
  projectId?: string | null;
  projectName?: string | null;
  plannedHours?: number | null;
  scope?: string | null;
  effortOwnerIds?: string[] | null;
  effortEntries?: OtEffortEntry[] | null;
  totalActualHours?: number | null;
  effortDetail?: string | null;
}

export interface TicketRequestDetail extends TicketRequestSummary {
  content: string;
  reasonDetail?: string | null;
  startAt: string | null;
  endAt: string | null;
  decisionNote: string | null;
  decidedAt: string | null;
  decidedBy: TicketRequestUserSummary | string | null;
  canceledAt: string | null;
  canceledBy: TicketRequestUserSummary | string | null;
  ccMembers: TicketRequestCcMember[];
  activities: TicketRequestActivity[];
  otMetadata?: OtMetadata | null;
}

export interface TicketRequestComment {
  id: string;
  content: string;
  author: TicketRequestUserSummary;
  createdAt: string;
  updatedAt: string;
}

export interface TicketRequestListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TicketRequestListResponse {
  data: TicketRequestSummary[];
  meta: TicketRequestListMeta;
}

export type TicketRequestSortBy = 'createdAt' | 'updatedAt' | 'status';
export type TicketRequestSortOrder = 'ASC' | 'DESC';

export interface TicketRequestListQuery extends ApiPaginationParams {
  sortBy?: TicketRequestSortBy;
  sortOrder?: TicketRequestSortOrder;
  status?: TicketRequestStatus;
  type?: TicketRequestType;
  workflowCode?: TicketRequestWorkflowCode;
  currentStepCode?: TicketRequestWorkflowStepCode;
  requestTypeCode?: string;
  requesterId?: string;
  delegateId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreateTicketRequestBody {
  type?: TicketRequestType;
  requestTypeCode: string;
  requestTypeName?: string;
  workflowCode?: TicketRequestWorkflowCode;
  title: string;
  content: string;
  reasonCode?: string;
  reasonDetail?: string;
  delegateId?: string;
  effortOwnerId?: string;
  ccMemberIds?: string[];
  startAt?: string;
  endAt?: string;
}

export interface CreateOvertimeTicketRequestBody {
  title: string;
  startAt: string;
  endAt: string;
  projectId?: string;
  plannedHours?: number;
  scope?: string;
  reasonCode?: string;
  reasonDetail?: string;
  effortOwnerId?: string;
  effortOwnerIds?: string[];
  ccMemberIds?: string[];
}

export interface UpdateTicketRequestBody {
  type?: TicketRequestType;
  requestTypeCode?: string;
  requestTypeName?: string;
  title?: string;
  content?: string;
  reasonCode?: string;
  reasonDetail?: string;
  delegateId?: string;
  ccMemberIds?: string[];
  nextDelegateId?: string;
  startAt?: string;
  endAt?: string;
}

export interface DeclareOtEffortBody {
  effortEntries: OtEffortEntry[];
  totalActualHours: number;
  effortDetail?: string;
  nextDelegateId?: string;
}

export interface TicketDecisionNoteBody {
  note?: string;
  nextDelegateId?: string;
}

export interface TicketDecisionReasonBody {
  reason: string;
  nextDelegateId?: string;
}

export interface AddTicketCommentBody {
  content: string;
}

export interface AddTicketCcMembersBody {
  memberIds: string[];
}

export interface TicketRequestCatalogType {
  code: string;
  label: string;
  type: TicketRequestType;
  allowedWorkflowCodes: TicketRequestWorkflowCode[];
  defaultWorkflowCode?: TicketRequestWorkflowCode | null;
  isCustom?: boolean;
}

export interface TicketRequestCatalogReason {
  code: string;
  label: string;
}

export interface TicketRequestDelegateOption {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isOrgAdmin: boolean;
  isDefault: boolean;
}

export type TicketRequestApproverOption = TicketRequestDelegateOption;

export interface TicketRequestCcMemberOption {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface OtProjectOption {
  id: string;
  name: string;
}

export const DEFAULT_TICKET_REQUEST_META: TicketRequestListMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};
