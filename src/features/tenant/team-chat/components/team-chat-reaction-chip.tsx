'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import type { MessageReaction, MessageReactionReactor } from '../data/team-chat-ui-data';
import { focusRingClass } from '../lib/team-chat-screen.shared';

interface TeamChatReactionChipProps {
  messageId: string;
  reaction: MessageReaction;
  interactive?: boolean;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onHydrateActors?: (messageId: string) => Promise<MessageReaction[] | undefined>;
}

type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

function buildReactionTooltipLabel(t: TranslateFn, reaction: MessageReaction) {
  if (reaction.reacted) {
    if (reaction.count <= 1) {
      return t('reactions.youReacted', { emoji: reaction.emoji });
    }

    return t('reactions.youAndOthersReacted', {
      count: reaction.count - 1,
      emoji: reaction.emoji,
    });
  }

  return t('reactions.totalReacted', { count: reaction.count, emoji: reaction.emoji });
}

function normalizeReactionActors(reactors?: MessageReactionReactor[]): MessageReactionReactor[] {
  if (!reactors?.length) return [];

  const seenKeys = new Set<string>();
  const uniqueActors: MessageReactionReactor[] = [];

  reactors.forEach((reactor) => {
    const displayName = (reactor.displayName ?? reactor.email ?? reactor.userId ?? '').trim();
    if (!displayName) return;

    const actorKey = reactor.userId || displayName;
    if (seenKeys.has(actorKey)) return;

    seenKeys.add(actorKey);
    uniqueActors.push({
      ...reactor,
      displayName,
    });
  });

  return uniqueActors;
}

function buildReactionActorNames(reactors: MessageReactionReactor[]): string[] {
  return reactors.map((reactor) => reactor.displayName.trim()).filter(Boolean);
}

function formatActorSummary(t: TranslateFn, actorNames: string[], hiddenCount: number) {
  if (actorNames.length === 0) return t('reactions.someoneReacted');

  if (actorNames.length === 1 && hiddenCount === 0) {
    return t('reactions.singleActor', { name: actorNames[0] });
  }

  if (actorNames.length === 2 && hiddenCount === 0) {
    return t('reactions.pairActors', {
      first: actorNames[0],
      second: actorNames[1],
    });
  }

  if (hiddenCount === 0) {
    const leadActors = actorNames.slice(0, -1).join(', ');
    const tailActor = actorNames[actorNames.length - 1];
    return t('reactions.manyActorsNoHidden', { lead: leadActors, tail: tailActor });
  }

  if (actorNames.length === 1) {
    return t('reactions.singleWithOthers', { name: actorNames[0], count: hiddenCount });
  }

  return t('reactions.pairWithOthers', {
    first: actorNames[0],
    second: actorNames[1],
    count: hiddenCount,
  });
}

function formatReactionFooter(t: TranslateFn, reaction: MessageReaction, hiddenCount: number) {
  if (hiddenCount > 0) {
    return t('reactions.totalReactions', { count: reaction.count });
  }

  return t('reactions.reactedWith', { emoji: reaction.emoji });
}

export function TeamChatReactionChip({
  messageId,
  reaction,
  interactive = true,
  onToggleReaction,
  onHydrateActors,
}: TeamChatReactionChipProps) {
  const t = useTranslations('teamChat');
  const [hydratedReactors, setHydratedReactors] = useState<MessageReactionReactor[]>([]);
  const [isHydratingActors, setIsHydratingActors] = useState(false);

  const effectiveReactors = useMemo(
    () =>
      reaction.reactors?.length
        ? normalizeReactionActors(reaction.reactors)
        : normalizeReactionActors(hydratedReactors),
    [hydratedReactors, reaction.reactors],
  );
  const actors = useMemo(() => buildReactionActorNames(effectiveReactors), [effectiveReactors]);
  const hiddenCount = Math.max(0, reaction.count - actors.length);
  const shouldHydrateActors =
    actors.length === 0 && reaction.count > 0 && !isHydratingActors && Boolean(onHydrateActors);

  const triggerHydration = async () => {
    if (!shouldHydrateActors || !onHydrateActors) return;

    setIsHydratingActors(true);
    try {
      const hydratedReactions = await onHydrateActors(messageId);
      const matchedReaction = hydratedReactions?.find(
        (hydratedReaction) => hydratedReaction.emoji === reaction.emoji,
      );
      if (matchedReaction?.reactors?.length) {
        setHydratedReactors(normalizeReactionActors(matchedReaction.reactors));
      }
    } finally {
      setIsHydratingActors(false);
    }
  };

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          onMouseEnter={() => {
            void triggerHydration();
          }}
          onFocus={() => {
            void triggerHydration();
          }}
          onClick={() => {
            if (!interactive) return;
            onToggleReaction(messageId, reaction.emoji);
          }}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-colors',
            interactive ? 'cursor-pointer' : 'cursor-default',
            reaction.reacted
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border bg-muted/40 text-foreground hover:bg-muted',
            focusRingClass,
          )}
          aria-label={buildReactionTooltipLabel(t, reaction)}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="center"
        sideOffset={10}
        className="w-[216px] rounded-2xl border-border/70 bg-popover/95 p-3 shadow-xl backdrop-blur"
      >
        {actors.length > 0 ? (
          <div className="space-y-2.5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-muted/60 text-3xl shadow-sm">
              {reaction.emoji}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold leading-snug text-foreground">
                {formatActorSummary(t, actors.slice(0, 3), hiddenCount)}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {formatReactionFooter(t, reaction, hiddenCount)}
              </p>
            </div>
          </div>
        ) : isHydratingActors ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t('reactions.loading')}</span>
          </div>
        ) : (
          <p className="text-center text-sm text-foreground">
            {buildReactionTooltipLabel(t, reaction)}
          </p>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
