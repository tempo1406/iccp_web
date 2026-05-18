'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ChatMode } from '../types';
import {
  CHAT_MODE_QUERY_PARAM,
  parseChatMode,
  readStoredChatMode,
  writeStoredChatMode,
} from '../constants/chat-mode';

const CHAT_SEARCH_MODE_QUERY_PARAM = 'searchMode';

function modeToSearchMode(mode: ChatMode): 'rag_internal' | 'hybrid' | 'web_only' {
  if (mode === 'rag') return 'rag_internal';
  if (mode === 'auto') return 'hybrid';
  if (mode === 'web') return 'web_only';
  return 'hybrid';
}

/**
 * Keeps chat mode in the URL (?mode=general|auto|rag|web) and sessionStorage so reloads
 * and new tabs keep the last choice.
 */
export function usePersistedChatMode(): {
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromUrl = parseChatMode(searchParams.get(CHAT_MODE_QUERY_PARAM));
  const mode: ChatMode = useMemo(
    () => fromUrl ?? readStoredChatMode() ?? 'general',
    [fromUrl],
  );

  useEffect(() => {
    const urlMode = parseChatMode(searchParams.get(CHAT_MODE_QUERY_PARAM));
    if (urlMode) {
      writeStoredChatMode(urlMode);
      return;
    }
    const fallback = readStoredChatMode() ?? 'general';
    const params = new URLSearchParams(searchParams.toString());
    params.set(CHAT_MODE_QUERY_PARAM, fallback);
    params.set(CHAT_SEARCH_MODE_QUERY_PARAM, modeToSearchMode(fallback));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const setMode = useCallback(
    (next: ChatMode) => {
      writeStoredChatMode(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set(CHAT_MODE_QUERY_PARAM, next);
      params.set(CHAT_SEARCH_MODE_QUERY_PARAM, modeToSearchMode(next));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { mode, setMode };
}
