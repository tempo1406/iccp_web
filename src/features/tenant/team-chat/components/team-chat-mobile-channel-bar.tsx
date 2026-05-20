import { Hash, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type ConversationKind,
  type WorkspaceChannel,
} from '../data/team-chat-ui-data';
import { focusRingClass } from '../lib/team-chat-screen.shared';

interface TeamChatMobileChannelBarProps {
  activeConversationKind: ConversationKind;
  activeChannelId: string;
  channels: WorkspaceChannel[];
  onOpenChannel: (channelId: string) => void;
}

export function TeamChatMobileChannelBar({
  activeConversationKind,
  activeChannelId,
  channels,
  onOpenChannel,
}: TeamChatMobileChannelBarProps) {
  return (
    <div className="border-b border-border px-4 py-2 lg:hidden">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {channels.map((channel) => {
          const ChannelIcon = channel.visibility === 'private' ? Lock : Hash;
          return (
            <button
              key={channel.id}
              type="button"
              onClick={() => onOpenChannel(channel.id)}
              className={cn(
                'flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1 text-xs whitespace-nowrap transition-colors',
                activeConversationKind === 'channel' && channel.id === activeChannelId
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                focusRingClass,
              )}
            >
              <ChannelIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="leading-none">{channel.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

