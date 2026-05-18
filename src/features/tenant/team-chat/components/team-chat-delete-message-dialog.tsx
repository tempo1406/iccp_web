'use client';

import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ConversationMessage } from '../data/team-chat-ui-data';

type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

interface TeamChatDeleteMessageDialogProps {
  open: boolean;
  message?: ConversationMessage | null;
  pending?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

function resolveMessagePreviewText(
  message: ConversationMessage | null | undefined,
  t: TranslateFn,
) {
  const normalizedContent = message?.content.trim() ?? '';
  if (normalizedContent.length > 0) return normalizedContent;

  const attachments = message?.attachments ?? [];
  if (!attachments.length) return t('deleteMessage.noVisibleContent');
  if (attachments.length === 1) return attachments[0].fileName || `1 ${t('deleteMessage.attachment')}`;

  return t('deleteMessage.attachmentCount', {
    name: attachments[0].fileName || t('deleteMessage.attachment'),
    count: attachments.length - 1,
  });
}

export function TeamChatDeleteMessageDialog({
  open,
  message,
  pending = false,
  onConfirm,
  onOpenChange,
}: TeamChatDeleteMessageDialogProps) {
  const t = useTranslations('teamChat');
  const previewText = resolveMessagePreviewText(message, t);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-border bg-card overflow-hidden rounded-2xl p-0 sm:max-w-[560px]">
        <AlertDialogHeader className="space-y-3 px-6 pt-6 text-left">
          <AlertDialogTitle className="text-2xl font-bold tracking-tight text-foreground">
            {t('deleteMessage.title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {t('deleteMessage.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="px-6 pb-5">
          <div className="border-border bg-muted/25 min-w-0 rounded-xl border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              {message?.author ?? t('deleteMessage.authorFallback')}
              {message?.time ? <span className="ml-2 text-xs text-muted-foreground">{message.time}</span> : null}
            </p>
            <div className="mt-2 max-h-[40vh] overflow-y-auto">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-all">
                {previewText}
              </p>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="border-border bg-muted/15 border-t px-6 py-4">
          <AlertDialogCancel className="h-10 cursor-pointer rounded-xl px-4">
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-10 cursor-pointer rounded-xl bg-destructive px-4 text-white hover:bg-destructive/90"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? t('deleteMessage.deleting') : t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

