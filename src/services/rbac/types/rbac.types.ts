/**
 * src/services/rbac/types/rbac.types.ts
 *
 * DTOs cho API GET /api/v1/rbac/me và GET /api/v1/rbac/permissions/me
 */

export interface RbacRoleDto {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  organizationId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Response của GET /api/v1/rbac/me
 * Trả về roles + toàn bộ permissions (đã deduplicate) của user đang đăng nhập.
 * Nếu truyền X-Organization-Id → roles trong org đó.
 * Nếu không → system-level roles (organizationId IS NULL).
 */
export interface MyRbacDto {
  roles: RbacRoleDto[];
  permissions: string[];
  organizationId: string | null;
}
