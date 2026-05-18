import { appConfig } from '@/common/constant/app';
import type { ApiFetchOptions } from '@/config/http/api-client';
import { BaseService } from '@/services/base-service';

/**
 * Base service for calls to iccp_be_ai.
 */
export abstract class AiBaseService extends BaseService {
  protected override call<TResponse, TBody = unknown>(
    endpoint: string,
    options: ApiFetchOptions<TBody> = {},
  ): Promise<TResponse> {
    return super.call<TResponse, TBody>(endpoint, {
      ...options,
      baseUrl: appConfig.aiBaseUrl,
    });
  }
}
