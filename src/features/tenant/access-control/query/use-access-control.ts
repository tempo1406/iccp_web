'use client';
import { useQuery } from '@tanstack/react-query';
import { useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { RbacService } from '@/services/rbac';

/**
 * GET /api/v1/rbac/me
 * Lấy roles + permissions của user đang đăng nhập trong org hiện tại.
 * Response: { roles, permissions, organizationId }
 */
export function useMyPermissions() {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: ['rbac', 'me', ctx.tenantId],
      queryFn: () => new RbacService(ctx).getMe(),
      enabled: Boolean(ctx.tenantId),
      staleTime: 5 * 60_000,
    }),
  );
}

/**
 * GET /api/v1/rbac/permissions/me
 * Lấy danh sách permission codes của user đang đăng nhập trong org hiện tại.
 * Response: string[] — chỉ permission codes, không có roles.
 * Dùng khi chỉ cần kiểm tra permission codes mà không cần thông tin role đầy đủ.
 */
export function useMyPermissionCodes() {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: ['rbac', 'permissions', 'me', ctx.tenantId],
      queryFn: () => new RbacService(ctx).getMyPermissions(),
      enabled: Boolean(ctx.tenantId),
      staleTime: 5 * 60_000,
    }),
  );
}
