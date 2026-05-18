import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type {
  KnownTicketRequestStatus,
  KnownTicketRequestType,
  TicketRequestStatus,
  TicketRequestType,
} from '../../../../services/ticket/types/ticket-request.types';
import {
  getTicketStatusLabel,
  getTicketTypeLabel,
} from './ticket-request-utils';

const statusClassName: Record<KnownTicketRequestStatus, string> = {
  pending_approval:
    'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700',
  pending_submission:
    'bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-900/30 dark:text-violet-200 dark:border-violet-700',
  changes_requested:
    'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-700',
  approved:
    'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700',
  rejected:
    'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-700',
  canceled:
    'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800/40 dark:text-zinc-300 dark:border-zinc-600',
};

const typeClassName: Record<KnownTicketRequestType, string> = {
  leave: 'bg-green-100 text-green-900 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700',
  wfh: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700',
  overtime:
    'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700',
  advance:
    'bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700',
  general:
    'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800/40 dark:text-slate-200 dark:border-slate-600',
};

interface BadgeProps {
  className?: string;
}

function getStatusClassName(status: TicketRequestStatus): string {
  if (status in statusClassName) {
    return statusClassName[status as KnownTicketRequestStatus];
  }

  return 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800/40 dark:text-zinc-300 dark:border-zinc-600';
}

function getTypeClassName(type: TicketRequestType): string {
  if (type in typeClassName) {
    return typeClassName[type as KnownTicketRequestType];
  }

  return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-600';
}

function resolveRequestTypeBadgeLabel(label: string | null | undefined): string {
  const trimmed = label?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : '-';
}

export function TicketRequestStatusBadge({
  status,
  className,
}: BadgeProps & { status: TicketRequestStatus }) {
  const tStatuses = useTranslations('ticket.labels.statuses');

  return (
    <Badge variant="outline" className={cn(getStatusClassName(status), className)}>
      {getTicketStatusLabel(status, tStatuses)}
    </Badge>
  );
}

export function TicketRequestTypeBadge({
  type,
  className,
}: BadgeProps & { type: TicketRequestType }) {
  const tTypes = useTranslations('ticket.labels.types');

  return (
    <Badge variant="outline" className={cn(getTypeClassName(type), className)}>
      {getTicketTypeLabel(type, tTypes)}
    </Badge>
  );
}

export function TicketRequestRequestTypeBadge({
  type,
  label,
  className,
}: BadgeProps & {
  type: TicketRequestType;
  label: string | null | undefined;
}) {
  return (
    <Badge variant="outline" className={cn(getTypeClassName(type), className)}>
      {resolveRequestTypeBadgeLabel(label)}
    </Badge>
  );
}
