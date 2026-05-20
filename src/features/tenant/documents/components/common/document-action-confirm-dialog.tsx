'use client';

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

interface DocumentActionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  confirming?: boolean;
}

export function DocumentActionConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  confirming = false,
}: DocumentActionConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm rounded-xl border border-border/70 bg-background p-0 text-foreground shadow-2xl">
        <div className="p-5">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-base font-semibold text-foreground">{title}</AlertDialogTitle>
            <AlertDialogDescription className="mt-1.5 text-sm text-muted-foreground">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        <AlertDialogFooter className="border-t border-border/70 bg-muted/20 px-5 py-3 sm:justify-end sm:gap-2">
          <AlertDialogCancel className="mt-0 h-8 rounded-lg border-border bg-background text-sm text-foreground hover:bg-muted hover:text-foreground">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-8 rounded-lg bg-destructive text-sm text-white hover:bg-destructive/90 focus-visible:ring-destructive/30"
            onClick={(event) => {
              event.preventDefault();
              void onConfirm();
            }}
            disabled={confirming}
          >
            {confirming ? 'Processing...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
