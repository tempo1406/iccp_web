import { SOCKET_CLIENT_EVENTS, SOCKET_EVENTS } from '@/common/constant/socket.constant';
import type { ChatRoomSubscriptionPayload } from './chat-room-subscription-payload.type';
import type { ChatTypingClientPayload } from './chat-realtime-payload.type';
import type { ProjectSocketRoomPayload } from './project-realtime-payload.type';

export interface SocketClientEventMap {
  [SOCKET_EVENTS.CHAT_ROOM_SUBSCRIBE]: ChatRoomSubscriptionPayload;
  [SOCKET_EVENTS.CHAT_ROOM_UNSUBSCRIBE]: ChatRoomSubscriptionPayload;
  [SOCKET_EVENTS.CHAT_TYPING_START]: ChatTypingClientPayload;
  [SOCKET_EVENTS.CHAT_TYPING_STOP]: ChatTypingClientPayload;
  [SOCKET_CLIENT_EVENTS.PROJECT_SUBSCRIBE]: ProjectSocketRoomPayload;
  [SOCKET_CLIENT_EVENTS.PROJECT_UNSUBSCRIBE]: ProjectSocketRoomPayload;
}

export type SocketClientEventName = keyof SocketClientEventMap;
