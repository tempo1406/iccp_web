'use client';

/**
 * src/lib/use-service-context.ts
 *
 * Helper hook để lấy ServiceContext cho các service class.
 * Sử dụng bên trong feature query hooks.
 *
 * - accessToken: đọc tự động từ localStorage (BaseService đã xử lý)
 * - tenantId: đọc từ TenantContext nếu có (null khi ở ngoài tenant routes)
 */

import { useContext } from 'react';
import { TenantContext } from '@/providers/tenant-context';
import type { ServiceContext } from '@/services/base-service';

export function useServiceContext(): ServiceContext {
  const tenantCtx = useContext(TenantContext);
  return {
    tenantId: tenantCtx?.organizationId ?? null,
    // accessToken sẽ được BaseService đọc từ localStorage tự động
  };
}
