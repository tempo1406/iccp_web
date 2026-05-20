'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, Loader2 } from 'lucide-react';
import { useTicketRequestDetailQuery } from '@/features/tenant/ticket-requests/query/ticket-requests.queries';
import { getInitials } from '@/lib/utils';
import { formatDateTime } from '@/utils/formatDateTime';
import type { NotificationDto } from '@/services/notifications/types';
import type {
  NotificationPerson,
  NotificationTicketCcMember,
  NotificationTicketDetail,
  NotificationTicketUserSummary,
  TicketNotificationMeta,
} from '../types';

interface NotificationTicketDetailCardProps {
  notification: NotificationDto;
  senderName: string;
  senderId: string | null;
  senderAvatarUrl: string | null;
}

const EMPTY_TICKET_META: TicketNotificationMeta = {
  isTicket: false,
  ticketId: null,
  ticketCode: null,
  action: null,
  requestTitle: null,
  requestContent: null,
  requestTypeLabel: null,
  workflowCode: null,
  priority: null,
  reasonCode: null,
  reasonDetail: null,
  requester: null,
  approver: null,
  actor: null,
  ccMembers: [],
};

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildNameFromParts(
  firstName: string | null,
  lastName: string | null,
  fallback: string | null,
): string {
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (fullName.length > 0) {
    return fullName;
  }

  return fallback ?? 'Unknown';
}

function parsePerson(value: unknown): NotificationPerson | null {
  const row = toRecord(value);
  if (!row) {
    return null;
  }

  const id = readString(row.id) ?? readString(row.userId) ?? readString(row.memberId);
  const firstName = readString(row.firstName);
  const lastName = readString(row.lastName);
  const name = buildNameFromParts(
    firstName,
    lastName,
    readString(row.name) ?? readString(row.fullName),
  );
  const email = readString(row.email);
  const avatarUrl = readString(row.avatarUrl) ?? readString(row.imageUrl);

  return {
    id,
    name: name.length > 0 ? name : email ?? 'Unknown',
    avatarUrl,
    email,
  };
}

function parsePeople(value: unknown): NotificationPerson[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => parsePerson(item))
    .filter((item): item is NotificationPerson => Boolean(item));
}

function parseTicketCodeFromTitle(title: string): string | null {
  const match = title.match(/\[Ticket\s+([^\]]+)\]/i);
  return match?.[1]?.trim() ?? null;
}

function inferAction(notification: NotificationDto): string | null {
  const title = notification.title.toLowerCase();
  const message = notification.message.toLowerCase();
  const text = `${title} ${message}`;

  if (text.includes('changes requested')) return 'changes_requested';
  if (text.includes('resubmitted')) return 'resubmitted';
  if (text.includes('approved')) return 'approved';
  if (text.includes('rejected')) return 'rejected';
  if (text.includes('new ticket request') || text.includes('submitted')) return 'created';

  return null;
}

function extractTicketNotificationMeta(notification: NotificationDto): TicketNotificationMeta {
  const data = toRecord(notification.data);
  const moduleCode = readString(data?.module)?.toLowerCase();
  const isTicket =
    notification.type.toLowerCase().includes('ticket') || moduleCode === 'ticket_request';

  if (!isTicket) {
    return EMPTY_TICKET_META;
  }

  const ticketObject = toRecord(data?.ticket);
  const ticketId =
    readString(data?.ticketId) ?? readString(data?.ticket_id) ?? readString(ticketObject?.id);

  const requester =
    parsePerson(data?.requester) ??
    parsePerson(data?.requesterUser) ??
    parsePerson(data?.creator) ??
    parsePerson(data?.createdBy);

  const actor =
    parsePerson(data?.actor) ??
    parsePerson(data?.actorUser) ??
    parsePerson(data?.requestChangesBy) ??
    parsePerson(data?.requestChangesByUser) ??
    parsePerson(data?.requestedBy);
  const approver =
    parsePerson(data?.approver) ??
    parsePerson(data?.nextApprover) ??
    parsePerson(data?.currentApprover);

  const ccMembersFromData = parsePeople(data?.ccMembers);
  const ccMembers =
    ccMembersFromData.length > 0 ? ccMembersFromData : parsePeople(data?.cc_members);

  return {
    isTicket: true,
    ticketId,
    ticketCode:
      readString(data?.code) ??
      readString(data?.ticketCode) ??
      readString(ticketObject?.code) ??
      parseTicketCodeFromTitle(notification.title),
    action: readString(data?.action) ?? inferAction(notification),
    requestTitle:
      readString(data?.requestTitle) ??
      readString(data?.ticketTitle) ??
      readString(ticketObject?.title) ??
      readString(data?.request_title),
    requestContent:
      readString(data?.requestContent) ??
      readString(data?.ticketContent) ??
      readString(ticketObject?.content) ??
      readString(data?.description),
    requestTypeLabel:
      readString(data?.requestTypeName) ??
      readString(data?.requestTypeCode) ??
      readString(ticketObject?.requestTypeName) ??
      readString(ticketObject?.requestTypeCode) ??
      readString(data?.requestType),
    workflowCode: readString(data?.workflowCode) ?? readString(ticketObject?.workflowCode),
    priority: readString(data?.priority) ?? readString(ticketObject?.priority),
    reasonCode: readString(data?.reasonCode) ?? readString(ticketObject?.reasonCode),
    reasonDetail: readString(data?.reasonDetail) ?? readString(ticketObject?.reasonDetail),
    requester,
    approver,
    actor,
    ccMembers,
  };
}

function getActorLabel(
  action: string | null,
  t: (key: string) => string,
): string {
  const normalized = action?.trim().toLowerCase() ?? '';

  if (normalized === 'changes_requested') {
    return t('actorLabels.requestedChangesBy');
  }

  if (normalized === 'created' || normalized === 'submitted') {
    return t('actorLabels.createdBy');
  }

  return t('actorLabels.actionBy');
}

function humanizeCode(value: string | null | undefined): string {
  if (!value || value.trim().length === 0) {
    return '-';
  }

  return value
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatTicketUserName(
  user: NotificationTicketUserSummary | NotificationPerson | null | undefined,
): string | null {
  if (!user) {
    return null;
  }

  const firstName = 'firstName' in user ? readString(user.firstName) : null;
  const lastName = 'lastName' in user ? readString(user.lastName) : null;
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  if (fullName.length > 0) {
    return fullName;
  }

  const fallbackName = 'name' in user ? readString(user.name) : null;
  return fallbackName ?? readString(user.email) ?? null;
}

function resolveCcMemberId(member: NotificationTicketCcMember | NotificationPerson): string | null {
  const row = toRecord(member);
  const nestedMember = toRecord(row?.member);
  const user = nestedMember ?? row ?? {};
  return readString(user.id);
}

function resolveCcMemberName(member: NotificationTicketCcMember | NotificationPerson): string {
  const row = toRecord(member);
  const nestedMember = toRecord(row?.member);
  const user = nestedMember ?? row ?? {};

  const named = readString(user.name);
  if (named) {
    return named;
  }

  const firstName = readString(user.firstName);
  const lastName = readString(user.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  if (fullName.length > 0) {
    return fullName;
  }

  return readString(user.name) ?? readString(user.email) ?? 'Unknown';
}

function PersonCard({
  label,
  name,
  avatarUrl,
  extra,
}: {
  label: string;
  name: string;
  avatarUrl: string | null;
  extra?: string | null;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-background/60 p-2.5">
      <Avatar className="h-9 w-9">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
        <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium">{name}</p>
        {extra && <p className="truncate text-xs text-muted-foreground">{extra}</p>}
      </div>
    </div>
  );
}

function resolveActor(
  ticketMeta: TicketNotificationMeta,
  ticketDetail: NotificationTicketDetail | undefined,
  sender: Pick<NotificationPerson, 'id' | 'name' | 'avatarUrl'>,
): NotificationPerson | null {
  if (ticketMeta.actor) {
    return ticketMeta.actor;
  }

  const normalizedAction = ticketMeta.action?.trim().toLowerCase() ?? '';
  const activityActor = ticketDetail?.activities
    ?.slice()
    .reverse()
    .find((activity) => {
      if (!normalizedAction) {
        return false;
      }

      if (normalizedAction === 'created') {
        return activity.action === 'created' || activity.action === 'submitted';
      }

      return activity.action === normalizedAction;
    })?.actor;

  const activityActorName = formatTicketUserName(activityActor);
  if (activityActorName) {
    return {
      id: activityActor?.id ?? null,
      name: activityActorName,
      avatarUrl: null,
      email: activityActor?.email ?? null,
    };
  }

  if (!sender.id) {
    return null;
  }

  return {
    id: sender.id,
    name: sender.name,
    avatarUrl: sender.avatarUrl,
    email: null,
  };
}

export function NotificationTicketDetailCard({
  notification,
  senderName,
  senderId,
  senderAvatarUrl,
}: NotificationTicketDetailCardProps) {
  const t = useTranslations('notifications.ticketDetail');
  const locale = useLocale();
  const ticketMeta = useMemo(() => extractTicketNotificationMeta(notification), [notification]);

  const ticketDetailQuery = useTicketRequestDetailQuery(
    ticketMeta.ticketId,
    Boolean(ticketMeta.isTicket && ticketMeta.ticketId),
  );

  if (!ticketMeta.isTicket) {
    return null;
  }

  const ticketDetail = ticketDetailQuery.data;
  const requesterId = ticketDetail?.requester?.id ?? ticketMeta.requester?.id ?? null;
  const requesterName =
    formatTicketUserName(ticketDetail?.requester) ?? ticketMeta.requester?.name ?? t('defaults.requester');
  const requesterAvatarUrl =
    ticketMeta.requester?.avatarUrl ??
    (senderAvatarUrl && requesterId && senderId === requesterId ? senderAvatarUrl : null);
  const approverId = ticketDetail?.approver?.id ?? ticketMeta.approver?.id ?? null;
  const approverName =
    formatTicketUserName(ticketDetail?.approver) ?? ticketMeta.approver?.name ?? null;
  const approverAvatarUrl =
    ticketMeta.approver?.avatarUrl ??
    (senderAvatarUrl && approverId && senderId === approverId ? senderAvatarUrl : null);

  const actor = resolveActor(ticketMeta, ticketDetail, {
    id: senderId,
    name: senderName,
    avatarUrl: senderAvatarUrl,
  });
  const actorLabel = getActorLabel(ticketMeta.action, t);
  const normalizedAction = ticketMeta.action?.trim().toLowerCase() ?? '';
  const shouldShowActor =
    Boolean(actor) && normalizedAction !== 'created' && normalizedAction !== 'submitted';

  const ticketCode = ticketDetail?.code ?? ticketMeta.ticketCode;
  const ticketRequestType =
    ticketDetail?.requestTypeName ?? ticketDetail?.requestTypeCode ?? ticketMeta.requestTypeLabel;
  const ticketWorkflow = ticketDetail?.workflowCode ?? ticketMeta.workflowCode;
  const ticketStatus = ticketDetail?.status ?? null;
  const ticketStep = ticketDetail?.currentStepCode ?? null;
  const ticketTitle = ticketDetail?.title ?? ticketMeta.requestTitle;
  const ticketContent = ticketDetail?.content ?? ticketMeta.requestContent;
  const ticketReasonCode = ticketDetail?.reasonCode ?? ticketMeta.reasonCode;
  const ticketReasonDetail = ticketDetail?.reasonDetail ?? ticketMeta.reasonDetail;
  const ticketStartAt = ticketDetail?.startAt ?? null;
  const ticketEndAt = ticketDetail?.endAt ?? null;
  const ticketCcMembers = (() => {
    const detailMembers = ticketDetail?.ccMembers ?? [];

    if (detailMembers.length === 0) {
      return ticketMeta.ccMembers;
    }

    if (ticketMeta.ccMembers.length === 0) {
      return detailMembers;
    }

    const metaById = new Map(
      ticketMeta.ccMembers
        .map((member) => [member.id, member] as const)
        .filter((entry): entry is [string, NotificationPerson] => Boolean(entry[0])),
    );

    return detailMembers.map((detailMember) => {
      const detailId = resolveCcMemberId(detailMember);
      if (!detailId) {
        return detailMember;
      }

      return metaById.get(detailId) ?? detailMember;
    });
  })();

  return (
    <div className="mb-4 space-y-3">
      <div className="rounded-md border bg-background/60 p-3">
        <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">{t('ccMembers')}</p>
        {ticketCcMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground">-</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {ticketCcMembers.map((member, index) => (
              <span
                key={`${resolveCcMemberName(member)}-${index}`}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-2.5 w-2.5" />
                </span>
                <span>{resolveCcMemberName(member)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-md border bg-muted/20 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{t('ticketInfo')}</p>
          {ticketDetailQuery.isPending && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('loadingDetail')}
            </span>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-md border bg-background/60 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t('ticketCode')}</p>
            <p className="text-sm font-medium">{ticketCode ?? '-'}</p>
          </div>
          <div className="rounded-md border bg-background/60 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t('requestType')}</p>
            <p className="text-sm font-medium">{ticketRequestType ?? '-'}</p>
          </div>
          <div className="rounded-md border bg-background/60 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t('workflow')}</p>
            <p className="text-sm font-medium">{humanizeCode(ticketWorkflow)}</p>
          </div>
          <div className="rounded-md border bg-background/60 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t('status')}</p>
            <p className="text-sm font-medium">{humanizeCode(ticketStatus)}</p>
          </div>
          <div className="rounded-md border bg-background/60 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t('currentStep')}</p>
            <p className="text-sm font-medium">{humanizeCode(ticketStep)}</p>
          </div>
        </div>

        <div className="space-y-2 rounded-md border bg-background/60 p-2.5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t('title')}</p>
          <p className="text-sm font-medium">{ticketTitle ?? '-'}</p>
        </div>

        <div className="space-y-2 rounded-md border bg-background/60 p-2.5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t('content')}</p>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{ticketContent ?? '-'}</p>
        </div>

        {(ticketReasonCode || ticketReasonDetail) && (
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-md border bg-background/60 p-2.5">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t('reason')}</p>
              <p className="text-sm font-medium">{humanizeCode(ticketReasonCode)}</p>
            </div>
            <div className="rounded-md border bg-background/60 p-2.5">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {t('reasonDetail')}
              </p>
              <p className="text-sm text-muted-foreground">{ticketReasonDetail ?? '-'}</p>
            </div>
          </div>
        )}

        {(ticketStartAt || ticketEndAt) && (
          <div className="rounded-md border bg-background/60 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t('schedule')}</p>
            <p className="text-sm font-medium">
              {ticketStartAt ? formatDateTime(ticketStartAt, locale) : '-'} -{' '}
              {ticketEndAt ? formatDateTime(ticketEndAt, locale) : '-'}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('participants')}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <PersonCard
              label={t('requester')}
              name={requesterName}
              avatarUrl={requesterAvatarUrl}
              extra={ticketDetail?.requester?.email ?? ticketMeta.requester?.email}
            />
            {approverName && (
              <PersonCard
                label={t('approver')}
                name={approverName}
                avatarUrl={approverAvatarUrl}
                extra={ticketDetail?.approver?.email ?? ticketMeta.approver?.email}
              />
            )}
            {shouldShowActor && actor && (
              <PersonCard
                label={actorLabel}
                name={actor.name}
                avatarUrl={actor.avatarUrl}
                extra={actor.email}
              />
            )}
          </div>
        </div>

        {ticketDetailQuery.isError && (
          <p className="text-xs text-amber-600">
            {t('loadingError')}
          </p>
        )}
      </div>
    </div>
  );
}
