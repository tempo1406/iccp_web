'use client';

import { useState } from 'react';
import { nextMonday, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { CalendarDays, ChevronDown, Clock3, SendHorizontal } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TeamChatScheduleDialog } from './team-chat-schedule-dialog';

interface TeamChatComposerSendControlsProps {
  canSend: boolean;
  scheduleDisabled: boolean;
  onSend: () => void;
  onSchedule: (scheduledFor: Date) => void;
}

function tomorrowAtNine() {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 1);
  nextDate.setHours(9, 0, 0, 0);
  return nextDate;
}

function nextMondayAtNine() {
  return setMilliseconds(setSeconds(setMinutes(setHours(nextMonday(new Date()), 9), 0), 0), 0);
}

export function TeamChatComposerSendControls({
  canSend,
  scheduleDisabled,
  onSend,
  onSchedule,
}: TeamChatComposerSendControlsProps) {
  const t = useTranslations('teamChat');
  const locale = useLocale();
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [scheduleMenuOpen, setScheduleMenuOpen] = useState(false);
  const scheduleLocked = !canSend || scheduleDisabled;
  const timeFormatter = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });
  const tomorrowLabel = t('composerSend.quickTomorrow', { time: timeFormatter.format(tomorrowAtNine()) });
  const nextMondayLabel = t('composerSend.quickNextMonday', {
    time: timeFormatter.format(nextMondayAtNine()),
  });

  const handleQuickSchedule = (scheduledFor: Date) => {
    setScheduleMenuOpen(false);
    onSchedule(scheduledFor);
  };

  const openCustomScheduleDialog = () => {
    setScheduleMenuOpen(false);
    setCustomDialogOpen(true);
  };

  return (
    <>
      <TooltipProvider delayDuration={140}>
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-2xl border border-primary/30 bg-primary text-primary-foreground shadow-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  onClick={onSend}
                  disabled={!canSend}
                  className={cn(
                    'h-10 cursor-pointer rounded-none border-0 bg-transparent px-3 text-primary-foreground shadow-none hover:bg-primary/90',
                    !canSend && 'cursor-not-allowed opacity-50',
                  )}
                >
                  <SendHorizontal className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                {t('composerSend.sendMessage')}
              </TooltipContent>
            </Tooltip>

            <Popover open={scheduleMenuOpen} onOpenChange={setScheduleMenuOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      disabled={!canSend}
                      aria-expanded={scheduleMenuOpen}
                      className={cn(
                        'h-10 cursor-pointer rounded-none border-0 border-l border-primary-foreground/15 bg-transparent px-2.5 text-primary-foreground shadow-none hover:bg-primary/90',
                        !canSend && 'cursor-not-allowed opacity-50',
                      )}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  {t('composerSend.sendOptions')}
                </TooltipContent>
              </Tooltip>
              <PopoverContent
                align="end"
                side="top"
                sideOffset={10}
                className="w-64 rounded-2xl border-border bg-popover p-1.5 shadow-2xl"
              >
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60',
                      scheduleLocked && 'cursor-not-allowed opacity-50',
                    )}
                    disabled={scheduleLocked}
                    onClick={() => handleQuickSchedule(tomorrowAtNine())}
                  >
                    <Clock3 className="h-4 w-4 shrink-0" />
                    <span className="leading-5">{tomorrowLabel}</span>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60',
                      scheduleLocked && 'cursor-not-allowed opacity-50',
                    )}
                    disabled={scheduleLocked}
                    onClick={() => handleQuickSchedule(nextMondayAtNine())}
                  >
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    <span className="leading-5">{nextMondayLabel}</span>
                  </button>
                  <div className="border-border my-1 border-t" />
                  <button
                    type="button"
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60',
                      scheduleLocked && 'cursor-not-allowed opacity-50',
                    )}
                    disabled={scheduleLocked}
                    onClick={openCustomScheduleDialog}
                  >
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    <span className="leading-5">{t('composerSend.customTime')}</span>
                  </button>
                </div>
                {scheduleDisabled ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    {t('composerSend.attachmentSchedulingHint')}
                  </div>
                ) : null}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </TooltipProvider>

      <TeamChatScheduleDialog
        open={customDialogOpen}
        onOpenChange={setCustomDialogOpen}
        onSubmit={onSchedule}
      />
    </>
  );
}
