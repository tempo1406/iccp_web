'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  CheckCircle2,
  Clock,
  FolderOpen,
  Loader2,
  MessageSquare,
  Send,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  TICKET_REQUEST_ACTIVITY_COLORS,
  DetailMetricCard,
  EmptyPanelState,
  formatTicketRequestActivityAction,
} from './ticket-request-detail-shared';
import {
  formatTicketDate,
  formatTicketDateTime,
  formatTicketUser,
  formatTicketUsers,
  getTicketEffortOwners,
  getTicketStepLabel,
  shouldUseDedicatedOtPage,
} from './ticket-request-utils';
import type {
  OtProjectOption,
  TicketRequestActivity,
  TicketRequestComment,
  TicketRequestDetail,
} from '@/services/ticket/types/ticket-request.types';

interface TicketRequestDetailPanelProps {
  ticket: TicketRequestDetail;
  comments: TicketRequestComment[];
  isCommentsPending: boolean;
  canComment: boolean;
  isAddingComment: boolean;
  projectOptions?: OtProjectOption[];
  onAddComment: (ticketId: string, content: string) => Promise<{ ok: boolean }>;
}

type FeedEntry =
  | { kind: 'activity'; item: TicketRequestActivity; ts: number }
  | { kind: 'comment'; item: TicketRequestComment; ts: number };

function buildFeed(
  activities: TicketRequestActivity[],
  comments: TicketRequestComment[],
): FeedEntry[] {
  const entries: FeedEntry[] = [
    ...activities.map((item) => ({
      kind: 'activity' as const,
      item,
      ts: new Date(item.createdAt).getTime(),
    })),
    ...comments.map((item) => ({
      kind: 'comment' as const,
      item,
      ts: new Date(item.createdAt).getTime(),
    })),
  ];

  return entries.sort((a, b) => a.ts - b.ts);
}

export function TicketRequestDetailPanel({
  ticket,
  comments,
  isCommentsPending,
  canComment,
  isAddingComment,
  projectOptions = [],
  onAddComment,
}: TicketRequestDetailPanelProps) {
  const locale = useLocale();
  const t = useTranslations('ticket');
  const tSteps = useTranslations('ticket.labels.steps');
  const [commentValue, setCommentValue] = useState('');

  const isOvertimeTicket = ticket.type === 'overtime';
  const useDedicatedOtPage = shouldUseDedicatedOtPage(ticket);
  const effortOwners = getTicketEffortOwners(ticket);
  const otProjectId = ticket.otMetadata?.projectId ?? '';
  const otProjectName =
    ticket.otMetadata?.projectName ??
    projectOptions.find((p) => p.id === otProjectId)?.name ??
    null;

  const feed = buildFeed(ticket.activities, comments);
  const decisionNote = ticket.decisionNote?.trim() || null;
  const calloutLabelMap: Record<string, string> = {
    approved: t('detailPanel.decisionNote'),
    rejected: t('detailPanel.rejectionReason'),
    changes_requested: t('detailPanel.changesRequested'),
    canceled: t('detailPanel.canceled'),
  };
  const calloutStyleMap: Record<
    string,
    { border: string; bg: string; textLabel: string; textBody: string }
  > = {
    approved: {
      border: 'border-emerald-200 dark:border-emerald-800',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      textLabel: 'text-emerald-700 dark:text-emerald-400',
      textBody: 'text-emerald-900 dark:text-emerald-200',
    },
    rejected: {
      border: 'border-rose-200 dark:border-rose-800',
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      textLabel: 'text-rose-700 dark:text-rose-400',
      textBody: 'text-rose-900 dark:text-rose-200',
    },
    changes_requested: {
      border: 'border-amber-200 dark:border-amber-800',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      textLabel: 'text-amber-700 dark:text-amber-400',
      textBody: 'text-amber-900 dark:text-amber-200',
    },
    canceled: {
      border: 'border-zinc-200 dark:border-zinc-700',
      bg: 'bg-zinc-50 dark:bg-zinc-900/30',
      textLabel: 'text-zinc-500 dark:text-zinc-400',
      textBody: 'text-zinc-700 dark:text-zinc-300',
    },
  };
  const calloutStyle = calloutStyleMap[ticket.status];
  const calloutLabel = calloutLabelMap[ticket.status];

  const handleSubmitComment = async () => {
    const content = commentValue.trim();
    if (!content) return;

    const result = await onAddComment(ticket.id, content);
    if (result.ok) setCommentValue('');
  };

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border/60 bg-card p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          {t('detailPanel.description')}
        </p>
        <p className="text-sm leading-7 whitespace-pre-wrap text-foreground">
          {ticket.content?.trim() || t('detailPanel.noDescription')}
        </p>

        {ticket.reasonDetail?.trim() ? (
          <div className="mt-4 border-t border-border/50 pt-4">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              {t('detailPanel.supportingDetail')}
            </p>
            <p className="text-sm leading-7 whitespace-pre-wrap text-foreground">
              {ticket.reasonDetail.trim()}
            </p>
          </div>
        ) : null}
      </section>

      {isOvertimeTicket && !useDedicatedOtPage ? (
        <section className="rounded-lg border border-border/60 bg-card p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {t('detailPanel.overtimeDetails')}
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DetailMetricCard
              icon={FolderOpen}
              label={t('detailPanel.project')}
              value={
                otProjectId
                  ? (otProjectName ?? t('detailPanel.unknownProject'))
                  : t('detailPanel.noProjectLinked')
              }
            />
            <DetailMetricCard
              icon={User}
              label={t(
                effortOwners.length > 1 ? 'detailPanel.effortOwners' : 'detailPanel.effortOwner',
              )}
              value={formatTicketUsers(effortOwners)}
            />
            <DetailMetricCard
              icon={Clock}
              label={t('detailPanel.planned')}
              value={
                ticket.otMetadata?.plannedHours != null
                  ? `${ticket.otMetadata.plannedHours}${t('common.hoursSuffix')}`
                  : t('common.notAvailable')
              }
            />
            <DetailMetricCard
              icon={CheckCircle2}
              label={t('detailPanel.actual')}
              value={
                ticket.otMetadata?.totalActualHours != null
                  ? `${ticket.otMetadata.totalActualHours}${t('common.hoursSuffix')}`
                  : t('detailPanel.notDeclared')
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
            <div className="mt-4 border-t border-border/50 pt-4">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {t('detailPanel.otScope')}
              </p>
              <p className="text-sm leading-7 whitespace-pre-wrap text-foreground">
                {ticket.otMetadata.scope}
              </p>
            </div>
          ) : null}

          {ticket.otMetadata?.effortDetail ? (
            <div className="mt-4 border-t border-border/50 pt-4">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {t('detailPanel.effortSummary')}
              </p>
              <p className="text-sm leading-7 whitespace-pre-wrap text-foreground">
                {ticket.otMetadata.effortDetail}
              </p>
            </div>
          ) : null}

          {ticket.otMetadata?.effortEntries?.length ? (
            <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {t('detailPanel.entry', { index: ticket.otMetadata.effortEntries.length })}
              </p>
              {ticket.otMetadata.effortEntries.map((entry, index) => (
                <div
                  key={`${entry.date}-${index}`}
                  className="rounded-md border border-border/50 bg-muted/20 p-3"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium text-foreground">
                      {formatTicketDate(entry.date, locale)}
                    </span>
                    <span className="text-muted-foreground">
                      {t('detailPanel.loggedHours', { hours: entry.hours })}
                    </span>
                  </div>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="mb-0.5 text-xs text-muted-foreground">
                        {t('detailPanel.taskCompleted')}
                      </p>
                      <p className="text-foreground">{entry.taskDescription}</p>
                    </div>
                    {entry.workDescription?.trim() ? (
                      <div>
                        <p className="mb-0.5 text-xs text-muted-foreground">
                          {t('detailPanel.details')}
                        </p>
                        <p className="text-foreground">{entry.workDescription}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {decisionNote && calloutStyle && calloutLabel ? (
        <div
          className={cn('rounded-lg border p-4', calloutStyle.border, calloutStyle.bg)}
        >
          <p
            className={cn(
              'mb-1 text-[11px] font-semibold uppercase tracking-widest',
              calloutStyle.textLabel,
            )}
          >
            {calloutLabel}
          </p>
          <p className={cn('text-sm leading-7 whitespace-pre-wrap', calloutStyle.textBody)}>
            {decisionNote}
          </p>
        </div>
      ) : null}

      <section className="rounded-lg border border-border/60 bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {t('detailPanel.activity')}
          </p>
          <span className="text-xs text-muted-foreground">
            {t('detailPanel.eventsCount', {
              count: feed.length,
              plural: feed.length !== 1 ? 's' : '',
            })}
          </span>
        </div>

        {canComment ? (
          <div className="mb-5 space-y-2">
            <Textarea
              value={commentValue}
              onChange={(e) => setCommentValue(e.target.value)}
              placeholder={t('detailPanel.commentPlaceholder')}
              rows={3}
              disabled={isAddingComment}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={commentValue.trim().length === 0 || isAddingComment}
                onClick={() => void handleSubmitComment()}
              >
                {isAddingComment ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                )}
                {t('detailPanel.commentAction')}
              </Button>
            </div>
          </div>
        ) : null}

        {isCommentsPending ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('detailPanel.loadingActivity')}
          </p>
        ) : feed.length === 0 ? (
          <EmptyPanelState
            icon={MessageSquare}
            title={t('detailPanel.emptyActivityTitle')}
            description={t('detailPanel.emptyActivityDescription')}
          />
        ) : (
          <div>
            {feed.map((entry, index) => {
              const isLast = index === feed.length - 1;

              if (entry.kind === 'comment') {
                const comment = entry.item;
                const initial = (
                  comment.author.firstName?.[0] ?? comment.author.email[0]
                ).toUpperCase();

                return (
                  <div key={`comment-${comment.id}`} className="flex gap-3 pb-4">
                    <div className="flex flex-col items-center pt-0.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                        {initial}
                      </div>
                      {!isLast ? <div className="mt-1 w-px flex-1 bg-border/50" /> : null}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="mb-1.5 flex flex-wrap items-baseline gap-1.5">
                        <span className="text-sm font-semibold text-foreground">
                          {formatTicketUser(comment.author)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {comment.author.email}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatTicketDateTime(comment.createdAt, locale)}
                        </span>
                      </div>
                      <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2">
                        <p className="text-sm leading-7 whitespace-pre-wrap text-foreground">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              const activity = entry.item;
              const actionClass =
                TICKET_REQUEST_ACTIVITY_COLORS[activity.action] ??
                'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-300';
              const stepTransition =
                activity.payload?.fromStepCode && activity.payload?.toStepCode
                  ? `${getTicketStepLabel(activity.payload.fromStepCode, tSteps)} -> ${getTicketStepLabel(activity.payload.toStepCode, tSteps)}`
                  : null;
              const noteOrReason = activity.payload?.note ?? activity.payload?.reason ?? null;
              const actorName = activity.actor ? formatTicketUser(activity.actor) : t('common.system');

              return (
                <div key={`activity-${activity.id}`} className="flex gap-3 pb-4">
                  <div className="flex flex-col items-center pt-1.5">
                    <div className={cn('h-2 w-2 shrink-0 rounded-full border', actionClass)} />
                    {!isLast ? <div className="mt-1 w-px flex-1 bg-border/50" /> : null}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
                          actionClass,
                        )}
                      >
                        {formatTicketRequestActivityAction(activity.action, t)}
                      </span>
                      <span className="text-sm text-foreground">{actorName}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatTicketDateTime(activity.createdAt, locale)}
                      </span>
                    </div>
                    {stepTransition ? (
                      <p className="mt-1 text-xs text-muted-foreground">{stepTransition}</p>
                    ) : null}
                    {noteOrReason ? (
                      <p className="mt-1.5 text-sm leading-6 whitespace-pre-wrap text-foreground">
                        {noteOrReason}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
