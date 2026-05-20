'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SOCKET_EVENTS, SOCKET_NAMESPACES } from '@/common/constant/socket.constant';
import type { ChatTypingStartedPayload, ChatTypingStoppedPayload } from '@/lib/socket/events';
import { useSocket } from '@/providers/socket-provider';

// Keep FE-side typing emits compact; backend now applies shared Redis burst guards across instances.
const TYPING_EMIT_DEBOUNCE_MS = 450;

interface UseTeamChatTypingOptions {
  activeRoomId: string;
  organizationId?: string | null;
  currentUserId?: string | null;
  participantNameByUserId?: Map<string, string>;
  enabled?: boolean;
}

export function useTeamChatTyping({
  activeRoomId,
  organizationId,
  currentUserId,
  participantNameByUserId,
  enabled = true,
}: UseTeamChatTypingOptions) {
  const { emit } = useSocket();
  const [typingByRoomId, setTypingByRoomId] = useState<Record<string, Record<string, number>>>({});
  const expiryTimersRef = useRef<Record<string, number>>({});
  const lastTypingStartAtRef = useRef<Record<string, number>>({});
  const localTypingActiveRef = useRef<Record<string, boolean>>({});
  const previousRoomIdRef = useRef<string>('');

  const clearTypingUser = useCallback((roomId: string, userId: string) => {
    const timerKey = `${roomId}:${userId}`;
    const timerId = expiryTimersRef.current[timerKey];
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      delete expiryTimersRef.current[timerKey];
    }

    setTypingByRoomId((previous) => {
      const roomState = previous[roomId];
      if (!roomState?.[userId]) return previous;

      const nextRoomState = { ...roomState };
      delete nextRoomState[userId];

      if (Object.keys(nextRoomState).length === 0) {
        const nextValue = { ...previous };
        delete nextValue[roomId];
        return nextValue;
      }

      return {
        ...previous,
        [roomId]: nextRoomState,
      };
    });
  }, []);

  const upsertTypingUser = useCallback(
    (roomId: string, userId: string, expiresAtIso?: string) => {
      const expiresAtDate = expiresAtIso ? new Date(expiresAtIso) : null;
      const expiresAt =
        expiresAtDate && !Number.isNaN(expiresAtDate.getTime())
          ? expiresAtDate.getTime()
          : Date.now() + 5000;

      const timerKey = `${roomId}:${userId}`;
      const existingTimer = expiryTimersRef.current[timerKey];
      if (existingTimer !== undefined) {
        window.clearTimeout(existingTimer);
      }

      expiryTimersRef.current[timerKey] = window.setTimeout(() => {
        clearTypingUser(roomId, userId);
      }, Math.max(0, expiresAt - Date.now()));

      setTypingByRoomId((previous) => ({
        ...previous,
        [roomId]: {
          ...(previous[roomId] ?? {}),
          [userId]: expiresAt,
        },
      }));
    },
    [clearTypingUser],
  );

  const emitTypingStop = useCallback(
    (roomId: string) => {
      if (!enabled || !organizationId || !roomId) return;
      if (!localTypingActiveRef.current[roomId]) return;

      emit(SOCKET_NAMESPACES.CHAT, SOCKET_EVENTS.CHAT_TYPING_STOP, {
        organizationId,
        roomId,
      });
      localTypingActiveRef.current[roomId] = false;
    },
    [emit, enabled, organizationId],
  );

  const notifyTypingActivity = useCallback(
    (nextValue: string) => {
      if (!enabled || !organizationId || !activeRoomId) return;

      if (nextValue.trim().length === 0) {
        emitTypingStop(activeRoomId);
        return;
      }

      const now = Date.now();
      const lastTypingStartAt = lastTypingStartAtRef.current[activeRoomId] ?? 0;
      if (now - lastTypingStartAt < TYPING_EMIT_DEBOUNCE_MS) {
        localTypingActiveRef.current[activeRoomId] = true;
        return;
      }

      lastTypingStartAtRef.current[activeRoomId] = now;
      localTypingActiveRef.current[activeRoomId] = true;
      emit(SOCKET_NAMESPACES.CHAT, SOCKET_EVENTS.CHAT_TYPING_START, {
        organizationId,
        roomId: activeRoomId,
      });
    },
    [activeRoomId, emit, emitTypingStop, enabled, organizationId],
  );

  const notifyTypingStopped = useCallback(() => {
    emitTypingStop(activeRoomId);
  }, [activeRoomId, emitTypingStop]);

  const handleTypingStartedEvent = useCallback(
    (payload: ChatTypingStartedPayload) => {
      if (!payload.roomId || !payload.userId) return;
      if (currentUserId && payload.userId === currentUserId) return;
      upsertTypingUser(payload.roomId, payload.userId, payload.expiresAt);
    },
    [currentUserId, upsertTypingUser],
  );

  const handleTypingStoppedEvent = useCallback(
    (payload: ChatTypingStoppedPayload) => {
      if (!payload.roomId || !payload.userId) return;
      clearTypingUser(payload.roomId, payload.userId);
    },
    [clearTypingUser],
  );

  useEffect(() => {
    const previousRoomId = previousRoomIdRef.current;
    if (previousRoomId && previousRoomId !== activeRoomId) {
      emitTypingStop(previousRoomId);
    }
    previousRoomIdRef.current = activeRoomId;
  }, [activeRoomId, emitTypingStop]);

  useEffect(() => {
    return () => {
      Object.values(expiryTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      expiryTimersRef.current = {};
    };
  }, []);

  const typingNames = useMemo(() => {
    const activeTypingMap = typingByRoomId[activeRoomId] ?? {};

    return Object.keys(activeTypingMap)
      .filter((userId) => !currentUserId || userId !== currentUserId)
      .map((userId) => participantNameByUserId?.get(userId)?.trim() || 'Someone')
      .filter((name, index, allNames) => name.length > 0 && allNames.indexOf(name) === index);
  }, [activeRoomId, currentUserId, participantNameByUserId, typingByRoomId]);

  return {
    typingNames,
    notifyTypingActivity,
    notifyTypingStopped,
    handleTypingStartedEvent,
    handleTypingStoppedEvent,
  };
}
