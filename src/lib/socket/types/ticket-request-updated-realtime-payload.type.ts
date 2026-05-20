export interface TicketRequestUpdatedRealtimePayload {
  ticketId: string;
  code: string;
  organizationId: string;
  action: string;
  actorId: string | null;
  status: string;
  currentStepCode: string;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  occurredAt: string;
}
