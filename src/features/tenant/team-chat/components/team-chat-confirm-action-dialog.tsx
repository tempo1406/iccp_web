'use client';

import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TeamChatConfirmActionDialogProps {
  cancelLabel?: string;
  confirmLabel: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pending?: boolean;
  tone?: 'default' | 'destructive';
  title: string;
}

export function TeamChatConfirmActionDialog({
  cancelLabel,
  confirmLabel,
  description,
  onConfirm,
  onOpenChange,
  open,
  pending = false,
  tone = 'destructive',
  title,
}: TeamChatConfirmActionDialogProps) {
  const t = useTranslations('teamChat');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="overflow-hidden rounded-2xl border-border bg-card p-0 sm:max-w-[520px]">
        <AlertDialogHeader className="space-y-3 px-6 pt-6 text-left">
          <AlertDialogTitle className="text-xl font-semibold tracking-tight text-foreground">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="border-t border-border bg-muted/15 px-6 py-4">
          <AlertDialogCancel className="h-10 cursor-pointer rounded-xl px-4">
            {cancelLabel ?? t('confirmAction.cancel')}
          </AlertDialogCancel>
          <Button
            type="button"
            className={cn(
              'h-10 cursor-pointer rounded-xl px-4',
              tone === 'destructive'
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
            disabled={pending}
            onClick={() => {
              void onConfirm();
            }}
          >
            {pending ? t('confirmAction.working') : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
