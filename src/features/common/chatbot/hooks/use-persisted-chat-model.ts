'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const CHAT_MODEL_QUERY_PARAM = 'model_config_id';

/**
 * Keeps selected chat model in URL query string so reload/navigation preserves it.
 * `null` means auto model selection by backend.
 */
export function usePersistedChatModel(): {
  selectedModelId: string | null;
  setSelectedModelId: (modelId: string | null) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedModelId = useMemo(() => {
    const raw = searchParams.get(CHAT_MODEL_QUERY_PARAM);
    const trimmed = raw?.trim();
    return trimmed ? trimmed : null;
  }, [searchParams]);

  const setSelectedModelId = useCallback(
    (modelId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (modelId?.trim()) {
        params.set(CHAT_MODEL_QUERY_PARAM, modelId.trim());
      } else {
        params.delete(CHAT_MODEL_QUERY_PARAM);
      }
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { selectedModelId, setSelectedModelId };
}
