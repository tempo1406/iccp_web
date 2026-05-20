# 🔌 Hướng dẫn Tích hợp API (Frontend Integration Guide)

Tài liệu này hướng dẫn cách Frontend (FE) nên cấu hình Axios (hoặc Fetch) interceptor để xử lý các response trả về từ Backend (BE), bao gồm cả thành công và thất bại.

---

## 1. Cấu trúc Response chung

Mọi response thành công từ BE đều được bọc trong một chuẩn chung (`ApiResponseDto`).

### Response Thành công (HTTP 200, 201)

```json
{
  "statusCode": 200, // Hoặc 201
  "message": "Login Successfully!", // Câu thông báo thành công
  "data": { ... } // Payload chính, có thể là null nếu không có data
}
```

> 💡 **Tip cho FE:** Trong `response interceptor`, bạn có thể bóc tách thẳng data để các hàm gọi API chỉ nhận về phần lõi:
> `return response.data.data;`

---

## 2. Cấu trúc Lỗi (Error Response)

BE sử dụng một `GlobalExceptionFilter` để chuẩn hóa toàn bộ các lỗi. Sẽ có 2 định dạng lỗi chính tuỳ thuộc vào loại lỗi.

### Lỗi Logic / Nghiệp vụ (Ví dụ: Sai password, Không tìm thấy user...)

Thường trả về HTTP Status `400 Bad Request` hoặc `403 Forbidden`, `404 Not Found`.

```json
{
  "timestamp": "2024-03-03T00:00:00.000Z",
  "statusCode": 400,
  "error": "Bad Request",
  "errorCode": "U002", // Mã lỗi nội bộ để FE mapping đa ngôn ngữ (i18n)
  "message": "user.validation.is_invalid_password" // Khóa thông báo lỗi
}
```

### Lỗi Validation Đầu vào (Khi submit thiếu / sai format form)

Thường trả về `422 Unprocessable Entity` (hoặc `400` nếu trigger thủ công). Có thêm mảng `details` chứa cụ thể property nào lỗi.

```json
{
  "timestamp": "2024-03-03T00:00:00.000Z",
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "Validation failed", // Hoặc một errorCode
  "details": [
    {
      "property": "email",
      "code": "isEmail",
      "message": "email must be an email"
    },
    {
      "property": "password",
      "code": "isNotEmpty",
      "message": "password should not be empty"
    }
  ]
}
```

> 💡 **Tip cho FE:** Khi nhận mảng `details`, có thể map các lỗi này thẳng vào UI của form (hiện chữ đỏ dưới từng input tương ứng với `property`).

---

## 3. Bảng Mã Lỗi (Error Codes) phổ biến

FE nên dựa vào trường `errorCode` hoặc `message` (nếu trả về key như `user.validation...`) để hiển thị thông báo lỗi phù hợp cho người dùng.

| Error Code | Cấu hình Message Key (i18n) | Mô tả |
| :--- | :--- | :--- |
| **U002** | `user.validation.is_invalid_password` | Sai mật khẩu đăng nhập |
| **U003** | `user.validation.not_found` | Không tìm thấy user |
| **U005** | `user.validation.email_already_exists` | Email đăng ký đã tồn tại |
| **U007** | `user.validation.not_verified` | Email chưa được xác nhận (OTP) |
| **U008** | `user.validation.otp_invalid` | Mã OTP sai hoặc hết hạn |
| **U009** | `user.validation.already_verified` | Email đã verify rồi |
| **U010** | `user.validation.account_inactive` | Tài khoản bị khoá / vô hiệu hoá |

---

## 4. Gợi ý cấu hình Axios Interceptor

Dưới đây là một ví dụ mẫu (pseudocode/TypeScript) để giúp FE bắt lỗi chung, báo toast, hiển thị form error, và tự động gọi API Refresh Token khi bị lỗi 401.

```typescript
import axios from 'axios';

const apiCilent = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 10000,
});

// ✅ REQUEST INTERCEPTOR: Gắn Token
apiCilent.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ RESPONSE INTERCEPTOR: Xử lý Data & Error
apiCilent.interceptors.response.use(
  (response) => {
    // Trả về thẳng phần `.data` bên trong ApiResponseDto
    // (tức là `{ accessToken: "..." }` thay vì cả object bọc)
    return response.data.data; 
  },
  async (error) => {
    const originalRequest = error.config;
    const { response } = error;

    if (!response) {
      // Lỗi mạng hoặc server sập
      toast.error('Không thể kết nối tới máy chủ!');
      return Promise.reject(error);
    }

    const { statusCode, message, errorCode, details } = response.data;

    // 1️⃣. Xử lý Token hết hạn (401 Unauthorized)
    if (statusCode === 401 && !originalRequest._retry) {
      if (originalRequest.url.includes('/auth/refresh-token')) {
        // Refresh token cũng hết hạn -> Ép văng ra Log out
        clearAuthData();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        // Gọi thẳng axios gốc để không lọt tự động vào interceptor này
        const { data: refreshData } = await axios.post(`${apiCilent.defaults.baseURL}/auth/refresh-token`, { 
            refreshToken 
        });
        
        // Lưu token mới
        const newAccessToken = refreshData.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', refreshData.data.refreshToken);

        // Gắn token mới và call lại API gốc bị lỗi
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiCilent(originalRequest);
      } catch (refreshErr) {
        clearAuthData();
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }

    // 2️⃣. Xử lý lỗi Validation (422) từ Form
    if (statusCode === 422 && details) {
      // FE có thể quăng cái `details` này ra ngoài để map vào giao diện Form
      return Promise.reject({ type: 'VALIDATION_ERROR', errors: details });
    }

    // 3️⃣. Xử lý lỗi nghiệp vụ chung hiển thị Toast (vd: 400, 403, 404)
    // Dùng mã `errorCode` nếu FE có xài bộ translate của riêng mình,
    // hoặc xài `message` mặc định của BE
    const errorMessage = translateErrorCode(errorCode) || message || 'Đã có lỗi xảy ra';
    toast.error(errorMessage);

    return Promise.reject(error.response?.data || error);
  }
);

export default apiCilent;
```

### Các bước quan trọng trong chặn bắt (Interceptor Flow)

1. **Gắn Request:** Lấy Access Token ở LocalStorage/Cookie đính kèm `Bearer`.
2. **Success:** Bóc 1 lớp `data` để lấy lõi payload phục vụ Component gọn gàng.
3. **Lỗi 401 (Hết hạn Access Token):** 
   - Tạm giữ các Request đang gọi.
   - Bắn 1 request ẩn `POST /auth/refresh-token` với Refresh Token.
   - Nếu trả về thành công -> Update Access Token mới -> Recall lại Request ban đầu.
   - Nếu Refresh Token cũng hết hạn -> Logout văng trang Login.
4. **Lỗi 422 (Validation Form):** Filter và map các báo lỗi field text vào thẳng thư viện Form (react-hook-form, yup,...).
5. **Lỗi Chung:** Quăng thẳng qua Component hiển thị Toast đỏ cho User.
