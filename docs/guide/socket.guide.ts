/**
 * ============================================================
 *  SOCKET GUIDE — ICCP Web (Frontend)
 * ============================================================
 *
 * Hướng dẫn thêm tính năng realtime mới vào project FE.
 * Ví dụ: Chat, Billing notifications, Project updates...
 *
 * Giả sử BE đã có gateway + event sẵn, bạn chỉ cần làm FE.
 * ============================================================
 */

// ────────────────────────────────────────────────────────────
//  KIẾN TRÚC FE
// ────────────────────────────────────────────────────────────
//
//  SocketProvider  (src/providers/socket-provider.tsx)
//  └─ Quản lý Map<namespace, Socket>
//     └─ Lazy-connect: socket được tạo khi có component subscribe
//
//  useSocketEvent(namespace, event, handler)
//  └─ Hook để đăng ký lắng nghe event từ một namespace
//
//  XxxRealtimeBridge  (component null — không render gì)
//  └─ Dùng useSocketEvent → dispatch action vào Redux store
//
//  Redux Store
//  └─ Component đọc state bình thường qua useAppSelector

//  SOCKET BASE URL POLICY (current implementation)
//  - Socket host is derived from NEXT_PUBLIC_API_BASE_URL (single source of truth).
//  - No separate NEXT_PUBLIC_SOCKET_URL is required.
//  - Fallback is used only when env is missing (window.origin / localhost).

// ════════════════════════════════════════════════════════════
//  BƯỚC 1 — THÊM NAMESPACE & EVENT VÀO CONSTANT
// ════════════════════════════════════════════════════════════
//
//  File: src/common/constant/socket.constant.ts
//
//  Đây là nguồn sự thật duy nhất. KHÔNG hardcode string ở nơi khác.
//  Tên namespace/event phải khớp với bên BE.
//
//    export const SOCKET_NAMESPACES = {
//      NOTIFICATIONS: 'notifications',
//      CHAT: 'chat',           // ← thêm
//    } as const;
//
//    export const SOCKET_EVENTS = {
//      NOTIFICATION_NEW: 'notification.new',
//      CHAT_MESSAGE:     'chat.message',    // ← thêm
//      CHAT_TYPING:      'chat.typing',     // ← thêm nếu cần
//    } as const;

// ════════════════════════════════════════════════════════════
//  BƯỚC 2 — ĐỊNH NGHĨA PAYLOAD TYPE
// ════════════════════════════════════════════════════════════
//
//  2a. Tạo file type cho payload:
//      src/lib/socket/types/chat-realtime-payload.type.ts
//
//        export interface ChatRealtimePayload {
//          roomId:    string;
//          senderId:  string;
//          message:   string;
//          sentAt:    string;
//        }
//
//  2b. Đăng ký vào event map:
//      src/lib/socket/types/socket-server-event-map.type.ts
//
//        export interface SocketServerEventMap {
//          [SOCKET_EVENTS.NOTIFICATION_NEW]: NotificationRealtimePayload;
//          [SOCKET_EVENTS.CHAT_MESSAGE]:     ChatRealtimePayload;   // ← thêm
//          [SOCKET_EVENTS.EXCEPTION]:        SocketExceptionPayload;
//        }
//
//  ✅ Sau bước này useSocketEvent sẽ tự type-check payload đúng type.

// ════════════════════════════════════════════════════════════
//  BƯỚC 3 — TẠO REDUX SLICE
// ════════════════════════════════════════════════════════════
//
//  File: src/store/slices/chat/chat.slice.ts
//
//    const chatSlice = createSlice({
//      name: 'chat',
//      initialState: { messages: [], status: 'idle' },
//      reducers: {
//        pushMessage(state, action: PayloadAction<ChatMessageDto>) {
//          state.messages.unshift(action.payload);
//        },
//        setMessages(state, action: PayloadAction<ChatMessageDto[]>) {
//          state.messages = action.payload;
//        },
//      },
//    });
//
//    export const { pushMessage, setMessages } = chatSlice.actions;
//    export const chatReducer = chatSlice.reducer;
//
//  Đăng ký vào store:
//  File: src/store/index.ts
//
//    reducer: {
//      notification: notificationReducer,
//      chat: chatReducer,   // ← thêm
//    }

// ════════════════════════════════════════════════════════════
//  BƯỚC 4 — TẠO REALTIME BRIDGE COMPONENT
// ════════════════════════════════════════════════════════════
//
//  File: src/features/tenant/chat/realtime/chat-realtime-bridge.tsx
//
//  Bridge là component null — chỉ làm nhiệm vụ kết nối socket
//  event với Redux store. Không render UI gì cả.
//
//  ─────────────────────────────────────────────────────────
//  'use client';
//
//  import { useSocketEvent } from '@/providers/socket-provider';
//  import { useAppDispatch } from '@/store';
//  import { pushMessage } from '@/store/slices/chat/chat.slice';
//  import {
//    SOCKET_NAMESPACES,
//    SOCKET_EVENTS,
//  } from '@/common/constant/socket.constant';
//
//  export function ChatRealtimeBridge() {
//    const dispatch = useAppDispatch();
//
//    useSocketEvent(
//      SOCKET_NAMESPACES.CHAT,       // namespace — khớp với BE gateway
//      SOCKET_EVENTS.CHAT_MESSAGE,   // event name — khớp với BE WsEvents
//      (payload) => {                // payload đã được typed tự động
//        dispatch(pushMessage({
//          id:        payload.roomId,
//          sender:    payload.senderId,
//          content:   payload.message,
//          timestamp: payload.sentAt,
//        }));
//      },
//    );
//
//    // Có thể subscribe nhiều event trong cùng namespace:
//    useSocketEvent(
//      SOCKET_NAMESPACES.CHAT,
//      SOCKET_EVENTS.CHAT_TYPING,
//      (payload) => { ... },
//    );
//
//    return null;
//  }
//  ─────────────────────────────────────────────────────────

// ════════════════════════════════════════════════════════════
//  BƯỚC 5 — MOUNT BRIDGE VÀO APP PROVIDERS
// ════════════════════════════════════════════════════════════
//
//  File: src/providers/app-providers.tsx
//
//  Chỉ thêm bridge — KHÔNG thêm SocketProvider mới.
//  Một SocketProvider quản lý tất cả namespace.
//
//    <SocketProvider>
//      <NotificationRealtimeBridge />
//      <ChatRealtimeBridge />    {/* ← thêm vào đây */}
//      {children}
//    </SocketProvider>
//
//  ✅ Socket cho namespace 'chat' tự được tạo khi bridge mount.
//  ✅ Nếu chưa login (không có token) → socket không connect.

// ════════════════════════════════════════════════════════════
//  BƯỚC 6 — ĐỌC STATE TRONG COMPONENT
// ════════════════════════════════════════════════════════════
//
//  Component đọc từ Redux store bình thường:
//
//    import { useAppSelector } from '@/store';
//
//    const messages = useAppSelector((state) => state.chat.messages);
//
//  Hoặc dùng selector export từ slice:
//
//    import { selectChatMessages } from '@/store/slices/chat/chat.slice';
//    const messages = useAppSelector(selectChatMessages);

// ════════════════════════════════════════════════════════════
//  CHECKLIST
// ════════════════════════════════════════════════════════════
//
//  □  Thêm namespace vào SOCKET_NAMESPACES  (socket.constant.ts)
//  □  Thêm event(s) vào SOCKET_EVENTS       (socket.constant.ts)
//  □  Tạo payload type                      (lib/socket/types/)
//  □  Đăng ký vào SocketServerEventMap      (socket-server-event-map.type.ts)
//  □  Tạo Redux slice + đăng ký vào store   (store/slices/xxx/)
//  □  Tạo XxxRealtimeBridge component       (features/xxx/realtime/)
//  □  Mount bridge vào AppProviders         (providers/app-providers.tsx)

// ════════════════════════════════════════════════════════════
//  LƯU Ý
// ════════════════════════════════════════════════════════════
//
//  Lazy-connect
//    Socket chỉ được tạo khi bridge mount lần đầu.
//    Bridge không mount → không có kết nối → tiết kiệm tài nguyên.
//
//  Auth token
//    Tất cả namespace dùng chung JWT từ Redux store (state.auth.accessToken).
//    Token refresh → SocketProvider tự reconnect toàn bộ namespace đang active.
//
//  Xem connection status
//    const status = useSocket().getStatus(SOCKET_NAMESPACES.CHAT);
//    // 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

export {};
