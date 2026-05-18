import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { NotificationDto, NotificationsUnreadByScope } from '@/services/notifications/types';
import type { RootState } from '@/store';

const MAX_ITEMS = 20;
const ACTIVITY_EVENT_TYPES = new Set([
  'chat.mention',
  'chat.thread.reply',
  'chat.reaction',
  'chat.invitation',
  'chat.invitation.updated',
]);

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function isActivityFeedNotification(item: Pick<NotificationDto, 'data'>): boolean {
  const normalizedFeedScope = toNonEmptyString(item.data?.feedScope)?.toLowerCase();
  if (normalizedFeedScope === 'activity') return true;
  if (normalizedFeedScope === 'all_only') return false;

  const normalizedEventType = toNonEmptyString(item.data?.eventType)?.toLowerCase();
  return normalizedEventType ? ACTIVITY_EVENT_TYPES.has(normalizedEventType) : false;
}

function buildFallbackUnreadByScope(
  items: NotificationDto[],
  unreadCount: number,
): NotificationsUnreadByScope {
  return {
    all: Math.max(0, Math.trunc(unreadCount)),
    activity: items.filter((item) => !item.read && isActivityFeedNotification(item)).length,
  };
}

interface NotificationState {
  items: NotificationDto[];
  total: number;
  unreadCount: number;
  unreadByScope: NotificationsUnreadByScope | null;
  status: 'idle' | 'loading' | 'error';
  acceptedInvitationIds: string[];
}

const initialState: NotificationState = {
  items: [],
  total: 0,
  unreadCount: 0,
  unreadByScope: null,
  status: 'idle',
  acceptedInvitationIds: [],
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setNotifications(
      state,
      action: PayloadAction<{
        items: NotificationDto[];
        total: number;
        unreadCount: number;
        unreadByScope?: NotificationsUnreadByScope | null;
      }>,
    ) {
      state.items = action.payload.items;
      state.total = action.payload.total;
      state.unreadCount = action.payload.unreadCount;
      state.unreadByScope =
        action.payload.unreadByScope ??
        buildFallbackUnreadByScope(action.payload.items, action.payload.unreadCount);
      state.status = 'idle';
    },
    setNotificationStatus(state, action: PayloadAction<NotificationState['status']>) {
      state.status = action.payload;
    },
    pushNotification(state, action: PayloadAction<NotificationDto>) {
      const incoming = action.payload;
      const existingItem = state.items.find((item) => item.id === incoming.id);
      const existed = Boolean(existingItem);
      const nextRead = existingItem ? incoming.read || existingItem.read : incoming.read;
      const mergedItem: NotificationDto = {
        ...(existingItem ?? incoming),
        ...incoming,
        read: nextRead,
      };

      state.items = [mergedItem, ...state.items.filter((item) => item.id !== incoming.id)].slice(
        0,
        MAX_ITEMS,
      );

      if (!existed) {
        state.total += 1;
        if (!mergedItem.read) {
          state.unreadCount += 1;
          const unreadByScope = state.unreadByScope ?? buildFallbackUnreadByScope(state.items, state.unreadCount);
          unreadByScope.all += 1;
          if (isActivityFeedNotification(mergedItem)) {
            unreadByScope.activity += 1;
          }
          state.unreadByScope = unreadByScope;
        }
        return;
      }

      if (existingItem && !existingItem.read && mergedItem.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        const unreadByScope = state.unreadByScope ?? buildFallbackUnreadByScope(state.items, state.unreadCount);
        unreadByScope.all = Math.max(0, unreadByScope.all - 1);
        if (isActivityFeedNotification(existingItem)) {
          unreadByScope.activity = Math.max(0, unreadByScope.activity - 1);
        }
        state.unreadByScope = unreadByScope;
      }

      if (existingItem && existingItem.read && !mergedItem.read) {
        state.unreadCount += 1;
        const unreadByScope = state.unreadByScope ?? buildFallbackUnreadByScope(state.items, state.unreadCount);
        unreadByScope.all += 1;
        if (isActivityFeedNotification(mergedItem)) {
          unreadByScope.activity += 1;
        }
        state.unreadByScope = unreadByScope;
      }

      if (existingItem && !existingItem.read && !mergedItem.read) {
        const wasActivity = isActivityFeedNotification(existingItem);
        const isActivity = isActivityFeedNotification(mergedItem);
        if (wasActivity !== isActivity) {
          const unreadByScope =
            state.unreadByScope ?? buildFallbackUnreadByScope(state.items, state.unreadCount);
          if (wasActivity) {
            unreadByScope.activity = Math.max(0, unreadByScope.activity - 1);
          } else {
            unreadByScope.activity += 1;
          }
          state.unreadByScope = unreadByScope;
        }
      }
    },
    markItemsRead(state, action: PayloadAction<string[]>) {
      const ids = new Set(action.payload);
      let markedInState = 0;
      let markedActivityInState = 0;
      state.items = state.items.map((item) => {
        if (ids.has(item.id) && !item.read) {
          markedInState++;
          if (isActivityFeedNotification(item)) {
            markedActivityInState++;
          }
          return { ...item, read: true };
        }
        return item;
      });
      const inStateIds = new Set(state.items.map((i) => i.id));
      const notInSliceCount = action.payload.filter((id) => !inStateIds.has(id)).length;
      state.unreadCount = Math.max(0, state.unreadCount - markedInState - notInSliceCount);
      const unreadByScope = state.unreadByScope ?? buildFallbackUnreadByScope(state.items, state.unreadCount);
      unreadByScope.all = Math.max(0, unreadByScope.all - markedInState - notInSliceCount);
      unreadByScope.activity = Math.max(
        0,
        unreadByScope.activity - markedActivityInState - notInSliceCount,
      );
      state.unreadByScope = unreadByScope;
    },
    markAllItemsRead(state) {
      state.items = state.items.map((item) => ({ ...item, read: true }));
      state.unreadCount = 0;
      state.unreadByScope = { all: 0, activity: 0 };
    },
    removeItem(state, action: PayloadAction<string>) {
      const id = action.payload;
      const item = state.items.find((n) => n.id === id);
      state.items = state.items.filter((n) => n.id !== id);
      state.acceptedInvitationIds = state.acceptedInvitationIds.filter((invitationId) => invitationId !== id);
      if (item) {
        state.total = Math.max(0, state.total - 1);
        if (!item.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
          const unreadByScope =
            state.unreadByScope ?? buildFallbackUnreadByScope(state.items, state.unreadCount);
          unreadByScope.all = Math.max(0, unreadByScope.all - 1);
          if (isActivityFeedNotification(item)) {
            unreadByScope.activity = Math.max(0, unreadByScope.activity - 1);
          }
          state.unreadByScope = unreadByScope;
        }
      }
    },
    markInvitationAccepted(state, action: PayloadAction<string>) {
      const invitationId = action.payload;
      if (!invitationId) return;
      if (state.acceptedInvitationIds.includes(invitationId)) return;
      state.acceptedInvitationIds.push(invitationId);
    },
    unmarkInvitationAccepted(state, action: PayloadAction<string>) {
      const invitationId = action.payload;
      state.acceptedInvitationIds = state.acceptedInvitationIds.filter((id) => id !== invitationId);
    },
  },
});

export const {
  setNotifications,
  setNotificationStatus,
  pushNotification,
  markItemsRead,
  markAllItemsRead,
  removeItem,
  markInvitationAccepted,
  unmarkInvitationAccepted,
} = notificationSlice.actions;

export const notificationReducer = notificationSlice.reducer;

export const selectNotificationItems = (state: RootState) => state.notification?.items ?? [];
export const selectNotificationTotal = (state: RootState) => state.notification?.total ?? 0;
export const selectNotificationUnreadTotalCount = (state: RootState) =>
  state.notification?.unreadCount ?? 0;
export const selectNotificationUnreadCount = (state: RootState) =>
  state.notification?.unreadByScope?.activity ?? state.notification?.unreadCount ?? 0;
export const selectNotificationUnreadByScope = (state: RootState) =>
  state.notification?.unreadByScope ?? null;
export const selectNotificationStatus = (state: RootState) =>
  state.notification?.status ?? 'idle';
export const selectAcceptedInvitationIds = (state: RootState) =>
  state.notification?.acceptedInvitationIds ?? [];
