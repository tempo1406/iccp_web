'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Trash2, CheckCheck, UserPlus, Globe } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { formatDateTime } from '@/utils/formatDateTime';
import type { NotificationDto } from '@/services/notifications/types';
import { extractNotificationInvitationData } from '../lib/notification-chat-deeplink';
import { useNotificationSenderDisplay } from '../hooks/use-notification-sender-display';
import { isLandingPageLeadNotification } from '../utils/notification-detail.utils';
import { NotificationDetailExtensionSlot } from './notification-detail-extension-slot';

function normalizeNotificationText(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\\n/g, '\n').trim();
}

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][^>]*>/i.test(value) || /&nbsp;|<br\s*\/?>/i.test(value);
}

function getNestedStringRecordValue(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const nestedValue = (value as Record<string, unknown>)[key];
  return typeof nestedValue === 'string' ? nestedValue.trim() : undefined;
}

function resolveNotificationBody(notification: NotificationDto | null): {
  html: string | null;
  text: string | null;
} {
  const data = notification?.data;
  const contentCandidates = [
    notification?.content ?? undefined,
    typeof data?.customMessage === 'string' ? data.customMessage : undefined,
    typeof data?.contentHtml === 'string' ? data.contentHtml : undefined,
    typeof data?.messageHtml === 'string' ? data.messageHtml : undefined,
    typeof data?.message === 'string' ? data.message : undefined,
    notification?.message ?? undefined,
  ];

  for (const candidate of contentCandidates) {
    if (typeof candidate !== 'string') continue;
    const normalized = normalizeNotificationText(candidate);
    if (!normalized) continue;

    if (looksLikeHtml(normalized)) {
      return { html: normalized, text: null };
    }

    return { html: null, text: normalized };
  }

  return { html: null, text: null };
}

function shouldRenderExtraContent(
  content: string | null | undefined,
  notificationBody: { html: string | null; text: string | null },
): boolean {
  if (!content) {
    return false;
  }

  const normalizedContent = normalizeNotificationText(content);
  if (!normalizedContent) {
    return false;
  }

  return (
    normalizedContent !== notificationBody.html &&
    normalizedContent !== notificationBody.text
  );
}

function resolveOrganizationProfileUrl(
  notification: NotificationDto | null,
): string | null {
  const data = notification?.data;
  if (!data) return null;

  const directUrlCandidates = [
    typeof data.website === 'string' ? data.website.trim() : undefined,
    typeof data.organizationWebsite === 'string'
      ? data.organizationWebsite.trim()
      : undefined,
    typeof data.orgWebsite === 'string' ? data.orgWebsite.trim() : undefined,
    getNestedStringRecordValue(data.organization, 'website'),
    getNestedStringRecordValue(data.org, 'website'),
  ].filter((value): value is string => Boolean(value));

  const directUrl = directUrlCandidates[0];
  if (!directUrl) return null;
  return /^https?:\/\//i.test(directUrl) ? directUrl : `https://${directUrl}`;
}

interface NotificationDetailPanelProps {
  notification: NotificationDto | null;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAcceptInvitation?: (notification: NotificationDto) => void;
  isAccepting?: boolean;
  invitationAccepted?: boolean;
  onAcceptProjectInvitation?: (notification: NotificationDto) => void;
  pendingProjectInviteIds?: Set<string>;
  orgInvitationIsPending?: boolean;
}

export function NotificationDetailPanel({
  notification,
  onMarkRead,
  onDelete,
  onAcceptInvitation,
  isAccepting,
  invitationAccepted = false,
  onAcceptProjectInvitation,
  pendingProjectInviteIds,
  orgInvitationIsPending,
}: NotificationDetailPanelProps) {
  const tCommon = useTranslations('notifications.common');
  const tDetail = useTranslations('notifications.detailPanel');
  const locale = useLocale();
  const { senderId, senderAvatarUrl, senderName } =
    useNotificationSenderDisplay(notification);

  if (!notification) {
    return (
      <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-3">
        <Bell className="h-12 w-12 opacity-30" />
        <p className="text-sm">{tDetail('empty')}</p>
      </div>
    );
  }

  const initials = getInitials(senderName);
  const invitationData = extractNotificationInvitationData(notification);
  const canAcceptInvitation = Boolean(
    invitationData &&
    onAcceptInvitation &&
    (Boolean(invitationData.invitationId) || orgInvitationIsPending !== false),
  );

  const inviteId = notification.data?.inviteId as string | undefined;
  const isProjectInvite =
    notification.type === 'project_invite' &&
    Boolean(notification.data?.token) &&
    (!pendingProjectInviteIds || !inviteId || pendingProjectInviteIds.has(inviteId));
  const organizationProfileUrl = resolveOrganizationProfileUrl(notification);
  const opensExternalProfile = Boolean(organizationProfileUrl?.match(/^https?:\/\//i));
  const notificationBody = resolveNotificationBody(notification);
  const hideDefaultBody = isLandingPageLeadNotification(notification);
  const renderExtraContent = shouldRenderExtraContent(
    notification.content,
    notificationBody,
  );

  return (
    <div className="flex min-h-0 w-full flex-col overflow-y-auto p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {senderAvatarUrl && <AvatarImage src={senderAvatarUrl} alt={senderName} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{senderName}</p>
            <p className="text-muted-foreground text-xs">
              {formatDateTime(notification.createdAt, locale)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!notification.read && onMarkRead && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground h-7 w-7"
              title={tCommon('markAsRead')}
              onClick={() => onMarkRead(notification.id)}
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive h-7 w-7"
              title={tCommon('delete')}
              onClick={() => onDelete(notification.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-base font-semibold">{notification.title}</h2>
      </div>

      {!hideDefaultBody && notificationBody.html ? (
        <div
          className="prose prose-sm bg-muted/20 text-foreground prose-p:my-2 prose-headings:mt-2 prose-headings:mb-1 mb-4 max-w-none rounded-md border p-4"
          dangerouslySetInnerHTML={{ __html: notificationBody.html }}
        />
      ) : !hideDefaultBody && notificationBody.text ? (
        <p className="text-muted-foreground mb-4 text-sm whitespace-pre-line">
          {notificationBody.text}
        </p>
      ) : null}

      {renderExtraContent && notification.content && (
        <div
          className="prose prose-sm prose-headings:mt-2 prose-headings:mb-1 bg-muted/20 max-w-none rounded-md border p-4"
          dangerouslySetInnerHTML={{ __html: notification.content }}
        />
      )}

      <NotificationDetailExtensionSlot
        notification={notification}
        senderName={senderName}
        senderId={senderId}
        senderAvatarUrl={senderAvatarUrl}
      />

      {canAcceptInvitation ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {invitationAccepted ? (
            <Badge
              variant="secondary"
              className="rounded-md px-2.5 py-1 text-xs font-medium"
            >
              {tCommon('accepted')}
            </Badge>
          ) : (
            <Button
              size="sm"
              onClick={() => onAcceptInvitation?.(notification)}
              disabled={isAccepting}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {isAccepting ? tCommon('accepting') : tDetail('acceptInvitation')}
            </Button>
          )}
          {organizationProfileUrl && (
            <Button asChild size="sm" variant="outline" className="gap-2">
              <a
                href={organizationProfileUrl}
                {...(opensExternalProfile ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                <Globe className="h-4 w-4" />
                {tDetail('organizationProfile')}
              </a>
            </Button>
          )}
        </div>
      ) : null}

      {isProjectInvite && onAcceptProjectInvitation ? (
        <div className="mt-4">
          <Button
            size="sm"
            onClick={() => onAcceptProjectInvitation(notification)}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {tDetail('acceptProjectInvitation')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
