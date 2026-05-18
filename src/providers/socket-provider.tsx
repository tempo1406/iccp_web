'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { appConfig } from '@/common/constant/app';
import type { SocketNamespace } from '@/common/constant/socket.constant';
import type {
  SocketClientEventMap,
  SocketClientEventName,
  SocketServerEventMap,
  SocketServerEventName,
} from '@/lib/socket/events';
import { authTokens } from '@/services/local-storage/auth.storage';
import { useAppSelector } from '@/store';

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

type StatusMap = Partial<Record<SocketNamespace, ConnectionStatus>>;

interface SocketContextValue {
  subscribe: <E extends SocketServerEventName>(
    namespace: SocketNamespace,
    event: E,
    handler: (payload: SocketServerEventMap[E]) => void,
  ) => () => void;
  emit: <E extends SocketClientEventName, A = unknown>(
    namespace: SocketNamespace,
    event: E,
    payload: SocketClientEventMap[E],
    ack?: (response: A) => void,
  ) => boolean;
  getStatus: (namespace: SocketNamespace) => ConnectionStatus;
}

const SocketContext = createContext<SocketContextValue | null>(null);

const DEFAULT_SOCKET_BASE_URL = 'http://localhost:3333';

function normalizeBaseUrl(url: string) {
  return url.replace(/\/$/, '');
}

function deriveHostBase(apiBaseUrl?: string): string | null {
  if (!apiBaseUrl) return null;
  const trimmed = apiBaseUrl.trim();
  if (!trimmed) return null;

  return normalizeBaseUrl(trimmed.replace(/\/api\/v\d+$/i, '').replace(/\/api$/i, ''));
}

function resolveSocketBaseUrl(): string {
  const fromApiBaseEnv = deriveHostBase(appConfig.apiBaseUrl);
  if (fromApiBaseEnv) {
    return fromApiBaseEnv;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return DEFAULT_SOCKET_BASE_URL;
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const authStateToken = useAppSelector((state) => state.auth.accessToken);

  const socketsRef = useRef<Map<SocketNamespace, Socket>>(new Map());
  const [statusMap, setStatusMap] = useState<StatusMap>({});

  const getToken = useCallback(() => {
    return authStateToken ?? authTokens.getAccess();
  }, [authStateToken]);

  const setNamespaceStatus = useCallback((namespace: SocketNamespace, status: ConnectionStatus) => {
    setStatusMap((previous) => ({ ...previous, [namespace]: status }));
  }, []);

  const createSocket = useCallback(
    (namespace: SocketNamespace, token: string): Socket => {
      const socket = io(`${resolveSocketBaseUrl()}/${namespace}`, {
        // Prefer polling-first handshake so clients can still connect in dev
        // environments where direct websocket upgrade intermittently fails.
        transports: ['polling', 'websocket'],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10_000,
        timeout: 20_000,
        autoConnect: false,
        auth: { accessToken: token },
      });

      socket.on('connect', () => {
        setNamespaceStatus(namespace, 'connected');
      });
      socket.on('disconnect', () => {
        setNamespaceStatus(namespace, 'disconnected');
      });
      socket.on('connect_error', () => {
        setNamespaceStatus(namespace, 'error');
      });

      return socket;
    },
    [setNamespaceStatus],
  );

  const ensureConnected = useCallback(
    (namespace: SocketNamespace) => {
      if (socketsRef.current.has(namespace)) return;

      const token = getToken();
      if (!token) return;

      setNamespaceStatus(namespace, 'connecting');
      const socket = createSocket(namespace, token);
      socketsRef.current.set(namespace, socket);
      socket.connect();
    },
    [authStateToken, createSocket, getToken, setNamespaceStatus],
  );

  const subscribe = useCallback(
    <E extends SocketServerEventName>(
      namespace: SocketNamespace,
      event: E,
      handler: (payload: SocketServerEventMap[E]) => void,
    ) => {
      ensureConnected(namespace);
      const socket = socketsRef.current.get(namespace);
      if (!socket) return () => undefined;

      const typedHandler = handler as (...args: any[]) => void;
      (socket as any).on(event, typedHandler);

      return () => {
        (socket as any).off(event, typedHandler);
      };
    },
    [ensureConnected],
  );

  const emit = useCallback(
    <E extends SocketClientEventName, A = unknown>(
      namespace: SocketNamespace,
      event: E,
      payload: SocketClientEventMap[E],
      ack?: (response: A) => void,
    ) => {
      ensureConnected(namespace);
      const socket = socketsRef.current.get(namespace);
      if (!socket) return false;

      if (ack) {
        socket.emit(event, payload, ack);
        return true;
      }

      socket.emit(event, payload);
      return true;
    },
    [ensureConnected],
  );

  const getStatus = useCallback(
    (namespace: SocketNamespace): ConnectionStatus => {
      return statusMap[namespace] ?? 'idle';
    },
    [statusMap],
  );

  useEffect(() => {
    const token = getToken();
    const currentSockets = socketsRef.current;

    if (!token) {
      for (const socket of currentSockets.values()) {
        socket.disconnect();
      }
      currentSockets.clear();
      return;
    }

    for (const [namespace, socket] of currentSockets.entries()) {
      socket.auth = { accessToken: token };
      setNamespaceStatus(namespace, 'connecting');
      socket.disconnect().connect();
    }
  }, [getToken, setNamespaceStatus]);

  useEffect(() => {
    const currentSockets = socketsRef.current;

    return () => {
      for (const socket of currentSockets.values()) {
        socket.removeAllListeners();
        socket.disconnect();
      }
      currentSockets.clear();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ subscribe, emit, getStatus }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used inside <SocketProvider>');
  return context;
}

export function useSocketEvent<E extends SocketServerEventName>(
  namespace: SocketNamespace,
  event: E,
  handler: (payload: SocketServerEventMap[E]) => void,
  enabled: boolean = true,
): void {
  const { subscribe } = useSocket();
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribe(namespace, event, (payload) => {
      handlerRef.current(payload);
    });

    return () => unsubscribe();
  }, [enabled, namespace, event, subscribe]);
}
