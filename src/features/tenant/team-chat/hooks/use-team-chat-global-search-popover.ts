'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

const QUICK_SEARCH_REOPEN_BLOCK_FALLBACK_MS = 10_000;

interface UseTeamChatGlobalSearchPopoverOptions {
  inputRef: RefObject<HTMLInputElement | null>;
}

export function useTeamChatGlobalSearchPopover({
  inputRef,
}: UseTeamChatGlobalSearchPopoverOptions) {
  const [open, setOpen] = useState(false);
  const reopenBlockedRef = useRef(false);
  const reopenBlockTimeoutRef = useRef<number | null>(null);

  const releaseReopenBlock = useCallback(() => {
    if (!reopenBlockedRef.current) return false;
    reopenBlockedRef.current = false;
    if (reopenBlockTimeoutRef.current !== null) {
      window.clearTimeout(reopenBlockTimeoutRef.current);
      reopenBlockTimeoutRef.current = null;
    }
    return true;
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() !== 'k') return;

      event.preventDefault();
      if (reopenBlockedRef.current) {
        releaseReopenBlock();
      }
      inputRef.current?.focus();
      setOpen(true);
    };

    window.addEventListener('keydown', handleShortcut);
    return () => {
      window.removeEventListener('keydown', handleShortcut);
    };
  }, [inputRef, releaseReopenBlock]);

  useEffect(() => {
    return () => {
      if (reopenBlockTimeoutRef.current !== null) {
        window.clearTimeout(reopenBlockTimeoutRef.current);
      }
    };
  }, []);

  const suppressReopen = (fallbackMs = QUICK_SEARCH_REOPEN_BLOCK_FALLBACK_MS) => {
    reopenBlockedRef.current = true;
    if (reopenBlockTimeoutRef.current !== null) {
      window.clearTimeout(reopenBlockTimeoutRef.current);
    }
    reopenBlockTimeoutRef.current = window.setTimeout(() => {
      releaseReopenBlock();
    }, fallbackMs);
  };

  const requestOpen = () => {
    if (reopenBlockedRef.current) {
      return;
    }
    setOpen(true);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setOpen(false);
      return;
    }

    if (reopenBlockedRef.current) {
      return;
    }

    setOpen(true);
  };

  const shouldPreventCloseAutoFocus = () => reopenBlockedRef.current;

  return {
    open,
    setOpen,
    suppressReopen,
    releaseReopenBlock,
    requestOpen,
    handleOpenChange,
    shouldPreventCloseAutoFocus,
  };
}
