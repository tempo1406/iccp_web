'use client';

import { useEffect, useMemo, useState } from 'react';
import { HEADER_KEY } from '@/common/constant/header';
import { useServiceContext } from '@/lib/use-service-context';
import { authTokens } from '@/services/local-storage/auth.storage';
import {
  isProtectedTeamChatAssetUrl,
  resolveTeamChatAssetUrl,
} from '../lib/team-chat-link-preview.utils';

const protectedAssetObjectUrlCache = new Map<string, string>();
const protectedAssetRequestCache = new Map<string, Promise<string | undefined>>();

function normalizeProtectedAssetVersionToken(versionToken?: string | null) {
  const normalizedToken = versionToken?.trim();
  return normalizedToken?.length ? normalizedToken : 'base';
}

function getProtectedAssetCacheKey(url: string, tenantId?: string | null, versionToken?: string | null) {
  return `${tenantId ?? 'public'}:${normalizeProtectedAssetVersionToken(versionToken)}:${url}`;
}

async function fetchProtectedAssetObjectUrl(
  url: string,
  tenantId?: string | null,
  versionToken?: string | null,
) {
  const cacheKey = getProtectedAssetCacheKey(url, tenantId, versionToken);
  const cachedObjectUrl = protectedAssetObjectUrlCache.get(cacheKey);
  if (cachedObjectUrl) return cachedObjectUrl;

  const cachedRequest = protectedAssetRequestCache.get(cacheKey);
  if (cachedRequest) return cachedRequest;

  const request = (async () => {
    const accessToken = authTokens.getAccess();
    if (!accessToken) return undefined;

    const headers = new Headers({
      Authorization: `Bearer ${accessToken}`,
    });

    if (tenantId) {
      headers.set(HEADER_KEY.X_ORGANIZATION_ID, tenantId);
    }

    const response = await fetch(url, {
      headers,
      credentials: 'omit',
      cache: 'default',
    });

    if (!response.ok) {
      throw new Error(`Protected asset request failed with status ${response.status}`);
    }

    const responseBlob = await response.blob();
    const objectUrl = URL.createObjectURL(responseBlob);
    protectedAssetObjectUrlCache.set(cacheKey, objectUrl);
    return objectUrl;
  })().finally(() => {
    protectedAssetRequestCache.delete(cacheKey);
  });

  protectedAssetRequestCache.set(cacheKey, request);
  return request;
}

export function useTeamChatProtectedAssetUrl(url?: string | null, versionToken?: string | null) {
  const { tenantId } = useServiceContext();
  const normalizedVersionToken = useMemo(
    () => normalizeProtectedAssetVersionToken(versionToken),
    [versionToken],
  );
  const resolvedUrl = useMemo(() => resolveTeamChatAssetUrl(url), [url]);
  const isProtected = Boolean(resolvedUrl && isProtectedTeamChatAssetUrl(resolvedUrl));
  const cacheKey = resolvedUrl
    ? getProtectedAssetCacheKey(resolvedUrl, tenantId, normalizedVersionToken)
    : undefined;
  const cachedObjectUrl = cacheKey ? protectedAssetObjectUrlCache.get(cacheKey) : undefined;
  const [assetUrl, setAssetUrl] = useState<string | undefined>(() => {
    if (!resolvedUrl) return undefined;
    return isProtected ? cachedObjectUrl : resolvedUrl;
  });
  const [isLoading, setIsLoading] = useState(Boolean(isProtected && !cachedObjectUrl));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isCancelled = false;

    if (!resolvedUrl) {
      setAssetUrl(undefined);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!isProtected) {
      setAssetUrl(resolvedUrl);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (cachedObjectUrl) {
      setAssetUrl(cachedObjectUrl);
      setIsLoading(false);
      setError(null);
      return;
    }

    setAssetUrl(undefined);
    setIsLoading(true);
    setError(null);

    void fetchProtectedAssetObjectUrl(resolvedUrl, tenantId, normalizedVersionToken)
      .then((nextUrl) => {
        if (isCancelled) return;
        if (!nextUrl) {
          setAssetUrl(undefined);
          setError(new Error('Protected asset could not be resolved'));
          return;
        }

        setAssetUrl(nextUrl);
        setError(null);
      })
      .catch((nextError) => {
        if (isCancelled) return;
        setAssetUrl(undefined);
        setError(nextError instanceof Error ? nextError : new Error('Protected asset failed'));
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [cachedObjectUrl, isProtected, normalizedVersionToken, resolvedUrl, tenantId]);

  return {
    assetUrl,
    error,
    isLoading,
    isProtected,
  };
}
