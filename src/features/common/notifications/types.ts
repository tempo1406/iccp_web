import type {
  TicketRequestCcMember,
  TicketRequestDetail,
  TicketRequestUserSummary,
} from '@/services/ticket/types/ticket-request.types';

export interface NotificationPerson {
  id: string | null;
  name: string;
  avatarUrl: string | null;
  email: string | null;
}

export interface TicketNotificationMeta {
  isTicket: boolean;
  ticketId: string | null;
  ticketCode: string | null;
  action: string | null;
  requestTitle: string | null;
  requestContent: string | null;
  requestTypeLabel: string | null;
  workflowCode: string | null;
  priority: string | null;
  reasonCode: string | null;
  reasonDetail: string | null;
  requester: NotificationPerson | null;
  approver: NotificationPerson | null;
  actor: NotificationPerson | null;
  ccMembers: NotificationPerson[];
}

export type NotificationTicketDetail = TicketRequestDetail;
export type NotificationTicketUserSummary = TicketRequestUserSummary;
export type NotificationTicketCcMember = TicketRequestCcMember;
