'use client';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useSafeQuery, useSafeMutation } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { NotificationsService } from '@/services/notifications/notifications.service';
import { CampaignService } from '@/services/notifications/campaign.service';
import type { CampaignsListQuery } from '@/services/notifications/campaign.service';
import type {
  NotificationDto,
  NotificationsUnreadByScope,
} from '@/services/notifications/types';
import { useAppDispatch } from '@/store';
import {
  setNotifications,
  setNotificationStatus,
  markItemsRead,
  markAllItemsRead,
  removeItem,
} from '@/store/slices/notification/notification.slice';
import {
  isActivityFeedNotification,
  normalizeNotificationFeedScope,
  type NotificationFeedScope,
} from '../lib/notification-feed-scope';

function normalizeNotificationDto(item: unknown): NotificationDto | null {
  if (!item || typeof item !== 'object') return null;

  const candidate = item as Record<string, unknown>;
  const id = typeof candidate.id === 'string' ? candidate.id : null;
  const type = typeof candidate.type === 'string' ? candidate.type : 'unknown';
  const title = typeof candidate.title === 'string' ? candidate.title : '';
  const message = typeof candidate.message === 'string' ? candidate.message : '';
  const content = typeof candidate.content === 'string' ? candidate.content : null;
  const campaignId =
    typeof candidate.campaignId === 'string' ? candidate.campaignId : null;
  const read =
    typeof candidate.read === 'boolean'
      ? candidate.read
      : typeof candidate.isRead === 'boolean'
        ? candidate.isRead
        : false;
  const sender =
    candidate.sender && typeof candidate.sender === 'object'
      ? (candidate.sender as NotificationDto['sender'])
      : null;
  const data =
    candidate.data && typeof candidate.data === 'object'
      ? (candidate.data as Record<string, unknown>)
      : undefined;
  const createdAt =
    typeof candidate.createdAt === 'string'
      ? candidate.createdAt
      : new Date().toISOString();

  if (!id) return null;

  return {
    id,
    type,
    title,
    message,
    content,
    campaignId,
    read,
    sender,
    data,
    createdAt,
  };
}

function extractNotificationArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const candidate = payload as {
    data?: unknown;
    items?: unknown;
    notifications?: unknown;
  };

  if (Array.isArray(candidate.data)) return candidate.data;
  if (Array.isArray(candidate.items)) return candidate.items;
  if (Array.isArray(candidate.notifications)) return candidate.notifications;

  if (candidate.data && typeof candidate.data === 'object') {
    const nested = candidate.data as {
      data?: unknown;
      items?: unknown;
      notifications?: unknown;
    };

    if (Array.isArray(nested.data)) return nested.data;
    if (Array.isArray(nested.items)) return nested.items;
    if (Array.isArray(nested.notifications)) return nested.notifications;
  }

  return [];
}

export function normalizeNotificationItems(payload: unknown): NotificationDto[] {
  return extractNotificationArray(payload)
    .map(normalizeNotificationDto)
    .filter((item): item is NotificationDto => Boolean(item));
}

export function normalizeNotificationTotal(payload: unknown): number {
  if (Array.isArray(payload)) {
    return payload.length;
  }
  if (!payload || typeof payload !== 'object') return 0;

  const candidate = payload as { total?: unknown; data?: unknown };
  if (typeof candidate.total === 'number') {
    return candidate.total;
  }
  if (candidate && candidate.data && typeof candidate.data === 'object') {
    const nested = candidate.data as { total?: unknown };
    if (typeof nested.total === 'number') {
      return nested.total;
    }
  }

  return normalizeNotificationItems(payload).length;
}

export function normalizeNotificationUnreadCount(payload: unknown): number {
  if (!payload || typeof payload !== 'object') return 0;

  const candidate = payload as { unreadCount?: unknown; data?: unknown };
  if (typeof candidate.unreadCount === 'number') {
    return candidate.unreadCount;
  }
  if (candidate.data && typeof candidate.data === 'object') {
    const nested = candidate.data as { unreadCount?: unknown };
    if (typeof nested.unreadCount === 'number') {
      return nested.unreadCount;
    }
  }

  return normalizeNotificationItems(payload).filter((item) => !item.read).length;
}

function normalizeNotificationUnreadByScopePayload(
  payload: unknown,
): NotificationsUnreadByScope | null {
  if (!payload || typeof payload !== 'object') return null;

  const candidate = payload as { unreadByScope?: unknown; data?: unknown };
  const unreadByScopeRaw =
    candidate.unreadByScope ??
    ((candidate.data && typeof candidate.data === 'object'
      ? (candidate.data as { unreadByScope?: unknown }).unreadByScope
      : undefined) as unknown);

  if (!unreadByScopeRaw || typeof unreadByScopeRaw !== 'object') {
    return null;
  }

  const unreadByScope = unreadByScopeRaw as { all?: unknown; activity?: unknown };
  if (typeof unreadByScope.all !== 'number' || typeof unreadByScope.activity !== 'number') {
    return null;
  }

  return {
    all: Math.max(0, Math.trunc(unreadByScope.all)),
    activity: Math.max(0, Math.trunc(unreadByScope.activity)),
  };
}

export function normalizeNotificationUnreadByScope(
  payload: unknown,
  items?: NotificationDto[],
  fallbackUnreadCount?: number,
): NotificationsUnreadByScope | null {
  const parsed = normalizeNotificationUnreadByScopePayload(payload);
  if (parsed) {
    return parsed;
  }

  if (!Array.isArray(items)) {
    return null;
  }

  const allCount =
    typeof fallbackUnreadCount === 'number' ? fallbackUnreadCount : items.filter((item) => !item.read).length;
  const activityCount = items.filter((item) => !item.read && isActivityFeedNotification(item)).length;

  return {
    all: Math.max(0, Math.trunc(allCount)),
    activity: Math.max(0, Math.trunc(activityCount)),
  };
}

export function useNotifications(input?: {
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
  scope?: NotificationFeedScope;
  enabled?: boolean;
  syncToStore?: boolean;
}) {
  const ctx = useServiceContext();
  const dispatch = useAppDispatch();
  const normalizedScope = normalizeNotificationFeedScope(input?.scope) ?? 'all';
  const shouldSyncToStore = input?.syncToStore ?? true;
  return useSafeQuery(
    useQuery({
      queryKey: ['notifications', 'list', input],
      queryFn: async () => {
        if (shouldSyncToStore) {
          dispatch(setNotificationStatus('loading'));
        }
        try {
          const data = await new NotificationsService(ctx).list({
            ...(input ?? {}),
            scope: normalizedScope,
          });
          const normalizedItems = normalizeNotificationItems(data);
          const normalizedTotal = normalizeNotificationTotal(data);
          const normalizedUnreadCount = normalizeNotificationUnreadCount(data);
          const normalizedUnreadByScope = normalizeNotificationUnreadByScope(
            data,
            normalizedItems,
            normalizedUnreadCount,
          );

          if (shouldSyncToStore) {
            dispatch(
              setNotifications({
                items: normalizedItems,
                total: normalizedTotal,
                unreadCount: normalizedUnreadCount,
                unreadByScope: normalizedUnreadByScope,
              }),
            );
          }
          return data;
        } catch (err) {
          if (shouldSyncToStore) {
            dispatch(setNotificationStatus('error'));
          }
          throw err;
        }
      },
      enabled: input?.enabled ?? true,
      staleTime: 60_000,
    }),
  );
}

export function useNotificationsInfinite(
  options?: number | { limit?: number; scope?: NotificationFeedScope },
) {
  const ctx = useServiceContext();
  const limit = typeof options === 'number' ? options : (options?.limit ?? 20);
  const normalizedScope =
    normalizeNotificationFeedScope(typeof options === 'number' ? null : options?.scope) ?? 'all';

  return useInfiniteQuery({
    queryKey: ['notifications', 'infinite', ctx.tenantId, normalizedScope, limit],
    queryFn: ({ pageParam }) =>
      new NotificationsService(ctx).list({
        page: pageParam as number,
        limit,
        scope: normalizedScope,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce(
        (sum, page) => sum + normalizeNotificationItems(page).length,
        0,
      );
      const total = normalizeNotificationTotal(lastPage);
      return loaded < total ? allPages.length + 1 : undefined;
    },
    staleTime: 60_000,
  });
}

export function useMarkNotificationsRead() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  return useSafeMutation(
    useMutation({
      mutationFn: (ids: string[]) => new NotificationsService(ctx).markRead(ids),
      onSuccess: (_, ids) => {
        dispatch(markItemsRead(ids));
        void qc.invalidateQueries({ queryKey: ['notifications'] });
      },
    }),
  );
}

export function useMarkAllNotificationsRead() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  return useSafeMutation(
    useMutation({
      mutationFn: () => new NotificationsService(ctx).markAllRead(),
      onSuccess: () => {
        dispatch(markAllItemsRead());
        void qc.invalidateQueries({ queryKey: ['notifications'] });
      },
    }),
  );
}

export function useDeleteNotification() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  return useSafeMutation(
    useMutation({
      mutationFn: (id: string) => new NotificationsService(ctx).remove(id),
      onSuccess: (_, id) => {
        dispatch(removeItem(id));
        void qc.invalidateQueries({ queryKey: ['notifications'] });
      },
    }),
  );
}

export function useDeleteAllNotifications() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  return useSafeMutation(
    useMutation({
      mutationFn: async (ids: string[]) => {
        await Promise.all(ids.map((id) => new NotificationsService(ctx).remove(id)));
        return ids;
      },
      onSuccess: (ids) => {
        ids.forEach((id) => dispatch(removeItem(id)));
        void qc.invalidateQueries({ queryKey: ['notifications'] });
      },
    }),
  );
}

export function useMarkOneNotificationRead() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  return useSafeMutation(
    useMutation({
      mutationFn: (id: string) => new NotificationsService(ctx).markOneRead(id),
      onSuccess: (_, id) => {
        dispatch(markItemsRead([id]));
        void qc.invalidateQueries({ queryKey: ['notifications', 'infinite'] });
      },
    }),
  );
}

export function useCampaigns(
  query: CampaignsListQuery = {},
  options?: { enabled?: boolean },
) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: ['campaigns', ctx.tenantId, 'list', query],
      queryFn: () => new CampaignService(ctx).list(query),
      enabled: options?.enabled ?? true,
      staleTime: 60_000,
    }),
  );
}

export function useCampaignById(
  id: string | null,
  options?: { enabled?: boolean },
) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: ['campaigns', ctx.tenantId, 'byId', id],
      queryFn: () => new CampaignService(ctx).getById(id!),
      enabled: (options?.enabled ?? true) && !!id,
      staleTime: 15_000,
    }),
  );
}

export function useCreateCampaign() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: Parameters<CampaignService['create']>[0]) =>
        new CampaignService(ctx).create(body),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: ['campaigns', ctx.tenantId] });
      },
    }),
  );
}
