# User Profile API Docs For Frontend

Tài liệu này mô tả chi tiết behavior của backend trong module `users` liên quan đến Profile cá nhân, giúp Frontend có thể integrate và mapping dữ liệu chính xác.

## Base URL

- Base API: `/api/v1`
- Users base path: `/api/v1/users`
- Content-Type: `application/json`

> **Lưu ý quan trọng cho FE**: Tất cả các API trong tài liệu này đều là protected, do đó luôn phải đính kèm header `Authorization: Bearer <accessToken>` lấy được từ API Login.

## Response format chung

### Success

```json
{
  "statusCode": 200,
  "message": "Profile fetched successfully",
  "data": { ... }
}
```

### Error

```json
{
  "timestamp": "2026-03-03T13:00:00.000Z",
  "statusCode": 404,
  "error": "Not Found",
  "errorCode": "U003",
  "message": "user.validation.not_found"
}
```

### Validation error DTO sai format

```json
{
  "timestamp": "2026-03-03T13:00:00.000Z",
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "Validation failed",
  "details": [
    {
      "property": "phone",
      "code": "common.validation.is_phone_number",
      "message": "phone must be a valid phone number"
    }
  ]
}
```

## 1. Lấy thông tin cá nhân (Get Me)

### Endpoint

- `GET /api/v1/users/me`

### Headers

- `Authorization: Bearer <accessToken>`

### Success

- HTTP `200`

```json
{
  "statusCode": 200,
  "message": "Profile fetched successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": "https://example.com/avatar.jpg",
    "phone": "+84901234567",
    "dateOfBirth": "1995-06-15T00:00:00.000Z",
    "address": "123 Main St, Hanoi",
    "provider": "local",
    "isActive": true,
    "isVerified": true,
    "createdAt": "2026-03-01T10:00:00.000Z",
    "updatedAt": "2026-03-01T10:00:00.000Z"
  }
}
```

### Error cases

- `401 Unauthorized`: Token không hợp lệ, không có token hoặc token đã hết hạn.
- `404 U003`: Không tìm thấy user (trường hợp hiếm, khi user bị xóa khỏi DB nhưng token trên client vẫn còn).

### FE flow đề xuất

- Gọi API này ngay sau khi có `accessToken` (ví dụ sau khi Login thành công) để lấy thông tin user.
- Lưu thông tin `data` trả về vào Global State (Redux, Zustand, Context) để sử dụng cho toàn bộ app.
- Khi app được tải lại (reload trang), nếu phát hiện có token trong bộ nhớ, tự động gọi API này để phục hồi thông tin user. Nếu nhận lỗi `401`, tiến hành refresh token hoặc log out.

## 2. Cập nhật thông tin cá nhân (Update Profile)

### Endpoint

- `PUT /api/v1/users/me`

### Headers

- `Authorization: Bearer <accessToken>`

### Body

Tất cả các field trong Request Body đều là tuỳ chọn (`optional`). Frontend chỉ cần gửi lên các field nào mà user thực sự muốn thay đổi.

```json
{
  "firstName": "John",
  "lastName": "Doe Dev",
  "phone": "+84988123456",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "dateOfBirth": "1995-06-15",
  "address": "456 New St, Da Nang"
}
```

### Rules & Validation

- `firstName`: `string`, optional.
- `lastName`: `string`, optional.
- `phone`: `string`, optional. Bắt buộc **phải đúng định dạng số điện thoại** (VD: +84...).
- `avatarUrl`: `string`, optional.
- `dateOfBirth`: `DateString` (chuỗi ngày tháng theo chuẩn ISO 8601, VD: `1995-06-15`), optional.
- `address`: `string`, optional.

### Success

- HTTP `200`
- Response trả về thông tin user **sau khi đã được cập nhật thành công**.

```json
{
  "statusCode": 200,
  "message": "Profile updated successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe Dev",
    "avatarUrl": "https://example.com/new-avatar.jpg",
    "phone": "+84988123456",
    "dateOfBirth": "1995-06-15T00:00:00.000Z",
    "address": "456 New St, Da Nang",
    "provider": "local",
    "isActive": true,
    "isVerified": true,
    "createdAt": "2026-03-01T10:00:00.000Z",
    "updatedAt": "2026-03-03T14:30:00.000Z"
  }
}
```

### Error cases

- `401 Unauthorized`: Lỗi authenticate token.
- `404 U003`: Không tìm thấy user.
- `422 Unprocessable Entity`: Dữ liệu gửi lên sai định dạng (ví dụ `phone` không phải là số điện thoại chuẩn, `dateOfBirth` sai định dạng ngày, v.v.). Xem `details` trong response để map lỗi chi tiết.

### FE flow đề xuất

- Ở màn hình **Settings / Profile**, prefill (điền sẵn) dữ liệu đã lưu trong Global State vào Form.
- Cho phép người dùng chỉnh sửa nội dung.
- Gửi Request Body. Để tối ưu, chỉ gửi lên những trường có sự thay đổi (dirty fields).
- **Nếu API trả về 200 Success**:
  - Dùng luôn `data` trả về trong response để cập nhật lại Global State.
  - Hiển thị Toast Message (ví dụ: "Cập nhật hồ sơ cá nhân thành công").
- **Nếu API trả về 422 Unprocessable Entity**:
  - Bắt mảng `details` trong response để lấy các field bị lỗi và hiển thị message lỗi bên dưới các ô Input tương ứng.

## 3. Error code map FE nên dùng

Dưới đây là các Error Code đặc trưng FE có thể gặp khi làm việc với User Profile:

| Error code | Meaning | FE handling |
| --- | --- | --- |
| `U003` | User không tồn tại | Xoá auth state nội bộ, redirect về trang đăng nhập |
| `V000` (hoặc HTTP `422`) | Validation format lỗi chung | Hiển thị lỗi theo từng field tương ứng trên Form (nhất là `phone`, `dateOfBirth`) |
| HTTP `401` | Token sai/hết hạn | Chặn request, gọi refresh token, nếu fail thì redirect về login |

## 4. Lưu ý quan trọng cho FE

- **Dữ liệu trả về từ Login API (`/api/v1/auth/login`) KHÔNG bao gồm profile user** (chỉ có tokens). Frontend BẮT BUỘC phải gọi API `GET /api/v1/users/me` sau khi đăng nhập xong để lấy dữ liệu User Info.
- **Avatar Update Flow**: Flow chuẩn để đổi ảnh đại diện thường làm:
  1. FE gọi API upload file ảnh (Upload Module).
  2. Upload API trả về link (URL của ảnh đã upload).
  3. FE nhét URL đó vào field `avatarUrl` rồi gọi thư mục `PUT /api/v1/users/me` này.
- Thuộc tính `provider` sẽ cho biết user đăng nhập theo local form hay qua provider OAuth nào (`google`, `microsoft`). Trạng thái `isVerified` nói lên email của user đã được xác thực mã OTP hay chưa.
