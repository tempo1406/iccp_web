'use client';

import { useTranslations } from 'next-intl';
import { TabsContent } from '@/components/ui/tabs';
import type { TicketRequestDetail } from '../../../../services/ticket/types/ticket-request.types';
import { DetailFieldCard } from './ticket-request-detail-shared';

interface TicketRequestOverviewTabProps {
  ticket: TicketRequestDetail;
}

export function TicketRequestOverviewTab({
  ticket,
}: TicketRequestOverviewTabProps) {
  const t = useTranslations('ticket');

  return (
    <TabsContent value="overview" className="mt-5">
      <div className="space-y-6">
        <div className="rounded-[24px] border border-border/60 bg-background/70 p-5">
          <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {t('overviewTab.requestDetail')}
          </p>
          <p className="text-sm leading-7 whitespace-pre-wrap text-foreground">
            {ticket.content?.trim() || t('overviewTab.noRequestDetail')}
          </p>
        </div>

        {ticket.reasonDetail?.trim() ? (
          <div className="rounded-[24px] border border-border/60 bg-background/70 p-5">
            <DetailFieldCard
              label={t('overviewTab.supportingBusinessDetail')}
              value={ticket.reasonDetail.trim()}
            />
          </div>
        ) : null}

        {ticket.decisionNote ? (
          <div className="rounded-[24px] border border-border/60 bg-background/70 p-5">
            <DetailFieldCard label={t('overviewTab.latestDecisionNote')} value={ticket.decisionNote} />
          </div>
        ) : null}
      </div>
    </TabsContent>
  );
}
