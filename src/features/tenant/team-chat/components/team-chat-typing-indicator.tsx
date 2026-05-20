import { cn } from '@/lib/utils';

interface TeamChatTypingIndicatorProps {
  text?: string | null;
}

export function TeamChatTypingIndicator({
  text,
}: TeamChatTypingIndicatorProps) {
  if (!text) return null;

  return (
    <div className="border-border/60 bg-background/95 border-t px-4 py-2 sm:px-6">
      <div className="inline-flex items-center gap-3 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
        <span className="inline-flex items-center gap-1">
          <span className="bg-primary/85 h-1.5 w-1.5 animate-pulse rounded-full" />
          <span className="bg-primary/65 h-1.5 w-1.5 animate-pulse rounded-full [animation-delay:120ms]" />
          <span className="bg-primary/45 h-1.5 w-1.5 animate-pulse rounded-full [animation-delay:240ms]" />
        </span>
        <span className={cn('max-w-full truncate font-medium')}>{text}</span>
      </div>
    </div>
  );
}
