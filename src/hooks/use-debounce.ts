/**
 * src/hooks/use-debounce.ts
 * Generic debounce hook — useful for search inputs, autocomplete.
 *
 * Usage:
 *   const debouncedSearch = useDebounce(searchQuery, 400);
 */
'use client';

import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
