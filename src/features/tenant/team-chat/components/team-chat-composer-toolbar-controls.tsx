import type { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { focusRingClass } from '../lib/team-chat-screen.shared';

interface ComposerToolbarButtonProps {
  active?: boolean;
  ariaLabel: string;
  tooltip?: string;
  onClick: () => void;
  children: ReactNode;
}

export function ComposerToolbarButton({
  active = false,
  ariaLabel,
  tooltip,
  onClick,
  children,
}: ComposerToolbarButtonProps) {
  const trigger = (
    <button
      type="button"
      aria-label={ariaLabel}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        'text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors',
        active && 'bg-muted text-foreground',
        focusRingClass,
      )}
    >
      {children}
    </button>
  );

  if (!tooltip) return trigger;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

interface ComposerIconButtonProps {
  ariaLabel: string;
  tooltip: string;
  onClick: () => void;
  children: ReactNode;
}

export function ComposerIconButton({
  ariaLabel,
  tooltip,
  onClick,
  children,
}: ComposerIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          onClick={onClick}
          className={cn(
            'text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors',
            focusRingClass,
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
