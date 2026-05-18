'use client';

import { useState } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
}

export function usePagination(opts: UsePaginationOptions = {}) {
  const [page, setPage] = useState(opts.initialPage ?? 1);
  const [limit, setLimit] = useState(opts.initialLimit ?? 20);

  const reset = () => setPage(1);

  return {
    page,
    limit,
    setPage,
    setLimit,
    reset,
    /** Spread into any paginated tRPC query input */
    paginationInput: { page, limit } as const,
  };
}
