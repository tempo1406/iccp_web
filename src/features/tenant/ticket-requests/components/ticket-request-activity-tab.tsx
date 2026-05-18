'use client';

import { Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { TicketRequestDetail } from '../../../../services/ticket/types/ticket-request.types';
import {
  EmptyPanelState,
  formatTicketRequestActivityAction,
  TICKET_REQUEST_ACTIVITY_COLORS,
} from './ticket-request-detail-shared';
import { formatTicketDateTime, formatTicketUser, getTicketStepLabel } from './ticket-request-utils';

interface TicketRequestActivityTabProps {
  sortedActivities: TicketRequestDetail['activities'];
}

export function TicketRequestActivityTab({
  sortedActivities,
}: TicketRequestActivityTabProps) {
  const t = useTranslations('ticket');
  const tActivityActions = useTranslations('ticket.labels.activityActions');
  const tSteps = useTranslations('ticket.labels.steps');
  const locale = useLocale();

  return (
    <TabsContent value="activity" className="mt-5">
      {sortedActivities.length === 0 ? (
        <EmptyPanelState
          icon={Sparkles}
          title={t('activityTab.emptyTitle')}
          description={t('activityTab.emptyDescription')}
        />
      ) : (
        <ScrollArea className="max-h-[52vh]">
          <div>
            {sortedActivities.map((activity, index) => {
              const actionClass =
                TICKET_REQUEST_ACTIVITY_COLORS[activity.action] ??
                'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-300';
              const stepTransition =
                activity.payload?.fromStepCode && activity.payload?.toStepCode
                  ? `${getTicketStepLabel(activity.payload.fromStepCode, tSteps)} -> ${getTicketStepLabel(activity.payload.toStepCode, tSteps)}`
                  : null;
              const noteOrReason = activity.payload?.note ?? activity.payload?.reason ?? null;
              const actorName = activity.actor
                ? formatTicketUser(activity.actor)
                : t('common.system');

              return (
                <div key={activity.id} className="flex gap-3 pb-4">
                  <div className="flex flex-col items-center pt-1.5">
                    <div className={cn('h-2 w-2 shrink-0 rounded-full border', actionClass)} />
                    {index < sortedActivities.length - 1 ? (
                      <div className="mt-1 w-px flex-1 bg-border/60" />
                    ) : null}
                  </div>

                  <div className="flex-1 pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
                          actionClass,
                        )}
                      >
                        {formatTicketRequestActivityAction(activity.action, tActivityActions)}
                      </span>
                      <span className="text-sm text-foreground">{actorName}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatTicketDateTime(activity.createdAt, locale)}
                      </span>
                    </div>

                    {stepTransition ? (
                      <p className="mt-1.5 text-sm text-muted-foreground">{stepTransition}</p>
                    ) : null}

                    {noteOrReason ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">
                        {noteOrReason}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </TabsContent>
  );
}
