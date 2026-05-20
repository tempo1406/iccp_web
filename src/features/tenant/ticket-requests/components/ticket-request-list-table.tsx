import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  TicketRequestListMeta,
  TicketRequestSummary,
} from '../../../../services/ticket/types/ticket-request.types';
import {
  TicketRequestRequestTypeBadge,
  TicketRequestStatusBadge,
} from './ticket-request-badges';
import { formatTicketDateTime, formatTicketUser, getTicketStepLabel } from './ticket-request-utils';

interface TicketRequestListTableProps {
  tickets: TicketRequestSummary[];
  meta: TicketRequestListMeta;
  selectedTicketId: string | null;
  canView: boolean;
  isPending: boolean;
  isError: boolean;
  errorMessage: string | null;
  onView: (ticketId: string) => void;
  onPageChange: (page: number) => void;
}

export function TicketRequestListTable({
  tickets,
  meta,
  selectedTicketId,
  canView,
  isPending,
  isError,
  errorMessage,
  onView,
  onPageChange,
}: TicketRequestListTableProps) {
  const t = useTranslations('ticket');
  const tSteps = useTranslations('ticket.labels.steps');
  const locale = useLocale();

  if (isPending) {
    return (
      <div className="space-y-3">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.columns.ticket')}</TableHead>
                <TableHead>{t('table.columns.requestType')}</TableHead>
                <TableHead>{t('table.columns.requester')}</TableHead>
                <TableHead>{t('table.columns.step')}</TableHead>
                <TableHead>{t('table.columns.status')}</TableHead>
                <TableHead className="text-right">{t('table.columns.updated')}</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">{t('table.columns.view')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-7 w-7 rounded-md" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm font-medium text-destructive">
          {errorMessage ?? t('table.error')}
        </p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        {t('table.empty')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.columns.ticket')}</TableHead>
              <TableHead>{t('table.columns.requestType')}</TableHead>
              <TableHead>{t('table.columns.requester')}</TableHead>
              <TableHead>{t('table.columns.step')}</TableHead>
              <TableHead>{t('table.columns.status')}</TableHead>
              <TableHead className="text-right">{t('table.columns.updated')}</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">{t('table.columns.view')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow
                key={ticket.id}
                className={cn(
                  canView && 'cursor-pointer',
                  selectedTicketId === ticket.id && 'bg-primary/5 hover:bg-primary/10',
                )}
                tabIndex={canView ? 0 : -1}
                onClick={() => {
                  if (canView) onView(ticket.id);
                }}
                onKeyDown={(event) => {
                  if (!canView) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onView(ticket.id);
                  }
                }}
              >
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold">{ticket.code}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{ticket.title}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <TicketRequestRequestTypeBadge
                    type={ticket.type}
                    label={ticket.requestTypeName ?? ticket.requestTypeCode}
                  />
                </TableCell>
                <TableCell className="text-sm">{formatTicketUser(ticket.requester)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {getTicketStepLabel(ticket.currentStepCode, tSteps)}
                </TableCell>
                <TableCell>
                  <TicketRequestStatusBadge status={ticket.status} />
                </TableCell>
                <TableCell className="text-right text-xs whitespace-nowrap">
                  {formatTicketDateTime(ticket.updatedAt, locale)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="text"
                    size="icon-sm"
                    className="cursor-pointer hover:bg-accent"
                    onClick={(event) => {
                      event.stopPropagation();
                      onView(ticket.id);
                    }}
                    disabled={!canView}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">{t('table.viewTicket', { code: ticket.code })}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {t('table.total', { count: meta.total, plural: meta.total === 1 ? '' : 's' })}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasPreviousPage}
            onClick={() => onPageChange(Math.max(meta.page - 1, 1))}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t('table.pagination.prev')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('table.pagination.page', {
              page: meta.page,
              totalPages: Math.max(meta.totalPages, 1),
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasNextPage}
            onClick={() => onPageChange(meta.page + 1)}
          >
            {t('table.pagination.next')}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
