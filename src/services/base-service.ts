/**
 * src/services/base-service.ts
 *
 * Abstract base class cho tất cả backend API services.
 * Wraps apiFetch với auth token + tenant id tự động.
 *
 * Usage:
 *   const svc = new ProjectsService({ accessToken, tenantId });
 *   const projects = await svc.list({ page: 1 });
 */

import { apiFetch, type ApiFetchOptions } from '@/config/http/api-client';
import { authTokens } from '@/services/local-storage/auth.storage';

export interface ServiceContext {
  /** JWT access token — nếu không truyền, tự đọc từ localStorage */
  accessToken?: string | null;
  /** Tenant ID từ URL hoặc TenantContext */
  tenantId?: string | null;
}

export abstract class BaseService {
  protected readonly ctx: ServiceContext;

  constructor(ctx: ServiceContext = {}) {
    this.ctx = ctx;
  }

  /**
   * Get the access token: prefer ctx.accessToken, fallback to localStorage.
   */
  protected getToken(): string | undefined {
    if (this.ctx.accessToken) return this.ctx.accessToken;
    if (typeof window !== 'undefined') {
      return authTokens.getAccess() ?? undefined;
    }
    return undefined;
  }

  /**
   * Make an authenticated API call to the backend.
   * Automatically injects:
   *  - x-tenant-id header (from ctx.tenantId)
   *  - Authorization header (from ctx.accessToken or localStorage)
   */
  protected async call<TResponse, TBody = unknown>(
    endpoint: string,
    options: ApiFetchOptions<TBody> = {},
  ): Promise<TResponse> {
    return apiFetch<TResponse, TBody>(endpoint, {
      ...options,
      tenantId: this.ctx.tenantId ?? undefined,
      accessToken: this.getToken(),
    });
  }

  /** Shorthand: GET request */
  protected get<T>(endpoint: string, options?: ApiFetchOptions): Promise<T> {
    return this.call<T>(endpoint, { ...options, method: 'GET' });
  }

  /** Shorthand: POST request */
  protected post<T, B = unknown>(
    endpoint: string,
    body?: B,
    options?: ApiFetchOptions<B>,
  ): Promise<T> {
    return this.call<T, B>(endpoint, { ...options, method: 'POST', body });
  }

  /** Shorthand: PUT request */
  protected put<T, B = unknown>(
    endpoint: string,
    body?: B,
    options?: ApiFetchOptions<B>,
  ): Promise<T> {
    return this.call<T, B>(endpoint, { ...options, method: 'PUT', body });
  }

  /** Shorthand: PATCH request */
  protected patch<T, B = unknown>(
    endpoint: string,
    body?: B,
    options?: ApiFetchOptions<B>,
  ): Promise<T> {
    return this.call<T, B>(endpoint, { ...options, method: 'PATCH', body });
  }

  /** Shorthand: DELETE request */
  protected delete<T>(endpoint: string, options?: ApiFetchOptions): Promise<T> {
    return this.call<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

