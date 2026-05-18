import { TicketRequestDeclareOtPage } from '@/features/tenant/ticket-requests/pages/ticket-request-declare-ot-page';

interface TicketDeclareOtRoutePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TicketDeclareOtRoutePage({
  params,
}: TicketDeclareOtRoutePageProps) {
  const { id } = await params;

  return <TicketRequestDeclareOtPage ticketId={id} />;
}
