# Quy tắc Code và Tiêu chuẩn Kiến trúc (Coding Rules & Conventions)

Dự án ICCP Web áp dụng các quy tắc nghiêm ngặt để đảm bảo code sạch, dễ mở rộng và phù hợp với kiến trúc **Next.js App Router**, **TanStack Query**, **Multi-tenant** và **RBAC**.

---

## 1. Quy tắc Tổ chức Thư mục và File

### 1.1 Vị trí đặt UI Components
- **Shared UI (`src/components/ui/`)**: Component cơ bản, "dumb", dùng chung toàn dự án (Button, Input, Dialog, Table...). KHÔNG chứa business logic, chỉ nhận `props` và render.
- **Layout Components (`src/components/layout/`)**: Header, Sidebar, Wrapper dùng chung.
- **Feature-specific Components (`src/features/[feature]/components/`)**: Component mang tính nghiệp vụ của từng module. KHÔNG đặt vào `src/components/`.

### 1.2 Phân tách App Router và Business Logic
- **`src/app/`**: Chỉ dùng cho khai báo `page.tsx`, `layout.tsx`, `route.ts`. Không viết logic dài dòng ở đây.
- **`src/features/`**: Toàn bộ hooks, utils, types, services và components nghiệp vụ.
- **Shared Files**: Nếu một hook/util dùng ở từ 2 feature trở lên:
  - Hooks: `src/hooks/`
  - Utils: `src/lib/`
  - Constants/Types/Enums: `src/common/`

### 1.3 Phân tách `query/` và `hooks/` trong mỗi feature
Đây là quy ước quan trọng của dự án:

| Folder | Chứa gì | Rule |
|--------|---------|------|
| `features/[f]/query/` | `useQuery`, `useMutation` thuần túy — chỉ `queryFn`/`mutationFn` | KHÔNG có toast, redirect, dispatch |
| `features/[f]/hooks/` | Wrap query từ `query/`, thêm UI side effects | Gọi `onSuccess`/`onError` → toast, router.push, dispatch |

```ts
// ✅ Đúng — query/auth.mutations.ts
export function useLoginMutation(options?) {
  return useMutation({ mutationFn: loginApi, ...options });
}

// ✅ Đúng — hooks/use-login.ts
export function useLogin() {
  const mutation = useLoginMutation({
    onSuccess: () => { toast.success('...'); router.push('/dashboard'); }
  });
  return { login: (input) => mutation.mutate(input), isPending: mutation.isPending };
}
```

---

## 2. Luồng Data Fetching (API Flow)

Mọi request xuống Backend phải đi theo luồng dưới đây để đảm bảo tính nhất quán và interceptor tự động:

```
1. Component gọi hook     →  features/[f]/hooks/use-x.ts
2. Hook gọi query         →  features/[f]/query/x.mutations.ts (TanStack Query)
3. Query gọi service      →  features/[f]/services/x.service.ts (hoặc src/services/)
4. Service gọi apiFetch   →  src/config/http/api-client.ts
5. apiFetch → Backend     →  Tự inject Authorization + x-organization-id header
                              Auto refresh token khi gặp 401
```

**Không được** gọi `fetch`/`axios` trực tiếp từ component hoặc hook UI. Phải qua Service class.

### 2.1 Tạo Service mới
Mọi service class phải kế thừa `BaseService` từ `src/services/base-service.ts`:
```ts
import { BaseService } from '@/services/base-service';

export class XService extends BaseService {
  list = () => this.get<XDto[]>('/x');
  create = (body: CreateXBody) => this.post<{ id: string }, CreateXBody>('/x', body);
}
```

`BaseService` tự động inject `accessToken` từ localStorage và `tenantId` từ `ServiceContext`.

### 2.2 Dùng Service trong Query hooks
```ts
import { useServiceContext } from '@/lib/use-service-context';
import { XService } from '../services/x.service';

export function useXList() {
  const ctx = useServiceContext(); // { tenantId } từ URL
  return useSafeQuery(useQuery({
    queryKey: ['x', 'list'],
    queryFn: () => new XService(ctx).list(),
  }));
}
```

### 2.3 Cache Invalidation
Sau mutation, dùng `useQueryClient().invalidateQueries()` — **không** dùng tRPC `utils`.
```ts
const qc = useQueryClient();
// Trong onSuccess:
void qc.invalidateQueries({ queryKey: ['x', 'list'] });
```

---

## 3. Quy tắc Viết Code Chuẩn (Coding Standards)

### 3.1 Strict TypeScript
- Toàn bộ source code phải dùng TypeScript.
- **Cấm dùng `any`** — dùng `unknown` + type guards nếu cần.
- Định nghĩa rõ Request/Response types cho mọi API endpoint.

### 3.2 Tên biến, Tên file và Folder
- **File/Folder**: `kebab-case`. VD: `login-form.tsx`, `base-service.ts`.
- **React Component**: `PascalCase`. VD: `export function LoginForm() {}`.
- **Functions/Hooks/Variables**: `camelCase`. VD: `useLogin`, `handleSubmit`.
- **Constants**: `UPPER_SNAKE_CASE`. VD: `ROUTES.login`. Tập trung tại `src/common/constant/`.

### 3.3 State Management

| Loại state | Tool | Ghi chú |
|------------|------|---------|
| **Server state** (từ API) | TanStack Query `useQuery`/`useMutation` | Không dùng `useEffect` + `useState` để fetch |
| **Global client state** | Redux Toolkit (`src/store/`) | Auth credentials, user profile, UI global |
| **Local component state** | `useState` / custom hooks | Chỉ dùng trong 1-2 components |
| **Persist xuống browser** | `auth.storage.ts` (token) hoặc `use-local-storage.ts` | |

### 3.4 QueryKey Convention
Dùng mảng string phân cấp để dễ invalidate:
```ts
// ✅ Đúng
queryKey: ['projects', 'list', { page, status }]
queryKey: ['projects', 'byId', id]

// ❌ Sai
queryKey: ['getProjectList']
```

### 3.5 Bảo mật & Auth
- Không hardcode token hoặc credentials. Dùng `authTokens` helper từ `src/services/local-storage/auth.storage.ts`.
- Các route thuộc `tenant/` hoặc `(platform)` phải được bảo vệ bởi `AuthGuard` hoặc Next.js Middleware.
- `AuthGuard` dùng `useQuery(['profile', 'me'])` để verify token còn hợp lệ khi mount.

---
*Cập nhật: 2026-03-05 — Sau khi loại bỏ tRPC, áp dụng TanStack Query + Service Layer.*
