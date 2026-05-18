'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Clock3,
  Hash,
  Link2,
  Lock,
  Paperclip,
  Users,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import {
  extractTeamChatMessageLinksFromText,
  resolveTenantAwareTeamChatMessageLinkHref,
  type TeamChatMessageLinkReference,
} from '../lib/team-chat-message-link.utils';
import { TeamChatService } from '../services/team-chat.service';

interface TeamChatComposerMessageLinkPreviewListProps {
  draft: string;
  onOpenLink?: (href: string) => void;
}

interface TeamChatComposerMessageLinkPreviewCardProps {
  link: TeamChatMessageLinkReference;
  onOpenLink?: (href: string) => void;
}

const MAX_VISIBLE_PREVIEWS = 2;

function formatResolvedAt(value: string | null | undefined, locale: string) {
  if (!value) return null;

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return null;

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsedDate);
}

function resolveRoomLabel(name: string | null | undefined, roomKey: string | null | undefined, fallback: string) {
  return name?.trim() || roomKey?.trim() || fallback;
}

function TeamChatComposerMessageLinkPreviewCard({
  link,
  onOpenLink,
}: TeamChatComposerMessageLinkPreviewCardProps) {
  const t = useTranslations('teamChat');
  const locale = useLocale();
  const serviceContext = useServiceContext();
  const service = useMemo(() => new TeamChatService(serviceContext), [serviceContext]);
  const previewQuery = useSafeQuery(
    useQuery({
      queryKey: ['teamChat', 'messages', 'linkPreview', link.roomId, link.messageId],
      queryFn: () => service.getMessageLinkPreview(link.roomId, link.messageId),
      staleTime: 60_000,
    }),
  );
  const preview = previewQuery.data;
  const href = resolveTenantAwareTeamChatMessageLinkHref({
    deepLinkUrl: preview?.deepLinkUrl ?? link.deepLinkUrl,
    roomId: link.roomId,
    messageId: link.messageId,
  });

  if (previewQuery.isPending) {
    return (
      <div className="border-border bg-muted/20 rounded-2xl border px-3.5 py-3">
        <div className="bg-muted mb-2 h-3.5 w-32 animate-pulse rounded-full" />
        <div className="bg-muted mb-2 h-4 w-2/3 animate-pulse rounded-full" />
        <div className="bg-muted h-3 w-full animate-pulse rounded-full" />
      </div>
    );
  }

  if (!preview || previewQuery.isError) {
    return (
      <div className="border-border bg-muted/20 rounded-2xl border px-3.5 py-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          <Link2 className="h-3.5 w-3.5" />
          <span>{t('composer.linkPreview.badge')}</span>
        </div>
        <p className="text-sm font-semibold text-foreground">
          {t('composer.linkPreview.unresolvedTitle')}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('composer.linkPreview.unresolvedDescription')}
        </p>
      </div>
    );
  }

  const roomLabel = resolveRoomLabel(
    preview.room.name,
    preview.room.roomKey,
    t('composer.linkPreview.fallbackRoom'),
  );
  const createdAtLabel = formatResolvedAt(preview.message?.createdAt, locale);
  const isForbidden = preview.state === 'forbidden';
  const isUnavailable =
    preview.state === 'message_deleted' || preview.state === 'message_not_found';
  const previewTitle = isForbidden
    ? t('composer.linkPreview.privateTitle')
    : isUnavailable
      ? t('composer.linkPreview.unavailableTitle')
      : preview.message?.authorName?.trim() || t('composer.linkPreview.defaultTitle');
  const previewBody = isForbidden
    ? t('composer.linkPreview.privateDescription')
    : preview.message?.contentPreview?.trim() || t('composer.linkPreview.defaultDescription');
  const RoomIcon = preview.room.roomType === 'group_dm' ? Users : isForbidden ? Lock : Hash;

  return (
    <div className="border-border bg-muted/15 rounded-2xl border px-3.5 py-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        <RoomIcon className="h-3.5 w-3.5" />
        <span>{roomLabel}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{previewTitle}</p>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {previewBody}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!onOpenLink}
            className="h-8 shrink-0 rounded-full px-3 text-xs"
            onClick={() => onOpenLink?.(href)}
          >
            {t('composer.linkPreview.open')}
            <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {createdAtLabel ? (
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {createdAtLabel}
            </span>
          ) : null}
          {preview.message?.hasAttachments ? (
            <span className="inline-flex items-center gap-1">
              <Paperclip className="h-3.5 w-3.5" />
              {t('composer.linkPreview.attachment')}
            </span>
          ) : null}
          <span>
            {preview.room.visibility === 'private'
              ? t('composer.linkPreview.privateRoom')
              : t('composer.linkPreview.publicRoom')}
          </span>
        </div>
      </div>
    </div>
  );
}

export function TeamChatComposerMessageLinkPreviewList({
  draft,
  onOpenLink,
}: TeamChatComposerMessageLinkPreviewListProps) {
  const t = useTranslations('teamChat');
  const messageLinks = useMemo(() => extractTeamChatMessageLinksFromText(draft), [draft]);

  if (!messageLinks.length) return null;

  const visibleLinks = messageLinks.slice(0, MAX_VISIBLE_PREVIEWS);
  const hiddenCount = Math.max(messageLinks.length - visibleLinks.length, 0);

  return (
    <div className="space-y-2.5 px-4 pt-1 pb-1">
      <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        <Link2 className="h-3.5 w-3.5" />
        <span>{t('composer.linkPreview.sectionTitle')}</span>
      </div>

      {visibleLinks.map((link) => (
        <TeamChatComposerMessageLinkPreviewCard
          key={`${link.roomId}:${link.messageId}`}
          link={link}
          onOpenLink={onOpenLink}
        />
      ))}

      {hiddenCount > 0 ? (
        <p className="text-xs text-muted-foreground">
          {t('composer.linkPreview.moreDetected', { count: hiddenCount })}
        </p>
      ) : null}
    </div>
  );
}
