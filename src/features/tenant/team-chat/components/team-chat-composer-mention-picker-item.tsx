import { AtSign } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  focusRingClass,
  initials,
  presenceDotClass,
  type MentionCandidate,
} from '../lib/team-chat-screen.shared';

interface TeamChatComposerMentionPickerItemProps {
  candidate: MentionCandidate;
  isActive: boolean;
  mentionContextKind: 'channel' | 'dm' | 'group_dm';
  onApply: (candidate: MentionCandidate) => void;
}

export function TeamChatComposerMentionPickerItem({
  candidate,
  isActive,
  mentionContextKind,
  onApply,
}: TeamChatComposerMentionPickerItemProps) {
  const t = useTranslations('teamChat');
  const isSpecialCandidate =
    candidate.kind === 'special' && Boolean(candidate.specialMentionType);
  const specialMentionLabel =
    candidate.specialMentionType === 'channel'
      ? '@channel'
      : candidate.specialMentionType === 'everyone'
        ? '@everyone'
        : `@${candidate.name}`;

  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onApply(candidate)}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors',
        isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/60',
        focusRingClass,
      )}
    >
      {isSpecialCandidate ? (
        <span
          className={cn(
            'border-border/80 bg-muted text-muted-foreground inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
            isActive && 'border-primary-foreground/20 text-primary-foreground',
          )}
        >
          <AtSign className="h-4 w-4" />
        </span>
      ) : (
        <Avatar
          className={cn(
            'border-border/80 h-10 w-10 border',
            isActive && 'border-primary-foreground/20',
          )}
        >
          {candidate.avatarUrl ? (
            <AvatarImage src={candidate.avatarUrl} alt={candidate.name} />
          ) : null}
          <AvatarFallback
            className={cn(
              'bg-muted text-foreground text-sm font-semibold',
              isActive && 'bg-primary-foreground/15 text-primary-foreground',
            )}
          >
            {initials(candidate.name)}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">
            {isSpecialCandidate ? specialMentionLabel : candidate.name}
          </p>
          {!isSpecialCandidate && candidate.status ? (
            <span
              className={cn(
                'inline-flex h-2.5 w-2.5 rounded-full',
                presenceDotClass(candidate.status),
              )}
            />
          ) : null}
          {candidate.displayName ? (
            <p
              className={cn(
                'truncate text-sm',
                isActive ? 'text-primary-foreground/80' : 'text-muted-foreground',
              )}
            >
              {candidate.displayName}
            </p>
          ) : null}
        </div>
        <p
          className={cn(
            'mt-0.5 truncate text-xs',
            isActive ? 'text-primary-foreground/80' : 'text-muted-foreground',
          )}
        >
          {candidate.role ??
            (isSpecialCandidate
              ? t('composer.mention.specialMention')
              : t('composer.mention.workspaceMember'))}
        </p>
      </div>
      {mentionContextKind === 'channel' &&
      !isSpecialCandidate &&
      !candidate.inCurrentConversation ? (
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-1 text-[11px] font-medium',
            isActive
              ? 'bg-primary-foreground/12 text-primary-foreground'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {t('composer.mention.notInChannel')}
        </span>
      ) : null}
    </button>
  );
}
