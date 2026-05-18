'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ChatToolset } from '../types';
import {
  CHAT_TOOLSET_QUERY_PARAM,
  parseChatToolset,
  readStoredChatToolset,
  writeStoredChatToolset,
} from '../constants/chat-toolset';

export function usePersistedChatToolset(): {
  toolset: ChatToolset;
  setToolset: (toolset: ChatToolset) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromUrl = parseChatToolset(searchParams.get(CHAT_TOOLSET_QUERY_PARAM));
  const toolset: ChatToolset = useMemo(
    () => fromUrl ?? readStoredChatToolset() ?? 'none',
    [fromUrl],
  );

  useEffect(() => {
    const urlToolset = parseChatToolset(searchParams.get(CHAT_TOOLSET_QUERY_PARAM));
    if (urlToolset) {
      writeStoredChatToolset(urlToolset);
      return;
    }
    const fallback = readStoredChatToolset() ?? 'none';
    const params = new URLSearchParams(searchParams.toString());
    params.set(CHAT_TOOLSET_QUERY_PARAM, fallback);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const setToolset = useCallback(
    (next: ChatToolset) => {
      writeStoredChatToolset(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set(CHAT_TOOLSET_QUERY_PARAM, next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { toolset, setToolset };
}
