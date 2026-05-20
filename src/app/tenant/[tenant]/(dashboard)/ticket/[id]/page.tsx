import { TicketRequestDetailPage } from '@/features/tenant/ticket-requests/pages/ticket-request-detail-page';

interface TicketDetailRoutePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TicketDetailRoutePage({
  params,
}: TicketDetailRoutePageProps) {
  const { id } = await params;

  return <TicketRequestDetailPage ticketId={id} />;
}
