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

interface TeamChatDeleteOutgoingDialogProps {
  open: boolean;
  pending?: boolean;
  previewTitle: string;
  previewText: string;
  subjectLabel: string;
  previewMeta?: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

export function TeamChatDeleteOutgoingDialog({
  open,
  pending = false,
  previewTitle,
  previewText,
  subjectLabel,
  previewMeta,
  onConfirm,
  onOpenChange,
}: TeamChatDeleteOutgoingDialogProps) {
  const t = useTranslations('teamChat');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="overflow-hidden rounded-2xl border-border bg-card p-0 sm:max-w-[560px]">
        <AlertDialogHeader className="space-y-3 px-6 pt-6 text-left">
          <AlertDialogTitle className="text-2xl font-bold tracking-tight text-foreground">
            {t('deleteOutgoing.title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {t('deleteOutgoing.description', { subject: subjectLabel })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="px-6 pb-5">
          <div className="rounded-xl border border-border bg-muted/25 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              {previewTitle}
              {previewMeta ? (
                <span className="ml-2 text-xs text-muted-foreground">{previewMeta}</span>
              ) : null}
            </p>
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{previewText}</p>
          </div>
        </div>

        <AlertDialogFooter className="border-t border-border bg-muted/15 px-6 py-4">
          <AlertDialogCancel className="h-10 cursor-pointer rounded-xl px-4">
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-10 cursor-pointer rounded-xl bg-destructive px-4 text-white hover:bg-destructive/90"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? t('deleteOutgoing.deleting') : t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
