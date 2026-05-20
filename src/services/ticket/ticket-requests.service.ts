import { BaseService } from '@/services/base-service';
import type {
  AddTicketCcMembersBody,
  AddTicketCommentBody,
  CreateOvertimeTicketRequestBody,
  CreateTicketRequestBody,
  DeclareOtEffortBody,
  OtProjectOption,
  TicketDecisionNoteBody,
  TicketDecisionReasonBody,
  TicketRequestApproverOption,
  TicketRequestCcMemberOption,
  TicketRequestCatalogReason,
  TicketRequestCatalogType,
  TicketRequestComment,
  TicketRequestDetail,
  TicketRequestListQuery,
  TicketRequestListResponse,
  TicketRequestUserSummary,
  UpdateTicketRequestBody,
} from './types/ticket-request.types';

function buildTicketQuery(params: TicketRequestListQuery = {}): string {
  const searchParams = new URLSearchParams();

  if (typeof params.page === 'number') {
    searchParams.set('page', String(params.page));
  }

  if (typeof params.limit === 'number') {
    searchParams.set('limit', String(params.limit));
  }

  if (params.sortBy) {
    searchParams.set('sortBy', params.sortBy);
  }

  if (params.sortOrder) {
    searchParams.set('sortOrder', params.sortOrder);
  }

  if (params.status) {
    searchParams.set('status', params.status);
  }

  if (params.type) {
    searchParams.set('type', params.type);
  }

  if (params.workflowCode) {
    searchParams.set('workflowCode', params.workflowCode);
  }

  if (params.currentStepCode) {
    searchParams.set('currentStepCode', params.currentStepCode);
  }

  if (params.requestTypeCode) {
    searchParams.set('requestTypeCode', params.requestTypeCode);
  }

  if (params.requesterId) {
    searchParams.set('requesterId', params.requesterId);
  }

  if (params.delegateId) {
    searchParams.set('delegateId', params.delegateId);
  }

  if (params.search) {
    searchParams.set('search', params.search);
  }

  if (params.fromDate) {
    searchParams.set('fromDate', params.fromDate);
  }

  if (params.toDate) {
    searchParams.set('toDate', params.toDate);
  }

  const query = searchParams.toString();
  return query.length > 0 ? `?${query}` : '';
}

export class TicketRequestsService extends BaseService {
  private readonly base = '/v1/ticket-requests';

  create(body: CreateTicketRequestBody): Promise<TicketRequestDetail> {
    return this.post<TicketRequestDetail, CreateTicketRequestBody>(this.base, body);
  }

  createOvertime(body: CreateOvertimeTicketRequestBody): Promise<TicketRequestDetail> {
    return this.post<TicketRequestDetail, CreateOvertimeTicketRequestBody>(
      `${this.base}/overtime`,
      body,
    );
  }

  listMy(params: TicketRequestListQuery = {}): Promise<TicketRequestListResponse> {
    const query = buildTicketQuery(params);
    return this.get<TicketRequestListResponse>(`${this.base}/me${query}`);
  }

  listManage(params: TicketRequestListQuery = {}): Promise<TicketRequestListResponse> {
    const query = buildTicketQuery(params);
    return this.get<TicketRequestListResponse>(`${this.base}/manage${query}`);
  }

  getDetail(ticketId: string): Promise<TicketRequestDetail> {
    const encodedId = encodeURIComponent(ticketId);
    return this.get<TicketRequestDetail>(`${this.base}/${encodedId}`);
  }

  declareOtEffort(
    ticketId: string,
    body: DeclareOtEffortBody,
  ): Promise<TicketRequestDetail> {
    const encodedId = encodeURIComponent(ticketId);
    return this.patch<TicketRequestDetail, DeclareOtEffortBody>(
      `${this.base}/${encodedId}/declare-ot-effort`,
      body,
    );
  }

  update(ticketId: string, body: UpdateTicketRequestBody): Promise<TicketRequestDetail> {
    const encodedId = encodeURIComponent(ticketId);
    return this.patch<TicketRequestDetail, UpdateTicketRequestBody>(
      `${this.base}/${encodedId}`,
      body,
    );
  }

  cancel(ticketId: string): Promise<TicketRequestDetail> {
    const encodedId = encodeURIComponent(ticketId);
    return this.post<TicketRequestDetail>(`${this.base}/${encodedId}/cancel`);
  }

  approve(ticketId: string, body: TicketDecisionNoteBody): Promise<TicketRequestDetail> {
    const encodedId = encodeURIComponent(ticketId);
    return this.post<TicketRequestDetail, TicketDecisionNoteBody>(
      `${this.base}/${encodedId}/approve`,
      body,
    );
  }

  reject(ticketId: string, body: TicketDecisionReasonBody): Promise<TicketRequestDetail> {
    const encodedId = encodeURIComponent(ticketId);
    return this.post<TicketRequestDetail, TicketDecisionReasonBody>(
      `${this.base}/${encodedId}/reject`,
      body,
    );
  }

  requestChanges(
    ticketId: string,
    body: TicketDecisionReasonBody,
  ): Promise<TicketRequestDetail> {
    const encodedId = encodeURIComponent(ticketId);
    return this.post<TicketRequestDetail, TicketDecisionReasonBody>(
      `${this.base}/${encodedId}/request-changes`,
      body,
    );
  }

  getComments(ticketId: string): Promise<TicketRequestComment[]> {
    const encodedId = encodeURIComponent(ticketId);
    return this.get<TicketRequestComment[]>(`${this.base}/${encodedId}/comments`);
  }

  addComment(
    ticketId: string,
    body: AddTicketCommentBody,
  ): Promise<TicketRequestComment> {
    const encodedId = encodeURIComponent(ticketId);
    return this.post<TicketRequestComment, AddTicketCommentBody>(
      `${this.base}/${encodedId}/comments`,
      body,
    );
  }

  addCcMembers(
    ticketId: string,
    body: AddTicketCcMembersBody,
  ): Promise<TicketRequestDetail> {
    const encodedId = encodeURIComponent(ticketId);
    return this.post<TicketRequestDetail, AddTicketCcMembersBody>(
      `${this.base}/${encodedId}/cc-members`,
      body,
    );
  }

  removeCcMember(ticketId: string, memberId: string): Promise<TicketRequestDetail> {
    const encodedTicketId = encodeURIComponent(ticketId);
    const encodedMemberId = encodeURIComponent(memberId);
    return this.delete<TicketRequestDetail>(
      `${this.base}/${encodedTicketId}/cc-members/${encodedMemberId}`,
    );
  }

  listOtProjectOptions(): Promise<OtProjectOption[]> {
    return this.get<OtProjectOption[]>(`${this.base}/ot-project-options`);
  }

  listOtEffortOwnerOptions(projectId?: string): Promise<TicketRequestUserSummary[]> {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return this.get<TicketRequestUserSummary[]>(`${this.base}/ot-effort-owner-options${query}`);
  }

  listRequestTypes(): Promise<TicketRequestCatalogType[]> {
    return this.get<TicketRequestCatalogType[]>(`${this.base}/request-types`);
  }

  listReasonOptions(): Promise<TicketRequestCatalogReason[]> {
    return this.get<TicketRequestCatalogReason[]>(`${this.base}/reason-options`);
  }

  listDelegateOptions(): Promise<TicketRequestApproverOption[]> {
    return this.get<TicketRequestApproverOption[]>(`${this.base}/delegate-options`);
  }

  listCcMemberOptions(): Promise<TicketRequestCcMemberOption[]> {
    return this.get<TicketRequestCcMemberOption[]>(`${this.base}/cc-member-options`);
  }
}
