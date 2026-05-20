import { BaseService } from '@/services/base-service';
import type {
  NotificationsListQuery,
  NotificationsListResult,
  NotificationsUpdateResult,
} from './types';

export class NotificationsService extends BaseService {
  private readonly base = '/v1/notifications';

  list(query: NotificationsListQuery = {}): Promise<NotificationsListResult> {
    const qs = new URLSearchParams({
      page: String(query.page ?? 1),
      limit: String(query.limit ?? 20),
    });

    if (query.unreadOnly) {
      qs.set('unreadOnly', 'true');
    }
    if (query.scope) {
      qs.set('scope', query.scope);
    }

    return this.get<NotificationsListResult>(`${this.base}?${qs.toString()}`);
  }

  markRead(ids: string[]): Promise<NotificationsUpdateResult> {
    return this.put<NotificationsUpdateResult, { ids: string[] }>(`${this.base}/read`, {
      ids,
    });
  }

  markAllRead(): Promise<NotificationsUpdateResult> {
    return this.put<NotificationsUpdateResult>(`${this.base}/read-all`);
  }

  markOneRead(id: string): Promise<NotificationsUpdateResult> {
    return this.put<NotificationsUpdateResult>(`${this.base}/${id}/read`);
  }

  remove(id: string): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`${this.base}/${id}`);
  }
}
