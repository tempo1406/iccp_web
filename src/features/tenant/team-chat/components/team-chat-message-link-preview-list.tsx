'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight,
  ChevronDown,
  Clock3,
  ExternalLink,
  Hash,
  Lock,
  Users,
  Paperclip,
  Play,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { cn } from '@/lib/utils';
import type { ConversationMessage, LinkPreview } from '../data/team-chat-ui-data';
import { mapMessageToConversationMessage } from '../lib/team-chat-api-mappers';
import { resolveTenantAwareTeamChatMessageLinkHref } from '../lib/team-chat-message-link.utils';
import {
  resolveTeamChatLinkPreview,
  type TeamChatLinkPreviewKind,
} from '../lib/team-chat-link-preview.utils';
import {
  canRenderRealTeamChatLinkPreviewHeroImage,
  shouldAttemptTeamChatLinkPreviewHeroImageLoad,
} from '../lib/team-chat-preview-state.utils';
import { useTeamChatProtectedAssetUrl } from '../hooks/use-team-chat-protected-asset-url';
import { teamChatQueryKeys } from '../query/use-team-chat';
import { TeamChatService } from '../services/team-chat.service';
import {
  type TeamChatMessageCursorResponse,
  type TeamChatResolvedMessageContextResponse,
} from '../services/types/team-chat.types';
import { TeamChatProviderIcon } from './team-chat-provider-icon';

interface TeamChatMessageLinkPreviewListProps {
  message: ConversationMessage;
  onOpenMessageLink?: (href: string) => void;
}

type LinkPreviewWithInternalReference = LinkPreview & {
  internalReference?: {
    kind: 'team_chat_message' | string;
    roomId: string;
    messageId: string;
    deepLinkUrl?: string;
  };
};

interface TeamChatLinkPreviewArtworkProps {
  kind: TeamChatLinkPreviewKind;
  providerLabel: string;
  fallbackLabel: string;
}

function getPendingPreviewHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return url;
  }
}

function getLinkPreviewIdentity(preview: LinkPreview) {
  return (preview.canonicalUrl ?? preview.url).trim() || preview.url;
}

function getLinkPreviewRenderKey(
  message: ConversationMessage,
  preview: LinkPreview,
) {
  const renderVersion =
    [
      message.linkPreviewVersion,
      preview.fetchedAt,
      preview.previewVersion,
      preview.previewImageUrl,
      preview.imageUrl,
      preview.thumbnailUrl,
      preview.status,
      preview.previewAssetId,
      preview.previewAssetStatus,
      preview.previewAssetSource,
      preview.previewAssetErrorCode,
    ]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value))
      .join(':') || 'base';

  return `${getLinkPreviewIdentity(preview)}:${renderVersion}`;
}

function normalizeLinkPreviewUrlList(urls?: string[]) {
  if (!Array.isArray(urls)) return [];

  return Array.from(new Set(urls.map((url) => url.trim()).filter((url) => url.length > 0)));
}

function formatPreviewFetchedAt(value: string | undefined, locale: string) {
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

function resolveInternalMessageRoomLabel(
  room?: {
    name?: string | null;
    roomKey?: string | null;
    visibility?: string | null;
  } | null,
  options?: {
    isForbidden?: boolean;
    privateRoomLabel: string;
    fallbackRoomLabel: string;
  },
) {
  if (options?.isForbidden) {
    return options.privateRoomLabel;
  }

  const roomName = room?.name?.trim();
  if (roomName) return roomName;

  const roomKey = room?.roomKey?.trim();
  if (roomKey) return `#${roomKey}`;

  return options?.fallbackRoomLabel ?? 'Team Chat';
}

function PreviewLine({ className }: { className?: string }) {
  return <div className={cn('rounded-full bg-slate-200/90', className)} />;
}

function SpreadsheetPreviewArtwork() {
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#17382d] via-[#183b30] to-[#10131a] px-8 py-7">
      <div className="w-full max-w-[560px] rounded-[26px] bg-white/96 p-5 shadow-[0_28px_60px_-26px_rgba(15,23,42,0.82)]">
        <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white">
          <div className="grid grid-cols-5 gap-px bg-slate-200 p-px">
            {Array.from({ length: 25 }).map((_, index) => {
              const isHeaderRow = index < 5;
              const isFirstColumn = index % 5 === 0;

              return (
                <div
                  key={`cell-${index}`}
                  className={cn(
                    'h-8 rounded-[4px]',
                    isHeaderRow
                      ? 'bg-emerald-500/90'
                      : isFirstColumn
                        ? 'bg-emerald-100'
                        : 'bg-slate-50',
                  )}
                />
              );
            })}
          </div>
          <div className="space-y-3 px-4 py-4">
            <PreviewLine className="h-3.5 w-2/5 bg-emerald-200" />
            <PreviewLine className="h-3 w-full" />
            <PreviewLine className="h-3 w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentPreviewArtwork() {
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-sky-900/70 via-slate-900 to-slate-950 px-8 py-7">
      <div className="w-full max-w-[440px] rounded-[28px] bg-white/96 p-6 shadow-[0_28px_60px_-26px_rgba(15,23,42,0.82)]">
        <div className="space-y-3">
          <PreviewLine className="h-4 w-1/3 bg-sky-200" />
          <PreviewLine className="h-3 w-full" />
          <PreviewLine className="h-3 w-11/12" />
          <PreviewLine className="h-3 w-4/5" />
          <PreviewLine className="h-3 w-full" />
          <PreviewLine className="h-3 w-10/12" />
          <PreviewLine className="h-3 w-4/6" />
        </div>
      </div>
    </div>
  );
}

function PresentationPreviewArtwork() {
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-900/70 via-slate-900 to-slate-950 px-8 py-7">
      <div className="w-full max-w-[520px] rounded-[28px] bg-white/96 p-5 shadow-[0_28px_60px_-26px_rgba(15,23,42,0.82)]">
        <PreviewLine className="mb-4 h-4 w-2/5 bg-orange-200" />
        <div className="grid grid-cols-[1.2fr_0.8fr] gap-4">
          <div className="rounded-[18px] bg-orange-100 p-4">
            <div className="h-full rounded-[14px] border border-dashed border-orange-300 bg-white/60" />
          </div>
          <div className="space-y-3 pt-2">
            <PreviewLine className="h-3 w-full" />
            <PreviewLine className="h-3 w-5/6" />
            <PreviewLine className="h-3 w-4/6" />
            <PreviewLine className="h-3 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ImagePreviewArtwork() {
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-fuchsia-950/60 via-slate-900 to-slate-950 px-8 py-7">
      <div className="w-full max-w-[520px] overflow-hidden rounded-[28px] border border-white/30 bg-white/95 p-4 shadow-[0_28px_60px_-26px_rgba(15,23,42,0.82)]">
        <div className="h-[220px] rounded-[22px] bg-gradient-to-br from-pink-200 via-sky-200 to-emerald-200 p-5">
          <div className="flex h-full items-end justify-between rounded-[18px] border border-white/40 bg-white/25 px-6 py-5 backdrop-blur-sm">
            <div className="space-y-2">
              <PreviewLine className="h-3.5 w-28 bg-white/90" />
              <PreviewLine className="h-3 w-20 bg-white/70" />
            </div>
            <div className="h-20 w-24 rounded-[18px] bg-white/55" />
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoPreviewArtwork() {
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-rose-950/55 via-slate-950 to-slate-950 px-8 py-7">
      <div className="w-full max-w-[560px] rounded-[28px] bg-slate-950/60 p-4 shadow-[0_28px_60px_-26px_rgba(15,23,42,0.82)] ring-1 ring-white/10 backdrop-blur-sm">
        <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_55%)]" />
          <div className="flex aspect-[16/9] items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/16 ring-1 ring-white/30 backdrop-blur">
              <Play className="ml-1 h-10 w-10 fill-white text-white" />
            </div>
          </div>
          <div className="absolute right-4 bottom-4 left-4 flex items-center gap-3">
            <PreviewLine className="h-2.5 flex-1 bg-white/40" />
            <PreviewLine className="h-2.5 w-14 bg-white/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

function WebsitePreviewArtwork({
  providerLabel,
  fallbackLabel,
}: Pick<TeamChatLinkPreviewArtworkProps, 'providerLabel' | 'fallbackLabel'>) {
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 px-8 py-7">
      <div className="w-full max-w-[560px] rounded-[28px] bg-white/96 p-5 shadow-[0_28px_60px_-26px_rgba(15,23,42,0.82)]">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-300" />
          <span className="h-3 w-3 rounded-full bg-amber-300" />
          <span className="h-3 w-3 rounded-full bg-emerald-300" />
          <div className="ml-2 h-8 flex-1 rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-500">
            {providerLabel}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-[20px] bg-slate-100 p-5">
            <PreviewLine className="mb-3 h-4 w-1/3 bg-slate-300" />
            <PreviewLine className="mb-2 h-3 w-full" />
            <PreviewLine className="mb-2 h-3 w-11/12" />
            <PreviewLine className="h-3 w-8/12" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`website-card-${index}`} className="rounded-[18px] bg-slate-100 p-4">
                <div className="mb-3 h-14 rounded-2xl bg-slate-200" />
                <PreviewLine className="mb-2 h-3 w-4/5" />
                <PreviewLine className="h-3 w-3/5" />
              </div>
            ))}
          </div>
          <div className="text-center text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
            {fallbackLabel}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamChatLinkPreviewArtwork({
  kind,
  providerLabel,
  fallbackLabel,
}: TeamChatLinkPreviewArtworkProps) {
  if (kind === 'spreadsheet') return <SpreadsheetPreviewArtwork />;
  if (kind === 'presentation') return <PresentationPreviewArtwork />;
  if (kind === 'document') return <DocumentPreviewArtwork />;
  if (kind === 'image') return <ImagePreviewArtwork />;
  if (kind === 'video') return <VideoPreviewArtwork />;

  return <WebsitePreviewArtwork providerLabel={providerLabel} fallbackLabel={fallbackLabel} />;
}

function TeamChatMessageLinkPreviewCard({
  preview,
  onOpenMessageLink,
}: {
  preview: LinkPreview;
  onOpenMessageLink?: (href: string) => void;
}) {
  const t = useTranslations('teamChat');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const internalReference = (preview as LinkPreviewWithInternalReference).internalReference;
  const isInternalMessageLink = internalReference?.kind === 'team_chat_message';
  const inlinePreviewState = internalReference?.previewState?.trim();
  const hasInlineInternalPreview = Boolean(
    inlinePreviewState || internalReference?.roomSnapshot || internalReference?.messageSnapshot,
  );
  const internalHref = internalReference
    ? resolveTenantAwareTeamChatMessageLinkHref({
        deepLinkUrl: internalReference.deepLinkUrl,
        roomId: internalReference.roomId,
        messageId: internalReference.messageId,
      })
    : null;
  const serviceContext = useServiceContext();
  const service = useMemo(() => new TeamChatService(serviceContext), [serviceContext]);
  const cachedInternalMessage = useMemo(() => {
    if (!isInternalMessageLink || !internalReference?.roomId || !internalReference?.messageId) {
      return undefined;
    }

    const cachedCursorEntries = queryClient.getQueriesData<TeamChatMessageCursorResponse>({
      queryKey: teamChatQueryKeys.messageCursorRoot(internalReference.roomId),
    });

    for (const [, cursor] of cachedCursorEntries) {
      const cachedMessage = cursor?.items?.find(
        (item) => item.id === internalReference.messageId,
      );
      if (!cachedMessage) continue;

      return {
        rawMessage: cachedMessage,
        mappedMessage: mapMessageToConversationMessage(cachedMessage, {}),
      };
    }

    const cachedContextEntries = queryClient.getQueriesData<TeamChatResolvedMessageContextResponse>({
      queryKey: ['teamChat', 'messages', 'context', internalReference.roomId, internalReference.messageId],
    });

    for (const [, context] of cachedContextEntries) {
      const cachedMessage =
        context?.items?.find((item) => item.id === internalReference.messageId) ??
        context?.items?.[0];
      if (!cachedMessage) continue;

      return {
        rawMessage: cachedMessage,
        mappedMessage: mapMessageToConversationMessage(cachedMessage, {}),
        context,
      };
    }

    return undefined;
  }, [
    internalReference,
    isInternalMessageLink,
    queryClient,
  ]);
  const shouldHydrateInternalMessageContext = Boolean(
    isInternalMessageLink &&
      internalReference?.roomId &&
      internalReference?.messageId &&
      !cachedInternalMessage,
  );
  const internalMessageContextQuery = useSafeQuery(
    useQuery({
      queryKey: teamChatQueryKeys.messageContext(
        internalReference?.roomId ?? 'none',
        internalReference?.messageId ?? 'none',
        { before: 1, after: 1 },
      ),
      queryFn: () =>
        service.getMessageContext(
          internalReference?.roomId ?? '',
          internalReference?.messageId ?? '',
          { before: 1, after: 1 },
        ),
      enabled: shouldHydrateInternalMessageContext,
      staleTime: 60_000,
    }),
  );
  const internalMessagePreviewQuery = useSafeQuery(
    useQuery({
      queryKey: [
        'teamChat',
        'messages',
        'linkPreview',
        internalReference?.roomId ?? 'none',
        internalReference?.messageId ?? 'none',
      ],
      queryFn: () =>
        service.getMessageLinkPreview(
          internalReference?.roomId ?? '',
          internalReference?.messageId ?? '',
        ),
      enabled: Boolean(
        isInternalMessageLink &&
          internalReference?.roomId &&
          internalReference?.messageId &&
          !hasInlineInternalPreview &&
          !shouldHydrateInternalMessageContext,
      ),
      staleTime: 60_000,
    }),
  );
  const resolvedPreview = resolveTeamChatLinkPreview(preview);
  const PreviewIcon = resolvedPreview.icon;
  const fetchedAtLabel = formatPreviewFetchedAt(preview.fetchedAt, locale);
  const protectedAssetVersionToken =
    [
      preview.previewVersion,
      preview.fetchedAt,
      preview.previewAssetStatus,
      preview.previewAssetSource,
      preview.previewAssetErrorCode,
      preview.previewAssetId,
    ]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value))
      .join(':') || undefined;
  const shouldAttemptHeroImageLoad = shouldAttemptTeamChatLinkPreviewHeroImageLoad(
    preview,
    resolvedPreview.previewImageUrl,
  );
  const {
    assetUrl: heroImageUrl,
    isLoading: isHeroImageLoading,
  } = useTeamChatProtectedAssetUrl(
    shouldAttemptHeroImageLoad ? resolvedPreview.previewImageUrl : undefined,
    protectedAssetVersionToken,
  );
  const [open, setOpen] = useState(true);
  const hydratedInternalContextMessage = useMemo(() => {
    const context = internalMessageContextQuery.data;
    if (!context || !internalReference?.messageId) return undefined;

    const rawMessage =
      context.items?.find((item) => item.id === internalReference.messageId) ??
      context.items?.[0];
    if (!rawMessage) return undefined;

    return {
      context,
      rawMessage,
      mappedMessage: mapMessageToConversationMessage(rawMessage, {}),
    };
  }, [internalMessageContextQuery.data, internalReference]);
  const heroImageKey = heroImageUrl ?? '';
  const [heroImageState, setHeroImageState] = useState({
    assetKey: '',
    loaded: false,
    failed: false,
  });
  const imageLoaded = heroImageState.assetKey === heroImageKey && heroImageState.loaded;
  const imageFailed = heroImageState.assetKey === heroImageKey && heroImageState.failed;
  const canRenderHeroImage =
    canRenderRealTeamChatLinkPreviewHeroImage(preview, heroImageUrl) && !imageFailed;
  const shouldShowPendingHero =
    !canRenderHeroImage &&
    (preview.previewAssetStatus?.trim().toLowerCase() === 'pending' ||
      preview.status?.trim().toLowerCase() === 'pending');
  const normalizedHostLabel = resolvedPreview.hostLabel.trim().toLowerCase();
  const normalizedSourceLabel = resolvedPreview.sourceLabel.trim().toLowerCase();
  const shouldShowSourceLabel =
    normalizedSourceLabel.length > 0 &&
    normalizedSourceLabel !== normalizedHostLabel &&
    !normalizedSourceLabel.startsWith(`${normalizedHostLabel}/`);

  if (isInternalMessageLink && internalHref) {
    const resolvedContextMessage = hydratedInternalContextMessage ?? cachedInternalMessage;
    const resolvedContextMappedMessage = resolvedContextMessage?.mappedMessage;
    const resolvedContextRawMessage = resolvedContextMessage?.rawMessage;
    const linkedMessage =
      internalReference?.messageSnapshot ?? internalMessagePreviewQuery.data?.message;
    const previewState =
      inlinePreviewState ??
      internalMessageContextQuery.data?.state ??
      internalMessagePreviewQuery.data?.state;
    const isForbidden = previewState === 'forbidden';
    const isUnavailable =
      previewState === 'message_deleted' || previewState === 'message_not_found';
    const roomSnapshot =
      internalReference?.roomSnapshot ??
      resolvedContextMessage?.context?.room ??
      internalMessageContextQuery.data?.room ??
      internalMessagePreviewQuery.data?.room;
    const roomLabel = resolveInternalMessageRoomLabel(roomSnapshot, {
      isForbidden,
      privateRoomLabel: t('composer.linkPreview.privateRoom'),
      fallbackRoomLabel: t('composer.linkPreview.fallbackRoom'),
    });
    const createdAtLabel = formatPreviewFetchedAt(
      resolvedContextMappedMessage?.sentAt ??
        resolvedContextRawMessage?.sentAt ??
        linkedMessage?.createdAt ??
        undefined,
      locale,
    );
    const visibility = roomSnapshot?.visibility;
    const VisibilityIcon = roomSnapshot?.roomType === 'group_dm' ? Users : visibility === 'private' || isForbidden ? Lock : Hash;
    const authorLabel = isForbidden
      ? t('composer.linkPreview.privateTitle')
      : isUnavailable
        ? t('composer.linkPreview.unavailableTitle')
        : resolvedContextMappedMessage?.author?.trim() ||
          linkedMessage?.authorName?.trim() ||
          t('composer.linkPreview.defaultTitle');
    const unavailablePreviewBody =
      previewState === 'message_not_found'
        ? t('composer.linkPreview.notFoundDescription')
        : t('composer.linkPreview.deletedDescription');
    const inlinePreviewBody = linkedMessage?.contentPreview?.trim() || '';
    const resolvedContextPreviewBody = resolvedContextMappedMessage?.content?.trim() || undefined;
    const previewBody = isForbidden
      ? t('composer.linkPreview.privateDescription')
      : isUnavailable
        ? unavailablePreviewBody
        : resolvedContextPreviewBody ??
        (inlinePreviewBody || t('composer.linkPreview.defaultDescription'));
    const shouldShowInternalPreviewLoadingState =
      shouldHydrateInternalMessageContext &&
      !resolvedContextMappedMessage &&
      internalMessageContextQuery.isPending &&
      inlinePreviewBody.includes('\n');

    return (
      <a
        href={internalHref}
        onClick={(event) => {
          if (!onOpenMessageLink) return;
          event.preventDefault();
          onOpenMessageLink(internalHref);
        }}
        className="group block max-w-2xl cursor-pointer"
      >
        <div className="border-primary/35 bg-muted/30 hover:bg-muted/45 rounded-r-lg border-l-2 px-3 py-2.5 transition-colors">
          {((!hasInlineInternalPreview &&
            internalMessagePreviewQuery.isPending &&
            !resolvedContextMappedMessage) ||
            shouldShowInternalPreviewLoadingState) ? (
            <div className="space-y-2">
              <div className="bg-muted h-3.5 w-28 animate-pulse rounded-full" />
              <div className="bg-muted h-3 w-11/12 animate-pulse rounded-full" />
              <div className="bg-muted h-3 w-4/6 animate-pulse rounded-full" />
            </div>
          ) : (
            <>
              <p className="text-foreground text-sm leading-6 font-semibold">{authorLabel}</p>
              <p className="text-muted-foreground mt-1 text-sm leading-6 break-words whitespace-pre-wrap">
                {previewBody}
              </p>

              <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <VisibilityIcon className="h-3.5 w-3.5" />
                  <span>{roomLabel}</span>
                </span>
                {createdAtLabel ? (
                  <>
                    <span className="opacity-40">|</span>
                    <span>{createdAtLabel}</span>
                  </>
                ) : null}
                {Boolean(resolvedContextMappedMessage?.attachments?.length) || linkedMessage?.hasAttachments ? (
                  <>
                    <span className="opacity-40">|</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5" />
                      Attachment
                    </span>
                  </>
                ) : null}
                <span className="text-sky-400 inline-flex items-center gap-1.5 transition-colors group-hover:text-sky-300">
                  View conversation
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </>
          )}
        </div>
      </a>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="max-w-2xl space-y-1.5">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          aria-label={`${open ? 'Collapse' : 'Expand'} ${resolvedPreview.providerLabel} preview`}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/30 flex w-full cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-left text-xs font-medium transition-colors"
        >
          <TeamChatProviderIcon
            icon={PreviewIcon}
            providerIconUrl={resolvedPreview.providerIconUrl}
            label={resolvedPreview.providerLabel}
            className="h-6 w-6 rounded-lg"
          />
          <span>{resolvedPreview.providerLabel}</span>
          <ChevronDown
            className={cn(
              'ml-auto h-3.5 w-3.5 shrink-0 opacity-60 transition-transform duration-200',
              !open && '-rotate-90',
            )}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="pb-0">
        <a
          href={internalHref ?? preview.url}
          target={internalHref ? undefined : '_blank'}
          rel={internalHref ? undefined : 'noreferrer'}
          onClick={(event) => {
            if (!internalHref || !onOpenMessageLink) return;
            event.preventDefault();
            onOpenMessageLink(internalHref);
          }}
          className="border-border bg-card hover:bg-muted/20 group block cursor-pointer overflow-hidden rounded-[20px] border transition-colors"
        >
          <div className="border-border/80 flex items-start gap-3 border-b px-4 py-3.5">
            <TeamChatProviderIcon
              icon={PreviewIcon}
              providerIconUrl={resolvedPreview.providerIconUrl}
              label={resolvedPreview.providerLabel}
              className="text-foreground h-11 w-11 shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="line-clamp-2 text-[15px] font-semibold leading-5 text-foreground">
                {resolvedPreview.title}
              </p>
              <p className="text-muted-foreground line-clamp-1 text-sm">{resolvedPreview.subtitle}</p>
            </div>
            <span className="text-muted-foreground mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors group-hover:bg-white/5 group-hover:text-foreground">
              {internalHref ? <Hash className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
            </span>
          </div>

          <div className="bg-muted/30 relative aspect-[16/9] overflow-hidden">
            {canRenderHeroImage ? (
              <>
                <Image
                  key={heroImageKey}
                  src={heroImageUrl ?? ''}
                  alt=""
                  aria-hidden="true"
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 640px"
                  className={cn(
                    'object-cover transition-[opacity,transform] duration-300 group-hover:scale-[1.015]',
                    imageLoaded ? 'opacity-100' : 'opacity-0',
                  )}
                  onLoad={() =>
                    setHeroImageState({
                      assetKey: heroImageKey,
                      loaded: true,
                      failed: false,
                    })
                  }
                  onError={() =>
                    setHeroImageState({
                      assetKey: heroImageKey,
                      loaded: false,
                      failed: true,
                    })
                  }
                />
                {!imageLoaded ? (
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
                  </div>
                ) : null}
                {resolvedPreview.kind === 'video' ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="inline-flex h-18 w-18 items-center justify-center rounded-full bg-black/38 text-white shadow-[0_18px_36px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/18 backdrop-blur-sm">
                        <Play className="ml-1 h-8 w-8 fill-white text-white" />
                      </span>
                    </div>
                    {resolvedPreview.durationLabel ? (
                      <span className="absolute right-4 bottom-4 rounded-full bg-black/58 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                        {resolvedPreview.durationLabel}
                      </span>
                    ) : null}
                  </>
                ) : null}
              </>
            ) : isHeroImageLoading || shouldShowPendingHero ? (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
              </div>
            ) : (
              <TeamChatLinkPreviewArtwork
                kind={resolvedPreview.kind}
                providerLabel={resolvedPreview.providerLabel}
                fallbackLabel={resolvedPreview.fallbackLabel}
              />
            )}
          </div>

          <div className="space-y-2.5 px-4 py-3.5">
            {resolvedPreview.description ? (
              <p className="text-muted-foreground line-clamp-2 text-xs leading-5">
                {resolvedPreview.description}
              </p>
            ) : null}

            <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              <span className="font-medium text-foreground/80">{resolvedPreview.hostLabel}</span>
              {shouldShowSourceLabel ? (
                <span className="line-clamp-1 min-w-0 flex-1">{resolvedPreview.sourceLabel}</span>
              ) : null}
            </div>

            {fetchedAtLabel ? (
              <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
                <Clock3 className="h-3.5 w-3.5" />
                <span>{t('composer.linkPreview.previewUpdated', { value: fetchedAtLabel })}</span>
              </div>
            ) : null}
          </div>
        </a>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function TeamChatMessageLinkPreviewList({
  message,
  onOpenMessageLink,
}: TeamChatMessageLinkPreviewListProps) {
  const t = useTranslations('teamChat');
  const linkPreviews = Array.from(
    new Map(
      (message.linkPreviews ?? []).map((preview) => [getLinkPreviewIdentity(preview), preview] as const),
    ).values(),
  );
  const pendingUrls = normalizeLinkPreviewUrlList(message.linkPreviewPendingUrls);
  const failedUrls = normalizeLinkPreviewUrlList(message.linkPreviewFailedUrls).filter((url) => {
    const previewMatch = linkPreviews.some(
      (preview) => getLinkPreviewIdentity(preview) === url || preview.url === url,
    );
    const pendingMatch = pendingUrls.some((pendingUrl) => pendingUrl === url);
    return !previewMatch && !pendingMatch;
  });
  const shouldShowPending =
    (message.linkPreviewStatus === 'pending' || message.linkPreviewStatus === 'partial') &&
    pendingUrls.length > 0;
  const shouldShowFailed =
    (message.linkPreviewStatus === 'failed' || message.linkPreviewStatus === 'partial') &&
    failedUrls.length > 0;

  if (!linkPreviews.length && !shouldShowPending && !shouldShowFailed) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3">
      {linkPreviews.map((preview) => (
        <TeamChatMessageLinkPreviewCard
          key={getLinkPreviewRenderKey(message, preview)}
          preview={preview}
          onOpenMessageLink={onOpenMessageLink}
        />
      ))}

      {shouldShowPending
        ? pendingUrls.slice(0, 2).map((url) => (
            <div key={`pending-${url}`} className="max-w-2xl space-y-1.5">
              <div className="flex items-center gap-2 px-1">
                <div className="bg-muted h-6 w-28 animate-pulse rounded-full" />
              </div>
              <div className="border-border bg-card overflow-hidden rounded-[20px] border">
                <div className="border-border/80 flex items-start gap-3 border-b px-4 py-3.5">
                  <div className="bg-muted h-11 w-11 animate-pulse rounded-2xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="bg-muted h-4 w-2/3 animate-pulse rounded-full" />
                    <div className="bg-muted h-3 w-1/2 animate-pulse rounded-full" />
                  </div>
                </div>
                <div className="bg-muted/70 h-[220px] animate-pulse" />
                  <div className="space-y-2 px-4 py-3">
                    <div className="bg-muted h-3 w-full animate-pulse rounded-full" />
                    <div className="bg-muted h-3 w-4/5 animate-pulse rounded-full" />
                    <p className="text-muted-foreground text-xs">
                      {t('composer.linkPreview.pendingFrom', {
                        host: getPendingPreviewHost(url),
                      })}
                    </p>
                  </div>
                </div>
            </div>
          ))
        : null}

      {shouldShowFailed
        ? failedUrls.slice(0, 2).map((url) => (
            <div key={`failed-${url}`} className="max-w-2xl space-y-1.5">
              <div className="flex items-center gap-2 px-1 text-sm font-medium text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
                <span>{getPendingPreviewHost(url)}</span>
              </div>
              <div className="border-border bg-card overflow-hidden rounded-[20px] border">
                <div className="flex items-start gap-3 px-4 py-3.5">
                  <div className="bg-muted text-muted-foreground inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border/80">
                    <ExternalLink className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-sm font-semibold text-foreground">
                      {t('composer.linkPreview.sharedSuccessfully')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('composer.linkPreview.openSource')}
                    </p>
                    <p className="truncate text-xs text-muted-foreground/80">{url}</p>
                  </div>
                </div>
                <div className="border-border/80 flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
                  <span>{t('composer.linkPreview.originalAvailable')}</span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-primary transition hover:text-primary/80"
                  >
                    {t('composer.linkPreview.openLink')}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))
        : null}
    </div>
  );
}


