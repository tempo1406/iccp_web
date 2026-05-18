'use client';

import { CheckCircle2, Clock, FolderOpen, User } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import type { TicketRequestDetail } from '../../../../services/ticket/types/ticket-request.types';
import {
  formatTicketDate,
  formatTicketUsers,
  getTicketEffortOwners,
} from './ticket-request-utils';
import { DetailFieldCard, DetailMetricCard, EmptyPanelState } from './ticket-request-detail-shared';

interface TicketRequestOtTabProps {
  ticket: TicketRequestDetail;
  otProjectId: string;
  otProjectName: string | null;
  hasOtMetadata: boolean;
}

export function TicketRequestOtTab({
  ticket,
  otProjectId,
  otProjectName,
  hasOtMetadata,
}: TicketRequestOtTabProps) {
  const t = useTranslations('ticket');
  const locale = useLocale();
  const effortOwners = getTicketEffortOwners(ticket);

  return (
    <TabsContent value="ot" className="mt-5 space-y-5">
      {/* Section header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{t('otTab.title')}</p>
        <Badge
          variant="outline"
          className="rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-xs text-primary"
        >
          {ticket.workflowCode === 'overtime_standard_direct'
            ? t('otTab.directFlow')
            : t('otTab.standardFlow')}
        </Badge>
      </div>

      {/* 4 metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <DetailMetricCard
          icon={FolderOpen}
          label={t('otTab.project')}
          value={otProjectId ? otProjectName || t('otTab.unknownProject') : t('otTab.noProjectLinked')}
        />
        <DetailMetricCard
          icon={User}
          label={effortOwners.length > 1 ? t('otTab.effortOwners') : t('otTab.effortOwner')}
          value={formatTicketUsers(effortOwners)}
        />
        <DetailMetricCard
          icon={Clock}
          label={t('otTab.plannedHours')}
          value={
            ticket.otMetadata?.plannedHours != null
              ? `${ticket.otMetadata.plannedHours}h`
              : '-'
          }
        />
        <DetailMetricCard
          icon={CheckCircle2}
          label={t('otTab.actualHours')}
          value={
            ticket.otMetadata?.totalActualHours != null
              ? `${ticket.otMetadata.totalActualHours}h`
              : t('otTab.notDeclared')
          }
          valueClassName={
            ticket.otMetadata?.plannedHours != null &&
            ticket.otMetadata.totalActualHours != null &&
            ticket.otMetadata.totalActualHours > ticket.otMetadata.plannedHours
              ? 'text-amber-600 dark:text-amber-400'
              : undefined
          }
        />
      </div>

      {ticket.otMetadata?.scope ? (
        <div className="border-t border-border/60 pt-5">
          <DetailFieldCard label={t('otTab.scopePlan')} value={ticket.otMetadata.scope} />
        </div>
      ) : null}

      {ticket.otMetadata?.effortDetail ? (
        <div className="border-t border-border/60 pt-5">
          <DetailFieldCard label={t('otTab.effortSummary')} value={ticket.otMetadata.effortDetail} />
        </div>
      ) : null}

      {ticket.otMetadata?.effortEntries?.length ? (
        <div className="divide-y divide-border/60 border-t border-border/60">
          {ticket.otMetadata.effortEntries.map((entry, index) => (
            <div key={`${entry.date}-${index}`} className="pt-5 pb-1">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground">
                  {t('otTab.entry', { index: index + 1 })}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {formatTicketDate(entry.date, locale)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t('otTab.loggedHours', { hours: entry.hours })}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <DetailFieldCard
                  label={t('otTab.taskCompleted')}
                  value={entry.taskDescription}
                  className="h-full"
                />
                <DetailFieldCard
                  label={t('otTab.workDetails')}
                  value={entry.workDescription?.trim() || t('otTab.noAdditionalWorkDetail')}
                  className="h-full"
                />
              </div>
            </div>
          ))}
        </div>
      ) : hasOtMetadata ? (
        <EmptyPanelState
          icon={Clock}
          title={t('otTab.emptyDeclaredTitle')}
          description={t('otTab.emptyDeclaredDescription')}
        />
      ) : (
        <EmptyPanelState
          icon={Clock}
          title={t('otTab.emptyMetadataTitle')}
          description={t('otTab.emptyMetadataDescription')}
        />
      )}
    </TabsContent>
  );
}
