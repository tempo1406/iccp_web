# Cấu trúc Source Code (Dự án ICCP Web)

Dự án sử dụng kiến trúc **Next.js App Router** kết hợp với **Feature-based modules**. Do yêu cầu về **multi-tenant** và **role-based access control (RBAC)**, source code được tổ chức nhằm tách biệt rõ ràng giữa phần Routing (UI), Logic theo từng chức năng (Features), và Tầng Service/Data.

---

## 1. Cấu trúc thư mục `src/` tổng quan

```txt
src/
├─ app/                     # Routing, Layouts, và Pages (Next.js App Router)
├─ common/                  # Hằng số (constants), enums, và types dùng chung toàn cục
├─ components/              # UI Components dùng chung (không chứa business logic)
├─ config/                  # Cấu hình dự án (HTTP client, TanStack Query, môi trường)
├─ features/                # Toàn bộ Business Logic, chia theo từng chức năng
├─ hooks/                   # Custom React Hooks dùng chung (useDebounce, useLocalStorage, v.v.)
├─ lib/                     # Utilities và thư viện hỗ trợ (safe-query, toast, v.v.)
├─ providers/               # Context/Providers (Redux, QueryProvider, Theme, Tenant)
├─ services/                # Tầng giao tiếp dữ liệu (API clients, localStorage)
├─ store/                   # Redux store, hooks, slices
└─ proxy.ts                 # Next.js Middleware (Auth guards, chặn request)
```

---

## 2. Chi tiết các thư mục cốt lõi

### A) `src/app/` (App Router)
Chỉ chứa **Routing** và **Layouts**. Không đặt logic nghiệp vụ ở đây.
- `(auth)/`: Cụm route liên quan đến login/register.
- `(landing-page)/`: Trang chủ bên ngoài.
- `tenant/[tenant]/`: Cụm route dành cho môi trường tenant cụ thể.
- `api/`: Next.js Route Handlers (REST APIs nếu cần).

### B) `src/features/` (Feature modules)
"Trái tim" của ứng dụng. Mỗi feature đóng gói độc lập UI components, hooks, query mutations và types của riêng nó.

**Cấu trúc tiêu chuẩn bên trong 1 feature:**
```txt
src/features/auth/
├─ components/  # React components chỉ phục vụ riêng cho feature này
├─ hooks/       # Custom hooks chứa UI logic (toast, redirect, dispatch Redux)
├─ pages/       # Page-level components được import vào app/
├─ query/       # TanStack Query mutation/query hooks thuần túy (không có UI side effects)
├─ services/    # Service class kế thừa BaseService (nếu feature có service riêng)
├─ types/       # TypeScript interfaces/types
└─ validation/  # Zod schemas
```

**Phân tách `hooks/` và `query/`:**
- `query/` — chỉ chứa `mutationFn`/`queryFn`. Không có toast, redirect, hay dispatch.
- `hooks/` — wrap query từ `query/`, thêm `onSuccess`/`onError` với UI effects.

### C) `src/services/` (Service Layer)
Tầng duy nhất giao tiếp với Backend REST API.
- `base-service.ts` — Abstract class inject `accessToken` (từ localStorage) và `tenantId` vào mọi request.
- `auth/auth.service.ts` — Các hàm fetch cho Auth API.
- `users/users.service.ts` — User & Profile API.
- `local-storage/auth.storage.ts` — Đọc/ghi token an toàn.
- Mỗi feature có thể có `services/` riêng (e.g., `features/tenant/projects/services/projects.service.ts`).

### D) `src/config/` (Cấu hình)
```txt
config/
├─ http/
│   ├─ api-client.ts   # apiFetch — core HTTP client, tự động inject token, refresh 401
│   ├─ errors.ts       # HttpError class
│   └─ index.ts
└─ tanstack/
    └─ query-client.ts # makeQueryClient() factory cho TanStack Query
```

### E) `src/providers/` (App Contexts)
```txt
providers/
├─ app-providers.tsx   # Bọc toàn bộ providers: Theme > Redux > Query > Toast
├─ query-provider.tsx  # QueryClientProvider (TanStack Query)
├─ redux-provider.tsx
├─ tenant-context.tsx  # TenantContext — lưu tenantId từ URL param
└─ theme-provider.tsx
```

### F) `src/lib/` (Utilities)
- `safe-query/` — `useSafeQuery` / `useSafeMutation`: normalize kết quả query sang `{ data, error, status, isEmpty }`. Không phụ thuộc tRPC.
- `use-service-context.ts` — Hook lấy `ServiceContext` (`tenantId` từ `TenantContext`).

---

## 3. Kiến trúc Data Fetching

```
Component
  ↓ useSafeQuery(useQuery({ queryFn: () => new XService(ctx).method() }))
XService extends BaseService (ctx có tenantId)
  ↓ apiFetch() — tự inject accessToken từ localStorage, tenantId header
NestJS REST Backend
```

**TanStack Query** quản lý toàn bộ server state (caching, invalidation, loading states).  
**Redux Toolkit** chỉ dùng cho global client state (auth credentials, user profile, UI state).

---

## 4. Multi-tenant, RBAC và Authentication

1. **Routing Guard (`src/proxy.ts` + Client Guards):**
   - `AuthGuard` — chặn truy cập khi chưa đăng nhập, fetch profile bằng `useQuery` + `UsersService.getMe()`.
   - `GuestGuard` — redirect đã login ra khỏi trang auth.
   - Next.js Middleware (`proxy.ts`) — kiểm tra cookie/header ở cấp edge.

2. **Giao tiếp API:**
   - Mọi request qua `apiFetch`: tự động inject `Authorization` + `x-organization-id`.
   - Khi gặp `401`: tự động refresh token (queue an toàn), retry request gốc. Thất bại → logout.

3. **Backend:**
   - NestJS REST Backend kiểm tra JWT và `x-organization-id` header tại mọi endpoint cần auth.

---
*Cập nhật: 2026-03-05 — Sau khi loại bỏ tRPC, áp dụng TanStack Query + Service Layer thuần túy.*
