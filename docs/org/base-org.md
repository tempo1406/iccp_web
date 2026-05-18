# Organization API Docs For Frontend

Tài liệu này mô tả đúng theo behavior hiện tại của backend trong module `organization`.

## Base URL

- Base API: `/api/v1`
- Organization base path: `/api/v1/organizations`
- Content-Type: `application/json`

## Yêu cầu authentication

Tất cả các API trong module này đều **yêu cầu access token** (JWT).

Gửi token qua header:

```
Authorization: Bearer <accessToken>
```

## Response format chung

### Success

```json
{
  "statusCode": 200,
  "message": "Fetched organizations successfully",
  "data": { ... }
}
```

Một số endpoint không trả `data` (ví dụ: create organization):

```json
{
  "statusCode": 201,
  "message": "Organization created successfully"
}
```

### Error

```json
{
  "timestamp": "2026-03-05T02:00:00.000Z",
  "statusCode": 400,
  "error": "Bad Request",
  "errorCode": "O002",
  "message": "organization.validation.slug_already_exists"
}
```

### Validation error (DTO sai format)

```json
{
  "timestamp": "2026-03-05T02:00:00.000Z",
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "Validation failed",
  "details": [
    {
      "property": "slug",
      "code": "common.validation.matches",
      "message": "Slug chỉ được chứa chữ thường, số và dấu gạch ngang"
    }
  ]
}
```

---

## 1. Register Organization (Tạo tổ chức mới)

### Endpoint

- `POST /api/v1/organizations`

### Authentication

- Yêu cầu `Authorization: Bearer <accessToken>`.
- Lấy `userId` từ JWT để set làm `ownerId` của tổ chức.

### Body

```json
{
  "name": "ICCP Company",
  "slug": "iccp-company",
  "description": "A great company",
  "logoUrl": "https://example.com/logo.png",
  "industry": "Technology",
  "size": "medium",
  "subscriptionPlanId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Mô tả từng field

| Field | Bắt buộc | Kiểu | Mô tả |
|---|---|---|---|
| `name` | ✅ | string | Tên tổ chức, tối đa 255 ký tự |
| `slug` | ✅ | string | Slug duy nhất dùng trong URL, tối đa 100 ký tự |
| `description` | ❌ | string | Mô tả tổ chức |
| `logoUrl` | ❌ | string | URL logo của tổ chức |
| `industry` | ❌ | string | Ngành nghề, tối đa 100 ký tự |
| `size` | ❌ | string (enum) | Quy mô: `small`, `medium`, `large`, `enterprise` |
| `subscriptionPlanId` | ❌ | UUID | ID gói subscription, phải là một plan đang active |

### Rules validation

- `name`: bắt buộc, string, tối đa 255 ký tự.
- `slug`: bắt buộc, string, tối đa 100 ký tự, **chỉ được chứa chữ thường, số và dấu gạch ngang** (ví dụ `iccp-company`, `my-org-2024`). Không được có chữ hoa, space, ký tự đặc biệt.
- `size`: nếu truyền thì phải là một trong 4 giá trị: `small`, `medium`, `large`, `enterprise`.
- `subscriptionPlanId`: nếu truyền thì phải là UUID hợp lệ và plan đó phải đang active.

### Success

- HTTP `201`

```json
{
  "statusCode": 201,
  "message": "Organization created successfully"
}
```

> **Lưu ý:** Response không trả về object organization. Nếu FE cần lấy thông tin org ngay sau khi tạo, hãy gọi `GET /organizations/my-orgs`.

### Behavior backend khi tạo thành công

1. Tạo bản ghi `Organization` trong DB.
2. Tự động thêm người tạo vào bảng `OrganizationMember` với `isOwner = true`.
3. Gán role `ORG_ADMIN` (system role) cho người tạo trong RBAC scope tổ chức vừa tạo.
4. Nếu có `subscriptionPlanId`, tạo `Subscription` với chu kỳ `yearly`, thời hạn 1 năm, `autoRenew = true`.

### Error cases

| HTTP | Error code | Ý nghĩa | FE nên xử lý |
|---|---|---|---|
| `400` | `O002` | Slug đã tồn tại | Hiện lỗi tại field `slug`, gợi ý đổi slug |
| `400` | `O009` | Subscription plan không tìm thấy hoặc inactive | Hiện lỗi chung hoặc tại field `subscriptionPlanId` |
| `401` | _(không có errorCode)_ | Chưa đăng nhập / token hết hạn | Redirect về login |
| `422` | `V000` | Body sai format / validation fail | Hiện lỗi theo field trong `details` |

### FE flow sau khi tạo thành công

1. Hiển thị toast/thông báo "Tạo tổ chức thành công".
2. Gọi `GET /organizations/my-orgs` để lấy danh sách org cập nhật (bao gồm org vừa tạo).
3. Điều hướng vào dashboard của tổ chức vừa tạo (dùng `slug` hoặc `id` từ kết quả `my-orgs`).

---

## 2. Get My Organizations (Lấy danh sách tổ chức đang tham gia)

### Endpoint

- `GET /api/v1/organizations/my-orgs`

### Authentication

- Yêu cầu `Authorization: Bearer <accessToken>`.
- Backend lấy `userId` từ JWT để tìm tất cả org mà user đó là member active.

### Body / Params

Không có body. Không có query params. Không có path params.

### Success

- HTTP `200`

```json
{
  "statusCode": 200,
  "message": "Fetched organizations successfully",
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "ICCP Company",
      "slug": "iccp-company",
      "ownerId": "456e1234-e89b-12d3-a456-426614174abc",
      "description": "A great company",
      "logoUrl": "https://example.com/logo.png",
      "industry": "Technology",
      "size": "medium",
      "subscriptionPlanId": "789e0000-e89b-12d3-a456-426614174xyz",
      "isActive": true,
      "settings": null,
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-01T10:00:00.000Z"
    }
  ]
}
```

### Mô tả từng field trong `data[]`

| Field | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID string | ID của tổ chức |
| `name` | string | Tên tổ chức |
| `slug` | string | Slug của tổ chức |
| `ownerId` | UUID string | ID người tạo / chủ sở hữu tổ chức |
| `description` | string \| null | Mô tả tổ chức |
| `logoUrl` | string \| null | URL logo |
| `industry` | string \| null | Ngành nghề |
| `size` | string \| null | Quy mô: `small`, `medium`, `large`, `enterprise` |
| `subscriptionPlanId` | UUID \| null | ID gói subscription, `null` nếu không có |
| `isActive` | boolean | Tổ chức có đang hoạt động không |
| `settings` | object \| null | Config tuỳ chỉnh của tổ chức (JSON), thường là `null` |
| `createdAt` | ISO 8601 datetime | Thời điểm tạo |
| `updatedAt` | ISO 8601 datetime | Thời điểm cập nhật lần cuối |

### Trường hợp user chưa tham gia org nào

- HTTP `200` nhưng `data` là mảng rỗng:

```json
{
  "statusCode": 200,
  "message": "Fetched organizations successfully",
  "data": []
}
```

> FE nên kiểm tra `data.length === 0` và hiển thị màn hình "Bạn chưa thuộc tổ chức nào" hoặc gọi flow tạo tổ chức mới.

### Error cases

| HTTP | Error code | Ý nghĩa | FE nên xử lý |
|---|---|---|---|
| `401` | _(không có errorCode)_ | Chưa đăng nhập / token hết hạn | Redirect về login |

### FE flow

1. Gọi `GET /organizations/my-orgs` sau khi user đăng nhập thành công.
2. Nếu `data.length > 0`: cho user chọn tổ chức muốn vào, hoặc tự động vào tổ chức đầu tiên.
3. Nếu `data.length === 0`: điều hướng sang màn hình tạo tổ chức mới hoặc hiển thị empty state.
4. Sau khi user chọn org, lưu `orgId` vào state để dùng cho các API cần header `x-organization-id`.

---

## 3. Error code map

| Error code | Meaning | FE handling |
|---|---|---|
| `O001` | Organization không tồn tại | Hiện lỗi chung |
| `O002` | Slug đã tồn tại | Hiện lỗi tại field `slug` trong form |
| `O009` | Subscription plan không tìm thấy hoặc inactive | Hiện lỗi tại field `subscriptionPlanId` |
| `V000` | Validation chung | Hiện lỗi theo field nếu có trong `details` |

---

## 4. Lưu ý quan trọng cho FE

- **Slug validation phía FE**: Trước khi submit, nên validate slug theo pattern `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Gợi ý: auto-convert tên tổ chức thành slug (lowercase, replace space bằng `-`, bỏ ký tự đặc biệt).
- **`POST /organizations` không trả về object org**: Sau khi tạo thành công, bắt buộc phải gọi `GET /my-orgs` nếu muốn dùng dữ liệu org ngay lập tức.
- **Lưu `orgId` sau khi chọn org**: Nhiều API protected trong hệ thống yêu cầu header `x-organization-id`. FE cần lưu `orgId` của tổ chức đang được chọn (vào state management / localStorage) và gửi kèm trong các request tiếp theo.
- **`ownerId` trong response**: Dùng để so sánh với `userId` hiện tại để biết user có phải owner không (phục vụ phân quyền UI).
- **`isActive = false`**: Các org đã bị vô hiệu hóa sẽ không trả về trong `my-orgs` (backend filter `isActive = true`), FE không cần xử lý trường hợp này.
