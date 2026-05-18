import { Hash, Lock, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  type ConversationKind,
  type PresenceUser,
  type PresenceStatus,
} from '../data/team-chat-ui-data';
import { initials, presenceDotClass } from '../lib/team-chat-screen.shared';

type IconSize = 'sm' | 'md' | 'lg';

interface TeamChatConversationIconProps {
  kind: ConversationKind;
  title: string;
  visibility?: 'public' | 'private';
  avatarUrl?: string;
  status?: PresenceStatus;
  memberPreview?: PresenceUser[];
  memberPreviewOverflowCount?: number;
  size?: IconSize;
}

const sizeClassMap: Record<
  IconSize,
  {
    container: string;
    icon: string;
    fallback: string;
    dot: string;
    groupAvatar: string;
    groupFallback: string;
    groupOverflow: string;
    groupOverlap: string;
  }
> = {
  sm: {
    container: 'h-7 w-7',
    icon: 'h-3.5 w-3.5',
    fallback: 'text-[11px]',
    dot: 'h-2.5 w-2.5 -right-0.5 -bottom-0.5',
    groupAvatar: 'h-[18px] w-[18px]',
    groupFallback: 'text-[9px]',
    groupOverflow: 'text-[8px]',
    groupOverlap: '-ml-1.5',
  },
  md: {
    container: 'h-10 w-10',
    icon: 'h-4 w-4',
    fallback: 'text-xs',
    dot: 'h-2.5 w-2.5 -right-0.5 -bottom-0.5',
    groupAvatar: 'h-6 w-6',
    groupFallback: 'text-[10px]',
    groupOverflow: 'text-[9px]',
    groupOverlap: '-ml-2',
  },
  lg: {
    container: 'h-11 w-11',
    icon: 'h-5 w-5',
    fallback: 'text-sm',
    dot: 'h-3.5 w-3.5 -right-1 -bottom-1',
    groupAvatar: 'h-7 w-7',
    groupFallback: 'text-[11px]',
    groupOverflow: 'text-[10px]',
    groupOverlap: '-ml-2.5',
  },
};

export function TeamChatConversationIcon({
  kind,
  title,
  visibility = 'private',
  avatarUrl,
  status = 'away',
  memberPreview = [],
  memberPreviewOverflowCount = 0,
  size = 'md',
}: TeamChatConversationIconProps) {
  const sizeClass = sizeClassMap[size];

  if (kind === 'channel') {
    const Icon = visibility === 'private' ? Lock : Hash;
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl border border-border bg-muted/30 text-muted-foreground',
          sizeClass.container,
        )}
      >
        <Icon className={sizeClass.icon} />
      </div>
    );
  }

  if (kind === 'group_dm') {
    if (memberPreview.length > 0) {
      const previewMembers = memberPreview.slice(0, 3);

      return (
        <div
          className={cn(
            'flex items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/30 px-1 text-muted-foreground',
            sizeClass.container,
          )}
        >
          <div className="flex items-center">
            {previewMembers.map((member, index) => (
              <Avatar
                key={member.id}
                className={cn(
                  'border border-card bg-muted/50',
                  sizeClass.groupAvatar,
                  index > 0 ? sizeClass.groupOverlap : '',
                )}
              >
                <AvatarImage src={member.avatarUrl} alt={member.name} />
                <AvatarFallback
                  className={cn('bg-muted font-semibold text-foreground', sizeClass.groupFallback)}
                >
                  {initials(member.name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {memberPreviewOverflowCount > 0 ? (
              <span
                className={cn(
                  'ml-1 inline-flex min-w-4 items-center justify-center rounded-full bg-background/85 px-1 font-semibold text-foreground',
                  sizeClass.groupOverflow,
                )}
              >
                +{memberPreviewOverflowCount}
              </span>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl border border-border bg-muted/30 text-muted-foreground',
          sizeClass.container,
        )}
      >
        <Users className={sizeClass.icon} />
      </div>
    );
  }

  return (
    <div className="relative">
      <Avatar className={cn('border border-border bg-muted/40', sizeClass.container)}>
        <AvatarImage src={avatarUrl} alt={title} />
        <AvatarFallback className={cn('bg-muted font-semibold text-foreground', sizeClass.fallback)}>
          {initials(title)}
        </AvatarFallback>
      </Avatar>
      <span
        className={cn(
          'absolute rounded-full border border-card',
          sizeClass.dot,
          presenceDotClass(status),
        )}
      />
    </div>
  );
}
