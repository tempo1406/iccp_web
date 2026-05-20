'use client';

import { Paperclip } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TEAM_CHAT_UPLOAD_LIMIT_SUMMARY } from '../lib/team-chat-upload.utils';

interface TeamChatComposerDropOverlayProps {
  visible: boolean;
}

export function TeamChatComposerDropOverlay({ visible }: TeamChatComposerDropOverlayProps) {
  const t = useTranslations('teamChat');

  if (!visible) {
    return null;
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-2 z-30 flex items-center justify-center rounded-[22px] border border-dashed border-primary/60 bg-primary/10 backdrop-blur-[2px]"
    >
      <div className="border-border/80 bg-background/94 flex max-w-[420px] items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.7)] backdrop-blur">
        <span className="bg-primary/14 text-primary inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
          <Paperclip className="h-4 w-4" />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-foreground">{t('composer.dropToAttach')}</p>
          <p className="text-xs leading-5 text-muted-foreground">{TEAM_CHAT_UPLOAD_LIMIT_SUMMARY}</p>
        </div>
      </div>
    </div>
  );
}
