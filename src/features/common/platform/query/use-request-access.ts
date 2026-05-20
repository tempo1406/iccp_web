'use client';

import { useMutation } from '@tanstack/react-query';
import { useSafeMutation } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { RequestAccessService } from '../services/request-access.service';

export function useRequestAccessMutation() {
  const ctx = useServiceContext();

  return useSafeMutation(
    useMutation({
      mutationFn: (email: string) =>
        new RequestAccessService(ctx).submit({
          email,
          source: 'platform-landing-page',
          pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
    }),
  );
}
