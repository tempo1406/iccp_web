import { BaseService } from '@/services/base-service';
import type { MyRbacDto } from './types/rbac.types';

export class RbacService extends BaseService {
    private readonly base = '/v1/rbac';

    /**
     * GET /api/v1/rbac/me
     * Lấy roles + permissions của user đang đăng nhập.
     * Nếu ctx.tenantId được truyền vào → inject X-Organization-Id header
     * → trả về roles/permissions trong org đó.
     */
    getMe(): Promise<MyRbacDto> {
        return this.get<MyRbacDto>(`${this.base}/me`);
    }

    /**
     * GET /api/v1/rbac/permissions/me
     * Lấy danh sách permissions của user đang đăng nhập.
     * Nếu có X-Organization-Id → permissions trong org đó.
     */
    getMyPermissions(): Promise<string[]> {
        return this.get<string[]>(`${this.base}/permissions/me`);
    }
}
