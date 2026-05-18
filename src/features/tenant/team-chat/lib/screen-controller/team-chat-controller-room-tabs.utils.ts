'use client';

import type { ChannelDetailTabItem } from '../../data/team-chat-channel-details';
import type { ConversationTab } from '../../data/team-chat-ui-data';
import type { TeamChatRoomTabItemResponse } from '../../services/types/team-chat.types';

const ROOM_TABS_CACHE_STORAGE_KEY = 'team-chat:room-tabs:v1';

export function cloneRoomTabs(tabs: ChannelDetailTabItem[]): ChannelDetailTabItem[] {
  return tabs.map((tab) => ({ ...tab }));
}

export function resolveTabLabel(tabId: string): string {
  if (tabId === 'messages') return 'Messages';
  if (tabId === 'files') return 'Files';
  if (tabId === 'photos') return 'Photos';
  if (tabId === 'pins') return 'Pins';
  return tabId;
}

export function normalizeCachedRoomTabs(value: unknown): ChannelDetailTabItem[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const seenTabIds = new Set<string>();
  const normalizedTabs = value.reduce<ChannelDetailTabItem[]>((tabs, item) => {
    if (!item || typeof item !== 'object') return tabs;

    const rawId = 'id' in item && typeof item.id === 'string' ? item.id.trim() : '';
    if (!rawId || seenTabIds.has(rawId)) return tabs;

    seenTabIds.add(rawId);

    const rawLabel =
      'label' in item && typeof item.label === 'string' && item.label.trim().length > 0
        ? item.label.trim()
        : resolveTabLabel(rawId);
    const hidden = 'hidden' in item ? Boolean(item.hidden) : false;

    tabs.push({
      id: rawId,
      label: rawLabel,
      hidden,
    });
    return tabs;
  }, []);

  return normalizedTabs.length > 0 ? normalizedTabs : null;
}

export function readRoomTabsCacheFromStorage(): Record<string, ChannelDetailTabItem[]> {
  if (typeof window === 'undefined') return {};

  try {
    const rawCache = window.localStorage.getItem(ROOM_TABS_CACHE_STORAGE_KEY);
    if (!rawCache) return {};

    const parsed = JSON.parse(rawCache) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.entries(parsed).reduce<Record<string, ChannelDetailTabItem[]>>(
      (cache, [roomId, tabs]) => {
        const normalizedRoomId = roomId.trim();
        if (!normalizedRoomId) return cache;

        const normalizedTabs = normalizeCachedRoomTabs(tabs);
        if (!normalizedTabs) return cache;

        cache[normalizedRoomId] = normalizedTabs;
        return cache;
      },
      {},
    );
  } catch {
    return {};
  }
}

export function writeRoomTabsCacheToStorage(cache: Record<string, ChannelDetailTabItem[]>) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(ROOM_TABS_CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // no-op: skip persistence when storage is unavailable
  }
}

export function createInitialChannelTabs() {
  return readRoomTabsCacheFromStorage();
}

export function createInitialDirectMessageTabs() {
  return readRoomTabsCacheFromStorage();
}

export function defaultDirectMessageTabs(): ChannelDetailTabItem[] {
  return [
    { id: 'messages', label: 'Messages' },
    { id: 'files', label: 'Files' },
    { id: 'photos', label: 'Photos' },
  ];
}

export function areRoomTabsEqual(left: ChannelDetailTabItem[], right: ChannelDetailTabItem[]): boolean {
  if (left.length !== right.length) return false;

  for (let index = 0; index < left.length; index += 1) {
    const leftTab = left[index];
    const rightTab = right[index];
    if (!leftTab || !rightTab) return false;
    if (leftTab.id !== rightTab.id) return false;
    if (leftTab.label !== rightTab.label) return false;
    if (Boolean(leftTab.hidden) !== Boolean(rightTab.hidden)) return false;
  }

  return true;
}

export function mapApiTabsToDetailTabs(
  apiTabs: TeamChatRoomTabItemResponse[] | undefined,
  fallbackTabs: ChannelDetailTabItem[],
): ChannelDetailTabItem[] {
  if (!apiTabs || apiTabs.length === 0) {
    return fallbackTabs;
  }

  const fallbackLabelById = new Map(fallbackTabs.map((tab) => [tab.id, tab.label] as const));
  const mappedTabs = [...apiTabs]
    .sort((left, right) => left.order - right.order)
    .filter((tab) => tab.id && tab.id.trim().length > 0)
    .map((tab) => ({
      id: tab.id,
      label: fallbackLabelById.get(tab.id) ?? resolveTabLabel(tab.id),
      hidden: Boolean(tab.hidden),
    }));

  const missingFallbackTabs = fallbackTabs.filter(
    (fallbackTab) => !mappedTabs.some((mappedTab) => mappedTab.id === fallbackTab.id),
  );

  return [...mappedTabs, ...missingFallbackTabs];
}

export function mapDetailTabsToApiTabs(tabs: ChannelDetailTabItem[]): TeamChatRoomTabItemResponse[] {
  const seenTabIds = new Set<string>();
  const normalizedTabs = tabs.filter((tab) => {
    const tabId = tab.id.trim();
    if (!tabId) return false;
    if (seenTabIds.has(tabId)) return false;
    seenTabIds.add(tabId);
    return true;
  });

  return normalizedTabs.map((tab, index) => ({
    id: tab.id,
    order: index + 1,
    hidden: Boolean(tab.hidden),
  }));
}

export function isConversationTab(tabId: string): tabId is ConversationTab {
  return tabId === 'messages' || tabId === 'files' || tabId === 'photos' || tabId === 'pins';
}
