# API Flow

## Mục tiêu

Tài liệu này mô tả luồng gọi API hiện tại của codebase:

- Frontend không gọi trực tiếp backend REST API
- Frontend gọi vào lớp API nội bộ của Next.js thông qua `tRPC`
- Server-side của Next.js gọi tiếp backend REST API bằng `fetch`

Luồng tổng quát:

```txt
Client Component / Hook
-> tRPC hook
-> TRPCProvider + TanStack Query
-> /api/trpc/[procedure]
-> tRPC router
-> service layer
-> fetch
-> REST backend
```

---

## Các lớp chính

### 1. Frontend hooks

Frontend gọi API thông qua các custom hook theo từng feature.

Ví dụ:

- `src/features/projects/query/use-projects.ts`
- `src/features/auth/query/use-auth.ts`

Các hook này thường gọi:

- `trpc.<router>.<procedure>.useQuery(...)`
- `trpc.<router>.<procedure>.useMutation(...)`

TanStack Query được dùng để:

- cache dữ liệu
- quản lý loading/error state
- invalidate lại query sau mutation

---

### 2. tRPC client provider

Toàn bộ app được bọc bởi provider ở:

- `src/providers/app-providers.tsx`
- `src/providers/trpc-provider.tsx`

`TRPCProvider` làm các việc sau:

- khởi tạo `QueryClient`
- khởi tạo `trpc` client
- cấu hình `httpBatchLink`
- gửi request tới `/api/trpc`
- tự động gắn header `x-tenant-id` nếu đang ở tenant route

Điều này có nghĩa là browser chỉ gọi vào API nội bộ của Next, thay vì gọi trực tiếp backend REST.

---

### 3. Next.js API entrypoint

Điểm vào của toàn bộ request `tRPC` là:

- `src/app/api/trpc/[trpc]/route.ts`

File này dùng `fetchRequestHandler` của `tRPC` để:

- nhận request HTTP từ browser
- tạo context cho request
- chuyển request tới đúng router/procedure

---

### 4. tRPC context

Context được tạo ở:

- `src/server/trpc/init.ts`

Hiện tại context chứa:

- `req`
- `userId`
- `tenantId`

Ngoài ra file này cũng định nghĩa:

- `publicProcedure`
- `protectedProcedure`
- `tenantProcedure`

Ý nghĩa:

- `publicProcedure`: ai cũng gọi được
- `protectedProcedure`: yêu cầu đã đăng nhập
- `tenantProcedure`: yêu cầu đã đăng nhập và có `tenantId`

Lưu ý hiện tại:

- `userId` vẫn đang được gán `null`
- nên các procedure yêu cầu auth chưa thực sự hoạt động đầy đủ cho production

---

### 5. Root router và feature routers

Root router nằm ở:

- `src/server/trpc/routers/_app.ts`

Tại đây hệ thống gộp tất cả feature router như:

- `auth`
- `projects`
- `documents`
- `users`
- `analytics`
- `billing`
- `teamChat`
- `accessControl`

Ví dụ:

- `trpc.auth.health`
- `trpc.projects.list`
- `trpc.users.invite`

---

### 6. Service layer

Một số router xử lý logic trực tiếp, nhưng pattern mục tiêu của repo là:

```txt
tRPC router -> service class -> apiFetch -> REST backend
```

Lớp base service:

- `src/services/base-service.ts`

HTTP client thấp nhất:

- `src/services/http/api-client.ts`

`apiFetch()` là nơi gọi `fetch()` thật sự.

Nó xử lý:

- `baseUrl`
- headers
- `x-tenant-id`
- `Authorization`
- JSON body
- lỗi HTTP

---

## Ví dụ đầy đủ: `projects.list`

Đây là flow tham chiếu rõ nhất trong codebase hiện tại.

### Bước 1. Component gọi hook

Hook:

- `src/features/projects/query/use-projects.ts`

Ví dụ:

```ts
const projects = useProjectList({ page: 1, limit: 20 });
```

Hook này gọi:

```ts
trpc.projects.list.useQuery(...)
```

---

### Bước 2. tRPC client gửi request đến Next API

Provider:

- `src/providers/trpc-provider.tsx`

Request được gửi tới:

```txt
/api/trpc
```

Nếu đang ở tenant route, header sau sẽ được gắn tự động:

```txt
x-tenant-id: <tenant>
```

---

### Bước 3. Next API route nhận request

Entrypoint:

- `src/app/api/trpc/[trpc]/route.ts`

Route này gọi `createTRPCContext()` và `appRouter`.

---

### Bước 4. tRPC router xử lý procedure

Router:

- `src/server/trpc/routers/projects.ts`

Procedure:

```ts
projects.list
```

Router validate input bằng `zod`, sau đó gọi service:

```ts
new ProjectsService(ctx).list(input)
```

---

### Bước 5. Service gọi REST backend

Service:

- `src/features/projects/services/projects.service.ts`

Ví dụ:

```ts
return this.get<ProjectListResponse>(`${this.base}?${qs}`);
```

`this.get()` được kế thừa từ `BaseService`, và cuối cùng đi xuống:

- `src/services/base-service.ts`
- `src/services/http/api-client.ts`

Tại đây mới có `fetch()` thực sự tới backend REST API.

---

### Bước 6. Response đi ngược lại lên frontend

Luồng response:

```txt
REST backend
-> apiFetch
-> ProjectsService
-> projects router
-> /api/trpc
-> TanStack Query cache
-> component render
```

---

## Vì sao kiến trúc này đang được dùng

### 1. Không lộ trực tiếp endpoint backend trên browser

Browser chỉ thấy request tới:

```txt
/api/trpc/...
```

thay vì thấy backend REST URL thật.

### 2. Có một lớp BFF trong Next.js

Lớp này giúp gom:

- auth
- tenant context
- validation
- error mapping
- typed API contract

### 3. Typed end-to-end

Frontend và backend nội bộ dùng chung type qua `tRPC`, giảm sai lệch contract.

### 4. Tách vai trò rõ

- `fetch`: giao tiếp HTTP thật
- `tRPC`: API layer typed
- `TanStack Query`: cache và async state
- `Redux`: UI/global client state

---

## Những gì đang hoàn thiện dở

### 1. Không phải router nào cũng đã nối REST backend

Hiện có router vẫn đang trả mock hoặc placeholder.

### 2. Auth context chưa hoàn chỉnh

Trong:

- `src/server/trpc/init.ts`

`userId` vẫn đang là `null`, nên `protectedProcedure` và `tenantProcedure` chưa sẵn sàng cho flow auth thật.

### 3. Service pattern chưa được áp dụng đồng đều

`projects` là ví dụ gần đúng nhất của pattern mục tiêu. Các module khác vẫn còn chỗ xử lý mock trực tiếp trong router.

---

## Quy ước nên giữ khi phát triển tiếp

Khi thêm API mới, nên đi theo flow:

1. Tạo procedure trong feature router
2. Validate input bằng `zod`
3. Gọi service class thay vì viết `fetch` trực tiếp trong router
4. Để frontend gọi qua custom hook theo feature
5. Dùng TanStack Query để quản lý cache/invalidation

Pattern mục tiêu:

```txt
Component
-> feature query hook
-> tRPC procedure
-> service
-> apiFetch
-> REST backend
```
