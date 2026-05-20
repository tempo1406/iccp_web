# Auth API Docs For Frontend

Tài liệu này mô tả đúng theo behavior hiện tại của backend trong module `auth`.

## Base URL

- Base API: `/api/v1`
- Auth base path: `/api/v1/auth`
- Content-Type: `application/json`

## Response format chung

### Success

```json
{
  "statusCode": 200,
  "message": "Login Successfully!",
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

Một số endpoint không trả `data`:

```json
{
  "statusCode": 201,
  "message": "Register Successfully!"
}
```

### Error

```json
{
  "timestamp": "2026-03-03T13:00:00.000Z",
  "statusCode": 400,
  "error": "Bad Request",
  "errorCode": "U005",
  "message": "user.validation.email_already_exists"
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
      "property": "email",
      "code": "common.validation.is_invalid_email",
      "message": "email must be an email"
    }
  ]
}
```

## Token handling cho FE

- `accessToken`: dùng cho các API protected, gửi qua header `Authorization: Bearer <token>`.
- `refreshToken`: dùng để gọi `/auth/refresh-token` khi access token hết hạn.
- Login thành công mới có token.
- Register, verify email, forgot password, reset password không trả token.

## OTP behavior

- OTP verify email và OTP reset password đều được lưu ở Redis.
- Thời gian hết hạn thực tế theo backend hiện tại: `5 phút`.
- FE nên hiển thị countdown `05:00`.
- Không nên hardcode theo nội dung email vì template mail hiện đang có chỗ hiển thị khác với TTL thực tế.

## 1. Register

### Endpoint

- `POST /api/v1/auth/register`

### Body

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Rules

- `email`: bắt buộc, đúng định dạng email.
- `password`: bắt buộc, string.
- `firstName`: bắt buộc, string.
- `lastName`: bắt buộc, string.

### Success

- HTTP `201`

```json
{
  "statusCode": 201,
  "message": "Register Successfully!"
}
```

### FE flow sau khi register thành công

- Chuyển người dùng sang màn hình `verify email`.
- Giữ lại `email` vừa đăng ký để prefill form OTP.
- Thông báo người dùng kiểm tra email để lấy OTP.

### Error cases

- `400 U005`: email đã tồn tại.
- `400 U006`: tạo user thất bại.
- `422`: body sai format.

## 2. Login

### Endpoint

- `POST /api/v1/auth/login`

### Body

```json
{
  "email": "admin@iccp.com",
  "password": "Admin@123456"
}
```

### Success

- HTTP `200`

```json
{
  "statusCode": 200,
  "message": "Login Successfully!",
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

### FE flow sau khi login thành công

- Lưu `accessToken` và `refreshToken`.
- Set `Authorization: Bearer <accessToken>` cho các request protected.
- Điều hướng vào màn hình sau đăng nhập.

### Exception khi người dùng đăng nhập

#### 2.1 Sai format body hoặc sai email/password ở bước local auth

Backend hiện tại đang gom phần lớn lỗi ở bước local auth thành cùng một response:

- HTTP `401`

```json
{
  "timestamp": "2026-03-03T13:00:00.000Z",
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid login data"
}
```

FE nên map lỗi này thành:

- "Email hoặc mật khẩu không đúng"

Lưu ý:

- Dù trong service có `U003` hoặc `U002`, endpoint login hiện tại không trả ra `errorCode` tương ứng ở nhánh này vì `LocalStrategy` đang catch và đổi thành `401 Invalid login data`.

#### 2.2 Tài khoản chưa verify email

- HTTP `403`

```json
{
  "timestamp": "2026-03-03T13:00:00.000Z",
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Email not verified"
}
```

FE nên:

- Hiển thị thông báo yêu cầu xác thực email.
- Cho nút `Gửi lại OTP`.
- Điều hướng sang màn hình verify email, prefill email đã nhập.

#### 2.3 Tài khoản bị khóa hoặc inactive

- HTTP `403`

```json
{
  "timestamp": "2026-03-03T13:00:00.000Z",
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Account is inactive"
}
```

FE nên:

- Chặn đăng nhập.
- Hiển thị thông báo liên hệ quản trị viên hoặc hỗ trợ.

#### 2.4 Tài khoản không có system role

Behavior hiện tại của backend:

- HTTP `401`
- message: `User has no system role assigned`

Đây là lỗi cấu hình dữ liệu backend, FE chỉ cần hiện lỗi chung:

- "Không thể đăng nhập vào hệ thống lúc này"

## 3. Verify Email

### Endpoint

- `POST /api/v1/auth/verify-email`

### Body

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### Rules

- `email`: bắt buộc, đúng định dạng email.
- `otp`: bắt buộc, string, đúng `6` ký tự.

### Success

- HTTP `200`

```json
{
  "statusCode": 200,
  "message": "Email verified successfully!"
}
```

### Error cases

- `400 U003`: không tìm thấy user theo email.
- `400 U009`: email đã verify rồi.
- `400 U008`: OTP không đúng hoặc đã hết hạn.
- `422`: body sai format.

### FE flow

- Nếu thành công, chuyển sang màn hình login.
- Có thể tự động prefill email.
- Nếu `U008`, hiển thị lỗi tại ô OTP và cho phép `Gửi lại OTP`.

## 4. Resend Verify OTP

### Endpoint

- `POST /api/v1/auth/resend-otp`

### Body

```json
{
  "email": "user@example.com"
}
```

### Success

- HTTP `200`

```json
{
  "statusCode": 200,
  "message": "OTP resent successfully!"
}
```

### Error cases

- `400 U003`: không tìm thấy user.
- `400 U009`: email đã verify rồi.
- `422`: email sai format.

### FE flow

- Disable nút resend theo countdown 60s hoặc 30s ở UI.
- Khi resend thành công, reset countdown OTP về `05:00`.

## 5. Forgot Password

### Endpoint

- `POST /api/v1/auth/forgot-password`

### Body

```json
{
  "email": "user@example.com"
}
```

### Success

- HTTP `200`

```json
{
  "statusCode": 200,
  "message": "Password reset OTP sent to your email!"
}
```

### Error cases

- `400 U003`: email không tồn tại.
- `422`: email sai format.

### FE flow

- Chuyển sang màn hình `reset password`.
- Prefill `email`.
- Hiển thị OTP hết hạn sau `5 phút`.

## 6. Reset Password

### Endpoint

- `POST /api/v1/auth/reset-password`

### Body

```json
{
  "email": "user@example.com",
  "otp": "654321",
  "newPassword": "newSecurePassword123"
}
```

### Rules

- `email`: bắt buộc, đúng định dạng.
- `otp`: bắt buộc, đúng `6` ký tự.
- `newPassword`: bắt buộc, tối thiểu `8` ký tự.

### Success

- HTTP `200`

```json
{
  "statusCode": 200,
  "message": "Password reset successfully!"
}
```

### Error cases

- `400 U003`: không tìm thấy user.
- `400 U008`: OTP sai hoặc hết hạn.
- `422`: body sai format, ví dụ password dưới 8 ký tự.

### FE flow

- Nếu thành công, điều hướng sang login.
- Xóa OTP và password khỏi local state.
- Hiển thị toast đổi mật khẩu thành công.

## 7. Refresh Token

Endpoint này không nằm trong danh sách chính FE hỏi, nhưng là phần cần thiết để implement auth hoàn chỉnh.

### Endpoint

- `POST /api/v1/auth/refresh-token`

### Body

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

### Success

- HTTP `200`

```json
{
  "statusCode": 200,
  "message": "Refresh token successfully!",
  "data": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token"
  }
}
```

### Error cases

- `401`: refresh token thiếu, sai, hết hạn hoặc verify fail.
- `403`: refresh token không khớp token đã lưu trong Redis.

### FE flow

- Khi API protected trả `401`, thử gọi refresh token một lần.
- Nếu refresh thành công:
  - cập nhật token mới
  - retry request cũ
- Nếu refresh fail:
  - clear auth state
  - chuyển về login

## 8. Error code map FE nên dùng

| Error code | Meaning | FE handling |
| --- | --- | --- |
| `U003` | User không tồn tại | Hiện lỗi theo field email hoặc lỗi chung |
| `U005` | Email đã tồn tại | Hiện lỗi ở màn register |
| `U007` | Chưa verify email | Điều hướng sang verify email |
| `U008` | OTP sai hoặc hết hạn | Hiện lỗi OTP, cho resend |
| `U009` | Email đã verify | Hiện thông báo đã xác thực |
| `U010` | Tài khoản inactive | Chặn đăng nhập, báo liên hệ hỗ trợ |
| `U006` | Lỗi tạo user | Hiện lỗi hệ thống |
| `V000` | Validation chung | Hiện lỗi theo field nếu có |

## 9. Flow FE đề xuất

### Register flow

1. User submit register form.
2. Gọi `POST /auth/register`.
3. Nếu thành công, chuyển sang màn verify email.
4. User nhập OTP.
5. Gọi `POST /auth/verify-email`.
6. Nếu thành công, chuyển về login.

### Login flow

1. User submit login form.
2. Gọi `POST /auth/login`.
3. Nếu `200`, lưu token.
4. Nếu `403 Email not verified`, mở flow verify email.
5. Nếu `403 Account is inactive`, chặn đăng nhập.
6. Nếu `401 Invalid login data`, báo sai thông tin đăng nhập.

### Forgot password flow

1. User nhập email.
2. Gọi `POST /auth/forgot-password`.
3. Nếu thành công, sang màn reset password.
4. User nhập OTP và mật khẩu mới.
5. Gọi `POST /auth/reset-password`.
6. Nếu thành công, quay lại login.

## 10. Lưu ý quan trọng cho FE

- Login hiện không trả profile user, chỉ trả token.
- Sau login, nếu FE cần user info thì gọi thêm API profile riêng.
- Không nên cố phân biệt "email sai" và "password sai" ở màn login, vì backend hiện đang gom về `401 Invalid login data`.
- `verify-email` và `forgot-password` dùng 2 OTP khác nhau, FE không cần phân biệt key, chỉ cần đúng màn hình đúng endpoint.
- Với protected API, luôn gửi `Authorization: Bearer <accessToken>`.
