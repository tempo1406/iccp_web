import { appConfig } from '@/common/constant/app';
import { HEADER_KEY } from '@/common/constant/header';
import { HttpError } from './errors';
import type { ApiResponseDto, ApiErrorDto } from '@/common/types/api';
import { authTokens } from '@/services/local-storage/auth.storage';

export interface ApiFetchOptions<TBody = unknown> extends Omit<
  RequestInit,
  'body' | 'headers'
> {
  baseUrl?: string;
  headers?: HeadersInit;
  tenantId?: string;
  accessToken?: string;
  body?: TBody;
  returnEnvelope?: boolean;
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

// Auto-Refresh Interceptor State
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: Error | null, token: string | null = null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
}

/**
 * Perform the refresh token API call
 */
async function refreshTokenReq(): Promise<{ accessToken: string; refreshToken: string }> {
  const refreshToken = authTokens.getRefresh();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const baseUrl = appConfig.apiBaseUrl;
  const response = await fetch(`${baseUrl}/v1/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const result = (await response.json()) as ApiResponseDto<{
    accessToken: string;
    refreshToken: string;
  }>;
  const { accessToken: newAccess, refreshToken: newRefresh } = result.data;

  // Update storage
  authTokens.save(newAccess, newRefresh);

  return { accessToken: newAccess, refreshToken: newRefresh };
}

// Main Fetch Client
export async function apiFetch<TResponse, TBody = unknown>(
  endpoint: string,
  options: ApiFetchOptions<TBody> = {},
): Promise<TResponse> {
  const {
    baseUrl = appConfig.apiBaseUrl,
    headers,
    tenantId,
    accessToken,
    body,
    returnEnvelope = false,
    ...rest
  } = options;

  const finalHeaders = new Headers(headers);

  if (tenantId) {
    finalHeaders.set(HEADER_KEY.X_ORGANIZATION_ID, tenantId);
  }

  let tokenToUse = accessToken;
  if (!tokenToUse && typeof window !== 'undefined') {
    tokenToUse = authTokens.getAccess() || undefined;
  }

  if (tokenToUse) {
    finalHeaders.set('Authorization', `Bearer ${tokenToUse}`);
  }

  const requestBody =
    body === undefined || body === null
      ? undefined
      : isFormData(body)
        ? body
        : JSON.stringify(body);

  if (requestBody && !isFormData(body)) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  const executeRequest = async (currentHeaders: Headers) => {
    return fetch(`${baseUrl}${endpoint}`, {
      ...rest,
      headers: currentHeaders,
      body: requestBody,
    });
  };

  let response = await executeRequest(finalHeaders);

  // --- Auto-Refresh Interceptor Logic ---
  if (response.status === 401 && typeof window !== 'undefined') {
    // Only intercept if we're in the browser and might have a refresh token
    const hasRefreshToken = !!authTokens.getRefresh();

    // Don't intercept auth endpoints like login/refresh-token itself
    const isAuthEndpoint =
      endpoint.includes('/auth/login') || endpoint.includes('/auth/refresh-token');

    if (hasRefreshToken && !isAuthEndpoint) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const { accessToken: newAccess } = await refreshTokenReq();
          processQueue(null, newAccess);

          // Retry original request with new token
          finalHeaders.set('Authorization', `Bearer ${newAccess}`);
          response = await executeRequest(finalHeaders);
        } catch (error) {
          processQueue(error as Error, null);
          // Refresh failed, clear tokens and let the 401 bubble up
          authTokens.clear();
          // Optionally trigger a logout event here or redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        } finally {
          isRefreshing = false;
        }
      } else {
        // Wait for the ongoing refresh to finish
        try {
          const newToken = await new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          // Retry original request with new token
          finalHeaders.set('Authorization', `Bearer ${newToken}`);
          response = await executeRequest(finalHeaders);
        } catch (error) {
          console.error('Refresh token failed during wait:', error);
          // Refresh failed during wait, let the original 401 bubble up
          throw new Error('Refresh token failed during wait');
        }
      }
    }
  }

  if (!response.ok) {
    let payload: ApiErrorDto | undefined;

    try {
      payload = (await response.json()) as ApiErrorDto;
    } catch {
      payload = {
        statusCode: response.status,
        timestamp: new Date().toISOString(),
        error: response.statusText || 'Unknown error',
        message: 'An unexpected error occurred while processing the response.',
      };
    }

    throw new HttpError(response.status, payload);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const result = (await response.json()) as ApiResponseDto<unknown>;
  return (returnEnvelope ? result : result.data) as TResponse;
}
