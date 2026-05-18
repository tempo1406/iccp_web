'use client';

import { useCallback, useRef, useState } from 'react';
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

export interface ConfirmAlertDialogOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

interface ConfirmAlertDialogState extends ConfirmAlertDialogOptions {
  open: boolean;
}

export function useConfirmAlertDialog() {
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const [dialogState, setDialogState] = useState<ConfirmAlertDialogState | null>(null);

  const resolveConfirm = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setDialogState(null);
  }, []);

  const confirm = useCallback((options: ConfirmAlertDialogOptions) => {
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }

    setDialogState({
      open: true,
      title: options.title,
      description: options.description,
      confirmText: options.confirmText ?? 'Confirm',
      cancelText: options.cancelText ?? 'Cancel',
      destructive: options.destructive ?? false,
    });

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const confirmDialog = dialogState ? (
    <AlertDialog
      open={dialogState.open}
      onOpenChange={(open) => {
        if (!open) resolveConfirm(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogState.title}</AlertDialogTitle>
          {dialogState.description ? (
            <AlertDialogDescription>{dialogState.description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => resolveConfirm(false)}>
            {dialogState.cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            className={
              dialogState.destructive
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : undefined
            }
            onClick={() => resolveConfirm(true)}
          >
            {dialogState.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : null;

  return {
    confirm,
    confirmDialog,
  };
}
